import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { THREE, GLTFLoader } from '../../src/scripts/threeRuntime';
import { createMainViewScope } from '../../src/scripts/privateModelMainViewScope';
import { createOtherFloorReference } from '../../src/scripts/privateModelOtherFloorReference';

// Private source remains outside git. Missing input is SKIP, never real-model PASS.
const path = process.env.YLIS_R4E_GLB;
const expectedSha = '2f42444401224f7b5bd62663c4227d78e3af0618c58c1961e317598cf7886680';
const sourceBytes = () => {
  const bytes = readFileSync(path!);
  expect(bytes.length).toBe(7309252);
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(expectedSha);
  return bytes;
};

test('actual R4E scene32 P4 batches every eligible source edge and restores all source state', async ({}, testInfo) => {
  test.skip(!path, 'Set YLIS_R4E_GLB to the immutable R4E source. No synthetic fallback.');
  const bytes = sourceBytes();
  // GLTFLoader uses this browser event even when parsing embedded buffers in Node.
  const previous = globalThis.ProgressEvent;
  if (!previous) globalThis.ProgressEvent = class {} as unknown as typeof ProgressEvent;
  let gltf;
  try { gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), ''); }
  finally { if (!previous) delete (globalThis as { ProgressEvent?: unknown }).ProgressEvent; }
  const root = gltf.scene;
  expect(gltf.scenes.indexOf(root)).toBe(32);
  const scene = new THREE.Scene(); scene.add(root);
  const sources: THREE.Mesh[] = [];
  root.traverse(o => { if ((o as THREE.Mesh).isMesh) sources.push(o as THREE.Mesh); });
  const original = sources.map(o => ({ object: o, visible: o.visible, geometry: o.geometry,
    material: o.material, metadata: JSON.stringify(o.userData), matrix: o.matrix.toArray() }));
  const originalStateSha = createHash('sha256').update(JSON.stringify(root.toJSON())).digest('hex');
  const filter = createMainViewScope(root);
  expect(filter.available).toBe(true);
  const controller = createOtherFloorReference(scene);
  const observations = [];
  for (const floor of ['1F', '2F'] as const) {
    filter.apply(floor);
    const candidates = filter.referenceCandidates();
    expect(candidates.length).toBeGreaterThan(16);
    const stateBeforeReference = sources.map(o => o.visible);
    const eligible = candidates.filter(c => {
      const edges = new THREE.EdgesGeometry((c.object as THREE.Mesh).geometry, 20);
      const count = edges.getAttribute('position').count; edges.dispose(); return count > 0;
    });
    const report = controller.update(true, candidates);
    expect(report.unsupported).toBe(0);
    expect(report.count).toBe(eligible.length);
    expect(controller.group.children).toHaveLength(1);
    const batch = controller.group.children[0] as THREE.LineSegments;
    expect(batch.userData.sourceObjectKeys).toEqual(eligible.map(c => c.objectKey));
    expect(new Set(batch.userData.sourceObjectKeys).size).toBe(eligible.length);
    expect(batch.userData.presentationOnly).toBe(true);
    expect(new THREE.Raycaster().intersectObjects(controller.group.children, true)).toEqual([]);
    const actual = batch.geometry.getAttribute('position');
    let offset = 0;
    // Independent per-source world-space edge extraction, including every vertex.
    for (const candidate of candidates) {
      const mesh = candidate.object as THREE.Mesh;
      const edges = new THREE.EdgesGeometry(mesh.geometry, 20);
      edges.applyMatrix4(mesh.matrixWorld);
      const wanted = edges.getAttribute('position');
      for (let i = 0; i < wanted.count; i++) {
        for (const axis of ['X', 'Y', 'Z'] as const) {
          if (actual[`get${axis}`](offset + i) !== wanted[`get${axis}`](i))
            throw new Error(`${floor}/${candidate.objectKey}: edge ${i} ${axis} differs`);
        }
      }
      offset += wanted.count;
      edges.dispose();
    }
    expect(actual.count).toBe(offset);
    expect(sources.map(o => o.visible)).toEqual(stateBeforeReference);
    expect(controller.update(true, candidates)).toEqual(report);
    expect(controller.group.children[0]).toBe(batch);
    let disposed = 0;
    batch.geometry.addEventListener('dispose', () => { disposed++; });
    controller.clear();
    expect(disposed).toBe(1);
    expect(controller.group.children).toHaveLength(0);
    observations.push({ floor, candidates: candidates.length, emptyEdges: candidates.length - eligible.length, sourceCount: report.count, edgeVertices: offset, drawCalls: 1 });
  }
  filter.apply('BOTH');
  expect(filter.referenceCandidates()).toEqual([]);
  filter.restore();
  controller.dispose();
  expect(scene.children).not.toContain(controller.group);
  for (const before of original) {
    expect(before.object.visible).toBe(before.visible);
    expect(before.object.geometry).toBe(before.geometry);
    expect(before.object.material).toBe(before.material);
    expect(JSON.stringify(before.object.userData)).toBe(before.metadata);
    expect(before.object.matrix.toArray()).toEqual(before.matrix);
  }
  expect(createHash('sha256').update(JSON.stringify(root.toJSON())).digest('hex')).toBe(originalStateSha);
  expect(createHash('sha256').update(sourceBytes()).digest('hex')).toBe(expectedSha);
  console.info('R4E P4:', JSON.stringify(observations));
  await testInfo.attach('r4e-p4-source-report', { body: JSON.stringify({ sha256: expectedSha, scene: 32,
    renderMeshes: sources.length, observations, browserWebGL: 'NOT_RUN', production: 'NOT_RUN' }, null, 2), contentType: 'application/json' });
});
