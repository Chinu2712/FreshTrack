# FreshTrack

GitHub repository: https://github.com/Chinu2712/FreshTrack

FreshTrack is a small college dashboard built with HTML, CSS, and JavaScript. It keeps attendance, semester grade estimates, and monthly expenses together on one page instead of making students move between separate calculators.

It was created as a first-year web development mini-project and does not need a backend or database to run.

## What it can do

### Attendance

Enter the total number of classes, the number attended, and a target percentage. FreshTrack calculates the current attendance percentage and shows whether the target has been reached.

```text
Attendance = (attended classes / total classes) x 100
```

If attendance is below the target, it also estimates how many consecutive classes need to be attended. The default target is 75%, but it can be changed for each calculation.

### CGPA prediction

Enter the SGPA for two semesters to get an estimated CGPA.

Without credits:

```text
Estimated CGPA = (Semester 1 SGPA + Semester 2 SGPA) / 2
```

If semester credits are supplied for both semesters, the result is credit-weighted:

```text
Estimated CGPA =
(SGPA 1 x credits 1 + SGPA 2 x credits 2) /
(credits 1 + credits 2)
```

SGPA values must be between 0 and 10. Credits are optional, but both credit fields must be filled if either is used.

### Budget tracker

Set a monthly budget and add expenses with a name and amount. Food, Travel, and Entertainment are included as starting categories.

FreshTrack shows the total spending, remaining budget, and a pie chart using Chart.js. The remaining balance can be negative, which means spending is above the monthly budget.

### Profiles

The dashboard supports up to six browser-local profiles. Switching profiles restores that profile's attendance, CGPA, budget, and expense entries.

Profiles are only labels for separating local data. They are not accounts and do not include passwords or sign-in. Data is stored in `localStorage` on the current browser and does not sync to another device.

### Theme switcher

The top-right switch changes between light and dark themes. The theme choice is saved separately from profile data and is remembered by the browser.

### Welcome screen and navigation

The page opens with a short welcome screen that can be dismissed with **Get Started** or left to close automatically. The sidebar links scroll to the Profiles, Attendance, CGPA, Budget, and Help sections.

The dashboard summary at the top shows the latest attendance percentage, estimated CGPA, and remaining budget for the active profile.

### Help and contact

The contact form has two modes:

- When a valid Web3Forms access key is configured, the form sends the message through Web3Forms.
- When the key is still the `YOUR_ACCESS_KEY` placeholder, the form opens a prefilled email draft for `shauryasalke@gmail.com`.

The email draft is not sent automatically. It must be reviewed and sent from the visitor's email application.

## Validation

The inputs are checked in the browser before values are calculated or saved:

- Total classes must be a positive whole number.
- Attended classes must be non-negative and cannot be greater than total classes.
- Attendance targets must be between 0 and 100.
- Both SGPAs must be between 0 and 10.
- Semester credits must be positive and entered together.
- Monthly budgets and expense amounts cannot be negative.
- Expense names cannot be empty.

If an invalid value is entered, the calculator shows a helpful message and leaves the previous valid summary unchanged.

## Running the project

No build step or package installation is required.

1. Keep `pop.html`, `style.css`, `theme.js`, `main.js`, and `script.js` in the same folder.
2. Open `pop.html` in a modern browser.
3. A local development server is recommended if the browser blocks or restricts some local storage behavior.

Chart.js and Font Awesome are loaded through CDNs, so those visual features need an internet connection. Web3Forms also needs internet access when direct contact delivery is enabled.

## Setting up contact delivery

The contact form uses Web3Forms only when an access key is provided.

1. Create a Web3Forms access key for the inbox `shauryasalke@gmail.com`.
2. Open `pop.html` and find the hidden `access_key` field.
3. Replace `YOUR_ACCESS_KEY` with the key.
4. Submit a test message and confirm that it reaches the configured inbox.

Do not add a mailbox password or SMTP secret to the page. A static browser project is not a safe place for private server credentials.

Without a key, the form uses the `mailto:` fallback described above.

## Data and privacy

FreshTrack saves tracker entries, profile names, and the theme preference in the current browser with `localStorage`.

- Profile data does not transfer between browsers or devices.
- Clearing the site's browser data removes saved profiles and values.
- Profile information is not encrypted or password-protected.
- Anyone using the same browser profile may be able to view the saved dashboard data.

Avoid entering sensitive personal or account information.

## Project files

- `pop.html` - Page structure, dashboard sections, forms, and external resource links.
- `style.css` - Layout, component styling, responsive behavior, and theme colors.
- `theme.js` - Theme selection and saved theme preference.
- `main.js` - Profile management, calculations, validation, chart updates, and local storage.
- `script.js` - Web3Forms submission and email-draft fallback.
