import assert from 'node:assert/strict';
import test from 'node:test';
import { R31_DRAINAGE_PROFILE } from '../../src/scripts/privateModelR31DrainageProfile.mjs';
import {
  r31DrainageRouteProfile, r31DrainageWellProfile, r31DrainageOpenEndProfiled, r31DrainageRouteCard, r31DrainageWellCard,
} from '../../src/scripts/privateModelR31Inspection.mjs';

const P = R31_DRAINAGE_PROFILE;
// Exact endpoints of the M5A-R3 Z1C scene59 source routes (glTF world, production model.glb 23.11.2026).
const SOURCE_ENDS = {
  PVK_SOK1: [[26.15, -5.405], [26.15, 0.75]], PVK_SOK3: [[26.15, -5.405], [26.15, -11.56]],
  SOK1_SOK2: [[26.15, 0.75], [-0.75, 0.75]], SOK3_BUILDING_END: [[26.15, -11.56], [-0.75, -11.56]],
  SOK2_BUILDING_END: [[-0.75, 0.75], [-0.75, -11.56]], PVK_DISCHARGE: [[26.15, -5.405], [28.65, -2.8]],
  PVK_PARKING: [[26.15, -5.405], [31.15, -5.405]],
};
const v = ([x, z], y = 0) => ({ x, y, z });

test('owner 23.11: every drain at least 1.0 m below ground and falling in the flow direction', () => {
  assert.equal(P.coverM, 1.0);
  assert.deepEqual(Object.keys(P.routes).sort(), Object.keys(SOURCE_ENDS).sort());
  for (const [name, r] of Object.entries(P.routes)) {
    assert.ok(r.coverM[0] >= 1.0 - 1e-9, `${name} cover ${r.coverM[0]}`);
    assert.ok(r.slope >= P.minSlope && r.slope >= r.sourceSlope - 1e-9, name);
    for (let i = 1; i < r.points.length; i += 1) assert.ok(r.points[i][1] <= r.points[i - 1][1] + 1e-9, `${name} rises at ${i}`);
    assert.ok(r.points[0][1] - r.points.at(-1)[1] > 0, `${name} has fall`);
  }
});

test('network is continuous: each pipe starts at or below its upstream end, PVK outlets below inlets', () => {
  const ends = {};
  for (const r of Object.values(P.routes)) (ends[r.to] ??= []).push(r.points.at(-1)[1]);
  for (const [name, r] of Object.entries(P.routes)) {
    if (ends[r.from]) assert.ok(r.points[0][1] <= Math.min(...ends[r.from]) + 1e-9, `${name} starts above ${r.from}`);
  }
  const pvkIn = Math.min(P.routes.PVK_SOK1.points.at(-1)[1], P.routes.PVK_SOK3.points.at(-1)[1]);
  for (const out of ['PVK_DISCHARGE', 'PVK_PARKING']) assert.ok(P.routes[out].points[0][1] <= pvkIn - 0.05 + 1e-9, out);
  for (const [id, w] of Object.entries(P.wells)) {
    assert.ok(w.bottomY < w.lowestPipeCentreY - P.pipeRadiusM, id);
    assert.ok(w.groundY - (w.lowestPipeCentreY + P.pipeRadiusM) >= 1.0 - 1e-9, `${id} pipe cover`);
    assert.equal(w.diameterM, 0.315);
  }
});

test('profile binds only to the exact source endpoints, wells and open ends', () => {
  for (const [name, [a, b]] of Object.entries(SOURCE_ENDS)) {
    assert.equal(r31DrainageRouteProfile(name, [v(a, -1), v([0, 0]), v(b, -1)]), P.routes[name], name);
    assert.equal(r31DrainageRouteProfile(name, [v(b), v(a)]), P.routes[name], `${name} reversed`);
    assert.equal(r31DrainageRouteProfile(name, [v([a[0] + 0.05, a[1]]), v(b)]), null, `${name} moved 5 cm`);
  }
  assert.equal(r31DrainageRouteProfile('constructor', [v([0, 0]), v([1, 1])]), null);
  assert.equal(r31DrainageRouteProfile(undefined, [v([0, 0]), v([1, 1])]), null);
  assert.equal(r31DrainageWellProfile('SOK2', v([-0.75, 0.75])), P.wells.SOK2);
  assert.equal(r31DrainageWellProfile('SOK2', v([-0.5, 0.75])), null);
  assert.equal(r31DrainageWellProfile('__proto__', v([0, 0])), null);
  assert.equal(r31DrainageOpenEndProfiled('G2_DRAIN_LINK_PVK_DISCHARGE_001'), true);
  assert.equal(r31DrainageOpenEndProfiled('G2_DRAIN_LINK_PVK_PARKING_001'), true);
  assert.equal(r31DrainageOpenEndProfiled('G2_DRAIN_LINK_UNKNOWN_001'), false);
});

test('info cards tell the source facts and the depth assumption apart', () => {
  const card = r31DrainageRouteCard('PVK_SOK1', P.routes.PVK_SOK1);
  assert.equal(card.drainFlow, 'SOK1 → PVK');
  assert.match(card.drainCoverM, /m maanpinnasta/);
  assert.match(card.drainCertainty, /^Varmaa:/);
  assert.match(card.drainUncertainty, /^Oletus: syvyys vähintään 1,0 m/);
  assert.equal(card.physicalZClaim, false);
  const well = r31DrainageWellCard('PVK', P.wells.PVK);
  assert.match(well.drainWellDepthM, /kansi maanpinnassa/);
  assert.match(well.drainUncertainty, /^Oletus:/);
});

test('all 3D drain segments keep their local fall and source route lengths', () => {
  // Prior coverage checked the end-to-end slope and monotonic Y; a local flat
  // or reversed segment could still pass. Coordinate rounding: 0.2 mm/m.
  const roundingTolerance = 0.0002;
  for (const [name, route] of Object.entries(P.routes)) {
    let measuredLengthM = 0;
    for (let i = 1; i < route.points.length; i++) {
      const a = route.points[i - 1];
      const b = route.points[i];
      const planLengthM = Math.hypot(b[0] - a[0], b[2] - a[2]);
      assert.ok(Number.isFinite(planLengthM) && planLengthM > 0, `${name} segment ${i} zero/invalid length`);
      assert.ok(Number.isFinite(a[1]) && Number.isFinite(b[1]), `${name} non-finite height`);
      const localFall = (a[1] - b[1]) / planLengthM;
      assert.ok(localFall >= route.slope - roundingTolerance,
        `${name} segment ${i} local fall ${localFall} < ${route.slope} (rounding tolerance)`);
      measuredLengthM += planLengthM;
    }
    assert.ok(Math.abs(measuredLengthM - route.lengthM) < 0.02,
      `${name} rendered XY path length ${measuredLengthM} differs from source length ${route.lengthM}`);
  }
});

test('3D drain routes join well pipes exactly and PVK outlets remain 50 mm below inlets', () => {
  // A route merely being lower than the previous one (previous test) does not
  // prove a geometrically continuous 3D pipe at a well.
  const atStart = (key) => P.routes[key].points[0][1];
  const atEnd = (key) => P.routes[key].points.at(-1)[1];
  const sameY = (a, b, msg) => assert.ok(Math.abs(a - b) < 0.001, `${msg}: ${a} vs ${b}`);
  sameY(atStart('SOK2_BUILDING_END'), P.wells.SOK2.lowestPipeCentreY, 'SOK2 north branch');
  sameY(atStart('SOK1_SOK2'), P.wells.SOK2.lowestPipeCentreY, 'SOK2 east branch');
  sameY(atEnd('SOK2_BUILDING_END'), atStart('SOK3_BUILDING_END'), 'NW corner continuation');
  sameY(atEnd('SOK3_BUILDING_END'), P.wells.SOK3.lowestPipeCentreY, 'SOK3 inlet');
  sameY(atEnd('SOK1_SOK2'), P.wells.SOK1.lowestPipeCentreY, 'SOK1 inlet');
  sameY(atStart('PVK_SOK1'), P.wells.SOK1.lowestPipeCentreY, 'SOK1 outlet');
  sameY(atStart('PVK_SOK3'), P.wells.SOK3.lowestPipeCentreY, 'SOK3 outlet');
  const pvkLowestInlet = Math.min(atEnd('PVK_SOK1'), atEnd('PVK_SOK3'));
  sameY(atStart('PVK_DISCHARGE'), pvkLowestInlet - 0.05, 'PVK discharge outlet');
  sameY(atStart('PVK_PARKING'), pvkLowestInlet - 0.05, 'PVK parking outlet');
  sameY(atStart('PVK_DISCHARGE'), P.wells.PVK.lowestPipeCentreY, 'PVK source well');
});
