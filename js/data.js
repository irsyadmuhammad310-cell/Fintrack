// === DATA & PERSISTENCE (v1.0.2 — IndexedDB Engine) ===

// === INDEXEDDB STORAGE ENGINE ===
// Primary: IndexedDB (unlimited storage, async)
// In-memory cache (_ftStore): all reads are sync from here
// Boot-critical keys stay in localStorage too (security, theme)
var _ftStore = {};
var _ftDBReady = false;
var _ftDB = null;

// Keys that remain in localStorage for pre-boot sync access
const FT_LS_KEEP = ['ft_app_lock','ft_pk_hash','ft_pk','ft_device_salt','ft_bio_cred','ft_recovery_hash','ft_security_questions','theme','ft_data_version','ft_onboarded','ft_security_setup_done','ft_username','ft_user_title','ft_lang','ft_currency','ft_hide_amounts'];

// IndexedDB CRUD module
var ftDB = {
  DB_NAME: 'FinTrackDB',
  DB_VERSION: 1,
  STORE: 'kv',

  open: function() {
    return new Promise(function(resolve, reject) {
      if (_ftDB) { resolve(_ftDB); return; }
      var req = indexedDB.open(ftDB.DB_NAME, ftDB.DB_VERSION);
      req.onupgradeneeded = function(e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains(ftDB.STORE)) {
          db.createObjectStore(ftDB.STORE, { keyPath: 'k' });
        }
      };
      req.onsuccess = function(e) { _ftDB = e.target.result; _ftDBReady = true; resolve(_ftDB); };
      req.onerror = function(e) { console.error('[FinTrack] IndexedDB open failed:', e); reject(e); };
    });
  },

  get: function(key) {
    return ftDB.open().then(function(db) {
      return new Promise(function(resolve, reject) {
        var tx = db.transaction(ftDB.STORE, 'readonly');
        var req = tx.objectStore(ftDB.STORE).get(key);
        req.onsuccess = function() { resolve(req.result ? req.result.v : null); };
        req.onerror = function() { reject(req.error); };
      });
    });
  },

  set: function(key, value) {
    return ftDB.open().then(function(db) {
      return new Promise(function(resolve, reject) {
        var tx = db.transaction(ftDB.STORE, 'readwrite');
        tx.objectStore(ftDB.STORE).put({ k: key, v: value });
        tx.oncomplete = function() { resolve(); };
        tx.onerror = function() { reject(tx.error); };
      });
    });
  },

  delete: function(key) {
    return ftDB.open().then(function(db) {
      return new Promise(function(resolve, reject) {
        var tx = db.transaction(ftDB.STORE, 'readwrite');
        tx.objectStore(ftDB.STORE).delete(key);
        tx.oncomplete = function() { resolve(); };
        tx.onerror = function() { reject(tx.error); };
      });
    });
  },

  getAll: function() {
    return ftDB.open().then(function(db) {
      return new Promise(function(resolve, reject) {
        var tx = db.transaction(ftDB.STORE, 'readonly');
        var req = tx.objectStore(ftDB.STORE).getAll();
        req.onsuccess = function() { resolve(req.result || []); };
        req.onerror = function() { reject(req.error); };
      });
    });
  }
};

// === SYNC READ/WRITE API (used by entire app) ===
// safeGet: sync read from in-memory cache
function safeGet(key) {
  if (_ftStore.hasOwnProperty(key)) return _ftStore[key];
  // Fallback to localStorage for boot-critical keys before DB loads
  try { return localStorage.getItem(key); } catch(e) { return null; }
}

// safeSave: sync write to cache + async persist to IndexedDB
function safeSave(key, value) {
  var val = typeof value === 'string' ? value : JSON.stringify(value);
  _ftStore[key] = val;
  // Persist to IndexedDB (fire-and-forget with error handling)
  if (_ftDBReady) {
    ftDB.set(key, val).catch(function(e) {
      console.error('[FinTrack] IndexedDB write failed for', key, e);
      toast('❌ Save failed. Check storage permissions.');
    });
  }
  // Also write boot-critical keys to localStorage (sync backup)
  if (FT_LS_KEEP.includes(key)) {
    try { localStorage.setItem(key, val); } catch(e) {}
  }
  return true;
}

// === MASTER BOOT LOADER (async, called once from init.js) ===
async function ftLoadAll() {
  try {
    await ftDB.open();
    // Check if migration from localStorage is needed
    var migrated = await ftDB.get('_ft_migrated');
    if (!migrated) {
      await ftMigrateFromLocalStorage();
    }
    // Load all entries into _ftStore
    var entries = await ftDB.getAll();
    entries.forEach(function(entry) {
      if (entry.k !== '_ft_migrated') {
        _ftStore[entry.k] = entry.v;
      }
    });
    _ftDBReady = true;
    console.log('[FinTrack] IndexedDB loaded. ' + entries.length + ' keys.');
  } catch(e) {
    console.warn('[FinTrack] IndexedDB failed, falling back to localStorage.', e);
    // Fallback: populate _ftStore from localStorage
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      _ftStore[k] = localStorage.getItem(k);
    }
  }
}

// === ONE-TIME MIGRATION: localStorage → IndexedDB ===
async function ftMigrateFromLocalStorage() {
  console.log('[FinTrack] Migrating localStorage → IndexedDB...');
  var db = await ftDB.open();
  var tx = db.transaction(ftDB.STORE, 'readwrite');
  var store = tx.objectStore(ftDB.STORE);
  var count = 0;
  for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i);
    var val = localStorage.getItem(key);
    store.put({ k: key, v: val });
    count++;
  }
  // Mark migration complete
  store.put({ k: '_ft_migrated', v: '1' });
  await new Promise(function(resolve, reject) {
    tx.oncomplete = resolve;
    tx.onerror = function() { reject(tx.error); };
  });
  // Clear localStorage except boot-critical keys
  var keysToKeep = {};
  FT_LS_KEEP.forEach(function(k) {
    var v = localStorage.getItem(k);
    if (v !== null) keysToKeep[k] = v;
  });
  localStorage.clear();
  Object.keys(keysToKeep).forEach(function(k) {
    localStorage.setItem(k, keysToKeep[k]);
  });
  console.log('[FinTrack] Migration complete. ' + count + ' keys moved to IndexedDB.');
}

// === iOS PRIVATE BROWSING DETECTION ===
var _storageAvailable = true;
(function() {
  try {
    var test = '__ft_test__';
    localStorage.setItem(test, '1');
    localStorage.removeItem(test);
  } catch (e) {
    _storageAvailable = false;
    console.warn('[FinTrack] localStorage unavailable (Private Browsing). IndexedDB may also be limited.');
  }
})();

// === GLOBAL YEAR MANAGEMENT (v11.5) ===
const DEFAULT_YEARS = [2024, 2025, 2026, 2027, 2028];
let YEARS = [...DEFAULT_YEARS];
function loadYEARS() { var raw = safeGet('ft_years'); if (raw) { try { YEARS = JSON.parse(raw); } catch(e) {} } }
function saveYEARS() { safeSave('ft_years', JSON.stringify(YEARS)); }
function addYear(year) {
  year = parseInt(year);
  if (isNaN(year) || year < 1900 || year > 2100) return false;
  if (YEARS.includes(year)) return false;
  YEARS.push(year);
  YEARS.sort((a, b) => a - b);
  saveYEARS();
  refreshYearSelectors();
  return true;
}
function removeYear(year) {
  year = parseInt(year);
  if (yearHasData(year)) return false;
  YEARS = YEARS.filter(y => y !== year);
  saveYEARS();
  refreshYearSelectors();
  return true;
}
function refreshYearSelectors() {
  // Update header year dropdown
  const yf = document.getElementById('yf');
  if (yf) { const cur = parseInt(yf.value) || CURRENT_YEAR; yf.innerHTML = buildYearOptions(cur); }
}
const CURRENT_YEAR = 2026;

function buildYearOptions(selectedYear) {
  return YEARS.map(y => `<option value="${y}"${y === selectedYear ? ' selected' : ''}>${y}</option>`).join('');
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const CATEGORY_BUDGETS = {
  'Loan': 18840, 'Gift': 7200, 'Food': 3000,
  'Transportation': 10620, 'Entertainment': 4320,
  'Housing': 4800, 'Insurance & Taxes': 3960
};

// === BUDGET PLANNER HELPERS (master data for all budget) ===
function getBudgetPlan(year, monthIdx) {
  var plans = JSON.parse(safeGet('ft_budget_plans') || '{}');
  var yearKey = String(year);
  var monthKey = String(monthIdx);
  if (plans[yearKey] && (plans[yearKey][monthKey] || plans[yearKey][monthIdx])) return plans[yearKey][monthKey] || plans[yearKey][monthIdx];
  return null;
}

function getYearlyBudgetTotal(year) {
  var plans = JSON.parse(safeGet('ft_budget_plans') || '{}');
  var yearKey = String(year);
  var total = 0;
  var hasAnyPlan = false;
  if (plans[yearKey]) {
    for (var m = 0; m < 12; m++) {
      var p = plans[yearKey][String(m)] || plans[yearKey][m];
      if (p) {
        var expTotal = p.expCats ? Object.values(p.expCats).reduce(function(s, v) { return s + v; }, 0) : (p.e || 0);
        if (expTotal > 0) { total += expTotal; hasAnyPlan = true; }
      }
    }
  }
  return hasAnyPlan ? total : 0;
}

function getMonthlyBudget(year, monthIdx) {
  var plan = getBudgetPlan(year, monthIdx);
  if (plan) {
    var expTotal = plan.expCats ? Object.values(plan.expCats).reduce(function(s, v) { return s + v; }, 0) : (plan.e || 0);
    if (expTotal > 0) return expTotal;
  }
  var yearly = getYearlyBudgetTotal(year);
  return yearly > 0 ? yearly / 12 : 0; // Guard: never return NaN/Infinity
}

function getCategoryBudget(year, category) {
  var plans = JSON.parse(safeGet('ft_budget_plans') || '{}');
  var yearKey = String(year);
  var total = 0;
  if (plans[yearKey]) {
    for (var m = 0; m < 12; m++) {
      var p = plans[yearKey][String(m)] || plans[yearKey][m];
      if (p && p.expCats && p.expCats[category]) {
        total += p.expCats[category];
      }
    }
  }
  return total || (CATEGORY_BUDGETS[category] || 0);
}

const DEFAULT_SCHEMA = {
  Income: {},
  Expense: {},
  Savings: {}
};
let SCHEMA = JSON.parse(JSON.stringify(DEFAULT_SCHEMA));
function loadSCHEMA() { var raw = safeGet('ft_schema'); if (raw) { try { SCHEMA = JSON.parse(raw); } catch(e) {} } }
function saveSCHEMA() { safeSave('ft_schema', JSON.stringify(SCHEMA)); }

// === ACCOUNTS SYSTEM (v10.3) ===
const ACCOUNT_TYPES = {
  asset: ['Cash', 'Savings Account', 'Current Account', 'Credit/Debit Card', 'Digital Wallet', 'Investment Account'],
  liability: ['Credit Card Debt', 'Personal Loan', 'Mortgage', 'Vehicle Loan', 'Other Debt']
};
const DEFAULT_ACCOUNTS = [];
let ACCOUNTS = [];
let accNxId = 10;
function loadACCOUNTS() {
  var raw = safeGet('ft_accounts');
  if (raw) { try { ACCOUNTS = JSON.parse(raw); } catch(e) {} }
  var nid = safeGet('ft_accNxId');
  if (nid) accNxId = parseInt(nid);
}
function saveACCOUNTS() { safeSave('ft_accounts', JSON.stringify(ACCOUNTS)); safeSave('ft_accNxId', accNxId); }

function getAccountBalance(accId) {
  const acc = ACCOUNTS.find(a => a.id === accId);
  if (!acc) return 0;
  const cur = acc.currency || 'MYR';
  const txnTotal = TXN.filter(tx => tx.acc === accId).reduce((sum, tx) => {
    // tx.a is stored in MYR; convert back to native currency for correct balance
    const nativeAmt = cur === 'MYR' ? tx.a : convertFromTo(tx.a, 'MYR', cur);
    if (tx.t === 'Income') return sum + nativeAmt;
    if (tx.t === 'Expense') return sum - nativeAmt;
    return sum;
  }, 0);
  return acc.initialBalance + txnTotal;
}

// Get account balance converted to display currency (v15.1)
function getAccountBalanceInDisplay(accId) {
  const acc = ACCOUNTS.find(a => a.id === accId);
  if (!acc) return 0;
  const nativeBal = getAccountBalance(accId);
  return convertToDisplay(nativeBal, acc.currency || 'MYR');
}

// Get account's native currency (v15.1)
function getAccountCurrency(accId) {
  const acc = ACCOUNTS.find(a => a.id === accId);
  return acc ? (acc.currency || 'MYR') : 'MYR';
}

function getNetWorth() {
  const assets = ACCOUNTS.filter(a => a.type === 'asset').reduce((sum, a) => sum + getAccountBalanceInDisplay(a.id), 0);
  const liabilities = ACCOUNTS.filter(a => a.type === 'liability').reduce((sum, a) => sum + convertToDisplay(Math.abs(a.initialBalance), a.currency || 'MYR'), 0);
  return assets - liabilities;
}

// === OPENING BALANCE & CARRY-FORWARD (v11.2) ===
let INITIAL_DEPOSIT = 0;
function loadInitialDeposit() { var raw = safeGet('ft_initial_deposit'); if (raw) INITIAL_DEPOSIT = parseFloat(raw) || 0; }
function saveInitialDeposit() { safeSave('ft_initial_deposit', INITIAL_DEPOSIT); }

// Carry-forward balance: Opening Balance + cumulative (Income - Expense - Savings) up to selected period
function getCarryForwardBalance(year, month) {
  let bal = INITIAL_DEPOSIT;
  const filtered = TXN.filter(tx => {
    const d = new Date(tx.d);
    if (month === 'total') return d.getFullYear() <= year;
    return d.getFullYear() < year || (d.getFullYear() === year && d.getMonth() <= +month);
  });
  filtered.forEach(tx => {
    if (tx.t === 'Income') bal += tx.a;
    else if (tx.t === 'Expense') bal -= tx.a;
    else if (tx.t === 'Savings') bal -= tx.a;
  });
  return bal;
}

// Monthly carry-forward series for sparklines
function computeBalanceSeries(year) {
  // Get balance at end of previous year
  let carryover = INITIAL_DEPOSIT;
  TXN.filter(tx => new Date(tx.d).getFullYear() < year).forEach(tx => {
    if (tx.t === 'Income') carryover += tx.a;
    else if (tx.t === 'Expense') carryover -= tx.a;
    else if (tx.t === 'Savings') carryover -= tx.a;
  });
  const monthly = [];
  for (let m = 0; m < 12; m++) {
    const mTxns = TXN.filter(tx => { const d = new Date(tx.d); return d.getFullYear() === year && d.getMonth() === m; });
    const mNet = mTxns.reduce((s, tx) => {
      if (tx.t === 'Income') return s + tx.a;
      if (tx.t === 'Expense') return s - tx.a;
      if (tx.t === 'Savings') return s - tx.a;
      return s;
    }, 0);
    carryover += mNet;
    monthly.push(carryover);
  }
  return monthly;
}

// Net Worth by period: Initial Deposit + asset TXN - liability TXN up to period
function getNetWorthByPeriod(year, month) {
  let nw = INITIAL_DEPOSIT;
  const filtered = TXN.filter(tx => {
    const d = new Date(tx.d);
    if (month === 'total') return d.getFullYear() <= year;
    return d.getFullYear() < year || (d.getFullYear() === year && d.getMonth() <= +month);
  });
  filtered.forEach(tx => {
    if (tx.t === 'Income') nw += tx.a;
    else if (tx.t === 'Expense') nw -= tx.a;
    else if (tx.t === 'Savings') nw -= tx.a;
  });
  // Subtract liability balances converted to MYR (base currency)
  ACCOUNTS.filter(a => a.type === 'liability').forEach(a => { nw -= convertFromTo(Math.abs(a.initialBalance), a.currency || 'MYR', 'MYR'); });
  return nw;
}

// Financial Freedom Months: Available Assets / Average Monthly Expense (v15.1 multi-currency)
function getFinancialFreedomMonths(year, month) {
  // Both values in MYR for consistent division
  const totalAssetsMYR = ACCOUNTS.filter(a => a.type === 'asset').reduce((sum, a) => {
    const nativeBal = getAccountBalance(a.id);
    return sum + convertFromTo(nativeBal, a.currency || 'MYR', 'MYR');
  }, 0);
  let expenses, months;
  if (month === 'total') {
    expenses = TXN.filter(tx => tx.t === 'Expense' && new Date(tx.d).getFullYear() === year).reduce((s, tx) => s + tx.a, 0);
    months = new Set(TXN.filter(tx => tx.t === 'Expense' && new Date(tx.d).getFullYear() === year).map(tx => new Date(tx.d).getMonth())).size;
  } else {
    expenses = TXN.filter(tx => { const d = new Date(tx.d); return tx.t === 'Expense' && d.getFullYear() === year && d.getMonth() === +month; }).reduce((s, tx) => s + tx.a, 0);
    months = 1;
  }
  if (expenses === 0 || months === 0) return null;
  const avgMonthlyExpense = expenses / months;
  return parseFloat((totalAssetsMYR / avgMonthlyExpense).toFixed(1));
}

// Compute savings categories from TXN for any year/month
function computeSavingsCategories(year, month) {
  const cats = {};
  TXN.filter(tx => {
    const d = new Date(tx.d);
    if (tx.t !== 'Savings') return false;
    if (month === 'total') return d.getFullYear() === year;
    return d.getFullYear() === year && d.getMonth() === +month;
  }).forEach(tx => { if (!cats[tx.c]) cats[tx.c] = 0; cats[tx.c] += tx.a; });
  return Object.entries(cats).map(([n, a]) => ({ n, a: Math.round(a * 100) / 100 })).sort((a, b) => b.a - a.a);
}

// Compute expense categories for a specific period
function computeExpenseCategoriesByPeriod(year, month) {
  const cats = {};
  TXN.filter(tx => {
    const d = new Date(tx.d);
    if (tx.t !== 'Expense') return false;
    if (month === 'total') return d.getFullYear() === year;
    return d.getFullYear() === year && d.getMonth() === +month;
  }).forEach(tx => { if (!cats[tx.c]) cats[tx.c] = 0; cats[tx.c] += tx.a; });
  return Object.entries(cats).map(([n, a]) => ({ n, a: Math.round(a * 100) / 100 })).sort((a, b) => b.a - a.a);
}

// === REMINDERS SYSTEM (v10.5) ===
let REMINDERS = [];
let reminderNxId = 1;
function loadREMINDERS() {
  var raw = safeGet('ft_reminders');
  if (raw) { try { REMINDERS = JSON.parse(raw); } catch(e) {} }
  var nid = safeGet('ft_reminderNxId');
  if (nid) reminderNxId = parseInt(nid);
}
function saveREMINDERS() { safeSave('ft_reminders', JSON.stringify(REMINDERS)); safeSave('ft_reminderNxId', reminderNxId); }

function getActiveReminders() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const active = [];
  REMINDERS.forEach(r => {
    if (r.completed) return;
    const rDate = new Date(r.date); rDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((rDate - today) / (1000 * 60 * 60 * 24));
    active.push({ ...r, daysRemaining: diffDays, overdue: diffDays < 0 });
  });
  return active.sort((a, b) => a.daysRemaining - b.daysRemaining);
}

function getPendingReminderCount() { return getActiveReminders().filter(r => !r.dismissed).length; }

function createBalanceAdjustment(accId, oldBal, newBal, reason) {
  const diff = newBal - oldBal;
  if (diff === 0) return;
  const txn = {
    id: nxId++,
    d: new Date().toISOString().split('T')[0],
    t: diff > 0 ? 'Income' : 'Expense',
    c: 'Balance Adjustment',
    s: reason,
    a: Math.abs(diff),
    dt: `Adj: ${ACCOUNTS.find(a => a.id === accId)?.name || 'Account'}`,
    acc: accId
  };
  TXN.push(txn);
  saveTXN();
}

// Category CRUD helpers
function addSubcategory(type, category, subcategory) {
  if (!SCHEMA[type] || !SCHEMA[type][category]) return false;
  if (SCHEMA[type][category].includes(subcategory)) return false;
  SCHEMA[type][category].push(subcategory);
  saveSCHEMA();
  return true;
}

function renameSubcategory(type, category, oldName, newName) {
  if (!SCHEMA[type] || !SCHEMA[type][category]) return false;
  const idx = SCHEMA[type][category].indexOf(oldName);
  if (idx < 0) return false;
  SCHEMA[type][category][idx] = newName;
  TXN.forEach(tx => { if (tx.t === type && tx.c === category && tx.s === oldName) tx.s = newName; });
  // Sync Investment txnLinks if Savings subcategory renamed
  if (type === 'Savings' && typeof INVESTMENTS !== 'undefined') {
    INVESTMENTS.forEach(inv => { if (inv.txnLink && inv.txnLink.category === category && inv.txnLink.subcategory === oldName) inv.txnLink.subcategory = newName; });
    if (typeof saveINV === 'function') saveINV();
  }
  saveSCHEMA(); saveTXN();
  return true;
}

function deleteSubcategory(type, category, subcategory) {
  if (!SCHEMA[type] || !SCHEMA[type][category]) return false;
  SCHEMA[type][category] = SCHEMA[type][category].filter(s => s !== subcategory);
  // Remove Investment txnLinks pointing to deleted Savings subcategory
  if (type === 'Savings' && typeof INVESTMENTS !== 'undefined') {
    INVESTMENTS.forEach(inv => { if (inv.txnLink && inv.txnLink.category === category && inv.txnLink.subcategory === subcategory) inv.txnLink = null; });
    if (typeof saveINV === 'function') saveINV();
  }
  // Note: existing TXN history is preserved (tx.c and tx.s remain intact)
  saveSCHEMA();
  return true;
}

function addCategory(type, category) {
  if (!SCHEMA[type]) return false;
  if (SCHEMA[type][category]) return false;
  SCHEMA[type][category] = [];
  saveSCHEMA();
  return true;
}

function renameCategory(type, oldName, newName) {
  if (!SCHEMA[type] || !SCHEMA[type][oldName] || SCHEMA[type][newName]) return false;
  SCHEMA[type][newName] = SCHEMA[type][oldName];
  delete SCHEMA[type][oldName];
  TXN.forEach(tx => { if (tx.t === type && tx.c === oldName) tx.c = newName; });
  // Sync Investment txnLinks if Savings category renamed
  if (type === 'Savings' && typeof INVESTMENTS !== 'undefined') {
    INVESTMENTS.forEach(inv => { if (inv.txnLink && inv.txnLink.category === oldName) inv.txnLink.category = newName; });
    if (typeof saveINV === 'function') saveINV();
  }
  saveSCHEMA(); saveTXN();
  return true;
}

function deleteCategory(type, category) {
  if (!SCHEMA[type] || !SCHEMA[type][category]) return false;
  delete SCHEMA[type][category];
  // Remove Investment txnLinks pointing to deleted Savings category
  if (type === 'Savings' && typeof INVESTMENTS !== 'undefined') {
    INVESTMENTS.forEach(inv => { if (inv.txnLink && inv.txnLink.category === category) inv.txnLink = null; });
    if (typeof saveINV === 'function') saveINV();
  }
  // Remove from Goals linkedCats if Savings category deleted
  if (type === 'Savings' && typeof GOALS !== 'undefined') {
    GOALS.forEach(g => { if (g.linkedCats) g.linkedCats = g.linkedCats.filter(c => c !== category); if (g.linkedCat === category) g.linkedCat = ''; });
    if (typeof saveGOALS === 'function') saveGOALS();
  }
  // Note: existing TXN history is preserved (tx.c and tx.s remain intact)
  saveSCHEMA();
  return true;
}

let TXN = [];

// === DATA VERSION & MIGRATION (v1.0.2) ===
const FT_DATA_VERSION = 3; // v1 = raw floats, v2 = integer cents, v3 = budget plans in cents
function getDataVersion() { return parseInt(safeGet('ft_data_version') || '1'); }
function setDataVersion(v) { safeSave('ft_data_version', String(v)); }

// Migrate v1 (float amounts) to v2 (integer cents)
function migrateToIntegerCents() {
  if (getDataVersion() >= 2) return; // Already migrated
  if (TXN.length === 0) { setDataVersion(2); return; }
  // Convert all tx.a from float to integer cents (multiply by 100)
  TXN.forEach(function(tx) {
    if (typeof tx.a === 'number') {
      tx.a = Math.round(tx.a * 100); // RM 45.90 → 4590
    }
  });
  // Convert INITIAL_DEPOSIT
  INITIAL_DEPOSIT = Math.round(INITIAL_DEPOSIT * 100);
  saveInitialDeposit();
  // Convert account initial balances
  ACCOUNTS.forEach(function(acc) {
    if (typeof acc.initialBalance === 'number') {
      acc.initialBalance = Math.round(acc.initialBalance * 100);
    }
  });
  saveACCOUNTS();
  saveTXN();
  setDataVersion(2);
  console.log('[FinTrack] Migrated to integer cents (v2). ' + TXN.length + ' transactions converted.');
}

// Migrate v2 → v3: budget plans to integer cents
// REVERTED: Budget plans now store values in REAL CURRENCY (not cents).
// fmt() handles the cents→display conversion for transaction amounts,
// but budget plans are separate from tx.a and stay as real values.
function migrateBudgetsToCents() {
  if (getDataVersion() >= 3) return;
  // v1.0.2: We no longer convert budget plans to cents.
  // Budget values stay as real currency (e.g. 1000 = RM 1000).
  // Only tx.a uses cents. Budget plans are compared against tx.a via fmt() at display time.
  setDataVersion(3);
}

// v1.0.2: Repair any budgets that got accidentally multiplied by the old migration
function repairDoubleMigratedBudgets() {
  if (safeGet('ft_budget_repair_done')) return;
  var plans = JSON.parse(safeGet('ft_budget_plans') || '{}');
  var repaired = false;
  Object.keys(plans).forEach(function(yearKey) {
    var yearPlan = plans[yearKey];
    Object.keys(yearPlan).forEach(function(monthKey) {
      var p = yearPlan[monthKey];
      if (!p) return;
      // Detect over-inflated values: if any expCat > 100000, it was likely multiplied by 100
      // Normal budget: 1000 (RM 1000). After accidental ×100: 100000. After double: 10000000.
      if (p.expCats) {
        var maxVal = Math.max.apply(null, Object.values(p.expCats).concat([0]));
        if (maxVal >= 100000) {
          // Divide by 100 to undo one multiplication
          Object.keys(p.expCats).forEach(function(cat) { p.expCats[cat] = Math.round(p.expCats[cat] / 100); });
          repaired = true;
          // Check if still too high (double-migrated)
          var maxAfter = Math.max.apply(null, Object.values(p.expCats).concat([0]));
          if (maxAfter >= 100000) {
            Object.keys(p.expCats).forEach(function(cat) { p.expCats[cat] = Math.round(p.expCats[cat] / 100); });
          }
        }
      }
      if (p.incCats) {
        var maxInc = Math.max.apply(null, Object.values(p.incCats).concat([0]));
        if (maxInc >= 100000) {
          Object.keys(p.incCats).forEach(function(cat) { p.incCats[cat] = Math.round(p.incCats[cat] / 100); });
          repaired = true;
          var maxIncAfter = Math.max.apply(null, Object.values(p.incCats).concat([0]));
          if (maxIncAfter >= 100000) {
            Object.keys(p.incCats).forEach(function(cat) { p.incCats[cat] = Math.round(p.incCats[cat] / 100); });
          }
        }
      }
      if (typeof p.i === 'number' && p.i >= 100000) { p.i = Math.round(p.i / 100); if (p.i >= 100000) p.i = Math.round(p.i / 100); repaired = true; }
      if (typeof p.e === 'number' && p.e >= 100000) { p.e = Math.round(p.e / 100); if (p.e >= 100000) p.e = Math.round(p.e / 100); repaired = true; }
      if (typeof p.s === 'number' && p.s >= 100000) { p.s = Math.round(p.s / 100); if (p.s >= 100000) p.s = Math.round(p.s / 100); repaired = true; }
    });
  });
  if (repaired) {
    safeSave('ft_budget_plans', JSON.stringify(plans));
    console.log('[FinTrack] Repaired inflated budget values.');
  }
  safeSave('ft_budget_repair_done', '1');
}

let nxId = 100, curPage = 'dashboard', txnPg = 1, editId = null, pendAct = null, authAtt = 0, lockUntil = 0;
let txnMonthSel = null, txnYearSel = null, txnInitialized = false;

const STORAGE_KEY = 'ft_txn_data';
function saveTXN() {
  if (!safeSave(STORAGE_KEY, JSON.stringify(TXN))) return;
  safeSave('ft_nxId', nxId);
  // Notify other tabs via BroadcastChannel
  if (typeof _ftChannel !== 'undefined' && _ftChannel) {
    try { _ftChannel.postMessage({ type: 'data_update', key: STORAGE_KEY }); } catch(e) {}
  }
}
function loadTXN() {
  const raw = safeGet(STORAGE_KEY);
  if (raw) { try { TXN = JSON.parse(raw); } catch(e) {} }
  const sid = safeGet('ft_nxId');
  if (sid) nxId = parseInt(sid);
  else nxId = TXN.length ? Math.max(...TXN.map(t => t.id)) + 1 : 100;
  // Run migrations after loading
  migrateToIntegerCents();
  migrateBudgetsToCents();
  repairDoubleMigratedBudgets();
}

// === MASTER DATA LOADER (called after ftLoadAll populates _ftStore) ===
function loadAllModuleData() {
  loadYEARS();
  loadSCHEMA();
  loadACCOUNTS();
  loadInitialDeposit();
  loadREMINDERS();
  if (typeof loadGOALS === 'function') loadGOALS();
  loadTXN();
}

const BANKS = null; // Deprecated: use getBANKS() instead
function getBANKS() {
  return ACCOUNTS.filter(a => a.type === 'asset').map(a => {
    const nativeBal = getAccountBalance(a.id);
    const cur = a.currency || 'MYR';
    const displayBal = convertToDisplay(nativeBal, cur);
    return {
      name: a.name, type: a.accountType, balance: displayBal, nativeBalance: nativeBal, currency: cur,
      updated: 'Live', cls: a.name.toLowerCase().includes('maybank') ? 'maybank' : a.name.toLowerCase().includes('cimb') ? 'cimb' : a.name.toLowerCase().includes('wise') ? 'wise' : 'cash',
      tag: a.name.split(' ')[0].substring(0, 4).toUpperCase()
    };
  });
}

// === COMPUTED DATA (derived from TXN) ===
// NOTE: tx.a is already in MYR (base currency, converted at save time). No further conversion needed.
// v1.0.2: Transfers excluded from income/expense totals
function computeMonthlyData(year) {
  const months = [];
  for (let m = 0; m < 12; m++) {
    const mTxns = TXN.filter(t => { const d = new Date(t.d); return d.getFullYear() === year && d.getMonth() === m && !isTransfer(t); });
    months.push({ m: MONTH_NAMES[m], i: mTxns.filter(t => t.t === 'Income').reduce((s, t) => s + t.a, 0), e: mTxns.filter(t => t.t === 'Expense').reduce((s, t) => s + t.a, 0), s: mTxns.filter(t => t.t === 'Savings').reduce((s, t) => s + t.a, 0) });
  }
  return months;
}

function computeExpenseCategories(year) {
  const cats = {};
  TXN.filter(t => { const d = new Date(t.d); return t.t === 'Expense' && !isTransfer(t) && d.getFullYear() === year; }).forEach(t => { if (!cats[t.c]) cats[t.c] = 0; cats[t.c] += t.a; });
  return Object.entries(cats).map(([n, a]) => ({ n, a: Math.round(a * 100) / 100, b: getCategoryBudget(year, n) })).sort((a, b) => b.a - a.a);
}

function yearHasData(year) { return TXN.some(t => new Date(t.d).getFullYear() === year); }

// === MULTI-TAB SYNC (v1.0.2 — BroadcastChannel) ===
// Uses BroadcastChannel for cross-tab sync (works with IndexedDB)
var _ftChannel = null;
try { _ftChannel = new BroadcastChannel('fintrack_sync'); } catch(e) {}
if (_ftChannel) {
  _ftChannel.onmessage = function(e) {
    if (!e.data || e.data.type !== 'data_update') return;
    // Reload the changed key from IndexedDB
    ftDB.get(e.data.key).then(function(val) {
      if (val === null) return;
      _ftStore[e.data.key] = val;
      if (e.data.key === STORAGE_KEY) {
        try { TXN = JSON.parse(val); } catch(err) {}
        toast('🔄 Data updated from another tab');
        if (typeof navigate === 'function') navigate(curPage);
      } else if (e.data.key === 'ft_accounts') {
        try { ACCOUNTS = JSON.parse(val); } catch(err) {}
      } else if (e.data.key === 'ft_schema') {
        try { SCHEMA = JSON.parse(val); } catch(err) {}
      }
    });
  };
}

// === PRIVATE BROWSING WARNING (v1.0.2) ===
// Show banner if storage unavailable (call from init.js after DOM ready)
function showPrivateBrowsingWarning() {
  if (_storageAvailable) return;
  var banner = document.createElement('div');
  banner.id = 'ftPrivateBanner';
  banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:var(--amber,#d97706);color:#fff;text-align:center;padding:8px 16px;font-size:12px;font-weight:600;font-family:var(--font,system-ui)';
  banner.textContent = '⚠️ Private Browsing detected. Your data will NOT be saved after closing this tab.';
  document.body.prepend(banner);
}

// === CASCADING ACCOUNT DELETE (v1.0.2) ===
// Delete account and handle orphaned transactions
function deleteAccountCascade(accId, mode) {
  // mode: 'delete' = remove transactions, 'reassign' = set acc to null
  if (mode === 'delete') {
    TXN = TXN.filter(tx => tx.acc !== accId);
  } else {
    TXN.forEach(tx => { if (tx.acc === accId) tx.acc = null; });
  }
  ACCOUNTS = ACCOUNTS.filter(a => a.id !== accId);
  saveACCOUNTS();
  saveTXN();
}

function getAccountTransactionCount(accId) {
  return TXN.filter(tx => tx.acc === accId).length;
}

// === TRANSFER TYPE SUPPORT (v1.0.2) ===
// Exclude transfers from income/expense totals
function isTransfer(tx) {
  return tx.t === 'Transfer' || (tx.c && tx.c.toLowerCase() === 'transfer') || (tx.c === 'Balance Adjustment');
}

// === SCHEMA VALIDATION ON IMPORT (v1.0.2) ===
function validateImportData(jsonStr) {
  var errors = [];
  var imported = 0;
  var skipped = 0;
  try {
    var data = JSON.parse(jsonStr);
    // Validate transactions
    if (data.ft_txn_data) {
      var txns = typeof data.ft_txn_data === 'string' ? JSON.parse(data.ft_txn_data) : data.ft_txn_data;
      if (Array.isArray(txns)) {
        var valid = [];
        txns.forEach(function(tx, i) {
          // Required fields
          if (!tx.id && tx.id !== 0) { skipped++; errors.push('Row ' + i + ': missing id'); return; }
          if (!tx.d) { skipped++; errors.push('Row ' + i + ': missing date'); return; }
          if (!tx.t) { skipped++; errors.push('Row ' + i + ': missing type'); return; }
          // Coerce amount to number
          if (typeof tx.a === 'string') tx.a = parseFloat(tx.a) || 0;
          if (typeof tx.a !== 'number' || isNaN(tx.a)) { skipped++; errors.push('Row ' + i + ': invalid amount'); return; }
          // Sanitize strings (strip HTML)
          if (tx.dt) tx.dt = String(tx.dt).replace(/<[^>]*>/g, '');
          if (tx.c) tx.c = String(tx.c).replace(/<[^>]*>/g, '');
          if (tx.s) tx.s = String(tx.s).replace(/<[^>]*>/g, '');
          // Validate type
          if (!['Income', 'Expense', 'Savings', 'Transfer'].includes(tx.t)) {
            tx.t = 'Expense'; // Default fallback
          }
          valid.push(tx);
          imported++;
        });
        data.ft_txn_data = JSON.stringify(valid);
      }
    }
    // Validate accounts
    if (data.ft_accounts) {
      var accs = typeof data.ft_accounts === 'string' ? JSON.parse(data.ft_accounts) : data.ft_accounts;
      if (Array.isArray(accs)) {
        accs.forEach(function(acc) {
          if (typeof acc.initialBalance === 'string') acc.initialBalance = parseFloat(acc.initialBalance) || 0;
          if (acc.name) acc.name = String(acc.name).replace(/<[^>]*>/g, '');
        });
        data.ft_accounts = JSON.stringify(accs);
      }
    }
    return { success: true, data: data, imported: imported, skipped: skipped, errors: errors };
  } catch (e) {
    return { success: false, data: null, imported: 0, skipped: 0, errors: ['Invalid JSON: ' + e.message] };
  }
}

// === BACKUP REMINDER (v1.0.2) ===
var BACKUP_INTERVAL = 50; // Remind every 50 transactions
function checkBackupReminder() {
  var lastBackup = parseInt(safeGet('ft_last_backup_txn_count') || '0');
  var current = TXN.length;
  if (current - lastBackup >= BACKUP_INTERVAL) {
    toast('💾 You have ' + (current - lastBackup) + ' new transactions since last backup. Export in Settings → Data.');
  }
}
function markBackupDone() {
  safeSave('ft_last_backup_txn_count', String(TXN.length));
  safeSave('ft_last_backup_date', new Date().toISOString());
}
function getLastBackupDate() {
  return safeGet('ft_last_backup_date') || null;
}
