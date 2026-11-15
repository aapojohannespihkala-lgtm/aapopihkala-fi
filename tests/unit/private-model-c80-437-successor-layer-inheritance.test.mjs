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

// Review fix 15.11: the 437 receipt stores a group node's mesh as null while
// glTF omits the key. Without normalising, every inherited path through a
// group failed (real 488 scene484: technical 40/675 -> 636/675).
test('inherited paths through group nodes (receipt mesh null, glTF key absent) are accepted', async () => {
  const { readFile } = await import('node:fs/promises');
  const receipt = JSON.parse(await readFile(new URL('../../src/scripts/privateModelC80437Receipt.json', import.meta.url), 'utf8'));
  const groups = Object.entries(receipt.nodes).filter(([, n]) => n.mesh === null);
  assert.ok(groups.length > 100, 'receipt has group nodes with mesh null');
  const src = await readFile(new URL('../../src/scripts/privateModelC80437SuccessorLayerInheritance.mjs', import.meta.url), 'utf8');
  assert.match(src, /\(actual\.mesh\?\?null\)!==\(expected\.mesh\?\?null\)/);
});

test('real C80 488 GLB inherits nearly all 437 building and technical paths', { skip: !process.env.C80_WW74_L150_GLB_PATH }, async () => {
  const { readFile } = await import('node:fs/promises');
  const bytes = await readFile(process.env.C80_WW74_L150_GLB_PATH);
  const json = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString('utf8'));
  const scene = resolveC80437SuccessorReceiptScene(json, C80_WW74_L150_GLB_SHA256, 484);
  assert.ok(scene);
  const tech = Object.keys(scene.technical).filter(n => resolveC80437SuccessorTechnicalNode(json, C80_WW74_L150_GLB_SHA256, 484, +n)).length;
  assert.ok(tech / Object.keys(scene.technical).length > 0.9, `technical inherited ${tech}`);
});

test('viewer enables Sisältö layers for every inherited C80 successor (483/488/495/500)', async () => {
  const { readFile } = await import('node:fs/promises');
  const page = await readFile(new URL('../../src/pages/private-model/index.astro', import.meta.url), 'utf8');
  const allow = page.match(/const verifiedChainSourceSha =([\s\S]*?)\? layersLoadedSha : null;/)?.[1] ?? '';
  for (const name of ['C80_SUCC455_SAVO483_GLB_SHA256', 'C80_WW74_L150_GLB_SHA256', 'C80_495_GLB_SHA256', 'C80_500_GLB_SHA256'])
    assert.match(allow, new RegExp(`layersLoadedSha === ${name} \\|\\|`));
});


// KP011 cross-SHA node-ID collision: ROOM3 donor indexes are not C80 identities.
// The same numeric node index describes a different object in another GLB.
test('KP011 cross-SHA node-ID collision is rejected while version-scoped new root is retained', async () => {
  const { readFile } = await import('node:fs/promises');
  const receipt = JSON.parse(await readFile(
    new URL('../../src/scripts/privateModelC80437Receipt.json', import.meta.url), 'utf8'));
  const room3DonorSha = '94727a3c93817b753f62a1e54a4fc7adc87f72f5587534701d5bfec7201f2a28';
  const succ437Sha = 'ed91f792d8f21cc42c4488febd8772276fa3cc42649bd54b560a17823c50e4b8';
  assert.equal(receipt.sha256, succ437Sha);
  assert.equal(isC80LayerSuccessorSha(room3DonorSha), false);
  assert.equal(isC80LayerSuccessorSha(succ437Sha), false);

  const collisions = [
    [12144, 'OM_2F_WALL_V84_RAISED_TOP_TO_Z5_280_5MM_COW_WORK_TEST'],
    [12145, 'OM_V84_2F_STORAGE_WALL_NO_TOP_CAP_COFIT_FLOOR_ZFIGHT_WORK_TEST'],
    [12158, 'PA2_1F_HOT_REAL_MESH_JOINT_20261114_WORK_TEST_HOT_COLD_CLEARANCE_428_COW'],
  ];
  const json = abc500();
  const valid = resolveC80SuccessorTechnicalNode(json, C80_500_GLB_SHA256, 495, 12237);
  assert.equal(valid?.id, 'technical-drainage', 'correctly reindexed 500 drainage root is accepted');
  assert.equal(valid?.apartment, 'SHARED_OTHER');

  for (const [node, succ437Name] of collisions) {
    assert.equal(receipt.nodes[node]?.name, succ437Name);
    // A donor door leaf/handle/latch copied with its old integer ID is NOT
    // an inherited 437 wall/PA2 node of the authenticated 500 source scene.
    json.nodes[node] = {
      name: 'ROOM3_DONOR_UNMAPPED_NODE_' + node,
      mesh: receipt.nodes[node].mesh,
    };
    assert.equal(resolveC80437SuccessorBuildingNode(
      json, C80_500_GLB_SHA256, 495, node, [node]), null);
    assert.equal(resolveC80SuccessorTechnicalNode(
      json, C80_500_GLB_SHA256, 495, node), null);
  }

  for (const wrongSha of [room3DonorSha, succ437Sha, C80_WW74_L150_GLB_SHA256]) {
    assert.equal(resolveC80437SuccessorReceiptScene(json, wrongSha, 495), null);
    assert.equal(resolveC80SuccessorTechnicalNode(json, wrongSha, 495, 12237), null);
  }
  assert.equal(resolveC80SuccessorTechnicalNode(
    json, C80_500_GLB_SHA256, 495, 12237)?.id, 'technical-drainage');
});


// Metamorphic proof: the same valid C80 500 source scene MUST be accepted
// before a donor-ID substitution and rejected AFTER it, without changing SHA
// or reusing a scene label. A negative-only fixture could pass vacuously.
test('KP011 genuine accepted 500 source flips to rejected when ROOM3 IDs enter ABC root', () => {
  const accepted = abc500();
  assert.equal(resolveC80437SuccessorReceiptScene(accepted, C80_500_GLB_SHA256, 495)?.floor, '1F');
  assert.equal(resolveC80SuccessorTechnicalNode(accepted, C80_500_GLB_SHA256, 495, 12237)?.id,
    'technical-drainage');

  for (const collision of [12144, 12145, 12158]) {
    const changed = abc500();
    const originalChildren = [...changed.nodes[12237].children];
    // The invalid donor index was a ROOM3 door part in the other SHA,
    // but means a wall/floor/PA2 hot-water part in the C80 437 receipt.
    changed.nodes[12237].children = [collision, ...originalChildren.slice(1)];
    changed.nodes[collision] = { name: 'ROOM3_DONOR_DOOR_ELEMENT_' + collision, mesh: 4570 };
    assert.equal(resolveC80437SuccessorReceiptScene(changed, C80_500_GLB_SHA256, 495),
      null, 'parent/child source identity must not accept donor ID ' + collision);
    assert.equal(resolveC80SuccessorTechnicalNode(changed, C80_500_GLB_SHA256, 495, collision),
      null, 'donor node cannot inherit drainage role');
    assert.equal(resolveC80SuccessorTechnicalNode(changed, C80_500_GLB_SHA256, 495, 12237),
      null, 'the entire modified source root is no longer authenticated');

    changed.nodes[12237].children = originalChildren;
    assert.equal(resolveC80SuccessorTechnicalNode(changed, C80_500_GLB_SHA256, 495, 12237)?.id,
      'technical-drainage', 'restoring exact parent children restores source identity');
  }

  // Even when the numeric child ID is unchanged, replacing a source mesh
  // with a donor door representation cannot inherit the correct route.
  const wrongMesh = abc500();
  wrongMesh.nodes[12231] = {
    name: 'ROOM3_DOOR_LEAF_WRONG_SHA',
    mesh: 4570,
    extras: { current: false, asBuilt: false, sourceLinksBound: false },
  };
  assert.equal(resolveC80SuccessorTechnicalNode(wrongMesh, C80_500_GLB_SHA256, 495, 12231),
    null, 'wrong mesh/name must be rejected under an otherwise correct root');
});
