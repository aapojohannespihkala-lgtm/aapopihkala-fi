import test from 'node:test';
import assert from 'node:assert/strict';
import { selectionSourceLinks } from '../../src/scripts/privateModelSelectionMetadata.ts';

// Exact names and extras observed in the source V93 double-outlet GLB
// SHA256 5539955b44dcd3bac48710cf81ecc307653e685956439f5db713f517ccf94e12.
const photo = {
  '1F': {
    name: 'D_1F_EXTERIOR_DOUBLE_OUTLET_COMMON_WEATHER_FLAP_OWNER_APPROVED_ROOT_WORK_TEST_HOST_HOLD',
    id: '1H9Fp8oFQ38ERes_zX0jfKp7uY0sc4V8j',
  },
  '2F': {
    name: 'D_2F_EXTERIOR_DOUBLE_OUTLET_COMMON_WEATHER_FLAP_OWNER_APPROVED_ROOT_WORK_TEST_HOST_HOLD',
    id: '14WdPPFc0ZVolz4Z5a3Zf6ANPmPwGKvY1',
  },
};
const root = (floor, changes = {}) => ({
  name: photo[floor].name,
  userData: {
    '2026PhotoDriveId': photo[floor].id,
    '2026OwnerReview': 'PHOTO LOCATION APPROVED; 2_OUTLETS_AND_PLASTIC_COVER_CONFIRMED_2026_11_10',
    sourceModel: 'Ylisrinne V93 socket scene303/304/305',
    numSocketPositions: 2,
    oneProtectivePlasticCover: true,
    hostHold: true,
    current: false,
    asBuilt: false,
    physicalWiring: 'NOT_MODELED_OR_VERIFIED',
    ...changes,
  },
});

test('V93 exterior double outlets show each exact 2026 source photo for the root and its children', () => {
  for (const floor of ['1F', '2F']) {
    const scene = { name: 'scene', parent: null };
    const exactRoot = { ...root(floor), parent: scene };
    const child = { name: 'socket geometry', parent: exactRoot, userData: {} };
    const expected = 'https://drive.google.com/file/d/' + photo[floor].id + '/view';
    assert.deepEqual(selectionSourceLinks(exactRoot, scene).map(x => x.link), [expected]);
    assert.deepEqual(selectionSourceLinks(child, scene).map(x => x.link), [expected]);
    assert.match(selectionSourceLinks(child, scene)[0].label, /WORK_TEST/);
  }
});

test('V93 photo links require exact root and approved WORK_TEST metadata (fail closed)', () => {
  const scene = { name: 'scene', parent: null };
  for (const floor of ['1F', '2F']) {
    const original = root(floor);
    const disallowed = [
      { ...original, name: 'Unrelated lookalike root' },
      root(floor, { '2026PhotoDriveId': '1notTheApprovedDriveId' }),
      root(floor, { numSocketPositions: 1 }),
      root(floor, { '2026OwnerReview': 'UNKNOWN' }),
      root(floor, { sourceModel: 'another source model' }),
      root(floor, { oneProtectivePlasticCover: false }),
      root(floor, { hostHold: false }),
      root(floor, { asBuilt: true }),
      root(floor, { current: true }),
      root(floor, { physicalWiring: 'VERIFIED' }),
    ];
    for (const candidate of disallowed) {
      assert.deepEqual(selectionSourceLinks({ ...candidate, parent: scene }, scene), []);
    }
  }
});

test('pre-existing sourceLinks are authoritative; approved V93 photo is not duplicated', () => {
  const floor = '1F';
  const url = 'https://drive.google.com/file/d/' + photo[floor].id + '/view';
  const exactRoot = root(floor, {
    sourceLinks: [{ link: url, role: 'Owner 2026 photo', supports: 'photo observation only' }],
  });
  const links = selectionSourceLinks(exactRoot, null);
  assert.equal(links.length, 1);
  assert.equal(links[0].link, url);
  assert.match(links[0].label, /Owner 2026 photo/);
});
