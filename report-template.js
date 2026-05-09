export function generateReport(data) {
  const {
    title,
    description,
    severity,
    priority,
    stepsToReproduce,
    expectedResult,
    actualResult,
    pageUrl,
    pageTitle,
    screenshot,
    interactions,
    consoleLogs,
    networkLogs,
    browserInfo,
    timestamp,
    theme,
  } = data;

  const isDark = theme === 'dark';

  const reportTime = formatDateTime(timestamp);
  const escapedTitle = esc(title || 'Untitled Bug');
  const escapedDesc = esc(description || '');
  const hasFullFields = severity || priority || stepsToReproduce || expectedResult || actualResult;

  const severityColors = {
    critical: { bg: '#fef2f2', fg: '#dc2626', darkBg: 'rgba(239,68,68,0.15)', darkFg: '#f87171' },
    major:    { bg: '#fff7ed', fg: '#ea580c', darkBg: 'rgba(234,88,12,0.15)', darkFg: '#fb923c' },
    minor:    { bg: '#fffbeb', fg: '#d97706', darkBg: 'rgba(217,119,6,0.15)', darkFg: '#fbbf24' },
    trivial:  { bg: '#f0fdf4', fg: '#16a34a', darkBg: 'rgba(22,163,74,0.15)', darkFg: '#4ade80' },
  };

  const priorityColors = {
    P0: { bg: '#fef2f2', fg: '#dc2626', darkBg: 'rgba(239,68,68,0.15)', darkFg: '#f87171' },
    P1: { bg: '#fff7ed', fg: '#ea580c', darkBg: 'rgba(234,88,12,0.15)', darkFg: '#fb923c' },
    P2: { bg: '#fffbeb', fg: '#d97706', darkBg: 'rgba(217,119,6,0.15)', darkFg: '#fbbf24' },
    P3: { bg: '#f0fdf4', fg: '#16a34a', darkBg: 'rgba(22,163,74,0.15)', darkFg: '#4ade80' },
  };

  function severityBadge() {
    if (!severity) return '';
    const c = severityColors[severity] || { bg: '#f5f6f8', fg: '#5f6877', darkBg: '#2e3038', darkFg: '#8b8f98' };
    return `<span class="inline-badge severity-${esc(severity)}" style="background:${c.bg};color:${c.fg}">${esc(severity.charAt(0).toUpperCase() + severity.slice(1))}</span>`;
  }

  function priorityBadge() {
    if (!priority) return '';
    const c = priorityColors[priority] || { bg: '#f5f6f8', fg: '#5f6877', darkBg: '#2e3038', darkFg: '#8b8f98' };
    return `<span class="inline-badge priority-${esc(priority)}" style="background:${c.bg};color:${c.fg}">${esc(priority)}</span>`;
  }

  return `<!DOCTYPE html>
<html lang="en"${isDark ? ' class="dark"' : ''}>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Bug Report — ${escapedTitle}</title>
<style>
${CSS}
</style>
</head>
<body>
<div class="report">

  <header class="report-header">
    <div class="brand">Bug Report</div>
    <h1>${escapedTitle}</h1>
    ${hasFullFields ? `<div class="badges-row">${severityBadge()}${priorityBadge()}</div>` : ''}
    <div class="meta-grid">
      <div class="meta-item">
        <span class="meta-label">URL</span>
        <a href="${esc(pageUrl)}" class="meta-value url">${esc(pageUrl)}</a>
      </div>
      <div class="meta-item">
        <span class="meta-label">Page Title</span>
        <span class="meta-value">${esc(pageTitle)}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Reported</span>
        <span class="meta-value">${reportTime}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Browser</span>
        <span class="meta-value">${esc(parseBrowser(browserInfo.userAgent))}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">OS / Arch</span>
        <span class="meta-value">${esc(browserInfo.os)} / ${esc(browserInfo.arch)}</span>
      </div>
    </div>
  </header>

  ${escapedDesc ? `
  <section class="section">
    <h2 class="section-title" onclick="this.parentElement.classList.toggle('collapsed')">
      <span class="chevron">▾</span> Description
    </h2>
    <div class="section-body">
      <p class="description">${escapedDesc.replace(/\n/g, '<br>')}</p>
    </div>
  </section>` : ''}

  ${stepsToReproduce ? `
  <section class="section">
    <h2 class="section-title" onclick="this.parentElement.classList.toggle('collapsed')">
      <span class="chevron">▾</span> Steps to Reproduce
    </h2>
    <div class="section-body">
      <p class="description">${esc(stepsToReproduce).replace(/\n/g, '<br>')}</p>
    </div>
  </section>` : ''}

  ${expectedResult || actualResult ? `
  <section class="section">
    <h2 class="section-title" onclick="this.parentElement.classList.toggle('collapsed')">
      <span class="chevron">▾</span> Expected vs Actual
    </h2>
    <div class="section-body">
      <div class="expected-actual-grid">
        ${expectedResult ? `<div class="ea-col ea-expected">
          <div class="ea-label">Expected</div>
          <p class="description">${esc(expectedResult).replace(/\n/g, '<br>')}</p>
        </div>` : ''}
        ${actualResult ? `<div class="ea-col ea-actual">
          <div class="ea-label">Actual</div>
          <p class="description">${esc(actualResult).replace(/\n/g, '<br>')}</p>
        </div>` : ''}
      </div>
    </div>
  </section>` : ''}

  ${screenshot ? `
  <section class="section">
    <h2 class="section-title" onclick="this.parentElement.classList.toggle('collapsed')">
      <span class="chevron">▾</span> Screenshot
    </h2>
    <div class="section-body">
      <img src="${screenshot}" alt="Page screenshot" class="screenshot">
    </div>
  </section>` : ''}

  <section class="section">
    <h2 class="section-title" onclick="this.parentElement.classList.toggle('collapsed')">
      <span class="chevron">▾</span> User Actions <span class="badge">${interactions.length}</span>
    </h2>
    <div class="section-body">
      ${interactions.length === 0
        ? '<p class="empty">No interactions recorded.</p>'
        : `<ol class="interactions">${interactions.map((a, i) => `
        <li class="interaction interaction-${a.type}">
          <span class="interaction-num">${i + 1}</span>
          <span class="interaction-time">${formatTime(a.timestamp)}</span>
          <span class="interaction-type tag-${a.type}">${a.type}</span>
          ${a.type === 'navigate'
            ? `<span class="interaction-detail">→ <code>${esc(a.url)}</code></span>`
            : `<span class="interaction-detail">
                <code>${esc(a.selector)}</code>
                ${a.text ? `<span class="interaction-text">"${esc(a.text)}"</span>` : ''}
                ${a.value !== undefined ? `<span class="interaction-value">= ${esc(a.value)}</span>` : ''}
              </span>`
          }
        </li>`).join('')}
      </ol>`
      }
    </div>
  </section>

  <section class="section" id="console-section">
    <h2 class="section-title" onclick="this.parentElement.classList.toggle('collapsed')">
      <span class="chevron">▾</span> Console Logs <span class="badge">${consoleLogs.length}</span>
    </h2>
    ${consoleLogs.length === 0
      ? '<div class="section-body"><p class="empty">No console logs captured.</p></div>'
      : `<div class="console-filters">
        <button class="filter-pill filter-active" data-level="all" onclick="filterConsole('all', this)">All <span class="filter-count">${consoleLogs.length}</span></button>
        <button class="filter-pill filter-error" data-level="error" onclick="filterConsole('error', this)">Error <span class="filter-count">${consoleLogs.filter(l => l.level === 'error').length}</span></button>
        <button class="filter-pill filter-warn" data-level="warn" onclick="filterConsole('warn', this)">Warning <span class="filter-count">${consoleLogs.filter(l => l.level === 'warn').length}</span></button>
        <button class="filter-pill filter-info" data-level="info" onclick="filterConsole('info', this)">Info <span class="filter-count">${consoleLogs.filter(l => l.level === 'info').length}</span></button>
      </div>
      <div class="section-body">
        <div class="console-logs">${consoleLogs.map((log) => `
        <div class="console-entry level-${log.level}" data-level="${log.level}">
          <span class="console-time">${formatTime(log.timestamp)}</span>
          <span class="console-level">${log.level.toUpperCase()}</span>
          <pre class="console-message">${esc(log.message)}</pre>
        </div>`).join('')}
        </div>
      </div>`
    }
  </section>

  <section class="section">
    <h2 class="section-title" onclick="this.parentElement.classList.toggle('collapsed')">
      <span class="chevron">▾</span> Network Requests <span class="badge">${networkLogs.length}</span>
    </h2>
    <div class="section-body">
      ${networkLogs.length === 0
        ? '<p class="empty">No XHR/fetch requests captured.</p>'
        : `<div class="network-list">${networkLogs.map((req) => {
            const statusClass = req.status === 0 ? 'status-error'
              : req.status >= 400 ? 'status-error'
              : req.status >= 300 ? 'status-warn'
              : 'status-ok';
            const hasPayload = req.requestBody || req.responseBody;
            return `<div class="network-entry ${statusClass}">
            <div class="network-summary" ${hasPayload ? `onclick="this.parentElement.classList.toggle('expanded')"` : ''}>
              <span class="network-time">${formatTime(req.timestamp)}</span>
              <span class="method">${esc(req.method)}</span>
              <span class="network-url" title="${esc(req.url)}">${esc(truncateUrl(req.url))}</span>
              <span class="status-badge ${statusClass}">${req.status === 0 ? 'ERR' : req.status}</span>
              <span class="network-duration">${req.duration != null ? req.duration + 'ms' : '—'}</span>
              ${hasPayload ? '<span class="expand-icon">▸</span>' : ''}
            </div>
            ${hasPayload ? `<div class="network-bodies">
              ${req.requestBody ? `<div class="network-body-section">
                <div class="network-body-label">Request Payload</div>
                <pre class="network-body-content">${esc(req.requestBody)}</pre>
              </div>` : ''}
              ${req.responseBody ? `<div class="network-body-section">
                <div class="network-body-label">Response Body</div>
                <pre class="network-body-content">${esc(req.responseBody)}</pre>
              </div>` : ''}
            </div>` : ''}
          </div>`;
          }).join('')}
        </div>`
      }
    </div>
  </section>

</div>

<script>
document.querySelectorAll('.section-title').forEach(el => {
  el.style.cursor = 'pointer';
});
function filterConsole(level, btn) {
  const entries = document.querySelectorAll('#console-section .console-entry');
  entries.forEach(el => {
    el.style.display = (level === 'all' || el.dataset.level === level) ? '' : 'none';
  });
  document.querySelectorAll('#console-section .filter-pill').forEach(p => p.classList.remove('filter-active'));
  btn.classList.add('filter-active');
}
</script>
</body>
</html>`;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDateTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    });
  } catch { return iso; }
}

function formatTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    });
  } catch { return iso; }
}

function truncateUrl(url) {
  if (!url) return '';
  try {
    const u = new URL(url);
    const path = u.pathname + u.search;
    return path.length > 80 ? path.slice(0, 77) + '…' : path;
  } catch { return url.length > 80 ? url.slice(0, 77) + '…' : url; }
}

function parseBrowser(ua) {
  if (!ua) return 'Unknown';
  if (ua.includes('Edg/')) return 'Edge ' + (ua.match(/Edg\/([\d.]+)/)?.[1] || '');
  if (ua.includes('Chrome/')) return 'Chrome ' + (ua.match(/Chrome\/([\d.]+)/)?.[1] || '');
  if (ua.includes('Firefox/')) return 'Firefox ' + (ua.match(/Firefox\/([\d.]+)/)?.[1] || '');
  if (ua.includes('Safari/') && !ua.includes('Chrome')) return 'Safari ' + (ua.match(/Version\/([\d.]+)/)?.[1] || '');
  return ua;
}

// ── CSS ──────────────────────────────────────────────────────────────────

const CSS = `
:root {
  --bg: #f5f6f8;
  --surface: #ffffff;
  --surface-raised: #f8f9fb;
  --border: #e2e5ea;
  --text: #1a1d23;
  --text-secondary: #5f6877;
  --accent: #3b82f6;
  --error: #ef4444;
  --error-bg: #fef2f2;
  --warn: #f59e0b;
  --warn-bg: #fffbeb;
  --ok: #22c55e;
  --ok-bg: #f0fdf4;
  --radius: 8px;
  --font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  --mono: 'SF Mono', SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
}

html.dark {
  --bg: #111318;
  --surface: #1c1e24;
  --surface-raised: #25272e;
  --border: #2e3038;
  --text: #e4e6eb;
  --text-secondary: #8b8f98;
  --accent: #5b9cf6;
  --error: #f87171;
  --error-bg: rgba(239, 68, 68, 0.12);
  --warn: #fbbf24;
  --warn-bg: rgba(251, 191, 36, 0.12);
  --ok: #4ade80;
  --ok-bg: rgba(74, 222, 128, 0.12);
}
html.dark .tag-click { background: rgba(59, 130, 246, 0.2); color: #93bbfd; }
html.dark .tag-input { background: rgba(139, 92, 246, 0.2); color: #c4b5fd; }
html.dark .tag-submit { background: rgba(34, 197, 94, 0.2); color: #86efac; }
html.dark .tag-navigate { background: rgba(245, 158, 11, 0.2); color: #fcd34d; }
html.dark .inline-badge { filter: none; }
html.dark .severity-critical { background: rgba(239,68,68,0.15) !important; color: #f87171 !important; }
html.dark .severity-major { background: rgba(234,88,12,0.15) !important; color: #fb923c !important; }
html.dark .severity-minor { background: rgba(217,119,6,0.15) !important; color: #fbbf24 !important; }
html.dark .severity-trivial { background: rgba(22,163,74,0.15) !important; color: #4ade80 !important; }
html.dark .priority-P0 { background: rgba(239,68,68,0.15) !important; color: #f87171 !important; }
html.dark .priority-P1 { background: rgba(234,88,12,0.15) !important; color: #fb923c !important; }
html.dark .priority-P2 { background: rgba(217,119,6,0.15) !important; color: #fbbf24 !important; }
html.dark .priority-P3 { background: rgba(22,163,74,0.15) !important; color: #4ade80 !important; }
html.dark .ea-expected { border-color: rgba(74,222,128,0.25); background: rgba(74,222,128,0.05); }
html.dark .ea-actual { border-color: rgba(239,68,68,0.25); background: rgba(239,68,68,0.05); }

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: var(--font);
  background: var(--bg);
  color: var(--text);
  line-height: 1.5;
  padding: 24px;
}

.report {
  max-width: 960px;
  margin: 0 auto;
}

/* Header */
.report-header {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 28px 32px;
  margin-bottom: 16px;
}
.brand {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: var(--accent);
  margin-bottom: 8px;
}
.report-header h1 {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 12px;
  color: var(--text);
}
.badges-row {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.inline-badge {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 14px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.2px;
}
.meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}
.meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.meta-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
}
.meta-value {
  font-size: 13px;
  color: var(--text);
  word-break: break-all;
}
a.meta-value.url {
  color: var(--accent);
  text-decoration: none;
}
a.meta-value.url:hover {
  text-decoration: underline;
}

/* Sections */
.section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  margin-bottom: 12px;
  overflow: hidden;
}
.section-title {
  font-size: 14px;
  font-weight: 600;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  user-select: none;
  border-bottom: 1px solid transparent;
}
.section:not(.collapsed) .section-title {
  border-bottom-color: var(--border);
}
.chevron {
  font-size: 12px;
  transition: transform 0.15s;
}
.section.collapsed .chevron {
  transform: rotate(-90deg);
}
.section.collapsed .section-body {
  display: none;
}
.section-body {
  padding: 16px 20px;
}
.badge {
  background: var(--bg);
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  margin-left: auto;
}

/* Description */
.description {
  font-size: 14px;
  color: var(--text);
  white-space: pre-wrap;
}

/* Expected vs Actual */
.expected-actual-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.ea-col {
  padding: 14px 16px;
  border-radius: 6px;
  border: 1px solid var(--border);
}
.ea-expected {
  border-color: rgba(34, 197, 94, 0.3);
  background: rgba(34, 197, 94, 0.04);
}
.ea-actual {
  border-color: rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.04);
}
.ea-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

/* Screenshot */
.screenshot {
  width: 100%;
  border-radius: 4px;
  border: 1px solid var(--border);
}

/* Interactions */
.interactions {
  list-style: none;
  counter-reset: none;
}
.interaction {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid var(--bg);
  font-size: 13px;
}
.interaction:last-child { border-bottom: none; }
.interaction-num {
  min-width: 22px;
  height: 22px;
  background: var(--bg);
  color: var(--text-secondary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}
.interaction-time {
  color: var(--text-secondary);
  font-family: var(--mono);
  font-size: 11px;
  min-width: 65px;
  padding-top: 2px;
  flex-shrink: 0;
}
.interaction-type {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 2px 8px;
  border-radius: 4px;
  flex-shrink: 0;
}
.tag-click { background: #dbeafe; color: #1d4ed8; }
.tag-input { background: #f3e8ff; color: #7c3aed; }
.tag-submit { background: #dcfce7; color: #15803d; }
.tag-navigate { background: #fef3c7; color: #b45309; }
.interaction-detail {
  flex: 1;
  min-width: 0;
}
.interaction-detail code {
  font-family: var(--mono);
  font-size: 12px;
  background: var(--bg);
  padding: 1px 5px;
  border-radius: 3px;
  word-break: break-all;
}
.interaction-text {
  color: var(--text-secondary);
  font-style: italic;
  margin-left: 6px;
}
.interaction-value {
  color: var(--accent);
  font-family: var(--mono);
  font-size: 12px;
  margin-left: 6px;
}

/* Console Filters */
.console-filters {
  display: flex;
  gap: 6px;
  padding: 10px 20px;
  border-bottom: 1px solid var(--border);
}
.filter-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--surface);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}
.filter-pill:hover {
  border-color: var(--accent);
  color: var(--text);
}
.filter-pill.filter-active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}
.filter-pill.filter-active .filter-count {
  background: rgba(255,255,255,0.25);
  color: #fff;
}
.filter-count {
  font-size: 10px;
  font-weight: 700;
  background: var(--bg);
  color: var(--text-secondary);
  padding: 1px 6px;
  border-radius: 8px;
}
.filter-pill.filter-error:not(.filter-active):hover { border-color: var(--error); color: var(--error); }
.filter-pill.filter-warn:not(.filter-active):hover { border-color: var(--warn); color: var(--warn); }
.filter-pill.filter-info:not(.filter-active):hover { border-color: var(--accent); color: var(--accent); }

/* Console Logs */
.console-logs {
  font-family: var(--mono);
  font-size: 12px;
}
.console-entry {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 4px;
  margin-bottom: 4px;
}
.level-error { background: var(--error-bg); }
.level-warn { background: var(--warn-bg); }
.level-info, .level-log { background: var(--bg); }
.console-time {
  color: var(--text-secondary);
  font-size: 11px;
  min-width: 65px;
  flex-shrink: 0;
  padding-top: 1px;
}
.console-level {
  font-size: 10px;
  font-weight: 700;
  min-width: 44px;
  flex-shrink: 0;
  padding-top: 1px;
}
.level-error .console-level { color: var(--error); }
.level-warn .console-level { color: var(--warn); }
.level-info .console-level, .level-log .console-level { color: var(--text-secondary); }
.console-message {
  flex: 1;
  min-width: 0;
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 12px;
  line-height: 1.5;
}

/* Network Entries */
.network-list {
  font-size: 13px;
}
.network-entry {
  border-bottom: 1px solid var(--bg);
}
.network-entry:last-child { border-bottom: none; }
.network-entry.status-error { background: var(--error-bg); }
.network-entry.status-warn { background: var(--warn-bg); }
.network-summary {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  cursor: default;
}
.network-entry .network-summary[onclick] {
  cursor: pointer;
}
.network-entry .network-summary[onclick]:hover {
  background: rgba(0,0,0,0.03);
}
.network-time {
  color: var(--text-secondary);
  font-family: var(--mono);
  font-size: 11px;
  min-width: 65px;
  flex-shrink: 0;
}
.method {
  font-family: var(--mono);
  font-weight: 600;
  font-size: 11px;
  min-width: 36px;
  flex-shrink: 0;
}
.network-url {
  font-family: var(--mono);
  font-size: 12px;
  word-break: break-all;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.network-duration {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--text-secondary);
  min-width: 50px;
  text-align: right;
  flex-shrink: 0;
}
.expand-icon {
  font-size: 10px;
  color: var(--text-secondary);
  transition: transform 0.15s;
  flex-shrink: 0;
}
.network-entry.expanded .expand-icon {
  transform: rotate(90deg);
}
.status-badge {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  font-family: var(--mono);
  flex-shrink: 0;
}
.status-badge.status-ok { background: var(--ok-bg); color: #15803d; }
.status-badge.status-warn { background: var(--warn-bg); color: #b45309; }
.status-badge.status-error { background: var(--error-bg); color: var(--error); }

html.dark .status-badge.status-ok { color: var(--ok); }
html.dark .status-badge.status-warn { color: var(--warn); }
html.dark .status-badge.status-error { color: var(--error); }
html.dark .network-entry .network-summary[onclick]:hover {
  background: rgba(255,255,255,0.03);
}

/* Network Bodies (expandable) */
.network-bodies {
  display: none;
  padding: 0 10px 12px 10px;
}
.network-entry.expanded .network-bodies {
  display: block;
}
.network-body-section {
  margin-top: 8px;
}
.network-body-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}
.network-body-content {
  font-family: var(--mono);
  font-size: 11px;
  line-height: 1.5;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 10px 12px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
  overflow-y: auto;
}

.empty {
  color: var(--text-secondary);
  font-size: 13px;
  font-style: italic;
  padding: 8px 0;
}

@media print {
  body { padding: 0; background: white; }
  .section.collapsed .section-body { display: block; }
  .section { break-inside: avoid; }
}
`;
