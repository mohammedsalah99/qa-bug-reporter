# Bug Reporter

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Chrome Web Store](https://img.shields.io/badge/Chrome_Web_Store-v1.0.0-4285F4?logo=googlechrome&logoColor=white)](#install-from-chrome-web-store)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)

An always-on Chrome extension that silently captures context in the background while you test. When you find a bug, click the icon, type a title, and download a self-contained HTML report with everything a developer needs to reproduce the issue.

No accounts. No SaaS. No data leaves your machine.

<!-- TODO: Replace with actual screenshot -->
<!-- ![Bug Reporter popup](docs/screenshot-popup.png) -->

## What Gets Captured

| Data              | Details                                                                 |
|-------------------|-------------------------------------------------------------------------|
| Screenshot        | PNG of the visible tab, embedded as base64                              |
| Page URL          | Full URL at report time                                                 |
| User interactions | Last 30 clicks, inputs, form submissions, navigations (with timestamps) |
| Console logs      | Last 20 entries, color-coded by level (error/warning/info)              |
| Network requests  | Last 10 XHR/fetch calls with method, URL, status, and duration          |
| Browser info      | OS, architecture, and user agent string                                 |

## Install

### From Chrome Web Store

<!-- TODO: Add Chrome Web Store link once published -->
Coming soon.

### From Source (Load Unpacked)

1. Clone the repository:
   ```bash
   git clone https://github.com/mohammedsalah99/qa-bug-reporter.git
   ```
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (toggle in the top right)
4. Click **Load unpacked** and select the cloned folder
5. The Bug Reporter icon appears in your toolbar — you're ready to go

## How to Use

1. **Browse normally** — the extension records context silently in the background
2. **Spot a bug** — click the Bug Reporter icon in the toolbar
3. **Fill in the title** (required) and optionally add a description, severity, and steps to reproduce
4. **Click "Report Bug"** — a self-contained HTML file downloads to your machine
5. **Attach the file** to your Jira ticket, GitHub issue, or Slack thread

The HTML report opens in any browser and includes collapsible sections for screenshot, user actions, console logs, network requests, and QA notes.

## Report Modes

- **Basic** — Title + description + all captured context
- **Full Report** — Adds severity, priority, steps to reproduce, expected result, and actual result fields

## Permissions

| Permission     | Why it's needed                                  |
|----------------|--------------------------------------------------|
| `activeTab`    | Capture a screenshot of the current tab          |
| `tabs`         | Read the tab's URL and title for the report      |
| `webRequest`   | Monitor network requests (XHR/fetch only)        |
| `downloads`    | Trigger the HTML report download                 |
| `storage`      | Persist settings across popup open/close         |
| `<all_urls>`   | Capture network requests across all sites        |

## Privacy

Bug Reporter does **not** collect, transmit, or store any data externally. All captured data stays on your local machine in the downloaded HTML file. See the full [Privacy Policy](PRIVACY_POLICY.md).

## Project Structure

```
qa-bug-reporter/
  manifest.json        Manifest V3 configuration
  background.js        Service worker: network logging, screenshot, report generation
  content.js           Content script (isolated world): interaction tracking
  content-main.js      Content script (main world): console interception
  report-template.js   HTML report template with embedded CSS
  popup.html/css/js    Extension popup UI
  icons/               16/32/48/128px extension icons
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes and test by loading the unpacked extension
4. Commit your changes: `git commit -m "Add my feature"`
5. Push to your branch: `git push origin feature/my-feature`
6. Open a Pull Request

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
