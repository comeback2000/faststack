# FastStack Expense Tracker

A clean, dependency-free personal expense tracker built for GitHub Pages.

## Features

- Add, edit, and delete expenses.
- Add Cash In entries and allocate funds to budget groups.
- Use default groups such as Tour Expenses, Petty Cash, Office Expenses, Project Expenses, and Other, or create custom groups while entering transactions.
- Track allocated funds, actual spending, and remaining balances for each group.
- Filter by week, group, or search text.
- View weekly spend, weekly cash in, running balance, and active groups.
- Track six-week spending trends and daily expense breakdowns grouped by date.
- Save data locally in the browser with `localStorage`.
- Export expenses, cash-in entries, groups, and settings as JSON.

## GitHub Pages

This repo includes a GitHub Actions workflow at `.github/workflows/pages.yml`.

To publish it:

1. Push the files to the `main` branch.
2. Open `Settings > Pages` in the GitHub repository.
3. Set **Build and deployment > Source** to **GitHub Actions**.
4. Run the workflow or push a new commit.

The site will be available at:

`https://comeback2000.github.io/faststack/`
