# FastStack Expense Tracker

A clean personal expense tracker for GitHub Pages with a private Google Sheets database behind a secure Google Apps Script API.

## Features

- Add, edit, and delete expenses.
- Add Cash In entries and allocate funds to project/categories.
- Track allocated funds, actual spending, and remaining balances for each group.
- View a group-wise balance sheet with Date/Time, Cash-in, Cash-Out, Balance, and Des columns.
- Open a Des popup to view full transaction details and notes.
- Filter by week, group, or search text.
- Use IST as the default Date and Time while still allowing manual edits before saving.
- View daily expense breakdowns grouped by date.
- Use Gmail-only registration with email verification, secure login, and password reset codes.
- Store users, sessions, categories, transactions, balances, and transaction history in Google Sheets.

## Data Storage

Application data is stored in a private Google Sheet. The frontend never receives the spreadsheet ID and never talks to Google Sheets directly.

All browser requests go to the Google Apps Script Web App URL configured in `config.js`:

```js
window.FASTSTACK_BACKEND = {
  apiUrl: "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec",
};
```

Only the currency preference is kept in browser Local Storage. Expenses, cash-in records, categories, balances, users, sessions, and transaction history are centralized in Google Sheets and reloaded after login.

## Google Sheets Backend Setup

1. Open [Google Apps Script](https://script.google.com/) and create a new project.
2. Paste `google-apps-script/Code.gs` into the Apps Script editor.
3. Run `setupFastStackBackend()` once. Approve the requested Google permissions.
4. Deploy the Apps Script project as a Web App:
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the Web App URL ending in `/exec`.
6. Paste that URL into `config.js`.
7. Push the project to GitHub Pages.
8. Create your account from the app Sign Up screen using a `gmail.com` address.

Apps Script will ask for permission to access spreadsheets and send email. Email permission is required for verification and password reset codes.

The setup function creates these sheets:

- `Users`: password salts/hashes, roles, account status, verification codes, reset codes.
- `Sessions`: hashed API session tokens and expiry timestamps.
- `Categories`: user-owned project/category groups.
- `Transactions`: cash-in and expense records, with soft deletion.
- `Balances`: category allocation, spend, and remaining balance snapshots.
- `TransactionHistory`: audit history for login, group, save, and delete actions.

## Security Notes

- Keep the Google Sheet private; do not share it publicly.
- Deploy the Web App as **Execute as Me** so the spreadsheet can stay hidden from users.
- Only `gmail.com` addresses can register or log in.
- Users must verify their email before login.
- Verification and password reset codes expire automatically.
- User passwords are salted and hashed in Apps Script before storage.
- Session tokens are stored hashed in the sheet and expire automatically.
- All data APIs require a valid session token and filter rows by the logged-in user's `userId`.
- Each tenant's expenses, cash-in records, categories, balances, and reports are isolated by `userId`.
- The backend validates IDs, emails, dates, times, amount ranges, transaction types, colors, and text lengths.
- Text input is sanitized before being written to Sheets, including protection against formula injection using leading `=`, `+`, `-`, or `@`.

## GitHub Pages

This repo includes a GitHub Actions workflow at `.github/workflows/pages.yml`.

To publish it:

1. Push the files to the `main` branch.
2. Open `Settings > Pages` in the GitHub repository.
3. Set **Build and deployment > Source** to **GitHub Actions**.
4. Run the workflow or push a new commit.

The site will be available at:

`https://comeback2000.github.io/faststack/`
