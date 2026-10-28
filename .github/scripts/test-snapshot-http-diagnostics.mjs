import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
  snapshotEndpoint,
  snapshotResponseDiagnostic,
  snapshotRequestFailureDiagnostic,
  widgetBrowserResponseFailure,
  widgetBrowserRequestFailure,
  widgetBrowserReady,
  widgetBrowserRenderableSections,
  widgetV2ProductionPayloadError,
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

test('Widget browser smoke detects only Widget v2 5xx and network failures', () => {
  const url = 'https://aapopihkala.fi/api/current/widget-v2?channel=prod&secret=never-log';
  assert.deepEqual(widgetBrowserResponseFailure(url, 503), {
    endpoint: '/api/current/widget-v2', method: 'GET', httpStatus: 503,
  });
  assert.equal(widgetBrowserResponseFailure(url, 200), null);
  assert.equal(widgetBrowserResponseFailure('https://aapopihkala.fi/api/current/markets', 503), null);
  assert.deepEqual(widgetBrowserRequestFailure(url, 'net::ERR_CONNECTION_RESET'), {
    endpoint: '/api/current/widget-v2', method: 'GET', networkError: 'net::ERR_CONNECTION_RESET',
  });
  assert.equal(widgetBrowserRequestFailure('https://example.com/api/current/widget-v2', 'net::ERR_FAILED'), null);
});

test('Widget browser smoke counts only distinct visible cards with real primary data', () => {
  const cards = ['weather', 'electricity', 'markets', 'rates'].map((id) => ({
    id, visible: true, primary: 'LIVE',
  }));
  assert.deepEqual(widgetBrowserRenderableSections(cards), cards.map(({ id }) => id));
  assert.deepEqual(widgetBrowserRenderableSections([
    ...cards.slice(0, 3),
    { ...cards[0] },
    { id: 'hsl', visible: false, primary: 'LIVE' },
    { id: 'liiga', visible: true, primary: '  ' },
    null,
  ]), ['weather', 'electricity', 'markets']);
  assert.deepEqual(widgetBrowserRenderableSections(null), []);

  const workflow = readFileSync(new URL('../workflows/current-snapshot-browser-smoke.yml', import.meta.url), 'utf8');
  assert.match(workflow, /getBoundingClientRect\(\)/);
  assert.match(workflow, /\.android-primary, \.metric-primary/);
  assert.match(workflow, /widgetBrowserRenderableSections\(diagnostics\.sections\)/);
});

// A timed-out Widget v2 probe must not suppress independent production browser checks.
test('Snapshot smoke keeps browser verification after an API failure', () => {
  const workflow = readFileSync(new URL('../workflows/current-snapshot-browser-smoke.yml', import.meta.url), 'utf8');
  assert.match(workflow, /- name: Verify Snapshot HTTP diagnostics\r?\n\s+if: \$\{\{ !cancelled\(\) \}\}/);
  assert.match(workflow, /- name: Install Chromium\r?\n\s+id: chromium\r?\n\s+if: \$\{\{ !cancelled\(\) \}\}/);
  for (const name of ['Verify production standalone Widget in browser', 'Verify production Snapshot sources in browser']) {
    assert.ok(workflow.includes(`- name: ${name}\n        if: \${{ !cancelled() && steps.chromium.outcome == 'success' }}`));
  }
});

test('Widget browser smoke requires fresh ready, not a stale fallback', () => {
  const healthy = {
    loadState: 'ready',
    sections: ['weather', 'electricity', 'markets', 'rates'],
    unavailable: false,
    failures: [],
  };
  assert.equal(widgetBrowserReady(healthy), true);
  for (const degraded of [
    { loadState: 'stale' },
    { loadState: 'error' },
    { loadState: 'loading' },
    { unavailable: true },
    { sections: healthy.sections.slice(0, 3) },
    { failures: ['http: 503'] },
  ]) {
    assert.equal(widgetBrowserReady({ ...healthy, ...degraded }), false);
  }

  const workflow = readFileSync(new URL('../workflows/current-snapshot-browser-smoke.yml', import.meta.url), 'utf8');
  assert.match(workflow, /widgetBrowserReady\(\{ \.\.\.diagnostics, sections: renderedSections, failures \}\)/);
});

test('Widget v2 production smoke rejects stale, future and malformed 200 payloads', () => {
  const now = Date.parse('2026-10-27T03:00:00.000Z');
  const healthy = {
    schemaVersion: 2,
    channel: 'prod',
    generatedAt: '2026-10-27T02:59:00.000Z',
    layouts: {
      compact: ['weather', 'electricity', 'markets', 'rates'],
      medium: ['weather', 'electricity', 'markets', 'rates'],
      large: ['weather', 'electricity', 'markets', 'rates'],
    },
    sections: ['weather', 'electricity', 'markets', 'rates'].map((id) => ({
      id, label: id.toUpperCase(), primary: 'LIVE',
    })),
  };
  assert.equal(widgetV2ProductionPayloadError(healthy, now), null);
  for (const bad of [
    { schemaVersion: 1 },
    { channel: 'dev' },
    { generatedAt: '2026-10-27T02:49:00.000Z' },
    { generatedAt: '2026-10-27T03:03:00.000Z' },
    { generatedAt: 'not-a-date' },
    { sections: healthy.sections.slice(0, 3) },
    { sections: [...healthy.sections.slice(0, 3), healthy.sections[0]] },
    { sections: [{ ...healthy.sections[0], primary: '' }, ...healthy.sections.slice(1)] },
    { sections: [{ ...healthy.sections[0], label: '' }, ...healthy.sections.slice(1)] },
    { layouts: undefined },
    { layouts: { ...healthy.layouts, compact: ['weather', 'electricity', 'markets'] } },
    { layouts: { ...healthy.layouts, medium: ['weather', 'electricity', 'markets', 'markets'] } },
    { layouts: { ...healthy.layouts, large: ['weather', 'electricity', 'markets', 'unknown'] } },
    { layouts: { ...healthy.layouts, large: ['weather', 'electricity', 'markets', 'liiga'] } },
  ]) {
    assert.notEqual(widgetV2ProductionPayloadError({ ...healthy, ...bad }, now), null);
  }
  assert.equal(widgetV2ProductionPayloadError(null, now), 'invalid_payload');

  const workflow = readFileSync(new URL('../workflows/current-snapshot-browser-smoke.yml', import.meta.url), 'utf8');
  assert.match(workflow, /widgetV2ProductionPayloadError\(payload\)/);
});
