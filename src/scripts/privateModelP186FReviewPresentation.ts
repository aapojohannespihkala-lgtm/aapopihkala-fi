import { THREE } from './threeRuntime';

export const p186fReviewTargetOpacity = 0.8;
export const p186fReviewContextOpacity = 0.2;
export const p186fReviewTargetColorHex = 0x22d3ee;
export const p186fReviewContextColorHex = 0xe2e8f0;

export const p186fMaintenanceDocumentId = '1W6iUJoqfkM0efZpmcneXeD8bqYlLUk0tQwWebmcHKcI';
export const p186fFloorHeatingSourcePdfDriveId = '1vAyvAHdClqkXKIVNgKKUyOjMja-tzrok';
export const p186fSchedulePdfDriveId = '1-dioYKOAol67GyH0rl5cQ-omRcoeWAkP';

export const p186fBedroomWalkInContextNote =
  'Bedroom-ankkuri tarkoittaa Bedroom/vaatehuone-kontekstia: käyttäjän vahvistuksen mukaan Themo ohjaa makuuhuoneen lattialämmitystä, vaikka fyysinen termostaatti sijaitsee samassa huonekokonaisuudessa vaatehuoneen ja kulkumaisen tilarakenteen kautta.';

export const p186fX2PlacementBasis =
  'USER_CONFIRMED_ROOM_ASSIGNMENT_AND_D1F_FOOTPRINT_DERIVED_WALL_ADJACENT_WORK_ASSUMPTION';

export const p186fLegacyX1PlacementBasis =
  'CENTROID_OF_INHERITED_2015_FLOOR_HEATING_WORK_ROUTE_PROXY_FOR_ROOM_LEVEL_PRESENTATION_ONLY';

export const p186fReviewQuestionText =
  'Sijoittuvatko Bathroom-, Bedroom/vaatehuone- ja Lobby-Themojen room/wall-adjacent WORK_TEST -ankkurit käyttökelpoisesti oikeiden huoneiden tai käyttökontekstien yhteyteen, ymmärtäen etteivät markerit ole fyysisten termostaattien exact-sijainteja?';

export const p186fReviewSourceContexts = [
  {
    sourceLabel: 'Ylisrinne - huollon ja ylläpidon seuranta',
    sourceHref: `https://docs.google.com/document/d/${p186fMaintenanceDocumentId}/edit`,
    sourceRole: 'CURRENT_USER_CONFIRMED_INSTALLATION_AND_ROOM_ASSIGNMENT',
  },
  {
    sourceLabel: 'Lattialämmitys.me_design.pdf',
    sourceHref: `https://drive.google.com/file/d/${p186fFloorHeatingSourcePdfDriveId}/view`,
    sourceRole: 'HISTORICAL_2015_ROOM_LEVEL_PLACEMENT_CONTEXT_SUPERSEDED_FOR_XY',
  },
  {
    sourceLabel: 'Keskuskaavio.pdf',
    sourceHref: `https://drive.google.com/file/d/${p186fSchedulePdfDriveId}/view`,
    sourceRole: 'HISTORICAL_2015_GROUP_CONTEXT_ONLY',
  },
] as const;

export const p186fReviewSourceLimit =
  `Themojen asennus ja Bathroom/Bedroom/vaatehuone/Lobby-huonesidonnat ovat käyttäjän vahvistamaa nykytilaevidenssiä. ${p186fBedroomWalkInContextNote} Markerien XY/Z on vain room/wall-adjacent WORK_ASSUMPTION -esitystä, ja vuoden 2015 ryhmät 10.2/10.3/10.1 ovat historiallista kontekstia, eivät nykyinen as-built-syöttökytkentä, wall-host-väite tai sensor suite -väite.`;

export const p186fExpectedRooms = {
  Bedroom: {
    logicalDeviceId: 'D_THEMO_BEDROOM_CURRENT_01',
    historicalGroupKey: '10.3',
    historicalGroupName: 'makuuhuone',
  },
  Lobby: {
    logicalDeviceId: 'D_THEMO_LOBBY_CURRENT_01',
    historicalGroupKey: '10.1',
    historicalGroupName: 'eteinen',
  },
  Bathroom: {
    logicalDeviceId: 'D_THEMO_BATHROOM_CURRENT_01',
    historicalGroupKey: '10.2',
    historicalGroupName: 'pesuhuone/sauna',
  },
} as const;

export const p186fExpectedTargetCount = Object.keys(p186fExpectedRooms).length;
export const p186fExpectedRoomContextCount = 7;

const expectedRoomEntries = Object.entries(p186fExpectedRooms);
const expectedRoomNames = new Set(expectedRoomEntries.map(([room]) => room));
const supportedP186fPasses = new Set(['P186F-X1', 'P186F-X2']);
const supportedP186fPlacementBases = new Set([
  p186fLegacyX1PlacementBasis,
  p186fX2PlacementBasis,
]);

const isRenderable = (object: any) =>
  Boolean(
    object?.material &&
      (object?.isMesh || object?.isLine || object?.isLineSegments || object?.isPoints),
  );

const cloneObjectMaterials = (
  object: any,
  opacity: number,
  role: 'QUESTION_TARGET_80' | 'D_1F_ROOM_CONTEXT_20' | 'D_1F_ARCH_CONTEXT_20',
) => {
  const cloneOne = (material: any) => {
    if (!material?.clone) return material;
    const clone = material.clone();
    clone.opacity = opacity;
    clone.transparent = true;
    clone.depthWrite = false;

    if (role === 'QUESTION_TARGET_80') {
      clone.color?.setHex?.(p186fReviewTargetColorHex);
      if (clone.emissive?.setHex) {
        clone.emissive.setHex(p186fReviewTargetColorHex);
        clone.emissiveIntensity = 0.7;
      }
      clone.depthTest = false;
      clone.toneMapped = false;
    } else {
      clone.color?.setHex?.(p186fReviewContextColorHex);
      if (clone.emissive?.setHex) {
        clone.emissive.setHex(p186fReviewContextColorHex);
        clone.emissiveIntensity = 0.35;
      }
      clone.toneMapped = false;
    }

    if (role === 'D_1F_ARCH_CONTEXT_20') {
      clone.depthTest = false;
      clone.color?.setHex?.(p186fReviewContextColorHex);
      if (clone.emissive?.setHex) {
        clone.emissive.setHex(p186fReviewContextColorHex);
        clone.emissiveIntensity = Math.max(Number(clone.emissiveIntensity ?? 0), 0.85);
      }
      clone.toneMapped = false;
      clone.polygonOffset = true;
      clone.polygonOffsetFactor = -1;
      clone.polygonOffsetUnits = -1;
    }

    clone.userData = {
      ...(clone.userData ?? {}),
      p186fReviewPresentation: true,
      p186fPresentationRole: role,
    };
    clone.needsUpdate = true;
    return clone;
  };

  object.material = Array.isArray(object.material)
    ? object.material.map(cloneOne)
    : cloneOne(object.material);
};

const isP186fTarget = (object: any) => {
  const data = object?.userData ?? {};
  return (
    supportedP186fPasses.has(String(data.Pass ?? '')) &&
    String(data.presentationLayer ?? '') === 'MEP_ELECTRICAL' &&
    String(data.representationKind ?? '') === 'thermostatRoomPresentationAnchor'
  );
};

const isD1fRoomContext = (object: any) => {
  if (isP186fTarget(object)) return false;
  const data = object?.userData ?? {};
  if (data.p186dReviewRoomContextBridge !== true) return false;
  const g2Id = String(data.G2Id ?? data.G2IdCandidate ?? '');
  return (
    String(data.presentationLayer ?? '') === 'CURRENT_D' &&
    String(data.representationKind ?? '') === 'referenceFootprint' &&
    g2Id.startsWith('G2_D15_SPACE_') &&
    g2Id.includes('_1F_SRC')
  );
};

// Prefer renderable architectural solids to room-footprint helpers for X2.
// An ancestor can own the D-wall source identity while its child mesh has no source tag.
const isP186fD1fArchitectureSolid = (object: any) => {
  if (object?.isMesh !== true || isP186fTarget(object)) return false;
  const parts: string[] = [];
  let parent = object;
  let depth = 0;
  while (parent && depth < 8) {
    const data = parent.userData ?? {};
    parts.push(
      String(parent.name ?? ''),
      String(data.G2Id ?? ''),
      String(data.G2IdCandidate ?? ''),
      String(data.representationKind ?? ''),
      String(data.presentationLayer ?? ''),
    );
    parent = parent.parent;
    depth += 1;
  }
  const context = parts.join(' ').toLowerCase();
  if (/(^|[_ -])2f([_ -]|$)/.test(context)) return false;
  if (!object.geometry?.attributes?.position?.count) return false;
  if (
    ['referencefootprint', 'roomfootprint', 'room-footprint', 'helper',
      'p117d_review_', 'p123c_context_'].some((tag) => context.includes(tag))
  ) return false;

  const knownDWallRoot = context.includes('p173d_d_wall');
  const explicitD1fStructure =
    (context.includes('d_1f') || context.includes('_1f_src')) &&
    ['wall', 'architect', 'partition', 'door', 'window', 'opening'].some((tag) =>
      context.includes(tag)
    );
  return knownDWallRoot || explicitD1fStructure;
};

const hasP186fNoPromotionSemantics = (object: any) => {
  const data = object?.userData ?? {};
  const room = String(data.roomAssignment ?? '');
  const expected = p186fExpectedRooms[room as keyof typeof p186fExpectedRooms];
  const historical = data.historicalGroupContext ?? {};
  const placement = Array.isArray(data.placementXYM) ? data.placementXYM.map(Number) : [];

  if (!expected || !expectedRoomNames.has(room)) return false;

  return (
    supportedP186fPasses.has(String(data.Pass ?? '')) &&
    String(data.logicalDeviceId ?? '') === expected.logicalDeviceId &&
    String(data.roomAssignmentEvidence ?? '') === 'USER_CONFIRMED' &&
    String(data.currentDeviceRoomAssignmentEvidence ?? '') === 'USER_CONFIRMED_2026-10-08' &&
    String(data.currentInstallationEvidence ?? '') === 'USER_CONFIRMED_2026-10-07' &&
    String(historical.sourceGroupKey ?? '') === expected.historicalGroupKey &&
    String(historical.sourceGroupName ?? '') === expected.historicalGroupName &&
    Number(historical.sourceYear) === 2015 &&
    String(historical.bindingAuthority ?? '') ===
      'HIGH_CONFIDENCE_DERIVED / CROSS_SOURCE_PLAN_PARITY' &&
    supportedP186fPlacementBases.has(String(data.placementBasis ?? '')) &&
    placement.length === 2 &&
    placement.every(Number.isFinite) &&
    data.roomLevelPlacement === true &&
    data.presentationOnly === true &&
    data.workAssumption === true &&
    data.physicalThermostatGeometryClaim === false &&
    data.physicalThermostatXYClaim === false &&
    data.exactXYClaim === false &&
    data.exactZClaim === false &&
    data.sensorSuiteClaim === false &&
    data.currentCircuitAsBuilt === false &&
    data.physicalCableRouteClaim === false &&
    data.currentGeometryClaim === false &&
    data.current === false &&
    data.Canonical === false &&
    data.asBuilt === false &&
    data.publishToCURRENT === false &&
    String(data.HUMAN_REVIEW ?? '') === 'NOT_RUN'
  );
};

export const prepareP186fReviewPresentation = (
  sceneRoot: any,
  options: { preferRealArchitectureContext?: boolean } = {},
) => {
  const renderables: any[] = [];
  const targets: any[] = [];
  const roomCounts = new Map<string, number>();
  let semanticViolationCount = 0;

  sceneRoot?.updateMatrixWorld?.(true);
  sceneRoot?.traverse?.((object: any) => {
    if (!isRenderable(object)) return;
    renderables.push(object);
    if (!isP186fTarget(object)) return;

    targets.push(object);
    const room = String(object.userData?.roomAssignment ?? '');
    roomCounts.set(room, (roomCounts.get(room) ?? 0) + 1);
    if (!hasP186fNoPromotionSemantics(object)) semanticViolationCount += 1;
  });

  const targetBounds = new THREE.Box3();
  let hasTargetBounds = false;
  let targetRenderableCount = 0;
  let contextRenderableCount = 0;
  let hiddenNonQuestionRenderableCount = 0;
  let realArchitectureContextRenderableCount = 0;
  const realArchitectureContextRequired = targets.some(
    (object) => String(object.userData?.Pass ?? '') === 'P186F-X2',
  );
  // Opt-in until the viewer runtime accepts variable solid-wall context counts.
  // The legacy X1/X2 seven-footprint contract remains unchanged by default.
  const useRealArchitectureContext =
    options.preferRealArchitectureContext === true &&
    realArchitectureContextRequired &&
    renderables.some(isP186fD1fArchitectureSolid);

  for (const object of targets) {
    object.visible = true;
    cloneObjectMaterials(object, p186fReviewTargetOpacity, 'QUESTION_TARGET_80');
    object.renderOrder = 30;
    object.userData = {
      ...(object.userData ?? {}),
      viewerDerived: true,
      p186fReviewPresentation: true,
      p186fReviewRole: 'QUESTION_TARGET_80',
    };
    targetRenderableCount += 1;

    sceneRoot?.updateMatrixWorld?.(true);
    const objectBounds = new THREE.Box3().setFromObject(object);
    if (!objectBounds.isEmpty()) {
      if (!hasTargetBounds) {
        targetBounds.copy(objectBounds);
        hasTargetBounds = true;
      } else {
        targetBounds.union(objectBounds);
      }
    }
  }

  for (const object of renderables) {
    if (isP186fTarget(object)) continue;

    if (useRealArchitectureContext && isP186fD1fArchitectureSolid(object)) {
      object.visible = true;
      cloneObjectMaterials(object, p186fReviewContextOpacity, 'D_1F_ARCH_CONTEXT_20');
      object.renderOrder = 20;
      object.userData = {
        ...(object.userData ?? {}),
        viewerDerived: true,
        p186fReviewPresentation: true,
        p186fReviewRole: 'D_1F_ARCH_CONTEXT_20',
      };
      realArchitectureContextRenderableCount += 1;
      contextRenderableCount += 1;
      continue;
    }

    if (!useRealArchitectureContext && isD1fRoomContext(object)) {
      object.visible = true;
      cloneObjectMaterials(object, p186fReviewContextOpacity, 'D_1F_ROOM_CONTEXT_20');
      object.renderOrder = 5;
      object.userData = {
        ...(object.userData ?? {}),
        viewerDerived: true,
        p186fReviewPresentation: true,
        p186fReviewRole: 'D_1F_ROOM_CONTEXT_20',
      };
      contextRenderableCount += 1;
      continue;
    }

    object.visible = false;
    object.userData = {
      ...(object.userData ?? {}),
      viewerDerived: true,
      p186fReviewPresentation: true,
      p186fReviewRole: 'NON_QUESTION_CONTEXT_SUPPRESSED',
    };
    hiddenNonQuestionRenderableCount += 1;
  }

  const missingTargetRooms = Object.keys(p186fExpectedRooms).filter(
    (room) => roomCounts.get(room) !== 1,
  );
  const unexpectedTargetRooms = [...roomCounts.keys()].filter(
    (room) => !expectedRoomNames.has(room),
  );

  return {
    targetRenderableCount,
    expectedTargetRenderableCount: p186fExpectedTargetCount,
    contextRenderableCount,
    expectedContextRenderableCount: useRealArchitectureContext
      ? realArchitectureContextRenderableCount
      : p186fExpectedRoomContextCount,
    realArchitectureContextRequired,
    realArchitectureContextReady: realArchitectureContextRequired && realArchitectureContextRenderableCount > 0,
    realArchitectureContextRenderableCount,
    hiddenNonQuestionRenderableCount,
    semanticViolationCount,
    missingTargetRooms,
    unexpectedTargetRooms,
    targetBounds: hasTargetBounds ? targetBounds : null,
  };
};