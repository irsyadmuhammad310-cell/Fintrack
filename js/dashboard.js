// === DASHBOARD (V2.0.0) ===
// V2.0.5: keep track of Home charts and destroy old ones on every re-render (no memory build-up)
var dashCharts = [];
function dashDestroy() { dashCharts.forEach(function(ch) { try { if (ch) ch.destroy(); } catch (e) {} }); dashCharts = []; }
function dashChart(ctx, cfg) { var ch = new Chart(ctx, cfg); dashCharts.push(ch); return ch; }
function renderDashboard(c) {
  dashDestroy();
  const year = getSelectedYear();

  // v15.8.1: Mobile gets stripped-down dashboard (unless user forced desktop view)
  const forceDesktop = safeGet('ft_desktop_mode') === 'true';
  if (window.innerWidth <= 900 && !forceDesktop) {
    renderMobileDashboard(c, year);
    return;
  }

  if (!yearHasData(year)) {
    c.innerHTML = `<div class="es" style="padding:100px 20px"><div style="font-size:40px;margin-bottom:16px">📊</div><div style="font-size:16px;font-weight:600;color:var(--text-primary);margin-bottom:8px">${t('dash_no_data')} ${year}.</div><p>${t('dash_select_year')} ${year}.</p></div>`;
    return;
  }
  const yearData = computeMonthlyData(year);
  const EC = computeExpenseCategories(year);
  const mf = document.getElementById('mf').value;
  let ti, te, ts;
  if (mf === 'total') {
    ti = yearData.reduce((s, m) => s + m.i, 0);
    te = yearData.reduce((s, m) => s + m.e, 0);
    ts = yearData.reduce((s, m) => s + m.s, 0);
  } else {
    ti = yearData[+mf].i;
    te = yearData[+mf].e;
    ts = yearData[+mf].s;
  }
  const nw = getNetWorth(), cf = ti - te;
  const bal = getCarryForwardBalance(year, mf);
  const ffm = getFinancialFreedomMonths(year, mf);
  const budgetTotal = getYearlyBudgetTotal(year);
  // Use selected month's budget when a month is selected
  const periodBudget = mf !== 'total' ? getMonthlyBudget(year, +mf) : budgetTotal;
  const bl = periodBudget - te;
  const savRate = ti > 0 ? (ts / ti * 100).toFixed(0) : 0;

  // Pre-compute sparkline series
  const balSpark = computeBalanceSeries(year);
  // V2.0.4: one net-worth rule (data.js): own-account transfers = 0, debt = amount still owed at month end
  const nwSpark = Array.from({ length: 12 }, (_, i) => getNetWorthByPeriod(year, String(i)));
  const series = {
    networth: nwSpark,
    balance: balSpark,
    income: yearData.map(m => m.i),
    expense: yearData.map(m => m.e),
    savings: yearData.map(m => m.s),
    cashflow: yearData.map(m => m.i - m.e)
  };

  function buildSparkSeries() {
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    if (mf === 'total') {
      return { labels: monthNames, networth: yearData.map((m, i) => getNetWorthByPeriod(year, String(i))), balance: balSpark, income: yearData.map(m => m.i), expense: yearData.map(m => m.e), savings: yearData.map(m => m.s), cashflow: yearData.map(m => m.i - m.e) };
    }
    const mi = +mf, daysInMonth = new Date(year, mi + 1, 0).getDate();
    const lbls = [], iArr = [], eArr = [], sArr = [], cfArr = [], nwArr = [], balArr = [];
    let cI = 0, cE = 0, cS = 0;
    // V2.0.5: daily series start from the real opening point, so the last day matches the KPI cards
    const monthNet = (yearData[mi].i || 0) - (yearData[mi].e || 0);
    const nwEnd = Number(getNetWorthByPeriod(year, String(mi))) || 0;
    const nwStart = nwEnd - monthNet;
    const balStart = (Number(bal) || 0) - monthNet;
    for (let d = 1; d <= daysInMonth; d++) {
      lbls.push(d + ' ' + monthNames[mi]);
      const ds = `${year}-${String(mi + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dt = TXN.filter(t => t.d === ds);
      cI += dt.filter(t => t.t === 'Income').reduce((a, t) => a + t.a, 0);
      cE += dt.filter(t => t.t === 'Expense').reduce((a, t) => a + t.a, 0);
      cS = cI - cE; // V2.0.5: savings = income - expense
      iArr.push(cI); eArr.push(cE); sArr.push(cS);
      cfArr.push(cI - cE); nwArr.push(nwStart + cI - cE); balArr.push(balStart + cI - cE);
    }
    return { labels: lbls, networth: nwArr, balance: balArr, income: iArr, expense: eArr, savings: sArr, cashflow: cfArr };
  }

  function calcTrend(fullSeries, isExpense) {
    const arr = mf === 'total' ? fullSeries : (() => { const idx = +mf; return idx > 0 ? [fullSeries[idx - 1], fullSeries[idx]] : [0, fullSeries[idx]]; })();
    const pts = arr.filter(v => v !== 0);
    if (pts.length < 2) return { pos: null, pct: 0, label: t('dash_no_change'), noData: true };
    const curr = pts[pts.length - 1], prev = pts[pts.length - 2];
    const change = curr - prev;
    const pct = prev !== 0 ? Math.abs(change / prev * 100).toFixed(0) : 0;
    const pos = isExpense ? change <= 0 : change >= 0;
    const arrow = change > 0 ? '▲' : change < 0 ? '▼' : '';
    return { pos, pct, label: `${arrow} ${pct}%`, noData: false };
  }

  const nwTrend = calcTrend(series.networth, false);
  const banks = getBANKS();
  const totalAssets = banks.reduce((s, b) => s + b.balance, 0);

  // === 5 KPI Cards ===
  const cards = [
    { l: t('dash_income'), v: fmt(ti), cl: 'gn', ic: 'arrow-down-left', s: series.income, exp: false },
    { l: t('dash_expense'), v: fmt(te), cl: 'rs', ic: 'arrow-up-right', s: series.expense, exp: true },
    { l: t('dash_savings'), v: fmt(ts), cl: 'pk', ic: 'piggy-bank', s: series.savings, exp: false },
    { l: t('dash_balance'), v: fmt(bal), cl: bal >= 0 ? 'bl' : 'rs', ic: 'wallet', s: series.balance, exp: false },
    { l: t('dash_cashflow'), v: fmt(cf), cl: cf >= 0 ? 'em' : 'rs', ic: 'trending-up', s: series.cashflow, exp: false }
  ];

  // === Expense Categories for Doughnut ===
  const expCats = computeExpenseCategoriesByPeriod(year, mf);

  // === Overspent Alert (Desktop) ===
  const dashOverspent = getDashboardOverspentCats();
  let overspentBannerHtml = '';
  if (dashOverspent.length > 0) {
    const overspentMonthLabel = dashOverspent[0] ? MONTH_NAMES[dashOverspent[0].month] + ' ' + dashOverspent[0].year : '';
    overspentBannerHtml = `<div class="dash-overspent-banner"><div class="dash-overspent-header"><div class="dash-overspent-title"><i data-lucide="alert-triangle" width="14" height="14" style="color:var(--rose)"></i> <span>${dashOverspent.length} categor${dashOverspent.length > 1 ? 'ies' : 'y'} over budget</span></div><span style="font-size:10px;color:var(--text-tertiary)">${overspentMonthLabel}</span></div><div class="dash-overspent-items">${dashOverspent.map(item => `<div class="dash-overspent-item"><span class="dash-overspent-emoji">${item.emoji}</span><span class="dash-overspent-cat">${ftEsc(item.cat)}</span><span class="dash-overspent-over">-${fmt(item.over)} over</span><button class="btn bp dash-overspent-btn" data-cover-cat="${ftEsc(item.cat)}" data-cover-over="${item.over}" data-cover-year="${item.year}" data-cover-month="${item.month}"><i data-lucide="arrow-right-left" width="11" height="11"></i> Cover</button></div>`).join('')}</div></div>`;
  }

  // === BUILD HTML ===
  c.innerHTML = `<div class="kg" style="margin-bottom:14px"><div class="kc em" data-nw-morph onclick="if(typeof ftMorphNav==='function')ftMorphNav('accounts', this);else navigate('accounts')" style="cursor:pointer" title="Open Accounts"><div class="kc-left"><div class="kc-hdr"><div class="ki"><i data-lucide="landmark" width="13" height="13"></i></div><div class="kl">${t('dash_net_worth')}</div></div><div class="kv">${fmt(nw)}</div><div class="kt ${nwTrend.noData ? 'neutral' : (nwTrend.pos ? 'pos' : 'neg')}"><span class="kt-chg">${nwTrend.label}</span></div></div><div class="kc-spark"><canvas id="heroSpark" height="36"></canvas></div></div>${cards.map((k, i) => { const tr = calcTrend(k.s, k.exp); return `<div class="kc ${k.cl}"><div class="kc-left"><div class="kc-hdr"><div class="ki"><i data-lucide="${k.ic}" width="13" height="13"></i></div><div class="kl">${k.l}</div></div><div class="kv">${k.v}</div><div class="kt ${tr.noData ? 'neutral' : (tr.pos ? 'pos' : 'neg')}"><span class="kt-chg">${tr.label}</span></div></div><div class="kc-spark"><canvas id="sp${i}" height="36"></canvas></div></div>`; }).join('')}</div>
${overspentBannerHtml}
${safeBuildForecastHtml('desktop')}
<div class="ib" style="margin-bottom:14px">${generateDashInsights(yearData, EC, ti, te, ts, nw, cf, year, mf)}</div>
<div style="display:grid;grid-template-columns:1.6fr 1fr;gap:14px;margin-bottom:14px"><div class="cc"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><div><div class="ct">${t('dash_income_expense_savings')}</div><div class="cs">${t('dash_monthly_trend')}</div></div><div class="seg" id="dc1tog"><button class="bm active" data-ct="line">${t('misc_line')}</button><button class="bm" data-ct="bar">${t('misc_bar')}</button></div></div><div style="height:240px"><canvas id="dc1"></canvas></div></div><div class="cc"><div class="ct">${t('dash_expense_breakdown')}</div><div class="cs">${t('dash_by_category')}</div><div id="expDoughnutWrap" style="height:240px;display:flex;align-items:center;justify-content:center">${expCats.length ? '<canvas id="expDoughnut"></canvas>' : '<div style="color:var(--text-tertiary);font-size:12px">' + t('misc_no_data') + '</div>'}</div></div></div>
<div style="display:grid;grid-template-columns:1.4fr 1fr;gap:14px"><div class="cc"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><div><div class="ct">${t('dash_budget_vs_cf')}</div><div class="cs">${mf === 'total' ? t('hdr_total_year') : MONTH_NAMES[+mf] + ' ' + year}</div></div></div><div style="height:220px"><canvas id="bchart"></canvas></div></div><div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:14px 16px;overflow:hidden"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><div style="font-size:13px;font-weight:700">${t('dash_bank_accounts')}</div><div class="ft-amt" style="font-size:11px;font-weight:700;color:var(--emerald);font-feature-settings:'tnum'">${fmt(totalAssets)}</div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">${banks.map(b => `<div class="bank-card" style="padding:8px 10px"><div class="bank-top" style="margin-bottom:3px"><div class="bank-badge ${b.cls}" style="width:22px;height:22px;font-size:7px;border-radius:5px">${b.tag}</div><div class="bank-info"><div class="bank-name" style="font-size:10px">${ftEsc(b.name)}</div></div></div><div class="bank-balance ft-amt" style="font-size:12px">${fmt(b.balance)}</div></div>`).join('')}</div></div></div>`;
  lucide.createIcons();
  setTimeout(() => {
    const dk = document.documentElement.dataset.theme === 'dark';
    const gc = dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const tc = dk ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
    const mns = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const spSeries = buildSparkSeries();

    // Hero sparkline (Net Worth)
    const heroCtx = document.getElementById('heroSpark')?.getContext('2d');
    if (heroCtx) {
      const heroData = spSeries.networth || [];
      const heroGrad = heroCtx.createLinearGradient(0, 0, 0, 36);
      heroGrad.addColorStop(0, 'rgba(16,185,129,0.25)'); heroGrad.addColorStop(1, 'rgba(0,0,0,0)');
      dashChart(heroCtx, { type: 'line', data: { labels: spSeries.labels, datasets: [{ data: heroData, borderColor: '#10b981', borderWidth: 1.8, tension: .4, pointRadius: 0, pointHoverRadius: 4, pointHoverBackgroundColor: '#10b981', pointHoverBorderColor: dk ? '#1e1e2e' : '#fff', pointHoverBorderWidth: 2, fill: true, backgroundColor: heroGrad }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: true, mode: 'index', intersect: false, callbacks: { title: ctx => String(spSeries.labels[ctx[0].dataIndex]), label: c2 => fmt(c2.raw) }, bodyFont: { size: 10 }, titleFont: { size: 9, weight: '600' }, padding: 6, displayColors: false, backgroundColor: dk ? 'rgba(30,30,46,0.95)' : 'rgba(255,255,255,0.95)', titleColor: dk ? '#e0e0e0' : '#333', bodyColor: dk ? '#b0b0b0' : '#555', borderColor: dk ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', borderWidth: 1, cornerRadius: 6 } }, scales: { x: { display: false }, y: { display: false } }, animation: { duration: 300, easing: 'easeOutQuart' }, interaction: { mode: 'index', intersect: false }, onHover: (evt, elements, chart) => { chart.data.datasets[0].borderWidth = elements.length ? 2.8 : 1.8; chart.update('none'); } } });
    }

    // KPI sparklines
    const sparkColors = ['#10b981', '#f43f5e', '#3b82f6', '#6366f1', '#10b981'];
    const sparkBgColors = ['rgba(16,185,129,0.25)', 'rgba(244,63,94,0.25)', 'rgba(59,130,246,0.25)', 'rgba(99,102,241,0.25)', 'rgba(16,185,129,0.25)'];
    const sparkKeys = ['income', 'expense', 'savings', 'balance', 'cashflow'];
    cards.forEach((k, i) => {
      const sparkData = spSeries[sparkKeys[i]] || [];
      if (!sparkData.length) return;
      const col = sparkColors[i]; const bgCol = sparkBgColors[i];
      const spCtx = document.getElementById('sp' + i)?.getContext('2d');
      if (!spCtx) return;
      const grad = spCtx.createLinearGradient(0, 0, 0, 36);
      grad.addColorStop(0, bgCol); grad.addColorStop(1, 'rgba(0,0,0,0)');
      dashChart(spCtx, { type: 'line', data: { labels: spSeries.labels, datasets: [{ data: sparkData, borderColor: col, borderWidth: 1.8, tension: .4, pointRadius: 0, pointHoverRadius: 4, pointHoverBackgroundColor: col, pointHoverBorderColor: dk ? '#1e1e2e' : '#fff', pointHoverBorderWidth: 2, fill: true, backgroundColor: grad }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: true, mode: 'index', intersect: false, callbacks: { title: ctx => String(spSeries.labels[ctx[0].dataIndex]), label: c2 => fmt(c2.raw) }, bodyFont: { size: 10 }, titleFont: { size: 9, weight: '600' }, padding: 6, displayColors: false, backgroundColor: dk ? 'rgba(30,30,46,0.95)' : 'rgba(255,255,255,0.95)', titleColor: dk ? '#e0e0e0' : '#333', bodyColor: dk ? '#b0b0b0' : '#555', borderColor: dk ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', borderWidth: 1, cornerRadius: 6, caretSize: 4 } }, scales: { x: { display: false }, y: { display: false } }, animation: { duration: 300, easing: 'easeOutQuart' }, interaction: { mode: 'index', intersect: false }, onHover: (evt, elements, chart) => { chart.data.datasets[0].borderWidth = elements.length ? 2.8 : 1.8; chart.update('none'); } } });
    });

    // Main trend chart
    const savLine = yearData.map(m => m.s);
    let mainChart = null;
    function drawMainChart(chartType) {
      if (mainChart) mainChart.destroy();
      const isFill = chartType === 'line';
      mainChart = dashChart(document.getElementById('dc1'), { type: chartType, data: { labels: mns, datasets: [{ label: 'Income', data: yearData.map(m => m.i), borderColor: '#10b981', backgroundColor: chartType === 'bar' ? 'rgba(16,185,129,0.75)' : 'rgba(16,185,129,0.08)', fill: isFill, tension: .4, pointRadius: chartType === 'bar' ? 0 : 3, borderWidth: chartType === 'bar' ? 0 : 2.5, borderRadius: chartType === 'bar' ? 6 : 0 }, { label: 'Expense', data: yearData.map(m => m.e), borderColor: '#f43f5e', backgroundColor: chartType === 'bar' ? 'rgba(244,63,94,0.75)' : 'rgba(244,63,94,0.08)', fill: isFill, tension: .4, pointRadius: chartType === 'bar' ? 0 : 3, borderWidth: chartType === 'bar' ? 0 : 2.5, borderRadius: chartType === 'bar' ? 6 : 0 }, { label: 'Savings', data: savLine, borderColor: '#3b82f6', backgroundColor: chartType === 'bar' ? 'rgba(59,130,246,0.75)' : 'rgba(59,130,246,0.08)', fill: isFill, tension: .4, pointRadius: chartType === 'bar' ? 0 : 3, borderWidth: chartType === 'bar' ? 0 : 2.5, borderRadius: chartType === 'bar' ? 6 : 0 }] }, options: { responsive: true, maintainAspectRatio: false, animation: { duration: 500, easing: 'easeOutQuart' }, plugins: { legend: { position: 'bottom', labels: { color: tc, usePointStyle: true, font: { size: 10 } } }, tooltip: { mode: 'index', intersect: false, callbacks: { label: ctx => ctx.dataset.label + ': ' + fmt(ctx.raw) } } }, scales: { x: { grid: { color: gc }, ticks: { color: tc } }, y: { grid: { color: gc }, ticks: { color: tc, callback: v => fmt(v) } } }, interaction: { intersect: false, mode: 'index' } } });
    }
    drawMainChart('line');
    document.querySelectorAll('#dc1tog .bm').forEach(btn => btn.onclick = () => { document.querySelectorAll('#dc1tog .bm').forEach(b => b.classList.remove('active')); btn.classList.add('active'); drawMainChart(btn.dataset.ct); });

    // Budget & Cash Flow chart
    const bSpend = yearData.map(m => m.e);
    const bLimit = yearData.map((m, idx) => getMonthlyBudget(year, idx));
    const bNet = yearData.map(m => m.i - m.e);
    dashChart(document.getElementById('bchart'), { data: { labels: mns, datasets: [{ type: 'bar', label: 'Budget limit', data: bLimit, backgroundColor: dk ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.12)', borderColor: 'rgba(99,102,241,0.35)', borderWidth: 1, borderRadius: 5, barThickness: 18 }, { type: 'bar', label: 'Actual spend', data: bSpend, backgroundColor: bSpend.map((v, idx) => v > bLimit[idx] ? 'rgba(244,63,94,0.8)' : 'rgba(16,185,129,0.7)'), borderRadius: 5, barThickness: 10 }, { type: 'line', label: 'Cash flow', data: bNet, borderColor: '#6366f1', borderWidth: 2.5, tension: .4, pointRadius: 3, pointBackgroundColor: '#6366f1', pointBorderColor: dk ? '#1e1e2e' : '#fff', pointBorderWidth: 2, yAxisID: 'y1', fill: false }] }, options: { responsive: true, maintainAspectRatio: false, animation: { duration: 500, easing: 'easeOutQuart' }, plugins: { legend: { position: 'bottom', labels: { color: tc, usePointStyle: true, font: { size: 10 }, padding: 12 } }, tooltip: { mode: 'index', intersect: false, backgroundColor: dk ? 'rgba(30,30,46,0.95)' : 'rgba(255,255,255,0.95)', titleColor: dk ? '#e0e0e0' : '#1a1a2e', bodyColor: dk ? '#b0b0b0' : '#555', borderColor: dk ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', borderWidth: 1, padding: 10, cornerRadius: 8, callbacks: { label: ctx => ctx.dataset.label + ': ' + fmt(ctx.raw) } } }, scales: { x: { grid: { display: false }, ticks: { color: tc, font: { size: 10 } } }, y: { grid: { color: gc, drawBorder: false }, ticks: { color: tc, font: { size: 10 }, callback: v => fmt(v), maxTicksLimit: 5 } }, y1: { position: 'right', grid: { display: false }, ticks: { color: tc, font: { size: 10 }, callback: v => fmt(v), maxTicksLimit: 5 } } } } });

    // Expense Breakdown Doughnut
    if (expCats.length) {
      const doughnutColors = ['#ef4444', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#6366f1', '#06b6d4', '#f97316', '#14b8a6', '#a855f7'];
      const totalExp = expCats.reduce((s, c) => s + c.a, 0);
      dashChart(document.getElementById('expDoughnut'), { type: 'doughnut', data: { labels: expCats.map(c => c.n), datasets: [{ data: expCats.map(c => c.a), backgroundColor: doughnutColors.slice(0, expCats.length), borderWidth: 0, hoverOffset: 6 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '62%', animation: { duration: 600, easing: 'easeOutQuart' }, plugins: { legend: { position: 'right', labels: { color: dk ? 'rgba(255,255,255,0.8)' : tc, usePointStyle: true, font: { size: 10 }, padding: 10, generateLabels: chart => chart.data.labels.map((l, i) => ({ text: `${l} (${(chart.data.datasets[0].data[i] / totalExp * 100).toFixed(0)}%)`, fillStyle: doughnutColors[i], strokeStyle: 'transparent', pointStyle: 'circle', index: i, fontColor: dk ? 'rgba(255,255,255,0.8)' : undefined })) } }, tooltip: { callbacks: { label: ctx => { const pct = totalExp > 0 ? (ctx.raw / totalExp * 100).toFixed(1) : 0; return `${ctx.label}: ${fmt(ctx.raw)} (${pct}%)`; } }, backgroundColor: dk ? 'rgba(30,30,46,0.95)' : 'rgba(255,255,255,0.95)', titleColor: dk ? '#e0e0e0' : '#1a1a2e', bodyColor: dk ? '#b0b0b0' : '#555', borderColor: dk ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', borderWidth: 1, padding: 10, cornerRadius: 8 } } } });
    }

    // Category Breakdown chart (removed)
  }, 50);
}

// === AI FINANCIAL INSIGHTS (v10.9.1 — Smart Summary) ===
function generateDashInsights(yearData, EC, ti, te, ts, nw, cf, year, mf) {
  const budgetTotal = getYearlyBudgetTotal(year);
  if (mf === 'total') {
    const savRate = ti > 0 ? (ts / ti * 100).toFixed(0) : 0;
    // V2.0.5: no budget plan = say so, never Infinity%
    const budgetTxt = budgetTotal > 0 && isFinite(te) ? (te / budgetTotal * 100).toFixed(0) + '% of budget' : 'no budget set';
    const topCat = EC.length ? ftEsc(EC[0].n) : 'N/A';
    const healthStatus = cf >= 0 ? 'healthy' : 'under pressure';
    const incTrend = yearData.filter(m => m.i > 0);
    let incChange = '';
    if (incTrend.length >= 2) {
      const recent = incTrend[incTrend.length - 1].i, prev = incTrend[incTrend.length - 2].i;
      const pct = prev > 0 ? ((recent - prev) / prev * 100).toFixed(0) : 0;
      incChange = recent >= prev ? `Income grew ${pct}% last active month.` : `Income dipped ${Math.abs(pct)}% last active month.`;
    }
    const summary = `Your ${year} financial health is <b>${healthStatus}</b>. Total income ${fmt(ti)} with expenses at ${fmt(te)} (${budgetTxt}). ${incChange} Savings rate is <b>${savRate}%</b>. Largest category: <b>${topCat}</b>. Cash flow: <b>${fmt(cf)}</b>.`;
    return `<div class="ic"><span class="ie">🤖</span><div class="ix">${summary}</div></div>`;
  } else {
    const mi = +mf;
    const curM = yearData[mi];
    const prevM = mi > 0 ? yearData[mi - 1] : null;
    const monthName = MONTH_NAMES[mi];
    const savRate = curM.i > 0 ? (curM.s / curM.i * 100).toFixed(0) : 0;
    // V2.0.5: use this month's own plan (not yearly / 12)
    const budgetMonthly = (typeof getMonthlyBudget === 'function') ? (Number(getMonthlyBudget(year, mi)) || 0) : budgetTotal / 12;
    const budgetTxt = budgetMonthly > 0 ? (curM.e / budgetMonthly * 100).toFixed(0) + '% of monthly budget utilized' : 'no monthly budget set';
    let comparison = '';
    if (prevM && prevM.e > 0) {
      const pct = ((curM.e - prevM.e) / prevM.e * 100).toFixed(0);
      comparison = curM.e > prevM.e ? `Expenses increased ${pct}% vs ${MONTH_NAMES[mi - 1]}.` : `Expenses decreased ${Math.abs(pct)}% vs ${MONTH_NAMES[mi - 1]}.`;
    }
    const healthStatus = cf >= 0 ? 'remains healthy' : 'is under pressure';
    const summary = `Your financial performance for <b>${monthName} ${year}</b> ${healthStatus}. ${comparison} Savings rate is <b>${savRate}%</b> and ${budgetTxt}. Cash flow: <b>${fmt(cf)}</b>.${cf >= 0 ? ' Continue maintaining current spending habits.' : ' Consider reducing discretionary spending.'}`;
    return `<div class="ic"><span class="ie">🤖</span><div class="ix">${summary}</div></div>`;
  }
}

// === (v10.9.1) ===

// === OVERSPENT HELPERS (shared between desktop & mobile dashboard) ===
function getDashboardOverspentCats() {
  try {
    const now = new Date();
    const mfEl = document.getElementById('mf');
    const mf = mfEl ? mfEl.value : 'total';
    const year = getSelectedYear();

    const PLANS = JSON.parse(safeGet('ft_budget_plans') || '{}');

    // Determine target month for transaction checking
    let targetMonth, targetYear;
    if (mf !== 'total') {
      targetMonth = parseInt(mf);
      targetYear = year;
    } else {
      // In total view: use selected year + current month
      targetMonth = now.getMonth();
      targetYear = year;
    }

    const yearKey = String(targetYear);
    const yearPlans = PLANS[yearKey];
    if (!yearPlans) return [];

    // Find budget plan (try target month first, then fallback for limits only)
    let monthPlan = yearPlans[targetMonth] || yearPlans[String(targetMonth)] || null;

    // Fallback: use previous month's budget limits as reference
    if (!monthPlan || !monthPlan.expCats) {
      const prevMonth = targetMonth === 0 ? 11 : targetMonth - 1;
      const prevYearKey = targetMonth === 0 ? String(targetYear - 1) : yearKey;
      const prevPlans = targetMonth === 0 ? PLANS[prevYearKey] : yearPlans;
      const prevPlan = prevPlans ? (prevPlans[prevMonth] || prevPlans[String(prevMonth)]) : null;
      if (prevPlan && prevPlan.expCats) {
        monthPlan = prevPlan;
      } else {
        // Last resort: find nearest month with expCats in the same year
        for (let m = 11; m >= 0; m--) {
          const p = yearPlans[m] || yearPlans[String(m)];
          if (p && p.expCats && Object.keys(p.expCats).length > 0) {
            monthPlan = p;
            break;
          }
        }
      }
    }

    if (!monthPlan || !monthPlan.expCats) return [];

    // Always check TARGET month's transactions against the budget limits
    const monthTxns = TXN.filter(tx => {
      const d = new Date(tx.d);
      return d.getFullYear() === targetYear && d.getMonth() === targetMonth && tx.t === 'Expense';
    });

    const overspent = [];
    Object.entries(monthPlan.expCats).forEach(([cat, budget]) => {
      if (budget <= 0) return;
      // Match category (exact first, then case-insensitive fallback)
      let spent = monthTxns.filter(tx => tx.c === cat).reduce((s, tx) => s + tx.a, 0);
      if (spent === 0) {
        const catLower = cat.toLowerCase();
        spent = monthTxns.filter(tx => tx.c && tx.c.toLowerCase() === catLower).reduce((s, tx) => s + tx.a, 0);
      }
      if (spent > budget) {
        const emoji = SCHEMA.Expense && SCHEMA.Expense[cat] ? (SCHEMA.Expense[cat].emoji || '📦') : '📦';
        overspent.push({ cat, budget, spent, over: Math.round((spent - budget) * 100) / 100, emoji, year: targetYear, month: targetMonth });
      }
    });
    return overspent;
  } catch (e) {
    console.warn('Overspent check error:', e);
    return [];
  }
}

function getMobileOverspentHtml() {
  const items = getDashboardOverspentCats();
  if (!items.length) return '';
  const monthLabel = items[0] ? MONTH_NAMES[items[0].month] : MONTH_NAMES[new Date().getMonth()];
  return `<div class="mob-overspent-alert"><div class="mob-overspent-header"><span style="color:var(--rose);font-weight:700;font-size:12px">⚠️ Over Budget</span><span style="font-size:10px;color:var(--text-tertiary)">${monthLabel}</span></div><div class="mob-overspent-list">${items.map(item => `<div class="mob-overspent-row"><div class="mob-overspent-left"><span class="mob-overspent-emoji">${item.emoji}</span><div class="mob-overspent-info"><div class="mob-overspent-name">${ftEsc(item.cat)}</div><div class="mob-overspent-meta">${fmt(item.spent)} / ${fmt(item.budget)}</div></div></div><div class="mob-overspent-right"><div class="mob-overspent-amt">-${fmt(item.over)}</div><button class="mob-overspent-cover" data-cover-cat="${ftEsc(item.cat)}" data-cover-over="${item.over}" data-cover-year="${item.year}" data-cover-month="${item.month}">Cover</button></div></div>`).join('')}</div></div>`;
}

// === CASH FLOW FORECAST (v15.8.2 — Follows selected period) ===
function safeBuildForecastHtml(mode) {
  try { return buildForecastHtml(mode); } catch (e) { console.warn('Forecast render error:', e); return ''; }
}

function computeCashFlowForecast() {
  const now = new Date();
  const mfEl = document.getElementById('mf');
  const mf = mfEl ? mfEl.value : 'total';
  const selectedYear = getSelectedYear();

  // Determine which month to forecast
  let targetYear, targetMonth;
  if (mf !== 'total') {
    targetYear = selectedYear;
    targetMonth = parseInt(mf);
  } else {
    // Default to current month
    targetYear = now.getFullYear();
    targetMonth = now.getMonth();
  }

  const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

  // Determine "today" within the target month
  let today;
  const isCurrentMonth = (targetYear === now.getFullYear() && targetMonth === now.getMonth());
  if (isCurrentMonth) {
    today = now.getDate();
  } else {
    // For past months: full month (no forecast needed)
    // For future months: day 0 (full month ahead)
    const targetEnd = new Date(targetYear, targetMonth + 1, 0);
    if (targetEnd < now) return null; // Past month, no forecast
    today = 0; // Future month
  }

  const daysLeft = daysInMonth - today;
  if (daysLeft <= 0) return null;

  // Get target month's transactions
  const monthTxns = TXN.filter(tx => {
    const d = new Date(tx.d);
    return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
  });

  const incomeThisMonth = monthTxns.filter(tx => tx.t === 'Income').reduce((s, tx) => s + tx.a, 0);
  const expenseThisMonth = monthTxns.filter(tx => tx.t === 'Expense').reduce((s, tx) => s + tx.a, 0);
  // V2.0.5: only money set aside into Savings/Investment accounts is locked away. Moving Maybank -> Cash is not.
  const savingsThisMonth = Math.max(0, monthTxns.reduce((s, tx) => s + ftSetAsideNet(tx), 0));

  // v15.8.2: Monthly income = actual income for the selected month (primary source)
  // Fallback to budget plan income if actual is 0
  const PLANS = JSON.parse(safeGet('ft_budget_plans') || '{}');
  const yearKey = String(targetYear);
  const monthPlan = PLANS[yearKey] && (PLANS[yearKey][String(targetMonth)] || PLANS[yearKey][targetMonth]);

  let monthlyIncome = incomeThisMonth;
  if (monthlyIncome <= 0 && monthPlan) {
    const planInc = monthPlan.incCats ? Object.values(monthPlan.incCats).reduce((s, v) => s + v, 0) : (monthPlan.i || 0);
    if (planInc > 0) monthlyIncome = planInc;
  }

  // Planned savings: use budget plan target if savings not yet made
  let plannedSavings = savingsThisMonth;
  if (monthPlan) {
    const budgetedSav = monthPlan.savCats ? Object.values(monthPlan.savCats).reduce((s, v) => s + v, 0) : (monthPlan.s || 0);
    if (budgetedSav > savingsThisMonth) plannedSavings = budgetedSav;
  }

  // Available to spend = income - planned savings - expenses already made
  const spent = expenseThisMonth + plannedSavings;
  const available = monthlyIncome - spent;
  const safePerDay = daysLeft > 0 ? available / daysLeft : 0;

  // Projected end-of-month: current spending rate x days left
  const dailyAvgExpense = today > 0 ? expenseThisMonth / today : 0;
  const projectedTotalExpense = expenseThisMonth + (dailyAvgExpense * daysLeft);
  const projectedEndBalance = monthlyIncome - plannedSavings - projectedTotalExpense;

  return {
    daysLeft,
    today,
    daysInMonth,
    available: Math.round(available * 100) / 100,
    safePerDay: Math.round(safePerDay * 100) / 100,
    dailyAvgExpense: Math.round(dailyAvgExpense * 100) / 100,
    projectedEnd: Math.round(projectedEndBalance * 100) / 100,
    monthlyIncome,
    expenseThisMonth,
    savingsThisMonth,
    onTrack: projectedEndBalance >= 0,
    targetMonth,
    targetYear
  };
}

function buildForecastHtml(mode) {
  const fc = computeCashFlowForecast();
  if (!fc || fc.monthlyIncome <= 0) return '';

  const safeColor = fc.safePerDay > 0 ? 'var(--emerald)' : 'var(--rose)';
  const statusIcon = fc.onTrack ? '✅' : '⚠️';
  const statusText = fc.onTrack ? 'On track to end positive' : 'Projected to overspend';
  const statusColor = fc.onTrack ? 'var(--emerald)' : 'var(--rose)';
  const progressPct = fc.daysInMonth > 0 ? Math.round((fc.today / fc.daysInMonth) * 100) : 0;

  if (mode === 'mobile') {
    return `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="font-size:12px;font-weight:700">Cash Flow Forecast</div>
        <div style="font-size:9px;color:var(--text-tertiary)">${fc.daysLeft} days left</div>
      </div>
      <div style="text-align:center;margin-bottom:10px">
        <div style="font-size:9px;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px">Safe to spend per day</div>
        <div class="ft-amt" style="font-size:24px;font-weight:800;color:${safeColor};font-feature-settings:'tnum'">${fmt(Math.max(0, fc.safePerDay))}</div>
      </div>
      <div style="height:4px;background:var(--border);border-radius:2px;overflow:hidden;margin-bottom:10px">
        <div style="height:100%;width:${progressPct}%;background:var(--accent);border-radius:2px"></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div style="padding:8px;background:var(--bg-primary);border-radius:8px;text-align:center"><div style="font-size:8px;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:2px">Available</div><div class="ft-amt" style="font-size:12px;font-weight:700;color:${fc.available >= 0 ? 'var(--text-primary)' : 'var(--rose)'};font-feature-settings:'tnum'">${fmt(fc.available)}</div></div>
        <div style="padding:8px;background:var(--bg-primary);border-radius:8px;text-align:center"><div style="font-size:8px;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:2px">Projected End</div><div class="ft-amt" style="font-size:12px;font-weight:700;color:${statusColor};font-feature-settings:'tnum'">${fmt(fc.projectedEnd)}</div></div>
      </div>
      <div style="margin-top:8px;font-size:10px;color:${statusColor};text-align:center;font-weight:500">${statusIcon} ${statusText}</div>
    </div>`;
  }

  // Desktop version
  return `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:16px 18px;margin-bottom:14px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <div style="font-size:13px;font-weight:700">💰 Cash Flow Forecast</div>
      <div style="font-size:10px;color:var(--text-tertiary)">Day ${fc.today} of ${fc.daysInMonth} (${fc.daysLeft} left)</div>
    </div>
    <div style="display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr;gap:12px;margin-bottom:12px">
      <div style="padding:12px 14px;background:var(--bg-primary);border:1px solid var(--border-light);border-radius:9px">
        <div style="font-size:9px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">Safe to spend / day</div>
        <div class="ft-amt" style="font-size:20px;font-weight:800;color:${safeColor};font-feature-settings:'tnum'">${fmt(Math.max(0, fc.safePerDay))}</div>
      </div>
      <div style="padding:12px 14px;background:var(--bg-primary);border:1px solid var(--border-light);border-radius:9px">
        <div style="font-size:9px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">Remaining</div>
        <div class="ft-amt" style="font-size:14px;font-weight:700;font-feature-settings:'tnum';color:${fc.available >= 0 ? 'var(--text-primary)' : 'var(--rose)'}">${fmt(fc.available)}</div>
      </div>
      <div style="padding:12px 14px;background:var(--bg-primary);border:1px solid var(--border-light);border-radius:9px">
        <div style="font-size:9px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">Daily avg spend</div>
        <div class="ft-amt" style="font-size:14px;font-weight:700;font-feature-settings:'tnum';color:var(--rose)">${fmt(fc.dailyAvgExpense)}</div>
      </div>
      <div style="padding:12px 14px;background:var(--bg-primary);border:1px solid var(--border-light);border-radius:9px">
        <div style="font-size:9px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">Projected end</div>
        <div class="ft-amt" style="font-size:14px;font-weight:700;font-feature-settings:'tnum';color:${statusColor}">${fmt(fc.projectedEnd)}</div>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:10px">
      <div style="flex:1;height:5px;background:var(--border);border-radius:3px;overflow:hidden"><div style="height:100%;width:${progressPct}%;background:var(--accent);border-radius:3px;transition:width 300ms"></div></div>
      <div style="font-size:10px;font-weight:600;color:${statusColor};white-space:nowrap">${statusIcon} ${statusText}</div>
    </div>
  </div>`;
}

// === MOBILE DASHBOARD (v15.8.1 — Essential info only) ===
function renderMobileDashboard(c, year) {
  dashDestroy();
  if (!yearHasData(year)) {
    c.innerHTML = `<div class="es" style="padding:80px 20px"><div style="font-size:40px;margin-bottom:12px">📊</div><div style="font-size:15px;font-weight:600;color:var(--text-primary);margin-bottom:6px">${t('dash_no_data')} ${year}</div><p style="font-size:12px">${t('dash_select_year')}</p></div>`;
    return;
  }

  const yearData = computeMonthlyData(year);
  const mf = document.getElementById('mf').value;
  let ti, te, ts;
  if (mf === 'total') {
    ti = yearData.reduce((s, m) => s + m.i, 0);
    te = yearData.reduce((s, m) => s + m.e, 0);
    ts = yearData.reduce((s, m) => s + m.s, 0);
  } else {
    ti = yearData[+mf].i;
    te = yearData[+mf].e;
    ts = yearData[+mf].s;
  }

  const nw = getNetWorth();
  // V2.0.5: Assets / Liabilities line computed here too, so it still shows if accounts.js fails to load
  let nwT = typeof ftNwTotals === 'function' ? ftNwTotals() : null;
  if (!nwT) { try { nwT = { assets: ACCOUNTS.filter(a => a.type === 'asset').reduce((s, a) => s + ftAccBalanceMYR(a.id), 0), liabs: ftLiabilitiesMYR() }; } catch (e) { nwT = null; console.warn('[FinTrack] NW totals:', e); } }
  const cf = ti - te;
  const savRate = ti > 0 ? (ts / ti * 100).toFixed(0) : 0;
  const budgetTotal = getYearlyBudgetTotal(year);
  // Use selected month's budget if a month is selected, otherwise yearly
  const periodBudget = mf !== 'total' ? getMonthlyBudget(year, +mf) : budgetTotal;
  const budgetUsed = periodBudget > 0 ? (te / periodBudget * 100).toFixed(0) : 0;

  // V2.0.6: the line under Net Worth = how much NET WORTH changed in the picked month.
  // (Old code showed the EXPENSE change here, so "▲ 15%" under Net Worth looked like net worth went up.)
  let trendLabel = '';
  let trendClass = 'pos';
  if (mf !== 'total') {
    try {
      const mi = +mf;
      const nwEnd = Number(getNetWorthByPeriod(year, String(mi))) || 0;
      const nwPrev = Number(mi > 0 ? getNetWorthByPeriod(year, String(mi - 1)) : getNetWorthByPeriod(year - 1, '11')) || 0;
      const chg = Math.round((nwEnd - nwPrev) * 100) / 100;
      if (chg !== 0) {
        trendLabel = (chg > 0 ? '▲ ' : '▼ ') + '<span class="ft-amt">' + fmt(Math.abs(chg)) + '</span> in ' + MONTH_NAMES[mi];
        trendClass = chg > 0 ? 'pos' : 'neg';
      }
    } catch (e) { trendLabel = ''; }
  }

  // Recent transactions (last 5)
  const recent = TXN.filter(tx => {
    const d = new Date(tx.d);
    if (d.getFullYear() !== year) return false;
    if (mf !== 'total' && d.getMonth() !== +mf) return false;
    return true;
  }).sort((a, b) => new Date(b.d) - new Date(a.d)).slice(0, 5);

  const recentHtml = recent.map(tx => {
    const isX = ftIsXfer(tx);
    const color = tx.t === 'Income' ? 'var(--emerald)' : isX ? 'var(--blue)' : 'var(--rose)';
    // V2.0.5: an own-account transfer is not money out, so no minus sign
    const sign = tx.t === 'Income' ? '+' : (isX && tx.toAcc) ? '⇄ ' : '-';
    return `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-light)"><div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${ftEsc(tx.dt || tx.c)}</div><div style="font-size:10px;color:var(--text-tertiary)">${ftEsc(tx.c)}${tx.s ? ' · ' + ftEsc(tx.s) : ''}</div></div><div style="font-size:13px;font-weight:700;color:${color};font-feature-settings:'tnum'">${sign}${fmtD(tx.a)}</div></div>`;
  }).join('');

  // Budget categories progress (top 4)
  const expCats = computeExpenseCategoriesByPeriod(year, mf);
  const topCats = expCats.slice(0, 4);
  const teCats = expCats.reduce((s, x) => s + (Number(x.a) || 0), 0);
  const PLANS_MOB = JSON.parse(safeGet('ft_budget_plans') || '{}');
  const mobYearKey = String(year);
  const mobMonthPlan = mf !== 'total' && PLANS_MOB[mobYearKey] ? PLANS_MOB[mobYearKey][+mf] : null;
  const budgetBarsHtml = topCats.map(cat => {
    // Get actual per-category budget from plan if available
    let catBudget = 0;
    if (mf !== 'total' && mobMonthPlan && mobMonthPlan.expCats && mobMonthPlan.expCats[cat.n]) {
      catBudget = mobMonthPlan.expCats[cat.n];
    } else if (mf === 'total') {
      // Sum all months for this category
      if (PLANS_MOB[mobYearKey]) {
        for (let m = 0; m < 12; m++) {
          if (PLANS_MOB[mobYearKey][m] && PLANS_MOB[mobYearKey][m].expCats && PLANS_MOB[mobYearKey][m].expCats[cat.n]) {
            catBudget += PLANS_MOB[mobYearKey][m].expCats[cat.n];
          }
        }
      }
    }
    // V2.0.6: no budget for this category = bar shows its share of this period's spending (was a fake half-full bar)
    const pct = catBudget > 0 ? Math.min(100, (cat.a / catBudget * 100)) : (teCats > 0 ? cat.a / teCats * 100 : 0);
    const fillClass = catBudget > 0 ? (pct > 90 ? 'over' : pct > 70 ? 'warn' : 'safe') : '';
    const fillStyle = 'width:' + pct.toFixed(0) + '%' + (catBudget > 0 ? '' : ';background:var(--accent);opacity:.55');
    const note = catBudget > 0 ? ' / ' + fmtD(catBudget) : ' · ' + pct.toFixed(0) + '%';
    return `<div class="budget-prog-item"><div class="budget-prog-cat">💸</div><div class="budget-prog-info"><div class="budget-prog-top"><span class="budget-prog-name">${ftEsc(cat.n)}</span><span class="budget-prog-amt">${fmtD(cat.a)}${note}</span></div><div class="budget-prog-bar"><div class="budget-prog-fill ${fillClass}" style="${fillStyle}"></div></div></div></div>`;
  }).join('');

  c.innerHTML = `<div class="mob-dash">
    <div class="mob-dash-balance ft-nw-card" data-nw-morph onclick="if(typeof ftMorphNav==='function')ftMorphNav('accounts', this);else navigate('accounts')" role="button" aria-label="Open Accounts">
      <div class="mob-dash-greeting">${getGreeting()}</div>
      <div class="ft-nw-label">${t('dash_net_worth')}</div>
      <div class="mob-dash-amount">${fmt(nw)}</div>
      ${nwT ? `<div class="ft-nw-sub">${t('acc_assets')} ${fmt(nwT.assets)} · ${t('acc_liabs')} -${fmt(nwT.liabs)}</div>` : ''}
      ${trendLabel ? `<div class="mob-dash-change ${trendClass}">${trendLabel}</div>` : ''}
      <div class="ft-nw-hint">${t('acc_tap_hint')} ›</div>
    </div>
    <div class="mob-dash-stats">
      <div class="mob-dash-stat"><div class="mob-dash-stat-label">${t('dash_income')}</div><div class="mob-dash-stat-val" style="color:var(--emerald)">${fmtD(ti)}</div></div>
      <div class="mob-dash-stat"><div class="mob-dash-stat-label">${t('dash_expense')}</div><div class="mob-dash-stat-val" style="color:var(--rose)">${fmtD(te)}</div></div>
      <div class="mob-dash-stat"><div class="mob-dash-stat-label">${t('dash_savings')}</div><div class="mob-dash-stat-val" style="color:var(--blue)">${fmtD(ts)}</div></div>
    </div>
    ${safeBuildForecastHtml('mobile')}
    ${getMobileOverspentHtml()}
    <div class="mob-dash-chart">
      <div class="mob-dash-chart-title">${t('dash_spending_trend')}</div>
      <div style="height:140px"><canvas id="mobDashChart"></canvas></div>
    </div>
    ${budgetBarsHtml ? `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:12px 14px"><div style="font-size:12px;font-weight:700;margin-bottom:10px;display:flex;justify-content:space-between"><span>${t('dash_top_spending')}</span><span style="font-size:10px;color:var(--text-tertiary);font-weight:500">${periodBudget > 0 ? budgetUsed + '% ' + t('dash_of_budget') : 'No budget set'}</span></div><div style="display:flex;flex-direction:column;gap:8px">${budgetBarsHtml}</div></div>` : ''}
    <div class="mob-dash-recent">
      <div class="mob-dash-recent-title"><span>${t('dash_recent')}</span><a onclick="navigate('transactions')">${t('dash_see_all')} →</a></div>
      ${recentHtml || '<div style="padding:16px;text-align:center;color:var(--text-tertiary);font-size:11px">' + t('txn_no_transactions') + '</div>'}
    </div>
  </div>`;

  // Render mini chart + apply hide state
  setTimeout(() => {
    if (typeof applyHideAmounts === 'function') applyHideAmounts();
    const ctx = document.getElementById('mobDashChart')?.getContext('2d');
    if (!ctx) return;
    const dk = document.documentElement.dataset.theme === 'dark';
    const labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const expData = yearData.map(m => m.e);
    const incData = yearData.map(m => m.i);
    const grad = ctx.createLinearGradient(0, 0, 0, 140);
    grad.addColorStop(0, 'rgba(244,63,94,0.15)');
    grad.addColorStop(1, 'rgba(244,63,94,0)');
    dashChart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Expense', data: expData, borderColor: '#f43f5e', borderWidth: 2, tension: 0.4, pointRadius: 0, pointHoverRadius: 5, fill: true, backgroundColor: grad },
          { label: 'Income', data: incData, borderColor: '#10b981', borderWidth: 2, tension: 0.4, pointRadius: 0, pointHoverRadius: 5, fill: false }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: true, position: 'bottom', labels: { color: dk ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)', usePointStyle: true, font: { size: 10 }, padding: 12 } }, tooltip: { mode: 'index', intersect: false, callbacks: { label: ctx => ctx.dataset.label + ': ' + fmt(ctx.raw) } } },
        scales: { x: { display: true, grid: { display: false }, ticks: { color: dk ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', font: { size: 9 }, maxRotation: 0 } }, y: { display: false } },
        interaction: { intersect: false, mode: 'index' },
        animation: { duration: 400, easing: 'easeOutQuart' }
      }
    });
  }, 50);
}

// === MOBILE INSIGHTS (V2.0.6 redesign): Home = right now, Insights = why ===
// Health ring (real weights, tap for the reason), Trend, Where it went vs last month, Worth a look.
// Wealth Summary / Cash Flow / Account Breakdown removed: Home and Accounts already show them.
// (buildMobileInsightsTab, computeFinancialHealth, getHighLiquidityAssets, buildDynamicAIInsights all live in THIS file.)
var FTI_M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
var FTI_HUES = [275, 250, 75, 200, 162, 15, 320, 40, 130, 295, 225, 55];
var FTI = { key: 'nw', trend: null, health: null, animKey: '', hover: null };

function ftiHue(i, a) { var h = FTI_HUES[i % FTI_HUES.length]; return 'oklch(0.7 0.14 ' + h + (a ? ' / ' + a : '') + ')'; }
function ftiPts(n) { return Number.isInteger(n) ? String(n) : n.toFixed(1); }
function ftiSigned(n) { return (n >= 0 ? '+' : '-') + fmt(Math.abs(n)); }
function ftiLabelOf(s) { return s >= 90 ? 'Excellent' : s >= 75 ? 'Good' : s >= 60 ? 'Fair' : s >= 40 ? 'Needs Work' : 'Critical'; }
function ftiArc(a0, a1) {
  var C = 118, R = 98;
  var p = function(a) { return [C + R * Math.sin(a * Math.PI / 180), C - R * Math.cos(a * Math.PI / 180)]; };
  var s = p(a0), e = p(a1);
  return 'M ' + s[0].toFixed(2) + ' ' + s[1].toFixed(2) + ' A ' + R + ' ' + R + ' 0 ' + (a1 - a0 > 180 ? 1 : 0) + ' 1 ' + e[0].toFixed(2) + ' ' + e[1].toFixed(2);
}

function buildMobileInsightsTab(yearData, year, mf, ti, te, ts, nw, cf, budgetUsed, periodBudget) {
  ftiEnsureCss();
  var isMonth = mf !== 'total';
  var ctx = { year: year, mf: mf, isMonth: isMonth, yd: yearData };
  if (isMonth) {
    var m = +mf;
    ctx.py = m > 0 ? year : year - 1; ctx.pm = m > 0 ? m - 1 : 11; ctx.prevName = FTI_M[ctx.pm];
    ctx.prevMD = m > 0 ? yearData[ctx.pm] : (computeMonthlyData(ctx.py) || [])[11];
    ctx.prevCats = {};
    (computeExpenseCategoriesByPeriod(ctx.py, String(ctx.pm)) || []).forEach(function(c) { ctx.prevCats[c.n] = (ctx.prevCats[c.n] || 0) + (Number(c.a) || 0); });
  }
  ctx.cats = (computeExpenseCategoriesByPeriod(year, mf) || []).filter(function(c) { return c && c.a > 0; }).sort(function(a, b) { return b.a - a.a; });

  var animKey = year + '|' + mf;
  var animate = FTI.animKey !== animKey;
  FTI.animKey = animKey;

  var html = '<div class="fti' + (animate ? '' : ' fti-still') + '">';
  html += ftiHealthHtml(ctx, ti, te, ts, cf, budgetUsed, periodBudget, animate);
  html += ftiTrendHtml(ctx);
  html += ftiCatsHtml(ctx);
  html += ftiTipsHtml(ctx, ti, te, cf);
  html += '</div>';
  setTimeout(function() { ftiMount(animate); }, 30);
  return html;
}

// --- 1. Financial health: ring cut into the real weights, fill = that part's score ---
function ftiHealthHtml(ctx, ti, te, ts, cf, budgetUsed, periodBudget, animate) {
  var h = computeFinancialHealth(ti, te, ts, cf, budgetUsed, periodBudget, ctx.year, ctx.mf);
  FTI.health = h;
  var F = h.factors || [];
  var col = h.score >= 80 ? 'var(--emerald)' : h.score >= 60 ? 'var(--amber)' : 'var(--rose)';

  var delta = 'Whole year ' + ctx.year;
  if (ctx.isMonth) {
    var p = ctx.prevMD;
    if (p && (p.i > 0 || p.e > 0)) {
      var ph = computeFinancialHealth(p.i, p.e, p.s, p.i - p.e, 0, 0, ctx.py, String(ctx.pm));
      var d = h.score - ph.score;
      delta = d === 0 ? 'Same as ' + ctx.prevName : (d > 0 ? '+' : '') + d + ' vs ' + ctx.prevName;
    } else delta = FTI_M[+ctx.mf] + ' ' + ctx.year;
  }

  var weakest = null, lost = 0.5;
  F.forEach(function(f) { if (f.weight - f.pts > lost) { lost = f.weight - f.pts; weakest = f; } });

  var GAP = 2.6, cum = 0, segs = '';
  F.forEach(function(f, i) {
    var a0 = cum / 100 * 360 + GAP / 2; cum += f.weight; var a1 = cum / 100 * 360 - GAP / 2;
    var cut = a0 + (a1 - a0) * Math.max(0, Math.min(100, f.score)) / 100;
    var fc = f.score >= 100 ? 'var(--emerald)' : 'var(--amber)';
    segs += '<g class="fti-seg" data-f="' + f.id + '" onclick="ftiOpen(\'' + f.id + '\',1)">' +
      '<path class="fti-track" d="' + ftiArc(a0, a1) + '"/>' +
      (weakest && weakest.id === f.id && f.score < 100 ? '<path class="fti-glow" d="' + ftiArc(cut, a1) + '"/>' : '') +
      (f.score >= 1 ? '<path class="fti-fill" pathLength="1" d="' + ftiArc(a0, cut) + '" style="stroke:' + fc + ';animation-delay:' + (0.2 + i * 0.13).toFixed(2) + 's"/>' : '') +
      '<path class="fti-hit" d="' + ftiArc(a0, a1) + '"/></g>';
  });

  var lever;
  if (weakest) {
    var ns = Math.min(100, Math.round(h.raw - weakest.pts + weakest.weight));
    lever = '<button class="fti-lever" onclick="ftiOpen(\'' + weakest.id + '\',1)"><i data-lucide="trending-up" width="18" height="18"></i><span>Fix <b>' + weakest.name.toLowerCase() + '</b> to reach <b>' + ns + ' · ' + ftiLabelOf(ns) + '</b></span></button>';
  } else {
    lever = '<div class="fti-lever fti-lever-ok"><i data-lucide="check-circle-2" width="18" height="18"></i><span>Every part is at full marks.</span></div>';
  }

  var openId = weakest ? weakest.id : null;
  var rows = F.map(function(f) {
    var isOpen = f.id === openId;
    return '<button class="fti-row" id="ftiRow-' + f.id + '" aria-expanded="' + isOpen + '" onclick="ftiOpen(\'' + f.id + '\')">' +
      '<span class="fti-dot" style="background:' + (f.score >= 100 ? 'var(--emerald)' : 'var(--amber)') + '"></span>' +
      '<span class="fti-name">' + f.name + '<span class="fti-meta"><em>' + f.value + '</em> · aim ' + f.aim + '</span></span>' +
      '<span class="fti-pts">' + ftiPts(f.pts) + '<span>/' + f.weight + '</span></span>' +
      '<span class="fti-chev"><i data-lucide="chevron-right" width="16" height="16"></i></span></button>' +
      '<div class="fti-why' + (isOpen ? ' open' : '') + '" id="ftiWhy-' + f.id + '"><div><p class="ft-amt">' + f.why + '</p></div></div>';
  }).join('');

  var countUp = animate && !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  return '<section class="fti-card"><div class="fti-h"><h3>Financial health</h3><span>out of 100</span></div>' +
    '<div class="fti-ring"><svg id="ftiRingSvg" viewBox="0 0 236 236" role="img" aria-label="Health score ' + h.score + ' out of 100, ' + h.label + '">' + segs + '</svg>' +
    '<div class="fti-ring-c"><div class="fti-num" id="ftiNum" data-to="' + h.score + '"' + (countUp ? ' data-count="1">0' : '>' + h.score) + '</div><div class="fti-lbl" style="color:' + col + '">' + h.label + '</div><div class="fti-delta">' + delta + '</div></div></div>' +
    lever + '<div class="fti-factors">' + rows + '</div></section>';
}

function ftiOpen(id, fromRing) {
  var row = document.getElementById('ftiRow-' + id);
  if (!row) return;
  var wasOpen = row.getAttribute('aria-expanded') === 'true';
  document.querySelectorAll('.fti-row').forEach(function(r) { r.setAttribute('aria-expanded', 'false'); });
  document.querySelectorAll('.fti-why').forEach(function(w) { w.classList.remove('open'); });
  var svg = document.getElementById('ftiRingSvg');
  if (wasOpen && !fromRing) { if (svg) svg.classList.remove('has-sel'); return; }
  row.setAttribute('aria-expanded', 'true');
  var why = document.getElementById('ftiWhy-' + id);
  if (why) why.classList.add('open');
  if (svg) {
    svg.classList.add('has-sel');
    svg.querySelectorAll('.fti-seg').forEach(function(g) { g.classList.toggle('sel', g.getAttribute('data-f') === id); });
  }
}

// --- 2. Trend: net worth / savings rate / spending, month by month ---
var FTI_TM = {
  nw: { tab: 'Net worth', label: 'Net worth', col: 'var(--emerald)', val: function(v) { return fmt(v); },
    side: function(T) { return 'Since ' + T.months[0] + ' ' + ftiSigned(T.nw[T.nw.length - 1] - T.nw[0]); },
    chg: function(v, p) { return { t: ftiSigned(v - p), good: v >= p }; } },
  sav: { tab: 'Savings', label: 'Savings rate', col: 'var(--blue)', val: function(v) { return v + '%'; },
    side: function(T) { return 'Avg ' + Math.round(T.sav.reduce(function(s, v) { return s + v; }, 0) / T.sav.length) + '%'; },
    chg: function(v, p) { return { t: (v >= p ? '+' : '-') + Math.abs(v - p) + ' pts', good: v >= p }; } },
  exp: { tab: 'Spending', label: 'Spending', col: 'var(--rose)', val: function(v) { return fmt(v); },
    side: function(T) { return 'Avg ' + fmt(T.exp.reduce(function(s, v) { return s + v; }, 0) / T.exp.length); },
    chg: function(v, p) { return p > 0 ? { t: (v >= p ? '+' : '-') + Math.abs(Math.round((v - p) / p * 100)) + '%', good: v <= p } : { t: ftiSigned(v - p), good: v <= p }; } }
};
var FTI_W = 322, FTI_H = 170, FTI_PX = 12, FTI_PT = 14, FTI_PB = 30;

function ftiPoints(data) {
  var mn = Math.min.apply(null, data), mx = Math.max.apply(null, data);
  var pad = (mx - mn) * 0.16 || Math.abs(mx) * 0.1 || 1, lo = mn - pad, hi = mx + pad;
  var step = (FTI_W - FTI_PX * 2) / Math.max(1, data.length - 1);
  return data.map(function(v, i) { return [FTI_PX + i * step, FTI_PT + (1 - (v - lo) / (hi - lo)) * (FTI_H - FTI_PT - FTI_PB)]; });
}
// Monotone curve: the line never dips below or above a real month
function ftiPath(p) {
  var f = function(n) { return n.toFixed(2); }, n = p.length, dx = [], m = [], t = [], i;
  for (i = 0; i < n - 1; i++) { dx[i] = p[i + 1][0] - p[i][0]; m[i] = (p[i + 1][1] - p[i][1]) / dx[i]; }
  t[0] = m[0];
  for (i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : 3 * (dx[i - 1] + dx[i]) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]);
  t[n - 1] = m[n - 2];
  var d = 'M ' + f(p[0][0]) + ' ' + f(p[0][1]);
  for (i = 0; i < n - 1; i++) { var hh = dx[i] / 3; d += ' C ' + f(p[i][0] + hh) + ' ' + f(p[i][1] + t[i] * hh) + ' ' + f(p[i + 1][0] - hh) + ' ' + f(p[i + 1][1] - t[i + 1] * hh) + ' ' + f(p[i + 1][0]) + ' ' + f(p[i + 1][1]); }
  return d;
}

function ftiTrendHtml(ctx) {
  var now = new Date(), yd = ctx.yd;
  var last = ctx.isMonth ? +ctx.mf : (ctx.year === now.getFullYear() ? now.getMonth() : ctx.year < now.getFullYear() ? 11 : -1);
  var first = -1, i;
  for (i = 0; i <= last; i++) { if (yd[i] && (yd[i].i > 0 || yd[i].e > 0)) { first = i; break; } }
  var head = '<section class="fti-card"><div class="fti-h"><h3>Trend</h3><span>' + (first >= 0 && last > first ? FTI_M[first] + ' to ' + FTI_M[last] : ctx.year) + '</span></div>';
  FTI.trend = null; FTI.hover = null;
  if (first < 0 || last - first < 1) return head + '<div class="fti-empty">Trend shows up once you have 2 months of data.</div></section>';
  var idx = []; for (i = first; i <= last; i++) idx.push(i);
  FTI.trend = {
    months: idx.map(function(k) { return FTI_M[k]; }),
    nw: idx.map(function(k) { return Number(getNetWorthByPeriod(ctx.year, String(k))) || 0; }),
    sav: idx.map(function(k) { var m = yd[k]; return m.i > 0 ? Math.max(-100, Math.round(m.s / m.i * 100)) : 0; }),
    exp: idx.map(function(k) { return Number(yd[k].e) || 0; })
  };
  if (!FTI_TM[FTI.key]) FTI.key = 'nw';
  var tabs = Object.keys(FTI_TM).map(function(k) { return '<button class="' + (k === FTI.key ? 'on' : '') + '" data-k="' + k + '" onclick="ftiTrend(\'' + k + '\')">' + FTI_TM[k].tab + '</button>'; }).join('');
  var ro = ftiReadout(null);
  return head + '<div class="fti-seg3" id="ftiTabs">' + tabs + '</div>' +
    '<div class="fti-ro-top"><span id="ftiRoLbl">' + ro.lbl + '</span><span id="ftiRoSide" class="ft-amt">' + ro.side + '</span></div>' +
    '<div class="fti-ro-val ft-amt" id="ftiRoVal">' + ro.val + '</div><div class="fti-ro-chg ft-amt" id="ftiRoChg" style="color:' + ro.col + '">' + ro.chg + '</div>' +
    '<svg id="ftiTrendSvg" class="fti-chart" viewBox="0 0 ' + FTI_W + ' ' + FTI_H + '">' + ftiTrendInner(false) + '</svg></section>';
}

function ftiTrendInner(anim) {
  var T = FTI.trend, M = FTI_TM[FTI.key], data = T[FTI.key], pts = ftiPoints(data);
  var line = ftiPath(pts), base = FTI_H - FTI_PB;
  var area = line + ' L ' + pts[pts.length - 1][0].toFixed(2) + ' ' + base + ' L ' + pts[0][0].toFixed(2) + ' ' + base + ' Z';
  var last = pts[pts.length - 1];
  return '<g style="color:' + M.col + '"><defs><linearGradient id="ftiGrad" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity="0.28"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>' +
    '<line class="fti-base" x1="0" x2="' + FTI_W + '" y1="' + base + '" y2="' + base + '"/>' +
    '<path class="fti-area" d="' + area + '" fill="url(#ftiGrad)"/>' +
    '<path class="fti-line' + (anim ? ' fti-anim' : '') + '" pathLength="1" d="' + line + '"/>' +
    '<line id="ftiGuide" class="fti-guide" x1="0" x2="0" y1="' + (FTI_PT - 6) + '" y2="' + base + '" style="display:none"/>' +
    '<circle id="ftiDot" class="fti-pt" r="5.5" cx="' + last[0].toFixed(2) + '" cy="' + last[1].toFixed(2) + '"/>' +
    T.months.map(function(mo, j) { return '<text class="fti-tick" data-i="' + j + '" x="' + pts[j][0].toFixed(2) + '" y="' + (FTI_H - 8) + '" text-anchor="middle">' + mo + '</text>'; }).join('') + '</g>';
}

function ftiTrend(k) {
  if (!FTI.trend || !FTI_TM[k]) return;
  FTI.key = k; FTI.hover = null;
  document.querySelectorAll('#ftiTabs button').forEach(function(b) { b.classList.toggle('on', b.getAttribute('data-k') === k); });
  var svg = document.getElementById('ftiTrendSvg');
  if (svg) svg.innerHTML = ftiTrendInner(true);
  ftiTrendAt(null);
}

function ftiReadout(i) {
  var T = FTI.trend, M = FTI_TM[FTI.key], data = T[FTI.key], k = i == null ? data.length - 1 : i;
  var c = k > 0 ? M.chg(data[k], data[k - 1]) : null;
  return { k: k, lbl: M.label + ' · ' + T.months[k], side: M.side(T), val: M.val(data[k]),
    chg: c ? c.t + ' vs ' + T.months[k - 1] : 'First month shown',
    col: c ? (c.good ? 'var(--emerald)' : 'var(--rose)') : 'var(--text-tertiary)' };
}

function ftiTrendAt(i) {
  if (!FTI.trend) return;
  FTI.hover = i;
  var ro = ftiReadout(i), k = ro.k, pts = ftiPoints(FTI.trend[FTI.key]);
  var set = function(id, txt) { var el = document.getElementById(id); if (el && el.textContent !== txt) el.textContent = txt; return el; };
  set('ftiRoLbl', ro.lbl);
  set('ftiRoSide', ro.side);
  set('ftiRoVal', ro.val);
  var chgEl = set('ftiRoChg', ro.chg);
  if (chgEl) chgEl.style.color = ro.col;
  var dot = document.getElementById('ftiDot'), guide = document.getElementById('ftiGuide');
  if (dot) { dot.setAttribute('cx', pts[k][0].toFixed(2)); dot.setAttribute('cy', pts[k][1].toFixed(2)); }
  if (guide) { guide.style.display = i == null ? 'none' : ''; guide.setAttribute('x1', pts[k][0].toFixed(2)); guide.setAttribute('x2', pts[k][0].toFixed(2)); }
  document.querySelectorAll('#ftiTrendSvg .fti-tick').forEach(function(t) { t.classList.toggle('on', +t.getAttribute('data-i') === k); });
}

// --- 3. Where it went: every category, share, change vs last month ---
function ftiCatsHtml(ctx) {
  var list = ctx.cats, total = list.reduce(function(s, c) { return s + c.a; }, 0);
  var sub = ctx.isMonth ? FTI_M[+ctx.mf] + ', compared with ' + ctx.prevName : 'Whole year ' + ctx.year;
  var html = '<section class="fti-card"><div class="fti-h"><h3>Where it went</h3><span class="ft-amt">' + fmt(total) + '</span></div><div class="fti-sub">' + sub + '</div>';
  if (!list.length) return html + '<div class="fti-empty">No spending recorded for this period.</div></section>';
  var top = list.slice(0, 8), rest = list.slice(8).reduce(function(s, c) { return s + c.a; }, 0);
  html += '<div class="fti-bar">' + top.map(function(c, i) { return '<div style="flex-grow:' + c.a + ';background:' + ftiHue(i) + '"></div>'; }).join('') +
    (rest > 0 ? '<div style="flex-grow:' + rest + ';background:var(--border)"></div>' : '') + '</div>';
  list.forEach(function(c, i) {
    var em = (typeof SCHEMA !== 'undefined' && SCHEMA.Expense && SCHEMA.Expense[c.n] && SCHEMA.Expense[c.n].emoji) || '💸';
    var chg = '';
    if (ctx.isMonth) {
      var p = ctx.prevCats[c.n] || 0;
      if (p <= 0) chg = '<span class="fti-chg fti-same">New</span>';
      else { var pct = Math.round((c.a - p) / p * 100); chg = pct === 0 ? '<span class="fti-chg fti-same">Same</span>' : '<span class="fti-chg ' + (pct > 0 ? 'fti-up' : 'fti-down') + '">' + (pct > 0 ? '+' : '') + pct + '%</span>'; }
    }
    html += '<div class="fti-cat' + (i >= 8 ? ' fti-hide' : '') + '"><span class="fti-ico" style="background:' + ftiHue(i, 0.16) + '">' + em + '</span>' +
      '<span class="fti-name">' + ftEsc(c.n) + '<span class="fti-meta">' + Math.round(c.a / total * 100) + '% of spending</span></span>' +
      '<span class="fti-amt"><span class="ft-amt">' + fmtD(c.a) + '</span>' + chg + '</span></div>';
  });
  if (list.length > 8) html += '<button class="fti-more" onclick="ftiMoreCats(this)">Show all ' + list.length + '</button>';
  var sa = ctx.isMonth ? (Number(ctx.yd[+ctx.mf].sa) || 0) : ctx.yd.reduce(function(s, m) { return s + (Number(m.sa) || 0); }, 0);
  if (sa > 0) html += '<div class="fti-note"><i data-lucide="lock" width="14" height="14"></i><span>Also moved <b class="ft-amt">' + fmt(sa) + '</b> into savings or investment accounts. Not spending.</span></div>';
  return html + '</section>';
}
function ftiMoreCats(btn) {
  var card = btn && btn.closest('.fti-card'); if (!card) return;
  card.querySelectorAll('.fti-cat.fti-hide').forEach(function(el) { el.classList.remove('fti-hide'); });
  btn.remove();
}

// --- 4. Worth a look: plain rules on your numbers (no AI) ---
function ftiTipsHtml(ctx, ti, te, cf) {
  var notes = [];
  try {
    var os = getDashboardOverspentCats();
    if (os.length) notes.push({ ic: 'alert-triangle', h: 15, t: os.length + (os.length > 1 ? ' categories are' : ' category is') + ' over budget.', s: 'Over by ' + fmt(os.reduce(function(a, o) { return a + o.over; }, 0)) + ' in total.' });
  } catch (e) {}
  if (ti > 0 && cf < 0) notes.push({ ic: 'trending-down', h: 15, t: 'You spent more than you earned.', s: 'Short by ' + fmt(-cf) + '.' });
  else if (ti <= 0 && te > 0) notes.push({ ic: 'info', h: 250, t: 'No income recorded for this period.', s: 'Add it for a fair health score.' });
  if (ctx.isMonth) {
    var best = null;
    ctx.cats.forEach(function(c) {
      var p = ctx.prevCats[c.n] || 0, up = c.a - p;
      if (p > 0 && up / p >= 0.1 && up >= Math.max(1, te * 0.02) && (!best || up > best.up)) best = { n: c.n, a: c.a, p: p, up: up };
    });
    if (best) notes.push({ ic: 'trending-up', h: 75, t: ftEsc(best.n) + ' is up ' + Math.round(best.up / best.p * 100) + '% on ' + ctx.prevName + '.', s: fmtD(best.a) + ' against ' + fmtD(best.p) + '.' });
  }
  var r = FTI.health && FTI.health.reserve;
  if (r && r.months < 6) notes.push({ ic: 'shield', h: 162, t: 'Your reserve lasts ' + r.months.toFixed(1) + ' months.', s: 'Six is the target. About ' + fmtD(Math.max(0, r.avgExp * 6 - r.liquid)) + ' to go.' });
  var px = TXN.filter(function(tx) { if (tx.t !== 'Expense') return false; var d = new Date(tx.d); return d.getFullYear() === ctx.year && (!ctx.isMonth || d.getMonth() === +ctx.mf); });
  if (px.length) {
    var b = px.reduce(function(m, tx) { return tx.a > m.a ? tx : m; }, px[0]), bd = new Date(b.d);
    notes.push({ ic: 'receipt', h: 275, t: 'Biggest single spend: ' + ftEsc(b.dt || b.c) + '.', s: fmt(b.a) + ' on ' + bd.getDate() + ' ' + FTI_M[bd.getMonth()] + '.' });
  }
  var html = '<section class="fti-card"><div class="fti-h"><h3>Worth a look</h3></div><div class="fti-sub">Rules run on your numbers. No AI.</div>';
  if (!notes.length) return html + '<div class="fti-empty">Nothing stands out this period.</div></section>';
  return html + notes.slice(0, 3).map(function(n) {
    return '<div class="fti-tip"><span class="fti-ico" style="background:oklch(0.7 0.14 ' + n.h + ' / 0.16);color:oklch(0.72 0.14 ' + n.h + ')"><i data-lucide="' + n.ic + '" width="18" height="18"></i></span><p>' + n.t + '<span class="ft-amt">' + n.s + '</span></p></div>';
  }).join('') + '</section>';
}

// --- after render: score count-up + chart scrubbing ---
function ftiMount(animate) {
  if (!document.querySelector('.fti')) return;
  if (FTI.trend) {
    ftiTrendAt(null);
    var svg = document.getElementById('ftiTrendSvg');
    if (svg && !svg._ftiBound) {
      svg._ftiBound = true;
      var at = function(e) {
        var T = FTI.trend; if (!T) return;
        var r = svg.getBoundingClientRect(), n = T.months.length;
        var x = (e.clientX - r.left) / r.width * FTI_W;
        var k = Math.round((x - FTI_PX) / ((FTI_W - FTI_PX * 2) / Math.max(1, n - 1)));
        ftiTrendAt(Math.max(0, Math.min(n - 1, k)));
      };
      svg.addEventListener('pointerdown', at);
      svg.addEventListener('pointermove', function(e) { if (e.pointerType === 'mouse' || e.buttons) at(e); });
      svg.addEventListener('pointerleave', function(e) { if (e.pointerType === 'mouse') ftiTrendAt(null); });
    }
  }
  var num = document.getElementById('ftiNum');
  if (num && num.getAttribute('data-count')) {
    var to = +num.getAttribute('data-to'), t0 = null;
    num.removeAttribute('data-count');
    var step = function(t) {
      if (!num.isConnected) return;
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / 1200);
      num.textContent = String(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    setTimeout(function() { if (num.isConnected) num.textContent = String(to); }, 1600);
  }
}

function ftiEnsureCss() {
  if (document.getElementById('fti-css')) return;
  var st = document.createElement('style');
  st.id = 'fti-css';
  st.textContent = [
    '.fti{display:flex;flex-direction:column;gap:12px}',
    '.fti-card{background:var(--bg-card);border:1px solid var(--border);border-radius:14px;padding:16px}',
    '.fti-h{display:flex;align-items:baseline;justify-content:space-between;gap:10px}',
    '.fti-h h3{margin:0;font-size:16px;font-weight:700;letter-spacing:-.01em;color:var(--text-primary)}',
    '.fti-h>span{font-size:13px;font-weight:500;color:var(--text-tertiary)}',
    '.fti-sub{margin-top:2px;font-size:13px;color:var(--text-secondary)}',
    '.fti-empty{padding:18px 0 4px;font-size:13px;text-align:center;color:var(--text-tertiary)}',
    '.fti-ring{position:relative;width:220px;height:220px;margin:10px auto 4px}',
    '.fti-ring svg{display:block;width:100%;height:100%;overflow:visible}',
    '.fti-seg{cursor:pointer;transition:opacity .25s}',
    '.fti-ring svg.has-sel .fti-seg:not(.sel){opacity:.3}',
    '.fti-track,.fti-fill,.fti-glow,.fti-hit{fill:none;stroke-width:17}',
    '.fti-track{stroke:var(--border)}',
    '.fti-fill{stroke-dasharray:1;stroke-dashoffset:0;animation:ftiDraw .75s cubic-bezier(.22,1,.36,1) backwards}',
    '.fti-glow{stroke:var(--amber);opacity:.14;animation:ftiBreathe 2.8s ease-in-out infinite}',
    '.fti-hit{stroke:transparent;stroke-width:34}',
    '@keyframes ftiDraw{from{stroke-dashoffset:1}}',
    '@keyframes ftiBreathe{0%,100%{opacity:.06}50%{opacity:.26}}',
    '@keyframes ftiFade{from{opacity:0}}',
    '.fti-ring-c{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;pointer-events:none}',
    '.fti-num{font-size:56px;font-weight:800;line-height:1;letter-spacing:-.04em;font-variant-numeric:tabular-nums;color:var(--text-primary)}',
    '.fti-lbl{margin-top:6px;font-size:15px;font-weight:700}',
    '.fti-delta{margin-top:2px;font-size:13px;color:var(--text-secondary)}',
    '.fti-lever{display:flex;align-items:center;gap:10px;width:100%;margin:8px 0 4px;padding:11px 13px;border:0;border-radius:12px;font:inherit;font-size:14px;line-height:1.35;text-align:left;color:var(--text-primary);cursor:pointer;background:rgba(245,158,11,.1);background:color-mix(in srgb,var(--amber) 11%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--amber) 26%,transparent)}',
    '.fti-lever b{font-weight:700;color:var(--text-primary)}',
    '.fti-lever svg{flex-shrink:0;color:var(--amber)}',
    '.fti-lever-ok{cursor:default;background:rgba(16,185,129,.1);background:color-mix(in srgb,var(--emerald) 11%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--emerald) 26%,transparent)}',
    '.fti-lever-ok svg{color:var(--emerald)}',
    '.fti-row{display:grid;grid-template-columns:10px 1fr auto 16px;align-items:center;gap:12px;width:100%;padding:11px 2px;border:0;border-top:1px solid var(--border);background:none;font:inherit;text-align:left;color:var(--text-primary);cursor:pointer}',
    '.fti-factors>.fti-row:first-child{border-top:0}',
    '.fti-dot{width:10px;height:10px;border-radius:3px}',
    '.fti-name{min-width:0;font-size:15px;font-weight:600;color:var(--text-primary)}',
    '.fti-meta{display:block;margin-top:1px;font-size:13px;font-weight:400;color:var(--text-secondary)}',
    '.fti-meta em{font-style:normal;font-weight:600;color:var(--text-primary)}',
    '.fti-pts{font-size:15px;font-weight:700;font-variant-numeric:tabular-nums}',
    '.fti-pts span{font-weight:500;color:var(--text-tertiary)}',
    '.fti-chev{display:flex;color:var(--text-tertiary);transition:transform .25s}',
    '.fti-row[aria-expanded="true"] .fti-chev{transform:rotate(90deg)}',
    '.fti-why{display:grid;grid-template-rows:0fr;transition:grid-template-rows .25s ease}',
    '.fti-why.open{grid-template-rows:1fr}',
    '.fti-why>div{overflow:hidden}',
    '.fti-why p{margin:0 0 10px 22px;padding:9px 11px;border-radius:10px;background:var(--bg-primary);font-size:14px;line-height:1.45;color:var(--text-secondary)}',
    '.fti-seg3{display:grid;grid-template-columns:repeat(3,1fr);padding:3px;margin:12px 0 14px;border-radius:11px;background:var(--bg-primary)}',
    '.fti-seg3 button{height:34px;border:0;border-radius:9px;background:none;font:inherit;font-size:13px;font-weight:600;color:var(--text-tertiary);cursor:pointer;transition:background .2s,color .2s}',
    '.fti-seg3 button.on{background:var(--bg-card);color:var(--text-primary);box-shadow:0 1px 3px rgba(0,0,0,.18)}',
    '.fti-ro-top{display:flex;justify-content:space-between;gap:10px;font-size:13px;color:var(--text-secondary)}',
    '.fti-ro-val{margin-top:3px;font-size:28px;font-weight:800;line-height:1.1;letter-spacing:-.03em;font-variant-numeric:tabular-nums;color:var(--text-primary)}',
    '.fti-ro-chg{margin-top:2px;font-size:13px;font-weight:600}',
    '.fti-chart{display:block;width:100%;height:auto;margin-top:8px;touch-action:pan-y;cursor:crosshair;-webkit-user-select:none;user-select:none}',
    '.fti-base{stroke:var(--border)}',
    '.fti-area{animation:ftiFade .6s ease .5s backwards}',
    '.fti-line{fill:none;stroke:currentColor;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:0;animation:ftiDraw 1s ease-in-out .15s backwards}',
    '.fti-still .fti-line:not(.fti-anim),.fti-still .fti-area,.fti-still .fti-fill{animation:none}',
    '.fti-guide{stroke:var(--text-tertiary);stroke-dasharray:3 4}',
    '.fti-pt{fill:var(--bg-card);stroke:currentColor;stroke-width:2.6}',
    '.fti-tick{font-size:11px;font-family:inherit;fill:var(--text-tertiary)}',
    '.fti-tick.on{font-weight:600;fill:var(--text-primary)}',
    '.fti-bar{display:flex;gap:3px;height:10px;margin:14px 0 4px}',
    '.fti-bar div{flex-basis:0;min-width:3px;border-radius:3px}',
    '.fti-cat,.fti-tip{display:grid;grid-template-columns:34px 1fr auto;gap:12px;align-items:center;padding:10px 0;border-top:1px solid var(--border)}',
    '.fti-tip{grid-template-columns:34px 1fr;align-items:start}',
    '.fti-bar+.fti-cat,.fti-sub+.fti-tip{border-top:0}',
    '.fti-sub+.fti-tip{padding-top:14px}',
    '.fti-ico{display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:10px;font-size:17px}',
    '.fti-amt{text-align:right;font-size:15px;font-weight:700;font-variant-numeric:tabular-nums;color:var(--text-primary)}',
    '.fti-chg{display:block;margin-top:1px;font-size:13px;font-weight:600}',
    '.fti-up{color:var(--rose)}.fti-down{color:var(--emerald)}.fti-same{color:var(--text-tertiary)}',
    '.fti-hide{display:none}',
    '.fti-more{width:100%;margin-top:4px;padding:10px;border:0;border-radius:10px;background:var(--bg-primary);font:inherit;font-size:13px;font-weight:600;color:var(--text-secondary);cursor:pointer}',
    '.fti-note{display:flex;align-items:flex-start;gap:8px;margin-top:10px;padding:10px 12px;border-radius:10px;background:var(--bg-primary);font-size:13px;line-height:1.4;color:var(--text-secondary)}',
    '.fti-note svg{flex-shrink:0;margin-top:1px;color:var(--blue)}',
    '.fti-tip p{margin:0;font-size:15px;font-weight:600;line-height:1.35;color:var(--text-primary)}',
    '.fti-tip p span{display:block;margin-top:2px;font-size:13px;font-weight:400;color:var(--text-secondary)}',
    '@media (prefers-reduced-motion:reduce){.fti-fill,.fti-line,.fti-area,.fti-glow{animation:none}.fti-why,.fti-chev{transition:none}}'
  ].join('\n');
  document.head.appendChild(st);
}

// === V1.0.0: FINANCIAL HEALTH CALCULATION (CFP Board Standard) ===
// Liquidity tiers by account type
const LIQUIDITY_HIGH = ['Cash', 'Savings Account', 'Digital Wallet', 'Current Account'];
const LIQUIDITY_MID = ['Credit/Debit Card'];
const LIQUIDITY_LOW = ['Investment Account'];

function getHighLiquidityAssets() {
  return ACCOUNTS.filter(a => a.type === 'asset' && LIQUIDITY_HIGH.includes(a.accountType))
    .reduce((s, a) => s + convertFromTo(getAccountBalance(a.id), a.currency || FT_BASE, FT_BASE), 0);
}

function computeFinancialHealth(ti, te, ts, cf, budgetUsed, periodBudget, year, mf) {
  const metrics = [];
  const HOUSING_KEYWORDS = ['mortgage','rent','sewa','rumah','pinjaman rumah','kediaman','perumahan','kontrakan','cicilan rumah'];
  const LOAN_KEYWORDS = ['loan','debt','instalment','installment','pinjaman','hutang','ansuran','cicilan','ptptn','motor','car','kereta','personal loan'];

  function matchesKeywords(text, keywords) {
    if (!text) return false;
    const lower = text.toLowerCase().trim();
    return keywords.some(kw => lower.includes(kw) || lower === kw);
  }

  const monthlyIncome = ti > 0 ? ti : 1;
  const yearData = computeMonthlyData(year);
  const periodTxns = TXN.filter(tx => { const d = new Date(tx.d); if (d.getFullYear() !== year) return false; if (mf !== 'total' && d.getMonth() !== +mf) return false; return true; });
  const periodExpenses = periodTxns.filter(tx => tx.t === 'Expense');

  // 1. SAVINGS (20%): (income - expense) / income. V2.0.5: transfers no longer count (ts = ti - te)
  const savRate = ti > 0 ? (ts / ti * 100) : 0;
  const savScore = Math.min(100, Math.max(0, savRate / 20 * 100));
  metrics.push({ label: 'Savings', value: savRate.toFixed(0) + '%', target: '≥20%', color: savRate >= 20 ? 'var(--emerald)' : savRate >= 10 ? 'var(--amber)' : 'var(--rose)' });

  // 2. HOUSING (15%): Mortgage liability OR Loan with sub mortgage/rent
  let housingExpense = 0;
  periodExpenses.forEach(tx => {
    if (tx.liab) { const la = ACCOUNTS.find(a => a.id === tx.liab); if (la && (la.accountType === 'Mortgage' || matchesKeywords(la.name, HOUSING_KEYWORDS))) { housingExpense += tx.a; return; } }
    if (matchesKeywords(tx.s, ['mortgage','rent','sewa','rumah'])) { housingExpense += tx.a; }
    else if (matchesKeywords(tx.c, ['rent','sewa','housing','rumah'])) { housingExpense += tx.a; }
  });
  const housingRatio = ti > 0 ? (housingExpense / monthlyIncome * 100) : 0;
  const housingScore = housingRatio <= 28 ? 100 : housingRatio >= 40 ? 0 : Math.round((40 - housingRatio) / 12 * 100);
  metrics.push({ label: 'Housing', value: housingRatio.toFixed(0) + '%', target: '≤28%', color: housingRatio <= 28 ? 'var(--emerald)' : housingRatio <= 35 ? 'var(--amber)' : 'var(--rose)' });

  // 3. DEBT (20%): all Loan expenses (linked to liability OR loan category)
  let debtPayments = 0;
  periodExpenses.forEach(tx => {
    if (tx.liab) { debtPayments += tx.a; return; }
    if (matchesKeywords(tx.c, LOAN_KEYWORDS) || matchesKeywords(tx.s, LOAN_KEYWORDS)) {
      if (!matchesKeywords(tx.s, ['mortgage','rent','sewa','rumah']) && !matchesKeywords(tx.c, ['rent','sewa','housing','rumah'])) { debtPayments += tx.a; }
    }
  });
  const debtRatio = ti > 0 ? (debtPayments / monthlyIncome * 100) : 0;
  const debtScoreFinal = debtRatio <= 20 ? 100 : debtRatio <= 36 ? Math.round(100 - (debtRatio - 20) / 16 * 50) : debtRatio <= 50 ? Math.round(50 - (debtRatio - 36) / 14 * 50) : 0;
  metrics.push({ label: 'Debt', value: debtRatio.toFixed(0) + '%', target: '<36%', color: debtRatio < 36 ? 'var(--emerald)' : debtRatio <= 43 ? 'var(--amber)' : 'var(--rose)' });

  // 4. RESERVE (15%): HIGH liquidity only (Cash, Savings Account, Digital Wallet) / avg monthly expense
  const highLiquid = getHighLiquidityAssets();
  const avgMonthExp = (() => { const m = yearData.filter(m => m.e > 0); return m.length ? m.reduce((s, x) => s + x.e, 0) / m.length : te || 1; })();
  const reserveMonths = avgMonthExp > 0 ? highLiquid / avgMonthExp : 0;
  const liquidityScore = reserveMonths >= 6 ? 100 : reserveMonths >= 3 ? Math.round(60 + (reserveMonths - 3) / 3 * 40) : Math.round(reserveMonths / 3 * 60);
  metrics.push({ label: 'Reserve', value: reserveMonths.toFixed(1) + 'mo', target: '≥6mo', color: reserveMonths >= 6 ? 'var(--emerald)' : reserveMonths >= 3 ? 'var(--amber)' : 'var(--rose)' });

  // 5. CASH FLOW (15%): Month = avg daily expense / daily income. Year = avg monthly expense / monthly income
  let cfRatio = 0;
  if (mf !== 'total') {
    const dim = new Date(year, +mf + 1, 0).getDate();
    cfRatio = ti > 0 ? ((te / dim) / (ti / dim) * 100) : 100;
  } else {
    const active = yearData.filter(m => m.i > 0 || m.e > 0).length || 1;
    cfRatio = ti > 0 ? ((te / active) / (ti / active) * 100) : 100;
  }
  const cfScore = cfRatio <= 50 ? 100 : cfRatio <= 75 ? Math.round(100 - (cfRatio - 50) / 25 * 50) : cfRatio <= 100 ? Math.round(50 - (cfRatio - 75) / 25 * 50) : 0;
  metrics.push({ label: 'Cash Flow', value: cfRatio.toFixed(0) + '%', target: '<75%', color: cfRatio < 75 ? 'var(--emerald)' : cfRatio <= 90 ? 'var(--amber)' : 'var(--rose)' });

  // 6. NET WORTH GROWTH (15%)
  // V2.0.6: January now compares with December of last year (it used the whole-year number by mistake)
  let nwGrowthPct = 0, nwDelta = 0;
  if (mf !== 'total') {
    const cur = getNetWorthByPeriod(year, mf), prev = +mf > 0 ? getNetWorthByPeriod(year, String(+mf - 1)) : getNetWorthByPeriod(year - 1, '11');
    nwDelta = cur - prev;
    nwGrowthPct = prev !== 0 ? ((cur - prev) / Math.abs(prev) * 100) : (cur > 0 ? 100 : 0);
  } else {
    const am = yearData.filter(m => m.i > 0 || m.e > 0);
    if (am.length >= 2) { const fi = yearData.indexOf(am[0]), li = yearData.indexOf(am[am.length-1]); const f = getNetWorthByPeriod(year, String(fi)), l = getNetWorthByPeriod(year, String(li)); nwDelta = l - f; nwGrowthPct = f !== 0 ? ((l - f) / Math.abs(f) * 100) : (l > 0 ? 100 : 0); }
  }
  const nwScore = nwGrowthPct >= 5 ? 100 : nwGrowthPct >= 0 ? Math.round(50 + nwGrowthPct / 5 * 50) : Math.max(0, Math.round(50 + nwGrowthPct / 10 * 50));
  metrics.push({ label: 'Growth', value: (nwGrowthPct >= 0 ? '+' : '') + nwGrowthPct.toFixed(1) + '%', target: 'Positive', color: nwGrowthPct > 0 ? 'var(--emerald)' : nwGrowthPct === 0 ? 'var(--amber)' : 'var(--rose)' });

  // WEIGHTED SCORE
  const weights = [0.20, 0.15, 0.20, 0.15, 0.15, 0.15];
  const scores = [savScore, housingScore, debtScoreFinal, liquidityScore, cfScore, nwScore];
  const rawScore = scores.reduce((sum, s, i) => sum + s * weights[i], 0);
  const finalScore = Math.round(rawScore);
  const label = finalScore >= 90 ? 'Excellent' : finalScore >= 75 ? 'Good' : finalScore >= 60 ? 'Fair' : finalScore >= 40 ? 'Needs Work' : 'Critical';

  // V2.0.6: the "why" behind each part (mobile Insights shows it; nothing else changes)
  const pc = n => Math.round(n) + '%';
  const sg = n => (n >= 0 ? '+' : '-') + fmt(Math.abs(n));
  const why = [
    ti <= 0 ? 'No income recorded for this period, so there is nothing to save from yet.'
      : ts < 0 ? 'You spent ' + fmt(-ts) + ' more than you earned. 20% saved or more = full marks.'
      : 'You kept ' + fmt(ts) + ' of ' + fmt(ti) + '. 20% saved or more = full marks.',
    housingExpense <= 0 ? 'No rent or mortgage found for this period, so full marks.'
      : 'Housing ' + fmt(housingExpense) + ' is ' + pc(housingRatio) + ' of income. 28% or less = full marks.',
    debtPayments <= 0 ? 'No loan payments found for this period, so full marks.'
      : 'Loan payments ' + fmt(debtPayments) + ' are ' + pc(debtRatio) + ' of income. 20% or less = full marks.',
    reserveMonths >= 6 ? 'Cash and savings ' + fmt(highLiquid) + ' cover ' + reserveMonths.toFixed(1) + ' months of spending. Full marks.'
      : 'Cash and savings ' + fmt(highLiquid) + ' cover ' + reserveMonths.toFixed(1) + ' months of spending. 6 months (about ' + fmtD(avgMonthExp * 6) + ') = full marks.',
    ti <= 0 ? 'No income recorded, so this part scores zero.'
      : 'You spent ' + pc(cfRatio) + ' of what came in. 50% or less = full marks.',
    'Net worth ' + (mf === 'total' ? 'this year: ' : 'this month: ') + sg(nwDelta) + '. +5% = full marks.'
  ];
  const meta = [
    ['savings', 'Savings', savRate.toFixed(0) + '%', '20%+'],
    ['housing', 'Housing', housingRatio.toFixed(0) + '%', '28% or less'],
    ['debt', 'Debt', debtRatio.toFixed(0) + '%', '20% or less'],
    ['reserve', 'Reserve', reserveMonths.toFixed(1) + ' months', '6 months'],
    ['cashflow', 'Cash flow', cfRatio.toFixed(0) + '% spent', '50% or less'],
    ['growth', 'Growth', (nwGrowthPct >= 0 ? '+' : '') + nwGrowthPct.toFixed(1) + '%', '+5%']
  ];
  const factors = meta.map((m, i) => ({ id: m[0], name: m[1], value: m[2], aim: m[3], weight: Math.round(weights[i] * 100), score: scores[i], pts: Math.round(scores[i] * weights[i] * 10) / 10, why: why[i] }));
  return { score: Math.min(100, Math.max(0, finalScore)), label, metrics, factors, raw: rawScore, reserve: { months: reserveMonths, liquid: highLiquid, avgExp: avgMonthExp } };
}

// === V1.0.0: DYNAMIC AI INSIGHTS ===
function buildDynamicAIInsights(yearData, year, mf, ti, te, ts, cf, expCats, periodBudget) {
  const insights = [];
  const monthName = mf !== 'total' ? MONTH_NAMES[+mf] : year;

  // Highest spending category
  if (expCats.length) {
    const top = expCats[0];
    const pct = te > 0 ? (top.a / te * 100).toFixed(0) : 0;
    insights.push({ icon: '📍', text: `<b>${ftEsc(top.n)}</b> is your biggest expense (${pct}% of total). ${+pct > 40 ? 'Consider diversifying spending.' : 'Distribution looks balanced.'}` });
  }

  // Largest single transaction
  const periodTxns = TXN.filter(tx => { const d = new Date(tx.d); if (d.getFullYear() !== year) return false; if (mf !== 'total' && d.getMonth() !== +mf) return false; return tx.t === 'Expense'; });
  if (periodTxns.length) {
    const biggest = periodTxns.reduce((max, tx) => tx.a > max.a ? tx : max, periodTxns[0]);
    insights.push({ icon: '💳', text: `Largest expense: <b>${ftEsc(biggest.dt || biggest.c)}</b> (${fmtD(biggest.a)}) on ${new Date(biggest.d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}.` });
  }

  // Budget warnings
  const overspent = getDashboardOverspentCats();
  const budgetUsed = periodBudget > 0 ? (te / periodBudget * 100).toFixed(0) : 0;
  if (overspent.length) {
    insights.push({ icon: '⚠️', text: `<b>${overspent.length} categor${overspent.length > 1 ? 'ies' : 'y'}</b> over budget. Total overspend: ${fmt(overspent.reduce((s, o) => s + o.over, 0))}.` });
  } else if (+budgetUsed <= 70 && periodBudget > 0) {
    insights.push({ icon: '✅', text: `Budget under control at <b>${budgetUsed}%</b> used. Well managed!` });
  }

  // Savings insight
  const savRate = ti > 0 ? (ts / ti * 100).toFixed(0) : 0;
  if (+savRate >= 30) insights.push({ icon: '🏆', text: `Savings rate is <b>${savRate}%</b>. Excellent discipline!` });
  else if (+savRate >= 20) insights.push({ icon: '👍', text: `Savings rate: <b>${savRate}%</b>. Meeting the recommended 20% target.` });
  else if (+savRate > 0) insights.push({ icon: '💡', text: `Savings rate: <b>${savRate}%</b>. Aim for 20%+ to build faster.` });
  else if (ti > 0) insights.push({ icon: '🔴', text: `No savings this period. Try to keep at least 20% of income.` });

  // Cash flow trend (V2.0.5: cf = income - expense, transfers are not spending)
  if (cf < 0) insights.push({ icon: '📉', text: `Negative cash flow of <b>${fmt(Math.abs(cf))}</b>. Spending exceeds income.` });
  else if (cf > ti * 0.3) insights.push({ icon: '🚀', text: `Strong positive cash flow: <b>${fmt(cf)}</b>. Consider investing the surplus.` });

  // Expense vs prev month comparison
  if (mf !== 'total' && +mf > 0) {
    const prevE = yearData[+mf - 1].e;
    if (prevE > 0) {
      const change = ((te - prevE) / prevE * 100).toFixed(0);
      if (+change > 15) insights.push({ icon: '📈', text: `Expenses up <b>${change}%</b> vs ${MONTH_NAMES[+mf - 1]}. Check for one-off or recurring increases.` });
      else if (+change < -10) insights.push({ icon: '📉', text: `Expenses down <b>${Math.abs(change)}%</b> vs ${MONTH_NAMES[+mf - 1]}. Great cost control!` });
    }
  }

  if (!insights.length) insights.push({ icon: '🤖', text: `Your finances for <b>${monthName}</b> look stable. Keep tracking consistently.` });

  return `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:14px">
    <div style="font-size:12px;font-weight:700;margin-bottom:10px">🤖 AI Insights</div>
    <div style="display:flex;flex-direction:column;gap:8px">
      ${insights.slice(0, 6).map(i => `<div style="display:flex;align-items:flex-start;gap:8px;font-size:11px;line-height:1.6;color:var(--text-secondary)"><span style="font-size:13px;flex-shrink:0">${i.icon}</span><span class="ft-amt">${i.text}</span></div>`).join('')}
    </div>
  </div>`;
}
