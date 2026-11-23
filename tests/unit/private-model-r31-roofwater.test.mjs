import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { R31_ROOFWATER_PROFILE, R31_ROOFWATER_SOURCE } from '../../src/scripts/privateModelR31RoofWater.mjs';
import { buildR31RoofWaterOverlay } from '../../src/scripts/privateModelR31Inspection.mjs';
import { R31_DRAINAGE_PROFILE } from '../../src/scripts/privateModelR31DrainageProfile.mjs';
import { r31SiteLayerKeyForNetwork } from '../../src/scripts/privateModelR31SiteLayerKey.mjs';

const P = R31_ROOFWATER_PROFILE;
// T12 swan-neck outlet ends baked in R32H c26d99c1 (glTF world).
const DOWNPIPE_ENDS = {
  T12_2026_CD_LANSI_POHJOINEN: [-0.31, -0.29, -10.685],
  T12_2026_AB_ITA_POHJOINEN: [25.698, -0.614, -10.685],
  T12_2026_AB_ITA_ETELA: [25.698, -0.614, 1.585],
};

test('roof water follows the owner field observations 23.11.2026 07.27', () => {
  assert.equal(R31_ROOFWATER_SOURCE.observation, 'OWNER_FIELD_OBSERVATION_20261123_0727_0837');
  assert.match(R31_ROOFWATER_SOURCE.wellProduct, /Melika/);
  assert.deepEqual(Object.keys(P.wells).sort(), ['RK_NE', 'RK_NW', 'RK_SE']);
  assert.deepEqual(Object.keys(P.pipes).sort(), ['RK_NE_OUTLET', 'RK_NW_OUTLET', 'RK_SE_OUTLET']);
  assert.deepEqual(Object.keys(P.gutters), ['SW_TEMP_GUTTER']);
  // West: both end near the SW corner, the piped one a few metres south of the gutter.
  const gutterEnd = P.gutters.SW_TEMP_GUTTER.points.at(-1);
  const nwEnd = P.pipes.RK_NW_OUTLET.points.at(-1);
  assert.ok(gutterEnd[0] < 0 && gutterEnd[2] > 3.64, 'gutter ends past the terrace (z 3.64)');
  const gap = nwEnd[2] - gutterEnd[2];
  assert.ok(gap >= 2 && gap <= 5, `NW outlet ${gap} m south of the gutter outlet`);
  // Owner 08.37: NE, SE and NW each own gutter well with its own pipe; SW only the gutter.
  for (const w of ['RK_NE', 'RK_SE', 'RK_NW']) {
    assert.equal(Object.values(P.pipes).filter((p) => p.from === w).length, 1, w);
    assert.ok(!Object.values(P.pipes).some((p) => p.to === w), `${w} receives no other pipe`);
  }
  assert.ok(!Object.values(P.wells).some((w) => w.downpipe === 'T12_2026_CD_LANSI_ETELA'), 'no SW well');
  // East outlets in the SE-corner green area, west of the carport (x 28.4).
  for (const id of ['RK_NE_OUTLET', 'RK_SE_OUTLET']) {
    const e = P.pipes[id].points.at(-1);
    assert.ok(e[0] > 25.5 && e[0] < 28.4 && e[2] > 1.7, `${id} outlet ${e}`);
  }
});

test('roof-water pipes fall towards the outlet with shallow cover, clear of the drains', () => {
  for (const [id, pipe] of Object.entries(P.pipes)) {
    for (let i = 1; i < pipe.points.length; i += 1) {
      assert.ok(pipe.points[i][1] <= pipe.points[i - 1][1] + 1e-9, `${id} never rises`);
    }
    assert.ok(pipe.coverM[0] >= 0.149, `${id} cover ${pipe.coverM}`);
    assert.ok(pipe.slope >= 0.005, `${id} slope`);
  }
  // NE pipe east of the salaoja wells/PVK at x 26.15, never through them.
  const wells = Object.values(R31_DRAINAGE_PROFILE.wells);
  for (const [x, , z] of P.pipes.RK_NE_OUTLET.points) {
    for (const w of wells) assert.ok(Math.hypot(x - w.x, z - w.z) > 0.3, `NE pipe at ${x},${z}`);
  }
  // Every gutter well sits below its downpipe outlet and reaches below its pipe.
  for (const [id, w] of Object.entries(P.wells)) {
    const end = DOWNPIPE_ENDS[w.downpipe];
    assert.ok(end, `${id} has a downpipe`);
    assert.ok(Math.hypot(end[0] - w.x, end[2] - w.z) <= w.hoodDiameterM / 2, `${id} under ${w.downpipe}`);
    const out = Object.values(P.pipes).find((p) => p.from === id);
    assert.ok(w.bottomY < out.points[0][1] - 0.15, `${id} sump`);
    assert.ok(w.groundY - w.bottomY >= 0.79, `${id} collector depth`);
  }
});

test('roof-water overlay: plain solids, card carries certainty and assumption', () => {
  const group = buildR31RoofWaterOverlay(THREE);
  assert.deepEqual(group.userData.counts, { ROOFWATER_WELL: 3, ROOFWATER_PIPE: 3, ROOFWATER_GUTTER: 1, ROOFWATER_CONNECTOR: 2 });
  for (const m of group.children) {
    assert.ok(m.isMesh, m.name);
    assert.equal(m.material.transparent, false, `${m.name} not drawn as uncertain`);
    assert.equal(m.userData.physicalZClaim, false);
    assert.equal(m.userData.asBuiltClaim, false);
    assert.match(m.userData.roofwaterUncertainty, /^Oletus: /);
  }
  for (const id of ['RK_NW_OUTLET', 'RK_NE_OUTLET', 'RK_SE_OUTLET', 'SW_TEMP_GUTTER']) {
    const m = group.getObjectByName(`R31_ROOFWATER_${id}`);
    assert.match(m.userData.roofwaterCertainty, /^Varmaa \(omistajan maastohavainto 23\.11\.2026\)/);
  }
  assert.match(group.getObjectByName('R31_ROOFWATER_RK_NE_OUTLET').userData.roofwaterCertainty, /purun tarkka kohta on vielä hieman epäselvä/);
  for (const id of ['RK_NW', 'RK_NE', 'RK_SE']) {
    for (const part of ['', '_SKIRT', '_HOOD']) assert.ok(group.getObjectByName(`R31_ROOFWATER_${id}${part}`), `${id}${part}`);
    assert.match(group.getObjectByName(`R31_ROOFWATER_${id}`).userData.roofwaterWell, /Melika/);
  }
  assert.match(group.getObjectByName('R31_ROOFWATER_SW_TEMP_GUTTER').userData.roofwaterCertainty, /terassin portaassa/);
  assert.equal(r31SiteLayerKeyForNetwork('roofwater'), 'roofwater');
});

test('viewer loads roof water as its own Layerit row behind the site-network gate', () => {
  const source = readFileSync(fileURLToPath(new URL('../../src/pages/private-model/index.astro', import.meta.url)), 'utf8');
  assert.match(source, /\['roofwater', 'Kattovedet: syöksyjen jatkot ja purut \(WORK_TEST\)'\]/);
  assert.match(source, /r31SiteNetworks\.roofwater = buildR31RoofWaterOverlay\(THREE\)/);
  assert.match(source, /const siteOk = whole && Boolean\(r31Capabilities\(\)\?\.siteNetworks\)/);
});

test('NW original owner photos support perforated Merika Avantgarde candidate but not a verified SKU', () => {
  assert.match(R31_ROOFWATER_SOURCE.wellProduct, /Merika Avantgarde 1780RS/);
  assert.equal(R31_ROOFWATER_SOURCE.northwestOriginalPhotoIds.length, 4);
  assert.match(R31_ROOFWATER_SOURCE.manufacturerUrl, /meltex\.fi/);
  for (const [id, w] of Object.entries(P.wells)) {
    assert.equal(w.skirtDiameterM, 0.34, id + ' D340');
    assert.equal(w.hoodDiameterM, 0.31, id + ' D310');
    assert.ok(Math.abs(w.hoodTopY - w.groundY - 0.249) < 1e-8, id + ' H249');
    assert.equal(w.productCandidate, id === 'RK_NW' ? 'PHOTO_MATCH_NEEDS_SKU' : 'MODEL_ASSUMPTION_NO_OWN_PHOTO');
  }
  const model = buildR31RoofWaterOverlay(THREE);
  for (const id of ['RK_NW', 'RK_NE', 'RK_SE']) {
    for (const part of ['_SKIRT', '_BASIN', '_HOOD', '_GRATE']) {
      const mesh = model.getObjectByName('R31_ROOFWATER_' + id + part);
      assert.ok(mesh?.isMesh, id + part + ' is mesh');
      assert.equal(mesh.userData.asBuiltClaim, false);
    }
    const grate = model.getObjectByName('R31_ROOFWATER_' + id + '_GRATE');
    assert.ok(grate.geometry.getAttribute('position').count > 200, id + ' perforated');
    assert.match(grate.userData.roofwaterUncertainty, /NE\/SE samalla mallilla vain oletus/);
  }
  assert.match(model.getObjectByName('R31_ROOFWATER_RK_NW').userData.roofwaterSourcePhotoIds, /1Hbw4Ir3c7WHg2PDU58KcN6v1W_uunuS8/);
  assert.equal(model.getObjectByName('R31_ROOFWATER_RK_NE').userData.roofwaterSourcePhotoIds, '');
});

test('Merika collector remains open below the perforated grate and NW host gap is explicit', () => {
  const model = buildR31RoofWaterOverlay(THREE);
  for (const id of ['RK_NW', 'RK_NE', 'RK_SE']) {
    const collector = model.getObjectByName('R31_ROOFWATER_' + id);
    const grate = model.getObjectByName('R31_ROOFWATER_' + id + '_GRATE');
    assert.equal(collector.geometry.parameters.openEnded, true, id + ': buried collector has no false sealed lid');
    assert.equal(collector.material.side, THREE.DoubleSide, id + ': visible internal collector wall');
    assert.ok(grate.geometry.parameters.shapes.holes.length >= 20, id + ': actual openings in the grate');
    assert.equal(collector.userData.asBuiltClaim, false);
    assert.equal(collector.userData.physicalZClaim, false);
  }
  const nw = P.wells.RK_NW;
  const sourceOutletY = DOWNPIPE_ENDS.T12_2026_CD_LANSI_POHJOINEN[1];
  const groundGapM = nw.groundY - sourceOutletY;
  const grateGapM = nw.grateY - sourceOutletY;
  assert.ok(groundGapM > 0.32 && groundGapM < 0.33, 'R32H T12 NW outlet currently ~324 mm under model ground');
  assert.ok(grateGapM > 0.39 && grateGapM < 0.41, 'T12 NW outlet currently ~399 mm under assumed grate');
  const nwCard = model.getObjectByName('R31_ROOFWATER_RK_NW').userData;
  assert.equal(nwCard.roofwaterHostStatus, 'SOURCE_HOST_HOLD');
  assert.match(nwCard.roofwaterUncertainty, /SOURCE_HOST_HOLD/);
  assert.match(nwCard.roofwaterUncertainty, /0,32 m/);
  assert.match(nwCard.roofwaterUncertainty, /0,40 m/);
  assert.equal(model.getObjectByName('R31_ROOFWATER_RK_NE').userData.roofwaterHostStatus, 'NO_PHOTO_VERIFIED_HOST');
});
