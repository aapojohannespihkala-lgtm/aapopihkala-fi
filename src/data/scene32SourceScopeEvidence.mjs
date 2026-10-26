/**
 * Source-only evidence for the 142 new active meshes in K16a scene32.
 *
 * This is NOT a viewer data feed. Indices are valid only for the recorded
 * scene32 ZIP SHA. They are not objectKeys and must never be used to patch
 * another GLB by index without matching its bytes and source provenance.
 *
 * Source: Ylisrinne D-view task, 2026-10-26, "PAKETTI 2 - SCENE32:N
 * UUSIEN 142 OSAN LÄHDEANKKUROITU NÄKYMÄLUOKITUS".
 */
export const evidenceAnchors = Object.freeze({
  sourceDoc: '1HcXB0hCXCMgvHULlyu0J7_LVPfN_7YGEtnwmOt-_beE',
  r4cScene28ZipSha256: '466f0f0ddccc68f89bfcbd6e97192deaddc548cffecb5b335392a8525c4b0b39',
  scene32ZipSha256: '2421dcedd1dc9f2c4c4e65c2b3a46ec51c65a059883360f379f3e6a0f1ac458c',
  scene32GlbSha256: 'ebff62cbf081473101c5842a55e35707bce07872a36d673ce1a87e3afb63a7d3',
  oldActive: 2099,
  oldPreserved: 2024,
  oldRetired: 75,
  newActive: 2166,
  newOnly: 142,
  sourceClassified: 134,
  failClosed: 8,
});

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const held = [
  [2762, 'D'], [2763, 'A'], [2764, 'D'], [2765, 'A'],
  [2784, 'D'], [2785, 'D'], [2786, 'A'], [2787, 'A'],
];
const windowGroups = [
  ['D', '2F', 2835], ['D', '2F', 2841],
  ['C', '2F', 2847], ['C', '2F', 2853],
  ['B', '2F', 2859], ['B', '2F', 2865],
  ['A', '2F', 2871], ['A', '2F', 2877],
  ['D', '1F', 2883], ['D', '1F', 2889],
  ['C', '1F', 2895], ['C', '1F', 2901],
  ['B', '1F', 2907], ['B', '1F', 2913],
  ['A', '1F', 2919], ['A', '1F', 2925],
];

/** Source-enumerated candidate scopes. No GLB, objectKey or viewer mutation. */
export function scene32SourceEvidence() {
  const records = [];
  const add = (indices, apartmentScope, storeyScope, role, provenance, unresolved = false) => {
    for (const nodeIndex of indices) records.push({
      nodeIndex, apartmentScope, storeyScope, role,
      phaseScope: 'ACTIVE_IN_SELECTED_WORKTEST',
      provenance, unresolved, objectKey: null,
    });
  };

  add(range(2766, 2783), 'A', 'OUTSIDE_2F', 'CONTENT',
      'K14_A_GABLE_DREF: 18 R4C K12 A-gable source matches');
  add(range(2793, 2828), 'D', 'OUTSIDE_1F', 'OUTDOOR_D',
      'K15_D_TERRACE: 28 terrace objectIds + 8 L-step source meshes');
  for (const [apartment, floor, start] of windowGroups) {
    add(range(start, start + 4), apartment, floor, 'REFERENCE_ONLY',
        'K16a G2_WINDOW_S source G2Id/sourceG2Id: glass + four frame parts');
  }
  for (const [index, apartment] of held) {
    add([index], apartment, 'UNKNOWN', 'UNCLASSIFIED',
        'K14 outer gable/roof/rake/fascia: storey and role require source gate', true);
  }
  return records.sort((a, b) => a.nodeIndex - b.nodeIndex);
}

const expectedIndices = new Set([
  ...range(2766, 2783), ...range(2793, 2828),
  ...windowGroups.flatMap(([, , start]) => range(start, start + 4)),
  ...held.map(([index]) => index),
]);
const heldIndices = new Set(held.map(([index]) => index));

function countsBy(records, key) {
  const counts = {};
  for (const r of records) counts[r[key]] = (counts[r[key]] || 0) + 1;
  return counts;
}
function sameCounts(a, b) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].every(k => (a[k] || 0) === (b[k] || 0));
}

/** Audit only source evidence. Even PASS here NEVER authorizes publish/apply. */
export function auditScene32Evidence(records) {
  const errors = [];
  if (!Array.isArray(records)) {
    return { ok: false, errors: ['Expected records array'], canApply: false };
  }
  const observed = new Set();
  for (const r of records) {
    if (!Number.isSafeInteger(r.nodeIndex) || !expectedIndices.has(r.nodeIndex)) {
      errors.push('Unexpected nodeIndex ' + r.nodeIndex);
    }
    if (observed.has(r.nodeIndex)) errors.push('Duplicate nodeIndex ' + r.nodeIndex);
    observed.add(r.nodeIndex);
    if (r.objectKey !== null) errors.push('objectKey is not source-verified at ' + r.nodeIndex);
    if (r.phaseScope !== 'ACTIVE_IN_SELECTED_WORKTEST') errors.push('Invalid phase at ' + r.nodeIndex);
    const isHeld = heldIndices.has(r.nodeIndex);
    if (isHeld && (r.storeyScope !== 'UNKNOWN' || r.role !== 'UNCLASSIFIED' || r.unresolved !== true)) {
      errors.push('Fail-closed violation at ' + r.nodeIndex);
    }
    if (!isHeld && (r.unresolved !== false || r.storeyScope === 'UNKNOWN' || r.role === 'UNCLASSIFIED')) {
      errors.push('Known-source scope omitted at ' + r.nodeIndex);
    }
  }
  for (const index of expectedIndices) {
    if (!observed.has(index)) errors.push('Missing nodeIndex ' + index);
  }
  const apartment = countsBy(records, 'apartmentScope');
  const storey = countsBy(records, 'storeyScope');
  const roles = countsBy(records, 'role');
  if (!sameCounts(apartment, { A: 42, B: 20, C: 20, D: 60 })) errors.push('Apartment counts mismatch');
  if (!sameCounts(storey, { '1F': 40, '2F': 40, OUTSIDE_1F: 36, OUTSIDE_2F: 18, UNKNOWN: 8 })) errors.push('Storey counts mismatch');
  if (!sameCounts(roles, { REFERENCE_ONLY: 80, OUTDOOR_D: 36, CONTENT: 18, UNCLASSIFIED: 8 })) errors.push('Role counts mismatch');
  if (records.length !== 142) errors.push('Expected exactly 142 new active meshes');
  return {
    ok: errors.length === 0, errors,
    summary: { total: records.length, apartment, storey, roles },
    canApply: false,
    reason: 'SOURCE_ONLY: GLB/objectKey join, retired75 gate, visual tests and review NOT_RUN',
  };
}
