// === DASHBOARD (FinTrack Premium V1.0.0) ===
function renderDashboard(c) {
  const year = getSelectedYear();

  // v15.8.1: Mobile gets stripped-down dashboard (unless user forced desktop view)
  const forceDesktop = localStorage.getItem('ft_desktop_mode') === 'true';
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
  const nw = getNetWorthByPeriod(year, mf), cf = ti - ts - te;
  const bal = getCarryForwardBalance(year, mf);
  const ffm = getFinancialFreedomMonths(year, mf);
  const budgetTotal = getYearlyBudgetTotal(year);
  // Use selected month's budget when a month is selected
  const periodBudget = mf !== 'total' ? getMonthlyBudget(year, +mf) : budgetTotal;
  const bl = periodBudget - te;
  const savRate = ti > 0 ? (ts / ti * 100).toFixed(0) : 0;

  // Pre-compute sparkline series
  const balSpark = computeBalanceSeries(year);
  const nwSpark = (() => {
    const monthly = Array(12).fill(0);
    TXN.forEach(tx => {
      const d = new Date(tx.d);
      if (d.getFullYear() === year) {
        const mi = d.getMonth();
        if (tx.t === 'Income') monthly[mi] += tx.a;
        else if (tx.t === 'Expense') monthly[mi] -= tx.a;
        else if (tx.t === 'Savings') monthly[mi] -= tx.a;
      }
    });
    const liabTotal = ACCOUNTS.filter(a => a.type === 'liability').reduce((s, a) => s + Math.abs(a.initialBalance), 0);
    const base = INITIAL_DEPOSIT - liabTotal;
    const priorYears = TXN.filter(tx => new Date(tx.d).getFullYear() < year).reduce((s, tx) => {
      if (tx.t === 'Income') return s + tx.a;
      if (tx.t === 'Expense') return s - tx.a;
      if (tx.t === 'Savings') return s - tx.a;
      return s;
    }, 0);
    let cumulative = base + priorYears;
    return monthly.map(v => { cumulative += v; return cumulative; });
  })();
  const series = {
    networth: nwSpark,
    balance: balSpark,
    income: yearData.map(m => m.i),
    expense: yearData.map(m => m.e),
    savings: yearData.map(m => m.s),
    cashflow: yearData.map(m => m.i - m.s - m.e)
  };

  function buildSparkSeries() {
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    if (mf === 'total') {
      return { labels: monthNames, networth: yearData.map((m, i) => getNetWorthByPeriod(year, String(i))), balance: balSpark, income: yearData.map(m => m.i), expense: yearData.map(m => m.e), savings: yearData.map(m => m.s), cashflow: yearData.map(m => m.i - m.s - m.e) };
    }
    const mi = +mf, daysInMonth = new Date(year, mi + 1, 0).getDate();
    const lbls = [], iArr = [], eArr = [], sArr = [], cfArr = [], nwArr = [];
    let cI = 0, cE = 0, cS = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      lbls.push(d + ' ' + monthNames[mi]);
      const ds = `${year}-${String(mi + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dt = TXN.filter(t => t.d === ds);
      cI += dt.filter(t => t.t === 'Income').reduce((a, t) => a + t.a, 0);
      cE += dt.filter(t => t.t === 'Expense').reduce((a, t) => a + t.a, 0);
      cS += dt.filter(t => t.t === 'Savings').reduce((a, t) => a + t.a, 0);
      iArr.push(cI); eArr.push(cE); sArr.push(cS);
      cfArr.push(cI - cS - cE); nwArr.push(cI - cE);
    }
    return { labels: lbls, networth: nwArr, balance: balSpark, income: iArr, expense: eArr, savings: sArr, cashflow: cfArr };
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
    { l: t('dash_savings'), v: (ts < 0 ? '-' : '') + fmt(ts), cl: 'pk', ic: 'piggy-bank', s: series.savings, exp: false },
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
    overspentBannerHtml = `<div class="dash-overspent-banner"><div class="dash-overspent-header"><div class="dash-overspent-title"><i data-lucide="alert-triangle" width="14" height="14" style="color:var(--rose)"></i> <span>${dashOverspent.length} categor${dashOverspent.length > 1 ? 'ies' : 'y'} over budget</span></div><span style="font-size:10px;color:var(--text-tertiary)">${overspentMonthLabel}</span></div><div class="dash-overspent-items">${dashOverspent.map(item => `<div class="dash-overspent-item"><span class="dash-overspent-emoji">${item.emoji}</span><span class="dash-overspent-cat">${item.cat}</span><span class="dash-overspent-over">-${fmt(item.over)} over</span><button class="btn bp dash-overspent-btn" data-cover-cat="${item.cat.replace(/"/g,'"')}" data-cover-over="${item.over}" data-cover-year="${item.year}" data-cover-month="${item.month}"><i data-lucide="arrow-right-left" width="11" height="11"></i> Cover</button></div>`).join('')}</div></div>`;
  }

  // === BUILD HTML ===
  c.innerHTML = `<div class="kg" style="margin-bottom:14px"><div class="kc em"><div class="kc-left"><div class="kc-hdr"><div class="ki"><i data-lucide="landmark" width="13" height="13"></i></div><div class="kl">${t('dash_net_worth')}</div></div><div class="kv">${fmt(nw)}</div><div class="kt ${nwTrend.noData ? 'neutral' : (nwTrend.pos ? 'pos' : 'neg')}"><span class="kt-chg">${nwTrend.label}</span></div></div><div class="kc-spark"><canvas id="heroSpark" height="36"></canvas></div></div>${cards.map((k, i) => { const tr = calcTrend(k.s, k.exp); return `<div class="kc ${k.cl}"><div class="kc-left"><div class="kc-hdr"><div class="ki"><i data-lucide="${k.ic}" width="13" height="13"></i></div><div class="kl">${k.l}</div></div><div class="kv">${k.v}</div><div class="kt ${tr.noData ? 'neutral' : (tr.pos ? 'pos' : 'neg')}"><span class="kt-chg">${tr.label}</span></div></div><div class="kc-spark"><canvas id="sp${i}" height="36"></canvas></div></div>`; }).join('')}</div>
${overspentBannerHtml}
${safeBuildForecastHtml('desktop')}
<div class="ib" style="margin-bottom:14px">${generateDashInsights(yearData, EC, ti, te, ts, nw, cf, year, mf)}</div>
<div style="display:grid;grid-template-columns:1.6fr 1fr;gap:14px;margin-bottom:14px"><div class="cc"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><div><div class="ct">${t('dash_income_expense_savings')}</div><div class="cs">${t('dash_monthly_trend')}</div></div><div class="seg" id="dc1tog"><button class="bm active" data-ct="line">${t('misc_line')}</button><button class="bm" data-ct="bar">${t('misc_bar')}</button></div></div><div style="height:240px"><canvas id="dc1"></canvas></div></div><div class="cc"><div class="ct">${t('dash_expense_breakdown')}</div><div class="cs">${t('dash_by_category')}</div><div id="expDoughnutWrap" style="height:240px;display:flex;align-items:center;justify-content:center">${expCats.length ? '<canvas id="expDoughnut"></canvas>' : '<div style="color:var(--text-tertiary);font-size:12px">' + t('misc_no_data') + '</div>'}</div></div></div>
<div style="display:grid;grid-template-columns:1.4fr 1fr;gap:14px"><div class="cc"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><div><div class="ct">${t('dash_budget_vs_cf')}</div><div class="cs">${mf === 'total' ? t('hdr_total_year') : MONTH_NAMES[+mf] + ' ' + year}</div></div></div><div style="height:220px"><canvas id="bchart"></canvas></div></div><div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:14px 16px;overflow:hidden"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><div style="font-size:13px;font-weight:700">${t('dash_bank_accounts')}</div><div style="font-size:11px;font-weight:700;color:var(--emerald);font-feature-settings:'tnum'">${fmt(totalAssets)}</div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">${banks.map(b => `<div class="bank-card" style="padding:8px 10px"><div class="bank-top" style="margin-bottom:3px"><div class="bank-badge ${b.cls}" style="width:22px;height:22px;font-size:7px;border-radius:5px">${b.tag}</div><div class="bank-info"><div class="bank-name" style="font-size:10px">${b.name}</div></div></div><div class="bank-balance" style="font-size:12px">${fmt(b.balance)}</div></div>`).join('')}</div></div></div>`;
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
      new Chart(heroCtx, { type: 'line', data: { labels: spSeries.labels, datasets: [{ data: heroData, borderColor: '#10b981', borderWidth: 1.8, tension: .4, pointRadius: 0, pointHoverRadius: 4, pointHoverBackgroundColor: '#10b981', pointHoverBorderColor: dk ? '#1e1e2e' : '#fff', pointHoverBorderWidth: 2, fill: true, backgroundColor: heroGrad }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: true, mode: 'index', intersect: false, callbacks: { title: ctx => String(spSeries.labels[ctx[0].dataIndex]), label: c2 => fmt(c2.raw) }, bodyFont: { size: 10 }, titleFont: { size: 9, weight: '600' }, padding: 6, displayColors: false, backgroundColor: dk ? 'rgba(30,30,46,0.95)' : 'rgba(255,255,255,0.95)', titleColor: dk ? '#e0e0e0' : '#333', bodyColor: dk ? '#b0b0b0' : '#555', borderColor: dk ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', borderWidth: 1, cornerRadius: 6 } }, scales: { x: { display: false }, y: { display: false } }, animation: { duration: 300, easing: 'easeOutQuart' }, interaction: { mode: 'index', intersect: false }, onHover: (evt, elements, chart) => { chart.data.datasets[0].borderWidth = elements.length ? 2.8 : 1.8; chart.update('none'); } } });
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
      new Chart(spCtx, { type: 'line', data: { labels: spSeries.labels, datasets: [{ data: sparkData, borderColor: col, borderWidth: 1.8, tension: .4, pointRadius: 0, pointHoverRadius: 4, pointHoverBackgroundColor: col, pointHoverBorderColor: dk ? '#1e1e2e' : '#fff', pointHoverBorderWidth: 2, fill: true, backgroundColor: grad }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: true, mode: 'index', intersect: false, callbacks: { title: ctx => String(spSeries.labels[ctx[0].dataIndex]), label: c2 => fmt(c2.raw) }, bodyFont: { size: 10 }, titleFont: { size: 9, weight: '600' }, padding: 6, displayColors: false, backgroundColor: dk ? 'rgba(30,30,46,0.95)' : 'rgba(255,255,255,0.95)', titleColor: dk ? '#e0e0e0' : '#333', bodyColor: dk ? '#b0b0b0' : '#555', borderColor: dk ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', borderWidth: 1, cornerRadius: 6, caretSize: 4 } }, scales: { x: { display: false }, y: { display: false } }, animation: { duration: 300, easing: 'easeOutQuart' }, interaction: { mode: 'index', intersect: false }, onHover: (evt, elements, chart) => { chart.data.datasets[0].borderWidth = elements.length ? 2.8 : 1.8; chart.update('none'); } } });
    });

    // Main trend chart
    const savLine = yearData.map(m => m.i - m.e);
    let mainChart = null;
    function drawMainChart(chartType) {
      if (mainChart) mainChart.destroy();
      const isFill = chartType === 'line';
      mainChart = new Chart(document.getElementById('dc1'), { type: chartType, data: { labels: mns, datasets: [{ label: 'Income', data: yearData.map(m => m.i), borderColor: '#10b981', backgroundColor: chartType === 'bar' ? 'rgba(16,185,129,0.75)' : 'rgba(16,185,129,0.08)', fill: isFill, tension: .4, pointRadius: chartType === 'bar' ? 0 : 3, borderWidth: chartType === 'bar' ? 0 : 2.5, borderRadius: chartType === 'bar' ? 6 : 0 }, { label: 'Expense', data: yearData.map(m => m.e), borderColor: '#f43f5e', backgroundColor: chartType === 'bar' ? 'rgba(244,63,94,0.75)' : 'rgba(244,63,94,0.08)', fill: isFill, tension: .4, pointRadius: chartType === 'bar' ? 0 : 3, borderWidth: chartType === 'bar' ? 0 : 2.5, borderRadius: chartType === 'bar' ? 6 : 0 }, { label: 'Savings', data: savLine, borderColor: '#3b82f6', backgroundColor: chartType === 'bar' ? 'rgba(59,130,246,0.75)' : 'rgba(59,130,246,0.08)', fill: isFill, tension: .4, pointRadius: chartType === 'bar' ? 0 : 3, borderWidth: chartType === 'bar' ? 0 : 2.5, borderRadius: chartType === 'bar' ? 6 : 0 }] }, options: { responsive: true, maintainAspectRatio: false, animation: { duration: 500, easing: 'easeOutQuart' }, plugins: { legend: { position: 'bottom', labels: { color: tc, usePointStyle: true, font: { size: 10 } } }, tooltip: { mode: 'index', intersect: false, callbacks: { label: ctx => ctx.dataset.label + ': ' + fmt(ctx.raw) } } }, scales: { x: { grid: { color: gc }, ticks: { color: tc } }, y: { grid: { color: gc }, ticks: { color: tc, callback: v => fmt(v) } } }, interaction: { intersect: false, mode: 'index' } } });
    }
    drawMainChart('line');
    document.querySelectorAll('#dc1tog .bm').forEach(btn => btn.onclick = () => { document.querySelectorAll('#dc1tog .bm').forEach(b => b.classList.remove('active')); btn.classList.add('active'); drawMainChart(btn.dataset.ct); });

    // Budget & Cash Flow chart
    const bSpend = yearData.map(m => m.e);
    const bLimit = yearData.map((m, idx) => getMonthlyBudget(year, idx));
    const bNet = yearData.map(m => m.i - m.s - m.e);
    new Chart(document.getElementById('bchart'), { data: { labels: mns, datasets: [{ type: 'bar', label: 'Budget limit', data: bLimit, backgroundColor: dk ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.12)', borderColor: 'rgba(99,102,241,0.35)', borderWidth: 1, borderRadius: 5, barThickness: 18 }, { type: 'bar', label: 'Actual spend', data: bSpend, backgroundColor: bSpend.map((v, idx) => v > bLimit[idx] ? 'rgba(244,63,94,0.8)' : 'rgba(16,185,129,0.7)'), borderRadius: 5, barThickness: 10 }, { type: 'line', label: 'Cash flow', data: bNet, borderColor: '#6366f1', borderWidth: 2.5, tension: .4, pointRadius: 3, pointBackgroundColor: '#6366f1', pointBorderColor: dk ? '#1e1e2e' : '#fff', pointBorderWidth: 2, yAxisID: 'y1', fill: false }] }, options: { responsive: true, maintainAspectRatio: false, animation: { duration: 500, easing: 'easeOutQuart' }, plugins: { legend: { position: 'bottom', labels: { color: tc, usePointStyle: true, font: { size: 10 }, padding: 12 } }, tooltip: { mode: 'index', intersect: false, backgroundColor: dk ? 'rgba(30,30,46,0.95)' : 'rgba(255,255,255,0.95)', titleColor: dk ? '#e0e0e0' : '#1a1a2e', bodyColor: dk ? '#b0b0b0' : '#555', borderColor: dk ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', borderWidth: 1, padding: 10, cornerRadius: 8, callbacks: { label: ctx => ctx.dataset.label + ': ' + fmt(ctx.raw) } } }, scales: { x: { grid: { display: false }, ticks: { color: tc, font: { size: 10 } } }, y: { grid: { color: gc, drawBorder: false }, ticks: { color: tc, font: { size: 10 }, callback: v => fmt(v), maxTicksLimit: 5 } }, y1: { position: 'right', grid: { display: false }, ticks: { color: tc, font: { size: 10 }, callback: v => fmt(v), maxTicksLimit: 5 } } } } });

    // Expense Breakdown Doughnut
    if (expCats.length) {
      const doughnutColors = ['#ef4444', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#6366f1', '#06b6d4', '#f97316', '#14b8a6', '#a855f7'];
      const totalExp = expCats.reduce((s, c) => s + c.a, 0);
      new Chart(document.getElementById('expDoughnut'), { type: 'doughnut', data: { labels: expCats.map(c => c.n), datasets: [{ data: expCats.map(c => c.a), backgroundColor: doughnutColors.slice(0, expCats.length), borderWidth: 0, hoverOffset: 6 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '62%', animation: { duration: 600, easing: 'easeOutQuart' }, plugins: { legend: { position: 'right', labels: { color: dk ? 'rgba(255,255,255,0.8)' : tc, usePointStyle: true, font: { size: 10 }, padding: 10, generateLabels: chart => chart.data.labels.map((l, i) => ({ text: `${l} (${(chart.data.datasets[0].data[i] / totalExp * 100).toFixed(0)}%)`, fillStyle: doughnutColors[i], strokeStyle: 'transparent', pointStyle: 'circle', index: i, fontColor: dk ? 'rgba(255,255,255,0.8)' : undefined })) } }, tooltip: { callbacks: { label: ctx => { const pct = totalExp > 0 ? (ctx.raw / totalExp * 100).toFixed(1) : 0; return `${ctx.label}: ${fmt(ctx.raw)} (${pct}%)`; } }, backgroundColor: dk ? 'rgba(30,30,46,0.95)' : 'rgba(255,255,255,0.95)', titleColor: dk ? '#e0e0e0' : '#1a1a2e', bodyColor: dk ? '#b0b0b0' : '#555', borderColor: dk ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', borderWidth: 1, padding: 10, cornerRadius: 8 } } } });
    }

    // Category Breakdown chart (removed)
  }, 50);
}

// === AI FINANCIAL INSIGHTS (v10.9.1 — Smart Summary) ===
function generateDashInsights(yearData, EC, ti, te, ts, nw, cf, year, mf) {
  const budgetTotal = getYearlyBudgetTotal(year);
  if (mf === 'total') {
    const savRate = ti > 0 ? (ts / ti * 100).toFixed(0) : 0;
    const budgetUsed = te > 0 ? (te / budgetTotal * 100).toFixed(0) : 0;
    const topCat = EC.length ? EC[0].n : 'N/A';
    const healthStatus = cf >= 0 ? 'healthy' : 'under pressure';
    const incTrend = yearData.filter(m => m.i > 0);
    let incChange = '';
    if (incTrend.length >= 2) {
      const recent = incTrend[incTrend.length - 1].i, prev = incTrend[incTrend.length - 2].i;
      const pct = prev > 0 ? ((recent - prev) / prev * 100).toFixed(0) : 0;
      incChange = recent >= prev ? `Income grew ${pct}% last active month.` : `Income dipped ${Math.abs(pct)}% last active month.`;
    }
    const summary = `Your ${year} financial health is <b>${healthStatus}</b>. Total income ${fmt(ti)} with expenses at ${fmt(te)} (${budgetUsed}% of budget). ${incChange} Savings rate is <b>${savRate}%</b>. Largest category: <b>${topCat}</b>. Cash flow: <b>${fmt(cf)}</b>.`;
    return `<div class="ic"><span class="ie">🤖</span><div class="ix">${summary}</div></div>`;
  } else {
    const mi = +mf;
    const curM = yearData[mi];
    const prevM = mi > 0 ? yearData[mi - 1] : null;
    const monthName = MONTH_NAMES[mi];
    const savRate = curM.i > 0 ? (curM.s / curM.i * 100).toFixed(0) : 0;
    const budgetMonthly = budgetTotal / 12;
    const budgetUsed = budgetMonthly > 0 ? (curM.e / budgetMonthly * 100).toFixed(0) : 0;
    let comparison = '';
    if (prevM && prevM.e > 0) {
      const pct = ((curM.e - prevM.e) / prevM.e * 100).toFixed(0);
      comparison = curM.e > prevM.e ? `Expenses increased ${pct}% vs ${MONTH_NAMES[mi - 1]}.` : `Expenses decreased ${Math.abs(pct)}% vs ${MONTH_NAMES[mi - 1]}.`;
    }
    const healthStatus = cf >= 0 ? 'remains healthy' : 'is under pressure';
    const summary = `Your financial performance for <b>${monthName} ${year}</b> ${healthStatus}. ${comparison} Savings rate is <b>${savRate}%</b> and ${budgetUsed}% of monthly budget utilized. Cash flow: <b>${fmt(cf)}</b>.${cf >= 0 ? ' Continue maintaining current spending habits.' : ' Consider reducing discretionary spending.'}`;
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

    const PLANS = JSON.parse(localStorage.getItem('ft_budget_plans') || '{}');

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
  return `<div class="mob-overspent-alert"><div class="mob-overspent-header"><span style="color:var(--rose);font-weight:700;font-size:12px">⚠️ Over Budget</span><span style="font-size:10px;color:var(--text-tertiary)">${monthLabel}</span></div><div class="mob-overspent-list">${items.map(item => `<div class="mob-overspent-row"><div class="mob-overspent-left"><span class="mob-overspent-emoji">${item.emoji}</span><div class="mob-overspent-info"><div class="mob-overspent-name">${item.cat}</div><div class="mob-overspent-meta">${fmt(item.spent)} / ${fmt(item.budget)}</div></div></div><div class="mob-overspent-right"><div class="mob-overspent-amt">-${fmt(item.over)}</div><button class="mob-overspent-cover" data-cover-cat="${item.cat.replace(/"/g,'"')}" data-cover-over="${item.over}" data-cover-year="${item.year}" data-cover-month="${item.month}">Cover</button></div></div>`).join('')}</div></div>`;
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
  const savingsThisMonth = monthTxns.filter(tx => tx.t === 'Savings').reduce((s, tx) => s + tx.a, 0);

  // v15.8.2: Monthly income = actual income for the selected month (primary source)
  // Fallback to budget plan income if actual is 0
  const PLANS = JSON.parse(localStorage.getItem('ft_budget_plans') || '{}');
  const yearKey = String(targetYear);
  const monthPlan = PLANS[yearKey] && PLANS[yearKey][targetMonth];

  let monthlyIncome = incomeThisMonth;
  if (monthlyIncome <= 0 && monthPlan) {
    const planInc = monthPlan.incCats ? Object.values(monthPlan.incCats).reduce((s, v) => s + v, 0) : (monthPlan.i || 0);
    if (planInc > 0) monthlyIncome = planInc;
  }

  // Available to spend = income - savings - expenses already made
  const spent = expenseThisMonth + savingsThisMonth;
  const available = monthlyIncome - spent;
  const safePerDay = daysLeft > 0 ? available / daysLeft : 0;

  // Projected end-of-month: current spending rate x days left
  const dailyAvgExpense = today > 0 ? expenseThisMonth / today : 0;
  const projectedTotalExpense = expenseThisMonth + (dailyAvgExpense * daysLeft);
  const projectedEndBalance = monthlyIncome - savingsThisMonth - projectedTotalExpense;

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
        <div style="font-size:24px;font-weight:800;color:${safeColor};font-feature-settings:'tnum'">${fmt(Math.max(0, fc.safePerDay))}</div>
      </div>
      <div style="height:4px;background:var(--border);border-radius:2px;overflow:hidden;margin-bottom:10px">
        <div style="height:100%;width:${progressPct}%;background:var(--accent);border-radius:2px"></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div style="padding:8px;background:var(--bg-primary);border-radius:8px;text-align:center"><div style="font-size:8px;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:2px">Available</div><div style="font-size:12px;font-weight:700;color:${fc.available >= 0 ? 'var(--text-primary)' : 'var(--rose)'};font-feature-settings:'tnum'">${fmt(fc.available)}</div></div>
        <div style="padding:8px;background:var(--bg-primary);border-radius:8px;text-align:center"><div style="font-size:8px;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:2px">Projected End</div><div style="font-size:12px;font-weight:700;color:${statusColor};font-feature-settings:'tnum'">${fmt(fc.projectedEnd)}</div></div>
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
        <div style="font-size:20px;font-weight:800;color:${safeColor};font-feature-settings:'tnum'">${fmt(Math.max(0, fc.safePerDay))}</div>
      </div>
      <div style="padding:12px 14px;background:var(--bg-primary);border:1px solid var(--border-light);border-radius:9px">
        <div style="font-size:9px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">Remaining</div>
        <div style="font-size:14px;font-weight:700;font-feature-settings:'tnum';color:${fc.available >= 0 ? 'var(--text-primary)' : 'var(--rose)'}">${fmt(fc.available)}</div>
      </div>
      <div style="padding:12px 14px;background:var(--bg-primary);border:1px solid var(--border-light);border-radius:9px">
        <div style="font-size:9px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">Daily avg spend</div>
        <div style="font-size:14px;font-weight:700;font-feature-settings:'tnum';color:var(--rose)">${fmt(fc.dailyAvgExpense)}</div>
      </div>
      <div style="padding:12px 14px;background:var(--bg-primary);border:1px solid var(--border-light);border-radius:9px">
        <div style="font-size:9px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">Projected end</div>
        <div style="font-size:14px;font-weight:700;font-feature-settings:'tnum';color:${statusColor}">${fmt(fc.projectedEnd)}</div>
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

  const nw = getNetWorthByPeriod(year, mf);
  const cf = ti - ts - te;
  const savRate = ti > 0 ? (ts / ti * 100).toFixed(0) : 0;
  const budgetTotal = getYearlyBudgetTotal(year);
  // Use selected month's budget if a month is selected, otherwise yearly
  const periodBudget = mf !== 'total' ? getMonthlyBudget(year, +mf) : budgetTotal;
  const budgetUsed = periodBudget > 0 ? Math.min(100, (te / periodBudget * 100)).toFixed(0) : 0;

  // Trend
  const prevMonth = mf === 'total' ? null : (+mf > 0 ? yearData[+mf - 1] : null);
  let trendLabel = '';
  let trendClass = 'pos';
  if (prevMonth && prevMonth.e > 0) {
    const pct = ((te - prevMonth.e) / prevMonth.e * 100).toFixed(0);
    if (te > prevMonth.e) { trendLabel = `▲ ${pct}% vs last month`; trendClass = 'neg'; }
    else { trendLabel = `▼ ${Math.abs(pct)}% vs last month`; trendClass = 'pos'; }
  }

  // Recent transactions (last 5)
  const recent = TXN.filter(tx => {
    const d = new Date(tx.d);
    if (d.getFullYear() !== year) return false;
    if (mf !== 'total' && d.getMonth() !== +mf) return false;
    return true;
  }).sort((a, b) => new Date(b.d) - new Date(a.d)).slice(0, 5);

  const recentHtml = recent.map(tx => {
    const color = tx.t === 'Income' ? 'var(--emerald)' : tx.t === 'Savings' ? 'var(--blue)' : 'var(--rose)';
    const sign = tx.t === 'Income' ? '+' : '-';
    return `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-light)"><div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${tx.dt || tx.c}</div><div style="font-size:10px;color:var(--text-tertiary)">${tx.c}${tx.s ? ' · ' + tx.s : ''}</div></div><div style="font-size:13px;font-weight:700;color:${color};font-feature-settings:'tnum'">${sign}${fmtD(tx.a)}</div></div>`;
  }).join('');

  // Budget categories progress (top 4)
  const expCats = computeExpenseCategoriesByPeriod(year, mf);
  const topCats = expCats.slice(0, 4);
  const PLANS_MOB = JSON.parse(localStorage.getItem('ft_budget_plans') || '{}');
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
    const pct = catBudget > 0 ? Math.min(100, (cat.a / catBudget * 100)) : 50;
    const fillClass = pct > 90 ? 'over' : pct > 70 ? 'warn' : 'safe';
    return `<div class="budget-prog-item"><div class="budget-prog-cat">💸</div><div class="budget-prog-info"><div class="budget-prog-top"><span class="budget-prog-name">${cat.n}</span><span class="budget-prog-amt">${fmtD(cat.a)}${catBudget > 0 ? ' / ' + fmtD(catBudget) : ''}</span></div><div class="budget-prog-bar"><div class="budget-prog-fill ${fillClass}" style="width:${pct}%"></div></div></div></div>`;
  }).join('');

  c.innerHTML = `<div class="mob-dash">
    <div class="mob-dash-balance">
      <div class="mob-dash-greeting">${getGreeting()}</div>
      <div class="mob-dash-amount">${fmt(nw)}</div>
      ${trendLabel ? `<div class="mob-dash-change ${trendClass}">${trendLabel}</div>` : ''}
    </div>
    <div class="mob-dash-stats">
      <div class="mob-dash-stat"><div class="mob-dash-stat-label">${t('dash_income')}</div><div class="mob-dash-stat-val" style="color:var(--emerald)">${fmtD(ti)}</div></div>
      <div class="mob-dash-stat"><div class="mob-dash-stat-label">${t('dash_expense')}</div><div class="mob-dash-stat-val" style="color:var(--rose)">${fmtD(te)}</div></div>
      <div class="mob-dash-stat"><div class="mob-dash-stat-label">${t('dash_savings')}</div><div class="mob-dash-stat-val" style="color:var(--blue)">${fmtD(ts)}</div></div>
    </div>
    ${getMobileOverspentHtml()}
    <div class="mob-dash-chart">
      <div class="mob-dash-chart-title">${t('dash_spending_trend')}</div>
      <div style="height:140px"><canvas id="mobDashChart"></canvas></div>
    </div>
    ${budgetBarsHtml ? `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:12px 14px"><div style="font-size:12px;font-weight:700;margin-bottom:10px;display:flex;justify-content:space-between"><span>${t('dash_top_spending')}</span><span style="font-size:10px;color:var(--text-tertiary);font-weight:500">${budgetUsed}% ${t('dash_of_budget')}</span></div><div style="display:flex;flex-direction:column;gap:8px">${budgetBarsHtml}</div></div>` : ''}
    <div class="mob-dash-recent">
      <div class="mob-dash-recent-title"><span>${t('dash_recent')}</span><a onclick="navigate('transactions')">${t('dash_see_all')} →</a></div>
      ${recentHtml || '<div style="padding:16px;text-align:center;color:var(--text-tertiary);font-size:11px">' + t('txn_no_transactions') + '</div>'}
    </div>
  </div>`;

  // Render mini chart
  setTimeout(() => {
    const ctx = document.getElementById('mobDashChart')?.getContext('2d');
    if (!ctx) return;
    const dk = document.documentElement.dataset.theme === 'dark';
    const labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const expData = yearData.map(m => m.e);
    const incData = yearData.map(m => m.i);
    const grad = ctx.createLinearGradient(0, 0, 0, 140);
    grad.addColorStop(0, 'rgba(244,63,94,0.15)');
    grad.addColorStop(1, 'rgba(244,63,94,0)');
    new Chart(ctx, {
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

// === V1.0.0: All insight/health/AI functions moved to analytics.js ===
// buildMobileInsightsTab, computeFinancialHealth, getHighLiquidityAssets,
// buildDynamicAIInsights are now in analytics.js
function buildMobileInsightsTab(yearData, year, mf, ti, te, ts, nw, cf, budgetUsed, periodBudget) {
  let html = '';
  const banks = getBANKS();
  const liabTotal = ACCOUNTS.filter(a => a.type === 'liability').reduce((s, a) => s + Math.abs(a.initialBalance), 0);
  const totalAssets = banks.reduce((s, b) => s + b.balance, 0);

  // 1. TOTAL ASSETS & NET WORTH
  html += `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:14px">
    <div style="font-size:12px;font-weight:700;margin-bottom:10px">💎 Wealth Summary</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <div style="padding:12px 10px;background:var(--bg-primary);border-radius:8px;text-align:center"><div style="font-size:8px;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:4px">Total Assets</div><div style="font-size:16px;font-weight:800;color:var(--emerald);font-feature-settings:'tnum'">${fmt(totalAssets)}</div></div>
      <div style="padding:12px 10px;background:var(--bg-primary);border-radius:8px;text-align:center"><div style="font-size:8px;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:4px">Net Worth</div><div style="font-size:16px;font-weight:800;color:${nw >= 0 ? 'var(--accent)' : 'var(--rose)'};font-feature-settings:'tnum'">${fmt(nw)}</div></div>
    </div>
    ${liabTotal > 0 ? `<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding:8px 10px;background:var(--rose-light);border-radius:6px"><span style="font-size:10px;font-weight:600;color:var(--rose)">Liabilities</span><span style="font-size:11px;font-weight:700;color:var(--rose);font-feature-settings:'tnum'">-${fmt(liabTotal)}</span></div>` : ''}
  </div>`;

  // 2. FINANCIAL HEALTH SCORE
  const health = computeFinancialHealth(ti, te, ts, cf, budgetUsed, periodBudget, year, mf);
  const healthColor = health.score >= 80 ? 'var(--emerald)' : health.score >= 60 ? 'var(--amber)' : 'var(--rose)';
  html += `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center">
    <div style="font-size:12px;font-weight:700;margin-bottom:10px">💪 Financial Health</div>
    <div style="font-size:42px;font-weight:900;color:${healthColor};line-height:1;margin-bottom:4px">${health.score}</div>
    <div style="font-size:11px;font-weight:600;color:${healthColor};margin-bottom:10px">${health.label}</div>
    <div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden;max-width:200px;margin:0 auto 12px"><div style="height:100%;width:${health.score}%;background:${healthColor};border-radius:3px"></div></div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;text-align:center">
      ${health.metrics.map(m => `<div style="padding:6px;background:var(--bg-primary);border-radius:6px"><div style="font-size:8px;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:2px">${m.label}</div><div style="font-size:11px;font-weight:700;color:${m.color}">${m.value}</div></div>`).join('')}
    </div>
  </div>`;

  // 3. CASH FLOW SECTION
  const prevMonth = mf === 'total' ? null : (+mf > 0 ? yearData[+mf - 1] : null);
  const prevCf = prevMonth ? prevMonth.i - prevMonth.s - prevMonth.e : null;
  const cfChange = prevCf !== null && prevCf !== 0 ? ((cf - prevCf) / Math.abs(prevCf) * 100).toFixed(0) : null;
  html += `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:14px">
    <div style="font-size:12px;font-weight:700;margin-bottom:10px">💰 Cash Flow</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">
      <div style="padding:10px 6px;background:var(--bg-primary);border-radius:8px;text-align:center"><div style="font-size:8px;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:2px">Income</div><div style="font-size:13px;font-weight:800;color:var(--emerald);font-feature-settings:'tnum'">${fmtD(ti)}</div></div>
      <div style="padding:10px 6px;background:var(--bg-primary);border-radius:8px;text-align:center"><div style="font-size:8px;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:2px">Expense</div><div style="font-size:13px;font-weight:800;color:var(--rose);font-feature-settings:'tnum'">${fmtD(te)}</div></div>
      <div style="padding:10px 6px;background:var(--bg-primary);border-radius:8px;text-align:center"><div style="font-size:8px;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:2px">Net</div><div style="font-size:13px;font-weight:800;color:${cf >= 0 ? 'var(--emerald)' : 'var(--rose)'};font-feature-settings:'tnum'">${cf >= 0 ? '+' : ''}${fmtD(cf)}</div></div>
    </div>
    ${cfChange !== null ? `<div style="font-size:10px;color:${+cfChange >= 0 ? 'var(--emerald)' : 'var(--rose)'};font-weight:500;text-align:center">${+cfChange >= 0 ? '▲' : '▼'} ${Math.abs(cfChange)}% vs previous month</div>` : ''}
  </div>`;

  // 4. CASH FLOW FORECAST
  html += safeBuildForecastHtml('mobile');

  // 5. EXPENSE BREAKDOWN
  const expCats = computeExpenseCategoriesByPeriod(year, mf);
  const totalExp = expCats.reduce((s, c) => s + c.a, 0);
  const colors = ['#ef4444','#8b5cf6','#ec4899','#10b981','#f59e0b','#6366f1','#06b6d4','#f97316','#14b8a6','#a855f7'];
  if (expCats.length) {
    html += `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:14px">
      <div style="font-size:12px;font-weight:700;margin-bottom:12px">📊 Expense Breakdown</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${expCats.slice(0, 8).map((cat, i) => {
          const pct = totalExp > 0 ? (cat.a / totalExp * 100).toFixed(0) : 0;
          return `<div style="display:flex;align-items:center;gap:10px"><div style="width:8px;height:8px;border-radius:50%;background:${colors[i % colors.length]};flex-shrink:0"></div><div style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between;margin-bottom:3px"><span style="font-size:11px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${cat.n}</span><span style="font-size:11px;font-weight:700;font-feature-settings:'tnum';flex-shrink:0">${fmtD(cat.a)} (${pct}%)</span></div><div style="height:4px;background:var(--border);border-radius:2px;overflow:hidden"><div style="height:100%;width:${pct}%;background:${colors[i % colors.length]};border-radius:2px"></div></div></div></div>`;
        }).join('')}
      </div>
      ${expCats.length > 8 ? `<div style="font-size:10px;color:var(--text-tertiary);text-align:center;margin-top:8px">+ ${expCats.length - 8} more categories</div>` : ''}
    </div>`;
  }

  // 6. ACCOUNT BREAKDOWN
  const totalBal = banks.reduce((s, b) => s + b.balance, 0);
  if (banks.length) {
    const sorted = [...banks].sort((a, b) => b.balance - a.balance);
    html += `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><div style="font-size:12px;font-weight:700">🏦 Account Breakdown</div><div style="font-size:12px;font-weight:800;color:var(--emerald);font-feature-settings:'tnum'">${fmt(totalBal)}</div></div>
      <div style="height:10px;border-radius:5px;overflow:hidden;display:flex;margin-bottom:12px">
        ${sorted.map((b, i) => { const w = totalBal > 0 ? (b.balance / totalBal * 100) : 0; return `<div style="height:100%;width:${w}%;background:${colors[i % colors.length]}"></div>`; }).join('')}
      </div>
      <div style="display:flex;flex-direction:column;gap:6px">
        ${sorted.map((b, i) => {
          const pct = totalBal > 0 ? (b.balance / totalBal * 100).toFixed(0) : 0;
          return `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:var(--bg-primary);border-radius:8px"><div style="display:flex;align-items:center;gap:8px"><div style="width:8px;height:8px;border-radius:50%;background:${colors[i % colors.length]}"></div><span style="font-size:11px;font-weight:600">${b.name}</span></div><div style="display:flex;align-items:center;gap:8px"><span style="font-size:11px;font-weight:700;font-feature-settings:'tnum'">${fmt(b.balance)}</span><span style="font-size:9px;color:var(--text-tertiary);font-weight:600">${pct}%</span></div></div>`;
        }).join('')}
      </div>
    </div>`;
  }

  // 7. DYNAMIC AI INSIGHTS
  html += buildDynamicAIInsights(yearData, year, mf, ti, te, ts, cf, expCats, periodBudget);

  return html;
}

// === V1.0.0: FINANCIAL HEALTH CALCULATION (CFP Board Standard) ===
// Liquidity tiers by account type
const LIQUIDITY_HIGH = ['Cash', 'Savings Account', 'Digital Wallet'];
const LIQUIDITY_MID = ['Current Account', 'Credit/Debit Card'];
const LIQUIDITY_LOW = ['Investment Account'];

function getHighLiquidityAssets() {
  return ACCOUNTS.filter(a => a.type === 'asset' && LIQUIDITY_HIGH.includes(a.accountType))
    .reduce((s, a) => s + getAccountBalance(a.id), 0);
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

  // 1. SAVINGS (20%): all Savings-type transactions / income
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
  let nwGrowthPct = 0;
  if (mf !== 'total' && +mf > 0) {
    const cur = getNetWorthByPeriod(year, mf), prev = getNetWorthByPeriod(year, String(+mf - 1));
    nwGrowthPct = prev !== 0 ? ((cur - prev) / Math.abs(prev) * 100) : (cur > 0 ? 100 : 0);
  } else {
    const am = yearData.filter(m => m.i > 0 || m.e > 0);
    if (am.length >= 2) { const fi = yearData.indexOf(am[0]), li = yearData.indexOf(am[am.length-1]); const f = getNetWorthByPeriod(year, String(fi)), l = getNetWorthByPeriod(year, String(li)); nwGrowthPct = f !== 0 ? ((l - f) / Math.abs(f) * 100) : (l > 0 ? 100 : 0); }
  }
  const nwScore = nwGrowthPct >= 5 ? 100 : nwGrowthPct >= 0 ? Math.round(50 + nwGrowthPct / 5 * 50) : Math.max(0, Math.round(50 + nwGrowthPct / 10 * 50));
  metrics.push({ label: 'Growth', value: (nwGrowthPct >= 0 ? '+' : '') + nwGrowthPct.toFixed(1) + '%', target: 'Positive', color: nwGrowthPct > 0 ? 'var(--emerald)' : nwGrowthPct === 0 ? 'var(--amber)' : 'var(--rose)' });

  // WEIGHTED SCORE
  const weights = [0.20, 0.15, 0.20, 0.15, 0.15, 0.15];
  const scores = [savScore, housingScore, debtScoreFinal, liquidityScore, cfScore, nwScore];
  const finalScore = Math.round(scores.reduce((sum, s, i) => sum + s * weights[i], 0));
  const label = finalScore >= 90 ? 'Excellent' : finalScore >= 75 ? 'Good' : finalScore >= 60 ? 'Fair' : finalScore >= 40 ? 'Needs Work' : 'Critical';
  return { score: Math.min(100, Math.max(0, finalScore)), label, metrics };
}

// === V1.0.0: DYNAMIC AI INSIGHTS ===
function buildDynamicAIInsights(yearData, year, mf, ti, te, ts, cf, expCats, periodBudget) {
  const insights = [];
  const monthName = mf !== 'total' ? MONTH_NAMES[+mf] : year;

  // Highest spending category
  if (expCats.length) {
    const top = expCats[0];
    const pct = te > 0 ? (top.a / te * 100).toFixed(0) : 0;
    insights.push({ icon: '📍', text: `<b>${top.n}</b> is your biggest expense (${pct}% of total). ${+pct > 40 ? 'Consider diversifying spending.' : 'Distribution looks balanced.'}` });
  }

  // Largest single transaction
  const periodTxns = TXN.filter(tx => { const d = new Date(tx.d); if (d.getFullYear() !== year) return false; if (mf !== 'total' && d.getMonth() !== +mf) return false; return tx.t === 'Expense'; });
  if (periodTxns.length) {
    const biggest = periodTxns.reduce((max, tx) => tx.a > max.a ? tx : max, periodTxns[0]);
    insights.push({ icon: '💳', text: `Largest expense: <b>${biggest.dt || biggest.c}</b> (${fmtD(biggest.a)}) on ${new Date(biggest.d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}.` });
  }

  // Budget warnings
  const overspent = getDashboardOverspentCats();
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
  else if (ti > 0) insights.push({ icon: '🔴', text: `No savings this period. Try to allocate at least 20% of income.` });

  // Cash flow trend
  if (cf < 0) insights.push({ icon: '📉', text: `Negative cash flow of <b>${fmt(Math.abs(cf))}</b>. Spending exceeds income after savings.` });
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
      ${insights.slice(0, 6).map(i => `<div style="display:flex;align-items:flex-start;gap:8px;font-size:11px;line-height:1.6;color:var(--text-secondary)"><span style="font-size:13px;flex-shrink:0">${i.icon}</span><span>${i.text}</span></div>`).join('')}
    </div>
  </div>`;
}
