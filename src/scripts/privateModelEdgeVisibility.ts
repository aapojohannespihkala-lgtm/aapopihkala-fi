const edgeSemanticTokens = [
  'ANNOTATION',
  'ANCHOR',
  'BARB',
  'BOUNDARY',
  'CONTOUR',
  'GRID',
  'LABEL',
  'MARKER',
  'PROFILE',
  'ROUTE',
  'UTILITY',
];

const nonArchitectureEdgeTokens = [
  'ANCHOR',
  'BARB',
  'CONTOUR',
  'GROUND_REVIEW',
  'LABEL',
  'MARKER',
  'POINT',
  'ROUTE',
  'TERRAIN',
  'UTILITY',
];

export const isSemanticViewerLine = (object: any) => {
  const data = object?.userData ?? {};
  const presentationLayer = String(data.presentationLayer ?? '').toUpperCase();
  if (presentationLayer) return true;
  if (data.presentationSubgroup) return true;
  if (data.markerType) return true;

  const cartographyClass = String(data.cartographyClass ?? '').trim().toUpperCase();
  const intervalM = Number(data.intervalM);
  if (
    ['MAJOR', 'HALF', 'MINOR'].includes(cartographyClass) &&
    Number.isFinite(intervalM) &&
    intervalM > 0
  ) {
    return true;
  }

  const semantic = [
    object?.name,
    data.representationKind,
    data.geometryType,
    data.reviewScope,
    data.sourceContract,
    data.markerType,
  ]
    .map((value) => String(value ?? '').toUpperCase())
    .join(' ');

  return edgeSemanticTokens.some((token) => semantic.includes(token));
};

export const isTreeVisible = (object: any, modelRoot: any) => {
  let current = object;
  while (current) {
    if (current.visible === false) return false;
    if (current === modelRoot) break;
    current = current.parent;
  }
  return true;
};

export const hasVisibleEdgeMaterial = (object: any) => {
  const materials = Array.isArray(object?.material) ? object.material : [object?.material];
  return materials.some((material: any) => material && (material.opacity ?? 1) > 0.01);
};

export type EdgeMeshCandidateOptions = {
  modelRoot: any;
  routePresentationLayers: ReadonlySet<string>;
  isRoofLayerMember: (object: any) => boolean;
  isArchBaseMaterial: (material: any) => boolean;
};

export const isEdgeMeshCandidate = (
  object: any,
  {
    modelRoot,
    routePresentationLayers,
    isRoofLayerMember,
    isArchBaseMaterial,
  }: EdgeMeshCandidateOptions,
) => {
  if (
    !object?.isMesh ||
    !object.geometry ||
    !isTreeVisible(object, modelRoot) ||
    !hasVisibleEdgeMaterial(object)
  ) {
    return false;
  }

  const data = object.userData ?? {};
  if (data.viewerSuppressEdgeOverlay === true) return false;

  const presentationLayer = String(data.presentationLayer ?? '').toUpperCase();
  if (routePresentationLayers.has(presentationLayer)) return false;
  if (data.presentationSubgroup === 'WATER' || data.presentationSubgroup === 'WASTEWATER') {
    return false;
  }

  const semantic = [
    object.name,
    data.representationKind,
    data.geometryType,
    data.reviewScope,
    data.presentationLayer,
  ]
    .map((value) => String(value ?? '').toUpperCase())
    .join(' ');

  if (nonArchitectureEdgeTokens.some((token) => semantic.includes(token))) return false;

  if (
    data.presentationOnly === true &&
    !isRoofLayerMember(object) &&
    !isArchBaseMaterial(Array.isArray(object.material) ? object.material[0] : object.material)
  ) {
    return false;
  }

  return true;
};
