(() => {
  const DEFAULTS = { maxInteractions: 30, maxConsoleLogs: 20, maxNetworkLogs: 10 };
  let MAX_INTERACTIONS = DEFAULTS.maxInteractions;
  let MAX_CONSOLE_LOGS = DEFAULTS.maxConsoleLogs;
  let MAX_NETWORK_LOGS = DEFAULTS.maxNetworkLogs;
  const SEVERITY_RANK = { error: 3, warn: 2, info: 0 };

  function applySettings(s) {
    if (s.maxInteractions != null) MAX_INTERACTIONS = s.maxInteractions;
    if (s.maxConsoleLogs != null) MAX_CONSOLE_LOGS = s.maxConsoleLogs;
    if (s.maxNetworkLogs != null) MAX_NETWORK_LOGS = s.maxNetworkLogs;
  }

  chrome.storage.local.get('settings', (res) => {
    if (res.settings) applySettings(res.settings);
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.settings?.newValue) applySettings(changes.settings.newValue);
  });

  const interactions = [];
  const consoleLogs = [];
  const networkLogs = [];

  // ── Interaction Tracking ──────────────────────────────────────────────

  function getSelector(el) {
    try {
      if (!el || el === document || el === document.body) return 'body';
      if (el.id) return `#${el.id}`;
      let selector = el.tagName.toLowerCase();
      if (el.className && typeof el.className === 'string') {
        const classes = el.className.trim().split(/\s+/).slice(0, 2).join('.');
        if (classes) selector += `.${classes}`;
      }
      if (el.name) selector += `[name="${el.name}"]`;
      if (el.type && el.tagName.toLowerCase() === 'input') {
        selector += `[type="${el.type}"]`;
      }
      return selector;
    } catch (_) { return 'unknown'; }
  }

  function getVisibleText(el) {
    try {
      const text = (
        el.textContent ||
        el.innerText ||
        el.getAttribute('aria-label') ||
        el.getAttribute('placeholder') ||
        el.getAttribute('alt') ||
        el.getAttribute('title') ||
        ''
      ).trim();
      return text.length > 80 ? text.slice(0, 80) + '…' : text;
    } catch (_) { return ''; }
  }

  function pushInteraction(entry) {
    interactions.push(entry);
    if (interactions.length > MAX_INTERACTIONS) interactions.shift();
  }

  document.addEventListener('click', (e) => {
    try {
      const target = e.target.closest('a, button, input, select, textarea, [role="button"]') || e.target;
      pushInteraction({
        timestamp: new Date().toISOString(),
        type: 'click',
        selector: getSelector(target),
        tagName: (target.tagName || 'unknown').toLowerCase(),
        text: getVisibleText(target),
        url: location.href,
      });
    } catch (_) {}
  }, true);

  document.addEventListener('change', (e) => {
    try {
      const target = e.target;
      if (!target.tagName || !['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return;

      const isPassword = target.type === 'password';
      let value = isPassword ? '[REDACTED]' : (target.value || '');
      if (value.length > 120) value = value.slice(0, 120) + '…';

      if (target.type === 'checkbox' || target.type === 'radio') {
        value = target.checked ? 'checked' : 'unchecked';
      }

      pushInteraction({
        timestamp: new Date().toISOString(),
        type: 'input',
        selector: getSelector(target),
        tagName: target.tagName.toLowerCase(),
        text: getVisibleText(target),
        value,
        url: location.href,
      });
    } catch (_) {}
  }, true);

  document.addEventListener('submit', (e) => {
    try {
      const form = e.target;
      pushInteraction({
        timestamp: new Date().toISOString(),
        type: 'submit',
        selector: getSelector(form),
        tagName: 'form',
        text: form.getAttribute('action') || '',
        url: location.href,
      });
    } catch (_) {}
  }, true);

  // ── Console Log Buffer ──────────────────────────────────────────────

  function pushConsolelog(entry) {
    if (consoleLogs.length >= MAX_CONSOLE_LOGS) {
      const incomingRank = SEVERITY_RANK[entry.level] ?? 0;
      let lowestIdx = -1;
      let lowestRank = Infinity;
      for (let i = 0; i < consoleLogs.length; i++) {
        const rank = SEVERITY_RANK[consoleLogs[i].level] ?? 0;
        if (rank < lowestRank) {
          lowestRank = rank;
          lowestIdx = i;
        }
      }
      if (incomingRank >= lowestRank) {
        consoleLogs.splice(lowestIdx, 1);
      } else {
        return;
      }
    }
    consoleLogs.push(entry);
  }

  // Also capture errors directly in isolated world as fallback
  window.addEventListener('error', (e) => {
    try {
      pushConsolelog({
        timestamp: new Date().toISOString(),
        level: 'error',
        message: `Uncaught ${e.message} at ${e.filename}:${e.lineno}:${e.colno}`,
        url: location.href,
      });
    } catch (_) {}
  });

  window.addEventListener('unhandledrejection', (e) => {
    try {
      pushConsolelog({
        timestamp: new Date().toISOString(),
        level: 'error',
        message: `Unhandled Promise Rejection: ${String(e.reason)}`,
        url: location.href,
      });
    } catch (_) {}
  });

  // ── Cross-world Message Receiver (from MAIN world via postMessage) ──

  const MSG_SOURCE = '__qa_bug_reporter__';

  window.addEventListener('message', (e) => {
    try {
      if (e.source !== window || !e.data || e.data.source !== MSG_SOURCE) return;

      const { channel, payload } = e.data;

      if (channel === 'console' && payload) {
        pushConsolelog(payload);
      } else if (channel === 'network' && payload) {
        networkLogs.push(payload);
        if (networkLogs.length > MAX_NETWORK_LOGS) networkLogs.shift();
      } else if (channel === 'navigation' && payload) {
        pushInteraction({
          timestamp: payload.timestamp,
          type: 'navigate',
          selector: '',
          tagName: '',
          text: '',
          url: payload.url,
          fromUrl: payload.fromUrl,
        });
      }
    } catch (_) {}
  });

  // ── Message Handler (from background / popup) ─────────────────────────

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === 'GET_CONTENT_DATA') {
      sendResponse({
        interactions: [...interactions],
        consoleLogs: [...consoleLogs],
        networkLogs: [...networkLogs],
      });
      return true;
    }
    if (msg.type === 'GET_STATUS') {
      sendResponse({
        interactionCount: interactions.length,
        consoleLogCount: consoleLogs.length,
        networkLogCount: networkLogs.length,
      });
      return true;
    }
    return false;
  });
})();
