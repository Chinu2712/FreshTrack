# FreshTrack

FreshTrack is a browser-based college dashboard mini-project built with **HTML5, CSS3, and JavaScript**. It combines attendance tracking, CGPA estimation, budget tracking, profile-based local data storage, and a help/contact form in a single responsive-style dashboard page.

## Overview

- **Project type:** First-year undergraduate web development mini-project (static website)
- **Main files:** `pop.html`, `style.css`, `main.js`, `script.js`
- **Data storage:** Browser `localStorage` (local to the current browser/device)
- **External libraries/services:** Chart.js (expense chart), Font Awesome (icons), Web3Forms (optional direct contact form delivery)

## Features

### 1. Welcome/startup screen
- A welcome overlay appears when the page loads.
- Users can click **Get Started** to close it.
- The overlay also closes automatically after a short delay.

### 2. Dark/light mode toggle
- A theme toggle is placed at the **top-right of the webpage**.
- UI includes **Light** and **Dark** labels with an animated pill switch, sliding knob, and indicator dot (inspired by the referenced toggle design).
- Smooth transitions are applied to the toggle animation and theme color changes across the dashboard.
- Theme preference is saved in browser `localStorage` (`freshTrackTheme`) as a **global** preference (not per profile) and persists across reloads in the same browser.
- Default theme is **dark**; the saved theme is applied early on page load to reduce flash.
- The theme toggle remains **hidden during the startup/welcome animation** and becomes visible when the actual website is loaded/dismissed.
- Chart.js expense chart colors (legend/borders) adapt when the theme changes.

### 3. Dashboard navigation
- A fixed sidebar provides quick links to major sections: Dashboard, Profiles, Attendance, CGPA, Budget, Generate Report/Budget, and Help/Contacts.
- Sidebar links scroll to the corresponding sections of the page.

### 4. Dashboard summary cards
- Displays quick summary values for:
  - **Attendance** percentage
  - **CGPA** estimate
  - **Budget Left** (remaining amount)

### 5. Profiles (up to 6, browser-local)
- Create, switch, and remove named profiles from the **Profiles** section.
- Supports up to **6 profiles** at the same time.
- Each profile keeps its own saved tracker data (attendance, CGPA, budget) isolated from other profiles.
- Profile selector shows the active profile; users can add a new profile by name and remove the current profile (at least one profile is always kept).
- Duplicate profile names are prevented (case-insensitively), and profile names are validated/limited.
- Existing legacy single-profile dashboard data (`freshTrackDashboard`) is migrated into a default profile when needed.
- Profiles are stored in browser `localStorage` (`freshTrackProfiles`).
- **Privacy/limitations:** Profiles are labels for local data separation only—not user accounts. They are not password-protected, not cloud-synced, and can be accessed by anyone using the same browser/device. Clearing site data removes them. Do not store sensitive information.

### 6. Attendance tracker
- Inputs: **Total Classes**, **Attended Classes**, and **Attendance Target (%)** (default 75%).
- Calculates attendance percentage:  
  `Attendance % = (attended classes / total classes) * 100`
- Shows:
  - Current attendance percentage
  - Whether the selected attendance target is met
  - How many consecutive classes are needed to reach the target (when below target)
  - Warning/safe status based on the target
- Handles edge cases such as already meeting the target and impossible 100% target scenarios after missed classes.

### 7. CGPA predictor
- Inputs: **Semester 1 SGPA**, **Semester 2 SGPA**, and optional **Semester 1/2 Credits**.
- SGPA values must be between 0 and 10.
- Calculation modes:
  - **Simple average** (default, when both credit fields are blank):  
    `CGPA = (SGPA1 + SGPA2) / 2`
  - **Credit-weighted estimate** (when credits are provided for both semesters):  
    `CGPA = (SGPA1 × Credits1 + SGPA2 × Credits2) / (Credits1 + Credits2)`
- Credits must be entered for **both** semesters or left blank for both.

### 8. Budget tracker and expense chart
- Inputs: **Monthly Budget**, **Food Expense**, **Travel Expense**, and **Entertainment Expense**.
- Calculates:
  - Total expenses across categories
  - Remaining budget:  
    `Remaining = Monthly Budget - (Food + Travel + Entertainment)`
- Displays the remaining amount and generates/updates a **Chart.js pie chart** showing expense breakdown by category.
- Expenses may exceed the budget (remaining balance can be negative).

### 9. Input validation and user feedback
- Client-side validation is applied before calculations/saves.
- Attendance: class counts must be valid whole numbers; total classes > 0; attended classes cannot exceed total; target must be between 0 and 100.
- CGPA: both SGPAs required and within 0–10; credit inputs must be valid and provided as a pair when used.
- Budget: budget and expense values must be non-negative valid numbers.
- Invalid input shows helpful messages and does not overwrite saved/summary values with invalid data.
- Status messages are shown for profile/storage actions and contact form outcomes.

### 10. Browser storage and persistence
- Valid tracker entries are saved in browser `localStorage` per active profile.
- Saved values are restored when the page/profile is loaded.
- Storage/profile status messages inform users when data is restored, saved, or unavailable.
- Data remains only in the current browser/device unless cleared by browser/site-data removal.

### 11. Help/Contact form
- Located in the **Help/Contacts** section.
- Collects sender email and message.
- **Configured direct delivery:** If a valid Web3Forms access key is set in the hidden `access_key` field in `pop.html`, the form submits to Web3Forms for delivery to the inbox configured for that key (intended recipient: `shauryasalke@gmail.com`).
- **Fallback (no configured key):** If the access key is missing/placeholder (`YOUR_ACCESS_KEY`), submitting opens a prefilled `mailto:` draft addressed to **shauryasalke@gmail.com** with the entered details; the user must review and press **Send** in their email app.
- Honest status messaging is shown (draft opened / sent / error). A static webpage cannot silently send email without a configured service.

## Technologies used

- **HTML5:** Structure, forms, labels, and dashboard sections
- **CSS3:** Layout, styling, theme variables, transitions/animations, and responsive adjustments
- **JavaScript:** Calculations, validation, DOM updates, theme/profile/storage logic, and form handling
- **Chart.js:** Expense pie chart visualization
- **Font Awesome:** Sidebar and UI icons
- **Web3Forms:** Optional contact-form submission endpoint

## How to run locally

1. Keep `pop.html`, `style.css`, `main.js`, and `script.js` in the same folder.
2. Open `pop.html` in a modern web browser.
3. For more consistent browser storage behavior, run the folder with a local development server (for example, VS Code Live Server).
4. Internet access is required for CDN resources (Chart.js, Font Awesome) and for Web3Forms direct submission when configured.

## Configure direct email delivery (optional)

To send Help/Contact messages directly through Web3Forms to `shauryasalke@gmail.com`:

1. Create a Web3Forms access key configured for `shauryasalke@gmail.com`.
2. Replace `YOUR_ACCESS_KEY` in `pop.html`:
   - `<input type="hidden" name="access_key" value="YOUR_ACCESS_KEY">`
3. Reload the page and submit a test message.
4. Verify delivery in the configured inbox.

If not configured, the form uses the `mailto:` fallback and does not claim background delivery.

## Project structure

- `pop.html` — Page structure, dashboard sections, theme toggle, profile UI, tracker forms, chart canvas, and contact form
- `style.css` — Styling, dark/light theme variables, animations, layout, and component/form styles
- `main.js` — Welcome popup behavior, theme toggle/persistence, profile management, tracker calculations, validation, Chart.js rendering, and `localStorage` persistence
- `script.js` — Help/contact form submission logic (Web3Forms or `mailto:` fallback)
- `README.md` — Existing project README
- `FRESHTRACK-README.md` — This comprehensive features README (new)
- `Updated Features of the Webpage` — Detailed feature/change notes
- `tracker-updates.md` — Tracker-specific update notes

## Notes and limitations

- This is a static front-end project; there is no backend database or authentication system.
- Profile and theme data are stored locally in the browser and are not shared across devices/browsers.
- Clearing browser site data removes saved local data.
- Direct contact delivery requires a valid Web3Forms access key configured for the intended recipient.
- Chart and icon resources depend on CDN availability unless hosted locally.
