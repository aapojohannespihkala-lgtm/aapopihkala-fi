/**
 * Owner checklist for electrical points (sockets, switches, lights, board) in the
 * private viewer. Owner request 17.11.2026: "pistorasiat ovat oikeilla paikoilla ...
 * yksinkertainen tarkistuslista vieweriin, johon voin vaan klikata asioita paikoilleen".
 *
 * The points are found at runtime from the loaded, already authenticated model by node
 * names, so no model coordinates are published with the site. Each point is identified
 * by a stable ID derived from its source name (e.g. 1F-PR-10), so owner decisions survive
 * new model versions. Positions are model positions (WORK_TEST), never as-built claims.
 */

export const ELECTRICAL_KINDS = Object.freeze({
  SOCKET: 'Pistorasia',
  CEILING_SOCKET: 'Kattorasia',
  SWITCH: 'Kytkin',
  LIGHT: 'Valaisin',
  BOARD: 'Sähkökeskus',
  SMOKE: 'Palovaroitin',
  OTHER: 'Muu sähköpiste',
});

const pad2 = value => String(Number(value)).padStart(2, '0');

// First matching rule of the nearest matching ancestor wins.
export const ELECTRICAL_POINT_RULES = Object.freeze([
  // Points added from the owner's checklist (C80 620R14 onwards).
  { re: /^C80_620R\d+_(1F|2F)-PR-([A-Z0-9]+)_/, kind: 'SOCKET', id: m => `${m[1]}-PR-${m[2]}`, note: 'omistajan tarkistuslistasta' },
  { re: /^C80_620R\d+_BALCONY_HEAT_LAMP_LOOSE_CORD/, kind: 'OTHER', id: () => '2F-PARVEKE-JOHTO',
    note: 'irrallinen johto lämpövalaisimelta ulkorasiaan' },
  { re: /^OWNER_(1F|2F)-SM-(\d+)_SMOKE_DETECTOR/, kind: 'SMOKE', id: m => `${m[1]}-PALOVAROITIN-${pad2(m[2])}` },
  { re: /^D1F-PR-(\d+)_OWNER2026_PLAN_XY_PIN/, kind: 'SOCKET', id: m => `1F-PR-${pad2(m[1])}`,
    note: 'suunnitelman piste ilman seinää (vihreä merkki)' },
  { re: /^D1F_PR(\d\d)_/, kind: 'SOCKET', id: m => `1F-PR-${pad2(m[1])}` },
  { re: /^D1F_TV_(?:POINT|PORT)/, kind: 'OTHER', id: () => '1F-TV', note: 'TV-piste' },
  { re: /^MJ89_C_DOUBLE_SOCKET/, kind: 'SOCKET', id: () => '1F-TUPLARASIA-MJ89', note: 'valokuvasta' },
  { re: /^D_(1F|2F)_EXTERIOR_2GANG_WEATHERPROTECTED_SOCKET/, kind: 'SOCKET', id: m => `${m[1]}-ULKOPISTORASIA` },
  { re: /^MJ72_OWNER2026_STORAGE_SOCKET/, kind: 'SOCKET', id: () => 'VARASTO-PISTORASIA' },
  { re: /^C80R2_V15_D1F_ENTRY_SMALL_CASING_FIBER_SOCKETS/, kind: 'OTHER', id: () => '1F-ETEINEN-KUITURASIA',
    note: 'kuitu/tele' },
  { re: /^OWNER_(1F|2F)-CP-(\d+)_SOCKET_INSET/, kind: 'CEILING_SOCKET', id: m => `${m[1]}-CP-${pad2(m[2])}` },
  { re: /D([12])F-SW-(\d+)_/, kind: 'SWITCH', id: m => `${m[1]}F-SW-${pad2(m[2])}` },
  { re: /^C80R2_V15_D1F_ENTRY_SWITCH/, kind: 'SWITCH', id: () => '1F-ETEINEN-KYTKIN' },
  { re: /^K02_SMALL_GREY_LED24_GRID_ACCEPTED_(1F|2F)_P(\d+)_/, kind: 'LIGHT', id: m => `${m[1]}-ALASVALO-P${pad2(m[2])}` },
  { re: /^MJ46_SOURCE_MESH_JUNISTAR_LED(\d+)_/, kind: 'LIGHT', id: m => `1F-KPH-LED${pad2(m[1])}` },
  { re: /KPH05_HELMI_LED/, kind: 'LIGHT', id: () => '1F-KPH-HELMI' },
  { re: /_WALL_LAMP_(?:SHADE|NECK|MOUNT)_(\d)_/, kind: 'LIGHT', id: m => `2F-SEINAVALAISIN-${m[1]}` },
  { re: /^K12_D_SOFFIT_LIGHT/, kind: 'LIGHT', id: () => 'RAYSTASVALAISIN' },
  { re: /^C80R2_D1F_TERRACE_CEILING_LAMP/, kind: 'LIGHT', id: () => 'TERASSIVALAISIN' },
  { re: /^C80R2_D2F_BALCONY_LAMP/, kind: 'LIGHT', id: () => '2F-PARVEKE-LAMPOVALAISIN',
    note: 'kattolamppu ja lämpösäteilijä samassa mallikappaleessa' },
  { re: /^N_P185C_X2_BOARD_N_RK_INTERFACE_ENCLOSURE/, kind: 'BOARD', id: () => 'SAHKOKESKUS' },
]);

const KIND_ORDER = ['BOARD', 'SOCKET', 'CEILING_SOCKET', 'SWITCH', 'LIGHT', 'SMOKE', 'OTHER'];
// Second-floor finished floor is at about G1 Z 2.76; everything above 2.6 m is 2F.
const FLOOR_SPLIT_Z = 2.6;

export function matchElectricalRule(name) {
  if (typeof name !== 'string' || !name) return null;
  for (const rule of ELECTRICAL_POINT_RULES) {
    const m = rule.re.exec(name);
    if (m) return { id: rule.id(m), kind: rule.kind, note: rule.note ?? null };
  }
  return null;
}

const nearestMatch = (object, root) => {
  for (let node = object; node && node !== root; node = node.parent) {
    const hit = matchElectricalRule(node.name);
    if (hit) return hit;
  }
  return null;
};

/**
 * Collect electrical points from a loaded model root.
 * boundsOf(mesh) returns world bounds {min:{x,y,z},max:{x,y,z}} (three.js Y-up world);
 * the result is in YLIS-G1-LOCAL: X = x, Y = -z, Z = y.
 */
export function collectElectricalPoints(root, boundsOf) {
  const byId = new Map();
  if (!root || typeof root.traverse !== 'function') return [];
  root.traverse(object => {
    if (!object?.isMesh) return;
    const hit = nearestMatch(object, root);
    if (!hit) return;
    const b = boundsOf(object);
    if (!b || ![b.min?.x, b.min?.y, b.min?.z, b.max?.x, b.max?.y, b.max?.z].every(Number.isFinite)) return;
    let item = byId.get(hit.id);
    if (!item) {
      item = { id: hit.id, kind: hit.kind, note: hit.note, meshCount: 0, objects: [],
        min: { x: Infinity, y: Infinity, z: Infinity }, max: { x: -Infinity, y: -Infinity, z: -Infinity } };
      byId.set(hit.id, item);
    }
    if (!item.note && hit.note) item.note = hit.note;
    item.meshCount += 1;
    item.objects.push(object);
    for (const axis of ['x', 'y', 'z']) {
      item.min[axis] = Math.min(item.min[axis], b.min[axis]);
      item.max[axis] = Math.max(item.max[axis], b.max[axis]);
    }
  });
  const items = [...byId.values()].map(item => {
    const xM = (item.min.x + item.max.x) / 2;
    const zM = (item.min.y + item.max.y) / 2;
    const yM = -(item.min.z + item.max.z) / 2;
    const prefix = /^(1F|2F)-/.exec(item.id)?.[1];
    const floor = prefix ?? (zM > FLOOR_SPLIT_Z ? '2F' : '1F');
    return Object.freeze({ id: item.id, kind: item.kind, kindLabel: ELECTRICAL_KINDS[item.kind],
      note: item.note, floor, xM, yM, zM, meshCount: item.meshCount, objects: Object.freeze(item.objects) });
  });
  items.sort((a, b) => a.floor.localeCompare(b.floor) ||
    KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || a.id.localeCompare(b.id, 'fi', { numeric: true }));
  return items;
}

// ---- Owner decisions -------------------------------------------------------

export const CHECKLIST_STORAGE_KEY = 'ylisrinne.electricalChecklist.v1';
export const CHECK_STATUS = Object.freeze({
  OK: 'ok',          // model position is right
  MOVED: 'moved',    // real position = owner-clicked point
  MISSING: 'missing',// the point does not exist
  ADDED: 'added',    // a point the model does not have
});
const STATUS_FI = { ok: 'OK', moved: 'VÄÄRÄ PAIKKA', missing: 'EI OLEMASSA', added: 'LISÄTTY' };

const validPoint = p => p && [p.xM, p.yM, p.zM].every(Number.isFinite);
const cleanText = (text, max = 120) => String(text ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

/** Parse stored state; anything malformed is dropped rather than trusted. */
export function parseChecklistState(raw) {
  let data;
  try { data = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { return { decisions: {}, added: [] }; }
  const decisions = {};
  for (const [id, d] of Object.entries(data?.decisions ?? {})) {
    if (!/^[A-Z0-9-]{2,40}$/.test(id) || !Object.values(CHECK_STATUS).includes(d?.status) || d.status === 'added') continue;
    if (d.status === 'moved' && !validPoint(d.point)) continue;
    decisions[id] = { status: d.status, at: cleanText(d.at, 40), modelSha: cleanText(d.modelSha, 64),
      ...(d.status === 'moved' ? { point: { xM: d.point.xM, yM: d.point.yM, zM: d.point.zM,
        surface: cleanText(d.point.surface) } } : {}) };
  }
  const added = (Array.isArray(data?.added) ? data.added : []).filter(a => validPoint(a?.point) && ELECTRICAL_KINDS[a.kind])
    .slice(0, 200).map(a => ({ kind: a.kind, name: cleanText(a.name, 80), at: cleanText(a.at, 40),
      modelSha: cleanText(a.modelSha, 64),
      point: { xM: a.point.xM, yM: a.point.yM, zM: a.point.zM, surface: cleanText(a.point.surface) } }));
  return { decisions, added };
}

/**
 * @param {any} state
 * @param {string} id
 * @param {string|null} status
 * @param {{point?: {xM:number, yM:number, zM:number, surface?:string}|null, modelSha?: string, at?: string}} [options]
 */
export function decide(state, id, status, { point = null, modelSha = '', at = new Date().toISOString() } = {}) {
  const next = { decisions: { ...state.decisions }, added: [...state.added] };
  if (status === null) { delete next.decisions[id]; return next; }
  if (!Object.values(CHECK_STATUS).includes(status) || status === 'added') throw new Error('CHECKLIST_STATUS');
  if (status === 'moved' && !validPoint(point)) throw new Error('CHECKLIST_POINT_REQUIRED');
  next.decisions[id] = { status, at, modelSha,
    ...(status === 'moved' ? { point: { xM: point.xM, yM: point.yM, zM: point.zM, surface: cleanText(point.surface) } } : {}) };
  return next;
}

/**
 * @param {any} state
 * @param {{kind: string, name?: string, point: {xM:number, yM:number, zM:number, surface?:string}|null, modelSha?: string, at?: string}} entry
 */
export function addMissing(state, { kind, name, point, modelSha = '', at = new Date().toISOString() }) {
  if (!ELECTRICAL_KINDS[kind]) throw new Error('CHECKLIST_KIND');
  if (!validPoint(point)) throw new Error('CHECKLIST_POINT_REQUIRED');
  return { decisions: { ...state.decisions },
    added: [...state.added, { kind, name: cleanText(name, 80), at, modelSha,
      point: { xM: point.xM, yM: point.yM, zM: point.zM, surface: cleanText(point.surface) } }] };
}

export function removeAdded(state, index) {
  return { decisions: { ...state.decisions }, added: state.added.filter((_, i) => i !== index) };
}

export function checklistSummary(items, state) {
  const counts = { ok: 0, moved: 0, missing: 0, open: 0, added: state.added.length };
  for (const item of items) {
    const status = state.decisions[item.id]?.status;
    if (status) counts[status] += 1; else counts.open += 1;
  }
  return counts;
}

const xyz = p => `X ${p.xM.toFixed(2)} Y ${p.yM.toFixed(2)} Z ${p.zM.toFixed(2)}`;

/** Plain text for the owner to paste into chat; the model work reads it from there. */
export function formatChecklistReport(items, state, { modelSha = 'UNKNOWN', candidate = '-', now = new Date() } = {}) {
  const s = checklistSummary(items, state);
  const lines = [
    'Ylisrinne 3D – sähköpisteiden tarkistus (omistajan kuittaus, koordinaatit YLIS-G1-LOCAL m)',
    `Malli: ${candidate}; GLB_SHA256: ${modelSha}; koottu ${now.toISOString()}`,
    `Yhteenveto: OK ${s.ok} · väärä paikka ${s.moved} · ei olemassa ${s.missing} · lisätty ${s.added} · tarkistamatta ${s.open}`,
  ];
  const known = new Map(items.map(i => [i.id, i]));
  const ids = Object.keys(state.decisions).sort((a, b) => a.localeCompare(b, 'fi', { numeric: true }));
  for (const status of ['moved', 'missing', 'ok']) {
    for (const id of ids) {
      const d = state.decisions[id];
      if (d.status !== status) continue;
      const item = known.get(id);
      const model = item ? `${item.kindLabel} ${id}, mallissa ${xyz(item)}` : `${id} (ei tässä mallinäkymässä)`;
      lines.push(status === 'moved'
        ? `${STATUS_FI.moved}: ${model} -> oikea ${xyz(d.point)}${d.point.surface ? ` (pinta ${d.point.surface})` : ''}`
        : `${STATUS_FI[status]}: ${model}`);
    }
  }
  for (const a of state.added) {
    lines.push(`${STATUS_FI.added}: ${ELECTRICAL_KINDS[a.kind]} "${a.name || 'nimetön'}" ${xyz(a.point)}${a.point.surface ? ` (pinta ${a.point.surface})` : ''}`);
  }
  lines.push('Varmuus: omistajan kuittaus mallin päällä, WORK_TEST; ei as-built-mittausta.');
  return lines.join('\n');
}

export function loadChecklistState(storage) {
  try { return parseChecklistState(storage?.getItem(CHECKLIST_STORAGE_KEY) ?? '{}'); }
  catch { return { decisions: {}, added: [] }; }
}

export function saveChecklistState(storage, state) {
  try { storage?.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(state)); return true; }
  catch { return false; }
}
