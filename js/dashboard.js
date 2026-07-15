// === DASHBOARD (v10.9.1 — Settings & Dashboard Enhancement) ===
function renderDashboard(c) {
  const year = getSelectedYear();
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
  const bl = budgetTotal - te;
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
    { l: 'Balance', v: fmt(bal), cl: bal >= 0 ? 'bl' : 'rs', ic: 'wallet', s: series.balance, exp: false },
    { l: 'Cash Flow', v: fmt(cf), cl: cf >= 0 ? 'em' : 'rs', ic: 'trending-up', s: series.cashflow, exp: false }
  ];

  // === Expense Categories for Doughnut ===
  const expCats = computeExpenseCategoriesByPeriod(year, mf);

  // === BUILD HTML ===
  c.innerHTML = `<div class="kg" style="margin-bottom:14px"><div class="kc em"><div class="kc-left"><div class="kc-hdr"><div class="ki"><i data-lucide="landmark" width="13" height="13"></i></div><div class="kl">Net Worth</div></div><div class="kv">${fmt(nw)}</div><div class="kt ${nwTrend.noData ? 'neutral' : (nwTrend.pos ? 'pos' : 'neg')}"><span class="kt-chg">${nwTrend.label}</span></div></div><div class="kc-spark"><canvas id="heroSpark" height="36"></canvas></div></div>${cards.map((k, i) => { const tr = calcTrend(k.s, k.exp); return `<div class="kc ${k.cl}"><div class="kc-left"><div class="kc-hdr"><div class="ki"><i data-lucide="${k.ic}" width="13" height="13"></i></div><div class="kl">${k.l}</div></div><div class="kv">${k.v}</div><div class="kt ${tr.noData ? 'neutral' : (tr.pos ? 'pos' : 'neg')}"><span class="kt-chg">${tr.label}</span></div></div><div class="kc-spark"><canvas id="sp${i}" height="36"></canvas></div></div>`; }).join('')}</div>
<div class="ib" style="margin-bottom:14px">${generateDashInsights(yearData, EC, ti, te, ts, nw, cf, year, mf)}</div>
<div style="display:grid;grid-template-columns:1.6fr 1fr;gap:14px;margin-bottom:14px"><div class="cc"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><div><div class="ct">${t('dash_income_expense_savings')}</div><div class="cs">${t('dash_monthly_trend')}</div></div><div class="seg" id="dc1tog"><button class="bm active" data-ct="line">${t('misc_line')}</button><button class="bm" data-ct="bar">${t('misc_bar')}</button></div></div><div style="height:240px"><canvas id="dc1"></canvas></div></div><div class="cc"><div class="ct">${t('dash_expense_breakdown')}</div><div class="cs">${mf === 'total' ? 'By category (' + year + ')' : MONTH_NAMES[+mf] + ' ' + year}</div><div id="expDoughnutWrap" style="height:240px;display:flex;align-items:center;justify-content:center">${expCats.length ? '<canvas id="expDoughnut"></canvas>' : '<div style="color:var(--text-tertiary);font-size:12px">No available data</div>'}</div></div></div>
<div style="display:grid;grid-template-columns:1.4fr 1fr;gap:14px"><div class="cc"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><div><div class="ct">Budget & Cash Flow</div><div class="cs">${mf === 'total' ? 'Yearly overview' : MONTH_NAMES[+mf] + ' ' + year}</div></div></div><div style="height:220px"><canvas id="bchart"></canvas></div></div><div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:14px 16px;overflow:hidden"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><div style="font-size:13px;font-weight:700">${t('dash_bank_accounts')}</div><div style="font-size:11px;font-weight:700;color:var(--emerald);font-feature-settings:'tnum'">${fmt(totalAssets)}</div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">${banks.map(b => `<div class="bank-card" style="padding:8px 10px"><div class="bank-top" style="margin-bottom:3px"><div class="bank-badge ${b.cls}" style="width:22px;height:22px;font-size:7px;border-radius:5px">${b.tag}</div><div class="bank-info"><div class="bank-name" style="font-size:10px">${b.name}</div></div></div><div class="bank-balance" style="font-size:12px">${fmt(b.balance)}</div></div>`).join('')}</div></div></div>`;
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
