const SVG_NS = 'http://www.w3.org/2000/svg';

const readSvgNumber = (element: Element, attribute: string) => {
  const value = Number(element.getAttribute(attribute));
  return Number.isFinite(value) ? value : Number.NaN;
};

const readWindowPrice = (label: SVGGElement, headline: SVGTextElement) => {
  const stored = label.dataset.windowPrice;
  if (stored) return stored;

  const current = headline.textContent ?? '';
  const separatorIndex = current.indexOf('·');
  const price = separatorIndex >= 0 ? current.slice(separatorIndex + 1).trim() : current.trim();
  label.dataset.windowPrice = price;
  return price;
};

const readWindowRange = (label: SVGGElement, range: SVGTextElement) => {
  const stored = label.dataset.windowRange;
  if (stored) return stored;

  const value = range.textContent?.trim() ?? '';
  label.dataset.windowRange = value;
  return value;
};

const splitWindowRange = (value: string) => {
  const match = value.match(/^(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})$/);
  if (!match) return [value, ''] as const;
  return [`${match[1]} -`, match[2]] as const;
};

const simplifyWindowLabel = (label: SVGGElement, band: SVGRectElement) => {
  const lines = label.querySelectorAll<SVGTextElement>('text');
  const headline = lines[0];
  const rangeStartLine = lines[1];
  if (!headline || !rangeStartLine) return;

  const price = readWindowPrice(label, headline);
  const [rangeStart, rangeEnd] = splitWindowRange(readWindowRange(label, rangeStartLine));
  const bandX = readSvgNumber(band, 'x');
  if (!Number.isFinite(bandX)) return;

  let unitLine = label.querySelector<SVGTextElement>('[data-electricity-window-unit]');
  if (!unitLine) {
    unitLine = document.createElementNS(SVG_NS, 'text');
    unitLine.setAttribute('data-electricity-window-unit', '');
    unitLine.setAttribute('class', 'electricity-chart__window-unit');
    label.insertBefore(unitLine, rangeStartLine);
  }

  let rangeEndLine = label.querySelector<SVGTextElement>('[data-electricity-window-range-end]');
  if (!rangeEndLine) {
    rangeEndLine = document.createElementNS(SVG_NS, 'text');
    rangeEndLine.setAttribute('data-electricity-window-range-end', '');
    rangeEndLine.setAttribute('class', 'electricity-chart__window-range');
    label.append(rangeEndLine);
  }

  headline.textContent = price || '--.--';
  headline.setAttribute('y', '7');
  headline.setAttribute('x', '0');
  headline.setAttribute('text-anchor', 'start');

  unitLine.textContent = 'c/kWh';
  unitLine.setAttribute('y', '14');
  unitLine.setAttribute('x', '0');
  unitLine.setAttribute('text-anchor', 'start');

  rangeStartLine.textContent = rangeStart;
  rangeStartLine.setAttribute('y', '23');
  rangeStartLine.setAttribute('x', '0');
  rangeStartLine.setAttribute('text-anchor', 'start');

  rangeEndLine.textContent = rangeEnd;
  rangeEndLine.setAttribute('y', '31');
  rangeEndLine.setAttribute('x', '0');
  rangeEndLine.setAttribute('text-anchor', 'start');

  label.setAttribute('transform', `translate(${bandX.toFixed(2)} 0)`);
};

export const initCurrentElectricityPresentation = () => {
  const root = document.querySelector<HTMLElement>('[data-current-electricity]');
  if (!root || root.dataset.electricityPresentationInitialized === 'true') return;

  const chart = root.querySelector<SVGSVGElement>('[data-electricity-chart]');
  const tooltip = root.querySelector<HTMLElement>('[data-electricity-chart-tooltip]');
  const nowLabel = root.querySelector<HTMLElement>('.electricity-now__label');
  if (!chart || !tooltip || !nowLabel) return;

  root.dataset.electricityPresentationInitialized = 'true';
  nowLabel.textContent = 'NOW / 15 MIN';

  let frame = 0;

  const syncInspectionState = () => {
    chart.classList.toggle('electricity-chart--inspecting', !tooltip.hidden);
  };

  const chartObserver = new MutationObserver(() => scheduleWindowLayout());

  const observeChart = () => {
    chartObserver.observe(chart, { childList: true });
  };

  const layoutWindowLabels = () => {
    frame = 0;

    const lowLabel = chart.querySelector<SVGGElement>('[data-electricity-low-label]');
    const highLabel = chart.querySelector<SVGGElement>('[data-electricity-high-label]');
    const lowBand = chart.querySelector<SVGRectElement>('[data-electricity-low-band]');
    const highBand = chart.querySelector<SVGRectElement>('[data-electricity-high-band]');
    if (!lowLabel || !highLabel || !lowBand || !highBand) return;

    chartObserver.disconnect();
    chart.querySelectorAll('[data-electricity-window-leader]').forEach((leader) => leader.remove());
    simplifyWindowLabel(lowLabel, lowBand);
    simplifyWindowLabel(highLabel, highBand);
    observeChart();
    syncInspectionState();
  };

  function scheduleWindowLayout() {
    if (frame) window.cancelAnimationFrame(frame);
    frame = window.requestAnimationFrame(layoutWindowLabels);
  }

  const tooltipObserver = new MutationObserver(syncInspectionState);
  tooltipObserver.observe(tooltip, { attributes: true, attributeFilter: ['hidden'] });

  const resizeObserver = new ResizeObserver(scheduleWindowLayout);
  resizeObserver.observe(chart);

  observeChart();
  syncInspectionState();
  scheduleWindowLayout();
};
