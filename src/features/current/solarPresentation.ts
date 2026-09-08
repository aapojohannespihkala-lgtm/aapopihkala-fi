const RAW_SOLAR_VIEWBOX = {
  width: 120,
  height: 44,
  horizonY: 22,
} as const;

const DISPLAY_SOLAR_VIEWBOX = {
  width: 120,
  height: 60,
  horizonY: 30,
} as const;

export const SOLAR_VERTICAL_EXAGGERATION = 1.35;

export const projectSolarDisplayY = (rawY: number) =>
  DISPLAY_SOLAR_VIEWBOX.horizonY +
  (rawY - RAW_SOLAR_VIEWBOX.horizonY) * SOLAR_VERTICAL_EXAGGERATION;

export const projectSolarDisplayEllipse = (rawCenterY: number, rawRadiusY: number) => ({
  centerY: projectSolarDisplayY(rawCenterY),
  radiusY: rawRadiusY * SOLAR_VERTICAL_EXAGGERATION,
});

const applySolarPresentation = (svg: SVGSVGElement) => {
  const visibleOrbit = svg.querySelector<SVGEllipseElement>(
    '[data-weather-solar-orbit-visible]'
  );
  const hiddenOrbit = svg.querySelector<SVGEllipseElement>(
    '[data-weather-solar-orbit-hidden]'
  );
  const horizon = svg.querySelector<SVGLineElement>('[data-weather-solar-horizon]');
  const marker = svg.querySelector<SVGCircleElement>('[data-weather-sun-position]');
  const aboveClip = svg.querySelector<SVGRectElement>('#weather-solar-above-horizon rect');
  const belowClip = svg.querySelector<SVGRectElement>('#weather-solar-below-horizon rect');

  if (!visibleOrbit || !hiddenOrbit || !horizon || !marker || !aboveClip || !belowClip) {
    return;
  }

  const rawCenterY = Number(svg.getAttribute('data-weather-solar-center-y'));
  const rawRadiusY = Number(visibleOrbit.getAttribute('ry'));
  const rawMarkerY = Number(marker.getAttribute('cy'));

  if (![rawCenterY, rawRadiusY, rawMarkerY].every(Number.isFinite)) return;

  const displayEllipse = projectSolarDisplayEllipse(rawCenterY, rawRadiusY);
  const displayMarkerY = projectSolarDisplayY(rawMarkerY);

  svg.setAttribute(
    'viewBox',
    `0 0 ${DISPLAY_SOLAR_VIEWBOX.width} ${DISPLAY_SOLAR_VIEWBOX.height}`
  );
  svg.setAttribute(
    'data-weather-solar-display-center-y',
    displayEllipse.centerY.toFixed(2)
  );
  svg.setAttribute(
    'data-weather-solar-vertical-exaggeration',
    SOLAR_VERTICAL_EXAGGERATION.toFixed(2)
  );

  for (const orbit of [visibleOrbit, hiddenOrbit]) {
    orbit.setAttribute('cy', displayEllipse.centerY.toFixed(2));
    orbit.setAttribute('ry', displayEllipse.radiusY.toFixed(2));
  }

  marker.setAttribute('cy', displayMarkerY.toFixed(2));

  horizon.setAttribute('y1', String(DISPLAY_SOLAR_VIEWBOX.horizonY));
  horizon.setAttribute('y2', String(DISPLAY_SOLAR_VIEWBOX.horizonY));

  aboveClip.setAttribute('y', '0');
  aboveClip.setAttribute('height', String(DISPLAY_SOLAR_VIEWBOX.horizonY));
  belowClip.setAttribute('y', String(DISPLAY_SOLAR_VIEWBOX.horizonY));
  belowClip.setAttribute(
    'height',
    String(DISPLAY_SOLAR_VIEWBOX.height - DISPLAY_SOLAR_VIEWBOX.horizonY)
  );
};

export const initCurrentSolarPresentation = () => {
  const svg = document.querySelector<SVGSVGElement>(
    '.current-shell [data-weather-solar-arc]'
  );
  if (!svg || svg.dataset.solarPresentationInitialized === 'true') return;
  svg.dataset.solarPresentationInitialized = 'true';

  const apply = () => applySolarPresentation(svg);

  window.addEventListener('current:data-updated', (event) => {
    if (!(event instanceof CustomEvent) || event.detail?.source !== 'weather') return;
    apply();
  });

  apply();
};
