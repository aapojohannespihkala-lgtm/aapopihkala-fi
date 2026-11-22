import test from 'node:test';
import assert from 'node:assert/strict';
import { applyD2FFloorDepthBias } from '../../src/scripts/privateModelFloorDepthBias.mjs';

const node = (name, extra = {}) => {
  const o = { name, parent: null, children: [], ...extra };
  o.add = c => { c.parent = o; o.children.push(c); return o; };
  o.traverse = v => { v(o); o.children.forEach(c => c.traverse(v)); };
  return o;
};
test('only the named 2F plank floor gets a polygon offset, once', () => {
  const root = node('scene');
  const planks = { name: 'OWNER2026_D2F_PALE_PLANK_FLOOR_VISUAL_1_WT_NONCURRENT', userData: {} };
  const gaps = { name: 'C80R2_V33_D2F_PLANK_GAP_LIGHT_SUBTLE', userData: {} };
  const wall = { name: 'WALL', userData: {} };
  const floor = node('C80R2_V33_D2F_PALE_PLANK_FLOOR_SINGLE_PLANE_LIGHT_GAPS');
  floor.add(node('C80R2_V33_D2F_PALE_PLANK_FLOOR_SINGLE_PLANE_LIGHT_GAPS_1', { isMesh: true, material: planks }));
  floor.add(node('C80R2_V33_D2F_PALE_PLANK_FLOOR_SINGLE_PLANE_LIGHT_GAPS_2', { isMesh: true, material: gaps }));
  root.add(floor).add(node('HI04_WALL', { isMesh: true, material: wall }));
  assert.equal(applyD2FFloorDepthBias(root), 2);
  assert.equal(planks.polygonOffset, true);
  assert.equal(planks.polygonOffsetUnits, -2);
  assert.equal(gaps.polygonOffsetUnits, -4);
  assert.equal(wall.polygonOffset, undefined);
  assert.equal(applyD2FFloorDepthBias(root), 0, 'idempotent per root');
});
