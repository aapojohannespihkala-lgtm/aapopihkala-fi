export type CartesianLike = {
  x: number;
  y: number;
  z: number;
};

export type YlisBounds = {
  min: CartesianLike;
  max: CartesianLike;
};

const canonicalZero = (value: number) => (Object.is(value, -0) ? 0 : value);

const normalized = (value: number, digits: number) => {
  const rounded = Number(value.toFixed(digits));
  return canonicalZero(rounded);
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
