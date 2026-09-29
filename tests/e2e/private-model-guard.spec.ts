import { expect, test } from '@playwright/test';

import {
  handlePrivateModelRequest,
  isPrivateModelPath,
  type PrivateModelEnv,
} from '../../worker/privateModel';

const makeMinimalGlb = (json: Record<string, unknown>) => {
  const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
  const padding = (4 - (jsonBuffer.length % 4)) % 4;
  const jsonChunk = Buffer.concat([jsonBuffer, Buffer.alloc(padding, 0x20)]);
  const header = Buffer.alloc(12);
  header.write('glTF', 0, 'ascii');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonChunk.length, 8);

  const chunkHeader = Buffer.alloc(8);
  chunkHeader.writeUInt32LE(jsonChunk.length, 0);
  chunkHeader.writeUInt32LE(0x4e4f534a, 4);

  return Buffer.concat([header, chunkHeader, jsonChunk]);
};


const makeTriangleGlb = (
  nodeExtras: Record<string, unknown> = {},
  materialExtras: Record<string, unknown> | null = null,
  materialOpacity = 1,
) => {
  const positions = Buffer.alloc(36);
  [-1, -1, 0, 1, -1, 0, 0, 1, 0].forEach((value, index) => {
    positions.writeFloatLE(value, index * 4);
  });

  const json = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'P133D REVIEW ROOT - BABYLON Y-UP', nodes: [0] }],
    nodes: [{ name: 'D_1F_TEST_GROUP', mesh: 0, extras: nodeExtras }],
    meshes: [
      {
        name: 'TEST_TRIANGLE',
        primitives: [
          {
            attributes: { POSITION: 0 },
            ...(materialExtras ? { material: 0 } : {}),
          },
        ],
      },
    ],
    ...(materialExtras
      ? {
          materials: [
            {
              name: 'TEST_ARCH_BASE',
              pbrMetallicRoughness: {
                baseColorFactor: [0.45, 0.55, 0.65, materialOpacity],
                metallicFactor: 0,
                roughnessFactor: 1,
              },
              alphaMode: materialOpacity < 1 ? 'BLEND' : 'OPAQUE',
              doubleSided: true,
              extras: materialExtras,
            },
          ],
        }
      : {}),
    buffers: [{ byteLength: positions.length }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: positions.length, target: 34962 }],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 3,
        type: 'VEC3',
        min: [-1, -1, 0],
        max: [1, 1, 0],
      },
    ],
  };

  const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
  const jsonPadding = (4 - (jsonBuffer.length % 4)) % 4;
  const jsonChunk = Buffer.concat([jsonBuffer, Buffer.alloc(jsonPadding, 0x20)]);
  const binPadding = (4 - (positions.length % 4)) % 4;
  const binChunk = Buffer.concat([positions, Buffer.alloc(binPadding)]);

  const header = Buffer.alloc(12);
  header.write('glTF', 0, 'ascii');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + binChunk.length, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binChunk.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);

  return Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binChunk]);
};


const makeDReviewGlb = (options: { includeUserCurrentDoors?: boolean } = {}) => {
  const { includeUserCurrentDoors = false } = options;
  const wallPositions = Buffer.alloc(36);
  [-1, -1, 0, 1, -1, 0, 0, 1, 0].forEach((value, index) => {
    wallPositions.writeFloatLE(value, index * 4);
  });
  const contextPositions = Buffer.alloc(36);
  [-1, -1, -0.1, 1, -1, -0.1, 0, 1, -0.1].forEach((value, index) => {
    contextPositions.writeFloatLE(value, index * 4);
  });
  const leaked2FLinePositions = Buffer.alloc(24);
  [-0.75, -0.75, -0.2, 0.75, -0.75, -0.2].forEach((value, index) => {
    leaked2FLinePositions.writeFloatLE(value, index * 4);
  });
  const doorMarkerIds = [
    'G2_DOOR_EXT_D_1F_S_001',
    'G2_DOOR_EXT_D_1F_N_001',
    'G2_DOOR_INT_D_1F_VH_WEST_2015_001',
    'G2_DOOR_INT_D_1F_WC_001',
    'G2_DOOR_INT_D_1F_SAUNA_PESUH_2015_001',
    'G2_DOOR_INT_D_1F_VH_NORTH_2015_001',
    'G2_DOOR_INT_D_1F_VARASTO_2015_001',
    'G2_DOOR_EXT_D_2F_S_001_ANCHOR',
    'G2_DOOR_INT_D_2F_WC_001',
    'G2_DOOR_INT_D_2F_ROOM4_001',
    'G2_DOOR_INT_D_2F_ROOM3_001',
  ];
  const userCurrentDoorIds = [
    'D1F_USER_CURRENT_DOOR_A',
    'D1F_USER_CURRENT_DOOR_B',
  ];
  const userCurrentDoorNodes = includeUserCurrentDoors
    ? userCurrentDoorIds.map((reviewDoorId, index) => ({
        name: `P137J_HMARK_USER_DOOR_${index === 0 ? 'A' : 'B'}_D_1F`,
        mesh: 3,
        translation: [0.2 + index * 0.2, 0, 0.2 + index * 0.05],
        extras: {
          PresentationOnly: true,
          Canonical: false,
          Pass: '137J',
          reviewDoorId,
          reviewAnchorId: `HUMAN_REVIEW_ANCHOR_${index === 0 ? 'A' : 'B'}`,
          storey: '1F',
          sourceClass: 'USER_CURRENT_STATE_DIRECT_OBSERVATION',
          userConfirmedDoor: true,
          userConfirmedCurrentState: true,
          approx: true,
          markerType: 'HORIZONTAL_ONLY_REFERENCE_AT_HOST_FLOOR',
          markerVerticalExtentM: null,
          doorHeightClaim: false,
          doorLeafGeometryAdded: false,
          physicalDoorVoid: false,
          asBuiltClaim: false,
          refinementPending: true,
        },
      }))
    : [];

  const binary = Buffer.concat([wallPositions, contextPositions, leaked2FLinePositions]);
  const json = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      { name: 'P136B REVIEW ROOT - BABYLON Y-UP', nodes: [] },
      { name: 'D CURRENT INTERIOR - BABYLON Y-UP', nodes: [0] },
    ],
    nodes: [
      {
        name: 'P136B_D_REVIEW_ROOT',
        children: [
          1,
          2,
          3,
          4,
          ...doorMarkerIds.map((_, index) => 5 + index),
          ...userCurrentDoorNodes.map((_, index) => 5 + doorMarkerIds.length + index),
        ],
      },
      {
        name: 'P123C_D1F_WINDOW_TRANSPARENT_WALL_HELPER',
        mesh: 0,
        extras: {
          PresentationOnly: true,
          Canonical: false,
          Pass: '123C',
          sourceP123BNode: 434,
          alpha: 0.38,
        },
      },
      {
        name: 'P117D_REVIEW_P87_VIEW_G2_D15_SPACE_SAUNA_1F_SRC',
        mesh: 1,
        extras: {
          PresentationOnly: true,
          Canonical: false,
          Pass: '117D',
          representationKind: 'referenceFootprint',
        },
      },
      {
        name: 'P87_VIEW_P84_OUTLINE_G2_D15_SPACE_WC_2F_SRC',
        mesh: 2,
        extras: {
          presentationOnly: true,
          presentationLayer: 'CURRENT_D_OUTLINE',
        },
      },
      {
        name: 'P123C_D2F_TRANSPARENT_FULL_WALL_HELPER',
        mesh: 0,
        extras: {
          PresentationOnly: true,
          Canonical: false,
          Pass: '123C',
          sourceP122BNode: 432,
          alpha: 0.38,
        },
      },
      ...doorMarkerIds.map((g2Id, index) => ({
        name: `P128B_HMARK_${g2Id}`,
        mesh: 3,
        translation: [0, 0, index * 0.01],
        extras: {
          PresentationOnly: true,
          Canonical: false,
          Pass: '128B',
          derivedFromG2Id: g2Id,
          storey: index < 7 ? '1F' : '2F',
          markerType: 'HORIZONTAL_ONLY_REFERENCE_AT_HOST_FLOOR',
          markerVerticalExtentM: null,
          doorHeightClaim: false,
          doorLeafGeometryAdded: false,
          physicalDoorVoid: false,
          asBuiltClaim: false,
        },
      })),
      ...userCurrentDoorNodes,
    ],
    meshes: [
      { primitives: [{ attributes: { POSITION: 0 }, material: 0 }] },
      { primitives: [{ attributes: { POSITION: 1 }, material: 1 }] },
      { primitives: [{ attributes: { POSITION: 2 }, material: 1, mode: 1 }] },
      { primitives: [{ attributes: { POSITION: 2 }, material: 2, mode: 1 }] },
    ],
    materials: [
      {
        name: 'P123C_D_REVIEW_WALL_TRANSPARENT',
        pbrMetallicRoughness: { baseColorFactor: [0.08, 1, 0.18, 0.38] },
        alphaMode: 'BLEND',
        doubleSided: true,
      },
      {
        name: 'P117D_D1F_REVIEW_CONTEXT_TRANSPARENT',
        pbrMetallicRoughness: { baseColorFactor: [0.18, 0.68, 0.42, 0.12] },
        alphaMode: 'BLEND',
        doubleSided: true,
      },
      {
        name: 'P128B_D_DOOR_HORIZONTAL_ONLY_MARKER_ORANGE',
        pbrMetallicRoughness: { baseColorFactor: [0.78, 0.22, 0.1, 1] },
        doubleSided: true,
      },
    ],
    buffers: [{ byteLength: binary.length }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: wallPositions.length, target: 34962 },
      {
        buffer: 0,
        byteOffset: wallPositions.length,
        byteLength: contextPositions.length,
        target: 34962,
      },
      {
        buffer: 0,
        byteOffset: wallPositions.length + contextPositions.length,
        byteLength: leaked2FLinePositions.length,
        target: 34962,
      },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 3,
        type: 'VEC3',
        min: [-1, -1, 0],
        max: [1, 1, 0],
      },
      {
        bufferView: 1,
        componentType: 5126,
        count: 3,
        type: 'VEC3',
        min: [-1, -1, -0.1],
        max: [1, 1, -0.1],
      },
      {
        bufferView: 2,
        componentType: 5126,
        count: 2,
        type: 'VEC3',
        min: [-0.75, -0.75, -0.2],
        max: [0.75, -0.75, -0.2],
      },
    ],
  };

  const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
  const jsonPadding = (4 - (jsonBuffer.length % 4)) % 4;
  const jsonChunk = Buffer.concat([jsonBuffer, Buffer.alloc(jsonPadding, 0x20)]);
  const binPadding = (4 - (binary.length % 4)) % 4;
  const binChunk = Buffer.concat([binary, Buffer.alloc(binPadding)]);

  const header = Buffer.alloc(12);
  header.write('glTF', 0, 'ascii');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + binChunk.length, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binChunk.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);

  return Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binChunk]);
};

const makeMeshAndLineGlb = () => {
  const trianglePositions = Buffer.alloc(36);
  [-1, -1, 0, 1, -1, 0, 0, 1, 0].forEach((value, index) => {
    trianglePositions.writeFloatLE(value, index * 4);
  });

  const linePositions = Buffer.alloc(24);
  [20, 0, 0, 24, 0, 0].forEach((value, index) => {
    linePositions.writeFloatLE(value, index * 4);
  });

  const binary = Buffer.concat([trianglePositions, linePositions]);
  const json = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'P133D REVIEW ROOT - BABYLON Y-UP', nodes: [0, 1] }],
    nodes: [
      { name: 'BUILDING_MESH', mesh: 0 },
      {
        name: 'SITE_LINE',
        mesh: 1,
        extras: { presentationLayer: 'REFERENCE_ROOF' },
      },
    ],
    meshes: [
      { name: 'BUILDING_TRIANGLE', primitives: [{ attributes: { POSITION: 0 } }] },
      {
        name: 'SITE_LINE_SEGMENTS',
        primitives: [{ attributes: { POSITION: 1 }, mode: 1 }],
      },
    ],
    buffers: [{ byteLength: binary.length }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: trianglePositions.length, target: 34962 },
      {
        buffer: 0,
        byteOffset: trianglePositions.length,
        byteLength: linePositions.length,
        target: 34962,
      },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 3,
        type: 'VEC3',
        min: [-1, -1, 0],
        max: [1, 1, 0],
      },
      {
        bufferView: 1,
        componentType: 5126,
        count: 2,
        type: 'VEC3',
        min: [20, 0, 0],
        max: [24, 0, 0],
      },
    ],
  };

  const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
  const jsonPadding = (4 - (jsonBuffer.length % 4)) % 4;
  const jsonChunk = Buffer.concat([jsonBuffer, Buffer.alloc(jsonPadding, 0x20)]);
  const binPadding = (4 - (binary.length % 4)) % 4;
  const binChunk = Buffer.concat([binary, Buffer.alloc(binPadding)]);

  const header = Buffer.alloc(12);
  header.write('glTF', 0, 'ascii');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + binChunk.length, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binChunk.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);

  return Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binChunk]);
};


const makeLineGlb = () => {
  const linePositions = Buffer.alloc(24);
  [-1, 0, 0, 1, 0, 0].forEach((value, index) => {
    linePositions.writeFloatLE(value, index * 4);
  });

  const json = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'P133D REVIEW ROOT - BABYLON Y-UP', nodes: [0] }],
    nodes: [
      {
        name: 'SITE_LINE',
        mesh: 0,
        extras: { presentationLayer: 'REFERENCE_ROOF' },
      },
    ],
    meshes: [
      {
        name: 'SITE_LINE_SEGMENTS',
        primitives: [{ attributes: { POSITION: 0 }, mode: 1 }],
      },
    ],
    buffers: [{ byteLength: linePositions.length }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: linePositions.length, target: 34962 }],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 2,
        type: 'VEC3',
        min: [-1, 0, 0],
        max: [1, 0, 0],
      },
    ],
  };

  const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
  const jsonPadding = (4 - (jsonBuffer.length % 4)) % 4;
  const jsonChunk = Buffer.concat([jsonBuffer, Buffer.alloc(jsonPadding, 0x20)]);
  const binPadding = (4 - (linePositions.length % 4)) % 4;
  const binChunk = Buffer.concat([linePositions, Buffer.alloc(binPadding)]);

  const header = Buffer.alloc(12);
  header.write('glTF', 0, 'ascii');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + binChunk.length, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binChunk.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);

  return Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binChunk]);
};


const makeLocusLayerGlb = () => {
  const waterPositions = Buffer.alloc(24);
  [-1, 0, 0, 1, 0, 0].forEach((value, index) => {
    waterPositions.writeFloatLE(value, index * 4);
  });

  const wastewaterPositions = Buffer.alloc(24);
  [-1, 0, 0, 1, 0, 0].forEach((value, index) => {
    wastewaterPositions.writeFloatLE(value, index * 4);
  });

  const binary = Buffer.concat([waterPositions, wastewaterPositions]);
  const json = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'P133D REVIEW ROOT - BABYLON Y-UP', nodes: [0, 1] }],
    nodes: [
      {
        name: 'LOCUS_WATER_LINE',
        mesh: 0,
        extras: {
          presentationLayer: 'G3_LOCUS_SITE',
          presentationSubgroup: 'WATER',
          ModelStage: 'WORK_TEST_PRESENTATION',
        },
      },
      {
        name: 'LOCUS_WASTEWATER_LINE',
        mesh: 1,
        extras: {
          presentationLayer: 'G3_LOCUS_SITE',
          presentationSubgroup: 'WASTEWATER',
          ModelStage: 'WORK_TEST_PRESENTATION',
        },
      },
    ],
    meshes: [
      {
        name: 'LOCUS_WATER_SEGMENTS',
        primitives: [{ attributes: { POSITION: 0 }, mode: 1 }],
      },
      {
        name: 'LOCUS_WASTEWATER_SEGMENTS',
        primitives: [{ attributes: { POSITION: 1 }, mode: 1 }],
      },
    ],
    buffers: [{ byteLength: binary.length }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: waterPositions.length, target: 34962 },
      {
        buffer: 0,
        byteOffset: waterPositions.length,
        byteLength: wastewaterPositions.length,
        target: 34962,
      },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 2,
        type: 'VEC3',
        min: [-1, 0, 0],
        max: [1, 0, 0],
      },
      {
        bufferView: 1,
        componentType: 5126,
        count: 2,
        type: 'VEC3',
        min: [-1, 0, 0],
        max: [1, 0, 0],
      },
    ],
  };

  const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
  const jsonPadding = (4 - (jsonBuffer.length % 4)) % 4;
  const jsonChunk = Buffer.concat([jsonBuffer, Buffer.alloc(jsonPadding, 0x20)]);
  const binPadding = (4 - (binary.length % 4)) % 4;
  const binChunk = Buffer.concat([binary, Buffer.alloc(binPadding)]);

  const header = Buffer.alloc(12);
  header.write('glTF', 0, 'ascii');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + binChunk.length, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binChunk.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);

  return Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binChunk]);
};

test('private model route matching is bounded to its own prefix', () => {
  expect(isPrivateModelPath('/private-model')).toBe(true);
  expect(isPrivateModelPath('/private-model/')).toBe(true);
  expect(isPrivateModelPath('/private-model/model.glb')).toBe(true);
  expect(isPrivateModelPath('/private-modelish')).toBe(false);
  expect(isPrivateModelPath('/current/private-model')).toBe(false);
});

test('private model handler fails closed before static assets without Access configuration', async () => {
  let assetFetches = 0;
  const env: PrivateModelEnv = {
    ASSETS: {
      fetch: async () => {
        assetFetches += 1;
        return new Response('should not be reached');
      },
    },
  };

  const response = await handlePrivateModelRequest(
    new Request('https://example.test/private-model/', { method: 'GET' }),
    env,
  );

  expect(response.status).toBe(404);
  expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  expect(response.headers.get('X-Robots-Tag')).toContain('noindex');
  expect(assetFetches).toBe(0);
});

test('private model handler rejects unsupported methods before auth or assets', async () => {
  let assetFetches = 0;
  const env: PrivateModelEnv = {
    ASSETS: {
      fetch: async () => {
        assetFetches += 1;
        return new Response('should not be reached');
      },
    },
  };

  const response = await handlePrivateModelRequest(
    new Request('https://example.test/private-model/model.glb', { method: 'POST' }),
    env,
  );

  expect(response.status).toBe(405);
  expect(response.headers.get('Allow')).toBe('GET, HEAD');
  expect(assetFetches).toBe(0);
});

test('private viewer resolves the source D scene even when Three runtime names are sanitized', async ({
  page,
}) => {
  const model = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      { name: 'P133D REVIEW ROOT - BABYLON Y-UP', nodes: [] },
      { name: 'D CURRENT INTERIOR - BABYLON Y-UP', nodes: [] },
    ],
    nodes: [],
  });

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: model,
    });
  });

  await page.goto('/private-model/');

  await expect(page.getByRole('button', { name: 'D 1F' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'D 2F' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Fit / Reset' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Malli ladattu - D-pohjat käytettävissä');
});



test('private viewer selects a visible mesh, shows bounded identity, and ignores orbit drags', async ({ page }) => {
  const model = makeTriangleGlb();

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: model,
    });
  });

  await page.goto('/private-model/');
  await expect(page.getByRole('status')).toHaveText('Malli ladattu');

  const canvas = page.locator('#private-model-canvas');
  const panel = page.locator('#selection-panel');
  await expect(panel).toBeHidden();

  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  await expect(panel).toBeVisible();
  await expect(page.locator('#selection-mesh')).not.toHaveText('-');
  await expect(page.locator('#selection-floor')).toHaveText('1F');
  await expect(page.locator('#selection-scene')).toHaveText('P133D REVIEW ROOT - BABYLON Y-UP');

  await page.getByRole('button', { name: 'Tyhjennä' }).click();
  await expect(panel).toBeHidden();

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2 + 40);
  await page.mouse.up();
  await expect(panel).toBeHidden();
});


test('private viewer selects visible LineSegments and clears hidden line selection', async ({ page }) => {
  const model = makeLineGlb();

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: model,
    });
  });

  await page.goto('/private-model/');
  await expect(page.getByRole('status')).toHaveText('Malli ladattu');

  const canvas = page.locator('#private-model-canvas');
  const panel = page.locator('#selection-panel');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  await expect(panel).toBeVisible();
  await expect(page.locator('#selection-mesh')).toContainText('SITE_LINE');

  await page.getByRole('button', { name: 'Layerit' }).click();
  await page.locator('#roof-layer-visible').uncheck();
  await expect(panel).toBeHidden();

  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  await expect(panel).toBeHidden();
});

test('private viewer exposes G3 LOCUS SITE as an opt-in WORK_TEST layer with subgroup legend', async ({ page }) => {
  const model = makeLocusLayerGlb();

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: model,
    });
  });

  await page.goto('/private-model/');
  await expect(page.getByRole('status')).toHaveText('Malli ladattu');

  const canvas = page.locator('#private-model-canvas');
  const panel = page.locator('#selection-panel');
  await page.getByRole('button', { name: 'Layerit' }).click();

  const locusToggle = page.locator('#locus-layer-visible');
  await expect(page.getByText('Locus kunnallistekniikka (WORK_TEST)')).toBeVisible();
  await expect(locusToggle).toBeEnabled();
  await expect(locusToggle).not.toBeChecked();
  await expect(page.locator('#locus-layer-count')).toHaveText('2 kohdetta');
  await expect(page.locator('#locus-water-count')).toHaveText('Vesi 1');
  await expect(page.locator('#locus-wastewater-count')).toHaveText('Jätevesi 1');
  await expect(canvas).toHaveAttribute('data-locus-layer-visible', 'false');

  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  await expect(panel).toBeHidden();

  await locusToggle.check();
  await expect(canvas).toHaveAttribute('data-locus-layer-visible', 'true');
  await page.getByRole('button', { name: 'Fit / Reset' }).click();
  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  await expect(panel).toBeVisible();
  await expect(page.locator('#selection-mesh')).toContainText('LOCUS_');

  await locusToggle.uncheck();
  await expect(canvas).toHaveAttribute('data-locus-layer-visible', 'false');
  await expect(panel).toBeHidden();

  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  await expect(panel).toBeHidden();
});

test('private viewer fits inside the browser viewport without document scrolling', async ({ page }) => {
  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 404,
      contentType: 'application/octet-stream',
      body: '',
    });
  });

  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 700, height: 520 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/private-model/');

    const metrics = await page.evaluate(() => {
      const viewportElement = document.querySelector<HTMLElement>('.viewport');
      const rect = viewportElement?.getBoundingClientRect();
      return {
        clientHeight: document.documentElement.clientHeight,
        scrollHeight: document.documentElement.scrollHeight,
        bodyClientHeight: document.body.clientHeight,
        bodyScrollHeight: document.body.scrollHeight,
        viewportTop: rect?.top ?? -1,
        viewportBottom: rect?.bottom ?? -1,
        innerHeight: window.innerHeight,
      };
    });

    expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.clientHeight + 1);
    expect(metrics.bodyScrollHeight).toBeLessThanOrEqual(metrics.bodyClientHeight + 1);
    expect(metrics.viewportTop).toBeGreaterThanOrEqual(0);
    expect(metrics.viewportBottom).toBeLessThanOrEqual(metrics.innerHeight + 1);
  }
});



test('private viewer uses a true orthographic isometric preset without resetting layer state', async ({ page }) => {
  const model = makeTriangleGlb({ presentationLayer: 'REFERENCE_ROOF' });

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: model,
    });
  });

  await page.goto('/private-model/');
  await expect(page.getByRole('status')).toHaveText('Malli ladattu');

  await page.getByRole('button', { name: 'Layerit' }).click();
  const opacity = page.locator('#roof-layer-opacity');
  await opacity.fill('40');
  await opacity.dispatchEvent('input');
  await expect(page.locator('#roof-layer-opacity-value')).toHaveText('40 %');

  await page.getByRole('button', { name: 'Iso' }).click();
  await expect(page.locator('#viewer-status')).toHaveText('Isometrinen - ortografinen 3/4-näkymä');
  await expect(page.locator('#private-model-canvas')).toHaveAttribute('data-view-preset', 'isometric');
  await expect(page.locator('#private-model-canvas')).toHaveAttribute('data-camera-projection', 'orthographic');
  await expect(opacity).toHaveValue('40');
  await expect(page.locator('#roof-layer-visible')).toBeChecked();

  const canvas = page.locator('#private-model-canvas');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  await expect(page.locator('#selection-panel')).toBeVisible();
});

test('private viewer roof test layer toggles explicit roof metadata and exposes opacity control', async ({
  page,
}) => {
  const model = makeTriangleGlb({ presentationLayer: 'REFERENCE_ROOF' });

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: model,
    });
  });

  await page.goto('/private-model/');
  await expect(page.getByRole('status')).toHaveText('Malli ladattu');

  await page.getByRole('button', { name: 'Layerit' }).click();
  const layerPanel = page.locator('#layers-panel');
  const roofToggle = page.locator('#roof-layer-visible');
  const opacity = page.locator('#roof-layer-opacity');

  await expect(layerPanel).toBeVisible();
  await expect(page.getByText('Katto (testi)')).toBeVisible();
  await expect(page.locator('#roof-layer-count')).toHaveText('1 kohdetta');
  await expect(roofToggle).toBeChecked();
  await expect(opacity).toHaveValue('100');

  await opacity.fill('40');
  await opacity.dispatchEvent('input');
  await expect(page.locator('#roof-layer-opacity-value')).toHaveText('40 %');

  const canvas = page.locator('#private-model-canvas');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  await roofToggle.uncheck();
  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  await expect(page.locator('#selection-panel')).toBeHidden();

  await roofToggle.check();
  await opacity.fill('100');
  await opacity.dispatchEvent('input');
  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  await expect(page.locator('#selection-panel')).toBeVisible();

  await page.getByRole('button', { name: 'Sulje' }).click();
  await expect(layerPanel).toBeHidden();
});


test('private viewer makes ARCH_BASE opaque and uses absolute roof opacity', async ({ page }) => {
  const model = makeTriangleGlb(
    { presentationLayer: 'REFERENCE_ROOF' },
    { presentationGroup: 'ARCH_BASE' },
    0.58,
  );

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: model,
    });
  });

  await page.goto('/private-model/');
  await expect(page.getByRole('status')).toHaveText('Malli ladattu');
  await expect(page.locator('#private-model-canvas')).toHaveAttribute('data-arch-base-opacity', '1');

  await page.getByRole('button', { name: 'Layerit' }).click();
  const opacity = page.locator('#roof-layer-opacity');
  const output = page.locator('#roof-layer-opacity-value');

  await expect(output).toHaveAttribute('data-material-opacity', '1');

  await opacity.fill('40');
  await opacity.dispatchEvent('input');
  await expect(output).toHaveText('40 %');
  await expect(output).toHaveAttribute('data-material-opacity', '0.4');

  await opacity.fill('100');
  await opacity.dispatchEvent('input');
  await expect(output).toHaveAttribute('data-material-opacity', '1');

  await page.getByRole('button', { name: 'Iso' }).click();
  await expect(page.locator('#private-model-canvas')).toHaveAttribute('data-camera-projection', 'orthographic');
  await expect(output).toHaveAttribute('data-material-opacity', '1');
});

test('private viewer full-model fit includes visible line geometry and excludes hidden line layers', async ({ page }) => {
  const model = makeMeshAndLineGlb();

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: model,
    });
  });

  await page.goto('/private-model/');
  await expect(page.getByRole('status')).toHaveText('Malli ladattu');

  const canvas = page.locator('#private-model-canvas');
  const visibleFitCenter = Number(await canvas.getAttribute('data-fit-center-x'));
  const visibleFitRadius = Number(await canvas.getAttribute('data-fit-radius'));
  expect(visibleFitCenter).toBeGreaterThan(10);
  expect(visibleFitRadius).toBeGreaterThan(12);

  await page.getByRole('button', { name: 'Iso' }).click();
  const visibleIsoCenter = Number(await canvas.getAttribute('data-iso-fit-center-x'));
  expect(visibleIsoCenter).toBeGreaterThan(10);

  await page.getByRole('button', { name: 'Layerit' }).click();
  await page.locator('#roof-layer-visible').uncheck();
  await page.getByRole('button', { name: 'Fit / Reset' }).click();

  const hiddenFitCenter = Number(await canvas.getAttribute('data-fit-center-x'));
  const hiddenFitRadius = Number(await canvas.getAttribute('data-fit-radius'));
  expect(Math.abs(hiddenFitCenter)).toBeLessThan(0.01);
  expect(hiddenFitRadius).toBeLessThan(2);

  await page.getByRole('button', { name: 'Iso' }).click();
  const hiddenIsoCenter = Number(await canvas.getAttribute('data-iso-fit-center-x'));
  expect(Math.abs(hiddenIsoCenter)).toBeLessThan(0.01);
});




test('private viewer turns p136B D floor views into isolated review views', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      { name: 'P133D REVIEW ROOT - BABYLON Y-UP', nodes: [] },
      { name: 'D CURRENT INTERIOR - BABYLON Y-UP', nodes: [] },
    ],
    nodes: [],
  });

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: currentModel,
    });
  });

  const candidateId = 'p136b-d-current-wall-corrected';
  const candidateLabel = 'p136B - D current wall corrected';
  const candidatePath = '/private-model/work-test/p136b-d-current-wall-corrected.glb';

  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }],
      }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: makeDReviewGlb(),
    });
  });

  await page.goto('/private-model/');
  await expect(page.locator('#work-test-select')).toBeEnabled();
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);
  await page.getByRole('button', { name: 'Avaa WORK_TEST' }).click();

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-d-review-prepared', 'true');
  await expect(canvas).toHaveAttribute('data-d-review-door-marker-prepared-count', '11');

  await page.getByRole('button', { name: 'D 1F' }).click();
  await expect(page.getByRole('status')).toHaveText(
    'D 1F - tarkastusnäkymä, tarkastusgeometria korostettu',
  );
  await expect(canvas).toHaveAttribute('data-view-preset', 'd-plan');
  await expect(canvas).toHaveAttribute('data-camera-projection', 'orthographic');
  await expect(canvas).toHaveAttribute('data-d-review-active', 'true');
  await expect(canvas).toHaveAttribute('data-d-review-emphasis-count', '1');
  await expect(canvas).toHaveAttribute('data-d-review-context-hidden-count', '1');
  await expect(canvas).toHaveAttribute('data-d-plan-visible-renderable-count', '9');
  await expect(canvas).toHaveAttribute('data-d-plan-hidden-other-floor-count', '7');
  await expect(canvas).toHaveAttribute('data-d-review-door-marker-visible-count', '7');
  await expect(canvas).toHaveAttribute('data-d1-known-door-label-count', '7');
  await expect(canvas).toHaveAttribute('data-d1-known-door-labels-visible', 'true');

  const knownDoorLegend = page.locator('#d1-known-door-legend');
  const knownDoorLabels = page.locator('#d1-known-door-label-layer .d1-known-door-label');
  await expect(knownDoorLegend).toBeVisible();
  await expect(knownDoorLabels).toHaveCount(7);
  await expect(knownDoorLabels.first()).toHaveCSS('position', 'absolute');
  await expect(canvas).toHaveAttribute('data-d1-user-door-label-count', '0');
  await expect(canvas).toHaveAttribute('data-d1-user-door-labels-visible', 'false');
  await expect(page.locator('#d1-known-door-legend-list li')).toHaveCount(7);
  await expect
    .poll(async () =>
      knownDoorLabels.evaluateAll((nodes) =>
        nodes.every((node) => {
          const element = node as HTMLElement;
          return Boolean(element.style.left && element.style.top);
        }),
      ),
    )
    .toBe(true);

  const knownDoorIds = await knownDoorLabels.evaluateAll((nodes) =>
    nodes.map((node) => (node as HTMLElement).dataset.g2Id),
  );
  expect(knownDoorIds).toEqual([
    'G2_DOOR_EXT_D_1F_S_001',
    'G2_DOOR_EXT_D_1F_N_001',
    'G2_DOOR_INT_D_1F_VH_WEST_2015_001',
    'G2_DOOR_INT_D_1F_WC_001',
    'G2_DOOR_INT_D_1F_SAUNA_PESUH_2015_001',
    'G2_DOOR_INT_D_1F_VH_NORTH_2015_001',
    'G2_DOOR_INT_D_1F_VARASTO_2015_001',
  ]);
  await expect(page.locator('#d1-known-door-legend-list code').nth(0)).toHaveText(
    'G2_DOOR_EXT_D_1F_S_001',
  );
  await expect(page.locator('#d1-known-door-legend-list code').nth(6)).toHaveText(
    'G2_DOOR_INT_D_1F_VARASTO_2015_001',
  );

  await expect(canvas).toHaveAttribute('data-d2f-boundary-context-prepared', 'true');
  await expect(canvas).toHaveAttribute(
    'data-d2f-boundary-context-source',
    'G1_G2_D2F_PLAN_HOST_ENVELOPE',
  );

  const coordinatePanel = page.locator('#coordinate-panel');
  await expect(coordinatePanel).toBeVisible();
  await expect(page.locator('#coordinate-floor')).toHaveText('D 1F');
  await expect(canvas).toHaveAttribute('data-review-coordinate-frame', 'YLIS-G1-LOCAL');
  await expect(canvas).toHaveAttribute('data-review-grid-visible', 'true');
  await expect(canvas).toHaveAttribute('data-review-grid-major-step-m', '1');
  await expect(canvas).toHaveAttribute('data-review-grid-minor-step-m', '0.5');

  const coordinateBox = await canvas.boundingBox();
  expect(coordinateBox).not.toBeNull();
  if (!coordinateBox) return;

  await page.mouse.move(
    coordinateBox.x + coordinateBox.width * 0.5,
    coordinateBox.y + coordinateBox.height * 0.5,
  );
  await expect(canvas).toHaveAttribute('data-review-pointer-x', /-?\d+\.\d{3}/);
  await expect(canvas).toHaveAttribute('data-review-pointer-y', /-?\d+\.\d{3}/);
  const centerX = Number(await canvas.getAttribute('data-review-pointer-x'));
  const centerY = Number(await canvas.getAttribute('data-review-pointer-y'));

  await canvas.click({ position: { x: coordinateBox.width * 0.5, y: coordinateBox.height * 0.5 } });
  await expect(canvas).toHaveAttribute('data-review-anchor-x', centerX.toFixed(3));
  await expect(canvas).toHaveAttribute('data-review-anchor-y', centerY.toFixed(3));
  await expect(page.locator('#coordinate-anchor')).toContainText('X ');
  await expect(page.locator('#coordinate-anchor')).toContainText('Y ');

  await page.mouse.move(
    coordinateBox.x + coordinateBox.width * 0.75,
    coordinateBox.y + coordinateBox.height * 0.5,
  );
  await expect
    .poll(async () => Number(await canvas.getAttribute('data-review-pointer-x')))
    .toBeGreaterThan(centerX);

  await page.mouse.move(
    coordinateBox.x + coordinateBox.width * 0.5,
    coordinateBox.y + coordinateBox.height * 0.25,
  );
  await expect
    .poll(async () => Number(await canvas.getAttribute('data-review-pointer-y')))
    .toBeGreaterThan(centerY);

  await page.getByRole('button', { name: 'D 2F' }).click();
  await expect(page.getByRole('status')).toHaveText(
    'D 2F - tarkastusnäkymä, sisäseinät korostettu; rajaavat seinät kontekstina',
  );
  await expect(canvas).toHaveAttribute('data-d-review-active', 'true');
  await expect(canvas).toHaveAttribute('data-d-review-emphasis-count', '1');
  await expect(canvas).toHaveAttribute('data-d-review-context-hidden-count', '0');
  await expect(canvas).toHaveAttribute('data-d-plan-visible-renderable-count', '7');
  await expect(canvas).toHaveAttribute('data-d-plan-hidden-other-floor-count', '9');
  await expect(canvas).toHaveAttribute('data-d-review-door-marker-visible-count', '4');
  await expect(canvas).toHaveAttribute('data-d1-known-door-label-count', '7');
  await expect(canvas).toHaveAttribute('data-d1-known-door-labels-visible', 'false');
  await expect(knownDoorLegend).toBeHidden();
  await expect(page.locator('#d1-known-door-label-layer')).toBeHidden();
  await expect(page.locator('#coordinate-floor')).toHaveText('D 2F');
  await expect(coordinatePanel).toBeVisible();
  await expect(canvas).toHaveAttribute('data-review-grid-visible', 'true');

  await page.getByRole('button', { name: 'Orbit' }).click();
  await expect(coordinatePanel).toBeHidden();
  await expect(canvas).toHaveAttribute('data-review-grid-visible', 'false');
  await expect(canvas).toHaveAttribute('data-d1-known-door-labels-visible', 'false');
  await expect(knownDoorLegend).toBeHidden();
  await expect(canvas).toHaveAttribute('data-d-review-active', 'false');
  await expect(canvas).toHaveAttribute('data-d-review-emphasis-count', '0');
  await expect(canvas).toHaveAttribute('data-d-review-context-hidden-count', '0');
  await expect(canvas).toHaveAttribute('data-d-review-door-marker-visible-count', '0');
});


test('private viewer makes p137J user-current D1F doors visible as A/B review markers', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      { name: 'P133D REVIEW ROOT - BABYLON Y-UP', nodes: [] },
      { name: 'D CURRENT INTERIOR - BABYLON Y-UP', nodes: [] },
    ],
    nodes: [],
  });

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: currentModel,
    });
  });

  const candidateId = 'p137j-d1f-user-current-doors';
  const candidateLabel = 'p138D architecture baseline - p137J geometry';
  const candidatePath = '/private-model/work-test/p137j-d1f-user-current-doors.glb';

  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }],
      }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: makeDReviewGlb({ includeUserCurrentDoors: true }),
    });
  });

  await page.goto('/private-model/');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);
  await page.getByRole('button', { name: 'Avaa WORK_TEST' }).click();

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-d-review-door-marker-prepared-count', '13');
  await expect(canvas).toHaveAttribute('data-d1-user-door-label-count', '2');

  await page.getByRole('button', { name: 'D 1F' }).click();
  await expect(canvas).toHaveAttribute('data-d-review-door-marker-visible-count', '9');
  await expect(canvas).toHaveAttribute('data-d1-known-door-label-count', '7');
  await expect(canvas).toHaveAttribute('data-d1-user-door-label-count', '2');
  await expect(canvas).toHaveAttribute('data-d1-user-door-labels-visible', 'true');

  const userDoorSection = page.locator('#d1-user-door-legend-section');
  const userDoorLabels = page.locator('#d1-known-door-label-layer .d1-user-door-label');
  await expect(userDoorSection).toBeVisible();
  await expect(userDoorLabels).toHaveCount(2);
  await expect(userDoorLabels.nth(0)).toHaveText('A');
  await expect(userDoorLabels.nth(1)).toHaveText('B');
  await expect(userDoorLabels.nth(0)).toHaveCSS('position', 'absolute');
  expect(
    await userDoorLabels.evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLElement).dataset.reviewDoorId),
    ),
  ).toEqual(['D1F_USER_CURRENT_DOOR_A', 'D1F_USER_CURRENT_DOOR_B']);
  await expect(page.locator('#d1-user-door-legend-list code').nth(0)).toHaveText(
    'D1F_USER_CURRENT_DOOR_A',
  );
  await expect(page.locator('#d1-user-door-legend-list code').nth(1)).toHaveText(
    'D1F_USER_CURRENT_DOOR_B',
  );

  await page.getByRole('button', { name: 'D 2F' }).click();
  await expect(canvas).toHaveAttribute('data-d-review-door-marker-visible-count', '4');
  await expect(canvas).toHaveAttribute('data-d1-user-door-labels-visible', 'false');
  await expect(userDoorSection).toBeHidden();

  await page.getByRole('button', { name: 'Orbit' }).click();
  await expect(canvas).toHaveAttribute('data-d1-user-door-labels-visible', 'false');
  await expect(userDoorSection).toBeHidden();
});


test('private viewer loads an allowlisted WORK_TEST candidate from the protected catalog and returns to CURRENT', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      { name: 'P133D REVIEW ROOT - BABYLON Y-UP', nodes: [] },
      { name: 'D CURRENT INTERIOR - BABYLON Y-UP', nodes: [] },
    ],
    nodes: [],
  });
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      { name: 'P136B REVIEW ROOT - BABYLON Y-UP', nodes: [] },
      { name: 'D CURRENT INTERIOR - BABYLON Y-UP', nodes: [] },
    ],
    nodes: [],
  });
  const candidateId = 'p136b-d-current-wall-corrected';
  const candidateLabel = 'p136B - D current wall corrected';
  const candidatePath = '/private-model/work-test/p136b-d-current-wall-corrected.glb';
  let currentLoads = 0;
  let candidateLoads = 0;

  await page.route('**/private-model/model.glb', async (route) => {
    currentLoads += 1;
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
        candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }],
      }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    candidateLoads += 1;
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: candidateModel,
    });
  });

  await page.goto('/private-model/');
  await expect(page.getByRole('status')).toHaveText('Malli ladattu - D-pohjat käytettävissä');
  await expect(page.locator('#model-source-badge')).toHaveText('CURRENT');
  await expect(page.locator('#private-model-canvas')).toHaveAttribute('data-model-source', 'current');
  await expect(page.locator('#private-model-canvas')).toHaveAttribute('data-work-test-catalog', 'ready');
  await expect(page.locator('#work-test-file-input')).toHaveCount(0);
  await expect(page.locator('#work-test-select')).toBeEnabled();
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);
  await expect(page.locator('#work-test-select')).toContainText(candidateLabel);
  await expect(page.getByRole('button', { name: 'Avaa WORK_TEST' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Palaa CURRENTiin' })).toBeHidden();

  await page.getByRole('button', { name: 'Avaa WORK_TEST' }).click();

  await expect(page.getByRole('status')).toHaveText('WORK_TEST-malli ladattu - D-pohjat käytettävissä');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(page.locator('#private-model-canvas')).toHaveAttribute('data-model-source', 'work-test');
  await expect(page.getByRole('button', { name: 'Palaa CURRENTiin' })).toBeVisible();
  expect(currentLoads).toBe(1);
  expect(candidateLoads).toBe(1);

  await page.getByRole('button', { name: 'Palaa CURRENTiin' }).click();

  await expect(page.getByRole('status')).toHaveText('Malli ladattu - D-pohjat käytettävissä');
  await expect(page.locator('#model-source-badge')).toHaveText('CURRENT');
  await expect(page.locator('#private-model-canvas')).toHaveAttribute('data-model-source', 'current');
  await expect(page.getByRole('button', { name: 'Palaa CURRENTiin' })).toBeHidden();
  expect(currentLoads).toBe(2);
  expect(candidateLoads).toBe(1);
});

test('private viewer opens p139N in the guarded SITE_PLAN_OVERLAY scene with routes default-off', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      {
        name: 'P139N PHYSICAL CONTEXT - UNRESOLVED Z ROUTES EXCLUDED - BABYLON Y-UP',
        nodes: [0],
      },
      {
        name: 'P139N SITE_PLAN_OVERLAY - Z UNKNOWN - PLAN ONLY - NOT AS-BUILT',
        nodes: [1],
      },
    ],
    nodes: [
      { name: 'PHYSICAL_ROOT' },
      { name: 'PLAN_ROOT', children: [2, 3, 4] },
      {
        name: 'P139H_LAYER_LOCUS_PARCEL_ROUTES',
        extras: { presentationLayer: 'LOCUS_PARCEL_ROUTES' },
        children: [5, 6],
      },
      {
        name: 'P139H_LAYER_KVV_1974_SITE_ROUTES',
        extras: { presentationLayer: 'KVV_1974_SITE_ROUTES' },
        children: [7, 8],
      },
      {
        name: 'P139H_LAYER_KVV_2017_A1F_WATER',
        extras: { presentationLayer: 'KVV_2017_A1F_WATER' },
        children: [9],
      },
      { name: 'LOCUS_WATER', extras: { presentationSubgroup: 'WATER' } },
      { name: 'LOCUS_WASTEWATER', extras: { presentationSubgroup: 'WASTEWATER' } },
      { name: 'KVV1974_WATER', extras: { presentationSubgroup: 'WATER' } },
      { name: 'KVV1974_WASTEWATER', extras: { presentationSubgroup: 'WASTEWATER' } },
      { name: 'KVV2017_WATER', extras: { presentationSubgroup: 'WATER' } },
    ],
  });
  const candidateId = 'p139n-federated-kvv-review';
  const candidateLabel = 'p139N federated KVV review - PLAN ONLY';
  const candidatePath = '/private-model/work-test/p139n-federated-kvv-review.glb';

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
        candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }],
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

  await page.goto('/private-model/');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);
  await page.getByRole('button', { name: 'Avaa WORK_TEST' }).click();

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'site-plan-only');
  await expect(canvas).toHaveAttribute('data-view-preset', 'top');
  await expect(canvas).toHaveAttribute('data-camera-projection', 'orthographic');
  await expect(page.getByRole('status')).toHaveText(
    'SITE ORTHO / PLAN ONLY - Z UNKNOWN / NOT AS-BUILT',
  );
  await expect(canvas).toHaveAttribute('data-locus-layer-count', '5');
  await expect(canvas).toHaveAttribute('data-locus-water-count', '3');
  await expect(canvas).toHaveAttribute('data-locus-wastewater-count', '2');
  await expect(canvas).toHaveAttribute('data-locus-layer-visible', 'false');

  await page.getByRole('button', { name: 'Layerit' }).click();
  await expect(page.getByText('Kunnallistekniikka / KVV-reitit (WORK_TEST)')).toBeVisible();
  const routes = page.locator('#locus-layer-visible');
  await expect(routes).toBeEnabled();
  await routes.check();
  await expect(canvas).toHaveAttribute('data-locus-layer-visible', 'true');
});

test('private viewer opens p139AB as a Z-only orthographic wastewater review', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      {
        name: 'P139E WATER + WASTEWATER CONNECTION ZONE REVIEW ON P139C - BABYLON Y-UP',
        nodes: [],
      },
      {
        name: 'P139AB Z CREDIBILITY REVIEW - SOURCE Z / DATUM UNVERIFIED - NOT AS-BUILT',
        nodes: [],
      },
    ],
    nodes: [],
  });
  const candidateId = 'p139ab-z-credible-wastewater-review';
  const candidateLabel = 'p139AB Z-uskottavuus - jätevesi';
  const candidatePath = '/private-model/work-test/p139ab-z-credible-wastewater-review.glb';

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
        candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }],
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

  await page.goto('/private-model/');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);
  await page.getByRole('button', { name: 'Avaa WORK_TEST' }).click();

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'z-credibility-only');
  await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
  await expect(canvas).toHaveAttribute('data-camera-projection', 'orthographic');
  await expect(page.getByRole('status')).toHaveText(
    'Z-KATSELU - vain lähteistetyt jätevesikorkeudet - datum sitomatta / ei as-built',
  );

  await page.getByRole('button', { name: 'Layerit' }).click();
  await expect(page.getByText('Z-review: vain Z-lähteistetty jätevesi')).toBeVisible();
  await expect(page.locator('#locus-layer-visible')).toBeDisabled();
});

test('private viewer composes p139AC ground and Z-backed underground infra review on p139AB', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      {
        name: 'P139E WATER + WASTEWATER CONNECTION ZONE REVIEW ON P139C - BABYLON Y-UP',
        nodes: [],
      },
      {
        name: 'P139AB Z CREDIBILITY REVIEW - SOURCE Z / DATUM UNVERIFIED - NOT AS-BUILT',
        nodes: [],
      },
    ],
    nodes: [],
  });
  const candidateId = 'p139ab-z-credible-wastewater-review';
  const candidateLabel = 'p139AB Z-uskottavuus - jätevesi';
  const candidatePath = '/private-model/work-test/p139ab-z-credible-wastewater-review.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }],
      }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p139ac-ground-infra-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);
  await page.getByRole('button', { name: 'Avaa WORK_TEST' }).click();

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'ground-infra-review');
  await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
  await expect(canvas).toHaveAttribute('data-camera-projection', 'orthographic');
  await expect(page.getByRole('status')).toHaveText(
    'MAANPINTA + INFRA - alin maanpinta +18,30 - vain Z-lähteistetty maanalainen infra - ei as-built',
  );

  await page.getByRole('button', { name: 'Layerit' }).click();
  await expect(page.getByText('Maanpinta + Z-lähteistetty maanalainen infra')).toBeVisible();
  await expect(page.locator('#locus-layer-visible')).toBeDisabled();
});

test('private viewer composes p139AD Locus assumed-Z routes below the ground hard ceiling', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      {
        name: 'P139E WATER + WASTEWATER CONNECTION ZONE REVIEW ON P139C - BABYLON Y-UP',
        nodes: [],
      },
      {
        name: 'P139AB Z CREDIBILITY REVIEW - SOURCE Z / DATUM UNVERIFIED - NOT AS-BUILT',
        nodes: [],
      },
    ],
    nodes: [],
  });
  const candidateId = 'p139ab-z-credible-wastewater-review';
  const candidateLabel = 'p139AB Z-uskottavuus - jätevesi';
  const candidatePath = '/private-model/work-test/p139ab-z-credible-wastewater-review.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }],
      }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p139ad-locus-work-z-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);
  await page.getByRole('button', { name: 'Avaa WORK_TEST' }).click();

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'locus-work-z-review');
  await expect(canvas).toHaveAttribute('data-locus-work-z-route-count', '4');
  await expect(canvas).toHaveAttribute('data-locus-work-z-max-elevation', '18.150');
  await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
  await expect(canvas).toHaveAttribute('data-camera-projection', 'orthographic');
  await expect(page.getByRole('status')).toHaveText(
    'LOCUS WORK-Z - 4 reittiä oletuskoroilla - max +18,15 < maanpintaraja +18,30 - ei as-built',
  );

  await page.getByRole('button', { name: 'Layerit' }).click();
  await expect(page.getByText('Locus work-Z + maanpinta + source-Z referenssi')).toBeVisible();
  await expect(page.locator('#locus-layer-visible')).toBeDisabled();
});

test('private viewer imports an exact WORK_TEST candidate from a protected fragment link without a file picker', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'P133D REVIEW ROOT - BABYLON Y-UP', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      { name: 'P136B REVIEW ROOT - BABYLON Y-UP', nodes: [] },
      { name: 'D CURRENT INTERIOR - BABYLON Y-UP', nodes: [] },
    ],
    nodes: [],
  });
  const candidateId = 'p136b-d-current-wall-corrected';
  const candidateLabel = 'p136B - D current wall corrected';
  const candidatePath = '/private-model/work-test/p136b-d-current-wall-corrected.glb';
  const sourceUrl =
    'https://sdmntprdenmarkeast.oaiusercontent.com/files/abc123/raw?se=2026-09-29T13%3A00%3A00Z&sig=signature';
  let importRequests = 0;
  let candidateLoads = 0;

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: currentModel,
    });
  });
  await page.route('**/private-model/work-test/import.json', async (route) => {
    importRequests += 1;
    expect(route.request().method()).toBe('POST');
    expect(route.request().postDataJSON()).toEqual({ candidateId, sourceUrl });
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidate: { id: candidateId, label: candidateLabel, path: candidatePath },
        ready: true,
        seeded: true,
      }),
    });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }],
      }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    candidateLoads += 1;
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: candidateModel,
    });
  });

  const fragment = new URLSearchParams({
    workTestCandidate: candidateId,
    workTestImport: sourceUrl,
  }).toString();
  await page.goto(`/private-model/#${fragment}`);

  await expect(page.locator('#private-model-canvas')).toHaveAttribute('data-work-test-import', 'ready');
  await expect(page.locator('#private-model-canvas')).toHaveAttribute('data-model-source', 'work-test');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(page.getByRole('status')).toHaveText('WORK_TEST-malli ladattu - D-pohjat käytettävissä');
  await expect(page.locator('#work-test-file-input')).toHaveCount(0);
  await expect(page).not.toHaveURL(/workTestImport=/);
  expect(importRequests).toBe(1);
  expect(candidateLoads).toBe(1);
});

test('private viewer fails safe when the protected WORK_TEST catalog is unavailable', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'P133D REVIEW ROOT - BABYLON Y-UP', nodes: [] }],
    nodes: [],
  });

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: currentModel,
    });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: '{}',
    });
  });

  await page.goto('/private-model/');

  await expect(page.getByRole('status')).toHaveText('Malli ladattu');
  await expect(page.locator('#model-source-badge')).toHaveText('CURRENT');
  await expect(page.locator('#private-model-canvas')).toHaveAttribute('data-model-source', 'current');
  await expect(page.locator('#private-model-canvas')).toHaveAttribute(
    'data-work-test-catalog',
    'unavailable',
  );
  await expect(page.locator('#work-test-select')).toBeDisabled();
  await expect(page.locator('#work-test-select')).toContainText('Ei WORK_TEST-kandidaatteja');
  await expect(page.getByRole('button', { name: 'Avaa WORK_TEST' })).toBeDisabled();
});

