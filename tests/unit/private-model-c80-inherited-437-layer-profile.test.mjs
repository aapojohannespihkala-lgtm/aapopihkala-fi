import test from 'node:test';
import assert from 'node:assert/strict';
import { c80437Fingerprint } from '../../src/scripts/privateModelC80437SourceProfile.mjs';
import {
  verifyInherited437Path, isC80Inherited437Sha,
  isC80Inherited437Scene, resolveC80Inherited437LayerNode,
} from '../../src/scripts/privateModelC80Inherited437LayerProfile.mjs';
import { C80_500_GLB_SHA256 } from '../../src/scripts/privateModelC80500WW1974ABCSourceProfile.mjs';

test('unchanged 437 receipt path accepts only the same scene-root and definitions', () => {
  const parent={ name:'unchanged', children:[11] };
  const leaf={ name:'pipe', mesh:4 };
  const original={ 10:{ name:parent.name, mesh:undefined, fnv:c80437Fingerprint(parent) },
    11:{ name:leaf.name, mesh:leaf.mesh, fnv:c80437Fingerprint(leaf) }};
  const json={scenes:[{nodes:[10]}],nodes:[]};
  json.nodes[10]=structuredClone(parent);
  json.nodes[11]=structuredClone(leaf);
  const entry={id:'technical-drainage',paths:[[10,11]]};
  assert.equal(verifyInherited437Path(json,0,11,[10,11],entry,original),true);
  json.nodes[10].children=[11,11];
  assert.equal(verifyInherited437Path(json,0,11,[10,11],entry,original),false);
  json.nodes[10].children=[11];
  json.nodes[11].mesh=5;
  assert.equal(verifyInherited437Path(json,0,11,[10,11],entry,original),false);
  json.nodes[11].mesh=4;
  json.scenes[0].nodes=[12];
  assert.equal(verifyInherited437Path(json,0,11,[10,11],entry,original),false);
  json.scenes[0].nodes=[10];
  assert.equal(verifyInherited437Path(json,0,11,[11],entry,original),false);
});
test('successor receipt remains SHA and selected scene fail-closed', () => {
  assert.equal(isC80Inherited437Sha(C80_500_GLB_SHA256),true);
  assert.equal(isC80Inherited437Sha('a'.repeat(64)),false);
  const invalid={scene:292,scenes:[],asset:{extras:{ModelStage:'WORK_TEST',current:false,asBuilt:false,HUMAN_REVIEW:'NOT_RUN'}}};
  assert.equal(isC80Inherited437Scene(invalid,C80_500_GLB_SHA256,496,'BOTH'),false);
  assert.equal(resolveC80Inherited437LayerNode(invalid,C80_500_GLB_SHA256,496,'BOTH',12231,[12237,12231]),null);
  assert.equal(resolveC80Inherited437LayerNode(invalid,'a'.repeat(64),496,'BOTH',12231,[12237,12231]),null);
});
