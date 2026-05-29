# FastStack Expense Tracker

A clean, dependency-free personal expense tracker built for GitHub Pages.

## Features

- Add, edit, and delete expenses.
- Add Cash In entries and allocate funds to budget groups.
- Use default groups such as Tour Expenses, Petty Cash, Office Expenses, Project Expenses, and Other, or create custom groups while entering transactions.
- Track allocated funds, actual spending, and remaining balances for each group.
- View a group-wise balance sheet with Project-name, Date/Time, Cash-in, Cash-Out, Balance, and Des columns.
- Open a Des popup to view full transaction details and notes.
- Filter by week, group, or search text.
- View weekly spend, weekly cash in, running balance, and active groups.
- Track six-week spending trends and daily expense breakdowns grouped by date.
- Password-gated login screen for client-side access control.
- Save data locally in the browser with `localStorage`.
- Export expenses, cash-in entries, groups, and settings as JSON.

## Login

Default password:

`faststack@2026`

This is client-side protection for a static GitHub Pages app. To change it, update `APP_PASSWORD_HASH` in `app.js` with a SHA-256 hash of the new password.

## Data Storage

Application data is stored in the browser's `localStorage` on the user's device:

- `faststack-expenses-v1`
- `faststack-cash-in-v1`
- `faststack-groups-v1`
- `faststack-settings-v1`

The app does not currently store expense data in GitHub, Google Sheets, or a database.

## GitHub Pages

This repo includes a GitHub Actions workflow at `.github/workflows/pages.yml`.

To publish it:

1. Push the files to the `main` branch.
2. Open `Settings > Pages` in the GitHub repository.
3. Set **Build and deployment > Source** to **GitHub Actions**.
4. Run the workflow or push a new commit.

The site will be available at:

`https://comeback2000.github.io/faststack/`
