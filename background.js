import { generateReport } from './report-template.js';

const DEFAULTS = { maxInteractions: 30, maxConsoleLogs: 20, maxNetworkLogs: 10 };
let MAX_NETWORK_ENTRIES = DEFAULTS.maxNetworkLogs;

chrome.storage.local.get('settings', (res) => {
  if (res.settings?.maxNetworkLogs != null) MAX_NETWORK_ENTRIES = res.settings.maxNetworkLogs;
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.settings?.newValue?.maxNetworkLogs != null) {
    MAX_NETWORK_ENTRIES = changes.settings.newValue.maxNetworkLogs;
  }
});

// Per-tab network log buffers: { [tabId]: [] }
const networkLogs = {};
// Pending requests for duration tracking: { [requestId]: { startTime } }
const pendingRequests = {};

// ── Network Request Logging ───────────────────────────────────────────

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.type !== 'xmlhttprequest') return;
    pendingRequests[details.requestId] = {
      tabId: details.tabId,
      url: details.url,
      method: details.method,
      startTime: details.timeStamp,
    };
  },
  { urls: ['<all_urls>'] }
);

chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (details.type !== 'xmlhttprequest') return;
    const pending = pendingRequests[details.requestId];
    delete pendingRequests[details.requestId];

    const tabId = details.tabId;
    if (tabId < 0) return;

    if (!networkLogs[tabId]) networkLogs[tabId] = [];
    const buf = networkLogs[tabId];

    buf.push({
      timestamp: new Date(details.timeStamp).toISOString(),
      url: details.url,
      method: details.method,
      status: details.statusCode,
      duration: pending ? Math.round(details.timeStamp - pending.startTime) : null,
    });

    if (buf.length > MAX_NETWORK_ENTRIES) buf.shift();
  },
  { urls: ['<all_urls>'] }
);

chrome.webRequest.onErrorOccurred.addListener(
  (details) => {
    if (details.type !== 'xmlhttprequest') return;
    const pending = pendingRequests[details.requestId];
    delete pendingRequests[details.requestId];

    const tabId = details.tabId;
    if (tabId < 0) return;

    if (!networkLogs[tabId]) networkLogs[tabId] = [];
    const buf = networkLogs[tabId];

    buf.push({
      timestamp: new Date(details.timeStamp).toISOString(),
      url: details.url,
      method: details.method,
      status: 0,
      statusText: details.error,
      duration: pending ? Math.round(details.timeStamp - pending.startTime) : null,
    });

    if (buf.length > MAX_NETWORK_ENTRIES) buf.shift();
  },
  { urls: ['<all_urls>'] }
);

// Clean up when tabs close
chrome.tabs.onRemoved.addListener((tabId) => {
  delete networkLogs[tabId];
});

// ── Message Handler ─────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GET_NETWORK_STATUS') {
    const tabId = msg.tabId;
    sendResponse({ networkCount: (networkLogs[tabId] || []).length });
    return false;
  }

  if (msg.type === 'GENERATE_REPORT') {
    handleReport(msg)
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  return false;
});

async function handleReport({ tabId, title, description, severity, priority, stepsToReproduce, expectedResult, actualResult, theme }) {
  // 1. Capture screenshot
  let screenshot = null;
  try {
    screenshot = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
  } catch (_) { /* tab may not be capturable (e.g. chrome:// pages) */ }

  // 2. Get tab info
  const tab = await chrome.tabs.get(tabId);
  const pageUrl = tab.url || '';
  const pageTitle = tab.title || '';

  // 3. Get content script data (interactions + console logs + network logs with bodies)
  let contentData = { interactions: [], consoleLogs: [], networkLogs: [] };
  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: 'GET_CONTENT_DATA' });
    if (response) contentData = response;
  } catch (_) { /* content script may not be injected on this page */ }

  // 4. Use content script network data (has bodies); fall back to webRequest data (metadata only)
  const tabNetworkLogs = (contentData.networkLogs && contentData.networkLogs.length > 0)
    ? contentData.networkLogs
    : (networkLogs[tabId] || []);

  // 5. Browser info
  const browserInfo = (await chrome.runtime.getPlatformInfo()) || {};

  // 6. Generate HTML report
  const reportData = {
    title,
    description,
    severity: severity || '',
    priority: priority || '',
    stepsToReproduce: stepsToReproduce || '',
    expectedResult: expectedResult || '',
    actualResult: actualResult || '',
    pageUrl,
    pageTitle,
    screenshot,
    interactions: contentData.interactions,
    consoleLogs: contentData.consoleLogs,
    networkLogs: tabNetworkLogs,
    browserInfo: {
      os: browserInfo.os || 'unknown',
      arch: browserInfo.arch || 'unknown',
      userAgent: navigator.userAgent,
    },
    timestamp: new Date().toISOString(),
    theme: theme || 'light',
  };

  const html = generateReport(reportData);

  // 7. Download
  const blob = new Blob([html], { type: 'text/html' });
  const dataUrl = await blobToDataUrl(blob);

  const now = new Date();
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
  const filename = `bug-${slug}-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.html`;

  await chrome.downloads.download({
    url: dataUrl,
    filename,
    saveAs: true,
  });

  return { success: true };
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function blobToDataUrl(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}
