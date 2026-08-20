// === SETTINGS (FinTrack Premium V2.0.0) ===
let setSubTab = 'profile';

const FINTRACK_VERSION = 'V2.0.1';

function renderSettings(c) {
  if (window.innerWidth <= 768 && safeGet('ft_desktop_mode') !== 'true') { renderMobileSettings(c); return; }
  c.innerHTML = `<div class="setg"><div class="setn"><div class="nsec">Profile</div><div class="sni active" onclick="setTab(this,'profile')"><i data-lucide="user" width="14" height="14"></i>Profile & Appearance</div><div class="nsec">General</div><div class="sni" onclick="setTab(this,'general')"><i data-lucide="sliders" width="14" height="14"></i>General</div><div class="nsec">Categories & Accounts</div><div class="sni" onclick="setTab(this,'cataccounts')"><i data-lucide="layers" width="14" height="14"></i>Categories & Accounts</div><div class="nsec">System</div><div class="sni" onclick="setTab(this,'system')"><i data-lucide="cpu" width="14" height="14"></i>System</div><div class="nsec">Security</div><div class="sni" onclick="setTab(this,'security')"><i data-lucide="shield" width="14" height="14"></i>Security</div></div><div class="setc" id="setc"></div></div>`;
  lucide.createIcons();
  setTab(null, 'profile');
}

// === MOBILE SETTINGS ===
function renderMobileSettings(c) {
  const name = getUserName() || 'User';
  const initials = getUserInitials();
  c.innerHTML = `<div style="text-align:center;margin-bottom:20px"><div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,var(--accent),oklch(0.45 0.22 280));margin:0 auto 8px;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#fff">${initials}</div><div style="font-size:15px;font-weight:700">${getUserTitle() ? getUserTitle().charAt(0).toUpperCase() + getUserTitle().slice(1) + ' ' : ''}${name}</div></div><div style="font-size:9px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.08em;padding:0 4px 6px">Profile</div><div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-bottom:14px"><div class="mob-set-item" onclick="mobSetOpen('profile')"><span class="mob-set-icon"><i data-lucide="user" width="18" height="18"></i></span><span class="mob-set-label">Profile & Appearance</span><span class="mob-set-val">&#8250;</span></div></div><div style="font-size:9px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.08em;padding:0 4px 6px">General</div><div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-bottom:14px"><div class="mob-set-item" onclick="mobSetOpen('general')"><span class="mob-set-icon"><i data-lucide="sliders" width="18" height="18"></i></span><span class="mob-set-label">General</span><span class="mob-set-val">&#8250;</span></div></div><div style="font-size:9px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.08em;padding:0 4px 6px">Categories & Accounts</div><div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-bottom:14px"><div class="mob-set-item" onclick="mobSetOpen('cataccounts')"><span class="mob-set-icon"><i data-lucide="layers" width="18" height="18"></i></span><span class="mob-set-label">Categories & Accounts</span><span class="mob-set-val">&#8250;</span></div></div><div style="font-size:9px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.08em;padding:0 4px 6px">System</div><div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-bottom:14px"><div class="mob-set-item" onclick="mobSetOpen('system')"><span class="mob-set-icon"><i data-lucide="cpu" width="18" height="18"></i></span><span class="mob-set-label">System</span><span class="mob-set-val">&#8250;</span></div></div><div style="font-size:9px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.08em;padding:0 4px 6px">Security</div><div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-bottom:14px"><div class="mob-set-item" onclick="mobSetOpen('security')"><span class="mob-set-icon"><i data-lucide="shield" width="18" height="18"></i></span><span class="mob-set-label">Security</span><span class="mob-set-val">${FT_APP_LOCK ? 'On' : 'Off'} &#8250;</span></div></div>`;
  lucide.createIcons();
}

function mobSetOpen(tab) {
  const c = document.getElementById('cnt');
  const tabNames = { profile: 'Profile & Appearance', general: 'General', cataccounts: 'Categories & Accounts', system: 'System', security: 'Security' };
  let html = `<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px"><button class="btn bs" style="padding:6px 10px;font-size:11px" onclick="renderSettings(document.getElementById('cnt'))"><i data-lucide="arrow-left" width="12" height="12"></i> Back</button><span style="font-size:14px;font-weight:700">${tabNames[tab] || tab}</span></div><div id="setc"></div>`;
  c.innerHTML = html;
  lucide.createIcons();
  const setc = document.getElementById('setc');
  if (tab === 'profile') { renderProfileTab(setc); }
  else if (tab === 'general') { renderGeneralTab(setc); }
  else if (tab === 'cataccounts') { renderCatAccountsTab(setc); }
  else if (tab === 'system') { renderSystemTab(setc); }
  else if (tab === 'security') { renderSecurityTab(setc); }
}

function setTab(el, tab) {
  if (el) { document.querySelectorAll('.sni').forEach(i => i.classList.remove('active')); el.classList.add('active'); }
  const c = document.getElementById('setc');
  if (tab === 'profile') { renderProfileTab(c); }
  else if (tab === 'general') { renderGeneralTab(c); }
  else if (tab === 'cataccounts') { renderCatAccountsTab(c); }
  else if (tab === 'system') { renderSystemTab(c); }
  else if (tab === 'security') { renderSecurityTab(c); }
}

// === PROFILE TAB ===
function renderProfileTab(c) {
  const desktopMode = safeGet('ft_desktop_mode') === 'true';
  c.innerHTML = `<div style="border:1px solid var(--border);border-radius:12px;padding:16px 18px;margin-bottom:16px"><div style="display:flex;align-items:center;gap:10px;margin-bottom:14px"><div style="width:32px;height:32px;border-radius:8px;background:var(--emerald-light);color:var(--emerald);display:flex;align-items:center;justify-content:center"><i data-lucide="user" width="15" height="15"></i></div><div><div style="font-size:13px;font-weight:600">Profile</div><div style="font-size:10px;color:var(--text-tertiary)">Your display name and greeting</div></div></div><div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap;align-items:end"><div style="flex:1;min-width:140px"><label style="font-size:10px;font-weight:500;color:var(--text-secondary);display:block;margin-bottom:3px">Name</label><input class="fi" id="set_username" value="${getUserName()}" placeholder="Your name" style="font-size:13px" onchange="saveProfileSettings()"></div><div style="min-width:100px"><label style="font-size:10px;font-weight:500;color:var(--text-secondary);display:block;margin-bottom:3px">Title</label><select class="fi" id="set_usertitle" style="font-size:13px" onchange="saveProfileSettings()"><option value=""${!getUserTitle() ? ' selected' : ''}>None</option><option value="sir"${getUserTitle()==='sir' ? ' selected' : ''}>Sir</option><option value="master"${getUserTitle()==='master' ? ' selected' : ''}>Master</option><option value="boss"${getUserTitle()==='boss' ? ' selected' : ''}>Boss</option><option value="bro"${getUserTitle()==='bro' ? ' selected' : ''}>Bro</option><option value="chief"${getUserTitle()==='chief' ? ' selected' : ''}>Chief</option></select></div></div></div><div style="border:1px solid var(--border);border-radius:12px;padding:16px 18px"><div style="display:flex;align-items:center;gap:10px;margin-bottom:14px"><div style="width:32px;height:32px;border-radius:8px;background:var(--accent-light);color:var(--accent);display:flex;align-items:center;justify-content:center"><i data-lucide="palette" width="15" height="15"></i></div><div><div style="font-size:13px;font-weight:600">Appearance</div><div style="font-size:10px;color:var(--text-tertiary)">Theme and display mode</div></div></div><div class="trow"><div class="tinf"><div class="tna">Dark Mode</div><div class="tde">Switch between light and dark theme</div></div><div class="tsw ${document.documentElement.dataset.theme === 'dark' ? 'on' : ''}" onclick="this.classList.toggle('on');const th=this.classList.contains('on')?'dark':'light';document.documentElement.dataset.theme=th;safeSave('theme',th)"></div></div>${window.innerWidth <= 768 ? `<div class="trow"><div class="tinf"><div class="tna">Desktop Mode</div><div class="tde">Force desktop layout on mobile</div></div><div class="tsw ${desktopMode ? 'on' : ''}" onclick="this.classList.toggle('on');safeSave('ft_desktop_mode',this.classList.contains('on')?'true':'false');toast(this.classList.contains('on')?'🖥 Desktop mode on. Reload to apply.':'📱 Mobile mode restored. Reload to apply.')"></div></div>` : ''}</div>`;
  lucide.createIcons();
}

function saveProfileSettings() {
  const name = document.getElementById('set_username').value.trim();
  const title = document.getElementById('set_usertitle').value;
  if (name) setUserName(name);
  setUserTitle(title);
  updateUserDisplay();
  toast('✅ Profile saved');
  renderProfileTab(document.getElementById('setc'));
}

// === CLOUD SYNC UI (V2.0) ===
function renderCloudSyncUI() {
  var isLoggedIn = typeof ftAuth !== 'undefined' && ftAuth.isLoggedIn();
  var lastSync = safeGet('lastCloudSync');
  var lastLabel = lastSync ? new Date(lastSync).toLocaleString() : 'Never';
  if (isLoggedIn) {
    return '<div style="border:1px solid var(--border);border-radius:12px;padding:16px 18px;margin-bottom:16px"><div style="display:flex;align-items:center;gap:10px;margin-bottom:14px"><div style="width:32px;height:32px;border-radius:8px;background:var(--emerald-light);color:var(--emerald);display:flex;align-items:center;justify-content:center"><i data-lucide="cloud" width="15" height="15"></i></div><div><div style="font-size:13px;font-weight:600">Cloud Connected</div><div style="font-size:10px;color:var(--text-tertiary)">' + ftAuth.user.email + '</div></div></div><div style="padding:10px 14px;background:var(--bg-primary);border-radius:8px;margin-bottom:14px"><div style="font-size:11px;font-weight:500">Last Sync</div><div style="font-size:10px;color:var(--text-tertiary)">' + lastLabel + '</div></div><div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px"><button class="btn bp" style="font-size:11px;padding:8px 14px" onclick="cloudSyncNow(\'push\')"><i data-lucide="upload" width="12" height="12"></i> Push to Cloud</button><button class="btn bs" style="font-size:11px;padding:8px 14px" onclick="cloudSyncNow(\'pull\')"><i data-lucide="download" width="12" height="12"></i> Pull from Cloud</button></div><div style="font-size:10px;color:var(--text-tertiary);margin-bottom:14px;line-height:1.6"><b>Push</b>: upload local → cloud. <b>Pull</b>: download cloud → local.</div><div style="border-top:1px solid var(--border);padding-top:14px"><button class="btn bs" style="font-size:11px;padding:6px 14px;color:var(--rose);border-color:var(--rose)" onclick="cloudSignOut()"><i data-lucide="log-out" width="12" height="12"></i> Sign Out</button></div></div>';
  }
  return '<div style="border:1px solid var(--border);border-radius:12px;padding:16px 18px"><div style="display:flex;align-items:center;gap:10px;margin-bottom:14px"><div style="width:32px;height:32px;border-radius:8px;background:var(--accent-light);color:var(--accent);display:flex;align-items:center;justify-content:center"><i data-lucide="cloud-off" width="15" height="15"></i></div><div><div style="font-size:13px;font-weight:600">Cloud Sync</div><div style="font-size:10px;color:var(--text-tertiary)">Sign in to sync across devices</div></div></div><div class="fg"><label class="fl">Email</label><input class="fi" type="email" id="cloud_email" placeholder="your@email.com"></div><div class="fg"><label class="fl">Password</label><input class="fi" type="password" id="cloud_pass" placeholder="Min 6 characters"></div><div id="cloudAuthErr" style="display:none;font-size:11px;color:var(--rose);margin-bottom:10px;padding:8px 12px;background:var(--rose-light);border-radius:7px"></div><div style="display:flex;gap:8px;margin-top:14px"><button class="btn bp" style="flex:1;justify-content:center" onclick="cloudSignIn()">Sign In</button><button class="btn bs" style="flex:1;justify-content:center" onclick="cloudSignUp()">Create Account</button></div><div style="margin-top:14px;font-size:10px;color:var(--text-tertiary);line-height:1.6">Cloud is optional. Local data works without it.</div></div>';
}
async function cloudSignIn() { var e=document.getElementById('cloud_email').value.trim(),p=document.getElementById('cloud_pass').value,err=document.getElementById('cloudAuthErr'); if(!e||!p){err.textContent='Enter email and password';err.style.display='block';return;} try{err.style.display='none';await ftAuth.signIn(e,p);toast('✅ Signed in!');renderSysSub('cloud');}catch(x){err.textContent=x.message||'Sign in failed';err.style.display='block';} }
async function cloudSignUp() { var e=document.getElementById('cloud_email').value.trim(),p=document.getElementById('cloud_pass').value,err=document.getElementById('cloudAuthErr'); if(!e||!p){err.textContent='Enter email and password';err.style.display='block';return;} if(p.length<6){err.textContent='Password must be 6+ characters';err.style.display='block';return;} try{err.style.display='none';await ftAuth.signUp(e,p);toast('✅ Account created! Check email to confirm.');}catch(x){err.textContent=x.message||'Sign up failed';err.style.display='block';} }
async function cloudSyncNow(dir) { if(typeof ftSync==='undefined'){toast('❌ Cloud module not loaded');return;} toast('☁️ Syncing...'); try{if(dir==='push')await ftSync.fullPush();else await ftSync.fullPull();toast('✅ Sync complete!');renderSysSub('cloud');}catch(x){toast('❌ '+x.message);} }
async function cloudSignOut() { if(!confirm('Sign out? Local data stays intact.'))return; try{await ftAuth.signOut();toast('👋 Signed out');renderSysSub('cloud');}catch(x){toast('❌ Sign out failed');} }

// === CHECK FOR UPDATES (clears cache only, keeps data) ===
async function checkForUpdates() {
  toast('Checking for updates...');
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) { await reg.unregister(); }
    }
    const cacheNames = await caches.keys();
    for (const name of cacheNames) { await caches.delete(name); }
    toast('✅ Cache cleared. Reloading...');
    setTimeout(() => location.reload(true), 800);
  } catch (e) {
    toast('❌ Update failed. Try again.');
    console.error('Update error:', e);
  }
}

// === GENERAL TAB (clickable sub-items) ===
function renderGeneralTab(c) {
  try {
  c.innerHTML = `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;overflow:hidden"><div class="mob-set-item" onclick="renderGenSub('ai')"><span class="mob-set-icon">🤖</span><span class="mob-set-label">AI Assistant</span><span class="mob-set-val">&#8250;</span></div><div class="mob-set-item" onclick="renderGenSub('notif')"><span class="mob-set-icon">🔔</span><span class="mob-set-label">Notifications</span><span class="mob-set-val">&#8250;</span></div><div class="mob-set-item" onclick="renderGenSub('currency')"><span class="mob-set-icon">💱</span><span class="mob-set-label">Currency</span><span class="mob-set-val">${displayCurrency} &#8250;</span></div><div class="mob-set-item" onclick="renderGenSub('language')"><span class="mob-set-icon">🌐</span><span class="mob-set-label">Language</span><span class="mob-set-val">${currentLang.toUpperCase()} &#8250;</span></div></div>`;
  } catch(e) { c.innerHTML = '<div style="padding:20px;color:var(--rose);font-size:12px">Error: ' + e.message + '</div>'; }
}

function renderGenSub(sub) {
  const c = document.getElementById('setc');
  let html = `<div style="margin-bottom:12px"><button class="btn bs" style="font-size:11px;padding:5px 10px" onclick="renderGeneralTab(document.getElementById('setc'))"><i data-lucide="arrow-left" width="11" height="11"></i> Back</button></div>`;
  if (sub === 'ai') {
    html += `<div style="border:1px solid var(--border);border-radius:12px;padding:16px 18px"><div style="font-size:13px;font-weight:600;margin-bottom:12px">AI Assistant</div><div style="margin-bottom:10px"><label style="font-size:10px;font-weight:500;color:var(--text-secondary);display:block;margin-bottom:3px">Gemini API Key</label><div style="display:flex;gap:8px"><input class="fi" type="password" id="set_gemini_key" value="${typeof getAIKey === 'function' ? getAIKey() : ''}" placeholder="Paste API key" style="font-size:12px;flex:1"><button class="btn bp" style="font-size:11px;padding:6px 14px" onclick="saveGeminiKey()">Save</button></div></div><div style="margin-bottom:10px"><label style="font-size:10px;font-weight:500;color:var(--text-secondary);display:block;margin-bottom:3px">Groq API Key (Fallback)</label><div style="display:flex;gap:8px"><input class="fi" type="password" id="set_groq_key" value="${typeof getGroqKey === 'function' ? getGroqKey() : ''}" placeholder="Optional" style="font-size:12px;flex:1"><button class="btn bp" style="font-size:11px;padding:6px 14px" onclick="saveGroqKey()">Save</button></div></div><div style="font-size:10px;color:var(--text-tertiary)">Gemini: aistudio.google.com · Groq: console.groq.com/keys</div><div id="geminiKeyStatus" style="margin-top:8px"></div></div>`;
  } else if (sub === 'notif') {
    html += `<div style="border:1px solid var(--border);border-radius:12px;padding:16px 18px"><div style="font-size:13px;font-weight:600;margin-bottom:12px">Notifications</div><div class="trow"><div class="tinf"><div class="tna">Budget Alerts</div><div class="tde">Notify when exceeding budget</div></div><div class="tsw ${localStorage.getItem('ft_budget_alerts') !== 'off' ? 'on' : ''}" onclick="this.classList.toggle('on');localStorage.setItem('ft_budget_alerts',this.classList.contains('on')?'on':'off')"></div></div><div class="trow"><div class="tinf"><div class="tna">Milestone Alerts</div><div class="tde">Goal progress notifications</div></div><div class="tsw ${localStorage.getItem('ft_milestone_alerts') !== 'off' ? 'on' : ''}" onclick="this.classList.toggle('on');localStorage.setItem('ft_milestone_alerts',this.classList.contains('on')?'on':'off')"></div></div><div style="display:flex;justify-content:space-between;align-items:center;margin:14px 0 10px"><span style="font-size:11px;font-weight:600">Reminders (${REMINDERS.filter(r => !r.completed).length} active)</span><button class="btn bp" style="font-size:10px;padding:4px 10px" onclick="openReminderModal()">+ Add</button></div>${REMINDERS.length ? '<div style="display:flex;flex-direction:column;gap:6px">' + REMINDERS.map(r => { const rDate = new Date(r.date); const today = new Date(); today.setHours(0,0,0,0); rDate.setHours(0,0,0,0); const diff = Math.ceil((rDate - today) / (1000*60*60*24)); const statusIcon = r.completed ? '✅' : diff < 0 ? '🔴' : diff <= 3 ? '🟡' : '🟢'; const freq = r.repeat === 'monthly' ? 'Monthly' : r.repeat === 'yearly' ? 'Yearly' : 'Once'; return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:var(--bg-primary);border-radius:8px"><div style="flex:1;min-width:0"><div style="font-size:11px;font-weight:600">' + statusIcon + ' ' + r.title + '</div><div style="font-size:9px;color:var(--text-tertiary)">' + r.date + ' · ' + freq + (diff >= 0 && !r.completed ? ' · ' + diff + 'd left' : diff < 0 && !r.completed ? ' · Overdue' : '') + '</div></div><div style="display:flex;gap:3px"><button class="abtn" style="width:20px;height:20px;font-size:8px" onclick="editReminder(' + r.id + ')">✏️</button><button class="abtn del" style="width:20px;height:20px;font-size:8px" onclick="deleteReminder(' + r.id + ')">🗑</button></div></div>'; }).join('') + '</div>' : '<div style="padding:16px;text-align:center;font-size:11px;color:var(--text-tertiary)">No reminders yet</div>'}</div>`;
  } else if (sub === 'currency') {
    html += '<div id="genSubContent"></div>';
    c.innerHTML = html; lucide.createIcons();
    renderCurrencyTab(document.getElementById('genSubContent'));
    return;
  } else if (sub === 'language') {
    html += '<div id="genSubContent"></div>';
    c.innerHTML = html; lucide.createIcons();
    renderLanguageTab(document.getElementById('genSubContent'));
    return;
  }
  c.innerHTML = html; lucide.createIcons();
}

// === SYSTEM TAB (clickable sub-items) ===
function renderSystemTab(c) {
  try {
  var cloudLabel = typeof ftAuth !== 'undefined' && ftAuth.isLoggedIn() ? ftAuth.user.email : 'Not signed in';
  c.innerHTML = `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;overflow:hidden"><div class="mob-set-item" onclick="renderSysSub('cloud')"><span class="mob-set-icon">☁️</span><span class="mob-set-label">Cloud Sync</span><span class="mob-set-val" style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${cloudLabel} &#8250;</span></div><div class="mob-set-item" onclick="renderSysSub('budgetcat')"><span class="mob-set-icon">🧠</span><span class="mob-set-label">Budget Categorization</span><span class="mob-set-val">&#8250;</span></div><div class="mob-set-item" onclick="renderSysSub('years')"><span class="mob-set-icon">📅</span><span class="mob-set-label">Year Management</span><span class="mob-set-val">&#8250;</span></div><div class="mob-set-item" onclick="renderSysSub('backup')"><span class="mob-set-icon">💾</span><span class="mob-set-label">Backup & Restore</span><span class="mob-set-val">&#8250;</span></div><div class="mob-set-item" onclick="checkForUpdates()"><span class="mob-set-icon">🔄</span><span class="mob-set-label">Check for Updates</span><span class="mob-set-val">${FINTRACK_VERSION} &#8250;</span></div></div>`;
  } catch(e) { c.innerHTML = '<div style="padding:20px;color:var(--rose);font-size:12px">Error: ' + e.message + '</div>'; }
}

function renderSysSub(sub) {
  const c = document.getElementById('setc');
  let html = `<div style="margin-bottom:12px"><button class="btn bs" style="font-size:11px;padding:5px 10px" onclick="renderSystemTab(document.getElementById('setc'))"><i data-lucide="arrow-left" width="11" height="11"></i> Back</button></div>`;
  if (sub === 'cloud') {
    html += renderCloudSyncUI();
  } else if (sub === 'budgetcat') {
    const catMemSize = Object.keys(JSON.parse(safeGet('ft_cat_memory') || '{}')).length;
    // Use StorageManager API for real IndexedDB usage (async render)
    const storageCard = 'storageCard_' + Date.now();
    html += `<div style="border:1px solid var(--border);border-radius:12px;padding:16px 18px;margin-bottom:16px"><div style="font-size:13px;font-weight:600;margin-bottom:12px">Budget Categorization</div><div class="trow"><div class="tinf"><div class="tna">Smart Suggestions</div><div class="tde">Auto-suggest categories when typing</div></div><div class="tsw ${safeGet('ft_autocat_off') !== 'true' ? 'on' : ''}" onclick="this.classList.toggle('on');safeSave('ft_autocat_off',this.classList.contains('on')?'false':'true')"></div></div><div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding:10px 14px;background:var(--bg-primary);border-radius:8px"><div><div style="font-size:11px;font-weight:500">Category Memory</div><div style="font-size:10px;color:var(--text-tertiary)">${catMemSize} patterns learned</div></div><button class="btn bs" style="font-size:10px;padding:5px 12px;color:var(--rose);border-color:var(--rose)" onclick="if(confirm('Clear all patterns?')){if(typeof clearCatMemory==='function')clearCatMemory();renderSysSub('budgetcat')}">Clear</button></div></div><div style="border:1px solid var(--border);border-radius:12px;padding:16px 18px"><div style="display:flex;align-items:center;gap:10px;margin-bottom:12px"><div style="width:32px;height:32px;border-radius:8px;background:var(--blue-light);color:var(--blue);display:flex;align-items:center;justify-content:center"><i data-lucide="hard-drive" width="15" height="15"></i></div><div id="${storageCard}"><div style="font-size:13px;font-weight:600">Storage</div><div style="font-size:10px;color:var(--text-tertiary)">Calculating...</div></div></div><div id="${storageCard}_bar" style="height:6px;background:var(--border);border-radius:3px;overflow:hidden"><div style="height:100%;width:0%;background:var(--emerald);border-radius:3px;transition:width 300ms"></div></div></div>`;
    // Async: update storage display after render
    setTimeout(function() {
      if (navigator.storage && navigator.storage.estimate) {
        navigator.storage.estimate().then(function(est) {
          var used = est.usage || 0;
          var quota = est.quota || 0;
          var usedMB = (used / (1024 * 1024)).toFixed(2);
          var quotaMB = (quota / (1024 * 1024)).toFixed(0);
          var pct = quota > 0 ? Math.min(100, (used / quota * 100)).toFixed(1) : 0;
          var color = pct > 80 ? 'var(--rose)' : pct > 60 ? 'var(--amber)' : 'var(--emerald)';
          var el = document.getElementById(storageCard);
          if (el) el.innerHTML = '<div style="font-size:13px;font-weight:600">Storage</div><div style="font-size:10px;color:var(--text-tertiary)">' + usedMB + ' MB of ~' + quotaMB + ' MB (' + pct + '%)</div>';
          var bar = document.getElementById(storageCard + '_bar');
          if (bar) bar.innerHTML = '<div style="height:100%;width:' + pct + '%;background:' + color + ';border-radius:3px;transition:width 300ms"></div>';
        });
      } else {
        var el = document.getElementById(storageCard);
        if (el) el.innerHTML = '<div style="font-size:13px;font-weight:600">Storage</div><div style="font-size:10px;color:var(--text-tertiary)">Unlimited (StorageManager not available)</div>';
      }
    }, 100);
  } else if (sub === 'years') {
    html += `<div style="border:1px solid var(--border);border-radius:12px;padding:16px 18px"><div style="font-size:13px;font-weight:600;margin-bottom:12px">Year Management</div><div style="display:flex;gap:8px;margin-bottom:14px"><input class="fi" type="number" id="addYearInput" placeholder="e.g. 2041" style="max-width:120px;font-size:12px" min="1900" max="2100"><button class="btn bp" style="font-size:11px;padding:5px 12px" onclick="handleAddYear()">+ Add</button></div><div style="display:flex;flex-wrap:wrap;gap:6px">`;
    YEARS.forEach(y => { const hasData = yearHasData(y); const isCurrent = y === CURRENT_YEAR; html += `<div style="display:flex;align-items:center;gap:4px;padding:6px 10px;border:1px solid ${isCurrent ? 'var(--accent)' : 'var(--border)'};border-radius:7px;background:${isCurrent ? 'var(--accent-light)' : 'var(--bg-primary)'};font-size:12px;font-weight:${isCurrent ? '600' : '500'}"><span>${y}</span>${hasData ? '<span style="font-size:8px;color:var(--emerald);font-weight:600;margin-left:2px">DATA</span>' : ''}<button style="border:none;background:none;color:${hasData ? 'var(--border)' : 'var(--rose)'};cursor:${hasData ? 'not-allowed' : 'pointer'};font-size:12px;padding:0 2px;opacity:${hasData ? '0.3' : '1'}" onclick="${hasData ? '' : 'handleRemoveYear(' + y + ')'}">✕</button></div>`; });
    html += `</div><div style="margin-top:12px;font-size:10px;color:var(--text-tertiary)">Years with data cannot be removed.</div></div>`;
  } else if (sub === 'backup') {
    const lastBackup = safeGet('ft_last_backup_date');
    const lastLabel = lastBackup ? new Date(lastBackup).toLocaleString() : 'Never';
    html += `<div style="border:1px solid var(--border);border-radius:12px;padding:16px 18px;margin-bottom:16px"><div style="display:flex;align-items:center;gap:10px;margin-bottom:14px"><div style="width:32px;height:32px;border-radius:8px;background:var(--emerald-light);color:var(--emerald);display:flex;align-items:center;justify-content:center"><i data-lucide="download" width="15" height="15"></i></div><div><div style="font-size:13px;font-weight:600">Export Data</div><div style="font-size:10px;color:var(--text-tertiary)">Last backup: ${lastLabel}</div></div></div><div style="display:flex;flex-wrap:wrap;gap:8px"><button class="btn bp" style="font-size:11px;padding:8px 14px" onclick="exportJSON();markBackupDone()"><i data-lucide="file-json" width="13" height="13"></i> JSON</button><button class="btn bs" style="font-size:11px;padding:8px 14px" onclick="exportCSV();markBackupDone()"><i data-lucide="file-text" width="13" height="13"></i> CSV</button><button class="btn bs" style="font-size:11px;padding:8px 14px" onclick="exportExcel();markBackupDone()"><i data-lucide="table" width="13" height="13"></i> Excel</button></div></div>`;
    html += `<div style="border:1px solid var(--border);border-radius:12px;padding:16px 18px"><div style="display:flex;align-items:center;gap:10px;margin-bottom:14px"><div style="width:32px;height:32px;border-radius:8px;background:var(--accent-light);color:var(--accent);display:flex;align-items:center;justify-content:center"><i data-lucide="upload" width="15" height="15"></i></div><div><div style="font-size:13px;font-weight:600">Import Data</div><div style="font-size:10px;color:var(--text-tertiary)">Restore from backup file</div></div></div><div style="display:flex;flex-direction:column;gap:8px"><label class="btn bs" style="font-size:11px;padding:8px 14px;cursor:pointer;display:inline-flex;align-items:center;gap:6px"><i data-lucide="file-json" width="13" height="13"></i> Import JSON<input type="file" accept=".json" style="display:none" onchange="importJSON(this)"></label><label class="btn bs" style="font-size:11px;padding:8px 14px;cursor:pointer;display:inline-flex;align-items:center;gap:6px"><i data-lucide="file-text" width="13" height="13"></i> Import CSV<input type="file" accept=".csv" style="display:none" onchange="importCSV(this)"></label><label class="btn bs" style="font-size:11px;padding:8px 14px;cursor:pointer;display:inline-flex;align-items:center;gap:6px"><i data-lucide="table" width="13" height="13"></i> Import Excel<input type="file" accept=".xls,.xlsx" style="display:none" onchange="importExcel(this)"></label></div><div style="margin-top:10px;font-size:10px;color:var(--text-tertiary)">JSON: full backup (transactions + accounts + goals + settings). CSV/Excel: transactions only.</div></div>`;
  }
  c.innerHTML = html; lucide.createIcons();
}

// === APPEARANCE TAB (v15.5) ===
function renderAppearanceTab(c) {
  c.innerHTML = `<div style="border:1px solid var(--border);border-radius:12px;padding:16px 18px"><div style="display:flex;align-items:center;gap:10px;margin-bottom:14px"><div style="width:32px;height:32px;border-radius:8px;background:var(--accent-light);color:var(--accent);display:flex;align-items:center;justify-content:center"><i data-lucide="palette" width="15" height="15"></i></div><div><div style="font-size:13px;font-weight:600">Appearance</div><div style="font-size:10px;color:var(--text-tertiary)">Theme and display preferences</div></div></div><div class="trow"><div class="tinf"><div class="tna">${t('set_dark_mode')}</div><div class="tde">${t('set_theme')}</div></div><div class="tsw ${document.documentElement.dataset.theme === 'dark' ? 'on' : ''}" onclick="this.classList.toggle('on');const th=this.classList.contains('on')?'dark':'light';document.documentElement.dataset.theme=th;localStorage.setItem('theme',th)"></div></div><div class="trow"><div class="tinf"><div class="tna">Accent Color</div><div class="tde">Primary brand color used across the app</div></div><div style="display:flex;gap:6px;align-items:center"><div style="width:24px;height:24px;border-radius:6px;background:var(--accent);border:2px solid var(--border)"></div><span style="font-size:11px;color:var(--text-tertiary)">Indigo</span></div></div></div>`;
  lucide.createIcons();
}

// === CURRENCY TAB (v15.8.2 — Direct click selection) ===
function renderCurrencyTab(c) {
  const rateInfo = ratesLastUpdated ? `Rates updated: ${new Date(ratesLastUpdated).toLocaleString()}` : 'Using fallback rates';
  let html = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><div style="font-size:10px;color:var(--text-tertiary)">${rateInfo}</div><button class="btn bs" style="font-size:10px;padding:4px 10px" onclick="fetchExchangeRates().then(()=>{toast('✅ Rates refreshed');renderCurrencyTab(document.getElementById('setc'))})">↻ Refresh</button></div>`;
  html += '<div style="display:flex;flex-direction:column;gap:2px">';
  Object.entries(CURRENCY_CONFIG).forEach(([code, cfg]) => {
    const isActive = code === displayCurrency;
    html += `<div onclick="setCurrency('${code}');renderCurrencyTab(document.getElementById('setc'))" style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-radius:8px;cursor:pointer;transition:background 150ms;border:1px solid ${isActive ? 'var(--accent)' : 'transparent'};background:${isActive ? 'var(--accent-light)' : 'var(--bg-primary)'}" ${!isActive ? 'onmouseenter="this.style.background=\'var(--bg-card)\'" onmouseleave="this.style.background=\'var(--bg-primary)\'"' : ''}><div style="display:flex;align-items:center;gap:10px"><span style="font-size:16px;width:24px;text-align:center">${cfg.symbol}</span><div><div style="font-size:12px;font-weight:${isActive ? '700' : '500'};color:${isActive ? 'var(--accent)' : 'var(--text-primary)'}">${code}</div><div style="font-size:10px;color:var(--text-tertiary)">${cfg.name}</div></div></div>${isActive ? '<span style="color:var(--accent);font-size:14px">✓</span>' : ''}</div>`;
  });
  html += '</div>';
  c.innerHTML = html;
}

// === LANGUAGE TAB (v15.3.1 — Direct click selection) ===
function renderLanguageTab(c) {
  const languages = [
    { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
    { code: 'ms', name: 'Bahasa Melayu', native: 'Bahasa Melayu', flag: '🇲🇾' },
    { code: 'id', name: 'Bahasa Indonesia', native: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'zh', name: 'Chinese', native: '简体中文', flag: '🇨🇳' },
    { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', native: '한국어', flag: '🇰🇷' },
    { code: 'ru', name: 'Russian', native: 'Русский', flag: '🇷🇺' }
  ];
  let html = '<div style="display:flex;flex-direction:column;gap:2px">';
  languages.forEach(lang => {
    const isActive = lang.code === currentLang;
    html += `<div onclick="switchLang('${lang.code}')" style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-radius:8px;cursor:pointer;transition:background 150ms;border:1px solid ${isActive ? 'var(--accent)' : 'transparent'};background:${isActive ? 'var(--accent-light)' : 'var(--bg-primary)'}" ${!isActive ? 'onmouseenter="this.style.background=\'var(--bg-card)\'" onmouseleave="this.style.background=\'var(--bg-primary)\'"' : ''}><div style="display:flex;align-items:center;gap:10px"><span style="font-size:18px">${lang.flag}</span><div><div style="font-size:12px;font-weight:${isActive ? '700' : '500'};color:${isActive ? 'var(--accent)' : 'var(--text-primary)'}">${lang.native}</div><div style="font-size:10px;color:var(--text-tertiary)">${lang.name}</div></div></div>${isActive ? '<span style="color:var(--accent);font-size:14px">✓</span>' : ''}</div>`;
  });
  html += '</div>';
  c.innerHTML = html;
}

// v15.3.1: Switch language and stay on language tab (mobile) or re-render settings (desktop)
function switchLang(lang) {
  currentLang = lang;
  safeSave('ft_lang', lang);
  if (lang === 'zh') document.body.style.fontFamily = "'Noto Sans SC', 'Inter', system-ui, sans-serif";
  else if (lang === 'ja' || lang === 'ko') document.body.style.fontFamily = "'Noto Sans JP', 'Inter', system-ui, sans-serif";
  else document.body.style.fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif";
  updateNavLabels();
  // Update bottom nav labels
  document.querySelectorAll('.bnav-lbl').forEach(el => {
    const key = el.dataset.key;
    if (key) el.textContent = t(key);
  });
  // Update month filter
  const mf = document.getElementById('mf');
  if (mf) {
    const mNames = getMonthNames();
    mf.options[0].textContent = t('hdr_total_year');
    for (let i = 1; i <= 12; i++) mf.options[i].textContent = mNames[i - 1];
  }
  // V2.0.1: Title removed from header
  document.getElementById('pt').textContent = '';
  // Stay on language tab (re-render just the language list)
  const setc = document.getElementById('setc');
  if (setc) renderLanguageTab(setc);
  toast('✅ ' + lang.toUpperCase());
}

// === CATEGORIES & ACCOUNTS TAB ===
function renderCatAccountsTab(c) {
  let html = '<div style="margin-bottom:24px">';
  html += `<div style="font-size:14px;font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:8px"><i data-lucide="tag" width="16" height="16" style="color:var(--accent)"></i> Categories</div>`;
  html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><div style="display:flex;gap:4px">`;
  ['Income','Expense','Savings'].forEach(tp => {
    html += `<button class="btn ${catTypeFilter === tp ? 'bp' : 'bs'}" style="font-size:11px;padding:5px 12px" onclick="catTypeFilter='${tp}';renderCatAccountsTab(document.getElementById('setc'))">${tp}</button>`;
  });
  html += `</div><button class="btn bp" style="font-size:11px;padding:5px 12px" onclick="promptAddCategory()"><i data-lucide="plus" width="11" height="11"></i> Add</button></div>`;
  const cats = SCHEMA[catTypeFilter] || {};
  if (!Object.keys(cats).length) {
    html += `<div style="padding:20px;text-align:center;color:var(--text-tertiary);font-size:12px;border:1px solid var(--border);border-radius:10px">No categories yet</div>`;
  } else {
    Object.entries(cats).forEach(([cat, subs]) => {
      html += `<div style="margin-bottom:10px;border:1px solid var(--border);border-radius:10px;overflow:hidden">`;
      html += `<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--bg-primary)"><span style="font-size:13px;font-weight:600">${cat}</span><div style="display:flex;gap:4px"><button class="abtn" style="width:22px;height:22px;font-size:9px" onclick="promptRenameCat('${catTypeFilter}','${cat}')" title="Rename">✏️</button><button class="abtn del" style="width:22px;height:22px;font-size:9px" onclick="promptDeleteCat('${catTypeFilter}','${cat}')" title="Delete">🗑</button></div></div>`;
      if (subs.length) {
        html += `<div style="padding:8px 14px;display:flex;flex-direction:column;gap:4px">`;
        subs.forEach(sub => {
          html += `<div style="display:flex;align-items:center;justify-content:space-between;padding:5px 10px;border-radius:6px;background:var(--bg-secondary);font-size:11px"><span style="color:var(--text-secondary)">${sub}</span><div style="display:flex;gap:3px"><button class="abtn" style="width:18px;height:18px;font-size:8px" onclick="promptRenameSub('${catTypeFilter}','${cat}','${sub}')">✏️</button><button class="abtn del" style="width:18px;height:18px;font-size:8px" onclick="promptDeleteSub('${catTypeFilter}','${cat}','${sub}')">🗑</button></div></div>`;
        });
        html += `</div>`;
      }
      html += `<div style="padding:6px 14px 10px;border-top:1px solid var(--border-light)"><button style="border:none;background:none;color:var(--accent);font-size:10px;cursor:pointer;font-family:var(--font);font-weight:500" onclick="promptAddSub('${catTypeFilter}','${cat}')">+ Add Subcategory</button></div></div>`;
    });
  }
  html += '</div>';
  html += `<div style="border-top:2px solid var(--border);padding-top:20px">`;
  html += renderAccountsSection();
  html += `</div>`;
  c.innerHTML = html;
  lucide.createIcons();
}

function renderAccountsSection() {
  const assets = ACCOUNTS.filter(a => a.type === 'asset');
  const liabilities = ACCOUNTS.filter(a => a.type === 'liability');
  let html = '';
  const hasMultiCurrency = ACCOUNTS.some(a => (a.currency || 'MYR') !== displayCurrency);
  if (hasMultiCurrency) {
    const rateTime = ratesLastUpdated ? new Date(ratesLastUpdated).toLocaleString() : 'Never';
    html += `<div style="border:1px solid var(--border);border-radius:10px;padding:10px 14px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;background:var(--bg-primary)"><div style="display:flex;align-items:center;gap:8px"><span style="font-size:11px">💱</span><div><div style="font-size:11px;font-weight:500">Multi-currency active · Display: ${displayCurrency}</div><div style="font-size:9px;color:var(--text-tertiary)">Rates updated: ${rateTime}</div></div></div><button class="btn bs" style="font-size:9px;padding:3px 8px" onclick="fetchExchangeRates().then(()=>{toast('✅ Rates refreshed');renderCatAccountsTab(document.getElementById('setc'))})">↻ Refresh</button></div>`;
  }
  html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><div style="font-size:14px;font-weight:700;display:flex;align-items:center;gap:8px"><i data-lucide="building-2" width="16" height="16" style="color:var(--accent)"></i> Accounts</div><button class="btn bp" style="font-size:11px;padding:5px 12px" onclick="openAccountModal()"><i data-lucide="plus" width="11" height="11"></i> Add</button></div>`;
  if (assets.length) {
    const totalAssetDisplay = assets.reduce((s, a) => s + getAccountBalanceInDisplay(a.id), 0);
    html += `<div style="font-size:10px;font-weight:700;color:var(--emerald);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center"><span>Assets</span><span style="font-size:11px;font-feature-settings:'tnum'">${fmt(totalAssetDisplay)}</span></div>`;
    assets.forEach((a, idx) => {
      const bal = getAccountBalance(a.id);
      const cur = a.currency || 'MYR';
      const showDual = cur !== displayCurrency;
      const displayBal = showDual ? convertToDisplay(bal, cur) : bal;
      const nativeBalStr = fmtIn(bal, cur);
      const displayBalStr = showDual ? `<div style="font-size:10px;color:var(--text-tertiary)">≈ ${fmt(displayBal)}</div>` : '';
      html += `<div style="border:1px solid var(--border);border-radius:10px;padding:12px 16px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center"><div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600;margin-bottom:2px">${a.name}</div><div style="font-size:10px;color:var(--text-tertiary)">${a.accountType} · ${cur}${a.notes ? ' · ' + a.notes : ''}</div><div style="font-size:10px;color:var(--text-tertiary);margin-top:2px">Starting: ${fmtIn(a.initialBalance, cur)}</div></div><div style="display:flex;align-items:center;gap:12px"><div style="text-align:right"><div style="font-size:15px;font-weight:800;font-feature-settings:'tnum';color:${bal >= 0 ? 'var(--emerald)' : 'var(--rose)'}">${nativeBalStr}</div>${displayBalStr}<div style="font-size:9px;color:var(--text-tertiary)">Current</div></div><div style="display:flex;gap:3px">${idx > 0 ? '<button class="abtn" style="width:22px;height:22px;font-size:9px" onclick="moveAccount(\'' + a.id + '\',-1)" title="Move up">↑</button>' : ''}<button class="abtn" style="width:22px;height:22px;font-size:9px" onclick="moveAccount('${a.id}',1)" title="Move down">↓</button><button class="abtn" style="width:22px;height:22px;font-size:9px" onclick="openEditAccount('${a.id}')" title="Edit">✏️</button><button class="abtn" style="width:22px;height:22px;font-size:9px" onclick="adjustAccountBalance('${a.id}')" title="Adjust">⚖️</button><button class="abtn del" style="width:22px;height:22px;font-size:9px" onclick="deleteAccount('${a.id}')" title="Delete">🗑</button></div></div></div>`;
    });
  }
  if (liabilities.length) {
    const totalLiabDisplay = liabilities.reduce((s, a) => s + convertToDisplay(Math.abs(getAccountBalance(a.id)), a.currency || 'MYR'), 0);
    html += `<div style="font-size:10px;font-weight:700;color:var(--rose);text-transform:uppercase;letter-spacing:.06em;margin:18px 0 8px;display:flex;justify-content:space-between;align-items:center"><span>Liabilities</span><span style="font-size:11px;font-feature-settings:'tnum'">-${fmt(totalLiabDisplay)}</span></div>`;
    liabilities.forEach((a, idx) => {
      const cur = a.currency || 'MYR';
      const bal = getAccountBalance(a.id);
      const showDual = cur !== displayCurrency;
      const nativeStr = fmtIn(-Math.abs(bal), cur);
      const displayStr = showDual ? `<div style="font-size:10px;color:var(--text-tertiary)">≈ ${fmt(-convertToDisplay(Math.abs(bal), cur))}</div>` : '';
      html += `<div style="border:1px solid var(--border);border-radius:10px;padding:12px 16px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center"><div><div style="font-size:13px;font-weight:600;margin-bottom:2px">${a.name}</div><div style="font-size:10px;color:var(--text-tertiary)">${a.accountType} · ${cur}</div></div><div style="display:flex;align-items:center;gap:12px"><div style="text-align:right"><div style="font-size:15px;font-weight:800;color:var(--rose);font-feature-settings:'tnum'">${nativeStr}</div>${displayStr}</div><div style="display:flex;gap:3px">${idx > 0 ? '<button class="abtn" style="width:22px;height:22px;font-size:9px" onclick="moveAccount(\'' + a.id + '\',-1)" title="Move up">↑</button>' : ''}<button class="abtn" style="width:22px;height:22px;font-size:9px" onclick="moveAccount('${a.id}',1)" title="Move down">↓</button><button class="abtn" style="width:22px;height:22px;font-size:9px" onclick="openEditAccount('${a.id}')">✏️</button><button class="abtn del" style="width:22px;height:22px;font-size:9px" onclick="deleteAccount('${a.id}')">🗑</button></div></div></div>`;
    });
  }
  html += `<div style="margin-top:18px;padding:14px 16px;background:var(--accent-light);border-radius:10px;display:flex;justify-content:space-between;align-items:center"><span style="font-size:12px;font-weight:600">Net Worth</span><span style="font-size:17px;font-weight:800;font-feature-settings:'tnum'">${fmt(getNetWorth())}</span></div>`;
  return html;
}

function moveAccount(accId, direction) {
  const idx = ACCOUNTS.findIndex(a => a.id === accId);
  if (idx < 0) return;
  const acc = ACCOUNTS[idx];
  const sameType = ACCOUNTS.filter(a => a.type === acc.type);
  const typeIdx = sameType.findIndex(a => a.id === accId);
  const newTypeIdx = typeIdx + direction;
  if (newTypeIdx < 0 || newTypeIdx >= sameType.length) return;
  // Swap within same type group
  const targetAcc = sameType[newTypeIdx];
  const globalIdx1 = ACCOUNTS.findIndex(a => a.id === accId);
  const globalIdx2 = ACCOUNTS.findIndex(a => a.id === targetAcc.id);
  [ACCOUNTS[globalIdx1], ACCOUNTS[globalIdx2]] = [ACCOUNTS[globalIdx2], ACCOUNTS[globalIdx1]];
  saveACCOUNTS();
  renderCatAccountsTab(document.getElementById('setc'));
}

// === CATEGORIES (helpers) ===
let catTypeFilter = 'Income';

function promptAddCategory() {
  const name = prompt(`New ${catTypeFilter} category name:`);
  if (!name) return;
  if (addCategory(catTypeFilter, name)) { toast('✅ Category added'); renderCatAccountsTab(document.getElementById('setc')); }
  else toast('❌ Already exists');
}

function promptRenameCat(type, oldName) {
  const newName = prompt(`Rename "${oldName}" to:`, oldName);
  if (!newName || newName === oldName) return;
  if (renameCategory(type, oldName, newName)) { toast('✅ Renamed'); renderCatAccountsTab(document.getElementById('setc')); }
  else toast('❌ Failed');
}

function promptDeleteCat(type, cat) {
  if (!confirm(`Delete category "${cat}" and all its subcategories?`)) return;
  if (deleteCategory(type, cat)) { toast('🗑 Deleted'); renderCatAccountsTab(document.getElementById('setc')); }
}

function promptAddSub(type, cat) {
  const name = prompt(`New subcategory for "${cat}":`);
  if (!name) return;
  if (addSubcategory(type, cat, name)) { toast('✅ Added'); renderCatAccountsTab(document.getElementById('setc')); }
  else toast('❌ Already exists');
}

function promptRenameSub(type, cat, oldName) {
  const newName = prompt(`Rename "${oldName}" to:`, oldName);
  if (!newName || newName === oldName) return;
  if (renameSubcategory(type, cat, oldName, newName)) { toast('✅ Renamed'); renderCatAccountsTab(document.getElementById('setc')); }
  else toast('❌ Failed');
}

function promptDeleteSub(type, cat, sub) {
  if (!confirm(`Delete subcategory "${sub}"?`)) return;
  if (deleteSubcategory(type, cat, sub)) { toast('🗑 Deleted'); renderCatAccountsTab(document.getElementById('setc')); }
}

// === YEAR MANAGEMENT & AI KEY ===
function saveGeminiKey() {
  const key = document.getElementById('set_gemini_key').value.trim();
  setAIKey(key);
  // Clear cooldown when key changes
  safeSave('ft_ai_cooldown', '');
  if (typeof aiRateLimitUntil !== 'undefined') aiRateLimitUntil = 0;
  const status = document.getElementById('geminiKeyStatus');
  if (key) {
    status.innerHTML = '<span style="color:var(--emerald);font-size:11px;font-weight:500">✅ Gemini key saved. Cooldown cleared.</span>';
  } else {
    status.innerHTML = '<span style="color:var(--text-tertiary);font-size:11px">Key removed.</span>';
  }
}

function saveGroqKey() {
  const key = document.getElementById('set_groq_key').value.trim();
  setGroqKey(key);
  toast(key ? '✅ Groq key saved (fallback active)' : '🗑 Groq key removed');
}

function handleAddYear() {
  const input = document.getElementById('addYearInput');
  const year = parseInt(input.value);
  if (!year) { toast('❌ Enter a valid year'); return; }
  if (addYear(year)) { toast('✅ Year ' + year + ' added'); input.value = ''; renderSysSub('years'); }
  else { toast('❌ Year already exists or invalid'); }
}

function handleRemoveYear(year) {
  if (!confirm('Remove year ' + year + ' from all selectors?')) return;
  if (removeYear(year)) { toast('🗑 Year ' + year + ' removed'); renderSysSub('years'); }
  else { toast('❌ Cannot remove (has data)'); }
}

// === ACCOUNTS ===
function openAccountModal(editAcc) {
  const isEdit = !!editAcc;
  const typeOptions = [...ACCOUNT_TYPES.asset.map(tp => `<option value="asset|${tp}"${isEdit && editAcc.type === 'asset' && editAcc.accountType === tp ? ' selected' : ''}>[Asset] ${tp}</option>`), ...ACCOUNT_TYPES.liability.map(tp => `<option value="liability|${tp}"${isEdit && editAcc.type === 'liability' && editAcc.accountType === tp ? ' selected' : ''}>[Liability] ${tp}</option>`)].join('');
  const h = `<div class="mo show" id="maccadd" onclick="if(event.target===this){this.remove();document.body.style.overflow=''}"><div class="ml" onclick="event.stopPropagation()"><div class="mh"><div><div class="mti">${isEdit ? 'Edit' : 'Add'} Account</div><div class="mds">Account details</div></div><button class="mx" onclick="document.getElementById('maccadd').remove();document.body.style.overflow=''">✕</button></div><form onsubmit="saveAccount(event,'${isEdit ? editAcc.id : ''}')"><div class="fg"><label class="fl">Account Name *</label><input class="fi" id="acc_name" required value="${isEdit ? editAcc.name : ''}" placeholder="e.g. Maybank Savings"></div><div class="fg"><label class="fl">Account Type *</label><select class="fi" id="acc_type" required>${typeOptions}</select></div><div class="fr"><div class="fg"><label class="fl">Account Currency</label><select class="fi" id="acc_cur">${Object.keys(CURRENCY_CONFIG).map(cx => `<option value="${cx}"${(isEdit ? editAcc.currency : 'MYR') === cx ? ' selected' : ''}>${cx}</option>`).join('')}</select></div><div class="fg"><label class="fl">Starting Account Balance</label><input class="fi" type="number" step="0.01" id="acc_bal" value="${isEdit ? editAcc.initialBalance : '0'}" placeholder="0.00"></div></div><div class="fg"><label class="fl">Notes</label><input class="fi" id="acc_notes" value="${isEdit ? (editAcc.notes || '') : ''}" placeholder="Optional"></div><div class="ma"><button type="button" class="btn bs" onclick="document.getElementById('maccadd').remove();document.body.style.overflow=''">Cancel</button><button type="submit" class="btn bp">${isEdit ? 'Update' : 'Create'}</button></div></form></div></div>`;
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
      if (newInitialBalance !== oldInitialBalance) {
        // Only create adjustment if old balance was NOT zero (meaning user already set it before)
        if (oldInitialBalance !== 0) {
          // User is manually changing an existing balance = adjustment
          const diff = newInitialBalance - oldInitialBalance;
          if (diff !== 0) {
            // Liability adjustment = Expense (paying more debt or adding debt)
            // Asset adjustment = Income (money appeared) or Expense (money disappeared)
            let txnType;
            if (acc.type === 'liability') {
              txnType = 'Expense'; // Liability changes always show as expense
            } else {
              txnType = diff > 0 ? 'Income' : 'Expense'; // Asset: positive = income, negative = expense
            }
            TXN.push({
              id: generateTxnId(),
              d: new Date().toISOString().split('T')[0],
              t: txnType,
              c: 'Balance Adjustment',
              s: acc.type === 'liability' ? 'Liability Adjustment' : 'Asset Adjustment',
              a: Math.abs(diff),
              dt: `Adj: ${name}`,
              acc: acc.type === 'asset' ? acc.id : undefined,
              liab: acc.type === 'liability' ? acc.id : undefined
            });
            saveTXN();
          }
        }
        // Always update the stored balance
        acc.initialBalance = newInitialBalance;
      }
    }
    TXN.forEach(tx => { if (tx.acc === editId && tx.dt && tx.dt.includes('Adj:')) tx.dt = `Adj: ${name}`; });
    toast('✅ Account updated');
  } else {
    const id = 'acc_' + (accNxId++);
    ACCOUNTS.push({ id, name, type, accountType, currency, initialBalance: newInitialBalance, notes, createdAt: new Date().toISOString().split('T')[0] });
    toast('✅ Account created');
  }
  saveACCOUNTS(); saveTXN();
  document.getElementById('maccadd').remove(); document.body.style.overflow = '';
  renderCatAccountsTab(document.getElementById('setc'));
}

function openEditAccount(id) { const acc = ACCOUNTS.find(a => a.id === id); if (acc) openAccountModal(acc); }

function deleteAccount(id) {
  const acc = ACCOUNTS.find(a => a.id === id);
  if (!acc) return;
  if (!confirm(`Delete "${acc.name}"? Transactions linked to this account will retain their records.`)) return;
  ACCOUNTS = ACCOUNTS.filter(a => a.id !== id);
  saveACCOUNTS();
  toast('🗑 Account deleted');
  renderCatAccountsTab(document.getElementById('setc'));
}

function adjustAccountBalance(id) {
  const acc = ACCOUNTS.find(a => a.id === id);
  if (!acc || acc.type !== 'asset') return;
  const currentBal = getAccountBalance(id);
  const cur = acc.currency || 'MYR';
  const newBalStr = prompt(`Current balance: ${fmtIn(currentBal, cur)}\nEnter new balance (in ${cur}):`, currentBal);
  if (newBalStr === null) return;
  const newBal = parseFloat(newBalStr);
  if (isNaN(newBal) || newBal === currentBal) return;
  createBalanceAdjustment(id, currentBal, newBal, 'Manual Balance Adjustment');
  toast('✅ Balance adjusted');
  renderCatAccountsTab(document.getElementById('setc'));
}

// === SECURITY TAB (v15.7) ===
function renderSecurityTab(c) {
  var lockStatus = FT_APP_LOCK ? 'Enabled' : 'Disabled';
  var lockColor = FT_APP_LOCK ? 'var(--emerald)' : 'var(--text-tertiary)';
  var bioRegistered = !!localStorage.getItem('ft_bio_cred');
  var bioSupported = typeof ftBiometricSupported === 'function' && ftBiometricSupported();
  var bioColor = bioRegistered ? 'var(--emerald)' : 'var(--text-tertiary)';
  var hasRecovery = hasRecoverySetup();
  var hasSQ = hasSecurityQuestions();
  var bioSection = bioSupported ? '<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px"><span style="font-size:12px;font-weight:600;color:' + bioColor + '">Status: ' + (bioRegistered ? 'Registered ✓' : 'Not set up') + '</span>' + (bioRegistered ? '<button class="btn bd" style="font-size:11px;padding:6px 14px" onclick="ftBiometricRemove();renderSecurityTabRefresh()">Remove</button>' : '<button class="btn bp" style="font-size:11px;padding:6px 14px" onclick="ftBiometricRegister().then(function(){renderSecurityTabRefresh()})">Set Up</button>') + '</div><div style="font-size:10px;color:var(--text-tertiary);line-height:1.6;max-width:400px">When registered and App Lock is active, FinTrack prompts for fingerprint/face on launch. Falls back to PIN if cancelled.</div>' : '<div style="font-size:11px;color:var(--text-tertiary)">Biometric not available on this device/browser. Use a mobile device with fingerprint or Face ID.</div>';

  c.innerHTML = '<h3 style="font-size:15px;font-weight:600;margin-bottom:12px">' + t('set_sec_title') + '</h3><p style="font-size:12px;color:var(--text-secondary);margin-bottom:16px">' + t('set_sec_desc') + '</p>' +
  // Change PIN
  '<div style="border:1px solid var(--border);border-radius:12px;padding:16px 18px;margin-bottom:16px"><div style="display:flex;align-items:center;gap:10px;margin-bottom:14px"><div style="width:32px;height:32px;border-radius:8px;background:var(--accent-light);color:var(--accent);display:flex;align-items:center;justify-content:center"><i data-lucide="lock" width="15" height="15"></i></div><div><div style="font-size:13px;font-weight:600">' + t('set_change_pin') + '</div><div style="font-size:10px;color:var(--text-tertiary)">' + t('set_update_pin') + '</div></div></div><div class="fg"><label class="fl">' + t('set_cur_pk') + '</label><input class="fi" type="password" id="spkc" style="max-width:200px"></div><div class="fg"><label class="fl">' + t('set_new_pk') + '</label><input class="fi" type="password" id="spkn" style="max-width:200px"></div><div style="display:flex;align-items:center;gap:12px"><button class="btn bp" onclick="chgPK()">' + t('set_update') + '</button><button style="border:none;background:none;color:var(--text-tertiary);font-size:11px;cursor:pointer;font-family:var(--font);text-decoration:underline" onclick="forgotPINFromSettings()">Forgot PIN?</button></div></div>' +
  // Recovery Code
  '<div style="border:1px solid var(--border);border-radius:12px;padding:16px 18px;margin-bottom:16px"><div style="display:flex;align-items:center;gap:10px;margin-bottom:14px"><div style="width:32px;height:32px;border-radius:8px;background:var(--emerald-light);color:var(--emerald);display:flex;align-items:center;justify-content:center"><i data-lucide="key" width="15" height="15"></i></div><div><div style="font-size:13px;font-weight:600">' + t('set_recovery_code') + '</div><div style="font-size:10px;color:var(--text-tertiary)">' + t('set_recovery_desc') + '</div></div></div><div style="display:flex;align-items:center;gap:12px;margin-bottom:10px"><span style="font-size:12px;font-weight:600;color:' + (hasRecovery ? 'var(--emerald)' : 'var(--rose)') + '">Status: ' + (hasRecovery ? '✓' : '⚠️') + '</span><button class="btn ' + (hasRecovery ? 'bs' : 'bp') + '" style="font-size:11px;padding:6px 14px" onclick="regenerateRecoveryCode()">' + (hasRecovery ? t('set_update') : t('misc_save')) + '</button></div></div>' +
  // Security Questions
  '<div style="border:1px solid var(--border);border-radius:12px;padding:16px 18px;margin-bottom:16px"><div style="display:flex;align-items:center;gap:10px;margin-bottom:14px"><div style="width:32px;height:32px;border-radius:8px;background:var(--blue-light);color:var(--blue);display:flex;align-items:center;justify-content:center"><i data-lucide="help-circle" width="15" height="15"></i></div><div><div style="font-size:13px;font-weight:600">' + t('set_security_questions') + '</div><div style="font-size:10px;color:var(--text-tertiary)">' + t('set_sq_desc') + '</div></div></div><div style="display:flex;align-items:center;gap:12px;margin-bottom:10px"><span style="font-size:12px;font-weight:600;color:' + (hasSQ ? 'var(--emerald)' : 'var(--rose)') + '">Status: ' + (hasSQ ? '✓' : '⚠️') + '</span><button class="btn ' + (hasSQ ? 'bs' : 'bp') + '" style="font-size:11px;padding:6px 14px" onclick="openSecurityQuestionsModal()">' + (hasSQ ? t('misc_edit') : t('misc_save')) + '</button></div></div>' +
  // App Lock
  '<div style="border:1px solid var(--border);border-radius:12px;padding:16px 18px;margin-bottom:16px"><div style="display:flex;align-items:center;gap:10px;margin-bottom:12px"><div style="width:32px;height:32px;border-radius:8px;background:var(--accent-light);color:var(--accent);display:flex;align-items:center;justify-content:center"><i data-lucide="shield" width="15" height="15"></i></div><div><div style="font-size:13px;font-weight:600">' + t('set_app_lock') + '</div><div style="font-size:10px;color:var(--text-tertiary)">' + t('set_app_lock_desc') + '</div></div></div><div style="display:flex;align-items:center;gap:12px;margin-bottom:10px"><span style="font-size:12px;font-weight:600;color:' + lockColor + '">Status: ' + lockStatus + '</span><button class="btn ' + (FT_APP_LOCK ? 'bd' : 'bp') + '" style="font-size:11px;padding:6px 14px" onclick="' + (FT_APP_LOCK ? 'disableAppLock();renderSecurityTabRefresh()' : 'enableAppLock();renderSecurityTabRefresh()') + '">' + (FT_APP_LOCK ? t('misc_delete') : t('misc_save')) + '</button></div></div>' +
  // Biometric
  '<div style="border:1px solid var(--border);border-radius:12px;padding:16px 18px;margin-bottom:16px"><div style="display:flex;align-items:center;gap:10px;margin-bottom:12px"><div style="width:32px;height:32px;border-radius:8px;background:var(--emerald-light);color:var(--emerald);display:flex;align-items:center;justify-content:center"><i data-lucide="fingerprint" width="15" height="15"></i></div><div><div style="font-size:13px;font-weight:600">' + t('set_biometric') + '</div><div style="font-size:10px;color:var(--text-tertiary)">' + t('set_biometric_desc') + '</div></div></div>' + bioSection + '</div>' +
  // Privacy Screen
  '<div style="border:1px solid var(--border);border-radius:12px;padding:16px 18px;margin-bottom:16px"><div style="display:flex;align-items:center;gap:10px;margin-bottom:12px"><div style="width:32px;height:32px;border-radius:8px;background:var(--accent-light);color:var(--accent);display:flex;align-items:center;justify-content:center"><i data-lucide="eye-off" width="15" height="15"></i></div><div><div style="font-size:13px;font-weight:600">Privacy Screen</div><div style="font-size:10px;color:var(--text-tertiary)">Hide content when switching apps or tabs</div></div></div><div class="trow"><div class="tinf"><div class="tna">Enable Privacy Screen</div><div class="tde">Shows cover screen when you leave the app</div></div><div class="tsw ' + (FT_PRIVACY_SCREEN ? 'on' : '') + '" onclick="this.classList.toggle(\'on\');if(this.classList.contains(\'on\'))enablePrivacyScreen();else disablePrivacyScreen();"></div></div></div>' +
  // Danger Zone
  '<div style="border:1px solid var(--border);border-radius:12px;padding:16px 18px"><div style="display:flex;align-items:center;gap:10px;margin-bottom:12px"><div style="width:32px;height:32px;border-radius:8px;background:var(--rose-light);color:var(--rose);display:flex;align-items:center;justify-content:center"><i data-lucide="trash-2" width="15" height="15"></i></div><div><div style="font-size:13px;font-weight:600;color:var(--rose)">' + t('set_danger_zone') + '</div><div style="font-size:10px;color:var(--text-tertiary)">' + t('set_danger_desc') + '</div></div></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn bd" onclick="secureResetAllData()">' + t('set_reset_all') + '</button><button class="btn bs" style="color:var(--rose);border-color:var(--rose)" onclick="secureResetTransactions()">' + t('set_clear_txn') + '</button></div></div>';
  lucide.createIcons();
}

function renderSecurityTabRefresh() { renderSecurityTab(document.getElementById('setc')); }

// === REGENERATE RECOVERY CODE (v15.7) ===
async function regenerateRecoveryCode() {
  var hasPK = getPKHash();
  if (hasPK) {
    var pin = prompt('Enter your current PIN to regenerate recovery code:');
    if (!pin) return;
    var valid = await verifyPIN(pin);
    if (!valid) { toast('❌ Incorrect PIN'); return; }
  }
  var code = await setupRecoveryCode();
  showRecoveryCodeDisplay(code);
  renderSecurityTab(document.getElementById('setc'));
}

// === SECURITY QUESTIONS MODAL (v15.7) ===
function openSecurityQuestionsModal() {
  var indices = getSecurityQuestionIndices();
  var q1Val = indices ? indices.q1 : 0;
  var q2Val = indices ? indices.q2 : 1;
  var opts1 = SECURITY_QUESTIONS.map(function(q, i) { return '<option value="' + i + '"' + (i === q1Val ? ' selected' : '') + '>' + q + '</option>'; }).join('');
  var opts2 = SECURITY_QUESTIONS.map(function(q, i) { return '<option value="' + i + '"' + (i === q2Val ? ' selected' : '') + '>' + q + '</option>'; }).join('');
  var h = '<div class="mo show" id="mSQSetup" onclick="if(event.target===this){this.remove();document.body.style.overflow=\'\'}"><div class="ml" style="max-width:420px" onclick="event.stopPropagation()"><div class="mh"><div><div class="mti">' + (hasSecurityQuestions() ? 'Update' : 'Set Up') + ' Security Questions</div><div class="mds">Choose two questions and provide answers</div></div><button class="mx" onclick="document.getElementById(\'mSQSetup\').remove();document.body.style.overflow=\'\'">✕</button></div><div style="margin-bottom:16px"><label style="font-size:11px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:4px">Question 1</label><select class="fi" id="sq_q1" style="margin-bottom:8px">' + opts1 + '</select><input class="fi" id="sq_a1" placeholder="Your answer (case-insensitive)" style="font-size:12px"></div><div style="margin-bottom:16px"><label style="font-size:11px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:4px">Question 2</label><select class="fi" id="sq_q2" style="margin-bottom:8px">' + opts2 + '</select><input class="fi" id="sq_a2" placeholder="Your answer (case-insensitive)" style="font-size:12px"></div><div style="font-size:10px;color:var(--text-tertiary);margin-bottom:14px;line-height:1.5">Answers are hashed and cannot be viewed later. Choose questions you will always remember.</div><div class="ma"><button class="btn bs" onclick="document.getElementById(\'mSQSetup\').remove();document.body.style.overflow=\'\'">Cancel</button><button class="btn bp" onclick="saveSecurityQuestionsFromModal()">Save</button></div></div></div>';
  document.body.insertAdjacentHTML('beforeend', h);
  document.body.style.overflow = 'hidden';
}

async function saveSecurityQuestionsFromModal() {
  var q1 = parseInt(document.getElementById('sq_q1').value);
  var a1 = document.getElementById('sq_a1').value.trim();
  var q2 = parseInt(document.getElementById('sq_q2').value);
  var a2 = document.getElementById('sq_a2').value.trim();
  if (!a1 || !a2) { toast('❌ Please answer both questions'); return; }
  if (q1 === q2) { toast('❌ Choose two different questions'); return; }
  await saveSecurityAnswers(q1, a1, q2, a2);
  toast('✅ Security questions saved');
  document.getElementById('mSQSetup').remove();
  document.body.style.overflow = '';
  renderSecurityTab(document.getElementById('setc'));
}

// === SECURE RESET ===
function secureResetAllData() { showResetAuthModal('all'); }
function secureResetTransactions() { showResetAuthModal('transactions'); }

function showResetAuthModal(resetType) {
  const bioAvailable = typeof ftBiometricSupported === 'function' && ftBiometricSupported() && !!localStorage.getItem('ft_bio_cred');
  const title = resetType === 'all' ? '⚠️ Reset All Data' : '⚠️ Clear Transactions';
  const desc = resetType === 'all' ? 'This will permanently delete ALL your financial data.' : 'This will delete all transactions. Accounts and settings are kept.';
  const bioBtn = bioAvailable ? '<button class="btn bp" style="width:100%;justify-content:center;margin-bottom:8px" onclick="verifyResetBiometric(\'' + resetType + '\')"><i data-lucide="fingerprint" width="14" height="14"></i> Verify with Biometric</button>' : '';
  const h = '<div class="mo show" id="mresetauth" onclick="if(event.target===this){this.remove();document.body.style.overflow=\'\'}"><div class="ml" onclick="event.stopPropagation()"><div class="mh"><div><div class="mti">' + title + '</div><div class="mds">' + desc + '</div></div><button class="mx" onclick="document.getElementById(\'mresetauth\').remove();document.body.style.overflow=\'\'">✕</button></div><div style="padding:12px;background:var(--rose-light);border-radius:8px;font-size:12px;margin-bottom:16px;color:var(--rose);text-align:center"><b>Verify your identity to proceed</b></div>' + bioBtn + '<div class="fg"><label class="fl">Enter PIN to confirm</label><input class="fi" type="password" id="reset_pin" placeholder="Enter your PIN" autofocus></div><div id="resetPinErr" class="ferr"></div><div class="ma"><button class="btn bs" onclick="document.getElementById(\'mresetauth\').remove();document.body.style.overflow=\'\'">Cancel</button><button class="btn bd" onclick="verifyResetPin(\'' + resetType + '\')">Confirm Reset</button></div></div></div>';
  document.body.insertAdjacentHTML('beforeend', h);
  document.body.style.overflow = 'hidden';
  if (typeof lucide !== 'undefined') lucide.createIcons();
  setTimeout(function() { var inp = document.getElementById('reset_pin'); if (inp) inp.focus(); }, 100);
}

function verifyResetPin(resetType) {
  var pin = document.getElementById('reset_pin').value;
  verifyPIN(pin).then(function(valid) {
    if (valid) {
      document.getElementById('mresetauth').remove();
      document.body.style.overflow = '';
      executeReset(resetType);
    } else {
      var err = document.getElementById('resetPinErr');
      if (err) { err.textContent = '❌ Incorrect PIN. Try again.'; err.classList.add('show'); }
      document.getElementById('reset_pin').value = '';
    }
  });
}

async function verifyResetBiometric(resetType) {
  var success = await ftBiometricAuth();
  if (success) {
    document.getElementById('mresetauth').remove();
    document.body.style.overflow = '';
    executeReset(resetType);
  } else {
    toast('❌ Biometric verification failed');
  }
}

function executeReset(resetType) {
  if (resetType === 'all') {
    if (!confirm('FINAL WARNING: All financial data will be permanently erased. This cannot be undone.')) return;
    localStorage.clear();
    toast('🗑 All data cleared. Reloading...');
    setTimeout(function() { location.reload(); }, 800);
  } else {
    safeSave('ft_txn_data', '[]');
    safeSave('ft_nxId', '100');
    TXN = []; nxId = 100;
    toast('🗑 Transactions cleared');
    render();
  }
}

// === EXPORT/IMPORT ===
function triggerDownload(blob, filename) {
  // Method 1: Try Web Share API (works in mobile PWA)
  if (navigator.canShare && navigator.canShare({ files: [new File([blob], filename)] })) {
    const file = new File([blob], filename, { type: blob.type });
    navigator.share({ files: [file], title: filename }).catch(function() {
      // User cancelled share, fall through to method 2
      fallbackDownload(blob, filename);
    });
    return;
  }
  fallbackDownload(blob, filename);
}

function fallbackDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  // Method 2: Standard anchor download
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  // Method 3: If anchor click doesn't trigger (PWA standalone), open in new tab
  setTimeout(function() {
    document.body.removeChild(a);
    // Check if download likely failed (still on same page, no download started)
    // On iOS PWA, window.navigator.standalone is true
    if (window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches) {
      // Open blob in new tab so user can long-press to save
      window.open(url, '_blank');
    } else {
      URL.revokeObjectURL(url);
    }
  }, 1000);
}

function exportJSON() {
  const data = { version: 'fintrack-' + FINTRACK_VERSION, exportedAt: new Date().toISOString(), transactions: TXN, schema: SCHEMA, accounts: ACCOUNTS, goals: GOALS, settings: { currency: displayCurrency, language: currentLang, theme: document.documentElement.dataset.theme } };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  triggerDownload(blob, `fintrack-backup-${new Date().toISOString().split('T')[0]}.json`);
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
  triggerDownload(blob, `fintrack-transactions-${new Date().toISOString().split('T')[0]}.csv`);
  toast('📥 CSV exported');
}

function exportExcel() {
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
  triggerDownload(blob, `fintrack-transactions-${new Date().toISOString().split('T')[0]}.xls`);
  toast('📥 Excel exported');
}

function importExcel(input) {
  const file = input.files[0]; if (!file) return;
  function loadSheetJS(callback) {
    if (window.XLSX) { callback(); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js';
    script.onload = callback;
    script.onerror = () => { const s2 = document.createElement('script'); s2.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; s2.onload = callback; s2.onerror = () => { toast('❌ Failed to load Excel parser.'); input.value = ''; }; document.head.appendChild(s2); };
    document.head.appendChild(script);
  }
  loadSheetJS(() => {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) { toast('❌ No sheets found'); input.value = ''; return; }
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' });
        if (rows.length < 2) { toast('❌ Empty file'); input.value = ''; return; }
        let headerIdx = 0;
        for (let i = 0; i < Math.min(rows.length, 5); i++) { const rowLower = (rows[i] || []).map(c => String(c || '').toLowerCase()).join(' '); if (rowLower.includes('date') && (rowLower.includes('type') || rowLower.includes('category') || rowLower.includes('amount'))) { headerIdx = i; break; } }
        const headers = (rows[headerIdx] || []).map(h => String(h || '').toLowerCase().trim());
        const dataRows = rows.slice(headerIdx + 1).filter(r => r && r.some(c => c !== null && c !== undefined && String(c).trim()));
        if (!dataRows.length) { toast('❌ No data rows'); input.value = ''; return; }
        const findCol = (...keywords) => headers.findIndex(h => keywords.some(k => h.includes(k)));
        const colMap = {};
        colMap.date = findCol('date', 'tarikh', 'dt'); colMap.type = findCol('type', 'jenis', 'category type'); colMap.category = findCol('category', 'kategori', 'cat'); colMap.subcategory = findCol('subcategory', 'sub', 'subcat', 'sub category'); colMap.amount = findCol('amount', 'jumlah', 'amt', 'value', 'total'); colMap.description = findCol('description', 'desc', 'details', 'note', 'keterangan', 'remark'); colMap.account = findCol('account', 'akaun', 'acc', 'bank');
        if (colMap.date < 0 && colMap.amount < 0) { if (headers.length >= 5) { colMap.date = 0; colMap.type = 1; colMap.category = 2; colMap.subcategory = 3; colMap.amount = 4; colMap.description = 5; colMap.account = 6; } else { toast('❌ Cannot detect columns'); input.value = ''; return; } }
        const detected = Object.entries(colMap).filter(([k,v]) => v >= 0).map(([k,v]) => k + '="' + (headers[v] || 'col' + v) + '"').join(', ');
        if (!confirm(`Found ${dataRows.length} rows in sheet "${sheetName}".\nColumns: ${detected}\n\nThis will ADD new transactions. Continue?`)) { input.value = ''; return; }
        let added = 0, skipped = 0;
        dataRows.forEach(row => {
          const getVal = (col) => col >= 0 && col < row.length ? String(row[col] || '').trim() : '';
          let d = getVal(colMap.date); const tp = getVal(colMap.type) || 'Expense'; const cat = getVal(colMap.category); const sub = getVal(colMap.subcategory); let amtStr = getVal(colMap.amount); const desc = getVal(colMap.description); const accName = getVal(colMap.account);
          amtStr = amtStr.replace(/[^\d.\-\(\)]/g, ''); if (amtStr.includes('(') && amtStr.includes(')')) amtStr = '-' + amtStr.replace(/[\(\)]/g, ''); const parsedAmt = parseFloat(amtStr); if (!parsedAmt || parsedAmt === 0) { skipped++; return; }
          if (d) { if (/^\d{4}-\d{2}-\d{2}/.test(d)) { d = d.substring(0, 10); } else if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(d)) { const parts = d.split(/[\/\-]/); d = `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`; } else if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2}$/.test(d)) { const parts = d.split(/[\/\-]/); d = `20${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`; } else if (/^\d{5}$/.test(d)) { const excelEpoch = new Date(1899, 11, 30); const parsed = new Date(excelEpoch.getTime() + parseInt(d) * 86400000); d = parsed.toISOString().split('T')[0]; } else { const parsed = new Date(d); if (!isNaN(parsed.getTime())) d = parsed.toISOString().split('T')[0]; else { skipped++; return; } } } else { skipped++; return; }
          if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) { skipped++; return; }
          let normalizedType = tp; const tpLower = tp.toLowerCase(); if (tpLower.includes('income') || tpLower.includes('pendapatan') || tpLower.includes('gaji')) normalizedType = 'Income'; else if (tpLower.includes('saving') || tpLower.includes('simpanan') || tpLower.includes('tabung')) normalizedType = 'Savings'; else if (tpLower.includes('expense') || tpLower.includes('belanja') || tpLower.includes('perbelanjaan')) normalizedType = 'Expense'; else if (!['Income', 'Expense', 'Savings'].includes(tp)) normalizedType = 'Expense';
          const accMatch = accName ? ACCOUNTS.find(a => a.name.toLowerCase() === accName.toLowerCase()) : null;
          TXN.push({ id: nxId++, d, t: normalizedType, c: cat || 'Uncategorized', s: sub, a: Math.abs(parsedAmt), dt: desc, acc: accMatch ? accMatch.id : undefined }); added++;
        });
        saveTXN(); toast(`✅ Imported ${added} transactions${skipped ? ' (' + skipped + ' skipped)' : ''}`);
      } catch (err) { toast('❌ Error: ' + (err.message || 'Unknown')); console.error('Excel import error:', err); }
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
      // Schema validation (#9): sanitize and validate each transaction
      let skipped = 0;
      const validTxns = data.transactions.filter(tx => {
        if (!tx.id && tx.id !== 0) { skipped++; return false; }
        if (!tx.d || !tx.t) { skipped++; return false; }
        if (typeof tx.a === 'string') tx.a = parseFloat(tx.a) || 0;
        if (typeof tx.a !== 'number' || isNaN(tx.a)) { skipped++; return false; }
        if (!['Income', 'Expense', 'Savings', 'Transfer'].includes(tx.t)) tx.t = 'Expense';
        if (tx.dt) tx.dt = String(tx.dt).replace(/<[^>]*>/g, '');
        if (tx.c) tx.c = String(tx.c).replace(/<[^>]*>/g, '');
        if (tx.s) tx.s = String(tx.s).replace(/<[^>]*>/g, '');
        return true;
      });
      const count = validTxns.length;
      if (!confirm(`Import ${count} transactions${skipped ? ' (' + skipped + ' invalid skipped)' : ''}${data.accounts ? ', ' + data.accounts.length + ' accounts' : ''}? This will MERGE with existing data.`)) return;
      const existingIds = new Set(TXN.map(tx => tx.id));
      let added = 0;
      validTxns.forEach(tx => { if (!existingIds.has(tx.id)) { TXN.push(tx); added++; } });
      if (data.accounts && Array.isArray(data.accounts)) { const existingAccIds = new Set(ACCOUNTS.map(a => a.id)); data.accounts.forEach(acc => { if (!existingAccIds.has(acc.id)) ACCOUNTS.push(acc); }); saveACCOUNTS(); }
      if (data.schema) { Object.entries(data.schema).forEach(([type, cats]) => { if (!SCHEMA[type]) SCHEMA[type] = {}; Object.entries(cats).forEach(([cat, subs]) => { if (!SCHEMA[type][cat]) SCHEMA[type][cat] = []; subs.forEach(sub => { if (!SCHEMA[type][cat].includes(sub)) SCHEMA[type][cat].push(sub); }); }); }); saveSCHEMA(); }
      nxId = Math.max(nxId, ...TXN.map(tx => tx.id)) + 1;
      saveTXN(); toast(`✅ Imported ${added} new transactions`);
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
      saveTXN(); toast(`✅ Imported ${added} transactions from CSV`);
    } catch (err) { toast('❌ Error reading CSV file'); console.error('CSV import error:', err); }
    input.value = '';
  };
  reader.readAsText(file);
}

// === SHARED SETTINGS HANDLERS ===
async function handleCurrencyChange(currency) {
  const statusEl = document.getElementById('rateStatus');
  if (statusEl) statusEl.textContent = t('set_fetching');
  const success = await fetchExchangeRates();
  if (!success && statusEl) statusEl.textContent = t('set_rate_failed');
  else if (statusEl) statusEl.textContent = `${t('set_rate_info')}: ${new Date().toLocaleString()}`;
  setCurrency(currency);
}

async function chgPK() {
  const cur = document.getElementById('spkc')?.value, nw = document.getElementById('spkn')?.value;
  const valid = await verifyPIN(cur);
  if (!valid) { toast(t('set_pk_wrong')); return; }
  if (!nw || nw.length < 4) { toast(t('set_pk_min')); return; }
  await setPINSecure(nw);
  toast(t('set_pk_ok'));
  // Prompt recovery setup if not done
  if (!hasRecoverySetup() && !hasSecurityQuestions()) {
    if (confirm('Would you like to set up a recovery method? This lets you reset your PIN if you forget it.')) {
      showFirstTimeSecuritySetup();
    }
  }
}

async function generateNewRecoveryCode() {
  const code = await setupRecoveryCode();
  showRecoveryCodeDisplay(code);
}

// Forgot PIN from Settings page
function forgotPINFromSettings() {
  const hasCode = typeof hasRecoverySetup === 'function' && hasRecoverySetup();
  const hasQ = typeof hasSecurityQuestions === 'function' && hasSecurityQuestions();
  if (hasCode || hasQ) {
    showForgotPIN();
  } else {
    // No recovery: direct emergency reset
    if (!confirm('No recovery method set up. Reset PIN now?\n\nYour financial data will NOT be deleted.')) return;
    localStorage.removeItem('ft_pk_hash');
    localStorage.removeItem('ft_pk');
    safeSave('ft_pk_hash', '');
    safeSave('ft_pk', '');
    toast('✅ PIN cleared. You can set a new one now.');
    renderSecurityTab(document.getElementById('setc'));
  }
}

// === NOTIFICATION MANAGER ===
function renderNotificationsTab(c) {
  let html = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><div style="display:flex;align-items:center;gap:10px"><div style="width:32px;height:32px;border-radius:8px;background:var(--accent-light);color:var(--accent);display:flex;align-items:center;justify-content:center"><i data-lucide="bell" width="15" height="15"></i></div><div><div style="font-size:13px;font-weight:600">Notification Manager</div><div style="font-size:10px;color:var(--text-tertiary)">Manage reminders and alerts</div></div></div><button class="btn bp" style="font-size:11px;padding:5px 12px" onclick="openReminderModal()"><i data-lucide="plus" width="11" height="11"></i> New Reminder</button></div>`;
  if (!REMINDERS.length) { html += `<div style="padding:40px;text-align:center;border:1px solid var(--border);border-radius:12px"><div style="font-size:28px;margin-bottom:8px">🔔</div><div style="font-size:12px;color:var(--text-tertiary)">No reminders yet. Create one above.</div></div>`; }
  else { html += `<div style="display:flex;flex-direction:column;gap:8px">`; REMINDERS.forEach(r => { const rDate = new Date(r.date); const today = new Date(); today.setHours(0,0,0,0); rDate.setHours(0,0,0,0); const diff = Math.ceil((rDate - today) / (1000*60*60*24)); const statusIcon = r.completed ? '✅' : diff < 0 ? '🔴' : diff <= 3 ? '🟡' : '🟢'; const freq = r.repeat === 'monthly' ? 'Monthly' : r.repeat === 'yearly' ? 'Yearly' : 'One-time'; const priorityColor = r.priority === 'high' ? 'var(--rose)' : r.priority === 'medium' ? 'var(--amber)' : 'var(--text-tertiary)'; const priorityLabel = r.priority ? r.priority.charAt(0).toUpperCase() + r.priority.slice(1) : 'Low'; const timingStr = r.timing ? r.timing.map(t => t + 'd before').join(', ') : ''; html += `<div style="border:1px solid var(--border);border-radius:10px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;transition:all 150ms${r.completed ? ';opacity:0.5' : ''}"><div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:6px;margin-bottom:3px"><span style="font-size:13px;font-weight:600">${statusIcon} ${r.title}</span><span style="font-size:8px;font-weight:600;color:${priorityColor};padding:1px 5px;border-radius:3px;border:1px solid ${priorityColor};text-transform:uppercase">${priorityLabel}</span></div><div style="font-size:10px;color:var(--text-tertiary);display:flex;gap:8px;flex-wrap:wrap;margin-top:2px"><span>📅 ${r.date}${r.time ? ' · 🕐 ' + r.time : ''}</span><span>🔁 ${freq}</span>${timingStr ? `<span>⏰ ${timingStr}</span>` : ''}</div>${r.description ? `<div style="font-size:10px;color:var(--text-secondary);margin-top:3px">${r.description}</div>` : ''}</div><div style="display:flex;align-items:center;gap:8px;flex-shrink:0"><span style="font-size:10px;font-weight:600;color:${diff < 0 ? 'var(--rose)' : diff <= 3 ? 'var(--amber)' : 'var(--text-tertiary)'}">${r.completed ? 'Done' : diff < 0 ? Math.abs(diff) + 'd overdue' : diff === 0 ? 'Today' : diff + 'd left'}</span><button class="abtn" style="width:22px;height:22px;font-size:9px" onclick="editReminder(${r.id})">✏️</button><button class="abtn del" style="width:22px;height:22px;font-size:9px" onclick="deleteReminder(${r.id})">🗑</button></div></div>`; }); html += `</div>`; }
  c.innerHTML = html; lucide.createIcons();
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
  if (editId) { const idx = REMINDERS.findIndex(r => r.id === editId); if (idx >= 0) REMINDERS[idx] = { ...REMINDERS[idx], ...data }; toast('✅ Reminder updated'); }
  else { data.id = reminderNxId++; REMINDERS.push(data); toast('✅ Reminder created'); }
  saveREMINDERS();
  document.getElementById('mremind').remove(); document.body.style.overflow = '';
  renderGenSub('notif');
  updateNotifBadge();
}

function editReminder(id) { const r = REMINDERS.find(x => x.id === id); if (r) openReminderModal(r); }

function deleteReminder(id) {
  if (!confirm('Delete this reminder?')) return;
  REMINDERS = REMINDERS.filter(r => r.id !== id);
  saveREMINDERS();
  toast('🗑 Reminder deleted');
  renderGenSub('notif');
  updateNotifBadge();
}

// === NOTIFICATION BELL — functions in helpers.js ===
// updateNotifBadge, toggleNotifPanel, completeReminder, dismissReminder
// are all defined in helpers.js (loaded before settings.js)div class="nsec">System</div><div class="sni" onclick="checkForUpdates()"><i data-lucide="refresh-cw" width="14" height="14"></i>Check for Updates</div><
