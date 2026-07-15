// === INIT (v11.5 Modular Boot) ===
document.addEventListener("DOMContentLoaded", () => lucide.createIcons());

// Populate header year dropdown
document.getElementById('yf').innerHTML = buildYearOptions(CURRENT_YEAR);

// === USER NAME & GREETING ===
function getUserName() { return localStorage.getItem('ft_username') || ''; }
function getUserTitle() { return localStorage.getItem('ft_user_title') || ''; }
function setUserName(name) { localStorage.setItem('ft_username', name); updateUserDisplay(); }
function setUserTitle(title) { localStorage.setItem('ft_user_title', title); }

function getGreeting() {
  const h = new Date().getHours();
  const name = getUserName() || '';
  const title = getUserTitle();
  const displayName = title && name ? `${title} ${name}` : title ? title : name ? name : '';
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  // Time-based greetings
  let timeGreets;
  if (h < 6) timeGreets = ['Still up?', 'Burning the midnight oil,', 'Late night grind,', 'Night owl mode,'];
  else if (h < 12) timeGreets = ['Good morning,', 'Morning,', 'Rise and shine,', 'Top of the morning,', 'Fresh start today,'];
  else if (h < 17) timeGreets = ['Good afternoon,', 'Afternoon,', 'Hey,', 'What\'s good,'];
  else if (h < 21) timeGreets = ['Good evening,', 'Evening,', 'Hey there,', 'Welcome back,'];
  else timeGreets = ['Good evening,', 'Night shift?', 'Back again,', 'Hey,'];

  // Welcome back variations
  const welcomes = [
    'Let\'s check your numbers.',
    'Your finances await.',
    'Ready to crush it.',
    'Money moves time.',
    'Let\'s see where you stand.',
    'Time to level up.',
    'Your dashboard is ready.',
    ''
  ];

  const timeGreet = pick(timeGreets);
  const welcome = pick(welcomes);

  if (displayName) {
    return `${timeGreet} ${displayName}. ${welcome}`.trim();
  }
  return `${timeGreet.replace(',', '.')} ${welcome}`.trim();
}

function getUserInitials() {
  const name = getUserName();
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
}

function updateUserDisplay() {
  const name = getUserName();
  const nameEl = document.querySelector('.sb-user-info div:first-child');
  const avatarEl = document.querySelector('.sb-avatar');
  if (nameEl) nameEl.textContent = name || 'User';
  if (avatarEl) avatarEl.textContent = getUserInitials();
  // Update greeting in header subtitle on dashboard
  if (curPage === 'dashboard') {
    const ps = document.getElementById('ps');
    if (ps) ps.textContent = getGreeting();
  }
}

function init() {
  // Check if encryption is enabled
  if (FT_ENCRYPTION_ENABLED) {
    // Wait for DOM to be ready before showing unlock screen
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() { showUnlockScreen(); });
    } else {
      showUnlockScreen();
    }
    return;
  }
  loadTXN();
  initApp();
}

async function initWithPasskey(passkey) {
  var success = await ftUnlockData(passkey);
  if (!success) { return false; }
  // Decrypt and load all data
  await loadTXNAsync();
  // Decrypt other stores
  var schemaRaw = localStorage.getItem('ft_schema');
  if (schemaRaw) { var dec = await ftDecrypt(schemaRaw); if (dec) { try { SCHEMA = JSON.parse(dec); } catch(e) {} } }
  var accRaw = localStorage.getItem('ft_accounts');
  if (accRaw) { var dec2 = await ftDecrypt(accRaw); if (dec2) { try { ACCOUNTS = JSON.parse(dec2); } catch(e) {} } }
  var goalRaw = localStorage.getItem('ft_goals');
  if (goalRaw) { var dec3 = await ftDecrypt(goalRaw); if (dec3) { try { GOALS = JSON.parse(dec3); } catch(e) {} } }
  var invRaw = localStorage.getItem('ft_investments');
  if (invRaw) { var dec4 = await ftDecrypt(invRaw); if (dec4) { try { INVESTMENTS = JSON.parse(dec4); } catch(e) {} } }
  initApp();
  return true;
}

function showUnlockScreen() {
  var appEl = document.getElementById('app');
  if (appEl) appEl.style.display = 'none';
  var html = '<div id="ftUnlock" style="position:fixed;inset:0;background:var(--bg-primary);z-index:10000;display:flex;align-items:center;justify-content:center"><div style="text-align:center;max-width:360px;width:90%"><div style="width:56px;height:56px;background:linear-gradient(135deg,oklch(0.6 0.2 260),oklch(0.45 0.22 280));border-radius:14px;display:flex;align-items:center;justify-content:center;margin:0 auto 20px"><i data-lucide="lock" width="24" height="24" style="color:#fff"></i></div><div style="font-size:20px;font-weight:700;margin-bottom:6px;color:var(--text-primary)">FinTrack Locked</div><div style="font-size:12px;color:var(--text-secondary);margin-bottom:24px">Enter your passkey to decrypt and access your data</div><div style="position:relative;margin-bottom:12px"><input id="ftUnlockInput" type="password" style="width:100%;padding:12px 44px 12px 12px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:16px;text-align:center;outline:none" placeholder="Enter passkey"><button id="ftUnlockEye" type="button" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);border:none;background:none;color:var(--text-tertiary);cursor:pointer;font-size:16px;padding:4px;line-height:1">👁</button></div><button id="ftUnlockBtn" style="width:100%;padding:12px;border:none;border-radius:8px;background:oklch(0.55 0.2 260);color:#fff;font-size:14px;font-weight:600;cursor:pointer">Unlock</button><div id="ftUnlockErr" style="font-size:11px;color:oklch(0.6 0.2 15);margin-top:10px;display:none">Wrong passkey. Cannot decrypt data.</div></div></div>';
  document.body.insertAdjacentHTML('beforeend', html);
  if (typeof lucide !== 'undefined') lucide.createIcons();
  setTimeout(function() {
    var inp = document.getElementById('ftUnlockInput');
    var btn = document.getElementById('ftUnlockBtn');
    var eye = document.getElementById('ftUnlockEye');
    if (inp) {
      inp.focus();
      inp.addEventListener('keydown', function(e) { if (e.key === 'Enter') { e.preventDefault(); ftDoUnlock(); } });
    }
    if (btn) {
      btn.addEventListener('click', function(e) { e.preventDefault(); ftDoUnlock(); });
      btn.addEventListener('touchend', function(e) { e.preventDefault(); ftDoUnlock(); });
    }
    if (eye) {
      eye.addEventListener('click', function(e) { e.preventDefault(); if (inp.type === 'password') { inp.type = 'text'; eye.textContent = '🙈'; } else { inp.type = 'password'; eye.textContent = '👁'; } });
      eye.addEventListener('touchend', function(e) { e.preventDefault(); if (inp.type === 'password') { inp.type = 'text'; eye.textContent = '🙈'; } else { inp.type = 'password'; eye.textContent = '👁'; } });
    }
  }, 200);
}

async function ftDoUnlock() {
  var input = document.getElementById('ftUnlockInput');
  var passkey = input ? input.value : '';
  if (!passkey) return;
  var success = await initWithPasskey(passkey);
  if (success) {
    document.getElementById('ftUnlock').remove();
    document.getElementById('app').style.display = '';
  } else {
    var err = document.getElementById('ftUnlockErr');
    if (err) err.style.display = 'block';
    if (input) { input.value = ''; input.focus(); }
  }
}

function initApp() {
  const st = localStorage.getItem('theme');
  if (st) {
    document.documentElement.dataset.theme = st;
    if (st === 'dark') document.getElementById('thico').dataset.lucide = 'moon';
  }
  // Load language + currency preferences
  currentLang = localStorage.getItem('ft_lang') || 'en';
  displayCurrency = localStorage.getItem('ft_currency') || 'MYR';
  // Apply CJK font if needed
  if (currentLang === 'zh') document.body.style.fontFamily = "'Noto Sans SC', 'Inter', system-ui, sans-serif";
  else if (currentLang === 'ja') document.body.style.fontFamily = "'Noto Sans JP', 'Inter', system-ui, sans-serif";
  else document.body.style.fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif";
  updateNavLabels();
  // Update month filter with translated names
  const mf = document.getElementById('mf');
  if (mf) {
    const mNames = getMonthNames();
    mf.options[0].textContent = t('hdr_total_year');
    for (let i = 1; i <= 12; i++) mf.options[i].textContent = mNames[i - 1];
  }
  // Set user name in sidebar
  updateUserDisplay();
  lucide.createIcons();
  render();
  // Fetch fresh rates in background
  fetchExchangeRates();
  // Update notification badge
  updateNotifBadge();
  // Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then(function(reg) {
      console.log('SW registered:', reg.scope);
    }).catch(function() {});
  }
  // Show onboarding for first-time users, greeting toast for returning users
  if (!localStorage.getItem('ft_onboarded')) { showOnboarding(); }
  else { setTimeout(() => toast(getGreeting()), 500); }
}

// === FIRST-RUN ONBOARDING (with name + title input) ===
function showOnboarding() {
  var steps = [
    { title: 'Welcome to FinTrack!', desc: 'Your personal finance tracker built to last 30 years. First, what should we call you?', icon: '👋', hasInput: true },
    { title: 'Set Up Categories', desc: 'Go to Settings → Categories to add your Income, Expense, and Savings categories. These are the building blocks for everything.', icon: '📂' },
    { title: 'Add Accounts', desc: 'Go to Settings → Accounts to set up your bank accounts, e-wallets, and cash. This helps track where your money lives.', icon: '🏦' },
    { title: 'Record Transactions', desc: 'Use the Transactions tab to add income, expenses, and savings. This is your single source of truth for all financial data.', icon: '📝' },
    { title: 'Track Goals', desc: 'Set savings goals in the Goals tab. Link them to your Savings categories and they auto-sync from transactions.', icon: '🎯' },
    { title: 'Monitor Investments', desc: 'The Investment tab shows your portfolio, synced from Savings transactions. Add instruments to the Watchlist for live market prices.', icon: '📈' },
    { title: 'Analyze & Report', desc: 'Analytics shows why your finances are changing. Reports lets you export professional P&L statements in PDF, Excel, or CSV.', icon: '📊' },
    { title: 'Secure Your Data', desc: 'Go to Settings → Security to enable AES-256 encryption. Your data will be locked with your passkey.', icon: '🔐' },
    { title: 'You\'re all set!', desc: 'Start by adding categories in Settings, then record your first transaction. Everything updates automatically across all tabs.', icon: '🚀' }
  ];
  var currentStep = 0;

  function renderStep() {
    var s = steps[currentStep];
    var isLast = currentStep === steps.length - 1;
    var isFirst = currentStep === 0;
    var dots = '';
    for (var i = 0; i < steps.length; i++) {
      dots += '<span style="width:8px;height:8px;border-radius:50%;background:' + (i === currentStep ? 'var(--accent)' : 'var(--border)') + ';transition:background 200ms"></span>';
    }
    var html = '<div id="onboardOverlay" style="position:fixed;inset:0;background:oklch(0 0 0/0.6);z-index:9500;display:flex;align-items:center;justify-content:center;animation:fi 300ms ease-out">';
    html += '<div style="background:var(--bg-card);border-radius:16px;padding:36px 32px 28px;max-width:420px;width:90%;text-align:center;box-shadow:var(--shadow-lg)">';
    html += '<div style="font-size:48px;margin-bottom:16px">' + s.icon + '</div>';
    html += '<div style="font-size:18px;font-weight:700;margin-bottom:8px">' + s.title + '</div>';
    html += '<div style="font-size:13px;color:var(--text-secondary);line-height:1.6;margin-bottom:20px;max-width:320px;margin-left:auto;margin-right:auto">' + s.desc + '</div>';
    if (s.hasInput) {
      var savedName = getUserName();
      var savedTitle = getUserTitle();
      html += '<div style="text-align:left;margin-bottom:20px;max-width:280px;margin-left:auto;margin-right:auto">';
      html += '<label style="font-size:11px;font-weight:500;color:var(--text-secondary);display:block;margin-bottom:4px">Your Name</label>';
      html += '<input id="onboardName" class="fi" placeholder="e.g. Irsyad" value="' + (savedName || '') + '" style="margin-bottom:14px;text-align:center;font-size:14px">';
      html += '<label style="font-size:11px;font-weight:500;color:var(--text-secondary);display:block;margin-bottom:6px">How should I greet you?</label>';
      html += '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center">';
      var titles = ['sir','master','boss','bro','chief'];
      titles.forEach(function(ti) {
        var isActive = savedTitle === ti;
        html += '<button type="button" class="btn ' + (isActive ? 'bp' : 'bs') + '" style="font-size:11px;padding:5px 12px;text-transform:capitalize" onclick="onboardSelectTitle(this,\'' + ti + '\')">' + ti + '</button>';
      });
      html += '</div></div>';
    }
    html += '<div style="display:flex;align-items:center;gap:6px;justify-content:center;margin-bottom:20px">' + dots + '</div>';
    html += '<div style="display:flex;gap:8px;justify-content:center">';
    if (!isFirst) html += '<button onclick="onboardPrev()" style="border:1px solid var(--border);background:var(--bg-card);color:var(--text-primary);padding:8px 18px;border-radius:7px;font-family:var(--font);font-size:12px;font-weight:500;cursor:pointer">Back</button>';
    if (isLast) {
      html += '<button onclick="onboardDone()" style="border:none;background:var(--accent);color:#fff;padding:8px 24px;border-radius:7px;font-family:var(--font);font-size:12px;font-weight:600;cursor:pointer">Get Started</button>';
    } else {
      html += '<button onclick="onboardNext()" style="border:none;background:var(--accent);color:#fff;padding:8px 24px;border-radius:7px;font-family:var(--font);font-size:12px;font-weight:600;cursor:pointer">Next</button>';
    }
    html += '</div>';
    if (!isLast) html += '<div style="margin-top:12px"><button onclick="onboardDone()" style="border:none;background:none;color:var(--text-tertiary);font-size:11px;cursor:pointer;font-family:var(--font)">Skip tour</button></div>';
    html += '</div></div>';

    var existing = document.getElementById('onboardOverlay');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', html);
    var nameInput = document.getElementById('onboardName');
    if (nameInput) setTimeout(() => nameInput.focus(), 100);
  }

  window.onboardSelectTitle = function(btn, title) {
    setUserTitle(title);
    btn.parentElement.querySelectorAll('.btn').forEach(b => { b.classList.remove('bp'); b.classList.add('bs'); });
    btn.classList.remove('bs'); btn.classList.add('bp');
  };

  window.onboardNext = function() {
    if (currentStep === 0) { saveOnboardName(); }
    if (currentStep < steps.length - 1) { currentStep++; renderStep(); }
  };
  window.onboardPrev = function() { if (currentStep > 0) { currentStep--; renderStep(); } };
  window.onboardDone = function() {
    if (currentStep === 0) { saveOnboardName(); }
    localStorage.setItem('ft_onboarded', '1');
    var el = document.getElementById('onboardOverlay');
    if (el) el.remove();
    updateUserDisplay();
    setTimeout(() => toast(getGreeting()), 300);
  };

  function saveOnboardName() {
    var nameInput = document.getElementById('onboardName');
    if (nameInput && nameInput.value.trim()) { setUserName(nameInput.value.trim()); }
  }

  renderStep();
}

const rdy = setInterval(() => {
  if (typeof lucide !== 'undefined' && typeof Chart !== 'undefined') {
    clearInterval(rdy);
    init();
  }
}, 50);
