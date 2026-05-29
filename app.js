const SETTINGS_KEY = "faststack-sheet-settings-v1";
const AUTH_TOKEN_KEY = "faststack-google-sheets-token-v1";
const AUTH_USER_KEY = "faststack-google-sheets-user-v1";
const CUSTOM_GROUP_VALUE = "__custom_group__";
const BACKEND_CONFIG = window.FASTSTACK_BACKEND || {};

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

const state = {
  expenses: [],
  cashIns: [],
  groups: [],
  settings: loadSettings(),
  mode: "expense",
  dashboardBooted: false,
  user: null,
  token: null,
  filters: {
    search: "",
    week: getCurrentWeek(),
    group: "All",
  },
};

const elements = {
  appShell: document.querySelector("#appShell"),
  loginScreen: document.querySelector("#loginScreen"),
  loginForm: document.querySelector("#loginForm"),
  emailInput: document.querySelector("#emailInput"),
  passwordInput: document.querySelector("#passwordInput"),
  loginTabButton: document.querySelector("#loginTabButton"),
  signupTabButton: document.querySelector("#signupTabButton"),
  signupForm: document.querySelector("#signupForm"),
  signupEmailInput: document.querySelector("#signupEmailInput"),
  signupPasswordInput: document.querySelector("#signupPasswordInput"),
  signupConfirmInput: document.querySelector("#signupConfirmInput"),
  verifyForm: document.querySelector("#verifyForm"),
  verifyEmailInput: document.querySelector("#verifyEmailInput"),
  verifyCodeInput: document.querySelector("#verifyCodeInput"),
  resendVerificationButton: document.querySelector("#resendVerificationButton"),
  resetRequestForm: document.querySelector("#resetRequestForm"),
  resetEmailInput: document.querySelector("#resetEmailInput"),
  resetPasswordForm: document.querySelector("#resetPasswordForm"),
  resetConfirmEmailInput: document.querySelector("#resetConfirmEmailInput"),
  resetCodeInput: document.querySelector("#resetCodeInput"),
  resetPasswordInput: document.querySelector("#resetPasswordInput"),
  forgotPasswordButton: document.querySelector("#forgotPasswordButton"),
  backToLoginFromResetButton: document.querySelector("#backToLoginFromResetButton"),
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

async function initialize() {
  bindAuthEvents();

  if (!isBackendConfigured()) {
    setAuthenticated(false);
    showAuthMessage("Backend API is not configured. Add your Google Apps Script Web App URL in config.js.", true);
    document.querySelectorAll(".login-panel button, .login-panel input").forEach((control) => {
      control.disabled = true;
    });
    refreshIcons();
    return;
  }

  const storedToken = sessionStorage.getItem(AUTH_TOKEN_KEY);
  const storedUser = readStoredUser();
  if (!storedToken || !storedUser) {
    setAuthenticated(false);
    refreshIcons();
    return;
  }

  state.token = storedToken;
  state.user = storedUser;
  setAuthenticated(true);
  try {
    await bootDashboard();
  } catch (loadError) {
    clearAuthSession();
    showAuthMessage(loadError.message || "Your session expired. Please log in again.", true);
    setAuthenticated(false);
  }
}

async function bootDashboard() {
  await loadRemoteData();
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
  elements.signupForm.addEventListener("submit", handleSignup);
  elements.verifyForm.addEventListener("submit", handleVerifyEmail);
  elements.resetRequestForm.addEventListener("submit", handleResetRequest);
  elements.resetPasswordForm.addEventListener("submit", handleResetPassword);
  elements.loginTabButton.addEventListener("click", () => setAuthView("login"));
  elements.signupTabButton.addEventListener("click", () => setAuthView("signup"));
  elements.forgotPasswordButton.addEventListener("click", () => setAuthView("reset-request"));
  elements.backToLoginFromResetButton.addEventListener("click", () => setAuthView("login"));
  elements.resendVerificationButton.addEventListener("click", handleResendVerification);
  elements.logoutButton.addEventListener("click", async () => {
    if (state.token) {
      try {
        await apiRequest("logout", { token: state.token });
      } catch {
        // Logout must clear the local session even if the network request fails.
      }
    }
    clearAuthSession();
    state.user = null;
    state.token = null;
    state.expenses = [];
    state.cashIns = [];
    state.groups = [];
    setAuthenticated(false);
    elements.emailInput.value = "";
    elements.passwordInput.value = "";
    showAuthMessage("");
    setAuthView("login");
    elements.emailInput.focus();
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
  showAuthMessage("");

  const email = elements.emailInput.value.trim();
  const password = elements.passwordInput.value;

  if (!isGmailAddress(email)) {
    showAuthMessage("Only gmail.com email addresses are allowed.", true);
    return;
  }

  try {
    const result = await apiRequest("login", { email, password });
    state.token = result.token;
    state.user = result.user;
    sessionStorage.setItem(AUTH_TOKEN_KEY, result.token);
    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(result.user));
  } catch (error) {
    showAuthMessage(error.message || "Login failed.", true);
    return;
  }

  showAuthMessage("");
  setAuthenticated(true);
  try {
    await bootDashboard();
  } catch (loadError) {
    clearAuthSession();
    showAuthMessage(loadError.message || "Could not load database data.", true);
    setAuthenticated(false);
  }
}

async function handleSignup(event) {
  event.preventDefault();
  showAuthMessage("");

  const email = elements.signupEmailInput.value.trim();
  const password = elements.signupPasswordInput.value;
  const confirmPassword = elements.signupConfirmInput.value;

  if (!isGmailAddress(email)) {
    showAuthMessage("Only gmail.com email addresses are allowed.", true);
    return;
  }
  if (password !== confirmPassword) {
    showAuthMessage("Passwords do not match.", true);
    return;
  }

  try {
    const result = await apiRequest("register", { email, password });
    elements.verifyEmailInput.value = email;
    setAuthView("verify");
    showAuthMessage(result.message || "Verification code sent to your Gmail address.");
  } catch (error) {
    showAuthMessage(error.message || "Could not create account.", true);
  }
}

async function handleVerifyEmail(event) {
  event.preventDefault();
  showAuthMessage("");

  const email = elements.verifyEmailInput.value.trim();
  const code = elements.verifyCodeInput.value.trim();

  if (!isGmailAddress(email)) {
    showAuthMessage("Only gmail.com email addresses are allowed.", true);
    return;
  }

  try {
    const result = await apiRequest("verifyEmail", { email, code });
    elements.emailInput.value = email;
    elements.verifyCodeInput.value = "";
    setAuthView("login");
    showAuthMessage(result.message || "Email verified. You can log in now.");
  } catch (error) {
    showAuthMessage(error.message || "Could not verify email.", true);
  }
}

async function handleResendVerification() {
  showAuthMessage("");
  const email = elements.verifyEmailInput.value.trim() || elements.signupEmailInput.value.trim();

  if (!isGmailAddress(email)) {
    showAuthMessage("Enter your gmail.com address first.", true);
    return;
  }

  try {
    const result = await apiRequest("resendVerification", { email });
    elements.verifyEmailInput.value = email;
    showAuthMessage(result.message || "New verification code sent.");
  } catch (error) {
    showAuthMessage(error.message || "Could not resend code.", true);
  }
}

async function handleResetRequest(event) {
  event.preventDefault();
  showAuthMessage("");

  const email = elements.resetEmailInput.value.trim();
  if (!isGmailAddress(email)) {
    showAuthMessage("Only gmail.com email addresses are allowed.", true);
    return;
  }

  try {
    const result = await apiRequest("requestPasswordReset", { email });
    elements.resetConfirmEmailInput.value = email;
    setAuthView("reset-password");
    showAuthMessage(result.message || "Password reset code sent.");
  } catch (error) {
    showAuthMessage(error.message || "Could not send reset code.", true);
  }
}

async function handleResetPassword(event) {
  event.preventDefault();
  showAuthMessage("");

  const email = elements.resetConfirmEmailInput.value.trim();
  const code = elements.resetCodeInput.value.trim();
  const password = elements.resetPasswordInput.value;

  if (!isGmailAddress(email)) {
    showAuthMessage("Only gmail.com email addresses are allowed.", true);
    return;
  }

  try {
    const result = await apiRequest("resetPassword", { email, code, password });
    elements.emailInput.value = email;
    elements.resetCodeInput.value = "";
    elements.resetPasswordInput.value = "";
    setAuthView("login");
    showAuthMessage(result.message || "Password updated. Please log in.");
  } catch (error) {
    showAuthMessage(error.message || "Could not update password.", true);
  }
}

function setAuthView(view) {
  document.querySelectorAll("[data-auth-panel]").forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.authPanel !== view);
  });
  const isLogin = view === "login";
  const isSignup = view === "signup";
  elements.loginTabButton.classList.toggle("active", isLogin);
  elements.signupTabButton.classList.toggle("active", isSignup);
  elements.loginTabButton.setAttribute("aria-selected", String(isLogin));
  elements.signupTabButton.setAttribute("aria-selected", String(isSignup));
  refreshIcons();
}

function showAuthMessage(message, isError = false) {
  elements.loginMessage.textContent = message;
  elements.loginMessage.classList.toggle("error", isError);
}

function isGmailAddress(email) {
  return /^[^\s@]+@gmail\.com$/i.test(String(email || "").trim());
}

function setAuthenticated(authenticated) {
  elements.loginScreen.classList.toggle("hidden", authenticated);
  elements.appShell.classList.toggle("hidden", !authenticated);
}

function isAuthenticated() {
  return Boolean(state.user);
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

async function handleSubmit(event) {
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

  try {
    await persistGroup(transaction.category);
    await persistTransaction(transaction, currentMode);
  } catch (error) {
    showFormMessage(error.message || "Could not save to database.", true);
    return;
  }

  if (currentMode === "cash-in") {
    upsertTransaction(state.cashIns, transaction);
  } else {
    upsertTransaction(state.expenses, transaction);
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
  void handleExpenseTableClickAsync(event);
}

async function handleExpenseTableClickAsync(event) {
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
    await deleteRemoteTransaction(expense.id);
    render();
  }
}

function handleCashInTableClick(event) {
  void handleCashInTableClickAsync(event);
}

async function handleCashInTableClickAsync(event) {
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
    await deleteRemoteTransaction(cashIn.id);
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
    return null;
  }

  const existing = state.groups.find((group) => group.name.toLowerCase() === normalized.toLowerCase());
  if (existing) {
    return existing;
  }

  const group = {
    name: normalized,
    color: colorPool[state.groups.length % colorPool.length],
  };
  state.groups.push(group);
  populateGroupControls();
  return group;
}

function getGroup(name) {
  const group = state.groups.find((item) => item.name === name);
  if (group) {
    return group;
  }

  ensureGroup(name);
  return state.groups.find((item) => item.name === name) || defaultGroups[defaultGroups.length - 1];
}

async function loadRemoteData() {
  const data = await apiRequest("bootstrap", { token: state.token });

  state.groups = dedupeGroups((data.groups || []).map((group, index) => ({
    name: group.name,
    color: group.color || colorPool[index % colorPool.length],
  })));

  const transactions = (data.transactions || []).map(fromRemoteTransaction);
  state.cashIns = transactions.filter((transaction) => transaction.type === "cash-in").map(stripTransactionType);
  state.expenses = transactions.filter((transaction) => transaction.type === "expense").map(stripTransactionType);

  const transactionGroups = transactions.map((transaction, index) => ({
    name: transaction.category,
    color: colorPool[(state.groups.length + index) % colorPool.length],
  }));
  state.groups = dedupeGroups([...state.groups, ...transactionGroups]);
}

async function persistGroup(name) {
  const group = ensureGroup(name);
  await apiRequest("saveGroup", {
    token: state.token,
    group: {
      name: group.name,
      color: group.color,
    },
  });
}

async function persistTransaction(transaction, type) {
  const group = getGroup(transaction.category);
  await apiRequest("saveTransaction", {
    token: state.token,
    transaction: {
      id: transaction.id,
      type,
      description: transaction.description,
      amount: transaction.amount,
      category: transaction.category,
      color: group.color,
      date: transaction.date,
      time: transaction.time,
      notes: transaction.notes || "",
    },
  });
}

async function deleteRemoteTransaction(id) {
  try {
    await apiRequest("deleteTransaction", { token: state.token, id });
  } catch (error) {
    elements.formMessage.textContent = error.message || "Could not delete from database.";
    elements.formMessage.classList.add("error");
  }
}

function isBackendConfigured() {
  return Boolean(BACKEND_CONFIG.apiUrl && /^https:\/\/script\.google\.com\/macros\/s\//.test(BACKEND_CONFIG.apiUrl));
}

async function apiRequest(action, payload = {}) {
  const response = await fetch(BACKEND_CONFIG.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({ action, ...payload }),
  });

  if (!response.ok) {
    throw new Error(`Backend request failed with status ${response.status}.`);
  }

  const responseText = await response.text();
  let result;
  try {
    result = JSON.parse(responseText);
  } catch {
    const plainText = responseText.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (plainText.includes("Script function not found")) {
      throw new Error("Google Apps Script backend is not deployed with Code.gs. Paste the backend code and redeploy the Web App.");
    }
    throw new Error("Backend returned an invalid response. Check the Google Apps Script deployment.");
  }

  if (!result.ok) {
    throw new Error(result.error || "Backend request failed.");
  }

  return result.data || {};
}

function clearAuthSession() {
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_USER_KEY);
  state.token = null;
  state.user = null;
}

function readStoredUser() {
  const stored = sessionStorage.getItem(AUTH_USER_KEY);
  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function fromRemoteTransaction(transaction) {
  return {
    id: transaction.id,
    type: transaction.type,
    description: transaction.description || "",
    amount: Number(transaction.amount),
    category: transaction.category || "Other",
    date: transaction.date || getCurrentISTDate(),
    time: String(transaction.time || "00:00").slice(0, 5),
    notes: transaction.notes || "",
  };
}

function stripTransactionType(transaction) {
  const { type, ...rest } = transaction;
  return rest;
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

function createId(prefix) {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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
