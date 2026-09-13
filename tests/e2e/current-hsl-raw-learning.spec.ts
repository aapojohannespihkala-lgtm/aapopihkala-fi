import { expect, test } from '@playwright/test';
import {
  recordHslRawLearningSnapshot,
} from '../../functions/api/current/hsl-raw-learning';
import type {
  HslLearningDb,
  HslLearningDbStatement,
} from '../../functions/api/current/hsl-learning';

class FakeStatement implements HslLearningDbStatement {
  values: unknown[] = [];

  constructor(readonly query: string) {}

  bind(...values: unknown[]) {
    this.values = values;
    return this;
  }

  async run() {
    return undefined;
  }

  async all<T = Record<string, unknown>>() {
    return { results: [] as T[] };
  }

  async first<T = Record<string, unknown>>() {
    return null as T | null;
  }
}

const fakeDb = () => {
  const batches: FakeStatement[][] = [];
  const db: HslLearningDb = {
    prepare: (query) => new FakeStatement(query),
    batch: async (statements) => {
      batches.push(statements as FakeStatement[]);
      return [];
    },
    exec: async () => undefined,
  };
  return { db, batches };
};

test('scheduled raw HSL snapshot persists observations before model enrichment', async () => {
  const { db, batches } = fakeDb();
  const fetchedAt = '2026-09-13T10:00:00.000Z';
  const response = Response.json({
    fetchedAt,
    stop: { code: 'E3239', name: 'Ylisrinne' },
    routes: ['121', '125'],
    departures: [
      {
        route: '125',
        scheduledAt: '2026-09-13T10:05:00.000Z',
        departureAt: '2026-09-13T10:06:00.000Z',
        delaySeconds: 60,
        realtime: true,
        realtimeState: 'UPDATED',
        vehicle: {
          id: '12/345',
          latitude: 60.1,
          longitude: 24.7,
          distanceMeters: 800,
          bearing: 0,
          speedKmh: 24,
          updatedAt: '2026-09-13T09:59:55.000Z',
          currentStatus: 'IN_TRANSIT_TO',
        },
      },
    ],
  });

  await recordHslRawLearningSnapshot(response, db);

  expect(batches).toHaveLength(1);
  expect(batches[0]).toHaveLength(1);
  expect(batches[0][0].query).toContain('INSERT INTO hsl_eta_observations');
  expect(batches[0][0].values[0]).toBe('E3239|125|2026-09-13T10:05:00.000Z');
  expect(batches[0][0].values[9]).toBe(800);
});

test('scheduled raw HSL snapshot records a fresh near-stop arrival', async () => {
  const { db, batches } = fakeDb();
  const response = Response.json({
    fetchedAt: '2026-09-13T10:00:00.000Z',
    stop: { code: 'E3239', name: 'Ylisrinne' },
    routes: ['125'],
    departures: [
      {
        route: '125',
        scheduledAt: '2026-09-13T10:00:00.000Z',
        departureAt: '2026-09-13T10:00:20.000Z',
        delaySeconds: 20,
        realtime: true,
        realtimeState: 'UPDATED',
        vehicle: {
          id: '12/345',
          latitude: 60.1,
          longitude: 24.7,
          distanceMeters: 35,
          bearing: 0,
          speedKmh: 5,
          updatedAt: '2026-09-13T09:59:58.000Z',
          currentStatus: 'IN_TRANSIT_TO',
        },
      },
    ],
  });

  await recordHslRawLearningSnapshot(response, db);

  expect(batches).toHaveLength(1);
  expect(batches[0]).toHaveLength(2);
  expect(batches[0][0].query).toContain('INSERT OR IGNORE INTO hsl_eta_arrivals');
  expect(batches[0][0].values[5]).toBe('gps_near_stop');
  expect(batches[0][1].query).toContain('INSERT INTO hsl_eta_observations');
});
