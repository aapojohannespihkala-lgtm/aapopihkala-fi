import { THREE } from './threeRuntime';
import { createMainViewScope, type MainViewFloor } from './privateModelMainViewScope';
import { loadedModelSha256 } from './privateModelSourceCards';
import { resolveT04PrimitiveSourceBinding } from './privateModelT04PrimitiveSourceBinding.mjs';
import { createSharedCdMaterialClip } from './privateModelSharedCdMaterialClip.mjs';
import { createT04FloorScopeBridge } from './privateModelT04FloorScopeBridge.mjs';

// Source package independently SHA/CRC checked. Only its exact parsed GLB can
// use this presentation contract. No donor, scope propagation or publish grant.
const R4E = Object.freeze({
  glbSha256: '2f42444401224f7b5bd62663c4227d78e3af0618c58c1961e317598cf7886680',
  zipSha256: 'e840c5fa14c0f919aa9617fdd9cd3ae144f511e5e0a023641e6599431b074807',
  scene: 32, node: 1276, mesh: 859, g1Node: 2832,
  objectKey: 'node@9bd394795b6bee37de9aea6f6b128cf93e9489a34015852d2d59082a3529013e:n1276',
});
const sameMatrix = (a: number[], b: number[]) => a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) < 1e-9);

export const createDViewRuntime = (gltf: any, renderer: THREE.WebGLRenderer) => {
  const root = gltf.scene as THREE.Object3D;
  const mainScope = createMainViewScope(root);
  let bridge: ReturnType<typeof createT04FloorScopeBridge> | null = null;
  let t04Status = 'T04_HOLD';
  let disposed = false;
  let evidence: any = null;
  let transformsUnchanged = () => false;
  const raycasts = new Map<THREE.Mesh, THREE.Mesh['raycast']>();
  const sourceSha256 = loadedModelSha256(gltf);
  const json = gltf.parser?.json;
  if (sourceSha256 === R4E.glbSha256 && gltf.scenes?.[R4E.scene] === root &&
      json?.scene === R4E.scene && json.nodes?.[R4E.node]?.mesh === R4E.mesh &&
      json.scenes[R4E.scene].nodes.includes(R4E.node) &&
      json.scenes[R4E.scene].nodes.includes(R4E.g1Node)) {
    const byRootNode = (index: number) => {
      // GLTFLoader clones reused roots for later scenes, and prunes their
      // associations. Its ordered scene-root array still maps exactly to
      // json.scenes[].nodes. Require that original order and exact extras.
      const nodes = json.scenes[R4E.scene].nodes;
      if (nodes.length !== root.children.length || nodes.filter((n: number) => n === index).length !== 1) return null;
      const candidate = root.children[nodes.indexOf(index)];
      const node = json.nodes[index];
      return candidate.userData.name === node.name && Object.entries(node.extras).every(([key, value]) =>
        JSON.stringify(candidate.userData[key]) === JSON.stringify(value)) ? candidate : null;
    };
    const sourceGroup = byRootNode(R4E.node);
    const g1 = byRootNode(R4E.g1Node);
    const binding = resolveT04PrimitiveSourceBinding({ root, sourceGroup,
      loadedZipSha256: R4E.zipSha256, expectedZipSha256: R4E.zipSha256,
      expectedObjectKey: R4E.objectKey, expectedNodeIndex: R4E.node, expectedMeshIndex: R4E.mesh } as any);
    if (binding.ok && binding.sharedMeshes && sourceGroup?.parent === root && g1?.parent === root &&
        g1.userData.sourceCoordinates === 'YLIS-G1-LOCAL Z-UP' &&
        g1.userData.axisInvariant === '+X->+X,+Y->-Z,+Z->+Y') {
      root.updateWorldMatrix(true, true);
      // This version's sourced G1 root defines the coordinate frame. Confirm
      // the original local transform, then use its actual matrixWorld.
      const expectedG1 = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
      const expectedWall = new THREE.Matrix4().fromArray(json.nodes[R4E.node].matrix);
      if (sameMatrix(g1.matrix.elements, expectedG1.elements) &&
          sameMatrix(sourceGroup.matrix.elements, expectedWall.elements)) {
        const g1World = [...g1.matrixWorld.elements];
        const wallWorld = [...sourceGroup.matrixWorld.elements];
        const primitiveState = binding.sharedMeshes.map((mesh: THREE.Mesh) => ({ mesh,
          geometry: mesh.geometry, world: [...mesh.matrixWorld.elements] }));
        transformsUnchanged = () => {
          // Do not traverse the entire 2,167-draw scene from the frame loop.
          g1.updateWorldMatrix(true, false);
          sourceGroup.updateWorldMatrix(true, false);
          return sourceGroup.parent === root && g1.parent === root &&
            sameMatrix(g1.matrixWorld.elements, g1World) && sameMatrix(sourceGroup.matrixWorld.elements, wallWorld) &&
            ['objectKey', 'apartmentScope', 'storeyScope', 'role', 'phaseScope'].every(key =>
              sourceGroup.userData.ylisViewScope?.[key] === (binding.source as any)?.[key]) &&
            sourceGroup.children.length === primitiveState.length && primitiveState.every(({ mesh, geometry, world }) => {
              mesh.updateWorldMatrix(true, false);
              return mesh.parent === sourceGroup && mesh.geometry === geometry && sameMatrix(mesh.matrixWorld.elements, world);
            });
        };
        evidence = { source: binding.source, expectedZipSha256: R4E.zipSha256,
          expectedObjectKey: R4E.objectKey, g1LocalToWorld: g1World, matrixReference: 'G1_LOCAL_TO_WORLD' };
        const clippingAdapters = binding.sharedMeshes.map((mesh: THREE.Mesh) => {
          const adapter = createSharedCdMaterialClip({ mesh, renderer, THREE } as any);
          // Three's raycaster does not implement shader clipping. Keep hits
          // only on the retained half of this original source primitive.
          const originalRaycast = mesh.raycast;
          raycasts.set(mesh, originalRaycast);
          mesh.raycast = function(raycaster, hits) {
            const candidates: THREE.Intersection[] = [];
            originalRaycast.call(this, raycaster, candidates);
            for (const hit of candidates) {
              const material = Array.isArray(this.material)
                ? this.material[hit.face?.materialIndex ?? 0] : this.material;
              const plane = adapter.active ? material.clippingPlanes?.at(-1) : null;
              if (!plane || plane.distanceToPoint(hit.point) >= -1e-7) hits.push(hit);
            }
          };
          return { ...adapter, get active() { return transformsUnchanged() && adapter.active; },
            get activeFloor() { return adapter.activeFloor; } };
        });
        bridge = createT04FloorScopeBridge({ mainScope, sharedMeshes: binding.sharedMeshes, clippingAdapters });
      }
    }
  }
  const restore = () => {
    if (bridge) bridge.apply('WHOLE');
    else mainScope.restore();
    t04Status = 'WHOLE_ORIGINAL';
  };
  const apply = (floor: MainViewFloor): ReturnType<typeof mainScope.apply> => {
    if (disposed) return null;
    if (bridge) {
      const result = bridge.apply(floor, transformsUnchanged() ? evidence : {});
      t04Status = result.status;
      return result.report ?? null;
    }
    t04Status = 'T04_HOLD';
    return mainScope.apply(floor);
  };
  return { apply, restore, enforce: mainScope.enforce, referenceCandidates: mainScope.referenceCandidates,
    dispose() {
      if (bridge) bridge.dispose(); else mainScope.restore();
      for (const [mesh, raycast] of raycasts) mesh.raycast = raycast;
      raycasts.clear(); disposed = true;
    },
    get available() { return mainScope.available; }, get active() { return mainScope.active; },
    get floor() { return mainScope.floor; },
    get t04Status() { return t04Status === 'T04_CLIPPED_SOURCE' && !mainScope.t04Granted ? 'T04_HOLD' : t04Status; },
    // No integrated K17 host proof exists for this source. Preserve WHOLE,
    // never inject donor treads or advertise a verified stair presentation.
    stairStatus: 'HOST_HOLD', sourceSha256,
  };
};
