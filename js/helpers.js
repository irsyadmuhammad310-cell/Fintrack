// === HELPERS & UI UTILITIES ===
const getPK = () => localStorage.getItem('ft_pk') || '1234';

// === APP LOCK (PIN + Biometric) ===
var FT_APP_LOCK = localStorage.getItem('ft_app_lock') === 'true';

async function ftBiometricAuth() {
  // Use Web Authentication API (fingerprint/face) if available
  if (!window.PublicKeyCredential) return false;
  try {
    var available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (!available) return false;
    var credential = await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        timeout: 60000,
        userVerification: 'required',
        rpId: location.hostname
      }
    });
    return !!credential;
  } catch (e) { return false; }
}

function enableAppLock() {
  localStorage.setItem('ft_app_lock', 'true');
  FT_APP_LOCK = true;
  toast('🔐 App lock enabled');
}

function disableAppLock() {
  localStorage.removeItem('ft_app_lock');
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
  localStorage.setItem('theme', h.dataset.theme);
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
    if (REMINDERS[i].id === id) { REMINDERS[i].dismissed = true; break; }
  }
  saveREMINDERS();
  updateNotifBadge();
  document.getElementById('notifPanel').remove();
  toggleNotifPanel();
}

function updateNotifBadge() {
  var count = 0;
  for (var i = 0; i < REMINDERS.length; i++) {
    if (!REMINDERS[i].completed && !REMINDERS[i].dismissed) count++;
  }
  var bdg = document.getElementById('notifBdg');
  if (bdg) {
    bdg.textContent = count;
    bdg.style.display = count > 0 ? 'flex' : 'none';
  }
}
