export const initCurrentElectricitySummary = () => {
  const root = document.querySelector<HTMLElement>('[data-current-electricity]');
  if (!root || root.dataset.electricitySummaryInitialized === 'true') return;

  const hiddenExtremes = root.querySelector<HTMLElement>('.electricity-extremes');
  const low = hiddenExtremes?.querySelector<HTMLElement>('.electricity-extreme:not(.electricity-extreme--high)');
  const high = hiddenExtremes?.querySelector<HTMLElement>('.electricity-extreme--high');
  const month = root.querySelector<HTMLElement>('[data-electricity-month-average]');
  const chartSection = root.querySelector<HTMLElement>('[data-electricity-chart-section]');
  if (!hiddenExtremes || !low || !high || !month || !chartSection) return;

  const summary = document.createElement('section');
  summary.className = 'electricity-summary-strip';
  summary.dataset.electricitySummaryStrip = '';
  summary.setAttribute('aria-label', 'Daily electricity price extremes and current month average');

  month.classList.add('electricity-month-average--summary');
  summary.append(low, month, high);
  hiddenExtremes.before(summary);
  hiddenExtremes.setAttribute('aria-hidden', 'true');

  root.dataset.electricitySummaryInitialized = 'true';
};
