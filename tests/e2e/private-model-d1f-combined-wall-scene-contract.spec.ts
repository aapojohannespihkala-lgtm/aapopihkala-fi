import { loadD1FServiceModel } from '../../src/scripts/privateModelD1FServiceRuntime.mjs';
import { test, expect } from '@playwright/test';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
// @ts-ignore - pure ESM contract for source-derived, unapproved WORK_TEST scenes.
import {
  D1F_COMBINED_WALL_VARIANTS,
  D1F_COMBINED_WALL_ASSETS,
  isD1FCombinedWallReviewRequested,
  loadD1FCombinedWallReview,
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

const measuredId = 'd1f-measured-wall-140-100-2350-b710-basin-20261014';
const correctedId = 'd1f-four-review-corrections-20261014';
const correctedRecord = 'G2_D1F_FOUR_USER_REVIEW_CORRECTIONS_20261014_2330';
const finishedId = 'd1f-finished-face-2360-wall-basin-20261014';
const finishedRecord = 'G2_D1F_KPH_FINISHED_FACE_2360_FOUR_HYPOTHESES_20261014_1600';
const counterRecord = 'G2_D1F_KPH_BASIN_SOURCE_FACE_X3P888_WORK_TEST_20261014';

function fixture(measuredCounter = false, finished = false, corrections = false) {
  const sceneStart = corrections ? 84 : finished ? 80 : measuredCounter ? 76 : 68;
  const rawScenes: any[] = Array.from({ length: corrections ? 88 : finished ? 84 : measuredCounter ? 80 : 72 }, () => ({ nodes: [] }));
  const renderedScenes: any[] = Array.from({ length: rawScenes.length }, () => ({ children: [] }));
  const nodes: any[] = Array.from({ length: finished ? 1368 : measuredCounter ? 1356 : 818 }, () => ({}));
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
      measuredCounter ? 'D1F_MEASURED_WALL_ROOT_BABYLON_Y_UP_' + name + '_WITH_MEASURED_COUNTER' + (finished ? '_FINISHED_FACE_2360_WORK_HYPOTHESIS' : '')
        : 'P136B_VIEW_ROOT_D_CURRENT_INTERIOR_CORRECTED_BABYLON_Y_UP_COMBINED_' + name,
      {
        sourceNodeIndex: 817,
        alignmentHypothesis: 'WORK_MODEL_LOBBY_FACE_ANCHOR_FIXED',
        physicalFinishedFloorSurfacesNotMaterialized: true,
        sourceRootQuaternionPreserved: true,
      }, [wall, ...devices]);
    const sceneName = measuredCounter
      ? 'D1F MEASURED 140 100 2350 B710 ' + name + ' WORK_TEST NOT CURRENT WITH MEASURED COUNTER' + (finished ? ' FINISHED FACE 2360 WORK HYPOTHESIS' : '')
      : 'D1F COMBINED 2990MM ' + name + ' WORK_TEST NOT CURRENT';
    rawScenes[sceneStart + i] = {
      name: sceneName, nodes: [1108 + i * 58],
      extras: {
        ...flags(), variant: name, sourceSceneIndex: 5,
        physicalWidthAnchorResolved: false, saunaDoorHandResolved: false,
      },
    };
    let counter: any = null;
    if (measuredCounter) {
      const counterId = finished ? 1357 + i * 3 : 1348 + i * 2;
      const rootId = counterId + 1;
      counter = object('D1F_KPH_COUNTER_WORK_TEST_' + name + (finished ? '_FINISHED_FACE_2360' : ''), {
        logicalFixtureId: 'D1F_KPH_BASIN_TOP_WORK_PROXY_01', sourceRecord: finished ? finishedRecord : counterRecord,
        sourceHostFaceXM: 3.888, finishedFloorWorkZM: 0.08, absoluteFaceSurveyVerified: false,
      });
      root.children.push(counter);
      Object.assign(root.userData, { counterNode: counterId, parentMeasuredRoot: 1341 + i * 2 });
      rawScenes[72 + i] = { nodes: [1341 + i * 2] };
      rawScenes[sceneStart + i].nodes = [rootId];
      Object.assign(rawScenes[sceneStart + i].extras, {
        counterNode: counterId, parentCombinedScene: 68 + i, parentMeasuredScene: 72 + i,
        counterSourceRecord: finished ? finishedRecord : counterRecord, sourceFieldWidthResidualMm: 18,
        residualResolution: finished ? 'WORK_GEOMETRY_ONLY_PHYSICAL_ANCHOR_OPEN' : 'OPEN_NOT_GUESSED',
      });
      if (finished) {
        const west = name.startsWith('WEST_');
        counter.position = { x: west ? 0 : .018, y: 0, z: 0 };
        Object.assign(counter.userData, { workingHostFaceXM: west ? 3.888 : 3.906,
          physicalFinishedFaceVerified: false });
        Object.assign(wall.userData, { sourceRecord: finishedRecord, measuredWidthMm: 2360,
          physicalWidthAnchorResolved: false, saunaDoorHandResolved: false });
        rawScenes[76 + i] = { nodes: [1349 + i * 2] };
        Object.assign(root.userData, { parentMeasuredCounterRoot: 1349 + i * 2 });
        Object.assign(rawScenes[sceneStart + i].extras, { parentMeasuredCounterScene: 76 + i,
          sourceRecord: finishedRecord, workGeometryWidthResidualMm: 0,
          modelClearWidthMm: 2360, fieldClearWidthMm: 2360,
          workingFinishedFacesXM: west ? [3.888, 6.248] : [3.906, 6.266] });
      }
      nodes[counterId] = { name: counter.name, mesh: 611, extras: counter.userData,
        ...(finished ? { translation: [counter.position.x, 0, 0] } : {}) };
      nodes[rootId] = { children: [counterId], extras: root.userData };
    }
    if(corrections) {
      rawScenes[80+i] = {nodes:[900+i]};
      root.name+='__FOUR_USER_CORRECTIONS';counter.name+='__FOUR_USER_CORRECTIONS';
      counter.userData.sourceRecord=correctedRecord;
      Object.assign(counter.userData,{presentationSlabThicknessMm:60,thicknessMeasured:false});
      Object.assign(wall.userData,{sourceRecord:correctedRecord});
      const rawScene=rawScenes[sceneStart+i];rawScene.name+=' FOUR USER CORRECTIONS';
      Object.assign(rawScene.extras,{sourceRecord:correctedRecord,counterSourceRecord:correctedRecord,
        parentFinishedFaceScene:80+i,visualRoomFootprints:false});
      Object.assign(root.userData,{parentFinishedFaceRoot:900+i,visualRoomFootprints:false,
        backgroundRoomFootprintSourceNodes:Array.from({length:10},(_,j)=>700+j)});
      nodes[rawScene.extras.counterNode].mesh=616;
    }
    renderedScenes[sceneStart + i] = { name: rawScenes[sceneStart+i].name, children: [root] };
    components.push({ wall, corners, devices, root, counter });
  });
  return {
    gltf: {
      parser: { json: { scene: sceneStart, scenes: rawScenes, nodes,
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

test('new source selects only scenes76..79 with exactly one source-bound counter each', () => {
  const { gltf, components } = fixture(true);
  for (const [i, variant] of D1F_COMBINED_WALL_VARIANTS.entries()) {
    const selected = selectD1FCombinedWallWorkTestScene(gltf, variant, measuredId);
    expect(selected.sceneIndex).toBe(76 + i);
    expect(selected.scene).toBe(gltf.scenes[76 + i]);
    expect(selected.counter).toBe(components[i].counter);
    expect(selected.wall).toBe(components[i].wall);
    expect(selected.corners).toHaveLength(3);
    expect(selected.productionRenderedRoisVerified).toBe(false);
    expect(selected.absolutePhysicalXYVerified).toBe(false);
    expect(selected.humanReview).toBe('NOT_RUN');
  }
  expect(() => selectD1FCombinedWallWorkTestScene(gltf, D1F_COMBINED_WALL_VARIANTS[0]))
    .toThrow('original D1F scene5/source carrier');
  expect(() => selectD1FCombinedWallWorkTestScene(fixture().gltf, D1F_COMBINED_WALL_VARIANTS[0], measuredId))
    .toThrow('original D1F scene5/source carrier');
  expect(() => selectD1FCombinedWallWorkTestScene(gltf, D1F_COMBINED_WALL_VARIANTS[0], measuredId + '-wrong'))
    .toThrow('unknown source candidate');
});

test('counter profile rejects changed default, reused source node and false resolution', () => {
  for (const alter of [
    (g: any) => { g.parser.json.scene = 72; },
    (g: any) => { g.parser.json.scenes[77].extras.counterNode = 1348; },
    (g: any) => { g.parser.json.scenes[76].extras.residualResolution = 'RESOLVED'; },
    (g: any) => { g.parser.json.nodes[1348].mesh = 610; },
  ]) {
    const { gltf } = fixture(true); alter(gltf);
    expect(() => selectD1FCombinedWallWorkTestScene(gltf, D1F_COMBINED_WALL_VARIANTS[0], measuredId))
      .toThrow('D1F_COMBINED_WALL_CONTRACT_REJECTED');
  }
});

test('counter must remain visible, unique and attached to selected architecture root', () => {
  for (const alter of [
    (c: any) => { c.counter.visible = false; },
    (c: any) => { c.root.children.pop(); c.wall.children.push(c.counter); },
    (c: any) => { c.root.children.push(structuredClone(c.counter)); },
    (c: any) => { c.counter.userData.absoluteFaceSurveyVerified = true; },
    (c: any) => { c.counter.userData.sourceHostFaceXM = 3.848; },
  ]) {
    const { gltf, components } = fixture(true); alter(components[0]);
    expect(() => selectD1FCombinedWallWorkTestScene(gltf, D1F_COMBINED_WALL_VARIANTS[0], measuredId))
      .toThrow('D1F_COMBINED_WALL_CONTRACT_REJECTED');
  }
});

// A public, in-memory GLB with the same structural contract, not private model
// bytes. The real npm loader supplies runtime names and Object3D ownership.
function loaderFixture(bytes?: number, measuredCounter = false, finished = false, corrections = false) {
  const { gltf, components } = fixture(measuredCounter, finished, corrections);
  const json: any = structuredClone(gltf.parser.json);
  json.asset = { version: '2.0' };
  json.scene = corrections ? 84 : finished ? 80 : measuredCounter ? 76 : 68;
  json.buffers = [{ byteLength: 36 }];
  json.bufferViews = [{ buffer: 0, byteOffset: 0, byteLength: 36 }];
  json.accessors = [{ bufferView: 0, componentType: 5126, count: 3, type: 'VEC3',
    min: [0, 0, 0], max: [1, 1, 0] }];
  json.meshes = Array.from({ length: corrections ? 617 : measuredCounter ? 612 : 407 }, () => ({ primitives: [{ attributes: { POSITION: 0 } }] }));
  const add = (o: any): number => {
    const index = json.nodes.length;
    json.nodes.push({ name: o.name, extras: o.userData,
      ...(o.position ? { translation: [o.position.x, o.position.y, o.position.z] } : {}),
      ...(o.userData.logicalFixtureId ? { mesh: corrections ? 616 : 611 } :
        o.userData.sourceNodeIndex === 798 || o.userData.independentlyAddressableCorner ? { mesh: 0 } : {}) });
    if (o.children?.length) json.nodes[index].children = o.children.map(add);
    return index;
  };
  components.forEach((component: any, i: number) => {
    const rootId = add(component.root);
    const scene = json.scenes[(corrections ? 84 : finished ? 80 : measuredCounter ? 76 : 68) + i];
    scene.nodes = [rootId];
    if (measuredCounter) {
      const counterId = json.nodes[rootId].children.find((n: number) => json.nodes[n].extras.logicalFixtureId);
      scene.extras.counterNode = counterId;
      json.nodes[rootId].extras.counterNode = counterId;
    }
  });
  const encoded = Buffer.from(JSON.stringify(json));
  const jsonLength = Math.ceil(encoded.length / 4) * 4;
  const total = bytes ?? (12 + 8 + jsonLength + 8 + 36);
  const out = Buffer.alloc(total);
  out.write('glTF', 0); out.writeUInt32LE(2, 4); out.writeUInt32LE(total, 8);
  out.writeUInt32LE(jsonLength, 12); out.writeUInt32LE(0x4e4f534a, 16);
  out.fill(0x20, 20, 20 + jsonLength); encoded.copy(out, 20);
  out.writeUInt32LE(total - 28 - jsonLength, 20 + jsonLength);
  out.writeUInt32LE(0x004e4942, 24 + jsonLength);
  new Uint8Array(out.buffer, out.byteOffset + 28 + jsonLength, 36)
    .set(new Uint8Array(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]).buffer));
  return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength);
}

test('real GLTFLoader names select all four scenes without accepting arbitrary aliases', async () => {
  const gltf = await new GLTFLoader().parseAsync(loaderFixture(), '');
  for (const variant of D1F_COMBINED_WALL_VARIANTS) {
    const result = selectD1FCombinedWallWorkTestScene(gltf, variant);
    expect(result.scene.isObject3D).toBe(true);
    expect(result.scene.name).toBe(gltf.parser.json.scenes[D1F_COMBINED_WALL_VARIANTS.indexOf(variant) + 68].name.replace(/\s/g, '_'));
    expect(result.wall.isMesh).toBe(true);
    expect(result.corners).toHaveLength(3);
  }
  gltf.scenes[68].name += '_unapproved';
  expect(() => selectD1FCombinedWallWorkTestScene(gltf, D1F_COMBINED_WALL_VARIANTS[0]))
    .toThrow('scene name, root, or source provenance');
});

test('real loader entry authenticates new source and selects measured counter alternatives', async () => {
  const asset = D1F_COMBINED_WALL_ASSETS[measuredId];
  const buffer = loaderFixture(asset.bytes, true);
  for (const [i, variant] of D1F_COMBINED_WALL_VARIANTS.entries()) {
    const result = await loadD1FCombinedWallReview({
      candidate: { id: measuredId, path: '/private-model/work-test/' + measuredId + '.glb' },
      search: '?review=' + measuredId + '-review&wallVariant=' + variant,
      loader: new GLTFLoader(),
      fetcher: async (path: any) => ({ status: 200, redirected: false,
        url: 'https://aapopihkala.fi' + path, arrayBuffer: async () => buffer }) as any,
      digest: async () => Uint8Array.from(Buffer.from(asset.sha256, 'hex')).buffer,
    });
    expect(result.selected.sceneIndex).toBe(76 + i);
    expect(result.gltf.scene).toBe(result.selected.scene);
    expect(result.selected.counter.isMesh).toBe(true);
    expect(result.selected.corners).toHaveLength(3);
    expect(result.rawGlbByteIdentityVerified).toBe(true);
    expect(result.selected.productionRenderedRoisVerified).toBe(false);
  }
  expect(isD1FCombinedWallReviewRequested('?review=' + measuredId + '-review')).toBe(true);
});

test('viewer entry checks review, size, SHA and complete body before real parsing', async () => {
  const id = 'd1f-combined-wall-115-100-20261013';
  const asset = D1F_COMBINED_WALL_ASSETS[id];
  const candidate = { id, path: '/private-model/work-test/' + id + '.glb' };
  const search = '?review=' + id + '-review&wallVariant=EAST_ANCHOR_740_895_725';
  const buffer = loaderFixture(asset.bytes);
  let parses = 0;
  const engine = new GLTFLoader();
  const loader = { parseAsync: (body: ArrayBuffer, path: string) => {
    parses++; return engine.parseAsync(body, path);
  } };
  const fetcher: any = async (path: string, init: RequestInit) => {
    expect(init.redirect).toBe('error'); expect(init.credentials).toBe('same-origin');
    return { status: 200, redirected: false, url: 'https://aapopihkala.fi' + path,
      arrayBuffer: async () => buffer };
  };
  // Only the fixture digest is injected. Exact private raw assets were tested
  // separately with real crypto and this very entry/GLTFLoader implementation.
  const digest = async () => Uint8Array.from(Buffer.from(asset.sha256, 'hex')).buffer;
  const result = await loadD1FCombinedWallReview({ candidate, search, loader, fetcher, digest });
  expect(parses).toBe(1);
  expect(result.selected.variant).toBe('EAST_ANCHOR_740_895_725');
  expect(result.gltf.scene).toBe(result.selected.scene);
  expect(result.rawGlbByteIdentityVerified).toBe(true);
  await expect(loadD1FCombinedWallReview({ candidate, search, loader, fetcher,
    digest: async () => new ArrayBuffer(32) })).rejects.toThrow('raw GLB SHA256');
  await expect(loadD1FCombinedWallReview({ candidate, search, loader, digest,
    fetcher: async () => ({ status: 200, redirected: false,
      url: 'https://aapopihkala.fi' + candidate.path,
      arrayBuffer: async () => new ArrayBuffer(1) }) as any })).rejects.toThrow('raw GLB byte length');
  await expect(loadD1FCombinedWallReview({ candidate, search: search + 'WRONG',
    loader, fetcher, digest })).rejects.toThrow('exact review, variant, or fetch configuration');
  expect(parses).toBe(1);
  expect(isD1FCombinedWallReviewRequested('?review=' + id + '-review')).toBe(true);
  expect(isD1FCombinedWallReviewRequested('?review=p137e-d1f-three-wall-mounted-themos-review')).toBe(false);
});

test('stalled source body is bounded and never reaches GLTFLoader', async () => {
  const id = 'd1f-combined-wall-115-100-20261013'; let parses = 0;
  await expect(loadD1FCombinedWallReview({
    candidate: { id, path: '/private-model/work-test/' + id + '.glb' },
    search: '?review=' + id + '-review', timeoutMs: 5,
    loader: { parseAsync: async () => { parses++; return {}; } },
    fetcher: async (path: any) => ({ status: 200, redirected: false,
      url: 'https://aapopihkala.fi' + path,
      arrayBuffer: () => new Promise(() => {}) }) as any,
  })).rejects.toThrow('D1F_COMBINED_WALL_FETCH_TIMEOUT');
  expect(parses).toBe(0);
});

for (const id of ['d1f-combined-wall-115-100-20261013', measuredId, finishedId, correctedId] as const) {
test('actual viewer load callsite uses verified scene for ' + id, async () => {
  const source = readFileSync('src/pages/private-model/index.astro', 'utf8');
  const start = source.indexOf('const loadWorkTestCandidate = async');
  const stop = source.indexOf("loadFailurePhase = 'review-runtime-failed';", start);
  expect(start).toBeGreaterThan(0); expect(stop).toBeGreaterThan(start);
  const prefix = source.slice(start, stop)
    .replace(': WorkTestCandidate', '').replace(': WorkTestLoadFailurePhase', '');
  const candidate = { id, path: '/private-model/work-test/' + id + '.glb' };
  const asset = D1F_COMBINED_WALL_ASSETS[id];
  let genericLoads = 0;
  class CheckedLoader extends GLTFLoader {
    async loadAsync(): Promise<any> { genericLoads++; throw new Error('unverified loader used'); }
  }
  const selected = await vm.runInNewContext(
    prefix + 'return { gltf, combinedWallReview }; } catch (error) { throw error; } }; loadWorkTestCandidate(candidate);',
    {
      candidate, canvas: { dataset: {} }, status: {}, p137ePlaceToolButton: {},
      clearP137EPlaceDraft() {}, setViewerToolMode() {}, GLTFLoader: CheckedLoader,
      p137eScene67CandidateId: 'p137e-d1f-three-wall-mounted-themos',
      isP137EScene67ReviewRequested: () => false,
      window: { location: { search: '?review=' + id + '-review' } },
      isD1FCombinedWallReviewRequested,
      loadD1FServiceModel,
      loadD1FCombinedWallReview: (options: any) => loadD1FCombinedWallReview({
        ...options,
        fetcher: async (path: string) => ({ status: 200, redirected: false,
          url: 'https://aapopihkala.fi' + path,
          arrayBuffer: async () => loaderFixture(asset.bytes, id !== 'd1f-combined-wall-115-100-20261013', id === finishedId || id === correctedId, id === correctedId) }) as any,
        digest: async () => Uint8Array.from(Buffer.from(asset.sha256, 'hex')).buffer,
      }),
    },
  );
  expect(genericLoads).toBe(0);
  expect(selected.gltf.scene).toBe(selected.combinedWallReview.selected.scene);
  expect(selected.combinedWallReview.selected.corners).toHaveLength(3);
  if (id === measuredId || id === finishedId || id === correctedId) expect(selected.combinedWallReview.selected.counter.isMesh).toBe(true);
  if (id === finishedId || id === correctedId) expect(selected.combinedWallReview.selected.counter.material.opacity).toBe(.8);
});
}

test('actual startup marks autoload only after a successful loader return', async () => {
  const source = readFileSync('src/pages/private-model/index.astro', 'utf8');
  const start = source.indexOf('const loaded = await loadWorkTestCandidate(reviewCandidate);');
  const last = 'else delete canvas.dataset.workTestReviewAutoload;';
  const end = source.indexOf(last, start);
  expect(start).toBeGreaterThan(0); expect(end).toBeGreaterThan(start);
  const actual = source.slice(start, end + last.length);
  for (const result of [true, false]) {
    const canvas: any = { dataset: { workTestReviewAutoload: 'true' } };
    await vm.runInNewContext('(async () => {' + actual + '})()', {
      canvas, reviewCandidate: {}, loadWorkTestCandidate: async () => result,
    });
    expect(canvas.dataset.workTestReviewAutoload).toBe(result ? 'true' : undefined);
  }
});



// The public fixture exercises the actual npm loader without committing private GLB bytes.
test('finished-face profile loads all four source-bound scenes80..83, including EAST counter translation', async () => {
  const asset = D1F_COMBINED_WALL_ASSETS[finishedId];
  const gltf = await new GLTFLoader().parseAsync(loaderFixture(undefined, true, true), '');
  for (const [i, variant] of D1F_COMBINED_WALL_VARIANTS.entries()) {
    const result = selectD1FCombinedWallWorkTestScene(gltf, variant, finishedId);
    expect(result.sceneIndex).toBe(80 + i);
    expect(result.counter.position.x).toBe(variant.startsWith('WEST_') ? 0 : .018);
    expect(result).toMatchObject({ absolutePhysicalXYVerified: false,
      productionRenderedRoisVerified: false, humanReview: 'NOT_RUN' });
  }
  expect(asset).toMatchObject({ bytes: 3654796, finishedFaces2360: true });
  expect(() => selectD1FCombinedWallWorkTestScene(gltf, D1F_COMBINED_WALL_VARIANTS[0], measuredId)).toThrow();
});

test('finished-face profile rejects inherited old roots, false width or physical approval, and misplaced counter', () => {
  for (const alter of [
    (g: any) => { g.parser.json.scenes[80].extras.parentMeasuredCounterScene = 75; },
    (g: any) => { g.parser.json.scenes[80].extras.workingFinishedFacesXM = [3.888, 6.266]; },
    (g: any) => { g.parser.json.nodes[1357].extras.physicalFinishedFaceVerified = true; },
    (g: any) => { g.parser.json.nodes[1363].translation = [0,0,0]; },
    (g: any, c: any[]) => { c[0].counter.position.x = .018; },
    (g: any, c: any[]) => { c[0].wall.userData.physicalWidthAnchorResolved = true; },
  ]) {
    const { gltf, components } = fixture(true, true); alter(gltf, components);
    expect(() => selectD1FCombinedWallWorkTestScene(gltf, D1F_COMBINED_WALL_VARIANTS[0], finishedId)).toThrow();
  }
});

test('actual verified loader gives the finished counter 80 percent review opacity without changing source or other scenes', async () => {
  for (const id of [measuredId, finishedId, correctedId] as const) {
    const asset = D1F_COMBINED_WALL_ASSETS[id];
    const buffer = loaderFixture(asset.bytes, true, id === finishedId || id === correctedId, id === correctedId);
    for (const [i, variant] of D1F_COMBINED_WALL_VARIANTS.entries()) {
      let parsed: any, sourceMaterial: any, sourceGeometry: any, sourcePosition: number[];
      let otherCounter: any, otherMaterial: any;
      const result = await loadD1FCombinedWallReview({
        candidate: { id, path: '/private-model/work-test/' + id + '.glb' },
        search: '?review=' + id + '-review&wallVariant=' + variant,
        loader: { parseAsync: async (body: ArrayBuffer, path: string) => {
          parsed = await new GLTFLoader().parseAsync(body, path);
          const selected = selectD1FCombinedWallWorkTestScene(parsed, variant, id);
          sourceMaterial = selected.counter.material;
          sourceGeometry = selected.counter.geometry;
          sourcePosition = selected.counter.position.toArray();
          otherCounter = selectD1FCombinedWallWorkTestScene(parsed,
            D1F_COMBINED_WALL_VARIANTS[(i + 1) % 4], id).counter;
          otherMaterial = otherCounter.material;
          return parsed;
        } },
        fetcher: async (path: any) => ({ status: 200, redirected: false,
          url: 'https://aapopihkala.fi' + path, arrayBuffer: async () => buffer }) as any,
        digest: async () => Uint8Array.from(Buffer.from(asset.sha256, 'hex')).buffer,
      });
      const counter = result.selected.counter;
      expect(counter.material.opacity).toBe(id === finishedId || id === correctedId ? .8 : 1);
      if (id === finishedId || id === correctedId) {
        expect(counter.material).not.toBe(sourceMaterial);
        expect(counter.material.transparent).toBe(true);
        expect(counter.material.depthWrite).toBe(false);
      } else {
        expect(counter.material).toBe(sourceMaterial);
      }
      expect(sourceMaterial.opacity).toBe(1);
      expect(otherCounter.material).toBe(otherMaterial);
      expect(otherMaterial.opacity).toBe(1);
      expect(counter.geometry).toBe(sourceGeometry);
      expect(counter.position.toArray()).toEqual(sourcePosition!);
      expect(result.gltf.scene).toBe(result.selected.scene);
      expect(result.selected).toMatchObject({ workTestOnly: true,
        absolutePhysicalXYVerified: false, productionRenderedRoisVerified: false,
        humanReview: 'NOT_RUN' });
    }
  }
});


test('four-correction profile selects scenes84..87 and rejects restored visual room footprints',()=>{
  const f=fixture(true,true,true);
  for(const [i,variant] of D1F_COMBINED_WALL_VARIANTS.entries())
    expect(selectD1FCombinedWallWorkTestScene(f.gltf,variant,correctedId).sceneIndex).toBe(84+i);
  f.components[0].root.children.push(object('ROOM_FLOOR',{representationKind:'referenceFootprint'}));
  expect(()=>selectD1FCombinedWallWorkTestScene(f.gltf,D1F_COMBINED_WALL_VARIANTS[0],correctedId)).toThrow('room footprints');
});
