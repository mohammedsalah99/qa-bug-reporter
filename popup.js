const DEFAULTS = {
  maxInteractions: 30,
  maxConsoleLogs: 20,
  maxNetworkLogs: 10,
  reportMode: 'basic',
  theme: 'auto',
};

// ── DOM refs ─────────────────────────────────────────────────────────

const titleInput      = document.getElementById('bugTitle');
const descInput       = document.getElementById('bugDescription');
const reportBtn       = document.getElementById('reportBtn');
const btnText         = reportBtn.querySelector('.btn-text');
const btnLoading      = reportBtn.querySelector('.btn-loading');
const toastError      = document.getElementById('toastError');
const toastSuccess    = document.getElementById('toastSuccess');
const statusText      = document.getElementById('statusText');
const statusDot       = document.getElementById('statusDot');
const statusPill      = document.getElementById('statusPill');
const settingsToggle  = document.getElementById('settingsToggle');
const settingsPanel   = document.getElementById('settingsPanel');
const modeToggle      = document.getElementById('modeToggle');
const fullFields      = document.getElementById('fullFields');
const versionText     = document.getElementById('versionText');

const themeToggle     = document.getElementById('themeToggle');

const settingsInputs = {
  maxInteractions: document.getElementById('maxInteractions'),
  maxConsoleLogs:  document.getElementById('maxConsoleLogs'),
  maxNetworkLogs:  document.getElementById('maxNetworkLogs'),
};

const fullFieldInputs = {
  severity:         document.getElementById('severity'),
  priority:         document.getElementById('priority'),
  stepsToReproduce: document.getElementById('stepsToReproduce'),
  expectedResult:   document.getElementById('expectedResult'),
  actualResult:     document.getElementById('actualResult'),
};

let activeTabId = null;
let currentSettings = { ...DEFAULTS };
let statusInterval = null;

// ── Init ─────────────────────────────────────────────────────────────

async function init() {
  const manifest = chrome.runtime.getManifest();
  versionText.textContent = `v${manifest.version}`;

  await loadSettings();

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) { showStatus('No active tab', false); return; }
    activeTabId = tab.id;

    const isRestricted = tab.url?.startsWith('chrome://') ||
                         tab.url?.startsWith('chrome-extension://') ||
                         tab.url?.startsWith('about:');
    if (isRestricted) {
      showStatus('Cannot capture on this page', false);
      reportBtn.disabled = true;
      return;
    }

    await updateStatus();
    reportBtn.disabled = titleInput.value.trim().length === 0;
    statusInterval = setInterval(updateStatus, 3000);
  } catch {
    showStatus('Cannot capture on this page', false);
  }
}

// ── Settings ─────────────────────────────────────────────────────────

async function loadSettings() {
  const res = await chrome.storage.local.get('settings');
  const saved = res.settings || {};
  currentSettings = { ...DEFAULTS, ...saved };

  settingsInputs.maxInteractions.value = currentSettings.maxInteractions;
  settingsInputs.maxConsoleLogs.value  = currentSettings.maxConsoleLogs;
  settingsInputs.maxNetworkLogs.value  = currentSettings.maxNetworkLogs;

  setReportMode(currentSettings.reportMode);
  applyTheme(currentSettings.theme);
  themeToggle.title = `Theme: ${currentSettings.theme}`;
}

async function saveSettings() {
  currentSettings.maxInteractions = clamp(parseInt(settingsInputs.maxInteractions.value, 10) || DEFAULTS.maxInteractions, 5, 200);
  currentSettings.maxConsoleLogs  = clamp(parseInt(settingsInputs.maxConsoleLogs.value, 10)  || DEFAULTS.maxConsoleLogs,  5, 200);
  currentSettings.maxNetworkLogs  = clamp(parseInt(settingsInputs.maxNetworkLogs.value, 10)  || DEFAULTS.maxNetworkLogs,  5, 200);

  settingsInputs.maxInteractions.value = currentSettings.maxInteractions;
  settingsInputs.maxConsoleLogs.value  = currentSettings.maxConsoleLogs;
  settingsInputs.maxNetworkLogs.value  = currentSettings.maxNetworkLogs;

  await chrome.storage.local.set({ settings: currentSettings });
}

settingsToggle.addEventListener('click', () => {
  settingsPanel.classList.toggle('open');
  settingsToggle.classList.toggle('active');
});

Object.values(settingsInputs).forEach(input => {
  input.addEventListener('change', saveSettings);
});

// ── Theme Toggle ─────────────────────────────────────────────────────

function applyTheme(theme) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'auto' && prefersDark);
  document.documentElement.classList.toggle('dark', isDark);
}

function cycleTheme() {
  const order = ['auto', 'light', 'dark'];
  const idx = order.indexOf(currentSettings.theme);
  currentSettings.theme = order[(idx + 1) % order.length];
  applyTheme(currentSettings.theme);
  themeToggle.title = `Theme: ${currentSettings.theme}`;
  chrome.storage.local.set({ settings: currentSettings });
}

themeToggle.addEventListener('click', cycleTheme);

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (currentSettings.theme === 'auto') applyTheme('auto');
});

// ── Report Mode Toggle ───────────────────────────────────────────────

function setReportMode(mode) {
  currentSettings.reportMode = mode;
  modeToggle.dataset.active = mode;

  modeToggle.querySelectorAll('.seg-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  if (mode === 'full') {
    fullFields.classList.add('visible');
  } else {
    fullFields.classList.remove('visible');
  }
}

modeToggle.querySelectorAll('.seg-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    setReportMode(btn.dataset.mode);
    chrome.storage.local.set({ settings: currentSettings });
  });
});

// ── Status ───────────────────────────────────────────────────────────

async function updateStatus() {
  try {
    const contentStatus = await chrome.tabs.sendMessage(activeTabId, { type: 'GET_STATUS' });
    const parts = [
      `${contentStatus.interactionCount} actions`,
      `${contentStatus.consoleLogCount} logs`,
      `${contentStatus.networkLogCount || 0} net`,
    ];
    showStatus(parts.join(' · '), true);
  } catch {
    showStatus('Waiting for page data…', true);
  }
}

function showStatus(text, active) {
  statusText.textContent = text;
  statusDot.classList.toggle('inactive', !active);
}

// ── Title validation ─────────────────────────────────────────────────

titleInput.addEventListener('input', () => {
  reportBtn.disabled = titleInput.value.trim().length === 0;
  hideToasts();
});

// ── Report ───────────────────────────────────────────────────────────

reportBtn.addEventListener('click', async () => {
  const title = titleInput.value.trim();
  if (!title) return;

  hideToasts();
  setLoading(true);

  try {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = currentSettings.theme === 'dark' || (currentSettings.theme === 'auto' && prefersDark);

    const msg = {
      type: 'GENERATE_REPORT',
      tabId: activeTabId,
      title,
      description: descInput.value.trim(),
      theme: isDark ? 'dark' : 'light',
    };

    if (currentSettings.reportMode === 'full') {
      msg.severity         = fullFieldInputs.severity.value;
      msg.priority         = fullFieldInputs.priority.value;
      msg.stepsToReproduce = fullFieldInputs.stepsToReproduce.value.trim();
      msg.expectedResult   = fullFieldInputs.expectedResult.value.trim();
      msg.actualResult     = fullFieldInputs.actualResult.value.trim();
    }

    const response = await chrome.runtime.sendMessage(msg);

    if (response.success) {
      showToast(toastSuccess);
      titleInput.value = '';
      descInput.value = '';
      Object.values(fullFieldInputs).forEach(el => {
        if (el.tagName === 'SELECT') el.selectedIndex = 0;
        else el.value = '';
      });
      reportBtn.disabled = true;
    } else {
      showToastError(response.error || 'Failed to generate report.');
    }
  } catch (err) {
    showToastError(err.message || 'Unexpected error.');
  } finally {
    setLoading(false);
  }
});

// ── Helpers ──────────────────────────────────────────────────────────

function setLoading(loading) {
  reportBtn.disabled = loading;
  btnText.hidden = loading;
  btnLoading.hidden = !loading;
}

function showToast(el) {
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 4000);
}

function showToastError(msg) {
  toastError.textContent = msg;
  showToast(toastError);
}

function hideToasts() {
  toastError.classList.remove('show');
  toastSuccess.classList.remove('show');
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

init();
