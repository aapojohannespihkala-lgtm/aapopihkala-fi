import { expect, test } from '@playwright/test';

// Synthetic glTF fixture, never an original 3D survey or production pixel proof.
// Its node identities and no-promotion metadata match the scene67 source contract.
// Unlike source-text assertions, this test drives the real viewer in Chromium.
const candidateId = 'p137e-d1f-three-wall-mounted-themos';
const reviewId = candidateId + '-review';
const candidatePath = '/private-model/work-test/' + candidateId + '.glb';
const sceneName =
  'P137E D1F THREE PHOTO_REFERENCED THEMO WALL_FLUSH WORK_TEST (NOT CURRENT) BABYLON Y_UP';
const rootName = 'P137E_D_THEMOS_REAL_WALL_FACE_WORK_TEST_ROOT_BABYLON_Y_UP';
const wallName = 'P137E_ORIGINAL_P123C_D1F_NODE798_MESH406_PRESENTATION_INSTANCE';

const noPromotion = {
  Canonical: false,
  asBuilt: false,
  publishToCURRENT: false,
  HUMAN_REVIEW: 'NOT_RUN',
};

const makeScene67Glb = () => {
  const wallPositions = [-2, 0, 0, 2, 0, 0, -2, 0, 2];
  const devicePositions = [-0.08, 0, 0, 0.08, 0, 0, 0, 0, 0.18];
  const floats = [...wallPositions, ...devicePositions];
  const binary = Buffer.alloc(floats.length * 4);
  floats.forEach((value, index) => binary.writeFloatLE(value, index * 4));

  const nodes: Record<string, unknown>[] = Array.from({ length: 1108 }, () => ({}));
  // The real viewer first resolves the independent D1F interior carrier
  // before opening the exact scene67 P123C wall. Keep this minimal semantic
  // context in the fixture, never as a substitute for the original wall.
  nodes[1] = { name: 'D_1F_SYNTHETIC_INTERIOR_CONTEXT_NOT_THEMO_SOURCE', mesh: 1 };
  nodes[798] = { name: 'ORIGINAL_P123C_WALL_SOURCE', mesh: 406 };
  nodes[1106] = {
    name: wallName,
    mesh: 406,
    translation: [0, 5.072, 0],
    extras: {
      sourceNodeIndex: 798,
      sourceMeshIndex: 406,
      originalSourceGeometryUnmodified: true,
      presentationOnly: true,
      ...noPromotion,
    },
  };

  const targets = [
    { index: 1091, name: 'P137E_THEMO_LOBBY_WALL_CONTACT_WORK_TEST',
      id: 'D_THEMO_CURRENT_LOBBY_01', side: 'NORTH', faceY: 5.112, sign: 1, x: -0.9 },
    { index: 1096, name: 'P137E_THEMO_BEDROOM_WALL_CONTACT_WORK_TEST',
      id: 'D_THEMO_CURRENT_BEDROOM_01', side: 'SOUTH', faceY: 5.032, sign: -1, x: 0.4 },
    { index: 1101, name: 'P137E_THEMO_BATHROOM_WALL_CONTACT_WORK_TEST',
      id: 'D_THEMO_CURRENT_BATHROOM_01', side: 'SOUTH', faceY: 5.032, sign: -1, x: 1.2 },
  ];
  for (const target of targets) {
    nodes[target.index] = {
      name: target.name,
      mesh: 0,
      translation: [target.x, target.faceY, 1],
      extras: {
        logicalDeviceId: target.id,
        representationKind: 'photoReferencedThermostatWallMountWorkTest',
        sourceFaceMeshIndex: 406,
        sourceFaceNodeIndex: 798,
        sourceFaceSide: target.side,
        sourceFaceYM: target.faceY,
        backplateContactYM: target.faceY,
        frontFacesTowardYSign: target.sign,
        wallBackplateAirGapM: 0,
        fitOriginalPresentationSourceWallPlanePassed: true,
        fitExactPhysicalWallHostVerified: false,
        exactXYClaim: false,
        exactZClaim: false,
        currentGeometryClaim: false,
        wallHostPhysicalAsBuiltClaim: false,
        presentationOnly: true,
        ...noPromotion,
      },
    };
  }
  nodes[1107] = {
    name: rootName,
    children: [1106, 1091, 1096, 1101],
    // Babylon Y-up: +Y -> world -Z, +Z -> world +Y.
    rotation: [-Math.SQRT1_2, 0, 0, Math.SQRT1_2],
    extras: {
      Pass: 'P137E',
      sourceOriginalWallNode: 798,
      sourceOriginalWallMesh: 406,
      WORK_TEST_ONLY: true,
      oldMarkersSuppressedInNewSceneOnly: true,
      ...noPromotion,
    },
  };

  const meshes = Array.from({ length: 407 }, (_, index) => ({
    primitives: [{ attributes: { POSITION: index === 406 ? 0 : 1 } }],
  }));
  const scenes = Array.from({ length: 68 }, (_, index) => ({
    name: 'UNRELATED_SCENE_' + index,
    nodes: [] as number[],
  }));
  // The actual source GLB contains this separately named interior scene.
  // Without it, activateDPlan cannot select D1F and the P137E viewer must
  // reject the test fixture before any NORTH/SOUTH/RASTI/MITTAA assertions.
  scenes[0] = { name: 'D CURRENT INTERIOR - BABYLON Y-UP', nodes: [1] };
  scenes[67] = {
    name: sceneName,
    nodes: [1107],
    extras: {
      sourceSceneIndex: 66,
      sourceOriginalWallMeshIndex: 406,
      targetLogicalDeviceCount: 3,
      workTestOnly: true,
      noCurrentPromotion: true,
      HUMAN_REVIEW: 'NOT_RUN',
    },
  } as typeof scenes[number];

  const manifest = {
    asset: { version: '2.0' },
    scene: 67,
    scenes,
    nodes,
    meshes,
    accessors: [
      { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3',
        min: [-2, 0, 0], max: [2, 0, 2] },
      { bufferView: 1, componentType: 5126, count: 3, type: 'VEC3',
        min: [-0.08, 0, 0], max: [0.08, 0, 0.18] },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: wallPositions.length * 4, target: 34962 },
      { buffer: 0, byteOffset: wallPositions.length * 4,
        byteLength: devicePositions.length * 4, target: 34962 },
    ],
    buffers: [{ byteLength: binary.length }],
  };
  const json = Buffer.from(JSON.stringify(manifest));
  const paddedJson = Buffer.concat([json, Buffer.alloc((4 - json.length % 4) % 4, 0x20)]);
  const paddedBinary = Buffer.concat([binary, Buffer.alloc((4 - binary.length % 4) % 4)]);
  const header = Buffer.alloc(12);
  header.write('glTF');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + paddedJson.length + 8 + paddedBinary.length, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(paddedJson.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binaryHeader = Buffer.alloc(8);
  binaryHeader.writeUInt32LE(paddedBinary.length, 0);
  binaryHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jsonHeader, paddedJson, binaryHeader, paddedBinary]);
};

test('real Chromium toggles scene67 wall faces and restores top-plan RASTI/MITTAA tools', async ({ page }) => {
  test.setTimeout(45_000);
  await page.setViewportSize({ width: 1536, height: 768 });
  const glb = makeScene67Glb();
  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: glb });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ candidates: [{ id: candidateId, label: 'P137E original wall and Themos WORK_TEST',
        path: candidatePath }] }),
    });
  });
  await page.route('**' + candidatePath, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: glb });
  });
  await page.goto('/private-model/?review=' + reviewId);

  const canvas = page.locator('#private-model-canvas');
  await expect.poll(async () => {
    const actual = await canvas.getAttribute('data-work-test-review-mode');
    if (actual === reviewId) return actual;
    const phase = await canvas.getAttribute('data-work-test-load-failure-phase');
    const error = await canvas.getAttribute('data-work-test-load-error');
    return phase ? 'LOAD_FAILURE[' + phase + '] ' + error : actual || '';
  }, { timeout: 20_000 }).toBe(reviewId);

  await expect(canvas).toHaveAttribute('data-p137e-scene67-camera-face', 'NORTH');
  await expect(canvas).toHaveAttribute('data-p137e-wall-mounted-themo-count', '3');
  await expect(page.locator('#axis-measure-tool-button')).toBeDisabled();
  await expect(page.locator('#p137e-place-tool-button')).toBeDisabled();

  await page.locator('#view-menu > summary').click();
  await page.locator('#p137e-south-face-button').click();
  await expect(canvas).toHaveAttribute('data-p137e-scene67-camera-face', 'SOUTH');
  await expect(canvas).toHaveAttribute('data-p137e-scene67-wall-presentation',
    'SOUTH_SOURCE_WALL_ALPHA_0_38');

  await page.locator('#p137e-plan-face-button').click();
  await expect(canvas).toHaveAttribute('data-p137e-scene67-top-plan-tools-ready', 'true');
  await expect(canvas).toHaveAttribute('data-p137e-review-camera-mode',
    'ORTHOGRAPHIC_SOURCE_WALL_D1F_TOP');
  await expect(page.locator('#axis-measure-tool-button')).toBeEnabled();
  await expect(page.locator('#p137e-place-tool-button')).toBeEnabled();
  await page.locator('#p137e-place-tool-button').click();
  await expect(canvas).toHaveAttribute('data-interaction-mode', 'place');
  await page.locator('#axis-measure-tool-button').click();
  await expect(canvas).toHaveAttribute('data-interaction-mode', 'measure');

  await page.locator('#p137e-north-face-button').click();
  await expect(canvas).toHaveAttribute('data-p137e-scene67-camera-face', 'NORTH');
  await expect(page.locator('#axis-measure-tool-button')).toBeDisabled();
  await expect(page.locator('#p137e-place-tool-button')).toBeDisabled();
  await expect(canvas).toHaveAttribute('data-p137e-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute('data-p137e-current-claim', 'false');
});
