import { expect, test } from '@playwright/test';

import {
  coordinateSteps,
  formatReviewCoordinate,
  heightScaleStepForSpan,
} from '../../src/scripts/privateModelReviewMath';

test('coordinateSteps keeps deterministic endpoints and decimal steps', () => {
  expect(coordinateSteps(2.5, 1)).toEqual([0, 1, 2, 2.5]);
  expect(coordinateSteps(2, 1)).toEqual([0, 1, 2]);
  expect(coordinateSteps(1, 0.25)).toEqual([0, 0.25, 0.5, 0.75, 1]);
});

test('formatReviewCoordinate uses three decimals and Finnish decimal comma', () => {
  expect(formatReviewCoordinate(12.3456)).toBe('12,346');
  expect(formatReviewCoordinate(0)).toBe('0,000');
  expect(formatReviewCoordinate(-0.125)).toBe('-0,125');
});

test('heightScaleStepForSpan preserves the exact review-scale thresholds', () => {
  expect(heightScaleStepForSpan(14)).toBe(1);
  expect(heightScaleStepForSpan(14.000001)).toBe(2);
  expect(heightScaleStepForSpan(28)).toBe(2);
  expect(heightScaleStepForSpan(28.000001)).toBe(5);
  expect(heightScaleStepForSpan(70)).toBe(5);
  expect(heightScaleStepForSpan(70.000001)).toBe(10);
});
