export type CartesianLike = {
  x: number;
  y: number;
  z: number;
};

export type YlisBounds = {
  min: CartesianLike;
  max: CartesianLike;
};

export type NavigatorViewerState = {
  clipZM?: number | null;
  objectMode?: string | null;
  roofVisible?: boolean | null;
  roofOpacity?: number | null;
};

const canonicalZero = (value: number) => (Object.is(value, -0) ? 0 : value);

const normalized = (value: number, digits: number) => {
  const rounded = Number(value.toFixed(digits));
  return canonicalZero(rounded);
};

const signedNumber = (value: number, digits: number) => {
  const fixed = normalized(value, digits);
  return `${fixed >= 0 ? '+' : ''}${fixed.toFixed(digits)}`;
};

export const viewerWorldToYlis = (value: CartesianLike): CartesianLike => ({
  x: canonicalZero(value.x),
  y: canonicalZero(-value.z),
  z: canonicalZero(value.y),
});

export const viewerBoundsToYlis = (
  min: CartesianLike,
  max: CartesianLike,
): YlisBounds => ({
  min: {
    x: canonicalZero(min.x),
    y: canonicalZero(-max.z),
    z: canonicalZero(min.y),
  },
  max: {
    x: canonicalZero(max.x),
    y: canonicalZero(-min.z),
    z: canonicalZero(max.y),
  },
});

export const formatYlisVector = (
  value: CartesianLike,
  digits = 2,
): string => {
  const x = normalized(value.x, digits).toFixed(digits);
  const y = normalized(value.y, digits).toFixed(digits);
  const z = normalized(value.z, digits).toFixed(digits);
  return `X ${x}  Y ${y}  Z ${z}`;
};

export const formatSignedYlisVector = (
  value: CartesianLike,
  digits = 2,
): string =>
  `X${signedNumber(value.x, digits)} Y${signedNumber(value.y, digits)} Z${signedNumber(value.z, digits)}`;

export const formatSignedYlisXY = (
  value: Pick<CartesianLike, 'x' | 'y'>,
  digits = 2,
): string =>
  `X${signedNumber(value.x, digits)} Y${signedNumber(value.y, digits)}`;

export const formatYlisBounds = (
  bounds: YlisBounds,
  digits = 2,
): string => {
  const format = (value: number) => normalized(value, digits).toFixed(digits);
  return [
    `X ${format(bounds.min.x)}..${format(bounds.max.x)}`,
    `Y ${format(bounds.min.y)}..${format(bounds.max.y)}`,
    `Z ${format(bounds.min.z)}..${format(bounds.max.z)}`,
  ].join('  ');
};

export const formatSignedYlisBounds = (
  bounds: YlisBounds,
  digits = 1,
): string => [
  `X${signedNumber(bounds.min.x, digits)}..${signedNumber(bounds.max.x, digits)}`,
  `Y${signedNumber(bounds.min.y, digits)}..${signedNumber(bounds.max.y, digits)}`,
  `Z${signedNumber(bounds.min.z, digits)}..${signedNumber(bounds.max.z, digits)}`,
].join(' · ');

const compassPoints = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;

export const formatHumanYlisLook = (value: CartesianLike): string => {
  const length = Math.hypot(value.x, value.y, value.z);
  if (length <= 1e-9) return '-';

  const x = value.x / length;
  const y = value.y / length;
  const z = value.z / length;
  const horizontal = Math.hypot(x, y);

  if (horizontal <= 1e-6) {
    return z >= 0 ? 'UP' : 'DOWN';
  }

  const azimuth = (Math.atan2(x, y) * 180 / Math.PI + 360) % 360;
  const compass = compassPoints[Math.round(azimuth / 45) % compassPoints.length];
  const elevation = Math.atan2(z, horizontal) * 180 / Math.PI;
  if (Math.abs(elevation) < 0.5) return `${compass} · LEVEL`;

  return `${compass} · ${Math.round(Math.abs(elevation))}° ${elevation > 0 ? 'UP' : 'DOWN'}`;
};

export const formatNavigatorState = ({
  clipZM,
  objectMode,
  roofVisible,
  roofOpacity,
}: NavigatorViewerState): string => {
  const parts: string[] = [];

  if (typeof clipZM === 'number' && Number.isFinite(clipZM)) {
    parts.push(`CLIP Z≤${signedNumber(clipZM, 2)}`);
  }

  if (objectMode) {
    const normalizedMode = objectMode.trim().toLowerCase();
    if (normalizedMode === 'isolate') parts.push('ISOLATE');
    else if (normalizedMode === 'hide') parts.push('HIDE');
    else if (normalizedMode) parts.push(normalizedMode.toUpperCase());
  }

  if (roofVisible === false) {
    parts.push('ROOF OFF');
  } else if (
    typeof roofOpacity === 'number' &&
    Number.isFinite(roofOpacity) &&
    roofOpacity < 0.995
  ) {
    parts.push(`ROOF ${Math.round(Math.max(0, Math.min(1, roofOpacity)) * 100)}%`);
  }

  return parts.join(' · ');
};
