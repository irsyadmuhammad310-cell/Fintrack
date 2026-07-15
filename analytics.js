// === ANALYTICS V14.0 - Financial Intelligence Center ===
var anCharts = [];

function anDestroy() { anCharts.forEach(function(ch) { if (ch) ch.destroy(); }); anCharts = []; }

function renderAnalytics(c) {
  anDestroy();
  var year = getSelectedYear();
  var month = document.getElementById('mf') ? document.getElementById('mf').value : 'total';
  var MD = computeMonthlyData(year);
  var am = MD.filter(function(m) { return m.i > 0 || m.e > 0 || m.s > 0; });
  if (!am.length) am = MD;
  var ti = MD.reduce(function(s,m){return s+m.i;},0);
  var te = MD.reduce(function(s,m){return s+m.e;},0);
  var ts = MD.reduce(function(s,m){return s+m.s;},0);
  var net = ti - te - ts;
  var nw = typeof getNetWorth === 'function' ? getNetWorth() : 0;
  var savRate = ti > 0 ? (ts / ti * 100).toFixed(1) : '0.0';

  var html = '<div class="an-page">';

  // 1. Financial Overview KPIs
  html += '<div class="an-section"><div class="an-sec-title">Financial Overview</div><div class="kg" style="grid-template-columns:repeat(auto-fit,minmax(130px,1fr))">' +
    '<div class="kc em"><div class="kc-left"><div class="kc-hdr"><div class="ki"><i data-lucide="trending-up" width="13" height="13"></i></div><div class="kl">Income</div></div><div class="kv">' + fmt(ti) + '</div></div></div>' +
    '<div class="kc rs"><div class="kc-left"><div class="kc-hdr"><div class="ki"><i data-lucide="trending-down" width="13" height="13"></i></div><div class="kl">Expenses</div></div><div class="kv">' + fmt(te) + '</div></div></div>' +
    '<div class="kc bl"><div class="kc-left"><div class="kc-hdr"><div class="ki"><i data-lucide="piggy-bank" width="13" height="13"></i></div><div class="kl">Savings</div></div><div class="kv">' + fmt(ts) + '</div></div></div>' +
    '<div class="kc ' + (net>=0?'gn':'rs') + '"><div class="kc-left"><div class="kc-hdr"><div class="ki"><i data-lucide="activity" width="13" height="13"></i></div><div class="kl">Cash Flow</div></div><div class="kv">' + fmt(net) + '</div></div></div>' +
    '<div class="kc gd"><div class="kc-left"><div class="kc-hdr"><div class="ki"><i data-lucide="landmark" width="13" height="13"></i></div><div class="kl">Net Worth</div></div><div class="kv">' + fmt(nw) + '</div></div></div>' +
    '<div class="kc pk"><div class="kc-left"><div class="kc-hdr"><div class="ki"><i data-lucide="percent" width="13" height="13"></i></div><div class="kl">Savings Rate</div></div><div class="kv">' + savRate + '%</div></div></div>' +
  '</div></div>';

  // 2. Income & Expense Analysis (side by side)
  html += '<div class="an-section"><div class="an-grid-2"><div class="cc"><div class="ct">Income vs Expense Trend</div><div class="cs">Monthly comparison for ' + year + '</div><div style="height:200px"><canvas id="anIncExp"></canvas></div></div><div class="cc"><div class="ct">Expense by Category</div><div class="cs">Where your money goes</div><div style="height:200px"><canvas id="anExpCat"></canvas></div></div></div></div>';

  // 3. Savings & Cash Flow
  html += '<div class="an-section"><div class="an-grid-2"><div class="cc"><div class="ct">Savings Rate Trend</div><div class="cs">Monthly savings as % of income</div><div style="height:200px"><canvas id="anSavRate"></canvas></div></div><div class="cc"><div class="ct">Cash Flow Analysis</div><div class="cs">Net monthly surplus/deficit</div><div style="height:200px"><canvas id="anCashFlow"></canvas></div></div></div></div>';

  // 4. Budget Analysis
  html += '<div class="an-section"><div class="cc"><div class="ct">Budget vs Actual</div><div class="cs">Category spending performance</div><div style="height:220px"><canvas id="anBudget"></canvas></div></div></div>';

  // 5. Goal & Investment Analysis
  html += '<div class="an-section"><div class="an-grid-2">';
  // Goals
  if (typeof GOALS !== 'undefined' && GOALS.length) {
    var totalGoalSaved = GOALS.reduce(function(s,g){return s+g.c;},0);
    var totalGoalTarget = GOALS.reduce(function(s,g){return s+g.t;},0);
    var goalPct = totalGoalTarget > 0 ? (totalGoalSaved/totalGoalTarget*100).toFixed(0) : 0;
    html += '<div class="cc"><div class="ct">Goal Progress</div><div class="cs">' + GOALS.length + ' goals tracked</div><div class="an-goal-stats"><div class="an-goal-big">' + goalPct + '%</div><div class="an-goal-bar"><div class="an-goal-fill" style="width:' + goalPct + '%;background:var(--accent)"></div></div><div class="an-goal-meta"><span>Saved: ' + fmt(totalGoalSaved) + '</span><span>Target: ' + fmt(totalGoalTarget) + '</span></div></div></div>';
  } else {
    html += '<div class="cc"><div class="ct">Goal Progress</div><div class="cs">No goals set</div><div class="es" style="padding:30px"><p>Create goals in the Goals tab</p></div></div>';
  }
  // Investment
  if (typeof INVESTMENTS !== 'undefined' && INVESTMENTS.length) {
    var pv = getPortfolioValue();
    var invTi = getTotalInvested();
    var pnl = pv - invTi;
    var ret = invTi > 0 ? (pnl/invTi*100).toFixed(1) : '0';
    html += '<div class="cc"><div class="ct">Investment Performance</div><div class="cs">Portfolio returns</div><div class="an-inv-stats"><div class="an-inv-row"><span>Portfolio Value</span><span style="font-weight:700">' + fmt(pv) + '</span></div><div class="an-inv-row"><span>Total Deposit</span><span>' + fmt(invTi) + '</span></div><div class="an-inv-row"><span>Profit / Loss</span><span style="color:' + (pnl>=0?'var(--emerald)':'var(--rose)') + ';font-weight:700">' + (pnl>=0?'+':'') + fmt(pnl) + '</span></div><div class="an-inv-row"><span>Return</span><span style="color:' + (pnl>=0?'var(--emerald)':'var(--rose)') + ';font-weight:700">' + (pnl>=0?'+':'') + ret + '%</span></div></div></div>';
  } else {
    html += '<div class="cc"><div class="ct">Investment Performance</div><div class="cs">No investments</div><div class="es" style="padding:30px"><p>Add investments in the Investment tab</p></div></div>';
  }
  html += '</div></div>';

  // 6. Net Worth Trend
  html += '<div class="an-section"><div class="cc"><div class="ct">Net Worth Trend</div><div class="cs">Monthly financial position for ' + year + '</div><div style="height:180px"><canvas id="anNetWorth"></canvas></div></div></div>';

  // 7. Financial Health Score
  var healthScore = anCalcHealthScore(ti, te, ts, net, year);
  var healthColor = healthScore >= 80 ? 'var(--emerald)' : healthScore >= 65 ? 'var(--gold)' : healthScore >= 50 ? 'var(--amber)' : 'var(--rose)';
  var healthLabel = healthScore >= 95 ? 'Excellent' : healthScore >= 80 ? 'Very Good' : healthScore >= 65 ? 'Good' : healthScore >= 50 ? 'Fair' : 'Needs Improvement';
  html += '<div class="an-section"><div class="cc"><div class="ct">Financial Health Score</div><div class="cs">Based on savings, budget discipline, cash flow, goals & investments</div><div class="an-health"><div class="an-health-score" style="color:' + healthColor + '">' + healthScore + '</div><div class="an-health-label" style="color:' + healthColor + '">' + healthLabel + '</div><div class="an-health-bar"><div class="an-health-fill" style="width:' + healthScore + '%;background:' + healthColor + '"></div></div>' + anHealthBreakdown(ti, te, ts, net, year) + '</div></div></div>';

  // 8. AI Insights (Top 5)
  html += '<div class="an-section"><div class="cc"><div class="ct">AI Financial Insights</div><div class="cs">Top actionable observations</div><div class="an-insights">' + anGetInsights(ti, te, ts, net, year, MD) + '</div></div></div>';

  html += '</div>';
  c.innerHTML = html;
  lucide.createIcons();

  // Render charts
  setTimeout(function() { anRenderCharts(year, MD, am); }, 60);
}

// === CHART RENDERING ===
function anRenderCharts(year, MD, am) {
  var tc = document.documentElement.dataset.theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
  var gc = document.documentElement.dataset.theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  var labels = am.map(function(m){return m.m;});

  // Income vs Expense
  var el1 = document.getElementById('anIncExp');
  if (el1 && labels.length) anCharts.push(new Chart(el1, { type:'bar', data:{ labels:labels, datasets:[{ label:'Income', data:am.map(function(m){return m.i;}), backgroundColor:'rgba(16,185,129,0.7)', borderRadius:4 },{ label:'Expenses', data:am.map(function(m){return m.e;}), backgroundColor:'rgba(244,63,94,0.7)', borderRadius:4 },{ label:'Savings', data:am.map(function(m){return m.s;}), backgroundColor:'rgba(99,102,241,0.5)', borderRadius:4 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ color:tc, usePointStyle:true, font:{size:9} } } }, scales:{ x:{grid:{display:false},ticks:{color:tc,font:{size:9}}}, y:{grid:{color:gc},ticks:{color:tc,font:{size:9}}} } } }));

  // Expense by Category (doughnut)
  var EC = computeExpenseCategories(year);
  var el2 = document.getElementById('anExpCat');
  var catColors = ['#ef4444','#f59e0b','#6366f1','#10b981','#06b6d4','#ec4899','#14b8a6','#f97316','#8b5cf6'];
  if (el2 && EC.length) anCharts.push(new Chart(el2, { type:'doughnut', data:{ labels:EC.map(function(c){return c.n;}), datasets:[{ data:EC.map(function(c){return c.a;}), backgroundColor:catColors.slice(0,EC.length), borderWidth:2, borderColor:document.documentElement.dataset.theme==='dark'?'#2a2a3e':'#fff' }] }, options:{ responsive:true, maintainAspectRatio:false, cutout:'55%', plugins:{ legend:{ position:'right', labels:{ color:tc, font:{size:9}, padding:8, usePointStyle:true, pointStyle:'circle' } } } } }));
  else if (el2) el2.parentElement.innerHTML = '<div class="es" style="padding:30px"><p>No expense data yet</p></div>';

  // Savings Rate
  var el3 = document.getElementById('anSavRate');
  if (el3) anCharts.push(new Chart(el3, { type:'line', data:{ labels:labels, datasets:[{ data:am.map(function(m){return m.i>0?(m.s/m.i*100).toFixed(1):0;}), borderColor:'#6366f1', backgroundColor:'rgba(99,102,241,0.1)', fill:true, tension:.4, pointRadius:3, borderWidth:2 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:false} }, scales:{ x:{grid:{display:false},ticks:{color:tc,font:{size:9}}}, y:{grid:{color:gc},ticks:{color:tc,font:{size:9},callback:function(v){return v+'%';}}} } } }));

  // Cash Flow
  var el4 = document.getElementById('anCashFlow');
  var cfData = am.map(function(m){return m.i - m.e - m.s;});
  if (el4) anCharts.push(new Chart(el4, { type:'bar', data:{ labels:labels, datasets:[{ data:cfData, backgroundColor:cfData.map(function(v){return v>=0?'rgba(16,185,129,0.7)':'rgba(244,63,94,0.7)';}), borderRadius:4 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:false} }, scales:{ x:{grid:{display:false},ticks:{color:tc,font:{size:9}}}, y:{grid:{color:gc},ticks:{color:tc,font:{size:9}}} } } }));

  // Budget vs Actual
  var el5 = document.getElementById('anBudget');
  if (el5 && EC.length) anCharts.push(new Chart(el5, { type:'bar', data:{ labels:EC.map(function(c){return c.n;}), datasets:[{ label:'Actual', data:EC.map(function(c){return c.a;}), backgroundColor:'rgba(244,63,94,0.7)', borderRadius:4 },{ label:'Budget', data:EC.map(function(c){return c.b;}), backgroundColor:'rgba(99,102,241,0.25)', borderRadius:4 }] }, options:{ responsive:true, maintainAspectRatio:false, indexAxis:'y', plugins:{ legend:{ position:'bottom', labels:{color:tc,font:{size:9}} } }, scales:{ x:{grid:{color:gc},ticks:{color:tc,font:{size:9}}}, y:{grid:{display:false},ticks:{color:tc,font:{size:9}}} } } }));
  else if (el5) el5.parentElement.innerHTML = '<div class="es" style="padding:30px"><p>No budget data yet. Set budgets in Goals tab.</p></div>';

  // Net Worth Trend
  var el6 = document.getElementById('anNetWorth');
  if (el6) {
    var nwSeries = typeof computeBalanceSeries === 'function' ? computeBalanceSeries(year) : [];
    anCharts.push(new Chart(el6, { type:'line', data:{ labels:MONTH_NAMES, datasets:[{ label:'Net Worth', data:nwSeries, borderColor:'#6366f1', backgroundColor:'rgba(99,102,241,0.08)', fill:true, tension:.4, pointRadius:2, borderWidth:2 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:false} }, scales:{ x:{grid:{display:false},ticks:{color:tc,font:{size:9}}}, y:{grid:{color:gc},ticks:{color:tc,font:{size:9},callback:function(v){return fmt(v);}}} } } }));
  }
}

// === FINANCIAL HEALTH SCORE ===
function anCalcHealthScore(inc, exp, sav, net, year) {
  var score = 0;
  // Savings Rate (0-25 pts): 20%+ = 25, 10-20% = 15, 5-10% = 10, <5% = 5
  var savRate = inc > 0 ? sav / inc * 100 : 0;
  if (savRate >= 20) score += 25; else if (savRate >= 10) score += 18; else if (savRate >= 5) score += 10; else score += 3;
  // Budget Discipline (0-25 pts): under budget = 25, within 10% = 18, over = 8
  var budget = getYearlyBudgetTotal(year);
  var budgetUsage = budget > 0 ? exp / budget : 1;
  if (budgetUsage <= 0.9) score += 25; else if (budgetUsage <= 1.0) score += 20; else if (budgetUsage <= 1.1) score += 12; else score += 5;
  // Positive Cash Flow (0-20 pts)
  if (net > 0) score += 20; else if (net >= -500) score += 10; else score += 3;
  // Goal Progress (0-15 pts)
  if (typeof GOALS !== 'undefined' && GOALS.length) {
    var goalPct = GOALS.reduce(function(s,g){return s+g.c;},0) / Math.max(1, GOALS.reduce(function(s,g){return s+g.t;},0)) * 100;
    if (goalPct >= 70) score += 15; else if (goalPct >= 40) score += 10; else score += 4;
  } else { score += 8; }
  // Investment Growth (0-15 pts)
  if (typeof INVESTMENTS !== 'undefined' && INVESTMENTS.length) {
    var pnl = getPortfolioValue() - getTotalInvested();
    if (pnl > 0) score += 15; else if (pnl >= -500) score += 8; else score += 3;
  } else { score += 7; }
  return Math.min(100, Math.max(0, score));
}

function anHealthBreakdown(inc, exp, sav, net, year) {
  var savRate = inc > 0 ? sav / inc * 100 : 0;
  var budget = getYearlyBudgetTotal(year);
  var budgetUsage = budget > 0 ? (exp / budget * 100).toFixed(0) : 0;
  var items = [
    { label:'Savings Rate', value:savRate.toFixed(1)+'%', good:savRate>=10 },
    { label:'Budget Usage', value:budgetUsage+'%', good:parseFloat(budgetUsage)<=100 },
    { label:'Cash Flow', value:net>=0?'Positive':'Negative', good:net>=0 }
  ];
  if (typeof GOALS !== 'undefined' && GOALS.length) {
    var gp = (GOALS.reduce(function(s,g){return s+g.c;},0) / Math.max(1,GOALS.reduce(function(s,g){return s+g.t;},0)) * 100).toFixed(0);
    items.push({ label:'Goal Progress', value:gp+'%', good:parseFloat(gp)>=40 });
  }
  if (typeof INVESTMENTS !== 'undefined' && INVESTMENTS.length) {
    var pnl = getPortfolioValue() - getTotalInvested();
    items.push({ label:'Investment', value:pnl>=0?'Profit':'Loss', good:pnl>=0 });
  }
  return '<div class="an-health-breakdown">' + items.map(function(it) {
    return '<div class="an-hb-item"><span class="an-hb-icon">' + (it.good?'✓':'⚠') + '</span><span class="an-hb-label">' + it.label + '</span><span class="an-hb-val ' + (it.good?'good':'warn') + '">' + it.value + '</span></div>';
  }).join('') + '</div>';
}

// === AI INSIGHTS ===
function anGetInsights(inc, exp, sav, net, year, MD) {
  var insights = [];
  var savRate = inc > 0 ? (sav / inc * 100) : 0;
  // Savings insight
  if (savRate >= 15) insights.push({ icon:'✓', text:'Savings rate is ' + savRate.toFixed(1) + '% — above recommended 10% target.', type:'good' });
  else if (savRate < 5 && inc > 0) insights.push({ icon:'⚠', text:'Savings rate is only ' + savRate.toFixed(1) + '%. Aim for at least 10%.', type:'warn' });
  // Budget insight
  var budget = getYearlyBudgetTotal(year);
  if (budget > 0 && exp > budget) insights.push({ icon:'⚠', text:'Total expenses exceeded annual budget by ' + fmt(exp - budget) + '.', type:'warn' });
  else if (budget > 0 && exp <= budget * 0.8) insights.push({ icon:'✓', text:'Spending is well under budget — only ' + (exp/budget*100).toFixed(0) + '% used.', type:'good' });
  // Cash flow
  if (net > 0) insights.push({ icon:'✓', text:'Positive cash flow of ' + fmt(net) + ' this period.', type:'good' });
  else if (net < 0) insights.push({ icon:'⚠', text:'Negative cash flow of ' + fmt(Math.abs(net)) + '. Spending exceeds income + savings.', type:'warn' });
  // Top expense
  var EC = computeExpenseCategories(year);
  if (EC.length) insights.push({ icon:'ℹ', text:'Largest expense category: ' + EC[0].n + ' at ' + fmt(EC[0].a) + '.', type:'info' });
  // Investment
  if (typeof INVESTMENTS !== 'undefined' && INVESTMENTS.length) {
    var pnl = getPortfolioValue() - getTotalInvested();
    if (pnl > 0) insights.push({ icon:'✓', text:'Investment portfolio is up ' + fmt(pnl) + ' overall.', type:'good' });
    else if (pnl < 0) insights.push({ icon:'⚠', text:'Investment portfolio is down ' + fmt(Math.abs(pnl)) + '.', type:'warn' });
  }
  // Net worth
  insights.push({ icon:'ℹ', text:'Current net worth: ' + fmt(typeof getNetWorth === 'function' ? getNetWorth() : 0) + '.', type:'info' });

  return insights.slice(0, 5).map(function(ins) {
    var cls = ins.type === 'good' ? 'an-ins-good' : ins.type === 'warn' ? 'an-ins-warn' : 'an-ins-info';
    return '<div class="an-insight ' + cls + '"><span class="an-ins-icon">' + ins.icon + '</span><span>' + ins.text + '</span></div>';
  }).join('');
}