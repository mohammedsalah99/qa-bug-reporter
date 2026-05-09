# Privacy Policy — Bug Reporter

**Last updated:** May 9, 2026

## Summary

Bug Reporter does **not** collect, transmit, or store any personal data or browsing information on external servers. All data captured by the extension stays entirely on your local machine.

## What Data Is Captured

When you click "Report Bug," the extension captures the following from the **active browser tab only**:

- A screenshot of the visible page
- The page URL and title
- Recent user interactions (clicks, form inputs, navigations)
- Recent browser console log entries
- Recent network request metadata (URL, method, status code, duration)
- Browser and OS information from the user agent string

## Where Data Is Stored

All captured data is assembled into a self-contained HTML file and downloaded directly to your computer via Chrome's built-in download mechanism. **No data is sent to any server, API, or third-party service.**

The extension uses `chrome.storage.local` solely to persist your UI preferences (theme, capture limits). This data never leaves your browser.

## Data Sharing

Bug Reporter does **not**:

- Send data to any external server
- Use analytics or tracking of any kind
- Include any third-party scripts, SDKs, or services
- Require user accounts or authentication

## Permissions

The extension requests permissions strictly for its core functionality:

| Permission     | Purpose                                        |
|----------------|------------------------------------------------|
| `activeTab`    | Capture a screenshot of the current tab        |
| `tabs`         | Read the tab URL and title for the report      |
| `webRequest`   | Monitor XHR/fetch network requests             |
| `downloads`    | Download the generated HTML report             |
| `storage`      | Save UI preferences locally                    |
| `<all_urls>`   | Observe network requests across all sites      |

## Changes to This Policy

If this policy is updated, the changes will be reflected in this document with an updated date. Continued use of the extension after changes constitutes acceptance of the revised policy.

## Contact

If you have questions about this privacy policy, please open an issue on the [GitHub repository](https://github.com/mohammedsalah99/qa-bug-reporter/issues).
