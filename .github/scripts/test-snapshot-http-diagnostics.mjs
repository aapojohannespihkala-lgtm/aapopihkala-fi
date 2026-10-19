import assert from 'node:assert/strict';
import test from 'node:test';
import {
  snapshotEndpoint,
  snapshotResponseDiagnostic,
  snapshotRequestFailureDiagnostic,
} from './snapshot-http-diagnostics.mjs';

test('Snapshot HTTP diagnostics keep the exact status but strip query parameters', () => {
  assert.deepEqual(
    snapshotResponseDiagnostic('https://aapopihkala.fi/api/current/markets?token=do-not-log&portfolio=1', 502),
    { endpoint: '/api/current/markets', method: 'GET', httpStatus: 502 },
  );
  assert.deepEqual(
    snapshotResponseDiagnostic('https://aapopihkala.fi/api/current/electricity?v=6', 200),
    { endpoint: '/api/current/electricity', method: 'GET', httpStatus: 200 },
  );
});

test('Snapshot diagnostics identify weather requests without exposing coordinates', () => {
  assert.equal(
    snapshotEndpoint('https://api.open-meteo.com/v1/forecast?latitude=60.1&longitude=24.7'),
    'api.open-meteo.com/v1/forecast',
  );
});

test('Snapshot diagnostics capture network failures on relevant routes', () => {
  assert.deepEqual(
    snapshotRequestFailureDiagnostic('https://aapopihkala.fi/api/current/markets?key=secret', 'net::ERR_FAILED'),
    { endpoint: '/api/current/markets', method: 'GET', networkError: 'net::ERR_FAILED' },
  );
});

test('Snapshot diagnostics ignore unrelated, insecure and spoofed endpoints', () => {
  for (const url of [
    'https://example.com/api/current/markets',
    'https://aapopihkala.fi.evil.example/api/current/markets',
    'http://aapopihkala.fi/api/current/markets',
    'https://aapopihkala.fi/private-model/?token=secret',
    'https://api.open-meteo.com/v2/forecast',
    'not-a-url',
  ]) {
    assert.equal(snapshotEndpoint(url), null);
    assert.equal(snapshotResponseDiagnostic(url, 503), null);
    assert.equal(snapshotRequestFailureDiagnostic(url, 'failed'), null);
  }
});
