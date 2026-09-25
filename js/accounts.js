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
  // V2.0.4: back chevron (reverse morph to Home) + title, same as the mockup header
  html += `<div style="display:flex;align-items:center;gap:6px"><button class="ft-acc-back" onclick="ftMorphNav('dashboard')" aria-label="Back"><i data-lucide="chevron-left" width="20" height="20"></i></button><div style="font-size:17px;font-weight:700">${t('acc_title')}</div></div>`;
  html += `<button class="btn bp" style="font-size:12px;padding:7px 14px" onclick="openAccountModal()"><i data-lucide="plus" width="12" height="12"></i> ${t('acc_add')}</button>`;
  html += `</div>`;

  if (hasMultiCurrency) {
    html += `<div style="border:1px solid var(--border);border-radius:10px;padding:10px 14px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;background:var(--bg-primary)"><div style="display:flex;align-items:center;gap:8px"><span style="font-size:12px">💱</span><div><div style="font-size:11px;font-weight:500">Multi-currency active · Display: ${displayCurrency}</div><div style="font-size:9px;color:var(--text-tertiary)">Rates updated: ${rateTime}</div></div></div><button class="btn bs" style="font-size:10px;padding:4px 10px" onclick="fetchExchangeRates().then(()=>{toast('✅ Rates refreshed');ftRerenderAccounts()})">↻ Refresh</button></div>`;
  }

  // Net Worth summary card (visual only; same getNetWorth() the dashboard uses)
  // V2.0.4: same gradient card as Home (data-nw-morph = the shared element the morph flies between)
  html += `<div class="ft-acc-networth ft-nw-card" data-nw-morph><div class="ft-nw-label">${t('dash_net_worth')}</div><div class="ft-acc-nw-val">${fmt(getNetWorth())}</div><div class="ft-nw-sub">${t('acc_assets')} ${fmt(totalAssets)} · ${t('acc_liabs')} -${fmt(totalLiabs)}</div></div>`;

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

// === NET WORTH MORPH (V2.0.4) ===
// Same motion as the mockup: the Net Worth card on Home grows into the Accounts header
// and shrinks back on Back. Spring = stiffness 320, damping 34, mass 1 (the framer-motion values).
// Visual only: never reads or writes money data.
function ftNwTotals() {
  try {
    const assets = ACCOUNTS.filter(a => a.type === 'asset').reduce((s, a) => s + ftAccBalanceMYR(a.id), 0);
    return { assets, liabs: ftLiabilitiesMYR() };
  } catch (e) { return null; }
}

// Spring progress 0 -> 1 sampled per 60fps frame (settles in about 0.45s)
function ftSpringCurve() {
  if (ftSpringCurve._c) return ftSpringCurve._c;
  const k = 320, d = 34, m = 1, sub = 4, dt = 1 / (60 * sub);
  let x = 0, v = 0;
  const out = [0];
  for (let f = 1; f <= 120; f++) {
    for (let s = 0; s < sub; s++) { const acc = (-k * (x - 1) - d * v) / m; v += acc * dt; x += v * dt; }
    out.push(x);
    if (Math.abs(1 - x) < 0.001 && Math.abs(v) < 0.02) break;
  }
  out[out.length - 1] = 1;
  return (ftSpringCurve._c = out);
}

// Everything on the page except the card (and its parents)
function ftMorphSiblings(el, stop) {
  const list = [];
  let node = el;
  while (node && node !== stop && node.parentElement) {
    Array.from(node.parentElement.children).forEach(s => { if (s !== node) list.push(s); });
    node = node.parentElement;
  }
  return list;
}

function ftMorphClone(el) {
  const c = el.cloneNode(true);
  ['onclick', 'data-nw-morph', 'id'].forEach(a => c.removeAttribute(a));
  c.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
  c.querySelectorAll('[onclick]').forEach(n => n.removeAttribute('onclick'));
  Object.assign(c.style, { position: 'absolute', left: '0', top: '0', width: '100%', height: '100%', margin: '0', transform: 'none', transition: 'none', animation: 'none', boxSizing: 'border-box', visibility: 'visible' });
  return c;
}

function ftMorphNav(page, srcEl) {
  const cnt = document.getElementById('cnt');
  if (window._ftMorphing) return;
  const src = srcEl || (cnt && cnt.querySelector('[data-nw-morph]'));
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !cnt || !src || !cnt.contains(src) || typeof src.animate !== 'function') { navigate(page); return; }
  const r0 = src.getBoundingClientRect();
  if (!r0.width || !r0.height) { navigate(page); return; }

  window._ftMorphing = true;
  const unlock = setTimeout(() => { window._ftMorphing = false; }, 2000);
  const EASE = 'cubic-bezier(0.16,1,0.3,1)';
  const rad0 = parseFloat(getComputedStyle(src).borderTopLeftRadius) || 0;

  // Floating shell that carries the card between the two pages
  const shell = document.createElement('div');
  shell.className = 'ft-nw-shell';
  Object.assign(shell.style, { left: r0.left + 'px', top: r0.top + 'px', width: r0.width + 'px', height: r0.height + 'px', borderRadius: rad0 + 'px' });
  const a = ftMorphClone(src);
  shell.appendChild(a);
  document.body.appendChild(shell);
  src.style.visibility = 'hidden';

  // 1) old page fades out around the card (mockup: AnimatePresence mode="wait")
  ftMorphSiblings(src, cnt).forEach(el => el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: 'ease-out', fill: 'forwards' }));

  setTimeout(() => {
    let dst = null, done = false;
    try {
      navigate(page);
      cnt.style.scrollBehavior = 'auto'; cnt.scrollTop = 0; cnt.style.scrollBehavior = '';
      if (typeof applyHideAmounts === 'function') applyHideAmounts();
      dst = cnt.querySelector('[data-nw-morph]');
    } catch (e) { console.warn('[FinTrack] morph:', e); }

    const finish = () => {
      if (done) return; done = true;
      if (dst) dst.style.visibility = '';
      shell.remove();
      clearTimeout(unlock);
      window._ftMorphing = false;
    };
    if (!dst) { const f = shell.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' }); f.onfinish = finish; setTimeout(finish, 400); return; }

    // 2) card flies + resizes to its new spot on the spring, old look cross-fades into the new one
    const r1 = dst.getBoundingClientRect();
    const cs1 = getComputedStyle(dst);
    const rad1 = parseFloat(cs1.borderTopLeftRadius) || 0;
    shell.style.backgroundColor = cs1.backgroundColor;
    shell.style.backgroundImage = cs1.backgroundImage;
    shell.style.boxShadow = cs1.boxShadow;
    dst.style.visibility = 'hidden';
    const b = ftMorphClone(dst);
    Object.assign(b.style, { background: 'none', boxShadow: 'none', opacity: '0' });
    shell.insertBefore(b, a); // old look stays on top and fades away

    const P = ftSpringCurve(), n = P.length - 1, dur = Math.round(n * 1000 / 60);
    const L = (x, y, p) => x + (y - x) * p;
    const frames = P.map((p, i) => ({ offset: i / n, left: L(r0.left, r1.left, p) + 'px', top: L(r0.top, r1.top, p) + 'px', width: L(r0.width, r1.width, p) + 'px', height: L(r0.height, r1.height, p) + 'px', borderRadius: L(rad0, rad1, p) + 'px' }));
    const anim = shell.animate(frames, { duration: dur, easing: 'linear', fill: 'forwards' });
    a.animate([{ opacity: 1 }, { opacity: 0 }], { duration: Math.round(dur * 0.5), easing: 'ease-out', fill: 'forwards' });
    b.animate([{ opacity: 0 }, { opacity: 1 }], { duration: Math.round(dur * 0.6), delay: Math.round(dur * 0.15), easing: 'ease-out', fill: 'forwards' });
    anim.onfinish = finish;
    setTimeout(finish, dur + 400);

    // 3) new page fades in; account rows stagger in like the mockup (assets 150ms + 50ms each, liabilities 400ms + 50ms each)
    let ai = 0, li = 0, k = 0;
    ftMorphSiblings(dst, cnt).forEach(el => {
      let delay;
      if (el.classList.contains('ft-acc-row')) delay = el.dataset.accType === 'liability' ? 400 + (li++) * 50 : 150 + (ai++) * 50;
      else delay = Math.min(60 + (k++) * 40, 300);
      el.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 450, delay, easing: EASE, fill: 'backwards' });
    });
  }, 160);
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
