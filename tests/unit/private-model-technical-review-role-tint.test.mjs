import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createTechnicalReviewPresentation, technicalReviewSystemOf, technicalReviewRoleOf,
  TECHNICAL_REVIEW_LIGHT_ROLE_OPACITY,
} from '../../src/scripts/privateModelTechnicalReviewPresentation.mjs';

// Minimal stand-ins: a clonable material and a flat scene of meshes under optional role parents.
const material = name => ({ name, opacity: 1, transparent: true, depthWrite: true, emissiveIntensity: 0.45,
  userData: {}, disposed: false,
  clone() { return { ...this, userData: { ...this.userData }, clonedFrom: this }; }, dispose() { this.disposed = true; } });
function scene() {
  const root = { name: 'scene', parent: null, userData: {}, children: [],
    traverse(fn) { const walk = o => { fn(o); for (const c of o.children ?? []) walk(c); }; walk(this); } };
  const add = (parent, name, userData = {}, mesh = true) => {
    const o = { name, parent, userData, children: [], isMesh: mesh, material: { name: 'source-' + name },
      geometry: { attributes: { normal: {} } } };
    parent.children.push(o);
    return o;
  };
  return { root, add };
}
const palette = () => ({ surface: material('surface'), line: material('line'),
  systems: { VESI: material('VESI'), IV: material('IV'), SAHKO: material('SAHKO') } });

test('device, enclosure and accessory roles get a light tint; routes and unlabelled parts keep full color', () => {
  const { root, add } = scene();
  const heater = add(root, 'NIBE_ROOT', { m5System: 'VESI' }, false);
  const casing = add(heater, 'CASING', { ylisTechRole: 'DEVICE' });
  const foot = add(heater, 'FOOT', { ylisTechRole: 'ACCESSORY' });
  const pipe = add(heater, 'PIPE', { ylisTechRole: 'ROUTE' });
  const legacyPipe = add(root, 'KV_PIPE', { m5System: 'VESI' });
  const hood = add(root, 'HOOD_SHELL', { m5System: 'IV', ylisTechRole: 'DEVICE' });
  const enclosure = add(root, 'IV_ENCLOSURE', { m5System: 'IV', ylisTechRole: 'ENCLOSURE' });
  const duct = add(root, 'IV_DUCT', { m5System: 'IV' });
  const wall = add(root, 'WALL', {});
  let made;
  const review = createTechnicalReviewPresentation(root, [heater, legacyPipe, hood, enclosure, duct],
    () => (made = palette()), object => technicalReviewSystemOf(object, root));
  assert.equal(review.apply(true), true);
  for (const o of [casing, foot]) {
    assert.equal(o.material.clonedFrom, made.systems.VESI, o.name);
    assert.equal(o.material.opacity, TECHNICAL_REVIEW_LIGHT_ROLE_OPACITY);
    assert.equal(o.material.depthWrite, false);
  }
  assert.equal(casing.material, foot.material, 'one shared tint per system');
  for (const o of [hood, enclosure]) assert.equal(o.material.clonedFrom, made.systems.IV, o.name);
  assert.equal(pipe.material, made.systems.VESI, 'ROUTE keeps the full system color');
  assert.equal(legacyPipe.material, made.systems.VESI, 'no role metadata keeps the full system color');
  assert.equal(duct.material, made.systems.IV);
  assert.equal(wall.material, made.surface, 'building context stays grey');
  assert.equal(made.systems.VESI.opacity, 1, 'shared full-color material is not mutated');
  assert.deepEqual(review.systemCounts, { VESI: 4, IV: 3 }, 'tinted parts still count under their system');
  assert.equal(review.lightRoleCount, 4);
  const tints = [casing.material, hood.material];
  review.apply(false);
  assert.equal(casing.material.name, 'source-CASING', 'source materials restored');
  review.dispose();
  assert.ok(tints.every(t => t.disposed), 'viewer-owned tints are disposed with the palette');
});

test('a role without a technical system stays grey and palettes without clone keep full color', () => {
  const { root, add } = scene();
  const orphan = add(root, 'ROLE_ONLY', { ylisTechRole: 'DEVICE' });
  const device = add(root, 'DEVICE', { m5System: 'SAHKO', ylisTechRole: 'DEVICE' });
  const plain = { surface: { name: 's' }, line: { name: 'l' }, systems: { SAHKO: { name: 'SAHKO' } } };
  const review = createTechnicalReviewPresentation(root, [orphan, device], () => plain,
    object => technicalReviewSystemOf(object, root));
  review.apply(true);
  assert.equal(orphan.material, plain.surface);
  assert.equal(device.material, plain.systems.SAHKO);
  assert.equal(technicalReviewRoleOf(device, root), 'DEVICE');
  assert.equal(technicalReviewRoleOf(root.children[0], root), 'DEVICE');
  assert.equal(technicalReviewRoleOf({ parent: root, userData: {} }, root), null);
  review.dispose();
});
