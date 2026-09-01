// === TRANSACTIONS (V2.0.0) ===
function renderTransactions(c) {
  const selYear = getSelectedYear();
  const selMonth = document.getElementById('mf').value;
  txnYearSel = selYear;
  txnMonthSel = selMonth;

  // v15.8.1: Mobile gets simplified card-free list (unless desktop mode forced)
  if (window.innerWidth <= 900 && safeGet('ft_desktop_mode') !== 'true') {
    renderMobileTransactions(c);
    return;
  }

  c.innerHTML = `<div class="tt"><div class="tf"><div class="sb2"><i data-lucide="search" width="14" height="14"></i><input placeholder="${t('txn_search')}" id="txs" oninput="renderTxnTable()"></div></div></div><div class="tsg" id="txsm"></div><div class="tw"><div style="overflow-x:auto"><table><thead><tr><th>${t('txn_date')}</th><th>${t('txn_type')}</th><th>${t('txn_category')}</th><th>${t('txn_sub')}</th><th>${t('txn_details')}</th><th style="text-align:right">${t('txn_amount')}</th><th style="text-align:center;width:80px">${t('txn_actions')}</th></tr></thead><tbody id="txbody"></tbody></table></div><div class="tp"><span id="txinfo"></span><div class="pb" id="txpg"></div></div></div><button class="txn-fab" id="txnFab" onclick="editId=null;openAdd()" aria-label="Add Transaction"><i data-lucide="plus" width="22" height="22"></i></button>`;
  lucide.createIcons();
  renderTxnTable();
}

// === MOBILE TRANSACTIONS (V1.0.0 — Edit/Delete + Daily totals) ===
function renderMobileTransactions(c) {
  const year = getSelectedYear();
  const m = document.getElementById('mf').value;
  const allTxn = TXN.filter(tx => {
    const dt = new Date(tx.d);
    if (dt.getFullYear() !== year) return false;
    if (m !== 'total' && dt.getMonth() !== +m) return false;
    return true;
  }).sort((a, b) => new Date(b.d) - new Date(a.d));

  const inc = allTxn.filter(tx => tx.t === 'Income').reduce((s, tx) => s + tx.a, 0);
  const exp = allTxn.filter(tx => tx.t === 'Expense').reduce((s, tx) => s + tx.a, 0);
  const bal = inc - exp;

  // Category emoji map
  const catEmoji = (cat) => {
    const map = { 'Food': '🍜', 'Transport': '🚗', 'Shopping': '🛍', 'Bills': '📄', 'Health': '💊', 'Entertainment': '🎬', 'Education': '📚', 'Salary': '💰', 'Freelance': '💻', 'Investment': '📈', 'Savings': '🏦', 'Rent': '🏠', 'Utilities': '⚡', 'Insurance': '🛡', 'Groceries': '🛒', 'Travel': '✈️' };
    for (const [key, emoji] of Object.entries(map)) { if (cat.toLowerCase().includes(key.toLowerCase())) return emoji; }
    return tx => tx.t === 'Income' ? '💰' : tx.t === 'Savings' ? '🏦' : '💸';
  };

  // Group by date
  const grouped = {};
  allTxn.forEach(tx => {
    const dateKey = tx.d;
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(tx);
  });

  // Build mobile filter chips
  let filterHtml = `<div class="mob-filter-chips" id="mobTxnFilters">
    <div class="mob-chip active" onclick="mobTxnFilter('all',this)">${t('txn_all')}</div>
    <div class="mob-chip" onclick="mobTxnFilter('Income',this)">${t('dash_income')}</div>
    <div class="mob-chip" onclick="mobTxnFilter('Expense',this)">${t('dash_expense')}</div>
    <div class="mob-chip" onclick="mobTxnFilter('Savings',this)">Transfer</div>
  </div>`;

  // Build transaction rows
  let listHtml = '';
  Object.entries(grouped).forEach(([date, txns]) => {
    const d = new Date(date);
    const today = new Date(); today.setHours(0,0,0,0);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    let dateLabel;
    if (d.toDateString() === today.toDateString()) dateLabel = t('txn_today');
    else if (d.toDateString() === yesterday.toDateString()) dateLabel = t('txn_yesterday');
    else dateLabel = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: d.getFullYear() !== year ? 'numeric' : undefined });

    // v15.8.2: Calculate daily total expense for this date
    const dayExpense = txns.filter(tx => tx.t === 'Expense').reduce((s, tx) => s + tx.a, 0);
    const dayExpLabel = dayExpense > 0 ? `<span class="mob-txn-day-total">-${fmtD(dayExpense)}</span>` : '';

    listHtml += `<div class="mob-txn-date-header">${dateLabel}${dayExpLabel}</div>`;
    txns.forEach(tx => {
      const emoji = typeof catEmoji(tx.c) === 'function' ? catEmoji(tx.c)(tx) : catEmoji(tx.c);
      const amtColor = tx.t === 'Income' ? 'var(--emerald)' : tx.t === 'Savings' ? 'var(--blue)' : 'var(--rose)';
      const sign = tx.t === 'Income' ? '+' : tx.t === 'Savings' ? '↔' : '-';
      const bgColor = tx.t === 'Income' ? 'var(--emerald-light)' : tx.t === 'Savings' ? 'var(--blue-light)' : 'var(--rose-light)';
      const accName = tx.acc ? (ACCOUNTS.find(a => a.id === tx.acc)?.name || '') : '';
      const toAccName = tx.toAcc ? (ACCOUNTS.find(a => a.id === tx.toAcc)?.name || '') : '';
      const meta = tx.t === 'Savings' && accName && toAccName ? accName + ' → ' + toAccName : [tx.c, tx.s, accName].filter(Boolean).join(' · ');
      listHtml += `<div class="mob-txn-row" data-type="${tx.t}" onclick="doAuth('edit','${String(tx.id).replace(/'/g, "\\'")}')">
        <div class="mob-txn-cat-dot" style="background:${bgColor}">${emoji}</div>
        <div class="mob-txn-info">
          <div class="mob-txn-name">${tx.dt || tx.c}</div>
          <div class="mob-txn-meta">${meta}</div>
        </div>
        <div class="mob-txn-amount" style="color:${amtColor}">${sign}${tx.origAmt && tx.cur ? (CURRENCY_CONFIG[tx.cur] ? CURRENCY_CONFIG[tx.cur].symbol : tx.cur + ' ') + tx.origAmt.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) : fmtD(tx.a)}</div>
      </div>`;
    });
  });

  if (!allTxn.length) {
    listHtml = `<div class="es" style="padding:60px 20px"><div style="font-size:32px;margin-bottom:8px">📭</div><p style="font-size:13px">${t('txn_no_transactions')}<br>${t('txn_tap_to_add')}</p></div>`;
  }

  c.innerHTML = `
    <div class="mob-txn-summary">
      <div class="mob-txn-pill"><div class="mob-txn-pill-label">${t('txn_in')}</div><div class="mob-txn-pill-val income">${fmtD(inc)}</div></div>
      <div class="mob-txn-pill"><div class="mob-txn-pill-label">${t('txn_out')}</div><div class="mob-txn-pill-val expense">${fmtD(exp)}</div></div>
      <div class="mob-txn-pill"><div class="mob-txn-pill-label">${t('txn_net')}</div><div class="mob-txn-pill-val balance">${bal >= 0 ? '+' : ''}${fmtD(bal)}</div></div>
    </div>
    ${filterHtml}
    <div class="mob-txn-list" id="mobTxnList">${listHtml}</div>`;
  lucide.createIcons();
}

// v15.8.1: Mobile filter handler
function mobTxnFilter(type, el) {
  document.querySelectorAll('#mobTxnFilters .mob-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('#mobTxnList .mob-txn-row').forEach(row => {
    if (type === 'all') row.style.display = '';
    else row.style.display = row.dataset.type === type ? '' : 'none';
  });
  // Show/hide date headers with no visible rows
  document.querySelectorAll('#mobTxnList .mob-txn-date-header').forEach(hdr => {
    let next = hdr.nextElementSibling;
    let hasVisible = false;
    while (next && !next.classList.contains('mob-txn-date-header')) {
      if (next.style.display !== 'none') hasVisible = true;
      next = next.nextElementSibling;
    }
    hdr.style.display = hasVisible ? '' : 'none';
  });
}

function renderTxnTable() {
  // v15.3: Always read from global period selector
  const year = getSelectedYear();
  const m = document.getElementById('mf').value;
  txnYearSel = year;
  txnMonthSel = m;
  const s = (document.getElementById('txs')?.value || '').toLowerCase();
  const f = TXN.filter(tx => {
    const dt = new Date(tx.d);
    if (dt.getFullYear() !== year) return false;
    if (m !== 'total' && dt.getMonth() !== +m) return false;
    if (s && !`${tx.c} ${tx.s} ${tx.dt} ${tx.a}`.toLowerCase().includes(s)) return false;
    return true;
  }).sort((a, b) => new Date(b.d) - new Date(a.d));
  const inc = f.filter(tx => tx.t === 'Income').reduce((s, tx) => s + tx.a, 0);
  const exp = f.filter(tx => tx.t === 'Expense').reduce((s, tx) => s + tx.a, 0);
  const sav = f.filter(tx => tx.t === 'Savings').reduce((s, tx) => s + tx.a, 0);
  const net = inc - exp - sav;
  const sm = document.getElementById('txsm');
  if (sm) sm.innerHTML = `<div class="tsi txn-kpi-count"><div class="tsl">${t('txn_count')}</div><div class="tsv">${f.length}</div></div><div class="tsi txn-kpi-income"><div class="tsl">${t('dash_income')}</div><div class="tsv" style="color:var(--emerald)">${fmt(inc)}</div></div><div class="tsi txn-kpi-expense"><div class="tsl">${t('dash_expense')}</div><div class="tsv" style="color:var(--rose)">${fmt(exp)}</div></div><div class="tsi txn-kpi-savings"><div class="tsl">${t('dash_savings')}</div><div class="tsv" style="color:var(--blue)">${fmt(sav)}</div></div><div class="tsi txn-kpi-net"><div class="tsl">${t('txn_net')}</div><div class="tsv" style="color:${net >= 0 ? 'var(--emerald)' : 'var(--rose)'}">${fmt(net)}</div></div>`;
  const pp = 50, start = (txnPg - 1) * pp, pg = f.slice(start, start + pp);
  const body = document.getElementById('txbody');
  if (!pg.length) {
    body.innerHTML = `<tr><td colspan="7"><div class="es"><div style="font-size:24px">📭</div><p>${t('txn_no_found')} ${year}${m !== 'total' ? ' (' + MONTH_NAMES[+m] + ')' : ''}.</p></div></td></tr>`;
  } else {
    body.innerHTML = pg.map(tx => {
      const cl = tx.t === 'Income' ? 'i' : tx.t === 'Expense' ? 'e' : 's';
      const acl = tx.t === 'Income' ? 'ai' : tx.t === 'Savings' ? 'as' : 'ae';
      const typeLabel = tx.t === 'Savings' ? 'Transfer' : tx.t;
      const _fromAcc = tx.acc ? (ACCOUNTS.find(a => a.id === tx.acc)?.name || '') : '';
      const _toAcc = tx.toAcc ? (ACCOUNTS.find(a => a.id === tx.toAcc)?.name || '') : '';
      const detailText = tx.t === 'Savings' && _fromAcc && _toAcc ? _fromAcc + ' → ' + _toAcc + (tx.dt ? ' · ' + tx.dt : '') : (tx.dt || '-');
      const txIdEsc = String(tx.id).replace(/'/g, "\\'");
      return `<tr><td>${new Date(tx.d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</td><td><span class="tb ${cl}">${typeLabel}</span></td><td>${tx.c}</td><td>${tx.s || '-'}</td><td style="color:var(--text-tertiary)">${detailText}</td><td class="${acl}" style="text-align:right">${tx.t === 'Expense' ? '-' : ''}${tx.origAmt && tx.cur ? (CURRENCY_CONFIG[tx.cur] ? CURRENCY_CONFIG[tx.cur].symbol : tx.cur + ' ') + tx.origAmt.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) : fmtD(tx.a)}</td><td><div class="ab"><button class="abtn" onclick="doAuth('edit','${txIdEsc}')">✏️</button><button class="abtn del" style="background:var(--rose-light);border-radius:6px;min-width:28px;min-height:28px" onclick="doAuth('delete','${txIdEsc}')">🗑</button></div></td></tr>`;
    }).join('');
  }
  document.getElementById('txinfo').textContent = f.length ? `${start + 1}-${Math.min(start + pp, f.length)} of ${f.length}` : '';
}

// === ADD/EDIT MODAL ===
function openAdd() {
  const isEdit = editId !== null;
  const assetOpts = ACCOUNTS.filter(a => a.type === 'asset').map(a => `<option value="${a.id}">${a.name}</option>`).join('');
  const liabOpts = ACCOUNTS.filter(a => a.type === 'liability').map(a => `<option value="${a.id}">${a.name}</option>`).join('');
  const currencyOpts = Object.entries(CURRENCY_CONFIG).map(([code, cfg]) => `<option value="${code}"${code === displayCurrency ? ' selected' : ''}>${code} (${cfg.symbol})</option>`).join('');
  const h = `<div class="mo show" id="madd" onclick="if(event.target===this)tryClose()"><div class="ml" onclick="event.stopPropagation()"><div class="mh"><div><div class="mti">${isEdit ? t('txn_edit_title') : t('txn_add_title')}</div><div class="mds">${t('txn_cascade')}</div></div><div style="display:flex;align-items:center;gap:8px">${isEdit ? '<button type="button" class="mx" style="background:var(--rose-light);color:var(--rose);border:1px solid var(--rose);min-width:32px;min-height:32px;display:flex;align-items:center;justify-content:center" onclick="tryClose();doAuth(\'delete\',' + editId + ')" title="Delete"><i data-lucide="trash-2" width="14" height="14"></i></button>' : ''}<button class="mx" onclick="tryClose()">✕</button></div></div><form id="aform" onsubmit="saveTxn(event)"><div class="fr"><div class="fg"><label class="fl">${t('txn_date_label')} *</label><input class="fi" type="date" id="f_d" required value="${new Date().toISOString().split('T')[0]}"></div><div class="fg"><label class="fl">${t('txn_type_label')} *</label><select class="fi" id="f_t" required onchange="cascType()"><option value="">${t('txn_select')}</option><option value="Income">${t('dash_income')}</option><option value="Expense">${t('dash_expense')}</option><option value="Savings">Transfer</option></select></div></div><div class="fr"><div class="fg"><label class="fl">${t('txn_cat_label')} *</label><select class="fi" id="f_c" required onchange="cascCat()"><option value="">${t('txn_select_type')}</option></select></div><div class="fg"><label class="fl">${t('txn_sub_label')}</label><select class="fi" id="f_s"><option value="">${t('txn_select_cat')}</option></select></div></div><div class="fg" id="accRow" style="display:none"><label class="fl">${t('txn_account')} *</label><select class="fi" id="f_acc"><option value="">${t('txn_select_account')}</option>${assetOpts}</select></div><div class="fg" id="toAccRow" style="display:none"><label class="fl">To Account *</label><select class="fi" id="f_toAcc"><option value="">${t('txn_select_account')}</option>${assetOpts}</select></div><div class="fg" id="liabRow" style="display:none"><label class="fl">${t('txn_pay_liability')}</label><select class="fi" id="f_liab"><option value="">${t('txn_none_regular')}</option>${liabOpts}</select></div><div class="fg" id="feeRow" style="display:none"><label class="fl">Transfer Fee</label><div style="display:flex;gap:6px;align-items:center"><span id="feeCurLabel" style="font-size:12px;font-weight:700;color:var(--text-tertiary);min-width:30px"></span><input class="fi" type="number" step="0.01" id="f_fee" placeholder="0.00 (optional)" style="flex:1"></div></div><div class="fr"><div class="fg" style="flex:1.5"><label class="fl">${t('txn_amount_label')} *</label><div style="display:flex;gap:6px"><select class="fi" id="f_cur" style="width:90px;flex-shrink:0;padding:9px 6px">${currencyOpts}</select><input class="fi" type="number" step="0.01" id="f_a" required placeholder="0.00" style="flex:1"></div></div><div class="fg"><label class="fl">${t('txn_desc_label')}</label><input class="fi" id="f_dt" placeholder="${t('txn_details_ph')}" oninput="debounceCatSuggest()"></div></div><div id="catSuggestWrap" style="display:none;margin:-8px 0 12px;padding:8px 12px;background:var(--accent-light);border-radius:8px;font-size:11px;display:none;align-items:center;gap:8px;flex-wrap:wrap"><span id="catSuggestText" style="color:var(--accent);font-weight:500"></span><button type="button" class="btn bp" style="font-size:10px;padding:3px 10px;min-height:auto" onclick="acceptCatSuggestion()">Accept</button><button type="button" style="border:none;background:none;color:var(--text-tertiary);font-size:14px;cursor:pointer;padding:2px 4px" onclick="dismissCatSuggestion()">✕</button></div><div class="ma"><button type="button" class="btn bs" onclick="tryClose()">${t('txn_cancel')}</button><button type="submit" class="btn bp">${isEdit ? t('txn_update') : t('txn_save')}</button></div></form></div></div>`;
  document.body.insertAdjacentHTML('beforeend', h);
  document.body.style.overflow = 'hidden';
  lucide.createIcons();
  // Bootstrap category memory on first modal open
  if (typeof bootstrapCatMemory === 'function') bootstrapCatMemory();
}

function qaClose() {
  var el = document.getElementById('mqadd');
  if (el) { el.remove(); document.body.style.overflow = ''; }
}

function cascType() {
  const tp = document.getElementById('f_t').value;
  const c = document.getElementById('f_c');
  const s = document.getElementById('f_s');
  c.innerHTML = `<option value="">${t('txn_select')}</option>`;
  s.innerHTML = '<option value="">-</option>';
  if (tp && SCHEMA[tp]) {
    Object.keys(SCHEMA[tp]).forEach(k => { c.innerHTML += '<option value="' + k + '">' + k + '</option>'; });
  }
  // Show/hide account rows based on type
  const accRow = document.getElementById('accRow');
  const liabRow = document.getElementById('liabRow');
  if (accRow) {
    accRow.style.display = (tp === 'Income' || tp === 'Expense' || tp === 'Savings') ? 'block' : 'none';
    const accSel = document.getElementById('f_acc');
    if (accSel) {
      accSel.innerHTML = '<option value="">Select account</option>' + ACCOUNTS.filter(a => a.type === 'asset').map(a => '<option value="' + a.id + '">' + a.name + ' (' + (a.currency || 'MYR') + ')</option>').join('');
      // Auto-sync currency when account is selected
      accSel.onchange = function() {
        const acc = ACCOUNTS.find(a => a.id === accSel.value);
        if (acc && acc.currency) {
          const curEl = document.getElementById('f_cur');
          if (curEl) curEl.value = acc.currency;
        }
      };
    }
  }
  if (liabRow) {
    liabRow.style.display = tp === 'Expense' ? 'block' : 'none';
    const liabSel = document.getElementById('f_liab');
    if (liabSel) {
      liabSel.innerHTML = '<option value="">None (regular expense)</option>' + ACCOUNTS.filter(a => a.type === 'liability').map(a => '<option value="' + a.id + '">' + a.name + '</option>').join('');
    }
  }
  // Show "To Account" for transfers
  const toAccRow = document.getElementById('toAccRow');
  if (toAccRow) {
    toAccRow.style.display = tp === 'Savings' ? 'block' : 'none';
    const toAccSel = document.getElementById('f_toAcc');
    if (toAccSel) {
      toAccSel.innerHTML = '<option value="">Select destination</option>' + ACCOUNTS.filter(a => a.type === 'asset').map(a => '<option value="' + a.id + '">' + a.name + ' (' + (a.currency || 'MYR') + ')</option>').join('');
    }
  }
  // Show fee field for Transfers only
  const feeRow = document.getElementById('feeRow');
  if (feeRow) {
    feeRow.style.display = tp === 'Savings' ? 'block' : 'none';
    const feeCurLabel = document.getElementById('feeCurLabel');
    const curEl2 = document.getElementById('f_cur');
    if (feeCurLabel && curEl2) {
      const cfg = CURRENCY_CONFIG[curEl2.value] || CURRENCY_CONFIG[displayCurrency] || CURRENCY_CONFIG.MYR;
      feeCurLabel.textContent = cfg.symbol;
    }
  }
}

function cascCat() {
  const tp = document.getElementById('f_t').value;
  const cat = document.getElementById('f_c').value;
  const s = document.getElementById('f_s');
  s.innerHTML = '<option value="">-</option>';
  if (tp && cat && SCHEMA[tp] && SCHEMA[tp][cat] && SCHEMA[tp][cat].length) {
    SCHEMA[tp][cat].forEach(v => { s.innerHTML += '<option value="' + v + '">' + v + '</option>'; });
  }
  // Smart liability auto-link when subcategory changes
  if (s) {
    s.onchange = function() {
      if (tp !== 'Expense') return;
      const sub = s.value;
      if (!sub) return;
      const matches = typeof getMatchingLiabilities === 'function' ? getMatchingLiabilities(cat, sub) : [];
      const liabEl = document.getElementById('f_liab');
      if (!liabEl) return;
      if (matches.length === 1) {
        // Single match: auto-select
        liabEl.value = matches[0].id;
      } else if (matches.length > 1) {
        // Multiple matches: highlight the dropdown and show options
        liabEl.innerHTML = '<option value="">Select liability (' + matches.length + ' match)</option>' + matches.map(a => '<option value="' + a.id + '">⭐ ' + a.name + '</option>').join('') + ACCOUNTS.filter(a => a.type === 'liability' && !matches.find(m => m.id === a.id)).map(a => '<option value="' + a.id + '">' + a.name + '</option>').join('');
        liabEl.style.border = '1px solid var(--amber)';
        setTimeout(() => { liabEl.style.border = ''; }, 3000);
      }
    };
  }
}

function tryClose() {
  const el = document.getElementById('madd');
  if (el) { el.remove(); document.body.style.overflow = ''; editId = null; }
}

function saveTxn(e) {
  e.preventDefault();
  const data = { d: document.getElementById('f_d').value, t: document.getElementById('f_t').value, c: document.getElementById('f_c').value, s: document.getElementById('f_s').value || '', a: parseFloat(document.getElementById('f_a').value), dt: document.getElementById('f_dt').value || '' };
  // Currency for this transaction
  const curEl = document.getElementById('f_cur');
  const txnCurrency = curEl ? curEl.value : displayCurrency;
  // Convert to MYR (base currency) for storage if different
  if (txnCurrency !== 'MYR') {
    const rate = exchangeRates[txnCurrency] || FALLBACK_RATES[txnCurrency] || 1;
    data.a = Math.round((data.a / rate) * 100) / 100;
    data.cur = txnCurrency; // Store original currency for reference
    data.origAmt = parseFloat(document.getElementById('f_a').value); // Store original amount
  }
  // Account linking
  const accEl = document.getElementById('f_acc');
  const liabEl = document.getElementById('f_liab');
  const toAccEl = document.getElementById('f_toAcc');
  if (accEl && accEl.value) data.acc = accEl.value;
  if (liabEl && liabEl.value) data.liab = liabEl.value;
  data.toAcc = (data.t === 'Savings' && toAccEl && toAccEl.value) ? toAccEl.value : undefined;
  // Transfer fee: store on txn and create a separate expense entry
  const feeEl = document.getElementById('f_fee');
  const feeAmt = feeEl ? parseFloat(feeEl.value) : 0;
  if (feeAmt > 0 && data.t === 'Savings') {
    data.fee = feeAmt;
  }
  if (editId) { const i = TXN.findIndex(tx => tx.id === editId); if (i >= 0) TXN[i] = { ...TXN[i], ...data }; toast(t('txn_updated')); }
  else {
    data.id = generateTxnId(); TXN.push(data);
    // Auto-create fee expense transaction if transfer has a fee
    if (feeAmt > 0 && data.t === 'Savings') {
      const feeTxn = { id: generateTxnId(), d: data.d, t: 'Expense', c: 'Bills', s: 'Transfer Fee', a: feeAmt, dt: 'Fee for transfer: ' + (data.dt || data.c), feeLinkedTo: data.id };
      if (txnCurrency !== 'MYR') {
        const rate = exchangeRates[txnCurrency] || FALLBACK_RATES[txnCurrency] || 1;
        feeTxn.a = Math.round((feeAmt / rate) * 100) / 100;
        feeTxn.cur = txnCurrency;
        feeTxn.origAmt = feeAmt;
      }
      if (data.acc) feeTxn.acc = data.acc;
      TXN.push(feeTxn);
    }
    toast(t('txn_added'));
  }
  // If liability payment: create a reduction on the liability account
  if (data.t === 'Expense' && data.liab) {
    const liabAcc = ACCOUNTS.find(a => a.id === data.liab);
    if (liabAcc) {
      const liabCur = liabAcc.currency || 'MYR';
      // data.a is in MYR; convert to liability's native currency before subtracting
      const reductionInNative = liabCur === 'MYR' ? data.a : convertFromTo(data.a, 'MYR', liabCur);
      liabAcc.initialBalance = Math.max(0, liabAcc.initialBalance - reductionInNative);
      saveACCOUNTS();
    }
  }
  // Learn from this transaction for auto-categorization
  if (typeof learnFromTransaction === 'function') learnFromTransaction(data);
  saveTXN(); tryClose();
  // Cloud sync: push transaction incrementally
  if (typeof ftSync !== 'undefined' && ftSync.pushTransaction) ftSync.pushTransaction(data);
  // Sync goals immediately after save
  if (typeof syncGoalsWithSavings === 'function') syncGoalsWithSavings();
  // v15.3.0: Refresh current view (stays on current tab)
  render();
  // v15.5: Check budget alerts after saving transaction
  if (typeof checkBudgetAlerts === 'function') checkBudgetAlerts();
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { const m = document.getElementById('madd'); if (m) { tryClose(); return; } const a = document.getElementById('mauth'); if (a) { a.remove(); document.body.style.overflow = ''; return; } }
});

// === AUTO-CATEGORIZATION UI (v15.8) ===
let _catSuggestTimer = null;
let _currentSuggestion = null;

function debounceCatSuggest() {
  if (_catSuggestTimer) clearTimeout(_catSuggestTimer);
  // Respect settings toggle
  if (safeGet('ft_autocat_off') === 'true') return;
  _catSuggestTimer = setTimeout(() => {
    const desc = document.getElementById('f_dt')?.value;
    if (!desc || desc.length < 2) { hideCatSuggestion(); return; }

    const suggestion = suggestCategory(desc);
    if (!suggestion) { hideCatSuggestion(); return; }

    _currentSuggestion = suggestion;
    const wrap = document.getElementById('catSuggestWrap');
    const text = document.getElementById('catSuggestText');
    if (!wrap || !text) return;

    const typeEl = document.getElementById('f_t');
    const catEl = document.getElementById('f_c');
    const alreadyFilled = typeEl.value && catEl.value;

    // High confidence + fields empty: auto-fill silently
    if (suggestion.confidence === 'high' && !alreadyFilled) {
      applyCatSuggestion(suggestion);
      text.textContent = `🤖 Auto-filled: ${suggestion.t} > ${suggestion.c}${suggestion.s ? ' > ' + suggestion.s : ''}`;
      wrap.style.display = 'flex';
      return;
    }

    // Show suggestion chip (user can accept or dismiss)
    if (!alreadyFilled) {
      const badge = suggestion.confidence === 'medium' ? '🤖 Suggest' : '💡 Maybe';
      text.textContent = `${badge}: ${suggestion.t} > ${suggestion.c}${suggestion.s ? ' > ' + suggestion.s : ''} (used ${suggestion.count}x)`;
      wrap.style.display = 'flex';
    } else {
      hideCatSuggestion();
    }
  }, 300);
}

function applyCatSuggestion(suggestion) {
  const typeEl = document.getElementById('f_t');
  const catEl = document.getElementById('f_c');
  const subEl = document.getElementById('f_s');

  // Set type
  typeEl.value = suggestion.t;
  cascType();

  // Set category after cascade populates options
  setTimeout(() => {
    catEl.value = suggestion.c;
    cascCat();
    // Set subcategory
    setTimeout(() => {
      if (suggestion.s) subEl.value = suggestion.s;
    }, 20);
  }, 20);
}

function acceptCatSuggestion() {
  if (!_currentSuggestion) return;
  applyCatSuggestion(_currentSuggestion);
  const wrap = document.getElementById('catSuggestWrap');
  const text = document.getElementById('catSuggestText');
  if (text) text.textContent = '✅ Applied!';
  setTimeout(() => { if (wrap) wrap.style.display = 'none'; }, 1000);
}

function dismissCatSuggestion() {
  _currentSuggestion = null;
  hideCatSuggestion();
}

function hideCatSuggestion() {
  const wrap = document.getElementById('catSuggestWrap');
  if (wrap) wrap.style.display = 'none';
  _currentSuggestion = null;
}

// === AUTH + DELETE ===
function doAuth(action, id) {
  if (Date.now() < lockUntil) { toast(t('auth_locked')); return; }
  pendAct = { action, id };
  const h = `<div class="mo show" id="mauth" onclick="if(event.target===this){this.remove();document.body.style.overflow=''}"><div class="ml" onclick="event.stopPropagation()"><div class="mh"><div><div class="mti">${t('auth_title')}</div><div class="mds">${t('auth_desc')}</div></div></div><div class="fg"><label class="fl">${t('auth_passkey')}</label><input class="fi" type="password" id="f_pk" placeholder="${t('auth_enter')}" autofocus></div><div class="ferr" id="pkerr"></div><div id="pklck"></div><div class="ma"><button class="btn bs" onclick="document.getElementById('mauth').remove();document.body.style.overflow=''">${t('auth_cancel')}</button><button class="btn bp" onclick="verifyPK()">${t('auth_confirm')}</button></div><div style="text-align:center;margin-top:10px"><button onclick="forgotPINFromAuth()" style="border:none;background:none;color:var(--text-tertiary);font-size:11px;cursor:pointer;font-family:var(--font);text-decoration:underline">Forgot PIN?</button></div></div></div>`;
  document.body.insertAdjacentHTML('beforeend', h);
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('f_pk')?.focus(), 50);
}

function forgotPINFromAuth() {
  // Close auth modal
  const authModal = document.getElementById('mauth');
  if (authModal) { authModal.remove(); document.body.style.overflow = ''; }
  // Show inline reset: since user is already in the app, allow reset with confirmation
  const hasCode = typeof hasRecoverySetup === 'function' && hasRecoverySetup();
  const hasQ = typeof hasSecurityQuestions === 'function' && hasSecurityQuestions();
  if (hasCode || hasQ) {
    // Has recovery method: redirect to recovery flow
    showForgotPIN();
  } else {
    // No recovery: show emergency reset confirmation
    const h = `<div class="mo show" id="mauthReset" onclick="if(event.target===this){this.remove();document.body.style.overflow=''}"><div class="ml" style="max-width:380px" onclick="event.stopPropagation()"><div class="mh"><div><div class="mti">Reset PIN</div><div class="mds">No recovery method set up. Type RESET to clear your PIN.</div></div><button class="mx" onclick="document.getElementById('mauthReset').remove();document.body.style.overflow=''">✕</button></div><div class="fg"><input class="fi" type="text" id="authResetInput" placeholder="Type RESET to confirm" style="text-align:center;text-transform:uppercase;letter-spacing:2px"></div><div class="ma"><button class="btn bs" onclick="document.getElementById('mauthReset').remove();document.body.style.overflow=''">Cancel</button><button class="btn bd" onclick="executeAuthPINReset()">Reset PIN</button></div></div></div>`;
    document.body.insertAdjacentHTML('beforeend', h);
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('authResetInput')?.focus(), 50);
  }
}

function executeAuthPINReset() {
  const input = document.getElementById('authResetInput');
  const val = input ? input.value.trim().toUpperCase() : '';
  if (val !== 'RESET') { toast('❌ Type RESET to confirm'); return; }
  // Clear PIN
  localStorage.removeItem('ft_pk_hash');
  localStorage.removeItem('ft_pk');
  safeSave('ft_pk_hash', '');
  safeSave('ft_pk', '');
  // Close modal
  const modal = document.getElementById('mauthReset');
  if (modal) { modal.remove(); document.body.style.overflow = ''; }
  toast('✅ PIN cleared. Set a new one in Settings → Security');
  // Now re-attempt the pending action (no PIN = passes through)
  if (pendAct) {
    if (pendAct.action === 'edit') doEdit(pendAct.id);
    else doDelConfirm(pendAct.id);
  }
}

function verifyPK() {
  if (Date.now() < lockUntil) return;
  const v = document.getElementById('f_pk').value;
  verifyPIN(v).then(function(valid) {
    if (valid) { authAtt = 0; document.getElementById('mauth').remove(); document.body.style.overflow = ''; if (pendAct.action === 'edit') doEdit(pendAct.id); else doDelConfirm(pendAct.id); }
    else { authAtt++; if (authAtt >= 3) { lockUntil = Date.now() + 30000; document.getElementById('pklck').innerHTML = `<div style="color:var(--rose);font-size:12px;padding:8px;background:var(--rose-light);border-radius:6px;margin-top:8px;text-align:center">${t('auth_locked_30')}</div>`; setTimeout(() => { authAtt = 0; }, 30000); } else { const e = document.getElementById('pkerr'); e.textContent = t('auth_incorrect') + ' ' + (3 - authAtt) + ' ' + t('auth_left'); e.classList.add('show'); } }
  });
}

function doEdit(id) {
  const tx = TXN.find(x => String(x.id) === String(id)); if (!tx) return;
  editId = tx.id; openAdd();
  setTimeout(() => { document.getElementById('f_d').value = tx.d; document.getElementById('f_t').value = tx.t; cascType(); setTimeout(() => { document.getElementById('f_c').value = tx.c; cascCat(); setTimeout(() => { document.getElementById('f_s').value = tx.s || ''; }, 20); }, 20); document.getElementById('f_a').value = tx.origAmt || tx.a; document.getElementById('f_dt').value = tx.dt || ''; const curEl = document.getElementById('f_cur'); if (curEl) curEl.value = tx.cur || 'MYR'; if (tx.acc) { const accEl = document.getElementById('f_acc'); if (accEl) accEl.value = tx.acc; } if (tx.toAcc) { const toAccEl = document.getElementById('f_toAcc'); if (toAccEl) toAccEl.value = tx.toAcc; } if (tx.liab) { const liabEl = document.getElementById('f_liab'); if (liabEl) liabEl.value = tx.liab; } if (tx.fee) { const feeEl = document.getElementById('f_fee'); if (feeEl) feeEl.value = tx.fee; } document.querySelector('.mti').textContent = t('txn_edit_title'); }, 30);
}

function doDelConfirm(id) {
  const tx = TXN.find(x => String(x.id) === String(id)); if (!tx) return;
  pendAct = { action: 'delete', id: tx.id };
  const h = `<div class="mo show" id="mdel" onclick="if(event.target===this){this.remove();document.body.style.overflow=''}"><div class="ml" onclick="event.stopPropagation()"><div class="mh"><div><div class="mti">${t('del_title')}</div><div class="mds">${t('del_desc')}</div></div></div><div style="padding:12px;background:var(--rose-light);border-radius:8px;font-size:12px;margin-bottom:16px"><b>${tx.c}</b> ${tx.s ? '/ ' + tx.s : ''} - ${fmtD(tx.a)}</div><div class="ma"><button class="btn bs" onclick="document.getElementById('mdel').remove();document.body.style.overflow=''">${t('del_cancel')}</button><button class="btn bd" onclick="execDel()">${t('del_delete')}</button></div></div></div>`;
  document.body.insertAdjacentHTML('beforeend', h);
  document.body.style.overflow = 'hidden';
}

function execDel() {
  const delId = pendAct.id;
  // Also delete linked fee transaction if this is a Transfer with a fee
  const parentTx = TXN.find(tx => String(tx.id) === String(delId));
  if (parentTx && parentTx.t === 'Savings' && parentTx.fee) {
    // Find the fee expense created at the same date with matching description
    const feeIdx = TXN.findIndex(tx => tx.t === 'Expense' && tx.s === 'Transfer Fee' && tx.d === parentTx.d && tx.feeLinkedTo === delId);
    if (feeIdx >= 0) {
      const feeTx = TXN[feeIdx];
      TXN.splice(feeIdx, 1);
      if (typeof ftSync !== 'undefined') ftSync.deleteTransaction(feeTx.id);
    } else {
      // Fallback: match by date + description pattern (for txns created before feeLinkedTo was added)
      const feeIdx2 = TXN.findIndex(tx => tx.t === 'Expense' && tx.s === 'Transfer Fee' && tx.d === parentTx.d && tx.dt && tx.dt.includes(parentTx.dt || parentTx.c));
      if (feeIdx2 >= 0) {
        const feeTx = TXN[feeIdx2];
        TXN.splice(feeIdx2, 1);
        if (typeof ftSync !== 'undefined') ftSync.deleteTransaction(feeTx.id);
      }
    }
  }
  TXN = TXN.filter(tx => String(tx.id) !== String(delId)); saveTXN();
  // Cloud sync: delete from Supabase
  if (typeof ftSync !== 'undefined') ftSync.deleteTransaction(delId);
  // Sync goals immediately after delete
  if (typeof syncGoalsWithSavings === 'function') syncGoalsWithSavings();
  document.getElementById('mdel').remove(); document.body.style.overflow = '';
  toast(t('txn_deleted'));
  // v15.3.0: Refresh current view (stays on current tab)
  render();
}
