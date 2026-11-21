/* app.js – application bootstrap: navigation, theme, settings, sample data. */
(function (w) {
  'use strict';
  const SW = w.SW, U = SW.Utils, $ = U.$;
  const VIEWS = { dashboard: 'Dashboard', transactions: 'Transactions', budget: 'Budget', analytics: 'Analytics', settings: 'Settings' };
  let currentView = 'dashboard';

  function renderAll() {
    SW.Dashboard.render();
    SW.Expenses.render();
    SW.Budget.render();
    $('#thresholdInput').value = SW.Storage.getSettings().warningThreshold;
    if (currentView === 'analytics') SW.Charts.render();
  }

  /* ---------- navigation ---------- */
  function navigate(view) {
    if (!VIEWS[view]) view = 'dashboard';
    currentView = view;
    U.$$('.view').forEach((v) => v.classList.toggle('active', v.id === 'view-' + view));
    U.$$('.nav-link').forEach((a) => { const on = a.dataset.view === view; a.classList.toggle('active', on); on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'); });
    $('#pageTitle').textContent = VIEWS[view];
    closeSidebar();
    if (view === 'analytics') SW.Charts.render();
    w.scrollTo(0, 0);
  }
  const openSidebar = () => { $('#sidebar').classList.add('open'); $('#sidebarOverlay').classList.add('open'); };
  function closeSidebar() { $('#sidebar').classList.remove('open'); $('#sidebarOverlay').classList.remove('open'); }

  /* ---------- theme ---------- */
  function applyTheme(theme, save) {
    document.documentElement.dataset.theme = theme;
    const dark = theme === 'dark';
    $('#themeToggle').innerHTML = `<i class="fa-solid ${dark ? 'fa-sun' : 'fa-moon'}"></i>`;
    $('#themeToggle').setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    if (save) SW.Storage.saveTheme(theme);
    if (currentView === 'analytics') SW.Charts.render();
  }

  /* ---------- settings & data ---------- */
  function saveSettings() {
    const input = $('#thresholdInput'), err = $('#thresholdError');
    const n = Number(input.value);
    if (input.value.trim() === '' || !Number.isInteger(n) || n < 50 || n > 99) {
      err.textContent = 'Enter a whole number from 50 to 99.'; input.classList.add('invalid'); return;
    }
    err.textContent = ''; input.classList.remove('invalid');
    SW.Storage.saveSettings({ warningThreshold: n });
    SW.UI.toast('Settings saved.', 'success');
    renderAll();
  }
  async function loadSample() {
    if (SW.Expenses.getAll().length) {
      const ok = await SW.UI.confirm({ title: 'Add sample data?', message: 'Example transactions will be added to your existing data.', confirmText: 'Add sample data', danger: false });
      if (!ok) return;
    }
    SW.Expenses.importRecords(SW.Sample.generate());
    SW.Budget.setDefaults(SW.Sample.budget.monthly, SW.Sample.budget.categories);
    SW.UI.toast('Sample data added.', 'success');
  }
  async function clearAll() {
    const ok = await SW.UI.confirm({ title: 'Delete all data?', message: 'All transactions and budgets will be permanently removed from this browser.', confirmText: 'Delete everything', danger: true });
    if (!ok) return;
    SW.Expenses.clearAll(); SW.Budget.clearAll();
    SW.UI.toast('All data deleted.', 'success');
  }

  function init() {
    SW.Expenses.init(); SW.Budget.init(); SW.Charts.init();
    applyTheme(SW.Storage.getTheme() || (w.matchMedia && w.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'), false);

    $('#themeToggle').addEventListener('click', () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark', true));
    $('#addTxBtn').addEventListener('click', () => SW.Expenses.openForm());
    $('#menuBtn').addEventListener('click', openSidebar);
    $('#sidebarOverlay').addEventListener('click', closeSidebar);
    $('#saveSettings').addEventListener('click', saveSettings);
    $('#clearAll').addEventListener('click', clearAll);
    document.addEventListener('click', (e) => { if (e.target.closest('[data-load-sample]')) loadSample(); });
    U.$$('.modal').forEach((m) => m.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) SW.UI.closeModal(m); }));
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const open = $('.modal.open'); if (open) { const c = open.querySelector('[data-close]'); c ? c.click() : SW.UI.closeModal(open); }
      closeSidebar();
    });
    w.addEventListener('hashchange', () => navigate(location.hash.slice(1)));
    document.addEventListener('sw:data-changed', renderAll);

    renderAll();
    navigate(location.hash.slice(1));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})(window);
