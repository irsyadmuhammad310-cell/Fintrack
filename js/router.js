// === NAVIGATION & ROUTING (V2.0.0) ===
document.querySelectorAll('.ni').forEach(el => el.addEventListener('click', () => {
  document.querySelectorAll('.ni').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
  // Auto-close sidebar on mobile
  if (window.innerWidth <= 900) {
    document.getElementById('sb').classList.remove('open');
    const overlay = document.getElementById('sbOverlay');
    if (overlay) overlay.remove();
  }
  navigate(el.dataset.page);
}));

// v15.3.1: FAB logic
function updateMobileFAB(page) {
  if (window.innerWidth > 900) return;
  const addFab = document.getElementById('mobGlobalFab');
  const aiFab = document.getElementById('aiFab');
  if (page === 'dashboard' || page === 'transactions' || page === 'accounts') {
    if (addFab) { addFab.style.display = 'flex'; addFab.style.visibility = 'visible'; }
    if (aiFab) { aiFab.style.display = 'none'; aiFab.style.visibility = 'hidden'; }
  } else {
    if (addFab) { addFab.style.display = 'none'; addFab.style.visibility = 'hidden'; }
    if (aiFab) { aiFab.style.display = 'block'; aiFab.style.visibility = 'visible'; }
  }
}

function syncBottomNav(page) {
  document.querySelectorAll('.bnav-item').forEach(i => i.classList.remove('active'));
  const bnItem = document.querySelector(`.bnav-item[data-page="${page}"]`) ||
                 document.querySelector('.bnav-item[data-page="settings"]');
  if (bnItem) bnItem.classList.add('active');
}

function render() {
  const c = document.getElementById('cnt');
  // V2.0.4: a crash on one page shows the error on screen (screenshot it) instead of a dead tab
  try {
    switch (curPage) {
      case 'dashboard': renderDashboard(c); break;
      case 'transactions': renderTransactions(c); break;
      case 'investments': renderInvestments(c); break;
      case 'goals': renderGoals(c); break;
      case 'accounts': renderAccounts(c); break;
      case 'analytics': renderAnalytics(c); break;
      case 'reports': renderReports(c); break;
      case 'settings': renderSettings(c); break;
    }
  } catch (e) {
    console.error('[FinTrack] Page render error:', curPage, e);
    const msg = String((e && e.message) || e).replace(/[<>&]/g, '');
    const where = String((e && e.stack) || '').split('\n').slice(0, 3).join(' | ').replace(/[<>&]/g, '');
    c.innerHTML = '<div style="padding:40px 20px;text-align:center"><div style="font-size:32px;margin-bottom:10px">⚠️</div><div style="font-size:14px;font-weight:600;color:var(--text-primary);margin-bottom:6px">This page crashed: ' + curPage + '</div><div style="font-size:12px;color:var(--rose);margin-bottom:8px">' + msg + '</div><div style="font-size:10px;color:var(--text-tertiary);word-break:break-all">' + where + '</div><div style="font-size:11px;color:var(--text-secondary);margin-top:12px">Your data is safe. Screenshot this and send it over.</div></div>';
  }
  try { updateNotifBadge(); } catch (e) {}
}

function refresh() { render(); }

// === HARDWARE BACK BUTTON (Android / PWA) ===
// Uses browser history API: each navigation pushes state.
// Back button pops history → navigates back. Double-back on Home exits app.
let _lastBackTime = 0;

function navigate(page) {
  curPage = page;
  // Push to browser history so hardware back button works
  if (history.state?.page !== page) {
    history.pushState({ page }, '', '');
  }
  // V2.0.1: Title removed from header for cleaner look
  document.getElementById('pt').textContent = '';
  document.getElementById('ps').textContent = page === 'dashboard' ? getGreeting() : '';

  // Set default month filter per tab (first visit only, then preserve user's selection)
  const mf = document.getElementById('mf');
  if (mf) {
    if ((page === 'dashboard' || page === 'analytics') && !window._dashFilterSet) {
      mf.value = 'total';
      window._dashFilterSet = true;
    } else if ((page === 'transactions' || page === 'goals') && !window._txnFilterSet) {
      mf.value = String(new Date().getMonth());
      window._txnFilterSet = true;
    }
  }

  // Sync sidebar nav
  document.querySelectorAll('.ni').forEach(i => i.classList.remove('active'));
  const sidebarItem = document.querySelector(`.ni[data-page="${page}"]`);
  if (sidebarItem) sidebarItem.classList.add('active');

  // Sync bottom nav (mobile)
  syncBottomNav(page);

  // v15.3.1: Toggle FABs based on active tab (mobile only)
  updateMobileFAB(page);

  render();
}

// Listen for popstate (hardware back button)
window.addEventListener('popstate', function(e) {
  // Close any open modals first
  const modal = document.querySelector('.mo.show') || document.querySelector('.bsheet.show') || document.getElementById('coverSheet') || document.getElementById('mobTxnSheet');
  if (modal) {
    modal.remove();
    document.body.style.overflow = '';
    // Re-push current state so next back still works
    history.pushState({ page: curPage }, '', '');
    return;
  }

  // If we have a previous page in state, go there
  if (e.state && e.state.page) {
    curPage = e.state.page;
    syncBottomNav(curPage);
    updateMobileFAB(curPage);
    render();
    return;
  }

  // If on dashboard (home), double-back to exit
  if (curPage === 'dashboard') {
    const now = Date.now();
    if (now - _lastBackTime < 2000) {
      // Double back: actually exit by not preventing default
      // Let the browser handle the back (exits PWA or goes to previous page)
      return;
    }
    _lastBackTime = now;
    toast('Press back again to exit');
    // Push state back so we don't actually leave yet
    history.pushState({ page: 'dashboard' }, '', '');
    return;
  }

  // Otherwise go back to dashboard
  navigate('dashboard');
});
