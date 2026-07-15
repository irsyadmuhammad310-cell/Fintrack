// === REPORTS V13.0 - Professional Financial Reporting Center ===
var rptType = 'financial';
var rptPeriod = 'year';
var rptCustomFrom = '';
var rptCustomTo = '';
var rptAccount = 'all';
var rptCategory = 'all';

const RPT_TYPES = [
  { id:'financial', label:'Financial Summary', icon:'file-text' },
  { id:'income', label:'Income Report', icon:'trending-up' },
  { id:'expense', label:'Expense Report', icon:'trending-down' },
  { id:'savings', label:'Savings Report', icon:'piggy-bank' },
  { id:'budget', label:'Budget Report', icon:'calculator' },
  { id:'goal', label:'Goal Report', icon:'target' },
  { id:'investment', label:'Investment Report', icon:'briefcase' },
  { id:'networth', label:'Net Worth Report', icon:'landmark' },
  { id:'cashflow', label:'Cash Flow Report', icon:'activity' }
];

function renderReports(c) {
  var year = getSelectedYear();
  var month = document.getElementById('mf') ? document.getElementById('mf').value : 'total';

  c.innerHTML = '<div class="rpt-page">' +
    '<div class="rpt-filters">' +
      '<div class="rpt-filter-row">' +
        '<div class="fg" style="flex:1.5;min-width:160px"><label class="fl">Report Type</label><select class="fi" id="rptType" onchange="rptType=this.value;rptRefresh()">' + RPT_TYPES.map(function(r) { return '<option value="' + r.id + '"' + (rptType === r.id ? ' selected' : '') + '>' + r.label + '</option>'; }).join('') + '</select></div>' +
        '<div class="fg" style="flex:1;min-width:140px"><label class="fl">Period</label><select class="fi" id="rptPeriod" onchange="rptPeriod=this.value;rptRefresh()">' +
          '<option value="month"' + (rptPeriod==='month'?' selected':'') + '>Current Month</option>' +
          '<option value="lastmonth"' + (rptPeriod==='lastmonth'?' selected':'') + '>Last Month</option>' +
          '<option value="year"' + (rptPeriod==='year'?' selected':'') + '>Current Year (' + year + ')</option>' +
          '<option value="lastyear"' + (rptPeriod==='lastyear'?' selected':'') + '>Previous Year (' + (year-1) + ')</option>' +
          '<option value="custom"' + (rptPeriod==='custom'?' selected':'') + '>Custom Range</option>' +
        '</select></div>' +
        '<div class="fg" style="flex:1;min-width:120px"><label class="fl">Account</label><select class="fi" id="rptAccount" onchange="rptAccount=this.value;rptRefresh()"><option value="all">All Accounts</option>' + ACCOUNTS.map(function(a) { return '<option value="' + a.id + '"' + (rptAccount===a.id?' selected':'') + '>' + a.name + '</option>'; }).join('') + '</select></div>' +
        '<div class="fg" style="flex:1;min-width:120px"><label class="fl">Category</label><select class="fi" id="rptCategory" onchange="rptCategory=this.value;rptRefresh()"><option value="all">All Categories</option><option value="income"' + (rptCategory==='income'?' selected':'') + '>Income</option><option value="expense"' + (rptCategory==='expense'?' selected':'') + '>Expense</option><option value="savings"' + (rptCategory==='savings'?' selected':'') + '>Savings</option></select></div>' +
      '</div>' +
      (rptPeriod === 'custom' ? '<div class="rpt-filter-row" style="margin-top:8px"><div class="fg" style="flex:1"><label class="fl">From</label><input class="fi" type="date" id="rptFrom" value="' + (rptCustomFrom || year + '-01-01') + '" onchange="rptCustomFrom=this.value;rptRefresh()"></div><div class="fg" style="flex:1"><label class="fl">To</label><input class="fi" type="date" id="rptTo" value="' + (rptCustomTo || year + '-12-31') + '" onchange="rptCustomTo=this.value;rptRefresh()"></div></div>' : '') +
    '</div>' +
    '<div class="rpt-actions">' +
      '<button class="btn bp" onclick="rptPrint()"><i data-lucide="printer" width="13" height="13"></i> Print</button>' +
      '<button class="btn bs" onclick="rptExportPDF()"><i data-lucide="file-text" width="13" height="13"></i> PDF</button>' +
      '<button class="btn bs" onclick="rptExportExcel()"><i data-lucide="table" width="13" height="13"></i> Excel</button>' +
      '<button class="btn bs" onclick="rptExportCSV()"><i data-lucide="file-down" width="13" height="13"></i> CSV</button>' +
    '</div>' +
    '<div class="rpt-preview" id="rptPreview">' + rptGeneratePreview() + '</div>' +
  '</div>';
  lucide.createIcons();
}

function rptRefresh() {
  var c = document.getElementById('cnt');
  if (c && curPage === 'reports') renderReports(c);
}

// === DATE RANGE HELPERS ===
function rptGetDateRange() {
  var year = getSelectedYear();
  var now = new Date();
  if (rptPeriod === 'month') { var m = now.getMonth(); return { from: new Date(year, m, 1), to: new Date(year, m + 1, 0), label: MONTH_NAMES[m] + ' ' + year }; }
  if (rptPeriod === 'lastmonth') { var m = now.getMonth() - 1; var y = m < 0 ? year - 1 : year; m = m < 0 ? 11 : m; return { from: new Date(y, m, 1), to: new Date(y, m + 1, 0), label: MONTH_NAMES[m] + ' ' + y }; }
  if (rptPeriod === 'year') return { from: new Date(year, 0, 1), to: new Date(year, 11, 31), label: 'Year ' + year };
  if (rptPeriod === 'lastyear') return { from: new Date(year - 1, 0, 1), to: new Date(year - 1, 11, 31), label: 'Year ' + (year - 1) };
  if (rptPeriod === 'custom') return { from: new Date(rptCustomFrom || year + '-01-01'), to: new Date(rptCustomTo || year + '-12-31'), label: (rptCustomFrom || year + '-01-01') + ' to ' + (rptCustomTo || year + '-12-31') };
  return { from: new Date(year, 0, 1), to: new Date(year, 11, 31), label: 'Year ' + year };
}

function rptFilterTXN() {
  var range = rptGetDateRange();
  return TXN.filter(function(tx) {
    var d = new Date(tx.d);
    if (d < range.from || d > range.to) return false;
    if (rptAccount !== 'all' && tx.acc !== rptAccount) return false;
    if (rptCategory === 'income' && tx.t !== 'Income') return false;
    if (rptCategory === 'expense' && tx.t !== 'Expense') return false;
    if (rptCategory === 'savings' && tx.t !== 'Savings') return false;
    return true;
  });
}

// === REPORT PREVIEW GENERATOR ===
function rptGeneratePreview() {
  var range = rptGetDateRange();
  var txns = rptFilterTXN();
  var now = new Date();
  var genDate = now.toLocaleDateString('en-MY', { day:'numeric', month:'long', year:'numeric' });
  var genTime = now.toLocaleTimeString('en-MY', { hour:'2-digit', minute:'2-digit' });
  var typeLabel = RPT_TYPES.find(function(r) { return r.id === rptType; });
  var title = typeLabel ? typeLabel.label : 'Report';
  var userName = typeof getUserName === 'function' ? getUserName() : 'User';

  var html = '<div class="rpt-doc" id="rptDoc">';
  // Letterhead
  html += '<div class="rpt-letterhead"><div class="rpt-lh-left"><div class="rpt-lh-logo"><i data-lucide="wallet" width="22" height="22"></i></div><div class="rpt-lh-brand"><div class="rpt-lh-title">FinTrack Premium</div><div class="rpt-lh-tagline">Personal Finance Management</div></div></div><div class="rpt-lh-right"><div class="rpt-lh-label">CONFIDENTIAL</div></div></div>';
  // Report title block
  html += '<div class="rpt-title-block"><h1 class="rpt-main-title">' + title + '</h1><div class="rpt-title-meta"><span>Prepared for: <b>' + userName + '</b></span><span>Period: <b>' + range.label + '</b></span><span>Generated: <b>' + genDate + ' at ' + genTime + '</b></span></div></div>';
  // Divider
  html += '<div class="rpt-divider"></div>';
  // Executive Summary
  html += '<div class="rpt-section"><div class="rpt-section-title">Executive Summary</div>' + rptGetSummaryCards(txns) + '</div>';
  // Divider
  html += '<div class="rpt-divider-light"></div>';
  // Detail section
  html += '<div class="rpt-section"><div class="rpt-section-title">Detailed Breakdown</div><div class="rpt-table-wrap">' + rptGetTable(txns) + '</div></div>';
  // Footer
  html += '<div class="rpt-doc-footer"><div class="rpt-footer-left"><span>FinTrack Premium V13.0</span><span class="rpt-footer-sep">|</span><span>' + title + '</span><span class="rpt-footer-sep">|</span><span>' + range.label + '</span></div><div class="rpt-footer-right">Page 1 of 1</div></div>';
  html += '</div>';
  return html;
}

// === SUMMARY CARDS BY TYPE ===
function rptGetSummaryCards(txns) {
  var inc = txns.filter(function(t){return t.t==='Income';}).reduce(function(s,t){return s+t.a;},0);
  var exp = txns.filter(function(t){return t.t==='Expense';}).reduce(function(s,t){return s+t.a;},0);
  var sav = txns.filter(function(t){return t.t==='Savings';}).reduce(function(s,t){return s+t.a;},0);
  var net = inc - exp - sav;

  if (rptType === 'financial' || rptType === 'cashflow') {
    var pv = typeof getPortfolioValue === 'function' ? getPortfolioValue() : 0;
    return '<div class="rpt-kpis"><div class="rpt-kpi"><div class="rpt-kpi-label">Total Income</div><div class="rpt-kpi-value" style="color:var(--emerald)">' + fmt(inc) + '</div></div><div class="rpt-kpi"><div class="rpt-kpi-label">Total Expense</div><div class="rpt-kpi-value" style="color:var(--rose)">' + fmt(exp) + '</div></div><div class="rpt-kpi"><div class="rpt-kpi-label">Total Savings</div><div class="rpt-kpi-value" style="color:var(--blue)">' + fmt(sav) + '</div></div><div class="rpt-kpi"><div class="rpt-kpi-label">Net Cash Flow</div><div class="rpt-kpi-value" style="color:' + (net>=0?'var(--emerald)':'var(--rose)') + '">' + fmt(net) + '</div></div><div class="rpt-kpi"><div class="rpt-kpi-label">Investment Portfolio</div><div class="rpt-kpi-value" style="color:var(--accent)">' + fmt(pv) + '</div></div></div>';
  }
  if (rptType === 'income') {
    var catBreak = {}; txns.filter(function(t){return t.t==='Income';}).forEach(function(t){ if(!catBreak[t.c])catBreak[t.c]=0; catBreak[t.c]+=t.a; });
    var topCat = Object.entries(catBreak).sort(function(a,b){return b[1]-a[1];})[0];
    return '<div class="rpt-kpis"><div class="rpt-kpi"><div class="rpt-kpi-label">Total Income</div><div class="rpt-kpi-value" style="color:var(--emerald)">' + fmt(inc) + '</div></div><div class="rpt-kpi"><div class="rpt-kpi-label">Transactions</div><div class="rpt-kpi-value">' + txns.filter(function(t){return t.t==='Income';}).length + '</div></div><div class="rpt-kpi"><div class="rpt-kpi-label">Top Source</div><div class="rpt-kpi-value">' + (topCat ? topCat[0] : '-') + '</div></div></div>';
  }
  if (rptType === 'expense') {
    var catBreak = {}; txns.filter(function(t){return t.t==='Expense';}).forEach(function(t){ if(!catBreak[t.c])catBreak[t.c]=0; catBreak[t.c]+=t.a; });
    var topCat = Object.entries(catBreak).sort(function(a,b){return b[1]-a[1];})[0];
    return '<div class="rpt-kpis"><div class="rpt-kpi"><div class="rpt-kpi-label">Total Expense</div><div class="rpt-kpi-value" style="color:var(--rose)">' + fmt(exp) + '</div></div><div class="rpt-kpi"><div class="rpt-kpi-label">Transactions</div><div class="rpt-kpi-value">' + txns.filter(function(t){return t.t==='Expense';}).length + '</div></div><div class="rpt-kpi"><div class="rpt-kpi-label">Top Category</div><div class="rpt-kpi-value">' + (topCat ? topCat[0] : '-') + '</div></div></div>';
  }
  if (rptType === 'savings') {
    return '<div class="rpt-kpis"><div class="rpt-kpi"><div class="rpt-kpi-label">Total Savings</div><div class="rpt-kpi-value" style="color:var(--blue)">' + fmt(sav) + '</div></div><div class="rpt-kpi"><div class="rpt-kpi-label">Savings Rate</div><div class="rpt-kpi-value">' + (inc > 0 ? (sav/inc*100).toFixed(1) + '%' : '0%') + '</div></div><div class="rpt-kpi"><div class="rpt-kpi-label">Transactions</div><div class="rpt-kpi-value">' + txns.filter(function(t){return t.t==='Savings';}).length + '</div></div></div>';
  }
  if (rptType === 'budget') {
    var budgetYear = getSelectedYear();
    var budget = getYearlyBudgetTotal(budgetYear);
    var remaining = budget - exp;
    return '<div class="rpt-kpis"><div class="rpt-kpi"><div class="rpt-kpi-label">Annual Budget</div><div class="rpt-kpi-value">' + fmt(budget) + '</div></div><div class="rpt-kpi"><div class="rpt-kpi-label">Actual Spending</div><div class="rpt-kpi-value" style="color:var(--rose)">' + fmt(exp) + '</div></div><div class="rpt-kpi"><div class="rpt-kpi-label">Remaining</div><div class="rpt-kpi-value" style="color:' + (remaining>=0?'var(--emerald)':'var(--rose)') + '">' + fmt(remaining) + '</div></div><div class="rpt-kpi"><div class="rpt-kpi-label">Usage</div><div class="rpt-kpi-value">' + (budget>0?(exp/budget*100).toFixed(0):'0') + '%</div></div></div>';
  }
  if (rptType === 'goal') {
    var activeGoals = typeof GOALS !== 'undefined' ? GOALS.filter(function(g){return g.c < g.t;}).length : 0;
    var totalGoals = typeof GOALS !== 'undefined' ? GOALS.length : 0;
    var totalSaved = typeof GOALS !== 'undefined' ? GOALS.reduce(function(s,g){return s+g.c;},0) : 0;
    var totalTarget = typeof GOALS !== 'undefined' ? GOALS.reduce(function(s,g){return s+g.t;},0) : 0;
    return '<div class="rpt-kpis"><div class="rpt-kpi"><div class="rpt-kpi-label">Total Goals</div><div class="rpt-kpi-value">' + totalGoals + '</div></div><div class="rpt-kpi"><div class="rpt-kpi-label">Active</div><div class="rpt-kpi-value">' + activeGoals + '</div></div><div class="rpt-kpi"><div class="rpt-kpi-label">Saved</div><div class="rpt-kpi-value" style="color:var(--emerald)">' + fmt(totalSaved) + '</div></div><div class="rpt-kpi"><div class="rpt-kpi-label">Remaining</div><div class="rpt-kpi-value">' + fmt(totalTarget - totalSaved) + '</div></div></div>';
  }
  if (rptType === 'investment') {
    var pv = typeof getPortfolioValue === 'function' ? getPortfolioValue() : 0;
    var ti = typeof getTotalInvested === 'function' ? getTotalInvested() : 0;
    var pnl = pv - ti;
    return '<div class="rpt-kpis"><div class="rpt-kpi"><div class="rpt-kpi-label">Portfolio Value</div><div class="rpt-kpi-value" style="color:var(--accent)">' + fmt(pv) + '</div></div><div class="rpt-kpi"><div class="rpt-kpi-label">Total Deposit</div><div class="rpt-kpi-value">' + fmt(ti) + '</div></div><div class="rpt-kpi"><div class="rpt-kpi-label">Profit / Loss</div><div class="rpt-kpi-value" style="color:' + (pnl>=0?'var(--emerald)':'var(--rose)') + '">' + (pnl>=0?'+':'') + fmt(pnl) + '</div></div><div class="rpt-kpi"><div class="rpt-kpi-label">Return</div><div class="rpt-kpi-value">' + (ti>0?(pnl/ti*100).toFixed(2):'0') + '%</div></div></div>';
  }
  if (rptType === 'networth') {
    var nw = typeof getNetWorth === 'function' ? getNetWorth() : 0;
    var assets = ACCOUNTS.filter(function(a){return a.type==='asset';}).reduce(function(s,a){return s+getAccountBalance(a.id);},0);
    var liab = ACCOUNTS.filter(function(a){return a.type==='liability';}).reduce(function(s,a){return s+Math.abs(a.initialBalance);},0);
    return '<div class="rpt-kpis"><div class="rpt-kpi"><div class="rpt-kpi-label">Net Worth</div><div class="rpt-kpi-value" style="color:var(--accent)">' + fmt(nw) + '</div></div><div class="rpt-kpi"><div class="rpt-kpi-label">Total Assets</div><div class="rpt-kpi-value" style="color:var(--emerald)">' + fmt(assets) + '</div></div><div class="rpt-kpi"><div class="rpt-kpi-label">Total Liabilities</div><div class="rpt-kpi-value" style="color:var(--rose)">' + fmt(liab) + '</div></div></div>';
  }
  return '';
}

// === TABLE BY TYPE ===
function rptGetTable(txns) {
  if (rptType === 'goal') return rptGoalTable();
  if (rptType === 'investment') return rptInvestmentTable();
  if (rptType === 'networth') return rptNetWorthTable();
  if (rptType === 'budget') return rptBudgetTable();
  if (rptType === 'cashflow' || rptType === 'financial') return rptCashFlowTable(txns);

  var filtered = txns;
  if (rptType === 'income') filtered = txns.filter(function(t){return t.t==='Income';});
  if (rptType === 'expense') filtered = txns.filter(function(t){return t.t==='Expense';});
  if (rptType === 'savings') filtered = txns.filter(function(t){return t.t==='Savings';});

  if (!filtered.length) return '<div class="es" style="padding:20px"><p>No transactions found for this period.</p></div>';

  var sorted = filtered.slice().sort(function(a,b){return new Date(b.d)-new Date(a.d);});
  var total = sorted.reduce(function(s,t){return s+t.a;},0);

  var html = '<table class="rpt-tbl"><thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Subcategory</th><th>Description</th><th style="text-align:right">Amount</th></tr></thead><tbody>';
  sorted.forEach(function(tx) {
    var cls = tx.t === 'Income' ? 'ai' : tx.t === 'Expense' ? 'ae' : 'as';
    html += '<tr><td>' + tx.d + '</td><td><span class="tb ' + (tx.t==='Income'?'i':tx.t==='Expense'?'e':'s') + '">' + tx.t + '</span></td><td>' + tx.c + '</td><td>' + (tx.s||'-') + '</td><td>' + (tx.dt||'-') + '</td><td class="' + cls + '" style="text-align:right">' + fmt(tx.a) + '</td></tr>';
  });
  html += '</tbody><tfoot><tr><td colspan="5" style="font-weight:700;text-align:right">Total</td><td style="text-align:right;font-weight:700">' + fmt(total) + '</td></tr></tfoot></table>';
  return html;
}

function rptGoalTable() {
  if (typeof GOALS === 'undefined' || !GOALS.length) return '<div class="es"><p>No goals found.</p></div>';
  var html = '<table class="rpt-tbl"><thead><tr><th>Goal</th><th style="text-align:right">Target</th><th style="text-align:right">Saved</th><th style="text-align:right">Remaining</th><th style="text-align:right">Progress</th><th>Deadline</th></tr></thead><tbody>';
  GOALS.forEach(function(g) {
    var pct = g.t > 0 ? (g.c/g.t*100).toFixed(0) : 0;
    html += '<tr><td>' + g.e + ' ' + g.n + '</td><td style="text-align:right">' + fmt(g.t) + '</td><td style="text-align:right;color:var(--emerald)">' + fmt(g.c) + '</td><td style="text-align:right">' + fmt(g.t-g.c) + '</td><td style="text-align:right;font-weight:600">' + pct + '%</td><td>' + (g.due||'-') + '</td></tr>';
  });
  html += '</tbody></table>';
  return html;
}

function rptInvestmentTable() {
  if (typeof INVESTMENTS === 'undefined' || !INVESTMENTS.length) return '<div class="es"><p>No investments found.</p></div>';
  var html = '<table class="rpt-tbl"><thead><tr><th>Investment</th><th>Type</th><th style="text-align:right">Deposit</th><th style="text-align:right">Value</th><th style="text-align:right">P&L</th><th style="text-align:right">Return</th></tr></thead><tbody>';
  var totalDep = 0, totalVal = 0;
  INVESTMENTS.forEach(function(inv) {
    var pnl = inv.currentValue - inv.costBasis;
    var ret = inv.costBasis > 0 ? (pnl/inv.costBasis*100).toFixed(1) : '0.0';
    totalDep += inv.costBasis; totalVal += inv.currentValue;
    html += '<tr><td>' + inv.name + '</td><td>' + inv.type + '</td><td style="text-align:right">' + fmt(inv.costBasis) + '</td><td style="text-align:right">' + fmt(inv.currentValue) + '</td><td style="text-align:right;color:' + (pnl>=0?'var(--emerald)':'var(--rose)') + '">' + (pnl>=0?'+':'') + fmt(pnl) + '</td><td style="text-align:right;font-weight:600">' + ret + '%</td></tr>';
  });
  var totalPnl = totalVal - totalDep;
  html += '</tbody><tfoot><tr><td colspan="2" style="font-weight:700">Total</td><td style="text-align:right;font-weight:700">' + fmt(totalDep) + '</td><td style="text-align:right;font-weight:700">' + fmt(totalVal) + '</td><td style="text-align:right;font-weight:700;color:' + (totalPnl>=0?'var(--emerald)':'var(--rose)') + '">' + (totalPnl>=0?'+':'') + fmt(totalPnl) + '</td><td></td></tr></tfoot></table>';
  return html;
}

function rptNetWorthTable() {
  var html = '<table class="rpt-tbl"><thead><tr><th>Account</th><th>Type</th><th style="text-align:right">Balance</th></tr></thead><tbody>';
  var totalA = 0, totalL = 0;
  ACCOUNTS.filter(function(a){return a.type==='asset';}).forEach(function(a) {
    var bal = getAccountBalance(a.id); totalA += bal;
    html += '<tr><td>' + a.name + '</td><td style="color:var(--emerald)">' + a.accountType + '</td><td style="text-align:right;font-weight:600">' + fmt(bal) + '</td></tr>';
  });
  ACCOUNTS.filter(function(a){return a.type==='liability';}).forEach(function(a) {
    totalL += Math.abs(a.initialBalance);
    html += '<tr><td>' + a.name + '</td><td style="color:var(--rose)">' + a.accountType + '</td><td style="text-align:right;font-weight:600;color:var(--rose)">-' + fmt(Math.abs(a.initialBalance)) + '</td></tr>';
  });
  html += '</tbody><tfoot><tr><td colspan="2" style="font-weight:700">Net Worth</td><td style="text-align:right;font-weight:700;font-size:14px">' + fmt(totalA - totalL) + '</td></tr></tfoot></table>';
  return html;
}

function rptBudgetTable() {
  var budgetYear = getSelectedYear();
  var expCats = computeExpenseCategories(budgetYear);
  if (!expCats.length) return '<div class="es"><p>No expense data for this period.</p></div>';
  var html = '<table class="rpt-tbl"><thead><tr><th>Category</th><th style="text-align:right">Budget</th><th style="text-align:right">Actual</th><th style="text-align:right">Remaining</th><th style="text-align:right">Usage</th></tr></thead><tbody>';
  expCats.forEach(function(cat) {
    var remaining = cat.b - cat.a;
    var usage = cat.b > 0 ? (cat.a/cat.b*100).toFixed(0) : '-';
    html += '<tr><td>' + cat.n + '</td><td style="text-align:right">' + fmt(cat.b) + '</td><td style="text-align:right;color:var(--rose)">' + fmt(cat.a) + '</td><td style="text-align:right;color:' + (remaining>=0?'var(--emerald)':'var(--rose)') + '">' + fmt(remaining) + '</td><td style="text-align:right;font-weight:600">' + usage + '%</td></tr>';
  });
  html += '</tbody></table>';
  return html;
}

// === CASH FLOW / P&L STATEMENT ===
function rptCashFlowTable(txns) {
  // Group by category
  var incCats = {};
  var expCats = {};
  var savCats = {};
  txns.forEach(function(tx) {
    if (tx.t === 'Income') { if (!incCats[tx.c]) incCats[tx.c] = 0; incCats[tx.c] += tx.a; }
    if (tx.t === 'Expense') { if (!expCats[tx.c]) expCats[tx.c] = 0; expCats[tx.c] += tx.a; }
    if (tx.t === 'Savings') { if (!savCats[tx.c]) savCats[tx.c] = 0; savCats[tx.c] += tx.a; }
  });

  var totalInc = Object.values(incCats).reduce(function(s,v){return s+v;},0);
  var totalExp = Object.values(expCats).reduce(function(s,v){return s+v;},0);
  var totalSav = Object.values(savCats).reduce(function(s,v){return s+v;},0);
  var grossProfit = totalInc - totalExp;
  var netCashFlow = totalInc - totalExp - totalSav;

  var html = '<table class="rpt-tbl rpt-pnl">';

  // REVENUE / INCOME
  html += '<thead><tr><th colspan="2" style="background:var(--emerald-light);color:var(--emerald);font-size:10px;font-weight:700">REVENUE / INCOME</th></tr></thead><tbody>';
  Object.entries(incCats).sort(function(a,b){return b[1]-a[1];}).forEach(function(entry) {
    html += '<tr><td style="padding-left:24px">' + entry[0] + '</td><td style="text-align:right;font-weight:600;color:var(--emerald)">' + fmt(entry[1]) + '</td></tr>';
  });
  html += '<tr class="rpt-pnl-subtotal"><td style="font-weight:700">Total Revenue</td><td style="text-align:right;font-weight:800;color:var(--emerald)">' + fmt(totalInc) + '</td></tr>';
  html += '</tbody>';

  // EXPENSES
  html += '<thead><tr><th colspan="2" style="background:var(--rose-light);color:var(--rose);font-size:10px;font-weight:700;border-top:none">EXPENSES</th></tr></thead><tbody>';
  Object.entries(expCats).sort(function(a,b){return b[1]-a[1];}).forEach(function(entry) {
    html += '<tr><td style="padding-left:24px">' + entry[0] + '</td><td style="text-align:right;font-weight:600;color:var(--rose)">(' + fmt(entry[1]) + ')</td></tr>';
  });
  html += '<tr class="rpt-pnl-subtotal"><td style="font-weight:700">Total Expenses</td><td style="text-align:right;font-weight:800;color:var(--rose)">(' + fmt(totalExp) + ')</td></tr>';
  html += '</tbody>';

  // GROSS PROFIT
  html += '<tbody><tr class="rpt-pnl-gross"><td style="font-weight:800;font-size:12px">Gross Profit (Income - Expenses)</td><td style="text-align:right;font-weight:800;font-size:13px;color:' + (grossProfit>=0?'var(--emerald)':'var(--rose)') + '">' + (grossProfit>=0?'':'(') + fmt(Math.abs(grossProfit)) + (grossProfit<0?')':'') + '</td></tr></tbody>';

  // SAVINGS / TRANSFERS
  if (Object.keys(savCats).length > 0) {
    html += '<thead><tr><th colspan="2" style="background:var(--blue-light);color:var(--blue);font-size:10px;font-weight:700;border-top:none">SAVINGS / TRANSFERS OUT</th></tr></thead><tbody>';
    Object.entries(savCats).sort(function(a,b){return b[1]-a[1];}).forEach(function(entry) {
      html += '<tr><td style="padding-left:24px">' + entry[0] + '</td><td style="text-align:right;font-weight:600;color:var(--blue)">(' + fmt(entry[1]) + ')</td></tr>';
    });
    html += '<tr class="rpt-pnl-subtotal"><td style="font-weight:700">Total Savings</td><td style="text-align:right;font-weight:800;color:var(--blue)">(' + fmt(totalSav) + ')</td></tr>';
    html += '</tbody>';
  }

  // NET CASH FLOW
  html += '<tfoot><tr><td style="font-weight:800;font-size:13px;padding:14px 12px">NET CASH FLOW</td><td style="text-align:right;font-weight:800;font-size:15px;padding:14px 12px;color:' + (netCashFlow>=0?'var(--emerald)':'var(--rose)') + '">' + (netCashFlow>=0?'':'(') + fmt(Math.abs(netCashFlow)) + (netCashFlow<0?')':'') + '</td></tr></tfoot>';

  html += '</table>';
  return html;
}

// === EXPORT: PRINT ===
function rptPrint() {
  var doc = document.getElementById('rptDoc');
  if (!doc) return;
  var win = window.open('', '_blank');
  win.document.write('<!DOCTYPE html><html><head><title>FinTrack Report</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;font-size:11px;color:#1a1a2e;padding:40px 50px;max-width:800px;margin:0 auto;line-height:1.5}table{width:100%;border-collapse:collapse;font-size:10px;margin:14px 0}th,td{padding:8px 10px;text-align:left;border-bottom:1px solid #eaeaea}th{font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#666;border-bottom:2px solid #1a1a2e;background:#f8f8fa}tfoot td{border-top:2px solid #1a1a2e;border-bottom:none;font-weight:700;background:#f8f8fa}tr:nth-child(even) td{background:#fafafa}.rpt-letterhead{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}.rpt-lh-left{display:flex;align-items:center;gap:10px}.rpt-lh-logo{width:36px;height:36px;border-radius:8px;background:#4f46e5;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:14px}.rpt-lh-title{font-size:16px;font-weight:800}.rpt-lh-tagline{font-size:9px;color:#888}.rpt-lh-label{font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#999;border:1px solid #ddd;padding:3px 8px;border-radius:3px}.rpt-title-block{margin-bottom:16px}.rpt-main-title{font-size:20px;font-weight:800;margin-bottom:6px}.rpt-title-meta{display:flex;gap:16px;font-size:10px;color:#666}.rpt-title-meta b{color:#1a1a2e}.rpt-divider{height:2px;background:linear-gradient(90deg,#4f46e5,#e5e5e5 50%,transparent);margin:16px 0}.rpt-divider-light{height:1px;background:#e5e5e5;margin:16px 0}.rpt-section{margin-bottom:16px}.rpt-section-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#666;margin-bottom:10px;padding-bottom:4px;border-bottom:1px solid #eee}.rpt-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px;margin:12px 0}.rpt-kpi{padding:10px 12px;border:1px solid #eaeaea;border-radius:6px;background:#f8f8fa}.rpt-kpi-label{font-size:8px;font-weight:700;text-transform:uppercase;color:#888;margin-bottom:3px}.rpt-kpi-value{font-size:14px;font-weight:800}.rpt-doc-footer{display:flex;justify-content:space-between;margin-top:20px;padding-top:10px;border-top:2px solid #1a1a2e;font-size:8px;color:#999}.rpt-footer-sep{margin:0 3px;color:#ccc}@media print{body{padding:20px}}</style></head><body>' + doc.innerHTML.replace(/style="color:var\(--emerald\)"/g,'style="color:#059669"').replace(/style="color:var\(--rose\)"/g,'style="color:#dc2626"').replace(/style="color:var\(--blue\)"/g,'style="color:#2563eb"').replace(/style="color:var\(--accent\)"/g,'style="color:#4f46e5"') + '</body></html>');
  win.document.close();
  setTimeout(function() { win.print(); }, 300);
}

// === EXPORT: PDF (via print-to-PDF) ===
function rptExportPDF() {
  rptPrint();
  toast('Use "Save as PDF" in the print dialog');
}

// === EXPORT: EXCEL ===
function rptExportExcel() {
  var txns = rptFilterTXN();
  var filtered = txns;
  if (rptType === 'income') filtered = txns.filter(function(t){return t.t==='Income';});
  if (rptType === 'expense') filtered = txns.filter(function(t){return t.t==='Expense';});
  if (rptType === 'savings') filtered = txns.filter(function(t){return t.t==='Savings';});

  var typeLabel = RPT_TYPES.find(function(r){return r.id===rptType;});
  var title = typeLabel ? typeLabel.label : 'Report';
  var range = rptGetDateRange();

  var xml = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">';
  xml += '<Worksheet ss:Name="' + title + '"><Table>';
  xml += '<Row><Cell><Data ss:Type="String">' + title + ' - ' + range.label + '</Data></Cell></Row><Row></Row>';

  if (rptType === 'goal' && typeof GOALS !== 'undefined') {
    xml += '<Row><Cell><Data ss:Type="String">Goal</Data></Cell><Cell><Data ss:Type="String">Target</Data></Cell><Cell><Data ss:Type="String">Saved</Data></Cell><Cell><Data ss:Type="String">Remaining</Data></Cell><Cell><Data ss:Type="String">Progress</Data></Cell><Cell><Data ss:Type="String">Deadline</Data></Cell></Row>';
    GOALS.forEach(function(g) { xml += '<Row><Cell><Data ss:Type="String">' + g.n + '</Data></Cell><Cell><Data ss:Type="Number">' + g.t + '</Data></Cell><Cell><Data ss:Type="Number">' + g.c + '</Data></Cell><Cell><Data ss:Type="Number">' + (g.t-g.c) + '</Data></Cell><Cell><Data ss:Type="String">' + (g.t>0?(g.c/g.t*100).toFixed(0):'0') + '%</Data></Cell><Cell><Data ss:Type="String">' + (g.due||'') + '</Data></Cell></Row>'; });
  } else if (rptType === 'investment' && typeof INVESTMENTS !== 'undefined') {
    xml += '<Row><Cell><Data ss:Type="String">Investment</Data></Cell><Cell><Data ss:Type="String">Type</Data></Cell><Cell><Data ss:Type="Number">Deposit</Data></Cell><Cell><Data ss:Type="Number">Value</Data></Cell><Cell><Data ss:Type="Number">P&L</Data></Cell><Cell><Data ss:Type="String">Return</Data></Cell></Row>';
    INVESTMENTS.forEach(function(inv) { var pnl = inv.currentValue-inv.costBasis; xml += '<Row><Cell><Data ss:Type="String">' + inv.name + '</Data></Cell><Cell><Data ss:Type="String">' + inv.type + '</Data></Cell><Cell><Data ss:Type="Number">' + inv.costBasis + '</Data></Cell><Cell><Data ss:Type="Number">' + inv.currentValue + '</Data></Cell><Cell><Data ss:Type="Number">' + pnl + '</Data></Cell><Cell><Data ss:Type="String">' + (inv.costBasis>0?(pnl/inv.costBasis*100).toFixed(1):'0') + '%</Data></Cell></Row>'; });
  } else {
    xml += '<Row><Cell><Data ss:Type="String">Date</Data></Cell><Cell><Data ss:Type="String">Type</Data></Cell><Cell><Data ss:Type="String">Category</Data></Cell><Cell><Data ss:Type="String">Subcategory</Data></Cell><Cell><Data ss:Type="String">Description</Data></Cell><Cell><Data ss:Type="Number">Amount</Data></Cell></Row>';
    filtered.sort(function(a,b){return new Date(b.d)-new Date(a.d);}).forEach(function(tx) { xml += '<Row><Cell><Data ss:Type="String">' + tx.d + '</Data></Cell><Cell><Data ss:Type="String">' + tx.t + '</Data></Cell><Cell><Data ss:Type="String">' + tx.c + '</Data></Cell><Cell><Data ss:Type="String">' + (tx.s||'') + '</Data></Cell><Cell><Data ss:Type="String">' + (tx.dt||'') + '</Data></Cell><Cell><Data ss:Type="Number">' + tx.a + '</Data></Cell></Row>'; });
  }

  xml += '</Table></Worksheet></Workbook>';
  var blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a'); a.href = url; a.download = 'fintrack-' + rptType + '-' + new Date().toISOString().split('T')[0] + '.xls'; a.click(); URL.revokeObjectURL(url);
  toast('Excel exported');
}

// === EXPORT: CSV ===
function rptExportCSV() {
  var txns = rptFilterTXN();
  var filtered = txns;
  if (rptType === 'income') filtered = txns.filter(function(t){return t.t==='Income';});
  if (rptType === 'expense') filtered = txns.filter(function(t){return t.t==='Expense';});
  if (rptType === 'savings') filtered = txns.filter(function(t){return t.t==='Savings';});

  var rows = [];
  if (rptType === 'goal' && typeof GOALS !== 'undefined') {
    rows.push('Goal,Target,Saved,Remaining,Progress,Deadline');
    GOALS.forEach(function(g) { rows.push('"' + g.n + '",' + g.t + ',' + g.c + ',' + (g.t-g.c) + ',' + (g.t>0?(g.c/g.t*100).toFixed(0):'0') + '%,' + (g.due||'')); });
  } else if (rptType === 'investment' && typeof INVESTMENTS !== 'undefined') {
    rows.push('Investment,Type,Deposit,Value,P&L,Return');
    INVESTMENTS.forEach(function(inv) { var pnl = inv.currentValue-inv.costBasis; rows.push('"' + inv.name + '","' + inv.type + '",' + inv.costBasis + ',' + inv.currentValue + ',' + pnl + ',' + (inv.costBasis>0?(pnl/inv.costBasis*100).toFixed(1):'0') + '%'); });
  } else {
    rows.push('Date,Type,Category,Subcategory,Description,Amount');
    filtered.sort(function(a,b){return new Date(b.d)-new Date(a.d);}).forEach(function(tx) { rows.push(tx.d + ',"' + tx.t + '","' + tx.c + '","' + (tx.s||'') + '","' + (tx.dt||'').replace(/"/g,'""') + '",' + tx.a); });
  }

  var csv = rows.join('\n');
  var blob = new Blob([csv], { type: 'text/csv' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a'); a.href = url; a.download = 'fintrack-' + rptType + '-' + new Date().toISOString().split('T')[0] + '.csv'; a.click(); URL.revokeObjectURL(url);
  toast('CSV exported');
}