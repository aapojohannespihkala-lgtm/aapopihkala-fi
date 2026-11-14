import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
 C80_500_GLB_SHA256,C80_500_GLB_BYTES,C80_500_ABC_ROOT,
 C80_500_L150_ROOT,C80_500_SAVO_ROOT,C80_500_NEW_PARENT_SCENES,
 C80_500_VIEWER_ROLES,isC80500ABCSourceScene,resolveC80500ABCScenes,
 resolveC80500ABCSceneIndex,
} from '../../src/scripts/privateModelC80500WW1974ABCSourceProfile.mjs';
const cases=[[495,'1F','CLOSED',false],[488,'2F','CLOSED',false],
 [496,'BOTH','CLOSED',false],[490,'2F','ONE_OPEN',false],
 [497,'BOTH','ONE_OPEN',false],[492,'2F','STACKED',false],
 [498,'BOTH','STACKED',false],[499,'BOTH','CLOSED',true]];
test('500 keeps 495 2F and adds exactly five A-C L100 floor scenes',()=>{
 assert.equal(Object.keys(C80_500_VIEWER_ROLES).length,8);
 assert.deepEqual(Object.keys(C80_500_NEW_PARENT_SCENES).map(Number),[495,496,497,498,499]);
 for(const [i,f,g,c] of cases)assert.equal(resolveC80500ABCSceneIndex(f,g,c),i);
 assert.equal(resolveC80500ABCSceneIndex('BOTH','ONE_OPEN',true),null);
 assert.equal(resolveC80500ABCSceneIndex('1F','STACKED'),null);
});
test('mismatched digest, missing nodes, invalid GLB and wrong scene fail closed',()=>{
 assert.equal(isC80500ABCSourceScene({},C80_500_GLB_SHA256,496),false);
 assert.equal(isC80500ABCSourceScene({},'wrong',496),false);
 assert.equal(resolveC80500ABCScenes(null,C80_500_GLB_SHA256),null);
 assert.equal(resolveC80500ABCScenes({scenes:Array(500).fill({})},'wrong'),null);
});
const fixture=process.env.C80_500_GLB_PATH;
test('authentic 55 MB GLB validates eight floor roles, appended roots and negative mutations',
 {skip:!fixture},()=>{
 const buf=readFileSync(fixture);
 assert.equal(buf.length,C80_500_GLB_BYTES);
 assert.equal(createHash('sha256').update(buf).digest('hex'),C80_500_GLB_SHA256);
 const json=JSON.parse(buf.subarray(20,20+buf.readUInt32LE(12)).toString('utf8'));
 const scenes=json.scenes.map(s=>({
   name:s.name,children:s.nodes.map(i=>({name:json.nodes[i].name}))
 }));
 const gltf={parser:{json},scenes};
 assert.ok(resolveC80500ABCScenes(gltf,C80_500_GLB_SHA256));
 for(const [index,floor] of cases){
   assert.equal(isC80500ABCSourceScene(json,C80_500_GLB_SHA256,index),true);
   const nodes=json.scenes[index].nodes;
   assert.equal(nodes.includes(C80_500_ABC_ROOT),floor!=='2F');
   assert.equal(nodes.includes(C80_500_L150_ROOT),floor!=='2F');
   assert.equal(nodes.includes(C80_500_SAVO_ROOT),floor!=='1F');
 }
 for(const [id,parent] of Object.entries(C80_500_NEW_PARENT_SCENES)){
   assert.deepEqual(json.scenes[Number(id)].nodes,[...json.scenes[parent].nodes,C80_500_ABC_ROOT]);
   const mutated=structuredClone(json);
   mutated.scenes[Number(id)].nodes.pop();
   assert.equal(isC80500ABCSourceScene(mutated,C80_500_GLB_SHA256,Number(id)),false);
 }
 assert.deepEqual(json.nodes[C80_500_ABC_ROOT].children,[12231,12232,12233,12234,12235,12236]);
 const wrong=structuredClone(json);
 wrong.nodes[C80_500_ABC_ROOT].extras.current=true;
 assert.equal(isC80500ABCSourceScene(wrong,C80_500_GLB_SHA256,496),false);
});
