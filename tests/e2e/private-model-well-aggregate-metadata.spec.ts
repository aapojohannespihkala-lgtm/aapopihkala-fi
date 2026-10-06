import { expect, test } from '@playwright/test';

import {
  formatSelectionMetadataKey,
  selectionMetadataEntries,
} from '../../src/scripts/privateModelSelectionMetadata';

test('well report aggregates stay explicit and scoped in selection metadata', () => {
  const entries = selectionMetadataEntries({
    userData: {
      Pass: 'M5A-R2',
      representationKind: 'wellMarkerWork',
      wellMaterialSource: 'betoni/muovi',
      wellDiameterMmSource: [300, 315],
      presentationOnly: true,
      Canonical: false,
      asBuiltClaim: false,
      unrelatedArray: [1, 2],
    },
  }, null);

  const metadata = Object.fromEntries(entries);

  expect(metadata).toMatchObject({
    wellMaterialSource: 'betoni/muovi',
    wellDiameterMmSource: '300, 315',
    presentationOnly: 'true',
    Canonical: 'false',
    asBuiltClaim: 'false',
  });
  expect(metadata.unrelatedArray).toBeUndefined();
});

test('well report aggregate labels state system scope in Finnish', () => {
  expect(formatSelectionMetadataKey('wellMaterialSource')).toBe(
    'Raportin kaivomateriaalit (järjestelmätaso)',
  );
  expect(formatSelectionMetadataKey('wellDiameterMmSource')).toBe(
    'Raportin kaivokoot (mm, järjestelmätaso)',
  );
});
