import { expect, test } from '@playwright/test';
import { parseHslVehiclePositions } from '../../functions/api/current/hsl-vehicle-positions';

const concatBytes = (...parts: Uint8Array[]) => {
  const result = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
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

const vehicleEntity = (vehicleId: string, timestamp?: number) => {
  const trip = concatBytes(
    stringField(2, '04:30:00'),
    stringField(3, '20260914'),
    stringField(5, '2125'),
    varintField(6, 1)
  );
  const position = concatBytes(floatField(1, 60.1719), floatField(2, 24.7314));
  const descriptor = stringField(1, vehicleId);
  const vehicleFields = [bytesField(1, trip), bytesField(2, position)];
  if (timestamp !== undefined) vehicleFields.push(varintField(5, timestamp));
  vehicleFields.push(bytesField(8, descriptor));
  return bytesField(2, bytesField(4, concatBytes(...vehicleFields)));
};

const asArrayBuffer = (bytes: Uint8Array) =>
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

test('HSL GTFS-RT parser ignores stale or implausibly timed vehicle positions', () => {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const feed = concatBytes(
    vehicleEntity('fresh', nowSeconds - 30),
    vehicleEntity('stale', nowSeconds - 10 * 60),
    vehicleEntity('future', nowSeconds + 2 * 60),
    vehicleEntity('missing')
  );

  const vehicles = parseHslVehiclePositions(asArrayBuffer(feed));

  expect(vehicles).toHaveLength(1);
  expect(vehicles[0]).toMatchObject({
    vehicleId: 'fresh',
    routeId: '2125',
    startDate: '20260914',
    startTime: '04:30:00',
  });
});
