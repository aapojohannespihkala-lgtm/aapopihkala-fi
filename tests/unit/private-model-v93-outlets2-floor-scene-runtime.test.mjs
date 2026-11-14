import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
  OUTLETS2_SOURCE_SHA256 as SHA,
  OUTLETS2_OPTIN_SCENES as INDICES,
  OUTLETS2_BUILDING_SCENES as SPECS,
  OUTLETS2_SOURCE_ROOTS as SOCKETS,
} from '../../src/scripts/privateModelC80R2V93DoubleOutletLayerSourceProfile.mjs';
import {
  v93Outlets2RootFnv32,resolveV93Outlets2Scenes,
  createV93Outlets2FloorRuntime,
} from '../../src/scripts/privateModelV93Outlets2FloorSceneRuntime.mjs';
const floors=['1F','2F','BOTH'];
const counts=[241,155,394];
const hashes=['fd7209af','900b22cf','27048bc0'];
const oldRoots=[11482,11486];

function mockGltf(){
  const nodes=Array.from({length:11515},(_,i)=>({name:'source_'+i}));
  for(const f of ['1F','2F']){
    const id=SOCKETS[f].node;
    nodes[id]={name:SOCKETS[f].name,extras:{
      numSocketPositions:2,oneProtectivePlasticCover:true,hostHold:true,asBuilt:false,
      physicalWiring:'NOT_MODELED_OR_VERIFIED',
    }};
  }
  const json={scene:292,nodes,meshes:Array(4350),scenes:Array(309),
    asset:{extras:{ModelStage:'WORK_TEST',current:false,asBuilt:false,HUMAN_REVIEW:'NOT_RUN'}}};
  const runtimeScenes=Array.from({length:309},()=>({name:'default',children:[],traverse(fn){this.children.forEach(fn);}}));
  for(const f of floors){
    const i=INDICES[f],roots=[...SPECS[i].rootNodes];
    const old=f==='1F'?[11482]:f==='2F'?[11486]:oldRoots;
    json.scenes[i]={name:SPECS[i].name,nodes:roots,extras:{
      sourceScene:f==='1F'?303:f==='2F'?304:305,
      workTest:true,hostHold:true,current:false,asBuilt:false,
      productionApproved:false,electricalWiringVerified:false,
      replacesOldGenericSingleSocketNodesOnlyInThisOptInScene:old,
    }};
    runtimeScenes[i]={name:SPECS[i].name,
      children:roots.map(n=>({name:nodes[n].name,isMesh:n===11500||n===11514})),
      traverse(fn){this.children.forEach(fn);}};
  }
  json.scenes[292]={name:'original default',nodes:[]};
  const gltf={parser:{json},scenes:runtimeScenes,scene:runtimeScenes[292]};
  return gltf;
}

test('genuine authored profile indices, unique roots and ordered FNV stay fixed',()=>{
  assert.deepEqual(floors.map(f=>INDICES[f]),[306,307,308]);
  floors.forEach((f,i)=>{
    assert.equal(SPECS[INDICES[f]].rootNodes.length,counts[i]);
    assert.equal(v93Outlets2RootFnv32(SPECS[INDICES[f]].rootNodes),hashes[i]);
    assert.equal(new Set(SPECS[INDICES[f]].rootNodes).size,counts[i]);
    assert.equal(oldRoots.some(n=>SPECS[INDICES[f]].rootNodes.includes(n)),false);
  });
  assert.equal(v93Outlets2RootFnv32([1,-1]),null);
});

test('SHA-locked scenes reject untrusted or incomplete source',()=>{
  assert.equal(resolveV93Outlets2Scenes(null,SHA),null);
  assert.equal(resolveV93Outlets2Scenes(mockGltf(),'0'.repeat(64)),null);
  const m=mockGltf();
  assert.deepEqual(Object.keys(resolveV93Outlets2Scenes(m,SHA)),floors);
  m.parser.json.scenes[306].nodes.reverse();
  assert.equal(resolveV93Outlets2Scenes(m,SHA),null);
});

test('no duplicate old one-socket roots, cross-floor socket or bogus physical approval',()=>{
  const m=mockGltf();
  m.parser.json.scenes[307].nodes.push(11500);
  assert.equal(resolveV93Outlets2Scenes(m,SHA),null);
  m.parser.json.scenes[307].nodes.pop();
  m.parser.json.scenes[308].extras.electricalWiringVerified=true;
  assert.equal(resolveV93Outlets2Scenes(m,SHA),null);
  m.parser.json.scenes[308].extras.electricalWiringVerified=false;
  m.parser.json.asset.extras.asBuilt=true;
  assert.equal(resolveV93Outlets2Scenes(m,SHA),null);
});

test('ordinary floor control mounts 306 307 308 and restores original default 292',()=>{
  const gltf=mockGltf();let mounted=gltf.scene;
  const rt=createV93Outlets2FloorRuntime({gltf,sha:SHA,
    mount:scene=>{mounted=scene;},mounted:()=>mounted});
  assert.equal(rt.available,true);assert.equal(rt.sceneIndex,292);
  assert.equal(rt.defaultScene,gltf.scene);
  for(const floor of floors){
    rt.restore();assert.equal(mounted,gltf.scene);
    const report=rt.apply(floor);
    assert.ok(report && report.exceptions.length===0);
    assert.equal(rt.sceneIndex,INDICES[floor]);
    assert.equal(mounted,gltf.scenes[INDICES[floor]]);
  }
  rt.restore();assert.equal(mounted,gltf.scene);assert.equal(rt.active,false);
  assert.equal(rt.sceneIndex,292);
  rt.dispose();assert.equal(rt.apply('1F'),null);
});

test('other mounted scene, invalid floor and wrong source cannot switch',()=>{
  const gltf=mockGltf();let mounted={};
  const rt=createV93Outlets2FloorRuntime({gltf,sha:SHA,
    mount:s=>{mounted=s;},mounted:()=>mounted});
  assert.equal(rt.apply('1F'),null);mounted=gltf.scene;
  assert.equal(rt.apply('3F'),null);
  assert.throws(()=>createV93Outlets2FloorRuntime({
    gltf,sha:'wrong',mount:()=>{},mounted:()=>gltf.scene,
  }),/SOURCE_SCENE_MISMATCH/);
});

test('viewer uses V93 exact SHA before generic floor chain, no C70 or CURRENT rewrite',()=>{
  const txt=readFileSync(new URL('../../src/pages/private-model/index.astro',import.meta.url),'utf8');
  assert.match(txt,/createV93Outlets2FloorRuntime\(/);
  assert.match(txt,/loadedModelSha256\(gltf\) === OUTLETS2_SOURCE_SHA256/);
  assert.match(txt,/createSuccessor369FloorRuntime\(/);
  assert.match(txt,/createC80R2ChainFloorRuntime\(/);
  assert.match(txt,/sourceKind === 'work-test' && !c70PreviewSession &&/);
});

test('authenticated original private GLB 306 307 308 scene/parent/roots', {
  skip:!process.env.YLIS_V93_OUTLETS2_GLB,
},()=>{
  const b=readFileSync(process.env.YLIS_V93_OUTLETS2_GLB);
  assert.equal(b.toString('ascii',0,4),'glTF');
  assert.equal(b.readUInt32LE(8),b.length);
  assert.equal(createHash('sha256').update(b).digest('hex'),SHA);
  const json=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString('utf8'));
  const scenes=json.scenes.map(s=>({name:s.name,
    children:(s.nodes??[]).map(n=>({name:json.nodes[n].name})),
    traverse(fn){for(const child of this.children)fn(child);}}));
  const gltf={scene:scenes[json.scene],scenes,parser:{json}};
  assert.deepEqual(Object.keys(resolveV93Outlets2Scenes(gltf,SHA)),floors);
  let mounted=gltf.scene;
  const rt=createV93Outlets2FloorRuntime({gltf,sha:SHA,
    mount:s=>{mounted=s;},mounted:()=>mounted});
  for(const f of floors){
    assert.ok(rt.apply(f));
    assert.equal(mounted,gltf.scenes[INDICES[f]]);
    rt.restore();assert.equal(mounted,gltf.scene);
  }
});
