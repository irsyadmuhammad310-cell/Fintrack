// === INVESTMENTS V12.1 - Portfolio Management ===
const INV_STORAGE = 'ft_investments';
const INV_ACT_STORAGE = 'ft_inv_activities';
const INV_WL_STORAGE = 'ft_inv_watchlist';
const INV_SNAP_STORAGE = 'ft_inv_snapshots';

const INV_CATEGORIES = ['Stocks','ETFs','REITs','Mutual Funds','Bonds','Crypto','Gold','Fixed Deposit','EPF','ASB / ASM','Unit Trust','Cash Investments','Others'];

const DEFAULT_INVESTMENTS = [];

const DEFAULT_ACTIVITIES = [];

const DEFAULT_WATCHLIST = [];

let INVESTMENTS = JSON.parse(localStorage.getItem(INV_STORAGE) || 'null') || JSON.parse(JSON.stringify(DEFAULT_INVESTMENTS));
let INV_ACTIVITIES = JSON.parse(localStorage.getItem(INV_ACT_STORAGE) || 'null') || JSON.parse(JSON.stringify(DEFAULT_ACTIVITIES));
let INV_WATCHLIST = JSON.parse(localStorage.getItem(INV_WL_STORAGE) || 'null') || JSON.parse(JSON.stringify(DEFAULT_WATCHLIST));
let invNxId = parseInt(localStorage.getItem('ft_invNxId') || '20');
let invActNxId = parseInt(localStorage.getItem('ft_invActNxId') || '20');
let invWlNxId = parseInt(localStorage.getItem('ft_invWlNxId') || '10');

function saveINV() { localStorage.setItem(INV_STORAGE, JSON.stringify(INVESTMENTS)); localStorage.setItem('ft_invNxId', invNxId); }
function saveINV_ACT() { localStorage.setItem(INV_ACT_STORAGE, JSON.stringify(INV_ACTIVITIES)); localStorage.setItem('ft_invActNxId', invActNxId); }
function saveINV_WL() { localStorage.setItem(INV_WL_STORAGE, JSON.stringify(INV_WATCHLIST)); localStorage.setItem('ft_invWlNxId', invWlNxId); }

// === TXN SYNC: Savings transactions are the master for costBasis ===
var _invSyncLock = false;
function syncInvestmentsFromTXN() {
  if (typeof TXN === 'undefined' || _invSyncLock) return;
  _invSyncLock = true;
  var changed = false;
  INVESTMENTS.forEach(function(inv) {
    if (!inv.txnLink) return;
    var link = inv.txnLink;
    var total = TXN.filter(function(tx) {
      if (tx.t !== 'Savings') return false;
      if (link.subcategory) return tx.c === link.category && tx.s === link.subcategory;
      return tx.c === link.category;
    }).reduce(function(sum, tx) { return sum + tx.a; }, 0);
    if (inv.costBasis !== total) { inv.costBasis = total; inv.avgCost = inv.quantity > 0 ? total / inv.quantity : total; changed = true; }
  });
  if (changed) saveINV();
  _invSyncLock = false;
}

// Build savings category options for txnLink selector
function getSavingsLinkOptions() {
  if (typeof SCHEMA === 'undefined') return [];
  var opts = [{ value: '', label: 'None (manual)' }];
  var sav = SCHEMA.Savings || {};
  Object.keys(sav).forEach(function(cat) {
    opts.push({ value: cat + ':', label: cat + ' (all)' });
    (sav[cat] || []).forEach(function(sub) {
      opts.push({ value: cat + ':' + sub, label: cat + ' → ' + sub });
    });
  });
  return opts;
}

function parseTxnLinkValue(val) {
  if (!val) return null;
  var parts = val.split(':');
  if (parts.length === 2 && parts[1]) return { category: parts[0], subcategory: parts[1] };
  if (parts[0]) return { category: parts[0] };
  return null;
}

function txnLinkToValue(link) {
  if (!link) return '';
  if (link.subcategory) return link.category + ':' + link.subcategory;
  return link.category + ':';
}

// === PORTFOLIO CALCULATIONS (sync: Dashboard/Analytics/Reports) ===
function getPortfolioValue() { return INVESTMENTS.reduce((s, i) => s + i.currentValue, 0); }
function getTotalInvested() { syncInvestmentsFromTXN(); return INVESTMENTS.reduce((s, i) => s + i.costBasis, 0); }
function getPortfolioPnL() { return getPortfolioValue() - getTotalInvested(); }
function getPortfolioReturn() { const inv = getTotalInvested(); return inv > 0 ? ((getPortfolioPnL() / inv) * 100) : 0; }
function getTotalDividends() { return INVESTMENTS.reduce((s, i) => s + (i.dividendReceived || 0), 0); }
function getAssetAllocation() {
  const alloc = {};
  const total = getPortfolioValue();
  INVESTMENTS.forEach(i => { if (!alloc[i.type]) alloc[i.type] = 0; alloc[i.type] += i.currentValue; });
  return Object.entries(alloc).map(([type, value]) => ({ type, value, pct: total > 0 ? (value / total * 100) : 0 })).sort((a, b) => b.value - a.value);
}
function getInvestmentsByPerformance() {
  return INVESTMENTS.map(i => {
    const pnl = i.currentValue - i.costBasis;
    const ret = i.costBasis > 0 ? (pnl / i.costBasis * 100) : 0;
    return { ...i, pnl, returnPct: ret };
  }).sort((a, b) => b.returnPct - a.returnPct);
}

function getPortfolioSnapshots() {
  const snaps = JSON.parse(localStorage.getItem(INV_SNAP_STORAGE) || '[]');
  if (snaps.length === 0) {
    const today = new Date();
    const generated = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const factor = 1 - (i * 0.008) + (Math.random() * 0.02 - 0.01);
      generated.push({ date: d.toISOString().split('T')[0], value: Math.round(getPortfolioValue() * factor), invested: Math.round(getTotalInvested() * (1 - i * 0.005)) });
    }
    generated.push({ date: today.toISOString().split('T')[0], value: getPortfolioValue(), invested: getTotalInvested() });
    return generated;
  }
  return snaps;
}

let invExpandedId = null;
let invPerfChart = null;
let invAllocChart = null;

// === RENDER INVESTMENTS PAGE ===
function renderInvestments(c) {
  syncInvestmentsFromTXN();
  const portfolio = getPortfolioValue();
  const invested = getTotalInvested();
  const pnl = getPortfolioPnL();
  const returnPct = getPortfolioReturn();
  const dividends = getTotalDividends();
  const isGain = pnl >= 0;

  c.innerHTML = '<div class="inv-page">' +
    '<div class="inv-section"><div class="kg inv-kpi">' +
      '<div class="kc bl"><div class="kc-left"><div class="kc-hdr"><div class="ki"><i data-lucide="briefcase" width="14" height="14"></i></div><div class="kl">' + (t('inv_portfolio') || 'Portfolio Value') + '</div></div><div class="kv">' + fmt(portfolio) + '</div></div></div>' +
      '<div class="kc gd"><div class="kc-left"><div class="kc-hdr"><div class="ki"><i data-lucide="piggy-bank" width="14" height="14"></i></div><div class="kl">Total Invested</div></div><div class="kv">' + fmt(invested) + '</div></div></div>' +
      '<div class="kc ' + (isGain ? 'em' : 'rs') + '"><div class="kc-left"><div class="kc-hdr"><div class="ki"><i data-lucide="' + (isGain ? 'trending-up' : 'trending-down') + '" width="14" height="14"></i></div><div class="kl">Profit / Loss</div></div><div class="kv" style="color:var(' + (isGain ? '--emerald' : '--rose') + ')">' + (isGain ? '+' : '') + fmt(pnl) + '</div></div></div>' +
      '<div class="kc ' + (isGain ? 'gn' : 'rs') + '"><div class="kc-left"><div class="kc-hdr"><div class="ki"><i data-lucide="percent" width="14" height="14"></i></div><div class="kl">Total Return</div></div><div class="kv" style="color:var(' + (isGain ? '--emerald' : '--rose') + ')">' + (isGain ? '+' : '') + returnPct.toFixed(2) + '%</div></div></div>' +
      '<div class="kc pk"><div class="kc-left"><div class="kc-hdr"><div class="ki"><i data-lucide="coins" width="14" height="14"></i></div><div class="kl">Dividends</div></div><div class="kv">' + fmt(dividends) + '</div></div></div>' +
    '</div></div>' +
    '<div class="inv-section"><div class="inv-sec-hdr"><div><div class="ct">Watchlist</div><div class="cs">Market prices you\'re monitoring</div></div><button class="btn bs" onclick="invShowWLModal()"><i data-lucide="plus" width="14" height="14"></i> Add</button></div><div class="inv-watchlist" id="invWatchlist">' + renderWatchlist() + '</div></div>' +
    '<div class="inv-section"><div class="cc inv-perf-card"><div class="inv-perf-hdr"><div><div class="ct">Portfolio Performance</div><div class="cs">Track your portfolio growth over time</div></div><div class="inv-perf-ctrls"><div class="seg inv-metric-seg"><button class="active" onclick="invSwitchMetric(\'value\')">Value</button><button onclick="invSwitchMetric(\'pnl\')">P&L</button></div><div class="seg inv-time-seg"><button onclick="invSwitchTime(\'1m\')">1M</button><button onclick="invSwitchTime(\'3m\')">3M</button><button onclick="invSwitchTime(\'6m\')">6M</button><button class="active" onclick="invSwitchTime(\'1y\')">1Y</button><button onclick="invSwitchTime(\'all\')">All</button></div></div></div><div style="height:220px;margin-top:12px"><canvas id="invPerfChart"></canvas></div></div></div>' +
    '<div class="inv-section"><div class="inv-alloc-grid"><div class="cc"><div class="ct">Asset Allocation</div><div class="cs">Distribution by investment type</div><div style="height:220px;margin-top:8px"><canvas id="invAllocChart"></canvas></div></div><div class="cc"><div class="ct">Portfolio Breakdown</div><div class="cs">Performance by asset type</div><div class="inv-alloc-list" id="invAllocList">' + renderPortfolioBreakdown() + '</div></div></div></div>' +
    '<div class="inv-section"><div class="inv-sec-hdr"><div><div class="ct">Holdings</div><div class="cs">' + INVESTMENTS.length + ' investments in your portfolio</div></div></div><div class="inv-holdings" id="invHoldings">' + renderHoldings() + '</div></div>' +
    '<div class="inv-section"><div class="inv-sec-hdr"><div><div class="ct">Recent Activities</div><div class="cs">Latest investment transactions</div></div></div><div class="inv-activities" id="invActivities">' + renderActivities() + '</div></div>' +
  '</div>' +
  '<div class="mo" id="invModal"><div class="ml" style="max-width:520px"><div class="mh"><div><div class="mti" id="invModalTitle">Add Investment</div><div class="mds">Enter investment details</div></div><button class="mx" onclick="invCloseModal()"><i data-lucide="x" width="14" height="14"></i></button></div><form id="invForm" onsubmit="invSaveHolding(event)"><div class="fr"><div class="fg"><label class="fl">Investment Name *</label><input class="fi" id="invName" required></div><div class="fg"><label class="fl">Category *</label><select class="fi" id="invType" required>' + INV_CATEGORIES.map(function(ct){return '<option value="'+ct+'">'+ct+'</option>';}).join('') + '</select></div></div><div class="fg"><label class="fl">Link to Savings TXN</label><select class="fi" id="invTxnLink" onchange="invOnLinkChange()">' + getSavingsLinkOptions().map(function(o){return '<option value="'+o.value+'">'+o.label+'</option>';}).join('') + '</select><div style="font-size:10px;color:var(--text-tertiary);margin-top:3px">Linked = cost basis auto-synced from Savings transactions</div></div><div class="fr"><div class="fg"><label class="fl">Total Cost Basis</label><input class="fi" id="invCost" type="number" step="0.01" min="0"></div><div class="fg"><label class="fl">Current Value</label><input class="fi" id="invValue" type="number" step="0.01" min="0"></div></div><div class="fr"><div class="fg"><label class="fl">Quantity / Units</label><input class="fi" id="invQty" type="number" step="0.0001" min="0" value="1"></div><div class="fg"><label class="fl">Purchase Date</label><input class="fi" id="invDate" type="date"></div></div><div class="fr"><div class="fg"><label class="fl">Avg Cost per Unit</label><input class="fi" id="invAvgCost" type="number" step="0.01" min="0"></div><div class="fg"><label class="fl">Current Price per Unit</label><input class="fi" id="invUnitPrice" type="number" step="0.01" min="0"></div></div><div class="fr"><div class="fg"><label class="fl">Dividends Received</label><input class="fi" id="invDiv" type="number" step="0.01" min="0" value="0"></div><div class="fg"></div></div><div class="fg"><label class="fl">Notes</label><textarea class="fi" id="invNotes" rows="2" style="resize:vertical"></textarea></div><input type="hidden" id="invEditId"><div class="ma"><button type="button" class="btn bs" onclick="invCloseModal()">Cancel</button><button type="submit" class="btn bp" id="invSubmitBtn">Add Investment</button></div></form></div></div>' +
  '<div class="mo" id="invBuyModal"><div class="ml" style="max-width:420px"><div class="mh"><div><div class="mti">Buy More</div><div class="mds" id="invBuySubtitle">Add to position</div></div><button class="mx" onclick="invCloseBuyModal()"><i data-lucide="x" width="14" height="14"></i></button></div><form onsubmit="invProcessBuy(event)"><div class="fr"><div class="fg"><label class="fl">Amount</label><input class="fi" id="invBuyAmt" type="number" step="0.01" min="0.01" required></div><div class="fg"><label class="fl">Units</label><input class="fi" id="invBuyQty" type="number" step="0.0001" min="0.0001" value="1"></div></div><div class="fg"><label class="fl">Notes</label><input class="fi" id="invBuyNotes"></div><input type="hidden" id="invBuyId"><div class="ma"><button type="button" class="btn bs" onclick="invCloseBuyModal()">Cancel</button><button type="submit" class="btn bp">Confirm Buy</button></div></form></div></div>' +
  '<div class="mo" id="invSellModal"><div class="ml" style="max-width:420px"><div class="mh"><div><div class="mti">Sell Investment</div><div class="mds" id="invSellSubtitle">Reduce position</div></div><button class="mx" onclick="invCloseSellModal()"><i data-lucide="x" width="14" height="14"></i></button></div><form onsubmit="invProcessSell(event)"><div class="fr"><div class="fg"><label class="fl">Amount</label><input class="fi" id="invSellAmt" type="number" step="0.01" min="0.01" required></div><div class="fg"><label class="fl">Units</label><input class="fi" id="invSellQty" type="number" step="0.0001" min="0.0001" value="1"></div></div><div class="fg"><label class="fl">Notes</label><input class="fi" id="invSellNotes"></div><input type="hidden" id="invSellId"><div class="ma"><button type="button" class="btn bs" onclick="invCloseSellModal()">Cancel</button><button type="submit" class="btn bd">Confirm Sell</button></div></form></div></div>' +
  '<div class="mo" id="invWLModal"><div class="ml" style="max-width:520px;max-height:80vh;overflow:hidden;display:flex;flex-direction:column"><div class="mh"><div><div class="mti" id="invWLModalTitle">Add to Watchlist</div><div class="mds">Search for any stock, crypto, commodity, forex, or index</div></div><button class="mx" onclick="invCloseWLModal()"><i data-lucide="x" width="14" height="14"></i></button></div><div style="padding:0 24px 12px"><div class="sb2" style="width:100%"><i data-lucide="search" width="14" height="14"></i><input id="invWLSearch" placeholder="Search symbol or name (e.g. AAPL, Bitcoin, Gold)" oninput="invSearchSymbol(this.value)" autocomplete="off" style="font-size:13px"></div></div><div id="invWLResults" style="flex:1;overflow-y:auto;padding:0 24px 16px;max-height:400px"></div></div></div>';

  lucide.createIcons();
  setTimeout(function() { invRenderPerfChart('value', '1y'); invRenderAllocChart(); invLoadTVWidget(); }, 80);
}

function getCurrencySymbol() { return (typeof CURRENCY_SYMBOL !== 'undefined') ? CURRENCY_SYMBOL : 'RM'; }

// === HOLDINGS RENDER ===
function renderHoldings() {
  if (INVESTMENTS.length === 0) return '<div class="es"><p>No investments yet. Add your first investment above.</p></div>';
  var sorted = getInvestmentsByPerformance();
  return sorted.map(function(inv) {
    var isExpanded = invExpandedId === inv.id;
    var pnl = inv.pnl;
    var ret = inv.returnPct;
    var isGain = pnl >= 0;
    var html = '<div class="inv-hold-card ' + (isExpanded ? 'expanded' : '') + '" onclick="invToggleExpand(\'' + inv.id + '\')">' +
      '<div class="inv-hold-row">' +
        '<div class="inv-hold-name"><div class="inv-hold-title">' + inv.name + '</div><div class="inv-hold-type">' + inv.type + '</div></div>' +
        '<div class="inv-hold-val">' + fmt(inv.currentValue) + '</div>' +
        '<div class="inv-hold-pnl ' + (isGain ? 'pos' : 'neg') + '">' + (isGain ? '+' : '') + fmt(pnl) + '</div>' +
        '<div class="inv-hold-ret ' + (isGain ? 'pos' : 'neg') + '">' + (isGain ? '+' : '') + ret.toFixed(1) + '%</div>' +
        '<div class="inv-hold-chevron"><i data-lucide="' + (isExpanded ? 'chevron-up' : 'chevron-down') + '" width="16" height="16"></i></div>' +
      '</div>';
    if (isExpanded) {
      html += '<div class="inv-hold-detail" onclick="event.stopPropagation()">' +
        (inv.txnLink ? '<div style="margin-bottom:10px"><span class="tb s" style="font-size:10px">⛓ Synced from Savings: ' + inv.txnLink.category + (inv.txnLink.subcategory ? ' → ' + inv.txnLink.subcategory : '') + '</span></div>' : '') +
        '<div class="inv-detail-grid">' +
          '<div class="inv-detail-item"><span class="inv-detail-label">Purchase Date</span><span class="inv-detail-value">' + (inv.purchaseDate || 'N/A') + '</span></div>' +
          '<div class="inv-detail-item"><span class="inv-detail-label">Total Deposit</span><span class="inv-detail-value">' + fmt(inv.costBasis) + '</span></div>' +
          '<div class="inv-detail-item"><span class="inv-detail-label">Current Value</span><span class="inv-detail-value">' + fmt(inv.currentValue) + '</span></div>' +
          '<div class="inv-detail-item"><span class="inv-detail-label">Profit / Loss</span><span class="inv-detail-value ' + (isGain ? 'pos' : 'neg') + '">' + (isGain ? '+' : '') + fmt(pnl) + '</span></div>' +
          '<div class="inv-detail-item"><span class="inv-detail-label">Return</span><span class="inv-detail-value ' + (isGain ? 'pos' : 'neg') + '">' + (isGain ? '+' : '') + ret.toFixed(2) + '%</span></div>' +
          (inv.notes ? '<div class="inv-detail-item full"><span class="inv-detail-label">Notes</span><span class="inv-detail-value">' + inv.notes + '</span></div>' : '') +
        '</div></div>';
    }
    html += '</div>';
    return html;
  }).join('');
}

// === PORTFOLIO BREAKDOWN TABLE ===
function renderPortfolioBreakdown() {
  var alloc = getAssetAllocation();
  var colors = ['#6366f1','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899','#14b8a6','#f97316','#8b5cf6','#84cc16','#0ea5e9','#d946ef','#64748b'];
  if (alloc.length === 0) return '<div class="es"><p>No allocations yet</p></div>';
  // Calculate invested per type
  var investedByType = {};
  INVESTMENTS.forEach(function(inv) { if (!investedByType[inv.type]) investedByType[inv.type] = 0; investedByType[inv.type] += inv.costBasis; });
  return '<div class="inv-breakdown-tbl">' +
    '<div class="inv-bk-hdr"><span>Asset Type</span><span style="text-align:right">Invested</span><span style="text-align:right">Value</span><span style="text-align:right">P&L</span><span style="text-align:right">Alloc</span></div>' +
    alloc.map(function(a, i) {
      var invested = investedByType[a.type] || 0;
      var pnl = a.value - invested;
      var isGain = pnl >= 0;
      return '<div class="inv-bk-row"><div class="inv-bk-type"><div class="inv-alloc-dot" style="background:' + colors[i % colors.length] + '"></div><span>' + a.type + '</span></div><span class="inv-bk-num">' + fmt(invested) + '</span><span class="inv-bk-num">' + fmt(a.value) + '</span><span class="inv-bk-num ' + (isGain ? 'pos' : 'neg') + '">' + (isGain ? '+' : '') + fmt(pnl) + '</span><span class="inv-bk-num">' + a.pct.toFixed(1) + '%</span></div>';
    }).join('') +
  '</div>';
}

// === ACTIVITIES RENDER ===
function renderActivities() {
  if (INV_ACTIVITIES.length === 0) return '<div class="es"><p>No recent activities</p></div>';
  var sorted = INV_ACTIVITIES.slice().sort(function(a, b) { return new Date(b.date) - new Date(a.date); }).slice(0, 8);
  var icons = { buy: 'arrow-down-circle', sell: 'arrow-up-circle', dividend: 'coins', add: 'plus-circle' };
  var labels = { buy: 'Bought', sell: 'Sold', dividend: 'Dividend', add: 'Added' };
  var cls = { buy: 'act-buy', sell: 'act-sell', dividend: 'act-div', add: 'act-add' };
  return sorted.map(function(a) {
    return '<div class="inv-act-row"><div class="inv-act-icon ' + (cls[a.action] || '') + '"><i data-lucide="' + (icons[a.action] || 'circle') + '" width="16" height="16"></i></div><div class="inv-act-info"><div class="inv-act-title">' + (labels[a.action] || a.action) + ' ' + a.investmentName + '</div><div class="inv-act-date">' + (typeof fmtD === 'function' ? fmtD(a.date) : a.date) + (a.notes ? ' · ' + a.notes : '') + '</div></div><div class="inv-act-amt ' + (a.action === 'sell' ? 'neg' : '') + '">' + (a.action === 'sell' ? '-' : '+') + fmt(a.amount) + '</div></div>';
  }).join('');
}

// === WATCHLIST RENDER (TradingView widget + inline remove) ===
function renderWatchlist() {
  if (INV_WATCHLIST.length === 0) return '<div class="es"><p>No items in watchlist. Add investments to monitor.</p></div>';
  return '<div class="inv-wl-wrap"><div class="inv-wl-sidebar"><div class="inv-wl-sidebar-title">Symbols</div>' +
    INV_WATCHLIST.map(function(w) {
      return '<div class="inv-wl-item"><span class="inv-wl-item-sym">' + w.symbol.split(':').pop() + '</span><button class="inv-wl-item-rm" onclick="invDeleteWL(\'' + w.id + '\')" title="Remove">×</button></div>';
    }).join('') +
    '</div><div class="inv-wl-widget"><div id="tradingview-widget-container" style="width:100%;height:100%"></div></div></div>';
}

function invLoadTVWidget() {
  var container = document.getElementById('tradingview-widget-container');
  if (!container || INV_WATCHLIST.length === 0) return;
  var isDark = document.documentElement.dataset.theme === 'dark';
  var symbols = INV_WATCHLIST.map(function(w) { return w.symbol; });
  // Use TradingView Market Overview Widget
  container.innerHTML = '';
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js';
  script.async = true;
  script.textContent = JSON.stringify({
    width: '100%',
    height: Math.min(80 + symbols.length * 52, 500),
    symbolsGroups: [{ name: 'Watchlist', symbols: symbols.map(function(s) { return { name: s, displayName: INV_WATCHLIST.find(function(w){return w.symbol===s;})?.name || s }; }) }],
    showSymbolLogo: true,
    isTransparent: true,
    colorTheme: isDark ? 'dark' : 'light',
    locale: 'en',
    largeChartUrl: ''
  });
  container.appendChild(script);
}

// === CHARTS ===
var invCurrentMetric = 'value';
var invCurrentTime = '1y';

function invSwitchMetric(metric) {
  invCurrentMetric = metric;
  document.querySelectorAll('.inv-metric-seg button').forEach(function(b) { b.classList.remove('active'); });
  if (event && event.target) event.target.classList.add('active');
  invRenderPerfChart(metric, invCurrentTime);
}

function invSwitchTime(time) {
  invCurrentTime = time;
  document.querySelectorAll('.inv-time-seg button').forEach(function(b) { b.classList.remove('active'); });
  if (event && event.target) event.target.classList.add('active');
  invRenderPerfChart(invCurrentMetric, time);
}

function invRenderPerfChart(metric, timeRange) {
  var canvas = document.getElementById('invPerfChart');
  if (!canvas) return;
  if (invPerfChart) { invPerfChart.destroy(); invPerfChart = null; }
  var snaps = getPortfolioSnapshots();
  var filtered = snaps.slice();
  var now = new Date();
  if (timeRange === '1m') { var cut = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()); filtered = snaps.filter(function(s) { return new Date(s.date) >= cut; }); }
  else if (timeRange === '3m') { var cut = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()); filtered = snaps.filter(function(s) { return new Date(s.date) >= cut; }); }
  else if (timeRange === '6m') { var cut = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()); filtered = snaps.filter(function(s) { return new Date(s.date) >= cut; }); }
  else if (timeRange === '1y') { var cut = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()); filtered = snaps.filter(function(s) { return new Date(s.date) >= cut; }); }
  if (filtered.length < 2) filtered = snaps.slice(-6);
  var labels = filtered.map(function(s) { var d = new Date(s.date); return d.toLocaleDateString('en', { month: 'short', year: '2-digit' }); });
  var data, label, borderColor, bgColor;
  if (metric === 'value') { data = filtered.map(function(s) { return s.value; }); label = 'Portfolio Value'; borderColor = '#6366f1'; bgColor = 'rgba(99,102,241,0.1)'; }
  else { data = filtered.map(function(s) { return s.value - s.invested; }); label = 'Profit / Loss'; borderColor = data[data.length - 1] >= 0 ? '#10b981' : '#ef4444'; bgColor = data[data.length - 1] >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'; }
  var tc = document.documentElement.dataset.theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
  var gc = document.documentElement.dataset.theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  invPerfChart = new Chart(canvas, { type: 'line', data: { labels: labels, datasets: [{ label: label, data: data, borderColor: borderColor, backgroundColor: bgColor, fill: true, tension: 0.4, pointRadius: 3, pointHoverRadius: 6, borderWidth: 2 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: tc, font: { size: 10 } } }, y: { grid: { color: gc }, ticks: { color: tc, font: { size: 10 }, callback: function(v) { return fmt(v); } } } }, interaction: { intersect: false, mode: 'index' } } });
}

function invRenderAllocChart() {
  var canvas = document.getElementById('invAllocChart');
  if (!canvas) return;
  if (invAllocChart) { invAllocChart.destroy(); invAllocChart = null; }
  var alloc = getAssetAllocation();
  var colors = ['#6366f1','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899','#14b8a6','#f97316','#8b5cf6','#84cc16','#0ea5e9','#d946ef','#64748b'];
  var tc = document.documentElement.dataset.theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';
  invAllocChart = new Chart(canvas, { type: 'doughnut', data: { labels: alloc.map(function(a) { return a.type; }), datasets: [{ data: alloc.map(function(a) { return a.value; }), backgroundColor: colors.slice(0, alloc.length), borderWidth: 2, borderColor: document.documentElement.dataset.theme === 'dark' ? '#2a2a3e' : '#fff' }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { color: tc, font: { size: 10 }, padding: 12, usePointStyle: true, pointStyle: 'circle' } } } } });
}

// === EXPAND/COLLAPSE ===
function invToggleExpand(id) {
  invExpandedId = invExpandedId === id ? null : id;
  var container = document.getElementById('invHoldings');
  if (container) { container.innerHTML = renderHoldings(); lucide.createIcons(); }
}

// === CRUD MODALS ===
function invShowAddModal() {
  document.getElementById('invModalTitle').textContent = 'Add Investment';
  document.getElementById('invSubmitBtn').textContent = 'Add Investment';
  document.getElementById('invForm').reset();
  document.getElementById('invEditId').value = '';
  document.getElementById('invQty').value = '1';
  document.getElementById('invDiv').value = '0';
  document.getElementById('invTxnLink').value = '';
  document.getElementById('invCost').disabled = false;
  document.getElementById('invModal').classList.add('show');
  lucide.createIcons();
}
function invCloseModal() { document.getElementById('invModal').classList.remove('show'); }

function invOnLinkChange() {
  var val = document.getElementById('invTxnLink').value;
  var costField = document.getElementById('invCost');
  if (val) {
    costField.disabled = true;
    costField.value = '';
    costField.placeholder = 'Auto from TXN';
  } else {
    costField.disabled = false;
    costField.placeholder = '';
  }
}

function invEditHolding(id) {
  var inv = INVESTMENTS.find(function(i) { return i.id === id; });
  if (!inv) return;
  document.getElementById('invModalTitle').textContent = 'Edit Investment';
  document.getElementById('invSubmitBtn').textContent = 'Save Changes';
  document.getElementById('invEditId').value = id;
  document.getElementById('invName').value = inv.name;
  document.getElementById('invType').value = inv.type;
  document.getElementById('invTxnLink').value = txnLinkToValue(inv.txnLink);
  var isLinked = !!inv.txnLink;
  document.getElementById('invCost').disabled = isLinked;
  document.getElementById('invCost').value = isLinked ? '' : (inv.costBasis || '');
  if (isLinked) document.getElementById('invCost').placeholder = 'Auto from TXN';
  else document.getElementById('invCost').placeholder = '';
  document.getElementById('invValue').value = inv.currentValue || '';
  document.getElementById('invQty').value = inv.quantity || 1;
  document.getElementById('invDate').value = inv.purchaseDate || '';
  document.getElementById('invAvgCost').value = inv.avgCost || '';
  document.getElementById('invUnitPrice').value = inv.unitPrice || '';
  document.getElementById('invDiv').value = inv.dividendReceived || 0;
  document.getElementById('invNotes').value = inv.notes || '';
  document.getElementById('invModal').classList.add('show');
  lucide.createIcons();
}

function invSaveHolding(e) {
  e.preventDefault();
  var editId = document.getElementById('invEditId').value;
  var name = document.getElementById('invName').value.trim();
  var type = document.getElementById('invType').value;
  var txnLinkVal = document.getElementById('invTxnLink').value;
  var txnLink = parseTxnLinkValue(txnLinkVal);
  var costBasis = parseFloat(document.getElementById('invCost').value) || 0;
  var currentValue = parseFloat(document.getElementById('invValue').value) || 0;
  var quantity = parseFloat(document.getElementById('invQty').value) || 1;
  var purchaseDate = document.getElementById('invDate').value;
  var avgCost = parseFloat(document.getElementById('invAvgCost').value) || (quantity > 0 ? costBasis / quantity : 0);
  var unitPrice = parseFloat(document.getElementById('invUnitPrice').value) || (quantity > 0 ? currentValue / quantity : 0);
  var dividendReceived = parseFloat(document.getElementById('invDiv').value) || 0;
  var notes = document.getElementById('invNotes').value.trim();
  if (editId) {
    var idx = INVESTMENTS.findIndex(function(i) { return i.id === editId; });
    if (idx >= 0) INVESTMENTS[idx] = Object.assign({}, INVESTMENTS[idx], { name:name, type:type, txnLink:txnLink, costBasis:costBasis, currentValue:currentValue, quantity:quantity, purchaseDate:purchaseDate, avgCost:avgCost, unitPrice:unitPrice, dividendReceived:dividendReceived, notes:notes });
  } else {
    var newInv = { id: 'inv_' + (invNxId++), name:name, type:type, txnLink:txnLink, costBasis:costBasis, currentValue:currentValue, quantity:quantity, purchaseDate:purchaseDate, avgCost:avgCost, unitPrice:unitPrice, dividendReceived:dividendReceived, notes:notes, createdAt: new Date().toISOString().split('T')[0] };
    INVESTMENTS.push(newInv);
    INV_ACTIVITIES.unshift({ id: 'act_' + (invActNxId++), date: new Date().toISOString().split('T')[0], action: 'add', investmentId: newInv.id, investmentName: name, amount: costBasis, notes: 'Added investment' });
    saveINV_ACT();
  }
  saveINV();
  syncInvestmentsFromTXN();
  invCloseModal();
  invRefreshPage();
  toast(editId ? 'Investment updated' : 'Investment added');
}

function invDeleteHolding(id) {
  var inv = INVESTMENTS.find(function(i) { return i.id === id; });
  if (!inv) return;
  if (!confirm('Delete "' + inv.name + '" from portfolio?')) return;
  INVESTMENTS = INVESTMENTS.filter(function(i) { return i.id !== id; });
  saveINV();
  invExpandedId = null;
  invRefreshPage();
  toast('Investment deleted');
}

// === BUY MORE ===
function invShowBuyModal(id) {
  var inv = INVESTMENTS.find(function(i) { return i.id === id; });
  if (!inv) return;
  document.getElementById('invBuySubtitle').textContent = 'Add to ' + inv.name;
  document.getElementById('invBuyId').value = id;
  document.getElementById('invBuyAmt').value = '';
  document.getElementById('invBuyQty').value = '1';
  document.getElementById('invBuyNotes').value = '';
  document.getElementById('invBuyModal').classList.add('show');
  lucide.createIcons();
}
function invCloseBuyModal() { document.getElementById('invBuyModal').classList.remove('show'); }

function invProcessBuy(e) {
  e.preventDefault();
  var id = document.getElementById('invBuyId').value;
  var amount = parseFloat(document.getElementById('invBuyAmt').value) || 0;
  var qty = parseFloat(document.getElementById('invBuyQty').value) || 1;
  var notes = document.getElementById('invBuyNotes').value.trim();
  var inv = INVESTMENTS.find(function(i) { return i.id === id; });
  if (!inv || amount <= 0) return;
  inv.costBasis += amount;
  inv.currentValue += amount;
  inv.quantity += qty;
  inv.avgCost = inv.quantity > 0 ? inv.costBasis / inv.quantity : inv.costBasis;
  inv.unitPrice = inv.quantity > 0 ? inv.currentValue / inv.quantity : inv.currentValue;
  saveINV();
  INV_ACTIVITIES.unshift({ id: 'act_' + (invActNxId++), date: new Date().toISOString().split('T')[0], action: 'buy', investmentId: id, investmentName: inv.name, amount: amount, notes: notes });
  saveINV_ACT();
  invCloseBuyModal();
  invRefreshPage();
  toast('Bought more ' + inv.name);
}

// === SELL ===
function invShowSellModal(id) {
  var inv = INVESTMENTS.find(function(i) { return i.id === id; });
  if (!inv) return;
  document.getElementById('invSellSubtitle').textContent = 'Sell from ' + inv.name;
  document.getElementById('invSellId').value = id;
  document.getElementById('invSellAmt').value = '';
  document.getElementById('invSellQty').value = '1';
  document.getElementById('invSellNotes').value = '';
  document.getElementById('invSellModal').classList.add('show');
  lucide.createIcons();
}
function invCloseSellModal() { document.getElementById('invSellModal').classList.remove('show'); }

function invProcessSell(e) {
  e.preventDefault();
  var id = document.getElementById('invSellId').value;
  var amount = parseFloat(document.getElementById('invSellAmt').value) || 0;
  var qty = parseFloat(document.getElementById('invSellQty').value) || 1;
  var notes = document.getElementById('invSellNotes').value.trim();
  var inv = INVESTMENTS.find(function(i) { return i.id === id; });
  if (!inv || amount <= 0) return;
  var costRatio = inv.currentValue > 0 ? inv.costBasis / inv.currentValue : 1;
  inv.currentValue = Math.max(0, inv.currentValue - amount);
  inv.costBasis = Math.max(0, inv.costBasis - (amount * costRatio));
  inv.quantity = Math.max(0, inv.quantity - qty);
  if (inv.quantity > 0) { inv.avgCost = inv.costBasis / inv.quantity; inv.unitPrice = inv.currentValue / inv.quantity; }
  saveINV();
  INV_ACTIVITIES.unshift({ id: 'act_' + (invActNxId++), date: new Date().toISOString().split('T')[0], action: 'sell', investmentId: id, investmentName: inv.name, amount: amount, notes: notes });
  saveINV_ACT();
  invCloseSellModal();
  invRefreshPage();
  toast('Sold ' + inv.name);
}

// === WATCHLIST CRUD (search-based, like TradingView) ===
var invWLSearchTimer = null;

function invShowWLModal() {
  document.getElementById('invWLModal').classList.add('show');
  document.getElementById('invWLResults').innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-tertiary);font-size:12px">Type to search stocks, crypto, commodities, forex, indices, futures...</div>';
  setTimeout(function() { var inp = document.getElementById('invWLSearch'); if (inp) { inp.value = ''; inp.focus(); } }, 100);
  lucide.createIcons();
}
function invCloseWLModal() { document.getElementById('invWLModal').classList.remove('show'); }

function invSearchSymbol(query) {
  if (invWLSearchTimer) clearTimeout(invWLSearchTimer);
  var results = document.getElementById('invWLResults');
  if (!query || query.length < 1) { results.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-tertiary);font-size:12px">Type to search...</div>'; return; }
  results.innerHTML = '<div style="padding:12px;text-align:center;color:var(--text-tertiary);font-size:11px">Searching...</div>';
  invWLSearchTimer = setTimeout(function() {
    // Local dictionary for instruments Yahoo doesn't index well
    var localDB = [
      // Futures - Commodities
      { symbol:'MYX:FCPO1!', shortname:'Crude Palm Oil Futures (FCPO)', exchange:'Bursa Malaysia', typeDisp:'Futures' },
      { symbol:'CME:CPO1!', shortname:'Malaysian Crude Palm Oil (CME)', exchange:'CME', typeDisp:'Futures' },
      { symbol:'COMEX:GC1!', shortname:'Gold Futures', exchange:'COMEX', typeDisp:'Futures' },
      { symbol:'COMEX:SI1!', shortname:'Silver Futures', exchange:'COMEX', typeDisp:'Futures' },
      { symbol:'NYMEX:CL1!', shortname:'Crude Oil WTI Futures', exchange:'NYMEX', typeDisp:'Futures' },
      { symbol:'NYMEX:BB1!', shortname:'Brent Crude Oil Futures', exchange:'ICE', typeDisp:'Futures' },
      { symbol:'NYMEX:NG1!', shortname:'Natural Gas Futures', exchange:'NYMEX', typeDisp:'Futures' },
      { symbol:'COMEX:HG1!', shortname:'Copper Futures', exchange:'COMEX', typeDisp:'Futures' },
      { symbol:'NYMEX:PL1!', shortname:'Platinum Futures', exchange:'NYMEX', typeDisp:'Futures' },
      { symbol:'NYMEX:PA1!', shortname:'Palladium Futures', exchange:'NYMEX', typeDisp:'Futures' },
      { symbol:'CBOT:ZC1!', shortname:'Corn Futures', exchange:'CBOT', typeDisp:'Futures' },
      { symbol:'CBOT:ZS1!', shortname:'Soybean Futures', exchange:'CBOT', typeDisp:'Futures' },
      { symbol:'CBOT:ZW1!', shortname:'Wheat Futures', exchange:'CBOT', typeDisp:'Futures' },
      { symbol:'ICEUS:KC1!', shortname:'Coffee Futures', exchange:'ICE', typeDisp:'Futures' },
      { symbol:'ICEUS:CT1!', shortname:'Cotton Futures', exchange:'ICE', typeDisp:'Futures' },
      { symbol:'ICEUS:SB1!', shortname:'Sugar Futures', exchange:'ICE', typeDisp:'Futures' },
      { symbol:'ICEUS:CC1!', shortname:'Cocoa Futures', exchange:'ICE', typeDisp:'Futures' },
      // Futures - Index
      { symbol:'CME:ES1!', shortname:'S&P 500 E-mini Futures', exchange:'CME', typeDisp:'Futures' },
      { symbol:'CME:NQ1!', shortname:'NASDAQ 100 E-mini Futures', exchange:'CME', typeDisp:'Futures' },
      { symbol:'CBOT:YM1!', shortname:'Dow Jones E-mini Futures', exchange:'CBOT', typeDisp:'Futures' },
      { symbol:'CME:RTY1!', shortname:'Russell 2000 E-mini Futures', exchange:'CME', typeDisp:'Futures' },
      { symbol:'CME:NKD1!', shortname:'Nikkei 225 Futures', exchange:'CME', typeDisp:'Futures' },
      // Indices (TradingView format)
      { symbol:'SP:SPX', shortname:'S&P 500', exchange:'SNP', typeDisp:'Index' },
      { symbol:'DJ:DJI', shortname:'Dow Jones Industrial Average', exchange:'DJI', typeDisp:'Index' },
      { symbol:'NASDAQ:IXIC', shortname:'NASDAQ Composite', exchange:'NASDAQ', typeDisp:'Index' },
      { symbol:'MYX:FBMKLCI', shortname:'FTSE Bursa Malaysia KLCI', exchange:'Bursa Malaysia', typeDisp:'Index' },
      { symbol:'TVC:RUT', shortname:'Russell 2000', exchange:'NYSE', typeDisp:'Index' },
      { symbol:'FTSE:UKX', shortname:'FTSE 100 (UK)', exchange:'LSE', typeDisp:'Index' },
      { symbol:'TVC:NI225', shortname:'Nikkei 225 (Japan)', exchange:'TSE', typeDisp:'Index' },
      { symbol:'HSI:HSI', shortname:'Hang Seng Index (HK)', exchange:'HKSE', typeDisp:'Index' },
      { symbol:'SGX:STI', shortname:'Straits Times Index (Singapore)', exchange:'SGX', typeDisp:'Index' },
      { symbol:'EUREX:SX5E1!', shortname:'EURO STOXX 50', exchange:'Eurex', typeDisp:'Index' },
      { symbol:'ASX:XJO', shortname:'ASX 200 (Australia)', exchange:'ASX', typeDisp:'Index' },
      { symbol:'KRX:KOSPI', shortname:'KOSPI (Korea)', exchange:'KRX', typeDisp:'Index' },
      { symbol:'TWSE:TAIEX', shortname:'Taiwan Weighted Index', exchange:'TWSE', typeDisp:'Index' },
      { symbol:'IDX:COMPOSITE', shortname:'Jakarta Composite (Indonesia)', exchange:'IDX', typeDisp:'Index' },
      // Crypto (TradingView format)
      { symbol:'BITSTAMP:BTCUSD', shortname:'Bitcoin USD', exchange:'Crypto', typeDisp:'Crypto' },
      { symbol:'BITSTAMP:ETHUSD', shortname:'Ethereum USD', exchange:'Crypto', typeDisp:'Crypto' },
      { symbol:'BINANCE:SOLUSD', shortname:'Solana USD', exchange:'Crypto', typeDisp:'Crypto' },
      { symbol:'BINANCE:BNBUSD', shortname:'BNB USD', exchange:'Crypto', typeDisp:'Crypto' },
      { symbol:'BITSTAMP:XRPUSD', shortname:'XRP USD', exchange:'Crypto', typeDisp:'Crypto' },
      { symbol:'BINANCE:ADAUSD', shortname:'Cardano USD', exchange:'Crypto', typeDisp:'Crypto' },
      { symbol:'BINANCE:DOGEUSD', shortname:'Dogecoin USD', exchange:'Crypto', typeDisp:'Crypto' },
      { symbol:'BINANCE:DOTUSD', shortname:'Polkadot USD', exchange:'Crypto', typeDisp:'Crypto' },
      { symbol:'BINANCE:AVAXUSD', shortname:'Avalanche USD', exchange:'Crypto', typeDisp:'Crypto' },
      { symbol:'BINANCE:LINKUSD', shortname:'Chainlink USD', exchange:'Crypto', typeDisp:'Crypto' },
      // Forex (TradingView format)
      { symbol:'FX:EURUSD', shortname:'EUR/USD', exchange:'Forex', typeDisp:'Forex' },
      { symbol:'FX:GBPUSD', shortname:'GBP/USD', exchange:'Forex', typeDisp:'Forex' },
      { symbol:'FX:USDJPY', shortname:'USD/JPY', exchange:'Forex', typeDisp:'Forex' },
      { symbol:'FX_IDC:USDMYR', shortname:'USD/MYR', exchange:'Forex', typeDisp:'Forex' },
      { symbol:'FX_IDC:USDSGD', shortname:'USD/SGD', exchange:'Forex', typeDisp:'Forex' },
      { symbol:'FX_IDC:SGDMYR', shortname:'SGD/MYR', exchange:'Forex', typeDisp:'Forex' },
      { symbol:'FX:AUDUSD', shortname:'AUD/USD', exchange:'Forex', typeDisp:'Forex' },
      { symbol:'FX:USDCAD', shortname:'USD/CAD', exchange:'Forex', typeDisp:'Forex' },
      { symbol:'FX:USDCHF', shortname:'USD/CHF', exchange:'Forex', typeDisp:'Forex' },
      { symbol:'FX:NZDUSD', shortname:'NZD/USD', exchange:'Forex', typeDisp:'Forex' },
      { symbol:'FX_IDC:USDIDR', shortname:'USD/IDR', exchange:'Forex', typeDisp:'Forex' },
      { symbol:'FX:USDCNH', shortname:'USD/CNH', exchange:'Forex', typeDisp:'Forex' },
      { symbol:'FX_IDC:USDINR', shortname:'USD/INR', exchange:'Forex', typeDisp:'Forex' },
      // Popular Stocks (TradingView format)
      { symbol:'NASDAQ:AAPL', shortname:'Apple Inc.', exchange:'NASDAQ', typeDisp:'Equity' },
      { symbol:'NASDAQ:MSFT', shortname:'Microsoft Corp.', exchange:'NASDAQ', typeDisp:'Equity' },
      { symbol:'NASDAQ:GOOGL', shortname:'Alphabet (Google)', exchange:'NASDAQ', typeDisp:'Equity' },
      { symbol:'NASDAQ:AMZN', shortname:'Amazon.com Inc.', exchange:'NASDAQ', typeDisp:'Equity' },
      { symbol:'NASDAQ:TSLA', shortname:'Tesla Inc.', exchange:'NASDAQ', typeDisp:'Equity' },
      { symbol:'NASDAQ:NVDA', shortname:'NVIDIA Corp.', exchange:'NASDAQ', typeDisp:'Equity' },
      { symbol:'NASDAQ:META', shortname:'Meta Platforms', exchange:'NASDAQ', typeDisp:'Equity' },
      { symbol:'NYSE:SPUS', shortname:'SP Funds S&P 500 Sharia ETF', exchange:'NYSE', typeDisp:'ETF' },
      // Malaysia Stocks
      { symbol:'MYX:1155', shortname:'Maybank', exchange:'Bursa Malaysia', typeDisp:'Equity' },
      { symbol:'MYX:1295', shortname:'Public Bank', exchange:'Bursa Malaysia', typeDisp:'Equity' },
      { symbol:'MYX:1023', shortname:'CIMB Group', exchange:'Bursa Malaysia', typeDisp:'Equity' },
      { symbol:'MYX:5347', shortname:'Tenaga Nasional', exchange:'Bursa Malaysia', typeDisp:'Equity' },
      { symbol:'MYX:5183', shortname:'Petronas Chemicals', exchange:'Bursa Malaysia', typeDisp:'Equity' },
      { symbol:'MYX:4863', shortname:'Telekom Malaysia', exchange:'Bursa Malaysia', typeDisp:'Equity' },
      // Singapore Stocks
      { symbol:'SGX:D05', shortname:'DBS Group', exchange:'SGX', typeDisp:'Equity' },
      { symbol:'SGX:O39', shortname:'OCBC Bank', exchange:'SGX', typeDisp:'Equity' },
      { symbol:'SGX:U11', shortname:'UOB', exchange:'SGX', typeDisp:'Equity' }
    ];
    var q = query.toLowerCase();
    var localMatches = localDB.filter(function(item) {
      return item.symbol.toLowerCase().includes(q) || item.shortname.toLowerCase().includes(q);
    });

    var url = 'https://corsproxy.io/?' + encodeURIComponent('https://query1.finance.yahoo.com/v1/finance/search?q=' + encodeURIComponent(query) + '&quotesCount=12&newsCount=0&enableFuzzyQuery=true');
    fetch(url)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        var quotes = (data && data.quotes) || [];
        // Merge local matches first, then API results (deduplicate)
        var allResults = localMatches.map(function(l) { return { symbol: l.symbol, shortname: l.shortname, exchDisp: l.exchange, typeDisp: l.typeDisp }; });
        quotes.forEach(function(qq) { if (!allResults.some(function(r) { return r.symbol === qq.symbol; })) allResults.push(qq); });
        if (!allResults.length) { results.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-tertiary);font-size:12px">No results for "' + query + '"</div>'; return; }
        results.innerHTML = allResults.slice(0, 15).map(function(qq) {
          var typeLabel = qq.typeDisp || qq.quoteType || '';
          var exchange = qq.exchDisp || qq.exchange || '';
          var alreadyAdded = INV_WATCHLIST.some(function(w) { return w.symbol === qq.symbol; });
          var nameText = qq.shortname || qq.longname || qq.symbol;
          return '<div class="inv-wl-sr' + (alreadyAdded ? ' added' : '') + '" onclick="' + (alreadyAdded ? '' : "invAddFromSearch('" + qq.symbol + "','" + nameText.replace(/'/g, "\\'") + "','" + exchange + "','" + typeLabel + "')") + '">' +
            '<div class="inv-wl-sr-left"><div class="inv-wl-sr-sym">' + qq.symbol + '</div><div class="inv-wl-sr-name">' + nameText + '</div></div>' +
            '<div class="inv-wl-sr-right"><span class="inv-wl-sr-exch">' + exchange + '</span>' + (alreadyAdded ? '<span class="inv-wl-sr-badge">Added</span>' : '<span class="inv-wl-sr-type">' + typeLabel + '</span>') + '</div>' +
          '</div>';
        }).join('');
      })
      .catch(function() {
        // If API fails, still show local matches
        if (localMatches.length) {
          results.innerHTML = localMatches.map(function(l) {
            var alreadyAdded = INV_WATCHLIST.some(function(w) { return w.symbol === l.symbol; });
            return '<div class="inv-wl-sr' + (alreadyAdded ? ' added' : '') + '" onclick="' + (alreadyAdded ? '' : "invAddFromSearch('" + l.symbol + "','" + l.shortname.replace(/'/g, "\\'") + "','" + l.exchange + "','" + l.typeDisp + "')") + '">' +
              '<div class="inv-wl-sr-left"><div class="inv-wl-sr-sym">' + l.symbol + '</div><div class="inv-wl-sr-name">' + l.shortname + '</div></div>' +
              '<div class="inv-wl-sr-right"><span class="inv-wl-sr-exch">' + l.exchange + '</span>' + (alreadyAdded ? '<span class="inv-wl-sr-badge">Added</span>' : '<span class="inv-wl-sr-type">' + l.typeDisp + '</span>') + '</div>' +
            '</div>';
          }).join('');
        } else {
          results.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-tertiary);font-size:12px">Search unavailable. Check internet connection.</div>';
        }
      });
  }, 300);
}

function invAddFromSearch(symbol, name, exchange, type) {
  if (INV_WATCHLIST.some(function(w) { return w.symbol === symbol; })) { toast('Already in watchlist'); return; }
  INV_WATCHLIST.push({ id: 'wl_' + (invWlNxId++), name: name, symbol: symbol, exchange: exchange, type: type, addedAt: new Date().toISOString().split('T')[0] });
  saveINV_WL();
  toast('Added ' + symbol);
  // Re-render search to show "Added"
  var searchInput = document.getElementById('invWLSearch');
  if (searchInput && searchInput.value) invSearchSymbol(searchInput.value);
  // Reload TradingView widget
  invUpdateWLDisplay();
  invLoadTVWidget();
}

function invFetchSinglePrice(symbol) {
  var url = 'https://corsproxy.io/?' + encodeURIComponent('https://query1.finance.yahoo.com/v7/finance/quote?symbols=' + encodeURIComponent(symbol) + '&fields=regularMarketPrice,regularMarketChangePercent,currency,shortName');
  fetch(url)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var results = data && data.quoteResponse && data.quoteResponse.result;
      if (!results || !results.length) return;
      var q = results[0];
      var w = INV_WATCHLIST.find(function(item) { return item.symbol === symbol; });
      if (w && q.regularMarketPrice) {
        w.latestPrice = q.regularMarketPrice;
        w.currency = q.currency || '';
        w.dailyChange = parseFloat((q.regularMarketChangePercent || 0).toFixed(2));
        w.lastUpdated = new Date().toLocaleTimeString('en-MY', { hour12: false, hour: '2-digit', minute: '2-digit' });
        if (q.shortName) w.name = q.shortName;
        saveINV_WL();
        invUpdateWLDisplay();
      }
    }).catch(function() {});
}

function invDeleteWL(id) {
  if (!confirm('Remove from watchlist?')) return;
  INV_WATCHLIST = INV_WATCHLIST.filter(function(w) { return w.id !== id; });
  saveINV_WL();
  invRefreshPage();
  toast('Removed from watchlist');
}

// === LIVE MARKET DATA (delayed ~15min via free APIs) ===
function invFetchWatchlistPrices() {
  // Collect crypto symbols
  var cryptoMap = { 'BTC':'bitcoin','ETH':'ethereum','SOL':'solana','BNB':'binancecoin','XRP':'ripple','DOGE':'dogecoin','ADA':'cardano','DOT':'polkadot','MATIC':'matic-network','AVAX':'avalanche-2','LINK':'chainlink','UNI':'uniswap','ATOM':'cosmos','LTC':'litecoin' };
  var cryptoItems = INV_WATCHLIST.filter(function(w) { return w.symbol && cryptoMap[w.symbol.toUpperCase()]; });
  var stockItems = INV_WATCHLIST.filter(function(w) { return w.symbol && !cryptoMap[w.symbol.toUpperCase()]; });

  // Fetch crypto via CoinGecko (batch)
  if (cryptoItems.length > 0) {
    var ids = cryptoItems.map(function(w) { return cryptoMap[w.symbol.toUpperCase()]; }).join(',');
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=' + ids + '&vs_currencies=usd&include_24hr_change=true')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        var updated = false;
        cryptoItems.forEach(function(w) {
          var coinId = cryptoMap[w.symbol.toUpperCase()];
          var coin = data[coinId];
          if (coin) {
            w.name = w.symbol.toUpperCase();
            w.latestPrice = coin.usd;
            w.currency = 'USD';
            w.dailyChange = parseFloat((coin.usd_24h_change || 0).toFixed(2));
            w.lastUpdated = new Date().toLocaleTimeString('en-MY', { hour12: false, hour: '2-digit', minute: '2-digit' }) + ' (live)';
            updated = true;
          }
        });
        if (updated) { saveINV_WL(); invUpdateWLDisplay(); }
      }).catch(function() {});
  }

  // Fetch stocks/commodities/forex via Yahoo Finance (proxied for CORS)
  if (stockItems.length > 0) {
    var symbols = stockItems.map(function(w) { return w.symbol; }).join(',');
    var url = 'https://corsproxy.io/?' + encodeURIComponent('https://query1.finance.yahoo.com/v7/finance/quote?symbols=' + encodeURIComponent(symbols) + '&fields=regularMarketPrice,regularMarketChangePercent,currency,shortName');
    fetch(url)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        var results = data && data.quoteResponse && data.quoteResponse.result;
        if (!results) return;
        var updated = false;
        results.forEach(function(q) {
          var w = INV_WATCHLIST.find(function(item) { return item.symbol.toUpperCase() === q.symbol.toUpperCase(); });
          if (w && q.regularMarketPrice) {
            w.name = q.shortName || q.symbol;
            w.latestPrice = q.regularMarketPrice;
            w.currency = q.currency || 'USD';
            w.dailyChange = parseFloat((q.regularMarketChangePercent || 0).toFixed(2));
            w.lastUpdated = new Date().toLocaleTimeString('en-MY', { hour12: false, hour: '2-digit', minute: '2-digit' }) + ' (delayed)';
            updated = true;
          }
        });
        if (updated) { saveINV_WL(); invUpdateWLDisplay(); }
      }).catch(function() {});
  }
}

function invUpdateWLDisplay() {
  var wlEl = document.getElementById('invWatchlist');
  if (wlEl) { wlEl.innerHTML = renderWatchlist(); lucide.createIcons(); }
}

// Auto-refresh watchlist prices on page load
function invAutoRefreshPrices() {
  if (typeof fetch !== 'undefined') invFetchWatchlistPrices();
}

// === REFRESH ===
function invRefreshPage() {
  var c = document.getElementById('cnt');
  if (c && curPage === 'investments') { renderInvestments(c); }
}

// Modal close on outside click
document.addEventListener('click', function(e) {
  if (e.target.id === 'invModal') invCloseModal();
  if (e.target.id === 'invBuyModal') invCloseBuyModal();
  if (e.target.id === 'invSellModal') invCloseSellModal();
  if (e.target.id === 'invWLModal') invCloseWLModal();
});
