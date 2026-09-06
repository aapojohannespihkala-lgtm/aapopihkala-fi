const SVG_NS = 'http://www.w3.org/2000/svg';

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.max(minimum, Math.min(maximum, value));

const readSvgNumber = (element: Element, attribute: string) => {
  const value = Number(element.getAttribute(attribute));
  return Number.isFinite(value) ? value : Number.NaN;
};

const setWindowCopy = (label: SVGGElement, kind: 'LOW' | 'HIGH') => {
  const lines = label.querySelectorAll<SVGTextElement>('text');
  const headline = lines[0];
  const range = lines[1];
  if (!headline || !range) return;

  const current = headline.textContent ?? '';
  const separatorIndex = current.indexOf('·');
  const price = separatorIndex >= 0 ? current.slice(separatorIndex + 1).trim() : '';

  headline.textContent = price ? `${kind} 2H · ${price}` : `${kind} 2H`;
  headline.setAttribute('y', '10');
  range.setAttribute('y', '20');
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

  const addLeader = (
    kind: 'low' | 'high',
    labelX: number,
    bandCenter: number,
    plotTop: number
  ) => {
    const leader = document.createElementNS(SVG_NS, 'line');
    leader.setAttribute('data-electricity-window-leader', kind);
    leader.setAttribute('class', `electricity-chart__window-leader electricity-chart__window-leader--${kind}`);
    leader.setAttribute('x1', labelX.toFixed(2));
    leader.setAttribute('x2', bandCenter.toFixed(2));
    leader.setAttribute('y1', '25');
    leader.setAttribute('y2', Math.max(27, plotTop - 3).toFixed(2));

    const firstBand = chart.querySelector('[data-electricity-low-band], [data-electricity-high-band]');
    chart.insertBefore(leader, firstBand);
  };

  const layoutWindowLabels = () => {
    frame = 0;

    const lowLabel = chart.querySelector<SVGGElement>('[data-electricity-low-label]');
    const highLabel = chart.querySelector<SVGGElement>('[data-electricity-high-label]');
    const lowBand = chart.querySelector<SVGRectElement>('[data-electricity-low-band]');
    const highBand = chart.querySelector<SVGRectElement>('[data-electricity-high-band]');
    if (!lowLabel || !highLabel || !lowBand || !highBand) return;

    const width = chart.viewBox.baseVal.width;
    if (!Number.isFinite(width) || width <= 0) return;

    const bandCenter = (band: SVGRectElement) =>
      readSvgNumber(band, 'x') + readSvgNumber(band, 'width') / 2;

    const lowCenter = bandCenter(lowBand);
    const highCenter = bandCenter(highBand);
    if (!Number.isFinite(lowCenter) || !Number.isFinite(highCenter)) return;

    const compact = width < 560;
    const labelHalfWidth = compact ? 42 : 50;
    const minimumGap = compact ? 100 : 120;
    const leftLimit = labelHalfWidth + 2;
    const rightLimit = width - labelHalfWidth - 2;

    let lowX = clamp(lowCenter, leftLimit, rightLimit);
    let highX = clamp(highCenter, leftLimit, rightLimit);

    if (Math.abs(lowX - highX) < minimumGap && rightLimit - leftLimit >= minimumGap) {
      const lowIsLeft = lowCenter <= highCenter;
      const midpoint = clamp(
        (lowCenter + highCenter) / 2,
        leftLimit + minimumGap / 2,
        rightLimit - minimumGap / 2
      );

      if (lowIsLeft) {
        lowX = midpoint - minimumGap / 2;
        highX = midpoint + minimumGap / 2;
      } else {
        lowX = midpoint + minimumGap / 2;
        highX = midpoint - minimumGap / 2;
      }
    }

    const plotTop = Math.min(readSvgNumber(lowBand, 'y'), readSvgNumber(highBand, 'y'));

    chartObserver.disconnect();
    chart.querySelectorAll('[data-electricity-window-leader]').forEach((leader) => leader.remove());

    setWindowCopy(lowLabel, 'LOW');
    setWindowCopy(highLabel, 'HIGH');
    lowLabel.setAttribute('transform', `translate(${lowX.toFixed(2)} 0)`);
    highLabel.setAttribute('transform', `translate(${highX.toFixed(2)} 0)`);

    addLeader('low', lowX, lowCenter, plotTop);
    addLeader('high', highX, highCenter, plotTop);
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
