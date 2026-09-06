import { expect, test } from '@playwright/test';
import { shouldPollForTomorrowPublication } from '../../src/features/current/electricity';

const helsinkiTime = (hour: number, minute: number) =>
  new Date(Date.UTC(2026, 8, 6, hour - 3, minute));

test('tomorrow electricity publication polling uses the agreed Helsinki cadence', () => {
  expect(shouldPollForTomorrowPublication(helsinkiTime(14, 14))).toBe(false);
  expect(shouldPollForTomorrowPublication(helsinkiTime(14, 15))).toBe(true);
  expect(shouldPollForTomorrowPublication(helsinkiTime(14, 16))).toBe(true);
  expect(shouldPollForTomorrowPublication(helsinkiTime(14, 17))).toBe(true);
  expect(shouldPollForTomorrowPublication(helsinkiTime(14, 18))).toBe(false);
  expect(shouldPollForTomorrowPublication(helsinkiTime(14, 21))).toBe(false);
  expect(shouldPollForTomorrowPublication(helsinkiTime(14, 22))).toBe(true);
  expect(shouldPollForTomorrowPublication(helsinkiTime(14, 27))).toBe(true);
  expect(shouldPollForTomorrowPublication(helsinkiTime(14, 32))).toBe(true);
  expect(shouldPollForTomorrowPublication(helsinkiTime(14, 33))).toBe(false);
});
