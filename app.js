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
  backups: [],
  settings: loadSettings(),
  mode: "expense",
  page: "dashboard",
  dashboardBooted: false,
  user: null,
  token: null,
  filters: {
    search: "",
    week: getCurrentWeek(),
    group: "All",
    type: "All",
    projectSearch: "",
    globalSearch: false,
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
  navButtons: document.querySelectorAll("[data-page-target]"),
  pageLinks: document.querySelectorAll("[data-page-link]"),
  appPages: document.querySelectorAll("[data-page]"),
  pageTitle: document.querySelector("#pageTitle"),
  userAvatar: document.querySelector("#userAvatar"),
  currencySelect: document.querySelector("#currencySelect"),
  exportButton: document.querySelector("#exportButton"),
  pdfExportButton: document.querySelector("#pdfExportButton"),
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
  recentTransactionsList: document.querySelector("#recentTransactionsList"),
  topProjectsList: document.querySelector("#topProjectsList"),
  quickCashInButton: document.querySelector("#quickCashInButton"),
  quickCashOutButton: document.querySelector("#quickCashOutButton"),
  quickProjectButton: document.querySelector("#quickProjectButton"),
  dashboardPdfButton: document.querySelector("#dashboardPdfButton"),
  projectSearchInput: document.querySelector("#projectSearchInput"),
  projectAddButton: document.querySelector("#projectAddButton"),
  projectTable: document.querySelector("#projectTable"),
  projectAllCount: document.querySelector("#projectAllCount"),
  projectActiveCount: document.querySelector("#projectActiveCount"),
  transactionTypeFilter: document.querySelector("#transactionTypeFilter"),
  transactionAddButton: document.querySelector("#transactionAddButton"),
  allTransactionsTable: document.querySelector("#allTransactionsTable"),
  transactionCountLabel: document.querySelector("#transactionCountLabel"),
  reportFromDate: document.querySelector("#reportFromDate"),
  reportToDate: document.querySelector("#reportToDate"),
  generateReportButton: document.querySelector("#generateReportButton"),
  reportCashIn: document.querySelector("#reportCashIn"),
  reportCashOut: document.querySelector("#reportCashOut"),
  reportBalance: document.querySelector("#reportBalance"),
  reportTransactionCount: document.querySelector("#reportTransactionCount"),
  analyticsProjectFilter: document.querySelector("#analyticsProjectFilter"),
  analyticsWeekFilter: document.querySelector("#analyticsWeekFilter"),
  groupForm: document.querySelector("#groupForm"),
  groupOriginalName: document.querySelector("#groupOriginalName"),
  groupNameInput: document.querySelector("#groupNameInput"),
  groupColorInput: document.querySelector("#groupColorInput"),
  groupSubmitButton: document.querySelector("#groupSubmitButton"),
  cancelGroupEditButton: document.querySelector("#cancelGroupEditButton"),
  groupMessage: document.querySelector("#groupMessage"),
  groupTable: document.querySelector("#groupTable"),
  groupEmptyState: document.querySelector("#groupEmptyState"),
  accountEmail: document.querySelector("#accountEmail"),
  accountRole: document.querySelector("#accountRole"),
  accountStatus: document.querySelector("#accountStatus"),
  accountVerified: document.querySelector("#accountVerified"),
  passwordForm: document.querySelector("#passwordForm"),
  currentPasswordInput: document.querySelector("#currentPasswordInput"),
  newPasswordInput: document.querySelector("#newPasswordInput"),
  confirmNewPasswordInput: document.querySelector("#confirmNewPasswordInput"),
  deleteAccountButton: document.querySelector("#deleteAccountButton"),
  accountMessage: document.querySelector("#accountMessage"),
  refreshBackupsButton: document.querySelector("#refreshBackupsButton"),
  createBackupButton: document.querySelector("#createBackupButton"),
  backupRetentionLabel: document.querySelector("#backupRetentionLabel"),
  backupFolderLink: document.querySelector("#backupFolderLink"),
  backupTable: document.querySelector("#backupTable"),
  backupEmptyState: document.querySelector("#backupEmptyState"),
  backupMessage: document.querySelector("#backupMessage"),
  searchInput: document.querySelector("#searchInput"),
  weekFilter: document.querySelector("#weekFilter"),
  categoryFilter: document.querySelector("#categoryFilter"),
  globalSearchCheckbox: document.querySelector("#globalSearchCheckbox"),
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
    handleDashboardLoadError(loadError, "Could not load dashboard data.");
  }
}

async function bootDashboard() {
  await loadRemoteData();
  populateGroupControls();
  elements.currencySelect.value = state.settings.currency;
  elements.weekFilter.value = state.filters.week;
  elements.analyticsWeekFilter.value = state.filters.week;
  setDefaultReportDates();
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
  elements.navButtons.forEach((button) => {
    button.addEventListener("click", () => setActivePage(button.dataset.pageTarget));
  });
  elements.pageLinks.forEach((button) => {
    button.addEventListener("click", () => setActivePage(button.dataset.pageLink));
  });
  elements.form.addEventListener("submit", handleSubmit);
  elements.groupForm.addEventListener("submit", handleGroupSubmit);
  elements.cancelGroupEditButton.addEventListener("click", resetGroupForm);
  elements.groupTable.addEventListener("click", handleGroupTableClick);
  elements.passwordForm.addEventListener("submit", handlePasswordUpdate);
  elements.deleteAccountButton.addEventListener("click", handleDeleteAccount);
  elements.refreshBackupsButton.addEventListener("click", loadBackups);
  elements.createBackupButton.addEventListener("click", handleCreateBackup);
  elements.backupTable.addEventListener("click", handleBackupTableClick);
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
  elements.pdfExportButton.addEventListener("click", exportPdfReport);
  elements.dashboardPdfButton.addEventListener("click", exportPdfReport);
  elements.quickCashInButton.addEventListener("click", () => startTransaction("cash-in"));
  elements.quickCashOutButton.addEventListener("click", () => startTransaction("expense"));
  elements.quickProjectButton.addEventListener("click", () => {
    setActivePage("projects");
    elements.groupNameInput.focus();
  });
  elements.projectAddButton.addEventListener("click", () => {
    setActivePage("settings");
    elements.groupNameInput.focus();
  });
  elements.transactionAddButton.addEventListener("click", () => startTransaction("expense"));
  elements.projectSearchInput.addEventListener("input", () => {
    state.filters.projectSearch = elements.projectSearchInput.value.trim().toLowerCase();
    renderProjectsPage();
  });
  elements.projectTable.addEventListener("click", handleProjectTableClick);
  elements.allTransactionsTable.addEventListener("click", handleAllTransactionsClick);
  elements.searchInput.addEventListener("input", () => {
    state.filters.search = elements.searchInput.value.trim().toLowerCase();
    renderTransactions();
    renderCashIns();
    renderAllTransactions();
  });
  elements.globalSearchCheckbox.addEventListener("change", () => {
    state.filters.globalSearch = elements.globalSearchCheckbox.checked;
    document.querySelector("#transactionsPage .page-actions")?.classList.toggle("global-search-active", state.filters.globalSearch);
    renderAllTransactions();
  });
  elements.weekFilter.addEventListener("change", () => {
    state.filters.week = elements.weekFilter.value || getCurrentWeek();
    elements.analyticsWeekFilter.value = state.filters.week;
    render();
  });
  elements.categoryFilter.addEventListener("change", () => {
    state.filters.group = elements.categoryFilter.value;
    renderTransactions();
    renderCashIns();
    renderDailyBreakdown();
    renderAllTransactions();
  });
  elements.transactionTypeFilter.addEventListener("change", () => {
    state.filters.type = elements.transactionTypeFilter.value;
    renderAllTransactions();
  });
  elements.generateReportButton.addEventListener("click", renderReportPage);
  elements.analyticsProjectFilter.addEventListener("change", () => {
    elements.projectGroupSelect.value = elements.analyticsProjectFilter.value;
    render();
  });
  elements.analyticsWeekFilter.addEventListener("change", () => {
    state.filters.week = elements.analyticsWeekFilter.value || getCurrentWeek();
    elements.weekFilter.value = state.filters.week;
    render();
  });
  elements.projectGroupSelect.addEventListener("change", () => {
    renderGroupLedger();
    renderReportPage();
  });
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
  elements.expenseTable?.addEventListener("click", handleExpenseTableClick);
  elements.cashInTable?.addEventListener("click", handleCashInTableClick);
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
    const result = await apiRequest("login", { email, password: await getPasswordMaterial(email, password) });
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
    handleDashboardLoadError(loadError, "Could not load database data.");
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
    const result = await apiRequest("register", { email, password: await getPasswordMaterial(email, password) });
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
  const code = sanitizeOneTimeCode(elements.verifyCodeInput.value);

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
    const result = await apiRequest("resetPassword", { email, code, password: await getPasswordMaterial(email, password) });
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

function sanitizeOneTimeCode(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 6);
}

function setAuthenticated(authenticated) {
  elements.loginScreen.classList.toggle("hidden", authenticated);
  elements.appShell.classList.toggle("hidden", !authenticated);
}

function isAuthenticated() {
  return Boolean(state.user);
}

function setActivePage(page) {
  state.page = page;
  elements.appPages.forEach((section) => {
    section.classList.toggle("active", section.dataset.page === page);
  });
  elements.navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.pageTarget === page);
  });
  const titles = {
    dashboard: "Dashboard",
    projects: "Projects",
    transactions: "Transactions",
    reports: "Reports",
    analytics: "Analytics",
    settings: "Settings",
  };
  elements.pageTitle.textContent = titles[page] || "Dashboard";
  if (page === "settings" && isAuthenticated() && !state.backups.length) {
    void loadBackups();
  }
  refreshIcons();
}

function startTransaction(mode) {
  setActivePage("transactions");
  resetForm();
  setMode(mode);
  elements.descriptionInput.focus();
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
  const projectOptions = [
    `<option value="All">All groups</option>`,
    ...state.groups.map((group) => `<option value="${escapeAttribute(group.name)}">${escapeHtml(group.name)}</option>`),
  ].join("");
  elements.categoryFilter.innerHTML = projectOptions;
  elements.categoryFilter.value = state.filters.group;
  elements.analyticsProjectFilter.innerHTML = projectOptions;

  const selectedGroup = elements.projectGroupSelect.value || getDefaultProjectGroup();
  elements.projectGroupSelect.innerHTML = state.groups.length ? state.groups.map((group) => {
    return `<option value="${escapeAttribute(group.name)}">${escapeHtml(group.name)}</option>`;
  }).join("") : `<option value="">No project yet</option>`;
  elements.projectGroupSelect.value = state.groups.some((group) => group.name === selectedGroup)
    ? selectedGroup
    : getDefaultProjectGroup();
  elements.projectGroupSelect.disabled = state.groups.length === 0;
  elements.analyticsProjectFilter.value = elements.projectGroupSelect.value || state.filters.group;
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

  const previousState = snapshotDashboardState();
  const wasEditing = Boolean(elements.expenseId.value);

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
  render();
  showFormMessage(wasEditing ? "Saved. Syncing..." : currentMode === "cash-in" ? "Cash In added. Syncing..." : "Expense added. Syncing...");

  try {
    await persistTransaction(transaction, currentMode);
    showFormMessage(wasEditing ? "Changes saved." : currentMode === "cash-in" ? "Cash In added and allocated." : "Expense added.");
  } catch (error) {
    restoreDashboardState(previousState);
    render();
    editTransaction(transaction, currentMode);
    showFormMessage(error.message || "Could not save to database.", true);
  }
}

function upsertTransaction(collection, transaction) {
  const existingIndex = collection.findIndex((item) => item.id === transaction.id);
  if (existingIndex >= 0) {
    collection[existingIndex] = transaction;
  } else {
    collection.unshift(transaction);
  }
}

function snapshotDashboardState() {
  return {
    cashIns: state.cashIns.map((item) => ({ ...item })),
    expenses: state.expenses.map((item) => ({ ...item })),
    groups: state.groups.map((item) => ({ ...item })),
    filters: { ...state.filters },
  };
}

function restoreDashboardState(snapshot) {
  state.cashIns = snapshot.cashIns.map((item) => ({ ...item }));
  state.expenses = snapshot.expenses.map((item) => ({ ...item }));
  state.groups = snapshot.groups.map((item) => ({ ...item }));
  state.filters = { ...snapshot.filters };
  elements.weekFilter.value = state.filters.week;
  elements.categoryFilter.value = state.filters.group;
  populateGroupControls();
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
  setActivePage("transactions");
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

async function handleGroupSubmit(event) {
  event.preventDefault();
  const originalName = elements.groupOriginalName.value;
  const group = {
    name: elements.groupNameInput.value.trim(),
    color: elements.groupColorInput.value,
  };

  if (!group.name) {
    showGroupMessage("Enter a group name.", true);
    return;
  }

  const previousState = snapshotDashboardState();
  try {
    if (originalName && originalName.toLowerCase() !== group.name.toLowerCase()) {
      renameLocalGroup(originalName, group);
      render();
      showGroupMessage("Group updated. Syncing...");
      await apiRequest("renameGroup", { token: state.token, oldName: originalName, group });
      showGroupMessage("Group updated.");
    } else {
      const saved = ensureGroup(group.name);
      saved.color = group.color;
      render();
      showGroupMessage("Group saved. Syncing...");
      await persistGroup(group.name);
      showGroupMessage("Group saved.");
    }
    resetGroupForm();
  } catch (error) {
    restoreDashboardState(previousState);
    render();
    showGroupMessage(error.message || "Could not save group.", true);
  }
}

function handleGroupTableClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }
  const name = button.dataset.name;
  const group = state.groups.find((item) => item.name === name);
  if (!group) {
    return;
  }

  if (button.dataset.action === "edit-group") {
    elements.groupOriginalName.value = group.name;
    elements.groupNameInput.value = group.name;
    elements.groupColorInput.value = group.color;
    elements.groupSubmitButton.innerHTML = `<i data-lucide="save" aria-hidden="true"></i> Update Group`;
    elements.cancelGroupEditButton.classList.remove("hidden");
    elements.groupNameInput.focus();
    refreshIcons();
  }

  if (button.dataset.action === "delete-group") {
    void deleteGroup(group.name);
  }

  if (button.dataset.action === "cash-in-group") {
    setMode("cash-in");
    elements.categoryInput.value = group.name;
    elements.descriptionInput.value = `Funds for ${group.name}`;
    elements.amountInput.focus();
  }

  if (button.dataset.action === "expense-group") {
    setMode("expense");
    elements.categoryInput.value = group.name;
    elements.descriptionInput.focus();
  }
}

function handleProjectTableClick(event) {
  const button = event.target.closest("button[data-action='edit-project']");
  if (!button) {
    return;
  }
  setActivePage("settings");
  const group = state.groups.find((item) => item.name === button.dataset.name);
  if (group) {
    elements.groupOriginalName.value = group.name;
    elements.groupNameInput.value = group.name;
    elements.groupColorInput.value = group.color;
    elements.groupSubmitButton.innerHTML = `<i data-lucide="save" aria-hidden="true"></i> Update Group`;
    elements.cancelGroupEditButton.classList.remove("hidden");
    elements.groupNameInput.focus();
    refreshIcons();
  }
}

function handleAllTransactionsClick(event) {
  const button = event.target.closest("button[data-action='edit-transaction']");
  if (button) {
    editTransactionById(button.dataset.id, button.dataset.type);
  }
}

function editTransactionById(id, type) {
  const collection = type === "cash-in" ? state.cashIns : state.expenses;
  const transaction = collection.find((entry) => entry.id === id);
  if (transaction) {
    editTransaction(transaction, type);
  }
}

async function deleteGroup(name) {
  const hasEntries = [...state.cashIns, ...state.expenses].some((transaction) => transaction.category === name);
  if (hasEntries) {
    showGroupMessage("This group has entries. Move or delete those entries first.", true);
    return;
  }
  if (!window.confirm(`Delete group "${name}"?`)) {
    return;
  }

  const previousState = snapshotDashboardState();
  state.groups = state.groups.filter((group) => group.name !== name);
  populateGroupControls();
  render();
  showGroupMessage("Group deleted. Syncing...");

  try {
    await apiRequest("deleteGroup", { token: state.token, name });
    showGroupMessage("Group deleted.");
  } catch (error) {
    restoreDashboardState(previousState);
    render();
    showGroupMessage(error.message || "Could not delete group.", true);
  }
}

function renameLocalGroup(originalName, group) {
  const existing = state.groups.find((item) => item.name.toLowerCase() === originalName.toLowerCase());
  if (existing) {
    existing.name = group.name;
    existing.color = group.color;
  }
  state.cashIns = state.cashIns.map((entry) => entry.category === originalName ? { ...entry, category: group.name } : entry);
  state.expenses = state.expenses.map((entry) => entry.category === originalName ? { ...entry, category: group.name } : entry);
  if (state.filters.group === originalName) {
    state.filters.group = group.name;
  }
  if (elements.projectGroupSelect.value === originalName) {
    elements.projectGroupSelect.value = group.name;
  }
  populateGroupControls();
}

function resetGroupForm() {
  elements.groupForm.reset();
  elements.groupOriginalName.value = "";
  elements.groupColorInput.value = colorPool[state.groups.length % colorPool.length];
  elements.groupSubmitButton.innerHTML = `<i data-lucide="folder-plus" aria-hidden="true"></i> Save Group`;
  elements.cancelGroupEditButton.classList.add("hidden");
  refreshIcons();
}

function showGroupMessage(message, isError = false) {
  elements.groupMessage.textContent = message;
  elements.groupMessage.classList.toggle("error", isError);
}

async function handlePasswordUpdate(event) {
  event.preventDefault();
  showAccountMessage("");

  const currentPassword = elements.currentPasswordInput.value;
  const newPassword = elements.newPasswordInput.value;
  const confirmPassword = elements.confirmNewPasswordInput.value;
  if (newPassword !== confirmPassword) {
    showAccountMessage("New passwords do not match.", true);
    return;
  }

  try {
    await apiRequest("updatePassword", {
      token: state.token,
      currentPassword: await getPasswordMaterial(state.user.email, currentPassword),
      newPassword: await getPasswordMaterial(state.user.email, newPassword),
    });
    elements.passwordForm.reset();
    showAccountMessage("Password updated.");
  } catch (error) {
    showAccountMessage(error.message || "Could not update password.", true);
  }
}

async function handleDeleteAccount() {
  const confirmation = window.prompt("Type DELETE to permanently delete your account and all FastStack data.");
  if (confirmation !== "DELETE") {
    showAccountMessage("Account deletion cancelled.", true);
    return;
  }

  try {
    await apiRequest("deleteAccount", { token: state.token });
    clearAuthSession();
    state.expenses = [];
    state.cashIns = [];
    state.groups = [];
    setAuthenticated(false);
    setAuthView("login");
    showAuthMessage("Account deleted.");
  } catch (error) {
    showAccountMessage(error.message || "Could not delete account.", true);
  }
}

function showAccountMessage(message, isError = false) {
  elements.accountMessage.textContent = message;
  elements.accountMessage.classList.toggle("error", isError);
}

async function loadBackups() {
  showBackupMessage("Loading backups...");
  try {
    const data = await apiRequest("listBackups", { token: state.token });
    state.backups = data.backups || [];
    renderBackups(data);
    showBackupMessage(state.backups.length ? "Backups loaded." : "No backups found.");
  } catch (error) {
    showBackupMessage(error.message || "Could not load backups.", true);
  }
}

async function handleCreateBackup() {
  elements.createBackupButton.disabled = true;
  showBackupMessage("Creating Google Drive backup...");
  try {
    const data = await apiRequest("createBackup", { token: state.token });
    state.backups = data.backups || (data.backup ? [data.backup, ...state.backups] : state.backups);
    renderBackups(data);
    showBackupMessage("Backup created.");
  } catch (error) {
    showBackupMessage(error.message || "Could not create backup.", true);
  } finally {
    elements.createBackupButton.disabled = false;
  }
}

function handleBackupTableClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }
  if (button.dataset.action === "restore-backup") {
    void restoreBackup(button.dataset.id);
  }
}

async function restoreBackup(backupId) {
  const backup = state.backups.find((item) => item.id === backupId);
  const name = backup ? backup.name : "selected backup";
  const confirmation = window.prompt(`Restore from "${name}"? This will replace the current Google Sheet data. Type RESTORE to continue.`);
  if (confirmation !== "RESTORE") {
    showBackupMessage("Restore cancelled.", true);
    return;
  }

  showBackupMessage("Restoring backup. Please wait...");
  try {
    await apiRequest("restoreBackup", { token: state.token, backupId });
    showBackupMessage("Backup restored. Reloading data...");
    await bootDashboard();
    await loadBackups();
  } catch (error) {
    showBackupMessage(error.message || "Could not restore backup.", true);
  }
}

function showBackupMessage(message, isError = false) {
  elements.backupMessage.textContent = message;
  elements.backupMessage.classList.toggle("error", isError);
}

function render() {
  const weeklyExpenses = expensesForWeek(state.filters.week);
  const weeklyCashIns = cashInsForWeek(state.filters.week);
  const totalExpenses = sum(state.expenses);
  const totalCashIn = sum(state.cashIns);
  const groupSummaries = getGroupSummaries();
  const activeGroupCount = groupSummaries.filter((group) => group.allocated > 0 || group.spent > 0).length;

  elements.weekTotal.textContent = formatCurrency(totalExpenses);
  elements.cashInTotal.textContent = formatCurrency(totalCashIn);
  elements.runningBalance.textContent = formatCurrency(totalCashIn - totalExpenses);
  elements.activeGroups.textContent = String(activeGroupCount);
  elements.userAvatar.textContent = getUserInitials();

  renderDashboardPage(groupSummaries);
  renderProjectsPage(groupSummaries);
  renderAllTransactions();
  renderReportPage();
  renderTrend();
  renderBudgets(groupSummaries);
  renderGroupLedger();
  renderDailyBreakdown();
  renderTransactions();
  renderCashIns();
  renderGroupManager(groupSummaries);
  renderAccount();
  renderBackups();
  refreshIcons();
}

function renderDashboardPage(groupSummaries = getGroupSummaries()) {
  const recent = getAllTransactions().sort(sortByDateDesc).slice(0, 5);
  elements.recentTransactionsList.innerHTML = recent.length ? recent.map((entry) => {
    const icon = entry.type === "cash-in" ? "arrow-down-to-line" : "receipt";
    return `
      <button class="recent-row" type="button" data-action="edit-transaction" data-type="${entry.type}" data-id="${escapeAttribute(entry.id)}">
        <span class="recent-icon ${entry.type === "cash-in" ? "income-icon" : "expense-icon"}"><i data-lucide="${icon}" aria-hidden="true"></i></span>
        <strong>${escapeHtml(entry.description)}</strong>
        <span>${escapeHtml(entry.category)}</span>
        <span>${formatDateTime(entry.date, entry.time)}</span>
      </button>
    `;
  }).join("") : `<div class="empty-state compact-empty"><strong>No transactions yet</strong><span>Add Cash In or Cash Out entries.</span></div>`;

  elements.recentTransactionsList.querySelectorAll("[data-action='edit-transaction']").forEach((button) => {
    button.addEventListener("click", () => editTransactionById(button.dataset.id, button.dataset.type));
  });

  const topProjects = groupSummaries
    .filter((group) => group.allocated > 0 || group.spent > 0)
    .sort((a, b) => b.remaining - a.remaining)
    .slice(0, 5);

  elements.topProjectsList.innerHTML = topProjects.length ? topProjects.map((group) => {
    const max = Math.max(...topProjects.map((item) => Math.abs(item.remaining)), 1);
    const width = Math.max((Math.abs(group.remaining) / max) * 100, 5);
    return `
      <div class="rank-row">
        <div>
          <strong>${escapeHtml(group.name)}</strong>
          <span class="category-bar"><span style="width:${width}%; background:${group.color}"></span></span>
        </div>
        <strong>${formatCurrency(group.remaining)}</strong>
      </div>
    `;
  }).join("") : `<div class="empty-state compact-empty"><strong>No project balances</strong><span>Add funds to a project.</span></div>`;
}

function renderProjectsPage(groupSummaries = getGroupSummaries()) {
  const query = state.filters.projectSearch;
  const rows = groupSummaries
    .filter((group) => !query || group.name.toLowerCase().includes(query))
    .sort((a, b) => b.remaining - a.remaining);

  elements.projectAllCount.textContent = `(${groupSummaries.length})`;
  elements.projectActiveCount.textContent = `(${groupSummaries.filter((group) => group.allocated > 0 || group.spent > 0).length})`;
  elements.projectTable.innerHTML = rows.map((group) => {
    const isActive = group.allocated > 0 || group.spent > 0;
    return `
      <tr>
        <td><strong>${escapeHtml(group.name)}</strong></td>
        <td class="amount-col positive-amount">${formatCurrency(group.allocated)}</td>
        <td class="amount-col cash-out-value">${formatCurrency(group.spent)}</td>
        <td class="amount-col balance-positive">${formatCurrency(group.remaining)}</td>
        <td><span class="status-chip ${isActive ? "active-status" : ""}">${isActive ? "Active" : "Closed"}</span></td>
        <td class="actions-col">
          <button class="icon-button" type="button" data-action="edit-project" data-name="${escapeAttribute(group.name)}" title="Edit project" aria-label="Edit ${escapeAttribute(group.name)}">
            <i data-lucide="pencil" aria-hidden="true"></i>
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

function renderAllTransactions() {
  const rows = getFilteredAllTransactions();
  let runningBalance = 0;
  const balanceById = new Map(getAllTransactions().sort(sortLedgerAsc).map((entry) => {
    runningBalance += entry.type === "cash-in" ? entry.amount : -entry.amount;
    return [entry.id, runningBalance];
  }));

  elements.allTransactionsTable.innerHTML = rows.map((entry) => {
    const isCashIn = entry.type === "cash-in";
    return `
      <tr>
        <td>${formatDateTime(entry.date, entry.time)}</td>
        <td>${escapeHtml(entry.category)}</td>
        <td><span class="status-chip ${isCashIn ? "active-status" : "danger-status"}">${isCashIn ? "Cash In" : "Cash Out"}</span></td>
        <td>${escapeHtml(entry.description)}</td>
        <td class="amount-col cash-in-value">${isCashIn ? formatCurrency(entry.amount) : "-"}</td>
        <td class="amount-col cash-out-value">${isCashIn ? "-" : formatCurrency(entry.amount)}</td>
        <td class="amount-col ${(balanceById.get(entry.id) || 0) < 0 ? 'balance-negative' : 'balance-positive'}">${formatCurrency(balanceById.get(entry.id) || 0)}</td>
        <td class="actions-col">
          <button class="icon-button" type="button" data-action="edit-transaction" data-type="${entry.type}" data-id="${escapeAttribute(entry.id)}" title="Edit" aria-label="Edit ${escapeAttribute(entry.description)}">
            <i data-lucide="pencil" aria-hidden="true"></i>
          </button>
        </td>
      </tr>
    `;
  }).join("");
  const globalNote = state.filters.globalSearch ? " (global search — all projects & weeks)" : "";
  elements.transactionCountLabel.textContent = `Showing ${rows.length} of ${getAllTransactions().length} transactions${globalNote}`;
}

function renderReportPage() {
  const entries = getReportEntries();
  const cashIn = sum(entries.filter((entry) => entry.type === "cash-in"));
  const cashOut = sum(entries.filter((entry) => entry.type === "expense"));
  elements.reportCashIn.textContent = formatCurrency(cashIn);
  elements.reportCashOut.textContent = formatCurrency(cashOut);
  elements.reportBalance.textContent = formatCurrency(cashIn - cashOut);
  elements.reportTransactionCount.textContent = String(entries.length);
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
        <td class="actions-col">
          <div class="row-actions">
            <button class="icon-button" type="button" data-action="edit-ledger" data-type="${entry.type}" data-id="${escapeAttribute(entry.id)}" aria-label="Edit ${escapeAttribute(entry.description)}" title="Edit">
              <i data-lucide="pencil" aria-hidden="true"></i>
            </button>
          </div>
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
  if (!elements.expenseTable) {
    return;
  }
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

  elements.emptyState?.classList.toggle("hidden", filtered.length > 0);
  refreshIcons();
}

function handleDetailClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  const collection = button.dataset.type === "cash-in" ? state.cashIns : state.expenses;
  const transaction = collection.find((entry) => entry.id === button.dataset.id);

  if (transaction && button.dataset.action === "view-details") {
    openDetailModal(transaction, button.dataset.type);
  }

  if (transaction && button.dataset.action === "edit-ledger") {
    editTransaction(transaction, button.dataset.type);
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
  if (!elements.cashInTable) {
    return;
  }
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

  elements.cashInEmptyState?.classList.toggle("hidden", filtered.length > 0);
  refreshIcons();
}

function renderGroupManager(groupSummaries = getGroupSummaries()) {
  const summaries = groupSummaries
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  elements.groupTable.innerHTML = summaries.map((group) => {
    const balanceClass = group.remaining < 0 ? "balance-negative" : "balance-positive";
    return `
      <tr>
        <td>
          <span class="chip">
            <span class="swatch" style="background:${group.color}"></span>
            ${escapeHtml(group.name)}
          </span>
        </td>
        <td class="amount-col positive-amount"><strong>${formatCurrency(group.allocated)}</strong></td>
        <td class="amount-col cash-out-value"><strong>${formatCurrency(group.spent)}</strong></td>
        <td class="amount-col ${balanceClass}"><strong>${formatCurrency(group.remaining)}</strong></td>
        <td class="actions-col">
          <div class="row-actions">
            <button class="icon-button" type="button" data-action="cash-in-group" data-name="${escapeAttribute(group.name)}" aria-label="Add funds to ${escapeAttribute(group.name)}" title="Add funds">
              <i data-lucide="arrow-down-to-line" aria-hidden="true"></i>
            </button>
            <button class="icon-button" type="button" data-action="expense-group" data-name="${escapeAttribute(group.name)}" aria-label="Add expense to ${escapeAttribute(group.name)}" title="Add expense">
              <i data-lucide="receipt" aria-hidden="true"></i>
            </button>
            <button class="icon-button" type="button" data-action="edit-group" data-name="${escapeAttribute(group.name)}" aria-label="Edit ${escapeAttribute(group.name)}" title="Edit group">
              <i data-lucide="pencil" aria-hidden="true"></i>
            </button>
            <button class="icon-button danger" type="button" data-action="delete-group" data-name="${escapeAttribute(group.name)}" aria-label="Delete ${escapeAttribute(group.name)}" title="Delete group">
              <i data-lucide="trash-2" aria-hidden="true"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  elements.groupEmptyState.classList.toggle("hidden", summaries.length > 0);
  refreshIcons();
}

function renderAccount() {
  const user = state.user || {};
  elements.accountEmail.textContent = user.email || "-";
  elements.accountRole.textContent = user.role || "user";
  elements.accountStatus.textContent = user.status || "active";
  elements.accountVerified.textContent = user.verifiedAt ? formatDateTimeFromIso(user.verifiedAt) : "-";
}

function renderBackups(meta = {}) {
  const backups = state.backups || [];
  elements.backupRetentionLabel.textContent = `${meta.retentionDays || 30} days`;
  if (meta.folderUrl) {
    elements.backupFolderLink.href = meta.folderUrl;
  }
  elements.backupTable.innerHTML = backups.map((backup) => `
    <tr>
      <td>
        <div class="expense-name">
          <strong>${escapeHtml(backup.name)}</strong>
          ${backup.url ? `<a href="${escapeAttribute(backup.url)}" target="_blank" rel="noopener">Open in Drive</a>` : ""}
        </div>
      </td>
      <td>${formatDateTimeFromIso(backup.createdAt)}</td>
      <td>${formatFileSize(backup.size)}</td>
      <td class="actions-col">
        <button class="icon-button" type="button" data-action="restore-backup" data-id="${escapeAttribute(backup.id)}" aria-label="Restore ${escapeAttribute(backup.name)}" title="Restore">
          <i data-lucide="rotate-ccw" aria-hidden="true"></i>
        </button>
      </td>
    </tr>
  `).join("");
  elements.backupEmptyState.classList.toggle("hidden", backups.length > 0);
  refreshIcons();
}

function getAllTransactions() {
  return [
    ...state.cashIns.map((entry) => ({ ...entry, type: "cash-in" })),
    ...state.expenses.map((entry) => ({ ...entry, type: "expense" })),
  ];
}

function getFilteredAllTransactions() {
  return getAllTransactions()
    .filter((entry) => state.filters.globalSearch || !state.filters.week || isDateInWeek(entry.date, state.filters.week))
    .filter((entry) => state.filters.globalSearch || state.filters.group === "All" || entry.category === state.filters.group)
    .filter((entry) => state.filters.type === "All" || entry.type === state.filters.type)
    .filter((entry) => matchesSearch(entry))
    .sort(sortByDateDesc);
}

function getReportEntries() {
  const selectedProject = elements.projectGroupSelect.value;
  const from = elements.reportFromDate.value;
  const to = elements.reportToDate.value;
  return getAllTransactions()
    .filter((entry) => !selectedProject || entry.category === selectedProject)
    .filter((entry) => !from || entry.date >= from)
    .filter((entry) => !to || entry.date <= to)
    .sort(sortLedgerAsc);
}

function setDefaultReportDates() {
  if (!elements.reportFromDate.value) {
    const start = getWeekStartFromValue(state.filters.week);
    elements.reportFromDate.value = toDateInputValue(start);
  }
  if (!elements.reportToDate.value) {
    elements.reportToDate.value = getCurrentISTDate();
  }
}

function getUserInitials() {
  const email = state.user?.email || "R";
  return email.slice(0, 1).toUpperCase();
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
  if (data.user) {
    state.user = data.user;
    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
  }

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
  const requestPayload = { action, ...payload };
  let result;

  try {
    result = await getRequest(requestPayload);
  } catch {
    result = await jsonpRequest(requestPayload);
  }

  if (!result.ok) {
    throw new Error(result.error || "Backend request failed.");
  }

  return result.data || {};
}

async function getRequest(payload) {
  const responseText = await fetch(buildBackendUrl("faststackFetch", payload), {
    method: "GET",
    cache: "no-store",
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`Backend request failed with status ${response.status}.`);
    }
    return response.text();
  });

  return parseBackendResponse(responseText, "faststackFetch");
}

function jsonpRequest(payload) {
  return new Promise((resolve, reject) => {
    const callbackName = `faststackCallback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const url = buildBackendUrl(callbackName, payload);

    const script = document.createElement("script");
    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error("Could not reach Google Apps Script backend. Paste the latest Code.gs and redeploy the Web App."));
    }, 30000);

    function cleanup() {
      window.clearTimeout(timeoutId);
      delete window[callbackName];
      script.remove();
    }

    window[callbackName] = (result) => {
      cleanup();
      resolve(result);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error(`Could not reach Google Apps Script backend at ${BACKEND_CONFIG.apiUrl}. Refresh the page or open the app in a private window.`));
    };

    script.src = url;
    document.body.appendChild(script);
  });
}

function buildBackendUrl(callbackName, payload) {
  const url = new URL(BACKEND_CONFIG.apiUrl);
  url.searchParams.set("callback", callbackName);
  url.searchParams.set("payload", JSON.stringify(payload));
  return url.toString();
}

function parseBackendResponse(responseText, callbackName) {
  const trimmed = responseText.trim();
  if (trimmed.startsWith("{")) {
    return JSON.parse(trimmed);
  }

  const prefix = `${callbackName}(`;
  if (trimmed.startsWith(prefix) && trimmed.endsWith(");")) {
    return JSON.parse(trimmed.slice(prefix.length, -2));
  }

  throw new Error("Backend returned an invalid response.");
}

async function getPasswordMaterial(email, password) {
  const source = `${String(email || "").trim().toLowerCase()}:${password}`;
  const bytes = new TextEncoder().encode(source);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
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

function handleDashboardLoadError(error, fallbackMessage) {
  if (isAuthSessionError(error)) {
    clearAuthSession();
    showAuthMessage(error.message || "Your session expired. Please log in again.", true);
    setAuthenticated(false);
    return;
  }

  console.error(error);
  setAuthenticated(true);
  showAuthMessage("");
  if (elements.formMessage) {
    elements.formMessage.textContent = error.message || fallbackMessage;
    elements.formMessage.classList.add("error");
  }
  refreshIcons();
}

function isAuthSessionError(error) {
  const message = String(error && error.message ? error.message : error || "");
  return /session expired|invalid session|please log in again/i.test(message);
}

function fromRemoteTransaction(transaction) {
  return {
    id: transaction.id,
    type: transaction.type,
    description: transaction.description || "",
    amount: Number(transaction.amount),
    category: transaction.category || "Other",
    date: normalizeDateInputValue(transaction.date),
    time: normalizeTimeInputValue(transaction.time),
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

function exportPdfReport() {
  const now = new Date();
  const lines = buildReportLines(now);
  const pdf = createPdfDocument(lines);
  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `faststack-expense-report-${getCurrentISTDate()}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

function buildReportLines(generatedAt) {
  const groupSummaries = getGroupSummaries().sort((a, b) => a.name.localeCompare(b.name));
  const transactions = [...state.cashIns.map((entry) => ({ ...entry, type: "Cash In" })), ...state.expenses.map((entry) => ({ ...entry, type: "Expense" }))]
    .sort(sortLedgerAsc);
  const totalCashIn = sum(state.cashIns);
  const totalExpenses = sum(state.expenses);
  const currentGroup = elements.projectGroupSelect.value || getDefaultProjectGroup();
  const groupLedger = currentGroup ? getGroupLedgerEntries(currentGroup) : [];

  const lines = [
    { text: "FastStack Expense Tracker", size: 18, bold: true },
    { text: `Expense Report - ${formatDateTimeFromIso(generatedAt.toISOString())}`, size: 11 },
    { text: `User: ${state.user?.email || "-"}`, size: 10 },
    { text: "" },
    { text: "Summary", size: 14, bold: true },
    { text: `Total Cash In: ${formatReportAmount(totalCashIn)}` },
    { text: `Total Cash Out: ${formatReportAmount(totalExpenses)}` },
    { text: `Running Balance: ${formatReportAmount(totalCashIn - totalExpenses)}` },
    { text: `Groups: ${state.groups.length}` },
    { text: "" },
    { text: "Category Balances", size: 14, bold: true },
    { text: "Group | Cash In | Spent | Balance", bold: true },
    ...groupSummaries.map((group) => ({
      text: `${group.name} | ${formatReportAmount(group.allocated)} | ${formatReportAmount(group.spent)} | ${formatReportAmount(group.remaining)}`,
    })),
    { text: "" },
    { text: `Selected Group Ledger: ${currentGroup || "-"}`, size: 14, bold: true },
    { text: "Date/Time | Type | Amount | Balance | Description", bold: true },
    ...buildLedgerReportLines(groupLedger),
    { text: "" },
    { text: "All Transactions", size: 14, bold: true },
    { text: "Date/Time | Type | Group | Amount | Description | Notes", bold: true },
    ...transactions.map((entry) => ({
      text: `${formatDateTime(entry.date, entry.time)} | ${entry.type} | ${entry.category} | ${formatReportAmount(entry.amount)} | ${entry.description} | ${entry.notes || ""}`,
    })),
    { text: "" },
    { text: "Daily Expense Breakdown", size: 14, bold: true },
    ...groupExpensesByDate(state.expenses).flatMap(([date, items]) => [
      { text: `${formatDate(date)} - ${formatReportAmount(sum(items))}`, bold: true },
      ...items.map((expense) => ({ text: `  ${expense.description} | ${expense.category} | ${formatReportAmount(expense.amount)}` })),
    ]),
  ];

  return lines.length ? lines : [{ text: "No report data available." }];
}

function buildLedgerReportLines(entries) {
  let balance = 0;
  return entries.map((entry) => {
    balance += entry.type === "cash-in" ? entry.amount : -entry.amount;
    return {
      text: `${formatDateTime(entry.date, entry.time)} | ${entry.type === "cash-in" ? "Cash In" : "Expense"} | ${formatReportAmount(entry.amount)} | ${formatReportAmount(balance)} | ${entry.description}`,
    };
  });
}

function formatReportAmount(value) {
  return `${state.settings.currency} ${Number(value || 0).toLocaleString("en", { maximumFractionDigits: 2 })}`;
}

function createPdfDocument(lines) {
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 42;
  const lineHeight = 15;
  const maxChars = 105;
  const rowsPerPage = Math.floor((pageHeight - margin * 2) / lineHeight);
  const rows = lines.flatMap((line) => wrapPdfLine(line, maxChars));
  const pages = [];
  for (let index = 0; index < rows.length; index += rowsPerPage) {
    pages.push(rows.slice(index, index + rowsPerPage));
  }

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  ];
  const pageObjectNumbers = [];
  pages.forEach((pageRows) => {
    const pageObjectNumber = objects.length + 1;
    const contentObjectNumber = objects.length + 2;
    pageObjectNumbers.push(pageObjectNumber);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`);
    const stream = buildPdfPageStream(pageRows, margin, pageHeight - margin, lineHeight);
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });
  objects[1] = `<< /Type /Pages /Kids [${pageObjectNumbers.map((number) => `${number} 0 R`).join(" ")}] /Count ${pageObjectNumbers.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return pdf;
}

function wrapPdfLine(line, maxChars) {
  const text = String(line.text || "");
  if (text.length <= maxChars) {
    return [line];
  }
  const rows = [];
  let remaining = text;
  while (remaining.length > maxChars) {
    const splitAt = Math.max(remaining.lastIndexOf(" ", maxChars), Math.floor(maxChars * 0.75));
    rows.push({ ...line, text: remaining.slice(0, splitAt), size: line.size || 9 });
    remaining = remaining.slice(splitAt).trim();
  }
  rows.push({ ...line, text: remaining, size: line.size || 9 });
  return rows;
}

function buildPdfPageStream(rows, x, startY, lineHeight) {
  return rows.map((row, index) => {
    const y = startY - index * lineHeight;
    const font = row.bold ? "F2" : "F1";
    const size = row.size || 9;
    return `BT /${font} ${size} Tf ${x} ${y} Td (${escapePdfText(row.text)}) Tj ET`;
  }).join("\n");
}

function escapePdfText(value) {
  return String(value)
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
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

function toDateInputValue(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
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

function normalizeDateInputValue(value) {
  const raw = String(value || "").trim();
  const isoDate = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoDate) {
    return isoDate[1];
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return [
      parsed.getFullYear(),
      String(parsed.getMonth() + 1).padStart(2, "0"),
      String(parsed.getDate()).padStart(2, "0"),
    ].join("-");
  }

  return getCurrentISTDate();
}

function normalizeTimeInputValue(value) {
  const raw = String(value || "").trim();
  const time = raw.match(/^(\d{1,2}):(\d{2})/);
  if (time) {
    return `${time[1].padStart(2, "0")}:${time[2]}`;
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return [
      String(parsed.getHours()).padStart(2, "0"),
      String(parsed.getMinutes()).padStart(2, "0"),
    ].join(":");
  }

  return "00:00";
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

function formatDateTimeFromIso(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatFileSize(value) {
  const size = Number(value || 0);
  if (size >= 1048576) {
    return `${(size / 1048576).toFixed(1)} MB`;
  }
  if (size >= 1024) {
    return `${Math.round(size / 1024)} KB`;
  }
  return `${size} B`;
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
