import { parseOriginalR1125, inspectR1125Presentation } from './privateModelM5AR1125GeometryPresence.mjs';
import { m5aR1125SourcePixelKinds } from './privateModelM5AR1125SourceRoiPixelProof.mjs';
import { deriveM5AR1125SourceCameraCenters } from './privateModelM5AR1125SourceCameraCenters.mjs';

const fail = reason => { throw Error('R1125_ORIGINAL_SCENE_BINDINGS_REJECTED: ' + reason); };
const expect = (yes, why) => { if(!yes) fail(why); };
const keys = Object.keys(m5aR1125SourcePixelKinds);

// A glTF node/mesh association proves identity, not that WebGL can paint the
// source. Reject unpaintable originals before ever returning a source binding.
// This is a necessary preflight, NOT proof of non-occlusion or real pixels.
const originalSourcePaintable = (object, root, scene) => {
  if (!scene.visible || !root.visible || !object.visible ||
      !object.geometry || !object.material) return false;
  const position = object.geometry.getAttribute?.('position');
  const index = object.geometry.getIndex?.();
  const minCount = object.isLineSegments ? 2 : 3;
  const available = index ? index.count : position?.count;
  const range = object.geometry.drawRange ?? {};
  const start = range.start ?? 0;
  const drawCount = range.count ?? Infinity;
  if (!Number.isInteger(position?.count) || position.count < minCount ||
      !Number.isInteger(available) || available < minCount ||
      !Number.isInteger(start) || start < 0 ||
      !(drawCount === Infinity || (Number.isInteger(drawCount) && drawCount >= 0)) ||
      Math.min(drawCount, available - start) < minCount) return false;
  const materials = Array.isArray(object.material) ? object.material : [object.material];
  return materials.length > 0 && materials.every(material => {
    if (!material || material.visible === false || material.colorWrite === false) return false;
    const opacity = material.opacity ?? 1;
    const alphaTest = material.alphaTest ?? 0;
    return Number.isFinite(opacity) && opacity > 0 && opacity <= 1 &&
      Number.isFinite(alphaTest) && alphaTest >= 0 && alphaTest < opacity;
  });
};

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
  // A glTF node with children but no mesh is a THREE.Object3D in the real
  // GLTFLoader, not a THREE.Group. The loaded scene itself is a Group.
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
  expect(actualRoot && actualRoot.isObject3D &&
    !actualRoot.isScene && !actualRoot.isMesh && !actualRoot.isLineSegments &&
    !actualRoot.isLine && !actualRoot.isCamera && !actualRoot.isLight &&
    actualRoot.geometry === undefined &&
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
    expect(object.parent === actualRoot &&
      originalSourcePaintable(object, actualRoot, actual),
      'original source node/mesh cannot paint into the viewer');
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


// Join two existing source-only gates. The imported camera gate verifies its
// own 13 source IDs and visible real GLTFLoader positions, while this adapter
// additionally requires each camera target to be the SAME Object3D previously
// bound to the original glTF node+mesh identity, not a name/color substitute.
export function projectR1125BoundSourceObjects({
  sourceDoc, gltf, camera, THREE, imageWidth, imageHeight,
} = {}) {
  const bound = bindR1125Scene63SourceObjects({ sourceDoc, gltf });
  const sceneRoot = gltf.scenes[63];
  const source = sourceDoc.scenes[63].extras ?? {};
  const actual = sceneRoot.userData ?? {};
  const provenanceFields = [
    'sourceDiameterCorrectionContract','sourceDiameterClassBreakdown',
    'Canonical','presentationOnly','workAssumption','humanReview',
    'currentGeometryClaim','asBuiltClaim','publishToCURRENT',
  ];
  for (const key of provenanceFields) {
    expect(Object.hasOwn(source, key) && actual[key] === source[key],
      'scene63 original versus loaded source provenance mismatch: ' + key);
  }
  const derived = deriveM5AR1125SourceCameraCenters({
    sceneRoot, camera, THREE, sceneIndex: 63, imageWidth, imageHeight,
  });
  expect(derived.sourceTargetCount === 13 && derived.centers?.length === 13,
    'exact original source projection count');

  // Do not trust projected names on caller-supplied synthetic geometry.
  // The projected source object must be identical to the original loaded
  // GLTFLoader object returned by the strict parser.associations gate.
  const actualByKey = new Map();
  sceneRoot.traverse(object => {
    const d = object.userData ?? {};
    const key = d.representationKind === 'unresolvedBoundaryMarker'
      ? 'boundary:' + d.boundaryRole : d.G2IdCandidate;
    if (!Object.hasOwn(m5aR1125SourcePixelKinds, key)) return;
    expect(!actualByKey.has(key), 'duplicate displayed source object: ' + key);
    actualByKey.set(key, object);
  });
  expect(actualByKey.size === 13, 'all displayed exact source objects required');
  for (const { key } of derived.centers) {
    expect(actualByKey.get(key) === bound.targets[key],
      'projected object differs from original glTF source node/mesh: ' + key);
  }
  return Object.freeze({
    sceneIndex: 63, sourceTargetCount: 13,
    sourceTargets: bound.targets,
    projectedCenters: Object.freeze(derived.centers.map(p =>
      Object.freeze({ key: p.key, u: p.u, v: p.v }))),
    radiusPx: derived.radiusPx,
    originalGlbDigestAuthenticated: false,
    originalSourceObjectIdentityVerified: true,
    productionScreenshotVerified: false,
    individualSourcePixelsVerified: false,
    current: false, canonical: false, asBuilt: false, humanReview: 'NOT_RUN',
  });
}

/**
 * Authentic raw bytes are required to make a source-identity claim.
 * Even with an authentic GLB and verified source projections, this is only a
 * preflight for future original screenshot hide/restore proofs.
 */
export function projectAuthenticatedR1125BoundSourceObjects({
  originalRaw, gltf, camera, THREE, imageWidth, imageHeight,
} = {}) {
  const source = parseOriginalR1125(originalRaw);
  const check = inspectR1125Presentation(source);
  expect(check.result === 'PASS', 'exact original R1125 geometry');
  const projected = projectR1125BoundSourceObjects({
    sourceDoc: source.doc, gltf, camera, THREE, imageWidth, imageHeight,
  });
  return Object.freeze({
    ...projected,
    originalGlbDigestAuthenticated: true,
    originalSourceDigest: 'c465417fc101e7de495d0a04bb4feb2bee61b80cd5efccf876f6eb76326f9a48',
    originalGlbBytes: originalRaw.byteLength,
    productionScreenshotVerified: false,
    individualSourcePixelsVerified: false,
    humanReview: 'NOT_RUN',
  });
}
