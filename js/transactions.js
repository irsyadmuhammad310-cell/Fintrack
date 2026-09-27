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
  const bal = allTxn.reduce((s, tx) => s + ftTxnNet(tx), 0); // V2.0.4: same net rule everywhere

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
    const dayExpLabel = dayExpense > 0 ? `<span class="mob-txn-day-total ft-amt">-${fmtD(dayExpense)}</span>` : '';

    listHtml += `<div class="mob-txn-date-header">${dateLabel}${dayExpLabel}</div>`;
    txns.forEach(tx => {
      const emoji = typeof catEmoji(tx.c) === 'function' ? catEmoji(tx.c)(tx) : catEmoji(tx.c);
      const amtColor = tx.t === 'Income' ? 'var(--emerald)' : tx.t === 'Savings' ? 'var(--blue)' : 'var(--rose)';
      const sign = tx.t === 'Income' ? '+' : tx.t === 'Savings' ? '↔' : '-';
      const bgColor = tx.t === 'Income' ? 'var(--emerald-light)' : tx.t === 'Savings' ? 'var(--blue-light)' : 'var(--rose-light)';
      const accName = tx.acc ? (ACCOUNTS.find(a => a.id === tx.acc)?.name || '') : '';
      const toAccName = tx.toAcc ? (ACCOUNTS.find(a => a.id === tx.toAcc)?.name || '') : '';
      const meta = tx.t === 'Savings' && accName && toAccName ? accName + ' → ' + toAccName : [tx.c, tx.s, accName].filter(Boolean).join(' · ');
      // V2.0.5: type limited to the 3 real values, id passed safely (a backslash in an id could break out before)
      const typeAttr = (tx.t === 'Income' || tx.t === 'Expense' || tx.t === 'Savings') ? tx.t : 'Expense';
      listHtml += `<div class="mob-txn-row" data-type="${typeAttr}" onclick="doAuth('edit',${ftArg(tx.id)})">
        <div class="mob-txn-cat-dot" style="background:${bgColor}">${emoji}</div>
        <div class="mob-txn-info">
          <div class="mob-txn-name">${ftEsc(tx.dt || tx.c)}</div>
          <div class="mob-txn-meta">${ftEsc(meta)}</div>
        </div>
        <div class="mob-txn-amount" style="color:${amtColor}">${sign}${tx.origAmt && tx.cur ? (CURRENCY_CONFIG[tx.cur] ? CURRENCY_CONFIG[tx.cur].symbol : ftEsc(tx.cur) + ' ') + (Number(tx.origAmt) || 0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) : fmtD(tx.a)}</div>
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
  // V2.0.4: transfers between your own accounts don't reduce net (same rule as dashboard)
  const net = f.reduce((s, tx) => s + ftTxnNet(tx), 0);
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
      const txIdArg = ftArg(tx.id); // V2.0.5: safe id inside onclick
      return `<tr><td>${new Date(tx.d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</td><td><span class="tb ${cl}">${ftEsc(typeLabel)}</span></td><td>${ftEsc(tx.c)}</td><td>${ftEsc(tx.s || '-')}</td><td style="color:var(--text-tertiary)">${ftEsc(detailText)}</td><td class="${acl} ft-amt" style="text-align:right">${tx.t === 'Expense' ? '-' : ''}${tx.origAmt && tx.cur ? (CURRENCY_CONFIG[tx.cur] ? CURRENCY_CONFIG[tx.cur].symbol : ftEsc(tx.cur) + ' ') + (Number(tx.origAmt) || 0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) : fmtD(tx.a)}</td><td><div class="ab"><button class="abtn" onclick="doAuth('edit',${txIdArg})">✏️</button><button class="abtn del" style="background:var(--rose-light);border-radius:6px;min-width:28px;min-height:28px" onclick="doAuth('delete',${txIdArg})">🗑</button></div></td></tr>`;
    }).join('');
  }
  document.getElementById('txinfo').textContent = f.length ? `${start + 1}-${Math.min(start + pp, f.length)} of ${f.length}` : '';
}

// === ADD/EDIT MODAL ===
function openAdd() {
  const isEdit = editId !== null;
  const assetOpts = ACCOUNTS.filter(a => a.type === 'asset').map(a => `<option value="${ftEsc(a.id)}">${ftEsc(a.name)}</option>`).join('');
  const liabOpts = ACCOUNTS.filter(a => a.type === 'liability').map(a => `<option value="${ftEsc(a.id)}">${ftEsc(a.name)}</option>`).join('');
  const currencyOpts = Object.entries(CURRENCY_CONFIG).map(([code, cfg]) => `<option value="${code}"${code === displayCurrency ? ' selected' : ''}>${code} (${cfg.symbol})</option>`).join('');
  const h = `<div class="mo show" id="madd" onclick="if(event.target===this)tryClose()"><div class="ml" onclick="event.stopPropagation()"><div class="mh"><div><div class="mti">${isEdit ? t('txn_edit_title') : t('txn_add_title')}</div><div class="mds">${t('txn_cascade')}</div></div><div style="display:flex;align-items:center;gap:8px">${isEdit ? '<button type="button" class="mx" style="background:var(--rose-light);color:var(--rose);border:1px solid var(--rose);min-width:32px;min-height:32px;display:flex;align-items:center;justify-content:center" onclick="tryClose();doAuth(\'delete\',\'' + String(editId).replace(/[^\w-]/g, '') + '\')" title="Delete"><i data-lucide="trash-2" width="14" height="14"></i></button>' : ''}<button class="mx" onclick="tryClose()">✕</button></div></div><form id="aform" onsubmit="saveTxn(event)"><div class="fr"><div class="fg"><label class="fl">${t('txn_date_label')} *</label><input class="fi" type="date" id="f_d" required value="${ftLocalISO()}"></div><div class="fg"><label class="fl">${t('txn_type_label')} *</label><select class="fi" id="f_t" required onchange="cascType()"><option value="">${t('txn_select')}</option><option value="Income">${t('dash_income')}</option><option value="Expense">${t('dash_expense')}</option><option value="Savings">Transfer</option></select></div></div><div class="fr" id="catRow"><div class="fg"><label class="fl">${t('txn_cat_label')} *</label><select class="fi" id="f_c" required onchange="cascCat()"><option value="">${t('txn_select_type')}</option></select></div><div class="fg"><label class="fl">${t('txn_sub_label')}</label><select class="fi" id="f_s"><option value="">${t('txn_select_cat')}</option></select></div></div><div class="fg" id="accRow" style="display:none"><label class="fl" id="accLabel">${t('txn_account')} *</label><select class="fi" id="f_acc"><option value="">${t('txn_select_account')}</option>${assetOpts}</select></div><div class="fg" id="toAccRow" style="display:none"><label class="fl">To Account *</label><select class="fi" id="f_toAcc"><option value="">${t('txn_select_account')}</option>${assetOpts}</select></div><div class="fg" id="liabRow" style="display:none"><label class="fl">${t('txn_pay_liability')}</label><select class="fi" id="f_liab"><option value="">${t('txn_none_regular')}</option>${liabOpts}</select></div><div class="fg" id="feeRow" style="display:none"><label class="fl">Transfer Fee</label><div style="display:flex;gap:6px;align-items:center"><span id="feeCurLabel" style="font-size:12px;font-weight:700;color:var(--text-tertiary);min-width:30px"></span><input class="fi" type="number" step="0.01" id="f_fee" placeholder="0.00 (optional)" style="flex:1"></div></div><div class="fr"><div class="fg" style="flex:1.5"><label class="fl">${t('txn_amount_label')} *</label><div style="display:flex;gap:6px"><select class="fi" id="f_cur" style="width:90px;flex-shrink:0;padding:9px 6px" onchange="this.dataset.touched='1';ftUpdateConvHint()">${currencyOpts}</select><input class="fi" type="number" step="0.01" id="f_a" required placeholder="0.00" style="flex:1" oninput="ftUpdateConvHint()"></div><div id="f_conv" style="display:none;font-size:10px;color:var(--text-tertiary);margin-top:4px"></div></div><div class="fg"><label class="fl">${t('txn_desc_label')}</label><input class="fi" id="f_dt" placeholder="${t('txn_details_ph')}" oninput="debounceCatSuggest()"></div></div><div id="catSuggestWrap" style="display:none;margin:-8px 0 12px;padding:8px 12px;background:var(--accent-light);border-radius:8px;font-size:11px;display:none;align-items:center;gap:8px;flex-wrap:wrap"><span id="catSuggestText" style="color:var(--accent);font-weight:500"></span><button type="button" class="btn bp" style="font-size:10px;padding:3px 10px;min-height:auto" onclick="acceptCatSuggestion()">Accept</button><button type="button" style="border:none;background:none;color:var(--text-tertiary);font-size:14px;cursor:pointer;padding:2px 4px" onclick="dismissCatSuggestion()">✕</button></div><div class="ma"><button type="button" class="btn bs" onclick="tryClose()">${t('txn_cancel')}</button><button type="submit" class="btn bp">${isEdit ? t('txn_update') : t('txn_save')}</button></div></form></div></div>`;
  document.body.insertAdjacentHTML('beforeend', h);
  document.body.style.overflow = 'hidden';
  lucide.createIcons();
  // Bootstrap category memory on first modal open
  if (typeof bootstrapCatMemory === 'function') bootstrapCatMemory();
}

// === FOREIGN CURRENCY ESTIMATE (V2.0.5) ===
// Value in your default currency (the one shown across the app), using the same rounding as Save.
function ftDefaultEstimate(amt, cur) {
  const base = cur === FT_BASE ? amt : Math.round(convertFromTo(amt, cur, FT_BASE) * 100) / 100;
  return convertFromTo(base, FT_BASE, displayCurrency);
}
// Live line under the amount: "≈ RM 470.81 in MYR (your default)". Also keeps the fee symbol in step.
function ftUpdateConvHint() {
  const curEl = document.getElementById('f_cur');
  const aEl = document.getElementById('f_a');
  const hint = document.getElementById('f_conv');
  const feeLbl = document.getElementById('feeCurLabel');
  if (feeLbl && curEl) { const cfg = CURRENCY_CONFIG[curEl.value] || CURRENCY_CONFIG[displayCurrency] || CURRENCY_CONFIG.MYR; feeLbl.textContent = cfg.symbol; }
  if (!hint || !curEl) return;
  const cur = curEl.value;
  const amt = parseFloat(aEl ? aEl.value : '');
  if (cur === displayCurrency || !CURRENCY_CONFIG[cur]) { hint.style.display = 'none'; hint.textContent = ''; return; }
  const mask = typeof ftMaskAmounts === 'function' ? ftMaskAmounts : (s => s);
  hint.style.display = 'block';
  hint.textContent = Number.isFinite(amt) && amt > 0
    ? mask('≈ ' + fmtIn(ftDefaultEstimate(amt, cur), displayCurrency) + ' in ' + displayCurrency + ' (your default)')
    : 'Saved in ' + cur + '. Type the amount to see it in ' + displayCurrency + '.';
}
// Text added to the "saved" message: " · $100.00 ≈ RM 470.81" (empty when you used your default currency)
function ftEstimateNote(tx, cur) {
  if (!cur || cur === displayCurrency || !CURRENCY_CONFIG[cur]) return '';
  const entered = cur === FT_BASE ? tx.a : Number(tx.origAmt);
  if (!(entered > 0)) return '';
  return ' · ' + fmtIn(entered, cur) + ' ≈ ' + fmtIn(convertFromTo(tx.a, FT_BASE, displayCurrency), displayCurrency);
}

function qaClose() {
  var el = document.getElementById('mqadd');
  if (el) { el.remove(); document.body.style.overflow = ''; }
}

function cascType() {
  const tp = document.getElementById('f_t').value;
  const c = document.getElementById('f_c');
  const s = document.getElementById('f_s');
  // Hide category/subcategory for transfers
  const catRow = document.getElementById('catRow');
  if (catRow) {
    catRow.style.display = tp === 'Savings' ? 'none' : '';
    if (tp === 'Savings') {
      c.removeAttribute('required');
    } else {
      c.setAttribute('required', '');
    }
  }
  c.innerHTML = `<option value="">${t('txn_select')}</option>`;
  s.innerHTML = '<option value="">-</option>';
  if (tp && tp !== 'Savings' && SCHEMA[tp]) {
    c.innerHTML += Object.keys(SCHEMA[tp]).map(k => '<option value="' + ftEsc(k) + '">' + ftEsc(k) + '</option>').join('');
  }
  // Show/hide account rows based on type
  const accRow = document.getElementById('accRow');
  const accLabel = document.getElementById('accLabel');
  if (accLabel) accLabel.textContent = tp === 'Savings' ? 'From Account *' : t('txn_account') + ' *';
  const liabRow = document.getElementById('liabRow');
  if (accRow) {
    accRow.style.display = (tp === 'Income' || tp === 'Expense' || tp === 'Savings') ? 'block' : 'none';
    const accSel = document.getElementById('f_acc');
    if (accSel) {
      accSel.innerHTML = '<option value="">Select account</option>' + ACCOUNTS.filter(a => a.type === 'asset').map(a => '<option value="' + ftEsc(a.id) + '">' + ftEsc(a.name) + ' (' + ftEsc(a.currency || FT_BASE) + ')</option>').join('');
      // V2.0.5: the currency YOU pick always wins. The account only pre-fills it while you haven't
      // touched the currency box and no amount is typed yet (before, picking a MYR account turned USD 100 into RM 100).
      accSel.onchange = function() {
        const acc = ACCOUNTS.find(a => a.id === accSel.value);
        const curEl = document.getElementById('f_cur');
        const aEl = document.getElementById('f_a');
        if (acc && acc.currency && CURRENCY_CONFIG[acc.currency] && curEl && curEl.dataset.touched !== '1' && !(aEl && aEl.value)) curEl.value = acc.currency;
        ftUpdateConvHint();
      };
    }
  }
  if (liabRow) {
    liabRow.style.display = tp === 'Expense' ? 'block' : 'none';
    const liabSel = document.getElementById('f_liab');
    if (liabSel) {
      liabSel.innerHTML = '<option value="">None (regular expense)</option>' + ACCOUNTS.filter(a => a.type === 'liability').map(a => '<option value="' + ftEsc(a.id) + '">' + ftEsc(a.name) + '</option>').join('');
      liabSel.dataset.need = ''; liabSel.style.border = ''; // V2.0.5: reset the "pick a loan" rule on type change
    }
  }
  // Show "To Account" for transfers
  const toAccRow = document.getElementById('toAccRow');
  if (toAccRow) {
    toAccRow.style.display = tp === 'Savings' ? 'block' : 'none';
    const toAccSel = document.getElementById('f_toAcc');
    if (toAccSel) {
      toAccSel.innerHTML = '<option value="">Select destination</option>' + ACCOUNTS.filter(a => a.type === 'asset').map(a => '<option value="' + ftEsc(a.id) + '">' + ftEsc(a.name) + ' (' + ftEsc(a.currency || FT_BASE) + ')</option>').join('');
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
    s.innerHTML += SCHEMA[tp][cat].map(v => '<option value="' + ftEsc(v) + '">' + ftEsc(v) + '</option>').join('');
  }
  // Smart liability auto-link when subcategory changes
  if (s) {
    s.onchange = function() {
      if (tp !== 'Expense') return;
      const liabEl = document.getElementById('f_liab');
      if (!liabEl) return;
      const sub = s.value;
      const all = ACCOUNTS.filter(a => a.type === 'liability');
      const matches = sub && typeof getMatchingLiabilities === 'function' ? getMatchingLiabilities(cat, sub) : [];
      const opt = a => '<option value="' + ftEsc(a.id) + '">' + ftEsc(a.name) + '</option>';
      if (matches.length > 1) {
        // V2.0.5: several loans share this subcategory. No guessing: the user must say which loan was paid.
        liabEl.innerHTML = '<option value="">⚠️ Pick which loan you paid</option>' + matches.map(a => '<option value="' + ftEsc(a.id) + '">⭐ ' + ftEsc(a.name) + '</option>').join('') + all.filter(a => !matches.find(m => m.id === a.id)).map(opt).join('') + '<option value="__none">Not a loan payment</option>';
        liabEl.value = '';
        liabEl.dataset.need = '1';
        liabEl.style.border = '1px solid var(--amber)';
      } else {
        liabEl.innerHTML = '<option value="">None (regular expense)</option>' + all.map(opt).join('');
        liabEl.value = matches.length === 1 ? matches[0].id : '';
        liabEl.dataset.need = '';
        liabEl.style.border = '';
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
  const txType = document.getElementById('f_t').value;
  const data = { d: document.getElementById('f_d').value, t: txType, c: txType === 'Savings' ? 'Transfer' : document.getElementById('f_c').value, s: txType === 'Savings' ? '' : (document.getElementById('f_s').value || ''), a: parseFloat(document.getElementById('f_a').value), dt: document.getElementById('f_dt').value || '' };
  // V2.0.5: amount must be a real number above 0 (a minus Expense would ADD money)
  if (!Number.isFinite(data.a) || data.a <= 0) { toast('❌ Amount must be more than 0'); document.getElementById('f_a').focus(); return; }
  if (data.a > 1e9) { toast('❌ Amount too large, check the number'); document.getElementById('f_a').focus(); return; }
  const _feeRaw = document.getElementById('f_fee') ? document.getElementById('f_fee').value : '';
  if (txType === 'Savings' && _feeRaw !== '' && (!Number.isFinite(parseFloat(_feeRaw)) || parseFloat(_feeRaw) < 0)) { toast('❌ Fee cannot be negative'); return; }
  // Currency for this transaction
  const curEl = document.getElementById('f_cur');
  const txnCurrency = curEl ? curEl.value : displayCurrency;
  // Convert to the user's base currency (FT_BASE) for storage if different
  if (txnCurrency !== FT_BASE) {
    data.a = Math.round(convertFromTo(data.a, txnCurrency, FT_BASE) * 100) / 100;
    data.cur = txnCurrency; // Store original currency for reference
    data.origAmt = parseFloat(document.getElementById('f_a').value); // Store original amount
  }
  else { data.cur = undefined; data.origAmt = undefined; } // V2.0.4: editing back to base clears the old foreign amount
  // V2.0.5: an edit that keeps the same amount + currency keeps the ORIGINAL key-in rate
  // (before, every edit re-priced it at today's rate). A new amount or currency = a new key-in:
  // data.fx is cleared so saveTXN saves the rate of right now.
  if (editId) {
    const old = TXN.find(tx => tx.id === editId);
    const same = !!old && (data.cur ? (old.cur === data.cur && Number(old.origAmt) === data.origAmt) : (!old.cur && Number(old.a) === data.a));
    if (same && data.cur && Number.isFinite(Number(old.a)) && Number(old.a) > 0) data.a = Number(old.a);
    if (!same) data.fx = undefined;
  }
  // Account linking. V2.0.4: always set every link field, so an edit can also REMOVE a link
  // (old code kept the previous liab/fee when you changed type, e.g. Expense -> Transfer).
  const accEl = document.getElementById('f_acc');
  const liabEl = document.getElementById('f_liab');
  const toAccEl = document.getElementById('f_toAcc');
  data.acc = (accEl && accEl.value) ? accEl.value : undefined;
  // V2.0.5: when several loans share the subcategory, saving is blocked until one is picked
  if (data.t === 'Expense' && liabEl && liabEl.dataset.need === '1' && !liabEl.value) { toast('❌ Pick which loan you paid (or "Not a loan payment")'); liabEl.focus(); return; }
  data.liab = (data.t === 'Expense' && liabEl && liabEl.value && liabEl.value !== '__none') ? liabEl.value : undefined;
  data.toAcc = (data.t === 'Savings' && toAccEl && toAccEl.value) ? toAccEl.value : undefined;
  if (data.toAcc && data.toAcc === data.acc) { toast('❌ From and To account must be different'); return; }
  // Transfer fee: stored on the transfer + a separate linked expense entry
  const feeEl = document.getElementById('f_fee');
  const feeAmt = feeEl ? parseFloat(feeEl.value) : 0;
  data.fee = (feeAmt > 0 && data.t === 'Savings') ? feeAmt : undefined;
  let saved;
  const estNote = ftEstimateNote(data, txnCurrency); // V2.0.5: " · $100.00 ≈ RM 470.81"
  if (editId) {
    const i = TXN.findIndex(tx => tx.id === editId);
    if (i >= 0) { const before = { ...TXN[i] }; TXN[i] = { ...TXN[i], ...data }; saved = TXN[i]; ftSyncFeeTxn(saved, before, txnCurrency); }
    toast(t('txn_updated') + estNote, estNote ? 5000 : 0);
  } else {
    data.id = generateTxnId(); TXN.push(data); saved = data;
    ftSyncFeeTxn(saved, null, txnCurrency);
    toast(t('txn_added') + estNote, estNote ? 5000 : 0);
  }
  // V2.0.4: liability payments are NOT subtracted from the loan here any more.
  // The loan balance is calculated from linked payments (data.js ftLiabOwed), so edit/delete stay correct.
  // Learn from this transaction for auto-categorization
  if (typeof learnFromTransaction === 'function') learnFromTransaction(data);
  saveTXN(); tryClose();
  // Cloud sync: push transaction incrementally
  if (saved && typeof ftSync !== 'undefined' && ftSync.pushTransaction) ftSync.pushTransaction(saved);
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
      if (suggestion.s && typeof subEl.onchange === 'function') subEl.onchange(); // V2.0.5: link the loan too
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
  var lockWait = ftLockoutRemaining();
  if (lockWait > 0) { toast(ftLockMsg(lockWait)); return; }
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
    // V2.0.4: no free RESET. Cloud password, or erase this phone.
    ftShowPinResetNoRecovery();
  }
}

// V2.0.4: old RESET bypass removed. Name kept so nothing breaks.
function executeAuthPINReset() { ftShowPinResetNoRecovery(); }

// V2.0.4: uses the shared lockout (same counter as the lock screen, survives reload)
var _ftPkBusy = false;
function verifyPK() {
  const pkEl = document.getElementById('f_pk');
  const v = pkEl ? pkEl.value : '';
  if (!v || _ftPkBusy || ftLockGuard('pkerr')) { if (pkEl) pkEl.value = ''; return; }
  _ftPkBusy = true;
  verifyPIN(v).then(function(valid) {
    _ftPkBusy = false;
    if (valid) { ftRegisterSuccess(); document.getElementById('mauth').remove(); document.body.style.overflow = ''; if (pendAct.action === 'edit') doEdit(pendAct.id); else doDelConfirm(pendAct.id); }
    else { ftFailMsg('pkerr', t('auth_incorrect')); if (pkEl) { pkEl.value = ''; pkEl.focus(); } }
  }, function() { _ftPkBusy = false; });
}

function doEdit(id) {
  const tx = TXN.find(x => String(x.id) === String(id)); if (!tx) return;
  editId = tx.id; openAdd();
  setTimeout(() => { document.getElementById('f_d').value = tx.d; document.getElementById('f_t').value = tx.t; cascType(); setTimeout(() => { document.getElementById('f_c').value = tx.c; cascCat(); setTimeout(() => { document.getElementById('f_s').value = tx.s || ''; }, 20); }, 20); document.getElementById('f_a').value = tx.origAmt || tx.a; document.getElementById('f_dt').value = tx.dt || ''; const curEl = document.getElementById('f_cur'); if (curEl) { curEl.value = tx.cur || FT_BASE; curEl.dataset.touched = '1'; } if (tx.acc) { const accEl = document.getElementById('f_acc'); if (accEl) accEl.value = tx.acc; } if (tx.toAcc) { const toAccEl = document.getElementById('f_toAcc'); if (toAccEl) toAccEl.value = tx.toAcc; } if (tx.liab) { const liabEl = document.getElementById('f_liab'); if (liabEl) liabEl.value = tx.liab; } if (tx.fee) { const feeEl = document.getElementById('f_fee'); if (feeEl) feeEl.value = tx.fee; } document.querySelector('.mti').textContent = t('txn_edit_title'); ftUpdateConvHint(); }, 30);
}

function doDelConfirm(id) {
  const tx = TXN.find(x => String(x.id) === String(id)); if (!tx) return;
  pendAct = { action: 'delete', id: tx.id };
  const h = `<div class="mo show" id="mdel" onclick="if(event.target===this){this.remove();document.body.style.overflow=''}"><div class="ml" onclick="event.stopPropagation()"><div class="mh"><div><div class="mti">${t('del_title')}</div><div class="mds">${t('del_desc')}</div></div></div><div style="padding:12px;background:var(--rose-light);border-radius:8px;font-size:12px;margin-bottom:16px"><b>${ftEsc(tx.c)}</b> ${tx.s ? '/ ' + ftEsc(tx.s) : ''} - <span class="ft-amt">${fmtD(tx.a)}</span></div><div class="ma"><button class="btn bs" onclick="document.getElementById('mdel').remove();document.body.style.overflow=''">${t('del_cancel')}</button><button class="btn bd" onclick="execDel()">${t('del_delete')}</button></div></div></div>`;
  document.body.insertAdjacentHTML('beforeend', h);
  document.body.style.overflow = 'hidden';
}

// === TRANSFER FEE LINK (V2.0.4) ===
// Find the fee expense that belongs to a transfer. Linked by id (date no longer required,
// so editing the transfer date doesn't orphan it). Old fees without feeLinkedTo: date + description match.
function ftFindFeeIdx(parent) {
  if (!parent) return -1;
  let i = TXN.findIndex(tx => tx.feeLinkedTo !== undefined && String(tx.feeLinkedTo) === String(parent.id));
  if (i < 0 && parent.fee) i = TXN.findIndex(tx => !tx.feeLinkedTo && tx.t === 'Expense' && tx.s === 'Transfer Fee' && tx.d === parent.d && tx.dt && tx.dt.includes(parent.dt || parent.c));
  return i;
}

// Keep the fee expense in step with its transfer: create, update or remove it.
// before = the transfer as it was before an edit (null when adding), used to find old-style fees.
function ftSyncFeeTxn(tx, before, txnCurrency) {
  const idx = ftFindFeeIdx(before || tx);
  const wantFee = tx.t === 'Savings' && tx.fee > 0;
  const canSync = typeof ftSync !== 'undefined';
  if (!wantFee) {
    if (idx >= 0) { const gone = TXN.splice(idx, 1)[0]; if (canSync && ftSync.deleteTransaction) ftSync.deleteTransaction(gone.id); }
    return;
  }
  const fee = idx >= 0 ? TXN[idx] : { id: generateTxnId(), t: 'Expense', c: 'Bills', s: 'Transfer Fee' };
  fee.feeLinkedTo = tx.id;
  fee.d = tx.d;
  fee.dt = 'Fee for transfer: ' + (tx.dt || tx.c);
  if (txnCurrency && txnCurrency !== FT_BASE) {
    // V2.0.5: same fee + currency as before = keep the key-in rate (old code re-priced it on every edit)
    const keep = idx >= 0 && fee.cur === txnCurrency && Number(fee.origAmt) === Number(tx.fee) && Number(fee.a) > 0;
    if (!keep) { fee.a = Math.round(convertFromTo(tx.fee, txnCurrency, FT_BASE) * 100) / 100; delete fee.fx; }
    fee.cur = txnCurrency; fee.origAmt = tx.fee;
  } else { if (fee.cur || Number(fee.a) !== Number(tx.fee)) delete fee.fx; fee.a = tx.fee; delete fee.cur; delete fee.origAmt; }
  if (tx.acc) fee.acc = tx.acc; else delete fee.acc;
  if (idx < 0) TXN.push(fee);
  if (typeof ftStampFx === 'function') ftStampFx(); // save the key-in rate before it goes to the cloud
  if (canSync && ftSync.pushTransaction) ftSync.pushTransaction(fee);
}

function execDel() {
  const delId = pendAct.id;
  // Also delete the linked fee expense if this is a transfer with a fee
  const parentTx = TXN.find(tx => String(tx.id) === String(delId));
  if (parentTx && parentTx.t === 'Savings') {
    const feeIdx = ftFindFeeIdx(parentTx);
    if (feeIdx >= 0) {
      const feeTx = TXN.splice(feeIdx, 1)[0];
      if (typeof ftSync !== 'undefined') ftSync.deleteTransaction(feeTx.id);
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
