import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isC80LayerSuccessorSha,
  resolveC80437SuccessorReceiptScene,
  resolveC80437SuccessorBuildingNode,
  resolveC80437SuccessorTechnicalNode,
  resolveC80SuccessorNewTechnicalNode,
  resolveC80SuccessorTechnicalNode,
} from '../../src/scripts/privateModelC80437SuccessorLayerInheritance.mjs';
import { C80_WW74_L150_GLB_SHA256 } from '../../src/scripts/privateModelC80Ww74L150FloorRuntime.mjs';
import { C80_500_GLB_SHA256 } from '../../src/scripts/privateModelC80500WW1974ABCSourceProfile.mjs';

const make = (sceneCount,nodeCount,meshCount) => ({
  scene:292, scenes:Array.from({length:sceneCount},()=>({nodes:[]})),
  nodes:Array.from({length:nodeCount},()=>({})),
  meshes:Array.from({length:meshCount},()=>({})),
  materials:[],
  asset:{extras:{ModelStage:'WORK_TEST',current:false,asBuilt:false,HUMAN_REVIEW:'NOT_RUN'}},
});
function ww488() {
  const j=make(488,12229,4604);
  j.scenes[467].nodes=[6376];
  j.scenes[483]={
    nodes:[6376,12228],
    extras:{ww74MainCofit:{
      sourceScene:467,floor:'1F',newRoot:12228,
      sourceGlbSha256:'9f24462311166d3c9e75bea5ff0aed8ada21d20094cd92e1b90f2de8895dd487',
      current:false,asBuilt:false,stage:'WORK_TEST_HOST_HOLD',
    }},
  };
  j.nodes[12228]={
    name:'M5_INTEGRATION_CLAUDE_WW_D1F_TO_SITE_SEWER_L150_WORK_TEST_HOST_HOLD',
    children:[12225,12226,12227],
    extras:{current:false,asBuilt:false,sourceLinksBound:false},
  };
  for(let id=12225;id<=12227;id++)j.nodes[id]={name:'SOURCE_DRAIN_'+id,mesh:4500+id-12225};
  return j;
}
function abc500(){
  const j=make(500,12238,4611);
  j.materials=Array.from({length:739},()=>({}));
  j.scenes[483].nodes=[12228];
  j.scenes[495]={
    name:'C80_WW1974_ABC_L100_TO_L150_FROM_SCENE_483_WORK_TEST_HOST_HOLD',
    nodes:[12228,12237],
    extras:{
      stage:'WORK_TEST_HOST_HOLD',asBuilt:false,
      ww1974AbcBranches:{WORK_TEST:true,current:false,asBuilt:false,
        mainRoot:12228,newRoot:12237,parentSourceScene:483},
    },
  };
  j.nodes[12228]={
    name:'M5_INTEGRATION_CLAUDE_WW_D1F_TO_SITE_SEWER_L150_WORK_TEST_HOST_HOLD',
    children:[12225,12226,12227],
  };
  j.nodes[12230]={
    name:'SAVO_MJ83_OWNERPHOTO_CORRECTED_KEYPAD_ROOT_WORK_TEST_HOST_HOLD',
    children:[12229],
  };
  j.nodes[12237]={
    name:'M5_WW1974_APT_ABC_L100_THREE_BRANCHES_TO_L150_WORK_TEST_HOST_HOLD',
    children:[12231,12232,12233,12234,12235,12236],
    extras:{current:false,asBuilt:false,sourceLinksBound:false,originalMainRoot:12228},
  };
  const letters=['A','A','B','B','C','C'];
  for (let i=0;i<6;i++) j.nodes[12231+i]={
    name:'WW1974_'+letters[i]+'_L100_DRAIN_WORK_TEST_HOST_HOLD',
    mesh:4605+i,extras:{current:false,asBuilt:false,sourceLinksBound:false},
  };
  return j;
}
test('known successor SHA is explicit, unknown identity cannot inherit',()=>{
  assert.equal(isC80LayerSuccessorSha(C80_WW74_L150_GLB_SHA256),true);
  assert.equal(isC80LayerSuccessorSha('0'.repeat(64)),false);
  assert.equal(resolveC80437SuccessorReceiptScene(ww488(),'0'.repeat(64),483),null);
});
test('488 authorized 1F source selects correct 437 floor receipt',()=>{
  const s=resolveC80437SuccessorReceiptScene(ww488(),C80_WW74_L150_GLB_SHA256,483);
  assert.equal(s?.floor,'1F');
  assert.equal(s?.glazing,'CLOSED');
  assert.equal(s?.cutaway,false);
});
test('shared sewer root and descendants are drainage, not electrical or CURRENT',()=>{
  const j=ww488();
  for(const node of [12228,12225,12226,12227]){
    const p=resolveC80SuccessorTechnicalNode(j,C80_WW74_L150_GLB_SHA256,483,node);
    assert.equal(p?.id,'technical-drainage');
    assert.equal(p?.apartment,'SHARED_OTHER');
    assert.equal(p?.storey,'1F');
  }
  assert.equal(resolveC80SuccessorTechnicalNode(j,C80_WW74_L150_GLB_SHA256,483,12230),null);
});
test('scene changes and altered source-root children fail closed',()=>{
  const j=ww488();
  assert.equal(resolveC80437SuccessorReceiptScene(j,C80_WW74_L150_GLB_SHA256,467),null);
  j.nodes[12228].children=[12225,12226,12227,12231];
  assert.equal(resolveC80SuccessorNewTechnicalNode(j,C80_WW74_L150_GLB_SHA256,483,12225),null);
});
test('old 437 part has no inheritance without exact node FNV and path',()=>{
  const j=ww488();
  assert.equal(resolveC80437SuccessorBuildingNode(j,C80_WW74_L150_GLB_SHA256,483,6376,[6376]),null);
  assert.equal(resolveC80437SuccessorTechnicalNode(j,C80_WW74_L150_GLB_SHA256,483,1712),null);
});
test('CURRENT or as-built cannot inherit WORK_TEST layers',()=>{
  const j=ww488();
  j.asset.extras.current=true;
  assert.equal(resolveC80437SuccessorReceiptScene(j,C80_WW74_L150_GLB_SHA256,483),null);
  j.asset.extras.current=false; j.asset.extras.asBuilt=true;
  assert.equal(resolveC80SuccessorTechnicalNode(j,C80_WW74_L150_GLB_SHA256,483,12228),null);
});
test('500 A-C six-branch root is shared drainage and cannot leak into 2F',()=>{
  const j=abc500();
  const spec=resolveC80437SuccessorReceiptScene(j,C80_500_GLB_SHA256,495);
  assert.equal(spec?.floor,'1F');
  for(const id of [12237,12231,12232,12233,12234,12235,12236]){
    assert.equal(resolveC80SuccessorTechnicalNode(j,C80_500_GLB_SHA256,495,id)?.id,'technical-drainage');
  }
  assert.equal(resolveC80SuccessorTechnicalNode(j,C80_500_GLB_SHA256,488,12237),null);
});
test('500 modified A-C source mesh fails source-exact group proof',()=>{
  const j=abc500();
  j.nodes[12233].mesh=123;
  assert.equal(resolveC80SuccessorTechnicalNode(j,C80_500_GLB_SHA256,495,12233),null);
});
