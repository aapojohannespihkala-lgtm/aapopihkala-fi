import { test, expect } from '@playwright/test';
// @ts-ignore - pure ESM contract for source-derived, unapproved WORK_TEST scenes.
import {
  D1F_COMBINED_WALL_VARIANTS,
  selectD1FCombinedWallWorkTestScene,
} from '../../src/scripts/privateModelD1FCombinedWallSceneContract.mjs';

const flags = () => ({
  WORK_TEST_ONLY: true, current: false, Canonical: false,
  asBuilt: false, publishToCURRENT: false, HUMAN_REVIEW: 'NOT_RUN',
  physicalAbsoluteXYZVerified: false,
});
const object = (name: string, additional: Record<string, unknown> = {}, children: any[] = []) => ({
  name, children, visible: true, userData: { ...flags(), ...additional },
});

function fixture() {
  const rawScenes: any[] = Array.from({ length: 72 }, () => ({ nodes: [] }));
  const renderedScenes: any[] = Array.from({ length: 72 }, () => ({ children: [] }));
  const nodes: any[] = Array.from({ length: 817 + 1 }, () => ({}));
  nodes[798] = { mesh: 406 };
  nodes[817] = { children: [798] };
  rawScenes[5] = { nodes: [817] };
  const components: any[] = [];
  D1F_COMBINED_WALL_VARIANTS.forEach((name: string, i: number) => {
    const corners = ['CORNER_NORTH_X2337', 'CORNER_SOUTH_X2337', 'CORNER_MIDDLE_X2589']
      .map(id => object(id + '_' + name, { independentlyAddressableCorner: id }));
    const wall = object('P123C_I03_REPLACED_COMBINED_' + name,
      { sourceNodeIndex: 798, displayContextOnly: false }, corners);
    const devices = [1091, 1096, 1101]
      .map(id => object('THEMO_' + id + '_' + name, { sourceNodeIndex: id }));
    const root = object(
      'P136B_VIEW_ROOT_D_CURRENT_INTERIOR_CORRECTED_BABYLON_Y_UP_COMBINED_' + name,
      {
        sourceNodeIndex: 817,
        alignmentHypothesis: 'WORK_MODEL_LOBBY_FACE_ANCHOR_FIXED',
        physicalFinishedFloorSurfacesNotMaterialized: true,
        sourceRootQuaternionPreserved: true,
      }, [wall, ...devices]);
    const sceneName = 'D1F COMBINED 2990MM ' + name + ' WORK_TEST NOT CURRENT';
    rawScenes[68 + i] = {
      name: sceneName, nodes: [1108 + i * 58],
      extras: {
        ...flags(), variant: name, sourceSceneIndex: 5,
        physicalWidthAnchorResolved: false, saunaDoorHandResolved: false,
      },
    };
    renderedScenes[68 + i] = { name: sceneName, children: [root] };
    components.push({ wall, corners, devices, root });
  });
  return {
    gltf: {
      parser: { json: { scenes: rawScenes, nodes,
        extras: { combined2990WallWorkTest: flags() } } },
      scenes: renderedScenes,
    },
    components,
  };
}

test('four alternatives expose one replacement wall and three individually addressable corners', () => {
  const { gltf, components } = fixture();
  for (const [i, name] of D1F_COMBINED_WALL_VARIANTS.entries()) {
    const selected = selectD1FCombinedWallWorkTestScene(gltf, name);
    expect(selected.scene).toBe(gltf.scenes[68 + i]);
    expect(selected.wall).toBe(components[i].wall);
    expect(selected.corners.map((entry: any) => entry.name))
      .toEqual(['CORNER_NORTH_X2337', 'CORNER_SOUTH_X2337', 'CORNER_MIDDLE_X2589']);
    expect(selected.corners.map((entry: any) => entry.object)).toEqual(components[i].corners);
    expect(selected).toMatchObject({
      workTestOnly: true, absolutePhysicalXYVerified: false,
      rawGlbByteIdentityVerified: false,
      productionRenderedRoisVerified: false, humanReview: 'NOT_RUN',
    });
  }
});

test('rejects legacy scene69, unrecognised variant, and missing alternatives', () => {
  const { gltf } = fixture();
  expect(() => selectD1FCombinedWallWorkTestScene(gltf, 'SCENE69'))
    .toThrow('D1F_COMBINED_WALL_CONTRACT_REJECTED');
  gltf.scenes[69].name = 'P137E_SCENE69_THREE_SOURCE_CORNERS_AND_I03_FIELD_WORK_TEST_ROOT';
  expect(() => selectD1FCombinedWallWorkTestScene(gltf, D1F_COMBINED_WALL_VARIANTS[0]))
    .toThrow('scene name, root, or source provenance');
});

test('rejects missing original source scene5 carrier and false physical/current approval', () => {
  const { gltf } = fixture();
  gltf.parser.json.nodes[798].mesh = 999;
  expect(() => selectD1FCombinedWallWorkTestScene(gltf, D1F_COMBINED_WALL_VARIANTS[0]))
    .toThrow('original D1F scene5/source carrier');
  gltf.parser.json.nodes[798].mesh = 406;
  gltf.parser.json.scenes[68].extras.physicalWidthAnchorResolved = true;
  expect(() => selectD1FCombinedWallWorkTestScene(gltf, D1F_COMBINED_WALL_VARIANTS[0]))
    .toThrow('scene name, root, or source provenance');
  gltf.parser.json.scenes[68].extras.physicalWidthAnchorResolved = false;
  gltf.parser.json.extras.combined2990WallWorkTest.current = true;
  expect(() => selectD1FCombinedWallWorkTestScene(gltf, D1F_COMBINED_WALL_VARIANTS[0]))
    .toThrow('GLB family metadata not WORK_TEST');
});

test('rejects duplicate wall carriers, missing corners and detached patches', () => {
  const { gltf, components } = fixture();
  const name = D1F_COMBINED_WALL_VARIANTS[0];
  components[0].root.children.push(object('accidental old wall', { sourceNodeIndex: 798, displayContextOnly: false }));
  expect(() => selectD1FCombinedWallWorkTestScene(gltf, name))
    .toThrow('one actual replacement wall carrier');
  components[0].root.children.pop();
  const removed = components[0].wall.children.pop();
  expect(() => selectD1FCombinedWallWorkTestScene(gltf, name))
    .toThrow('corner missing');
  components[0].root.children.push(removed);
  expect(() => selectD1FCombinedWallWorkTestScene(gltf, name))
    .toThrow('corner missing');
});

test('rejects missing original Themo and hidden target even when metadata looks valid', () => {
  const { gltf, components } = fixture();
  const name = D1F_COMBINED_WALL_VARIANTS[0];
  components[0].devices[0].userData.sourceNodeIndex = 999;
  expect(() => selectD1FCombinedWallWorkTestScene(gltf, name))
    .toThrow('three original Themo hosts');
  components[0].devices[0].userData.sourceNodeIndex = 1091;
  components[0].wall.visible = false;
  expect(() => selectD1FCombinedWallWorkTestScene(gltf, name))
    .toThrow('target wall hidden');
});

test('rejects cycle/shared-target graphs rather than counting same corner twice', () => {
  const { gltf, components } = fixture();
  const name = D1F_COMBINED_WALL_VARIANTS[0];
  components[0].wall.children.push(components[0].corners[0]);
  expect(() => selectD1FCombinedWallWorkTestScene(gltf, name))
    .toThrow('scene graph cycle or shared node');
});
