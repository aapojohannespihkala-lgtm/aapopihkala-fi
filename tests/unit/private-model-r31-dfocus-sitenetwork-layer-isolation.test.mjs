import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { setR31SiteNetworkLayerMode } from '../../src/scripts/privateModelR31Inspection.mjs';
import { r31SiteLayerKeyForNetwork } from '../../src/scripts/privateModelR31SiteLayerKey.mjs';

const viewerSource = readFileSync(
  fileURLToPath(new URL('../../src/pages/private-model/index.astro', import.meta.url)), 'utf8',
);

test('R31 D focus hides source-only site networks and whole-building return rebinds Layerit', () => {
  const syncStart = viewerSource.indexOf('const r31SyncExteriorDonors = () => {');
  const syncEnd = viewerSource.indexOf('r31SyncExteriorDonorsHook = r31SyncExteriorDonors;');
  const dStart = viewerSource.indexOf('const deskEnterDFocus = (');
  const dEnd = viewerSource.indexOf('let deskSync = () => {};');
  const presetStart = viewerSource.indexOf('preset(id: string) {');
  const presetEnd = viewerSource.indexOf('angle(id: string) {', presetStart);
  assert.ok(syncStart >= 0 && syncEnd > syncStart && dStart >= 0 && dEnd > dStart);
  assert.ok(presetStart >= 0 && presetEnd > presetStart);
  const sync = viewerSource.slice(syncStart, syncEnd);
  const dFocus = viewerSource.slice(dStart, dEnd);
  const presets = viewerSource.slice(presetStart, presetEnd);

  // A D footprint is not a whole-building network scene; no unverified 2D
  // network should remain visible or selectable just because Layerit was on.
  assert.match(sync, /const whole = r31 && !focus &&/);
  assert.match(sync, /const siteOk = whole && Boolean\(r31Capabilities\(\)\?\.siteNetworks\)/);
  assert.match(sync, /control\.row\.hidden = !siteOk/);
  assert.match(sync, /const show = siteOk && mode !== 'hidden'/);
  assert.match(sync, /setR31SiteNetworkLayerMode\(group, mode, siteOk, r31SiteGhostOriginals\)/);
  assert.match(dFocus, /deskDFocus\.apply\(root, footprint\)/);
  assert.match(dFocus, /r31SyncExteriorDonors\(\)/);
  assert.match(presets, /applyStandardViewPreset\(target, true\)/);
  assert.match(presets, /r31SyncExteriorDonors\(\)/);

  // User-selected per-network mode survives temporary D-focus gating.
  assert.match(viewerSource, /const r31SiteLayerOverrides: Partial<Record<R31SiteKey, R31SiteMode>> = \{\}/);
  assert.match(sync, /r31SiteLayerOverrides\[key\] \?\? \(technical \? 'visible' : 'hidden'\)/);
  assert.doesNotMatch(dFocus, /delete r31SiteLayerOverrides|r31SiteLayerOverrides\s*=\s*\{\}/);
});

test('R31 source materials round-trip ghost -> D focus off -> ghost -> visible on every network row', () => {
  for (const key of ['drainage', 'infra', 'fiber', 'fiberEntry', 'storm', 'lowvolt']) {
    assert.ok(r31SiteLayerKeyForNetwork(key), key);
    let disposed = 0;
    let created = 0;
    const makeMaterial = (opacity) => ({
      opacity, transparent: false, depthWrite: true, emissiveIntensity: 0.5,
      clone() {
        created++;
        return { opacity: this.opacity, transparent: this.transparent,
          depthWrite: this.depthWrite, emissiveIntensity: this.emissiveIntensity,
          dispose() { disposed++; } };
      },
    });
    const source = [makeMaterial(0.8), makeMaterial(1)];
    const mesh = { isMesh: true, material: source };
    const group = { visible: true, traverse(visit) { visit(mesh); } };
    const originals = new Map();
    setR31SiteNetworkLayerMode(group, 'ghost', true, originals);
    assert.equal(group.visible, true, key);
    assert.equal(originals.size, 1, key);
    assert.equal(mesh.material[0].opacity, 0.17, key);
    setR31SiteNetworkLayerMode(group, 'ghost', false, originals);
    assert.equal(group.visible, false, key);
    assert.equal(mesh.material, source, key);
    assert.equal(originals.size, 0, key);
    assert.equal(disposed, 2, key);

    setR31SiteNetworkLayerMode(group, 'ghost', true, originals);
    assert.equal(group.visible, true, key);
    assert.equal(originals.size, 1, key);
    assert.notEqual(mesh.material, source, key);
    setR31SiteNetworkLayerMode(group, 'visible', true, originals);
    assert.equal(group.visible, true, key);
    assert.equal(mesh.material, source, key);
    assert.equal(originals.size, 0, key);
    assert.equal(created, 4, key);
    assert.equal(disposed, 4, key);
    assert.equal(source[0].opacity, 0.8, key);
    assert.equal(source[1].opacity, 1, key);
  }
});
