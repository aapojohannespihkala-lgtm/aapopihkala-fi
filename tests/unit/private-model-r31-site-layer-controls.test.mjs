import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { r31SiteLayerKeyForNetwork } from '../../src/scripts/privateModelR31SiteLayerKey.mjs';

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
  assert.match(source, /setR31SiteNetworkLayerMode\(group, mode, whole, r31SiteGhostOriginals\)/);
  assert.match(source, /const wantsSiteNetworks = whole && /);
  // A source-only WORK_ASSUMPTION line remains a display aid, not a physical route.
  assert.doesNotMatch(source, /r31SiteNetworks\.fiberEntry\s*=\s*buildR31FiberEntryBox/);
});
