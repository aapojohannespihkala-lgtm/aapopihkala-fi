import { readFile } from 'node:fs/promises';

import { expect, test } from '@playwright/test';

import {
  explicitFloorToken,
  findSourceNamedScene,
  hasFloorToken,
  normalizeSceneName,
  resolveArchitecturalSemanticDescriptor,
  semanticName,
} from '../../src/scripts/privateModelSceneSemantics';

test('scene semantic helpers preserve name and floor inference', () => {
  const root = { name: 'Building Root', parent: null };
  const floor = { name: 'D-2F', parent: root, userData: {} };
  const mesh = { name: 'Wall_03', parent: floor, userData: {} };

  expect(semanticName(mesh)).toBe('WALL_03 | D-2F | BUILDING ROOT');
  expect(hasFloorToken(mesh, '2F')).toBe(true);
  expect(hasFloorToken(mesh, '1F')).toBe(false);
  expect(explicitFloorToken(mesh)).toBe('2F');

  const explicit = { name: 'Unlabeled', parent: null, userData: { storey: '1f' } };
  expect(hasFloorToken(explicit, '1F')).toBe(true);

  const mixed = { name: 'D_1F-D_2F', parent: null, userData: {} };
  expect(explicitFloorToken(mixed)).toBe('1F / 2F');
});

test('source scene lookup preserves parser-index priority and normalized fallback', () => {
  const indexedScene = { name: 'Runtime scene zero' };
  const fallbackScene = { name: 'Fallback-scene' };
  const gltf = {
    parser: { json: { scenes: [{ name: 'Exact Source' }, { name: 'Other' }] } },
    scenes: [indexedScene, fallbackScene],
  };

  expect(findSourceNamedScene(gltf, 'Exact Source')).toBe(indexedScene);
  expect(findSourceNamedScene(gltf, 'fallback scene')).toBe(fallbackScene);
  expect(findSourceNamedScene(gltf, 'missing')).toBeNull();
  expect(normalizeSceneName('  D_2F--Plan  ')).toBe('D 2F PLAN');
});

test('private-model route delegates scene semantics to the helper module', async () => {
  const source = await readFile(
    new URL('../../src/pages/private-model/index.astro', import.meta.url),
    'utf8',
  );

  expect(source).toContain("from '../../scripts/privateModelSceneSemantics';");
  expect(source).not.toContain('const semanticName =');
  expect(source).not.toContain('const normalizeSceneName =');
  expect(source).not.toContain('const findSourceNamedScene =');
  expect(source).not.toContain('const hasFloorToken =');
  expect(source).not.toContain('const explicitFloorToken =');
});


test('architectural classifier uses explicit G2 identities and keeps representation role separate', () => {
  const exterior = resolveArchitecturalSemanticDescriptor({
    userData: { G2Id: 'g2_wall_ext_w_1f2f_001', physicalWallClaim: true },
  });
  expect(exterior.semanticWallFamily).toBe('EXTERIOR');
  expect(exterior.buildingPartFamily).toBe('WALL');
  expect(exterior.representationRole).toBe('PHYSICAL');
  expect(exterior.labelFi).toBe('Ulkoseinä');

  const parentIdentity = resolveArchitecturalSemanticDescriptor({
    userData: { ParentG2Id: 'G2_WALL_PART_CD_1F_001', representationKind: 'referenceLine' },
  });
  expect(parentIdentity.semanticWallFamily).toBe('PARTY');
  expect(parentIdentity.representationRole).toBe('REFERENCE');
  expect(parentIdentity.labelFi).toBe('Huoneistorajaseinä (referenssi)');

  const conflict = resolveArchitecturalSemanticDescriptor({
    userData: {
      G2Id: 'G2_WALL_EXT_W_1F2F_001',
      ParentG2Id: 'G2_WALL_INT_D_1F_WET_2015_001',
    },
  });
  expect(conflict.semanticWallFamily).toBe('UNRESOLVED_SEMANTIC_CONFLICT');
  expect(conflict.labelFi).toContain('Semantiikkaristiriita');

  const nameOnly = resolveArchitecturalSemanticDescriptor({
    name: 'G2_WALL_EXT_FAKE_BRIGHT_ORANGE',
    userData: {},
  });
  expect(nameOnly.semanticWallFamily).toBe('UNCLASSIFIED');
  expect(nameOnly.buildingPartFamily).toBe('OTHER');
});

test('architectural classifier labels door, window and helper representations without physical guessing', () => {
  const doorReference = resolveArchitecturalSemanticDescriptor({
    userData: {
      G2Id: 'G2_DOOR_INT_D_2F_WC_001',
      representationKind: 'openingAnchor',
      doorLeafGeometryAdded: false,
      physicalDoorVoid: false,
    },
  });
  expect(doorReference.buildingPartFamily).toBe('DOOR');
  expect(doorReference.representationRole).toBe('REFERENCE');
  expect(doorReference.physicalClaimStatus).toBe('NO');
  expect(doorReference.labelFi).toBe('Sisäoven aukon referenssi');

  const windowReference = resolveArchitecturalSemanticDescriptor({
    userData: {
      G2Id: 'G2_WINDOW_D_2F_N_001',
      representationKind: 'referenceOpening',
    },
  });
  expect(windowReference.buildingPartFamily).toBe('WINDOW');
  expect(windowReference.labelFi).toBe('Ikkuna-aukko (referenssi)');

  const helper = resolveArchitecturalSemanticDescriptor({
    userData: {
      representationKind: 'windowHostHelper',
      PresentationOnly: true,
    },
  });
  expect(helper.representationRole).toBe('REVIEW_HELPER');
  expect(helper.labelFi).toBe('Review-apugeometria - ikkunan host-helper');

  const hostOnly = resolveArchitecturalSemanticDescriptor({
    userData: { coveringHostIds: ['G2_WALL_EXT_W_1F2F_001'] },
  });
  expect(hostOnly.semanticWallFamily).toBe('UNCLASSIFIED');
  expect(hostOnly.buildingPartFamily).toBe('OTHER');
});
