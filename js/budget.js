/* budget.js – monthly + per-category budgets, status levels, alerts and budget UI. */
(function (w) {
  'use strict';
  const SW = w.SW, U = SW.Utils, $ = U.$, esc = U.escapeHtml;
  const MAX_BUDGET = 1000000000;
  let budgets = { monthly: 0, categories: {} };

  function load() {
    const b = SW.Storage.read(SW.Storage.KEYS.budgets, null);
    budgets = { monthly: 0, categories: {} };
    if (b && typeof b === 'object') {
      if (Number.isFinite(b.monthly) && b.monthly > 0) budgets.monthly = b.monthly;
      Object.entries(b.categories || {}).forEach(([k, v]) => { if (Number.isFinite(v) && v > 0) budgets.categories[k] = v; });
    }
  }
  function persist() {
    if (!SW.Storage.write(SW.Storage.KEYS.budgets, budgets)) SW.UI.toast('Could not save. Browser storage is full or blocked.', 'error');
    document.dispatchEvent(new CustomEvent('sw:data-changed'));
  }

  /** ok | warning | over | none */
  function levelFor(spent, limit) {
    if (!(limit > 0)) return 'none';
    if (spent > limit) return 'over';
    return (spent / limit) * 100 >= SW.Storage.getSettings().warningThreshold ? 'warning' : 'ok';
  }
  function status() {
    const key = U.monthKey();
    const spentByCat = {};
    SW.Expenses.expenseByCategory(key).forEach((r) => { spentByCat[r.name] = r.total; });
    const spent = SW.Expenses.monthSummary(key).expense, limit = budgets.monthly;
    return {
      month: key, limit, spent, remaining: Math.round((limit - spent) * 100) / 100,
      pct: limit > 0 ? (spent / limit) * 100 : 0, level: levelFor(spent, limit),
      categories: SW.CATEGORIES.expense.map((c) => {
        const cl = budgets.categories[c.name] || 0, cs = spentByCat[c.name] || 0;
        return { ...c, limit: cl, spent: cs, pct: cl > 0 ? (cs / cl) * 100 : 0, level: levelFor(cs, cl), remaining: cl - cs };
      })
    };
  }
  const getLevel = () => status().level;
  function message(st) {
    const f = U.formatCurrency;
    if (st.level === 'none') return 'Set a monthly budget to start tracking your spending.';
    if (st.level === 'over') return `You have exceeded your monthly budget by ${f(st.spent - st.limit)}.`;
    if (st.level === 'warning') return `You have used ${Math.round(st.pct)}% of your monthly budget. ${f(st.remaining)} left this month.`;
    return `You're on track. ${f(st.remaining)} left this month.`;
  }
  function notify(prevLevel) {
    const st = status();
    if (st.level === prevLevel) return;
    if (st.level === 'over') SW.UI.toast('Budget exceeded. ' + message(st), 'error');
    else if (st.level === 'warning') SW.UI.toast('Approaching your budget limit. ' + message(st), 'warning');
  }
  function parseAmount(raw) {
    const s = String(raw).trim();
    if (s === '') return { value: 0 };
    const n = Number(s);
    if (!Number.isFinite(n) || n < 0) return { error: 'Enter a positive amount.' };
    if (n > MAX_BUDGET) return { error: 'Amount is too large.' };
    return { value: Math.round(n * 100) / 100 };
  }

  const bar = (pct, level) => `<div class="progress"><div class="progress-fill ${level === 'none' ? '' : level}" style="width:${Math.min(100, Math.max(0, pct))}%"></div></div>`;

  function render() {
    const st = status(), f = U.formatCurrency;
    const icons = { ok: 'fa-circle-check', warning: 'fa-triangle-exclamation', over: 'fa-circle-exclamation', none: 'fa-circle-info' };
    $('#budgetSummary').innerHTML = `
      <div class="mini-stats"><div><p>Budget</p><strong>${st.limit > 0 ? f(st.limit) : 'Not set'}</strong></div>
        <div><p>Spent in ${esc(U.monthLabel(st.month))}</p><strong>${f(st.spent)}</strong></div>
        <div><p>Remaining</p><strong>${st.limit > 0 ? f(st.remaining) : '—'}</strong></div></div>
      ${bar(st.pct, st.level)}
      <div class="budget-msg ${st.level}"><i class="fa-solid ${icons[st.level]}"></i><span>${esc(message(st))}</span></div>`;
    $('#monthlyBudgetInput').value = st.limit > 0 ? st.limit : '';
    $('#categoryBudgets').innerHTML = st.categories.map((c) => {
      let foot = '';
      if (c.limit > 0) {
        const txt = c.level === 'over' ? `Over by ${f(c.spent - c.limit)}` : `${Math.round(c.pct)}% used · ${f(c.remaining)} left`;
        foot = bar(c.pct, c.level) + `<div class="cat-foot ${c.level}">${esc(txt)}</div>`;
      }
      return `<div class="cat-row"><div class="cat-head">
        <span class="tx-icon" style="--chip:${c.color}"><i class="fa-solid ${c.icon}"></i></span>
        <div class="cat-title"><strong>${esc(c.name)}</strong><small>${f(c.spent)} spent this month</small></div>
        <div class="cat-input"><span>₹</span><input type="number" min="0" step="1" inputmode="decimal" data-cat="${esc(c.name)}" value="${c.limit || ''}" placeholder="No limit" aria-label="${esc(c.name)} limit"></div>
      </div>${foot}</div>`;
    }).join('');
  }

  function saveMonthly() {
    const err = $('#monthlyBudgetError'), input = $('#monthlyBudgetInput');
    const r = parseAmount(input.value);
    err.textContent = r.error || ''; input.classList.toggle('invalid', !!r.error);
    if (r.error) return;
    const prev = getLevel();
    budgets.monthly = r.value; persist();
    SW.UI.toast(r.value > 0 ? 'Monthly budget saved.' : 'Monthly budget removed.', 'success');
    notify(prev);
  }
  function saveCategories() {
    const err = $('#categoryBudgetError'); err.textContent = '';
    const next = {}; let bad = null;
    U.$$('#categoryBudgets input[data-cat]').forEach((inp) => {
      const r = parseAmount(inp.value);
      inp.classList.toggle('invalid', !!r.error);
      if (r.error) bad = bad || `${inp.dataset.cat}: ${r.error}`; else if (r.value > 0) next[inp.dataset.cat] = r.value;
    });
    if (bad) { err.textContent = bad; return; }
    budgets.categories = next; persist();
    SW.UI.toast('Category limits saved.', 'success');
  }
  function clearAll() { budgets = { monthly: 0, categories: {} }; persist(); }
  function setDefaults(monthly, categories) {
    if (budgets.monthly > 0 || Object.keys(budgets.categories).length) return false;
    budgets = { monthly, categories: { ...categories } }; persist(); return true;
  }
  function init() {
    load();
    $('#saveMonthlyBudget').addEventListener('click', saveMonthly);
    $('#monthlyBudgetInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') saveMonthly(); });
    $('#saveCategoryBudgets').addEventListener('click', saveCategories);
  }

  SW.Budget = { init, load, render, status, getLevel, levelFor, message, notify, parseAmount, clearAll, setDefaults,
    setMonthly: (v) => { budgets.monthly = v; persist(); }, get: () => JSON.parse(JSON.stringify(budgets)) };
})(window);
