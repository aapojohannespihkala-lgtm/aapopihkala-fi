export const coordinateSteps = (max: number, step: number) => {
  const values: number[] = [];
  for (let value = 0; value < max - 1e-6; value += step) {
    values.push(Number(value.toFixed(6)));
  }
  if (!values.some((value) => Math.abs(value - max) < 1e-6)) values.push(max);
  return values;
};

export const formatReviewCoordinate = (value: number) =>
  value.toFixed(3).replace('.', ',');

export const heightScaleStepForSpan = (spanM: number) => {
  if (spanM <= 14) return 1;
  if (spanM <= 28) return 2;
  if (spanM <= 70) return 5;
  return 10;
};
