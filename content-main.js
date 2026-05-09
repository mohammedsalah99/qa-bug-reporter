(() => {
  const MSG_SOURCE = '__qa_bug_reporter__';

  function serializeArg(arg) {
    if (arg === undefined) return 'undefined';
    if (arg === null) return 'null';
    if (arg instanceof Error) return `${arg.name}: ${arg.message}\n${arg.stack || ''}`;
    if (typeof arg === 'object') {
      try { return JSON.stringify(arg, null, 2); }
      catch { return String(arg); }
    }
    return String(arg);
  }

  function pushEntry(entry) {
    try {
      window.postMessage({
        source: MSG_SOURCE,
        channel: 'console',
        payload: entry,
      }, '*');
    } catch (_) {}
  }

  ['log', 'warn', 'error', 'info'].forEach((rawLevel) => {
    const reportLevel = rawLevel === 'log' ? 'info' : rawLevel;
    const original = console[rawLevel].bind(console);
    console[rawLevel] = new Proxy(original, {
      apply(target, thisArg, args) {
        try {
          pushEntry({
            timestamp: new Date().toISOString(),
            level: reportLevel,
            message: args.map(serializeArg).join(' '),
            url: location.href,
          });
        } catch (_) {}
        return Reflect.apply(target, thisArg, args);
      },
    });
  });

  window.addEventListener('error', (e) => {
    pushEntry({
      timestamp: new Date().toISOString(),
      level: 'error',
      message: `Uncaught ${e.message} at ${e.filename}:${e.lineno}:${e.colno}`,
      url: location.href,
    });
  });

  window.addEventListener('unhandledrejection', (e) => {
    pushEntry({
      timestamp: new Date().toISOString(),
      level: 'error',
      message: `Unhandled Promise Rejection: ${serializeArg(e.reason)}`,
      url: location.href,
    });
  });

  // ── SPA Navigation Detection (must be in MAIN world to intercept page calls) ──

  let lastUrl = location.href;

  function onNavigate() {
    try {
      if (location.href !== lastUrl) {
        window.postMessage({
          source: MSG_SOURCE,
          channel: 'navigation',
          payload: {
            timestamp: new Date().toISOString(),
            type: 'navigate',
            url: location.href,
            fromUrl: lastUrl,
          },
        }, '*');
        lastUrl = location.href;
      }
    } catch (_) {}
  }

  const origPushState = history.pushState;
  const origReplaceState = history.replaceState;
  history.pushState = function (...args) {
    origPushState.apply(this, args);
    onNavigate();
  };
  history.replaceState = function (...args) {
    origReplaceState.apply(this, args);
    onNavigate();
  };
  window.addEventListener('popstate', onNavigate);
  window.addEventListener('hashchange', onNavigate);

  // ── Network Interception (fetch + XHR) ──────────────────────────────

  const MAX_BODY_SIZE = 5120;

  function truncateBody(body) {
    if (body == null) return null;
    const str = typeof body === 'string' ? body : String(body);
    if (str.length <= MAX_BODY_SIZE) return str;
    return str.slice(0, MAX_BODY_SIZE) + `\n… [truncated, ${str.length} chars total]`;
  }

  function pushNetworkEntry(entry) {
    try {
      window.postMessage({
        source: MSG_SOURCE,
        channel: 'network',
        payload: entry,
      }, '*');
    } catch (_) {}
  }

  function extractBody(input) {
    if (input == null) return null;
    if (typeof input === 'string') return truncateBody(input);
    if (input instanceof URLSearchParams) return truncateBody(input.toString());
    if (input instanceof FormData) {
      const parts = [];
      input.forEach((v, k) => parts.push(`${k}=${v}`));
      return truncateBody(parts.join('&'));
    }
    if (typeof input === 'object') {
      try { return truncateBody(JSON.stringify(input)); }
      catch { return null; }
    }
    return null;
  }

  // ── Fetch Interceptor ──

  const originalFetch = window.fetch;
  window.fetch = new Proxy(originalFetch, {
    apply(target, thisArg, args) {
      const startTime = Date.now();
      const [resource, init] = args;
      const url = typeof resource === 'string' ? resource
        : resource instanceof Request ? resource.url
        : String(resource);
      const method = (init?.method || (resource instanceof Request ? resource.method : 'GET')).toUpperCase();

      let requestBody = null;
      if (init?.body) {
        requestBody = extractBody(init.body);
      } else if (resource instanceof Request && !['GET', 'HEAD'].includes(method)) {
        try { requestBody = '[Request body — cannot clone]'; } catch (_) {}
      }

      const resultPromise = Reflect.apply(target, thisArg, args);

      resultPromise.then(async (response) => {
        try {
          const duration = Date.now() - startTime;
          let responseBody = null;
          try {
            const cloned = response.clone();
            const text = await cloned.text();
            responseBody = truncateBody(text);
          } catch (_) {}

          pushNetworkEntry({
            timestamp: new Date().toISOString(),
            url,
            method,
            status: response.status,
            duration,
            requestBody,
            responseBody,
          });
        } catch (_) {}
      }).catch((err) => {
        try {
          pushNetworkEntry({
            timestamp: new Date().toISOString(),
            url,
            method,
            status: 0,
            statusText: err?.message || 'Network Error',
            duration: Date.now() - startTime,
            requestBody,
            responseBody: null,
          });
        } catch (_) {}
      });

      return resultPromise;
    },
  });

  // ── XMLHttpRequest Interceptor ──

  const xhrOpen = XMLHttpRequest.prototype.open;
  const xhrSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this.__qa_method = (method || 'GET').toUpperCase();
    this.__qa_url = url;
    return xhrOpen.call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.send = function (body) {
    const startTime = Date.now();
    const requestBody = extractBody(body);
    const method = this.__qa_method || 'GET';
    const url = this.__qa_url || '';

    this.addEventListener('loadend', () => {
      try {
        pushNetworkEntry({
          timestamp: new Date().toISOString(),
          url,
          method,
          status: this.status,
          duration: Date.now() - startTime,
          requestBody,
          responseBody: truncateBody(this.responseText),
        });
      } catch (_) {}
    });

    return xhrSend.call(this, body);
  };
})();
