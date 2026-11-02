import type { Object3D } from 'three';
import { nameMatches } from './privateModelSourceNodeAssociations.mjs';
import {
  createViewerScopedLayerPresentation,
  type ViewerScopedLayerRoot,
  type ViewerScopedLayerGate,
} from './privateModelLayerScopedPresentationBridge';

/**
 * HIGH2: metadata-only technical Layers inventory for the existing viewer.
 * It never creates routes, devices, geometry or a CURRENT/as-built claim.
 * Sol owns the index.astro mount and any shared hierarchy/type additions.
 */
export type TechnicalSystemId =
  | 'technical-electrical'
  | 'technical-ventilation'
  | 'technical-heating'
  | 'locus-water'
  | 'locus-wastewater'
  | 'p161-kvv-2017'
  | 'p161-iv-1974-plan'
  | 'p161-iv-1974-section';

export type TechnicalSourceRole = 'WORK_TEST_SOURCE' | 'HISTORICAL_PLAN' | 'REFERENCE_ONLY';
export type TechnicalAvailabilityReason =
  | 'AVAILABLE'
  | 'NO_OBJECTS_IN_SCENE'
  | 'SOURCE_MISMATCH'
  | 'UNVERIFIED_NODE_IDENTITY'
  | 'UNVERIFIED_SCOPE'
  | 'OUTSIDE_SCOPE'
  | 'OPT_IN_REQUIRED'
  | 'LAYER_ID_PENDING';

export type TechnicalSystemSummary = {
  id: TechnicalSystemId;
  labelFi: string;
  sourceRole: TechnicalSourceRole;
  sourceDescription: string;
  availability: 'available' | 'unavailable';
  reason: TechnicalAvailabilityReason;
  matchedCount: number;
  boundCount: number;
  /** This does not assert a current installation or an as-built model. */
  currentInstallationVerified: false;
};

export type TechnicalSourceNode = {
  object: Object3D;
  /** Indices refer to the exact loaded GLB JSON, not ZIP __sceneNN. */
  sceneIndex: number;
  nodeIndex: number;
  parentNodeIndex: number | null;
  nodeName: string;
  glbSha256: string;
  /** Source mesh index, required for source-JSON equipment profiles. */
  meshIndex?: number;
};

export type TechnicalSourceJson = {
  scenes?: readonly { name?: string; nodes?: readonly number[] }[];
  nodes?: readonly {
    name?: string; mesh?: number; children?: readonly number[];
    extras?: Record<string, unknown>;
  }[];
  meshes?: readonly { primitives?: readonly unknown[] }[];
};

export type TechnicalViewerScope = 'whole-building' | 'd-apartment' | 'd-1f' | 'd-2f' | 'site' | 'infra';

export type TechnicalSystemsContext = {
  sceneRoot: Object3D;
  sourceSceneIndex: number;
  loadedGlbSha256: string;
  expectedGlbSha256: string;
  /** Caller must derive this map from the verified glTF node graph. */
  sourceNodes: readonly TechnicalSourceNode[];
  /** Original immutable parser JSON, not a viewer-generated metadata overlay. */
  sourceJson?: TechnicalSourceJson;
  viewerScope: TechnicalViewerScope;
  /** Explicitly opt in to source/research geometry; never CURRENT. */
  allowSourceOnly?: boolean;
  allowHistoricalPlans?: boolean;
};

export type TechnicalBoundObject = {
  id: TechnicalSystemId;
  object: Object3D;
  sourceNodeIndex: number;
  sourceParentNodeIndex: number | null;
  sourceSceneIndex: number;
  sourceGlbSha256: string;
  sourceRole: TechnicalSourceRole;
  /** Leave sourceLinks on the original Object3D for the existing source cards. */
  sourceLinks: readonly unknown[];
  gate: ViewerScopedLayerGate;
};

const groups: ReadonlyArray<{
  id: TechnicalSystemId; labelFi: string; sourceRole: TechnicalSourceRole;
  sourceDescription: string;
}> = [
  { id: 'technical-electrical', labelFi: 'Sähkölaitteet ja valaisimet', sourceRole: 'WORK_TEST_SOURCE', sourceDescription: 'Lähteen nimetyt sähkö- ja valaisinosat, ei johdotusverkosto' },
  { id: 'technical-ventilation', labelFi: 'IV-laitteet ja venttiilit', sourceRole: 'WORK_TEST_SOURCE', sourceDescription: 'Lähteen nimetyt IV-osat, ei varmennettu nykyverkosto' },
  { id: 'technical-heating', labelFi: 'Patterit ja lämpöpumppu', sourceRole: 'WORK_TEST_SOURCE', sourceDescription: 'Lähteen nimetyt lämmityslaitteet, WORK_TEST-esitys' },
  { id: 'locus-water', labelFi: 'Vesi, Locus', sourceRole: 'REFERENCE_ONLY', sourceDescription: 'Locus-kunnallistekniikka, lähdereitit' },
  { id: 'locus-wastewater', labelFi: 'Viemärit, Locus', sourceRole: 'REFERENCE_ONLY', sourceDescription: 'Locus-kunnallistekniikka, lähdereitit' },
  { id: 'p161-kvv-2017', labelFi: 'KVV 2017', sourceRole: 'HISTORICAL_PLAN', sourceDescription: 'Vuoden 2017 KVV-suunnitelmat, ei as-built-reitti' },
  { id: 'p161-iv-1974-plan', labelFi: 'IV 1974, suunnitelma', sourceRole: 'HISTORICAL_PLAN', sourceDescription: 'Vuoden 1974 IV-piirustukset, ei nykyasennustieto' },
  { id: 'p161-iv-1974-section', labelFi: 'IV 1974, leikkaus', sourceRole: 'HISTORICAL_PLAN', sourceDescription: 'Vuoden 1974 IV-leikkaus, esityssivumalli' },
];

const recognizedRouteLayers = new Set([
  'G3_LOCUS_SITE', 'LOCUS_PARCEL_ROUTES', 'KVV_1974_SITE_ROUTES', 'KVV_2017_A1F_WATER',
]);

const classify = (data: Record<string, unknown>): TechnicalSystemId | null => {
  if (data.presentationLayer === 'MEP_ELECTRICAL') return 'technical-electrical';
  if (recognizedRouteLayers.has(String(data.presentationLayer ?? ''))) {
    if (data.presentationSubgroup === 'WATER') return 'locus-water';
    if (data.presentationSubgroup === 'WASTEWATER') return 'locus-wastewater';
  }

  const pass = String(data.Pass ?? '');
  if ((pass === 'P170A' || pass === 'P170D-R2') && data.presentationVisibilityAid === true) {
    if (data.familyRef === 'KVV_2017') return 'p161-kvv-2017';
    if (data.familyRef === 'IV_1974_PLAN') return 'p161-iv-1974-plan';
    if (String(data.familyRef ?? '').startsWith('IV_1974_SECTION')) return 'p161-iv-1974-section';
  }
  if ((pass === 'P156I' && data.Purpose === 'mainCandidate2017PresentationSuccessor') ||
      data.sourceFamily === 'KVV_MAIN_2017_WORK_ASSUMPTION') return 'p161-kvv-2017';
  if ((pass === 'P144C' && data.Purpose === 'presentationOnlyFederatedOverlay') ||
      (data.systemDomain === 'IV' && String(data.phase) === '1974' &&
       data.sourceGeometryDimension === '2D_XY_PLAN')) return 'p161-iv-1974-plan';
  if (data.Purpose === 'presentationOnlySectionSidecarRoot' ||
      (data.placementMode === 'PRESENTATION_SIDECAR' &&
       (typeof data.G3Id === 'string' || typeof data.g3Id === 'string')))
    return 'p161-iv-1974-section';
  return null;
};

const isRenderable = (object: Object3D): boolean => {
  const item = object as Object3D & {
    isMesh?: boolean; isLine?: boolean; isLineSegments?: boolean; isPoints?: boolean;
  };
  return item.isMesh === true || item.isLine === true ||
    item.isLineSegments === true || item.isPoints === true;
};

const ancestorChain = (object: Object3D, sceneRoot: Object3D): Object3D[] => {
  const chain: Object3D[] = [];
  let node: Object3D | null = object;
  for (let i = 0; node && i < 128 && node !== sceneRoot; i += 1) {
    chain.push(node);
    node = node.parent;
  }
  return node === sceneRoot ? chain : [];
};

const explicitSystem = (
  chain: readonly Object3D[],
  dataFor = (node: Object3D): Record<string, unknown> => node.userData,
): TechnicalSystemId | null => {
  for (const node of chain) {
    const id = classify(dataFor(node));
    if (id) return id;
  }
  // Existing Locus viewer metadata is deliberately split: the ancestor
  // identifies a source route layer, while the child identifies WATER/WASTEWATER.
  // Require BOTH explicit facts; neither alone authorizes a full group.
  const routeAncestor = chain.some((node) =>
    recognizedRouteLayers.has(String(dataFor(node).presentationLayer ?? '')));
  if (routeAncestor) {
    for (const node of chain) {
      if (dataFor(node).presentationSubgroup === 'WATER') return 'locus-water';
      if (dataFor(node).presentationSubgroup === 'WASTEWATER') return 'locus-wastewater';
    }
  }
  return null;
};

type Scope = { apartment: string; storey: string; phase: string };
const explicitScope = (
  chain: readonly Object3D[],
  dataFor = (node: Object3D): Record<string, unknown> => node.userData,
): Scope | null => {
  for (const node of chain) {
    const data = dataFor(node);
    if (Object.hasOwn(data, 'ylisViewScope')) {
      const view = data.ylisViewScope as Record<string, unknown> | null;
      if (!view || typeof view !== 'object') return null;
      const apartment = view.apartmentScope;
      const storey = view.storeyScope;
      const phase = view.phaseScope;
      if (!['D', 'A', 'B', 'C', 'SITE', 'SHARED_CD', 'SHARED_OTHER'].includes(String(apartment)) ||
          !['1F', '2F', 'BOTH', 'ROOF', 'OUTSIDE_1F', 'OUTSIDE_2F'].includes(String(storey)) ||
          !['ACTIVE_IN_SELECTED_WORKTEST', 'HISTORICAL', 'SUPERSEDED'].includes(String(phase))) return null;
      return { apartment: String(apartment), storey: String(storey), phase: String(phase) };
    }
    if (data.hostStorey === 'D_1F' || data.hostStorey === 'D_2F') {
      return { apartment: 'D', storey: data.hostStorey === 'D_1F' ? '1F' : '2F',
        phase: 'ACTIVE_IN_SELECTED_WORKTEST' };
    }
  }
  return null;
};

const withinScope = (scope: Scope, preset: TechnicalViewerScope): boolean => {
  if (scope.phase === 'SUPERSEDED') return false;
  if (preset === 'whole-building') return true;
  if (preset === 'site' || preset === 'infra') return scope.apartment === 'SITE' ||
    scope.apartment === 'SHARED_OTHER';
  if (scope.apartment !== 'D') return false; // SHARED_CD needs independent clipping
  if (preset === 'd-apartment') return scope.storey === '1F' || scope.storey === '2F';
  const floor = preset === 'd-1f' ? '1F' : '2F';
  return scope.storey === floor || scope.storey === 'OUTSIDE_' + floor;
};

const normalizedSha = (sha: string) => /^[0-9a-f]{64}$/.test(sha) ? sha : null;

/** V26 device identifiers inspected in its immutable original source JSON.
 * The selected original scene is the floor-membership proof. These names
 * identify equipment, not a claim about installed circuits, ducts or piping.
 */
export const V26_TECHNICAL_SOURCE_SHA256 =
  'cff2dbead53b7836747e10ef359637114ff723690ec380e313cec817e4f71d31';
const v26Scenes = { '1F': 174, '2F': 162, BOTH: 175 } as const;
const v26Device = (context: TechnicalSystemsContext, binding: TechnicalSourceNode): {
  id: TechnicalSystemId; scope: Scope;
} | null => {
  if (context.loadedGlbSha256 !== V26_TECHNICAL_SOURCE_SHA256 ||
      !Object.values(v26Scenes).includes(context.sourceSceneIndex as 174 | 162 | 175) ||
      !context.sourceJson) return null;
  const name = context.sourceJson.nodes?.[binding.nodeIndex]?.name ?? '';
  let id: TechnicalSystemId | null = null;
  let floor: '1F' | '2F' | null = null;
  const kiv = /^K10_R3_WORLD10_SC19_K10_R3_D([12])F_KIV100_ANCHOR_/.exec(name);
  if (kiv) { id = 'technical-ventilation'; floor = kiv[1] === '1' ? '1F' : '2F'; }
  else if (/^TOSHIBA_DAISEIKAI8_2026_OWNER_PHOTO_INDOOR_/.test(name)) {
    id = 'technical-heating'; floor = '1F';
  } else if (/^(?:HOB37_OWNER2026_KITCHEN_SOUTH_WINDOW2_RADIATOR_|C80R2_V17_D2F_RADIATOR_)/.test(name)) {
    id = 'technical-heating'; floor = '2F';
  } else if (/^PHOTO24_R1_WALL_LAMP_(?:MOUNT|NECK)_/.test(name) ||
      /^HOB36_PHOTO24_R1_WALL_LAMP_SHADE_/.test(name) ||
      /^D2F_KVIK_SINK_CEILING_RECESSED_SPOT_[123]_(?:WHITE_TRIM|DIM_RECESS)_/.test(name)) {
    id = 'technical-electrical'; floor = '2F';
  } else if (name === 'C80R2_D1F_TERRACE_CEILING_LAMP_ONLY_WORK_TEST') {
    id = 'technical-electrical'; floor = '1F';
  }
  if (!id || !floor ||
      (context.sourceSceneIndex !== v26Scenes.BOTH && context.sourceSceneIndex !== v26Scenes[floor])) return null;
  return { id, scope: { apartment: 'D', storey: floor, phase: 'ACTIVE_IN_SELECTED_WORKTEST' } };
};

/**
 * Read only. The caller owns GLTF loading and SHA verification. Missing/invalid
 * source index, parent identity or explicit floor/apartment metadata fails closed.
 * An off-scope object is never returned as a presentable binding.
 */
export const createTechnicalSystemLayerInventory = (context: TechnicalSystemsContext) => {
  const { sceneRoot, sourceSceneIndex, viewerScope } = context;
  const exactSource = normalizedSha(context.loadedGlbSha256) !== null &&
    context.loadedGlbSha256 === context.expectedGlbSha256;

  const indices = new Map<number, TechnicalSourceNode>();
  const sourceObjects = new Map<Object3D, TechnicalSourceNode>();
  const objects = new Set<Object3D>();
  const duplicateIndices = new Set<number>();
  const duplicateObjects = new Set<Object3D>();
  for (const binding of context.sourceNodes) {
    if (indices.has(binding.nodeIndex)) duplicateIndices.add(binding.nodeIndex);
    if (objects.has(binding.object)) duplicateObjects.add(binding.object);
    indices.set(binding.nodeIndex, binding);
    objects.add(binding.object);
    sourceObjects.set(binding.object, binding);
  }
  const validNode = (binding: TechnicalSourceNode) => {
    if (!exactSource || binding.glbSha256 !== context.loadedGlbSha256 ||
        binding.sceneIndex !== sourceSceneIndex ||
        !Number.isSafeInteger(binding.nodeIndex) || binding.nodeIndex < 0 ||
        duplicateIndices.has(binding.nodeIndex) || duplicateObjects.has(binding.object) ||
        binding.object.name !== binding.nodeName) return false;
    const json = context.sourceJson;
    if (json) {
      const definition = json.nodes?.[binding.nodeIndex];
      if (!definition || !nameMatches(binding.object, definition)) return false;
      if (isRenderable(binding.object) && (binding.meshIndex !== definition.mesh ||
          !Number.isSafeInteger(definition.mesh) ||
          !json.meshes?.[definition.mesh!]?.primitives?.length)) return false;
      const expectedParents = binding.parentNodeIndex === null
        ? json.scenes?.[sourceSceneIndex]?.nodes
        : json.nodes?.[binding.parentNodeIndex]?.children;
      if (!expectedParents?.includes(binding.nodeIndex)) return false;
      if (JSON.stringify(binding.object.userData.sourceLinks) !==
          JSON.stringify(definition.extras?.sourceLinks)) return false;
    }
    if (binding.parentNodeIndex === null) return binding.object.parent === sceneRoot;
    const parent = indices.get(binding.parentNodeIndex);
    return !!parent && parent.object === binding.object.parent &&
      !duplicateIndices.has(binding.parentNodeIndex);
  };
  const dataFor = (object: Object3D): Record<string, unknown> => context.sourceJson
    ? context.sourceJson.nodes?.[sourceObjects.get(object)?.nodeIndex ?? -1]?.extras ?? {}
    : object.userData;

  const matches = new Map<TechnicalSystemId, number>();
  const verified = new Map<TechnicalSystemId, number>();
  const outside = new Map<TechnicalSystemId, number>();
  const missingScope = new Map<TechnicalSystemId, number>();
  const needsOptIn = new Map<TechnicalSystemId, number>();
  const bound: TechnicalBoundObject[] = [];
  const increment = (map: Map<TechnicalSystemId, number>, id: TechnicalSystemId) =>
    map.set(id, (map.get(id) ?? 0) + 1);

  // Only source-bound renderable leaves are eligible. Never hand a whole
  // unclassified scene/group to the reversible ghost presentation bridge.
  for (const binding of context.sourceNodes) {
    const object = binding.object;
    if (!isRenderable(object)) continue;
    const chain = ancestorChain(object, sceneRoot);
    if (!chain.length) continue;
    let hasSourceRenderableChild = false;
    object.traverse((child) => {
      if (child !== object && sourceObjects.has(child) && isRenderable(child)) hasSourceRenderableChild = true;
    });
    if (hasSourceRenderableChild) continue;
    const device = v26Device(context, binding);
    const id = device?.id ?? explicitSystem(chain, dataFor);
    if (!id) continue;
    increment(matches, id);
    if (!validNode(binding)) continue;
    // Every ancestor between the renderable and the scene must be indexed
    // consistently, otherwise the node's original source card could drift.
    if (chain.some((ancestor) => {
      const match = sourceObjects.get(ancestor);
      return !match || !validNode(match);
    })) continue;
    increment(verified, id);
    // A profiled device's source scene and identifier are authoritative here.
    // Old ylisViewScope.objectKey hashes are never reused as source-card hashes.
    const scope = device?.scope ?? explicitScope(chain, dataFor);
    if (!scope) { increment(missingScope, id); continue; }
    if (!withinScope(scope, viewerScope)) { increment(outside, id); continue; }
    const group = groups.find((item) => item.id === id)!;
    const allowed = group.sourceRole === 'HISTORICAL_PLAN'
      ? context.allowHistoricalPlans === true
      : context.allowSourceOnly === true;
    if (!allowed || scope.phase === 'SUPERSEDED') { increment(needsOptIn, id); continue; }
    const sourceLinks = chain.flatMap((node) =>
      Array.isArray(node.userData.sourceLinks) ? node.userData.sourceLinks as unknown[] : []);
    bound.push({
      id, object, sourceNodeIndex: binding.nodeIndex,
      sourceParentNodeIndex: binding.parentNodeIndex,
      sourceSceneIndex, sourceGlbSha256: binding.glbSha256,
      sourceRole: group.sourceRole, sourceLinks,
      gate: { scopeAllowed: true, floorAllowed: true, sourceAllowed: true },
    });
  }

  const summary: TechnicalSystemSummary[] = groups.map((group) => {
    const matchedCount = matches.get(group.id) ?? 0;
    const boundCount = bound.filter((item) => item.id === group.id).length;
    let reason: TechnicalAvailabilityReason = 'AVAILABLE';
    if (!exactSource) reason = 'SOURCE_MISMATCH';
    else if (!matchedCount) reason = 'NO_OBJECTS_IN_SCENE';
    else if (!(verified.get(group.id) ?? 0)) reason = 'UNVERIFIED_NODE_IDENTITY';
    else if (boundCount > 0) reason = 'AVAILABLE';
    else if (missingScope.get(group.id)) reason = 'UNVERIFIED_SCOPE';
    else if (!boundCount && outside.get(group.id)) reason = 'OUTSIDE_SCOPE';
    else if (!boundCount && needsOptIn.get(group.id)) reason = 'OPT_IN_REQUIRED';
    else if (!boundCount) reason = 'UNVERIFIED_SCOPE';
    return {
      ...group, availability: reason === 'AVAILABLE' ? 'available' : 'unavailable',
      reason, matchedCount, boundCount, currentInstallationVerified: false as const,
    };
  });

  // Sol has registered the technical IDs in the common WP1 hierarchy.
  const bridgeBindings: ViewerScopedLayerRoot[] = bound
    .map((item) => ({ id: item.id as ViewerScopedLayerRoot['id'], root: item.object }));
  const gates = new Map<Object3D, ViewerScopedLayerGate>(
    bound.map((item) => [item.object, item.gate]),
  );
  const availableNodeIds = [...new Set(bridgeBindings.map((item) => item.id))];
  return { summary, boundObjects: bound, bridgeBindings, gates, availableNodeIds };
};

/**
 * Optional WP3 handoff: instantiate only after disposing legacy visibility
 * ownership of the SAME meshes. Sol owns the main-viewer call site.
 */
export const createTechnicalSystemPresentation = (
  sceneRoot: Object3D,
  inventory: ReturnType<typeof createTechnicalSystemLayerInventory>,
) => createViewerScopedLayerPresentation(sceneRoot, inventory.bridgeBindings);
