// === ACCOUNTS PAGE (V2.0.4) ===
// Accounts & liabilities moved OUT of Settings into their own page.
// Opens from Home (tap the Net Worth hero on mobile, the Net Worth card on desktop)
// or the sidebar. The money functions (add/edit/delete/adjust) still live in settings.js,
// untouched, so no data or balances can be corrupted by this page.
// Data: reads ACCOUNTS / getAccountBalance / ftLiabPaid / getNetWorth (data.js), saves via saveACCOUNTS().

// === RENDER: whole page ===
function renderAccounts(c) {
  const assets = ACCOUNTS.filter(a => a.type === 'asset');
  const liabilities = ACCOUNTS.filter(a => a.type === 'liability');
  const totalAssets = assets.reduce((s, a) => s + ftAccBalanceMYR(a.id), 0); // base: fmt() converts once
  const totalLiabs = ftLiabilitiesMYR();
  const hasMultiCurrency = ACCOUNTS.some(a => (a.currency || FT_BASE) !== displayCurrency);
  const rateTime = ratesLastUpdated ? new Date(ratesLastUpdated).toLocaleString() : 'Never';

  let html = '';
  html += `<div class="ft-acc-page">`;
  html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">`;
  html += `<div style="font-size:16px;font-weight:700;display:flex;align-items:center;gap:8px"><i data-lucide="building-2" width="17" height="17" style="color:var(--accent)"></i> ${t('acc_title')}</div>`;
  html += `<button class="btn bp" style="font-size:12px;padding:7px 14px" onclick="openAccountModal()"><i data-lucide="plus" width="12" height="12"></i> ${t('acc_add')}</button>`;
  html += `</div>`;

  if (hasMultiCurrency) {
    html += `<div style="border:1px solid var(--border);border-radius:10px;padding:10px 14px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;background:var(--bg-primary)"><div style="display:flex;align-items:center;gap:8px"><span style="font-size:12px">💱</span><div><div style="font-size:11px;font-weight:500">Multi-currency active · Display: ${displayCurrency}</div><div style="font-size:9px;color:var(--text-tertiary)">Rates updated: ${rateTime}</div></div></div><button class="btn bs" style="font-size:10px;padding:4px 10px" onclick="fetchExchangeRates().then(()=>{toast('✅ Rates refreshed');ftRerenderAccounts()})">↻ Refresh</button></div>`;
  }

  // Net Worth summary card (visual only; same getNetWorth() the dashboard uses)
  html += `<div class="ft-acc-networth"><div><div class="ft-acc-nw-label">${t('dash_net_worth')}</div><div class="ft-acc-nw-sub">${t('acc_assets')} ${fmt(totalAssets)} · ${t('acc_liabs')} -${fmt(totalLiabs)}</div></div><div class="ft-acc-nw-val">${fmt(getNetWorth())}</div></div>`;

  if (ACCOUNTS.length > 1) {
    html += `<div style="font-size:10px;color:var(--text-tertiary);margin:10px 0 6px">${t('acc_drag_hint')}</div>`;
  }

  // Assets
  if (assets.length) {
    html += `<div style="font-size:10px;font-weight:700;color:var(--emerald);text-transform:uppercase;letter-spacing:.06em;margin:14px 0 8px;display:flex;justify-content:space-between;align-items:center"><span>${t('acc_assets')}</span><span style="font-size:11px;font-feature-settings:'tnum'">${fmt(totalAssets)}</span></div>`;
    assets.forEach((a) => { html += ftAssetRow(a); });
  }

  // Liabilities
  if (liabilities.length) {
    html += `<div style="font-size:10px;font-weight:700;color:var(--rose);text-transform:uppercase;letter-spacing:.06em;margin:18px 0 8px;display:flex;justify-content:space-between;align-items:center"><span>${t('acc_liabs')}</span><span style="font-size:11px;font-feature-settings:'tnum'">-${fmt(totalLiabs)}</span></div>`;
    liabilities.forEach((a) => { html += ftLiabRow(a); });
  }

  if (!ACCOUNTS.length) {
    html += `<div style="padding:40px 20px;text-align:center;color:var(--text-tertiary)"><div style="font-size:34px;margin-bottom:8px">🏦</div><div style="font-size:13px;font-weight:600;color:var(--text-primary)">${t('acc_empty_title')}</div><div style="font-size:11px;margin-top:3px">${t('acc_empty_desc')}</div></div>`;
  }

  html += `</div>`;
  c.innerHTML = html;
  lucide.createIcons();
  ftInitAccDrag(c);
}

// One asset row. Drag handle on the left, edit/adjust/delete on the right.
function ftAssetRow(a) {
  const bal = getAccountBalance(a.id);
  const cur = a.currency || FT_BASE;
  const showDual = cur !== displayCurrency;
  const displayBal = convertFromTo(bal, cur, FT_BASE); // base: fmt() converts to display once
  const nativeBalStr = fmtIn(bal, cur);
  const displayBalStr = showDual ? `<div style="font-size:10px;color:var(--text-tertiary)">≈ ${fmt(displayBal)}</div>` : '';
  const idJs = ftArg(String(a.id));
  return `<div class="ft-acc-row" data-acc-id="${ftEsc(String(a.id))}" data-acc-type="asset" style="border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;background:var(--bg-card)">${FT_ACC_GRIP}<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600;margin-bottom:2px">${ftEsc(a.name)}</div><div style="font-size:10px;color:var(--text-tertiary)">${a.accountType} · ${cur}${a.notes ? ' · ' + ftEsc(a.notes) : ''}</div><div style="font-size:10px;color:var(--text-tertiary);margin-top:2px">Starting: ${fmtIn(a.initialBalance, cur)}</div></div><div style="display:flex;align-items:center;gap:10px"><div style="text-align:right"><div style="font-size:15px;font-weight:800;font-feature-settings:'tnum';color:${bal >= 0 ? 'var(--emerald)' : 'var(--rose)'}">${nativeBalStr}</div>${displayBalStr}<div style="font-size:9px;color:var(--text-tertiary)">Current</div></div><div style="display:flex;gap:3px"><button class="abtn" style="width:22px;height:22px;font-size:9px" onclick="openEditAccount(${idJs})" title="Edit">✏️</button><button class="abtn" style="width:22px;height:22px;font-size:9px" onclick="adjustAccountBalance(${idJs})" title="Adjust">⚖️</button><button class="abtn del" style="width:22px;height:22px;font-size:9px" onclick="deleteAccount(${idJs})" title="Delete">🗑</button></div></div></div>`;
}

// One liability row (owed minus linked payments, never mutated).
function ftLiabRow(a) {
  const cur = a.currency || FT_BASE;
  const bal = getAccountBalance(a.id);
  const showDual = cur !== displayCurrency;
  const nativeStr = fmtIn(-Math.abs(bal), cur);
  const displayStr = showDual ? `<div style="font-size:10px;color:var(--text-tertiary)">≈ ${fmt(-convertFromTo(Math.abs(bal), cur, FT_BASE))}</div>` : '';
  const paidSoFar = ftLiabPaid(a);
  const idJs = ftArg(String(a.id));
  return `<div class="ft-acc-row" data-acc-id="${ftEsc(String(a.id))}" data-acc-type="liability" style="border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;background:var(--bg-card)">${FT_ACC_GRIP}<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600;margin-bottom:2px">${ftEsc(a.name)}</div><div style="font-size:10px;color:var(--text-tertiary)">${a.accountType} · ${cur}</div>${paidSoFar > 0 ? `<div style="font-size:10px;color:var(--text-tertiary);margin-top:2px">Owed: ${fmtIn(a.initialBalance, cur)} · Paid: ${fmtIn(paidSoFar, cur)}</div>` : ''}</div><div style="display:flex;align-items:center;gap:10px"><div style="text-align:right"><div style="font-size:15px;font-weight:800;color:var(--rose);font-feature-settings:'tnum'">${nativeStr}</div>${displayStr}</div><div style="display:flex;gap:3px"><button class="abtn" style="width:22px;height:22px;font-size:9px" onclick="openEditAccount(${idJs})" title="Edit">✏️</button><button class="abtn del" style="width:22px;height:22px;font-size:9px" onclick="deleteAccount(${idJs})" title="Delete">🗑</button></div></div></div>`;
}

// Re-render only if the Accounts page is open. Called by settings.js after add/edit/delete/adjust.
function ftRerenderAccounts() {
  if (typeof curPage !== 'undefined' && curPage === 'accounts') {
    renderAccounts(document.getElementById('cnt'));
  }
}

// === ACCOUNT DRAG REORDER (V2.0.4) ===
// Hold an account ~0.4s (or grab the grip for instant drag), then drag up/down.
// Assets and liabilities reorder inside their own group. Moving your finger before the hold = normal scroll.
var FT_ACC_GRIP = '<span class="ft-acc-grip" title="Drag to reorder" style="cursor:grab;touch-action:none;color:var(--text-tertiary);font-size:15px;padding:6px 10px 6px 0;margin-left:-6px;line-height:1">⠿</span>';
var FT_DRAG_HOLD_MS = 400;

function ftScrollParent(el) {
  var p = el && el.parentElement;
  while (p && p !== document.body) {
    var oy = getComputedStyle(p).overflowY;
    if ((oy === 'auto' || oy === 'scroll') && p.scrollHeight > p.clientHeight) return p;
    p = p.parentElement;
  }
  return document.scrollingElement || document.documentElement;
}

function ftInitAccDrag(root) {
  if (!root) return;
  Array.prototype.forEach.call(root.querySelectorAll('.ft-acc-row'), function(row) {
    // Android long-press opens a context menu; block it only while holding/dragging
    row.addEventListener('contextmenu', function(e) { if (row._ftHold || row._ftDragging) e.preventDefault(); });
    row.addEventListener('touchstart', function(e) { if (e.touches.length === 1) ftAccPress(e, row, e.touches[0], true); }, { passive: true });
    row.addEventListener('mousedown', function(e) { if (e.button === 0) ftAccPress(e, row, e, false); });
  });
}

function ftAccPress(e, row, pt, isTouch) {
  if (e.target.closest('button, a, input, select, label')) return;
  var onGrip = !!e.target.closest('.ft-acc-grip');
  var st = { row: row, x0: pt.clientX, y0: pt.clientY, y: pt.clientY, active: false, timer: null };
  var moveEv = isTouch ? 'touchmove' : 'mousemove';
  var upEv = isTouch ? 'touchend' : 'mouseup';
  var move = function(ev) {
    var p = isTouch ? ev.touches[0] : ev;
    if (!p) return;
    st.y = p.clientY;
    if (!st.active) {
      // finger moved before the hold finished = user is scrolling, not dragging
      if (Math.abs(p.clientX - st.x0) > 8 || Math.abs(p.clientY - st.y0) > 8) finish(false);
      return;
    }
    if (ev.cancelable) ev.preventDefault(); // stop the page scrolling while dragging
    ftAccDragMove(st);
  };
  var up = function() { finish(true); };
  var cancel = function() { finish(false); };
  var finish = function(commit) {
    clearTimeout(st.timer);
    row._ftHold = false;
    document.removeEventListener(moveEv, move, isTouch ? { passive: false } : false);
    document.removeEventListener(upEv, up);
    document.removeEventListener('touchcancel', cancel);
    if (st.active) ftAccDragEnd(st, commit);
  };
  document.addEventListener(moveEv, move, isTouch ? { passive: false } : false);
  document.addEventListener(upEv, up);
  if (isTouch) document.addEventListener('touchcancel', cancel);
  row._ftHold = true;
  if (onGrip) { if (!isTouch) e.preventDefault(); ftAccDragStart(st); }
  else st.timer = setTimeout(function() { ftAccDragStart(st); }, FT_DRAG_HOLD_MS);
}

function ftAccDragStart(st) {
  var row = st.row;
  var type = row.getAttribute('data-acc-type');
  st.list = Array.prototype.slice.call(document.querySelectorAll('.ft-acc-row[data-acc-type="' + type + '"]'));
  if (st.list.length < 2) return;
  st.active = true;
  row._ftDragging = true;
  st.from = st.list.indexOf(row);
  st.to = st.from;
  st.startY = st.y;
  st.scroller = ftScrollParent(row);
  st.scroll0 = st.scroller.scrollTop;
  st.centers = st.list.map(function(r) { var b = r.getBoundingClientRect(); return b.top + b.height / 2; });
  st.h = row.getBoundingClientRect().height + 8; // row + its 8px gap
  try { if (navigator.vibrate) navigator.vibrate(15); } catch (x) {}
  document.body.style.userSelect = 'none';
  st.list.forEach(function(r) { if (r !== row) r.style.transition = 'transform 160ms ease'; });
  row.style.transition = 'box-shadow 160ms ease';
  row.style.position = 'relative';
  row.style.zIndex = '5';
  row.style.background = 'var(--bg-card)';
  row.style.boxShadow = 'var(--shadow-lg)';
  row.style.borderColor = 'var(--accent)';
  row.style.transform = 'scale(1.02)';
  st.auto = setInterval(function() { ftAccAutoScroll(st); }, 16);
}

function ftAccDragMove(st) {
  var dy = (st.y - st.startY) + (st.scroller.scrollTop - st.scroll0);
  st.row.style.transform = 'translateY(' + dy + 'px) scale(1.02)';
  var c = st.centers[st.from] + dy, to = st.from;
  for (var i = 0; i < st.list.length; i++) {
    if (i < st.from && c < st.centers[i] && to === st.from) to = i;
    if (i > st.from && c > st.centers[i]) to = i;
  }
  st.to = to;
  st.list.forEach(function(r, i) {
    if (i === st.from) return;
    var s = 0;
    if (st.from < to && i > st.from && i <= to) s = -st.h;
    if (st.from > to && i >= to && i < st.from) s = st.h;
    r.style.transform = s ? 'translateY(' + s + 'px)' : '';
  });
}

// Drag near the top/bottom edge = page scrolls so long lists still work (bottom edge is bigger for the nav bar)
function ftAccAutoScroll(st) {
  var H = window.innerHeight, v = 0;
  if (st.y < 80) v = -Math.ceil((80 - st.y) / 6);
  else if (st.y > H - 120) v = Math.ceil((st.y - (H - 120)) / 6);
  if (!v) return;
  var before = st.scroller.scrollTop;
  st.scroller.scrollTop = before + v;
  if (st.scroller.scrollTop !== before) ftAccDragMove(st);
}

function ftAccDragEnd(st, commit) {
  clearInterval(st.auto);
  st.row._ftDragging = false;
  document.body.style.userSelect = '';
  if (commit && st.to !== st.from) {
    var ids = st.list.map(function(r) { return r.getAttribute('data-acc-id'); });
    var moved = ids.splice(st.from, 1)[0];
    ids.splice(st.to, 0, moved);
    if (ftReorderAccounts(st.row.getAttribute('data-acc-type'), ids)) toast('✅ Order saved');
  }
  ftRerenderAccounts();
}

// Rewrites only the slots of this type, so assets/liabilities stay where they were in ACCOUNTS.
// Returns false WITHOUT touching anything unless the list is exactly this group's ids, in some order.
// Guards: empty group, count mismatch, unknown id, duplicate id, or an id from the other group.
function ftReorderAccounts(type, ids) {
  var slots = [];
  ACCOUNTS.forEach(function(a, i) { if (a.type === type) slots.push(i); });
  if (!slots.length) return false; // nothing to reorder
  var groupIds = slots.map(function(i) { return String(ACCOUNTS[i].id); });
  var want = {};
  groupIds.forEach(function(id) { want[id] = true; });
  var seen = {}, ordered = [];
  for (var k = 0; k < ids.length; k++) {
    var id = String(ids[k]);
    if (!want[id]) return false;   // unknown id or an id from the other group
    if (seen[id]) return false;    // duplicate
    seen[id] = true;
    ordered.push(id);
  }
  if (ordered.length !== groupIds.length) return false; // missing some = would drop accounts
  var byId = {};
  ACCOUNTS.forEach(function(a) { byId[String(a.id)] = a; });
  slots.forEach(function(gi, j) { ACCOUNTS[gi] = byId[ordered[j]]; });
  saveACCOUNTS();
  return true;
}
