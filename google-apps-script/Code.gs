/**
 * FastStack Google Sheets backend.
 *
 * Deploy this file as a Google Apps Script Web App:
 * - Execute as: Me
 * - Who has access: Anyone
 *
 * The spreadsheet remains private. Browser clients only call this script URL and
 * must authenticate with an API session token issued by login().
 */

const FASTSTACK_TIME_ZONE = "Asia/Kolkata";
const FASTSTACK_SESSION_DAYS = 7;
const FASTSTACK_VERIFICATION_MINUTES = 30;
const FASTSTACK_RESET_MINUTES = 20;
const FASTSTACK_BACKUP_RETENTION_DAYS = 30;
const FASTSTACK_BACKUP_FOLDER_NAME = "FastStack Expense Tracker Backups";
const FASTSTACK_BACKUP_PREFIX = "FastStack Expense Tracker Backup - ";
const FASTSTACK_FRONTEND_URL = "https://comeback2000.github.io/faststack/";
const FASTSTACK_PROPERTIES = {
  SPREADSHEET_ID: "FASTSTACK_SPREADSHEET_ID",
  APP_SECRET: "FASTSTACK_APP_SECRET",
  BACKUP_FOLDER_ID: "FASTSTACK_BACKUP_FOLDER_ID",
  BACKUP_OWNER_EMAIL: "FASTSTACK_BACKUP_OWNER_EMAIL",
};

const FASTSTACK_SHEETS = {
  USERS: {
    name: "Users",
    headers: ["userId", "email", "passwordSalt", "passwordHash", "role", "status", "createdAt", "updatedAt", "lastLoginAt", "verifiedAt", "verificationCodeHash", "verificationExpiresAt", "resetCodeHash", "resetExpiresAt"],
  },
  SESSIONS: {
    name: "Sessions",
    headers: ["tokenHash", "userId", "email", "expiresAt", "createdAt", "lastSeenAt", "revokedAt"],
  },
  GROUPS: {
    name: "Categories",
    headers: ["groupId", "userId", "name", "color", "createdAt", "updatedAt", "archivedAt"],
  },
  TRANSACTIONS: {
    name: "Transactions",
    headers: ["transactionId", "userId", "type", "description", "amount", "category", "date", "time", "notes", "createdAt", "updatedAt", "deletedAt"],
  },
  BALANCES: {
    name: "Balances",
    headers: ["userId", "category", "allocated", "spent", "balance", "updatedAt"],
  },
  HISTORY: {
    name: "TransactionHistory",
    headers: ["timestamp", "userId", "email", "action", "entityType", "entityId", "details"],
  },
};

function setupFastStackBackend() {
  const properties = PropertiesService.getScriptProperties();
  let spreadsheetId = properties.getProperty(FASTSTACK_PROPERTIES.SPREADSHEET_ID);
  let spreadsheet;

  if (spreadsheetId) {
    spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  } else {
    spreadsheet = SpreadsheetApp.create("FastStack Expense Tracker Database");
    spreadsheetId = spreadsheet.getId();
    properties.setProperty(FASTSTACK_PROPERTIES.SPREADSHEET_ID, spreadsheetId);
  }

  if (!properties.getProperty(FASTSTACK_PROPERTIES.APP_SECRET)) {
    properties.setProperty(FASTSTACK_PROPERTIES.APP_SECRET, Utilities.getUuid() + Utilities.getUuid());
  }

  spreadsheet.setSpreadsheetTimeZone(FASTSTACK_TIME_ZONE);
  Object.keys(FASTSTACK_SHEETS).forEach(function (key) {
    ensureSheet_(spreadsheet, FASTSTACK_SHEETS[key]);
  });
  migrateUsersSheet_(spreadsheet.getSheetByName(FASTSTACK_SHEETS.USERS.name));
  tryEnsureBackupTrigger_();

  return {
    spreadsheetId: spreadsheetId,
    spreadsheetUrl: spreadsheet.getUrl(),
    backupFolderUrl: getBackupFolder_().getUrl(),
    nextStep: "Deploy this project as a Web App, then use the app sign-up screen with a gmail.com address.",
  };
}

function createUser(email, password, role) {
  setupFastStackBackend();
  const userEmail = validateGmailEmail_(email);
  const userPassword = normalizePasswordMaterial_(userEmail, password);
  const userRole = role === "admin" ? "admin" : "user";
  const now = nowIso_();
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const usersSheet = getSheet_(FASTSTACK_SHEETS.USERS.name);
    const users = readObjects_(usersSheet);
    if (users.some(function (user) { return String(user.email).toLowerCase() === userEmail; })) {
      throw new Error("A user with this email already exists.");
    }

    const salt = Utilities.getUuid();
    appendObject_(usersSheet, FASTSTACK_SHEETS.USERS.headers, {
      userId: "user-" + Utilities.getUuid(),
      email: userEmail,
      passwordSalt: salt,
      passwordHash: hashPassword_(userPassword, salt),
      role: userRole,
      status: "active",
      createdAt: now,
      updatedAt: now,
      lastLoginAt: "",
      verifiedAt: now,
      verificationCodeHash: "",
      verificationExpiresAt: "",
      resetCodeHash: "",
      resetExpiresAt: "",
    });
    return "User created: " + userEmail;
  } finally {
    lock.releaseLock();
  }
}

function resetUserPassword(email, newPassword) {
  setupFastStackBackend();
  const userEmail = validateGmailEmail_(email);
  const userPassword = normalizePasswordMaterial_(userEmail, newPassword);
  const usersSheet = getSheet_(FASTSTACK_SHEETS.USERS.name);
  const data = usersSheet.getDataRange().getValues();
  const headers = data[0];
  const map = headerMap_(headers);

  for (let row = 1; row < data.length; row += 1) {
    if (String(data[row][map.email]).toLowerCase() === userEmail) {
      const salt = Utilities.getUuid();
      usersSheet.getRange(row + 1, map.passwordSalt + 1).setValue(salt);
      usersSheet.getRange(row + 1, map.passwordHash + 1).setValue(hashPassword_(userPassword, salt));
      usersSheet.getRange(row + 1, map.updatedAt + 1).setValue(nowIso_());
      return "Password reset for: " + userEmail;
    }
  }

  throw new Error("User not found.");
}

function doGet(event) {
  try {
    ensureFastStackBackend_();
    if (event && event.parameter && event.parameter.verifyEmail && event.parameter.code) {
      const result = handleApiRequest_({
        action: "verifyEmail",
        email: event.parameter.verifyEmail,
        code: event.parameter.code,
      });
      const message = result.ok ? result.data.message : result.error;
      return htmlResponse_(message, result.ok);
    }

    if (event && event.parameter && event.parameter.callback && event.parameter.payload) {
      const callback = validateCallback_(event.parameter.callback);
      const request = JSON.parse(event.parameter.payload);
      return javascriptResponse_(callback + "(" + JSON.stringify(handleApiRequest_(request)) + ");");
    }

    return jsonResponse_({
      ok: true,
      data: {
        service: "FastStack Google Sheets API",
        status: "ready",
      },
    });
  } catch (error) {
    const callback = event && event.parameter && event.parameter.callback;
    if (callback && /^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback)) {
      return javascriptResponse_(callback + "(" + JSON.stringify({ ok: false, error: safeError_(error) }) + ");");
    }
    if (event && event.parameter && event.parameter.verifyEmail) {
      return htmlResponse_(safeError_(error), false);
    }
    return jsonResponse_({ ok: false, error: safeError_(error) });
  }
}

function doPost(event) {
  try {
    ensureFastStackBackend_();
    const request = parseRequest_(event);
    return jsonResponse_(handleApiRequest_(request));
  } catch (error) {
    return jsonResponse_({ ok: false, error: safeError_(error) });
  }
}

function handleApiRequest_(request) {
  const action = String(request.action || "");
  let data;

  if (action === "login") {
    data = login_(request);
  } else if (action === "register") {
    data = register_(request);
  } else if (action === "verifyEmail") {
    data = verifyEmail_(request);
  } else if (action === "resendVerification") {
    data = resendVerification_(request);
  } else if (action === "requestPasswordReset") {
    data = requestPasswordReset_(request);
  } else if (action === "resetPassword") {
    data = resetPassword_(request);
  } else if (action === "logout") {
    data = logout_(request);
  } else {
    const session = requireSession_(request.token);
    if (action === "bootstrap") {
      data = bootstrap_(session);
    } else if (action === "saveGroup") {
      data = saveGroup_(session, request.group);
    } else if (action === "renameGroup") {
      data = renameGroup_(session, request.oldName, request.group);
    } else if (action === "deleteGroup") {
      data = deleteGroup_(session, request.name);
    } else if (action === "saveTransaction") {
      data = saveTransaction_(session, request.transaction);
    } else if (action === "deleteTransaction") {
      data = deleteTransaction_(session, request.id);
    } else if (action === "updatePassword") {
      data = updatePassword_(session, request.currentPassword, request.newPassword);
    } else if (action === "deleteAccount") {
      data = deleteAccount_(session);
    } else if (action === "listBackups") {
      data = listBackups_(session);
    } else if (action === "createBackup") {
      data = createBackupForSession_(session);
    } else if (action === "restoreBackup") {
      data = restoreBackup_(session, request.backupId);
    } else {
      throw new Error("Unsupported action.");
    }
  }

  return { ok: true, data: data };
}

function register_(request) {
  const email = validateGmailEmail_(request.email);
  const password = normalizePasswordMaterial_(email, request.password);
  rateLimitAction_("register", email, 5, 3600);
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const usersSheet = getSheet_(FASTSTACK_SHEETS.USERS.name);
    const data = usersSheet.getDataRange().getValues();
    const map = headerMap_(data[0]);
    const now = nowIso_();
    const code = createCode_();
    const expiresAt = minutesFromNowIso_(FASTSTACK_VERIFICATION_MINUTES);

    for (let row = 1; row < data.length; row += 1) {
      if (String(data[row][map.email]).toLowerCase() === email) {
        if (data[row][map.status] === "active" && data[row][map.verifiedAt]) {
          throw new Error("An account already exists for this email.");
        }

        const salt = Utilities.getUuid();
        usersSheet.getRange(row + 1, map.passwordSalt + 1).setValue(salt);
        usersSheet.getRange(row + 1, map.passwordHash + 1).setValue(hashPassword_(password, salt));
        usersSheet.getRange(row + 1, map.status + 1).setValue("pending");
        usersSheet.getRange(row + 1, map.updatedAt + 1).setValue(now);
        usersSheet.getRange(row + 1, map.verificationCodeHash + 1).setValue(hashCode_(email, code));
        usersSheet.getRange(row + 1, map.verificationExpiresAt + 1).setValue(expiresAt);
        sendVerificationEmail_(email, code);
        return { message: "Verification code sent to your Gmail address." };
      }
    }

    const salt = Utilities.getUuid();
    appendObject_(usersSheet, FASTSTACK_SHEETS.USERS.headers, {
      userId: "user-" + Utilities.getUuid(),
      email: email,
      passwordSalt: salt,
      passwordHash: hashPassword_(password, salt),
      role: "user",
      status: "pending",
      createdAt: now,
      updatedAt: now,
      lastLoginAt: "",
      verifiedAt: "",
      verificationCodeHash: hashCode_(email, code),
      verificationExpiresAt: expiresAt,
      resetCodeHash: "",
      resetExpiresAt: "",
    });
    sendVerificationEmail_(email, code);
    return { message: "Verification code sent to your Gmail address." };
  } finally {
    lock.releaseLock();
  }
}

function verifyEmail_(request) {
  const email = validateGmailEmail_(request.email);
  const code = validateCode_(request.code);
  const usersSheet = getSheet_(FASTSTACK_SHEETS.USERS.name);
  const data = usersSheet.getDataRange().getValues();
  const map = headerMap_(data[0]);
  const now = nowIso_();

  for (let row = 1; row < data.length; row += 1) {
    if (String(data[row][map.email]).toLowerCase() === email) {
      if (data[row][map.status] === "active" && data[row][map.verifiedAt]) {
        return { message: "Email is already verified. You can log in now." };
      }
      if (new Date(data[row][map.verificationExpiresAt]) < new Date()) {
        throw new Error("Verification code expired. Request a new code.");
      }
      if (data[row][map.verificationCodeHash] !== hashCode_(email, code)) {
        throw new Error("Invalid verification code.");
      }

      usersSheet.getRange(row + 1, map.status + 1).setValue("active");
      usersSheet.getRange(row + 1, map.verifiedAt + 1).setValue(now);
      usersSheet.getRange(row + 1, map.updatedAt + 1).setValue(now);
      usersSheet.getRange(row + 1, map.verificationCodeHash + 1).setValue("");
      usersSheet.getRange(row + 1, map.verificationExpiresAt + 1).setValue("");
      logHistory_({ userId: data[row][map.userId], email: email }, "verifyEmail", "user", data[row][map.userId], "");
      return { message: "Email verified. You can log in now." };
    }
  }

  throw new Error("Account not found.");
}

function resendVerification_(request) {
  const email = validateGmailEmail_(request.email);
  rateLimitAction_("verify", email, 5, 3600);
  const usersSheet = getSheet_(FASTSTACK_SHEETS.USERS.name);
  const data = usersSheet.getDataRange().getValues();
  const map = headerMap_(data[0]);
  const code = createCode_();

  for (let row = 1; row < data.length; row += 1) {
    if (String(data[row][map.email]).toLowerCase() === email) {
      if (data[row][map.status] === "active" && data[row][map.verifiedAt]) {
        return { message: "Email is already verified. You can log in now." };
      }
      usersSheet.getRange(row + 1, map.verificationCodeHash + 1).setValue(hashCode_(email, code));
      usersSheet.getRange(row + 1, map.verificationExpiresAt + 1).setValue(minutesFromNowIso_(FASTSTACK_VERIFICATION_MINUTES));
      usersSheet.getRange(row + 1, map.updatedAt + 1).setValue(nowIso_());
      sendVerificationEmail_(email, code);
      return { message: "New verification code sent." };
    }
  }

  throw new Error("Account not found.");
}

function requestPasswordReset_(request) {
  const email = validateGmailEmail_(request.email);
  rateLimitAction_("reset", email, 5, 3600);
  const usersSheet = getSheet_(FASTSTACK_SHEETS.USERS.name);
  const data = usersSheet.getDataRange().getValues();
  const map = headerMap_(data[0]);
  const code = createCode_();

  for (let row = 1; row < data.length; row += 1) {
    if (String(data[row][map.email]).toLowerCase() === email && data[row][map.status] === "active") {
      usersSheet.getRange(row + 1, map.resetCodeHash + 1).setValue(hashCode_(email, code));
      usersSheet.getRange(row + 1, map.resetExpiresAt + 1).setValue(minutesFromNowIso_(FASTSTACK_RESET_MINUTES));
      usersSheet.getRange(row + 1, map.updatedAt + 1).setValue(nowIso_());
      sendPasswordResetEmail_(email, code);
      return { message: "Password reset code sent to your Gmail address." };
    }
  }

  return { message: "If an active account exists, a password reset code has been sent." };
}

function resetPassword_(request) {
  const email = validateGmailEmail_(request.email);
  const code = validateCode_(request.code);
  const password = normalizePasswordMaterial_(email, request.password);
  const usersSheet = getSheet_(FASTSTACK_SHEETS.USERS.name);
  const data = usersSheet.getDataRange().getValues();
  const map = headerMap_(data[0]);
  const now = nowIso_();

  for (let row = 1; row < data.length; row += 1) {
    if (String(data[row][map.email]).toLowerCase() === email && data[row][map.status] === "active") {
      if (new Date(data[row][map.resetExpiresAt]) < new Date()) {
        throw new Error("Password reset code expired. Request a new code.");
      }
      if (data[row][map.resetCodeHash] !== hashCode_(email, code)) {
        throw new Error("Invalid password reset code.");
      }

      const salt = Utilities.getUuid();
      usersSheet.getRange(row + 1, map.passwordSalt + 1).setValue(salt);
      usersSheet.getRange(row + 1, map.passwordHash + 1).setValue(hashPassword_(password, salt));
      usersSheet.getRange(row + 1, map.resetCodeHash + 1).setValue("");
      usersSheet.getRange(row + 1, map.resetExpiresAt + 1).setValue("");
      usersSheet.getRange(row + 1, map.updatedAt + 1).setValue(now);
      revokeSessionsForUser_(data[row][map.userId]);
      logHistory_({ userId: data[row][map.userId], email: email }, "resetPassword", "user", data[row][map.userId], "");
      return { message: "Password updated. Please log in with your new password." };
    }
  }

  throw new Error("Account not found.");
}

function login_(request) {
  const email = validateGmailEmail_(request.email);
  const password = normalizePasswordMaterial_(email, request.password);
  rateLimitLogin_(email);

  const usersSheet = getSheet_(FASTSTACK_SHEETS.USERS.name);
  const users = readObjects_(usersSheet);
  const user = users.find(function (item) {
    return String(item.email).toLowerCase() === email;
  });

  if (!user || user.passwordHash !== hashPassword_(password, user.passwordSalt)) {
    throw new Error("Invalid email or password.");
  }
  if (user.status !== "active" || !user.verifiedAt) {
    throw new Error("Please verify your Gmail address before logging in.");
  }

  CacheService.getScriptCache().remove("login:" + sha256Hex_(email));
  const token = Utilities.getUuid() + "." + Utilities.getUuid() + "." + Date.now();
  const now = nowIso_();
  const expiresAt = new Date(Date.now() + FASTSTACK_SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  appendObject_(getSheet_(FASTSTACK_SHEETS.SESSIONS.name), FASTSTACK_SHEETS.SESSIONS.headers, {
    tokenHash: sha256Hex_(token),
    userId: user.userId,
    email: user.email,
    expiresAt: expiresAt,
    createdAt: now,
    lastSeenAt: now,
    revokedAt: "",
  });
  updateUserLastLogin_(user.userId, now);
  logHistory_(user, "login", "session", "", "");

  return {
    token: token,
    user: {
      email: user.email,
      role: user.role,
    },
  };
}

function logout_(request) {
  const token = validateToken_(request.token);
  const tokenHash = sha256Hex_(token);
  const sessionsSheet = getSheet_(FASTSTACK_SHEETS.SESSIONS.name);
  const data = sessionsSheet.getDataRange().getValues();
  const headers = data[0];
  const map = headerMap_(headers);
  const now = nowIso_();

  for (let row = 1; row < data.length; row += 1) {
    if (data[row][map.tokenHash] === tokenHash && !data[row][map.revokedAt]) {
      sessionsSheet.getRange(row + 1, map.revokedAt + 1).setValue(now);
    }
  }

  return { loggedOut: true };
}

function bootstrap_(session) {
  return {
    user: getUserAccount_(session),
    groups: getGroupsForUser_(session.userId),
    transactions: getTransactionsForUser_(session.userId),
    balances: getBalancesForUser_(session.userId),
  };
}

function saveGroup_(session, group) {
  const normalized = validateGroup_(group);
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const saved = upsertGroup_(session.userId, normalized.name, normalized.color);
    refreshBalances_(session.userId);
    logHistory_(session, "saveGroup", "category", saved.name, JSON.stringify(saved));
    return { group: saved, balances: getBalancesForUser_(session.userId) };
  } finally {
    lock.releaseLock();
  }
}

function renameGroup_(session, oldName, group) {
  const sourceName = sanitizeText_(oldName, 60, "Group name");
  const normalized = validateGroup_(group);
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const groupsSheet = getSheet_(FASTSTACK_SHEETS.GROUPS.name);
    const groupsData = groupsSheet.getDataRange().getValues();
    const groupMap = headerMap_(groupsData[0]);
    let matchedRow = -1;

    for (let row = 1; row < groupsData.length; row += 1) {
      const sameUser = groupsData[row][groupMap.userId] === session.userId;
      const active = !groupsData[row][groupMap.archivedAt];
      const name = String(groupsData[row][groupMap.name]);
      if (sameUser && active && name.toLowerCase() === normalized.name.toLowerCase() && name.toLowerCase() !== sourceName.toLowerCase()) {
        throw new Error("A category with this name already exists.");
      }
      if (sameUser && active && name.toLowerCase() === sourceName.toLowerCase()) {
        matchedRow = row + 1;
      }
    }

    if (matchedRow < 0) {
      throw new Error("Category not found.");
    }

    groupsSheet.getRange(matchedRow, groupMap.name + 1).setValue(normalized.name);
    groupsSheet.getRange(matchedRow, groupMap.color + 1).setValue(normalized.color);
    groupsSheet.getRange(matchedRow, groupMap.updatedAt + 1).setValue(nowIso_());
    renameTransactionCategory_(session.userId, sourceName, normalized.name);
    refreshBalances_(session.userId);
    logHistory_(session, "renameGroup", "category", normalized.name, sourceName + " -> " + normalized.name);
    return { group: normalized };
  } finally {
    lock.releaseLock();
  }
}

function deleteGroup_(session, name) {
  const groupName = sanitizeText_(name, 60, "Group name");
  const hasEntries = getTransactionsForUser_(session.userId).some(function (transaction) {
    return transaction.category.toLowerCase() === groupName.toLowerCase();
  });
  if (hasEntries) {
    throw new Error("This category has transactions. Move or delete those entries first.");
  }

  const groupsSheet = getSheet_(FASTSTACK_SHEETS.GROUPS.name);
  const groupsData = groupsSheet.getDataRange().getValues();
  const map = headerMap_(groupsData[0]);
  const now = nowIso_();

  for (let row = 1; row < groupsData.length; row += 1) {
    if (groupsData[row][map.userId] === session.userId && String(groupsData[row][map.name]).toLowerCase() === groupName.toLowerCase() && !groupsData[row][map.archivedAt]) {
      groupsSheet.getRange(row + 1, map.archivedAt + 1).setValue(now);
      groupsSheet.getRange(row + 1, map.updatedAt + 1).setValue(now);
      refreshBalances_(session.userId);
      logHistory_(session, "deleteGroup", "category", groupName, "");
      return { deleted: true };
    }
  }

  throw new Error("Category not found.");
}

function saveTransaction_(session, transaction) {
  const normalized = validateTransaction_(transaction);
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    upsertGroup_(session.userId, normalized.category, normalized.color);
    const result = upsertTransaction_(session.userId, normalized);
    if (result.previous) {
      adjustBalanceForTransaction_(session.userId, result.previous, -1);
    }
    adjustBalanceForTransaction_(session.userId, result.saved, 1);
    logHistory_(session, "saveTransaction", "transaction", result.saved.id, JSON.stringify(result.saved));
    return { transaction: result.saved };
  } finally {
    lock.releaseLock();
  }
}

function deleteTransaction_(session, id) {
  const transactionId = validateId_(id);
  const sheet = getSheet_(FASTSTACK_SHEETS.TRANSACTIONS.name);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const map = headerMap_(headers);
  const now = nowIso_();

  for (let row = 1; row < data.length; row += 1) {
    if (data[row][map.transactionId] === transactionId && data[row][map.userId] === session.userId && !data[row][map.deletedAt]) {
      sheet.getRange(row + 1, map.deletedAt + 1).setValue(now);
      refreshBalances_(session.userId);
      logHistory_(session, "deleteTransaction", "transaction", transactionId, "");
      return { deleted: true };
    }
  }

  throw new Error("Transaction not found.");
}

function updatePassword_(session, currentPassword, newPassword) {
  const currentMaterial = normalizePasswordMaterial_(session.email, currentPassword);
  const newMaterial = normalizePasswordMaterial_(session.email, newPassword);
  const usersSheet = getSheet_(FASTSTACK_SHEETS.USERS.name);
  const data = usersSheet.getDataRange().getValues();
  const map = headerMap_(data[0]);
  const now = nowIso_();

  for (let row = 1; row < data.length; row += 1) {
    if (data[row][map.userId] === session.userId && String(data[row][map.email]).toLowerCase() === session.email) {
      if (data[row][map.passwordHash] !== hashPassword_(currentMaterial, data[row][map.passwordSalt])) {
        throw new Error("Current password is incorrect.");
      }

      const salt = Utilities.getUuid();
      usersSheet.getRange(row + 1, map.passwordSalt + 1).setValue(salt);
      usersSheet.getRange(row + 1, map.passwordHash + 1).setValue(hashPassword_(newMaterial, salt));
      usersSheet.getRange(row + 1, map.updatedAt + 1).setValue(now);
      logHistory_(session, "updatePassword", "user", session.userId, "");
      return { updated: true };
    }
  }

  throw new Error("Account not found.");
}

function deleteAccount_(session) {
  const now = nowIso_();
  const usersSheet = getSheet_(FASTSTACK_SHEETS.USERS.name);
  const usersData = usersSheet.getDataRange().getValues();
  const usersMap = headerMap_(usersData[0]);

  for (let row = 1; row < usersData.length; row += 1) {
    if (usersData[row][usersMap.userId] === session.userId) {
      usersSheet.getRange(row + 1, usersMap.status + 1).setValue("deleted");
      usersSheet.getRange(row + 1, usersMap.updatedAt + 1).setValue(now);
    }
  }

  archiveGroupsForUser_(session.userId, now);
  deleteTransactionsForUser_(session.userId, now);
  removeBalancesForUser_(session.userId);
  revokeSessionsForUser_(session.userId, now);
  logHistory_(session, "deleteAccount", "user", session.userId, "");
  return { deleted: true };
}

function listBackups_(session) {
  requireBackupAccess_(session);
  cleanupOldBackups_();
  return {
    backups: getBackupFiles_().map(function (file) {
      return {
        id: file.getId(),
        name: file.getName(),
        createdAt: file.getDateCreated().toISOString(),
        updatedAt: file.getLastUpdated().toISOString(),
        size: file.getSize(),
        url: file.getUrl(),
      };
    }),
    retentionDays: FASTSTACK_BACKUP_RETENTION_DAYS,
    folderUrl: getBackupFolder_().getUrl(),
  };
}

function createBackupForSession_(session) {
  requireBackupAccess_(session);
  return {
    backup: createFastStackBackup_("manual", session.email),
    backups: getBackupFiles_().map(function (file) {
      return {
        id: file.getId(),
        name: file.getName(),
        createdAt: file.getDateCreated().toISOString(),
        updatedAt: file.getLastUpdated().toISOString(),
        size: file.getSize(),
        url: file.getUrl(),
      };
    }),
  };
}

function restoreBackup_(session, backupId) {
  requireBackupAccess_(session);
  const cleanId = validateId_(backupId);
  const folder = getBackupFolder_();
  const backupFile = DriveApp.getFileById(cleanId);
  if (!isFileInFolder_(backupFile, folder) || backupFile.getName().indexOf(FASTSTACK_BACKUP_PREFIX) !== 0) {
    throw new Error("Backup not found.");
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const restorePoint = createFastStackBackup_("pre-restore", session.email);
    const target = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty(FASTSTACK_PROPERTIES.SPREADSHEET_ID));
    const source = SpreadsheetApp.openById(cleanId);
    Object.keys(FASTSTACK_SHEETS).forEach(function (key) {
      const definition = FASTSTACK_SHEETS[key];
      const sourceSheet = source.getSheetByName(definition.name);
      const targetSheet = ensureSheet_(target, definition);
      targetSheet.clearContents();
      if (sourceSheet && sourceSheet.getLastRow() > 0 && sourceSheet.getLastColumn() > 0) {
        const values = sourceSheet.getDataRange().getValues();
        targetSheet.getRange(1, 1, values.length, values[0].length).setValues(values);
      } else {
        targetSheet.getRange(1, 1, 1, definition.headers.length).setValues([definition.headers]);
      }
    });
    target.setSpreadsheetTimeZone(FASTSTACK_TIME_ZONE);
    migrateUsersSheet_(target.getSheetByName(FASTSTACK_SHEETS.USERS.name));
    cleanupOldBackups_();
    logHistory_(session, "restoreBackup", "backup", cleanId, "Pre-restore backup: " + restorePoint.id);
    return {
      restored: true,
      restoredBackupId: cleanId,
      preRestoreBackup: restorePoint,
    };
  } finally {
    lock.releaseLock();
  }
}

function runFastStackDailyBackup() {
  ensureFastStackBackend_();
  return createFastStackBackup_("daily", "trigger");
}

function requireSession_(token) {
  const cleanToken = validateToken_(token);
  const tokenHash = sha256Hex_(cleanToken);
  const sessionsSheet = getSheet_(FASTSTACK_SHEETS.SESSIONS.name);
  const data = sessionsSheet.getDataRange().getValues();
  const headers = data[0];
  const map = headerMap_(headers);
  const now = new Date();

  for (let row = 1; row < data.length; row += 1) {
    const expiresAt = new Date(data[row][map.expiresAt]);
    if (data[row][map.tokenHash] === tokenHash && !data[row][map.revokedAt] && expiresAt > now) {
      sessionsSheet.getRange(row + 1, map.lastSeenAt + 1).setValue(nowIso_());
      return {
        userId: data[row][map.userId],
        email: data[row][map.email],
        role: getRoleForUser_(data[row][map.userId]),
      };
    }
  }

  throw new Error("Session expired. Please log in again.");
}

function upsertGroup_(userId, name, color) {
  const sheet = getSheet_(FASTSTACK_SHEETS.GROUPS.name);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const map = headerMap_(headers);
  const now = nowIso_();

  for (let row = 1; row < data.length; row += 1) {
    if (data[row][map.userId] === userId && String(data[row][map.name]).toLowerCase() === name.toLowerCase() && !data[row][map.archivedAt]) {
      sheet.getRange(row + 1, map.color + 1).setValue(color);
      sheet.getRange(row + 1, map.updatedAt + 1).setValue(now);
      return { name: name, color: color };
    }
  }

  appendObject_(sheet, FASTSTACK_SHEETS.GROUPS.headers, {
    groupId: "group-" + Utilities.getUuid(),
    userId: userId,
    name: name,
    color: color,
    createdAt: now,
    updatedAt: now,
    archivedAt: "",
  });
  return { name: name, color: color };
}

function renameTransactionCategory_(userId, oldName, newName) {
  const sheet = getSheet_(FASTSTACK_SHEETS.TRANSACTIONS.name);
  const data = sheet.getDataRange().getValues();
  const map = headerMap_(data[0]);
  const now = nowIso_();

  for (let row = 1; row < data.length; row += 1) {
    if (data[row][map.userId] === userId && !data[row][map.deletedAt] && String(data[row][map.category]).toLowerCase() === oldName.toLowerCase()) {
      sheet.getRange(row + 1, map.category + 1).setValue(newName);
      sheet.getRange(row + 1, map.updatedAt + 1).setValue(now);
    }
  }
}

function upsertTransaction_(userId, transaction) {
  const sheet = getSheet_(FASTSTACK_SHEETS.TRANSACTIONS.name);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const map = headerMap_(headers);
  const now = nowIso_();

  for (let row = 1; row < data.length; row += 1) {
    if (data[row][map.transactionId] === transaction.id && data[row][map.userId] === userId && !data[row][map.deletedAt]) {
      const previous = {
        id: data[row][map.transactionId],
        type: data[row][map.type],
        amount: Number(data[row][map.amount]),
        category: data[row][map.category],
      };
      sheet.getRange(row + 1, map.type + 1).setValue(transaction.type);
      sheet.getRange(row + 1, map.description + 1).setValue(transaction.description);
      sheet.getRange(row + 1, map.amount + 1).setValue(transaction.amount);
      sheet.getRange(row + 1, map.category + 1).setValue(transaction.category);
      sheet.getRange(row + 1, map.date + 1).setValue(transaction.date);
      sheet.getRange(row + 1, map.time + 1).setValue(transaction.time);
      sheet.getRange(row + 1, map.notes + 1).setValue(transaction.notes);
      sheet.getRange(row + 1, map.updatedAt + 1).setValue(now);
      return { saved: transaction, previous: previous };
    }
  }

  appendObject_(sheet, FASTSTACK_SHEETS.TRANSACTIONS.headers, {
    transactionId: transaction.id,
    userId: userId,
    type: transaction.type,
    description: transaction.description,
    amount: transaction.amount,
    category: transaction.category,
    date: transaction.date,
    time: transaction.time,
    notes: transaction.notes,
    createdAt: now,
    updatedAt: now,
    deletedAt: "",
  });
  return { saved: transaction, previous: null };
}

function adjustBalanceForTransaction_(userId, transaction, multiplier) {
  const sheet = getSheet_(FASTSTACK_SHEETS.BALANCES.name);
  const data = sheet.getDataRange().getValues();
  const map = headerMap_(data[0]);
  const amount = Number(transaction.amount || 0) * multiplier;
  const category = transaction.category || "Other";
  const now = nowIso_();

  for (let row = 1; row < data.length; row += 1) {
    if (data[row][map.userId] === userId && data[row][map.category] === category) {
      const allocated = Number(data[row][map.allocated] || 0) + (transaction.type === "cash-in" ? amount : 0);
      const spent = Number(data[row][map.spent] || 0) + (transaction.type === "expense" ? amount : 0);
      sheet.getRange(row + 1, map.allocated + 1).setValue(Math.round(allocated * 100) / 100);
      sheet.getRange(row + 1, map.spent + 1).setValue(Math.round(spent * 100) / 100);
      sheet.getRange(row + 1, map.balance + 1).setValue(Math.round((allocated - spent) * 100) / 100);
      sheet.getRange(row + 1, map.updatedAt + 1).setValue(now);
      return;
    }
  }

  const allocated = transaction.type === "cash-in" ? amount : 0;
  const spent = transaction.type === "expense" ? amount : 0;
  appendObject_(sheet, FASTSTACK_SHEETS.BALANCES.headers, {
    userId: userId,
    category: category,
    allocated: Math.round(allocated * 100) / 100,
    spent: Math.round(spent * 100) / 100,
    balance: Math.round((allocated - spent) * 100) / 100,
    updatedAt: now,
  });
}

function refreshBalances_(userId) {
  const balancesSheet = getSheet_(FASTSTACK_SHEETS.BALANCES.name);
  const allBalances = readObjects_(balancesSheet).filter(function (row) {
    return row.userId !== userId;
  });
  const categories = {};

  getGroupsForUser_(userId).forEach(function (group) {
    categories[group.name] = { allocated: 0, spent: 0, color: group.color };
  });

  getTransactionsForUser_(userId).forEach(function (transaction) {
    if (!categories[transaction.category]) {
      categories[transaction.category] = { allocated: 0, spent: 0 };
    }
    if (transaction.type === "cash-in") {
      categories[transaction.category].allocated += Number(transaction.amount);
    } else {
      categories[transaction.category].spent += Number(transaction.amount);
    }
  });

  Object.keys(categories).forEach(function (category) {
    const row = categories[category];
    allBalances.push({
      userId: userId,
      category: category,
      allocated: row.allocated,
      spent: row.spent,
      balance: row.allocated - row.spent,
      updatedAt: nowIso_(),
    });
  });

  rewriteObjects_(balancesSheet, FASTSTACK_SHEETS.BALANCES.headers, allBalances);
}

function getGroupsForUser_(userId) {
  return readObjects_(getSheet_(FASTSTACK_SHEETS.GROUPS.name))
    .filter(function (row) { return row.userId === userId && !row.archivedAt; })
    .map(function (row) { return { name: row.name, color: row.color }; });
}

function getTransactionsForUser_(userId) {
  return readObjects_(getSheet_(FASTSTACK_SHEETS.TRANSACTIONS.name))
    .filter(function (row) { return row.userId === userId && !row.deletedAt; })
    .map(function (row) {
      return {
        id: row.transactionId,
        type: row.type,
        description: row.description,
        amount: Number(row.amount),
        category: row.category,
        date: sheetDateToInput_(row.date),
        time: sheetTimeToInput_(row.time),
        notes: row.notes || "",
      };
    });
}

function getBalancesForUser_(userId) {
  return readObjects_(getSheet_(FASTSTACK_SHEETS.BALANCES.name))
    .filter(function (row) { return row.userId === userId; })
    .map(function (row) {
      return {
        category: row.category,
        allocated: Number(row.allocated),
        spent: Number(row.spent),
        balance: Number(row.balance),
      };
    });
}

function getUserAccount_(session) {
  const users = readObjects_(getSheet_(FASTSTACK_SHEETS.USERS.name));
  const user = users.find(function (row) {
    return row.userId === session.userId;
  });
  if (!user) {
    throw new Error("Account not found.");
  }

  return {
    email: user.email,
    role: user.role || "user",
    status: user.status || "active",
    createdAt: sheetDateTimeToIso_(user.createdAt),
    updatedAt: sheetDateTimeToIso_(user.updatedAt),
    lastLoginAt: sheetDateTimeToIso_(user.lastLoginAt),
    verifiedAt: sheetDateTimeToIso_(user.verifiedAt),
  };
}

function requireBackupAccess_(session) {
  const properties = PropertiesService.getScriptProperties();
  const ownerEmail = properties.getProperty(FASTSTACK_PROPERTIES.BACKUP_OWNER_EMAIL);
  if (!ownerEmail) {
    properties.setProperty(FASTSTACK_PROPERTIES.BACKUP_OWNER_EMAIL, session.email);
    return;
  }
  if (session.role === "admin" || String(ownerEmail).toLowerCase() === String(session.email).toLowerCase()) {
    return;
  }
  throw new Error("Only the backup owner or an admin can manage backups.");
}

function createFastStackBackup_(kind, actorEmail) {
  cleanupOldBackups_();
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty(FASTSTACK_PROPERTIES.SPREADSHEET_ID);
  if (!spreadsheetId) {
    throw new Error("Backend is not set up. Run setupFastStackBackend first.");
  }
  const sourceFile = DriveApp.getFileById(spreadsheetId);
  const folder = getBackupFolder_();
  const stamp = Utilities.formatDate(new Date(), FASTSTACK_TIME_ZONE, "yyyy-MM-dd HH-mm-ss");
  const backupName = FASTSTACK_BACKUP_PREFIX + stamp + " (" + kind + ")";
  const copy = sourceFile.makeCopy(backupName, folder);
  copy.setDescription(JSON.stringify({
    app: "FastStack Expense Tracker",
    kind: kind,
    actor: actorEmail || "",
    sourceSpreadsheetId: spreadsheetId,
    createdAt: new Date().toISOString(),
    retentionDays: FASTSTACK_BACKUP_RETENTION_DAYS,
  }));
  cleanupOldBackups_();
  return {
    id: copy.getId(),
    name: copy.getName(),
    createdAt: copy.getDateCreated().toISOString(),
    updatedAt: copy.getLastUpdated().toISOString(),
    size: copy.getSize(),
    url: copy.getUrl(),
  };
}

function getBackupFolder_() {
  const properties = PropertiesService.getScriptProperties();
  const folderId = properties.getProperty(FASTSTACK_PROPERTIES.BACKUP_FOLDER_ID);
  if (folderId) {
    try {
      return DriveApp.getFolderById(folderId);
    } catch (error) {
      properties.deleteProperty(FASTSTACK_PROPERTIES.BACKUP_FOLDER_ID);
    }
  }

  const folders = DriveApp.getFoldersByName(FASTSTACK_BACKUP_FOLDER_NAME);
  const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(FASTSTACK_BACKUP_FOLDER_NAME);
  properties.setProperty(FASTSTACK_PROPERTIES.BACKUP_FOLDER_ID, folder.getId());
  return folder;
}

function getBackupFiles_() {
  const folder = getBackupFolder_();
  const files = folder.getFiles();
  const backups = [];
  while (files.hasNext()) {
    const file = files.next();
    if (file.getName().indexOf(FASTSTACK_BACKUP_PREFIX) === 0) {
      backups.push(file);
    }
  }
  backups.sort(function (a, b) {
    return b.getDateCreated().getTime() - a.getDateCreated().getTime();
  });
  return backups;
}

function cleanupOldBackups_() {
  const cutoff = Date.now() - FASTSTACK_BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  getBackupFiles_().forEach(function (file) {
    if (file.getDateCreated().getTime() < cutoff) {
      file.setTrashed(true);
    }
  });
}

function ensureBackupTrigger_() {
  const handler = "runFastStackDailyBackup";
  const exists = ScriptApp.getProjectTriggers().some(function (trigger) {
    return trigger.getHandlerFunction() === handler;
  });
  if (!exists) {
    ScriptApp.newTrigger(handler)
      .timeBased()
      .everyDays(1)
      .atHour(2)
      .nearMinute(15)
      .inTimezone(FASTSTACK_TIME_ZONE)
      .create();
  }
}

function tryEnsureBackupTrigger_() {
  try {
    ensureBackupTrigger_();
  } catch (error) {
    console.warn("Backup trigger is not installed yet: " + safeError_(error));
  }
}

function isFileInFolder_(file, folder) {
  const parents = file.getParents();
  while (parents.hasNext()) {
    if (parents.next().getId() === folder.getId()) {
      return true;
    }
  }
  return false;
}

function archiveGroupsForUser_(userId, now) {
  const sheet = getSheet_(FASTSTACK_SHEETS.GROUPS.name);
  const data = sheet.getDataRange().getValues();
  const map = headerMap_(data[0]);
  for (let row = 1; row < data.length; row += 1) {
    if (data[row][map.userId] === userId && !data[row][map.archivedAt]) {
      sheet.getRange(row + 1, map.archivedAt + 1).setValue(now);
      sheet.getRange(row + 1, map.updatedAt + 1).setValue(now);
    }
  }
}

function deleteTransactionsForUser_(userId, now) {
  const sheet = getSheet_(FASTSTACK_SHEETS.TRANSACTIONS.name);
  const data = sheet.getDataRange().getValues();
  const map = headerMap_(data[0]);
  for (let row = 1; row < data.length; row += 1) {
    if (data[row][map.userId] === userId && !data[row][map.deletedAt]) {
      sheet.getRange(row + 1, map.deletedAt + 1).setValue(now);
      sheet.getRange(row + 1, map.updatedAt + 1).setValue(now);
    }
  }
}

function removeBalancesForUser_(userId) {
  const sheet = getSheet_(FASTSTACK_SHEETS.BALANCES.name);
  const rows = readObjects_(sheet).filter(function (row) {
    return row.userId !== userId;
  });
  rewriteObjects_(sheet, FASTSTACK_SHEETS.BALANCES.headers, rows);
}

function revokeSessionsForUser_(userId, now) {
  const sheet = getSheet_(FASTSTACK_SHEETS.SESSIONS.name);
  const data = sheet.getDataRange().getValues();
  const map = headerMap_(data[0]);
  for (let row = 1; row < data.length; row += 1) {
    if (data[row][map.userId] === userId && !data[row][map.revokedAt]) {
      sheet.getRange(row + 1, map.revokedAt + 1).setValue(now);
    }
  }
}

function validateGroup_(group) {
  if (!group || typeof group !== "object") {
    throw new Error("Invalid group.");
  }
  return {
    name: sanitizeText_(group.name, 60, "Group name"),
    color: validateColor_(group.color),
  };
}

function validateTransaction_(transaction) {
  if (!transaction || typeof transaction !== "object") {
    throw new Error("Invalid transaction.");
  }

  const type = String(transaction.type || "");
  if (type !== "expense" && type !== "cash-in") {
    throw new Error("Invalid transaction type.");
  }

  return {
    id: validateId_(transaction.id),
    type: type,
    description: sanitizeText_(transaction.description, 80, "Description"),
    amount: validateAmount_(transaction.amount),
    category: sanitizeText_(transaction.category, 60, "Category"),
    color: validateColor_(transaction.color),
    date: validateDate_(transaction.date),
    time: validateTime_(transaction.time),
    notes: sanitizeText_(transaction.notes || "", 500, "Notes"),
  };
}

function validateEmail_(email) {
  const value = String(email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || value.length > 120) {
    throw new Error("Invalid email address.");
  }
  return value;
}

function validateGmailEmail_(email) {
  const value = validateEmail_(email);
  if (!value.endsWith("@gmail.com")) {
    throw new Error("Only gmail.com email addresses are allowed.");
  }
  return value;
}

function validatePassword_(password) {
  const value = String(password || "");
  if (value.length < 8 || value.length > 128) {
    throw new Error("Password must be 8 to 128 characters.");
  }
  return value;
}

function normalizePasswordMaterial_(email, password) {
  const value = validatePassword_(password);
  if (/^[a-f0-9]{64}$/i.test(value)) {
    return value.toLowerCase();
  }
  return sha256Hex_(email + ":" + value);
}

function validateCode_(code) {
  const value = String(code || "").replace(/\D/g, "");
  if (!/^\d{6}$/.test(value)) {
    throw new Error("Enter the 6-digit code.");
  }
  return value;
}

function validateCallback_(callback) {
  const value = String(callback || "");
  if (!/^[A-Za-z_$][0-9A-Za-z_$]*$/.test(value)) {
    throw new Error("Invalid callback.");
  }
  return value;
}

function validateToken_(token) {
  const value = String(token || "");
  if (!/^[A-Za-z0-9.\-]{60,180}$/.test(value)) {
    throw new Error("Invalid session token.");
  }
  return value;
}

function validateId_(id) {
  const value = String(id || "");
  if (!/^[A-Za-z0-9._:-]{1,160}$/.test(value)) {
    throw new Error("Invalid record id.");
  }
  return value;
}

function validateAmount_(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0 || value > 1000000000) {
    throw new Error("Invalid amount.");
  }
  return Math.round(value * 100) / 100;
}

function validateDate_(date) {
  const value = String(date || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Invalid date.");
  }
  return value;
}

function validateTime_(time) {
  const value = String(time || "");
  if (!/^\d{2}:\d{2}$/.test(value)) {
    throw new Error("Invalid time.");
  }
  return value;
}

function validateColor_(color) {
  const value = String(color || "#0f766e");
  if (!/^#[0-9a-fA-F]{6}$/.test(value)) {
    return "#0f766e";
  }
  return value.toLowerCase();
}

function sanitizeText_(value, maxLength, label) {
  const clean = String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").trim();
  if (!clean && label !== "Notes") {
    throw new Error(label + " is required.");
  }
  if (clean.length > maxLength) {
    throw new Error(label + " is too long.");
  }
  if (/^[=+\-@]/.test(clean)) {
    return "'" + clean;
  }
  return clean;
}

function parseRequest_(event) {
  if (!event || !event.postData || !event.postData.contents) {
    throw new Error("Missing request body.");
  }
  try {
    return JSON.parse(event.postData.contents);
  } catch (error) {
    throw new Error("Invalid JSON request.");
  }
}

function ensureFastStackBackend_() {
  const properties = PropertiesService.getScriptProperties();
  if (!properties.getProperty(FASTSTACK_PROPERTIES.SPREADSHEET_ID) || !properties.getProperty(FASTSTACK_PROPERTIES.APP_SECRET)) {
    setupFastStackBackend();
  }
  tryEnsureBackupTrigger_();
}

function ensureSheet_(spreadsheet, definition) {
  let sheet = spreadsheet.getSheetByName(definition.name);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(definition.name);
  }

  if (sheet.getLastRow() === 0 || sheet.getLastColumn() === 0) {
    sheet.getRange(1, 1, 1, definition.headers.length).setValues([definition.headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, Math.max(sheet.getMaxRows(), 1), definition.headers.length).setNumberFormat("@");
    return;
  }

  const existingHeaders = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0]
    .filter(function (header) { return header !== ""; });
  const missingHeaders = definition.headers.filter(function (header) {
    return existingHeaders.indexOf(header) === -1;
  });

  if (missingHeaders.length) {
    sheet.getRange(1, existingHeaders.length + 1, 1, missingHeaders.length).setValues([missingHeaders]);
  }

  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, Math.max(sheet.getMaxRows(), 1), Math.max(sheet.getLastColumn(), definition.headers.length)).setNumberFormat("@");
}

function migrateUsersSheet_(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return;
  }

  const map = headerMap_(data[0]);
  const now = nowIso_();
  for (let row = 1; row < data.length; row += 1) {
    if (data[row][map.status] === "active" && !data[row][map.verifiedAt]) {
      sheet.getRange(row + 1, map.verifiedAt + 1).setValue(data[row][map.createdAt] || now);
    }
  }
}

function getSheet_(name) {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty(FASTSTACK_PROPERTIES.SPREADSHEET_ID);
  if (!spreadsheetId) {
    throw new Error("Backend is not set up. Run setupFastStackBackend first.");
  }
  return SpreadsheetApp.openById(spreadsheetId).getSheetByName(name);
}

function readObjects_(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return [];
  }
  const headers = data[0];
  return data.slice(1).filter(function (row) {
    return row.some(function (cell) { return cell !== ""; });
  }).map(function (row) {
    const object = {};
    headers.forEach(function (header, index) {
      object[header] = row[index];
    });
    return object;
  });
}

function appendObject_(sheet, headers, object) {
  sheet.appendRow(headers.map(function (header) {
    return object[header] === undefined ? "" : object[header];
  }));
}

function rewriteObjects_(sheet, headers, objects) {
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  if (objects.length) {
    sheet.getRange(2, 1, objects.length, headers.length).setValues(objects.map(function (object) {
      return headers.map(function (header) {
        return object[header] === undefined ? "" : object[header];
      });
    }));
  }
}

function headerMap_(headers) {
  const map = {};
  headers.forEach(function (header, index) {
    map[header] = index;
  });
  return map;
}

function updateUserLastLogin_(userId, timestamp) {
  const usersSheet = getSheet_(FASTSTACK_SHEETS.USERS.name);
  const data = usersSheet.getDataRange().getValues();
  const map = headerMap_(data[0]);
  for (let row = 1; row < data.length; row += 1) {
    if (data[row][map.userId] === userId) {
      usersSheet.getRange(row + 1, map.lastLoginAt + 1).setValue(timestamp);
      usersSheet.getRange(row + 1, map.updatedAt + 1).setValue(timestamp);
      return;
    }
  }
}

function revokeSessionsForUser_(userId) {
  const sessionsSheet = getSheet_(FASTSTACK_SHEETS.SESSIONS.name);
  const data = sessionsSheet.getDataRange().getValues();
  if (data.length <= 1) {
    return;
  }

  const map = headerMap_(data[0]);
  const now = nowIso_();
  for (let row = 1; row < data.length; row += 1) {
    if (data[row][map.userId] === userId && !data[row][map.revokedAt]) {
      sessionsSheet.getRange(row + 1, map.revokedAt + 1).setValue(now);
    }
  }
}

function getRoleForUser_(userId) {
  const user = readObjects_(getSheet_(FASTSTACK_SHEETS.USERS.name)).find(function (row) {
    return row.userId === userId;
  });
  return user ? user.role : "user";
}

function logHistory_(session, action, entityType, entityId, details) {
  appendObject_(getSheet_(FASTSTACK_SHEETS.HISTORY.name), FASTSTACK_SHEETS.HISTORY.headers, {
    timestamp: nowIso_(),
    userId: session.userId || "",
    email: session.email || "",
    action: action,
    entityType: entityType,
    entityId: entityId,
    details: sanitizeText_(details || "", 1000, "Notes"),
  });
}

function rateLimitLogin_(email) {
  const cache = CacheService.getScriptCache();
  const key = "login:" + sha256Hex_(email);
  const attempts = Number(cache.get(key) || "0");
  if (attempts >= 10) {
    throw new Error("Too many login attempts. Please try again later.");
  }
  cache.put(key, String(attempts + 1), 900);
}

function rateLimitAction_(prefix, email, limit, ttlSeconds) {
  const cache = CacheService.getScriptCache();
  const key = prefix + ":" + sha256Hex_(email);
  const attempts = Number(cache.get(key) || "0");
  if (attempts >= limit) {
    throw new Error("Too many requests. Please try again later.");
  }
  cache.put(key, String(attempts + 1), ttlSeconds);
}

function createCode_() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashCode_(email, code) {
  const secret = PropertiesService.getScriptProperties().getProperty(FASTSTACK_PROPERTIES.APP_SECRET);
  return sha256Hex_(email + ":" + code + ":" + secret);
}

function minutesFromNowIso_(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

function sheetDateToInput_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, FASTSTACK_TIME_ZONE, "yyyy-MM-dd");
  }

  const raw = String(value || "").trim();
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) {
    return match[1];
  }

  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) {
    return Utilities.formatDate(parsed, FASTSTACK_TIME_ZONE, "yyyy-MM-dd");
  }

  return Utilities.formatDate(new Date(), FASTSTACK_TIME_ZONE, "yyyy-MM-dd");
}

function sheetTimeToInput_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, FASTSTACK_TIME_ZONE, "HH:mm");
  }

  const raw = String(value || "").trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (match) {
    return ("0" + match[1]).slice(-2) + ":" + match[2];
  }

  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) {
    return Utilities.formatDate(parsed, FASTSTACK_TIME_ZONE, "HH:mm");
  }

  return "00:00";
}

function sheetDateTimeToIso_(value) {
  if (!value) {
    return "";
  }
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString();
  }
  const parsed = new Date(String(value));
  return isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
}

function sendVerificationEmail_(email, code) {
  const subject = "Verify your FastStack Expense Tracker account";
  const verifyUrl = getVerificationUrl_(email, code);
  const body = [
    "Your FastStack verification code is: " + code,
    "",
    "This code expires in " + FASTSTACK_VERIFICATION_MINUTES + " minutes.",
    "",
    "You can also verify instantly by opening this link:",
    verifyUrl,
    "",
    "Open the app and enter this code:",
    FASTSTACK_FRONTEND_URL,
    "",
    "If you did not request this account, ignore this email.",
  ].join("\n");
  MailApp.sendEmail(email, subject, body);
}

function getVerificationUrl_(email, code) {
  const serviceUrl = ScriptApp.getService().getUrl();
  if (!serviceUrl) {
    return FASTSTACK_FRONTEND_URL;
  }
  return serviceUrl
    + "?verifyEmail=" + encodeURIComponent(email)
    + "&code=" + encodeURIComponent(code);
}

function sendPasswordResetEmail_(email, code) {
  const subject = "Reset your FastStack Expense Tracker password";
  const body = [
    "Your FastStack password reset code is: " + code,
    "",
    "This code expires in " + FASTSTACK_RESET_MINUTES + " minutes.",
    "",
    "Open the app and enter this code to set a new password:",
    FASTSTACK_FRONTEND_URL,
    "",
    "If you did not request a password reset, ignore this email.",
  ].join("\n");
  MailApp.sendEmail(email, subject, body);
}

function hashPassword_(password, salt) {
  const secret = PropertiesService.getScriptProperties().getProperty(FASTSTACK_PROPERTIES.APP_SECRET);
  return sha256Hex_(salt + ":" + password + ":" + secret);
}

function sha256Hex_(value) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value, Utilities.Charset.UTF_8);
  let output = "";
  for (let index = 0; index < digest.length; index += 1) {
    output += ("0" + (digest[index] & 255).toString(16)).slice(-2);
  }
  return output;
}

function nowIso_() {
  return new Date().toISOString();
}

function safeError_(error) {
  return error && error.message ? String(error.message).slice(0, 200) : "Request failed.";
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function htmlResponse_(message, ok) {
  const color = ok ? "#0f766e" : "#c24135";
  const title = ok ? "Email Verified" : "Verification Failed";
  const html = [
    "<!doctype html><html><head><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">",
    "<title>" + title + "</title>",
    "<style>body{font-family:Arial,sans-serif;background:#f6f8fb;color:#18212f;display:grid;min-height:100vh;place-items:center;margin:0;padding:20px}.box{max-width:520px;background:white;border:1px solid #dce4ec;border-radius:8px;padding:28px;box-shadow:0 20px 45px rgba(25,39,52,.09)}h1{margin:0 0 12px;color:" + color + "}a{color:#0f766e;font-weight:700}</style>",
    "</head><body><main class=\"box\"><h1>" + escapeHtmlForResponse_(title) + "</h1>",
    "<p>" + escapeHtmlForResponse_(message) + "</p>",
    "<p><a href=\"" + FASTSTACK_FRONTEND_URL + "\">Open FastStack Expense Tracker</a></p>",
    "</main></body></html>",
  ].join("");
  return HtmlService.createHtmlOutput(html);
}

function javascriptResponse_(source) {
  return ContentService
    .createTextOutput(source)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function escapeHtmlForResponse_(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
