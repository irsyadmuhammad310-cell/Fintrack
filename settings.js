// === SETTINGS (v11.5) ===
let setSubTab = 'currency';
const FINTRACK_VERSION = 'v15.0';

function renderSettings(c) {
  c.innerHTML = `<div class="stitle">${t('set_title')}</div><div class="ssub">${t('set_sub')}</div><div class="setg"><div class="setn"><div class="sni active" onclick="setTab(this,'general')"><i data-lucide="sliders" width="14" height="14"></i>${t('set_general')}</div><div class="sni" onclick="setTab(this,'security')"><i data-lucide="shield" width="14" height="14"></i>${t('set_security')}</div><div class="sni" onclick="setTab(this,'importexport')"><i data-lucide="arrow-left-right" width="14" height="14"></i>Import / Export</div><div class="sni" onclick="setTab(this,'backup')"><i data-lucide="hard-drive" width="14" height="14"></i>${t('set_backup')}</div><div class="sni" onclick="setTab(this,'about')"><i data-lucide="info" width="14" height="14"></i>About</div></div><div class="setc" id="setc"></div></div>`;
  lucide.createIcons();
  setTab(null, 'general');
}

function setTab(el, tab) {
  if (el) { document.querySelectorAll('.sni').forEach(i => i.classList.remove('active')); el.classList.add('active'); }
  const c = document.getElementById('setc');
  if (tab === 'general') { renderGeneralTab(c); }
  else if (tab === 'security') { renderSecurityTab(c); }
  else if (tab === 'importexport') { renderImportExportTab(c); }
  else if (tab === 'backup') { renderBackupTab(c); }
  else if (tab === 'about') { renderAboutTab(c); }
}

// === GENERAL TAB (v10.9.1 — Expandable Sections) ===
function renderGeneralTab(c) {
  const currencyOptions = Object.entries(CURRENCY_CONFIG).map(([code, cfg]) => `<option value="${code}"${code === displayCurrency ? ' selected' : ''}>${code} (${cfg.symbol}) - ${cfg.name}</option>`).join('');
  const langOptions = [['en','English'],['zh','简体中文'],['ja','日本語']].map(([code, name]) => `<option value="${code}"${code === currentLang ? ' selected' : ''}>${name}</option>`).join('');
  const rateInfo = ratesLastUpdated ? `${t('set_rate_info')}: ${new Date(ratesLastUpdated).toLocaleString()}` : '';

  c.innerHTML = `<div style="display:flex;gap:6px;margin-bottom:20px;flex-wrap:wrap">
    <button class="btn ${setSubTab === 'currency' ? 'bp' : 'bs'}" onclick="setSubTab='currency';renderGeneralTab(document.getElementById('setc'))">Appearance</button>
    <button class="btn ${setSubTab === 'categories' ? 'bp' : 'bs'}" onclick="setSubTab='categories';renderGeneralTab(document.getElementById('setc'))">Categories</button>
    <button class="btn ${setSubTab === 'accounts' ? 'bp' : 'bs'}" onclick="setSubTab='accounts';renderGeneralTab(document.getElementById('setc'))">Accounts</button>
    <button class="btn ${setSubTab === 'years' ? 'bp' : 'bs'}" onclick="setSubTab='years';renderGeneralTab(document.getElementById('setc'))">Years</button>
    <button class="btn ${setSubTab === 'notifications' ? 'bp' : 'bs'}" onclick="setSubTab='notifications';renderGeneralTab(document.getElementById('setc'))">Notifications</button>
  </div><div id="genContent"></div>`;

  const gc = document.getElementById('genContent');
  if (setSubTab === 'currency') {
    gc.innerHTML = `<div style="display:grid;gap:16px"><div style="border:1px solid var(--border);border-radius:12px;padding:16px 18px"><div style="display:flex;align-items:center;gap:10px;margin-bottom:14px"><div style="width:32px;height:32px;border-radius:8px;background:var(--emerald-light);color:var(--emerald);display:flex;align-items:center;justify-content:center"><i data-lucide="user" width="15" height="15"></i></div><div><div style="font-size:13px;font-weight:600">Profile</div><div style="font-size:10px;color:var(--text-tertiary)">Your name and greeting preference</div></div></div><div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap;align-items:end"><div style="flex:1;min-width:140px"><label style="font-size:10px;font-weight:500;color:var(--text-secondary);display:block;margin-bottom:3px">Name</label><input class="fi" id="set_username" value="${getUserName()}" placeholder="Your name" style="font-size:13px"></div><div style="min-width:100px"><label style="font-size:10px;font-weight:500;color:var(--text-secondary);display:block;margin-bottom:3px">Title</label><select class="fi" id="set_usertitle" style="font-size:13px"><option value=""${!getUserTitle() ? ' selected' : ''}>None</option><option value="sir"${getUserTitle()==='sir' ? ' selected' : ''}>Sir</option><option value="master"${getUserTitle()==='master' ? ' selected' : ''}>Master</option><option value="boss"${getUserTitle()==='boss' ? ' selected' : ''}>Boss</option><option value="bro"${getUserTitle()==='bro' ? ' selected' : ''}>Bro</option><option value="chief"${getUserTitle()==='chief' ? ' selected' : ''}>Chief</option></select></div><button class="btn bp" style="font-size:11px;padding:6px 14px" onclick="saveProfileSettings()">Save</button></div><div style="font-size:10px;color:var(--text-tertiary)">Preview: "${getGreeting()}"</div></div><div style="border:1px solid var(--border);border-radius:12px;padding:16px 18px"><div style="display:flex;align-items:center;gap:10px;margin-bottom:14px"><div style="width:32px;height:32px;border-radius:8px;background:var(--accent-light);color:var(--accent);display:flex;align-items:center;justify-content:center"><i data-lucide="palette" width="15" height="15"></i></div><div><div style="font-size:13px;font-weight:600">Appearance</div><div style="font-size:10px;color:var(--text-tertiary)">Theme and display preferences</div></div></div><div class="trow"><div class="tinf"><div class="tna">${t('set_dark_mode')}</div><div class="tde">${t('set_theme')}</div></div><div class="tsw ${document.documentElement.dataset.theme === 'dark' ? 'on' : ''}" onclick="toggleTheme();this.classList.toggle('on')"></div></div></div><div style="border:1px solid var(--border);border-radius:12px;padding:16px 18px"><div style="display:flex;align-items:center;gap:10px;margin-bottom:14px"><div style="width:32px;height:32px;border-radius:8px;background:var(--gold-light);color:var(--gold);display:flex;align-items:center;justify-content:center"><i data-lucide="coins" width="15" height="15"></i></div><div><div style="font-size:13px;font-weight:600">${t('set_currency')}</div><div style="font-size:10px;color:var(--text-tertiary)">${t('set_currency_desc')}</div></div></div><select class="fi" style="max-width:320px" id="set_currency" onchange="handleCurrencyChange(this.value)">${currencyOptions}</select><div style="margin-top:6px;font-size:10px;color:var(--text-tertiary)" id="rateStatus">${rateInfo}</div></div><div style="border:1px solid var(--border);border-radius:12px;padding:16px 18px"><div style="display:flex;align-items:center;gap:10px;margin-bottom:14px"><div style="width:32px;height:32px;border-radius:8px;background:var(--blue-light);color:var(--blue);display:flex;align-items:center;justify-content:center"><i data-lucide="languages" width="15" height="15"></i></div><div><div style="font-size:13px;font-weight:600">${t('set_language')}</div><div style="font-size:10px;color:var(--text-tertiary)">${t('set_language_desc')}</div></div></div><select class="fi" style="max-width:320px" id="set_lang" onchange="setLang(this.value)">${langOptions}</select></div></div>`;
    lucide.createIcons();
  } else if (setSubTab === 'categories') {
    renderCategoriesTab(gc);
  } else if (setSubTab === 'accounts') {
    renderAccountsTab(gc);
  } else if (setSubTab === 'years') {
    renderYearsTab(gc);
  } else if (setSubTab === 'notifications') {
    renderNotificationsTab(gc);
  }
}

// === CATEGORIES (v10.4 Redesigned) ===
let catTypeFilter = 'Income';
function renderCategoriesTab(c) {
  let html = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><div style="display:flex;gap:4px">`;
  ['Income','Expense','Savings'].forEach(tp => {
    html += `<button class="btn ${catTypeFilter === tp ? 'bp' : 'bs'}" style="font-size:11px;padding:5px 12px" onclick="catTypeFilter='${tp}';renderGeneralTab(document.getElementById('setc'))">${tp}</button>`;
  });
  html += `</div><button class="btn bp" style="font-size:11px;padding:5px 12px" onclick="promptAddCategory()"><i data-lucide="plus" width="11" height="11"></i> Category</button></div>`;

  const cats = SCHEMA[catTypeFilter] || {};
  if (!Object.keys(cats).length) {
    html += `<div style="padding:30px;text-align:center;color:var(--text-tertiary);font-size:12px">No categories yet. Add one above.</div>`;
  } else {
    Object.entries(cats).forEach(([cat, subs]) => {
      html += `<div style="margin-bottom:14px;border:1px solid var(--border);border-radius:10px;overflow:hidden">`;
      html += `<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--bg-primary)"><span style="font-size:13px;font-weight:600">${cat}</span><div style="display:flex;gap:4px"><button class="abtn" style="width:22px;height:22px;font-size:9px" onclick="promptRenameCat('${catTypeFilter}','${cat}')" title="Rename">✏️</button><button class="abtn del" style="width:22px;height:22px;font-size:9px" onclick="promptDeleteCat('${catTypeFilter}','${cat}')" title="Delete">🗑</button></div></div>`;
      if (subs.length) {
        html += `<div style="padding:8px 14px;display:flex;flex-direction:column;gap:4px">`;
        subs.forEach(sub => {
          html += `<div style="display:flex;align-items:center;justify-content:space-between;padding:5px 10px;border-radius:6px;background:var(--bg-secondary);font-size:11px"><span style="color:var(--text-secondary)">${sub}</span><div style="display:flex;gap:3px"><button class="abtn" style="width:18px;height:18px;font-size:8px" onclick="promptRenameSub('${catTypeFilter}','${cat}','${sub}')">✏️</button><button class="abtn del" style="width:18px;height:18px;font-size:8px" onclick="promptDeleteSub('${catTypeFilter}','${cat}','${sub}')">🗑</button></div></div>`;
        });
        html += `</div>`;
      }
      html += `<div style="padding:6px 14px 10px;border-top:1px solid var(--border-light)"><button style="border:none;background:none;color:var(--accent);font-size:10px;cursor:pointer;font-family:var(--font);font-weight:500" onclick="promptAddSub('${catTypeFilter}','${cat}')">+ Add subcategory</button></div></div>`;
    });
  }
  c.innerHTML = html;
  lucide.createIcons();
}

function promptAddCategory() {
  const name = prompt(`New ${catTypeFilter} category name:`);
  if (!name) return;
  if (addCategory(catTypeFilter, name)) { toast('✅ Category added'); renderGeneralTab(document.getElementById('setc')); }
  else toast('❌ Already exists');
}
function promptRenameCat(type, oldName) {
  const newName = prompt(`Rename "${oldName}" to:`, oldName);
  if (!newName || newName === oldName) return;
  if (renameCategory(type, oldName, newName)) { toast('✅ Renamed'); renderGeneralTab(document.getElementById('setc')); }
  else toast('❌ Failed');
}
function promptDeleteCat(type, cat) {
  if (!confirm(`Delete category "${cat}" and all its subcategories?`)) return;
  if (deleteCategory(type, cat)) { toast('🗑 Deleted'); renderGeneralTab(document.getElementById('setc')); }
}
function promptAddSub(type, cat) {
  const name = prompt(`New subcategory for "${cat}":`);
  if (!name) return;
  if (addSubcategory(type, cat, name)) { toast('✅ Added'); renderGeneralTab(document.getElementById('setc')); }
  else toast('❌ Already exists');
}
function promptRenameSub(type, cat, oldName) {
  const newName = prompt(`Rename "${oldName}" to:`, oldName);
  if (!newName || newName === oldName) return;
  if (renameSubcategory(type, cat, oldName, newName)) { toast('✅ Renamed'); renderGeneralTab(document.getElementById('setc')); }
  else toast('❌ Failed');
}
function promptDeleteSub(type, cat, sub) {
  if (!confirm(`Delete subcategory "${sub}"?`)) return;
  if (deleteSubcategory(type, cat, sub)) { toast('🗑 Deleted'); renderGeneralTab(document.getElementById('setc')); }
}

// === YEAR MANAGEMENT (v11.5) ===
function renderYearsTab(c) {
  let html = `<div style="border:1px solid var(--border);border-radius:12px;padding:16px 18px;margin-bottom:16px"><div style="display:flex;align-items:center;gap:10px;margin-bottom:14px"><div style="width:32px;height:32px;border-radius:8px;background:var(--emerald-light);color:var(--emerald);display:flex;align-items:center;justify-content:center"><i data-lucide="calendar" width="15" height="15"></i></div><div><div style="font-size:13px;font-weight:600">Global Year Management</div><div style="font-size:10px;color:var(--text-tertiary)">Manage available years across all modules. Changes sync instantly.</div></div></div>`;
  html += `<div style="display:flex;gap:8px;margin-bottom:14px"><input class="fi" type="number" id="addYearInput" placeholder="e.g. 2041" style="max-width:120px;font-size:12px" min="1900" max="2100"><button class="btn bp" style="font-size:11px;padding:5px 12px" onclick="handleAddYear()"><i data-lucide="plus" width="11" height="11"></i> Add Year</button></div>`;
  html += `<div style="display:flex;flex-wrap:wrap;gap:6px">`;
  YEARS.forEach(y => {
    const hasData = yearHasData(y);
    const isCurrent = y === CURRENT_YEAR;
    html += `<div style="display:flex;align-items:center;gap:4px;padding:6px 10px;border:1px solid ${isCurrent ? 'var(--accent)' : 'var(--border)'};border-radius:7px;background:${isCurrent ? 'var(--accent-light)' : 'var(--bg-primary)'};font-size:12px;font-weight:${isCurrent ? '600' : '500'}"><span>${y}</span>${hasData ? '<span style="font-size:8px;color:var(--emerald);font-weight:600;margin-left:2px">DATA</span>' : ''}<button style="border:none;background:none;color:${hasData ? 'var(--border)' : 'var(--rose)'};cursor:${hasData ? 'not-allowed' : 'pointer'};font-size:12px;padding:0 2px;opacity:${hasData ? '0.3' : '1'}" onclick="${hasData ? '' : 'handleRemoveYear(' + y + ')'}" title="${hasData ? 'Cannot remove (has data)' : 'Remove year'}">✕</button></div>`;
  });
  html += `</div></div>`;
  html += `<div style="padding:10px 14px;background:var(--bg-primary);border-radius:8px;font-size:10px;color:var(--text-tertiary)"><b>Note:</b> Years with existing transaction data cannot be removed. Adding a year does not create or modify any financial data.</div>`;
  c.innerHTML = html;
  lucide.createIcons();
}

function handleAddYear() {
  const input = document.getElementById('addYearInput');
  const year = parseInt(input.value);
  if (!year) { toast('❌ Enter a valid year'); return; }
  if (addYear(year)) { toast('✅ Year ' + year + ' added'); input.value = ''; setSubTab = 'years'; renderGeneralTab(document.getElementById('setc')); }
  else { toast('❌ Year already exists or invalid'); }
}

function handleRemoveYear(year) {
  if (!confirm('Remove year ' + year + ' from all selectors?')) return;
  if (removeYear(year)) { toast('🗑 Year ' + year + ' removed'); setSubTab = 'years'; renderGeneralTab(document.getElementById('setc')); }
  else { toast('❌ Cannot remove (has data)'); }
}



// === ACCOUNTS (v10.4 Redesigned) ===
function renderAccountsTab(c) {
  const assets = ACCOUNTS.filter(a => a.type === 'asset');
  const liabilities = ACCOUNTS.filter(a => a.type === 'liability');
  let html = `<div style="border:1px solid var(--border);border-radius:12px;padding:14px 18px;margin-bottom:18px;background:var(--bg-primary)"><div style="display:flex;align-items:center;justify-content:space-between"><div style="display:flex;align-items:center;gap:10px"><div style="width:32px;height:32px;border-radius:8px;background:var(--accent-light);color:var(--accent);display:flex;align-items:center;justify-content:center"><i data-lucide="wallet" width="15" height="15"></i></div><div><div style="font-size:13px;font-weight:600">Opening Balance</div><div style="font-size:10px;color:var(--text-tertiary)">Starting balance before any transactions (carry-forward anchor)</div></div></div><div style="display:flex;align-items:center;gap:10px"><span style="font-size:17px;font-weight:800;font-feature-settings:'tnum';color:var(--accent)">${fmt(INITIAL_DEPOSIT)}</span><button class="btn bs" style="font-size:10px;padding:4px 10px" onclick="editOpeningBalance()">Edit</button></div></div></div>`;

  html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><div style="font-size:13px;font-weight:600">Accounts</div><button class="btn bp" style="font-size:11px;padding:5px 12px" onclick="openAccountModal()"><i data-lucide="plus" width="11" height="11"></i> Add</button></div>`;

  if (assets.length) {
    html += `<div style="font-size:10px;font-weight:700;color:var(--emerald);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">Assets</div>`;
    assets.forEach(a => {
      const bal = getAccountBalance(a.id);
      html += `<div style="border:1px solid var(--border);border-radius:10px;padding:12px 16px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center"><div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600;margin-bottom:2px">${a.name}</div><div style="font-size:10px;color:var(--text-tertiary)">${a.accountType} · ${a.currency || 'MYR'}${a.notes ? ' · ' + a.notes : ''}</div><div style="font-size:10px;color:var(--text-tertiary);margin-top:2px">Initial: ${fmt(a.initialBalance)}</div></div><div style="display:flex;align-items:center;gap:12px"><div style="text-align:right"><div style="font-size:15px;font-weight:800;font-feature-settings:'tnum';color:${bal >= 0 ? 'var(--emerald)' : 'var(--rose)'}">${fmt(bal)}</div><div style="font-size:9px;color:var(--text-tertiary)">Current</div></div><div style="display:flex;gap:3px"><button class="abtn" style="width:22px;height:22px;font-size:9px" onclick="openEditAccount('${a.id}')" title="Edit">✏️</button><button class="abtn" style="width:22px;height:22px;font-size:9px" onclick="adjustAccountBalance('${a.id}')" title="Adjust">⚖️</button><button class="abtn del" style="width:22px;height:22px;font-size:9px" onclick="deleteAccount('${a.id}')" title="Delete">🗑</button></div></div></div>`;
    });
  }

  if (liabilities.length) {
    html += `<div style="font-size:10px;font-weight:700;color:var(--rose);text-transform:uppercase;letter-spacing:.06em;margin:18px 0 8px">Liabilities</div>`;
    liabilities.forEach(a => {
      html += `<div style="border:1px solid var(--border);border-radius:10px;padding:12px 16px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center"><div><div style="font-size:13px;font-weight:600;margin-bottom:2px">${a.name}</div><div style="font-size:10px;color:var(--text-tertiary)">${a.accountType}</div></div><div style="display:flex;align-items:center;gap:12px"><div style="font-size:15px;font-weight:800;color:var(--rose);font-feature-settings:'tnum'">${fmt(-Math.abs(a.initialBalance))}</div><div style="display:flex;gap:3px"><button class="abtn" style="width:22px;height:22px;font-size:9px" onclick="openEditAccount('${a.id}')">✏️</button><button class="abtn del" style="width:22px;height:22px;font-size:9px" onclick="deleteAccount('${a.id}')">🗑</button></div></div></div>`;
    });
  }

  html += `<div style="margin-top:18px;padding:14px 16px;background:var(--accent-light);border-radius:10px;display:flex;justify-content:space-between;align-items:center"><span style="font-size:12px;font-weight:600">Net Worth</span><span style="font-size:17px;font-weight:800;font-feature-settings:'tnum'">${fmt(getNetWorth())}</span></div>`;
  c.innerHTML = html;
  lucide.createIcons();
}

function openAccountModal(editAcc) {
  const isEdit = !!editAcc;
  const typeOptions = [...ACCOUNT_TYPES.asset.map(tp => `<option value="asset|${tp}"${isEdit && editAcc.type === 'asset' && editAcc.accountType === tp ? ' selected' : ''}>[Asset] ${tp}</option>`), ...ACCOUNT_TYPES.liability.map(tp => `<option value="liability|${tp}"${isEdit && editAcc.type === 'liability' && editAcc.accountType === tp ? ' selected' : ''}>[Liability] ${tp}</option>`)].join('');
  const h = `<div class="mo show" id="maccadd" onclick="if(event.target===this){this.remove();document.body.style.overflow=''}"><div class="ml" onclick="event.stopPropagation()"><div class="mh"><div><div class="mti">${isEdit ? 'Edit' : 'Add'} Account</div><div class="mds">Account details</div></div><button class="mx" onclick="document.getElementById('maccadd').remove();document.body.style.overflow=''">✕</button></div><form onsubmit="saveAccount(event,'${isEdit ? editAcc.id : ''}')"><div class="fg"><label class="fl">Account Name *</label><input class="fi" id="acc_name" required value="${isEdit ? editAcc.name : ''}" placeholder="e.g. Maybank Savings"></div><div class="fg"><label class="fl">Account Type *</label><select class="fi" id="acc_type" required>${typeOptions}</select></div><div class="fr"><div class="fg"><label class="fl">Currency</label><select class="fi" id="acc_cur">${Object.keys(CURRENCY_CONFIG).map(cx => `<option value="${cx}"${(isEdit ? editAcc.currency : 'MYR') === cx ? ' selected' : ''}>${cx}</option>`).join('')}</select></div><div class="fg"><label class="fl">Initial Balance</label><input class="fi" type="number" step="0.01" id="acc_bal" value="${isEdit ? editAcc.initialBalance : '0'}" placeholder="0.00"></div></div><div class="fg"><label class="fl">Notes</label><input class="fi" id="acc_notes" value="${isEdit ? (editAcc.notes || '') : ''}" placeholder="Optional"></div><div class="ma"><button type="button" class="btn bs" onclick="document.getElementById('maccadd').remove();document.body.style.overflow=''">Cancel</button><button type="submit" class="btn bp">${isEdit ? 'Update' : 'Create'}</button></div></form></div></div>`;
  document.body.insertAdjacentHTML('beforeend', h);
  document.body.style.overflow = 'hidden';
}

function saveAccount(e, editId) {
  e.preventDefault();
  const name = document.getElementById('acc_name').value.trim();
  const [type, accountType] = document.getElementById('acc_type').value.split('|');
  const currency = document.getElementById('acc_cur').value;
  const newInitialBalance = parseFloat(document.getElementById('acc_bal').value) || 0;
  const notes = document.getElementById('acc_notes').value.trim();
  if (editId) {
    const acc = ACCOUNTS.find(a => a.id === editId);
    if (acc) {
      const oldInitialBalance = acc.initialBalance;
      acc.name = name; acc.type = type; acc.accountType = accountType; acc.currency = currency; acc.notes = notes;
      if (acc.type === 'asset' && newInitialBalance !== oldInitialBalance) {
        const diff = newInitialBalance - oldInitialBalance;
        const reasons = ['Salary correction', 'Cash deposit', 'Cash withdrawal', 'Bank adjustment', 'Balance correction', 'Transfer adjustment', 'Other'];
        const reason = prompt(`Initial balance changed by ${diff > 0 ? '+' : ''}${fmt(Math.abs(diff))}.\nReason:\n${reasons.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\nEnter number or custom reason:`);
        if (!reason) { toast('❌ Reason required for balance change'); return; }
        const finalReason = parseInt(reason) > 0 && parseInt(reason) <= reasons.length ? reasons[parseInt(reason) - 1] : reason;
        acc.initialBalance = newInitialBalance;
        createBalanceAdjustment(acc.id, oldInitialBalance, newInitialBalance, finalReason);
      } else if (acc.type === 'liability') {
        acc.initialBalance = newInitialBalance;
      }
    }
    TXN.forEach(tx => { if (tx.acc === editId && tx.dt && tx.dt.includes('Adj:')) tx.dt = `Adj: ${name}`; });
    toast('✅ Account updated');
  } else {
    const id = 'acc_' + (accNxId++);
    ACCOUNTS.push({ id, name, type, accountType, currency, initialBalance: newInitialBalance, notes, createdAt: new Date().toISOString().split('T')[0] });
    if (type === 'asset' && newInitialBalance > 0) {
      TXN.push({ id: nxId++, d: new Date().toISOString().split('T')[0], t: 'Income', c: 'Opening Balance', s: name, a: newInitialBalance, dt: `Opening: ${name}`, acc: id });
      saveTXN();
    }
    toast('✅ Account created');
  }
  saveACCOUNTS(); saveTXN();
  document.getElementById('maccadd').remove(); document.body.style.overflow = '';
  setSubTab = 'accounts'; renderGeneralTab(document.getElementById('setc'));
}

function openEditAccount(id) { const acc = ACCOUNTS.find(a => a.id === id); if (acc) openAccountModal(acc); }

function deleteAccount(id) {
  const acc = ACCOUNTS.find(a => a.id === id);
  if (!acc) return;
  if (!confirm(`Delete "${acc.name}"? Transactions linked to this account will retain their records.`)) return;
  ACCOUNTS = ACCOUNTS.filter(a => a.id !== id);
  saveACCOUNTS();
  toast('🗑 Account deleted');
  renderGeneralTab(document.getElementById('setc'));
}

function adjustAccountBalance(id) {
  const acc = ACCOUNTS.find(a => a.id === id);
  if (!acc || acc.type !== 'asset') return;
  const currentBal = getAccountBalance(id);
  const newBalStr = prompt(`Current balance: ${fmt(currentBal)}\nEnter new balance:`, currentBal);
  if (newBalStr === null) return;
  const newBal = parseFloat(newBalStr);
  if (isNaN(newBal) || newBal === currentBal) return;
  const reasons = ['Salary correction', 'Cash deposit', 'Cash withdrawal', 'Bank adjustment', 'Balance correction', 'Transfer adjustment', 'Other'];
  const reason = prompt(`Reason for adjustment:\n${reasons.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\nEnter number or custom reason:`);
  if (!reason) { toast('❌ Reason required'); return; }
  const finalReason = parseInt(reason) > 0 && parseInt(reason) <= reasons.length ? reasons[parseInt(reason) - 1] : reason;
  createBalanceAdjustment(id, currentBal, newBal, finalReason);
  toast('✅ Balance adjusted');
  renderGeneralTab(document.getElementById('setc'));
}

// === SECURITY TAB ===
function renderSecurityTab(c) {
  var encStatus = FT_ENCRYPTION_ENABLED ? 'Enabled' : 'Disabled';
  var encColor = FT_ENCRYPTION_ENABLED ? 'var(--emerald)' : 'var(--text-tertiary)';
  c.innerHTML = `<h3 style="font-size:15px;font-weight:600;margin-bottom:12px">${t('set_sec_title')}</h3><p style="font-size:12px;color:var(--text-secondary);margin-bottom:16px">${t('set_sec_desc')}</p><div class="fg"><label class="fl">${t('set_cur_pk')}</label><input class="fi" type="password" id="spkc" style="max-width:200px"></div><div class="fg"><label class="fl">${t('set_new_pk')}</label><input class="fi" type="password" id="spkn" style="max-width:200px"></div><button class="btn bp" onclick="chgPK()">${t('set_update')}</button><div style="margin-top:24px;padding-top:20px;border-top:1px solid var(--border)"><div style="display:flex;align-items:center;gap:10px;margin-bottom:12px"><div style="width:32px;height:32px;border-radius:8px;background:var(--accent-light);color:var(--accent);display:flex;align-items:center;justify-content:center"><i data-lucide="shield" width="15" height="15"></i></div><div><div style="font-size:13px;font-weight:600">Data Encryption (AES-256-GCM)</div><div style="font-size:10px;color:var(--text-tertiary)">Encrypt all financial data at rest using your passkey</div></div></div><div style="display:flex;align-items:center;gap:12px;margin-bottom:10px"><span style="font-size:12px;font-weight:600;color:${encColor}">Status: ${encStatus}</span><button class="btn ${FT_ENCRYPTION_ENABLED ? 'bd' : 'bp'}" style="font-size:11px;padding:6px 14px" onclick="${FT_ENCRYPTION_ENABLED ? 'handleDisableEncryption()' : 'handleEnableEncryption()'}">${FT_ENCRYPTION_ENABLED ? 'Disable Encryption' : 'Enable Encryption'}</button></div><div style="font-size:10px;color:var(--text-tertiary);line-height:1.6;max-width:400px">When enabled, all your transactions, accounts, goals, and investments are encrypted with AES-256-GCM. Data is unreadable without your passkey. <b>If you forget your passkey, data cannot be recovered.</b></div></div><div style="margin-top:20px"><div class="trow"><div class="tinf"><div class="tna">${t('set_2fa')}</div><div class="tde">${t('set_2fa_desc')}</div></div><div class="tsw" onclick="this.classList.toggle('on')"></div></div></div>`;
  lucide.createIcons();
}

async function handleEnableEncryption() {
  if (!confirm('Enable AES-256 encryption?\n\nYour passkey will be used as the encryption key.\nIMPORTANT: If you forget your passkey, your data CANNOT be recovered.\n\nCurrent passkey: ' + getPK().replace(/./g, '*') + ' (' + getPK().length + ' chars)\n\nProceed?')) return;
  await enableEncryption();
  renderGeneralTab(document.getElementById('setc'));
  setTab(document.querySelector('.sni:nth-child(2)'), 'security');
}

async function handleDisableEncryption() {
  if (!confirm('Disable encryption? Data will be stored in plain text again.')) return;
  await disableEncryption();
  renderGeneralTab(document.getElementById('setc'));
  setTab(document.querySelector('.sni:nth-child(2)'), 'security');
}

// === IMPORT / EXPORT TAB (v10.4 Functional) ===
function renderImportExportTab(c) {
  c.innerHTML = `<h3 style="font-size:15px;font-weight:600;margin-bottom:4px">Import / Export</h3><p style="font-size:11px;color:var(--text-tertiary);margin-bottom:20px">Export your data for backup or import previously exported files.</p>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
    <div style="border:1px solid var(--border);border-radius:10px;padding:16px">
      <div style="font-size:13px;font-weight:600;margin-bottom:4px">Export</div>
      <p style="font-size:11px;color:var(--text-tertiary);margin-bottom:14px">Download all transactions, accounts, categories, and goals.</p>
      <div style="display:flex;flex-direction:column;gap:8px">
        <button class="btn bp" onclick="exportJSON()" style="width:100%;justify-content:center"><i data-lucide="download" width="12" height="12"></i> Export JSON</button>
        <button class="btn bs" onclick="exportCSV()" style="width:100%;justify-content:center"><i data-lucide="file-text" width="12" height="12"></i> Export CSV</button>
        <button class="btn bs" onclick="exportExcel()" style="width:100%;justify-content:center"><i data-lucide="table" width="12" height="12"></i> Export Excel</button>
      </div>
    </div>
    <div style="border:1px solid var(--border);border-radius:10px;padding:16px">
      <div style="font-size:13px;font-weight:600;margin-bottom:4px">Import</div>
      <p style="font-size:11px;color:var(--text-tertiary);margin-bottom:14px">Restore from a previously exported JSON, CSV, or Excel file.</p>
      <div style="display:flex;flex-direction:column;gap:8px">
        <button class="btn bp" onclick="document.getElementById('impJSON').click()" style="width:100%;justify-content:center"><i data-lucide="upload" width="12" height="12"></i> Import JSON</button>
        <button class="btn bs" onclick="document.getElementById('impCSV').click()" style="width:100%;justify-content:center"><i data-lucide="file-text" width="12" height="12"></i> Import CSV</button>
        <button class="btn bs" onclick="document.getElementById('impExcel').click()" style="width:100%;justify-content:center"><i data-lucide="table" width="12" height="12"></i> Import Excel</button>
      </div>
      <input type="file" id="impJSON" accept=".json" style="display:none" onchange="importJSON(this)">
      <input type="file" id="impCSV" accept=".csv" style="display:none" onchange="importCSV(this)">
      <input type="file" id="impExcel" accept=".xlsx,.xls" style="display:none" onchange="importExcel(this)">
    </div>
  </div>
  <div style="margin-top:16px;padding:10px 14px;background:var(--bg-primary);border-radius:8px;font-size:10px;color:var(--text-tertiary)">
    <b>JSON</b> includes: transactions, accounts, categories, goals, and settings.<br>
    <b>CSV</b> includes: transactions only (date, type, category, subcategory, amount, description, account).<br>
    <b>Excel</b> includes: transactions with formatted columns (.xlsx).
  </div>`;
  lucide.createIcons();
}

function exportJSON() {
  const data = { version: 'fintrack-' + FINTRACK_VERSION, exportedAt: new Date().toISOString(), transactions: TXN, schema: SCHEMA, accounts: ACCOUNTS, goals: GOALS, settings: { currency: displayCurrency, language: currentLang, theme: document.documentElement.dataset.theme } };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `fintrack-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click(); URL.revokeObjectURL(url);
  toast('📥 JSON exported');
}

function exportCSV() {
  const headers = ['Date','Type','Category','Subcategory','Amount','Description','Account'];
  const rows = TXN.map(tx => {
    const accName = tx.acc ? (ACCOUNTS.find(a => a.id === tx.acc)?.name || '') : '';
    return [tx.d, tx.t, tx.c, tx.s || '', tx.a, tx.dt || '', accName].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
  });
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `fintrack-transactions-${new Date().toISOString().split('T')[0]}.csv`;
  a.click(); URL.revokeObjectURL(url);
  toast('📥 CSV exported');
}

function exportExcel() {
  // Generate Excel XML (compatible with Excel, no library needed)
  const headers = ['Date','Type','Category','Subcategory','Amount','Description','Account'];
  let xml = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">';
  xml += '<Worksheet ss:Name="Transactions"><Table>';
  xml += '<Row>' + headers.map(h => '<Cell><Data ss:Type="String">' + h + '</Data></Cell>').join('') + '</Row>';
  TXN.forEach(tx => {
    const accName = tx.acc ? (ACCOUNTS.find(a => a.id === tx.acc)?.name || '') : '';
    xml += '<Row>';
    xml += '<Cell><Data ss:Type="String">' + tx.d + '</Data></Cell>';
    xml += '<Cell><Data ss:Type="String">' + tx.t + '</Data></Cell>';
    xml += '<Cell><Data ss:Type="String">' + tx.c + '</Data></Cell>';
    xml += '<Cell><Data ss:Type="String">' + (tx.s || '') + '</Data></Cell>';
    xml += '<Cell><Data ss:Type="Number">' + tx.a + '</Data></Cell>';
    xml += '<Cell><Data ss:Type="String">' + (tx.dt || '') + '</Data></Cell>';
    xml += '<Cell><Data ss:Type="String">' + accName + '</Data></Cell>';
    xml += '</Row>';
  });
  xml += '</Table></Worksheet></Workbook>';
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `fintrack-transactions-${new Date().toISOString().split('T')[0]}.xls`;
  a.click(); URL.revokeObjectURL(url);
  toast('📥 Excel exported');
}

function importExcel(input) {
  const file = input.files[0]; if (!file) return;

  // Load SheetJS library dynamically if not already loaded
  function loadSheetJS(callback) {
    if (window.XLSX) { callback(); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js';
    script.onload = callback;
    script.onerror = () => {
      // Fallback CDN
      const s2 = document.createElement('script');
      s2.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      s2.onload = callback;
      s2.onerror = () => { toast('❌ Failed to load Excel parser. Check internet connection.'); input.value = ''; };
      document.head.appendChild(s2);
    };
    document.head.appendChild(script);
  }

  loadSheetJS(() => {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        // Use first sheet
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) { toast('❌ No sheets found in file'); input.value = ''; return; }
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' });

        if (rows.length < 2) { toast('❌ Excel file is empty or has no data rows'); input.value = ''; return; }

        // Detect header row (find row with Date/Type/Amount keywords)
        let headerIdx = 0;
        for (let i = 0; i < Math.min(rows.length, 5); i++) {
          const rowLower = (rows[i] || []).map(c => String(c || '').toLowerCase()).join(' ');
          if (rowLower.includes('date') && (rowLower.includes('type') || rowLower.includes('category') || rowLower.includes('amount'))) {
            headerIdx = i;
            break;
          }
        }

        const headers = (rows[headerIdx] || []).map(h => String(h || '').toLowerCase().trim());
        const dataRows = rows.slice(headerIdx + 1).filter(r => r && r.some(c => c !== null && c !== undefined && String(c).trim()));

        if (!dataRows.length) { toast('❌ No data rows found after header'); input.value = ''; return; }

        // Map column indices flexibly
        const findCol = (...keywords) => headers.findIndex(h => keywords.some(k => h.includes(k)));
        const colMap = {};
        colMap.date = findCol('date', 'tarikh', 'dt');
        colMap.type = findCol('type', 'jenis', 'category type');
        colMap.category = findCol('category', 'kategori', 'cat');
        colMap.subcategory = findCol('subcategory', 'sub', 'subcat', 'sub category');
        colMap.amount = findCol('amount', 'jumlah', 'amt', 'value', 'total');
        colMap.description = findCol('description', 'desc', 'details', 'note', 'keterangan', 'remark');
        colMap.account = findCol('account', 'akaun', 'acc', 'bank');

        // Fallback: positional if can't detect headers
        if (colMap.date < 0 && colMap.amount < 0) {
          if (headers.length >= 5) {
            colMap.date = 0; colMap.type = 1; colMap.category = 2; colMap.subcategory = 3; colMap.amount = 4;
            colMap.description = 5; colMap.account = 6;
          } else {
            toast('❌ Cannot detect columns. Expected: Date, Type, Category, Subcategory, Amount');
            input.value = ''; return;
          }
        }

        const detected = Object.entries(colMap).filter(([k,v]) => v >= 0).map(([k,v]) => k + '="' + (headers[v] || 'col' + v) + '"').join(', ');
        if (!confirm(`Found ${dataRows.length} rows in sheet "${sheetName}".\nColumns: ${detected}\n\nThis will ADD new transactions. Continue?`)) { input.value = ''; return; }

        let added = 0, skipped = 0;
        dataRows.forEach(row => {
          const getVal = (col) => col >= 0 && col < row.length ? String(row[col] || '').trim() : '';

          let d = getVal(colMap.date);
          const tp = getVal(colMap.type) || 'Expense';
          const cat = getVal(colMap.category);
          const sub = getVal(colMap.subcategory);
          let amtStr = getVal(colMap.amount);
          const desc = getVal(colMap.description);
          const accName = getVal(colMap.account);

          // Parse amount
          amtStr = amtStr.replace(/[^\d.\-\(\)]/g, '');
          if (amtStr.includes('(') && amtStr.includes(')')) amtStr = '-' + amtStr.replace(/[\(\)]/g, '');
          const parsedAmt = parseFloat(amtStr);
          if (!parsedAmt || parsedAmt === 0) { skipped++; return; }

          // Parse date
          if (d) {
            if (/^\d{4}-\d{2}-\d{2}/.test(d)) { d = d.substring(0, 10); }
            else if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(d)) {
              const parts = d.split(/[\/\-]/);
              d = `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
            }
            else if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2}$/.test(d)) {
              const parts = d.split(/[\/\-]/);
              d = `20${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
            }
            else if (/^\d{5}$/.test(d)) {
              const excelEpoch = new Date(1899, 11, 30);
              const parsed = new Date(excelEpoch.getTime() + parseInt(d) * 86400000);
              d = parsed.toISOString().split('T')[0];
            }
            else {
              const parsed = new Date(d);
              if (!isNaN(parsed.getTime())) d = parsed.toISOString().split('T')[0];
              else { skipped++; return; }
            }
          } else { skipped++; return; }

          if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) { skipped++; return; }

          // Normalize type
          let normalizedType = tp;
          const tpLower = tp.toLowerCase();
          if (tpLower.includes('income') || tpLower.includes('pendapatan') || tpLower.includes('gaji')) normalizedType = 'Income';
          else if (tpLower.includes('saving') || tpLower.includes('simpanan') || tpLower.includes('tabung')) normalizedType = 'Savings';
          else if (tpLower.includes('expense') || tpLower.includes('belanja') || tpLower.includes('perbelanjaan')) normalizedType = 'Expense';
          else if (!['Income', 'Expense', 'Savings'].includes(tp)) normalizedType = 'Expense';

          const accMatch = accName ? ACCOUNTS.find(a => a.name.toLowerCase() === accName.toLowerCase()) : null;
          TXN.push({ id: nxId++, d, t: normalizedType, c: cat || 'Uncategorized', s: sub, a: Math.abs(parsedAmt), dt: desc, acc: accMatch ? accMatch.id : undefined });
          added++;
        });

        saveTXN();
        toast(`✅ Imported ${added} transactions${skipped ? ' (' + skipped + ' skipped)' : ''}`);
      } catch (err) { toast('❌ Error reading Excel file: ' + (err.message || 'Unknown error')); console.error('Excel import error:', err); }
      input.value = '';
    };
    reader.readAsArrayBuffer(file);
  });
}

function importJSON(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.transactions || !Array.isArray(data.transactions)) { toast('❌ Invalid file: no transactions found'); return; }
      if (!data.version || !data.version.startsWith('fintrack')) { toast('❌ Invalid file: not a FinTrack export'); return; }
      const count = data.transactions.length;
      if (!confirm(`Import ${count} transactions${data.accounts ? ', ' + data.accounts.length + ' accounts' : ''}? This will MERGE with existing data (duplicates by ID are skipped).`)) return;
      const existingIds = new Set(TXN.map(tx => tx.id));
      let added = 0;
      data.transactions.forEach(tx => { if (!existingIds.has(tx.id)) { TXN.push(tx); added++; } });
      if (data.accounts && Array.isArray(data.accounts)) {
        const existingAccIds = new Set(ACCOUNTS.map(a => a.id));
        data.accounts.forEach(acc => { if (!existingAccIds.has(acc.id)) ACCOUNTS.push(acc); });
        saveACCOUNTS();
      }
      if (data.schema) {
        Object.entries(data.schema).forEach(([type, cats]) => {
          if (!SCHEMA[type]) SCHEMA[type] = {};
          Object.entries(cats).forEach(([cat, subs]) => {
            if (!SCHEMA[type][cat]) SCHEMA[type][cat] = [];
            subs.forEach(sub => { if (!SCHEMA[type][cat].includes(sub)) SCHEMA[type][cat].push(sub); });
          });
        });
        saveSCHEMA();
      }
      nxId = Math.max(nxId, ...TXN.map(tx => tx.id)) + 1;
      saveTXN();
      toast(`✅ Imported ${added} new transactions`);
    } catch (err) { toast('❌ Error: invalid or corrupted file'); console.error('Import error:', err); }
    input.value = '';
  };
  reader.readAsText(file);
}

function importCSV(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const lines = e.target.result.split('\n').filter(l => l.trim());
      if (lines.length < 2) { toast('❌ Empty CSV file'); return; }
      const header = lines[0].toLowerCase();
      if (!header.includes('date') || !header.includes('type') || !header.includes('amount')) { toast('❌ Invalid CSV: missing required columns (Date, Type, Amount)'); return; }
      if (!confirm(`Import ${lines.length - 1} rows from CSV? This will ADD new transactions.`)) return;
      let added = 0;
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].match(/(".*?"|[^,]*)/g)?.map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"').trim()) || [];
        if (cols.length < 5) continue;
        const [d, tp, cat, sub, amt, desc, accName] = cols;
        if (!d || !tp || !amt) continue;
        const accMatch = accName ? ACCOUNTS.find(a => a.name.toLowerCase() === accName.toLowerCase()) : null;
        TXN.push({ id: nxId++, d, t: tp, c: cat || '', s: sub || '', a: parseFloat(amt) || 0, dt: desc || '', acc: accMatch ? accMatch.id : undefined });
        added++;
      }
      saveTXN();
      toast(`✅ Imported ${added} transactions from CSV`);
    } catch (err) { toast('❌ Error reading CSV file'); console.error('CSV import error:', err); }
    input.value = '';
  };
  reader.readAsText(file);
}

// === BACKUP TAB ===
function renderBackupTab(c) {
  c.innerHTML = `<h3 style="font-size:15px;font-weight:600;margin-bottom:12px">${t('set_bak_title')}</h3><button class="btn bp" onclick="exportJSON()">Create Backup (JSON)</button> <button class="btn bs" onclick="document.getElementById('impJSON2').click()">Restore</button><input type="file" id="impJSON2" accept=".json" style="display:none" onchange="importJSON(this)"><div style="margin-top:16px"><div class="trow"><div class="tinf"><div class="tna">${t('set_auto_bak')}</div><div class="tde">${t('set_auto_bak_desc')}</div></div><div class="tsw on" onclick="this.classList.toggle('on')"></div></div></div><div style="margin-top:24px;padding-top:16px;border-top:1px solid var(--border)"><div style="font-size:13px;font-weight:600;margin-bottom:4px;color:var(--rose)">Danger Zone</div><p style="font-size:11px;color:var(--text-tertiary);margin-bottom:12px">Permanently delete all data. This cannot be undone. Consider creating a backup first.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn bd" onclick="resetAllData()">Reset All Data</button><button class="btn bs" style="color:var(--rose);border-color:var(--rose)" onclick="resetTransactionsOnly()">Clear Transactions Only</button></div></div>`;
}

// === ABOUT TAB ===
function renderAboutTab(c) {
  c.innerHTML = `<div style="text-align:center;padding:30px 0"><div style="width:56px;height:56px;background:linear-gradient(135deg, oklch(0.6 0.2 260), oklch(0.45 0.22 280));border-radius:14px;display:flex;align-items:center;justify-content:center;margin:0 auto 14px"><i data-lucide="wallet" width="26" height="26" style="color:#fff"></i></div><div style="font-size:18px;font-weight:700;margin-bottom:4px">FinTrack Premium</div><div style="font-size:13px;color:var(--text-secondary);margin-bottom:2px">Version <b>${FINTRACK_VERSION}</b></div><div style="font-size:11px;color:var(--text-tertiary);margin-bottom:20px">Personal Finance Tracker</div><div style="border:1px solid var(--border);border-radius:10px;padding:14px 16px;text-align:left;max-width:360px;margin:0 auto"><div style="font-size:11px;color:var(--text-tertiary);margin-bottom:8px">Build Info</div><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px"><span style="color:var(--text-secondary)">Version</span><span style="font-weight:600">${FINTRACK_VERSION}</span></div><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px"><span style="color:var(--text-secondary)">Architecture</span><span style="font-weight:600">Modular (14 files)</span></div><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px"><span style="color:var(--text-secondary)">Storage</span><span style="font-weight:600">localStorage</span></div><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px"><span style="color:var(--text-secondary)">Transactions</span><span style="font-weight:600">${TXN.length} records</span></div><div style="display:flex;justify-content:space-between;font-size:12px"><span style="color:var(--text-secondary)">Goals</span><span style="font-weight:600">${GOALS.length} active</span></div></div><div style="font-size:10px;color:var(--text-tertiary);margin-top:16px">Built by Irsyad · Zero framework · 30-year lifespan</div></div>`;
  lucide.createIcons();
}

// === SHARED SETTINGS HANDLERS ===
function saveProfileSettings() {
  const name = document.getElementById('set_username').value.trim();
  const title = document.getElementById('set_usertitle').value;
  if (name) setUserName(name);
  else localStorage.removeItem('ft_username');
  setUserTitle(title);
  updateUserDisplay();
  toast('✅ Profile updated');
  renderGeneralTab(document.getElementById('setc'));
}

function resetAllData() {
  if (!confirm('⚠️ This will DELETE all data:\n\n• Transactions\n• Accounts\n• Categories\n• Goals\n• Reminders\n• Budget plans\n• Settings\n\nThis CANNOT be undone. Are you sure?')) return;
  if (!confirm('FINAL WARNING: All your financial data will be permanently erased. Type "yes" mentally and click OK.')) return;
  localStorage.clear();
  toast('🗑 All data cleared. Reloading...');
  setTimeout(() => location.reload(), 800);
}

function resetTransactionsOnly() {
  if (!confirm('Delete all transactions? Accounts, goals, and settings will be kept.\n\nThis cannot be undone.')) return;
  localStorage.removeItem('ft_txn_data');
  localStorage.removeItem('ft_nxId');
  TXN = []; nxId = 100;
  toast('🗑 Transactions cleared');
  render();
}

async function handleCurrencyChange(currency) {
  const statusEl = document.getElementById('rateStatus');
  if (statusEl) statusEl.textContent = t('set_fetching');
  const success = await fetchExchangeRates();
  if (!success && statusEl) statusEl.textContent = t('set_rate_failed');
  else if (statusEl) statusEl.textContent = `${t('set_rate_info')}: ${new Date().toLocaleString()}`;
  setCurrency(currency);
}

function chgPK() {
  const cur = document.getElementById('spkc')?.value, nw = document.getElementById('spkn')?.value;
  if (cur !== getPK()) { toast(t('set_pk_wrong')); return; }
  if (!nw || nw.length < 4) { toast(t('set_pk_min')); return; }
  localStorage.setItem('ft_pk', nw);
  toast(t('set_pk_ok'));
}

// === NOTIFICATIONS TAB (v10.9.1 — Full Notification Manager) ===
function renderNotificationsTab(c) {
  let html = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><div style="display:flex;align-items:center;gap:10px"><div style="width:32px;height:32px;border-radius:8px;background:var(--accent-light);color:var(--accent);display:flex;align-items:center;justify-content:center"><i data-lucide="bell" width="15" height="15"></i></div><div><div style="font-size:13px;font-weight:600">Notification Manager</div><div style="font-size:10px;color:var(--text-tertiary)">Manage reminders and alerts</div></div></div><button class="btn bp" style="font-size:11px;padding:5px 12px" onclick="openReminderModal()"><i data-lucide="plus" width="11" height="11"></i> New Reminder</button></div>`;
  if (!REMINDERS.length) {
    html += `<div style="padding:40px;text-align:center;border:1px solid var(--border);border-radius:12px"><div style="font-size:28px;margin-bottom:8px">🔔</div><div style="font-size:12px;color:var(--text-tertiary)">No reminders yet. Create one above.</div></div>`;
  } else {
    html += `<div style="display:flex;flex-direction:column;gap:8px">`;
    REMINDERS.forEach(r => {
      const rDate = new Date(r.date);
      const today = new Date(); today.setHours(0,0,0,0); rDate.setHours(0,0,0,0);
      const diff = Math.ceil((rDate - today) / (1000*60*60*24));
      const statusIcon = r.completed ? '✅' : diff < 0 ? '🔴' : diff <= 3 ? '🟡' : '🟢';
      const freq = r.repeat === 'monthly' ? 'Monthly' : r.repeat === 'yearly' ? 'Yearly' : 'One-time';
      const priorityColor = r.priority === 'high' ? 'var(--rose)' : r.priority === 'medium' ? 'var(--amber)' : 'var(--text-tertiary)';
      const priorityLabel = r.priority ? r.priority.charAt(0).toUpperCase() + r.priority.slice(1) : 'Low';
      const timingStr = r.timing ? r.timing.map(t => t + 'd before').join(', ') : '';
      html += `<div style="border:1px solid var(--border);border-radius:10px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;transition:all 150ms${r.completed ? ';opacity:0.5' : ''}"><div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:6px;margin-bottom:3px"><span style="font-size:13px;font-weight:600">${statusIcon} ${r.title}</span><span style="font-size:8px;font-weight:600;color:${priorityColor};padding:1px 5px;border-radius:3px;border:1px solid ${priorityColor};text-transform:uppercase">${priorityLabel}</span></div><div style="font-size:10px;color:var(--text-tertiary);display:flex;gap:8px;flex-wrap:wrap;margin-top:2px"><span>📅 ${r.date}${r.time ? ' · 🕐 ' + r.time : ''}</span><span>🔁 ${freq}</span>${timingStr ? `<span>⏰ ${timingStr}</span>` : ''}</div>${r.description ? `<div style="font-size:10px;color:var(--text-secondary);margin-top:3px">${r.description}</div>` : ''}</div><div style="display:flex;align-items:center;gap:8px;flex-shrink:0"><span style="font-size:10px;font-weight:600;color:${diff < 0 ? 'var(--rose)' : diff <= 3 ? 'var(--amber)' : 'var(--text-tertiary)'}">${r.completed ? 'Done' : diff < 0 ? Math.abs(diff) + 'd overdue' : diff === 0 ? 'Today' : diff + 'd left'}</span><button class="abtn" style="width:22px;height:22px;font-size:9px" onclick="editReminder(${r.id})">✏️</button><button class="abtn del" style="width:22px;height:22px;font-size:9px" onclick="deleteReminder(${r.id})">🗑</button></div></div>`;
    });
    html += `</div>`;
  }
  c.innerHTML = html;
  lucide.createIcons();
}

function editOpeningBalance() {
  const newVal = prompt('Opening Balance (your total balance before FinTrack tracking began):\n\nThis is the carry-forward anchor. All balance calculations start from this value.', INITIAL_DEPOSIT);
  if (newVal === null) return;
  const parsed = parseFloat(newVal);
  if (isNaN(parsed)) { toast('❌ Invalid number'); return; }
  INITIAL_DEPOSIT = parsed;
  saveInitialDeposit();
  toast('✅ Opening Balance updated to ' + fmt(parsed));
  setSubTab = 'accounts'; renderGeneralTab(document.getElementById('setc'));
}

function openReminderModal(editR) {
  const isEdit = !!editR;
  const h = `<div class="mo show" id="mremind" onclick="if(event.target===this){this.remove();document.body.style.overflow=''}"><div class="ml" onclick="event.stopPropagation()"><div class="mh"><div><div class="mti">${isEdit ? 'Edit' : 'New'} Reminder</div><div class="mds">Set notification details, priority, and timing</div></div><button class="mx" onclick="document.getElementById('mremind').remove();document.body.style.overflow=''">✕</button></div><form onsubmit="saveReminder(event,${isEdit ? editR.id : 'null'})"><div class="fg"><label class="fl">Title *</label><input class="fi" id="rem_title" required value="${isEdit ? editR.title : ''}" placeholder="e.g. Car insurance renewal"></div><div class="fg"><label class="fl">Description</label><input class="fi" id="rem_desc" value="${isEdit ? (editR.description || '') : ''}" placeholder="Optional notes"></div><div class="fr"><div class="fg"><label class="fl">Date *</label><input class="fi" type="date" id="rem_date" required value="${isEdit ? editR.date : new Date().toISOString().split('T')[0]}"></div><div class="fg"><label class="fl">Time (Optional)</label><input class="fi" type="time" id="rem_time" value="${isEdit && editR.time ? editR.time : ''}"></div></div><div class="fr"><div class="fg"><label class="fl">Repeat</label><select class="fi" id="rem_repeat"><option value="once"${isEdit && editR.repeat === 'once' ? ' selected' : ''}>One-time</option><option value="monthly"${isEdit && editR.repeat === 'monthly' ? ' selected' : ''}>Every Month</option><option value="yearly"${isEdit && editR.repeat === 'yearly' ? ' selected' : ''}>Every Year</option></select></div><div class="fg"><label class="fl">Priority</label><select class="fi" id="rem_priority"><option value="low"${isEdit && editR.priority === 'low' ? ' selected' : ''}>Low</option><option value="medium"${isEdit && editR.priority === 'medium' ? ' selected' : ''}>Medium</option><option value="high"${isEdit && editR.priority === 'high' ? ' selected' : ''}>High</option></select></div></div><div class="fg"><label class="fl">Notify me</label><div style="display:flex;gap:10px;margin-top:6px"><label style="font-size:11px;display:flex;align-items:center;gap:4px;cursor:pointer"><input type="checkbox" id="rem_t7" ${isEdit && editR.timing && editR.timing.includes(7) ? 'checked' : (!isEdit ? 'checked' : '')}> 7 days before</label><label style="font-size:11px;display:flex;align-items:center;gap:4px;cursor:pointer"><input type="checkbox" id="rem_t3" ${isEdit && editR.timing && editR.timing.includes(3) ? 'checked' : (!isEdit ? 'checked' : '')}> 3 days before</label><label style="font-size:11px;display:flex;align-items:center;gap:4px;cursor:pointer"><input type="checkbox" id="rem_t1" ${isEdit && editR.timing && editR.timing.includes(1) ? 'checked' : (!isEdit ? 'checked' : '')}> 1 day before</label></div></div><div class="ma"><button type="button" class="btn bs" onclick="document.getElementById('mremind').remove();document.body.style.overflow=''">Cancel</button><button type="submit" class="btn bp">${isEdit ? 'Update' : 'Create'}</button></div></form></div></div>`;
  document.body.insertAdjacentHTML('beforeend', h);
  document.body.style.overflow = 'hidden';
}

function saveReminder(e, editId) {
  e.preventDefault();
  const timing = [];
  if (document.getElementById('rem_t7').checked) timing.push(7);
  if (document.getElementById('rem_t3').checked) timing.push(3);
  if (document.getElementById('rem_t1').checked) timing.push(1);
  if (!timing.length) { toast('❌ Select at least one timing'); return; }
  const data = { title: document.getElementById('rem_title').value.trim(), description: document.getElementById('rem_desc').value.trim(), date: document.getElementById('rem_date').value, time: document.getElementById('rem_time').value || '', repeat: document.getElementById('rem_repeat').value, priority: document.getElementById('rem_priority').value, timing, completed: false, dismissed: false };
  if (editId) {
    const idx = REMINDERS.findIndex(r => r.id === editId);
    if (idx >= 0) REMINDERS[idx] = { ...REMINDERS[idx], ...data };
    toast('✅ Reminder updated');
  } else {
    data.id = reminderNxId++;
    REMINDERS.push(data);
    toast('✅ Reminder created');
  }
  saveREMINDERS();
  document.getElementById('mremind').remove(); document.body.style.overflow = '';
  setSubTab = 'notifications'; renderGeneralTab(document.getElementById('setc'));
  updateNotifBadge();
}

function editReminder(id) { const r = REMINDERS.find(x => x.id === id); if (r) openReminderModal(r); }

function deleteReminder(id) {
  if (!confirm('Delete this reminder?')) return;
  REMINDERS = REMINDERS.filter(r => r.id !== id);
  saveREMINDERS();
  toast('🗑 Reminder deleted');
  setSubTab = 'notifications'; renderGeneralTab(document.getElementById('setc'));
  updateNotifBadge();
}

// === NOTIFICATION BELL (v10.9.1) — functions in helpers.js ===
// updateNotifBadge, toggleNotifPanel, completeReminder, dismissReminder
// are all defined in helpers.js (loaded before settings.js)