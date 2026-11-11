import test from 'node:test';
import assert from 'node:assert/strict';
import { inflateSync } from 'node:zlib';
import {
  SG5_ROOF600_SOURCE_SHA256, SG5_ROOF600_SOURCE_SCENE_COUNT,
  SG5_ROOF600_SOURCE_NODE_COUNT, SG5_ROOF600_PARENT_SHA256,
  SG5_ROOF600_WHITE_DONOR_SHA256, SG5_ROOF600_FLOORS,
  SG5_ROOF600_BASE_FLOORS, SG5_ROOF600_SCENES,
  SG5_ROOF600_ROOT, SG5_ROOF600_WHITE_NODES,
  sg5Roof600RootFnv32, isSg5Roof600SourceScene,
} from '../../src/scripts/privateModelC80Sg5Roof600SourceProfile.mjs';

// Immutable ordered scene-root snapshots from the SHA-verified actual private
// GLB (not filename-based recognition). Only source-root IDs are included.
const ROOTS_ZLIB_B64 = {
  370: 'eNotksuRQCEIBBPyICq/WLY2/zSW6beXLgQGEP3J67FOeA3CVrwLjnCXbfe78k5kEEIuvwdfyZpjnF5eteWTdV2I1SeUl1u1XJat2vvOMVU/sZ7gQqxwS6GEXlEapjSMxxMmr/up1PhiRouc5pF3z6g5EdFX+9QePIHjjN77CS5wTKGEHkwXO/vWlKi5eXb2THue4AIXmqP1BGq6VNt0MfWzDiGFEnqS9x54ssSZ5E6HbjNhrJydjq9kXeEJh/bStJs4k4/+ewoNZ7qwKjok+t+jINHY0KBqBplBZpCjrsNkc2nwwM/PLtNhwIQFqVBoC22hLbSFttAW2kJbaAttfy+GttH2aO207njnqYbzBYYXvg0NHnghmc9hwITUeWgdraN1tI7W0TpaR+toHa2jDbTapPl1qMw4D8oTzBPvs6UNaup7jB1Etb2hPIk/T0KDB8pf1ClmKO3HSi9uvTcsKsvW/x6bjk2XDjwREH+i6o/OF7/wwc8TMH//AFmgzY=',
  371: 'eNotlckVHSEMBBP6B8SiJRY/55+Gu2t86ccAxSKhnj95z/pN1PvN7vXrumkpS1tG8jzwwrIt57f3Xr9KTX5731/eV788Ve5D+lcz40VDU/r9ch6SlrK0ZSS5fq/O+WWesGwtoN0ktI7l/mZCU05qlRvCrk4gEXHHW2p5HU2nz9o/odd9aWG0PeA9OLi2jPW0kw6tE3knYWXRsVp3kLSOv8KyLcdyLQ7WSktZmOe7xrKYCBNhIkyEidBGrVDW3oRSx3pz3Wq3vFRvh+1YruVZdKXljWq8UQYnP+hFH5qoE6fL6a7XopikMiDxZ3uPVArbWc7xcduHdIL7cQINjKbM8n2Xb7l8wRjf43yb+xysVe5UuGM5omqq0xma4wd1dB3JtfDp0QnLsXhgPKArzlN4TuqKEc6BtknumNwxuWNyxyz0mzPWIpvF4TiNnhMKW7AFW7AFW7AN27AN27AN27AN27AN27ADO7ADO7ADO7ADO2ZzLTRQIrgOetGHJlpoo7ABG7ABG7ABG7ABG7ABG7AbdsNu2A27YTfsht2w5CI37IHlEbhKrbC8w+QdJu9QVYXCHtgLe2Ev7sW9Bf2wl7YC3thH+yDfbAPVq6gYiq/Z33HcdTi6PW6XWijY3XUpIEy0zGK67iHSyXi+WRS9z97RPBugnwHmQ7yGuQpyEeQgyAHQQ6CHIRzUEcetG0/O9NedZBt4a3Y3o5GJJ6txy1boq/d0qeDr2e33OeW4iyx/aTnlW1QfWqFnUIed+2At2jZnMueaZ97eg+StshC24dpH8Zllq6yxHmOF3CQ5YeaVyS+eNblinV9jctrXF3jINUsW9ayZS0+y+L/gIJU4/ciD3VW+9jhVH699Ookz8KF9Bmqj27t0jZ8Gc+zpKUsmJHddtlxHoXl38PRDvpHhEWtShuNraoUJsm1bLY3MzynIb1F4bxHwT4K9v+6FOyj2L9fxme/+T1CniszkzmFZRV2VNhRYUdVXz/xw44KOyrsqLCjwo4KOyrsqLCjwo4KOyrsqObLEix2VLaj2PMVweXJUwoHvRTEpSB4+Ocro8vMS4lQCudSTJd1LuyDfbAP9sE+2Af7YB/sg32wFJbfvIrpUHY2jcCCAgsKLCKwhcAKIllzviKjxNPRC//UncHix7HQQDfK6KGfWxN//c28VxONZt/etNmxOW1T7mOjln7tjR70oqxmo47BcgbLGcxmMIPhVLOZc1jBZRD8nnQS5hPDIXpD3IYzDLEa7jvJaDKajBaj342adtMe2jYqldxBL/r1JFp//wEtmfnZ',
};
const sourceRoots = index => JSON.parse(inflateSync(Buffer.from(ROOTS_ZLIB_B64[index], 'base64')).toString('utf8'));
const sourceFixture = () => {
  const nodes = Array.from({ length: SG5_ROOF600_SOURCE_NODE_COUNT }, () => ({}));
  const children = [
    12001,12002,12003,12004,12005,12007,12009,12010,12011,12012,
    12013,12014,12015,12016,12017,12018,12019,12020,12021,12022,
    12023,12024,12025,12026,12027,12028,12029,12030,12031,
  ];
  nodes[SG5_ROOF600_ROOT] = {
    name: 'C80_SG5_MJ39_600MM_WHITE_IH7603W_FILTER_UNDERHOOD_ROOT_ROOF_FIT_WORK_TEST',
    children,
    extras: { sourceSG5SHA256: SG5_ROOF600_PARENT_SHA256,
      sourceWhiteDonorSHA256: SG5_ROOF600_WHITE_DONOR_SHA256 },
  };
  for (const part of SG5_ROOF600_WHITE_NODES) nodes[part.node] = {
    name: part.prefix + 'SOURCE_EXACT_WORK_TEST',
    mesh: part.mesh,
    extras: { sourceExactGLBSHA256: SG5_ROOF600_WHITE_DONOR_SHA256,
      sourceNodeIndex: part.sourceNode },
  };
  const scenes = Array.from({length:SG5_ROOF600_SOURCE_SCENE_COUNT},()=>({name:'older source scene',nodes:[]}));
  for (const [key, p] of Object.entries(SG5_ROOF600_SCENES)) scenes[key] = {
    name: p.name, nodes: sourceRoots(key), extras: {
      integrationTask: 'GPT6-C80-SG5-MJ39-600MM-ROOF-JUNCTION-COW-20261111',
      modelStage: 'WORK_TEST', HOST_HOLD: true,
      current: false, asBuilt: false, floor: p.floor, sceneIsOptInOnly: true,
      sourceParentGLBSHA256: SG5_ROOF600_PARENT_SHA256,
      sourceParentSceneIndex: p.parentScene,
      donorWhiteShellGLBSHA256: SG5_ROOF600_WHITE_DONOR_SHA256,
      donorWhiteShellSceneIndex: 369,
      newFilterGroupRoot: SG5_ROOF600_ROOT, replacesOldSourceRoot: 12032,
      ownerRelativeHoodHobMm: 600, lowerShellWorldMinY: 4.28246,
      upperShellWorldMaxY: 5.28, upperTelescopeHeightMm: 437.54,
      roofJunctionRegressionPreviouslyIdentifiedMm: 112.54,
      N_S_airflow_root_unmodified: true,
      sourceLinksProvenance: [
        {sha256:SG5_ROOF600_PARENT_SHA256,scene:p.parentScene},
        {sha256:SG5_ROOF600_WHITE_DONOR_SHA256,scene:369},
        {role:'OWNER_MEASURED_RELATIVE_2026'},
      ],
    },
  };
  return { scene:292, scenes, nodes, asset: {extras:{
    ModelStage:'WORK_TEST',current:false,canonical:false,asBuilt:false,
    viewerFloorScenes:{...SG5_ROOF600_BASE_FLOORS},
  }}};
};
test('SG5 Savo owner600 accepts only the exact 2F/BOTH source floor roots', () => {
  const json = sourceFixture();
  for(const [floor, index] of Object.entries(SG5_ROOF600_FLOORS)) {
    assert.equal(sg5Roof600RootFnv32(json.scenes[index].nodes), SG5_ROOF600_SCENES[index].fnv);
    assert.equal(isSg5Roof600SourceScene(json, SG5_ROOF600_SOURCE_SHA256, index, floor), true);
  }
  assert.equal(isSg5Roof600SourceScene(json, SG5_ROOF600_SOURCE_SHA256, 368), false);
  assert.equal(isSg5Roof600SourceScene(json, SG5_ROOF600_SOURCE_SHA256, 292), false);
});
test('SG5 Savo owner600 fails closed on SHA, root, provenance and measured clearance drift', () => {
  const exact = sourceFixture();
  const check = copy => isSg5Roof600SourceScene(copy, SG5_ROOF600_SOURCE_SHA256, 371, 'BOTH');
  assert.equal(check(exact), true);
  assert.equal(isSg5Roof600SourceScene(exact, '0'.repeat(64), 371, 'BOTH'), false);
  assert.equal(isSg5Roof600SourceScene(exact, SG5_ROOF600_SOURCE_SHA256, 371, '2F'), false);
  for (const tamper of [
    j => { j.scenes[371].nodes.reverse(); },
    j => { j.scenes[371].nodes[0] = 12032; },
    j => { j.scenes[371].name = 'lookalike'; },
    j => { j.scenes[371].extras.sourceParentGLBSHA256 = '0'.repeat(64); },
    j => { j.scenes[371].extras.donorWhiteShellGLBSHA256 = '0'.repeat(64); },
    j => { j.scenes[371].extras.ownerRelativeHoodHobMm = 722.54; },
    j => { j.scenes[371].extras.upperShellWorldMaxY = 5.16746; },
    j => { j.scenes[371].extras.sourceLinksProvenance = []; },
    j => { j.nodes[12038].children.reverse(); },
    j => { j.nodes[12034].mesh = 4534; },
    j => { j.nodes[12035].extras.sourceExactGLBSHA256 = '0'.repeat(64); },
    j => { j.asset.extras.current = true; },
  ]) {
    const copy = structuredClone(exact); tamper(copy);
    assert.equal(check(copy), false);
  }
});
