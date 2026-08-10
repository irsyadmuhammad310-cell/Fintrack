// === GOALS & BUDGET (v15.8.1) ===
let expandedGoal = null;
let expandedCat = null;
let goalBudgetYear = null;
let goalFilter = 'all'; // all, active, completed
let goalSort = 'progress'; // progress, name, due, amount

// Goal data (persisted in IndexedDB via safeGet/safeSave)
const DEFAULT_GOALS = [];
let GOALS = [];
let goalNxId = 10;
function loadGOALS() {
  var raw = safeGet('ft_goals');
  if (raw) { try { GOALS = JSON.parse(raw); } catch(e) {} }
  var nid = safeGet('ft_goalNxId');
  if (nid) goalNxId = parseInt(nid);
}
function saveGOALS() { safeSave('ft_goals', JSON.stringify(GOALS)); safeSave('ft_goalNxId', goalNxId); }

let mobileGoalSubTab = 'goals'; // goals | budget

function renderGoals(c) {
  if (window.innerWidth <= 768 && safeGet('ft_desktop_mode') !== 'true') { renderMobileGoals(c); return; }
  if (!goalBudgetYear) goalBudgetYear = getSelectedYear();
  const year = goalBudgetYear;
  const MD = computeMonthlyData(year);
  // Auto-sync goals linked to savings categories
  syncGoalsWithSavings();
  const activeGoals = GOALS.filter(g => g.c < g.t);
  const totalSaved = GOALS.reduce((s, g) => s + g.c, 0);
  const totalTarget = GOALS.reduce((s, g) => s + g.t, 0);
  const totalRemaining = totalTarget - totalSaved;
  const overallPct = totalTarget > 0 ? (totalSaved / totalTarget * 100).toFixed(0) : 0;

  // === GOAL SUMMARY (6 KPI cards) ===
  const budgetTotal = getYearlyBudgetTotal(year);
  const totalExp = MD.reduce((s, m) => s + m.e, 0);
  const budgetLeft = budgetTotal - totalExp;
  let html = `<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(140px, 1fr));gap:10px;margin-bottom:20px">`;
  html += `<div class="goal-kpi" style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:12px 14px"><div style="font-size:9px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">${t('goal_total')}</div><div class="goal-kpi-val">${GOALS.length}</div></div>`;
  html += `<div class="goal-kpi" style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:12px 14px"><div style="font-size:9px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">${t('goal_progress')}</div><div class="goal-kpi-val">${overallPct}%</div></div>`;
  html += `<div class="goal-kpi" style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:12px 14px"><div style="font-size:9px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">${t('goal_saved')}</div><div class="goal-kpi-val" style="color:var(--emerald)">${fmt(totalSaved)}</div></div>`;
  html += `<div class="goal-kpi" style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:12px 14px"><div style="font-size:9px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">${t('goal_annual_budget')}</div><div class="goal-kpi-val">${fmt(budgetTotal)}</div></div>`;
  html += `<div class="goal-kpi" style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:12px 14px"><div style="font-size:9px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">${t('goal_actual_spent')}</div><div class="goal-kpi-val" style="color:var(--rose)">${fmt(totalExp)}</div></div>`;
  html += `<div class="goal-kpi" style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:12px 14px"><div style="font-size:9px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">${t('goal_budget_left')}</div><div class="goal-kpi-val" style="color:${budgetLeft >= 0 ? 'var(--emerald)' : 'var(--rose)'}">${budgetLeft < 0 ? '-' : ''}${fmt(Math.abs(budgetLeft))}</div></div>`;
  html += `</div>`;

  // === GOAL PROGRESS SECTION ===
  html += `<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px"><div><div style="font-size:16px;font-weight:700">${t('goal_progress')}</div><div style="font-size:11px;color:var(--text-tertiary);margin-top:2px">${t('goal_sub')}</div></div><button class="btn bp" style="font-size:11px;padding:6px 14px" onclick="openGoalModal()"><i data-lucide="plus" width="11" height="11"></i> ${t('goal_add')}</button></div>`;

  // Filter tabs + search + sort
  html += `<div style="display:flex;justify-content:space-between;align-items:center;margin:14px 0 12px;flex-wrap:wrap;gap:8px"><div style="display:flex;gap:4px">`;
  [['all', t('txn_all')], ['active', t('goal_active')], ['completed', t('goal_completed')], ['paused', t('goal_paused')]].forEach(([f, label]) => {
    html += `<button class="btn ${goalFilter === f ? 'bp' : 'bs'}" style="font-size:10px;padding:5px 12px" onclick="goalFilter='${f}';renderGoals(document.getElementById('cnt'))">${label}</button>`;
  });
  html += `</div><div style="display:flex;gap:6px;align-items:center"><div class="sb2" style="width:160px"><i data-lucide="search" width="12" height="12"></i><input placeholder="${t('goal_search')}" id="goalSearch" oninput="renderGoals(document.getElementById('cnt'))" style="font-size:11px"></div><select class="fsel" style="font-size:10px;padding:5px 22px 5px 8px" onchange="goalSort=this.value;renderGoals(document.getElementById('cnt'))"><option value="progress"${goalSort==='progress'?' selected':''}>${t('goal_progress')}</option><option value="name"${goalSort==='name'?' selected':''}>Name</option><option value="due"${goalSort==='due'?' selected':''}>Deadline</option><option value="amount"${goalSort==='amount'?' selected':''}>${t('txn_amount')}</option></select></div></div>`;

  // Filter & sort goals
  let filteredGoals = [...GOALS];
  let goalSearchVal = '';
  try { goalSearchVal = document.getElementById('goalSearch')?.value?.toLowerCase() || ''; } catch(e) {}
  if (goalFilter === 'active') filteredGoals = filteredGoals.filter(g => g.c < g.t);
  else if (goalFilter === 'completed') filteredGoals = filteredGoals.filter(g => g.c >= g.t);
  else if (goalFilter === 'paused') filteredGoals = filteredGoals.filter(g => g.paused);
  if (goalSearchVal) filteredGoals = filteredGoals.filter(g => g.n.toLowerCase().includes(goalSearchVal));
  if (goalSort === 'progress') filteredGoals.sort((a, b) => (b.c / b.t) - (a.c / a.t));
  else if (goalSort === 'name') filteredGoals.sort((a, b) => a.n.localeCompare(b.n));
  else if (goalSort === 'due') filteredGoals.sort((a, b) => new Date(a.due) - new Date(b.due));
  else if (goalSort === 'amount') filteredGoals.sort((a, b) => b.t - a.t);

  if (!filteredGoals.length) {
    html += `<div style="padding:40px;text-align:center;border:1px solid var(--border);border-radius:12px;margin-bottom:20px"><div style="font-size:28px;margin-bottom:8px">🎯</div><div style="font-size:12px;color:var(--text-tertiary)">${goalFilter === 'all' && !goalSearchVal ? 'No goals yet. Create one above.' : 'No matching goals.'}</div></div>`;
  } else {
  // Goal cards grid (2 columns like reference)
  html += `<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(340px, 1fr));gap:12px;margin-bottom:20px">`;
  filteredGoals.forEach(g => {
    const p = Math.max(0, Math.min(g.c / g.t, 1));
    const pct = (p * 100).toFixed(0);
    const remaining = g.t - g.c;
    const isExpanded = expandedGoal === g.id;
    const isCompleted = g.c >= g.t;
    const barColor = isCompleted ? 'var(--emerald)' : p >= .7 ? 'var(--emerald)' : p >= .4 ? 'var(--amber)' : 'var(--accent)';
    const statusLabel = isCompleted ? t('goal_completed') : t('goal_active');
    const statusColor = isCompleted ? 'var(--emerald)' : 'var(--accent)';
    const today = new Date(); today.setHours(0,0,0,0);
    const dueDate = new Date(g.due); dueDate.setHours(0,0,0,0);
    const daysLeft = Math.ceil((dueDate - today) / (1000*60*60*24));
    const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30));
    const monthlyReq = remaining > 0 ? remaining / monthsLeft : 0;
    const linkedCats = g.linkedCats && g.linkedCats.length ? g.linkedCats : (g.linkedCat ? [g.linkedCat] : []);
    const isSynced = linkedCats.length > 0;
    const avgMonthlySav = isSynced ? (() => { const savTxns = TXN.filter(tx => tx.t === 'Savings' && linkedCats.includes(tx.c)); const months = new Set(savTxns.map(tx => tx.d.substring(0, 7))).size; return months > 0 ? g.c / months : 0; })() : 0;
    const estCompDate = avgMonthlySav > 0 && remaining > 0 ? (() => { const m = Math.ceil(remaining / avgMonthlySav); const d = new Date(); d.setMonth(d.getMonth() + m); return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); })() : (monthlyReq > 0 && remaining > 0 ? (() => { const m = Math.ceil(remaining / monthlyReq); const d = new Date(); d.setMonth(d.getMonth() + m); return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); })() : '—');

    html += `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;overflow:hidden;transition:all 200ms var(--ease-out)">`;
    // Card header
    html += `<div style="padding:14px 16px 12px">`;
    html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><div style="display:flex;align-items:center;gap:8px"><span style="font-size:18px">${g.e}</span><span style="font-size:14px;font-weight:600">${g.n}</span></div><div style="display:flex;align-items:center;gap:8px"><span style="font-size:9px;font-weight:600;padding:3px 8px;border-radius:4px;background:${statusColor};color:#fff;text-transform:uppercase">${statusLabel}</span><button style="border:none;background:none;color:var(--text-tertiary);cursor:pointer;font-size:14px" onclick="event.stopPropagation();toggleGoalMenu(${g.id})">⋮</button></div></div>`;
    // Progress
    html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px"><span style="font-size:10px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.04em">Progress</span><span class="goal-card-pct" style="font-weight:700;color:${barColor}">${pct}%</span></div>`;
    html += `<div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden;margin-bottom:12px"><div style="height:100%;width:${pct}%;background:${barColor};border-radius:3px;transition:width 800ms cubic-bezier(0.16,1,0.3,1)"></div></div>`;
    // Saved / Target + Deadline row
    html += `<div style="display:grid;grid-template-columns:1.2fr 1fr;gap:8px;margin-bottom:8px">`;
    html += `<div style="padding:8px 10px;background:var(--bg-primary);border:1px solid var(--border-light);border-radius:6px"><div style="font-size:8px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">Saved / Target</div><div class="goal-card-num" style="font-weight:700">${fmt(g.c)} / ${fmt(g.t)}</div></div>`;
    html += `<div style="padding:8px 10px;background:var(--bg-primary);border:1px solid var(--border-light);border-radius:6px"><div style="font-size:8px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">Deadline</div><div class="goal-card-num" style="font-weight:700">${g.due || 'Not set'}</div></div>`;
    html += `</div>`;
    // Toggle details button + synced badge
    html += `<div style="display:flex;justify-content:space-between;align-items:center"><button class="btn bs" style="font-size:10px;padding:4px 10px" onclick="expandedGoal=${isExpanded ? 'null' : g.id};renderGoals(document.getElementById('cnt'))">${isExpanded ? t('misc_close') : t('txn_details')}</button>${isSynced ? '<span style="font-size:9px;color:var(--text-tertiary)">' + t('goal_synced') + '</span>' : ''}</div>`;
    html += `</div>`;

    // Expanded details
    if (isExpanded) {
      html += `<div style="padding:0 16px 14px;border-top:1px solid var(--border-light)">`;
      html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0">`;
      html += `<div style="padding:8px 10px;background:var(--bg-primary);border:1px solid var(--border-light);border-radius:6px"><div style="font-size:8px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">${t('goal_remaining')}</div><div class="goal-detail-num" style="font-weight:700">${fmt(remaining)}</div></div>`;
      html += `<div style="padding:8px 10px;background:var(--bg-primary);border:1px solid var(--border-light);border-radius:6px"><div style="font-size:8px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">${t('goal_days_left')}</div><div class="goal-detail-num" style="font-weight:700;color:${daysLeft < 0 ? 'var(--rose)' : daysLeft <= 30 ? 'var(--amber)' : 'var(--text-primary)'}">${daysLeft > 0 ? daysLeft : t('goal_overdue')}</div></div>`;
      html += `<div style="padding:8px 10px;background:var(--bg-primary);border:1px solid var(--border-light);border-radius:6px"><div style="font-size:8px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">${t('goal_est_completion')}</div><div class="goal-detail-num" style="font-weight:700;color:var(--accent)">${isCompleted ? '✅' : estCompDate}</div></div>`;
      html += `<div style="padding:8px 10px;background:var(--bg-primary);border:1px solid var(--border-light);border-radius:6px"><div style="font-size:8px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">${t('goal_monthly_contrib')}</div><div class="goal-detail-num" style="font-weight:700">${fmt(avgMonthlySav > 0 ? avgMonthlySav : monthlyReq)}</div></div>`;
      html += `</div>`;
      html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">`;
      html += `<div style="padding:8px 10px;background:var(--bg-primary);border:1px solid var(--border-light);border-radius:6px"><div style="font-size:8px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">${t('goal_priority')}</div><div class="goal-detail-num" style="font-weight:700">Medium</div></div>`;
      html += `<div style="padding:8px 10px;background:var(--bg-primary);border:1px solid var(--border-light);border-radius:6px"><div style="font-size:8px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">${t('goal_sync')}</div><div class="goal-detail-num" style="font-weight:700">${isSynced ? t('goal_synced') + ': ' + linkedCats.join(', ') : t('goal_manual')}</div></div>`;
      html += `</div>`;
      html += `<div style="padding:8px 10px;background:var(--bg-primary);border:1px solid var(--border-light);border-radius:6px;margin-bottom:12px;font-size:11px;color:var(--text-tertiary);font-style:italic">${t('goal_no_notes')}</div>`;
      html += `<div style="display:flex;gap:8px"><button class="btn bs" style="font-size:10px;padding:5px 12px" onclick="editGoal(${g.id})">${t('goal_edit')}</button><button class="btn bd" style="font-size:10px;padding:5px 12px" onclick="deleteGoal(${g.id})">${t('goal_delete')}</button></div>`;
      html += `</div>`;
    }
    html += `</div>`;
  });
  html += `</div>`;
  }

  // === BUDGET PROGRESS (selected period) — moved above Budget Planner ===
  const mf = document.getElementById('mf').value;
  let pInc, pExp, pSav;
  const budgetTotalForProgress = getYearlyBudgetTotal(year);
  if (mf === 'total') {
    pInc = MD.reduce((s, m) => s + m.i, 0);
    pExp = MD.reduce((s, m) => s + m.e, 0);
    pSav = MD.reduce((s, m) => s + m.s, 0);
  } else {
    pInc = MD[+mf].i; pExp = MD[+mf].e; pSav = MD[+mf].s;
  }
  const incPct = pInc > 0 && budgetTotalForProgress > 0 ? Math.min((pInc / (mf === 'total' ? budgetTotalForProgress : getMonthlyBudget(year, +mf)) * 100), 100).toFixed(0) : 0;
  const expPct = budgetTotalForProgress > 0 ? Math.min((pExp / (mf === 'total' ? budgetTotalForProgress : getMonthlyBudget(year, +mf)) * 100), 100).toFixed(0) : 0;
  const savPct = pInc > 0 ? Math.min((pSav / pInc * 100), 100).toFixed(0) : 0;

  html += `<div style="font-size:14px;font-weight:700;margin-bottom:10px">${t('goal_budget_progress')}</div>`;
  html += `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px">`;
  html += `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:12px 14px"><div style="font-size:10px;font-weight:600;color:var(--text-secondary);margin-bottom:6px">${t('dash_income')}</div><div style="height:5px;background:var(--border);border-radius:3px;overflow:hidden;margin-bottom:4px"><div style="height:100%;width:${incPct}%;background:var(--emerald);border-radius:3px"></div></div><div style="font-size:11px;font-weight:700">${incPct}%</div></div>`;
  html += `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:12px 14px"><div style="font-size:10px;font-weight:600;color:var(--text-secondary);margin-bottom:6px">${t('dash_expense')}</div><div style="height:5px;background:var(--border);border-radius:3px;overflow:hidden;margin-bottom:4px"><div style="height:100%;width:${expPct}%;background:var(--rose);border-radius:3px"></div></div><div style="font-size:11px;font-weight:700">${expPct}%</div></div>`;
  html += `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:12px 14px"><div style="font-size:10px;font-weight:600;color:var(--text-secondary);margin-bottom:6px">${t('an_savings_rate')}</div><div style="height:5px;background:var(--border);border-radius:3px;overflow:hidden;margin-bottom:4px"><div style="height:100%;width:${savPct}%;background:var(--blue);border-radius:3px"></div></div><div style="font-size:11px;font-weight:700">${savPct}%</div></div>`;
  html += `</div>`;

  // === BUDGET STATUS: Overspent Categories (Cover Overspending Flow) ===
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const STATUS_PLANS = JSON.parse(safeGet('ft_budget_plans') || '{}');
  const statusYearKey = String(currentYear);
  const statusYearPlans = STATUS_PLANS[statusYearKey] || {};
  // Keys may be numeric or string after JSON parse; try both
  const statusMonthPlan = statusYearPlans[currentMonth] || statusYearPlans[String(currentMonth)] || null;
  if (statusMonthPlan && statusMonthPlan.expCats) {
    const monthTxns = TXN.filter(tx => {
      const d = new Date(tx.d);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth && tx.t === 'Expense';
    });
    const overspentCats = [];
    Object.entries(statusMonthPlan.expCats).forEach(([cat, budget]) => {
      if (budget <= 0) return;
      // tx.a is cents, budget is real currency. Convert spent to real.
      const spentCents = monthTxns.filter(tx => tx.c === cat || (tx.c && tx.c.toLowerCase() === cat.toLowerCase())).reduce((s, tx) => s + tx.a, 0);
      const spentReal = spentCents / 100;
      if (spentReal > budget) overspentCats.push({ cat, budget, spent: spentReal, over: Math.round((spentReal - budget) * 100) / 100 });
    });
    if (overspentCats.length > 0) {
      html += `<div class="cover-alert-section"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><div style="font-size:14px;font-weight:700;color:var(--rose)">⚠️ Overspent Categories</div><div style="font-size:11px;color:var(--text-tertiary)">${MONTH_NAMES[currentMonth]} ${currentYear}</div></div>`;
      html += `<div class="cover-alert-grid">`;
      overspentCats.forEach((item, idx) => {
        const pct = ((item.spent / item.budget) * 100).toFixed(0);
        const catEmoji = SCHEMA.Expense && SCHEMA.Expense[item.cat] ? (SCHEMA.Expense[item.cat].emoji || '📦') : '📦';
        html += `<div class="cover-alert-card"><div class="cover-alert-top"><div class="cover-alert-icon">${catEmoji}</div><div class="cover-alert-info"><div class="cover-alert-name">${item.cat}</div><div class="cover-alert-meta">${fmt(Math.round(item.spent * 100))} / ${fmt(Math.round(item.budget * 100))} (${pct}%)</div></div></div><div class="cover-alert-bar"><div class="cover-alert-bar-fill" style="width:100%"></div></div><div class="cover-alert-bottom"><div class="cover-alert-over">-${fmt(Math.round(item.over * 100))} over</div><button class="btn bp cover-btn" data-cover-cat="${item.cat.replace(/"/g,'"')}" data-cover-over="${item.over}" data-cover-year="${currentYear}" data-cover-month="${currentMonth}"><i data-lucide="arrow-right-left" width="11" height="11"></i> Cover</button></div></div>`;
      });
      html += `</div></div>`;
    }
  }

  // === BUDGET PLANNER (Editable with Category Breakdown) ===
  const BUDGET_PLANS = JSON.parse(safeGet('ft_budget_plans') || '{}');
  const yearKey = String(year);
  const yearPlan = BUDGET_PLANS[yearKey] || {};

  html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><div style="font-size:14px;font-weight:700">${t('goal_budget_planner')}</div><select class="fsel" onchange="goalBudgetYear=parseInt(this.value);renderGoals(document.getElementById('cnt'))">${YEARS.map(y => '<option value="' + y + '"' + (y === year ? ' selected' : '') + '>' + y + '</option>').join('')}</select></div>`;

  // Mobile: Swipeable month cards
  if (window.innerWidth <= 768 && safeGet('ft_desktop_mode') !== 'true') {
    html += `<div style="display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;padding:4px 0 14px;scrollbar-width:none" class="mob-budget-scroll">`;
    MD.forEach((m, idx) => {
      const plan = yearPlan[String(idx)] || yearPlan[idx] || null;
      const hasPlan = !!plan;
      const planInc = plan ? (plan.incCats ? Object.values(plan.incCats).reduce((s, v) => s + v, 0) : (plan.i || 0)) : 0;
      const planExp = plan ? (plan.expCats ? Object.values(plan.expCats).reduce((s, v) => s + v, 0) : (plan.e || 0)) : 0;
      const planSav = plan ? (plan.s || 0) : 0;
      const isCurrentMonth = idx === new Date().getMonth() && year === new Date().getFullYear();
      html += `<div style="min-width:200px;scroll-snap-align:start;background:var(--bg-card);border:1px solid ${isCurrentMonth ? 'var(--accent)' : 'var(--border)'};border-radius:12px;padding:14px;flex-shrink:0;cursor:pointer" onclick="showBudgetRowMenu(event,${year},${idx},${hasPlan})">`;
      html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><span style="font-size:13px;font-weight:700">${MONTH_NAMES[idx]}</span>${hasPlan ? '<span style="font-size:8px;font-weight:600;color:var(--accent);background:var(--accent-light);padding:2px 6px;border-radius:4px">' + t('misc_planned') + '</span>' : '<span style="font-size:9px;color:var(--text-tertiary)">No plan</span>'}</div>`;
      if (hasPlan) {
        html += `<div style="display:flex;flex-direction:column;gap:6px">`;
        html += `<div style="display:flex;justify-content:space-between;font-size:11px"><span style="color:var(--text-secondary)">Income</span><span style="color:var(--emerald);font-weight:600;font-feature-settings:'tnum'">${fmtR(planInc)}</span></div>`;
        html += `<div style="display:flex;justify-content:space-between;font-size:11px"><span style="color:var(--text-secondary)">Expense</span><span style="color:var(--rose);font-weight:600;font-feature-settings:'tnum'">${fmtR(planExp)}</span></div>`;
        html += `<div style="display:flex;justify-content:space-between;font-size:11px"><span style="color:var(--text-secondary)">Savings</span><span style="color:var(--blue);font-weight:600;font-feature-settings:'tnum'">${fmtR(planSav)}</span></div>`;
        html += `</div>`;
      } else {
        html += `<div style="padding:12px 0;text-align:center;font-size:11px;color:var(--text-tertiary)">Tap to set budget</div>`;
      }
      html += `</div>`;
    });
    html += `</div>`;
  } else {
    // Desktop: Table view
    html += `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:20px"><table class="bp-table" style="width:100%;border-collapse:collapse;font-size:11px;min-width:0;table-layout:fixed"><thead><tr style="background:var(--bg-primary)"><th style="padding:8px 10px;text-align:left;font-size:9px;font-weight:600;color:var(--text-secondary);width:22%">${t('rpt_month')}</th><th style="padding:8px 6px;text-align:right;font-size:9px;font-weight:600;color:var(--emerald);width:22%">${t('dash_income')}</th><th style="padding:8px 6px;text-align:right;font-size:9px;font-weight:600;color:var(--rose);width:22%">${t('dash_expense')}</th><th style="padding:8px 6px;text-align:right;font-size:9px;font-weight:600;color:var(--blue);width:22%">${t('dash_savings')}</th><th style="padding:8px 4px;text-align:center;width:12%"></th></tr></thead><tbody>`;
  MD.forEach((m, idx) => {
    const hasData = m.i > 0 || m.e > 0;
    const plan = yearPlan[String(idx)] || yearPlan[idx] || null;
    const hasPlan = !!plan;
    const planInc = plan ? (plan.incCats ? Object.values(plan.incCats).reduce((s, v) => s + v, 0) : (plan.i || 0)) : 0;
    const planExp = plan ? (plan.expCats ? Object.values(plan.expCats).reduce((s, v) => s + v, 0) : (plan.e || 0)) : 0;
    const planSav = plan ? (plan.s || 0) : 0;
    // v15.3.0: Always show PLANNED budget values in the planner (not actual spending)
    const dispI = hasPlan ? planInc : 0;
    const dispE = hasPlan ? planExp : 0;
    const dispS = hasPlan ? planSav : 0;
    const hasAny = hasPlan;
    html += `<tr style="border-top:1px solid var(--border-light)${!hasAny ? ';opacity:0.35' : ''};cursor:pointer" onclick="showBudgetRowMenu(event,${year},${idx},${hasPlan})"><td style="padding:10px;font-weight:500;font-size:11px;overflow:hidden;text-overflow:ellipsis">${MONTH_NAMES[idx]}${hasPlan ? ' <span style="font-size:7px;color:var(--accent);font-weight:600">' + t('misc_planned') + '</span>' : ''}</td><td style="padding:10px 6px;text-align:right;color:var(--emerald);font-feature-settings:'tnum';font-size:10px">${hasAny ? fmtR(dispI) : '-'}</td><td style="padding:10px 6px;text-align:right;color:var(--rose);font-feature-settings:'tnum';font-size:10px">${hasAny ? fmtR(dispE) : '-'}</td><td style="padding:10px 6px;text-align:right;color:var(--blue);font-feature-settings:'tnum';font-size:10px">${hasAny ? fmtR(dispS) : '-'}</td><td style="padding:10px 4px;text-align:center"><span style="color:var(--accent);font-size:12px">⋮</span></td></tr>`;
  });
  html += `</tbody></table></div>`;
  } // end desktop table

  c.innerHTML = html;
  lucide.createIcons();
}

// === GOAL CRUD ===
function openGoalModal(editG) {
  const isEdit = !!editG;
  const savCats = Object.keys(SCHEMA.Savings || {});
  const linkedArr = isEdit && editG.linkedCats ? editG.linkedCats : (isEdit && editG.linkedCat ? [editG.linkedCat] : []);
  const savChecks = savCats.map(cat => '<label style="display:flex;align-items:center;gap:6px;font-size:11px;cursor:pointer;padding:4px 0"><input type="checkbox" class="g_linked_chk" value="' + cat + '"' + (linkedArr.includes(cat) ? ' checked' : '') + '> ' + cat + '</label>').join('');
  const h = `<div class="mo show" id="mgoal" onclick="if(event.target===this){this.remove();document.body.style.overflow=''}"><div class="ml" onclick="event.stopPropagation()"><div class="mh"><div><div class="mti">${isEdit ? 'Edit' : 'New'} Goal</div><div class="mds">Set your financial target</div></div><button class="mx" onclick="document.getElementById('mgoal').remove();document.body.style.overflow=''">✕</button></div><form onsubmit="saveGoal(event,${isEdit ? editG.id : 'null'})"><div class="fg"><label class="fl">Goal Name *</label><input class="fi" id="g_name" required value="${isEdit ? editG.n : ''}" placeholder="e.g. Emergency Fund"></div><div class="fr"><div class="fg"><label class="fl">Target Amount *</label><input class="fi" type="number" step="0.01" id="g_target" required value="${isEdit ? editG.t : ''}" placeholder="0.00"></div><div class="fg"><label class="fl">Current Saved</label><input class="fi" type="number" step="0.01" id="g_current" value="${isEdit ? editG.c : '0'}" placeholder="0.00"></div></div><div class="fg"><label class="fl">Link to Savings Categories</label><p style="font-size:10px;color:var(--text-tertiary);margin-bottom:6px">Select one or more. Goal auto-syncs from savings transactions.</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:2px;padding:8px 10px;border:1px solid var(--border);border-radius:7px;background:var(--bg-primary);max-height:140px;overflow-y:auto">${savChecks}</div></div><div class="fr"><div class="fg"><label class="fl">Due Date *</label><input class="fi" type="date" id="g_due" required value="${isEdit ? editG.due : '2027-12-31'}"></div><div class="fg"><label class="fl">Emoji</label><input class="fi" id="g_emoji" value="${isEdit ? editG.e : '🎯'}" placeholder="🎯" style="max-width:60px"></div></div><div class="ma"><button type="button" class="btn bs" onclick="document.getElementById('mgoal').remove();document.body.style.overflow=''">Cancel</button><button type="submit" class="btn bp">${isEdit ? 'Update' : 'Create'}</button></div></form></div></div>`;
  document.body.insertAdjacentHTML('beforeend', h);
  document.body.style.overflow = 'hidden';
}

function saveGoal(e, editId) {
  e.preventDefault();
  const linkedCats = Array.from(document.querySelectorAll('.g_linked_chk:checked')).map(el => el.value);
  const data = { n: document.getElementById('g_name').value.trim(), t: parseFloat(document.getElementById('g_target').value) || 0, c: parseFloat(document.getElementById('g_current').value) || 0, due: document.getElementById('g_due').value, e: document.getElementById('g_emoji').value || '🎯', linkedCats: linkedCats, linkedCat: '' };
  if (editId) {
    const idx = GOALS.findIndex(g => g.id === editId);
    if (idx >= 0) GOALS[idx] = { ...GOALS[idx], ...data };
    toast('✅ Goal updated');
  } else {
    data.id = goalNxId++;
    data.created = new Date().toISOString().split('T')[0];
    GOALS.push(data);
    toast('✅ Goal created');
  }
  saveGOALS();
  document.getElementById('mgoal').remove(); document.body.style.overflow = '';
  renderGoals(document.getElementById('cnt'));
}

function addMoneyToGoal(id) {
  const g = GOALS.find(x => x.id === id);
  if (!g) return;
  const amt = prompt('Add amount to "' + g.n + '":\nCurrent: ' + fmt(g.c) + ' / ' + fmt(g.t));
  if (!amt) return;
  const val = parseFloat(amt);
  if (isNaN(val) || val <= 0) { toast('❌ Invalid amount'); return; }
  g.c += val;
  saveGOALS();
  toast('✅ Added ' + fmt(val));
  renderGoals(document.getElementById('cnt'));
}

function editGoal(id) {
  const g = GOALS.find(x => x.id === id);
  if (g) openGoalModal(g);
}

function deleteGoal(id) {
  if (!confirm('Delete this goal? This cannot be undone.')) return;
  GOALS = GOALS.filter(g => g.id !== id);
  saveGOALS();
  expandedGoal = null;
  toast('🗑 Goal deleted');
  renderGoals(document.getElementById('cnt'));
}

function toggleGoalMenu(id) {
  // Simple: just expand to show edit/delete
  expandedGoal = expandedGoal === id ? null : id;
  renderGoals(document.getElementById('cnt'));
}

// === BUDGET PLANNER CRUD (with category breakdown) ===
function editBudgetMonth(year, monthIdx) {
  const BUDGET_PLANS = JSON.parse(safeGet('ft_budget_plans') || '{}');
  const yearKey = String(year);
  const monthKey = String(monthIdx);
  const yearData = BUDGET_PLANS[yearKey] || {};
  const existing = yearData[monthKey] || yearData[monthIdx] || {};
  const monthName = MONTH_NAMES[monthIdx];

  // Get categories dynamically from SCHEMA (Settings is the source of truth)
  const incCats = Object.keys(SCHEMA.Income || {});
  const expCats = Object.keys(SCHEMA.Expense || {});
  // Budget plans store values in real currency (not cents)
  const existIncCats = existing.incCats || {};
  const existExpCats = existing.expCats || {};
  const existSav = existing.s || 0;

  var h = '<div class="mo show" id="mbudget" onclick="if(event.target===this){this.remove();document.body.style.overflow=\'\'}">';
  h += '<div class="ml" style="max-height:80vh;overflow-y:auto" onclick="event.stopPropagation()">';
  h += '<div class="mh"><div><div class="mti">Budget: ' + monthName + ' ' + year + '</div><div class="mds">Set budget by category</div></div><button class="mx" onclick="document.getElementById(\'mbudget\').remove();document.body.style.overflow=\'\'">✕</button></div>';
  h += '<form onsubmit="saveBudgetMonth(event,' + year + ',' + monthIdx + ')">';

  // Income categories
  h += '<div style="font-size:11px;font-weight:700;color:var(--emerald);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">Income</div>';
  incCats.forEach(function(cat) {
    var val = existIncCats[cat] || 0;
    h += '<div class="fg" style="margin-bottom:8px"><label class="fl">' + cat + '</label><input class="fi bp_inc" type="number" step="0.01" data-cat="' + cat + '" value="' + val + '" placeholder="0.00"></div>';
  });

  // Expense categories
  h += '<div style="font-size:11px;font-weight:700;color:var(--rose);text-transform:uppercase;letter-spacing:.05em;margin:14px 0 8px">Expense</div>';
  expCats.forEach(function(cat) {
    var val = existExpCats[cat] || 0;
    h += '<div class="fg" style="margin-bottom:8px"><label class="fl">' + cat + '</label><input class="fi bp_exp" type="number" step="0.01" data-cat="' + cat + '" value="' + val + '" placeholder="0.00"></div>';
  });

  // Savings (single amount)
  h += '<div style="font-size:11px;font-weight:700;color:var(--blue);text-transform:uppercase;letter-spacing:.05em;margin:14px 0 8px">Savings</div>';
  h += '<div class="fg"><label class="fl">Monthly Savings Target</label><input class="fi" type="number" step="0.01" id="bp_savings" value="' + existSav + '" placeholder="0.00"></div>';

  h += '<div class="ma"><button type="button" class="btn bs" onclick="clearBudgetMonth(' + year + ',' + monthIdx + ')">Clear</button><button type="button" class="btn bs" onclick="document.getElementById(\'mbudget\').remove();document.body.style.overflow=\'\'">Cancel</button><button type="submit" class="btn bp">Save</button></div>';
  h += '</form></div></div>';
  document.body.insertAdjacentHTML('beforeend', h);
  document.body.style.overflow = 'hidden';
}

function saveBudgetMonth(e, year, monthIdx) {
  e.preventDefault();
  var plans = JSON.parse(safeGet('ft_budget_plans') || '{}');
  var yearKey = String(year);
  if (!plans[yearKey]) plans[yearKey] = {};

  // Collect income categories (store as real currency)
  var incCats = {};
  document.querySelectorAll('.bp_inc').forEach(function(el) {
    var val = parseFloat(el.value) || 0;
    if (val > 0) incCats[el.dataset.cat] = val;
  });

  // Collect expense categories (store as real currency)
  var expCats = {};
  document.querySelectorAll('.bp_exp').forEach(function(el) {
    var val = parseFloat(el.value) || 0;
    if (val > 0) expCats[el.dataset.cat] = val;
  });

  var savAmount = parseFloat(document.getElementById('bp_savings').value) || 0;
  var totalInc = Object.values(incCats).reduce(function(s, v) { return s + v; }, 0);
  var totalExp = Object.values(expCats).reduce(function(s, v) { return s + v; }, 0);

  plans[yearKey][String(monthIdx)] = { incCats: incCats, expCats: expCats, s: savAmount, i: totalInc, e: totalExp };
  safeSave('ft_budget_plans', JSON.stringify(plans));
  document.getElementById('mbudget').remove();
  document.body.style.overflow = '';
  toast('✅ Budget saved for ' + MONTH_NAMES[monthIdx] + ' ' + year);
  // Re-render current page to sync budget data across all modules
  if (typeof render === 'function') render();
  else renderGoals(document.getElementById('cnt'));
}

function clearBudgetMonth(year, monthIdx) {
  var plans = JSON.parse(safeGet('ft_budget_plans') || '{}');
  var yearKey = String(year);
  var monthKey = String(monthIdx);
  if (plans[yearKey] && (plans[yearKey][monthKey] || plans[yearKey][monthIdx])) {
    delete plans[yearKey][monthKey];
    delete plans[yearKey][monthIdx];
    safeSave('ft_budget_plans', JSON.stringify(plans));
  }
  document.getElementById('mbudget').remove();
  document.body.style.overflow = '';
  toast('🗑 Budget cleared');
  if (typeof render === 'function') render();
  else renderGoals(document.getElementById('cnt'));
}

// === GOAL-SAVINGS AUTO SYNC ===
// For goals with linkedCats, calculate saved amount from all Savings transactions in those categories
function syncGoalsWithSavings() {
  let changed = false;
  GOALS.forEach(g => {
    const cats = g.linkedCats && g.linkedCats.length ? g.linkedCats : (g.linkedCat ? [g.linkedCat] : []);
    if (!cats.length) return;
    const totalFromTxn = TXN.filter(tx => tx.t === 'Savings' && cats.includes(tx.c)).reduce((s, tx) => s + tx.a, 0);
    if (g.c !== totalFromTxn) {
      const oldC = g.c;
      g.c = totalFromTxn;
      changed = true;
      // v15.4: Check milestones
      checkGoalMilestones(g, oldC, totalFromTxn);
    }
  });
  if (changed) saveGOALS();
}

// === GOAL MILESTONES (v15.4 — Actually functional) ===
function checkGoalMilestones(goal, oldAmount, newAmount) {
  if (safeGet('ft_milestone_alerts') === 'off') return;
  if (goal.t <= 0) return;
  const milestones = [100];
  const oldPct = (oldAmount / goal.t) * 100;
  const newPct = (newAmount / goal.t) * 100;
  const achieved = JSON.parse(safeGet('ft_milestones_' + goal.id) || '[]');

  milestones.forEach(m => {
    if (newPct >= m && oldPct < m && !achieved.includes(m)) {
      achieved.push(m);
      safeSave('ft_milestones_' + goal.id, JSON.stringify(achieved));
      const emoji = '🎉';
      const msg = `${emoji} Goal "${goal.n}" completed! You reached ${fmt(goal.t)}!`;
      toast(msg);
      // Also add to notification panel
      if (typeof addSystemNotification === 'function') addSystemNotification(msg, 'milestone');
    }
  });
}

// === BUDGET COPY (v15.7.2 — Contextual Row Menu) ===
function showBudgetRowMenu(event, year, monthIdx, hasPlan) {
  event.stopPropagation();
  // Remove any existing menu
  var existing = document.getElementById('budgetRowMenu');
  if (existing) existing.remove();

  var monthName = MONTH_NAMES[monthIdx];
  var isMobile = window.innerWidth <= 768;

  var menuHtml = '';
  if (isMobile) {
    // Bottom sheet style for mobile
    menuHtml = '<div id="budgetRowMenu" style="position:fixed;inset:0;z-index:9000;background:oklch(0 0 0/0.4);display:flex;align-items:flex-end;justify-content:center" onclick="if(event.target===this)this.remove()">';
    menuHtml += '<div style="width:100%;max-width:420px;background:var(--bg-card);border-radius:16px 16px 0 0;padding:20px;animation:slideUp 200ms ease-out" onclick="event.stopPropagation()">';
    menuHtml += '<div style="width:36px;height:4px;border-radius:2px;background:var(--border);margin:0 auto 14px"></div>';
    menuHtml += '<div style="font-size:14px;font-weight:700;margin-bottom:4px">' + monthName + ' ' + year + '</div>';
    menuHtml += '<div style="font-size:11px;color:var(--text-tertiary);margin-bottom:16px">' + (hasPlan ? 'Has budget data' : 'No budget set') + '</div>';
  } else {
    // Dropdown near the row for desktop
    menuHtml = '<div id="budgetRowMenu" style="position:fixed;inset:0;z-index:9000" onclick="this.remove()">';
    menuHtml += '<div style="position:absolute;top:' + event.clientY + 'px;left:' + Math.min(event.clientX, window.innerWidth - 220) + 'px;background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:8px;box-shadow:0 8px 24px oklch(0 0 0/0.3);min-width:180px;animation:fi 150ms ease-out" onclick="event.stopPropagation()">';
    menuHtml += '<div style="font-size:11px;font-weight:700;color:var(--text-tertiary);padding:6px 10px;text-transform:uppercase;letter-spacing:.04em">' + monthName + ' ' + year + '</div>';
  }

  // Menu items
  menuHtml += '<div style="display:flex;flex-direction:column;gap:2px">';
  menuHtml += '<button style="display:flex;align-items:center;gap:10px;width:100%;padding:' + (isMobile ? '14px 12px' : '9px 10px') + ';border:none;background:none;border-radius:8px;cursor:pointer;font-family:var(--font);font-size:' + (isMobile ? '14px' : '12px') + ';color:var(--text);text-align:left;font-weight:500" onclick="document.getElementById(\'budgetRowMenu\').remove();editBudgetMonth(' + year + ',' + monthIdx + ')" onmouseover="this.style.background=\'var(--bg-primary)\'" onmouseout="this.style.background=\'none\'"><span style="font-size:' + (isMobile ? '18px' : '14px') + '">✏️</span> ' + t('misc_edit') + '</button>';

  if (hasPlan) {
    menuHtml += '<button style="display:flex;align-items:center;gap:10px;width:100%;padding:' + (isMobile ? '14px 12px' : '9px 10px') + ';border:none;background:none;border-radius:8px;cursor:pointer;font-family:var(--font);font-size:' + (isMobile ? '14px' : '12px') + ';color:var(--text);text-align:left;font-weight:500" onclick="document.getElementById(\'budgetRowMenu\').remove();copyBudgetToNext(' + year + ',' + monthIdx + ')" onmouseover="this.style.background=\'var(--bg-primary)\'" onmouseout="this.style.background=\'none\'"><span style="font-size:' + (isMobile ? '18px' : '14px') + '">📋</span> ' + t('goal_budget_copy_next') + '</button>';
    menuHtml += '<button style="display:flex;align-items:center;gap:10px;width:100%;padding:' + (isMobile ? '14px 12px' : '9px 10px') + ';border:none;background:none;border-radius:8px;cursor:pointer;font-family:var(--font);font-size:' + (isMobile ? '14px' : '12px') + ';color:var(--text);text-align:left;font-weight:500" onclick="document.getElementById(\'budgetRowMenu\').remove();copyBudgetToAll(' + year + ',' + monthIdx + ')" onmouseover="this.style.background=\'var(--bg-primary)\'" onmouseout="this.style.background=\'none\'"><span style="font-size:' + (isMobile ? '18px' : '14px') + '">📑</span> ' + t('goal_budget_apply_all') + '</button>';
    menuHtml += '<div style="height:1px;background:var(--border);margin:4px 0"></div>';
    menuHtml += '<button style="display:flex;align-items:center;gap:10px;width:100%;padding:' + (isMobile ? '14px 12px' : '9px 10px') + ';border:none;background:none;border-radius:8px;cursor:pointer;font-family:var(--font);font-size:' + (isMobile ? '14px' : '12px') + ';color:var(--rose);text-align:left;font-weight:500" onclick="document.getElementById(\'budgetRowMenu\').remove();clearBudgetMonth(' + year + ',' + monthIdx + ')" onmouseover="this.style.background=\'var(--bg-primary)\'" onmouseout="this.style.background=\'none\'"><span style="font-size:' + (isMobile ? '18px' : '14px') + '">🗑</span> ' + t('goal_budget_clear') + '</button>';
  }

  menuHtml += '</div>';
  menuHtml += '</div></div>';

  document.body.insertAdjacentHTML('beforeend', menuHtml);
}

function copyBudgetToNext(year, monthIdx) {
  var plans = JSON.parse(safeGet('ft_budget_plans') || '{}');
  var yearKey = String(year);
  var srcPlan = (plans[yearKey] && (plans[yearKey][String(monthIdx)] || plans[yearKey][monthIdx])) || null;
  if (!srcPlan) { toast('❌ No budget to copy'); return; }

  // Next month (handles year rollover)
  var nextMonth = monthIdx + 1;
  var nextYear = year;
  if (nextMonth > 11) { nextMonth = 0; nextYear = year + 1; }
  var nextYearKey = String(nextYear);
  var nextMonthKey = String(nextMonth);

  // Check if destination has data
  var destPlan = (plans[nextYearKey] && (plans[nextYearKey][nextMonthKey] || plans[nextYearKey][nextMonth])) || null;
  var destHasData = destPlan && (Object.keys(destPlan.incCats || {}).length || Object.keys(destPlan.expCats || {}).length || destPlan.s);

  if (destHasData) {
    if (!confirm(MONTH_NAMES[nextMonth] + ' ' + nextYear + ' already has budget data. Replace it?')) return;
  }

  if (!plans[nextYearKey]) plans[nextYearKey] = {};
  plans[nextYearKey][nextMonthKey] = JSON.parse(JSON.stringify(srcPlan));
  safeSave('ft_budget_plans', JSON.stringify(plans));
  toast('✅ Copied to ' + MONTH_NAMES[nextMonth] + ' ' + nextYear);
  if (typeof render === 'function') render();
  else renderGoals(document.getElementById('cnt'));
}

function copyBudgetToAll(year, monthIdx) {
  var plans = JSON.parse(safeGet('ft_budget_plans') || '{}');
  var yearKey = String(year);
  var srcPlan = (plans[yearKey] && (plans[yearKey][String(monthIdx)] || plans[yearKey][monthIdx])) || null;
  if (!srcPlan) { toast('❌ No budget to copy'); return; }

  // Count how many months already have data (excluding source)
  var existingCount = 0;
  for (var m = 0; m < 12; m++) {
    if (m === monthIdx) continue;
    var p = plans[yearKey] && (plans[yearKey][String(m)] || plans[yearKey][m]);
    if (p && (Object.keys(p.incCats || {}).length || Object.keys(p.expCats || {}).length || p.s)) existingCount++;
  }

  var msg = 'Apply ' + MONTH_NAMES[monthIdx] + ' budget to all 12 months of ' + year + '?';
  if (existingCount > 0) msg += '\n\n' + existingCount + ' month(s) already have data and will be replaced.';
  if (!confirm(msg)) return;

  if (!plans[yearKey]) plans[yearKey] = {};
  for (var m = 0; m < 12; m++) {
    plans[yearKey][String(m)] = JSON.parse(JSON.stringify(srcPlan));
  }
  safeSave('ft_budget_plans', JSON.stringify(plans));
  toast('✅ Budget applied to all months of ' + year);
  if (typeof render === 'function') render();
  else renderGoals(document.getElementById('cnt'));
}

// === COVER OVERSPENDING FLOW (v15.8) ===
function openCoverOverspending(overspentCat, overAmount, year, monthIdx) {
  // Ensure types are correct
  monthIdx = parseInt(monthIdx);
  year = parseInt(year);
  const PLANS = JSON.parse(safeGet('ft_budget_plans') || '{}');
  const yearKey = String(year);
  const yearPlans = PLANS[yearKey] || null;
  if (!yearPlans) { toast('❌ No budget plans for ' + year); return; }

  // Month key: saveBudgetMonth stores as numeric, but JSON keys are always strings after parse
  // So we must check String(monthIdx) as the primary lookup
  var monthPlan = yearPlans[String(monthIdx)] || yearPlans[monthIdx] || null;
  if (!monthPlan || !monthPlan.expCats || Object.keys(monthPlan.expCats).length === 0) {
    toast('❌ No expense budget set for ' + MONTH_NAMES[monthIdx] + ' ' + year);
    return;
  }

  // Get actual spending per category this month
  // Transactions: tx.c = category (top-level), tx.s = subcategory
  // Budget expCats are in REAL CURRENCY. tx.a is in CENTS. Convert tx.a to real for comparison.
  const monthTxns = TXN.filter(tx => {
    const d = new Date(tx.d);
    return d.getFullYear() === year && d.getMonth() === monthIdx && tx.t === 'Expense';
  });

  // Find categories with available budget to pull from
  const availableCats = [];
  Object.entries(monthPlan.expCats).forEach(([cat, budget]) => {
    if (cat === overspentCat || budget <= 0) return;
    // Convert spent from cents to real currency for budget comparison
    const spentCents = monthTxns.filter(tx => tx.c === cat || (tx.c && tx.c.toLowerCase() === cat.toLowerCase())).reduce((s, tx) => s + tx.a, 0);
    const spentReal = spentCents / 100;
    const remaining = budget - spentReal;
    if (remaining > 0) {
      const catEmoji = SCHEMA.Expense && SCHEMA.Expense[cat] ? (SCHEMA.Expense[cat].emoji || '📦') : '📦';
      availableCats.push({ cat, budget, spent: spentReal, remaining, emoji: catEmoji });
    }
  });

  if (!availableCats.length) { toast('❌ No categories with available budget to cover from'); return; }

  // overAmount is in real currency (passed from overspent detection which already converted)
  const overAmountReal = overAmount;
  const overspentEmoji = SCHEMA.Expense && SCHEMA.Expense[overspentCat] ? (SCHEMA.Expense[overspentCat].emoji || '📦') : '📦';
  const isMobile = window.innerWidth <= 768;

  let h = '';
  if (isMobile) {
    // Bottom sheet for mobile
    h = `<div class="bsheet show" id="coverSheet" onclick="if(event.target===this.querySelector('.bsheet-overlay'))closeCoverSheet()"><div class="bsheet-overlay"></div><div class="bsheet-content" style="max-height:85vh" onclick="event.stopPropagation()">`;
    h += `<div class="bsheet-handle"></div>`;
  } else {
    // Modal for desktop
    h = `<div class="mo show" id="coverSheet" onclick="if(event.target===this)closeCoverSheet()"><div class="ml" style="max-width:460px" onclick="event.stopPropagation()">`;
  }

  // Header
  h += `<div style="margin-bottom:16px"><div style="font-size:16px;font-weight:700;margin-bottom:4px">Cover Overspending</div><div style="font-size:12px;color:var(--text-secondary);line-height:1.4">${overspentCat} is RM ${overAmountReal.toFixed(2)} over budget. Move money from another category.</div></div>`;

  // Overspent amount display
  h += `<div class="cover-overspent-display"><div style="font-size:10px;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Amount to cover</div><div style="font-size:24px;font-weight:800;color:var(--rose);font-feature-settings:'tnum'">-RM ${overAmountReal.toFixed(2)}</div></div>`;

  // Source category selection
  h += `<div style="font-size:10px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.05em;margin:16px 0 8px">Move from</div>`;
  h += `<div class="cover-options-list" id="coverOptions">`;
  availableCats.forEach((item, idx) => {
    const maxCoverReal = Math.min(item.remaining, overAmountReal);
    h += `<div class="cover-option-row${idx === 0 ? ' selected' : ''}" data-cat="${item.cat}" data-max="${maxCoverReal.toFixed(2)}" data-remaining="${item.remaining.toFixed(2)}" onclick="selectCoverSource(this)"><div class="cover-opt-left"><span class="cover-opt-emoji">${item.emoji}</span><div class="cover-opt-info"><div class="cover-opt-name">${item.cat}</div><div class="cover-opt-avail">RM ${item.remaining.toFixed(2)} available</div></div></div><div class="cover-opt-check"><span></span></div></div>`;
  });
  h += `</div>`;

  // Amount input (in real currency)
  const firstMaxReal = Math.min(availableCats[0].remaining, overAmountReal);
  const currSymbol = (CURRENCY_CONFIG[displayCurrency] || CURRENCY_CONFIG.MYR).symbol;
  h += `<div class="cover-amount-section"><div style="font-size:10px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">Amount</div><div class="cover-amount-wrap"><span class="cover-amt-currency">${currSymbol}</span><input type="number" step="0.01" id="coverAmount" class="cover-amt-input" value="${firstMaxReal.toFixed(2)}" max="${firstMaxReal.toFixed(2)}"><button class="cover-amt-max" onclick="document.getElementById('coverAmount').value=document.getElementById('coverAmount').max">MAX</button></div></div>`;

  // Transfer preview
  const firstCat = availableCats[0];
  h += `<div class="cover-preview" id="coverPreview"><div class="cover-preview-row"><span class="cover-preview-emoji">${firstCat.emoji}</span><div class="cover-preview-detail"><div class="cover-preview-name">${firstCat.cat}</div><div class="cover-preview-after">RM ${firstCat.remaining.toFixed(2)} → RM ${(firstCat.remaining - firstMaxReal).toFixed(2)} remaining</div></div><div class="cover-preview-amt negative">-RM ${firstMaxReal.toFixed(2)}</div></div><div style="text-align:center;color:var(--text-tertiary);font-size:14px;padding:6px 0">↓</div><div class="cover-preview-row"><span class="cover-preview-emoji">${overspentEmoji}</span><div class="cover-preview-detail"><div class="cover-preview-name">${overspentCat}</div><div class="cover-preview-after">-RM ${overAmountReal.toFixed(2)} → ${overAmountReal <= firstMaxReal ? 'RM 0.00' : '-RM ' + (overAmountReal - firstMaxReal).toFixed(2)} remaining</div></div><div class="cover-preview-amt positive">+RM ${firstMaxReal.toFixed(2)}</div></div></div>`;

  // Action buttons
  h += `<div style="display:flex;flex-direction:column;gap:8px;margin-top:16px"><button class="btn bp" id="coverConfirmBtn" style="width:100%;justify-content:center;padding:12px" onclick="executeCoverTransfer('${firstCat.cat.replace(/'/g,"\\'")}','${overspentCat.replace(/'/g,"\\'")}',${year},${monthIdx})">Cover RM ${firstMaxReal.toFixed(2)}</button><button class="btn bs" style="width:100%;justify-content:center;padding:12px" onclick="closeCoverSheet()">Leave overspent</button></div>`;

  if (isMobile) {
    h += `</div></div>`;
  } else {
    h += `</div></div>`;
  }

  document.body.insertAdjacentHTML('beforeend', h);
  document.body.style.overflow = 'hidden';
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function selectCoverSource(el) {
  document.querySelectorAll('.cover-option-row').forEach(r => r.classList.remove('selected'));
  el.classList.add('selected');
  const cat = el.dataset.cat;
  const max = parseFloat(el.dataset.max);
  const remaining = parseFloat(el.dataset.remaining);
  const amtInput = document.getElementById('coverAmount');
  amtInput.max = max.toFixed(2);
  amtInput.value = max.toFixed(2);

  // Update preview source row
  const preview = document.getElementById('coverPreview');
  if (preview) {
    const emoji = el.querySelector('.cover-opt-emoji').textContent;
    const amt = parseFloat(amtInput.value);
    const rows = preview.querySelectorAll('.cover-preview-row');
    if (rows[0]) {
      rows[0].querySelector('.cover-preview-emoji').textContent = emoji;
      rows[0].querySelector('.cover-preview-name').textContent = cat;
      rows[0].querySelector('.cover-preview-after').textContent = 'RM ' + remaining.toFixed(2) + ' → RM ' + (remaining - amt).toFixed(2) + ' remaining';
      rows[0].querySelector('.cover-preview-amt').textContent = '-RM ' + amt.toFixed(2);
    }
  }

  // Update confirm button text
  const confirmBtn = document.getElementById('coverConfirmBtn');
  if (confirmBtn) {
    const amt = parseFloat(amtInput.value);
    confirmBtn.textContent = 'Cover RM ' + amt.toFixed(2);
  }
}

function executeCoverTransfer(fromCat, toCat, year, monthIdx) {
  const amountReal = parseFloat(document.getElementById('coverAmount').value);
  if (!amountReal || amountReal <= 0) { toast('❌ Invalid amount'); return; }

  // Get selected source category
  const selected = document.querySelector('.cover-option-row.selected');
  if (selected) fromCat = selected.dataset.cat;

  const plans = JSON.parse(safeGet('ft_budget_plans') || '{}');
  const yearKey = String(year);
  if (!plans[yearKey]) { toast('❌ Budget plan not found'); return; }
  const yearPlans = plans[yearKey];
  const monthKey = String(monthIdx);
  const plan = yearPlans[monthKey] || yearPlans[monthIdx] || null;
  if (!plan || !plan.expCats) { toast('❌ Budget plan not found for this month'); return; }

  if (!plan.expCats[fromCat] && plan.expCats[fromCat] !== 0) { toast('❌ Source category not found in budget'); return; }
  if (!plan.expCats[toCat] && plan.expCats[toCat] !== 0) { toast('❌ Target category not found in budget'); return; }

  // Budget values are in real currency. Transfer directly.
  const actualAmt = Math.min(amountReal, plan.expCats[fromCat]);
  if (actualAmt <= 0) { toast('❌ Source has no budget left to transfer'); return; }

  plan.expCats[fromCat] = Math.round((plan.expCats[fromCat] - actualAmt) * 100) / 100;
  plan.expCats[toCat] = Math.round((plan.expCats[toCat] + actualAmt) * 100) / 100;

  // Recalculate totals
  plan.e = Object.values(plan.expCats).reduce((s, v) => s + v, 0);

  // Save back using string key
  plans[yearKey][monthKey] = plan;
  safeSave('ft_budget_plans', JSON.stringify(plans));
  closeCoverSheet();
  toast(`✅ Moved ${fmt(actualAmt)} from ${fromCat} → ${toCat}`);
  if (typeof render === 'function') render();
  else renderGoals(document.getElementById('cnt'));
}

function closeCoverSheet() {
  const sheet = document.getElementById('coverSheet');
  if (sheet) sheet.remove();
  document.body.style.overflow = '';
}

// FIX 3: Delegated click handler for cover buttons (avoids inline onclick with unsafe strings)
document.addEventListener('click', function(e) {
  // Handle trigger buttons (Cover alerts on Goals tab and Dashboard)
  const btn = e.target.closest('[data-cover-cat]');
  if (btn && !btn.id) {
    e.preventDefault();
    e.stopPropagation();
    const cat = btn.dataset.coverCat;
    const over = parseFloat(btn.dataset.coverOver);
    const year = parseInt(btn.dataset.coverYear);
    const month = parseInt(btn.dataset.coverMonth);
    if (cat && over > 0) openCoverOverspending(cat, over, year, month);
    return;
  }
});

// === MOBILE GOALS + BUDGET (Sub-tab UI) ===
function renderMobileGoals(c) {
  if (!goalBudgetYear) goalBudgetYear = getSelectedYear();
  const year = goalBudgetYear;
  const MD = computeMonthlyData(year);
  syncGoalsWithSavings();

  let html = '';
  // Header
  html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:0 4px;margin-bottom:14px"><div style="font-size:22px;font-weight:800;letter-spacing:-0.03em">Goals</div><div style="display:flex;gap:8px"><button class="btn bs" style="width:32px;height:32px;padding:0;display:flex;align-items:center;justify-content:center;border-radius:10px" onclick="document.getElementById(\'mobGoalSearch\')?.focus()"><i data-lucide="search" width="14" height="14"></i></button><button class="btn bs" style="width:32px;height:32px;padding:0;display:flex;align-items:center;justify-content:center;border-radius:10px" onclick="openGoalModal()"><i data-lucide="plus" width="14" height="14"></i></button></div></div>';

  // Segmented control
  html += '<div style="display:flex;background:var(--bg-card);border-radius:12px;padding:3px;border:1px solid var(--border);margin-bottom:16px">';
  html += '<div style="flex:1;padding:9px 12px;text-align:center;font-size:12px;font-weight:600;border-radius:9px;cursor:pointer;transition:all 200ms;' + (mobileGoalSubTab === 'goals' ? 'background:var(--accent);color:#fff' : 'color:var(--text-tertiary)') + '" onclick="mobileGoalSubTab=\'goals\';renderGoals(document.getElementById(\'cnt\'))">Goals</div>';
  html += '<div style="flex:1;padding:9px 12px;text-align:center;font-size:12px;font-weight:600;border-radius:9px;cursor:pointer;transition:all 200ms;' + (mobileGoalSubTab === 'budget' ? 'background:var(--accent);color:#fff' : 'color:var(--text-tertiary)') + '" onclick="mobileGoalSubTab=\'budget\';renderGoals(document.getElementById(\'cnt\'))">Budget</div>';
  html += '</div>';

  if (mobileGoalSubTab === 'goals') {
    html += renderMobileGoalsTab(MD, year);
  } else {
    html += renderMobileBudgetTab(MD, year);
  }

  c.innerHTML = html;
  lucide.createIcons();
}

function renderMobileGoalsTab(MD, year) {
  let html = '';
  const totalSaved = GOALS.reduce((s, g) => s + g.c, 0);
  const totalTarget = GOALS.reduce((s, g) => s + g.t, 0);
  const overallPct = totalTarget > 0 ? (totalSaved / totalTarget * 100).toFixed(0) : 0;
  const onTrack = GOALS.filter(g => {
    if (g.c >= g.t) return true;
    const today = new Date(); today.setHours(0,0,0,0);
    const due = new Date(g.due); due.setHours(0,0,0,0);
    const daysLeft = Math.ceil((due - today) / 86400000);
    const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30));
    const remaining = g.t - g.c;
    const monthlyReq = remaining / monthsLeft;
    const linkedCats = g.linkedCats && g.linkedCats.length ? g.linkedCats : (g.linkedCat ? [g.linkedCat] : []);
    if (linkedCats.length) {
      const savTxns = TXN.filter(tx => tx.t === 'Savings' && linkedCats.includes(tx.c));
      const months = new Set(savTxns.map(tx => tx.d.substring(0, 7))).size;
      const avg = months > 0 ? g.c / months : 0;
      return avg >= monthlyReq * 0.8;
    }
    return true;
  }).length;
  const ringOffset = totalTarget > 0 ? (263.9 * (1 - totalSaved / totalTarget)).toFixed(1) : 263.9;

  // Ring hero
  html += '<div style="display:flex;align-items:center;gap:20px;margin-bottom:18px">';
  html += '<div style="position:relative;width:96px;height:96px;flex-shrink:0">';
  html += '<svg width="96" height="96" viewBox="0 0 96 96" style="transform:rotate(-90deg)"><circle cx="48" cy="48" r="40" fill="none" stroke="var(--border)" stroke-width="7"/><circle cx="48" cy="48" r="40" fill="none" stroke="var(--emerald)" stroke-width="7" stroke-linecap="round" stroke-dasharray="251.2" stroke-dashoffset="' + (251.2 * (1 - overallPct / 100)).toFixed(1) + '" style="transition:stroke-dashoffset 800ms cubic-bezier(0.22,1,0.36,1)"/></svg>';
  html += '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center"><span style="font-size:22px;font-weight:800;color:var(--emerald);font-feature-settings:\'tnum\'">' + overallPct + '%</span><span style="font-size:8px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-tertiary)">Overall</span></div>';
  html += '</div>';
  html += '<div style="display:flex;flex-direction:column;gap:8px">';
  html += '<div><div style="font-size:10px;color:var(--text-tertiary);font-weight:500">Total Saved</div><div style="font-size:15px;font-weight:700;color:var(--emerald);font-feature-settings:\'tnum\'">' + fmt(totalSaved) + '</div></div>';
  html += '<div><div style="font-size:10px;color:var(--text-tertiary);font-weight:500">Total Target</div><div style="font-size:15px;font-weight:700;font-feature-settings:\'tnum\'">' + fmt(totalTarget) + '</div></div>';
  html += '<div style="font-size:10px;color:var(--text-secondary)">' + onTrack + ' of ' + GOALS.length + ' on track</div>';
  html += '</div></div>';

  // Filter chips
  html += '<div style="display:flex;gap:6px;margin-bottom:14px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px">';
  [['all', t('txn_all') + ' (' + GOALS.length + ')'], ['active', t('goal_active')], ['completed', t('goal_completed')], ['paused', t('goal_paused')]].forEach(([f, label]) => {
    const isActive = goalFilter === f;
    html += '<div style="padding:6px 14px;border-radius:20px;font-size:11px;font-weight:600;white-space:nowrap;cursor:pointer;transition:all 150ms;' + (isActive ? 'background:var(--accent);color:#fff;border:1px solid var(--accent)' : 'background:var(--bg-card);color:var(--text-secondary);border:1px solid var(--border)') + '" onclick="goalFilter=\'' + f + '\';renderGoals(document.getElementById(\'cnt\'))">' + label + '</div>';
  });
  html += '</div>';

  // Filter & sort goals
  let filtered = [...GOALS];
  if (goalFilter === 'active') filtered = filtered.filter(g => g.c < g.t && !g.paused);
  else if (goalFilter === 'completed') filtered = filtered.filter(g => g.c >= g.t);
  else if (goalFilter === 'paused') filtered = filtered.filter(g => g.paused);
  if (goalSort === 'progress') filtered.sort((a, b) => (b.c / b.t) - (a.c / a.t));
  else if (goalSort === 'name') filtered.sort((a, b) => a.n.localeCompare(b.n));
  else if (goalSort === 'due') filtered.sort((a, b) => new Date(a.due) - new Date(b.due));
  else if (goalSort === 'amount') filtered.sort((a, b) => b.t - a.t);

  // Goal rows
  if (!filtered.length) {
    html += '<div style="padding:40px;text-align:center;border:1px solid var(--border);border-radius:12px"><div style="font-size:28px;margin-bottom:8px">🎯</div><div style="font-size:12px;color:var(--text-tertiary)">' + (goalFilter === 'all' ? 'No goals yet. Tap + to create one.' : 'No matching goals.') + '</div></div>';
  } else {
    html += '<div style="display:flex;flex-direction:column">';
    filtered.forEach(g => {
      const p = Math.max(0, Math.min(g.c / g.t, 1));
      const pct = (p * 100).toFixed(0);
      const remaining = g.t - g.c;
      const isCompleted = g.c >= g.t;
      const barColor = isCompleted ? 'var(--emerald)' : p >= 0.7 ? 'var(--emerald)' : p >= 0.4 ? 'var(--amber)' : 'var(--accent)';
      const bgColor = isCompleted ? 'var(--emerald-light,oklch(0.22 0.05 155))' : p >= 0.7 ? 'var(--emerald-light,oklch(0.22 0.05 155))' : p >= 0.4 ? 'oklch(0.22 0.04 75)' : 'var(--accent-light,oklch(0.22 0.06 265))';
      const segClass = isCompleted || p >= 0.7 ? '' : p >= 0.4 ? 'amber' : 'accent';
      const filledSegs = Math.round(p * 10);
      const today = new Date(); today.setHours(0,0,0,0);
      const dueDate = new Date(g.due); dueDate.setHours(0,0,0,0);
      const daysLeft = Math.ceil((dueDate - today) / 86400000);

      html += '<div style="display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid var(--border-light,oklch(0.2 0.015 260));cursor:pointer" onclick="expandedGoal=' + (expandedGoal === g.id ? 'null' : g.id) + ';renderGoals(document.getElementById(\'cnt\'))">';
      html += '<div style="width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;background:' + bgColor + '">' + g.e + '</div>';
      html += '<div style="flex:1;min-width:0">';
      html += '<div style="font-size:13px;font-weight:600;letter-spacing:-0.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + g.n + '</div>';
      html += '<div style="font-size:10px;color:var(--text-tertiary);font-feature-settings:\'tnum\';margin-top:1px">' + fmt(g.c) + ' / ' + fmt(g.t) + ' · ' + (g.due || 'No deadline') + '</div>';
      // Segmented bar
      html += '<div style="display:flex;gap:2px;margin-top:6px">';
      for (let i = 0; i < 10; i++) {
        html += '<div style="height:3px;flex:1;border-radius:1.5px;background:' + (i < filledSegs ? barColor : 'var(--border)') + '"></div>';
      }
      html += '</div></div>';
      html += '<div style="text-align:right;flex-shrink:0"><div style="font-size:15px;font-weight:800;font-feature-settings:\'tnum\';color:' + barColor + '">' + pct + '%</div><div style="font-size:9px;color:var(--text-tertiary);font-feature-settings:\'tnum\';margin-top:1px">' + (remaining > 0 ? fmt(remaining) + ' left' : '✅ Done') + '</div></div>';
      html += '</div>';

      // Expanded detail
      if (expandedGoal === g.id) {
        const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30));
        const monthlyReq = remaining > 0 ? remaining / monthsLeft : 0;
        const linkedCats = g.linkedCats && g.linkedCats.length ? g.linkedCats : (g.linkedCat ? [g.linkedCat] : []);
        const isSynced = linkedCats.length > 0;
        html += '<div style="padding:12px 0 14px;border-bottom:1px solid var(--border-light,oklch(0.2 0.015 260))">';
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">';
        html += '<div style="padding:8px 10px;background:var(--bg-card);border:1px solid var(--border);border-radius:8px"><div style="font-size:8px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">' + t('goal_remaining') + '</div><div style="font-size:12px;font-weight:700;font-feature-settings:\'tnum\'">' + fmt(remaining) + '</div></div>';
        html += '<div style="padding:8px 10px;background:var(--bg-card);border:1px solid var(--border);border-radius:8px"><div style="font-size:8px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">' + t('goal_days_left') + '</div><div style="font-size:12px;font-weight:700;font-feature-settings:\'tnum\';color:' + (daysLeft < 0 ? 'var(--rose)' : daysLeft <= 30 ? 'var(--amber)' : 'var(--text-primary)') + '">' + (daysLeft > 0 ? daysLeft + 'd' : t('goal_overdue')) + '</div></div>';
        html += '<div style="padding:8px 10px;background:var(--bg-card);border:1px solid var(--border);border-radius:8px"><div style="font-size:8px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">' + t('goal_monthly_contrib') + '</div><div style="font-size:12px;font-weight:700;font-feature-settings:\'tnum\'">' + fmt(monthlyReq) + '/mo</div></div>';
        html += '<div style="padding:8px 10px;background:var(--bg-card);border:1px solid var(--border);border-radius:8px"><div style="font-size:8px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">' + t('goal_sync') + '</div><div style="font-size:12px;font-weight:700">' + (isSynced ? '🔗 ' + linkedCats.join(', ') : t('goal_manual')) + '</div></div>';
        html += '</div>';
        html += '<div style="display:flex;gap:8px"><button class="btn bs" style="font-size:10px;padding:6px 14px" onclick="event.stopPropagation();editGoal(' + g.id + ')"><i data-lucide="pencil" width="10" height="10"></i> ' + t('goal_edit') + '</button><button class="btn bs" style="font-size:10px;padding:6px 14px" onclick="event.stopPropagation();addMoneyToGoal(' + g.id + ')"><i data-lucide="plus" width="10" height="10"></i> Add</button><button class="btn bd" style="font-size:10px;padding:6px 14px" onclick="event.stopPropagation();deleteGoal(' + g.id + ')"><i data-lucide="trash-2" width="10" height="10"></i></button></div>';
        html += '</div>';
      }
    });
    html += '</div>';
  }
  return html;
}

function renderMobileBudgetTab(MD, year) {
  let html = '';
  const mf = document.getElementById('mf').value;
  const budgetTotal = getYearlyBudgetTotal(year);
  let pInc, pExp, pSav;
  if (mf === 'total') { pInc = MD.reduce((s, m) => s + m.i, 0); pExp = MD.reduce((s, m) => s + m.e, 0); pSav = MD.reduce((s, m) => s + m.s, 0); }
  else { pInc = MD[+mf].i; pExp = MD[+mf].e; pSav = MD[+mf].s; }
  const monthlyBudget = mf === 'total' ? budgetTotal : getMonthlyBudget(year, +mf);

  // Summary pills
  html += '<div style="display:flex;gap:8px;margin-bottom:18px">';
  html += '<div style="flex:1;padding:12px 10px;border-radius:12px;background:var(--bg-card);border:1px solid var(--border);text-align:center"><div style="font-size:14px;font-weight:800;font-feature-settings:\'tnum\';color:var(--emerald)">' + fmt(pInc) + '</div><div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-tertiary)">Income</div></div>';
  html += '<div style="flex:1;padding:12px 10px;border-radius:12px;background:var(--bg-card);border:1px solid var(--border);text-align:center"><div style="font-size:14px;font-weight:800;font-feature-settings:\'tnum\';color:var(--rose)">' + fmt(pExp) + '</div><div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-tertiary)">Spent</div></div>';
  html += '<div style="flex:1;padding:12px 10px;border-radius:12px;background:var(--bg-card);border:1px solid var(--border);text-align:center"><div style="font-size:14px;font-weight:800;font-feature-settings:\'tnum\';color:var(--blue)">' + fmt(pSav) + '</div><div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-tertiary)">Saved</div></div>';
  html += '</div>';

  // Progress bars
  const incPct = monthlyBudget > 0 ? Math.min((pInc / monthlyBudget * 100), 100).toFixed(0) : 0;
  const expPct = monthlyBudget > 0 ? Math.min((pExp / monthlyBudget * 100), 100).toFixed(0) : 0;
  const savPct = pInc > 0 ? Math.min((pSav / pInc * 100), 100).toFixed(0) : 0;
  const periodLabel = mf === 'total' ? year + ' Progress' : MONTH_NAMES[+mf] + ' Progress';

  html += '<div style="margin-bottom:20px"><div style="font-size:13px;font-weight:700;margin-bottom:12px;letter-spacing:-0.01em">' + periodLabel + '</div>';
  // Income
  html += '<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px"><span style="font-size:11px;font-weight:600;color:var(--text-secondary)">' + t('dash_income') + ' vs Budget</span><span style="font-size:11px;font-weight:700;color:var(--emerald);font-feature-settings:\'tnum\'">' + incPct + '%</span></div><div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden"><div style="height:100%;width:' + incPct + '%;background:var(--emerald);border-radius:3px;transition:width 600ms cubic-bezier(0.22,1,0.36,1)"></div></div><div style="display:flex;justify-content:space-between;font-size:9px;color:var(--text-tertiary);font-feature-settings:\'tnum\';margin-top:3px"><span>' + fmt(pInc) + ' earned</span><span>' + fmt(monthlyBudget) + ' planned</span></div></div>';
  // Expense
  html += '<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px"><span style="font-size:11px;font-weight:600;color:var(--text-secondary)">' + t('dash_expense') + ' vs Budget</span><span style="font-size:11px;font-weight:700;color:' + (expPct > 90 ? 'var(--rose)' : 'var(--amber)') + ';font-feature-settings:\'tnum\'">' + expPct + '%</span></div><div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden"><div style="height:100%;width:' + expPct + '%;background:' + (expPct > 90 ? 'var(--rose)' : 'var(--amber)') + ';border-radius:3px;transition:width 600ms cubic-bezier(0.22,1,0.36,1)"></div></div><div style="display:flex;justify-content:space-between;font-size:9px;color:var(--text-tertiary);font-feature-settings:\'tnum\';margin-top:3px"><span>' + fmt(pExp) + ' spent</span><span>' + fmt(monthlyBudget) + ' budgeted</span></div></div>';
  // Savings rate
  html += '<div><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px"><span style="font-size:11px;font-weight:600;color:var(--text-secondary)">' + t('an_savings_rate') + '</span><span style="font-size:11px;font-weight:700;color:var(--blue);font-feature-settings:\'tnum\'">' + savPct + '%</span></div><div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden"><div style="height:100%;width:' + savPct + '%;background:var(--blue);border-radius:3px;transition:width 600ms cubic-bezier(0.22,1,0.36,1)"></div></div><div style="display:flex;justify-content:space-between;font-size:9px;color:var(--text-tertiary);font-feature-settings:\'tnum\';margin-top:3px"><span>' + fmt(pSav) + ' saved</span><span>' + fmt(pInc) + ' income</span></div></div>';
  html += '</div>';

  // Overspent categories
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const STATUS_PLANS = JSON.parse(safeGet('ft_budget_plans') || '{}');
  const statusYearKey = String(currentYear);
  const statusYearPlans2 = STATUS_PLANS[statusYearKey] || {};
  const statusMonthPlan2 = statusYearPlans2[String(currentMonth)] || statusYearPlans2[currentMonth] || null;
  if (statusMonthPlan2 && statusMonthPlan2.expCats) {
    const monthTxns = TXN.filter(tx => { const d = new Date(tx.d); return d.getFullYear() === currentYear && d.getMonth() === currentMonth && tx.t === 'Expense'; });
    const overspentCats = [];
    Object.entries(statusMonthPlan2.expCats).forEach(([cat, budget]) => { if (budget <= 0) return; const spentCents = monthTxns.filter(tx => tx.c === cat || (tx.c && tx.c.toLowerCase() === cat.toLowerCase())).reduce((s, tx) => s + tx.a, 0); const spentReal = spentCents / 100; if (spentReal > budget) overspentCats.push({ cat, budget, spent: spentReal, over: Math.round((spentReal - budget) * 100) / 100 }); });
    if (overspentCats.length > 0) {
      html += '<div style="height:1px;background:var(--border);margin:18px 0"></div>';
      html += '<div style="margin-bottom:18px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><span style="font-size:13px;font-weight:700;color:var(--rose)">⚠️ Overspent</span><span style="font-size:10px;color:var(--text-tertiary)">' + MONTH_NAMES[currentMonth] + ' ' + currentYear + '</span></div>';
      overspentCats.forEach(item => {
        const pctOver = ((item.spent / item.budget) * 100).toFixed(0);
        const catEmoji = SCHEMA.Expense && SCHEMA.Expense[item.cat] ? (SCHEMA.Expense[item.cat].emoji || '📦') : '📦';
        html += '<div style="background:var(--bg-card);border:1px solid oklch(0.3 0.05 15);border-radius:12px;padding:14px;margin-bottom:8px">';
        html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><div style="display:flex;align-items:center;gap:10px"><div style="font-size:16px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:oklch(0.22 0.04 15);border-radius:8px">' + catEmoji + '</div><div><div style="font-size:12px;font-weight:600">' + item.cat + '</div><div style="font-size:10px;color:var(--text-tertiary);font-feature-settings:\'tnum\'">' + fmt(item.spent) + ' / ' + fmt(item.budget) + ' (' + pctOver + '%)</div></div></div><div style="font-size:12px;font-weight:700;color:var(--rose);font-feature-settings:\'tnum\'">-' + fmt(item.over) + '</div></div>';
        html += '<div style="height:4px;background:var(--border);border-radius:2px;overflow:hidden;margin-bottom:10px"><div style="height:100%;width:100%;background:var(--rose);border-radius:2px"></div></div>';
        html += '<button class="btn bp cover-btn" data-cover-cat="' + item.cat.replace(/"/g, '"') + '" data-cover-over="' + item.over + '" data-cover-year="' + currentYear + '" data-cover-month="' + currentMonth + '" style="font-size:11px;padding:7px 14px"><i data-lucide="arrow-right-left" width="11" height="11"></i> Cover from another category</button>';
        html += '</div>';
      });
      html += '</div>';
    }
  }

  // Monthly budget cards (horizontal scroll)
  html += '<div style="height:1px;background:var(--border);margin:0 0 18px"></div>';
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><span style="font-size:13px;font-weight:700;letter-spacing:-0.01em">' + t('goal_budget_planner') + '</span><select class="fsel" style="font-size:10px;padding:4px 20px 4px 8px" onchange="goalBudgetYear=parseInt(this.value);renderGoals(document.getElementById(\'cnt\'))">' + YEARS.map(y => '<option value="' + y + '"' + (y === year ? ' selected' : '') + '>' + y + '</option>').join('') + '</select></div>';

  const BUDGET_PLANS = JSON.parse(safeGet('ft_budget_plans') || '{}');
  const yearKey = String(year);
  const yearPlan = BUDGET_PLANS[yearKey] || {};

  html += '<div style="display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;padding-bottom:14px;scrollbar-width:none" class="mob-budget-scroll">';
  MD.forEach((m, idx) => {
    const plan = yearPlan[String(idx)] || yearPlan[idx] || null;
    const hasPlan = !!plan;
    const planInc = plan ? (plan.incCats ? Object.values(plan.incCats).reduce((s, v) => s + v, 0) : (plan.i || 0)) : 0;
    const planExp = plan ? (plan.expCats ? Object.values(plan.expCats).reduce((s, v) => s + v, 0) : (plan.e || 0)) : 0;
    const planSav = plan ? (plan.s || 0) : 0;
    const isCurrentMonth = idx === new Date().getMonth() && year === new Date().getFullYear();

    html += '<div style="min-width:160px;scroll-snap-align:start;background:var(--bg-card);border:1px solid ' + (isCurrentMonth ? 'var(--accent)' : 'var(--border)') + ';border-radius:14px;padding:14px;flex-shrink:0;cursor:pointer" onclick="showBudgetRowMenu(event,' + year + ',' + idx + ',' + hasPlan + ')">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><span style="font-size:12px;font-weight:700">' + MONTH_NAMES[idx] + (isCurrentMonth ? ' ●' : '') + '</span>';
    if (hasPlan) html += '<span style="font-size:8px;font-weight:600;color:var(--accent);background:var(--accent-light);padding:2px 6px;border-radius:4px">' + t('misc_planned') + '</span>';
    else html += '<span style="font-size:8px;color:var(--text-tertiary)">No plan</span>';
    html += '</div>';
    if (hasPlan) {
      html += '<div style="display:flex;flex-direction:column;gap:5px">';
      html += '<div style="display:flex;justify-content:space-between;font-size:11px"><span style="color:var(--text-secondary)">Income</span><span style="color:var(--emerald);font-weight:600;font-feature-settings:\'tnum\'">' + fmtR(planInc) + '</span></div>';
      html += '<div style="display:flex;justify-content:space-between;font-size:11px"><span style="color:var(--text-secondary)">Expense</span><span style="color:var(--rose);font-weight:600;font-feature-settings:\'tnum\'">' + fmtR(planExp) + '</span></div>';
      html += '<div style="display:flex;justify-content:space-between;font-size:11px"><span style="color:var(--text-secondary)">Savings</span><span style="color:var(--blue);font-weight:600;font-feature-settings:\'tnum\'">' + fmtR(planSav) + '</span></div>';
      html += '</div>';
    } else {
      html += '<div style="padding:12px 0;text-align:center;font-size:11px;color:var(--text-tertiary)">Tap to set budget</div>';
    }
    html += '</div>';
  });
  html += '</div>';

  return html;
}

// === BUDGET ALERTS (v15.4 — Actually functional) ===
function checkBudgetAlerts() {
  if (safeGet('ft_budget_alerts') === 'off') return;
  const year = getSelectedYear();
  const currentMonth = new Date().getMonth();
  const BUDGET_PLANS = JSON.parse(safeGet('ft_budget_plans') || '{}');
  const yearKey = String(year);
  const monthPlan = BUDGET_PLANS[yearKey] && (BUDGET_PLANS[yearKey][String(currentMonth)] || BUDGET_PLANS[yearKey][currentMonth]);
  if (!monthPlan || !monthPlan.expCats) return;

  const monthTxns = TXN.filter(tx => {
    const d = new Date(tx.d);
    return d.getFullYear() === year && d.getMonth() === currentMonth && tx.t === 'Expense';
  });

  const dismissed = JSON.parse(safeGet('ft_budget_alerts_dismissed_' + year + '_' + currentMonth) || '[]');

  Object.entries(monthPlan.expCats).forEach(([cat, budget]) => {
    if (budget <= 0) return;
    const spent = monthTxns.filter(tx => tx.c === cat).reduce((s, tx) => s + tx.a, 0);
    if (spent > budget && !dismissed.includes(cat)) {
      dismissed.push(cat);
      safeSave('ft_budget_alerts_dismissed_' + year + '_' + currentMonth, JSON.stringify(dismissed));
      const overBy = spent - budget;
      toast(`⚠️ Budget exceeded: ${cat} is over by ${fmt(overBy)} (${fmt(spent)} / ${fmt(budget)})`);
      if (typeof addSystemNotification === 'function') addSystemNotification(`Budget exceeded: ${cat} over by ${fmt(overBy)}`, 'budget');
    }
  });
}
