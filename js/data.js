// === DATA & PERSISTENCE (Single Source of Truth) ===
// === GLOBAL YEAR MANAGEMENT (v11.5) ===
const DEFAULT_YEARS = [2024, 2025, 2026, 2027, 2028];
let YEARS = JSON.parse(localStorage.getItem('ft_years') || 'null') || [...DEFAULT_YEARS];
function saveYEARS() { localStorage.setItem('ft_years', JSON.stringify(YEARS)); }
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
  var plans = JSON.parse(localStorage.getItem('ft_budget_plans') || '{}');
  var yearKey = String(year);
  if (plans[yearKey] && plans[yearKey][monthIdx]) return plans[yearKey][monthIdx];
  return null;
}

function getYearlyBudgetTotal(year) {
  var plans = JSON.parse(localStorage.getItem('ft_budget_plans') || '{}');
  var yearKey = String(year);
  var total = 0;
  var hasAnyPlan = false;
  if (plans[yearKey]) {
    for (var m = 0; m < 12; m++) {
      if (plans[yearKey][m]) {
        var p = plans[yearKey][m];
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
  return getYearlyBudgetTotal(year) / 12;
}

function getCategoryBudget(year, category) {
  var plans = JSON.parse(localStorage.getItem('ft_budget_plans') || '{}');
  var yearKey = String(year);
  var total = 0;
  if (plans[yearKey]) {
    for (var m = 0; m < 12; m++) {
      if (plans[yearKey][m] && plans[yearKey][m].expCats && plans[yearKey][m].expCats[category]) {
        total += plans[yearKey][m].expCats[category];
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
let SCHEMA = JSON.parse(localStorage.getItem('ft_schema') || 'null') || JSON.parse(JSON.stringify(DEFAULT_SCHEMA));
function saveSCHEMA() { localStorage.setItem('ft_schema', JSON.stringify(SCHEMA)); }

// === ACCOUNTS SYSTEM (v10.3) ===
const ACCOUNT_TYPES = {
  asset: ['Cash', 'Savings Account', 'Current Account', 'Credit/Debit Card', 'Digital Wallet', 'Investment Account'],
  liability: ['Credit Card Debt', 'Personal Loan', 'Mortgage', 'Vehicle Loan', 'Other Debt']
};
const DEFAULT_ACCOUNTS = [];
let ACCOUNTS = JSON.parse(localStorage.getItem('ft_accounts') || 'null') || JSON.parse(JSON.stringify(DEFAULT_ACCOUNTS));
let accNxId = parseInt(localStorage.getItem('ft_accNxId') || '10');
function saveACCOUNTS() { localStorage.setItem('ft_accounts', JSON.stringify(ACCOUNTS)); localStorage.setItem('ft_accNxId', accNxId); }

function getAccountBalance(accId) {
  const acc = ACCOUNTS.find(a => a.id === accId);
  if (!acc) return 0;
  const txnTotal = TXN.filter(tx => tx.acc === accId).reduce((sum, tx) => {
    if (tx.t === 'Income') return sum + tx.a;
    if (tx.t === 'Expense') return sum - tx.a;
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
let INITIAL_DEPOSIT = parseFloat(localStorage.getItem('ft_initial_deposit') || '0');
function saveInitialDeposit() { localStorage.setItem('ft_initial_deposit', INITIAL_DEPOSIT); }

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
  // Subtract liability balances (converted to display currency) (v15.1)
  ACCOUNTS.filter(a => a.type === 'liability').forEach(a => { nw -= convertToDisplay(Math.abs(a.initialBalance), a.currency || 'MYR'); });
  return nw;
}

// Financial Freedom Months: Available Assets / Average Monthly Expense (v15.1 multi-currency)
function getFinancialFreedomMonths(year, month) {
  const totalAssets = ACCOUNTS.filter(a => a.type === 'asset').reduce((sum, a) => sum + getAccountBalanceInDisplay(a.id), 0);
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
  return parseFloat((totalAssets / avgMonthlyExpense).toFixed(1));
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
let REMINDERS = JSON.parse(localStorage.getItem('ft_reminders') || '[]');
let reminderNxId = parseInt(localStorage.getItem('ft_reminderNxId') || '1');
function saveREMINDERS() { localStorage.setItem('ft_reminders', JSON.stringify(REMINDERS)); localStorage.setItem('ft_reminderNxId', reminderNxId); }

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

let nxId = 100, curPage = 'dashboard', txnPg = 1, editId = null, pendAct = null, authAtt = 0, lockUntil = 0;
let txnMonthSel = null, txnYearSel = null, txnInitialized = false;

const STORAGE_KEY = 'ft_txn_data';
function saveTXN() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(TXN));
  localStorage.setItem('ft_nxId', nxId);
}
function loadTXN() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) { try { TXN = JSON.parse(raw); } catch(e) {} }
  const sid = localStorage.getItem('ft_nxId');
  if (sid) nxId = parseInt(sid);
  else nxId = TXN.length ? Math.max(...TXN.map(t => t.id)) + 1 : 100;
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
function computeMonthlyData(year) {
  const months = [];
  for (let m = 0; m < 12; m++) {
    const mTxns = TXN.filter(t => { const d = new Date(t.d); return d.getFullYear() === year && d.getMonth() === m; });
    months.push({ m: MONTH_NAMES[m], i: mTxns.filter(t => t.t === 'Income').reduce((s, t) => s + t.a, 0), e: mTxns.filter(t => t.t === 'Expense').reduce((s, t) => s + t.a, 0), s: mTxns.filter(t => t.t === 'Savings').reduce((s, t) => s + t.a, 0) });
  }
  return months;
}

function computeExpenseCategories(year) {
  const cats = {};
  TXN.filter(t => { const d = new Date(t.d); return t.t === 'Expense' && d.getFullYear() === year; }).forEach(t => { if (!cats[t.c]) cats[t.c] = 0; cats[t.c] += t.a; });
  return Object.entries(cats).map(([n, a]) => ({ n, a: Math.round(a * 100) / 100, b: getCategoryBudget(year, n) })).sort((a, b) => b.a - a.a);
}

function yearHasData(year) { return TXN.some(t => new Date(t.d).getFullYear() === year); }
