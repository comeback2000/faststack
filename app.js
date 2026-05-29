const STORAGE_KEY = "faststack-expenses-v1";
const SETTINGS_KEY = "faststack-settings-v1";

const categories = [
  { name: "Food", color: "#0f766e" },
  { name: "Housing", color: "#2563eb" },
  { name: "Transport", color: "#d97706" },
  { name: "Shopping", color: "#db2777" },
  { name: "Health", color: "#16a34a" },
  { name: "Bills", color: "#7c3aed" },
  { name: "Travel", color: "#0891b2" },
  { name: "Other", color: "#64748b" },
];

const sampleExpenses = [
  createExpense("Groceries and produce", 86.4, "Food", daysAgo(1), "Weekly market run"),
  createExpense("Apartment rent", 1450, "Housing", daysAgo(4), "May rent"),
  createExpense("Metro card refill", 40, "Transport", daysAgo(8), ""),
  createExpense("Doctor visit", 120, "Health", daysAgo(14), "Routine checkup"),
  createExpense("Internet bill", 64.99, "Bills", daysAgo(20), ""),
  createExpense("Running shoes", 132.5, "Shopping", daysAgo(32), "Replacement pair"),
  createExpense("Weekend train tickets", 76, "Travel", daysAgo(49), ""),
  createExpense("Dinner with friends", 58.25, "Food", daysAgo(67), ""),
];

const state = {
  expenses: loadExpenses(),
  settings: loadSettings(),
  filters: {
    search: "",
    month: getCurrentMonth(),
    category: "All",
  },
};

const elements = {
  currencySelect: document.querySelector("#currencySelect"),
  exportButton: document.querySelector("#exportButton"),
  form: document.querySelector("#expenseForm"),
  expenseId: document.querySelector("#expenseId"),
  descriptionInput: document.querySelector("#descriptionInput"),
  amountInput: document.querySelector("#amountInput"),
  dateInput: document.querySelector("#dateInput"),
  categoryInput: document.querySelector("#categoryInput"),
  notesInput: document.querySelector("#notesInput"),
  formTitle: document.querySelector("#formTitle"),
  submitButton: document.querySelector("#submitButton"),
  cancelEditButton: document.querySelector("#cancelEditButton"),
  monthTotal: document.querySelector("#monthTotal"),
  dailyAverage: document.querySelector("#dailyAverage"),
  topCategory: document.querySelector("#topCategory"),
  transactionCount: document.querySelector("#transactionCount"),
  trendDelta: document.querySelector("#trendDelta"),
  trendChart: document.querySelector("#trendChart"),
  categoryBreakdown: document.querySelector("#categoryBreakdown"),
  expenseTable: document.querySelector("#expenseTable"),
  emptyState: document.querySelector("#emptyState"),
  searchInput: document.querySelector("#searchInput"),
  monthFilter: document.querySelector("#monthFilter"),
  categoryFilter: document.querySelector("#categoryFilter"),
};

initialize();

function initialize() {
  populateCategories();
  elements.currencySelect.value = state.settings.currency;
  elements.monthFilter.value = state.filters.month;
  elements.dateInput.valueAsDate = new Date();
  bindEvents();
  render();

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function bindEvents() {
  elements.form.addEventListener("submit", handleSubmit);
  elements.cancelEditButton.addEventListener("click", resetForm);
  elements.currencySelect.addEventListener("change", () => {
    state.settings.currency = elements.currencySelect.value;
    saveSettings();
    render();
  });
  elements.exportButton.addEventListener("click", exportExpenses);
  elements.searchInput.addEventListener("input", () => {
    state.filters.search = elements.searchInput.value.trim().toLowerCase();
    renderTransactions();
  });
  elements.monthFilter.addEventListener("change", () => {
    state.filters.month = elements.monthFilter.value;
    render();
  });
  elements.categoryFilter.addEventListener("change", () => {
    state.filters.category = elements.categoryFilter.value;
    renderTransactions();
  });
  elements.expenseTable.addEventListener("click", handleTableClick);
}

function populateCategories() {
  elements.categoryInput.innerHTML = categories.map((category) => {
    return `<option value="${category.name}">${category.name}</option>`;
  }).join("");

  elements.categoryFilter.innerHTML = [
    `<option value="All">All categories</option>`,
    ...categories.map((category) => `<option value="${category.name}">${category.name}</option>`),
  ].join("");
}

function handleSubmit(event) {
  event.preventDefault();

  const expense = {
    id: elements.expenseId.value || createId(),
    description: elements.descriptionInput.value.trim(),
    amount: Number(elements.amountInput.value),
    date: elements.dateInput.value,
    category: elements.categoryInput.value,
    notes: elements.notesInput.value.trim(),
  };

  if (!expense.description || !expense.date || !expense.category || expense.amount <= 0) {
    return;
  }

  const existingIndex = state.expenses.findIndex((item) => item.id === expense.id);
  if (existingIndex >= 0) {
    state.expenses[existingIndex] = expense;
  } else {
    state.expenses.unshift(expense);
  }

  saveExpenses();
  resetForm();
  render();
}

function handleTableClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  const expense = state.expenses.find((item) => item.id === button.dataset.id);
  if (!expense) {
    return;
  }

  if (button.dataset.action === "edit") {
    editExpense(expense);
  }

  if (button.dataset.action === "delete") {
    state.expenses = state.expenses.filter((item) => item.id !== expense.id);
    saveExpenses();
    render();
  }
}

function editExpense(expense) {
  elements.expenseId.value = expense.id;
  elements.descriptionInput.value = expense.description;
  elements.amountInput.value = expense.amount;
  elements.dateInput.value = expense.date;
  elements.categoryInput.value = expense.category;
  elements.notesInput.value = expense.notes || "";
  elements.formTitle.textContent = "Edit Expense";
  elements.submitButton.innerHTML = `<i data-lucide="save" aria-hidden="true"></i> Save Changes`;
  elements.cancelEditButton.classList.remove("hidden");
  elements.descriptionInput.focus();

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function resetForm() {
  elements.form.reset();
  elements.expenseId.value = "";
  elements.dateInput.valueAsDate = new Date();
  elements.formTitle.textContent = "Add Expense";
  elements.submitButton.innerHTML = `<i data-lucide="plus" aria-hidden="true"></i> Add Expense`;
  elements.cancelEditButton.classList.add("hidden");

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function render() {
  const monthExpenses = expensesForMonth(state.filters.month);
  const totalsByCategory = groupByCategory(monthExpenses);
  const total = sum(monthExpenses);
  const daysInMonth = getDaysInMonth(state.filters.month);
  const topCategory = Object.entries(totalsByCategory).sort((a, b) => b[1] - a[1])[0];

  elements.monthTotal.textContent = formatCurrency(total);
  elements.dailyAverage.textContent = formatCurrency(total / daysInMonth);
  elements.topCategory.textContent = topCategory ? topCategory[0] : "None";
  elements.transactionCount.textContent = String(monthExpenses.length);

  renderTrend();
  renderCategories(totalsByCategory, total);
  renderTransactions();
}

function renderTrend() {
  const months = getLastMonths(6);
  const totals = months.map((month) => sum(expensesForMonth(month.value)));
  const max = Math.max(...totals, 1);
  const current = totals[totals.length - 1] || 0;
  const previous = totals[totals.length - 2] || 0;
  const delta = previous === 0 ? current : ((current - previous) / previous) * 100;

  elements.trendDelta.textContent = previous === 0 && current === 0
    ? "No change"
    : `${delta >= 0 ? "+" : ""}${Math.round(delta)}% vs last month`;

  elements.trendChart.innerHTML = months.map((month, index) => {
    const height = Math.max((totals[index] / max) * 100, totals[index] > 0 ? 6 : 0);
    return `
      <div class="bar-item">
        <div class="bar-track" title="${month.label}: ${formatCurrency(totals[index])}">
          <div class="bar-fill" style="height: ${height}%"></div>
        </div>
        <div class="bar-label">
          <span>${month.short}</span>
          <strong>${compactCurrency(totals[index])}</strong>
        </div>
      </div>
    `;
  }).join("");
}

function renderCategories(totalsByCategory, total) {
  const rows = categories
    .map((category) => ({
      ...category,
      total: totalsByCategory[category.name] || 0,
    }))
    .filter((category) => category.total > 0)
    .sort((a, b) => b.total - a.total);

  elements.categoryBreakdown.innerHTML = rows.length ? rows.map((category) => {
    const percent = total ? (category.total / total) * 100 : 0;
    return `
      <div class="category-row">
        <div class="category-name">
          <span class="swatch" style="background:${category.color}"></span>
          <span>${category.name}</span>
        </div>
        <strong>${formatCurrency(category.total)}</strong>
        <div class="category-bar" aria-label="${category.name} ${Math.round(percent)}%">
          <span style="width:${percent}%; background:${category.color}"></span>
        </div>
      </div>
    `;
  }).join("") : `<div class="empty-state"><strong>No category spend</strong><span>Add expenses for this month.</span></div>`;
}

function renderTransactions() {
  const filtered = getFilteredExpenses();
  elements.expenseTable.innerHTML = filtered.map((expense) => {
    const category = categories.find((item) => item.name === expense.category) || categories[categories.length - 1];
    return `
      <tr>
        <td>
          <div class="expense-name">
            <strong>${escapeHtml(expense.description)}</strong>
            ${expense.notes ? `<span>${escapeHtml(expense.notes)}</span>` : ""}
          </div>
        </td>
        <td>
          <span class="chip">
            <span class="swatch" style="background:${category.color}"></span>
            ${expense.category}
          </span>
        </td>
        <td>${formatDate(expense.date)}</td>
        <td class="amount-col"><strong>${formatCurrency(expense.amount)}</strong></td>
        <td class="actions-col">
          <div class="row-actions">
            <button class="icon-button" type="button" data-action="edit" data-id="${expense.id}" aria-label="Edit ${escapeHtml(expense.description)}" title="Edit">
              <i data-lucide="pencil" aria-hidden="true"></i>
            </button>
            <button class="icon-button danger" type="button" data-action="delete" data-id="${expense.id}" aria-label="Delete ${escapeHtml(expense.description)}" title="Delete">
              <i data-lucide="trash-2" aria-hidden="true"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  elements.emptyState.classList.toggle("hidden", filtered.length > 0);

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function getFilteredExpenses() {
  return state.expenses
    .filter((expense) => !state.filters.month || expense.date.startsWith(state.filters.month))
    .filter((expense) => state.filters.category === "All" || expense.category === state.filters.category)
    .filter((expense) => {
      const haystack = `${expense.description} ${expense.category} ${expense.notes || ""}`.toLowerCase();
      return !state.filters.search || haystack.includes(state.filters.search);
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function expensesForMonth(month) {
  return state.expenses.filter((expense) => expense.date.startsWith(month));
}

function groupByCategory(expenses) {
  return expenses.reduce((totals, expense) => {
    totals[expense.category] = (totals[expense.category] || 0) + expense.amount;
    return totals;
  }, {});
}

function sum(expenses) {
  return expenses.reduce((total, expense) => total + Number(expense.amount), 0);
}

function exportExpenses() {
  const payload = JSON.stringify(state.expenses, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "faststack-expenses.json";
  link.click();
  URL.revokeObjectURL(url);
}

function loadExpenses() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return sampleExpenses;
  }

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : sampleExpenses;
  } catch {
    return sampleExpenses;
  }
}

function saveExpenses() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.expenses));
}

function loadSettings() {
  const defaults = { currency: "USD" };
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (!stored) {
    return defaults;
  }

  try {
    return { ...defaults, ...JSON.parse(stored) };
  } catch {
    return defaults;
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
}

function createExpense(description, amount, category, date, notes) {
  return {
    id: createId(),
    description,
    amount,
    category,
    date,
    notes,
  };
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `expense-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return toDateInputValue(date);
}

function getCurrentMonth() {
  return toDateInputValue(new Date()).slice(0, 7);
}

function getLastMonths(count) {
  const formatter = new Intl.DateTimeFormat("en", { month: "short", year: "numeric" });
  const months = [];
  const date = new Date();
  date.setDate(1);

  for (let index = count - 1; index >= 0; index -= 1) {
    const monthDate = new Date(date.getFullYear(), date.getMonth() - index, 1);
    months.push({
      value: toDateInputValue(monthDate).slice(0, 7),
      label: formatter.format(monthDate),
      short: new Intl.DateTimeFormat("en", { month: "short" }).format(monthDate),
    });
  }

  return months;
}

function getDaysInMonth(month) {
  const [year, monthIndex] = month.split("-").map(Number);
  return new Date(year, monthIndex, 0).getDate();
}

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: state.settings.currency,
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value || 0);
}

function compactCurrency(value) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: state.settings.currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value || 0);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
