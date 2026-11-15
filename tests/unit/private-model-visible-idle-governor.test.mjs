import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createVisibleIdleFrameGovernor as make} from '../../src/scripts/privateModelVisibleIdleGovernor.mjs';

test('idle visible loop throttles only after a real first frame', () => {
  const gate=make({idleRefreshMs:125,activeHoldMs:1500});
  assert.equal(gate.shouldRun(0),true);
  assert.equal(gate.shouldRun(16),false);
  assert.equal(gate.shouldRun(124),false);
  assert.equal(gate.shouldRun(125),true);
  assert.equal(gate.shouldRun(126),false);
  assert.equal(gate.shouldRun(250),true);
});

test('user activity retains smooth full-rate frames, then idles', () => {
  const gate=make();
  gate.shouldRun(0);
  gate.invalidate(300);
  for(const t of [301,317,601,1000,1799,1800])
    assert.equal(gate.shouldRun(t),true,`expected interactive frame at ${t}`);
  assert.equal(gate.shouldRun(1801),false);
  assert.equal(gate.shouldRun(1925),true);
  gate.invalidate(1930);
  assert.equal(gate.shouldRun(1931),true);
  assert.equal(gate.shouldRun(1980),true);
});

test('background and clock reset never leave the frame black', () => {
  const gate=make();
  assert.equal(gate.shouldRun(100),true);
  assert.equal(gate.shouldRun(110,false),false);
  assert.equal(gate.shouldRun(111,false),false);
  assert.equal(gate.shouldRun(112,true),true);
  assert.equal(gate.shouldRun(113,true),false);
  assert.equal(gate.shouldRun(0,true),true);
  gate.invalidate(Number.NaN);
  assert.equal(gate.shouldRun(1),true);
  assert.equal(gate.shouldRun(Number.NaN),true);
});

test('wrong settings fail closed, normal viewer never opts in implicitly', () => {
  for(const cfg of [{idleRefreshMs:0},{idleRefreshMs:-1},{activeHoldMs:-1},
    {idleRefreshMs:Number.NaN},{activeHoldMs:Infinity}])
    assert.throws(()=>make(cfg),/VIEWER_IDLE_BUDGET_INVALID/);
  const page=readFileSync(new URL('../../src/pages/private-model/index.astro',import.meta.url),'utf8');
  assert.match(page,/get\('viewerIdlePilot'\) === '1'/);
  assert.match(page,/if \(viewerIdlePilot && !viewerIdlePilot\.shouldRun\(performance\.now\(\)\)\) return;/);
  assert.match(page,/document\.visibilityState === 'hidden'/);
});
