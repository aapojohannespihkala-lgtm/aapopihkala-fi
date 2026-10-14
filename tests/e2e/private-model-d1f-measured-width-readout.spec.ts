import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
// @ts-ignore - read-only indexed WORK_TEST geometry comparison.
import { getD1FMeasuredWidthComparison } from '../../src/scripts/privateModelD1FMeasuredWidthReadout.mjs';
// @ts-ignore - established exact candidate source contract.
import { D1F_COMBINED_WALL_ASSETS } from '../../src/scripts/privateModelD1FCombinedWallSceneContract.mjs';

const id = 'd1f-measured-wall-140-100-2350-b710-basin-20261014';
const sourceSha = D1F_COMBINED_WALL_ASSETS[id].sha256;

const finishedId = 'd1f-finished-face-2360-wall-basin-20261014';
function fixture(finished = false, west = true) {
  const count = finished && west ? 256 : 240;
  const positions = new Float32Array(count * 3);
  for (let i = 64; i < 72; i++) positions[i * 3] = i % 2 ? 6.346 : 6.266;
  for (let i = 200; i < 240; i++) positions[i * 3] = i % 2 ? 3.888 : 3.788;
  const position = {
    count, itemSize: 3,
    getX: (i: number) => positions[i * 3],
    getY: (i: number) => positions[i * 3 + 1],
    getZ: (i: number) => positions[i * 3 + 2],
  };
  const primitive = (count: number, start: number, vertices: number) => {
    const indices = Array.from({ length: count }, (_, i) => start + i % vertices);
    return {
      isMesh: true, visible: true, indices,
      geometry: {
        getAttribute: () => position,
        getIndex: () => ({ count: indices.length, getX: (i: number) => indices[i] }),
      },
    };
  };
  if (finished && !west) for (let i=200;i<240;i++) positions[i*3] += .018;
  if (finished && west) for (let i=240;i<256;i++) positions[i*3] = i%2 ? 6.348 : 6.248;
  const context = primitive(finished && west ? 576 : 612,64,8);
  const changed = primitive(finished && west ? 480 : 396,200,finished && west ? 56 : 40);
  const wall = {
    visible: true, userData: { sourceNodeIndex: 798 },
    matrixWorld: { elements: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] },
    children: [context, changed],
  };
  const selected = { workTestOnly: true, absolutePhysicalXYVerified: false,
    humanReview: 'NOT_RUN', variant:west ? 'WEST_ANCHOR_725_895_740' : 'EAST_ANCHOR_725_895_740', wall };
  return { positions, context, changed, selected, options: {
    candidateId: finished ? finishedId : id, sourceSha: finished ? D1F_COMBINED_WALL_ASSETS[finishedId].sha256 : sourceSha, rawGlbByteIdentityVerified: true, selected,
  } };
}

test('compares indexed inner faces with the independent field width, without changing geometry', () => {
  const f = fixture();
  const before = Array.from(f.positions);
  const indices = [...f.changed.indices];
  const result = getD1FMeasuredWidthComparison(f.options);
  expect(result).toMatchObject({ sourceWidthMm: 2378, fieldWidthMm: 2360,
    residualMm: 18, bindingStatus: 'SOURCE_FIELD_BINDING_OPEN',
    absolutePhysicalXYVerified: false, humanReview: 'NOT_RUN' });
  expect(result?.label).toContain('mallissa 2378 mm, mitattu 2360 mm, ero +18 mm');
  expect(Array.from(f.positions)).toEqual(before);
  expect(f.changed.indices).toEqual(indices);
});

test('reads actual face coordinates instead of returning the cached 18mm residual', () => {
  const f = fixture();
  for (let i = 200; i < 240; i++) f.positions[i * 3] += 0.01;
  expect(getD1FMeasuredWidthComparison(f.options)).toMatchObject({
    sourceWidthMm: 2368, fieldWidthMm: 2360, residualMm: 8,
  });
});

test('unindexed retained faces, hidden or duplicate primitives do not yield a dimension', () => {
  const missing = fixture();
  missing.changed.indices.splice(0, missing.changed.indices.length,
    ...missing.changed.indices.map(i => i === 239 ? 200 : i));
  expect(getD1FMeasuredWidthComparison(missing.options)).toBeNull();
  const hidden = fixture();
  hidden.context.visible = false;
  expect(getD1FMeasuredWidthComparison(hidden.options)).toBeNull();
  const duplicate = fixture();
  duplicate.selected.wall.children.push(duplicate.context);
  expect(getD1FMeasuredWidthComparison(duplicate.options)).toBeNull();
});

test('wrong source, unauthenticated bytes and promoted physical state remain unsupported', () => {
  const f = fixture();
  expect(getD1FMeasuredWidthComparison({ ...f.options, sourceSha: '0'.repeat(64) })).toBeNull();
  expect(getD1FMeasuredWidthComparison({ ...f.options, candidateId: 'other' })).toBeNull();
  expect(getD1FMeasuredWidthComparison({ ...f.options, rawGlbByteIdentityVerified: false })).toBeNull();
  f.selected.absolutePhysicalXYVerified = true;
  expect(getD1FMeasuredWidthComparison(f.options)).toBeNull();
});

test('nonfinite faces and changes to the metre scale never display plausible-looking numbers', () => {
  const invalid = fixture();
  invalid.positions[64 * 3] = Infinity;
  expect(getD1FMeasuredWidthComparison(invalid.options)).toBeNull();
  const scaled = fixture();
  scaled.selected.wall.matrixWorld.elements[0] = 2;
  expect(getD1FMeasuredWidthComparison(scaled.options)).toBeNull();
});

const viewer = readFileSync('src/pages/private-model/index.astro', 'utf8');
const start = viewer.indexOf('            const measuredWidth = getD1FMeasuredWidthComparison({');
const end = viewer.indexOf("          } else if (isP137EScene67Review)", start);

test('the actual viewer callsite renders the computed comparison and keeps machine-readable fields', () => {
  expect(start).toBeGreaterThan(0);
  expect(end).toBeGreaterThan(start);
  expect(viewer).toContain("from '../../scripts/privateModelD1FMeasuredWidthReadout.mjs'");
  const f = fixture();
  const status = { textContent: '' };
  const canvas = { dataset: {} as Record<string, string> };
  const context = createContext({ getD1FMeasuredWidthComparison, candidate: { id },
    combinedWallReview: { selected: f.selected, asset: { sha256: sourceSha },
      rawGlbByteIdentityVerified: true }, status, canvas });
  runInContext(viewer.slice(start, end), context);
  expect(status.textContent).toContain('mallissa 2378 mm, mitattu 2360 mm, ero +18 mm');
  expect(canvas.dataset).toMatchObject({ d1fCombinedWallSourceWidthMm: '2378',
    d1fCombinedWallFieldWidthMm: '2360', d1fCombinedWallWidthResidualMm: '18',
    d1fCombinedWallWidthBinding: 'SOURCE_FIELD_BINDING_OPEN' });
});

test('the actual viewer callsite retains the original status for other models and missing source proof', () => {
  const f = fixture();
  for (const [candidateId, verified] of [['other', true], [id, false]] as const) {
    const status = { textContent: '' };
    const canvas = { dataset: {} as Record<string, string> };
    runInContext(viewer.slice(start, end), createContext({ getD1FMeasuredWidthComparison,
      candidate: { id: candidateId }, combinedWallReview: { selected: f.selected,
        asset: { sha256: sourceSha }, rawGlbByteIdentityVerified: verified }, status, canvas }));
    expect(status.textContent).toBe('Seinien yhteinen työversio - mittojen sijoitus vielä tarkistamatta');
    expect(canvas.dataset).toEqual({});
  }
});

for (const west of [true,false]) test('finished-face '+(west?'WEST':'EAST')+' displays zero residual from its actual indexed faces', () => {
  const f=fixture(true,west);
  const result=getD1FMeasuredWidthComparison(f.options);
  expect(result).toMatchObject({sourceWidthMm:2360,fieldWidthMm:2360,residualMm:0,
    bindingStatus:'WORK_GEOMETRY_MATCH_FIELD_PHYSICAL_ANCHOR_OPEN',absolutePhysicalXYVerified:false});
  const status={textContent:''},canvas={dataset:{}};
  runInContext(viewer.slice(start,end),createContext({getD1FMeasuredWidthComparison,
    candidate:{id:finishedId},combinedWallReview:{selected:f.selected,
      asset:{sha256:f.options.sourceSha},rawGlbByteIdentityVerified:true},status,canvas}));
  expect(status.textContent).toContain('mallissa 2360 mm, mitattu 2360 mm, ero 0 mm');
});
test('WEST finished readout ignores retained old D/C vertices but rejects a missing new indexed face', () => {
  const f=fixture(true,true); f.positions[64*3]=999;
  expect(getD1FMeasuredWidthComparison(f.options)?.sourceWidthMm).toBe(2360);
  f.changed.indices.splice(0,f.changed.indices.length,...f.changed.indices.map(i=>i===255?200:i));
  expect(getD1FMeasuredWidthComparison(f.options)).toBeNull();
});
