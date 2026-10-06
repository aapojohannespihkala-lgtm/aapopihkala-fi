import { expect, test } from '@playwright/test';

import {
  formatSelectionMetadataKey,
  selectionMetadataEntries,
} from '../../src/scripts/privateModelSelectionMetadata';

test('selection metadata keeps source-backed drainage inspection facts inside the 12-row panel limit', () => {
  const object = {
    userData: {
      Pass: 'M5A-R2',
      representationKind: 'referenceRouteWork',
      sourceConnection: 'PVK_SOK1',
      sourceVideoLengthM: 1.9,
      sourceConditionClass: 'KL4',
      pipeMaterialSource: 'muovi',
      pipeDiameterMmSource: 100,
      ModelStage: 'WORK_TEST_VIEW',
      presentationOnly: true,
      Canonical: false,
      asBuiltClaim: false,
      coordinateBasis: 'YLIS-G1-LOCAL',
      exactXYClaim: false,
      exactZClaim: false,
      physicalElevationClaim: false,
      currentGeometryClaim: false,
      sourceGeometryBasis: 'SOURCE_BACKED_TEST_VALUE',
      workAssumption: true,
    },
  };

  const entries = selectionMetadataEntries(object, null);
  const keys = entries.map(([key]) => key);

  expect(entries).toHaveLength(12);
  expect(keys).toEqual([
    'Pass',
    'representationKind',
    'sourceConnection',
    'sourceVideoLengthM',
    'sourceConditionClass',
    'pipeMaterialSource',
    'pipeDiameterMmSource',
    'ModelStage',
    'presentationOnly',
    'Canonical',
    'asBuiltClaim',
    'coordinateBasis',
  ]);
  expect(Object.fromEntries(entries)).toMatchObject({
    sourceConnection: 'PVK_SOK1',
    sourceVideoLengthM: '1.9',
    sourceConditionClass: 'KL4',
    pipeMaterialSource: 'muovi',
    pipeDiameterMmSource: '100',
    presentationOnly: 'true',
    Canonical: 'false',
    asBuiltClaim: 'false',
  });
});

test('selection metadata gives source-backed drainage fields concise Finnish labels', () => {
  expect(formatSelectionMetadataKey('sourceConnection')).toBe('Lähdeyhteys');
  expect(formatSelectionMetadataKey('sourceVideoLengthM')).toBe('Videokuvauksen pituus (m)');
  expect(formatSelectionMetadataKey('sourceConditionClass')).toBe('Kuntoluokka');
  expect(formatSelectionMetadataKey('pipeMaterialSource')).toBe('Putkimateriaali');
  expect(formatSelectionMetadataKey('pipeDiameterMmSource')).toBe('Putken lähdehalkaisija (mm)');
  expect(formatSelectionMetadataKey('currentGeometryClaim')).toBe('Current Geometry Claim');
});
