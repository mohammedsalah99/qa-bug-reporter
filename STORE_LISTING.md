# Chrome Web Store Listing

> Copy-paste these fields into the Chrome Web Store Developer Dashboard when submitting.

---

## Name

Bug Reporter

## Summary (132 chars max)

Automatic bug reporting for QA — captures screenshots, console logs, network requests, and user actions in one click.

## Category

Developer Tools

## Language

English

## Description

Bug Reporter is an always-on Chrome extension that silently captures context in the background while you test. When you find a bug, click the extension icon, type a title, and download a self-contained HTML report with everything a developer needs to reproduce the issue.

No accounts. No SaaS. No data leaves your machine.

WHAT BUG REPORTER CAPTURES AUTOMATICALLY:

• Screenshot of the current page (full visible area)
• Page URL and title
• Last 30 user interactions — clicks, form inputs, form submissions, and page navigations with timestamps and element details
• Last 20 console log entries — color-coded by level (error, warning, info) with filter controls
• Last 10 network API calls — method, URL, status code, and response time
• Browser and OS information

HOW IT WORKS:

1. Install the extension — it starts capturing immediately, no setup required
2. Test your application normally
3. When you find a bug, click the Bug Reporter icon in your toolbar
4. Enter a bug title (required) and optionally add a description
5. Click "Report Bug" — an HTML file downloads instantly
6. Attach the report to your Jira ticket, GitHub issue, or Slack thread

THE REPORT:

The downloaded HTML file is completely self-contained — no external dependencies, no internet needed to view it. Open it in any browser to see:

• Header with bug title, timestamp, page URL, and browser info
• Full-width screenshot
• Chronological list of user actions with timestamps
• Console logs with color-coded severity and filter pills
• Network request table with method, URL, status, and duration
• QA notes section with your description

All sections are collapsible for easy navigation.

TWO REPORT MODES:

• Basic — Title, description, and all captured context
• Full Report — Adds severity, priority, steps to reproduce, expected result, and actual result

PRIVACY FIRST:

Bug Reporter collects zero analytics and sends zero data to any server. Everything stays on your machine. All captured data goes directly into the downloaded HTML file. The extension uses local storage only to remember your UI preferences.

BUILT FOR QA TEAMS:

Stop losing context between finding a bug and reporting it. No more "can you check the console?" or "what URL were you on?" — every report includes the full picture automatically.

Perfect for QA engineers, product managers, designers, or anyone who files bugs.

PERMISSIONS EXPLAINED:

• activeTab — Capture a screenshot of the page you're viewing
• tabs — Read the page URL and title for the report
• webRequest — Monitor API calls (XHR/fetch only, not static assets)
• downloads — Download the HTML report file
• storage — Remember your theme and capture limit preferences

Open source: https://github.com/mohammedsalah99/qa-bug-reporter

---

## Privacy Policy URL

https://github.com/mohammedsalah99/qa-bug-reporter/blob/main/PRIVACY_POLICY.md

## Support URL (optional)

https://github.com/mohammedsalah99/qa-bug-reporter/issues

## Screenshots Needed

Take 1-5 screenshots at 1280x800 or 640x400 (PNG or JPEG):

1. The popup UI with a filled-in bug title (show both Basic and Full Report modes)
2. A generated HTML report open in a browser (show the header + screenshot section)
3. The console logs section of a report (show the color-coded entries and filter pills)
4. The network requests section of a report
5. (Optional) The extension icon in the Chrome toolbar with the popup open

## Promotional Tile

Small promo tile: 440x280 PNG (see promo-tile.png in repo root)
