import { expect, test } from '@playwright/test';
// @ts-ignore - isolated browser-compatible source GLB builder.
import {
  makeP137EFieldMeasuredWallWorkTest,
  P137E_MEASURED_WALL_METRICS_MM,
  P137E_MEASURED_WALL_REVIEW_ROOT,
  P137E_MEASURED_WALL_SCENE_INDEX,
} from '../../src/scripts/privateModelP137EFieldMeasuredWallRuntime.mjs';

const encodeOriginalSyntheticScene67 = () => {
  const positions = new Float32Array(176 * 3);
  const segment: [number, number, number][] = [
    [5.098, 4.286, 0], [6.306, 4.286, 0],
    [6.306, 4.206, 0], [5.098, 4.206, 0],
    [5.098, 4.286, 2.76], [6.306, 4.286, 2.76],
    [6.306, 4.206, 2.76], [5.098, 4.206, 2.76],
  ];
  segment.forEach((row, index) => positions.set(row, (128 + index) * 3));
  const scenes: any[] = Array.from({ length: 68 }, () => ({ nodes: [] }));
  scenes[67] = { nodes: [1107], name: 'P137E source 67' };
  const nodes: any[] = Array.from({ length: 1108 }, () => ({}));
  nodes[798] = { mesh: 406 };
  nodes[1106] = { mesh: 406, name: 'original wall' };
  nodes[1107] = { name: 'focused root', children: [1106, 1091, 1096, 1101] };
  for (const i of [1091, 1096, 1101]) nodes[i] = { name: 'Themo ' + i };
  const meshes: any[] = Array.from({ length: 555 }, () => ({ primitives: [] }));
  meshes[406] = { name: 'source wall', primitives: [{ attributes: { POSITION: 0 } }] };
  const document = {
    asset: { version: '2.0' }, scene: 67, scenes, nodes, meshes,
    accessors: [{ bufferView: 0, count: 176, componentType: 5126, type: 'VEC3' }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: positions.byteLength }],
    buffers: [{ byteLength: positions.byteLength }],
  };
  const json = new TextEncoder().encode(JSON.stringify(document));
  const jsonAligned = (json.length + 3) & ~3;
  const out = new ArrayBuffer(12 + 8 + jsonAligned + 8 + positions.byteLength);
  const view = new DataView(out);
  const bytes = new Uint8Array(out);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, out.byteLength, true);
  view.setUint32(12, jsonAligned, true);
  view.setUint32(16, 0x4e4f534a, true);
  bytes.fill(32, 20, 20 + jsonAligned);
  bytes.set(json, 20);
  view.setUint32(20 + jsonAligned, positions.byteLength, true);
  view.setUint32(24 + jsonAligned, 0x004e4942, true);
  bytes.set(new Uint8Array(positions.buffer), 28 + jsonAligned);
  return out;
};

const parse = (source: ArrayBuffer) => {
  const view = new DataView(source);
  const jsonLength = view.getUint32(12, true);
  const json = JSON.parse(new TextDecoder().decode(new Uint8Array(source, 20, jsonLength)));
  const bin = new Uint8Array(source, 28 + jsonLength);
  return { json, bin };
};

test('D1F I03 field-wall successor preserves all original source while adding only measured scene68', () => {
  const source = encodeOriginalSyntheticScene67();
  const parent = parse(source);
  const output = makeP137EFieldMeasuredWallWorkTest(source);
  const next = parse(output);
  expect(P137E_MEASURED_WALL_METRICS_MM).toEqual({
    kphSideLength: 960, wcSideVisible: 710, thickness: 205, lobbyClearGap: 1020,
  });
  for (const key of ['nodes','meshes','scenes'] as const) {
    expect(next.json[key].slice(0, parent.json[key].length)).toEqual(parent.json[key]);
  }
  expect(Array.from(next.bin.slice(0, parent.bin.length))).toEqual(Array.from(parent.bin));
  expect(next.json.scene).toBe(P137E_MEASURED_WALL_SCENE_INDEX);
  expect(next.json.scenes[68].nodes).toEqual([1109]);
  expect(next.json.nodes[1109].name).toBe(P137E_MEASURED_WALL_REVIEW_ROOT);
  expect(next.json.nodes[1109].children).toEqual([1108, 1091, 1096, 1101]);
  expect(next.json.nodes[1106].mesh).toBe(406);
  expect(next.json.nodes[1108].mesh).toBe(555);
  const a = next.json.accessors[next.json.meshes[555].primitives[0].attributes.POSITION];
  const offset = next.json.bufferViews[a.bufferView].byteOffset;
  const positions = new DataView(next.bin.buffer, next.bin.byteOffset + offset);
  const vec = (index: number) => [
    positions.getFloat32(index * 12, true),
    positions.getFloat32(index * 12 + 4, true),
    positions.getFloat32(index * 12 + 8, true),
  ];
  const updated = Array.from({ length: 8 }, (_, i) => vec(128 + i));
  expect(Math.max(...updated.map(v => v[0])) - Math.min(...updated.map(v => v[0]))).toBeCloseTo(.960, 5);
  expect(Math.max(...updated.map(v => v[1])) - Math.min(...updated.map(v => v[1]))).toBeCloseTo(.205, 5);
  expect(5.072 - Math.max(...updated.map(v => v[1]))).toBeCloseTo(1.020, 5);
  expect(next.json.meshes[555].extras.measuredFieldMM.wcSideVisible).toBe(710);
  expect(next.json.meshes[555].extras.sourceXYBinding).toBe('CONDITIONAL_UNVERIFIED');
  expect(next.json.scenes[68].extras.publishToCURRENT).toBe(false);
  expect(next.json.scenes[68].extras.HUMAN_REVIEW).toBe('NOT_RUN');
});

test('D1F I03 reconstruction fails closed on unknown source or changed original I03 bounds', () => {
  const source = encodeOriginalSyntheticScene67();
  const corrupt = source.slice(0);
  new DataView(corrupt).setUint32(8, source.byteLength - 1, true);
  expect(() => makeP137EFieldMeasuredWallWorkTest(corrupt)).toThrow(/GLB header/);

  const altered = source.slice(0);
  const sourceDoc = parse(altered);
  sourceDoc.json.nodes[1106].mesh = 444;
  const sourceLen = new DataView(altered).getUint32(12, true);
  const bytes = new TextEncoder().encode(JSON.stringify(sourceDoc.json));
  expect(bytes.byteLength).toBeLessThanOrEqual(sourceLen);
  new Uint8Array(altered).fill(32, 20, 20 + sourceLen);
  new Uint8Array(altered).set(bytes, 20);
  expect(() => makeP137EFieldMeasuredWallWorkTest(altered)).toThrow(/scene67 model identity/);
});
