// === NAVIGATION & ROUTING ===
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

function navigate(page) {
  curPage = page;
  const titleKeys = { dashboard: 'nav_dashboard', transactions: 'nav_transactions', investments: 'nav_investments', goals: 'nav_goals', analytics: 'nav_analytics', reports: 'nav_reports', settings: 'nav_settings' };
  document.getElementById('pt').textContent = t(titleKeys[page]) || page;
  document.getElementById('ps').textContent = page === 'dashboard' ? t('dash_subtitle') : '';

  // Sync sidebar nav
  document.querySelectorAll('.ni').forEach(i => i.classList.remove('active'));
  const sidebarItem = document.querySelector(`.ni[data-page="${page}"]`);
  if (sidebarItem) sidebarItem.classList.add('active');

  // Sync bottom nav (mobile)
  syncBottomNav(page);

  // v15.8.2: Toggle mobile FABs based on current page
  const addFab = document.getElementById('mobGlobalFab');
  const aiFab = document.getElementById('aiFab');
  if (addFab) addFab.style.display = (page === 'dashboard' || page === 'transactions') && window.innerWidth <= 900 ? 'flex' : 'none';
  if (aiFab && window.innerWidth <= 900) aiFab.style.display = (page !== 'dashboard' && page !== 'transactions') ? '' : 'none';

  render();
}

function syncBottomNav(page) {
  document.querySelectorAll('.bnav-item').forEach(i => i.classList.remove('active'));
  // Map pages to bottom nav (investments, reports fall under "More"/settings)
  const bnItem = document.querySelector(`.bnav-item[data-page="${page}"]`) ||
                 document.querySelector('.bnav-item[data-page="settings"]');
  if (bnItem) bnItem.classList.add('active');
}

function render() {
  const c = document.getElementById('cnt');
  switch (curPage) {
    case 'dashboard': renderDashboard(c); break;
    case 'transactions': renderTransactions(c); break;
    case 'investments': renderInvestments(c); break;
    case 'goals': renderGoals(c); break;
    case 'analytics': renderAnalytics(c); break;
    case 'reports': renderReports(c); break;
    case 'settings': renderSettings(c); break;
  }
  updateNotifBadge();
}

function refresh() { render(); }
