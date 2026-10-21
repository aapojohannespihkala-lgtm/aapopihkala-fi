import { expect, test } from '@playwright/test';

import {
  formatSelectionMetadataKey,
  selectionMetadataEntries,
  selectionSourceLinks,
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
  expect(formatSelectionMetadataKey('currentGeometryClaim')).toBe('Nykygeometria varmennettu');
});

test('selection metadata keeps P186D luminaire source identity and no-promotion facts inside the 12-row panel limit', () => {
  const object = {
    userData: {
      Pass: 'P186D-X1',
      ModelStage: 'WORK_TEST_PRESENTATION',
      representationKind: 'luminaireSourceSymbolAnchorMarker',
      presentationLayer: 'MEP_ELECTRICAL',
      hostStorey: 'D_1F',
      sourcePos: 1,
      sourceScheduleType: 'Lilja 6W',
      sourceScheduleSnro: '4142068',
      sourceSchedulePowerW: 6,
      sourceCoordinateClass: 'R_VECTOR_PAGE_CALIBRATED',
      positionTypeBinding: 'HIGH_CONFIDENCE_DERIVED',
      physicalLuminaireGeometryClaim: false,
      exactCurrentXYClaim: false,
      exactZClaim: false,
      currentGeometryClaim: false,
      publishToCURRENT: false,
      sourceSymbolCenter: true,
      presentationOnly: true,
      canonical: false,
      current: false,
      asBuilt: false,
      HUMAN_REVIEW: 'NOT_RUN',
    },
  };

  const entries = selectionMetadataEntries(object, null);
  const keys = entries.map(([key]) => key);

  expect(entries).toHaveLength(12);
  expect(keys).toEqual([
    'Pass',
    'representationKind',
    'hostStorey',
    'sourcePos',
    'sourceScheduleType',
    'sourceScheduleSnro',
    'positionTypeBinding',
    'physicalLuminaireGeometryClaim',
    'exactCurrentXYClaim',
    'exactZClaim',
    'currentGeometryClaim',
    'publishToCURRENT',
  ]);
  expect(Object.fromEntries(entries)).toMatchObject({
    sourcePos: '1',
    sourceScheduleType: 'Lilja 6W',
    sourceScheduleSnro: '4142068',
    positionTypeBinding: 'HIGH_CONFIDENCE_DERIVED',
    physicalLuminaireGeometryClaim: 'false',
    exactCurrentXYClaim: 'false',
    exactZClaim: 'false',
    currentGeometryClaim: 'false',
    publishToCURRENT: 'false',
  });
});

test('selection metadata gives P186D luminaire source and no-promotion fields concise Finnish labels', () => {
  expect(formatSelectionMetadataKey('sourcePos')).toBe('Valaisinluettelon Pos');
  expect(formatSelectionMetadataKey('sourceScheduleType')).toBe('Valaisintyyppi');
  expect(formatSelectionMetadataKey('sourceScheduleSnro')).toBe('Sähkönumero');
  expect(formatSelectionMetadataKey('positionTypeBinding')).toBe('Pos-tyyppisidonnan varmuus');
  expect(formatSelectionMetadataKey('physicalLuminaireGeometryClaim')).toBe(
    'Fyysinen valaisingeometria varmennettu',
  );
  expect(formatSelectionMetadataKey('exactCurrentXYClaim')).toBe(
    'Nykyinen XY-sijainti täsmällinen',
  );
  expect(formatSelectionMetadataKey('exactZClaim')).toBe('Z-korko täsmällinen');
  expect(formatSelectionMetadataKey('publishToCURRENT')).toBe('Julkaistaan CURRENTiin');
});


test('selection source links collect GLB sourceLinks from node and ancestors as Drive/Docs links only', () => {
  const root = { userData: {} };
  const group = {
    parent: root,
    userData: {
      sourceLinks: [
        { docId: 'D2F', link: 'https://drive.google.com/file/d/group/view', role: 'support', supports: ['G1', 'G2'] },
        { docId: 'DUP', link: 'https://docs.google.com/document/d/node/edit', role: 'duplicate' },
      ],
    },
  };
  const node = {
    parent: group,
    userData: {
      sourceLinks: [
        { docId: 'QA', link: 'https://docs.google.com/document/d/node/edit', role: 'primary', supports: 'geometry' },
        { docId: 'EXT', link: 'https://example.com/not-allowed', role: 'primary' },
        { docId: 'HTTP', link: 'http://drive.google.com/file/d/insecure', role: 'primary' },
        'not-an-object',
      ],
      Pass: 'D2F',
    },
  };

  const links = selectionSourceLinks(node, root);
  expect(links).toEqual([
    { link: 'https://docs.google.com/document/d/node/edit', label: 'primary · geometry' },
    { link: 'https://drive.google.com/file/d/group/view', label: 'support · G1, G2' },
  ]);
  expect(selectionMetadataEntries(node, root).map(([key]) => key)).not.toContain('sourceLinks');
  expect(selectionSourceLinks({ userData: { sourceLinks: 'x' } }, null)).toEqual([]);
});
