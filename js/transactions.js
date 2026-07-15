// === TRANSACTIONS ===
function renderTransactions(c) {
  const selYear = txnYearSel || getSelectedYear();
  c.innerHTML = `<div class="tt"><div class="tf"><select class="fsel" id="txyr" onchange="txnYearSel=parseInt(this.value);renderTxnTable()">${buildYearOptions(selYear)}</select><select class="fsel" id="txm" onchange="txnMonthSel=this.value;renderTxnTable()"><option value="total">${t('hdr_total_year')}</option><option value="0">Jan</option><option value="1">Feb</option><option value="2">Mar</option><option value="3">Apr</option><option value="4">May</option><option value="5">Jun</option><option value="6">Jul</option><option value="7">Aug</option><option value="8">Sep</option><option value="9">Oct</option><option value="10">Nov</option><option value="11">Dec</option></select><div class="sb2"><i data-lucide="search" width="14" height="14"></i><input placeholder="${t('txn_search')}" id="txs" oninput="renderTxnTable()"></div></div><div style="display:flex;gap:6px"><button class="btn bp" id="addbtn" onclick="editId=null;openAdd()"><i data-lucide="plus" width="12" height="12"></i> ${t('txn_add')}</button><button class="btn bs" onclick="toast(t('txn_exported'))"><i data-lucide="download" width="12" height="12"></i> ${t('txn_export')}</button></div></div><div class="tsg" id="txsm"></div><div class="tw"><div style="overflow-x:auto"><table><thead><tr><th>${t('txn_date')}</th><th>${t('txn_type')}</th><th>${t('txn_category')}</th><th>${t('txn_sub')}</th><th>${t('txn_details')}</th><th style="text-align:right">${t('txn_amount')}</th><th style="text-align:center;width:80px">${t('txn_actions')}</th></tr></thead><tbody id="txbody"></tbody></table></div><div class="tp"><span id="txinfo"></span><div class="pb" id="txpg"></div></div></div>`;
  lucide.createIcons();
  if (!txnInitialized) {
    const now = new Date();
    txnMonthSel = now.getFullYear() === selYear ? String(now.getMonth()) : 'total';
    txnYearSel = selYear;
    txnInitialized = true;
  }
  document.getElementById('txyr').value = txnYearSel;
  document.getElementById('txm').value = txnMonthSel || 'total';
  renderTxnTable();
}

function renderTxnTable() {
  const year = txnYearSel || parseInt(document.getElementById('txyr')?.value || CURRENT_YEAR);
  const m = txnMonthSel || document.getElementById('txm')?.value || 'total';
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
  if (sm) sm.innerHTML = `<div class="tsi"><div class="tsl">${t('txn_count')}</div><div class="tsv">${f.length}</div></div><div class="tsi"><div class="tsl">${t('dash_income')}</div><div class="tsv" style="color:var(--emerald)">${fmt(inc)}</div></div><div class="tsi"><div class="tsl">${t('dash_expense')}</div><div class="tsv" style="color:var(--rose)">${fmt(exp)}</div></div><div class="tsi"><div class="tsl">${t('dash_savings')}</div><div class="tsv" style="color:var(--blue)">${fmt(sav)}</div></div><div class="tsi"><div class="tsl">${t('txn_net')}</div><div class="tsv" style="color:${net >= 0 ? 'var(--emerald)' : 'var(--rose)'}">${fmt(net)}</div></div>`;
  const pp = 50, start = (txnPg - 1) * pp, pg = f.slice(start, start + pp);
  const body = document.getElementById('txbody');
  if (!pg.length) {
    body.innerHTML = `<tr><td colspan="7"><div class="es"><div style="font-size:24px">📭</div><p>${t('txn_no_found')} ${year}${m !== 'total' ? ' (' + MONTH_NAMES[+m] + ')' : ''}.</p></div></td></tr>`;
  } else {
    body.innerHTML = pg.map(tx => {
      const cl = tx.t === 'Income' ? 'i' : tx.t === 'Expense' ? 'e' : 's';
      const acl = tx.t === 'Income' ? 'ai' : tx.t === 'Savings' ? 'as' : 'ae';
      return `<tr><td>${new Date(tx.d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</td><td><span class="tb ${cl}">${tx.t}</span></td><td>${tx.c}</td><td>${tx.s || '-'}</td><td style="color:var(--text-tertiary)">${tx.dt || '-'}</td><td class="${acl}" style="text-align:right">${tx.t === 'Expense' ? '-' : ''}${fmtD(tx.a)}</td><td><div class="ab"><button class="abtn" onclick="doAuth('edit',${tx.id})">✏️</button><button class="abtn del" onclick="doAuth('delete',${tx.id})">🗑</button></div></td></tr>`;
    }).join('');
  }
  document.getElementById('txinfo').textContent = f.length ? `${start + 1}-${Math.min(start + pp, f.length)} of ${f.length}` : '';
}

// === ADD/EDIT MODAL ===
function openAdd() {
  const isEdit = editId !== null;
  const assetOpts = ACCOUNTS.filter(a => a.type === 'asset').map(a => `<option value="${a.id}">${a.name}</option>`).join('');
  const liabOpts = ACCOUNTS.filter(a => a.type === 'liability').map(a => `<option value="${a.id}">${a.name}</option>`).join('');
  const h = `<div class="mo show" id="madd" onclick="if(event.target===this)tryClose()"><div class="ml" onclick="event.stopPropagation()"><div class="mh"><div><div class="mti">${isEdit ? t('txn_edit_title') : t('txn_add_title')}</div><div class="mds">${t('txn_cascade')}</div></div><button class="mx" onclick="tryClose()">✕</button></div><form id="aform" onsubmit="saveTxn(event)"><div class="fr"><div class="fg"><label class="fl">${t('txn_date_label')} *</label><input class="fi" type="date" id="f_d" required value="${new Date().toISOString().split('T')[0]}"></div><div class="fg"><label class="fl">${t('txn_type_label')} *</label><select class="fi" id="f_t" required onchange="cascType()"><option value="">${t('txn_select')}</option><option value="Income">Income</option><option value="Expense">Expense</option><option value="Savings">Savings</option></select></div></div><div class="fr"><div class="fg"><label class="fl">${t('txn_cat_label')} *</label><select class="fi" id="f_c" required onchange="cascCat()"><option value="">${t('txn_select_type')}</option></select></div><div class="fg"><label class="fl">${t('txn_sub_label')}</label><select class="fi" id="f_s"><option value="">${t('txn_select_cat')}</option></select></div></div><div class="fg" id="accRow" style="display:none"><label class="fl">Account *</label><select class="fi" id="f_acc"><option value="">Select account</option>${assetOpts}</select></div><div class="fg" id="liabRow" style="display:none"><label class="fl">Pay Liability</label><select class="fi" id="f_liab"><option value="">None (regular expense)</option>${liabOpts}</select></div><div class="fr"><div class="fg"><label class="fl">${t('txn_amount_label')} *</label><input class="fi" type="number" step="0.01" id="f_a" required placeholder="0.00"></div><div class="fg"><label class="fl">${t('txn_desc_label')}</label><input class="fi" id="f_dt" placeholder="${t('txn_details_ph')}"></div></div><div class="ma"><button type="button" class="btn bs" onclick="tryClose()">${t('txn_cancel')}</button><button type="submit" class="btn bp">${isEdit ? t('txn_update') : t('txn_save')}</button></div></form></div></div>`;
  document.body.insertAdjacentHTML('beforeend', h);
  document.body.style.overflow = 'hidden';
}

function cascType() {
  const tp = document.getElementById('f_t').value;
  const c = document.getElementById('f_c');
  const s = document.getElementById('f_s');
  c.innerHTML = `<option value="">${t('txn_select')}</option>`;
  s.innerHTML = '<option value="">-</option>';
  if (tp && SCHEMA[tp]) Object.keys(SCHEMA[tp]).forEach(k => c.innerHTML += `<option>${k}</option>`);
  // Show/hide account rows based on type
  const accRow = document.getElementById('accRow');
  const liabRow = document.getElementById('liabRow');
  if (accRow) accRow.style.display = (tp === 'Income' || tp === 'Expense' || tp === 'Savings') ? 'block' : 'none';
  if (liabRow) liabRow.style.display = tp === 'Expense' ? 'block' : 'none';
}

function cascCat() {
  const tp = document.getElementById('f_t').value;
  const cat = document.getElementById('f_c').value;
  const s = document.getElementById('f_s');
  s.innerHTML = '<option value="">-</option>';
  if (tp && cat && SCHEMA[tp] && SCHEMA[tp][cat]) SCHEMA[tp][cat].forEach(v => s.innerHTML += `<option>${v}</option>`);
}

function tryClose() {
  const el = document.getElementById('madd');
  if (el) { el.remove(); document.body.style.overflow = ''; editId = null; document.getElementById('addbtn')?.focus(); }
}

function saveTxn(e) {
  e.preventDefault();
  const data = { d: document.getElementById('f_d').value, t: document.getElementById('f_t').value, c: document.getElementById('f_c').value, s: document.getElementById('f_s').value || '', a: parseFloat(document.getElementById('f_a').value), dt: document.getElementById('f_dt').value || '' };
  // Account linking
  const accEl = document.getElementById('f_acc');
  const liabEl = document.getElementById('f_liab');
  if (accEl && accEl.value) data.acc = accEl.value;
  if (liabEl && liabEl.value) data.liab = liabEl.value;
  if (editId) { const i = TXN.findIndex(tx => tx.id === editId); if (i >= 0) TXN[i] = { ...TXN[i], ...data }; toast(t('txn_updated')); }
  else { data.id = nxId++; TXN.push(data); toast(t('txn_added')); }
  // If liability payment: create a reduction on the liability account
  if (data.t === 'Expense' && data.liab) {
    const liabAcc = ACCOUNTS.find(a => a.id === data.liab);
    if (liabAcc) { liabAcc.initialBalance = Math.max(0, liabAcc.initialBalance - data.a); saveACCOUNTS(); }
  }
  saveTXN(); tryClose(); renderTxnTable();
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { const m = document.getElementById('madd'); if (m) { tryClose(); return; } const a = document.getElementById('mauth'); if (a) { a.remove(); document.body.style.overflow = ''; return; } }
});

// === AUTH + DELETE ===
function doAuth(action, id) {
  if (Date.now() < lockUntil) { toast(t('auth_locked')); return; }
  pendAct = { action, id };
  const h = `<div class="mo show" id="mauth" onclick="if(event.target===this){this.remove();document.body.style.overflow=''}"><div class="ml" onclick="event.stopPropagation()"><div class="mh"><div><div class="mti">${t('auth_title')}</div><div class="mds">${t('auth_desc')}</div></div></div><div class="fg"><label class="fl">${t('auth_passkey')}</label><input class="fi" type="password" id="f_pk" placeholder="${t('auth_enter')}" autofocus></div><div class="ferr" id="pkerr"></div><div id="pklck"></div><div class="ma"><button class="btn bs" onclick="document.getElementById('mauth').remove();document.body.style.overflow=''">${t('auth_cancel')}</button><button class="btn bp" onclick="verifyPK()">${t('auth_confirm')}</button></div></div></div>`;
  document.body.insertAdjacentHTML('beforeend', h);
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('f_pk')?.focus(), 50);
}

function verifyPK() {
  if (Date.now() < lockUntil) return;
  const v = document.getElementById('f_pk').value;
  if (v === getPK()) { authAtt = 0; document.getElementById('mauth').remove(); document.body.style.overflow = ''; if (pendAct.action === 'edit') doEdit(pendAct.id); else doDelConfirm(pendAct.id); }
  else { authAtt++; if (authAtt >= 3) { lockUntil = Date.now() + 30000; document.getElementById('pklck').innerHTML = `<div style="color:var(--rose);font-size:12px;padding:8px;background:var(--rose-light);border-radius:6px;margin-top:8px;text-align:center">${t('auth_locked_30')}</div>`; setTimeout(() => { authAtt = 0; }, 30000); } else { const e = document.getElementById('pkerr'); e.textContent = t('auth_incorrect') + ' ' + (3 - authAtt) + ' ' + t('auth_left'); e.classList.add('show'); } }
}

function doEdit(id) {
  const tx = TXN.find(x => x.id === id); if (!tx) return;
  editId = id; openAdd();
  setTimeout(() => { document.getElementById('f_d').value = tx.d; document.getElementById('f_t').value = tx.t; cascType(); setTimeout(() => { document.getElementById('f_c').value = tx.c; cascCat(); setTimeout(() => { document.getElementById('f_s').value = tx.s || ''; }, 20); }, 20); document.getElementById('f_a').value = tx.a; document.getElementById('f_dt').value = tx.dt || ''; if (tx.acc) { const accEl = document.getElementById('f_acc'); if (accEl) accEl.value = tx.acc; } if (tx.liab) { const liabEl = document.getElementById('f_liab'); if (liabEl) liabEl.value = tx.liab; } document.querySelector('.mti').textContent = t('txn_edit_title'); }, 30);
}

function doDelConfirm(id) {
  const tx = TXN.find(x => x.id === id); if (!tx) return;
  pendAct = { action: 'delete', id };
  const h = `<div class="mo show" id="mdel" onclick="if(event.target===this){this.remove();document.body.style.overflow=''}"><div class="ml" onclick="event.stopPropagation()"><div class="mh"><div><div class="mti">${t('del_title')}</div><div class="mds">${t('del_desc')}</div></div></div><div style="padding:12px;background:var(--rose-light);border-radius:8px;font-size:12px;margin-bottom:16px"><b>${tx.c}</b> ${tx.s ? '/ ' + tx.s : ''} - ${fmtD(tx.a)}</div><div class="ma"><button class="btn bs" onclick="document.getElementById('mdel').remove();document.body.style.overflow=''">${t('del_cancel')}</button><button class="btn bd" onclick="execDel()">${t('del_delete')}</button></div></div></div>`;
  document.body.insertAdjacentHTML('beforeend', h);
  document.body.style.overflow = 'hidden';
}

function execDel() {
  TXN = TXN.filter(tx => tx.id !== pendAct.id); saveTXN();
  document.getElementById('mdel').remove(); document.body.style.overflow = '';
  toast(t('txn_deleted')); renderTxnTable();
}
