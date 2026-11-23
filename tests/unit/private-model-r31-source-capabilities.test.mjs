import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
  R31_RUNTIME_EXTERIOR_KEYS,
  R31_VIEWER_SOURCE_CAPABILITY_TABLE,
  createViewerSourceCapabilities,
  r31RuntimeExteriorAllowed,
  r31ViewerSourceCapabilities,
} from '../../src/scripts/privateModelR31SourceCapabilities.mjs';
import { C80_R31_9E0B_SOURCE } from '../../src/scripts/privateModelC80R31ReviewRuntime.mjs';
import { R31_EXTERIOR_DONORS } from '../../src/scripts/privateModelR31Inspection.mjs';

const R31 = '9e0bf34fd838ddc92be12007412176a8ea449f66644f8876395ac6f659804ec3';
// RELEASED KANON-NEXT base of the R32 claim (Drive 12ZoBF9O…): not an accepted viewer model.
const R32_BASE = '29114e10fe7de711fba1465b8b1fb310b9433893f02f189b477f7d3536dbc97d';

test('only R31, R32H and R33 are accepted models', () => {
  assert.deepEqual(Object.keys(R31_VIEWER_SOURCE_CAPABILITY_TABLE).sort(), [R31, 'c26d99c11ffef90859ff17cad5edecf7ab22d811baddfa0506794ecdbef6294c', '3a226f987d5605eff523029d580b760167ae4a32f13ddd51248fe933d913c54c'].sort());
});

test('R31 keeps every site network and runtime exterior part (no behaviour change)', () => {
  assert.equal(C80_R31_9E0B_SOURCE.glbSha256, R31);
  const caps = r31ViewerSourceCapabilities(R31);
  assert.ok(caps);
  assert.equal(caps.siteNetworks, true);
  for (const key of R31_RUNTIME_EXTERIOR_KEYS) assert.equal(r31RuntimeExteriorAllowed(caps, key), true, key);
  assert.equal(r31ViewerSourceCapabilities(R31.toUpperCase()), caps);
  assert.ok(Object.isFrozen(caps) && Object.isFrozen(caps.runtimeExterior));
});

test('every R31 exterior donor key is covered by the capability list', () => {
  for (const key of Object.keys(R31_EXTERIOR_DONORS)) assert.ok(R31_RUNTIME_EXTERIOR_KEYS.includes(key), key);
});

test('fails closed for unknown, malformed and not-yet-received models', () => {
  for (const sha of [R32_BASE, null, undefined, '', 'constructor', '__proto__', R31.slice(1), `${R31}0`, 42]) {
    assert.equal(r31ViewerSourceCapabilities(sha), null, String(sha));
    assert.equal(r31RuntimeExteriorAllowed(r31ViewerSourceCapabilities(sha), 'rainwater'), false);
  }
  assert.equal(Object.keys(R31_VIEWER_SOURCE_CAPABILITY_TABLE).length, 3);
});

test('a successor with baked parts keeps networks but never doubles baked geometry', () => {
  const successor = 'a'.repeat(64);
  const lookup = createViewerSourceCapabilities({
    [successor]: { label: 'synthetic', siteNetworks: true, runtimeExterior: { carport: true, fiberBox: true } },
    'not-a-sha': { siteNetworks: true },
  });
  const caps = lookup(successor);
  assert.equal(caps.siteNetworks, true);
  for (const key of ['eastGable', 'gableBoarding', 'rainwater']) assert.equal(r31RuntimeExteriorAllowed(caps, key), false, key);
  assert.equal(r31RuntimeExteriorAllowed(caps, 'carport'), true);
  assert.equal(r31RuntimeExteriorAllowed(caps, 'unknownPart'), false);
  assert.equal(lookup('not-a-sha'), null);
  // Missing / non-boolean flags never grant anything.
  const loose = createViewerSourceCapabilities({ [successor]: { siteNetworks: 'yes', runtimeExterior: { rainwater: 1 } } })(successor);
  assert.equal(loose.siteNetworks, false);
  assert.equal(r31RuntimeExteriorAllowed(loose, 'rainwater'), false);
});

test('viewer gates site rows and exterior parts through the capability table', () => {
  const page = readFileSync(new URL('../../src/pages/private-model/index.astro', import.meta.url), 'utf8');
  assert.match(page, /r31ViewerSourceCapabilities\(layersLoadedSha\)/);
  assert.match(page, /const siteOk = whole && Boolean\(r31Capabilities\(\)\?\.siteNetworks\)/);
  assert.match(page, /const allowed = whole && r31ExteriorAllowed\(key\)/);
  assert.match(page, /if \(!r31ExteriorAllowed\(key\)\) continue;/);
  assert.match(page, /r31ExteriorDonors\.rainwater && r31ExteriorAllowed\('rainwater'\)/);
  assert.doesNotMatch(page, /const r31InspectionAvailable = \(\) =>\s*layersLoadedSha === C80_R31_9E0B_SOURCE/);
});
