import { expect, test } from '@playwright/test';
import { hslVehicleMatchesTargetStop } from '../../functions/api/current/hsl';

test('vehicle after Ylisrinne is not attached to the Ylisrinne departure', () => {
  expect(hslVehicleMatchesTargetStop({
    stopId: 'HSL:after',
    targetStopPosition: 1,
    tripStopIds: ['before', 'target', 'after', 'later'],
  })).toBe(false);
});

test('vehicle before or at Ylisrinne remains eligible', () => {
  expect(hslVehicleMatchesTargetStop({
    stopId: 'HSL:before',
    targetStopPosition: 1,
    tripStopIds: ['before', 'target', 'after'],
  })).toBe(true);

  expect(hslVehicleMatchesTargetStop({
    stopId: 'HSL:target',
    targetStopPosition: 1,
    tripStopIds: ['before', 'target', 'after'],
  })).toBe(true);
});

test('unknown stop metadata does not drop an otherwise valid vehicle', () => {
  expect(hslVehicleMatchesTargetStop({
    stopId: 'HSL:unknown',
    targetStopPosition: 1,
    tripStopIds: ['before', 'target', 'after'],
  })).toBe(true);
});
