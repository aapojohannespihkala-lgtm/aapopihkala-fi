const MONTH_SUMMARY_PATTERN = /^([A-Z]{3}) AVG ([+-]?\d+(?:[.,]\d+)?) c\/kWh$/i;

const renderMonthSummary = (month: HTMLElement) => {
  const visibleText = month.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  const visibleMatch = visibleText.match(MONTH_SUMMARY_PATTERN);

  if (visibleMatch) {
    month.dataset.monthSummarySource = visibleText;
  }

  const source = visibleMatch ? visibleText : month.dataset.monthSummarySource ?? '';
  const match = source.match(MONTH_SUMMARY_PATTERN);
  if (!match) return;

  const monthLabel = `${match[1].toUpperCase()} AVG`;
  const valueLabel = `${match[2]} c/kWh`;
  const signature = `${monthLabel}|${valueLabel}`;

  if (
    month.dataset.monthSummarySignature === signature &&
    month.querySelectorAll(':scope > span').length === 3
  ) {
    return;
  }

  const label = document.createElement('span');
  label.className = 'electricity-month-average__label';
  label.textContent = monthLabel;

  const value = document.createElement('span');
  value.className = 'electricity-month-average__value';
  value.textContent = valueLabel;

  const detail = document.createElement('span');
  detail.className = 'electricity-month-average__detail';
  detail.textContent = 'MONTH TO DATE';

  month.dataset.monthSummarySignature = signature;
  month.replaceChildren(label, value, detail);
};

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
  hiddenExtremes.hidden = true;
  hiddenExtremes.setAttribute('aria-hidden', 'true');

  let frame = 0;
  const scheduleMonthSummary = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => renderMonthSummary(month));
  };

  const observer = new MutationObserver(scheduleMonthSummary);
  observer.observe(month, { childList: true, subtree: true, characterData: true });
  scheduleMonthSummary();

  root.dataset.electricitySummaryInitialized = 'true';
};
