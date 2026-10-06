import { expect, test } from '@playwright/test';

import {
  formatSelectionMetadataKey,
  selectionMetadataEntries,
} from '../../src/scripts/privateModelSelectionMetadata';

test('D electrical source metadata stays explicit inside the 12-row object panel limit', () => {
  const entries = selectionMetadataEntries({
    userData: {
      Pass: 'P186B',
      representationKind: 'sourceVectorPlanLineOverlay',
      hostStorey: 'D_2F',
      presentationLayer: 'MEP_ELECTRICAL',
      sourceSelector: 'BLACK_LINE_PATH_STROKE_WIDTH_0.84PT',
      sourceLineItemCount: 5701,
      sourceGraphicOnly: true,
      physicalCableRouteClaim: false,
      deviceGeometryClaim: false,
      symbolSemanticClaim: false,
      currentGeometryClaim: false,
      ModelStage: 'WORK_TEST_PRESENTATION',
      presentationOnly: true,
      Canonical: false,
      current: false,
      asBuiltClaim: false,
      publishToCURRENT: false,
      HUMAN_REVIEW: 'NOT_RUN',
    },
  }, null);

  expect(entries.map(([key]) => key)).toEqual([
    'Pass',
    'representationKind',
    'hostStorey',
    'presentationLayer',
    'sourceSelector',
    'sourceLineItemCount',
    'sourceGraphicOnly',
    'physicalCableRouteClaim',
    'deviceGeometryClaim',
    'symbolSemanticClaim',
    'currentGeometryClaim',
    'ModelStage',
  ]);

  expect(Object.fromEntries(entries)).toMatchObject({
    hostStorey: 'D_2F',
    presentationLayer: 'MEP_ELECTRICAL',
    sourceLineItemCount: '5701',
    sourceGraphicOnly: 'true',
    physicalCableRouteClaim: 'false',
    deviceGeometryClaim: 'false',
    symbolSemanticClaim: 'false',
    currentGeometryClaim: 'false',
  });
});

test('D electrical source and no-promotion fields have concise Finnish labels', () => {
  expect(formatSelectionMetadataKey('hostStorey')).toBe('Kohdekerros');
  expect(formatSelectionMetadataKey('presentationLayer')).toBe('Esityskerros');
  expect(formatSelectionMetadataKey('sourceSelector')).toBe('Lähdegrafiikan valinta');
  expect(formatSelectionMetadataKey('sourceFragmentCount')).toBe('Lähdefragmentteja');
  expect(formatSelectionMetadataKey('sourceLineItemCount')).toBe('Lähdeviivoja');
  expect(formatSelectionMetadataKey('floorHeatingCableGeometryClaim')).toBe(
    'Lattialämmityskaapelin geometria varmennettu',
  );
  expect(formatSelectionMetadataKey('electricalPanelGeometryClaim')).toBe(
    'Ryhmäkeskuksen geometria varmennettu',
  );
  expect(formatSelectionMetadataKey('physicalCableRouteClaim')).toBe(
    'Fyysinen kaapelireitti varmennettu',
  );
  expect(formatSelectionMetadataKey('deviceGeometryClaim')).toBe(
    'Laitesijaintigeometria varmennettu',
  );
  expect(formatSelectionMetadataKey('symbolSemanticClaim')).toBe(
    'Sähkösymbolien merkitys varmennettu',
  );
  expect(formatSelectionMetadataKey('currentGeometryClaim')).toBe(
    'Nykygeometria varmennettu',
  );
});
