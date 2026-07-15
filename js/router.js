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
  render();
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
