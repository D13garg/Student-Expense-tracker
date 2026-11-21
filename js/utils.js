/* utils.js – shared constants, helpers and small UI primitives (toast, modal, confirm). */
(function (w) {
  'use strict';
  const SW = (w.SW = w.SW || {});

  SW.CATEGORIES = {
    expense: [
      { name: 'Food', icon: 'fa-utensils', color: '#f97316' },
      { name: 'Transportation', icon: 'fa-bus', color: '#0ea5e9' },
      { name: 'Education', icon: 'fa-graduation-cap', color: '#6366f1' },
      { name: 'Shopping', icon: 'fa-bag-shopping', color: '#ec4899' },
      { name: 'Entertainment', icon: 'fa-film', color: '#a855f7' },
      { name: 'Healthcare', icon: 'fa-heart-pulse', color: '#ef4444' },
      { name: 'Accommodation', icon: 'fa-house', color: '#14b8a6' },
      { name: 'Other', icon: 'fa-ellipsis', color: '#64748b' }
    ],
    income: [
      { name: 'Scholarship', icon: 'fa-award', color: '#16a34a' },
      { name: 'Part-time job', icon: 'fa-briefcase', color: '#0d9488' },
      { name: 'Allowance', icon: 'fa-hand-holding-dollar', color: '#059669' },
      { name: 'Freelancing', icon: 'fa-laptop-code', color: '#65a30d' },
      { name: 'Other income', icon: 'fa-coins', color: '#0891b2' }
    ]
  };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const pad = (n) => String(n).padStart(2, '0');
  const fmtWhole = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
  const fmtFrac = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtCompact = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 });

  SW.Utils = {
    $, $$,
    uid: () => 'tx_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    formatCurrency(v) {
      const n = Number(v) || 0;
      return Number.isInteger(n) ? fmtWhole.format(n) : fmtFrac.format(n);
    },
    formatCompact: (v) => '₹' + fmtCompact.format(Number(v) || 0),
    todayISO() {
      const d = new Date();
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    },
    monthKey(date = new Date()) {
      return typeof date === 'string' ? date.slice(0, 7) : `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
    },
    monthLabel(key, short) {
      const [y, m] = key.split('-').map(Number);
      return new Date(y, m - 1, 1).toLocaleDateString('en-IN', short ? { month: 'short', year: '2-digit' } : { month: 'long', year: 'numeric' });
    },
    lastMonthKeys(n) {
      const now = new Date(), keys = [];
      for (let i = n - 1; i >= 0; i--) keys.push(SW.Utils.monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
      return keys;
    },
    formatDate(iso) {
      const [y, m, d] = iso.split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    },
    escapeHtml: (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
    debounce(fn, ms = 200) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; },
    categoryNames: (type) => (SW.CATEGORIES[type] || []).map((c) => c.name),
    categoryMeta(name) {
      return [...SW.CATEGORIES.expense, ...SW.CATEGORIES.income].find((c) => c.name === name) || { name, icon: 'fa-tag', color: '#64748b' };
    }
  };

  /* ---------- UI primitives ---------- */
  SW.UI = {
    toast(message, type = 'info') {
      const box = $('#toastContainer');
      if (!box) return;
      const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
      const el = document.createElement('div');
      el.className = 'toast toast-' + type;
      el.setAttribute('role', type === 'error' ? 'alert' : 'status');
      el.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span></span>`;
      el.querySelector('span').textContent = message;
      box.appendChild(el);
      setTimeout(() => { el.classList.add('leaving'); setTimeout(() => el.remove(), 300); }, 3800);
    },
    openModal(el) {
      el.classList.add('open');
      el.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
    },
    closeModal(el) {
      el.classList.remove('open');
      el.setAttribute('aria-hidden', 'true');
      if (!$('.modal.open')) document.body.classList.remove('modal-open');
    },
    /** Returns a Promise<boolean>. */
    confirm({ title = 'Are you sure?', message = '', confirmText = 'Confirm', danger = true } = {}) {
      return new Promise((resolve) => {
        const modal = $('#confirmModal'), ok = $('#confirmOk');
        $('#confirmTitle').textContent = title;
        $('#confirmMessage').textContent = message;
        ok.textContent = confirmText;
        ok.className = 'btn ' + (danger ? 'btn-danger' : 'btn-primary');
        const closers = $$('[data-close]', modal);
        const finish = (value) => {
          ok.removeEventListener('click', yes);
          closers.forEach((c) => c.removeEventListener('click', no));
          SW.UI.closeModal(modal);
          resolve(value);
        };
        const yes = () => finish(true), no = () => finish(false);
        ok.addEventListener('click', yes);
        closers.forEach((c) => c.addEventListener('click', no));
        SW.UI.openModal(modal);
        $('#confirmCancel').focus();
      });
    }
  };
})(window);
