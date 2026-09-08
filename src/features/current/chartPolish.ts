const SVG_NS = 'http://www.w3.org/2000/svg';
const SEPARATOR_GAP = 3;
// Decimal points and clock colons intentionally share the local x=0 annotation axis.

const installPolishStyles = () => {
  if (document.getElementById('current-chart-polish-styles')) return;

  const style = document.createElement('style');
  style.id = 'current-chart-polish-styles';
  style.textContent = `
    .current-shell .electricity-chart .electricity-chart__window-label > text {
      text-anchor: middle !important;
      transform: none !important;
      font-variant-numeric: tabular-nums;
    }

    .current-shell .electricity-chart .electricity-chart__window-label tspan {
      font: inherit;
      letter-spacing: inherit;
    }

    .current-shell .electricity-chart .electricity-chart__window-unit {
      display: none !important;
    }

    .current-shell [data-current-section='rates'] .markets-sparkline-context {
      display: none !important;
    }

    .current-shell [data-current-section='rates'] .markets-sparkline-frame {
      grid-template-columns: 30px minmax(0, 1fr) !important;
      gap: 4px !important;
    }

    .current-shell [data-current-section='rates'] .markets-sparkline__fallback {
      padding-left: 34px !important;
    }

    @media (max-width: 640px) {
      .current-shell [data-current-section='rates'] .markets-sparkline-frame {
        grid-template-columns: 28px minmax(0, 1fr) !important;
        gap: 4px !important;
      }

      .current-shell [data-current-section='rates'] .markets-sparkline__fallback {
        padding-left: 32px !important;
      }
    }
  `;
  document.head.append(style);
};

const createTspan = (
  text: string,
  x: number,
  anchor: 'start' | 'middle' | 'end',
  role: string
) => {
  const tspan = document.createElementNS(SVG_NS, 'tspan');
  tspan.textContent = text;
  tspan.setAttribute('x', String(x));
  tspan.setAttribute('text-anchor', anchor);
  tspan.dataset.alignmentRole = role;
  return tspan;
};

const renderAlignedParts = (
  node: SVGTextElement,
  before: string,
  separator: string,
  after: string,
  signature: string
) => {
  if (
    node.dataset.alignmentSignature === signature &&
    node.querySelectorAll(':scope > tspan').length === 3
  ) {
    return;
  }

  node.dataset.alignmentSignature = signature;
  node.replaceChildren(
    createTspan(before, -SEPARATOR_GAP, 'end', 'before'),
    createTspan(separator, 0, 'middle', 'separator'),
    createTspan(after, SEPARATOR_GAP, 'start', 'after')
  );
};

const renderAlignedDecimal = (node: SVGTextElement, rawValue: string) => {
  const value = rawValue.trim();
  const match = value.match(/^([+-]?\d+)([.,])(\d+)$/);
  if (!match) {
    if (node.textContent !== value) node.textContent = value;
    delete node.dataset.alignmentSignature;
    return;
  }

  renderAlignedParts(node, match[1], match[2], match[3], `decimal:${value}`);
};

const renderAlignedClock = (
  node: SVGTextElement,
  rawClock: string,
  trailingDash: boolean
) => {
  const match = rawClock.trim().match(/^(\d{2}):(\d{2})$/);
  if (!match) return;
  const suffix = trailingDash ? `${match[2]} -` : match[2];
  renderAlignedParts(node, match[1], ':', suffix, `clock:${rawClock}:${trailingDash}`);
};

const splitClockRange = (value: string) => {
  const match = value.trim().match(/^(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})$/);
  if (!match) return null;
  return { start: match[1], end: match[2] };
};

const readFullClockRange = (
  group: SVGGElement,
  rangeNode: SVGTextElement,
  rangeEndNode: SVGTextElement | null
) => {
  const candidates = [
    group.dataset.windowRange,
    rangeNode.dataset.fullClockRange,
    rangeNode.textContent,
  ];

  for (const candidate of candidates) {
    const value = candidate?.trim() ?? '';
    if (splitClockRange(value)) return value;
  }

  const start = (rangeNode.textContent?.trim() ?? '').replace(/\s*-\s*$/, '');
  const end = rangeEndNode?.textContent?.trim() ?? '';
  if (/^\d{2}:\d{2}$/.test(start) && /^\d{2}:\d{2}$/.test(end)) {
    return `${start} - ${end}`;
  }

  return '';
};

const normalizeElectricityGroup = (
  group: SVGGElement,
  centerX?: number
) => {
  const texts = Array.from(group.querySelectorAll<SVGTextElement>(':scope > text'));
  const valueNode =
    group.querySelector<SVGTextElement>('[data-electricity-inspection-value]') ?? texts[0];
  const rangeNode =
    group.querySelector<SVGTextElement>('[data-electricity-inspection-range]') ??
    texts.find(
      (text) =>
        text.classList.contains('electricity-chart__window-range') &&
        !text.hasAttribute('data-electricity-window-range-end')
    );
  let rangeEndNode = group.querySelector<SVGTextElement>('[data-electricity-window-range-end]');

  if (!valueNode || !rangeNode) return;

  const valueText = valueNode.textContent?.trim() ?? '';
  renderAlignedDecimal(valueNode, valueText);
  valueNode.setAttribute('x', '0');
  valueNode.setAttribute('y', '11');
  valueNode.setAttribute('text-anchor', 'middle');

  const fullRange = readFullClockRange(group, rangeNode, rangeEndNode);
  const parsed = splitClockRange(fullRange);

  if (parsed) {
    rangeNode.dataset.fullClockRange = fullRange;

    if (!rangeEndNode) {
      rangeEndNode = document.createElementNS(SVG_NS, 'text');
      rangeEndNode.classList.add('electricity-chart__window-range');
      rangeEndNode.setAttribute('data-electricity-window-range-end', '');
      group.append(rangeEndNode);
    }

    renderAlignedClock(rangeNode, parsed.start, true);
    renderAlignedClock(rangeEndNode, parsed.end, false);
  }

  rangeNode.setAttribute('x', '0');
  rangeNode.setAttribute('y', '21');
  rangeNode.setAttribute('text-anchor', 'middle');
  rangeNode.classList.add('electricity-chart__window-range');

  if (rangeEndNode) {
    rangeEndNode.setAttribute('x', '0');
    rangeEndNode.setAttribute('y', '31');
    rangeEndNode.setAttribute('text-anchor', 'middle');
  }

  if (centerX !== undefined && Number.isFinite(centerX)) {
    group.setAttribute('transform', `translate(${centerX.toFixed(2)} 0)`);
  }
};

const normalizeElectricityAnnotations = (chart: SVGSVGElement) => {
  const lowLabel = chart.querySelector<SVGGElement>('[data-electricity-low-label]');
  const highLabel = chart.querySelector<SVGGElement>('[data-electricity-high-label]');
  const inspectionLabel = chart.querySelector<SVGGElement>('[data-electricity-inspection-label]');
  const lowBand = chart.querySelector<SVGRectElement>('[data-electricity-low-band]');
  const highBand = chart.querySelector<SVGRectElement>('[data-electricity-high-band]');
  const inspectionLine = chart.querySelector<SVGLineElement>('[data-electricity-inspection-line]');

  const bandCenter = (band: SVGRectElement | null) => {
    if (!band) return undefined;
    const x = Number(band.getAttribute('x'));
    const width = Number(band.getAttribute('width'));
    if (!Number.isFinite(x) || !Number.isFinite(width)) return undefined;
    return x + width / 2;
  };

  const inspectionX = Number(inspectionLine?.getAttribute('x1'));
  const activeInspectionX =
    inspectionLabel?.getAttribute('opacity') === '1' && Number.isFinite(inspectionX)
      ? inspectionX
      : undefined;

  const containsInspection = (band: SVGRectElement | null) => {
    if (activeInspectionX === undefined || !band) return false;
    const x = Number(band.getAttribute('x'));
    const width = Number(band.getAttribute('width'));
    if (!Number.isFinite(x) || !Number.isFinite(width)) return false;
    return activeInspectionX >= x && activeInspectionX < x + width;
  };

  if (lowLabel) {
    normalizeElectricityGroup(lowLabel, bandCenter(lowBand));
    lowLabel.setAttribute('opacity', containsInspection(lowBand) ? '0' : '1');
  }
  if (highLabel) {
    normalizeElectricityGroup(highLabel, bandCenter(highBand));
    highLabel.setAttribute('opacity', containsInspection(highBand) ? '0' : '1');
  }
  if (inspectionLabel) normalizeElectricityGroup(inspectionLabel, activeInspectionX);
};

const initElectricityPolish = () => {
  const chart = document.querySelector<SVGSVGElement>('[data-current-electricity] [data-electricity-chart]');
  if (!chart || chart.dataset.finalPolishInitialized === 'true') return;
  chart.dataset.finalPolishInitialized = 'true';

  // This module owns electricity annotation normalization. Claim the older parity
  // hook before chartPresentation initializes so two observers never rewrite the
  // same SVG text in alternating animation frames.
  chart.dataset.annotationParityInitialized = 'true';

  let normalizing = false;
  const normalize = () => {
    if (normalizing) return;
    normalizing = true;
    try {
      normalizeElectricityAnnotations(chart);
    } finally {
      normalizing = false;
    }
  };

  // MutationObserver callbacks run before the next paint. Normalize immediately
  // instead of deferring through requestAnimationFrame, which previously exposed
  // one frame of raw text between interactive pointer updates.
  const observer = new MutationObserver(normalize);
  observer.observe(chart, { childList: true, subtree: true, characterData: true });

  window.addEventListener('current:data-updated', (event) => {
    if (!(event instanceof CustomEvent) || event.detail?.source !== 'electricity') return;
    normalize();
  });

  normalize();
};

const initMarketsPolish = () => {
  const rates = document.querySelector<HTMLElement>('[data-current-rates-trends]');
  if (!rates) return;

  const rows = rates.querySelectorAll<HTMLElement>('.markets-macro__row--chart');
  const worldRow = rows[1];
  const worldLabel = worldRow?.querySelector<HTMLElement>('.markets-macro__label');
  if (worldLabel && worldLabel.textContent?.trim() === 'WORLD') {
    worldLabel.textContent = 'WORLD / 1Y INDEX';
  }
};

export const initCurrentChartPolish = () => {
  const init = () => {
    installPolishStyles();
    initElectricityPolish();
    initMarketsPolish();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
};
