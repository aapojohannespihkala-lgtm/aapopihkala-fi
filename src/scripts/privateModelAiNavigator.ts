export type CartesianLike = {
  x: number;
  y: number;
  z: number;
};

export type YlisBounds = {
  min: CartesianLike;
  max: CartesianLike;
};

const normalized = (value: number, digits: number) => {
  const rounded = Number(value.toFixed(digits));
  return Object.is(rounded, -0) ? 0 : rounded;
};

export const viewerWorldToYlis = (value: CartesianLike): CartesianLike => ({
  x: value.x,
  y: -value.z,
  z: value.y,
});

export const viewerBoundsToYlis = (
  min: CartesianLike,
  max: CartesianLike,
): YlisBounds => ({
  min: {
    x: min.x,
    y: -max.z,
    z: min.y,
  },
  max: {
    x: max.x,
    y: -min.z,
    z: max.y,
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
