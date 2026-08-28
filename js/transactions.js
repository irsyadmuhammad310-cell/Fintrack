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
      const sign = tx.t === 'Income' ? '+' : '-';
      const bgColor = tx.t === 'Income' ? 'var(--emerald-light)' : tx.t === 'Savings' ? 'var(--blue-light)' : 'var(--rose-light)';
      const accName = tx.acc ? (ACCOUNTS.find(a => a.id === tx.acc)?.name || '') : '';
      const meta = [tx.c, tx.s, accName].filter(Boolean).join(' · ');
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
      const txIdEsc = String(tx.id).replace(/'/g, "\\'");
      return `<tr><td>${new Date(tx.d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</td><td><span class="tb ${cl}">${tx.t}</span></td><td>${tx.c}</td><td>${tx.s || '-'}</td><td style="color:var(--text-tertiary)">${tx.dt || '-'}</td><td class="${acl}" style="text-align:right">${tx.t === 'Expense' ? '-' : ''}${tx.origAmt && tx.cur ? (CURRENCY_CONFIG[tx.cur] ? CURRENCY_CONFIG[tx.cur].symbol : tx.cur + ' ') + tx.origAmt.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) : fmtD(tx.a)}</td><td><div class="ab"><button class="abtn" onclick="doAuth('edit','${txIdEsc}')">✏️</button><button class="abtn del" style="background:var(--rose-light);border-radius:6px;min-width:28px;min-height:28px" onclick="doAuth('delete','${txIdEsc}')">🗑</button></div></td></tr>`;
    }).join('');
  }
  document.getElementById('txinfo').textContent = f.length ? `${start + 1}-${Math.min(start + pp, f.length)} of ${f.length}` : '';
}

// === ADD/EDIT MODAL ===
function openAdd() {
  // V2.0.2: Mobile uses quick-add numpad flow
  if (window.innerWidth <= 900 && safeGet('ft_desktop_mode') !== 'true' && editId === null) {
    openQuickAdd();
    return;
  }
  const isEdit = editId !== null;
  const assetOpts = ACCOUNTS.filter(a => a.type === 'asset').map(a => `<option value="${a.id}">${a.name}</option>`).join('');
  const liabOpts = ACCOUNTS.filter(a => a.type === 'liability').map(a => `<option value="${a.id}">${a.name}</option>`).join('');
  const currencyOpts = Object.entries(CURRENCY_CONFIG).map(([code, cfg]) => `<option value="${code}"${code === displayCurrency ? ' selected' : ''}>${code} (${cfg.symbol})</option>`).join('');
  const h = `<div class="mo show" id="madd" onclick="if(event.target===this)tryClose()"><div class="ml" onclick="event.stopPropagation()"><div class="mh"><div><div class="mti">${isEdit ? t('txn_edit_title') : t('txn_add_title')}</div><div class="mds">${t('txn_cascade')}</div></div><div style="display:flex;align-items:center;gap:8px">${isEdit ? '<button type="button" class="mx" style="background:var(--rose-light);color:var(--rose);border:1px solid var(--rose);min-width:32px;min-height:32px;display:flex;align-items:center;justify-content:center" onclick="tryClose();doAuth(\'delete\',' + editId + ')" title="Delete"><i data-lucide="trash-2" width="14" height="14"></i></button>' : ''}<button class="mx" onclick="tryClose()">✕</button></div></div><form id="aform" onsubmit="saveTxn(event)"><div class="fr"><div class="fg"><label class="fl">${t('txn_date_label')} *</label><input class="fi" type="date" id="f_d" required value="${new Date().toISOString().split('T')[0]}"></div><div class="fg"><label class="fl">${t('txn_type_label')} *</label><select class="fi" id="f_t" required onchange="cascType()"><option value="">${t('txn_select')}</option><option value="Income">${t('dash_income')}</option><option value="Expense">${t('dash_expense')}</option><option value="Savings">Transfer</option></select></div></div><div class="fr"><div class="fg"><label class="fl">${t('txn_cat_label')} *</label><select class="fi" id="f_c" required onchange="cascCat()"><option value="">${t('txn_select_type')}</option></select></div><div class="fg"><label class="fl">${t('txn_sub_label')}</label><select class="fi" id="f_s"><option value="">${t('txn_select_cat')}</option></select></div></div><div class="fg" id="accRow" style="display:none"><label class="fl">${t('txn_account')} *</label><select class="fi" id="f_acc"><option value="">${t('txn_select_account')}</option>${assetOpts}</select></div><div class="fg" id="liabRow" style="display:none"><label class="fl">${t('txn_pay_liability')}</label><select class="fi" id="f_liab"><option value="">${t('txn_none_regular')}</option>${liabOpts}</select></div><div class="fr"><div class="fg" style="flex:1.5"><label class="fl">${t('txn_amount_label')} *</label><div style="display:flex;gap:6px"><select class="fi" id="f_cur" style="width:90px;flex-shrink:0;padding:9px 6px">${currencyOpts}</select><input class="fi" type="number" step="0.01" id="f_a" required placeholder="0.00" style="flex:1"></div></div><div class="fg"><label class="fl">${t('txn_desc_label')}</label><input class="fi" id="f_dt" placeholder="${t('txn_details_ph')}" oninput="debounceCatSuggest()"></div></div><div id="catSuggestWrap" style="display:none;margin:-8px 0 12px;padding:8px 12px;background:var(--accent-light);border-radius:8px;font-size:11px;display:none;align-items:center;gap:8px;flex-wrap:wrap"><span id="catSuggestText" style="color:var(--accent);font-weight:500"></span><button type="button" class="btn bp" style="font-size:10px;padding:3px 10px;min-height:auto" onclick="acceptCatSuggestion()">Accept</button><button type="button" style="border:none;background:none;color:var(--text-tertiary);font-size:14px;cursor:pointer;padding:2px 4px" onclick="dismissCatSuggestion()">✕</button></div><div class="ma"><button type="button" class="btn bs" onclick="tryClose()">${t('txn_cancel')}</button><button type="submit" class="btn bp">${isEdit ? t('txn_update') : t('txn_save')}</button></div></form></div></div>`;
  document.body.insertAdjacentHTML('beforeend', h);
  document.body.style.overflow = 'hidden';
  lucide.createIcons();
  // Bootstrap category memory on first modal open
  if (typeof bootstrapCatMemory === 'function') bootstrapCatMemory();
}

// === QUICK ADD V2.0.3 (Modern Interactive Mobile Flow) ===
var _qaType = 'Expense', _qaCat = '', _qaSub = '', _qaAmt = '', _qaDesc = '', _qaAcc = '', _qaLiab = '';

function openQuickAdd() {
  _qaType = 'Expense'; _qaCat = ''; _qaSub = ''; _qaAmt = ''; _qaDesc = ''; _qaAcc = ''; _qaLiab = '';
  var currOpts = Object.entries(CURRENCY_CONFIG).map(function(e) { return '<option value="' + e[0] + '"' + (e[0] === displayCurrency ? ' selected' : '') + '>' + e[1].symbol + '</option>'; }).join('');
  var today = new Date();
  var dateLabel = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  var h = '<div class="mo show" id="mqadd" style="background:var(--bg-primary)">';
  h += '<div style="display:flex;flex-direction:column;height:100dvh;overflow:hidden">';
  // Type selector with animated indicator
  h += '<div class="qa-type-bar">';
  h += '<div class="qa-type-indicator" data-type="Expense" id="qaTypeInd"></div>';
  h += '<div class="qa-tab active" data-t="Expense" onclick="qaSetType(\'Expense\')">Expense</div>';
  h += '<div class="qa-tab" data-t="Income" onclick="qaSetType(\'Income\')">Income</div>';
  h += '<div class="qa-tab" data-t="Savings" onclick="qaSetType(\'Savings\')">Transfer</div>';
  h += '</div>';
  // Amount hero
  h += '<div class="qa-amount-hero">';
  h += '<div class="qa-amount-label">Amount</div>';
  h += '<div class="qa-amount-display">';
  h += '<select id="qaCur" style="border:none;background:none;outline:none;font-size:1rem;font-weight:800;color:var(--text-tertiary);font-family:var(--font);appearance:none;text-align:center;padding:4px" onchange="qaUpdateConfirm()">' + currOpts + '</select>';
  h += '<input type="number" step="0.01" inputmode="decimal" id="qaAmtInput" placeholder="0" oninput="qaAmtChange()" style="color:var(--rose)">';
  h += '</div>';
  h += '<div class="qa-amount-line" id="qaAmtLine"></div>';
  h += '</div>';
  // Date chip
  h += '<div class="qa-date-row">';
  h += '<div class="qa-date-chip" onclick="document.getElementById(\'qaDateHidden\').showPicker?document.getElementById(\'qaDateHidden\').showPicker():document.getElementById(\'qaDateHidden\').focus()">';
  h += '<span style="font-size:14px">📅</span><span id="qaDateLabel">' + dateLabel + '</span>';
  h += '<input type="date" id="qaDateHidden" value="' + today.toISOString().split('T')[0] + '" onchange="qaDateChanged()" style="position:absolute;opacity:0;width:0;height:0;pointer-events:none">';
  h += '</div></div>';
  // Description
  h += '<div class="qa-desc-wrap">';
  h += '<input class="qa-desc-input" id="qaDesc" placeholder="What\'s this for?" oninput="qaHandleDesc()">';
  h += '</div>';
  // Auto-cat suggestion
  h += '<div class="qa-autocat" id="qaAutoCat">';
  h += '<div class="qa-autocat-pill"><span>🤖</span> <span id="qaAutoCatText"></span></div>';
  h += '<button class="qa-autocat-apply" onclick="qaAcceptCat()">Apply</button>';
  h += '<button class="qa-autocat-dismiss" onclick="document.getElementById(\'qaAutoCat\').classList.remove(\'show\')">✕</button>';
  h += '</div>';
  // Scrollable content
  h += '<div style="flex:1;overflow-y:auto;padding:0 16px;min-height:0;-webkit-overflow-scrolling:touch">';
  h += '<div class="qa-section-label">Category</div>';
  h += '<div id="qaCatGrid" class="qa-cat-grid"></div>';
  h += '<div id="qaSubRow" style="display:none"></div>';
  h += '<div id="qaLiabRow" style="display:none"></div>';
  h += '<div class="qa-acc-row">';
  h += '<div class="qa-section-label">Account</div>';
  h += '<div id="qaAccChips" class="qa-acc-chips"></div>';
  h += '</div>';
  h += '</div>';
  // Bottom bar
  h += '<div class="qa-bottom-bar">';
  h += '<button class="qa-cancel-btn" onclick="qaClose()">Cancel</button>';
  h += '<button class="qa-save-btn disabled" id="qaConfirm" onclick="qaSave()">Save</button>';
  h += '</div>';
  h += '</div></div>';
  document.body.insertAdjacentHTML('beforeend', h);
  document.body.style.overflow = 'hidden';
  qaRenderCats();
  qaRenderAccounts();
  setTimeout(function() { document.getElementById('qaAmtInput').focus(); }, 350);
}

function qaDateChanged() {
  var input = document.getElementById('qaDateHidden');
  if (!input || !input.value) return;
  var d = new Date(input.value + 'T00:00:00');
  var today = new Date(); today.setHours(0,0,0,0);
  var yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  var label;
  if (d.toDateString() === today.toDateString()) label = 'Today';
  else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday';
  else label = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  document.getElementById('qaDateLabel').textContent = label;
}

function qaAmtChange() {
  var input = document.getElementById('qaAmtInput');
  _qaAmt = input.value;
  var color = _qaType === 'Income' ? 'var(--emerald)' : _qaType === 'Savings' ? 'var(--blue)' : 'var(--rose)';
  input.style.color = color;
  // Animate underline
  var line = document.getElementById('qaAmtLine');
  if (line) {
    if (_qaAmt && parseFloat(_qaAmt) > 0) {
      line.className = 'qa-amount-line active';
      line.dataset.type = _qaType;
    } else {
      line.className = 'qa-amount-line';
    }
  }
  qaUpdateConfirm();
}

function qaSetType(type) {
  _qaType = type;
  _qaCat = ''; _qaSub = ''; _qaLiab = '';
  document.querySelectorAll('.qa-tab').forEach(function(t) { t.classList.toggle('active', t.dataset.t === type); });
  // Animate indicator
  var ind = document.getElementById('qaTypeInd');
  if (ind) ind.dataset.type = type;
  // Update amount color
  var color = type === 'Income' ? 'var(--emerald)' : type === 'Savings' ? 'var(--blue)' : 'var(--rose)';
  var input = document.getElementById('qaAmtInput');
  if (input && input.value) input.style.color = color;
  // Update underline
  var line = document.getElementById('qaAmtLine');
  if (line && line.classList.contains('active')) line.dataset.type = type;
  qaRenderCats();
  document.getElementById('qaSubRow').style.display = 'none';
  document.getElementById('qaLiabRow').style.display = 'none';
  qaUpdateConfirm();
}

function qaRenderCats() {
  var cats = SCHEMA[_qaType] ? Object.keys(SCHEMA[_qaType]) : [];
  var emojis = {'Food':'🍜','Transportation':'🚗','Housing':'🏠','Loan':'💸','Gift':'🎁','Entertainment':'🎬','Insurance & Taxes':'🛡','Employment (Net)':'💼','Cash':'💰','Dividen':'📈','KWSP':'📊','TH':'🕌','ASBN':'💎','Bank':'🏦','Versa':'🔮','Future':'📉','TNGO':'📱','Rize':'🏦','Saham PPK':'📊'};
  var grid = document.getElementById('qaCatGrid');
  grid.innerHTML = cats.map(function(c) {
    var emoji = emojis[c] || '📦';
    var shortName = c.length > 10 ? c.substring(0,9) + '..' : c;
    return '<div class="qa-cat-item' + (_qaCat === c ? ' selected' : '') + '" onclick="qaSelectCat(\'' + c.replace(/'/g,"\\'") + '\')"><span class="qa-cat-emoji">' + emoji + '</span><span class="qa-cat-name">' + shortName + '</span></div>';
  }).join('');
}

function qaSelectCat(cat) {
  _qaCat = cat;
  _qaSub = '';
  _qaLiab = '';
  qaRenderCats();
  // Show subcategories with animation
  var subs = SCHEMA[_qaType] && SCHEMA[_qaType][cat] ? SCHEMA[_qaType][cat] : [];
  var subRow = document.getElementById('qaSubRow');
  if (subs.length) {
    subRow.innerHTML = '<div class="qa-section-label" style="margin-top:0">Subcategory</div><div class="qa-sub-row">' + subs.map(function(s) {
      return '<div class="qa-sub-chip' + (_qaSub === s ? ' selected' : '') + '" onclick="qaSelectSub(\'' + s.replace(/'/g,"\\'") + '\')">' + s + '</div>';
    }).join('') + '</div>';
    subRow.style.display = 'block';
  } else { subRow.style.display = 'none'; }
  // Show liability picker
  var liabRow = document.getElementById('qaLiabRow');
  if (_qaType === 'Expense' && (cat === 'Loan' || cat.toLowerCase().includes('loan'))) {
    var liabs = ACCOUNTS.filter(function(a) { return a.type === 'liability'; });
    if (liabs.length) {
      liabRow.innerHTML = '<div class="qa-liab-section"><div class="qa-liab-label">💳 Pay liability?</div><div class="qa-liab-chips">' + liabs.map(function(l) { return '<div class="qa-liab-chip' + (_qaLiab === l.id ? ' selected' : '') + '" onclick="qaSelectLiab(\'' + l.id + '\')">' + l.name + '</div>'; }).join('') + '<div class="qa-liab-chip skip" onclick="qaSelectLiab(\'\')">Skip</div></div></div>';
      liabRow.style.display = 'block';
    } else { liabRow.style.display = 'none'; }
  } else { liabRow.style.display = 'none'; }
  qaUpdateConfirm();
  // Smooth scroll to subcategories
  if (subs.length) {
    setTimeout(function() { subRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 100);
  }
}

function qaSelectSub(sub) {
  _qaSub = _qaSub === sub ? '' : sub;
  qaSelectCat(_qaCat);
  // Auto-link liability from map
  var mappedLiab = typeof getLiabForSub === 'function' ? getLiabForSub(sub) : null;
  if (mappedLiab && _qaType === 'Expense') { _qaLiab = mappedLiab; qaSelectCat(_qaCat); }
}

function qaSelectLiab(id) { _qaLiab = _qaLiab === id ? '' : id; qaSelectCat(_qaCat); }

function qaRenderAccounts() {
  var assets = ACCOUNTS.filter(function(a) { return a.type === 'asset'; });
  var chips = document.getElementById('qaAccChips');
  if (!chips) return;
  var colors = ['var(--emerald)', 'var(--blue)', 'var(--amber)', 'var(--pink)', 'var(--accent)'];
  chips.innerHTML = assets.map(function(a, i) {
    var dotColor = colors[i % colors.length];
    return '<div class="qa-acc-chip' + (_qaAcc === a.id ? ' selected' : '') + '" onclick="qaSelectAcc(\'' + a.id + '\')"><span class="qa-acc-dot" style="background:' + dotColor + '"></span>' + a.name + '</div>';
  }).join('');
}

function qaSelectAcc(id) { _qaAcc = _qaAcc === id ? '' : id; qaRenderAccounts(); }

function qaUpdateConfirm() {
  var btn = document.getElementById('qaConfirm');
  if (!btn) return;
  var valid = _qaAmt && parseFloat(_qaAmt) > 0 && _qaCat;
  if (valid) {
    btn.classList.remove('disabled');
    btn.classList.add('ready');
    var curSel = document.getElementById('qaCur');
    var selCur = curSel ? curSel.value : displayCurrency;
    var sym = CURRENCY_CONFIG[selCur] ? CURRENCY_CONFIG[selCur].symbol : 'RM';
    btn.textContent = 'Save ' + (_qaType === 'Income' ? '+' : '-') + sym + parseFloat(_qaAmt).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
  } else {
    btn.classList.add('disabled');
    btn.classList.remove('ready');
    btn.textContent = 'Save';
  }
}

function qaHandleDesc() {
  var val = document.getElementById('qaDesc').value.trim();
  _qaDesc = val;
  if (!val || val.length < 2 || safeGet('ft_autocat_off') === 'true') { document.getElementById('qaAutoCat').classList.remove('show'); return; }
  var suggestion = typeof suggestCategory === 'function' ? suggestCategory(val) : null;
  if (suggestion && suggestion.t === _qaType) {
    document.getElementById('qaAutoCatText').textContent = suggestion.c + (suggestion.s ? ' → ' + suggestion.s : '');
    document.getElementById('qaAutoCat').classList.add('show');
    document.getElementById('qaAutoCat').dataset.cat = suggestion.c;
    document.getElementById('qaAutoCat').dataset.sub = suggestion.s || '';
  } else { document.getElementById('qaAutoCat').classList.remove('show'); }
}

function qaAcceptCat() {
  var el = document.getElementById('qaAutoCat');
  var cat = el.dataset.cat;
  var sub = el.dataset.sub;
  if (cat) { qaSelectCat(cat); if (sub) { _qaSub = sub; qaSelectCat(cat); } }
  el.classList.remove('show');
}

function qaSave() {
  var amt = parseFloat(_qaAmt);
  if (!amt || !_qaCat) return;
  var dateVal = document.getElementById('qaDateHidden') ? document.getElementById('qaDateHidden').value : new Date().toISOString().split('T')[0];
  var txnCurrency = document.getElementById('qaCur') ? document.getElementById('qaCur').value : displayCurrency;
  var data = { id: generateTxnId(), d: dateVal, t: _qaType, c: _qaCat, s: _qaSub, a: amt, dt: _qaDesc };
  // Convert to MYR if different currency
  if (txnCurrency !== 'MYR') {
    var rate = exchangeRates[txnCurrency] || FALLBACK_RATES[txnCurrency] || 1;
    data.a = Math.round((amt / rate) * 100) / 100;
    data.cur = txnCurrency;
    data.origAmt = amt;
  }
  if (_qaAcc) data.acc = _qaAcc;
  if (_qaLiab) data.liab = _qaLiab;
  TXN.push(data);
  // Liability payment reduction
  if (data.t === 'Expense' && data.liab) {
    var liabAcc = ACCOUNTS.find(function(a) { return a.id === data.liab; });
    if (liabAcc) { liabAcc.initialBalance = Math.max(0, liabAcc.initialBalance - data.a); saveACCOUNTS(); }
  }
  if (typeof learnFromTransaction === 'function') learnFromTransaction(data);
  saveTXN();
  if (typeof ftSync !== 'undefined' && ftSync.pushTransaction) ftSync.pushTransaction(data);
  if (typeof syncGoalsWithSavings === 'function') syncGoalsWithSavings();
  if (typeof checkBudgetAlerts === 'function') checkBudgetAlerts();
  // Instant close & refresh (no animation delay)
  qaClose();
  render();
  toast('✅ ' + (_qaType === 'Savings' ? 'Transfer' : _qaType) + ' added');
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
}

function cascCat() {
  const tp = document.getElementById('f_t').value;
  const cat = document.getElementById('f_c').value;
  const s = document.getElementById('f_s');
  s.innerHTML = '<option value="">-</option>';
  if (tp && cat && SCHEMA[tp] && SCHEMA[tp][cat] && SCHEMA[tp][cat].length) {
    SCHEMA[tp][cat].forEach(v => { s.innerHTML += '<option value="' + v + '">' + v + '</option>'; });
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
  if (accEl && accEl.value) data.acc = accEl.value;
  if (liabEl && liabEl.value) data.liab = liabEl.value;
  if (editId) { const i = TXN.findIndex(tx => tx.id === editId); if (i >= 0) TXN[i] = { ...TXN[i], ...data }; toast(t('txn_updated')); }
  else { data.id = generateTxnId(); TXN.push(data); toast(t('txn_added')); }
  // If liability payment: create a reduction on the liability account
  if (data.t === 'Expense' && data.liab) {
    const liabAcc = ACCOUNTS.find(a => a.id === data.liab);
    if (liabAcc) { liabAcc.initialBalance = Math.max(0, liabAcc.initialBalance - data.a); saveACCOUNTS(); }
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
  setTimeout(() => { document.getElementById('f_d').value = tx.d; document.getElementById('f_t').value = tx.t; cascType(); setTimeout(() => { document.getElementById('f_c').value = tx.c; cascCat(); setTimeout(() => { document.getElementById('f_s').value = tx.s || ''; }, 20); }, 20); document.getElementById('f_a').value = tx.origAmt || tx.a; document.getElementById('f_dt').value = tx.dt || ''; const curEl = document.getElementById('f_cur'); if (curEl) curEl.value = tx.cur || 'MYR'; if (tx.acc) { const accEl = document.getElementById('f_acc'); if (accEl) accEl.value = tx.acc; } if (tx.liab) { const liabEl = document.getElementById('f_liab'); if (liabEl) liabEl.value = tx.liab; } document.querySelector('.mti').textContent = t('txn_edit_title'); }, 30);
}

function doDelConfirm(id) {
  const tx = TXN.find(x => String(x.id) === String(id)); if (!tx) return;
  pendAct = { action: 'delete', id: tx.id };
  const h = `<div class="mo show" id="mdel" onclick="if(event.target===this){this.remove();document.body.style.overflow=''}"><div class="ml" onclick="event.stopPropagation()"><div class="mh"><div><div class="mti">${t('del_title')}</div><div class="mds">${t('del_desc')}</div></div></div><div style="padding:12px;background:var(--rose-light);border-radius:8px;font-size:12px;margin-bottom:16px"><b>${tx.c}</b> ${tx.s ? '/ ' + tx.s : ''} - ${fmtD(tx.a)}</div><div class="ma"><button class="btn bs" onclick="document.getElementById('mdel').remove();document.body.style.overflow=''">${t('del_cancel')}</button><button class="btn bd" onclick="execDel()">${t('del_delete')}</button></div></div></div>`;
  document.body.insertAdjacentHTML('beforeend', h);
  document.body.style.overflow = 'hidden';
}

function execDel() {
  TXN = TXN.filter(tx => String(tx.id) !== String(pendAct.id)); saveTXN();
  // Cloud sync: delete from Supabase
  if (typeof ftSync !== 'undefined') ftSync.deleteTransaction(pendAct.id);
  // Sync goals immediately after delete
  if (typeof syncGoalsWithSavings === 'function') syncGoalsWithSavings();
  document.getElementById('mdel').remove(); document.body.style.overflow = '';
  toast(t('txn_deleted'));
  // v15.3.0: Refresh current view (stays on current tab)
  render();
}
