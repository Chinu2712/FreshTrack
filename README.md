# FreshTrack

FreshTrack is a browser-based college dashboard made with HTML5, CSS3, and JavaScript. It brings attendance, grade estimates, budget tracking, and help/contact tools into one page.

## Features

- **Attendance tracker:** Calculates attendance and estimates how many consecutive classes are needed to meet the selected target (75% by default).
- **CGPA predictor:** Estimates a CGPA from two semester grades, using optional semester credits for a weighted result.
- **Budget tracker:** Add named expenses, calculate the remaining monthly budget, and view a Chart.js pie chart.
- **Dark/light mode:** Switch themes with the top-right toggle; the selection is saved in the current browser.
- **Profiles:** Create, switch between, and remove up to six profiles. Each profile saves its own tracker values in the current browser.
- **Input validation:** Rejects invalid class counts, grades, credits, and negative budget values.
- **Help/contact:** Sends through Web3Forms when configured, or opens a prefilled email draft to `shauryasalke@gmail.com`.
- **Dashboard navigation:** Sidebar links jump to the dashboard's sections.

## Run locally

1. Keep `pop.html`, `style.css`, `theme.js`, `main.js`, and `script.js` in the same folder.
2. Open `pop.html` in a modern browser. A local development server is recommended for consistent browser storage behavior.
3. Internet access is needed for Chart.js, Font Awesome, and Web3Forms.

## Configure direct email delivery

The site is static, so it cannot safely send email by itself. To enable direct form submission:

1. Create a Web3Forms access key configured for the inbox `shauryasalke@gmail.com`.
2. Replace `YOUR_ACCESS_KEY` in the hidden `access_key` input in `pop.html` with that key.
3. Submit a test message and verify it arrives in the target inbox.

Without a configured key, the contact form opens the visitor's default email app with the recipient, subject, sender address, and message filled in. The visitor must review and press **Send**. The webpage does not claim that this draft was delivered.

## Profiles and privacy

Profiles are labels for separating dashboard data on one browser/device; they are not user accounts. Tracker values are stored locally with `localStorage`, are not password-protected or synchronized to the cloud, and will be removed if the browser's site data is cleared. Anyone with access to the browser can access these profiles, so do not store sensitive information.

## Project files

- `pop.html` — dashboard layout and forms.
- `style.css` — styling, navigation behavior, and form controls.
- `theme.js` — theme selection and saved theme preference.
- `main.js` — trackers, validation, profile management, and local storage.
- `script.js` — help/contact form behavior.
- `Updated Features of the Webpage` — detailed feature notes.
