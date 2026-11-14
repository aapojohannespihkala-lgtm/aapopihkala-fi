import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
 C80_512_SHA256, C80_512_SCENES, C80_512_GLB_BYTES, C80_512_PARENT_SHA256,
 isC80512T110SourceScene, resolveC80512T110SceneIndex,
 resolveC80512T110Scenes, c80512T110TechnicalReviewRoots,
} from '../../src/scripts/privateModelC80512T110RoofSourceProfile.mjs';

function mock() {
 const json={scene:292,scenes:Array.from({length:512},()=>({name:'OLD',nodes:[]})),
   nodes:Array.from({length:12243},()=>({})),meshes:Array.from({length:4612},()=>({})),
   materials:Array.from({length:740},()=>({}))};
 const t={m5System:'VIEMARI',workAssumption:true,sourceGlbSHA256:C80_512_PARENT_SHA256,
   existingT110Node:10145,sourceRoofNode:6642,roofOpeningCut:false,flashingModeled:false,
   insulationModeled:false,capModeled:false,physicalRoofPointVerified:false,
   sourceLinksBoundForNewSHA:false,current:false,asBuilt:false};
 json.nodes[10145]={name:'SOURCE_T110',mesh:3701,matrix:[1,0,0,0,0,1,0,0,0,0,1,0,.221,0,0,1]};
 json.nodes[12239]={name:'C80_512_T110_2015_ROOF_VENT_OPEN_END_2F_BOTH_WORK_TEST_HOST_HOLD',mesh:4611,extras:{...t}};
 json.nodes[12240]={name:'C80_512_T110_2015_ROOF_VENT_OPEN_END_2F_ONLY_WORK_TEST_HOST_HOLD',mesh:4611,extras:{...t}};
 json.nodes[12241]={name:'C80_512_T110_SOURCE_10145_EXACT_DONOR_VISIBILITY_2F_WORK_TEST_HOST_HOLD',mesh:3701,matrix:[...json.nodes[10145].matrix],extras:{m5System:'VIEMARI',current:false,asBuilt:false}};
 json.nodes[12242]={name:'C80_512_T110_2F_ONLY_ROOT_SOURCE_AND_ROOFTOP_EXTENSION',children:[12240,12241],extras:{m5System:'VIEMARI',sourceLinksBound:false,current:false,asBuilt:false}};
 for(const [k,spec] of Object.entries(C80_512_SCENES)){
  const index=Number(k);json.scenes[spec.parent]={name:'PARENT_'+spec.parent,nodes:spec.floor==='2F'?[12230]:[12228,12230,12237,12238]};
  if(index===500){json.scenes[500]={name:'C80_505_H24_FRAME_CLEARANCE_FROM_SCENE_495_WORK_TEST_HOST_HOLD',nodes:[12228,12237,12238],extras:{h24FrameCofit:{sourceScene:495},stage:'WORK_TEST_HOST_HOLD',asBuilt:false}};continue;}
  json.scenes[index]={name:'C80_512_T110_ROOF_VENT_FROM_SCENE_'+spec.parent+'_WORK_TEST_HOST_HOLD',nodes:[...json.scenes[spec.parent].nodes,spec.root],extras:{stage:'WORK_TEST_HOST_HOLD',asBuilt:false,sourceLinksBoundForNewSHA:false,t110RoofVentCofit:{originalSceneIndex:spec.parent,appendedRoot:spec.root,newTubeMesh:4611,sourceExactGlbSha256:C80_512_PARENT_SHA256,sourceT110Node:10145,sourceRoofNode:6642,modelStage:'WORK_TEST_HOST_HOLD',sourceLinksBound:false,CURRENT:false,asBuilt:false,physicalRoofOpeningVerified:false}}};
 }
 return json;
}

test('exact 8 floor/glazing scene roles, no implicit cutaway or rooftop on 1F',()=>{
 assert.deepEqual(Object.keys(C80_512_SCENES).map(Number),[500,505,506,507,508,509,510,511]);
 for(const [i,r] of Object.entries(C80_512_SCENES)) assert.equal(resolveC80512T110SceneIndex(r.floor,r.glazing,r.cutaway),Number(i));
 assert.equal(resolveC80512T110SceneIndex('1F','ONE_OPEN'),null);
 assert.equal(resolveC80512T110SceneIndex('BOTH','ONE_OPEN',true),null);
 assert.equal(resolveC80512T110SceneIndex('3F'),null);
});

test('source-only exact-sha, provenance and physical roof HOLD fail closed',()=>{
 const json=mock();
 for(const index of Object.keys(C80_512_SCENES).map(Number)) assert.equal(isC80512T110SourceScene(json,C80_512_SHA256,index),true,'scene '+index);
 assert.equal(isC80512T110SourceScene(json,'wrong',508),false);
 assert.equal(isC80512T110SourceScene(json,C80_512_SHA256,292),false);
 const scenario=(edit)=>{const j=structuredClone(json);edit(j);assert.equal(isC80512T110SourceScene(j,C80_512_SHA256,508),false)};
 scenario(j=>{j.scenes[508].nodes.pop()});
 scenario(j=>{j.scenes[508].extras.t110RoofVentCofit.originalSceneIndex=490});
 scenario(j=>{j.scenes[508].extras.t110RoofVentCofit.physicalRoofOpeningVerified=true});
 scenario(j=>{j.nodes[12239].extras.roofOpeningCut=true});
 scenario(j=>{j.nodes[12239].extras.current=true});
 scenario(j=>{j.nodes[12241].matrix[12]=.4});
 scenario(j=>{j.nodes[12242].children=[12240]});
 scenario(j=>{j.nodes[12239].extras.m5System='VESI'});
 assert.deepEqual(c80512T110TechnicalReviewRoots(json,C80_512_SHA256,508).map(x=>x.node),[12228,12230,12237,12238,12239]);
 assert.deepEqual(c80512T110TechnicalReviewRoots(json,C80_512_SHA256,505).map(x=>x.node),[12230,12242]);
});

test('viewer scene objects are validated, but remain source-only without publishing',()=>{
 const json=mock(),rendered=json.scenes.map(s=>({name:s.name,children:Array(s.nodes.length).fill({})}));
 const scenes=resolveC80512T110Scenes({parser:{json},scenes:rendered},C80_512_SHA256);
 assert.equal(Object.keys(scenes).length,8);
 rendered[508].name='BAD';assert.equal(resolveC80512T110Scenes({parser:{json},scenes:rendered},C80_512_SHA256),null);
});

test('authentic GLB bytes/source-scene coverage, when explicitly supplied', t=>{
 const path=process.env.C80_512_GLB_PATH;
 if(!path)return t.skip('No authenticated 55 MB C80 512 GLB fixture in CI');
 const data=readFileSync(path);assert.equal(data.length,C80_512_GLB_BYTES);
 assert.equal(createHash('sha256').update(data).digest('hex'),C80_512_SHA256);
 assert.equal(data.toString('utf8',0,4),'glTF');assert.equal(data.readUInt32LE(4),2);
 const jsonLength=data.readUInt32LE(12);assert.equal(data.toString('utf8',16,20),'JSON');
 const json=JSON.parse(data.toString('utf8',20,20+jsonLength));
 for(const index of Object.keys(C80_512_SCENES).map(Number))assert.equal(isC80512T110SourceScene(json,C80_512_SHA256,index),true,'real '+index);
});
