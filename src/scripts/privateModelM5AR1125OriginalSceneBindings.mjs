import { parseOriginalR1125, inspectR1125Presentation } from './privateModelM5AR1125GeometryPresence.mjs';
import { m5aR1125SourcePixelKinds } from './privateModelM5AR1125SourceRoiPixelProof.mjs';

const fail = reason => { throw Error('R1125_ORIGINAL_SCENE_BINDINGS_REJECTED: ' + reason); };
const expect = (yes, why) => { if(!yes) fail(why); };
const keys = Object.keys(m5aR1125SourcePixelKinds);

/**
 * Source-document to actual GLTFLoader scene63 objects. The sourceDoc-only
 * entry point is for structural tests, NOT source byte authentication.
 * Source node/mesh identities come from the given original glTF hierarchy,
 * never from arbitrary object names or an invented source-target roster.
 */
export function bindR1125Scene63SourceObjects({ sourceDoc, gltf } = {}) {
  const scene = sourceDoc?.scenes?.[63];
  const actual = gltf?.scenes?.[63];
  const associations = gltf?.parser?.associations;
  expect(scene && Array.isArray(scene.nodes) &&
    actual?.isGroup && typeof actual.traverse === 'function' &&
    associations instanceof Map, 'loaded GLTFLoader scene63 and associations');
  const rootNodes = scene.nodes.filter(i =>
    sourceDoc.nodes?.[i]?.name ===
    'M5A_R1125_DIAMETER_SOURCE_SPLIT_WORK_TEST_ROOT_BABYLON_Y_UP');
  expect(rootNodes.length === 1, 'unique original root node');
  const rootIndex = rootNodes[0], root = sourceDoc.nodes[rootIndex];
  expect(Array.isArray(root.children) && root.children.length === 13 &&
    new Set(root.children).size === 13, '13 original direct source children');
  const sourceNodeSet = new Set(root.children);
  const byNode = new Map();
  // GLTFLoader visits these objects dynamically; the guarded result is a Group.
  /** @type {any} */
  let actualRoot = null;
  actual.traverse(object => {
    const assoc = associations.get(object);
    if (!assoc || !Number.isInteger(assoc.nodes)) return;
    if (assoc.nodes === rootIndex) {
      expect(!actualRoot, 'duplicate original root in loaded scene');
      actualRoot = object;
    }
    if (!sourceNodeSet.has(assoc.nodes)) return;
    expect(!byNode.has(assoc.nodes), 'duplicate mapped source node');
    byNode.set(assoc.nodes, object);
  });
  expect(actualRoot && actualRoot.isGroup &&
    Array.isArray(actualRoot.children) &&
    actualRoot.children.length === 13, 'source root and 13 child objects');
  expect(byNode.size === 13, 'all original child nodes mapped');
  const originalRotation = root.rotation;
  expect(Array.isArray(originalRotation) && originalRotation.length === 4 &&
    ['x','y','z','w'].every((c,i) =>
      Math.abs(actualRoot.quaternion[c] - originalRotation[i]) < 1e-6),
    'Babylon-to-Three root rotation preserved');
  const targetMap = new Map();
  for (const nodeIndex of root.children) {
    const node = sourceDoc.nodes[nodeIndex], data = node.extras ?? {};
    const key = data.representationKind === 'unresolvedBoundaryMarker'
      ? 'boundary:' + data.boundaryRole : data.G2IdCandidate;
    const object = byNode.get(nodeIndex), assoc = associations.get(object);
    expect(typeof key === 'string' &&
      Object.hasOwn(m5aR1125SourcePixelKinds, key) &&
      !targetMap.has(key), 'original 13 source keys are unique');
    const prim = sourceDoc.meshes?.[node.mesh]?.primitives;
    expect(Array.isArray(prim) && prim.length === 1 &&
      assoc?.nodes === nodeIndex && assoc?.meshes === node.mesh &&
      (assoc.primitives === undefined || assoc.primitives === 0) &&
      Object.keys(assoc).every(k=>['nodes','meshes','primitives'].includes(k)),
      'exact GLTFLoader source node and mesh association');
    const mode = prim[0].mode ?? 4;
    expect(mode === 1 ? object.isLineSegments : mode === 4 && object.isMesh,
      'source primitive draw-mode mismatch');
    expect(object.parent === actualRoot && object.visible &&
      object.geometry?.getAttribute?.('position')?.count >= (mode === 1 ? 2 : 3) &&
      object.material && object.material.visible !== false,
      'original visible source renderable direct child');
    for (const field of ['representationKind','Pass','G2IdCandidate','boundaryRole']) {
      if(Object.hasOwn(data,field)) {
        expect(object.userData?.[field] === data[field], 'loaded original source metadata drift: '+field);
      }
    }
    for (const flag of ['Canonical','currentGeometryClaim','asBuiltClaim','publishToCURRENT']) {
      expect(data[flag] === false && object.userData?.[flag] === false,
        'source no-promotion mismatch: '+flag);
    }
    expect(data.presentationOnly === true &&
      object.userData?.presentationOnly === true, 'source-only presentation');
    targetMap.set(key,object);
  }
  expect(targetMap.size === keys.length && keys.every(key=>targetMap.has(key)),
    'full exact source-id roster');
  return Object.freeze({
    sourceSceneIndex:63, sourceRoot:actualRoot,
    targets:Object.freeze(Object.fromEntries(keys.map(key=>[key,targetMap.get(key)]))),
    sourceTargetCount:13,
    originalGlbDigestAuthenticated:false,
    productionPixelsVerified:false,physicalDiameterVerified:false,
    current:false,canonical:false,asBuilt:false,humanReview:'NOT_RUN',
  });
}

/** Always verify exact original immutable R1125 raw GLB BEFORE a source claim. */
export function bindAuthenticatedR1125Scene63({originalRaw,gltf} = {}) {
  const source = parseOriginalR1125(originalRaw);
  const check = inspectR1125Presentation(source);
  expect(check.result === 'PASS', 'source geometry contract');
  const bound = bindR1125Scene63SourceObjects({ sourceDoc:source.doc,gltf });
  return Object.freeze({
    ...bound,
    originalGlbDigestAuthenticated:true,
    originalGlbBytes:originalRaw.length,
    originalSourceDigest:'c465417fc101e7de495d0a04bb4feb2bee61b80cd5efccf876f6eb76326f9a48',
    productionPixelsVerified:false,
  });
}
