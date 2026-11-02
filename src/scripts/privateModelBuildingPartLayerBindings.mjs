/**
 * High 1: opt-in, read-only building-part bindings for
 * privateModelLayerScopedPresentationBridge.ts.
 *
 * The caller MUST supply two independently obtained SHA-256 strings:
 * the selected source's verified manifest SHA and the hash computed from
 * the actual loaded GLB bytes. The resolver does not hash network content.
 * Rebuild the result for EVERY source, scene, scope or storey change.
 *
 * No name, appearance, coordinate or material-based inference. Source
 * glTF node extras are authoritative; runtime-injected userData is not.
 * An unclassified object is never passed to the presentation adapter.
 */

const SHA256 = /^[a-f0-9]{64}$/i;
const FLOOR = new Set(['1F', '2F', 'BOTH']);
const AREA = new Set(['D', 'WHOLE']);
const ACTIVE_PHASE = 'ACTIVE_IN_SELECTED_WORKTEST';
const acceptedRoles = new Set(['CONTENT', 'SHARED_BOUNDARY', 'OUTDOOR_D', 'UPPER_OCCLUDER']);
const allowedAreas = new Set(['D', 'A', 'B', 'C', 'SHARED_CD', 'SHARED_OTHER']);
const familyIds = Object.freeze({
  WALL: 'architecture-walls',
  DOOR: 'architecture-doors',
  WINDOW: 'architecture-windows',
  FLOOR: 'architecture-floors',
  CEILING: 'architecture-ceilings',
  FIXTURE: 'architecture-fixtures',
});
const sourceTags = Object.freeze([
  'G2Id', 'ParentG2Id', 'representationKind', 'presentationLayer',
  'presentationOnly', 'PresentationOnly', 'sourceRole', 'markerType',
  'physicalClaim', 'ModelStage', 'ylisViewScope',
]);

const unavailable = (reason, scene = null) => ({
  sourceVerified: false,
  bindings: [],
  frame: { activeSceneRoot: scene, availableNodeIds: [], gates: new Map() },
  evidence: [],
  excluded: [{ reason }],
});

const isMesh = (object) => object?.isMesh === true;
const associationNode = (associations, object) => {
  const index = associations?.get(object)?.nodes;
  return Number.isInteger(index) && index >= 0 ? index : null;
};
const isValidScope = (value) =>
  value && typeof value === 'object' && typeof value.objectKey === 'string' &&
  value.objectKey.trim() &&
  allowedAreas.has(value.apartmentScope) &&
  ['1F', '2F', 'BOTH', 'OUTSIDE_1F', 'OUTSIDE_2F', 'ROOF', 'UNKNOWN'].includes(value.storeyScope) &&
  acceptedRoles.has(value.role) && value.phaseScope === ACTIVE_PHASE;

const exactFamily = (value) => {
  const id = typeof value === 'string' ? value.toUpperCase() : '';
  if (/^G2_WALL_(EXT|PART|INT)_/.test(id)) {
    return {
      family: 'WALL',
      layerId: id.startsWith('G2_WALL_EXT_') ? 'architecture-walls-exterior'
        : id.startsWith('G2_WALL_PART_') ? 'architecture-walls-party'
          : 'architecture-walls-interior',
    };
  }
  if (/^G2_WALL_/.test(id)) return { family: 'WALL', layerId: 'architecture-walls' };
  for (const family of Object.keys(familyIds)) {
    if (id.startsWith('G2_' + family + '_')) return { family, layerId: familyIds[family] };
  }
  // Roof has an existing independent visibility/opacity controller. Binding
  // it here would give two controllers ownership of the same runtime meshes.
  if (id.startsWith('G2_ROOF_')) return { family: 'ROOF', layerId: null };
  return null;
};

const referenceOnly = (meta) => {
  const role = String(meta.sourceRole ?? '').toUpperCase();
  const kind = String(meta.representationKind ?? '').toUpperCase();
  const layer = String(meta.presentationLayer ?? '').toUpperCase();
  const marker = String(meta.markerType ?? '').toUpperCase();
  return meta.presentationOnly === true || meta.PresentationOnly === true ||
    /REFERENCE|SOURCE_ONLY|MEASURE|GUIDE|HELPER|HISTORICAL/.test(role) ||
    /REFERENCE|SOURCE_ONLY|MEASURE|GUIDE|HELPER|FOOTPRINT|ANCHOR|VOID|OPENING/.test(kind) ||
    /REFERENCE|MEASURE|GUIDE|HELPER|CURRENT_D_OUTLINE/.test(layer) ||
    /REFERENCE|MEASURE|GUIDE|HELPER/.test(marker) ||
    meta.physicalClaim === false;
};

const scopeGate = (scope, selectedArea, selectedFloor) => {
  if (!isValidScope(scope)) return { scopeAllowed: false, floorAllowed: false };
  const scopeAllowed = selectedArea === 'WHOLE'
    ? true
    : scope.apartmentScope === 'D' ||
      (scope.apartmentScope === 'SHARED_CD' && scope.role === 'SHARED_BOUNDARY');
  // BOTH elements cannot be assumed to have been split into 1F and 2F.
  const floorAllowed = selectedFloor === 'BOTH'
    ? scope.storeyScope !== 'UNKNOWN'
    : scope.storeyScope === selectedFloor ||
      scope.storeyScope === 'OUTSIDE_' + selectedFloor;
  return { scopeAllowed, floorAllowed };
};

const makeNodeHierarchy = (json, sceneIndex) => {
  const nodes = json?.nodes;
  const sourceScene = json?.scenes?.[sceneIndex];
  if (!Array.isArray(nodes) || !Array.isArray(sourceScene?.nodes)) return null;

  const parents = new Map();
  const reachable = new Set();
  const walk = (index, parent, stack) => {
    if (!Number.isInteger(index) || index < 0 || index >= nodes.length ||
        stack.has(index) || reachable.has(index)) return false;
    const node = nodes[index];
    if (!node || (node.children !== undefined && !Array.isArray(node.children))) return false;
    reachable.add(index);
    parents.set(index, parent);
    const next = new Set(stack);
    next.add(index);
    return (node.children ?? []).every((child) => walk(child, index, next));
  };
  if (!sourceScene.nodes.every((root) => walk(root, null, new Set()))) return null;
  return { nodes, parents, reachable };
};

const ancestorSourceNode = (object, scene, associations, hierarchy) => {
  let cursor = object;
  let previous = null;
  let index = null;
  let depth = 0;
  while (cursor && cursor !== scene && depth < 128) {
    const nextIndex = associationNode(associations, cursor);
    if (nextIndex !== null) {
      if (!hierarchy.reachable.has(nextIndex)) return null;
      if (index === null) index = nextIndex;
      if (previous !== null && nextIndex !== previous) {
        let sourceParent = hierarchy.parents.get(previous);
        while (sourceParent !== null && sourceParent !== nextIndex) {
          sourceParent = hierarchy.parents.get(sourceParent);
        }
        if (sourceParent !== nextIndex) return null;
      }
      previous = nextIndex;
    }
    cursor = cursor.parent;
    depth++;
  }
  if (cursor !== scene || index === null) return null;
  return index;
};

const sourceMetadata = (index, hierarchy) => {
  const meta = {};
  let current = index;
  let depth = 0;
  while (current !== null && current !== undefined && depth++ < 128) {
    const extras = hierarchy.nodes[current]?.extras;
    if (extras && typeof extras === 'object' && !Array.isArray(extras)) {
      for (const key of sourceTags) {
        if (!Object.hasOwn(meta, key) && Object.hasOwn(extras, key)) meta[key] = extras[key];
      }
    }
    current = hierarchy.parents.get(current);
  }
  return meta;
};

const sourceAncestorsVisible = (mesh, scene) => {
  let node = mesh;
  while (node) {
    if (node.visible !== true) return false;
    if (node === scene) return true;
    node = node.parent;
  }
  return false;
};

/**
 * @param {{
 *   gltf: { scenes: any[], parser: { json: any, associations: Map<any, any> } },
 *   expectedSourceSha256: string,
 *   loadedSourceSha256: string,
 *   sceneIndex: number,
 *   activeSceneRoot: any,
 *   area: 'D'|'WHOLE',
 *   floor: '1F'|'2F'|'BOTH'
 * }} input
 *
 * @returns {{sourceVerified:boolean, bindings: Array<{id:string,root:any}>,
 * frame:{activeSceneRoot:any,availableNodeIds:string[],gates:Map<any,object>},
 * evidence:Array<{id:string,sourceNodeIndex:number,objectKey:string,storeyScope:string,apartmentScope:string}>,
 * excluded:Array<{reason:string,sourceNodeIndex?:number}>}}
 */
export function resolveBuildingPartLayerBindings(input) {
  const { gltf, expectedSourceSha256, loadedSourceSha256, sceneIndex,
    activeSceneRoot: scene, area, floor } = input ?? {};
  if (!SHA256.test(expectedSourceSha256 ?? '') ||
      expectedSourceSha256.toLowerCase() !== String(loadedSourceSha256).toLowerCase()) {
    return unavailable('SOURCE_SHA_MISMATCH', scene);
  }
  if (!AREA.has(area) || !FLOOR.has(floor)) return unavailable('UNKNOWN_SCOPE', scene);
  if (!Number.isInteger(sceneIndex) || gltf?.scenes?.[sceneIndex] !== scene)
    return unavailable('SCENE_MISMATCH', scene);
  const hierarchy = makeNodeHierarchy(gltf?.parser?.json, sceneIndex);
  const associations = gltf?.parser?.associations;
  if (!hierarchy || !(associations instanceof Map) || typeof scene?.traverse !== 'function')
    return unavailable('MISSING_GLTF_SOURCE_MAP', scene);
  const bindings = [];
  const gates = new Map();
  const evidence = [];
  const excluded = [];
  const seenMeshes = new Set();
  scene.traverse((object) => {
    if (!isMesh(object) || seenMeshes.has(object)) return;
    seenMeshes.add(object);
    const sourceNodeIndex = ancestorSourceNode(object, scene, associations, hierarchy);
    if (sourceNodeIndex === null) {
      excluded.push({ reason: 'UNBOUND_SOURCE_NODE' });
      return;
    }
    const meta = sourceMetadata(sourceNodeIndex, hierarchy);
    const explicit = exactFamily(meta.G2Id) ?? exactFamily(meta.ParentG2Id);
    const scope = meta.ylisViewScope;
    if (!explicit || !explicit.layerId || referenceOnly(meta) || !isValidScope(scope)) {
      excluded.push({ reason: explicit?.family === 'ROOF' ? 'LEGACY_ROOF_CONTROLLER' :
        'UNCLASSIFIED_OR_REFERENCE', sourceNodeIndex });
      return;
    }
    const bound = scopeGate(scope, area, floor);
    const gate = {
      sourceAllowed: sourceAncestorsVisible(object, scene),
      scopeAllowed: bound.scopeAllowed,
      floorAllowed: bound.floorAllowed,
    };
    // Never bind disallowed meshes: restoring a legacy presentation would
    // otherwise turn a scope/floor-hidden mesh back on during dispose().
    if (!gate.sourceAllowed || !gate.scopeAllowed || !gate.floorAllowed) {
      excluded.push({ reason: 'SOURCE_SCOPE_OR_FLOOR_BLOCKED', sourceNodeIndex });
      return;
    }
    bindings.push({ id: explicit.layerId, root: object });
    gates.set(object, gate);
    evidence.push({
      id: explicit.layerId, sourceNodeIndex, objectKey: scope.objectKey,
      storeyScope: scope.storeyScope, apartmentScope: scope.apartmentScope,
    });
  });
  return {
    sourceVerified: true,
    bindings,
    frame: {
      activeSceneRoot: scene,
      availableNodeIds: [...new Set(bindings.map((binding) => binding.id))],
      gates,
    },
    evidence,
    excluded,
  };
}
