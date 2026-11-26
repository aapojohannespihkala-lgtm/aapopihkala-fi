import test from 'node:test';
import assert from 'node:assert/strict';
import {
  heightPointSceneScope, scopedHeightPointSurface, canRenderHeightPoint,
} from '../../src/scripts/privateModelHeightPointSceneScope.mjs';

test('source-scene scope overrides floor and rejects non-source scene labels', () => {
  assert.equal(heightPointSceneScope({sceneName:'__scene822',floor:'1F'}), 'scene:__scene822');
  assert.equal(heightPointSceneScope({sceneName:'bad',floor:'2F'}), 'floor:2F');
  assert.equal(heightPointSceneScope({floor:'BOTH'}), 'floor:BOTH');
});

test('a clicked marker survives the matching view but not a scene transition', () => {
  const scope = 'scene:__scene822';
  const surface = scopedHeightPointSurface(scope, 'Visible mesh');
  const point = {id:'local-a',surfaceObjectName:surface};
  assert.equal(canRenderHeightPoint(point, scope), true);
  assert.equal(canRenderHeightPoint(point, 'scene:__scene824'), false);
  assert.equal(canRenderHeightPoint(point, 'floor:1F'), false);
});

test('unknown or unsafe source scope never authorizes a saved visible marker', () => {
  assert.equal(scopedHeightPointSurface('unknown','mesh'), null);
  assert.equal(canRenderHeightPoint({id:'a',surfaceObjectName:'mesh'},'floor:BOTH'), false);
  assert.equal(canRenderHeightPoint(null, 'floor:BOTH'), false);
  assert.ok(scopedHeightPointSurface('floor:BOTH','n'.repeat(200)).length <= 160);
});

test('R34 seeds require membership of the active verified source scene', () => {
  const seed = {id:'r34-cd-ridge',surfaceObjectName:'R34'};
  assert.equal(canRenderHeightPoint(seed,'scene:__scene822',['r34-cd-ridge']), true);
  assert.equal(canRenderHeightPoint(seed,'scene:__scene824',['r34-2f-plank-floor']), false);
  assert.equal(canRenderHeightPoint(seed,'scene:__scene822',[]), false);
});
