import { expect, test } from '@playwright/test';

import {
  metadataChainHasArchitectureEvidence,
  metadataChainHasDrainageEvidence,
} from '../../src/scripts/privateModelArchitecturalLayersRuntime';

test('M5A drainage metadata is not classified as architectural layer content', () => {
  const modelRoot = { userData: {}, parent: null };
  const drainageRoute = {
    userData: {
      G2Id: 'G2_DRAIN_LINK_SOK1_SOK2_001',
      representationKind: 'referenceRouteWork',
      presentationOnly: true,
    },
    parent: modelRoot,
  };
  const routeMesh = {
    userData: {},
    parent: drainageRoute,
  };

  expect(metadataChainHasDrainageEvidence(routeMesh, modelRoot)).toBe(true);
  expect(metadataChainHasArchitectureEvidence(routeMesh, modelRoot)).toBe(false);
});

test('drainage representation kind excludes unresolved markers even without G2 id', () => {
  const modelRoot = { userData: {}, parent: null };
  const unresolvedBoundary = {
    userData: {
      representationKind: 'unresolvedBoundaryMarker',
      presentationOnly: true,
    },
    parent: modelRoot,
  };

  expect(metadataChainHasDrainageEvidence(unresolvedBoundary, modelRoot)).toBe(true);
  expect(metadataChainHasArchitectureEvidence(unresolvedBoundary, modelRoot)).toBe(false);
});

test('existing architectural G2 evidence remains eligible for the architectural layer', () => {
  const modelRoot = { userData: {}, parent: null };
  const exteriorWall = {
    userData: {
      G2Id: 'G2_WALL_EXT_W_1F2F_001',
      physicalWallClaim: true,
    },
    parent: modelRoot,
  };

  expect(metadataChainHasDrainageEvidence(exteriorWall, modelRoot)).toBe(false);
  expect(metadataChainHasArchitectureEvidence(exteriorWall, modelRoot)).toBe(true);
});


test('dedicated drainage Layerit control is declared by the shared runtime', async () => {
  const { readFile } = await import('node:fs/promises');
  const runtimeUrl = new URL(
    '../../src/scripts/privateModelArchitecturalLayersRuntime.ts',
    import.meta.url,
  );
  const source = await readFile(runtimeUrl, 'utf8');

  expect(source).toContain("drainageSection.id = 'drainage-layer-group';");
  expect(source).toContain("makeCheckboxRow('drainage-layer-visible', 'Salaojat', false)");
  expect(source).toContain("canvas.dataset.drainageVisible = drainageVisible ? 'true' : 'false';");
});
