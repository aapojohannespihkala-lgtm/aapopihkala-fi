import { expect, test } from '@playwright/test';

import { metadataChainHasArchitectureEvidence } from '../../src/scripts/privateModelArchitecturalLayersRuntime';

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

  expect(metadataChainHasArchitectureEvidence(exteriorWall, modelRoot)).toBe(true);
});
