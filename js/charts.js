/* charts.js – Chart.js visualisations built from live transaction data. */
(function (w) {
  'use strict';
  const SW = w.SW, U = SW.Utils, $ = U.$;
  const instances = {};

  function palette() {
    const dark = document.documentElement.dataset.theme === 'dark';
    return { text: dark ? '#b3b8dc' : '#5b6085', grid: dark ? 'rgba(255,255,255,.08)' : 'rgba(27,31,58,.08)', surface: dark ? '#161930' : '#ffffff',
      income: dark ? '#4ade80' : '#16a34a', expense: dark ? '#fb7185' : '#e11d48', primary: dark ? '#818cf8' : '#6366f1' };
  }
  function show(canvasId, hasData) {
    const card = $('#' + canvasId).closest('.chart-card');
    card.querySelector('.chart-box').hidden = !hasData;
    card.querySelector('.chart-empty').hidden = hasData;
  }
  function draw(id, config) {
    if (instances[id]) instances[id].destroy();
    instances[id] = new w.Chart($('#' + id).getContext('2d'), config);
  }
  const money = (ctx) => ' ' + U.formatCurrency(ctx.parsed.y !== undefined && ctx.chart.config.type !== 'doughnut' ? ctx.parsed.y : ctx.parsed);

  function render() {
    if (typeof w.Chart === 'undefined') {
      ['chartCategory', 'chartMonthly', 'chartTrend'].forEach((id) => {
        show(id, false);
        $('#' + id).closest('.chart-card').querySelector('.chart-empty p').textContent = 'Chart.js could not load. Connect to the internet once and reload.';
      });
      return;
    }
    const c = palette();
    w.Chart.defaults.font.family = "'Plus Jakarta Sans', system-ui, sans-serif";
    w.Chart.defaults.color = c.text;
    const axes = { x: { grid: { display: false }, ticks: { color: c.text } },
      y: { beginAtZero: true, grid: { color: c.grid }, ticks: { color: c.text, callback: (v) => U.formatCompact(v) } } };

    // 1. Category doughnut
    const period = $('#doughnutPeriod').value;
    const cats = SW.Expenses.expenseByCategory(period === 'month' ? U.monthKey() : null);
    show('chartCategory', cats.length > 0);
    if (cats.length) draw('chartCategory', { type: 'doughnut',
      data: { labels: cats.map((x) => x.name), datasets: [{ data: cats.map((x) => x.total), backgroundColor: cats.map((x) => x.color), borderColor: c.surface, borderWidth: 3 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } },
        tooltip: { callbacks: { label: (ctx) => ' ' + ctx.label + ': ' + U.formatCurrency(ctx.parsed) } } } } });

    // 2 & 3. Monthly series
    const series = SW.Expenses.monthlySeries(6);
    const labels = series.map((s) => s.label);
    const hasAny = series.some((s) => s.income > 0 || s.expense > 0);
    show('chartMonthly', hasAny);
    if (hasAny) draw('chartMonthly', { type: 'bar',
      data: { labels, datasets: [{ label: 'Income', data: series.map((s) => s.income), backgroundColor: c.income, borderRadius: 6 },
        { label: 'Expenses', data: series.map((s) => s.expense), backgroundColor: c.expense, borderRadius: 6 }] },
      options: { responsive: true, maintainAspectRatio: false, scales: axes, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } },
        tooltip: { callbacks: { label: (ctx) => ' ' + ctx.dataset.label + ': ' + U.formatCurrency(ctx.parsed.y) } } } } });

    const hasSpend = series.some((s) => s.expense > 0);
    show('chartTrend', hasSpend);
    if (hasSpend) draw('chartTrend', { type: 'line',
      data: { labels, datasets: [{ label: 'Spending', data: series.map((s) => s.expense), borderColor: c.primary, backgroundColor: c.primary + '26', fill: true, tension: 0.35, pointRadius: 4, pointBackgroundColor: c.primary }] },
      options: { responsive: true, maintainAspectRatio: false, scales: axes, plugins: { legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => ' Spent: ' + U.formatCurrency(ctx.parsed.y) } } } } });
  }

  function init() { $('#doughnutPeriod').addEventListener('change', render); }
  SW.Charts = { init, render };
})(window);
