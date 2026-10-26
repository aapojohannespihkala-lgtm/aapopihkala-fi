import { THREE } from './threeRuntime';

type ReferenceCandidate = { object: THREE.Object3D; objectKey: string };

// A separate, unlit outline layer. The source's geometry, materials, metadata,
// visibility and selection identity never become presentation instances.
export const createOtherFloorReference = (scene: THREE.Scene) => {
  const group = new THREE.Group();
  group.name = 'VIEWER_OTHER_FLOOR_REFERENCE';
  group.visible = false;
  scene.add(group);
  const material = new THREE.LineBasicMaterial({
    color: 0xd2dae0, transparent: true, opacity: 0.18,
    depthWrite: false, depthTest: true,
  });
  let signature = '';
  let unsupported = 0;
  let drawn = 0;
  const clear = () => {
    for (const child of group.children) (child as THREE.LineSegments).geometry.dispose();
    group.clear();
    group.visible = false;
    signature = '';
    unsupported = 0;
    drawn = 0;
  };
  const update = (enabled: boolean, candidates: ReferenceCandidate[]) => {
    if (!enabled || candidates.length === 0) {
      if (group.children.length) clear();
      return { count: 0, unsupported: 0 };
    }
    const eligible: Array<{ object: THREE.Mesh; objectKey: string }> = [];
    let skipped = 0;
    for (const candidate of candidates) {
      const object = candidate.object as THREE.Mesh;
      if (!object.isMesh || (object as THREE.SkinnedMesh).isSkinnedMesh ||
          (object as THREE.InstancedMesh).isInstancedMesh || !object.geometry?.getAttribute('position')) {
        skipped += 1;
        continue;
      }
      object.updateWorldMatrix(true, false);
      eligible.push({ object, objectKey: candidate.objectKey });
    }
    const nextSignature = eligible.map(({ object, objectKey }) =>
      `${object.uuid}:${objectKey}:${object.geometry.uuid}:${object.matrixWorld.elements.join(',')}`).join('|');
    if (nextSignature !== signature) {
      clear();
      // A real D-floor reference can exceed 700 meshes. Merge large sets into
      // one non-pickable line draw call without modifying any source geometry.
      // Small fixtures keep their original per-source lines and metadata.
      if (eligible.length > 16) {
        const chunks: Float32Array[] = [];
        const sourceObjectKeys: string[] = [];
        let totalFloats = 0;
        for (const { object, objectKey } of eligible) {
          const edges = new THREE.EdgesGeometry(object.geometry, 20);
          if (edges.getAttribute('position')?.count) {
            // Edges are extracted in local space, then placed exactly as
            // the old per-object LineSegments.matrixWorld would place them.
            edges.applyMatrix4(object.matrixWorld);
            const attr = edges.getAttribute('position') as THREE.BufferAttribute;
            const copy = new Float32Array(attr.array as ArrayLike<number>);
            chunks.push(copy);
            totalFloats += copy.length;
            sourceObjectKeys.push(objectKey);
          }
          edges.dispose();
        }
        if (totalFloats) {
          const combined = new Float32Array(totalFloats);
          let offset = 0;
          for (const part of chunks) { combined.set(part, offset); offset += part.length; }
          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute('position', new THREE.BufferAttribute(combined, 3));
          const line = new THREE.LineSegments(geometry, material);
          line.name = 'Other floor outline batch';
          line.userData = { presentationOnly: true, sourceObjectKeys };
          line.raycast = () => {};
          group.add(line);
        }
        drawn = sourceObjectKeys.length;
      } else {
        for (const { object, objectKey } of eligible) {
          const geometry = new THREE.EdgesGeometry(object.geometry, 20);
          if (!geometry.getAttribute('position')?.count) { geometry.dispose(); continue; }
          const line = new THREE.LineSegments(geometry, material);
          line.name = 'Other floor outline';
          line.userData = { presentationOnly: true, sourceObjectKey: objectKey };
          line.matrixAutoUpdate = false;
          line.matrix.copy(object.matrixWorld);
          line.raycast = () => {};
          group.add(line);
          drawn += 1;
        }
      }
      signature = nextSignature;
    }
    unsupported = skipped;
    group.visible = group.children.length > 0;
    return { count: drawn, unsupported };
  };
  const dispose = () => { clear(); material.dispose(); group.removeFromParent(); };
  return { group, update, clear, dispose };
};
