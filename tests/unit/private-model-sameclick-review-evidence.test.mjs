import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classifySameClickReviewEvidence as classify} from '../../src/scripts/privateModelSameClickReviewEvidence.mjs';

const root = {name:'current C80 model'};
const make = (name, parent=root) => ({name, parent});
test('same object attached to the mounted model is the only matched surface', () => {
  const mesh=make('D1F_VISIBLE_PIPE');
  assert.equal(classify({coordinateHitObject:mesh, selectedObject:mesh, modelRoot:root}), 'MATCHED_SURFACE');
});
test('same object name does not establish a matching click', () => {
  const point=make('shared repeated source name');
  const selection=make('shared repeated source name');
  assert.equal(classify({coordinateHitObject:point, selectedObject:selection, modelRoot:root}), 'INDEPENDENT_HITS');
});
test('a source-card service target different from clicked mesh is independent', () => {
  const group=make('service group');
  const point=make('pipe',group);
  assert.equal(classify({coordinateHitObject:point, selectedObject:group, modelRoot:root}), 'INDEPENDENT_HITS');
});
test('missing selection or visible coordinate hit cannot imply a host', () => {
  const point=make('mesh');
  assert.equal(classify({coordinateHitObject:point, selectedObject:null, modelRoot:root}), 'NO_SELECTION');
  assert.equal(classify({coordinateHitObject:null, selectedObject:point, modelRoot:root}), 'NO_COORDINATE_HIT');
});
test('detached former scene object is not a valid same-source selection', () => {
  const prior={name:'prior scene'};
  const point=make('old node 12144',prior);
  assert.equal(classify({coordinateHitObject:point, selectedObject:point, modelRoot:root}), 'DETACHED_SELECTION');
});
test('deep and cyclic parent paths fail closed', () => {
  const cyclic={};cyclic.parent=cyclic;
  assert.equal(classify({coordinateHitObject:cyclic, selectedObject:cyclic, modelRoot:root}), 'DETACHED_SELECTION');
});
test('viewer wires the two same-click raycasts and exposes explicit independent evidence', () => {
  const source=readFileSync(new URL('../../src/pages/private-model/index.astro',import.meta.url),'utf8');
  assert.match(source,/import \{ classifySameClickReviewEvidence \} from '\.\.\/\.\.\/scripts\/privateModelSameClickReviewEvidence\.mjs'/);
  assert.match(source,/onVisibleHit:\s*\(hit\)\s*=>\s*\{\s*coordinateHitObject = hit\.object/);
  assert.match(source,/const selectedClickObject = selectAtClientPoint\(event\.clientX, event\.clientY\)/);
  assert.match(source,/const coordinateHitObject = showWorkTestClicked3DCoordinate\(event\.clientX, event\.clientY\)/);
  assert.match(source,/canvas\.dataset\.reviewCoordinateSelectionEvidence = sameClickEvidence/);
  assert.match(source,/Koordinaattipiste ja valittu kohde ovat eri osumia/);
});
