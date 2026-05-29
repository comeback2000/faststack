# FastStack Expense Tracker

A clean, dependency-free personal expense tracker built for GitHub Pages.

## Features

- Add, edit, and delete expenses.
- Add Cash In entries and allocate funds to budget groups.
- Create custom project/groups while entering transactions.
- Track allocated funds, actual spending, and remaining balances for each group.
- View a group-wise balance sheet with Project-name, Date/Time, Cash-in, Cash-Out, Balance, and Des columns.
- Open a Des popup to view full transaction details and notes.
- Filter by week, group, or search text.
- View weekly spend, weekly cash in, running balance, and active groups.
- Track six-week spending trends and daily expense breakdowns grouped by date.
- Email/password login with Supabase Auth.
- Save project groups and transactions in a centralized Supabase database.
- Export expenses, cash-in entries, groups, and settings as JSON.

## Login

Login uses Supabase Auth. Create authorized users in the Supabase project, then sign in with their email and password.

## Data Storage

Application data is stored in Supabase Postgres:

- `groups`
- `transactions`

The database schema and row-level security policies are in `supabase-schema.sql`. Run that SQL in the Supabase SQL editor before using the app.

Configure the browser-safe Supabase project values in `config.js`:

```js
window.FASTSTACK_SUPABASE = {
  url: "https://YOUR_PROJECT.supabase.co",
  anonKey: "YOUR_SUPABASE_ANON_KEY",
};
```

The app no longer relies on browser-only storage for expenses, cash-in records, groups, or balances.

## GitHub Pages

This repo includes a GitHub Actions workflow at `.github/workflows/pages.yml`.

To publish it:

1. Push the files to the `main` branch.
2. Open `Settings > Pages` in the GitHub repository.
3. Set **Build and deployment > Source** to **GitHub Actions**.
4. Run the workflow or push a new commit.

The site will be available at:

`https://comeback2000.github.io/faststack/`
