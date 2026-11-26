import assert from "node:assert/strict";
import test from "node:test";
import {
  R34_HEIGHT_POINT_SOURCE_SHA256,
  R34_HEIGHT_POINT_SOURCE_SCENE,
  createR34HeightPointSeeds,
} from "../../src/scripts/privateModelR34HeightPointSeeds.mjs";

const source = { modelSha256: R34_HEIGHT_POINT_SOURCE_SHA256, sceneName: R34_HEIGHT_POINT_SOURCE_SCENE };
const seeds = () => createR34HeightPointSeeds(source);

test("R34 exact source SHA gates all seeded markers", () => {
  assert.match(R34_HEIGHT_POINT_SOURCE_SHA256, /^[a-f0-9]{64}$/);
  assert.equal(seeds().length, 8);
  assert.deepEqual(createR34HeightPointSeeds({ modelSha256: "000".repeat(21) + "0", sceneName: "__scene822" }), []);
  assert.deepEqual(createR34HeightPointSeeds({ sceneName: "__scene822" }), []);
  assert.deepEqual(createR34HeightPointSeeds(), []);
});

test("only originally verified R34 scenes are seeded", () => {
  assert.deepEqual(createR34HeightPointSeeds({ ...source, sceneName: "__scene823" }), []);
  const floor2f = createR34HeightPointSeeds({ ...source, sceneName: "__scene824" });
  assert.deepEqual(floor2f.map(x => x.id), ["r34-2f-plank-floor", "r34-2f-wc-floor"]);
  assert.deepEqual(createR34HeightPointSeeds({ ...source, sceneName: "__scene825" }).map(x => x.id), floor2f.map(x => x.id));
  assert.deepEqual(createR34HeightPointSeeds({ ...source, sceneName: "__scene821" }), []);
});

test("eight independent roof, terrace and floor triangles, no shell substitute", () => {
  const all = seeds();
  assert.equal(new Set(all.map(x => x.id)).size, 8);
  assert.deepEqual(all.slice(0,4).map(x => x.position.y), [7.73, 6, 6.73, 5]);
  assert.deepEqual(all.slice(4).map(x => x.position.y), [-0.155, 0.0775, 2.763, 2.843]);
  assert.deepEqual(all.find(x => x.id === "r34-1f-wet-floor").source, { node: 12320, mesh: 4630, primitive: 0, triangle: 54 });
  assert.equal(all.some(x => x.source.node === 5224), false);
  for (const x of all) {
    assert.match(x.evidence, /NOT_AS_BUILT/);
    assert.deepEqual(Object.keys(x.position).sort(), ["x","y","z"]);
    assert.equal(Object.values(x.position).every(Number.isFinite), true);
    assert.equal(x.sourceSha256, R34_HEIGHT_POINT_SOURCE_SHA256);
    assert.equal(x.sourceScene, "__scene822");
  }
});

test("seeds do not mutate persistent model source across calls", () => {
  const first = seeds();
  first[0].position.y = -123;
  first[0].source.node = -12;
  first.pop();
  assert.equal(seeds()[0].position.y, 7.73);
  assert.equal(seeds()[0].source.node, 13360);
  assert.equal(seeds().length, 8);
});

test("R34 seed module never guesses N2000 datum or physical status", () => {
  for (const point of seeds()) {
    assert.equal("n2000" in point, false);
    assert.equal("asBuilt" in point, false);
    assert.equal("current" in point, false);
  }
});
