/* expenses.js – transaction data, validation, filtering, CSV export and transaction UI. */
(function (w) {
  'use strict';
  const SW = w.SW, U = SW.Utils, $ = U.$, esc = U.escapeHtml;
  const MAX_AMOUNT = 100000000;
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  const DEFAULT_FILTERS = { search: '', type: 'all', category: 'all', from: '', to: '', sort: 'date-desc' };
  let transactions = [];
  let filters = { ...DEFAULT_FILTERS };
  const round2 = (n) => Math.round(n * 100) / 100;

  function isRealDate(s) {
    if (!DATE_RE.test(s || '')) return false;
    const [y, m, d] = s.split('-').map(Number), dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
  }
  const isValidRecord = (t) => t && typeof t.id === 'string' && typeof t.description === 'string' &&
    Number.isFinite(t.amount) && (t.type === 'income' || t.type === 'expense') && isRealDate(t.date);

  /* ---------- data layer ---------- */
  function load() {
    const data = SW.Storage.read(SW.Storage.KEYS.transactions, []);
    transactions = Array.isArray(data) ? data.filter(isValidRecord).map((t) => ({ createdAt: 0, notes: '', category: 'Other', ...t })) : [];
  }
  function persist() {
    if (!SW.Storage.write(SW.Storage.KEYS.transactions, transactions)) SW.UI.toast('Could not save. Browser storage is full or blocked.', 'error');
    document.dispatchEvent(new CustomEvent('sw:data-changed'));
  }
  function validate(d) {
    const e = {};
    const desc = (d.description || '').trim();
    if (desc.length < 2) e.description = 'Enter at least 2 characters.';
    else if (desc.length > 80) e.description = 'Use 80 characters or fewer.';
    const amt = Number(d.amount);
    if (d.amount === '' || d.amount == null || !Number.isFinite(amt)) e.amount = 'Enter a valid amount.';
    else if (amt <= 0) e.amount = 'Amount must be greater than zero.';
    else if (amt > MAX_AMOUNT) e.amount = 'Amount is too large.';
    if (d.type !== 'income' && d.type !== 'expense') e.type = 'Choose a type.';
    else if (!U.categoryNames(d.type).includes(d.category)) e.category = 'Choose a category.';
    if (!isRealDate(d.date)) e.date = 'Pick a valid date.';
    if ((d.notes || '').length > 200) e.notes = 'Use 200 characters or fewer.';
    return e;
  }
  const normalize = (d) => ({ description: d.description.trim(), amount: round2(Number(d.amount)), category: d.category, type: d.type, date: d.date, notes: (d.notes || '').trim() });

  function add(d) {
    const errors = validate(d);
    if (Object.keys(errors).length) return { ok: false, errors };
    transactions.push({ id: U.uid(), ...normalize(d), createdAt: Date.now() });
    persist();
    return { ok: true };
  }
  function update(id, d) {
    const t = getById(id);
    if (!t) return { ok: false, errors: { form: 'Transaction not found.' } };
    const errors = validate(d);
    if (Object.keys(errors).length) return { ok: false, errors };
    Object.assign(t, normalize(d));
    persist();
    return { ok: true };
  }
  function remove(id) {
    const before = transactions.length;
    transactions = transactions.filter((t) => t.id !== id);
    if (transactions.length !== before) persist();
    return transactions.length !== before;
  }
  function importRecords(records) { transactions.push(...records.filter(isValidRecord)); persist(); }
  function clearAll() { transactions = []; persist(); }
  const getById = (id) => transactions.find((t) => t.id === id);
  const getAll = () => transactions.slice();

  /* ---------- queries ---------- */
  function getFiltered() {
    const q = filters.search.trim().toLowerCase();
    const list = transactions.filter((t) => {
      if (filters.type !== 'all' && t.type !== filters.type) return false;
      if (filters.category !== 'all' && t.category !== filters.category) return false;
      if (filters.from && t.date < filters.from) return false;
      if (filters.to && t.date > filters.to) return false;
      if (q && !`${t.description} ${t.notes || ''} ${t.category}`.toLowerCase().includes(q)) return false;
      return true;
    });
    const [key, dir] = filters.sort.split('-'), m = dir === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      const diff = key === 'amount' ? a.amount - b.amount : a.date.localeCompare(b.date);
      return diff ? diff * m : (a.createdAt - b.createdAt) * m;
    });
    return list;
  }
  function summarize(list) {
    let income = 0, expense = 0;
    list.forEach((t) => { if (t.type === 'income') income += t.amount; else expense += t.amount; });
    income = round2(income); expense = round2(expense);
    return { income, expense, balance: round2(income - expense) };
  }
  const monthSummary = (key) => summarize(transactions.filter((t) => t.date.startsWith(key)));
  function expenseByCategory(monthKey) {
    const map = {};
    transactions.forEach((t) => {
      if (t.type !== 'expense' || (monthKey && !t.date.startsWith(monthKey))) return;
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map).map(([name, total]) => ({ name, total: round2(total), color: U.categoryMeta(name).color })).sort((a, b) => b.total - a.total);
  }
  const monthlySeries = (n) => U.lastMonthKeys(n).map((key) => ({ key, label: U.monthLabel(key, true), ...monthSummary(key) }));

  /* ---------- CSV ---------- */
  function toCSV(list) {
    const text = (v) => {
      let s = String(v ?? '');
      if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // neutralise spreadsheet formulas
      return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const rows = [['ID', 'Date', 'Description', 'Type', 'Category', 'Amount (INR)', 'Notes']];
    list.forEach((t) => rows.push([text(t.id), t.date, text(t.description), t.type, text(t.category), t.amount.toFixed(2), text(t.notes)]));
    return rows.map((r) => r.join(',')).join('\r\n');
  }
  function exportCSV() {
    const list = getFiltered();
    if (!list.length) { SW.UI.toast('There are no transactions to export.', 'warning'); return; }
    const blob = new Blob(['\uFEFF' + toCSV(list)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = `spendwise-transactions-${U.todayISO()}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    SW.UI.toast(`Exported ${list.length} transaction${list.length === 1 ? '' : 's'}.`, 'success');
  }

  /* ---------- rendering ---------- */
  const sign = (t) => (t.type === 'income' ? '+' : '−');
  function chip(name) {
    const m = U.categoryMeta(name);
    return `<span class="chip" style="--chip:${m.color}"><i class="fa-solid ${m.icon}"></i>${esc(name)}</span>`;
  }
  function rowHtml(t) {
    const id = esc(t.id);
    return `<tr>
      <td data-label="Date">${U.formatDate(t.date)}</td>
      <td data-label="Description"><div class="tx-desc">${esc(t.description)}</div>${t.notes ? `<div class="tx-note" title="${esc(t.notes)}">${esc(t.notes)}</div>` : ''}</td>
      <td data-label="Category">${chip(t.category)}</td>
      <td data-label="Type"><span class="badge ${t.type}">${t.type === 'income' ? 'Income' : 'Expense'}</span></td>
      <td data-label="Amount" class="amount ${t.type} right">${sign(t)}${U.formatCurrency(t.amount)}</td>
      <td data-label="Actions" class="actions">
        <button class="icon-btn sm" data-action="edit" data-id="${id}" aria-label="Edit ${esc(t.description)}"><i class="fa-solid fa-pen"></i></button>
        <button class="icon-btn sm danger" data-action="delete" data-id="${id}" aria-label="Delete ${esc(t.description)}"><i class="fa-solid fa-trash"></i></button>
      </td></tr>`;
  }
  function renderTable() {
    const list = getFiltered(), total = transactions.length;
    $('#txBody').innerHTML = list.map(rowHtml).join('');
    $('#txTableWrap').hidden = list.length === 0;
    $('#txEmpty').hidden = total !== 0;
    $('#txNoMatch').hidden = !(total > 0 && list.length === 0);
    $('#txCount').textContent = total === 0 ? 'No transactions yet' : `Showing ${list.length} of ${total} transaction${total === 1 ? '' : 's'}`;
  }
  function renderRecent() {
    const recent = transactions.slice().sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt).slice(0, 6);
    $('#recentList').innerHTML = recent.map((t) => {
      const m = U.categoryMeta(t.category);
      return `<li class="tx-item"><span class="tx-icon" style="--chip:${m.color}"><i class="fa-solid ${m.icon}"></i></span>
        <div class="tx-main"><strong>${esc(t.description)}</strong><small>${esc(t.category)} · ${U.formatDate(t.date)}</small></div>
        <span class="amount ${t.type}">${sign(t)}${U.formatCurrency(t.amount)}</span></li>`;
    }).join('');
    $('#recentEmpty').hidden = recent.length > 0;
  }
  const render = () => { renderTable(); renderRecent(); };

  /* ---------- filters ---------- */
  function populateFilterCategories() {
    const sel = $('#filterCategory');
    let html = '<option value="all">All categories</option>';
    ['expense', 'income'].forEach((type) => {
      if (filters.type !== 'all' && filters.type !== type) return;
      html += `<optgroup label="${type === 'expense' ? 'Expenses' : 'Income'}">` + U.categoryNames(type).map((n) => `<option value="${n}">${n}</option>`).join('') + '</optgroup>';
    });
    sel.innerHTML = html;
    if (!Array.from(sel.options).some((o) => o.value === filters.category)) filters.category = 'all';
    sel.value = filters.category;
  }
  function setFilter(key, value) {
    filters[key] = value;
    if (key === 'type') populateFilterCategories();
    renderTable();
  }
  function clearFilters() {
    filters = { ...DEFAULT_FILTERS };
    $('#searchInput').value = ''; $('#filterType').value = 'all'; $('#filterFrom').value = ''; $('#filterTo').value = ''; $('#filterSort').value = 'date-desc';
    populateFilterCategories();
    renderTable();
  }

  /* ---------- form ---------- */
  function fillFormCategories(type, selected) {
    $('#fCategory').innerHTML = U.categoryNames(type).map((n) => `<option value="${n}">${n}</option>`).join('');
    if (selected) $('#fCategory').value = selected;
  }
  function clearErrors() {
    U.$$('[data-error]').forEach((el) => { el.textContent = ''; });
    U.$$('#txForm .invalid').forEach((el) => el.classList.remove('invalid'));
  }
  function showErrors(errors) {
    clearErrors();
    let first = null;
    Object.entries(errors).forEach(([field, msg]) => {
      const out = $(`[data-error="${field}"]`); if (out) out.textContent = msg;
      const input = $('#txForm').elements[field];
      if (input && input.classList) { input.classList.add('invalid'); first = first || input; }
    });
    if (first) first.focus();
  }
  function openForm(id) {
    const form = $('#txForm'), t = id ? getById(id) : null;
    form.reset(); clearErrors();
    $('#txModalTitle').textContent = t ? 'Edit transaction' : 'Add transaction';
    $('#txSubmit').textContent = t ? 'Save changes' : 'Save transaction';
    const type = t ? t.type : 'expense';
    form.querySelector(`input[name="type"][value="${type}"]`).checked = true;
    fillFormCategories(type, t && t.category);
    form.elements.id.value = t ? t.id : '';
    form.elements.description.value = t ? t.description : '';
    form.elements.amount.value = t ? t.amount : '';
    form.elements.date.value = t ? t.date : U.todayISO();
    form.elements.notes.value = t ? t.notes || '' : '';
    SW.UI.openModal($('#txModal'));
    form.elements.description.focus();
  }
  function submitForm(ev) {
    ev.preventDefault();
    const f = $('#txForm').elements;
    const data = { description: f.description.value, amount: f.amount.value, type: f.type.value, category: f.category.value, date: f.date.value, notes: f.notes.value };
    const id = f.id.value, prevLevel = SW.Budget.getLevel();
    const res = id ? update(id, data) : add(data);
    if (!res.ok) { showErrors(res.errors); return; }
    SW.UI.closeModal($('#txModal'));
    SW.UI.toast(id ? 'Transaction updated.' : 'Transaction added.', 'success');
    if (data.type === 'expense') SW.Budget.notify(prevLevel);
  }
  async function confirmDelete(id) {
    const t = getById(id); if (!t) return;
    const ok = await SW.UI.confirm({ title: 'Delete transaction?', message: `“${t.description}” (${U.formatCurrency(t.amount)}) will be permanently removed.`, confirmText: 'Delete', danger: true });
    if (ok) { remove(id); SW.UI.toast('Transaction deleted.', 'success'); }
  }

  function init() {
    load();
    populateFilterCategories();
    $('#searchInput').addEventListener('input', U.debounce((e) => setFilter('search', e.target.value), 150));
    $('#filterType').addEventListener('change', (e) => setFilter('type', e.target.value));
    $('#filterCategory').addEventListener('change', (e) => setFilter('category', e.target.value));
    $('#filterFrom').addEventListener('change', (e) => setFilter('from', e.target.value));
    $('#filterTo').addEventListener('change', (e) => setFilter('to', e.target.value));
    $('#filterSort').addEventListener('change', (e) => setFilter('sort', e.target.value));
    $('#clearFilters').addEventListener('click', clearFilters);
    $('#exportCsv').addEventListener('click', exportCSV);
    $('#txForm').addEventListener('submit', submitForm);
    $('#txForm').addEventListener('change', (e) => { if (e.target.name === 'type') fillFormCategories(e.target.value); });
    document.addEventListener('click', (e) => {
      const act = e.target.closest('[data-action]');
      if (act) { act.dataset.action === 'edit' ? openForm(act.dataset.id) : confirmDelete(act.dataset.id); return; }
      if (e.target.closest('[data-open-form]')) openForm();
      if (e.target.closest('[data-clear-filters]')) clearFilters();
    });
  }

  SW.Expenses = { init, load, render, openForm, add, update, remove, validate, getAll, getById, getFiltered, summarize, monthSummary,
    expenseByCategory, monthlySeries, toCSV, exportCSV, importRecords, clearAll, setFilter, clearFilters };
})(window);
