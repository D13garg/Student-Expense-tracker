/* storage.js – thin, failure-tolerant wrapper around localStorage. */
(function (w) {
  'use strict';
  const SW = (w.SW = w.SW || {});
  const KEYS = {
    transactions: 'spendwise.transactions',
    budgets: 'spendwise.budgets',
    settings: 'spendwise.settings',
    theme: 'spendwise.theme'
  };
  const DEFAULT_SETTINGS = { warningThreshold: 80 };

  const Storage = {
    KEYS,
    read(key, fallback) {
      try {
        const raw = w.localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    write(key, value) {
      try { w.localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
    },
    remove(key) { try { w.localStorage.removeItem(key); } catch (e) { /* ignore */ } },
    getSettings() {
      const s = Storage.read(KEYS.settings, {});
      const t = Number(s && s.warningThreshold);
      return { warningThreshold: Number.isFinite(t) && t >= 50 && t <= 99 ? t : DEFAULT_SETTINGS.warningThreshold };
    },
    saveSettings(s) { return Storage.write(KEYS.settings, s); },
    getTheme() { const t = Storage.read(KEYS.theme, null); return t === 'dark' || t === 'light' ? t : null; },
    saveTheme(t) { return Storage.write(KEYS.theme, t); }
  };
  SW.Storage = Storage;
})(window);
