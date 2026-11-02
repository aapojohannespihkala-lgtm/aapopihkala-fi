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
});

test('empty inventory yields no fabricated support', () => {
  expect(buildTechnicalAvailabilityRows([])).toEqual([]);
});
