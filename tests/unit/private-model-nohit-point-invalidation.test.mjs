import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Regression for the real index.astro point-picking handler, without private GLB
// assets. Protected browser/WebGL acceptance remains a separate requirement.
const viewer=readFileSync(new URL('../../src/pages/private-model/index.astro',import.meta.url),'utf8');

const clearBody=viewer.match(/const clearPickedPoint = \(\) => \{([\s\S]*?)\n {6}\};/)?.[1];
const pointHandler=viewer.split('const pickModelPoint = (clientX: number, clientY: number) => {')[1]
  ?.split('pointPickOverlay.show(point, null);')[0];
const missBody=pointHandler?.match(/if \(!point\) \{([\s\S]*?)\n {8}\}/)?.[1];

test('no-hit branch invalidates cached point before feedback, not merely a warning',()=>{
  assert.ok(clearBody,'real viewer point clear handler must remain present');
  assert.ok(missBody,'real viewer no-hit handler must remain present');
  assert.match(missBody,/clearPickedPoint\(\);[\s\S]*pointPickFeedback\.textContent/);
  assert.match(missBody,/return;/);
  assert.doesNotMatch(missBody,/Edellinen piste säilyy/);
  assert.match(viewer,/canvas\.dataset\.interactionMode === 'point-pick'\) \{\s*pickModelPoint\(event\.clientX, event\.clientY\);/);
});

test('hit -> miss -> hit -> miss clears XYZ, source/mesh, clipboard, overlay and copy permission',()=>{
  assert.ok(clearBody && missBody);
  let clears=0;
  const state={
    pointPickOverlay:{clear(){clears++;}},
    pointPickClipboardText:'',
    pointPickMain:{textContent:''},
    pointPickSource:{textContent:''},
    pointPickSurface:{textContent:''},
    pointPickFeedback:{textContent:''},
    pointPickCopyButton:{disabled:true},
    canvas:{dataset:{pointPickState:'empty'}},
  };
  vm.createContext(state);
  const miss=new vm.Script('function clearPickedPoint(){'+clearBody+'}\nfunction missed(){'+missBody+'}\nmissed();');
  const hit=()=>{
    state.pointPickClipboardText='X=1.000 Y=2.000 Z=3.000, SHA=previous, mesh=previous';
    state.pointPickMain.textContent='X 1.000 m';
    state.pointPickSource.textContent='WORK_TEST SHA previous kerros 1F';
    state.pointPickSurface.textContent='Osumapinta: old-mesh';
    state.pointPickCopyButton.disabled=false;
    state.canvas.dataset.pointPickState='picked';
  };
  for(let i=0;i<2;i++){
    hit();
    assert.equal(state.pointPickCopyButton.disabled,false);
    miss.runInContext(state);
    assert.equal(state.pointPickClipboardText,'','no cached XYZ/GLB SHA/mesh copied after miss');
    assert.equal(state.pointPickCopyButton.disabled,true);
    assert.equal(state.canvas.dataset.pointPickState,'empty');
    assert.equal(state.pointPickMain.textContent,'Klikkaa näkyvää mallipintaa.');
    assert.equal(state.pointPickSource.textContent,'YLIS-G1-LOCAL, koordinaatit metreinä');
    assert.equal(state.pointPickSurface.textContent,'Osumapinta: ei valittu');
    assert.match(state.pointPickFeedback.textContent,/Ei osumaa.*tyhjennetty.*Kopiointi estetty/);
  }
  assert.equal(clears,2,'both stale on-screen markers removed');
});

test('valid hit source evidence and scene/tool reset gates stay in place',()=>{
  assert.match(viewer,/Varmuus: WORK_TEST_MODEL_POINT_ONLY, ei as-built/);
  assert.match(viewer,/pointPickClipboardText = \[/);
  assert.match(viewer,/pointPickCopyButton\.disabled = false;/);
  assert.match(viewer,/canvas\.dataset\.pointPickState = 'picked';/);
  assert.match(viewer,/const setModelScene = \(root: any\) => \{[\s\S]*?clearPickedPoint\(\);\s*modelRoot\.clear\(\);/);
  assert.match(viewer,/if \(mode !== 'point-pick'\) clearPickedPoint\(\);/);
  assert.match(viewer,/if \(!pointPickClipboardText\) return;/);
});
