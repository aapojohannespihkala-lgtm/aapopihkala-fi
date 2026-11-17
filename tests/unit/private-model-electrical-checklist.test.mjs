import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  matchElectricalRule, collectElectricalPoints, parseChecklistState, decide, addMissing, removeAdded,
  checklistSummary, formatChecklistReport, loadChecklistState, saveChecklistState, CHECKLIST_STORAGE_KEY,
} from '../../src/scripts/privateModelElectricalChecklist.mjs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('source names map to stable electrical point IDs', () => {
  const cases = {
    'D1F-PR-10_OWNER2026_PLAN_XY_PIN_HOST_HOLD_PR08_SC326': ['1F-PR-10', 'SOCKET'],
    'D1F_PR03_SCHEMATIC_FACEPLATE_PR02_HOSTED_332_333': ['1F-PR-03', 'SOCKET'],
    'D1F_PRV4_PR0607_FACE_HOST_SC334_335_ROOT': null,
    'K04_WALLHOST_D2F-SW-03_PLATE_SOURCE_MESH_COW_WORK_TEST': ['2F-SW-03', 'SWITCH'],
    'D1F-SW-01_FACEPLATE_SCHEMATIC_FROM_GREEN_MARK': ['1F-SW-01', 'SWITCH'],
    'K02_SMALL_GREY_LED24_GRID_ACCEPTED_1F_P08_TRIM_WORK_TEST_HOST_HOLD': ['1F-ALASVALO-P08', 'LIGHT'],
    'OWNER_2F-CP-07_SOCKET_INSET_APPROX_WORK_TEST': ['2F-CP-07', 'CEILING_SOCKET'],
    'MJ46_SOURCE_MESH_JUNISTAR_LED09_SUBMESH_4_WORK_TEST': ['1F-KPH-LED09', 'LIGHT'],
    'V55_ALL7_TOSHIBA_R1_COW_JOIN02_LOCAL_ALL7_WALLFACE_JOIN02_PHOTO24_R1_WALL_LAMP_NECK_2__PHOTO_PO': ['2F-SEINAVALAISIN-2', 'LIGHT'],
    'N_P185C_X2_BOARD_N_RK_INTERFACE_ENCLOSURE_ESSV34536_PLAN': ['SAHKOKESKUS', 'BOARD'],
    'N_P185C_X2_BOARD_N_OPEN_CIRCUIT_16_2': null,
    'PA2_BOTH_HOT_REAL_MESH_JOINT_20261114_WORK_TEST': null,
    'OWNER_2F-SM-02_SMOKE_DETECTOR_PROXY_MOVED_FROM_H30_11433_WORK_TEST': ['2F-PALOVAROITIN-02', 'SMOKE'],
    'C80_620R14_2F-PR-PEILIKAAPPI_SOCKET_INSIDE_WC_MIRROR_CABINET_WORK_TEST': ['2F-PR-PEILIKAAPPI', 'SOCKET'],
    'C80_620R14_BALCONY_HEAT_LAMP_LOOSE_CORD_TO_2F_OUTDOOR_SOCKET_WORK_TEST': ['2F-PARVEKE-JOHTO', 'OTHER'],
    'C80R2_D2F_BALCONY_LAMP_HEATER_ONLY_WORK_TEST': ['2F-PARVEKE-LAMPOVALAISIN', 'LIGHT'],
  };
  for (const [name, expected] of Object.entries(cases)) {
    const hit = matchElectricalRule(name);
    assert.deepEqual(hit ? [hit.id, hit.kind] : null, expected, name);
  }
});

const node = (name, children = [], mesh = false, bounds = null) => {
  const n = { name, isMesh: mesh, bounds, children, parent: null,
    traverse(fn) { fn(this); for (const c of this.children) c.traverse(fn); } };
  for (const c of children) c.parent = n;
  return n;
};
const box = (x, y, z, s = 0.04) => ({ min: { x: x - s, y: y - s, z: z - s }, max: { x: x + s, y: y + s, z: z + s } });

test('points are grouped per fixture and converted to YLIS G1 (X, -z, y)', () => {
  const root = node('scene', [
    node('D1F_PR03_OWNER_PAIR_SAUNA_PARTITION_FACE_ROOT_WORK_TEST', [
      node('D1F_PR03_SCHEMATIC_FACEPLATE', [], true, box(3.9, 0.3, -1.0)),
      node('D1F_PR03_SCHEMATIC_CONTACTS', [], true, box(3.92, 0.3, -1.0)),
    ]),
    node('D1F_PRV4_PR0607_FACE_HOST_SC334_335_ROOT', [
      node('D1F-PR-10_OWNER2026_PLAN_XY_PIN_HOST_HOLD', [], true, box(3.91, 1.5, -3.98)),
    ]),
    node('K02_SMALL_GREY_LED24_GRID_ACCEPTED_2F_P01_CENTER', [], true, box(0.57, 5.26, -0.59)),
    node('OWNER_SOMETHING_ELSE', [], true, box(1, 1, 1)),
  ]);
  const items = collectElectricalPoints(root, o => o.bounds);
  assert.deepEqual(items.map(i => i.id), ['1F-PR-03', '1F-PR-10', '2F-ALASVALO-P01']);
  const pr03 = items[0];
  assert.equal(pr03.meshCount, 2);
  assert.ok(Math.abs(pr03.xM - 3.91) < 1e-9 && Math.abs(pr03.yM - 1.0) < 1e-9 && Math.abs(pr03.zM - 0.3) < 1e-9);
  assert.equal(items[1].note, 'suunnitelman piste ilman seinää (vihreä merkki)');
  assert.equal(items[2].floor, '2F');
  assert.deepEqual(collectElectricalPoints(null, () => null), []);
});

test('owner decisions: OK, moved with point, missing, added; malformed storage is dropped', () => {
  let state = parseChecklistState('{}');
  state = decide(state, '1F-PR-10', 'moved', { point: { xM: 3.888, yM: 3.95, zM: 0.3, surface: 'WALL' }, modelSha: 'abc', at: 't1' });
  state = decide(state, '1F-SW-01', 'ok', { at: 't2' });
  state = decide(state, '1F-PR-14', 'missing', { at: 't3' });
  state = addMissing(state, { kind: 'LIGHT', name: '  vaatehuoneen   kattovalaisin ', point: { xM: 1.66, yM: 4.11, zM: 2.43 }, at: 't4' });
  assert.throws(() => decide(state, '1F-PR-11', 'moved', {}), /CHECKLIST_POINT_REQUIRED/);
  assert.throws(() => addMissing(state, { kind: 'NOPE', point: { xM: 0, yM: 0, zM: 0 } }), /CHECKLIST_KIND/);
  assert.equal(state.added[0].name, 'vaatehuoneen kattovalaisin');
  const items = [
    { id: '1F-PR-10', kind: 'SOCKET', kindLabel: 'Pistorasia', xM: 3.91, yM: 3.98, zM: 1.5 },
    { id: '1F-PR-11', kind: 'SOCKET', kindLabel: 'Pistorasia', xM: 4.17, yM: 3.18, zM: 0.2 },
    { id: '1F-SW-01', kind: 'SWITCH', kindLabel: 'Kytkin', xM: 3.78, yM: 0.35, zM: 1.18 },
  ];
  // Counts cover the points of the current view; 1F-PR-14 is decided but not in this view.
  assert.deepEqual(checklistSummary(items, state), { ok: 1, moved: 1, missing: 0, open: 1, added: 1 });
  const report = formatChecklistReport(items, state, { modelSha: 'abc', candidate: 'cand', now: new Date('2026-11-17T18:00:00Z') });
  assert.match(report, /VÄÄRÄ PAIKKA: Pistorasia 1F-PR-10, mallissa X 3\.91 Y 3\.98 Z 1\.50 -> oikea X 3\.89 Y 3\.95 Z 0\.30 \(pinta WALL\)/);
  assert.match(report, /EI OLEMASSA: 1F-PR-14 \(ei tässä mallinäkymässä\)/);
  assert.match(report, /OK: Kytkin 1F-SW-01/);
  assert.match(report, /LISÄTTY: Valaisin "vaatehuoneen kattovalaisin" X 1\.66 Y 4\.11 Z 2\.43/);
  assert.match(report, /tarkistamatta 1/);
  // Round trip through storage, then a reset and a removed addition.
  const store = new Map();
  const storage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
  assert.equal(saveChecklistState(storage, state), true);
  assert.ok(store.has(CHECKLIST_STORAGE_KEY));
  assert.deepEqual(loadChecklistState(storage), state);
  assert.equal(Object.keys(decide(state, '1F-SW-01', null).decisions).includes('1F-SW-01'), false);
  assert.equal(removeAdded(state, 0).added.length, 0);
  const bad = parseChecklistState(JSON.stringify({ decisions: { 'x y': { status: 'ok' }, 'A-1': { status: 'moved' },
    'A-2': { status: 'weird' }, 'A-3': { status: 'ok' } }, added: [{ kind: 'LIGHT', point: { xM: 'a' } }] }));
  assert.deepEqual(Object.keys(bad.decisions), ['A-3']);
  assert.equal(bad.added.length, 0);
  assert.deepEqual(parseChecklistState('not json'), { decisions: {}, added: [] });
  assert.deepEqual(loadChecklistState({ getItem() { throw new Error('denied'); } }), { decisions: {}, added: [] });
});

test('viewer wires the checklist into the point-in-model panel', () => {
  const index = read('../../src/pages/private-model/index.astro');
  for (const id of ['electrical-checklist', 'electrical-checklist-list', 'ec-ok', 'ec-move', 'ec-missing',
    'ec-add', 'ec-copy']) assert.ok(index.includes(`id="${id}"`), id);
  assert.ok(index.includes("from '../../scripts/privateModelElectricalChecklist.mjs'"));
  assert.ok(index.includes('electricalChecklistOnPick?.(point)'));
});
