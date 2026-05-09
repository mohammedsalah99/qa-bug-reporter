# Slack Post — Company Engineering Channel

> Copy everything below the line into Slack. Attach the demo video to the message.

---

**Introducing YA Bug Reporter** :bug:

Reporting a bug properly takes effort — you need the URL, the steps you took, what the console says, which API calls failed. It's a lot of context to gather manually, especially when you're in the middle of testing and just want to capture the issue before moving on.

I built a Chrome extension that handles this automatically. It runs in the background, and when you spot an issue, you click the icon, type a title, and it generates a report with all the context a developer needs — ready to attach to the Jira ticket.

It's not just for QA — product managers, designers, or anyone who files bugs can use it. No DevTools knowledge needed. Just click and report.

**What YA Bug Reporter captures automatically:**
• Screenshot of the current page
• Page URL and browser info
• Last 30 user interactions (clicks, inputs, navigation) with timestamps
• Last 20 console logs with filter controls (errors, warnings, info)
• Last 10 network API calls — including request payload and response body

Everything stays local — no accounts, no SaaS, no data leaves the machine. The report is a single self-contained HTML file that opens in any browser.

It's ready to use today. To try it:

1. Download and unpack this folder → *(insert Google Drive / GitHub link)*
2. Go to `chrome://extensions` → enable Developer Mode → click "Load unpacked" → select the folder
3. Browse any page, then click the extension icon to generate a report

:point_down: Short demo below.

I've also put together an RFC with the technical design and a roadmap (next step is direct Jira integration — no more manual attaching).

Feedback welcome — especially from anyone tired of gathering all that context manually :slightly_smiling_face:
