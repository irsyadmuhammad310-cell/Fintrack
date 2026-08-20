// === HELPERS & UI UTILITIES (V2.0.0) ===

// === XSS SANITIZATION (#8) ===
function escapeHTML(str) {
  if (!str) return '';
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// === PRIVACY SCREEN (V2.0.1 — Bank-style tab-switch cover) ===
// Shows a cover overlay instantly when user switches away from the app.
// No PIN needed to dismiss (just return to tab). PIN re-lock is separate (App Lock).
var FT_PRIVACY_SCREEN = safeGet('ft_privacy_screen') === 'true';

function enablePrivacyScreen() { safeSave('ft_privacy_screen', 'true'); FT_PRIVACY_SCREEN = true; toast('🔒 Privacy screen enabled'); }
function disablePrivacyScreen() { safeSave('ft_privacy_screen', 'false'); FT_PRIVACY_SCREEN = false; toast('🔓 Privacy screen disabled'); }

function showPrivacyCover() {
  if (document.getElementById('ftPrivacyCover')) return;
  var html = '<div id="ftPrivacyCover" style="position:fixed;inset:0;background:var(--bg-primary);z-index:9998;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;animation:fi 100ms ease-out"><div style="width:56px;height:56px;background:linear-gradient(135deg,oklch(0.6 0.2 260),oklch(0.45 0.22 280));border-radius:14px;display:flex;align-items:center;justify-content:center"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></div><div style="font-size:14px;font-weight:700;color:var(--text-primary)">FinTrack</div><div style="font-size:11px;color:var(--text-tertiary)">Content hidden for privacy</div></div>';
  document.body.insertAdjacentHTML('beforeend', html);
}

function hidePrivacyCover() {
  var cover = document.getElementById('ftPrivacyCover');
  if (cover) cover.remove();
}

document.addEventListener('visibilitychange', function() {
  if (!FT_PRIVACY_SCREEN) return;
  if (document.hidden) {
    showPrivacyCover();
  } else {
    // Only keep cover if App Lock is enabled AND session expired (unlock screen will handle it)
    if (FT_APP_LOCK && _sessionLocked) return;
    hidePrivacyCover();
  }
});

// === SESSION TIMEOUT (#7) ===
var _idleTimer = null;
var _sessionLocked = false;
function getSessionTimeout() { return parseInt(safeGet('ft_session_timeout') || '300000'); }
function setSessionTimeout(ms) { safeSave('ft_session_timeout', String(ms)); resetIdleTimer(); }
function resetIdleTimer() {
  clearTimeout(_idleTimer);
  _sessionLocked = false;
  var timeout = getSessionTimeout();
  if (timeout <= 0 || !FT_APP_LOCK) return;
  _idleTimer = setTimeout(lockSession, timeout);
}
function lockSession() {
  if (!FT_APP_LOCK) return;
  _sessionLocked = true;
  showUnlockScreen();
}
function initIdleTracking() {
  ['click', 'keydown', 'touchstart', 'mousemove'].forEach(function(evt) {
    document.addEventListener(evt, resetIdleTimer, { passive: true });
  });
  resetIdleTimer();
}

// === HIDE/SHOW AMOUNTS (Eye toggle) ===
function toggleHideAmounts() {
  const hidden = safeGet('ft_hide_amounts') === 'true';
  safeSave('ft_hide_amounts', hidden ? 'false' : 'true');
  applyHideAmounts();
}

function applyHideAmounts() {
  const hidden = safeGet('ft_hide_amounts') === 'true';
  const blur = hidden ? 'blur(8px)' : 'none';
  // Target all money-displaying elements across all tabs
  const selectors = [
    '.mob-dash-amount',          // Mobile dashboard NW
    '.mob-dash-stat-val',        // Mobile dashboard stats
    '.mob-txn-amount',           // Mobile transaction amounts
    '.mob-txn-pill-val',         // Transaction summary pills
    '.kv',                       // Desktop KPI values
    '.bank-balance',             // Bank account cards
    '.goal-kpi-val',             // Goal KPI values
    '.goal-card-num',            // Goal saved/target
    '.goal-detail-num',          // Goal expanded details
    '.goal-card-pct',            // Goal percentage
    '.tsv',                      // Transaction summary values
    '.an-goal-big',              // Analytics goal %
    '.an-inv-row span:last-child', // Analytics investment values
    '.an-health-score',          // Health score number
    '.cover-alert-meta',         // Overspent amounts
    '.budget-prog-amt',          // Budget progress amounts
    '[style*="font-feature-settings"]' // Any element with tnum (money formatting)
  ];
  document.querySelectorAll(selectors.join(',')).forEach(el => {
    el.style.filter = blur;
    el.style.userSelect = hidden ? 'none' : '';
  });
  // Update eye button icon if present
  const eyeBtn = document.getElementById('mobEyeBtn');
  if (eyeBtn) {
    eyeBtn.innerHTML = hidden
      ? '<i data-lucide="eye-off" width="16" height="16"></i>'
      : '<i data-lucide="eye" width="16" height="16"></i>';
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}

// MutationObserver: re-apply blur whenever #cnt content changes (covers all tab switches)
document.addEventListener('DOMContentLoaded', () => {
  const cnt = document.getElementById('cnt');
  if (cnt) {
    const observer = new MutationObserver(() => {
      if (safeGet('ft_hide_amounts') === 'true') {
        setTimeout(applyHideAmounts, 50);
      }
    });
    observer.observe(cnt, { childList: true, subtree: true });
  }
  // Initial apply
  setTimeout(applyHideAmounts, 200);
});

// === PIN SECURITY (v15.7 — SHA-256 hashed) ===
async function hashPIN(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'fintrack_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function getPK() {
  // Legacy: if old plain-text PIN exists, return it (will be migrated on next change)
  const legacy = safeGet('ft_pk');
  if (legacy && legacy.length > 0 && legacy.length < 64) return legacy;
  // Default fallback (also used after emergency reset when ft_pk is cleared)
  return null;
}

function getPKHash() {
  const hash = safeGet('ft_pk_hash') || null;
  // Empty string means PIN was reset/cleared, treat as no hash
  if (!hash || hash.length < 64) return null;
  return hash;
}

async function verifyPIN(inputPin) {
  const storedHash = getPKHash();
  if (storedHash) {
    const inputHash = await hashPIN(inputPin);
    return inputHash === storedHash;
  }
  // Legacy plain-text fallback
  const legacyPK = getPK();
  if (legacyPK) return inputPin === legacyPK;
  // No PIN set at all (after emergency reset): any input passes
  return true;
}

async function setPINSecure(newPin) {
  const hash = await hashPIN(newPin);
  safeSave('ft_pk_hash', hash);
  localStorage.removeItem('ft_pk'); // Remove legacy plain-text
}

// === RECOVERY CODE (v15.7) ===
function generateRecoveryCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += '-';
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function setupRecoveryCode() {
  const code = generateRecoveryCode();
  const codeHash = await hashPIN(code);
  safeSave('ft_recovery_hash', codeHash);
  return code;
}

async function verifyRecoveryCode(inputCode) {
  const storedHash = safeGet('ft_recovery_hash');
  if (!storedHash) return false;
  const cleanCode = inputCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  // Try with and without dashes
  const inputHash = await hashPIN(cleanCode);
  if (inputHash === storedHash) return true;
  // Try original format
  const inputHash2 = await hashPIN(inputCode.trim().toUpperCase());
  return inputHash2 === storedHash;
}

function hasRecoverySetup() {
  return !!safeGet('ft_recovery_hash');
}

// === SECURITY QUESTIONS (v15.7) ===
const SECURITY_QUESTIONS = [
  'What was the name of your first pet?',
  'What city were you born in?',
  'What is your mother\'s maiden name?',
  'What was the name of your first school?',
  'What is your favorite movie?',
  'What street did you grow up on?',
  'What was your childhood nickname?',
  'What is your favorite food?'
];

async function saveSecurityAnswers(q1Index, a1, q2Index, a2) {
  const data = {
    q1: q1Index,
    a1: await hashPIN(a1.trim().toLowerCase()),
    q2: q2Index,
    a2: await hashPIN(a2.trim().toLowerCase())
  };
  safeSave('ft_security_questions', JSON.stringify(data));
}

async function verifySecurityAnswers(a1, a2) {
  const stored = safeGet('ft_security_questions');
  if (!stored) return false;
  const data = JSON.parse(stored);
  const hash1 = await hashPIN(a1.trim().toLowerCase());
  const hash2 = await hashPIN(a2.trim().toLowerCase());
  return hash1 === data.a1 && hash2 === data.a2;
}

function hasSecurityQuestions() {
  return !!safeGet('ft_security_questions');
}

function getSecurityQuestionIndices() {
  const stored = safeGet('ft_security_questions');
  if (!stored) return null;
  const data = JSON.parse(stored);
  return { q1: data.q1, q2: data.q2 };
}

// === APP LOCK (Simple PIN) ===
// Read from localStorage directly (must be sync for boot-time lock screen).
// Also check _ftStore in case localStorage was evicted but IDB has the value.
var FT_APP_LOCK = (function() {
  var val = null;
  try { val = localStorage.getItem('ft_app_lock'); } catch(e) {}
  if (val === null && _ftStore.hasOwnProperty('ft_app_lock')) val = _ftStore['ft_app_lock'];
  return val === 'true';
})();

function enableAppLock() {
  safeSave('ft_app_lock', 'true');
  FT_APP_LOCK = true;
  toast('🔐 App lock enabled');
}

function disableAppLock() {
  safeSave('ft_app_lock', 'false');
  FT_APP_LOCK = false;
  toast('🔓 App lock disabled');
}



const fmt = n => {
  const cfg = CURRENCY_CONFIG[displayCurrency] || CURRENCY_CONFIG.MYR;
  const converted = convertAmount(Math.abs(n));
  const formatted = cfg.symbol + ' ' + converted.toLocaleString(cfg.locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return n < 0 ? '-' + formatted : formatted;
};

const fmtD = n => {
  const cfg = CURRENCY_CONFIG[displayCurrency] || CURRENCY_CONFIG.MYR;
  const converted = convertAmount(n);
  return cfg.symbol + ' ' + converted.toLocaleString(cfg.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// fmtR is now identical to fmt (kept for compatibility with goals.js references)
const fmtR = fmt;

function toast(m) {
  const el = document.getElementById('toast');
  el.textContent = m;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}

function toggleTheme() {
  const h = document.documentElement, d = h.dataset.theme === 'dark';
  h.dataset.theme = d ? 'light' : 'dark';
  document.getElementById('thico').dataset.lucide = d ? 'sun' : 'moon';
  lucide.createIcons();
  safeSave('theme', h.dataset.theme);
  navigate(curPage);
  toast(d ? t('misc_light') : t('misc_dark'));
}

function toggleSB() {
  if (window.innerWidth <= 900) {
    const sb = document.getElementById('sb');
    sb.classList.toggle('open');
    // Add/remove overlay
    let overlay = document.getElementById('sbOverlay');
    if (sb.classList.contains('open')) {
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'sbOverlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:oklch(0 0 0/0.4);z-index:999;transition:opacity 200ms';
        overlay.onclick = function() { sb.classList.remove('open'); overlay.remove(); };
        document.body.appendChild(overlay);
      }
    } else if (overlay) { overlay.remove(); }
  }
  else document.getElementById('app').classList.toggle('collapsed');
}

function getSelectedYear() {
  return parseInt(document.getElementById('yf').value);
}

// === NOTIFICATION PANEL (v10.9.1) ===
function toggleNotifPanel() {
  var panel = document.getElementById('notifPanel');
  if (panel) { panel.remove(); return; }
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var reminders = [];
  for (var i = 0; i < REMINDERS.length; i++) {
    var r = REMINDERS[i];
    if (r.completed) continue;
    if (r.dismissed) continue;
    var rDate = new Date(r.date); rDate.setHours(0, 0, 0, 0);
    var diff = Math.ceil((rDate - today) / (1000 * 60 * 60 * 24));
    // Only show if within timing window or overdue
    var timing = r.timing || [7, 3, 1];
    var maxWindow = Math.max.apply(null, timing);
    if (diff > maxWindow) continue; // not yet in notification window
    reminders.push({ id: r.id, title: r.title, description: r.description || '', date: r.date, time: r.time || '', repeat: r.repeat, priority: r.priority || 'low', daysRemaining: diff, overdue: diff < 0 });
  }
  reminders.sort(function(a, b) { return a.daysRemaining - b.daysRemaining; });
  var isMobile = window.innerWidth <= 600;
  var panelStyle = isMobile ? 'position:fixed;top:0;right:0;bottom:0;left:0;width:100%;max-height:100vh;border-radius:0;z-index:8000;padding:16px;overflow-y:auto;background:var(--bg-card)' : 'position:fixed;top:60px;right:28px;width:360px;max-height:500px;overflow-y:auto;background:var(--bg-card);border:1px solid var(--border);border-radius:12px;box-shadow:var(--shadow-lg);z-index:8000;padding:16px;animation:fi 200ms ease-out';
  var html = '';
  html += '<div id="notifPanel" style="' + panelStyle + '">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">';
  html += '<span style="font-size:14px;font-weight:700">Notifications</span>';
  html += '<button onclick="document.getElementById(\'notifPanel\').remove()" style="border:none;background:none;color:var(--text-tertiary);cursor:pointer;font-size:18px;line-height:1">&times;</button>';
  html += '</div>';
  if (reminders.length === 0) {
    html += '<div style="padding:32px 16px;text-align:center;color:var(--text-tertiary);font-size:12px">No active reminders.</div>';
  } else {
    for (var j = 0; j < reminders.length; j++) {
      var rem = reminders[j];
      var sColor = rem.overdue ? '#e11d48' : rem.daysRemaining <= 1 ? '#d97706' : '#059669';
      var sText = rem.overdue ? 'Overdue ' + Math.abs(rem.daysRemaining) + 'd' : rem.daysRemaining === 0 ? 'Due today' : rem.daysRemaining + 'd left';
      var freq = rem.repeat === 'monthly' ? 'Monthly' : rem.repeat === 'yearly' ? 'Yearly' : 'One-time';
      var prio = rem.priority.charAt(0).toUpperCase() + rem.priority.slice(1);
      var borderStyle = rem.overdue ? 'border-left:3px solid #e11d48;' : 'border-left:3px solid var(--border);';
      html += '<div style="padding:10px 12px;margin-bottom:8px;border-radius:8px;background:var(--bg-primary);' + borderStyle + '">';
      html += '<div style="display:flex;justify-content:space-between;align-items:flex-start">';
      html += '<div style="flex:1;min-width:0">';
      html += '<div style="font-size:12px;font-weight:600;margin-bottom:2px">' + rem.title + '</div>';
      if (rem.description) html += '<div style="font-size:10px;color:var(--text-tertiary);margin-bottom:3px">' + rem.description + '</div>';
      html += '<div style="font-size:10px;color:var(--text-tertiary)">' + rem.date + (rem.time ? ' at ' + rem.time : '') + ' &middot; ' + freq + ' &middot; ' + prio + '</div>';
      html += '</div>';
      html += '<div style="flex-shrink:0;text-align:right">';
      html += '<div style="font-size:9px;font-weight:600;color:' + sColor + ';margin-bottom:4px">' + sText + '</div>';
      html += '<button onclick="completeReminder(' + rem.id + ')" style="border:none;background:#d1fae5;color:#059669;font-size:9px;font-weight:600;padding:2px 6px;border-radius:3px;cursor:pointer;margin-right:4px">Done</button>';
      html += '<button onclick="dismissReminder(' + rem.id + ')" style="border:none;background:var(--bg-secondary);color:var(--text-tertiary);font-size:9px;padding:2px 6px;border-radius:3px;cursor:pointer">Dismiss</button>';
      html += '</div></div></div>';
    }
  }
  html += '</div>';
  document.body.insertAdjacentHTML('beforeend', html);
}

function completeReminder(id) {
  for (var i = 0; i < REMINDERS.length; i++) {
    if (REMINDERS[i].id === id) {
      var r = REMINDERS[i];
      if (r.repeat === 'once') { r.completed = true; }
      else if (r.repeat === 'monthly') { var d = new Date(r.date); d.setMonth(d.getMonth() + 1); r.date = d.toISOString().split('T')[0]; }
      else if (r.repeat === 'yearly') { var d2 = new Date(r.date); d2.setFullYear(d2.getFullYear() + 1); r.date = d2.toISOString().split('T')[0]; }
      r.dismissed = false;
      break;
    }
  }
  saveREMINDERS();
  updateNotifBadge();
  document.getElementById('notifPanel').remove();
  toggleNotifPanel();
  toast('Reminder completed');
}

function dismissReminder(id) {
  for (var i = 0; i < REMINDERS.length; i++) {
    if (REMINDERS[i].id === id) {
      var r = REMINDERS[i];
      if (r.repeat === 'once') {
        // One-time: dismiss permanently
        r.dismissed = true;
      } else {
        // Recurring: advance to next occurrence, reset dismissed so it shows again
        if (r.repeat === 'monthly') {
          var d = new Date(r.date);
          d.setMonth(d.getMonth() + 1);
          r.date = d.toISOString().split('T')[0];
        } else if (r.repeat === 'yearly') {
          var d2 = new Date(r.date);
          d2.setFullYear(d2.getFullYear() + 1);
          r.date = d2.toISOString().split('T')[0];
        }
        r.dismissed = false;
      }
      break;
    }
  }
  saveREMINDERS();
  updateNotifBadge();
  document.getElementById('notifPanel').remove();
  toggleNotifPanel();
}

function updateNotifBadge() {
  var count = 0;
  var today = new Date(); today.setHours(0, 0, 0, 0);
  for (var i = 0; i < REMINDERS.length; i++) {
    var r = REMINDERS[i];
    if (r.completed || r.dismissed) continue;
    var rDate = new Date(r.date); rDate.setHours(0, 0, 0, 0);
    var diff = Math.ceil((rDate - today) / (1000 * 60 * 60 * 24));
    var timing = r.timing || [7, 3, 1];
    var maxWindow = Math.max.apply(null, timing);
    if (diff > maxWindow) continue; // not yet in notification window
    count++;
  }
  var bdg = document.getElementById('notifBdg');
  if (bdg) {
    bdg.textContent = count;
    bdg.style.display = count > 0 ? 'flex' : 'none';
  }
}

// === AUTO-CATEGORIZATION ENGINE (v15.8) ===
const CAT_MEMORY_KEY = 'ft_cat_memory';
const CAT_MEMORY_MAX = 500;

// Preset rules: instant suggestions from day 1 (no learning needed)
// Only store keywords + hints. Actual category/sub resolved from SCHEMA at runtime.
const DEFAULT_CAT_RULES = [
  { keywords: ['fuel', 'petrol', 'diesel', 'shell', 'petronas', 'caltex', 'bp', 'gas station'], t: 'Expense', hint: 'fuel' },
  { keywords: ['grab', 'gojek', 'indriver', 'taxi', 'uber'], t: 'Expense', hint: 'grab' },
  { keywords: ['parking', 'parkir'], t: 'Expense', hint: 'parking' },
  { keywords: ['toll', 'tng', 'touch n go', 'plus highway'], t: 'Expense', hint: 'toll' },
  { keywords: ['mrt', 'lrt', 'bus', 'rapidkl', 'ktm', 'train'], t: 'Expense', hint: 'public transport' },
  { keywords: ['netflix', 'spotify', 'disney', 'youtube premium', 'apple music', 'hbo'], t: 'Expense', hint: 'subscription' },
  { keywords: ['electric', 'tnb', 'tenaga', 'electricity'], t: 'Expense', hint: 'electric' },
  { keywords: ['water', 'air selangor', 'syabas'], t: 'Expense', hint: 'water' },
  { keywords: ['wifi', 'internet', 'unifi', 'maxis', 'celcom', 'digi', 'hotlink', 'time fibre'], t: 'Expense', hint: 'internet' },
  { keywords: ['groceries', 'grocery', 'aeon', 'tesco', 'lotus', 'mydin', 'jaya grocer', 'village grocer', 'cold storage', 'giant'], t: 'Expense', hint: 'groceries' },
  { keywords: ['mcdonald', 'mcd', 'kfc', 'burger king', 'subway', 'pizza hut', 'domino'], t: 'Expense', hint: 'fast food' },
  { keywords: ['starbucks', 'coffee', 'kopi', 'zus', 'tealive'], t: 'Expense', hint: 'cafe' },
  { keywords: ['salary', 'gaji', 'payroll', 'pay day'], t: 'Income', hint: 'salary' },
  { keywords: ['freelance', 'side hustle', 'gig', 'upwork', 'fiverr'], t: 'Income', hint: 'freelance' },
  { keywords: ['shopee', 'lazada', 'amazon', 'aliexpress', 'taobao'], t: 'Expense', hint: 'shopping' },
  { keywords: ['clinic', 'hospital', 'pharmacy', 'farmasi', 'doctor', 'dental', 'dentist'], t: 'Expense', hint: 'health' },
  { keywords: ['gym', 'fitness', 'workout'], t: 'Expense', hint: 'fitness' },
  { keywords: ['rent', 'sewa', 'rental'], t: 'Expense', hint: 'rent' },
  { keywords: ['insurance', 'insurans', 'takaful', 'prudential', 'aia', 'great eastern'], t: 'Expense', hint: 'insurance' },
  { keywords: ['cinema', 'movie', 'gsc', 'tgv'], t: 'Expense', hint: 'movies' },
  // Malay keywords
  { keywords: ['minyak', 'isi minyak', 'pump minyak'], t: 'Expense', hint: 'fuel' },
  { keywords: ['sewa', 'bayar sewa', 'sewa rumah', 'sewa bilik'], t: 'Expense', hint: 'rent' },
  { keywords: ['gaji', 'gaji masuk', 'slip gaji'], t: 'Income', hint: 'salary' },
  { keywords: ['makan', 'makan tengahari', 'makan malam', 'makan pagi', 'tapau', 'bungkus'], t: 'Expense', hint: 'food' },
  { keywords: ['belanja', 'beli barang', 'shopping'], t: 'Expense', hint: 'shopping' },
  { keywords: ['dobi', 'laundry', 'cuci baju'], t: 'Expense', hint: 'laundry' },
  { keywords: ['ubat', 'klinik', 'hospital', 'farmasi'], t: 'Expense', hint: 'health' },
  { keywords: ['potong rambut', 'gunting rambut', 'barber'], t: 'Expense', hint: 'personal' },
  { keywords: ['tambang', 'bas', 'keretapi', 'tiket'], t: 'Expense', hint: 'public transport' },
  { keywords: ['derma', 'sedekah', 'zakat', 'fitrah'], t: 'Expense', hint: 'donation' },
  { keywords: ['simpan', 'tabung', 'saving'], t: 'Savings', hint: 'savings' }
];

// Resolve a hint string to actual category/subcategory from SCHEMA
function resolveHintFromSchema(type, hint) {
  const schema = SCHEMA[type];
  if (!schema) return null;
  const hintLower = hint.toLowerCase();

  // 1. Check if hint matches a subcategory name
  for (const [cat, subs] of Object.entries(schema)) {
    if (Array.isArray(subs)) {
      for (const sub of subs) {
        if (sub.toLowerCase().includes(hintLower) || hintLower.includes(sub.toLowerCase())) {
          return { c: cat, s: sub };
        }
      }
    }
  }

  // 2. Check if hint matches a category name
  for (const cat of Object.keys(schema)) {
    if (cat.toLowerCase().includes(hintLower) || hintLower.includes(cat.toLowerCase())) {
      return { c: cat, s: '' };
    }
  }

  // 3. No match in current schema
  return null;
}

function getCatMemory() {
  return JSON.parse(safeGet(CAT_MEMORY_KEY) || '{}');
}

function saveCatMemory(mem) {
  safeSave(CAT_MEMORY_KEY, JSON.stringify(mem));
}

function normalizeMerchant(text) {
  if (!text) return '';
  return text.toLowerCase().replace(/[0-9#*_\-\/\\().,:;!?@&+=<>{}[\]"'`~^|$%]/g, ' ').replace(/\s+/g, ' ').trim();
}

function learnFromTransaction(tx) {
  if (!tx.dt && !tx.c) return;
  const mem = getCatMemory();
  const keys = [];

  // Learn from description (primary key)
  if (tx.dt) {
    const normalized = normalizeMerchant(tx.dt);
    if (normalized.length >= 2) keys.push(normalized);
    // Also learn individual words (3+ chars) for partial matching
    normalized.split(' ').forEach(word => {
      if (word.length >= 3) keys.push(word);
    });
  }

  // Learn from category name as fallback key
  if (tx.c) {
    const catKey = normalizeMerchant(tx.c);
    if (catKey.length >= 2 && !keys.includes(catKey)) keys.push(catKey);
  }

  const today = new Date().toISOString().split('T')[0];

  keys.forEach(key => {
    if (!mem[key]) {
      mem[key] = { t: tx.t, c: tx.c, s: tx.s || '', count: 1, last: today };
    } else if (mem[key].t === tx.t && mem[key].c === tx.c) {
      // Same categorization: boost count
      mem[key].count++;
      mem[key].last = today;
      if (tx.s) mem[key].s = tx.s;
    } else {
      // Different categorization: check if new one should override
      mem[key].count--;
      if (mem[key].count <= 0) {
        // Override with new categorization
        mem[key] = { t: tx.t, c: tx.c, s: tx.s || '', count: 1, last: today };
      }
    }
  });

  // Evict if over cap (remove lowest count + oldest)
  const entries = Object.entries(mem);
  if (entries.length > CAT_MEMORY_MAX) {
    entries.sort((a, b) => a[1].count - b[1].count || new Date(a[1].last) - new Date(b[1].last));
    const toRemove = entries.slice(0, entries.length - CAT_MEMORY_MAX);
    toRemove.forEach(([key]) => delete mem[key]);
  }

  saveCatMemory(mem);
}

function suggestCategory(description) {
  if (!description || description.trim().length < 2) return null;
  const mem = getCatMemory();
  const normalized = normalizeMerchant(description);
  if (!normalized) return null;

  // 0. Check preset rules FIRST (instant, no learning needed)
  const lowerDesc = normalized;
  for (const rule of DEFAULT_CAT_RULES) {
    for (const keyword of rule.keywords) {
      if (lowerDesc.includes(keyword) || keyword.includes(lowerDesc)) {
        // Resolve hint against actual SCHEMA
        const resolved = resolveHintFromSchema(rule.t, rule.hint);
        if (resolved) {
          return { t: rule.t, c: resolved.c, s: resolved.s, confidence: 'high', count: 99 };
        }
        // If hint doesn't match schema, skip (user may have deleted that category)
        break;
      }
    }
  }

  // 1. Exact full-string match (highest priority)
  if (mem[normalized] && mem[normalized].count >= 2) {
    const confidence = mem[normalized].count >= 5 ? 'high' : 'medium';
    return { t: mem[normalized].t, c: mem[normalized].c, s: mem[normalized].s, confidence, count: mem[normalized].count };
  }

  // 2. Check if any stored key is contained in the input (or vice versa)
  let bestMatch = null;
  let bestScore = 0;

  Object.entries(mem).forEach(([key, val]) => {
    if (key.length < 3) return;
    let score = 0;

    if (normalized.includes(key)) {
      // Input contains a known merchant keyword
      score = val.count * (key.length / normalized.length);
    } else if (key.includes(normalized)) {
      // Known key contains the input (user typing partial)
      score = val.count * (normalized.length / key.length);
    }

    if (score > bestScore && val.count >= 2) {
      bestScore = score;
      bestMatch = val;
    }
  });

  if (bestMatch) {
    const confidence = bestMatch.count >= 5 ? 'medium' : 'low';
    return { t: bestMatch.t, c: bestMatch.c, s: bestMatch.s, confidence, count: bestMatch.count };
  }

  // 3. Word-level matching (check individual words from input)
  const words = normalized.split(' ').filter(w => w.length >= 3);
  let wordMatch = null;
  let wordBestCount = 0;

  words.forEach(word => {
    if (mem[word] && mem[word].count > wordBestCount) {
      wordBestCount = mem[word].count;
      wordMatch = mem[word];
    }
  });

  if (wordMatch && wordBestCount >= 3) {
    return { t: wordMatch.t, c: wordMatch.c, s: wordMatch.s, confidence: 'low', count: wordMatch.count };
  }

  return null;
}

// Bootstrap: learn from all existing transactions on first run
function bootstrapCatMemory() {
  if (safeGet('ft_cat_bootstrapped')) return;
  TXN.forEach(tx => learnFromTransaction(tx));
  safeSave('ft_cat_bootstrapped', '1');
}

// Clear memory (for Settings toggle)
function clearCatMemory() {
  safeSave(CAT_MEMORY_KEY, '{}');
  safeSave('ft_cat_bootstrapped', '');
  toast('🧹 Category memory cleared');
}
