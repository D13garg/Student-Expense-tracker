/* dashboard.js – dashboard title + summary rendering. */

/* ============ SHARED FUNCTION USED FOR THE INTENTIONAL MERGE CONFLICT ============
 * Do not edit this function until you follow MERGE_CONFLICT_GUIDE.md.
 * Its return value is displayed as the heading on the Dashboard page and
 * in the browser tab title (see renderTitle() below).
 * ================================================================================= */
function getDashboardTitle() {
    return "Student Expense Tracker";
}
/* ============================== END OF SHARED FUNCTION ============================ */

(function (w) {
  'use strict';
  const SW = w.SW, U = SW.Utils;
  const setText = (id, text) => { const el = U.$('#' + id); if (el) el.textContent = text; };

  /** Interface integration point: shows getDashboardTitle() in the page. */
  function renderTitle() {
    const title = getDashboardTitle();
    setText('dashboardTitle', title);
    document.title = 'SpendWise | ' + title;
    setText('dashboardSubtitle', U.monthLabel(U.monthKey()) + ' overview');
  }

  function renderAlert(st) {
    const el = U.$('#budgetAlert');
    if (st.level !== 'warning' && st.level !== 'over') { el.hidden = true; return; }
    const over = st.categories.filter((c) => c.level === 'over').map((c) => c.name);
    const icon = st.level === 'over' ? 'fa-circle-exclamation' : 'fa-triangle-exclamation';
    let msg = SW.Budget.message(st);
    if (over.length) msg += ' Over category limit: ' + over.join(', ') + '.';
    el.className = 'alert ' + st.level;
    el.innerHTML = `<i class="fa-solid ${icon}"></i><span></span>`;
    el.querySelector('span').textContent = msg;
    el.hidden = false;
  }

  function renderTopCategories() {
    const box = U.$('#topCategories');
    const all = SW.Expenses.expenseByCategory(U.monthKey());
    if (!all.length) { box.innerHTML = '<p class="muted">No expenses recorded this month.</p>'; return; }
    const total = all.reduce((s, r) => s + r.total, 0);
    box.innerHTML = all.slice(0, 5).map((r) => {
      const pct = total > 0 ? (r.total / total) * 100 : 0;
      return `<div class="cat-bar"><div class="cat-bar-head"><span>${U.escapeHtml(r.name)}</span><span>${U.formatCurrency(r.total)} (${Math.round(pct)}%)</span></div>
        <div class="progress"><div class="progress-fill" style="width:${pct}%;background:${r.color}"></div></div></div>`;
    }).join('');
  }

  function render() {
    renderTitle();
    const all = SW.Expenses.summarize(SW.Expenses.getAll());
    const st = SW.Budget.status();
    setText('statBalance', U.formatCurrency(all.balance));
    U.$('#statBalance').classList.toggle('negative', all.balance < 0);
    setText('statIncome', U.formatCurrency(all.income));
    setText('statExpense', U.formatCurrency(all.expense));
    setText('statBudget', st.limit > 0 ? U.formatCurrency(st.limit) : 'Not set');
    setText('statRemaining', st.limit > 0 ? U.formatCurrency(st.remaining) : '—');
    U.$('#statRemaining').classList.toggle('negative', st.limit > 0 && st.remaining < 0);
    setText('statUtilization', st.limit > 0 ? Math.round(st.pct) + '%' : '—');

    const bar = U.$('#dashBudgetBar');
    bar.className = 'progress-fill ' + (st.level === 'none' ? '' : st.level);
    bar.style.width = (st.limit > 0 ? Math.min(100, st.pct) : 0) + '%';
    setText('dashBudgetText', st.limit > 0
      ? `${U.formatCurrency(st.spent)} of ${U.formatCurrency(st.limit)} spent this month`
      : 'No monthly budget yet. Set one on the Budget page to track your spending.');
    renderAlert(st);
    renderTopCategories();
  }

  SW.Dashboard = { render, renderTitle };
})(window);
