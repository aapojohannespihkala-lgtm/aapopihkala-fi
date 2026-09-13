import { expect, test } from '@playwright/test';
import { filterRecordedPassagePayload } from '../../functions/api/current/hsl-recorded-passage';

test('recorded arrival removes only the still-attached GPS row', () => {
  const payload = {
    stop: { code: 'E3239' },
    departures: [
      {
        route: '125',
        scheduledAt: '2026-09-13T11:48:00.000Z',
        vehicle: { id: '12/345' },
      },
      {
        route: '125',
        scheduledAt: '2026-09-13T12:01:00.000Z',
        vehicle: { id: '12/678' },
      },
      {
        route: '125',
        scheduledAt: '2026-09-13T11:22:00.000Z',
        vehicle: null,
      },
    ],
  };

  const filtered = filterRecordedPassagePayload(
    payload,
    new Set(['E3239|125|2026-09-13T11:48:00.000Z', 'E3239|125|2026-09-13T11:22:00.000Z'])
  );

  expect(filtered.departures).toEqual([
    {
      route: '125',
      scheduledAt: '2026-09-13T12:01:00.000Z',
      vehicle: { id: '12/678' },
    },
    {
      route: '125',
      scheduledAt: '2026-09-13T11:22:00.000Z',
      vehicle: null,
    },
  ]);
});
