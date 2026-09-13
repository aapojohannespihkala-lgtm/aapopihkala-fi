import { expect, test } from '@playwright/test';
import { chooseVehicle } from '../../functions/api/current/hsl';
import type { HslVehiclePosition } from '../../functions/api/current/hsl-vehicle-positions';

const vehicle = (stopId: string, latitude = 60.17): HslVehiclePosition => ({
  routeId: '2125',
  directionId: 1,
  startDate: '20260913',
  startTime: '14:00:00',
  latitude,
  longitude: 24.73,
  bearing: null,
  speedMetersPerSecond: 0,
  timestamp: 1_789_300_000,
  stopId,
  currentStopSequence: null,
  currentStatus: 'STOPPED_AT',
  vehicleId: `vehicle-${stopId}`,
});

const departure = {
  route: '125',
  headsign: 'Tapiola',
  scheduledAt: '2026-09-13T12:23:00.000Z',
  departureAt: '2026-09-13T12:24:00.000Z',
  delaySeconds: 60,
  realtime: true,
  realtimeState: 'UPDATED',
  journeyKey: '2125|20260913|14:00:00|1',
  targetStopPosition: 2,
  // normalizeDeparture strips the HSL: prefix before vehicle selection.
  tripStopIds: ['stop-a', 'stop-b', 'E3239', 'stop-d'],
};

test('does not reattach a journey vehicle once its known stop is after Ylisrinne', () => {
  const selected = chooseVehicle(
    departure,
    [vehicle('HSL:stop-d')],
    60.17,
    24.73
  );

  expect(selected).toBeNull();
});

test('keeps a journey vehicle when its known stop is before or at Ylisrinne', () => {
  const approaching = vehicle('HSL:stop-b', 60.18);
  const selected = chooseVehicle(
    departure,
    [approaching, vehicle('HSL:stop-d', 60.17)],
    60.17,
    24.73
  );

  expect(selected?.vehicleId).toBe(approaching.vehicleId);
});

test('keeps fallback matching when GTFS-RT stop progress is unavailable', () => {
  const unknown = vehicle('');
  const selected = chooseVehicle(departure, [unknown], 60.17, 24.73);

  expect(selected?.vehicleId).toBe(unknown.vehicleId);
});
