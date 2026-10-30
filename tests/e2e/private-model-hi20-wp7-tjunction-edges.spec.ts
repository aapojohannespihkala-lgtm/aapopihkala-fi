import { expect, test } from '@playwright/test';
import {
  findCoplanarTJunctionBoundaryIndexes,
  type CoplanarBoundaryEdge,
} from '../../src/scripts/privateModelHi20CoplanarTJunctionEdges';

const p = (x: number, y: number, z = 0) => ({ x, y, z });
const edge = (
  a: ReturnType<typeof p>,
  b: ReturnType<typeof p>,
  normal = p(0, 0, 1),
): CoplanarBoundaryEdge => ({ a, b, normal });

test('C80-044 hides both sides of a true coplanar T-junction only', () => {
  const boundaries = [
    edge(p(0, 0), p(2, 0)),
    edge(p(1, 0), p(0, 0)),
    edge(p(2, 0), p(1, 0)),
  ];
  expect([...findCoplanarTJunctionBoundaryIndexes(boundaries)].sort())
    .toEqual([0, 1, 2]);
});

test('C80-044 preserves a genuine corner, uncovered doorway and opposite-side requirement', () => {
  const boundaries = [
    edge(p(0, 0), p(2, 0)),
    edge(p(1, 0), p(0, 0), p(0, 1, 0)), // perpendicular wall: actual crease
    edge(p(3, 0), p(4, 0)), // no neighbor: opening/boundary
  ];
  expect([...findCoplanarTJunctionBoundaryIndexes(boundaries)]).toEqual([]);
  // Coincident same-side faces are not proof of a filled-in opening.
  expect([...findCoplanarTJunctionBoundaryIndexes([
    edge(p(0, 0), p(2, 0)),
    edge(p(0, 0), p(1, 0)),
    edge(p(1, 0), p(2, 0)),
  ])]).toEqual([]);
});

test('C80-044 does not erase unfilled or slanted physical boundaries', () => {
  const unfilled = [
    edge(p(0, 0), p(2, 0)),
    edge(p(1, 0), p(0, 0)), // other half not covered
  ];
  expect(findCoplanarTJunctionBoundaryIndexes(unfilled).has(0)).toBe(false);
  const slanted = [
    edge(p(0, 0), p(2, 0.1)),
    edge(p(2, 0.1), p(0, 0)),
  ];
  expect(findCoplanarTJunctionBoundaryIndexes(slanted).size).toBe(0);
});

test('C80-044 covers float-rounding jitter below 0.1 mm and respects normal 8 degree gate', () => {
  const tiny = 0.00004;
  const boundaries = [
    edge(p(0, 0), p(2, 0)),
    edge(p(1, tiny), p(0, tiny)),
    edge(p(2, tiny), p(1, tiny)),
  ];
  expect(findCoplanarTJunctionBoundaryIndexes(boundaries).size).toBe(3);
  expect(findCoplanarTJunctionBoundaryIndexes([
    edge(p(0, 0), p(2, 0)),
    edge(p(2, 0), p(0, 0), p(0, 1, 0)),
  ]).size).toBe(0);
});
