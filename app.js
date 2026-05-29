const EXPENSE_STORAGE_KEY = "faststack-sheet-expenses-v1";
const CASH_IN_STORAGE_KEY = "faststack-sheet-cash-in-v1";
const GROUP_STORAGE_KEY = "faststack-sheet-groups-v1";
const SETTINGS_KEY = "faststack-sheet-settings-v1";
const AUTH_STORAGE_KEY = "faststack-authenticated-v1";
const CUSTOM_GROUP_VALUE = "__custom_group__";
const APP_PASSWORD_HASH = "0b92dc7e21beb26e28f120e2e198b996cb45b869728be048b5bc7737a552fe01";

const defaultGroups = [];

const colorPool = [
  "#0f766e",
  "#2563eb",
  "#d97706",
  "#7c3aed",
  "#db2777",
  "#16a34a",
  "#0891b2",
  "#c24135",
  "#475569",
];

const sampleCashIns = [];
const sampleExpenses = [];

const state = {
  expenses: loadExpenses(),
  cashIns: loadCashIns(),
  groups: [],
  settings: loadSettings(),
  mode: "expense",
  dashboardBooted: false,
  filters: {
    search: "",
    week: getCurrentWeek(),
    group: "All",
  },
};

state.groups = loadGroups();

const elements = {
  appShell: document.querySelector("#appShell"),
  loginScreen: document.querySelector("#loginScreen"),
  loginForm: document.querySelector("#loginForm"),
  passwordInput: document.querySelector("#passwordInput"),
  loginMessage: document.querySelector("#loginMessage"),
  currencySelect: document.querySelector("#currencySelect"),
  exportButton: document.querySelector("#exportButton"),
  logoutButton: document.querySelector("#logoutButton"),
  form: document.querySelector("#expenseForm"),
  expenseId: document.querySelector("#expenseId"),
  descriptionInput: document.querySelector("#descriptionInput"),
  descriptionLabel: document.querySelector("#descriptionLabel"),
  amountInput: document.querySelector("#amountInput"),
  dateInput: document.querySelector("#dateInput"),
  timeInput: document.querySelector("#timeInput"),
  categoryInput: document.querySelector("#categoryInput"),
  categoryLabel: document.querySelector("#categoryLabel"),
  customGroupField: document.querySelector("#customGroupField"),
  customGroupInput: document.querySelector("#customGroupInput"),
  notesInput: document.querySelector("#notesInput"),
  formTitle: document.querySelector("#formTitle"),
  submitButton: document.querySelector("#submitButton"),
  formMessage: document.querySelector("#formMessage"),
  cancelEditButton: document.querySelector("#cancelEditButton"),
  expenseModeButton: document.querySelector("#expenseModeButton"),
  cashInModeButton: document.querySelector("#cashInModeButton"),
  weekTotal: document.querySelector("#weekTotal"),
  cashInTotal: document.querySelector("#cashInTotal"),
  runningBalance: document.querySelector("#runningBalance"),
  activeGroups: document.querySelector("#activeGroups"),
  trendDelta: document.querySelector("#trendDelta"),
  trendChart: document.querySelector("#trendChart"),
  categoryBreakdown: document.querySelector("#categoryBreakdown"),
  projectGroupSelect: document.querySelector("#projectGroupSelect"),
  projectNameLabel: document.querySelector("#projectNameLabel"),
  groupLedgerCashIn: document.querySelector("#groupLedgerCashIn"),
  groupLedgerCashOut: document.querySelector("#groupLedgerCashOut"),
  groupLedgerBalance: document.querySelector("#groupLedgerBalance"),
  groupLedgerTable: document.querySelector("#groupLedgerTable"),
  groupLedgerEmptyState: document.querySelector("#groupLedgerEmptyState"),
  dailyBreakdown: document.querySelector("#dailyBreakdown"),
  expenseTable: document.querySelector("#expenseTable"),
  cashInTable: document.querySelector("#cashInTable"),
  emptyState: document.querySelector("#emptyState"),
  cashInEmptyState: document.querySelector("#cashInEmptyState"),
  searchInput: document.querySelector("#searchInput"),
  weekFilter: document.querySelector("#weekFilter"),
  categoryFilter: document.querySelector("#categoryFilter"),
  detailModal: document.querySelector("#detailModal"),
  detailCloseButton: document.querySelector("#detailCloseButton"),
  detailType: document.querySelector("#detailType"),
  detailTitle: document.querySelector("#detailTitle"),
  detailGroup: document.querySelector("#detailGroup"),
  detailDateTime: document.querySelector("#detailDateTime"),
  detailCashIn: document.querySelector("#detailCashIn"),
  detailCashOut: document.querySelector("#detailCashOut"),
  detailDescription: document.querySelector("#detailDescription"),
  detailNotes: document.querySelector("#detailNotes"),
};

initialize();

function initialize() {
  bindAuthEvents();
  setAuthenticated(isAuthenticated());
  if (!isAuthenticated()) {
    refreshIcons();
    return;
  }

  bootDashboard();
}

function bootDashboard() {
  populateGroupControls();
  elements.currencySelect.value = state.settings.currency;
  elements.weekFilter.value = state.filters.week;
  setCurrentISTDateTime();
  if (!state.dashboardBooted) {
    bindEvents();
    state.dashboardBooted = true;
  }
  setMode("expense");
  render();
}

function bindAuthEvents() {
  elements.loginForm.addEventListener("submit", handleLogin);
  elements.logoutButton.addEventListener("click", () => {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    setAuthenticated(false);
    elements.passwordInput.value = "";
    elements.loginMessage.textContent = "";
    elements.passwordInput.focus();
  });
}

function bindEvents() {
  elements.form.addEventListener("submit", handleSubmit);
  elements.cancelEditButton.addEventListener("click", resetForm);
  elements.expenseModeButton.addEventListener("click", () => setMode("expense"));
  elements.cashInModeButton.addEventListener("click", () => setMode("cash-in"));
  elements.categoryInput.addEventListener("change", toggleCustomGroup);
  elements.currencySelect.addEventListener("change", () => {
    state.settings.currency = elements.currencySelect.value;
    saveSettings();
    render();
  });
  elements.exportButton.addEventListener("click", exportData);
  elements.searchInput.addEventListener("input", () => {
    state.filters.search = elements.searchInput.value.trim().toLowerCase();
    renderTransactions();
    renderCashIns();
  });
  elements.weekFilter.addEventListener("change", () => {
    state.filters.week = elements.weekFilter.value || getCurrentWeek();
    render();
  });
  elements.categoryFilter.addEventListener("change", () => {
    state.filters.group = elements.categoryFilter.value;
    renderTransactions();
    renderCashIns();
    renderDailyBreakdown();
  });
  elements.projectGroupSelect.addEventListener("change", renderGroupLedger);
  elements.groupLedgerTable.addEventListener("click", handleDetailClick);
  elements.detailCloseButton.addEventListener("click", closeDetailModal);
  elements.detailModal.addEventListener("click", (event) => {
    if (event.target === elements.detailModal) {
      closeDetailModal();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.detailModal.classList.contains("hidden")) {
      closeDetailModal();
    }
  });
  elements.expenseTable.addEventListener("click", handleExpenseTableClick);
  elements.cashInTable.addEventListener("click", handleCashInTableClick);
}

async function handleLogin(event) {
  event.preventDefault();
  const password = elements.passwordInput.value;
  const passwordHash = await sha256(password);

  if (passwordHash !== APP_PASSWORD_HASH) {
    elements.loginMessage.textContent = "Incorrect password.";
    elements.loginMessage.classList.add("error");
    return;
  }

  sessionStorage.setItem(AUTH_STORAGE_KEY, "true");
  elements.loginMessage.textContent = "";
  elements.loginMessage.classList.remove("error");
  setAuthenticated(true);
  bootDashboard();
}

function setAuthenticated(authenticated) {
  elements.loginScreen.classList.toggle("hidden", authenticated);
  elements.appShell.classList.toggle("hidden", !authenticated);
}

function isAuthenticated() {
  return sessionStorage.getItem(AUTH_STORAGE_KEY) === "true";
}

function setMode(mode) {
  state.mode = mode;
  const isCashIn = mode === "cash-in";

  elements.expenseModeButton.classList.toggle("active", !isCashIn);
  elements.cashInModeButton.classList.toggle("active", isCashIn);
  elements.expenseModeButton.setAttribute("aria-selected", String(!isCashIn));
  elements.cashInModeButton.setAttribute("aria-selected", String(isCashIn));
  elements.descriptionLabel.textContent = isCashIn ? "Source" : "Description";
  elements.descriptionInput.placeholder = isCashIn ? "Owner transfer, client advance, reimbursement" : "Meals, supplies, taxi, software";
  elements.categoryLabel.textContent = isCashIn ? "Allocate To" : "Expense Group";
  elements.formTitle.textContent = isCashIn ? "Add Cash In" : "Add Expense";
  elements.submitButton.innerHTML = isCashIn
    ? `<i data-lucide="arrow-down-to-line" aria-hidden="true"></i> Add Cash In`
    : `<i data-lucide="plus" aria-hidden="true"></i> Add Expense`;

  elements.expenseId.value = "";
  elements.cancelEditButton.classList.add("hidden");
  toggleCustomGroup();
  refreshIcons();
}

function populateGroupControls() {
  const options = state.groups.map((group) => {
    return `<option value="${escapeAttribute(group.name)}">${escapeHtml(group.name)}</option>`;
  }).join("");

  elements.categoryInput.innerHTML = `${options}<option value="${CUSTOM_GROUP_VALUE}">+ Custom group</option>`;
  if (!state.groups.length) {
    elements.categoryInput.value = CUSTOM_GROUP_VALUE;
  }
  elements.categoryFilter.innerHTML = [
    `<option value="All">All groups</option>`,
    ...state.groups.map((group) => `<option value="${escapeAttribute(group.name)}">${escapeHtml(group.name)}</option>`),
  ].join("");
  elements.categoryFilter.value = state.filters.group;

  const selectedGroup = elements.projectGroupSelect.value || getDefaultProjectGroup();
  elements.projectGroupSelect.innerHTML = state.groups.length ? state.groups.map((group) => {
    return `<option value="${escapeAttribute(group.name)}">${escapeHtml(group.name)}</option>`;
  }).join("") : `<option value="">No project yet</option>`;
  elements.projectGroupSelect.value = state.groups.some((group) => group.name === selectedGroup)
    ? selectedGroup
    : getDefaultProjectGroup();
  elements.projectGroupSelect.disabled = state.groups.length === 0;
}

function toggleCustomGroup() {
  const isCustom = elements.categoryInput.value === CUSTOM_GROUP_VALUE;
  elements.customGroupField.classList.toggle("hidden", !isCustom);
  elements.customGroupInput.required = isCustom;
}

function handleSubmit(event) {
  event.preventDefault();

  const group = resolveSelectedGroup();
  const currentMode = state.mode;
  const transaction = {
    id: elements.expenseId.value || createId(currentMode === "cash-in" ? "cash-in" : "expense"),
    description: elements.descriptionInput.value.trim(),
    amount: Number(elements.amountInput.value),
    date: elements.dateInput.value,
    time: elements.timeInput.value,
    category: group,
    notes: elements.notesInput.value.trim(),
  };

  if (!transaction.description || !transaction.date || !transaction.time || !transaction.category || transaction.amount <= 0) {
    showFormMessage("Please complete the required fields.", true);
    return;
  }

  if (currentMode === "cash-in") {
    upsertTransaction(state.cashIns, transaction);
    saveCashIns();
  } else {
    upsertTransaction(state.expenses, transaction);
    saveExpenses();
  }

  state.filters.week = getWeekValue(new Date(`${transaction.date}T00:00:00`));
  state.filters.group = "All";
  elements.weekFilter.value = state.filters.week;
  elements.categoryFilter.value = state.filters.group;

  resetForm();
  setMode(currentMode);
  showFormMessage(currentMode === "cash-in" ? "Cash In added and allocated." : "Expense added.");
  render();
}

function upsertTransaction(collection, transaction) {
  const existingIndex = collection.findIndex((item) => item.id === transaction.id);
  if (existingIndex >= 0) {
    collection[existingIndex] = transaction;
  } else {
    collection.unshift(transaction);
  }
}

function resolveSelectedGroup() {
  if (elements.categoryInput.value !== CUSTOM_GROUP_VALUE) {
    return elements.categoryInput.value;
  }

  const name = elements.customGroupInput.value.trim();
  if (!name) {
    return "";
  }

  ensureGroup(name);
  return name;
}

function handleExpenseTableClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  const expense = state.expenses.find((item) => item.id === button.dataset.id);
  if (!expense) {
    return;
  }

  if (button.dataset.action === "edit") {
    editTransaction(expense, "expense");
  }

  if (button.dataset.action === "delete") {
    state.expenses = state.expenses.filter((item) => item.id !== expense.id);
    saveExpenses();
    render();
  }
}

function handleCashInTableClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  const cashIn = state.cashIns.find((item) => item.id === button.dataset.id);
  if (!cashIn) {
    return;
  }

  if (button.dataset.action === "edit") {
    editTransaction(cashIn, "cash-in");
  }

  if (button.dataset.action === "delete") {
    state.cashIns = state.cashIns.filter((item) => item.id !== cashIn.id);
    saveCashIns();
    render();
  }
}

function editTransaction(transaction, mode) {
  setMode(mode);
  ensureGroup(transaction.category);
  populateGroupControls();
  elements.categoryInput.value = transaction.category;
  elements.expenseId.value = transaction.id;
  elements.descriptionInput.value = transaction.description;
  elements.amountInput.value = transaction.amount;
  elements.dateInput.value = transaction.date;
  elements.timeInput.value = transaction.time || getCurrentISTTime();
  elements.notesInput.value = transaction.notes || "";
  elements.formTitle.textContent = mode === "cash-in" ? "Edit Cash In" : "Edit Expense";
  elements.submitButton.innerHTML = `<i data-lucide="save" aria-hidden="true"></i> Save Changes`;
  elements.cancelEditButton.classList.remove("hidden");
  elements.descriptionInput.focus();
  toggleCustomGroup();
  refreshIcons();
}

function resetForm() {
  elements.form.reset();
  elements.expenseId.value = "";
  setCurrentISTDateTime();
  elements.customGroupField.classList.add("hidden");
  elements.customGroupInput.required = false;
  elements.formMessage.textContent = "";
  elements.formMessage.classList.remove("error");
  populateGroupControls();
  setMode(state.mode);
}

function showFormMessage(message, isError = false) {
  elements.formMessage.textContent = message;
  elements.formMessage.classList.toggle("error", isError);
}

function render() {
  const weeklyExpenses = expensesForWeek(state.filters.week);
  const weeklyCashIns = cashInsForWeek(state.filters.week);
  const totalExpenses = sum(state.expenses);
  const totalCashIn = sum(state.cashIns);
  const groupSummaries = getGroupSummaries();
  const activeGroupCount = groupSummaries.filter((group) => group.allocated > 0 || group.spent > 0).length;

  elements.weekTotal.textContent = formatCurrency(sum(weeklyExpenses));
  elements.cashInTotal.textContent = formatCurrency(sum(weeklyCashIns));
  elements.runningBalance.textContent = formatCurrency(totalCashIn - totalExpenses);
  elements.activeGroups.textContent = String(activeGroupCount);

  renderTrend();
  renderBudgets(groupSummaries);
  renderGroupLedger();
  renderDailyBreakdown();
  renderTransactions();
  renderCashIns();
  refreshIcons();
}

function renderGroupLedger() {
  if (!state.groups.length) {
    elements.projectNameLabel.textContent = "-";
    elements.groupLedgerTable.innerHTML = "";
    elements.groupLedgerCashIn.textContent = formatCurrency(0);
    elements.groupLedgerCashOut.textContent = formatCurrency(0);
    elements.groupLedgerBalance.textContent = formatCurrency(0);
    elements.groupLedgerEmptyState.classList.remove("hidden");
    return;
  }

  if (!elements.projectGroupSelect.value) {
    elements.projectGroupSelect.value = getDefaultProjectGroup();
  }

  const groupName = elements.projectGroupSelect.value;
  const entries = getGroupLedgerEntries(groupName);
  const totalIn = sum(entries.filter((entry) => entry.type === "cash-in"));
  const totalOut = sum(entries.filter((entry) => entry.type === "expense"));
  const balance = totalIn - totalOut;

  elements.projectNameLabel.textContent = groupName;
  elements.groupLedgerCashIn.textContent = formatCurrency(totalIn);
  elements.groupLedgerCashOut.textContent = formatCurrency(totalOut);
  elements.groupLedgerBalance.textContent = formatCurrency(balance);
  elements.groupLedgerBalance.classList.toggle("balance-negative", balance < 0);
  elements.groupLedgerBalance.classList.toggle("balance-positive", balance >= 0);

  let runningBalance = 0;
  elements.groupLedgerTable.innerHTML = entries.map((entry) => {
    runningBalance += entry.type === "cash-in" ? entry.amount : -entry.amount;
    const isCashIn = entry.type === "cash-in";
    const balanceClass = runningBalance < 0 ? "balance-negative" : "balance-positive";
    return `
      <tr>
        <td>${formatDateTime(entry.date, entry.time)}</td>
        <td class="amount-col cash-in-value">${isCashIn ? formatCurrency(entry.amount) : ""}</td>
        <td class="amount-col cash-out-value">${isCashIn ? "" : formatCurrency(entry.amount)}</td>
        <td class="amount-col ${balanceClass}">${formatCurrency(runningBalance)}</td>
        <td>
          <button class="des-button" type="button" data-action="view-details" data-type="${entry.type}" data-id="${escapeAttribute(entry.id)}" title="View details">
            <span class="des-text">${escapeHtml(entry.description)}</span>
          </button>
        </td>
      </tr>
    `;
  }).join("");

  elements.groupLedgerEmptyState.classList.toggle("hidden", entries.length > 0);
  refreshIcons();
}

function renderTrend() {
  const weeks = getLastWeeks(6, state.filters.week);
  const totals = weeks.map((week) => sum(expensesForWeek(week.value)));
  const max = Math.max(...totals, 1);
  const current = totals[totals.length - 1] || 0;
  const previous = totals[totals.length - 2] || 0;
  const delta = previous === 0 ? current : ((current - previous) / previous) * 100;

  elements.trendDelta.textContent = previous === 0 && current === 0
    ? "No change"
    : `${delta >= 0 ? "+" : ""}${Math.round(delta)}% vs last week`;

  elements.trendChart.innerHTML = weeks.map((week, index) => {
    const height = Math.max((totals[index] / max) * 100, totals[index] > 0 ? 6 : 0);
    return `
      <div class="bar-item">
        <div class="bar-track" title="${week.label}: ${formatCurrency(totals[index])}">
          <div class="bar-fill" style="height: ${height}%"></div>
        </div>
        <div class="bar-label">
          <span>${week.short}</span>
          <strong>${compactCurrency(totals[index])}</strong>
        </div>
      </div>
    `;
  }).join("");
}

function renderBudgets(groupSummaries) {
  const rows = groupSummaries
    .filter((group) => group.allocated > 0 || group.spent > 0)
    .sort((a, b) => b.allocated - a.allocated || b.spent - a.spent);

  elements.categoryBreakdown.innerHTML = rows.length ? rows.map((group) => {
    const percent = group.allocated > 0 ? Math.min((group.spent / group.allocated) * 100, 100) : 100;
    const remainingClass = group.remaining < 0 ? "over-budget" : "";
    return `
      <div class="budget-row">
        <div class="category-row">
          <div class="category-name">
            <span class="swatch" style="background:${group.color}"></span>
            <span>${escapeHtml(group.name)}</span>
          </div>
          <strong class="${remainingClass}">${formatCurrency(group.remaining)}</strong>
          <div class="category-bar" aria-label="${escapeAttribute(group.name)} ${Math.round(percent)}%">
            <span style="width:${percent}%; background:${group.color}"></span>
          </div>
        </div>
        <div class="budget-stats">
          <span>Allocated <strong>${formatCurrency(group.allocated)}</strong></span>
          <span>Spent <strong>${formatCurrency(group.spent)}</strong></span>
        </div>
      </div>
    `;
  }).join("") : `<div class="empty-state"><strong>No allocations yet</strong><span>Add Cash In and choose a group.</span></div>`;
}

function renderDailyBreakdown() {
  const expenses = getFilteredExpenses();
  const grouped = groupExpensesByDate(expenses);

  elements.dailyBreakdown.innerHTML = grouped.length ? grouped.map(([date, items]) => {
    const total = sum(items);
    return `
      <article class="day-group">
        <header>
          <div>
            <strong>${formatDate(date)}</strong>
            <span>${items.length} ${items.length === 1 ? "expense" : "expenses"}</span>
          </div>
          <strong>${formatCurrency(total)}</strong>
        </header>
        <div class="day-items">
          ${items.map((expense) => {
            const group = getGroup(expense.category);
            return `
              <div class="day-item">
                <span class="swatch" style="background:${group.color}"></span>
                <span>${escapeHtml(expense.description)}</span>
                <strong>${formatCurrency(expense.amount)}</strong>
              </div>
            `;
          }).join("")}
        </div>
      </article>
    `;
  }).join("") : `<div class="empty-state"><strong>No daily expenses</strong><span>Add expenses or adjust the week and group filters.</span></div>`;
}

function renderTransactions() {
  const filtered = getFilteredExpenses();
  elements.expenseTable.innerHTML = filtered.map((expense) => {
    const group = getGroup(expense.category);
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
            <span class="swatch" style="background:${group.color}"></span>
            ${escapeHtml(expense.category)}
          </span>
        </td>
        <td>${formatDate(expense.date)}</td>
        <td class="amount-col"><strong>${formatCurrency(expense.amount)}</strong></td>
        <td class="actions-col">
          <div class="row-actions">
            <button class="icon-button" type="button" data-action="edit" data-id="${escapeAttribute(expense.id)}" aria-label="Edit ${escapeAttribute(expense.description)}" title="Edit">
              <i data-lucide="pencil" aria-hidden="true"></i>
            </button>
            <button class="icon-button danger" type="button" data-action="delete" data-id="${escapeAttribute(expense.id)}" aria-label="Delete ${escapeAttribute(expense.description)}" title="Delete">
              <i data-lucide="trash-2" aria-hidden="true"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  elements.emptyState.classList.toggle("hidden", filtered.length > 0);
  refreshIcons();
}

function handleDetailClick(event) {
  const button = event.target.closest("button[data-action='view-details']");
  if (!button) {
    return;
  }

  const collection = button.dataset.type === "cash-in" ? state.cashIns : state.expenses;
  const transaction = collection.find((entry) => entry.id === button.dataset.id);
  if (transaction) {
    openDetailModal(transaction, button.dataset.type);
  }
}

function openDetailModal(transaction, type) {
  const isCashIn = type === "cash-in";
  elements.detailType.textContent = isCashIn ? "Cash In Details" : "Cash-Out Details";
  elements.detailTitle.textContent = transaction.description;
  elements.detailGroup.textContent = transaction.category;
  elements.detailDateTime.textContent = formatDateTime(transaction.date, transaction.time);
  elements.detailCashIn.textContent = isCashIn ? formatCurrency(transaction.amount) : "-";
  elements.detailCashOut.textContent = isCashIn ? "-" : formatCurrency(transaction.amount);
  elements.detailDescription.textContent = transaction.description;
  elements.detailNotes.textContent = transaction.notes || "No additional notes.";
  elements.detailModal.classList.remove("hidden");
  elements.detailCloseButton.focus();
}

function closeDetailModal() {
  elements.detailModal.classList.add("hidden");
}

function renderCashIns() {
  const filtered = getFilteredCashIns();
  elements.cashInTable.innerHTML = filtered.map((cashIn) => {
    const group = getGroup(cashIn.category);
    return `
      <tr>
        <td>
          <div class="expense-name">
            <strong>${escapeHtml(cashIn.description)}</strong>
            ${cashIn.notes ? `<span>${escapeHtml(cashIn.notes)}</span>` : ""}
          </div>
        </td>
        <td>
          <span class="chip">
            <span class="swatch" style="background:${group.color}"></span>
            ${escapeHtml(cashIn.category)}
          </span>
        </td>
        <td>${formatDate(cashIn.date)}</td>
        <td class="amount-col positive-amount"><strong>${formatCurrency(cashIn.amount)}</strong></td>
        <td class="actions-col">
          <div class="row-actions">
            <button class="icon-button" type="button" data-action="edit" data-id="${escapeAttribute(cashIn.id)}" aria-label="Edit ${escapeAttribute(cashIn.description)}" title="Edit">
              <i data-lucide="pencil" aria-hidden="true"></i>
            </button>
            <button class="icon-button danger" type="button" data-action="delete" data-id="${escapeAttribute(cashIn.id)}" aria-label="Delete ${escapeAttribute(cashIn.description)}" title="Delete">
              <i data-lucide="trash-2" aria-hidden="true"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  elements.cashInEmptyState.classList.toggle("hidden", filtered.length > 0);
  refreshIcons();
}

function getFilteredExpenses() {
  return state.expenses
    .filter((expense) => !state.filters.week || isDateInWeek(expense.date, state.filters.week))
    .filter((expense) => state.filters.group === "All" || expense.category === state.filters.group)
    .filter((expense) => matchesSearch(expense))
    .sort(sortByDateDesc);
}

function getFilteredCashIns() {
  return state.cashIns
    .filter((cashIn) => !state.filters.week || isDateInWeek(cashIn.date, state.filters.week))
    .filter((cashIn) => state.filters.group === "All" || cashIn.category === state.filters.group)
    .filter((cashIn) => matchesSearch(cashIn))
    .sort(sortByDateDesc);
}

function matchesSearch(transaction) {
  const haystack = `${transaction.description} ${transaction.category} ${transaction.notes || ""}`.toLowerCase();
  return !state.filters.search || haystack.includes(state.filters.search);
}

function expensesForWeek(week) {
  return state.expenses.filter((expense) => isDateInWeek(expense.date, week));
}

function cashInsForWeek(week) {
  return state.cashIns.filter((cashIn) => isDateInWeek(cashIn.date, week));
}

function getGroupSummaries() {
  return state.groups.map((group) => {
    const allocated = sum(state.cashIns.filter((cashIn) => cashIn.category === group.name));
    const spent = sum(state.expenses.filter((expense) => expense.category === group.name));
    return {
      ...group,
      allocated,
      spent,
      remaining: allocated - spent,
    };
  });
}

function getGroupLedgerEntries(groupName) {
  const cashInEntries = state.cashIns
    .filter((cashIn) => cashIn.category === groupName)
    .map((cashIn) => ({ ...cashIn, type: "cash-in" }));
  const expenseEntries = state.expenses
    .filter((expense) => expense.category === groupName)
    .map((expense) => ({ ...expense, type: "expense" }));

  return [...cashInEntries, ...expenseEntries].sort(sortLedgerAsc);
}

function getDefaultProjectGroup() {
  const activeGroup = getGroupSummaries()
    .filter((group) => group.allocated > 0 || group.spent > 0)
    .sort((a, b) => b.allocated - a.allocated || b.spent - a.spent)[0];

  return activeGroup ? activeGroup.name : state.groups[0]?.name || "";
}

function groupExpensesByDate(expenses) {
  const grouped = expenses.reduce((days, expense) => {
    if (!days[expense.date]) {
      days[expense.date] = [];
    }
    days[expense.date].push(expense);
    return days;
  }, {});

  return Object.entries(grouped).sort((a, b) => new Date(`${b[0]}T00:00:00`) - new Date(`${a[0]}T00:00:00`));
}

function sum(transactions) {
  return transactions.reduce((total, transaction) => total + Number(transaction.amount), 0);
}

function sortByDateDesc(a, b) {
  return getTransactionDate(b) - getTransactionDate(a);
}

function sortLedgerAsc(a, b) {
  return getTransactionDate(a) - getTransactionDate(b);
}

function getTransactionDate(transaction) {
  return new Date(`${transaction.date}T${transaction.time || "00:00"}:00`);
}

function ensureGroup(name) {
  const normalized = name.trim();
  if (!normalized) {
    return;
  }

  const exists = state.groups.some((group) => group.name.toLowerCase() === normalized.toLowerCase());
  if (exists) {
    return;
  }

  state.groups.push({
    name: normalized,
    color: colorPool[state.groups.length % colorPool.length],
  });
  saveGroups();
  populateGroupControls();
}

function getGroup(name) {
  const group = state.groups.find((item) => item.name === name);
  if (group) {
    return group;
  }

  ensureGroup(name);
  return state.groups.find((item) => item.name === name) || defaultGroups[defaultGroups.length - 1];
}

function exportData() {
  const payload = JSON.stringify({
    expenses: state.expenses,
    cashIns: state.cashIns,
    groups: state.groups,
    settings: state.settings,
  }, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "faststack-budget-tracker.json";
  link.click();
  URL.revokeObjectURL(url);
}

function loadExpenses() {
  const stored = localStorage.getItem(EXPENSE_STORAGE_KEY);
  if (!stored) {
    return sampleExpenses;
  }

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.map(normalizeTransaction) : sampleExpenses;
  } catch {
    return sampleExpenses;
  }
}

function loadCashIns() {
  const stored = localStorage.getItem(CASH_IN_STORAGE_KEY);
  if (!stored) {
    return sampleCashIns;
  }

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.map(normalizeTransaction) : sampleCashIns;
  } catch {
    return sampleCashIns;
  }
}

function loadGroups() {
  const stored = localStorage.getItem(GROUP_STORAGE_KEY);
  const storedGroups = safeParseArray(stored).map(normalizeGroup);
  const transactionGroups = [...state.expenses, ...state.cashIns]
    .map((transaction) => transaction.category)
    .filter(Boolean)
    .map((name, index) => ({ name, color: colorPool[index % colorPool.length] }));

  return dedupeGroups([...defaultGroups, ...storedGroups, ...transactionGroups]);
}

function safeParseArray(value) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeTransaction(transaction) {
  return {
    id: transaction.id || createId("transaction"),
    description: transaction.description || "Untitled",
    amount: Number(transaction.amount) || 0,
    category: transaction.category || transaction.group || "Other",
    date: transaction.date || getCurrentISTDate(),
    time: transaction.time || "00:00",
    notes: transaction.notes || "",
  };
}

function normalizeGroup(group, index = 0) {
  if (typeof group === "string") {
    return {
      name: group,
      color: colorPool[index % colorPool.length],
    };
  }

  return {
    name: group.name || "Other",
    color: group.color || colorPool[index % colorPool.length],
  };
}

function dedupeGroups(groups) {
  const byName = new Map();
  groups.forEach((group, index) => {
    const normalized = normalizeGroup(group, index);
    const key = normalized.name.toLowerCase();
    if (!byName.has(key)) {
      byName.set(key, normalized);
    }
  });
  return Array.from(byName.values());
}

function saveExpenses() {
  localStorage.setItem(EXPENSE_STORAGE_KEY, JSON.stringify(state.expenses));
}

function saveCashIns() {
  localStorage.setItem(CASH_IN_STORAGE_KEY, JSON.stringify(state.cashIns));
}

function saveGroups() {
  localStorage.setItem(GROUP_STORAGE_KEY, JSON.stringify(state.groups));
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

function createExpense(description, amount, category, date, time, notes) {
  return {
    id: createId("expense"),
    description,
    amount,
    category,
    date,
    time,
    notes,
  };
}

function createCashIn(description, amount, category, date, time, notes) {
  return {
    id: createId("cash-in"),
    description,
    amount,
    category,
    date,
    time,
    notes,
  };
}

function createId(prefix) {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return toDateInputValue(date);
}

function getCurrentWeek() {
  return getWeekValue(new Date());
}

function getLastWeeks(count, anchorWeek) {
  const weeks = [];
  const currentStart = getWeekStartFromValue(anchorWeek || getCurrentWeek());

  for (let index = count - 1; index >= 0; index -= 1) {
    const start = addDays(currentStart, index * -7);
    const end = addDays(start, 6);
    const value = getWeekValue(start);
    weeks.push({
      value,
      label: `${formatShortDate(start)} - ${formatShortDate(end)}`,
      short: value.replace("-", " "),
    });
  }

  return weeks;
}

function isDateInWeek(dateValue, weekValue) {
  const start = getWeekStartFromValue(weekValue);
  const end = addDays(start, 7);
  const date = new Date(`${dateValue}T00:00:00`);
  return date >= start && date < end;
}

function getWeekStartFromValue(weekValue) {
  const [yearPart, weekPart] = weekValue.split("-W");
  const year = Number(yearPart);
  const week = Number(weekPart);
  const jan4 = new Date(year, 0, 4);
  const jan4Day = (jan4.getDay() + 6) % 7;
  const weekOneMonday = new Date(year, 0, 4 - jan4Day);
  return addDays(weekOneMonday, (week - 1) * 7);
}

function getWeekValue(date) {
  const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = (normalized.getDay() + 6) % 7;
  const thursday = addDays(normalized, 3 - day);
  const weekYear = thursday.getFullYear();
  const firstThursday = new Date(weekYear, 0, 4);
  const firstDay = (firstThursday.getDay() + 6) % 7;
  const firstWeekThursday = addDays(firstThursday, 3 - firstDay);
  const weekNumber = 1 + Math.round((thursday - firstWeekThursday) / 604800000);
  return `${weekYear}-W${String(weekNumber).padStart(2, "0")}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function setCurrentISTDateTime() {
  elements.dateInput.value = getCurrentISTDate();
  elements.timeInput.value = getCurrentISTTime();
}

function getISTParts() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function getCurrentISTDate() {
  const parts = getISTParts();
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function getCurrentISTTime() {
  const parts = getISTParts();
  return `${parts.hour}:${parts.minute}`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: state.settings.currency,
    maximumFractionDigits: Math.abs(value) >= 1000 ? 0 : 2,
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

function formatDateTime(dateValue, timeValue) {
  const [hours = "00", minutes = "00"] = String(timeValue || "00:00").split(":");
  const date = new Date(`${dateValue}T${hours}:${minutes}:00`);
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatShortDate(date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
