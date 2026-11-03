import { test, expect } from '@playwright/test';
import {
  buildTechnicalAvailabilityRows,
} from '../../src/scripts/privateModelTechnicalLayersAvailabilityUi';
import type {
  TechnicalSystemSummary,
} from '../../src/scripts/privateModelTechnicalSystemsLayers';

const item = (
  reason: TechnicalSystemSummary['reason'],
  overrides: Partial<TechnicalSystemSummary> = {},
): TechnicalSystemSummary => ({
  id: 'technical-electrical',
  labelFi: 'Sähkölaitteet ja valaisimet',
  sourceRole: 'WORK_TEST_SOURCE',
  sourceDescription: 'Lähteen nimetyt laitteet',
  availability: reason === 'AVAILABLE' ? 'available' : 'unavailable',
  reason, matchedCount: reason === 'NO_OBJECTS_IN_SCENE' ? 0 : 2,
  boundCount: reason === 'AVAILABLE' ? 2 : 0,
  currentInstallationVerified: false,
  ...overrides,
});

test('available WORK_TEST equipment explicitly rejects an as-built conclusion', () => {
  expect(buildTechnicalAvailabilityRows([item('AVAILABLE')])).toEqual([{
    id: 'technical-electrical',
    label: 'Sähkölaitteet ja valaisimet',
    supported: true,
    message: 'Saatavilla: 2 mallin esitysobjektia.',
    provenance: 'WORK_TEST-lähde-esitys. Ei nykyasennuksen tai sijainnin toteumavarmennus.',
    count: 2,
  }]);
});

test('missing or unverified technical group stays unavailable with an exact reason', () => {
  for (const [reason, explanation] of [
    ['NO_OBJECTS_IN_SCENE', 'tunnistettuja objekteja'],
    ['SOURCE_MISMATCH', 'SHA-256'],
    ['UNVERIFIED_NODE_IDENTITY', 'parent-lähdesidonta'],
    ['UNVERIFIED_SCOPE', 'asunto- tai kerrosrajausta'],
    ['OUTSIDE_SCOPE', 'valittuun asuntoon'],
    ['OPT_IN_REQUIRED', 'erillistä tutkimusnäkymän'],
    ['LAYER_ID_PENDING', 'yhteinen Layers-ohjain'],
  ] as const) {
    const row = buildTechnicalAvailabilityRows([item(reason)])[0];
    expect(row.supported).toBe(false);
    expect(row.count).toBe(0);
    expect(row.message).toContain(explanation);
  }
});

test('a falsely advertised available status without any binding is rejected', () => {
  const row = buildTechnicalAvailabilityRows([item('AVAILABLE', { boundCount: 0 })])[0];
  expect(row.supported).toBe(false);
  expect(row.message).toContain('objektisidonta puuttuu');
});


test('source-matched count must cover every advertised bound object', () => {
  // A malformed/stale runtime inventory must not fabricate availability.
  for (const matchedCount of [0, 1, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    const [row] = buildTechnicalAvailabilityRows([
      item('AVAILABLE', { matchedCount, boundCount: 2 }),
    ]);
    expect(row.supported).toBe(false);
    expect(row.count).toBe(0);
    expect(row.message).toContain('objektisidonta puuttuu');
  }

  // A valid neighboring group remains available; two matches cover two bindings.
  const rows = buildTechnicalAvailabilityRows([
    item('AVAILABLE', { matchedCount: 0, boundCount: 2 }),
    item('AVAILABLE', { id: 'technical-heating', labelFi: 'Lämmitys', matchedCount: 2, boundCount: 2 }),
  ]);
  expect(rows.map(row => [row.id, row.supported, row.count])).toEqual([
    ['technical-electrical', false, 0],
    ['technical-heating', true, 2],
  ]);
});

test('historical plans and reference layers keep their source status separate from visibility', () => {
  const rows = buildTechnicalAvailabilityRows([
    item('AVAILABLE', {
      id: 'p161-iv-1974-plan',
      labelFi: 'IV 1974, suunnitelma',
      sourceRole: 'HISTORICAL_PLAN',
    }),
    item('OPT_IN_REQUIRED', {
      id: 'locus-water',
      labelFi: 'Vesi, Locus',
      sourceRole: 'REFERENCE_ONLY',
    }),
  ]);
  expect(rows[0].supported).toBe(true);
  expect(rows[0].provenance).toContain('Historiallinen suunnitelma');
  expect(rows[0].provenance).toContain('Ei nykyisen asennuksen');
  expect(rows[1].supported).toBe(false);
  expect(rows[1].provenance).toContain('Ei toteumavarmennus');
});

test('unknown runtime source role fails closed even when a binding claims AVAILABLE', () => {
  // Preserve the fail-closed contract for malformed runtime source roles.
  const unverifiedRole = item('AVAILABLE', {
    sourceRole: 'UNVERIFIED_FUTURE_ROLE' as TechnicalSystemSummary['sourceRole'],
  });
  const [row] = buildTechnicalAvailabilityRows([unverifiedRole]);
  expect(row.supported).toBe(false);
  expect(row.count).toBe(0);
  expect(row.message).toContain('lähteen asemaa ei ole varmennettu');
  expect(row.provenance).toContain('Lähteen asema ei ole varmennettu');
  const inheritedRole = item('AVAILABLE', {
    sourceRole: 'toString' as TechnicalSystemSummary['sourceRole'],
  });
  const [inheritedRow] = buildTechnicalAvailabilityRows([inheritedRole]);
  expect(inheritedRow.supported).toBe(false);
  expect(inheritedRow.provenance).toBe('Lähteen asema ei ole varmennettu.');
});

test('unknown technical availability reasons never inherit prototype labels', () => {
  // A source can contain an invalid runtime reason even with valid TS types.
  // No inherited Object property may appear as a user-facing explanation.
  for (const reason of ['toString', 'constructor', '__proto__', 'FUTURE_REASON']) {
    const [row] = buildTechnicalAvailabilityRows([
      item(reason as TechnicalSystemSummary['reason'], {
        availability: 'unavailable', boundCount: 0,
      }),
    ]);
    expect(row.supported).toBe(false);
    expect(row.count).toBe(0);
    expect(row.message).toBe('Saatavuutta ei ole varmennettu.');
    expect(row.provenance).toContain('WORK_TEST-lähde-esitys');
  }
  expect(buildTechnicalAvailabilityRows([item('SOURCE_MISMATCH')])[0].message)
    .toContain('SHA-256');
});

test('empty inventory yields no fabricated support', () => {
  expect(buildTechnicalAvailabilityRows([])).toEqual([]);
  // A scene change can supply an invalid entire inventory, not only invalid rows.
  for (const invalid of [null, undefined, false, {}, 'stale-source']) {
    expect(buildTechnicalAvailabilityRows(invalid as unknown as TechnicalSystemSummary[]))
      .toEqual([]);
  }
});

test('technical inventory rejects unknown group IDs without hiding valid siblings', () => {
  const unknown = ['technical-imaginary-pipes', 'constructor', '__proto__', 'p161-future-plan'];
  const fake = unknown.map(id => item('AVAILABLE', {
    id: id as TechnicalSystemSummary['id'],
    labelFi: 'Kuvitteellinen lähdeverkosto',
  }));
  expect(buildTechnicalAvailabilityRows(fake)).toEqual([]);

  const valid = item('AVAILABLE', {
    id: 'technical-heating',
    labelFi: 'Patterit ja lämpöpumppu',
  });
  const rows = buildTechnicalAvailabilityRows([...fake, valid]);
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({ id: 'technical-heating', supported: true, count: 2 });

  // Keep all eight existing source-owned IDs, including reference-only groups.
  const known: TechnicalSystemSummary['id'][] = [
    'technical-electrical', 'technical-ventilation', 'technical-heating',
    'locus-water', 'locus-wastewater', 'p161-kvv-2017',
    'p161-iv-1974-plan', 'p161-iv-1974-section',
  ];
  expect(buildTechnicalAvailabilityRows(known.map(id => item('NO_OBJECTS_IN_SCENE', { id })))
    .map(row => row.id)).toEqual(known);
});

test('malformed runtime inventory rows fail closed without hiding valid siblings', () => {
  const invalid = [null, undefined, false, 'bad',
    { id: 'technical-electrical', labelFi: null },
  ] as unknown as TechnicalSystemSummary[];
  expect(buildTechnicalAvailabilityRows(invalid)).toEqual([]);
  const rows = buildTechnicalAvailabilityRows([
    ...invalid,
    item('SOURCE_MISMATCH'),
    item('AVAILABLE'),
  ]);
  expect(rows).toHaveLength(2);
  expect(rows[0].supported).toBe(false);
  expect(rows[0].message).toContain('SHA-256');
  expect(rows[1].supported).toBe(true);
  expect(rows[1].count).toBe(2);
});
