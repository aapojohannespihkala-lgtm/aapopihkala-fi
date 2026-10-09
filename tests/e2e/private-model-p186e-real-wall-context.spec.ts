import { expect, test } from '@playwright/test';

import { prepareP186EReviewPresentation } from '../../src/scripts/privateModelP186EReviewPresentation';
import { THREE } from '../../src/scripts/threeRuntime';

const makeRenderable = (name: string, userData: Record<string, unknown>) => {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial(),
  );
  mesh.name = name;
  mesh.userData = { ...userData };
  return mesh;
};

const makeNonRenderableRoot = (name: string, userData: Record<string, unknown>) => {
  const root = new THREE.Group();
  root.name = name;
  root.userData = { ...userData };
  return root;
};

test('P186E review uses real wall context roots and suppresses helper footprints', () => {
  const target = makeRenderable('P186E_X1_D_1F_GROUP_LABEL_01', {
    Pass: 'P186E-X1',
    hostStorey: 'D_1F',
    presentationLayer: 'MEP_ELECTRICAL',
    representationKind: 'electricalGroupSourceLabelAnchor',
  });
  const productionWallRoot = makeRenderable(
    'P173D_D_WALL_HR67_SEMANTIC_REBASE_ROOT_BABYLON_Y_UP',
    {
      G2Id: 'P173D_D_WALL_HR67_SEMANTIC_REBASE_ROOT_BABYLON_Y_UP',
      presentationLayer: 'CURRENT_D',
      representationKind: 'wallSurface',
    },
  );
  const helperFootprint = makeRenderable(
    'P117D_REVIEW_P87_VIEW_G2_D15_SPACE_PESUHUONE_1F_SRC',
    {
      G2Id: 'G2_D15_SPACE_PESUHUONE_1F_SRC',
      presentationLayer: 'CURRENT_D',
      representationKind: 'referenceFootprint',
    },
  );
  const unrelatedContext = makeRenderable('TERRAIN_CONTEXT_WALL_LIKE_BOUNDARY', {
    G2Id: 'TERRAIN_CONTEXT_WALL_LIKE_BOUNDARY',
    presentationLayer: 'SITE_GROUND',
    representationKind: 'wallLikeBoundary',
  });
  const objects = [target, productionWallRoot, helperFootprint, unrelatedContext];
  const sceneRoot = {
    traverse: (visitor: (object: unknown) => void) => {
      for (const object of objects) visitor(object);
    },
  };

  const result = prepareP186EReviewPresentation(sceneRoot, 'D1F');

  expect(result.targetRenderableCount).toBe(1);
  expect(result.contextRenderableCount).toBe(1);
  expect(result.realWallContextRenderableCount).toBe(1);
  expect(result.suppressedHelperContextCount).toBe(1);

  expect(productionWallRoot.visible).toBe(true);
  expect(productionWallRoot.renderOrder).toBe(20);
  expect(productionWallRoot.userData.p186eReviewRole).toBe('D_1F_ARCH_CONTEXT_20');
  expect(productionWallRoot.userData.p186eReviewContextSource).toBe(
    'KNOWN_D_ARCHITECTURE_ROOT',
  );
  expect((productionWallRoot.material as any).opacity).toBe(0.2);
  expect((productionWallRoot.material as any).depthTest).toBe(false);
  expect((productionWallRoot.material as any).linewidth).toBe(2);
  expect((productionWallRoot.material as any).polygonOffset).toBe(true);
  expect((productionWallRoot.material as any).userData.p186eReviewContextVisibilityFix).toBe(
    'R1082_ANCESTOR_ROOT_AND_HIGH_CONTRAST_CONTEXT',
  );

  expect(helperFootprint.visible).toBe(false);
  expect(helperFootprint.userData.p186eReviewRole).toBe(
    'P186E_HELPER_CONTEXT_SUPPRESSED',
  );
  expect(unrelatedContext.visible).toBe(false);
  expect(unrelatedContext.userData.p186eReviewRole).toBe('NON_QUESTION_CONTEXT_SUPPRESSED');
});

test('P186E review keeps renderable children of known architecture roots visible', () => {
  const target = makeRenderable('P186E_X1_D_1F_GROUP_LABEL_02', {
    Pass: 'P186E-X1',
    hostStorey: 'D_1F',
    presentationLayer: 'MEP_ELECTRICAL',
    representationKind: 'electricalGroupSourceLabelAnchor',
  });
  const nonRenderableWallRoot = makeNonRenderableRoot(
    'P173D_D_WALL_HR67_SEMANTIC_REBASE_ROOT_BABYLON_Y_UP',
    {
      G2Id: 'P173D_D_WALL_HR67_SEMANTIC_REBASE_ROOT_BABYLON_Y_UP',
      presentationLayer: 'CURRENT_D',
    },
  );
  const wallChildMesh = makeRenderable('WALL_CHILD_MESH_WITHOUT_ROOT_TOKEN', {
    G2Id: 'WALL_CHILD_MESH_WITHOUT_ROOT_TOKEN',
    presentationLayer: 'CURRENT_D',
    representationKind: 'wallSurfaceMesh',
  });
  nonRenderableWallRoot.add(wallChildMesh);

  const unrelatedWallLike = makeRenderable('SITE_WALL_LIKE_NOT_D_ARCH', {
    G2Id: 'SITE_WALL_LIKE_NOT_D_ARCH',
    presentationLayer: 'SITE_GROUND',
    representationKind: 'wallLikeBoundary',
  });

  const objects = [target, nonRenderableWallRoot, wallChildMesh, unrelatedWallLike];
  const sceneRoot = {
    traverse: (visitor: (object: unknown) => void) => {
      for (const object of objects) visitor(object);
    },
  };

  const result = prepareP186EReviewPresentation(sceneRoot, 'D1F');

  expect(result.targetRenderableCount).toBe(1);
  expect(result.contextRenderableCount).toBe(1);
  expect(result.realWallContextRenderableCount).toBe(1);

  expect(wallChildMesh.visible).toBe(true);
  expect(wallChildMesh.userData.p186eReviewRole).toBe('D_1F_ARCH_CONTEXT_20');
  expect(wallChildMesh.userData.p186eReviewContextSource).toBe(
    'KNOWN_D_ARCHITECTURE_ROOT',
  );
  expect((wallChildMesh.material as any).depthTest).toBe(false);
  expect((wallChildMesh.material as any).linewidth).toBe(2);
  expect((wallChildMesh.material as any).userData.p186eReviewContextVisibilityFix).toBe(
    'R1082_ANCESTOR_ROOT_AND_HIGH_CONTRAST_CONTEXT',
  );

  expect(unrelatedWallLike.visible).toBe(false);
  expect(unrelatedWallLike.userData.p186eReviewRole).toBe(
    'NON_QUESTION_CONTEXT_SUPPRESSED',
  );
});

test('P186E review suppresses explicit opposite-floor wall meshes before known-root fallback', () => {
  const target = makeRenderable('P186E_X1_D_1F_GROUP_LABEL_03', {
    Pass: 'P186E-X1',
    hostStorey: 'D_1F',
    presentationLayer: 'MEP_ELECTRICAL',
    representationKind: 'electricalGroupSourceLabelAnchor',
  });
  const nonRenderableWallRoot = makeNonRenderableRoot(
    'P173D_D_WALL_HR67_SEMANTIC_REBASE_ROOT_BABYLON_Y_UP',
    {
      G2Id: 'P173D_D_WALL_HR67_SEMANTIC_REBASE_ROOT_BABYLON_Y_UP',
      presentationLayer: 'CURRENT_D',
    },
  );
  const d1fWallMesh = makeRenderable('P173D_D_WALL_EXPLICIT_D_1F_CONTEXT_MESH', {
    G2Id: 'P173D_D_WALL_EXPLICIT_D_1F_CONTEXT_MESH',
    presentationLayer: 'CURRENT_D',
    representationKind: 'wallSurfaceMesh',
    apartment: 'D',
    storey: '1F',
  });
  nonRenderableWallRoot.add(d1fWallMesh);

  const d2fWallMesh = makeRenderable('P173D_D_WALL_EXPLICIT_D_2F_CONTEXT_MESH', {
    G2Id: 'P173D_D_WALL_EXPLICIT_D_2F_CONTEXT_MESH',
    presentationLayer: 'CURRENT_D',
    representationKind: 'wallSurfaceMesh',
    hostStorey: 'D_2F',
    apartment: 'D',
    storey: '2F',
  });
  nonRenderableWallRoot.add(d2fWallMesh);

  const objects = [target, nonRenderableWallRoot, d1fWallMesh, d2fWallMesh];
  const sceneRoot = {
    traverse: (visitor: (object: unknown) => void) => {
      for (const object of objects) visitor(object);
    },
  };

  const result = prepareP186EReviewPresentation(sceneRoot, 'D1F');

  expect(result.targetRenderableCount).toBe(1);
  expect(result.contextRenderableCount).toBe(1);
  expect(result.realWallContextRenderableCount).toBe(1);

  expect(d1fWallMesh.visible).toBe(true);
  expect(d1fWallMesh.userData.p186eReviewRole).toBe('D_1F_ARCH_CONTEXT_20');
  expect(d2fWallMesh.visible).toBe(false);
  expect(d2fWallMesh.userData.p186eReviewRole).toBe('NON_QUESTION_CONTEXT_SUPPRESSED');
});

test('P186E review rejects compact and generic opposite-floor source names under known architecture roots', () => {
  const cases = [
    {
      variant: 'D1F' as const,
      targetFloor: 'D_1F',
      sameFloorName: 'P177B_CONTEXT_D1F_WALL',
      oppositeCompactName: 'P177B_CONTEXT_D2F_WALL',
      oppositeGenericName: 'P134B_ARCH_BASE_CLONE__R2I2_VIEW_P86_VIEW_G1_CD_2F_ATTIC_BASE',
    },
    {
      variant: 'D2F' as const,
      targetFloor: 'D_2F',
      sameFloorName: 'P177B_CONTEXT_D2F_WALL',
      oppositeCompactName: 'P173D_REBASE_D1F_STORAGE_NORTH_WALL_CORRECTED_NODE',
      oppositeGenericName: 'P134B_ARCH_BASE_CLONE__R2I2_VIEW_P86_VIEW_G1_CD_1F',
    },
  ];

  for (const item of cases) {
    const target = makeRenderable('P186E_SOURCE_LABEL_' + item.targetFloor, {
      Pass: 'P186E-X1',
      hostStorey: item.targetFloor,
      presentationLayer: 'MEP_ELECTRICAL',
      representationKind: 'electricalGroupSourceLabelAnchor',
    });
    const root = makeNonRenderableRoot(
      'P177B_WHOLE_BUILDING_ROOT_HR6_DIRECT_D_STORAGE_NORTH_LINE_CORRECTED_BABYLON_Y_UP',
      { presentationLayer: 'CURRENT_D' },
    );
    const sameFloor = makeRenderable(item.sameFloorName, {
      presentationLayer: 'CURRENT_D',
      representationKind: 'wallSurfaceMesh',
    });
    const oppositeCompact = makeRenderable(item.oppositeCompactName, {
      presentationLayer: 'CURRENT_D',
      representationKind: 'wallSurfaceMesh',
    });
    const oppositeGeneric = makeRenderable(item.oppositeGenericName, {
      presentationLayer: 'CURRENT_D',
      representationKind: 'contextMass',
    });
    root.add(sameFloor, oppositeCompact, oppositeGeneric);

    const sceneRoot = {
      updateMatrixWorld: () => root.updateMatrixWorld(true),
      traverse: (visit: (object: unknown) => void) => {
        visit(target);
        root.traverse(visit);
      },
    };

    const result = prepareP186EReviewPresentation(sceneRoot, item.variant);
    expect(result.targetRenderableCount).toBe(1);
    expect(result.realWallContextRenderableCount).toBe(1);
    expect(result.contextRenderableCount).toBe(1);
    expect(sameFloor.visible).toBe(true);
    expect(oppositeCompact.visible).toBe(false);
    expect(oppositeGeneric.visible).toBe(false);
    expect(oppositeCompact.userData.p186eReviewRole).toBe('NON_QUESTION_CONTEXT_SUPPRESSED');
    expect(oppositeGeneric.userData.p186eReviewRole).toBe('NON_QUESTION_CONTEXT_SUPPRESSED');
  }
});

test('P186E real wall readiness requires drawable triangle meshes on both D floors', () => {
  for (const variant of ['D1F', 'D2F'] as const) {
    const floor = variant === 'D1F' ? 'D_1F' : 'D_2F';
    const target = makeRenderable('P186E_SOURCE_LABEL_' + floor, {
      Pass: 'P186E-X1',
      hostStorey: floor,
      presentationLayer: 'MEP_ELECTRICAL',
      representationKind: 'electricalGroupSourceLabelAnchor',
    });
    const root = makeNonRenderableRoot('P173D_D_WALL_ARCH_ROOT', {
      presentationLayer: 'CURRENT_D',
    });
    const realWall = makeRenderable('P173D_D_WALL_SOLID_' + floor, {
      presentationLayer: 'CURRENT_D',
      representationKind: 'wallSurfaceMesh',
      hostStorey: floor,
    });
    const lineWall = new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(1, 1, 0),
      ]),
      new THREE.LineBasicMaterial(),
    );
    lineWall.name = 'P173D_D_WALL_LINE_' + floor;
    lineWall.userData = { presentationLayer: 'CURRENT_D', hostStorey: floor };

    const emptyWall = new THREE.Mesh(
      new THREE.BufferGeometry(),
      new THREE.MeshStandardMaterial(),
    );
    emptyWall.name = 'P173D_D_WALL_EMPTY_' + floor;
    emptyWall.userData = { presentationLayer: 'CURRENT_D', hostStorey: floor };

    root.add(realWall, lineWall, emptyWall);
    const sceneRoot = {
      updateMatrixWorld: () => root.updateMatrixWorld(true),
      traverse: (visit: (object: unknown) => void) => {
        visit(target);
        root.traverse(visit);
      },
    };

    const result = prepareP186EReviewPresentation(sceneRoot, variant);
    expect(result.targetRenderableCount).toBe(1);
    expect(result.realWallContextRenderableCount).toBe(1);
    expect(result.contextRenderableCount).toBe(1);
    expect(realWall.visible).toBe(true);
    expect(realWall.userData.p186eReviewRole).toBe(floor + '_ARCH_CONTEXT_20');
    expect(lineWall.visible).toBe(false);
    expect(emptyWall.visible).toBe(false);
    expect(lineWall.userData.p186eReviewRole).toBe('NON_QUESTION_CONTEXT_SUPPRESSED');
    expect(emptyWall.userData.p186eReviewRole).toBe('NON_QUESTION_CONTEXT_SUPPRESSED');
  }
});
