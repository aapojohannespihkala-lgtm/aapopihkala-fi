import { expect, test } from '@playwright/test';
import { THREE } from '../../src/scripts/threeRuntime';
import { createOtherFloorReference } from '../../src/scripts/privateModelOtherFloorReference';

test('large D-floor reference batches in world space without changing sources', () => {
  const scene = new THREE.Scene();
  const root = new THREE.Group();
  root.position.set(3, 2, -5);
  root.rotation.y = 0.31;
  scene.add(root);
  const geometry = new THREE.BoxGeometry(1, 2, 3);
  const material = new THREE.MeshBasicMaterial({ color: 0x778899 });
  const sources: THREE.Mesh[] = [];
  const candidates = Array.from({ length: 18 }, (_, index) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(index * 1.5, index * .3, -index * .2);
    mesh.rotation.z = index * .01;
    mesh.userData = { ylisViewScope: { objectKey: `source-${index}` } };
    root.add(mesh);
    sources.push(mesh);
    return { object: mesh, objectKey: `source-${index}` };
  });
  root.updateMatrixWorld(true);
  const original = JSON.stringify(root.toJSON());
  const controller = createOtherFloorReference(scene);
  expect(controller.update(true, candidates)).toEqual({ count: 18, unsupported: 0 });
  expect(controller.group.children).toHaveLength(1);
  const line = controller.group.children[0] as THREE.LineSegments;
  expect(line.userData.presentationOnly).toBe(true);
  expect(line.userData.sourceObjectKeys).toEqual(candidates.map(c => c.objectKey));
  expect(line.geometry).not.toBe(geometry);
  expect(line.matrix.elements).toEqual(new THREE.Matrix4().elements);
  const expected = new THREE.EdgesGeometry(geometry, 20);
  expected.applyMatrix4(sources[0].matrixWorld);
  const a = expected.getAttribute('position');
  const b = line.geometry.getAttribute('position');
  expect(b.count).toBe(a.count * candidates.length);
  for (let i = 0; i < a.count; i++) {
    expect(b.getX(i)).toBeCloseTo(a.getX(i), 5);
    expect(b.getY(i)).toBeCloseTo(a.getY(i), 5);
    expect(b.getZ(i)).toBeCloseTo(a.getZ(i), 5);
  }
  expected.dispose();
  expect(new THREE.Raycaster().intersectObjects(controller.group.children, true)).toEqual([]);
  expect(JSON.stringify(root.toJSON())).toBe(original);
  expect(sources[0].geometry).toBe(geometry);
  expect(sources[0].material).toBe(material);
  let disposals = 0;
  line.geometry.addEventListener('dispose', () => { disposals += 1; });
  expect(controller.update(true, candidates)).toEqual({ count: 18, unsupported: 0 });
  expect(controller.group.children[0]).toBe(line);
  sources[4].position.x += 1;
  controller.update(true, candidates);
  expect(disposals).toBe(1);
  expect(controller.group.children).toHaveLength(1);
  expect(controller.update(false, candidates)).toEqual({ count: 0, unsupported: 0 });
  expect(controller.group.children).toHaveLength(0);
  controller.dispose();
  expect(scene.children).not.toContain(controller.group);
  geometry.dispose();
  material.dispose();
});

test('small references keep individual source identities and unsupported inputs fail closed', () => {
  const scene = new THREE.Scene();
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshBasicMaterial();
  const first = new THREE.Mesh(geometry, material), second = new THREE.Mesh(geometry, material);
  scene.add(first, second);
  const controller = createOtherFloorReference(scene);
  const unsupported = new THREE.InstancedMesh(geometry, material, 2);
  expect(controller.update(true, [
    { object: first, objectKey: 'first' },
    { object: second, objectKey: 'second' },
    { object: unsupported, objectKey: 'not-supported' },
  ])).toEqual({ count: 2, unsupported: 1 });
  expect(controller.group.children).toHaveLength(2);
  expect(controller.group.children[0].userData.sourceObjectKey).toBe('first');
  expect(controller.group.children[1].userData.sourceObjectKey).toBe('second');
  expect(controller.group.children.every(child => child.userData.presentationOnly)).toBe(true);
  controller.dispose();
  geometry.dispose();
  material.dispose();
});
