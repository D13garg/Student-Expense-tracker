/* sample-data.js – optional demo data, generated relative to today's date. */
(function (w) {
  'use strict';
  const SW = w.SW, U = SW.Utils;
  const pad = (n) => String(n).padStart(2, '0');
  // [type, category, description, base amount, day of month]
  const T = [
    ['income', 'Allowance', 'Monthly allowance from home', 12000, 1],
    ['income', 'Scholarship', 'Merit scholarship instalment', 5000, 5],
    ['income', 'Part-time job', 'Library assistant wages', 3500, 15],
    ['income', 'Freelancing', 'Poster design project', 2500, 22],
    ['expense', 'Accommodation', 'Hostel rent', 6000, 2],
    ['expense', 'Food', 'Mess and canteen meals', 1800, 7],
    ['expense', 'Food', 'Groceries and snacks', 900, 18],
    ['expense', 'Transportation', 'Metro card recharge', 700, 4],
    ['expense', 'Education', 'Textbooks and stationery', 1200, 9],
    ['expense', 'Shopping', 'Clothes and accessories', 1100, 12],
    ['expense', 'Entertainment', 'Movies and streaming', 650, 20],
    ['expense', 'Healthcare', 'Pharmacy and check-up', 450, 14]
  ];
  function generate() {
    const now = new Date(), today = U.todayISO(), out = [];
    for (let m = 5; m >= 0; m--) {
      const base = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const key = U.monthKey(base), dim = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
      T.forEach((t, i) => {
        if (t[1] === 'Freelancing' && m % 2 === 1) return;
        if (t[1] === 'Healthcare' && m % 3 !== 0) return;
        const date = `${key}-${pad(Math.min(t[4], dim))}`;
        if (date > today) return;
        const varies = t[0] === 'expense' && t[1] !== 'Accommodation';
        const amount = Math.round((t[3] * (varies ? 1 + (((m * 7 + i * 3) % 5) - 2) * 0.08 : 1)) / 10) * 10;
        out.push({ id: U.uid() + '_' + out.length, description: t[2], amount, category: t[1], type: t[0], date, notes: '', createdAt: Date.now() + out.length });
      });
    }
    return out;
  }
  SW.Sample = { generate, budget: { monthly: 15000, categories: { Food: 3500, Transportation: 1000, Entertainment: 1000, Shopping: 1500 } } };
})(window);
