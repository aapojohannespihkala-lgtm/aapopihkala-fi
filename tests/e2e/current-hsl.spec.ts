import { expect, test } from '@playwright/test';
import { fetchHslDeparturesResponse } from '../../functions/api/current/hsl';

const concatBytes = (...parts: Uint8Array[]) => {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
};

const encodeVarint = (value: number) => {
  const bytes: number[] = [];
  let remaining = Math.floor(value);
  do {
    let byte = remaining % 128;
    remaining = Math.floor(remaining / 128);
    if (remaining > 0) byte |= 0x80;
    bytes.push(byte);
  } while (remaining > 0);
  return Uint8Array.from(bytes);
};

const fieldKey = (field: number, wireType: number) => encodeVarint(field * 8 + wireType);
const bytesField = (field: number, value: Uint8Array) =>
  concatBytes(fieldKey(field, 2), encodeVarint(value.length), value);
const stringField = (field: number, value: string) =>
  bytesField(field, new TextEncoder().encode(value));
const varintField = (field: number, value: number) =>
  concatBytes(fieldKey(field, 0), encodeVarint(value));
const floatField = (field: number, value: number) => {
  const buffer = new ArrayBuffer(4);
  new DataView(buffer).setFloat32(0, value, true);
  return concatBytes(fieldKey(field, 5), new Uint8Array(buffer));
};

const buildVehicleFeed = () => {
  const trip = concatBytes(
    stringField(2, '18:40:00'),
    stringField(3, '20260912'),
    stringField(5, '2125'),
    varintField(6, 1)
  );
  const position = concatBytes(
    floatField(1, 60.168),
    floatField(2, 24.7314),
    floatField(3, 5),
    floatField(5, 8.3)
  );
  const vehicleDescriptor = stringField(1, '12/345');
  const vehicle = concatBytes(
    bytesField(1, trip),
    bytesField(2, position),
    varintField(3, 1),
    varintField(4, 2),
    varintField(5, Math.floor(Date.now() / 1000)),
    stringField(7, '2323200'),
    bytesField(8, vehicleDescriptor)
  );
  const entity = bytesField(4, vehicle);
  return bytesField(2, entity);
};

const requestUrl = (input: RequestInfo | URL) =>
  typeof input === 'string' ? input : input instanceof Request ? input.url : input.toString();

test('HSL keeps a scheduled-past GPS bus active while it is still approaching', async ({ page }) => {
  const now = Date.now();
  const previousGoneScheduled = new Date(now - 12 * 60_000).toISOString();
  const previousGoneRealtime = new Date(now - 5 * 60_000).toISOString();
  const previousLateScheduled = new Date(now - 5 * 60_000).toISOString();
  const previousLateRealtime = new Date(now + 3 * 60_000).toISOString();
  const departureOne = new Date(now + 10 * 60_000).toISOString();
  const departureTwo = new Date(now + 20 * 60_000).toISOString();

  let requestCount = 0;
  await page.route('**/api/current/hsl', async (route) => {
    requestCount += 1;
    expect(route.request().method()).toBe('POST');
    expect(route.request().postDataJSON()).toEqual({
      stopCode: 'E3239',
      stopName: 'Ylisrinne',
      routes: ['121', '125'],
    });

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        source: 'HSL Digitransit',
        vehicleSource: 'HSL GTFS-RT',
        fetchedAt: new Date().toISOString(),
        stop: { code: 'E3239', name: 'Ylisrinne' },
        routes: ['121', '125'],
        departures: [
          {
            route: '121',
            headsign: 'Kamppi',
            scheduledAt: previousGoneScheduled,
            departureAt: previousGoneRealtime,
            delaySeconds: 420,
            realtime: true,
            realtimeState: 'UPDATED',
            vehicle: null,
          },
          {
            route: '125',
            headsign: 'Tapiola (M)',
            scheduledAt: previousLateScheduled,
            departureAt: previousLateRealtime,
            delaySeconds: 480,
            realtime: true,
            realtimeState: 'UPDATED',
            vehicle: {
              id: '12/345',
              latitude: 60.168,
              longitude: 24.7314,
              distanceMeters: 820,
              bearing: 5,
              speedKmh: 24.7,
              updatedAt: new Date(now - 4_000).toISOString(),
              currentStatus: 'IN_TRANSIT_TO',
            },
          },
          {
            route: '125',
            headsign: 'Tapiola (M)',
            scheduledAt: departureOne,
            departureAt: departureOne,
            delaySeconds: 0,
            realtime: true,
            realtimeState: 'UPDATED',
            vehicle: null,
          },
          {
            route: '121',
            headsign: 'Kamppi',
            scheduledAt: departureTwo,
            departureAt: departureTwo,
            delaySeconds: 0,
            realtime: false,
            realtimeState: 'SCHEDULED',
            vehicle: null,
          },
        ],
      }),
    });
  });

  await page.goto('/current/hsl/');

  await expect(page.getByText('HSL / YLISRINNE')).toBeVisible();
  await expect(page.getByText('121 + 125 / KAMPPI + TAPIOLA')).toBeVisible();
  await expect(page.locator('[data-hsl-status]')).toContainText('Ylisrinne / E3239 / 1 PREV / 3 LIVE / 1 GPS');
  await expect(page.locator('[data-hsl-departure]')).toHaveCount(4);
  await expect(page.locator('[data-hsl-previous="true"]')).toHaveCount(1);
  await expect(page.locator('[data-hsl-previous="false"]')).toHaveCount(3);

  const previousGone = page.locator('[data-hsl-previous="true"]').first();
  await expect(previousGone).toContainText('121');
  await expect(previousGone).toContainText('MIN AGO');
  await expect(previousGone).toContainText('+7 MIN');
  await expect(previousGone).toContainText('LIVE');

  const lateGps = page.locator('[data-hsl-previous="false"]').filter({ hasText: 'GPS / 820 M AWAY / 25 KM/H' });
  await expect(lateGps).toHaveCount(1);
  await expect(lateGps).toContainText('125');
  await expect(lateGps).toContainText('+8 MIN');
  await expect(lateGps.locator('[data-hsl-countdown]')).toContainText('MIN');
  await expect(lateGps.locator('[data-hsl-countdown]')).not.toContainText('AGO');
  await expect(lateGps.locator('[data-hsl-vehicle-age]')).toContainText('S');
  await expect(page.locator('.hsl-departure--first-upcoming')).toHaveCount(1);

  await expect(page.locator('[data-hsl-form]')).toHaveCount(0);
  await expect(page.locator('[data-hsl-stop]')).toHaveCount(0);
  await expect(page.locator('[data-hsl-routes]')).toHaveCount(0);
  expect(requestCount).toBeGreaterThanOrEqual(1);
});

test('HSL upstream query searches by stop name, selects code, and starts two hours in the past', async () => {
  let upstreamBody: Record<string, unknown> | null = null;
  const request = new Request('https://aapopihkala.fi/api/current/hsl', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      stopCode: 'E3239',
      stopName: 'Ylisrinne',
      routes: ['121', '125'],
    }),
  });

  const response = await fetchHslDeparturesResponse({
    request,
    apiKey: 'test-digitransit-key',
    fetchImpl: async (input, init) => {
      if (requestUrl(input).includes('vehicle-positions')) {
        return new Response(new Uint8Array(), { status: 200 });
      }

      upstreamBody = JSON.parse(String(init?.body));
      return new Response(
        JSON.stringify({
          data: {
            stops: [
              {
                gtfsId: 'HSL:2323240',
                name: 'Ylisrinne',
                code: 'E3240',
                lat: 60.171,
                lon: 24.732,
                stoptimesWithoutPatterns: [],
              },
              {
                gtfsId: 'HSL:2323239',
                name: 'Ylisrinne',
                code: 'E3239',
                lat: 60.1719,
                lon: 24.7314,
                stoptimesWithoutPatterns: [],
              },
            ],
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    },
  });

  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({
    stop: { code: 'E3239', name: 'Ylisrinne' },
  });
  expect(upstreamBody).not.toBeNull();

  const body = upstreamBody as unknown as {
    query: string;
    variables: { stopQuery: string; startTime: number; numberOfDepartures: number };
  };
  expect(body.query).toContain('$startTime: Long!');
  expect(body.query).toContain('startTime: $startTime');
  expect(body.query).toContain('stopPosition');
  expect(body.query).toContain('directionId');
  expect(body.query).toContain('gtfsId');
  expect(body.variables.stopQuery).toBe('Ylisrinne');
  expect(body.variables.numberOfDepartures).toBe(40);
  expect(
    Math.abs(body.variables.startTime - (Math.floor(Date.now() / 1000) - 2 * 60 * 60))
  ).toBeLessThan(5);
});

test('HSL matches a GTFS-RT vehicle to its exact scheduled journey', async () => {
  const serviceDay = Date.parse('2026-09-11T21:00:00Z') / 1000;
  const request = new Request('https://aapopihkala.fi/api/current/hsl', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      stopCode: 'E3239',
      stopName: 'Ylisrinne',
      routes: ['125'],
    }),
  });

  const response = await fetchHslDeparturesResponse({
    request,
    apiKey: 'test-digitransit-key',
    fetchImpl: async (input) => {
      if (requestUrl(input).includes('vehicle-positions')) {
        return new Response(buildVehicleFeed(), {
          status: 200,
          headers: { 'Content-Type': 'application/x-protobuf' },
        });
      }

      return new Response(
        JSON.stringify({
          data: {
            stops: [
              {
                gtfsId: 'HSL:2323239',
                name: 'Ylisrinne',
                code: 'E3239',
                lat: 60.1719,
                lon: 24.7314,
                stoptimesWithoutPatterns: [
                  {
                    serviceDay,
                    scheduledDeparture: 19 * 60 * 60,
                    realtimeDeparture: 19 * 60 * 60 + 5 * 60,
                    departureDelay: 5 * 60,
                    realtime: true,
                    realtimeState: 'UPDATED',
                    headsign: 'Tapiola (M)',
                    stopPosition: 1,
                    trip: {
                      directionId: '1',
                      route: {
                        gtfsId: 'HSL:2125',
                        shortName: '125',
                      },
                      stops: [
                        { gtfsId: 'HSL:2323200' },
                        { gtfsId: 'HSL:2323239' },
                        { gtfsId: 'HSL:2323300' },
                      ],
                      stoptimes: [
                        { scheduledDeparture: 18 * 60 * 60 + 40 * 60 },
                        { scheduledDeparture: 19 * 60 * 60 },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    },
  });

  expect(response.status).toBe(200);
  const payload = await response.json() as {
    departures: Array<{
      vehicle: {
        id: string;
        distanceMeters: number | null;
        speedKmh: number | null;
        currentStatus: string;
      } | null;
    }>;
  };

  expect(payload.departures).toHaveLength(1);
  expect(payload.departures[0].vehicle).toMatchObject({
    id: '12/345',
    currentStatus: 'IN_TRANSIT_TO',
  });
  expect(payload.departures[0].vehicle?.distanceMeters).toBeGreaterThan(350);
  expect(payload.departures[0].vehicle?.distanceMeters).toBeLessThan(500);
  expect(payload.departures[0].vehicle?.speedKmh).toBeCloseTo(29.9, 1);
});
