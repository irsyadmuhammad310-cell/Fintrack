// === GOALS & BUDGET (v11.5 — Interactive Redesign) ===
let expandedGoal = null;
let expandedCat = null;
let goalBudgetYear = null;
let goalFilter = 'all'; // all, active, completed
let goalSort = 'progress'; // progress, name, due, amount

// Goal data (persisted in localStorage)
const DEFAULT_GOALS = [];
let GOALS = JSON.parse(localStorage.getItem('ft_goals') || 'null') || JSON.parse(JSON.stringify(DEFAULT_GOALS));
let goalNxId = parseInt(localStorage.getItem('ft_goalNxId') || '10');
function saveGOALS() { localStorage.setItem('ft_goals', JSON.stringify(GOALS)); localStorage.setItem('ft_goalNxId', goalNxId); }

function renderGoals(c) {
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
  html += `<div class="goal-kpi" style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:12px 14px"><div style="font-size:9px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Total Goals</div><div class="goal-kpi-val">${GOALS.length}</div><div style="font-size:9px;color:var(--text-tertiary);margin-top:2px">Tracked targets</div></div>`;
  html += `<div class="goal-kpi" style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:12px 14px"><div style="font-size:9px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Goal Progress</div><div class="goal-kpi-val">${overallPct}%</div><div style="font-size:9px;color:var(--text-tertiary);margin-top:2px">Across all plans</div></div>`;
  html += `<div class="goal-kpi" style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:12px 14px"><div style="font-size:9px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Saved So Far</div><div class="goal-kpi-val" style="color:var(--emerald)">${fmt(totalSaved)}</div><div style="font-size:9px;color:var(--text-tertiary);margin-top:2px">Current goal value</div></div>`;
  html += `<div class="goal-kpi" style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:12px 14px"><div style="font-size:9px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Annual Budget</div><div class="goal-kpi-val">${fmt(budgetTotal)}</div><div style="font-size:9px;color:var(--text-tertiary);margin-top:2px">Planned expenses for ${year}</div></div>`;
  html += `<div class="goal-kpi" style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:12px 14px"><div style="font-size:9px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Actual Spent</div><div class="goal-kpi-val" style="color:var(--rose)">${fmt(totalExp)}</div><div style="font-size:9px;color:var(--text-tertiary);margin-top:2px">Transaction synced</div></div>`;
  html += `<div class="goal-kpi" style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:12px 14px"><div style="font-size:9px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Budget Left</div><div class="goal-kpi-val" style="color:${budgetLeft >= 0 ? 'var(--emerald)' : 'var(--rose)'}">${budgetLeft < 0 ? '-' : ''}${fmt(Math.abs(budgetLeft))}</div><div style="font-size:9px;color:var(--text-tertiary);margin-top:2px">Plan minus actual</div></div>`;
  html += `</div>`;

  // === GOAL PROGRESS SECTION ===
  html += `<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px"><div><div style="font-size:16px;font-weight:700">Goal Progress</div><div style="font-size:11px;color:var(--text-tertiary);margin-top:2px">Monitor active goals, track progress, and stay on schedule.</div></div><button class="btn bp" style="font-size:11px;padding:6px 14px" onclick="openGoalModal()"><i data-lucide="plus" width="11" height="11"></i> Add goal</button></div>`;

  // Filter tabs + search + sort
  html += `<div style="display:flex;justify-content:space-between;align-items:center;margin:14px 0 12px;flex-wrap:wrap;gap:8px"><div style="display:flex;gap:4px">`;
  ['all','active','completed','paused'].forEach(f => {
    const label = f.charAt(0).toUpperCase() + f.slice(1);
    html += `<button class="btn ${goalFilter === f ? 'bp' : 'bs'}" style="font-size:10px;padding:5px 12px" onclick="goalFilter='${f}';renderGoals(document.getElementById('cnt'))">${label}</button>`;
  });
  html += `</div><div style="display:flex;gap:6px;align-items:center"><div class="sb2" style="width:160px"><i data-lucide="search" width="12" height="12"></i><input placeholder="Search goals" id="goalSearch" oninput="renderGoals(document.getElementById('cnt'))" style="font-size:11px"></div><select class="fsel" style="font-size:10px;padding:5px 22px 5px 8px" onchange="goalSort=this.value;renderGoals(document.getElementById('cnt'))"><option value="progress"${goalSort==='progress'?' selected':''}>Progress</option><option value="name"${goalSort==='name'?' selected':''}>Name</option><option value="due"${goalSort==='due'?' selected':''}>Deadline</option><option value="amount"${goalSort==='amount'?' selected':''}>Amount</option></select></div></div>`;

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
    const statusLabel = isCompleted ? 'Completed' : 'Active';
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
    html += `<div style="display:flex;justify-content:space-between;align-items:center"><button class="btn bs" style="font-size:10px;padding:4px 10px" onclick="expandedGoal=${isExpanded ? 'null' : g.id};renderGoals(document.getElementById('cnt'))">${isExpanded ? 'Hide' : 'Show'} Details</button>${isSynced ? '<span style="font-size:9px;color:var(--text-tertiary)">Synced</span>' : ''}</div>`;
    html += `</div>`;

    // Expanded details
    if (isExpanded) {
      html += `<div style="padding:0 16px 14px;border-top:1px solid var(--border-light)">`;
      html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0">`;
      html += `<div style="padding:8px 10px;background:var(--bg-primary);border:1px solid var(--border-light);border-radius:6px"><div style="font-size:8px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">Remaining Amount</div><div class="goal-detail-num" style="font-weight:700">${fmt(remaining)}</div></div>`;
      html += `<div style="padding:8px 10px;background:var(--bg-primary);border:1px solid var(--border-light);border-radius:6px"><div style="font-size:8px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">Days Left</div><div class="goal-detail-num" style="font-weight:700;color:${daysLeft < 0 ? 'var(--rose)' : daysLeft <= 30 ? 'var(--amber)' : 'var(--text-primary)'}">${daysLeft > 0 ? daysLeft : 'Overdue'}</div></div>`;
      html += `<div style="padding:8px 10px;background:var(--bg-primary);border:1px solid var(--border-light);border-radius:6px"><div style="font-size:8px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">Estimated Completion</div><div class="goal-detail-num" style="font-weight:700;color:var(--accent)">${isCompleted ? '✅ Done' : estCompDate}</div></div>`;
      html += `<div style="padding:8px 10px;background:var(--bg-primary);border:1px solid var(--border-light);border-radius:6px"><div style="font-size:8px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">Monthly Contribution</div><div class="goal-detail-num" style="font-weight:700">${fmt(avgMonthlySav > 0 ? avgMonthlySav : monthlyReq)}</div></div>`;
      html += `</div>`;
      html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">`;
      html += `<div style="padding:8px 10px;background:var(--bg-primary);border:1px solid var(--border-light);border-radius:6px"><div style="font-size:8px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">Goal Priority</div><div class="goal-detail-num" style="font-weight:700">Medium</div></div>`;
      html += `<div style="padding:8px 10px;background:var(--bg-primary);border:1px solid var(--border-light);border-radius:6px"><div style="font-size:8px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">Synchronization</div><div class="goal-detail-num" style="font-weight:700">${isSynced ? 'Synced: ' + linkedCats.join(', ') : 'Manual'}</div></div>`;
      html += `</div>`;
      html += `<div style="padding:8px 10px;background:var(--bg-primary);border:1px solid var(--border-light);border-radius:6px;margin-bottom:12px;font-size:11px;color:var(--text-tertiary);font-style:italic">No notes yet.</div>`;
      html += `<div style="display:flex;gap:8px"><button class="btn bs" style="font-size:10px;padding:5px 12px" onclick="editGoal(${g.id})">Edit Goal</button><button class="btn bd" style="font-size:10px;padding:5px 12px" onclick="deleteGoal(${g.id})">Delete Goal</button></div>`;
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
  const incPct = budgetTotalForProgress > 0 ? Math.min((pInc / budgetTotalForProgress * 100), 100).toFixed(0) : 0;
  const expPct = budgetTotalForProgress > 0 ? Math.min((pExp / (mf === 'total' ? budgetTotalForProgress : budgetTotalForProgress / 12) * 100), 100).toFixed(0) : 0;
  const savPct = pInc > 0 ? Math.min((pSav / pInc * 100), 100).toFixed(0) : 0;

  html += `<div style="font-size:14px;font-weight:700;margin-bottom:10px">Budget Progress</div>`;
  html += `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px">`;
  html += `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:12px 14px"><div style="font-size:10px;font-weight:600;color:var(--text-secondary);margin-bottom:6px">Income</div><div style="height:5px;background:var(--border);border-radius:3px;overflow:hidden;margin-bottom:4px"><div style="height:100%;width:${incPct}%;background:var(--emerald);border-radius:3px"></div></div><div style="font-size:11px;font-weight:700">${incPct}%</div></div>`;
  html += `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:12px 14px"><div style="font-size:10px;font-weight:600;color:var(--text-secondary);margin-bottom:6px">Expense</div><div style="height:5px;background:var(--border);border-radius:3px;overflow:hidden;margin-bottom:4px"><div style="height:100%;width:${expPct}%;background:var(--rose);border-radius:3px"></div></div><div style="font-size:11px;font-weight:700">${expPct}%</div></div>`;
  html += `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:12px 14px"><div style="font-size:10px;font-weight:600;color:var(--text-secondary);margin-bottom:6px">Savings Rate</div><div style="height:5px;background:var(--border);border-radius:3px;overflow:hidden;margin-bottom:4px"><div style="height:100%;width:${savPct}%;background:var(--blue);border-radius:3px"></div></div><div style="font-size:11px;font-weight:700">${savPct}%</div></div>`;
  html += `</div>`;

  // === BUDGET PLANNER (Editable with Category Breakdown) ===
  const BUDGET_PLANS = JSON.parse(localStorage.getItem('ft_budget_plans') || '{}');
  const yearKey = String(year);
  const yearPlan = BUDGET_PLANS[yearKey] || {};

  html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><div style="font-size:14px;font-weight:700">Budget Planner</div><select class="fsel" onchange="goalBudgetYear=parseInt(this.value);renderGoals(document.getElementById('cnt'))">${YEARS.map(y => '<option value="' + y + '"' + (y === year ? ' selected' : '') + '>' + y + '</option>').join('')}</select></div>`;
  html += `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:20px"><table style="width:100%;border-collapse:collapse;font-size:11px"><thead><tr style="background:var(--bg-primary)"><th style="padding:8px 12px;text-align:left;font-size:10px;font-weight:600;color:var(--text-secondary)">Month</th><th style="padding:8px 12px;text-align:right;font-size:10px;font-weight:600;color:var(--emerald)">Income</th><th style="padding:8px 12px;text-align:right;font-size:10px;font-weight:600;color:var(--rose)">Expense</th><th style="padding:8px 12px;text-align:right;font-size:10px;font-weight:600;color:var(--blue)">Savings</th><th style="padding:8px 12px;text-align:right;font-size:10px;font-weight:600;color:var(--text-secondary)">Net</th><th style="padding:8px 12px;text-align:center;font-size:10px;font-weight:600;color:var(--text-tertiary)">Plan</th></tr></thead><tbody>`;
  MD.forEach((m, idx) => {
    const net = m.i - m.e - m.s;
    const hasData = m.i > 0 || m.e > 0;
    const plan = yearPlan[idx] || null;
    const planInc = plan ? (plan.incCats ? Object.values(plan.incCats).reduce((s, v) => s + v, 0) : (plan.i || 0)) : 0;
    const planExp = plan ? (plan.expCats ? Object.values(plan.expCats).reduce((s, v) => s + v, 0) : (plan.e || 0)) : 0;
    const planSav = plan ? (plan.s || 0) : 0;
    const showPlan = plan && !hasData;
    const dispI = showPlan ? planInc : m.i;
    const dispE = showPlan ? planExp : m.e;
    const dispS = showPlan ? planSav : m.s;
    const dispNet = dispI - dispE - dispS;
    const hasAny = hasData || showPlan;
    const isPlan = showPlan && !hasData;
    html += `<tr style="border-top:1px solid var(--border-light)${!hasAny ? ';opacity:0.35' : ''}${isPlan ? ';font-style:italic' : ''}"><td style="padding:7px 12px;font-weight:500">${MONTH_NAMES[idx]}${isPlan ? ' <span style="font-size:8px;color:var(--accent);font-style:normal;font-weight:600">PLAN</span>' : ''}</td><td style="padding:7px 12px;text-align:right;color:var(--emerald);font-feature-settings:'tnum'">${hasAny ? fmt(dispI) : '-'}</td><td style="padding:7px 12px;text-align:right;color:var(--rose);font-feature-settings:'tnum'">${hasAny ? fmt(dispE) : '-'}</td><td style="padding:7px 12px;text-align:right;color:var(--blue);font-feature-settings:'tnum'">${hasAny ? fmt(dispS) : '-'}</td><td style="padding:7px 12px;text-align:right;font-weight:600;color:${dispNet >= 0 ? 'var(--emerald)' : 'var(--rose)'};font-feature-settings:'tnum'">${hasAny ? fmt(dispNet) : '-'}</td><td style="padding:7px 12px;text-align:center"><button style="border:none;background:none;color:var(--accent);cursor:pointer;font-size:10px;font-weight:500;font-family:var(--font)" onclick="editBudgetMonth(${year},${idx})">✏️</button></td></tr>`;
  });
  html += `</tbody></table></div>`;

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
  const BUDGET_PLANS = JSON.parse(localStorage.getItem('ft_budget_plans') || '{}');
  const yearKey = String(year);
  const existing = (BUDGET_PLANS[yearKey] && BUDGET_PLANS[yearKey][monthIdx]) || {};
  const monthName = MONTH_NAMES[monthIdx];

  // Get categories dynamically from SCHEMA (Settings is the source of truth)
  const incCats = Object.keys(SCHEMA.Income || {});
  const expCats = Object.keys(SCHEMA.Expense || {});
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
  var plans = JSON.parse(localStorage.getItem('ft_budget_plans') || '{}');
  var yearKey = String(year);
  if (!plans[yearKey]) plans[yearKey] = {};

  // Collect income categories
  var incCats = {};
  document.querySelectorAll('.bp_inc').forEach(function(el) {
    var val = parseFloat(el.value) || 0;
    if (val > 0) incCats[el.dataset.cat] = val;
  });

  // Collect expense categories
  var expCats = {};
  document.querySelectorAll('.bp_exp').forEach(function(el) {
    var val = parseFloat(el.value) || 0;
    if (val > 0) expCats[el.dataset.cat] = val;
  });

  var savAmount = parseFloat(document.getElementById('bp_savings').value) || 0;
  var totalInc = Object.values(incCats).reduce(function(s, v) { return s + v; }, 0);
  var totalExp = Object.values(expCats).reduce(function(s, v) { return s + v; }, 0);

  plans[yearKey][monthIdx] = { incCats: incCats, expCats: expCats, s: savAmount, i: totalInc, e: totalExp };
  localStorage.setItem('ft_budget_plans', JSON.stringify(plans));
  document.getElementById('mbudget').remove();
  document.body.style.overflow = '';
  toast('✅ Budget saved for ' + MONTH_NAMES[monthIdx] + ' ' + year);
  renderGoals(document.getElementById('cnt'));
}

function clearBudgetMonth(year, monthIdx) {
  var plans = JSON.parse(localStorage.getItem('ft_budget_plans') || '{}');
  var yearKey = String(year);
  if (plans[yearKey] && plans[yearKey][monthIdx]) {
    delete plans[yearKey][monthIdx];
    localStorage.setItem('ft_budget_plans', JSON.stringify(plans));
  }
  document.getElementById('mbudget').remove();
  document.body.style.overflow = '';
  toast('🗑 Budget cleared');
  renderGoals(document.getElementById('cnt'));
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
      g.c = totalFromTxn;
      changed = true;
    }
  });
  if (changed) saveGOALS();
}
