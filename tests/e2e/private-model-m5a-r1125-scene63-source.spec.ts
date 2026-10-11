
import { expect, test } from '@playwright/test';
import { THREE } from '../../src/scripts/threeRuntime';

import {
  m5aZ2AbsoluteZBasis,
  m5aZ2AbsoluteZContract,
  m5aZ2ExpectedTargetKeys,
  prepareM5AZ2SystemReviewPresentation,
} from '../../src/scripts/privateModelM5AZ2ReviewPresentation';
import {
  m5aR1125SourceSceneName,
  selectM5AR1125SourceBoundReviewScene,
} from '../../src/scripts/privateModelM5AZ2SystemReviewRuntime';


const m5aR1125WorkRootExtras = {
  sourceDiameterCorrectionContract: 'G2_R1125',
  representationKind: 'drainageTopologyWorkRoot',
  diameterSourceBreakdown: '5_SALAOJA_SYSTEM_NOMINAL_D100_PLUS_2_PVK_DIAMETER_UNKNOWN',
  sourceMetadataOnlySuccessor: true,
  originalGeometryByteMutation: false,
  currentGeometryClaim: false,
  asBuiltClaim: false,
  publishToCURRENT: false,
  Canonical: false,
  humanReview: 'NOT_RUN',
};
const m5aR1125SceneExtras = {
  sourceDiameterCorrectionContract: 'G2_R1125',
  sourceDiameterClassBreakdown: '5_SALAOJA_AGGREGATE_NOMINAL_100MM__2_PVK_UNKNOWN',
  physicalRouteDiameterMeasuredClaim: false,
  currentGeometryClaim: false,
  asBuiltClaim: false,
  publishToCURRENT: false,
};

const candidateId = 'm5a-r1125-pvk-diameter-source-split';
const reviewId = `${candidateId}-review`;
const candidatePath = '/private-model/work-test/m5a-r1125-pvk-diameter-source-split.glb';

const targetPositions = [
  0, 0, 0,
  0.28, 0, 0,
  0.04, 0, -0.24,
];

// Deliberately place the simulated full-size terrain in FRONT of the
// 13 source targets (at y=0.06), so the screenshot proves depth-independent
// target overlays rather than only markers that were unobstructed already.
const contextPositions = [
  0, 0.5, 0,
  10, 0.5, 0,
  0, 0.5, -6,
  10, 0.5, 0,
  10, 0.5, -6,
  0, 0.5, -6,
];

const makeVisibilityGlb = (nodes: Record<string, unknown>[]) => {
  const targetBytes = Buffer.alloc(targetPositions.length * 4);
  targetPositions.forEach((value, index) => targetBytes.writeFloatLE(value, index * 4));

  const contextBytes = Buffer.alloc(contextPositions.length * 4);
  contextPositions.forEach((value, index) => contextBytes.writeFloatLE(value, index * 4));

  const targetOffset = 0;
  const contextOffset = targetBytes.length;
  const binPayload = Buffer.concat([targetBytes, contextBytes]);

  const json = {
    asset: { version: '2.0' },
    scene: 63,
    scenes: [
      ...Array.from({ length: 63 }, (_, i) => ({ name: `INHERITED_SCENE_${i}`, nodes: [] })),
      {
        name: m5aR1125SourceSceneName,
        nodes: nodes.map((_, index) => index),
        extras: m5aR1125SceneExtras,
      },
    ],
    nodes,
    meshes: [
      {
        primitives: [
          {
            attributes: { POSITION: 0 },
            material: 0,
          },
        ],
      },
      {
        primitives: [
          {
            attributes: { POSITION: 1 },
            material: 1,
          },
        ],
      },
    ],
    materials: [
      {
        emissiveFactor: [1, 0.18, 0.02],
        pbrMetallicRoughness: {
          baseColorFactor: [1, 0.22, 0.03, 1],
          metallicFactor: 0,
          roughnessFactor: 1,
        },
        alphaMode: 'BLEND',
        doubleSided: true,
      },
      {
        emissiveFactor: [0.02, 0.08, 1],
        pbrMetallicRoughness: {
          baseColorFactor: [0.03, 0.12, 1, 1],
          metallicFactor: 0,
          roughnessFactor: 1,
        },
        alphaMode: 'BLEND',
        doubleSided: true,
      },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 3,
        type: 'VEC3',
        min: [0, 0, -0.24],
        max: [0.28, 0, 0],
      },
      {
        bufferView: 1,
        componentType: 5126,
        count: 6,
        type: 'VEC3',
        min: [0, 0.5, -6],
        max: [10, 0.5, 0],
      },
    ],
    bufferViews: [
      {
        buffer: 0,
        byteOffset: targetOffset,
        byteLength: targetBytes.length,
        target: 34962,
      },
      {
        buffer: 0,
        byteOffset: contextOffset,
        byteLength: contextBytes.length,
        target: 34962,
      },
    ],
    buffers: [{ byteLength: binPayload.length }],
  };

  const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
  const jsonPadding = (4 - (jsonBuffer.length % 4)) % 4;
  const jsonChunk = Buffer.concat([jsonBuffer, Buffer.alloc(jsonPadding, 0x20)]);
  const binPadding = (4 - (binPayload.length % 4)) % 4;
  const binChunk = Buffer.concat([binPayload, Buffer.alloc(binPadding)]);

  const totalLength = 12 + 8 + jsonChunk.length + 8 + binChunk.length;
  const header = Buffer.alloc(12);
  header.write('glTF', 0, 'ascii');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binChunk.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);

  return Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binChunk]);
};

const commonTarget = {
  Canonical: false,
  presentationOnly: true,
  workAssumption: true,
  sourceDerivedTopology: true,
  exactXYClaim: false,
  exactZClaim: false,
  physicalElevationClaim: false,
  currentGeometryClaim: false,
  asBuiltClaim: false,
  publishToCURRENT: false,
  absoluteZContract: m5aZ2AbsoluteZContract,
};

const targetLocations: [number, number, number][] = [
  [1.0, 0.06, -1.0],
  [8.3, 0.06, -1.0],
  [8.3, 0.06, -5.0],
  [1.0, 0.06, -5.0],
  [2.0, 0.06, -4.8],
  [6.8, 0.06, -4.8],
  [4.3, 0.06, -1.0],
  [8.7, 0.06, -3.7],
  [8.7, 0.06, -2.3],
  [0.6, 0.06, -3.8],
  [0.6, 0.06, -2.2],
  [0.25, 0.06, -4.8],
  [9.15, 0.06, -4.8],
];

const makeTargetNode = (key: string, index: number) => {
  const boundary = key.startsWith('boundary:');
  const well = key.startsWith('G2_DRAIN_WELL_');
  const unknownPvkDiameter = key === 'G2_DRAIN_LINK_PVK_DISCHARGE_001' ||
    key === 'G2_DRAIN_LINK_PVK_PARKING_001';

  const extras = boundary
    ? {
        ...commonTarget,
        Pass: 'M5A-Z2D-R1036',
        representationKind: 'unresolvedBoundaryMarker',
        boundaryStatus: 'UNRESOLVED_BOUNDARY',
        boundaryRole: key.slice('boundary:'.length),
        physicalRouteClaim: false,
        externalNetworkConnectionClaim: false,
      }
    : {
        ...commonTarget,
        Pass: well ? 'M5A-Z2D-R1090' : 'M5A-Z2D-R1036',
        G2IdCandidate: key,
        representationKind: well ? 'wellDiameterPresentationWork' : 'pipeDiameterPresentationWork',
        physicalWellGeometryClaim: well ? false : undefined,
        physicalRouteClaim: well ? undefined : false,
        exactSlopeClaim: well ? undefined : false,
        absoluteZBasis: m5aZ2AbsoluteZBasis,
        ...(well ? {} : {
          sourceDiameterCorrectionContract: 'G2_R1125',
          pipeDiameterMmSource: unknownPvkDiameter ? null : 100,
          pipeDiameterMmNominalSource: unknownPvkDiameter ? null : 100,
          pipeDiameterMmSourceScope: unknownPvkDiameter ? null : 'AGGREGATE_SALAOJA_SYSTEM_NOT_INDIVIDUAL_ROUTE',
          physicalNominalDiameterStatus: unknownPvkDiameter
            ? 'UNKNOWN'
            : 'GENERAL_SALAOJA_SYSTEM_NOMINAL_CLASS_NOT_PER_BRANCH_MEASUREMENT',
          pipeDiameterSourceRole: unknownPvkDiameter
            ? 'PVK_SOURCE_DIAMETER_UNKNOWN_PRESENTATION_D100'
            : 'SALAOJA_SYSTEM_NOMINAL_D100_NOT_INDIVIDUALLY_MEASURED',
          presentationDiameterMm: 100,
          presentationDiameterRole: 'WORK_TEST_VISUAL_PROXY',
          physicalDiameterPerRouteSourceVerified: false,
          diameterIsPhysicalAsBuiltClaim: false,
        }),
      };

  return {
    name: `M5A_R1125_REVIEW_TARGET_${String(index + 1).padStart(2, '0')}`,
    mesh: 0,
    translation: targetLocations[index],
    scale: [1.8, 1, 1.8],
    extras,
  };
};

test('M5A R1125 exact scene63 source-bound WORK_TEST review renders 13 independently visible target markers', async ({
  page,
}) => {
  test.setTimeout(20_000);
  await page.setViewportSize({ width: 1536, height: 768 });

  const currentModel = makeVisibilityGlb([]);
  const candidateModel = makeVisibilityGlb([
    ...m5aZ2ExpectedTargetKeys.map(makeTargetNode),
    {
      name: 'M5A_R1125_WORK_ROOT_NON_RENDERED_SOURCE_GROUP',
      extras: m5aR1125WorkRootExtras,
    },
    {
      name: 'M5A_R1125_BUILDING_DRAINAGE_CONTEXT',
      mesh: 1,
      extras: {
        presentationLayer: 'CURRENT_BUILDING',
        representationKind: 'buildingContext',
      },
    },
  ]);

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: currentModel,
    });
  });

  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [
          {
            id: candidateId,
            label: 'M5A R1125 5 salaoja D100 + 2 unknown PVK - WORK_TEST',
            path: candidatePath,
          },
        ],
      }),
    });
  });

  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: candidateModel,
    });
  });

  await page.goto(`/private-model/?review=${reviewId}`);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(canvas).toHaveAttribute('data-model-source', 'work-test');
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', reviewId);
  await expect(canvas).toHaveAttribute('data-m5a-review-target-renderable-count', '13');
  await expect(canvas).toHaveAttribute('data-m5a-r1125-source-contract', 'G2_R1125');
  await expect(canvas).toHaveAttribute('data-m5a-r1125-terrain-resistant-overlay', 'true');
  await expect(canvas).toHaveAttribute('data-m5a-r1125-scene-index', '63');
  await expect(canvas).toHaveAttribute('data-m5a-r1125-salaoja-general-nominal-d100-count', '5');
  await expect(canvas).toHaveAttribute('data-m5a-r1125-pvk-unknown-physical-diameter-count', '2');
  await expect(canvas).toHaveAttribute('data-m5a-r1125-physical-diameter-measurement-claim', 'false');
  await expect(canvas).toHaveAttribute('data-m5a-r1125-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute('data-m5a-review-expected-target-renderable-count', '13');
  await expect(canvas).toHaveAttribute('data-m5a-review-well-marker-count', '4');
  await expect(canvas).toHaveAttribute('data-m5a-review-route-count', '7');
  await expect(canvas).toHaveAttribute('data-m5a-review-unresolved-boundary-count', '2');
  await expect(canvas).toHaveAttribute('data-m5a-review-context-renderable-count', '1');
  await expect(canvas).toHaveAttribute('data-m5a-review-semantic-violation-count', '0');
  await expect(canvas).toHaveAttribute('data-m5a-z2-absolute-z-basis', m5aZ2AbsoluteZBasis);
  await expect(canvas).toHaveAttribute('data-m5a-z2-absolute-z-contract', m5aZ2AbsoluteZContract);
  await expect(canvas).toHaveAttribute('data-m5a-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute('data-m5a-review-camera-mode', 'PERSPECTIVE_FREE_ORBIT_TARGET_BOUNDS');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'whole-building');

  await page.waitForTimeout(300);
  const screenshot = await canvas.screenshot();
  const dataUrl = `data:image/png;base64,${screenshot.toString('base64')}`;

  const visibilityPixels = await page.evaluate(async (url) => {
    const image = new Image();
    image.src = url;
    await image.decode();

    const probe = document.createElement('canvas');
    probe.width = image.width;
    probe.height = image.height;
    const context = probe.getContext('2d');
    if (!context) return { warmTargetPixels: 0, blueContextPixels: 0, warmMarkerComponents: 0 };

    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, image.width, image.height).data;
    let warmTargetPixels = 0;
    let blueContextPixels = 0;
    // Count independently drawn target islands, not only aggregate colored pixels.
    // This is LOCAL browser-render evidence on the source-shaped WORK_TEST fixture,
    // NOT authenticated production or HUMAN_REVIEW evidence.
    const warmMask = new Uint8Array(image.width * image.height);

    for (let index = 0; index < pixels.length; index += 4) {
      const red = pixels[index] ?? 0;
      const green = pixels[index + 1] ?? 0;
      const blue = pixels[index + 2] ?? 0;

      if (red > 105 && red > green * 1.25 && red > blue * 1.35 && green > blue * 1.3) {
        warmTargetPixels += 1;
        warmMask[index / 4] = 1;
      }

      if (blue > 90 && blue > red * 1.08 && blue > green * 1.04) {
        blueContextPixels += 1;
      }
    }

    // 8-connected components account for antialiased diagonal triangle edges.
    // Reject tiny isolated warm-color noise; every one of the 13 source targets
    // must contribute its own visible, coherent island of at least 12 pixels.
    const seen = new Uint8Array(warmMask.length);
    const queue = new Int32Array(warmMask.length);
    let warmMarkerComponents = 0;
    for (let seed = 0; seed < warmMask.length; seed++) {
      if (!warmMask[seed] || seen[seed]) continue;
      let head = 0;
      let tail = 1;
      let islandPixels = 0;
      seen[seed] = 1;
      queue[0] = seed;
      while (head < tail) {
        const at = queue[head++]!;
        const x = at % image.width;
        const y = Math.floor(at / image.width);
        islandPixels++;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= image.width || ny >= image.height) continue;
            const next = ny * image.width + nx;
            if (!warmMask[next] || seen[next]) continue;
            seen[next] = 1;
            queue[tail++] = next;
          }
        }
      }
      if (islandPixels >= 12) warmMarkerComponents++;
    }

    return { warmTargetPixels, blueContextPixels, warmMarkerComponents };
  }, dataUrl);

  expect(visibilityPixels.warmTargetPixels).toBeGreaterThan(80);
  expect(visibilityPixels.blueContextPixels).toBeGreaterThan(250);
  expect(visibilityPixels.warmMarkerComponents).toBe(13);
});


test('M5A R1125 rejects a fabricated PVK physical diameter and duplicated source target', () => {
  const nodeData = m5aZ2ExpectedTargetKeys
    .map(makeTargetNode)
    .map((node) => node.extras)
    .filter((extras: any) => extras.sourceDiameterCorrectionContract === 'G2_R1125');
  const buildFixture = (data: Record<string, unknown>[], options: {
    root?: Record<string, unknown>;
    scene?: Record<string, unknown>;
  } = {}) => {
    const reviewScene: any = {
      userData: options.scene ?? m5aR1125SceneExtras,
      traverse: (fn: (node: any) => void) => {
        fn(reviewScene);
        fn({ userData: options.root ?? m5aR1125WorkRootExtras });
        data.forEach((userData) => fn({ userData }));
      },
    };
    return {
      parser: { json: { scenes: [
        ...Array.from({ length: 63 }, () => ({ name: 'INHERITED', nodes: [] })),
        { name: m5aR1125SourceSceneName },
      ] } },
      scenes: [
        ...Array.from({ length: 63 }, () => null),
        reviewScene,
      ],
    };
  };
  const original = buildFixture(nodeData);
  const good = selectM5AR1125SourceBoundReviewScene(original);
  expect(good.salaojaNominalSystemCount).toBe(5);
  expect(good.pvkUnknownCount).toBe(2);
  expect(good.humanReview).toBe('NOT_RUN');
  expect(() => selectM5AR1125SourceBoundReviewScene(
    buildFixture(nodeData, { scene: { ...m5aR1125SceneExtras, physicalRouteDiameterMeasuredClaim: true } }),
  )).toThrow(/scene63 source classification or promotion gate failed/);
  expect(() => selectM5AR1125SourceBoundReviewScene(
    buildFixture(nodeData, { root: { ...m5aR1125WorkRootExtras, originalGeometryByteMutation: true } }),
  )).toThrow(/source group root integrity gate failed/);
  const guessedPvk = nodeData.map((x: any) =>
    x.G2IdCandidate === 'G2_DRAIN_LINK_PVK_DISCHARGE_001'
      ? { ...x, pipeDiameterMmSource: 100 }
      : x);
  expect(() => selectM5AR1125SourceBoundReviewScene(buildFixture(guessedPvk)))
    .toThrow(/PVK physical diameter must remain UNKNOWN/);
  expect(() => selectM5AR1125SourceBoundReviewScene(buildFixture([...nodeData, nodeData[0]])))
    .toThrow(/duplicate or unexpected diameter-source route/);
});

test('M5A R1125 overlays only exact 13/13 source targets over 20% terrain without editing geometry', () => {
  const makeSourceReview = () => {
    const root = new THREE.Group();
    root.userData = { ...m5aR1125SceneExtras };
    const targets = m5aZ2ExpectedTargetKeys.map((key, index) => {
      const node = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.25, 0.25),
        new THREE.MeshBasicMaterial({ color: 0xff8a11 }),
      );
      node.name = String(makeTargetNode(key, index).name);
      node.userData = { ...makeTargetNode(key, index).extras };
      node.position.set(index, 0, 0);
      root.add(node);
      return node;
    });
    const terrain = new THREE.Mesh(
      new THREE.BoxGeometry(20, 1, 20),
      new THREE.MeshBasicMaterial({ color: 0x2266ff }),
    );
    terrain.position.set(6, 0, 0);
    terrain.name = 'EXISTING_BUILDING_TERRAIN_CONTEXT';
    root.add(terrain);
    return { root, targets, terrain };
  };

  const { root, targets, terrain } = makeSourceReview();
  const originalVertices = targets.map((node) =>
    Array.from(node.geometry.getAttribute('position').array as ArrayLike<number>),
  );
  const result = prepareM5AZ2SystemReviewPresentation(root, {
    r1125TerrainResistantOverlay: true,
  });
  expect(result.targetRenderableCount).toBe(13);
  expect(result.contextRenderableCount).toBe(1);
  expect(result.r1125TerrainResistantOverlayApplied).toBe(true);
  expect(result.missingTargetKeys).toEqual([]);
  expect(result.duplicateTargetKeys).toEqual([]);
  expect(result.semanticViolationCount).toBe(0);
  expect(result.kindCounts).toEqual({
    wellMarkerWork: 4,
    referenceRouteWork: 7,
    unresolvedBoundaryMarker: 2,
  });
  targets.forEach((node, index) => {
    const material = node.material as THREE.MeshBasicMaterial;
    expect(material.opacity).toBe(0.8);
    expect(material.depthTest).toBe(false);
    expect(material.depthWrite).toBe(false);
    expect(node.renderOrder).toBe(2200);
    expect(node.userData.m5aZ2ReviewRole).toBe('QUESTION_TARGET_80');
    expect(Array.from(node.geometry.getAttribute('position').array as ArrayLike<number>))
      .toEqual(originalVertices[index]);
  });
  const terrainMaterial = terrain.material as THREE.MeshBasicMaterial;
  expect(terrainMaterial.opacity).toBe(0.2);
  expect(terrainMaterial.depthTest).toBe(true);
  expect(terrainMaterial.depthWrite).toBe(false);
  expect(terrain.renderOrder).toBe(5);
  expect(terrain.visible).toBe(true);
  expect(terrain.userData.m5aZ2ReviewRole).toBe('BUILDING_DRAINAGE_CONTEXT_20');

  const legacy = makeSourceReview();
  const legacyResult = prepareM5AZ2SystemReviewPresentation(legacy.root);
  expect(legacyResult.r1125TerrainResistantOverlayApplied).toBe(false);
  legacy.targets.forEach((node) => {
    const material = node.material as THREE.MeshBasicMaterial;
    expect(material.depthTest).toBe(true);
    expect(material.depthWrite).toBe(true);
    expect(node.renderOrder).toBe(30);
  });

  const wrongScene = makeSourceReview();
  wrongScene.root.userData.sourceDiameterCorrectionContract = 'G2_R1090';
  expect(() => prepareM5AZ2SystemReviewPresentation(wrongScene.root, {
    r1125TerrainResistantOverlay: true,
  })).toThrow(/exact scene63 13\/13 source-only review/);
  expect((wrongScene.targets[0]?.material as THREE.MeshBasicMaterial).depthTest).toBe(true);

  const incomplete = makeSourceReview();
  incomplete.root.remove(incomplete.targets[12]!);
  expect(() => prepareM5AZ2SystemReviewPresentation(incomplete.root, {
    r1125TerrainResistantOverlay: true,
  })).toThrow(/exact scene63 13\/13 source-only review/);
  expect((incomplete.targets[0]?.material as THREE.MeshBasicMaterial).depthTest).toBe(true);
});
