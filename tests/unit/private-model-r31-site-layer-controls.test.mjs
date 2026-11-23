import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { r31SiteLayerKeyForNetwork } from '../../src/scripts/privateModelR31SiteLayerKey.mjs';
import { setR31SiteNetworkLayerMode } from '../../src/scripts/privateModelR31Inspection.mjs';

test('R31 fibre entry uses the existing fibre visibility row, not a fourth layer', () => {
  assert.equal(r31SiteLayerKeyForNetwork('drainage'), 'drainage');
  assert.equal(r31SiteLayerKeyForNetwork('infra'), 'infra');
  assert.equal(r31SiteLayerKeyForNetwork('fiber'), 'fiber');
  assert.equal(r31SiteLayerKeyForNetwork('fiberEntry'), 'fiber');
  assert.equal(r31SiteLayerKeyForNetwork('fiberBox'), null);
  assert.equal(r31SiteLayerKeyForNetwork('inventedPhysicalConnection'), null);
});

test('R31 site visibility also syncs the late fibre entry donor with exact source guards', () => {
  const source = readFileSync(fileURLToPath(new URL('../../src/pages/private-model/index.astro', import.meta.url)), 'utf8');
  assert.match(source, /import \{ r31SiteLayerKeyForNetwork \} from '[^']+privateModelR31SiteLayerKey\.mjs'/);
  assert.match(source, /r31SiteNetworks\.fiberEntry = buildR31FiberEntryLink\(THREE, R31_LOCUS_FIBER_LINES as any\)/);
  assert.match(source, /for \(const \[key, group\] of Object\.entries\(r31SiteNetworks\)\)/);
  assert.match(source, /const layerKey = r31SiteLayerKeyForNetwork\(key\)/);
  assert.match(source, /const mode = layerKey \? effectiveSiteModes\[layerKey\] \?\? 'hidden' : 'hidden'/);
  assert.match(source, /if \(show && group\.parent !== modelRoot\.parent\) modelRoot\.parent\?\.add\(group\)/);
  assert.match(source, /setR31SiteNetworkLayerMode\(group, mode, siteOk, r31SiteGhostOriginals\)/);
  // siteOk = whole-building view on an exactly accepted model with site networks.
  assert.match(source, /const siteOk = whole && Boolean\(r31Capabilities\(\)\?\.siteNetworks\)/);
  assert.match(source, /const wantsSiteNetworks = siteOk && /);
  // A source-only WORK_ASSUMPTION line remains a display aid, not a physical route.
  assert.doesNotMatch(source, /r31SiteNetworks\.fiberEntry\s*=\s*buildR31FiberEntryBox/);
});

test('R31 source materials survive visible, ghost and hidden mode transitions for every site group', () => {
  for (const key of ['drainage', 'infra', 'fiber', 'fiberEntry']) {
    let disposeCount = 0;
    let cloneCount = 0;
    const source = {
      opacity: 0.8, transparent: false, depthWrite: true, emissiveIntensity: 0.5,
      clone() {
        cloneCount += 1;
        return { opacity: this.opacity, transparent: this.transparent,
          depthWrite: this.depthWrite, emissiveIntensity: this.emissiveIntensity,
          dispose() { disposeCount += 1; } };
      },
    };
    const mesh = { isMesh: true, material: source };
    const group = { visible: true, traverse(visit) { visit(mesh); } };
    const originalMaterials = new Map();

    assert.ok(r31SiteLayerKeyForNetwork(key), `missing site layer for ${key}`);
    assert.equal(setR31SiteNetworkLayerMode(group, 'visible', true, originalMaterials), originalMaterials);
    assert.equal(group.visible, true);
    assert.equal(mesh.material, source);
    setR31SiteNetworkLayerMode(group, 'ghost', true, originalMaterials);
    const ghost = mesh.material;
    assert.notEqual(ghost, source, key);
    assert.equal(ghost.opacity, 0.17, key);
    assert.equal(ghost.transparent, true, key);
    assert.equal(ghost.depthWrite, false, key);
    assert.equal(ghost.emissiveIntensity, 0, key);
    assert.equal(originalMaterials.size, 1, key);
    setR31SiteNetworkLayerMode(group, 'ghost', true, originalMaterials);
    assert.equal(mesh.material, ghost, key);
    assert.equal(cloneCount, 1, key);
    setR31SiteNetworkLayerMode(group, 'hidden', true, originalMaterials);
    assert.equal(group.visible, false, key);
    assert.equal(mesh.material, source, key);
    assert.equal(disposeCount, 1, key);
    assert.equal(originalMaterials.size, 0, key);
    setR31SiteNetworkLayerMode(group, 'visible', true, originalMaterials);
    assert.equal(group.visible, true, key);
    assert.equal(mesh.material, source, key);
    assert.equal(source.opacity, 0.8, key);
    assert.equal(source.depthWrite, true, key);
  }
});

test('R31 leaving whole-building view restores every ghosted source material', () => {
  let disposed = 0;
  const makeSource = (opacity) => ({
    opacity, transparent: false, depthWrite: true,
    clone() {
      return { opacity: this.opacity, transparent: this.transparent, depthWrite: this.depthWrite,
        dispose() { disposed += 1; } };
    },
  });
  const originals = [makeSource(0.6), makeSource(1)];
  const line = { isLine: true, material: originals };
  const group = { visible: true, traverse(visit) { visit(line); } };
  const saved = new Map();

  setR31SiteNetworkLayerMode(group, 'ghost', true, saved);
  assert.equal(saved.size, 1);
  assert.equal(line.material.length, 2);
  assert.equal(line.material[0].opacity, 0.17);
  assert.equal(line.material[1].opacity, 0.17);
  setR31SiteNetworkLayerMode(group, 'ghost', false, saved);
  assert.equal(group.visible, false);
  assert.equal(line.material, originals);
  assert.equal(saved.size, 0);
  assert.equal(disposed, 2);
});
