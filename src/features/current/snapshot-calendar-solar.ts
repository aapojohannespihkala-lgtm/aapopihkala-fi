import { getSolarOrbitGeometry, getSolarPosition } from './weather';

const HELSINKI_TIME_ZONE = 'Europe/Helsinki';
const SOLAR_VIEWBOX = {
  width: 120,
  height: 44,
  horizonY: 22,
} as const;
const SVG_NS = 'http://www.w3.org/2000/svg';
const REFRESH_INTERVAL_MS = 60 * 1000;

const helsinkiMinuteFormatter = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: HELSINKI_TIME_ZONE,
});

const getHelsinkiMinuteKey = (date: Date) => {
  const parts = Object.fromEntries(
    helsinkiMinuteFormatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );

  return `${parts.year ?? '0000'}-${parts.month ?? '00'}-${parts.day ?? '00'}T${parts.hour ?? '00'}:${parts.minute ?? '00'}`;
};

const createSvgElement = <K extends keyof SVGElementTagNameMap>(tagName: K) =>
  document.createElementNS(SVG_NS, tagName);

const ensureOrbitElements = (svg: SVGSVGElement, marker: SVGCircleElement) => {
  let visibleOrbit = svg.querySelector<SVGEllipseElement>('[data-snapshot-calendar-orbit-visible]');
  let hiddenOrbit = svg.querySelector<SVGEllipseElement>('[data-snapshot-calendar-orbit-hidden]');
  let horizon = svg.querySelector<SVGLineElement>('[data-snapshot-calendar-horizon]');

  if (visibleOrbit && hiddenOrbit && horizon) {
    return { visibleOrbit, hiddenOrbit, horizon };
  }

  svg.setAttribute('viewBox', `0 0 ${SOLAR_VIEWBOX.width} ${SOLAR_VIEWBOX.height}`);
  svg.querySelector('path')?.setAttribute('opacity', '0');
  svg
    .querySelectorAll<SVGCircleElement>('circle:not([data-snapshot-calendar-sun-position])')
    .forEach((circle) => circle.setAttribute('opacity', '0'));

  const defs = createSvgElement('defs');
  const aboveClip = createSvgElement('clipPath');
  const belowClip = createSvgElement('clipPath');
  const aboveRect = createSvgElement('rect');
  const belowRect = createSvgElement('rect');

  aboveClip.id = 'snapshot-calendar-solar-above-horizon';
  aboveClip.setAttribute('clipPathUnits', 'userSpaceOnUse');
  aboveRect.setAttribute('x', '0');
  aboveRect.setAttribute('y', '0');
  aboveRect.setAttribute('width', String(SOLAR_VIEWBOX.width));
  aboveRect.setAttribute('height', String(SOLAR_VIEWBOX.horizonY));
  aboveClip.append(aboveRect);

  belowClip.id = 'snapshot-calendar-solar-below-horizon';
  belowClip.setAttribute('clipPathUnits', 'userSpaceOnUse');
  belowRect.setAttribute('x', '0');
  belowRect.setAttribute('y', String(SOLAR_VIEWBOX.horizonY));
  belowRect.setAttribute('width', String(SOLAR_VIEWBOX.width));
  belowRect.setAttribute('height', String(SOLAR_VIEWBOX.height - SOLAR_VIEWBOX.horizonY));
  belowClip.append(belowRect);

  defs.append(aboveClip, belowClip);

  hiddenOrbit = createSvgElement('ellipse');
  hiddenOrbit.setAttribute('data-snapshot-calendar-orbit-hidden', '');
  hiddenOrbit.setAttribute('fill', 'none');
  hiddenOrbit.setAttribute('stroke', 'currentColor');
  hiddenOrbit.setAttribute('stroke-width', '1');
  hiddenOrbit.setAttribute('stroke-linecap', 'round');
  hiddenOrbit.setAttribute('stroke-dasharray', '2.4 2.4');
  hiddenOrbit.setAttribute('opacity', '0.45');
  hiddenOrbit.setAttribute('vector-effect', 'non-scaling-stroke');
  hiddenOrbit.setAttribute('clip-path', 'url(#snapshot-calendar-solar-below-horizon)');

  visibleOrbit = createSvgElement('ellipse');
  visibleOrbit.setAttribute('data-snapshot-calendar-orbit-visible', '');
  visibleOrbit.setAttribute('fill', 'none');
  visibleOrbit.setAttribute('stroke', 'currentColor');
  visibleOrbit.setAttribute('stroke-width', '1');
  visibleOrbit.setAttribute('stroke-linecap', 'round');
  visibleOrbit.setAttribute('vector-effect', 'non-scaling-stroke');
  visibleOrbit.setAttribute('clip-path', 'url(#snapshot-calendar-solar-above-horizon)');

  horizon = createSvgElement('line');
  horizon.setAttribute('data-snapshot-calendar-horizon', '');
  horizon.setAttribute('x1', '7');
  horizon.setAttribute('x2', '113');
  horizon.setAttribute('y1', String(SOLAR_VIEWBOX.horizonY));
  horizon.setAttribute('y2', String(SOLAR_VIEWBOX.horizonY));
  horizon.setAttribute('stroke', 'currentColor');
  horizon.setAttribute('stroke-width', '0.8');
  horizon.setAttribute('opacity', '0.38');
  horizon.setAttribute('vector-effect', 'non-scaling-stroke');

  svg.insertBefore(defs, svg.firstChild);
  svg.insertBefore(hiddenOrbit, marker);
  svg.insertBefore(visibleOrbit, marker);
  svg.insertBefore(horizon, marker);

  return { visibleOrbit, hiddenOrbit, horizon };
};

const renderSolarOrbit = (root: HTMLElement) => {
  const solar = root.querySelector<HTMLElement>('[data-snapshot-calendar-solar]');
  const marker = root.querySelector<SVGCircleElement>('[data-snapshot-calendar-sun-position]');
  const svg = marker?.ownerSVGElement;
  if (!solar || !marker || !svg) return;

  const { visibleOrbit, hiddenOrbit } = ensureOrbitElements(svg, marker);
  const sunrise = solar.dataset.sunrise;
  const sunset = solar.dataset.sunset;
  if (!sunrise || !sunset) {
    marker.setAttribute('opacity', '0');
    return;
  }

  const dateValue = sunrise.slice(0, 10);
  const currentTime = getHelsinkiMinuteKey(new Date());
  const geometry = getSolarOrbitGeometry(dateValue);
  const position = getSolarPosition(dateValue, currentTime, sunrise, sunset);

  if (!geometry || !position) {
    marker.setAttribute('opacity', '0');
    return;
  }

  const ellipseAttributes = {
    cx: geometry.cx.toFixed(2),
    cy: geometry.cy.toFixed(2),
    rx: geometry.rx.toFixed(2),
    ry: geometry.ry.toFixed(2),
  };

  for (const [name, value] of Object.entries(ellipseAttributes)) {
    visibleOrbit.setAttribute(name, value);
    hiddenOrbit.setAttribute(name, value);
  }

  svg.dataset.snapshotCalendarSolarCenterY = geometry.cy.toFixed(2);
  svg.dataset.snapshotCalendarSolarDeclination = geometry.declinationDegrees.toFixed(2);

  marker.setAttribute('cx', position.x.toFixed(2));
  marker.setAttribute('cy', position.y.toFixed(2));
  marker.dataset.snapshotCalendarSunAboveHorizon = String(position.aboveHorizon);
  marker.setAttribute('stroke', position.aboveHorizon ? 'var(--moss-deep)' : 'currentColor');
  marker.setAttribute('opacity', position.aboveHorizon ? '1' : '0.72');
};

export const initSnapshotCalendarSolarOrbit = () => {
  const root = document.querySelector<HTMLElement>('[data-current-snapshot]');
  if (!root || root.dataset.calendarSolarOrbitInitialized === 'true') return;

  root.dataset.calendarSolarOrbitInitialized = 'true';

  const render = () => renderSolarOrbit(root);
  root.addEventListener('snapshot:weather-forecast-updated', render);
  render();

  const timer = window.setInterval(render, REFRESH_INTERVAL_MS);
  window.addEventListener(
    'pagehide',
    () => {
      window.clearInterval(timer);
      root.removeEventListener('snapshot:weather-forecast-updated', render);
    },
    { once: true }
  );
};
