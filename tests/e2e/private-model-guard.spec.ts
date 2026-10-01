import { expect, test, type Page } from '@playwright/test';

import {
  handlePrivateModelRequest,
  isPrivateModelPath,
  type PrivateModelEnv,
} from '../../worker/privateModel';
import {
  getRequestedReviewCandidateId,
  isWorkTestCandidate,
} from '../../src/scripts/privateModelWorkTest';
import {
  formatSelectionMetadataKey,
  scalarSelectionMetadataValue,
  selectionMetadataEntries,
} from '../../src/scripts/privateModelSelectionMetadata';
import {
  isObjectVisibilityRenderable,
  nearestNamedAncestor,
  sceneNameForObject,
  selectionKindLabel,
} from '../../src/scripts/privateModelSelectionIdentity';

test('private viewer WORK_TEST routing module preserves review aliases and candidate validation', () => {
  const expectedRoutes = {
    'p153c-d-stair-review': 'p153c-d-stair-guard-lowwall',
    'p154c-d-wall-cutouts-review': 'p154c-d-wall-cutouts',
    'p161-multisource-systems-review': 'p161-multisource-systems-carrier',
    'p159-whole-building-storage-context-review': 'p159-whole-building-storage-context',
    'p160-d-composite-architecture-review': 'p160-d-composite-architecture',
    'p156i-2017-kvv-main-review': 'p156i-2017-kvv-main-presentation',
    'p150fr-whole-building-substructure-review': 'p150fr-whole-building-substructure',
    'p150g-whole-building-end-plinth-review': 'p150g-whole-building-end-plinth',
    'p151c-whole-building-review': 'p151c-whole-building-carrier',
    'p155cb-d-storage-roof-review': 'p155cb-d-storage-roof',
    'p145b-1974-iv-section-worktargets-review': 'p145b-1974-iv-section-worktargets',
    'p144c-g3-1974-iv-review': 'p144c-g3-1974-iv-on-p143h',
    'p143j-scalgo-label-flow-review': 'p143j-scalgo-label-flow',
    'p143h-scalgo-label-axis-review': 'p143h-scalgo-label-axis',
    'p143g-scalgo-cartography-review': 'p143g-scalgo-cartography',
    'p143f-scalgo-contours-review': 'p143f-scalgo-contours',
    'p143a-scalgo-terrain-review': 'p143a-scalgo-terrain',
    'p143d-scalgo-infra-review': 'p143a-scalgo-terrain',
    'p139ac-ground-infra-review': 'p139ab-z-credible-wastewater-review',
    'p139ad-locus-work-z-review': 'p139ab-z-credible-wastewater-review',
  } as const;

  for (const [reviewId, candidateId] of Object.entries(expectedRoutes)) {
    expect(getRequestedReviewCandidateId(`?review=${reviewId}`)).toBe(candidateId);
  }

  expect(getRequestedReviewCandidateId('?review=unknown-review')).toBeNull();
  expect(getRequestedReviewCandidateId('')).toBeNull();

  expect(
    isWorkTestCandidate({
      id: 'p149g-valid-candidate',
      label: 'P149G valid candidate',
      path: '/private-model/work-test/p149g-valid-candidate.glb',
    }),
  ).toBe(true);
  expect(
    isWorkTestCandidate({
      id: 'p149g-valid-candidate',
      label: 'P149G invalid path',
      path: '/private-model/model.glb',
    }),
  ).toBe(false);
});

test('private viewer selection identity helper preserves object and scene semantics', () => {
  const root: any = { name: 'MODEL_ROOT', parent: null };
  const fallback: any = { name: 'FALLBACK_SCENE', isScene: true, parent: root };
  const scene: any = { name: 'VISIBLE_SCENE_NAME', isScene: true, parent: root };
  const group: any = { name: 'GROUP_A', parent: scene };
  const mesh: any = { name: 'MESH_A', isMesh: true, type: 'Mesh', parent: group };
  const unnamedGroup: any = { name: '', parent: scene };
  const line: any = { isLine: true, type: 'Line', parent: unnamedGroup };
  const segments: any = { isLineSegments: true, type: 'LineSegments', parent: root };
  const custom: any = { type: 'Points', parent: root };

  const names = new WeakMap<object, string>();
  names.set(scene, 'SOURCE_SCENE_NAME');
  names.set(fallback, 'SOURCE_FALLBACK_NAME');

  expect(nearestNamedAncestor(mesh, root)).toBe('GROUP_A');
  expect(nearestNamedAncestor(line, root)).toBe('VISIBLE_SCENE_NAME');
  expect(nearestNamedAncestor({ parent: root }, root)).toBe('');

  expect(sceneNameForObject(mesh, root, names, fallback)).toBe('SOURCE_SCENE_NAME');
  expect(sceneNameForObject(custom, root, names, fallback)).toBe('SOURCE_FALLBACK_NAME');
  expect(sceneNameForObject(custom, root, new WeakMap<object, string>(), fallback)).toBe(
    'FALLBACK_SCENE',
  );
  expect(sceneNameForObject(custom, root, names, null)).toBe('');

  expect(selectionKindLabel(mesh)).toBe('Mesh');
  expect(selectionKindLabel(segments)).toBe('LineSegments');
  expect(selectionKindLabel(line)).toBe('Line');
  expect(selectionKindLabel(custom)).toBe('Points');
  expect(selectionKindLabel({})).toBe('-');

  expect(isObjectVisibilityRenderable(mesh)).toBe(true);
  expect(isObjectVisibilityRenderable(line)).toBe(true);
  expect(isObjectVisibilityRenderable(segments)).toBe(true);
  expect(isObjectVisibilityRenderable(custom)).toBe(false);
  expect(isObjectVisibilityRenderable(null)).toBe(false);
});

test('private viewer selection metadata helper preserves bounded scalar priority semantics', () => {
  const stopAt = { userData: { shouldNotRender: 'stop-root' }, parent: null };
  const parent = {
    userData: {
      Pass: 'PARENT_PASS',
      representationKind: 'wallSolid',
      Canonical: false,
      humanReview: 'NOT_RUN',
      inherited: ' parent value ',
      nested: { ignored: true },
      longValue: 'x'.repeat(181),
    },
    parent: stopAt,
  };
  const child = {
    userData: {
      Pass: 'CHILD_PASS',
      geometryType: 'mesh',
      PresentationOnly: true,
      current: false,
      finite: 2.5,
      notFinite: Number.POSITIVE_INFINITY,
      blank: '   ',
    },
    parent,
  };

  expect(selectionMetadataEntries(child, stopAt)).toEqual([
    ['Pass', 'CHILD_PASS'],
    ['representationKind', 'wallSolid'],
    ['geometryType', 'mesh'],
    ['PresentationOnly', 'true'],
    ['Canonical', 'false'],
    ['current', 'false'],
    ['humanReview', 'NOT_RUN'],
    ['finite', '2.5'],
    ['inherited', 'parent value'],
  ]);
  expect(formatSelectionMetadataKey('representationKind')).toBe('Representation Kind');
  expect(formatSelectionMetadataKey('source_role-test')).toBe('Source role test');
  expect(scalarSelectionMetadataValue(false)).toBe('false');
  expect(scalarSelectionMetadataValue({ nested: true })).toBeNull();
  expect(scalarSelectionMetadataValue('x'.repeat(181))).toBeNull();

  let chain: any = { userData: { depth0: 'value0' }, parent: stopAt };
  for (let index = 1; index < 10; index += 1) {
    chain = { userData: { [`depth${index}`]: `value${index}` }, parent: chain };
  }
  const bounded = selectionMetadataEntries(chain, stopAt);
  expect(bounded).toHaveLength(8);
  expect(bounded.some(([key]) => key === 'depth1')).toBe(false);
  expect(bounded.some(([key]) => key === 'depth2')).toBe(true);

  const many = {
    userData: Object.fromEntries(
      Array.from({ length: 24 }, (_, index) => [`field${String(index).padStart(2, '0')}`, index]),
    ),
    parent: stopAt,
  };
  expect(selectionMetadataEntries(many, stopAt)).toHaveLength(12);
});

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


const makeP143dTerrainGlb = () => {
  const positions = Buffer.alloc(48);
  [
    0, 0, -80,
    80, 0, -80,
    0, 0, 80,
    80, 0, 80,
  ].forEach((value, index) => {
    positions.writeFloatLE(value, index * 4);
  });

  const indices = Buffer.alloc(12);
  [0, 2, 1, 1, 2, 3].forEach((value, index) => {
    indices.writeUInt16LE(value, index * 2);
  });

  const binary = Buffer.concat([positions, indices]);
  const json = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      {
        name: 'P143A SCALGO CURRENT TERRAIN + P142A ARCHITECTURE - BABYLON Y-UP',
        nodes: [0],
      },
    ],
    nodes: [
      {
        name: 'P143A_SCALGO_CURRENT_TERRAIN_WORKTEST_NODE',
        mesh: 0,
        extras: {
          PresentationOnly: true,
          Canonical: false,
          ModelStage: 'WORK_TEST_VIEW',
          Pass: '143A',
          geometryType: 'terrainReferenceSurface',
          representationKind: 'currentTerrainReference',
          workVerticalOffsetM: 21.75,
          verticalBridgeStatus: 'WORK_OFFSET_UNVERIFIED',
        },
      },
    ],
    meshes: [
      {
        name: 'P143A_TEST_TERRAIN_MESH',
        primitives: [
          {
            attributes: { POSITION: 0 },
            indices: 1,
          },
        ],
      },
    ],
    buffers: [{ byteLength: binary.length }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: positions.length, target: 34962 },
      {
        buffer: 0,
        byteOffset: positions.length,
        byteLength: indices.length,
        target: 34963,
      },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 4,
        type: 'VEC3',
        min: [0, 0, -80],
        max: [80, 0, 80],
      },
      {
        bufferView: 1,
        componentType: 5123,
        count: 6,
        type: 'SCALAR',
        min: [0],
        max: [3],
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


const makeP139abReviewGlb = () => {
  const architecturePositions = Buffer.alloc(36);
  [-1, 0, -1, 1, 0, -1, 0, 2, 1].forEach((value, index) => {
    architecturePositions.writeFloatLE(value, index * 4);
  });

  const routePositions = Buffer.alloc(24);
  [-1, -0.5, 0, 1, -0.5, 0].forEach((value, index) => {
    routePositions.writeFloatLE(value, index * 4);
  });

  const binary = Buffer.concat([architecturePositions, routePositions]);
  const json = {
    asset: { version: '2.0' },
    scene: 2,
    scenes: [
      {
        name: 'P139E WATER + WASTEWATER CONNECTION ZONE REVIEW ON P139C - BABYLON Y-UP',
        nodes: [0],
      },
      {
        name: 'P139H TEST SHARED ARCHITECTURE OWNER - BABYLON Y-UP',
        nodes: [2],
      },
      {
        name: 'P139AB Z CREDIBILITY REVIEW - SOURCE Z / DATUM UNVERIFIED - NOT AS-BUILT',
        nodes: [3],
      },
    ],
    nodes: [
      { name: 'P139E_TEST_ROOT', children: [1] },
      {
        name: 'P139AB_TEST_ARCH_BUILDING',
        mesh: 0,
        extras: { presentationGroup: 'ARCH_BASE' },
      },
      { name: 'P139H_TEST_ROOT', children: [1] },
      {
        name: 'P139AB_TEST_ROOT',
        children: [4],
        extras: { reviewScope: 'Z_CREDIBILITY_ONLY', buildingContext: true },
      },
      {
        name: 'P139AB_TEST_Z_ROUTE',
        mesh: 1,
        extras: { presentationLayer: 'Z_CREDIBLE_WASTEWATER_REVIEW' },
      },
    ],
    meshes: [
      {
        name: 'P139AB_TEST_ARCH_MESH',
        primitives: [{ attributes: { POSITION: 0 } }],
      },
      {
        name: 'P139AB_TEST_Z_ROUTE_MESH',
        primitives: [{ attributes: { POSITION: 1 }, mode: 3 }],
      },
    ],
    buffers: [{ byteLength: binary.length }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: architecturePositions.length, target: 34962 },
      {
        buffer: 0,
        byteOffset: architecturePositions.length,
        byteLength: routePositions.length,
        target: 34962,
      },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 3,
        type: 'VEC3',
        min: [-1, 0, -1],
        max: [1, 2, 1],
      },
      {
        bufferView: 1,
        componentType: 5126,
        count: 2,
        type: 'VEC3',
        min: [-1, -0.5, 0],
        max: [1, -0.5, 0],
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



const makeAdjacentTrianglesWithLinesGlb = () => {
  const triangleA = Buffer.alloc(36);
  [0, 0, 0, 1, 0, 0, 0, 1, 0].forEach((value, index) => {
    triangleA.writeFloatLE(value, index * 4);
  });
  const triangleB = Buffer.alloc(36);
  [1, 0, 0, 1, 1, 0, 0, 1, 0].forEach((value, index) => {
    triangleB.writeFloatLE(value, index * 4);
  });
  const legacyLine = Buffer.alloc(24);
  [0.2, 0.2, 0, 0.8, 0.8, 0].forEach((value, index) => {
    legacyLine.writeFloatLE(value, index * 4);
  });
  const semanticLine = Buffer.alloc(24);
  [0, 0.5, 0, 1, 0.5, 0].forEach((value, index) => {
    semanticLine.writeFloatLE(value, index * 4);
  });

  const binary = Buffer.concat([triangleA, triangleB, legacyLine, semanticLine]);
  const offsets = [
    0,
    triangleA.length,
    triangleA.length + triangleB.length,
    triangleA.length + triangleB.length + legacyLine.length,
  ];
  const json = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'P146A EDGE MODE TEST - BABYLON Y-UP', nodes: [0, 1, 2, 3] }],
    nodes: [
      { name: 'ARCH_TRIANGLE_A', mesh: 0 },
      { name: 'ARCH_TRIANGLE_B', mesh: 1 },
      { name: 'LEGACY_UNTYPED_GRAY_LINE', mesh: 2 },
      {
        name: 'SEMANTIC_ANNOTATION_LINE',
        mesh: 3,
        extras: { presentationLayer: 'TECHNICAL_ANNOTATION' },
      },
    ],
    meshes: [
      { primitives: [{ attributes: { POSITION: 0 } }] },
      { primitives: [{ attributes: { POSITION: 1 } }] },
      { primitives: [{ attributes: { POSITION: 2 }, mode: 1 }] },
      { primitives: [{ attributes: { POSITION: 3 }, mode: 1 }] },
    ],
    buffers: [{ byteLength: binary.length }],
    bufferViews: [
      { buffer: 0, byteOffset: offsets[0], byteLength: triangleA.length, target: 34962 },
      { buffer: 0, byteOffset: offsets[1], byteLength: triangleB.length, target: 34962 },
      { buffer: 0, byteOffset: offsets[2], byteLength: legacyLine.length, target: 34962 },
      { buffer: 0, byteOffset: offsets[3], byteLength: semanticLine.length, target: 34962 },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 3,
        type: 'VEC3',
        min: [0, 0, 0],
        max: [1, 1, 0],
      },
      {
        bufferView: 1,
        componentType: 5126,
        count: 3,
        type: 'VEC3',
        min: [0, 0, 0],
        max: [1, 1, 0],
      },
      {
        bufferView: 2,
        componentType: 5126,
        count: 2,
        type: 'VEC3',
        min: [0.2, 0.2, 0],
        max: [0.8, 0.8, 0],
      },
      {
        bufferView: 3,
        componentType: 5126,
        count: 2,
        type: 'VEC3',
        min: [0, 0.5, 0],
        max: [1, 0.5, 0],
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

const openToolbarMenu = async (page: Page, selector: '#view-menu' | '#model-menu' | '#more-menu') => {
  const menu = page.locator(selector);
  if ((await menu.getAttribute('open')) === null) {
    await menu.locator(':scope > summary').click();
  }
};

const clickViewAction = async (page: Page, name: string) => {
  await openToolbarMenu(page, '#view-menu');
  await page.getByRole('button', { name, exact: true }).click();
};

const clickModelAction = async (page: Page, name: string) => {
  await openToolbarMenu(page, '#model-menu');
  await page.getByRole('button', { name, exact: true }).click();
};

const clickMoreAction = async (page: Page, name: string) => {
  await openToolbarMenu(page, '#more-menu');
  await page.getByRole('button', { name, exact: true }).click();
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

test('private viewer view menu stays inside a short viewport and keeps every preset reachable', async ({ page }) => {
  const model = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });

  await page.setViewportSize({ width: 1536, height: 768 });
  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: model,
    });
  });

  await page.goto('/private-model/');
  await openToolbarMenu(page, '#view-menu');

  const panel = page.locator('#view-menu > .toolbar-menu-panel');
  await expect(panel).toBeVisible();
  const box = await panel.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  expect(box.y + box.height).toBeLessThanOrEqual(758);

  const finalPreset = page.getByRole('button', { name: 'Julk -X', exact: true });
  await finalPreset.scrollIntoViewIfNeeded();
  await expect(finalPreset).toBeVisible();
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

  await expect(page.locator('#view-menu > summary')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Layerit' })).toBeVisible();
  await expect(page.locator('#model-source-badge')).toBeVisible();
  await expect(page.locator('#more-menu > summary')).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Malli ladattu - D-pohjat käytettävissä');
});



test('private viewer selects a visible mesh, shows bounded identity, metadata, and ignores orbit drags', async ({ page }) => {
  const model = makeTriangleGlb({
    Pass: '149E_TEST',
    representationKind: 'wallSolid',
    Canonical: false,
    humanReview: 'NOT_RUN',
    nestedIgnored: { shouldNotRender: true },
  });

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
  await expect(page.locator('#selection-kind')).toHaveText('Mesh');
  const metadataDetails = page.locator('#selection-panel details.selection-metadata');
  await expect(metadataDetails).not.toHaveAttribute('open', '');
  await metadataDetails.locator('summary').click();
  await expect(metadataDetails).toHaveAttribute('open', '');
  await expect(page.locator('#selection-metadata-list')).toContainText('Pass');
  await expect(page.locator('#selection-metadata-list')).toContainText('149E_TEST');
  await expect(page.locator('#selection-metadata-list')).toContainText('Representation Kind');
  await expect(page.locator('#selection-metadata-list')).toContainText('wallSolid');
  await expect(page.locator('#selection-metadata-list')).toContainText('Canonical');
  await expect(page.locator('#selection-metadata-list')).toContainText('false');
  await expect(page.locator('#selection-metadata-list')).toContainText('Human Review');
  await expect(page.locator('#selection-metadata-list')).toContainText('NOT_RUN');
  await expect(page.locator('#selection-metadata-list')).not.toContainText('shouldNotRender');
  const metadataCount = Number(await canvas.getAttribute('data-selection-metadata-count'));
  expect(metadataCount).toBeGreaterThanOrEqual(4);
  await expect(canvas).toHaveAttribute('data-selection-metadata-source', 'userData');

  await page.getByRole('button', { name: 'Tyhjennä' }).click();
  await expect(panel).toBeHidden();

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2 + 40);
  await page.mouse.up();
  await expect(panel).toBeHidden();
});



test('private viewer can isolate, hide, and restore a selected object without changing model data', async ({ page }) => {
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
  const showAll = page.locator('#show-all-objects-button');
  await expect(canvas).toHaveAttribute('data-object-visibility-filter', 'inactive');
  await expect(showAll).toBeDisabled();

  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  await expect(panel).toBeVisible();

  await page.getByRole('button', { name: 'Isoloi' }).click();
  await expect(canvas).toHaveAttribute('data-object-visibility-filter', 'active');
  await expect(canvas).toHaveAttribute('data-object-visibility-mode', 'isolate');
  await expect(showAll).toBeEnabled();
  await expect(panel).toBeVisible();

  await page.getByRole('button', { name: 'Piilota' }).click();
  await expect(canvas).toHaveAttribute('data-object-visibility-mode', 'hide');
  await expect(panel).toBeHidden();

  await page.locator('#more-menu > summary').click();
  await showAll.click();
  await expect(canvas).toHaveAttribute('data-object-visibility-filter', 'inactive');
  await expect(showAll).toBeDisabled();

  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  await expect(panel).toBeVisible();
});


test('private viewer can enable, adjust, and disable the presentation-only horizontal clipping plane', async ({ page }) => {
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
  const toggle = page.locator('#clip-plane-enabled');
  const height = page.locator('#clip-plane-height');
  const value = page.locator('#clip-plane-value');

  await expect(canvas).toHaveAttribute('data-model-source', 'current');
  await expect(canvas).toHaveAttribute('data-horizontal-clip', 'inactive');

  await page.locator('#more-menu > summary').click();
  await expect(toggle).toBeEnabled();
  await expect(height).toBeDisabled();

  const min = Number(await height.getAttribute('min'));
  const max = Number(await height.getAttribute('max'));
  expect(Number.isFinite(min)).toBe(true);
  expect(Number.isFinite(max)).toBe(true);
  expect(max).toBeGreaterThan(min);

  await toggle.check();
  await expect(height).toBeEnabled();
  await expect(canvas).toHaveAttribute('data-horizontal-clip', 'active');
  await expect(canvas).toHaveAttribute('data-horizontal-clip-side', 'above');

  const requested = min + (max - min) * 0.5;
  await height.evaluate((element, nextValue) => {
    const input = element as HTMLInputElement;
    input.value = String(nextValue);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, requested);

  const applied = Number(await canvas.getAttribute('data-horizontal-clip-height-m'));
  expect(Math.abs(applied - requested)).toBeLessThan(0.01);
  await expect(value).toContainText('m');

  await toggle.uncheck();
  await expect(height).toBeDisabled();
  await expect(canvas).toHaveAttribute('data-horizontal-clip', 'inactive');
  await expect(canvas).not.toHaveAttribute('data-horizontal-clip-height-m', /.+/);
  await expect(canvas).toHaveAttribute('data-model-source', 'current');
});


test('private viewer derives four edge modes from mesh geometry and preserves semantic lines', async ({ page }) => {
  const model = makeAdjacentTrianglesWithLinesGlb();

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
  await expect(canvas).toHaveAttribute('data-edge-mode', 'visible');
  await expect(canvas).toHaveAttribute('data-edge-source-mesh-count', '2');
  await expect(canvas).toHaveAttribute('data-edge-overlay-segment-count', '4');
  await expect(canvas).toHaveAttribute('data-edge-legacy-suppressed-count', '1');
  await expect(canvas).toHaveAttribute('data-edge-semantic-line-count', '1');
  await expect(canvas).toHaveAttribute('data-edge-depth-test', 'true');

  await page.getByRole('button', { name: 'Layerit' }).click();
  const edgeMode = page.locator('#edge-mode-select');

  await edgeMode.selectOption('object');
  await expect(canvas).toHaveAttribute('data-edge-mode', 'object');
  await expect(canvas).toHaveAttribute('data-edge-overlay-segment-count', '6');
  await expect(canvas).toHaveAttribute('data-edge-depth-test', 'false');

  await edgeMode.selectOption('unified');
  await expect(canvas).toHaveAttribute('data-edge-mode', 'unified');
  await expect(canvas).toHaveAttribute('data-edge-overlay-segment-count', '4');
  await expect(canvas).toHaveAttribute('data-edge-depth-test', 'false');

  await edgeMode.selectOption('none');
  await expect(canvas).toHaveAttribute('data-edge-mode', 'none');
  await expect(canvas).toHaveAttribute('data-edge-overlay-segment-count', '0');
  await expect(canvas).toHaveAttribute('data-edge-legacy-suppressed-count', '1');
  await expect(canvas).toHaveAttribute('data-edge-semantic-line-count', '1');
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
  await clickMoreAction(page, 'Sovita näkymään');
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

  await clickViewAction(page, 'Isometrinen');
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

  await clickViewAction(page, 'Isometrinen');
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

  await clickViewAction(page, 'Isometrinen');
  const visibleIsoCenter = Number(await canvas.getAttribute('data-iso-fit-center-x'));
  expect(visibleIsoCenter).toBeGreaterThan(10);

  await page.getByRole('button', { name: 'Layerit' }).click();
  await page.locator('#roof-layer-visible').uncheck();
  await clickMoreAction(page, 'Sovita näkymään');

  const hiddenFitCenter = Number(await canvas.getAttribute('data-fit-center-x'));
  const hiddenFitRadius = Number(await canvas.getAttribute('data-fit-radius'));
  expect(Math.abs(hiddenFitCenter)).toBeLessThan(0.01);
  expect(hiddenFitRadius).toBeLessThan(2);

  await clickViewAction(page, 'Isometrinen');
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
  await clickModelAction(page, 'Avaa WORK_TEST');

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-d-review-prepared', 'true');
  await expect(canvas).toHaveAttribute('data-d-review-door-marker-prepared-count', '11');

  await clickViewAction(page, 'D 1F');
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

  await clickViewAction(page, 'D 2F');
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

  await clickViewAction(page, 'Vapaa 3D');
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
  await clickModelAction(page, 'Avaa WORK_TEST');

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-d-review-door-marker-prepared-count', '13');
  await expect(canvas).toHaveAttribute('data-d1-user-door-label-count', '2');

  await clickViewAction(page, 'D 1F');
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

  await clickViewAction(page, 'D 2F');
  await expect(canvas).toHaveAttribute('data-d-review-door-marker-visible-count', '4');
  await expect(canvas).toHaveAttribute('data-d1-user-door-labels-visible', 'false');
  await expect(userDoorSection).toBeHidden();

  await clickViewAction(page, 'Vapaa 3D');
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
  await expect(page.locator('#work-test-button')).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Palaa CURRENTiin' })).toBeHidden();

  await clickModelAction(page, 'Avaa WORK_TEST');

  await expect(page.getByRole('status')).toHaveText('WORK_TEST-malli ladattu - D-pohjat käytettävissä');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(page.locator('#private-model-canvas')).toHaveAttribute('data-model-source', 'work-test');
  await openToolbarMenu(page, '#model-menu');
  await expect(page.getByRole('button', { name: 'Palaa CURRENTiin' })).toBeVisible();
  expect(currentLoads).toBe(1);
  expect(candidateLoads).toBe(1);

  await clickModelAction(page, 'Palaa CURRENTiin');

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
  await clickModelAction(page, 'Avaa WORK_TEST');

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
  const candidateModel = makeP139abReviewGlb();
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
  await clickModelAction(page, 'Avaa WORK_TEST');

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

test('private viewer autoloads the exact p143A SCALGO terrain review candidate', async ({ page }) => {
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
      { name: 'P143A SCALGO CURRENT TERRAIN + P142A ARCHITECTURE - BABYLON Y-UP', nodes: [] },
    ],
    nodes: [],
  });
  const candidateId = 'p143a-scalgo-terrain';
  const candidateLabel = 'p143A SCALGO terrain + architecture - WORK_TEST';
  const candidatePath = '/private-model/work-test/p143a-scalgo-terrain.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [
          {
            id: 'p136b-d-current-wall-corrected',
            label: 'p136B - D current wall corrected',
            path: '/private-model/work-test/p136b-d-current-wall-corrected.glb',
          },
          { id: candidateId, label: candidateLabel, path: candidatePath },
        ],
      }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p143a-scalgo-terrain-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'scalgo-terrain-review');
  await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
  await expect(page.getByRole('status')).toHaveText(
    'SCALGO MAASTO + RAKENNUS - WORK_TEST - pystykorkosilta oletus / ei as-built',
  );
});

test('private viewer autoloads the exact p143F SCALGO contour review candidate', async ({ page }) => {
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
        name: 'P143F SCALGO TERRAIN + 1M/0.1M CONTOURS + P142A ARCHITECTURE - BABYLON Y-UP',
        nodes: [],
      },
    ],
    nodes: [],
  });
  const candidateId = 'p143f-scalgo-contours';
  const candidateLabel = 'p143F SCALGO terrain + contours - WORK_TEST';
  const candidatePath = '/private-model/work-test/p143f-scalgo-contours.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [
          {
            id: 'p143a-scalgo-terrain',
            label: 'p143A SCALGO terrain + architecture - WORK_TEST',
            path: '/private-model/work-test/p143a-scalgo-terrain.glb',
          },
          { id: candidateId, label: candidateLabel, path: candidatePath },
        ],
      }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p143f-scalgo-contours-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'scalgo-contour-review');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-major-interval-m', '1.0');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-minor-interval-m', '0.1');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-source-grid-resolution-m', '1.0');
  await expect(canvas).toHaveAttribute('data-terrain-vertical-bridge-status', 'WORK_OFFSET_UNVERIFIED');
  await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
  await expect(page.getByRole('status')).toHaveText(
    'SCALGO MAASTO + KORKEUSKÄYRÄT - 1 m pää / 0,10 m väli - välikäyrät interpoloitu 1 m rasterista',
  );
});

test('private viewer autoloads the exact p143G SCALGO cartography review candidate', async ({ page }) => {
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
        name: 'P143G SCALGO SMOOTHED CARTOGRAPHY + P142A ARCHITECTURE - BABYLON Y-UP',
        nodes: [],
      },
    ],
    nodes: [],
  });
  const candidateId = 'p143g-scalgo-cartography';
  const candidateLabel = 'p143G SCALGO smoothed cartography - WORK_TEST';
  const candidatePath = '/private-model/work-test/p143g-scalgo-cartography.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [
          {
            id: 'p143f-scalgo-contours',
            label: 'p143F SCALGO terrain + contours - WORK_TEST',
            path: '/private-model/work-test/p143f-scalgo-contours.glb',
          },
          { id: candidateId, label: candidateLabel, path: candidatePath },
        ],
      }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p143g-scalgo-cartography-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'scalgo-cartography-review');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-major-interval-m', '1.0');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-half-interval-m', '0.5');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-minor-interval-m', '0.1');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-source-grid-resolution-m', '1.0');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-smoothing-sigma-px', '0.8');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-label-placement', 'high-side');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-flow-barbs', 'downhill');
  await expect(canvas).toHaveAttribute('data-terrain-vertical-bridge-status', 'WORK_OFFSET_UNVERIFIED');
  await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
  await expect(page.getByRole('status')).toHaveText(
    'SCALGO KARTOGRAFIA - 1 m pää / 0,5 m puolikäyrä / 0,10 m väli - silotettu esitys 1 m rasterista',
  );
});

test('private viewer autoloads the exact p143H SCALGO technical label-axis review candidate', async ({ page }) => {
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
        name: 'P143H SCALGO TECH LABELS + PAIRED GRADIENT BARBS + SMOOTHED CARTOGRAPHY + P142A ARCHITECTURE - BABYLON Y-UP',
        nodes: [],
      },
    ],
    nodes: [],
  });
  const candidateId = 'p143h-scalgo-label-axis';
  const candidateLabel = 'p143H SCALGO technical labels + paired barbs - WORK_TEST';
  const candidatePath = '/private-model/work-test/p143h-scalgo-label-axis.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [
          {
            id: 'p143g-scalgo-cartography',
            label: 'p143G SCALGO smoothed cartography - WORK_TEST',
            path: '/private-model/work-test/p143g-scalgo-cartography.glb',
          },
          { id: candidateId, label: candidateLabel, path: candidatePath },
        ],
      }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p143h-scalgo-label-axis-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'scalgo-label-axis-review');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-major-interval-m', '1.0');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-half-interval-m', '0.5');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-minor-interval-m', '0.1');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-source-grid-resolution-m', '1.0');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-smoothing-sigma-px', '0.8');
  await expect(canvas).toHaveAttribute('data-scalgo-label-font-style', 'technical-single-line-sans-v1');
  await expect(canvas).toHaveAttribute('data-scalgo-major-label-height-m', '0.36');
  await expect(canvas).toHaveAttribute('data-scalgo-half-label-height-m', '0.27');
  await expect(canvas).toHaveAttribute('data-scalgo-label-barb-axis', 'shared-local-gradient-axis');
  await expect(canvas).toHaveAttribute('data-scalgo-paired-barb-count', '14');
  await expect(canvas).toHaveAttribute('data-terrain-vertical-bridge-status', 'WORK_OFFSET_UNVERIFIED');
  await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
  await expect(page.getByRole('status')).toHaveText(
    'SCALGO KARTOGRAFIA - pienemmät technical korkoluvut - numero ja valumaväkänen samalla gradienttiakselilla',
  );
});

test('private viewer autoloads the exact p143J SCALGO building-bypass label-flow review candidate', async ({ page }) => {
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
        name: 'P143J SCALGO LABEL FLOW CORRIDORS + P142A ARCHITECTURE - BABYLON Y-UP',
        nodes: [],
      },
    ],
    nodes: [],
  });
  const candidateId = 'p143j-scalgo-label-flow';
  const candidateLabel = 'p143J SCALGO building-bypass label flow - WORK_TEST';
  const candidatePath = '/private-model/work-test/p143j-scalgo-label-flow.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [
          {
            id: 'p143h-scalgo-label-axis',
            label: 'p143H SCALGO technical labels + paired barbs - WORK_TEST',
            path: '/private-model/work-test/p143h-scalgo-label-axis.glb',
          },
          { id: candidateId, label: candidateLabel, path: candidatePath },
        ],
      }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p143j-scalgo-label-flow-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'scalgo-label-flow-review');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-major-interval-m', '1.0');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-half-interval-m', '0.5');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-minor-interval-m', '0.1');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-source-grid-resolution-m', '1.0');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-smoothing-sigma-px', '0.8');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-label-placement', 'building-bypass-flow-corridors');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-flow-barbs', 'downhill-paired');
  await expect(canvas).toHaveAttribute('data-scalgo-label-font-style', 'technical-single-line-sans-v1');
  await expect(canvas).toHaveAttribute('data-scalgo-major-label-height-m', '0.36');
  await expect(canvas).toHaveAttribute('data-scalgo-half-label-height-m', '0.27');
  await expect(canvas).toHaveAttribute('data-scalgo-label-barb-axis', 'shared-local-gradient-axis');
  await expect(canvas).toHaveAttribute('data-scalgo-paired-barb-count', '11');
  await expect(canvas).toHaveAttribute('data-scalgo-label-flow-corridor-count', '2');
  await expect(canvas).toHaveAttribute('data-scalgo-label-minimum-same-corridor-spacing-m', '3.0');
  await expect(canvas).toHaveAttribute('data-scalgo-label-building-exclusion', 'true');
  await expect(canvas).toHaveAttribute('data-scalgo-label-corridor-semantic-boundary', 'annotation-placement-only');
  await expect(canvas).toHaveAttribute('data-terrain-vertical-bridge-status', 'WORK_OFFSET_UNVERIFIED');
  await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
  await expect(page.getByRole('status')).toHaveText(
    'SCALGO KARTOGRAFIA - korkoluvut kahdella talon ohi kulkevalla sijoituskäytävällä - paired valumaväkäset',
  );
});

test('private viewer autoloads P144C G3 1974 IV anchors on the exact p143H cartography successor', async ({ page }) => {
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
        name: 'P144C G3 1974 IV P04 OVERLAY + P143H SCALGO TECH LABELS - BABYLON Y-UP',
        nodes: [],
      },
    ],
    nodes: [],
  });
  const candidateId = 'p144c-g3-1974-iv-on-p143h';
  const candidateLabel = 'P144C G3 1974 IV anchors + p143H cartography - WORK_TEST';
  const candidatePath = '/private-model/work-test/p144c-g3-1974-iv-on-p143h.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [
          {
            id: 'p143h-scalgo-label-axis',
            label: 'p143H SCALGO technical labels + paired barbs - WORK_TEST',
            path: '/private-model/work-test/p143h-scalgo-label-axis.glb',
          },
          { id: candidateId, label: candidateLabel, path: candidatePath },
        ],
      }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p144c-g3-1974-iv-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'p144c-g3-1974-iv-overlay-review');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-major-interval-m', '1.0');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-half-interval-m', '0.5');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-minor-interval-m', '0.1');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-source-grid-resolution-m', '1.0');
  await expect(canvas).toHaveAttribute('data-scalgo-contour-smoothing-sigma-px', '0.8');
  await expect(canvas).toHaveAttribute('data-scalgo-label-font-style', 'technical-single-line-sans-v1');
  await expect(canvas).toHaveAttribute('data-scalgo-major-label-height-m', '0.36');
  await expect(canvas).toHaveAttribute('data-scalgo-half-label-height-m', '0.27');
  await expect(canvas).toHaveAttribute('data-scalgo-label-barb-axis', 'shared-local-gradient-axis');
  await expect(canvas).toHaveAttribute('data-scalgo-paired-barb-count', '14');
  await expect(canvas).toHaveAttribute('data-g3-source-phase', '1974');
  await expect(canvas).toHaveAttribute('data-g3-overlay-primitive', 'POINTS');
  await expect(canvas).toHaveAttribute('data-g3-overlay-anchor-count', '32');
  await expect(canvas).toHaveAttribute('data-g3-section-anchor-count-excluded', '6');
  await expect(canvas).toHaveAttribute('data-g3-physical-z-claim', 'false');
  await expect(canvas).toHaveAttribute('data-g3-display-z-rule', 'federationHostZ+0.100m');
  await expect(canvas).toHaveAttribute('data-terrain-vertical-bridge-status', 'WORK_OFFSET_UNVERIFIED');
  await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
  await expect(page.getByRole('status')).toHaveText(
    'G3 1974 IV - 32 plan-ankkuria p143H-kartografian päällä - display-Z on katseluoffset, ei fyysinen IV-korko',
  );
});

test('private viewer autoloads the exact P145B 1974 IV section work-target review candidate', async ({ page }) => {
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
        name: 'P145B 1974 IV SECTION WORK TARGETS ON P144C - BABYLON Y-UP',
        nodes: [],
      },
    ],
    nodes: [],
  });
  const candidateId = 'p145b-1974-iv-section-worktargets';
  const candidateLabel = 'P145B 1974 IV section work-targets - WORK_TEST';
  const candidatePath = '/private-model/work-test/p145b-1974-iv-section-worktargets.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [
          {
            id: 'p144c-g3-1974-iv-on-p143h',
            label: 'P144C G3 1974 IV anchors + p143H cartography - WORK_TEST',
            path: '/private-model/work-test/p144c-g3-1974-iv-on-p143h.glb',
          },
          { id: candidateId, label: candidateLabel, path: candidatePath },
        ],
      }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p145b-1974-iv-section-worktargets-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute(
    'data-work-test-review-mode',
    'p145b-1974-iv-section-worktargets-review',
  );
  await expect(canvas).toHaveAttribute('data-g3-source-phase', '1974');
  await expect(canvas).toHaveAttribute('data-g3-overlay-primitive', 'SECTION_WORK_TARGETS');
  await expect(canvas).toHaveAttribute('data-g3-presentation-only', 'true');
  await expect(canvas).toHaveAttribute('data-g3-work-assumption', 'true');
  await expect(canvas).toHaveAttribute('data-g3-section-work-target-count', '12');
  await expect(canvas).toHaveAttribute(
    'data-g3-section-station-status',
    'WORK_ASSUMPTION_UNRESOLVED',
  );
  await expect(canvas).toHaveAttribute(
    'data-g3-section-plane-orientation-status',
    'WORK_ASSUMPTION_UNRESOLVED',
  );
  await expect(canvas).toHaveAttribute('data-g3-physical-z-claim', 'false');
  await expect(canvas).toHaveAttribute('data-g3-topology-link-claim', 'false');
  await expect(canvas).toHaveAttribute('data-g3-penetration-claim', 'false');
  await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
  await expect(page.getByRole('status')).toHaveText(
    'G3 1974 IV - 12 section work-targetia - WORK_TEST / presentation-only / workAssumption - station/orientation unresolved - ei fyysinen Z/penetration',
  );
});

test('private viewer autoloads the exact P155C-B D storage-roof review candidate', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'P155C-B D STORAGE ROOF PRESENTATION - BABYLON Y-UP', nodes: [] }],
    nodes: [],
  });
  const candidateId = 'p155cb-d-storage-roof';
  const candidateLabel = 'P155C-B D storage roof presentation - WORK_TEST';
  const candidatePath = '/private-model/work-test/p155cb-d-storage-roof.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }] }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p155cb-d-storage-roof-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'p155cb-d-storage-roof-review');
  await expect(canvas).toHaveAttribute('data-p155-presentation-only', 'true');
  await expect(canvas).toHaveAttribute('data-p155-current-relative-level', 'MATCH_1F_ROOF_ZONE');
  await expect(canvas).toHaveAttribute('data-p155-absolute-top-z-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p155-physical-roof-thickness-claim', 'false');
  await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
  await expect(page.getByRole('status')).toHaveText(
    'P155C-B D-varaston kattoreferenssi - WORK_TEST / presentation-only - ei fyysinen kattorakenne',
  );
});

test('private viewer autoloads the exact P151C whole-building review carrier', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'P151C WHOLE BUILDING MINIMUM REVIEW CARRIER - BABYLON Y-UP', nodes: [] }],
    nodes: [],
  });
  const candidateId = 'p151c-whole-building-carrier';
  const candidateLabel = 'P151C whole-building minimum review carrier - WORK_TEST';
  const candidatePath = '/private-model/work-test/p151c-whole-building-carrier.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }] }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p151c-whole-building-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'p151c-whole-building-review');
  await expect(canvas).toHaveAttribute('data-p151-target-coverage-count', '14');
  await expect(canvas).toHaveAttribute('data-p151-carrier-role', 'WHOLE_BUILDING_MINIMUM_REVIEW_CARRIER');
  await expect(canvas).toHaveAttribute(
    'data-p151-excluded-branches',
    'P158B,P153,P154C,NEW_G3_COMMON,P150_FOUNDATION',
  );
  await expect(canvas).toHaveAttribute('data-p151-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'whole-building');
  await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
  await expect(page.getByRole('status')).toHaveText(
    'P151C koko rakennus - WORK_TEST minimum review carrier - 14/14 locked scope - ei CURRENT/as-built',
  );
});



test('private viewer autoloads the exact P150F-R whole-building substructure review candidate', async ({ page }) => {
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
        name: 'P150F WHOLE-BUILDING MINIMUM REVIEW CARRIER + SUBSTRUCTURE WORK ENVELOPES - BABYLON Y-UP',
        nodes: [],
      },
    ],
    nodes: [],
  });
  const candidateId = 'p150fr-whole-building-substructure';
  const candidateLabel = 'P150F-R whole-building + substructure successor - WORK_TEST';
  const candidatePath = '/private-model/work-test/p150fr-whole-building-substructure.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }] }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p150fr-whole-building-substructure-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute(
    'data-work-test-review-mode',
    'p150fr-whole-building-substructure-review',
  );
  await expect(canvas).toHaveAttribute('data-p150fr-predecessor-candidate', 'p151c-whole-building-carrier');
  await expect(canvas).toHaveAttribute('data-p150fr-inherited-target-coverage-count', '14');
  await expect(canvas).toHaveAttribute('data-p150fr-substructure-target-count', '2');
  await expect(canvas).toHaveAttribute('data-p150fr-substructure-delta-pass', 'P150D');
  await expect(canvas).toHaveAttribute(
    'data-p150fr-substructure-target-ids',
    'G2_SUBSTRUCTURE_CD_STORAGE_WORK_001,G2_SUBSTRUCTURE_AB_WORK_001',
  );
  await expect(canvas).toHaveAttribute(
    'data-p150fr-scope',
    'P133H owner + P147D/P148D roof/guard delta + P150A cut-terrain + P150D substructure WORK_TEST envelopes',
  );
  await expect(canvas).toHaveAttribute('data-p150fr-excluded-branches', 'P158B,P153,P154C,NEW_G3_COMMON');
  await expect(canvas).toHaveAttribute('data-p150fr-work-depth-m', '0.600');
  await expect(canvas).toHaveAttribute('data-p150fr-depth-status', 'REFINABLE_WORK_ASSUMPTION');
  await expect(canvas).toHaveAttribute('data-p150fr-physical-foundation-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p150fr-physical-foundation-depth-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p150fr-current-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p150fr-as-built-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p150fr-canonical', 'false');
  await expect(canvas).toHaveAttribute('data-p150fr-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute('data-p150fr-metadata-repair-of-pass', 'P150F');
  await expect(canvas).toHaveAttribute('data-p150fr-presentation-truthfulness', 'PASS');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'whole-building');
  await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
  await expect(page.getByRole('status')).toHaveText(
    'P150F-R koko rakennus + alusrakennekuoret - WORK_TEST / 14/14 base + P150D targetit 2/2 - syvyys 0,600 m refinable - ei CURRENT/as-built',
  );
});

test('private viewer autoloads the exact P150G whole-building end-plinth review candidate', async ({ page }) => {
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
        name: 'P150G WHOLE-BUILDING + END-PLINTH HUMAN-REVIEW CORRECTION - BABYLON Y-UP',
        nodes: [],
      },
    ],
    nodes: [],
  });
  const candidateId = 'p150g-whole-building-end-plinth';
  const candidateLabel = 'P150G whole-building end-plinth correction - WORK_TEST';
  const candidatePath = '/private-model/work-test/p150g-whole-building-end-plinth.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }] }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p150g-whole-building-end-plinth-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute(
    'data-work-test-review-mode',
    'p150g-whole-building-end-plinth-review',
  );
  await expect(canvas).toHaveAttribute('data-p150g-predecessor-candidate', 'p150fr-whole-building-substructure');
  await expect(canvas).toHaveAttribute('data-p150g-inherited-target-coverage-count', '14');
  await expect(canvas).toHaveAttribute('data-p150g-p150d-target-count', '2');
  await expect(canvas).toHaveAttribute(
    'data-p150g-p150d-target-ids',
    'G2_SUBSTRUCTURE_CD_STORAGE_WORK_001,G2_SUBSTRUCTURE_AB_WORK_001',
  );
  await expect(canvas).toHaveAttribute('data-p150g-correction-target-count', '2');
  await expect(canvas).toHaveAttribute(
    'data-p150g-correction-target-ids',
    'G2_SUBSTRUCTURE_WEST_GABLE_WING_WORK_001,G2_SUBSTRUCTURE_EAST_GABLE_WING_WORK_001',
  );
  await expect(canvas).toHaveAttribute('data-p150g-correction-zone-count', '4');
  await expect(canvas).toHaveAttribute(
    'data-p150g-correction-basis',
    'USER_HUMAN_REVIEW_RELATION_PLUS_EXISTING_GABLE_GEOMETRY',
  );
  await expect(canvas).toHaveAttribute(
    'data-p150g-scope',
    'P133H owner + P147D/P148D roof/guard delta + P150G cut-terrain refinement + P150D substructure WORK_TEST envelopes + P150G end-plinth correction',
  );
  await expect(canvas).toHaveAttribute('data-p150g-excluded-branches', 'P158B,P153,P154C,NEW_G3_COMMON');
  await expect(canvas).toHaveAttribute('data-p150g-work-depth-m', '0.600');
  await expect(canvas).toHaveAttribute('data-p150g-depth-status', 'REFINABLE_WORK_ASSUMPTION');
  await expect(canvas).toHaveAttribute('data-p150g-presentation-only', 'true');
  await expect(canvas).toHaveAttribute('data-p150g-physical-foundation-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p150g-physical-foundation-depth-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p150g-physical-ground-surface-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p150g-current-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p150g-as-built-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p150g-canonical', 'false');
  await expect(canvas).toHaveAttribute('data-p150g-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute(
    'data-p150g-predecessor-human-review-feedback',
    'P150F-R_FEEDBACK_CAPTURED_CORRECTION_REQUIRED',
  );
  await expect(canvas).toHaveAttribute('data-p150g-active-ground-contact-root-node-index', '919');
  await expect(canvas).toHaveAttribute('data-p150g-correction-root-node-index', '922');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'whole-building');
  await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
  await expect(page.locator('#locus-layer-label')).toHaveText(
    'Koko rakennus + korjattu päätysokkeli (WORK_TEST)',
  );
  await expect(page.getByRole('status')).toHaveText(
    'P150G koko rakennus + korjattu päätysokkeli - WORK_TEST / P150D targetit 2/2 + P150G korjaustargetit 2/2 / zone4/4 - syvyys 0,600 m refinable - ei CURRENT/as-built',
  );
});

test('private viewer autoloads the exact P161 multisource systems review candidate', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const p161IvPlanNodes = Array.from({ length: 32 }, (_, index) => ({
    name: `G3_IV_1974_PLAN_ANCHOR_${String(index + 1).padStart(3, '0')}__DISPLAY`,
    extras: {
      systemDomain: 'IV',
      phase: '1974',
      sourceGeometryDimension: '2D_XY_PLAN',
      presentationOnly: true,
    },
  }));
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      {
        name: 'P161 MULTISOURCE SYSTEMS REVIEW CARRIER - BABYLON Y-UP',
        nodes: [0, 33, 35],
      },
    ],
    nodes: [
      {
        name: 'P144C_G3_1974_IV_P04_PRESENTATION_OVERLAY_ROOT_BABYLON_Y_UP',
        children: Array.from({ length: 32 }, (_, index) => index + 1),
        extras: {
          Pass: 'P144C',
          Purpose: 'presentationOnlyFederatedOverlay',
          sourceObjectCount: 32,
          sourcePrimitiveCount: 32,
        },
      },
      ...p161IvPlanNodes,
      {
        name: 'P156I_2017_KVV_MAIN_WORK_ASSUMPTION_PRESENTATION_ROOT_BABYLON_Y_UP',
        children: [34],
        extras: {
          Pass: 'P156I',
          Purpose: 'mainCandidate2017PresentationSuccessor',
          sourcePrimitiveCount: 82,
        },
      },
      {
        name: 'G3_KVV_2017_1F_WATER_MAIN_WORK_CANDIDATE_001__P156I_DISPLAY',
        extras: {
          Pass: 'P156I',
          sourceFamily: 'KVV_MAIN_2017_WORK_ASSUMPTION',
          systemDomain: 'KVV/käyttövesi',
          sourcePrimitiveCount: 82,
          presentationOnly: true,
        },
      },
      {
        name: 'P144E G3 1974 IV SECTION SIDECAR - BABYLON Y-UP',
        children: [36, 40],
        extras: {
          Purpose: 'presentationOnlySectionSidecarRoot',
          sectionStationStatus: 'UNRESOLVED_SOURCE',
          physicalZClaim: false,
        },
      },
      {
        name: 'P144E_SECTION_AA_PRESENTATION_SIDECAR',
        children: [37, 38, 39],
        extras: { placementMode: 'PRESENTATION_SIDECAR' },
      },
      ...Array.from({ length: 3 }, (_, index) => ({
        name: `P144E_SECTION_AA_ANCHOR_${index + 1}`,
        extras: {
          G3Id: `P144E_AA_${index + 1}`,
          placementMode: 'PRESENTATION_SIDECAR',
        },
      })),
      {
        name: 'P144E_SECTION_BB_PRESENTATION_SIDECAR',
        children: [41, 42, 43],
        extras: { placementMode: 'PRESENTATION_SIDECAR' },
      },
      ...Array.from({ length: 3 }, (_, index) => ({
        name: `P144E_SECTION_BB_ANCHOR_${index + 1}`,
        extras: {
          G3Id: `P144E_BB_${index + 1}`,
          placementMode: 'PRESENTATION_SIDECAR',
        },
      })),
    ],
  });
  const candidateId = 'p161-multisource-systems-carrier';
  const candidateLabel = 'P161 multisource systems review carrier - WORK_TEST';
  const candidatePath = '/private-model/work-test/p161-multisource-systems-carrier.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }] }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p161-multisource-systems-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'p161-multisource-systems-review');
  await expect(canvas).toHaveAttribute('data-p161-owner-candidate', 'p156i-2017-kvv-main-presentation');
  await expect(canvas).toHaveAttribute('data-p161-kvv2017-primitive-count', '82');
  await expect(canvas).toHaveAttribute('data-p161-iv1974-plan-anchor-count', '32');
  await expect(canvas).toHaveAttribute('data-p161-iv1974-plan-unique-count', '32');
  await expect(canvas).toHaveAttribute('data-p161-section-sidecar-anchor-count', '6');
  await expect(canvas).toHaveAttribute('data-p161-source-families-separate', 'true');
  await expect(canvas).toHaveAttribute('data-p161-physical-z-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p161-topology-link-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p161-same-pipe-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p161-penetration-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p161-current-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p161-as-built-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p161-canonical', 'false');
  await expect(canvas).toHaveAttribute('data-p161-publish-to-current', 'false');
  await expect(canvas).toHaveAttribute('data-p161-section-station-status', 'UNRESOLVED_SOURCE');
  await expect(canvas).toHaveAttribute('data-p161-section-vertical-datum-status', 'LOCAL_SECTION_ONLY');
  await expect(canvas).toHaveAttribute('data-p161-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
  await expect(page.getByRole('status')).toHaveText(
    'P161 multisource systems - WORK_TEST / P156I 2017 KVV + 1974 IV plan 32 + section sidecar 6 / lähdeperheet erillään - ei CURRENT/as-built',
  );

  const systemsLayer = page.locator('#locus-layer-visible');
  await expect(page.locator('#locus-layer-label')).toHaveText(
    'P161 tekniset järjestelmät (WORK_TEST)',
  );
  await expect(systemsLayer).toBeEnabled();
  await expect(systemsLayer).toBeChecked();
  await expect(page.locator('#locus-layer-count')).toHaveText('120 lähdekohdetta');
  await expect(page.locator('#locus-water-count')).toHaveText('KVV 2017: 82');
  await expect(page.locator('#locus-wastewater-count')).toHaveText(
    'IV 1974: 38 (32 suunnitelma + 6 leikkaus)',
  );
  await expect(canvas).toHaveAttribute('data-p161-kvv-layer-count', '82');
  await expect(canvas).toHaveAttribute('data-p161-iv-plan-layer-count', '32');
  await expect(canvas).toHaveAttribute('data-p161-section-sidecar-layer-count', '6');

  await page.locator('#layers-button').click();
  await expect(page.locator('#layers-panel')).toBeVisible();
  await systemsLayer.uncheck();
  await expect(canvas).toHaveAttribute('data-locus-layer-visible', 'false');
  await systemsLayer.check();
  await expect(canvas).toHaveAttribute('data-locus-layer-visible', 'true');
});

test('private viewer autoloads the exact P156I 2017 KVV main presentation review candidate', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'P156I 2017 KVV MAIN WORK_ASSUMPTION + P156B CARRIER - BABYLON Y-UP', nodes: [] }],
    nodes: [],
  });
  const candidateId = 'p156i-2017-kvv-main-presentation';
  const candidateLabel = 'P156I 2017 KVV mainCandidate presentation - WORK_TEST';
  const candidatePath = '/private-model/work-test/p156i-2017-kvv-main-presentation.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }] }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p156i-2017-kvv-main-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'p156i-2017-kvv-main-review');
  await expect(canvas).toHaveAttribute('data-p156-source-family', 'KVV_MAIN_2017_WORK_ASSUMPTION');
  await expect(canvas).toHaveAttribute('data-p156-time-role', '2017_PROJECT_PLAN_DERIVED');
  await expect(canvas).toHaveAttribute('data-p156-presentation-only', 'true');
  await expect(canvas).toHaveAttribute('data-p156-display-z-assumption', 'true');
  await expect(canvas).toHaveAttribute('data-p156-work-datum-status', 'PRESENTATION_ONLY_REFINABLE');
  await expect(canvas).toHaveAttribute('data-p156-vertical-datum-status', 'OPEN_UNVERIFIED');
  await expect(canvas).toHaveAttribute('data-p156-physical-z-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p156-current-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p156-as-built-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p156-topology-link-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p156-same-pipe-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p156-penetration-claim', 'false');
  await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
  await expect(page.getByRole('status')).toHaveText(
    'P156I 2017 KVV mainCandidate - WORK_TEST / presentation-only +8,700 m - ei fyysinen putkikorko',
  );
});

test('private viewer composes p143D SCALGO terrain and p139AD assumed-Z infra for depth review', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeP143dTerrainGlb();
  const candidateId = 'p143a-scalgo-terrain';
  const candidateLabel = 'p143A SCALGO terrain + architecture - WORK_TEST';
  const candidatePath = '/private-model/work-test/p143a-scalgo-terrain.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [
          {
            id: 'p136b-d-current-wall-corrected',
            label: 'p136B - D current wall corrected',
            path: '/private-model/work-test/p136b-d-current-wall-corrected.glb',
          },
          { id: candidateId, label: candidateLabel, path: candidatePath },
        ],
      }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p143d-scalgo-infra-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'scalgo-terrain-infra-review');
  await expect(canvas).toHaveAttribute('data-locus-work-z-route-count', '4');
  await expect(canvas).toHaveAttribute('data-locus-work-z-max-elevation', '18.150');
  await expect(canvas).toHaveAttribute('data-scalgo-terrain-base-renderable-count', '1');
  await expect(canvas).toHaveAttribute('data-terrain-vertical-bridge-status', 'WORK_OFFSET_UNVERIFIED');
  await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
  await expect(page.getByRole('status')).toHaveText(
    'SCALGO NYKYMAASTO + LOCUS WORK-Z - 4 reittiä - työoffset 21,750 m / ei as-built',
  );

  await clickViewAction(page, 'Julk -Y');
  await expect(canvas).toHaveAttribute('data-view-preset', 'elevation');
  await expect(canvas).toHaveAttribute('data-elevation-direction', 'neg-y');
  await expect(canvas).toHaveAttribute('data-camera-projection', 'orthographic');
  await expect(canvas).toHaveAttribute('data-height-scale-visible', 'true');
  await expect(canvas).toHaveAttribute('data-height-scale-frame', 'YLIS-G1-LOCAL');
  await expect(page.locator('#height-scale')).toBeVisible();

  await expect(page.locator('#profile-button')).toBeEnabled();
  await clickMoreAction(page, 'Pituusleikkaus');
  await expect(page.locator('#profile-panel')).toBeVisible();
  await expect(page.locator('#profile-route-select')).toHaveValue(
    'P139AD_LOCUS_WASTEWATER_PARCEL_WORK_Z',
  );
  await expect(canvas).toHaveAttribute(
    'data-profile-route',
    'P139AD_LOCUS_WASTEWATER_PARCEL_WORK_Z',
  );
  await expect(canvas).toHaveAttribute('data-profile-min-cover-m', '3.600');
  await expect(canvas).toHaveAttribute('data-profile-max-cover-m', '3.850');
  const profileSampleCount = Number(await canvas.getAttribute('data-profile-sample-count'));
  const profileTerrainHitCount = Number(await canvas.getAttribute('data-profile-terrain-hit-count'));
  expect(profileSampleCount).toBeGreaterThan(2);
  expect(profileTerrainHitCount).toBe(profileSampleCount);
  const terrainProfilePath = page.locator('#profile-svg [data-series="terrain"]');
  const pipeProfilePath = page.locator('#profile-svg [data-series="pipe"]');
  await expect(terrainProfilePath).toHaveCount(1);
  await expect(pipeProfilePath).toHaveCount(1);
  expect(await terrainProfilePath.getAttribute('d')).toContain('M');
  expect(await pipeProfilePath.getAttribute('d')).toContain('M');
  await expect(page.locator('#profile-summary')).toContainText('peitto min 3,60 m');
  await page.locator('#close-profile-button').click();

  await page.getByRole('button', { name: 'Layerit' }).click();
  await expect(page.getByText('SCALGO nykymaasto + Locus work-Z infra (WORK_TEST)')).toBeVisible();
});

test('private viewer composes p139AC ground and Z-backed underground infra review on p139AB', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeP139abReviewGlb();
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

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
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
  const candidateModel = makeP139abReviewGlb();
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
        candidates: [
          {
            id: 'p136b-d-current-wall-corrected',
            label: 'p136B - D current wall corrected',
            path: '/private-model/work-test/p136b-d-current-wall-corrected.glb',
          },
          { id: candidateId, label: candidateLabel, path: candidatePath },
        ],
      }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p139ad-locus-work-z-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'locus-work-z-review');
  await expect(canvas).toHaveAttribute('data-locus-work-z-route-count', '4');
  await expect(canvas).toHaveAttribute('data-locus-work-z-max-elevation', '18.150');
  await expect(canvas).toHaveAttribute('data-p139ab-building-renderable-count', '1');
  await expect(canvas).toHaveAttribute('data-p139ab-source-z-renderable-count', '1');
  await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
  await expect(canvas).toHaveAttribute('data-camera-projection', 'orthographic');
  await expect(page.getByRole('status')).toHaveText(
    'LOCUS WORK-Z - 4 reittiä oletuskoroilla - max +18,15 < maanpintaraja +18,30 - ei as-built',
  );

  await clickViewAction(page, 'Julk +Y');
  await expect(canvas).toHaveAttribute('data-view-preset', 'elevation');
  await expect(canvas).toHaveAttribute('data-elevation-direction', 'pos-y');
  await expect(canvas).toHaveAttribute('data-camera-projection', 'orthographic');
  await expect(canvas).toHaveAttribute('data-height-scale-visible', 'true');
  await expect(canvas).toHaveAttribute('data-height-scale-frame', 'YLIS-G1-LOCAL');
  await expect(page.locator('#height-scale')).toBeVisible();
  await expect(page.locator('#height-scale .height-scale-label').first()).toBeVisible();
  await expect(page.getByRole('status')).toHaveText(
    'Ortografinen julkisivu +Y - YLIS-G1-LOCAL Z-asteikko',
  );

  await clickViewAction(page, 'Julk +X');
  await expect(canvas).toHaveAttribute('data-elevation-direction', 'pos-x');
  await expect(canvas).toHaveAttribute('data-height-scale-visible', 'true');

  await clickViewAction(page, 'Isometrinen');
  await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
  await expect(canvas).toHaveAttribute('data-height-scale-visible', 'false');

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

test('private viewer automatically relays the protected source in-browser when server-side import fails', async ({ page }) => {
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
        name: 'P143H SCALGO TECH LABELS + PAIRED GRADIENT BARBS + SMOOTHED CARTOGRAPHY + P142A ARCHITECTURE - BABYLON Y-UP',
        nodes: [],
      },
    ],
    nodes: [],
  });
  const candidateId = 'p143h-scalgo-label-axis';
  const candidateLabel = 'p143H SCALGO technical labels + paired barbs - WORK_TEST';
  const candidatePath = '/private-model/work-test/p143h-scalgo-label-axis.glb';
  const sourceUrl =
    'https://sdmntprdenmarkeast.oaiusercontent.com/files/fallback/raw?se=2026-09-30T20%3A00%3A00Z&sig=signature';
  let uploaded = false;
  let uploadRequests = 0;
  let sourceRequests = 0;

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/import.json', async (route) => {
    await route.fulfill({
      status: 502,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'source-fetch-denied' }),
    });
  });
  await page.route('https://sdmntprdenmarkeast.oaiusercontent.com/**', async (route) => {
    sourceRequests += 1;
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: candidateModel,
    });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    if (!uploaded) {
      await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }],
      }),
    });
  });
  await page.route(
    `**/private-model/work-test/upload/${candidateId}.glb`,
    async (route) => {
      uploadRequests += 1;
      expect(route.request().method()).toBe('PUT');
      expect(route.request().headers()['content-type']).toContain('model/gltf-binary');
      expect(route.request().postDataBuffer()?.byteLength).toBe(candidateModel.byteLength);
      uploaded = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          candidate: { id: candidateId, label: candidateLabel, path: candidatePath },
          ready: true,
          seeded: true,
          uploaded: true,
        }),
      });
    },
  );
  await page.route(`**${candidatePath}`, async (route) => {
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
  await page.goto(`/private-model/?review=p143h-scalgo-label-axis-review#${fragment}`);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-relay', 'ready');
  await expect(canvas).toHaveAttribute('data-work-test-import', 'ready');
  await expect(canvas).toHaveAttribute('data-model-source', 'work-test');
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'scalgo-label-axis-review');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(page.getByRole('button', { name: 'Tuo WORK_TEST .glb' })).toBeHidden();
  await expect(page).not.toHaveURL(/workTestImport=/);
  expect(sourceRequests).toBe(1);
  expect(uploadRequests).toBe(1);
});

test('private viewer bounds a non-settling WORK_TEST import before browser relay fallback', async ({ page }) => {
  test.setTimeout(45_000);

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
        name: 'P150G WHOLE-BUILDING + END-PLINTH HUMAN-REVIEW CORRECTION - BABYLON Y-UP',
        nodes: [],
      },
    ],
    nodes: [],
  });
  const candidateId = 'p150g-whole-building-end-plinth';
  const candidateLabel = 'P150G whole-building end-plinth correction - WORK_TEST';
  const candidatePath = '/private-model/work-test/p150g-whole-building-end-plinth.glb';
  const sourceUrl =
    'https://sdmntprdenmarkeast.oaiusercontent.com/files/stalled/raw?se=2026-10-01T12%3A00%3A00Z&sig=signature';
  let uploaded = false;
  let sourceRequests = 0;
  let uploadRequests = 0;

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.addInitScript(() => {
    const nativeFetch = window.fetch.bind(window);
    window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof Request
            ? input.url
            : String(input);
      if (url.includes('/private-model/work-test/import.json')) {
        return new Promise<Response>(() => {
          // Deliberately never settle and ignore AbortSignal to prove the hard timeout wins.
        });
      }
      return nativeFetch(input, init);
    }) as typeof window.fetch;
  });
  await page.route('https://sdmntprdenmarkeast.oaiusercontent.com/**', async (route) => {
    sourceRequests += 1;
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: candidateModel,
    });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    if (!uploaded) {
      await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }],
      }),
    });
  });
  await page.route(
    `**/private-model/work-test/upload/${candidateId}.glb`,
    async (route) => {
      uploadRequests += 1;
      uploaded = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          candidate: { id: candidateId, label: candidateLabel, path: candidatePath },
          ready: true,
          seeded: true,
          uploaded: true,
        }),
      });
    },
  );
  await page.route(`**${candidatePath}`, async (route) => {
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
  const startedAt = Date.now();
  await page.goto(`/private-model/?review=p150g-whole-building-end-plinth-review#${fragment}`);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-relay', 'ready', { timeout: 36_000 });
  await expect(canvas).toHaveAttribute('data-work-test-import', 'ready');
  await expect(canvas).toHaveAttribute('data-model-source', 'work-test');
  await expect(canvas).toHaveAttribute(
    'data-work-test-review-mode',
    'p150g-whole-building-end-plinth-review',
  );
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(page).not.toHaveURL(/workTestImport=/);
  expect(Date.now() - startedAt).toBeGreaterThanOrEqual(29_000);
  expect(Date.now() - startedAt).toBeLessThan(36_000);
  expect(sourceRequests).toBe(1);
  expect(uploadRequests).toBe(1);
});

test('private viewer standard presets apply recommended layer start state and keep manual layer overrides available', async ({ page }) => {
  const model = makeLocusLayerGlb();

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: model });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  });

  await page.goto('/private-model/');
  const canvas = page.locator('#private-model-canvas');

  await clickViewAction(page, 'Koko rakennus');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'whole-building');
  await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
  await expect(canvas).toHaveAttribute('data-layer-state-source', 'preset:whole-building');
  await expect(canvas).toHaveAttribute('data-layer-locus-visible', 'false');
  await expect(canvas).toHaveAttribute('data-layer-edge-mode', 'visible');

  await page.getByRole('button', { name: 'Layerit' }).click();
  const edgeMode = page.locator('#edge-mode-select');
  await edgeMode.selectOption('none');
  await expect(canvas).toHaveAttribute('data-layer-state-source', 'manual');
  await expect(canvas).toHaveAttribute('data-layer-edge-mode', 'none');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'whole-building');

  await clickViewAction(page, 'Infra');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'infra');
  await expect(canvas).toHaveAttribute('data-view-preset', 'top');
  await expect(canvas).toHaveAttribute('data-layer-state-source', 'preset:infra');
  await expect(canvas).toHaveAttribute('data-layer-locus-visible', 'true');
  await expect(canvas).toHaveAttribute('data-layer-roof-visible', 'false');
  await expect(canvas).toHaveAttribute('data-layer-edge-mode', 'visible');

  const locusToggle = page.locator('#locus-layer-visible');
  await locusToggle.uncheck();
  await expect(canvas).toHaveAttribute('data-layer-state-source', 'manual');
  await expect(canvas).toHaveAttribute('data-layer-locus-visible', 'false');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'infra');

  await clickViewAction(page, 'Tontti');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'site');
  await expect(canvas).toHaveAttribute('data-layer-locus-visible', 'false');
  await expect(canvas).toHaveAttribute('data-layer-roof-visible', 'true');
});

test('private viewer keeps the primary toolbar compact and exposes legacy actions through menus', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  });

  await page.goto('/private-model/');

  await expect(page.getByText('Ylisrinne 3D', { exact: true })).toBeVisible();
  await expect(page.locator('#view-menu > summary')).toHaveText('Näkymä');
  await expect(page.getByRole('button', { name: 'Layerit' })).toBeVisible();
  await expect(page.locator('#model-source-badge')).toHaveText('CURRENT');
  await expect(page.locator('#more-menu > summary')).toHaveAttribute('aria-label', 'Lisää toimintoja');
  await expect(page.getByRole('button', { name: 'Sovita näkymään' })).toBeHidden();

  await openToolbarMenu(page, '#view-menu');
  await expect(page.getByRole('button', { name: 'Koko rakennus' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'D-asunto' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Vapaa 3D' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Isometrinen' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'D 1F' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'D 2F' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tontti' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Infra' })).toBeVisible();

  await openToolbarMenu(page, '#more-menu');
  await expect(page.getByRole('button', { name: 'Sovita näkymään' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pituusleikkaus' })).toBeDisabled();
});


test('private viewer compares CURRENT and WORK_TEST in the same preserved view', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'WORK TEST ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateId = 'p149f-compare-candidate';
  const candidateLabel = 'P149F comparison candidate - WORK_TEST';
  const candidatePath = '/private-model/work-test/p149f-compare-candidate.glb';

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

  await page.goto('/private-model/');
  const canvas = page.locator('#private-model-canvas');
  await expect(page.locator('#model-source-badge')).toHaveText('CURRENT');
  await clickViewAction(page, 'Koko rakennus');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'whole-building');

  await openToolbarMenu(page, '#model-menu');
  await page.getByRole('button', { name: 'Vertaa WORK_TESTiin' }).click();
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute('data-model-comparison', 'active');
  await expect(canvas).toHaveAttribute('data-model-comparison-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-model-comparison-view', 'preserved');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'whole-building');
  await expect(page.getByRole('status')).toHaveText(`A/B-vertailu: WORK_TEST - ${candidateLabel}`);

  await openToolbarMenu(page, '#model-menu');
  await page.getByRole('button', { name: 'Vertaa CURRENTiin' }).click();
  await expect(page.locator('#model-source-badge')).toHaveText('CURRENT');
  await expect(canvas).toHaveAttribute('data-model-comparison', 'active');
  await expect(canvas).toHaveAttribute('data-model-comparison-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-model-comparison-view', 'preserved');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'whole-building');
  await expect(page.getByRole('status')).toHaveText('A/B-vertailu: CURRENT');
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
  await expect(page.locator('#work-test-button')).toBeDisabled();
});

test('private viewer autoloads the exact P159 whole-building storage context review candidate', async ({ page }) => {
  const currentModel = makeMinimalGlb({ asset: { version: '2.0' }, scene: 0, scenes: [{ name: 'CURRENT ROOT', nodes: [] }], nodes: [] });
  const candidateModel = makeMinimalGlb({ asset: { version: '2.0' }, scene: 0, scenes: [{ name: 'WHOLE BUILDING STORAGE CONTEXT WORK_TEST P159 - BABYLON Y-UP', nodes: [] }], nodes: [] });
  const candidateId = 'p159-whole-building-storage-context';
  const candidateLabel = 'P159 whole-building storage context successor - WORK_TEST';
  const candidatePath = '/private-model/work-test/p159-whole-building-storage-context.glb';

  await page.route('**/private-model/model.glb', async (route) => route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel }));
  await page.route('**/private-model/work-test/catalog.json', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }] }) }));
  await page.route(`**${candidatePath}`, async (route) => route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel }));

  await page.goto('/private-model/?review=p159-whole-building-storage-context-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);
  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'p159-whole-building-storage-context-review');
  await expect(canvas).toHaveAttribute('data-p159-owner-candidate', 'p150g-whole-building-end-plinth');
  await expect(canvas).toHaveAttribute('data-p159-inherited-human-review-scope', 'END_PLINTH_SCOPE_ONLY');
  await expect(canvas).toHaveAttribute('data-p159-storage-reference-footprint-count', '3');
  await expect(canvas).toHaveAttribute('data-p159-storage-context-source', 'P158B');
  await expect(canvas).toHaveAttribute('data-p159-storage-presentation-only', 'true');
  await expect(canvas).toHaveAttribute('data-p159-storage-physical-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p159-ground-contact-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p159-terrain-cut-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p159-wall-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p159-roof-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p159-foundation-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p159-physical-metric-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p159-current-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p159-as-built-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p159-canonical', 'false');
  await expect(canvas).toHaveAttribute('data-p159-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'whole-building');
  await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
  await expect(page.getByRole('status')).toHaveText('P159 whole-building storage context - WORK_TEST / P150G owner + 3 P158B storage referenceFootprints presentation-only - HUMAN_REVIEW NOT_RUN');
});

test('private viewer autoloads the exact P160 D composite architecture review candidate', async ({ page }) => {
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
      { name: 'D COMPOSITE ARCHITECTURE WORK_TEST P160 - BABYLON Y-UP', nodes: [] },
      { name: 'D CURRENT INTERIOR - BABYLON Y-UP', nodes: [] },
    ],
    nodes: [],
  });
  const candidateId = 'p160-d-composite-architecture';
  const candidateLabel = 'P160 D composite architecture carrier - WORK_TEST';
  const candidatePath = '/private-model/work-test/p160-d-composite-architecture.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }] }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p160-d-composite-architecture-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'p160-d-composite-architecture-review');
  await expect(canvas).toHaveAttribute('data-p160-owner-candidate', 'p154c-d-wall-cutouts');
  await expect(canvas).toHaveAttribute('data-p160-wall-piece-count', '126');
  await expect(canvas).toHaveAttribute('data-p160-cutout-identity-count', '18');
  await expect(canvas).toHaveAttribute('data-p160-stair-guard-low-wall-delta', 'P153C');
  await expect(canvas).toHaveAttribute('data-p160-storage-roof-delta', 'P155C-B');
  await expect(canvas).toHaveAttribute('data-p160-storage-roof-presentation-only', 'true');
  await expect(canvas).toHaveAttribute('data-p160-physical-stair-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p160-physical-opening-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p160-physical-guard-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p160-physical-low-wall-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p160-physical-roof-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p160-floor-shell-cut-applied', 'false');
  await expect(canvas).toHaveAttribute('data-p160-pillar-geometry-created', 'false');
  await expect(canvas).toHaveAttribute('data-p160-current-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p160-as-built-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p160-canonical', 'false');
  await expect(canvas).toHaveAttribute('data-p160-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'd-apartment');
  await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
  await expect(page.getByRole('status')).toHaveText(
    'P160 D composite architecture - WORK_TEST / P154C walls+18 cutouts + P153 stair/guard/lowWall + P155C-B storage roof presentation - ei CURRENT/as-built',
  );
});

test('private viewer autoloads the exact P154C D wall cutout review candidate', async ({ page }) => {
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
      { name: 'D WALL CUTOUTS WORK_TEST P154C - BABYLON Y-UP', nodes: [] },
      { name: 'D CURRENT INTERIOR - BABYLON Y-UP', nodes: [] },
    ],
    nodes: [],
  });
  const candidateId = 'p154c-d-wall-cutouts';
  const candidateLabel = 'P154C D wall solids + door/window cutouts - WORK_TEST';
  const candidatePath = '/private-model/work-test/p154c-d-wall-cutouts.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }] }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p154c-d-wall-cutouts-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'p154c-d-wall-cutouts-review');
  await expect(canvas).toHaveAttribute('data-p154-result-wall-piece-count', '126');
  await expect(canvas).toHaveAttribute('data-p154-cutout-identity-count', '18');
  await expect(canvas).toHaveAttribute('data-p154-door-cutout-count', '11');
  await expect(canvas).toHaveAttribute('data-p154-window-cutout-count', '7');
  await expect(canvas).toHaveAttribute('data-p154-excluded-unmapped-user-opening-count', '2');
  await expect(canvas).toHaveAttribute(
    'data-p154-excluded-unmapped-user-opening-ids',
    'D1F_USER_CURRENT_DOOR_A,D1F_USER_CURRENT_DOOR_B',
  );
  await expect(canvas).toHaveAttribute('data-p154-opening-treatment', 'P154C_WORK_TEST_CUTOUT_APPLIED');
  await expect(canvas).toHaveAttribute('data-p154-door-vertical-basis', 'REFINABLE_WORK_ASSUMPTION_2_100M');
  await expect(canvas).toHaveAttribute('data-p154-window-vertical-basis', 'SOURCE_REFERENCE_OPENING');
  await expect(canvas).toHaveAttribute('data-p154-normal-extent-role', 'HOST_SOLID_INTERSECTION_ONLY');
  await expect(canvas).toHaveAttribute('data-p154-source-primitive-mutation', 'false');
  await expect(canvas).toHaveAttribute('data-p154-physical-door-height-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p154-physical-opening-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p154-current-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p154-as-built-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p154-canonical', 'false');
  await expect(canvas).toHaveAttribute('data-p154-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'd-apartment');
  await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
  await expect(page.getByRole('status')).toHaveText(
    'P154C D-seinäsolidit + aukot - WORK_TEST / 18 cutoutia - ovikorkeus 2,100 m refinable - ei CURRENT/as-built',
  );
});

test('private viewer autoloads the exact P153C D stair review candidate', async ({ page }) => {
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
      { name: 'P153C D STAIR GUARD + LOWWALL + P153B STAIR WORK_TEST - BABYLON Y-UP', nodes: [] },
      { name: 'D CURRENT INTERIOR - BABYLON Y-UP', nodes: [] },
    ],
    nodes: [],
  });
  const candidateId = 'p153c-d-stair-guard-lowwall';
  const candidateLabel = 'P153C D stair + guard/lowWall - WORK_TEST';
  const candidatePath = '/private-model/work-test/p153c-d-stair-guard-lowwall.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }] }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: candidateModel });
  });

  await page.goto('/private-model/?review=p153c-d-stair-review');
  await expect(page.locator('#work-test-select')).toHaveValue(candidateId);

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-candidate', candidateId);
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload', 'true');
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', 'p153c-d-stair-review');
  await expect(canvas).toHaveAttribute('data-p153-work-topology', 'TWO_FLIGHT_SWITCHBACK_WITH_TURN_LANDING');
  await expect(canvas).toHaveAttribute('data-p153-work-riser-count', '16');
  await expect(canvas).toHaveAttribute('data-p153-total-rise-m', '2.760');
  await expect(canvas).toHaveAttribute('data-p153-work-assumption', 'true');
  await expect(canvas).toHaveAttribute('data-p153-physical-stair-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p153-physical-opening-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p153-floor-shell-cut-applied', 'false');
  await expect(canvas).toHaveAttribute('data-p153-physical-guard-claim', 'false');
  await expect(canvas).toHaveAttribute('data-p153-physical-low-wall-claim', 'false');
  await expect(
    canvas,
  ).toHaveAttribute('data-p153-guard-low-wall-junction-status', 'RELATIONAL_ONLY_EXACT_JUNCTION_UNRESOLVED');
  await expect(canvas).toHaveAttribute('data-p153-pillar-geometry-created', 'false');
  await expect(canvas).toHaveAttribute('data-p153-exact-guard-geometry-status', 'DEFERRED');
  await expect(canvas).toHaveAttribute('data-p153-exact-low-wall-height-status', 'DEFERRED');
  await expect(canvas).toHaveAttribute('data-p153-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'd-apartment');
  await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
  await expect(page.getByRole('status')).toHaveText(
    'P153C D-portaat - WORK_TEST / portaat + opening-frame + guard/lowWall - mitat refinable, pilarijakso DEFERRED',
  );
});

