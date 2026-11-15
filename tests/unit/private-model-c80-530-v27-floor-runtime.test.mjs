import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_530_V27_GLB_SHA256 as SHA,C80_530_V27_GLB_BYTES as BYTES,
 C80_530_V27_SCENES as SPECS,
} from '../../src/scripts/privateModelC80530V27SourceProfile.mjs';
import {
 C80_530_V27_VIEWER_ROLES as ROLES,
 resolveC80530V27SceneIndex as index,resolveC80530V27Scenes as resolve,
 createC80530V27FloorRuntime as create,c80530V27ReviewProfile as review,
 c80530RenderedRootPathMatches as renderedRootsMatch,
 c80530SnapshotRenderedSourceTree as snapshotTree,
 c80530RenderedSourceTreeUnchanged as treeUnchanged,
} from '../../src/scripts/privateModelC80530V27FloorRuntime.mjs';

const modes=[
 [524,'1F','CLOSED',false],[525,'2F','CLOSED',false],
 [526,'BOTH','CLOSED',false],[527,'BOTH','ONE_OPEN',false],
 [528,'BOTH','STACKED',false],[529,'BOTH','CLOSED',true],
];
test('six authentic floor modes and unsupported 1F/2F glazing fail closed',()=>{
 assert.equal(ROLES['1F'],524);
 assert.equal(ROLES['2F'],525);
 assert.equal(ROLES.BOTH.CUTAWAY,529);
 for(const [scene,f,g,c] of modes)assert.equal(index(f,g,c),scene);
 for(const args of [['1F','ONE_OPEN',false],['2F','STACKED',false],
  ['2F','CLOSED',true],['BOTH','ONE_OPEN',true],['BOTH','WRONG',false],
  ['BOTH','CLOSED','true'],['UNKNOWN','CLOSED',false]])
  assert.equal(index(...args),null);
 assert.equal(Object.keys(SPECS).length,6);
});
test('untrusted source and missing mount callbacks reject adapter',()=>{
 assert.equal(resolve(null,SHA),null);
 assert.equal(resolve({parser:{json:{}},scenes:[]},SHA),null);
 assert.equal(review({},SHA,526),null);
 assert.equal(review({},'0'.repeat(64),526),null);
 assert.throws(()=>create({gltf:null,sha:SHA,mount:null,mounted:()=>null}),/C80_530_MOUNT_CONTRACT/);
 assert.throws(()=>create({gltf:null,sha:SHA,mount:()=>{},mounted:()=>null}),/C80_530_SOURCE_SCENE_MISMATCH/);
});
const fixture=process.env.C80_530_V27_GLB_PATH;
function load(){
 const bytes=readFileSync(fixture);
 assert.equal(bytes.length,BYTES);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),SHA);
 const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'));
 const active=new Set([524,525,526,527,528,529]);
 const build=id=>({name:json.nodes[id]?.name??'',
  children:(json.nodes[id]?.children??[]).map(build)});
 const scenes=json.scenes.map((s,i)=>({name:s.name,
  children:active.has(i)?s.nodes.map(build):[],
  traverse(fn){for(const n of s.nodes)fn({isMesh:Number.isInteger(json.nodes[n]?.mesh)});}}));
 return {json,scenes,gltf:{parser:{json},scenes}};
}
test('real C80 530 GLB mounts six scene roles, terrain stays outside MEP review',
 {skip:!fixture},()=>{
 const {json,gltf,scenes}=load(),accepted=resolve(gltf,SHA);
 assert.ok(accepted);
 let current=accepted[526];
 const runtime=create({gltf,sha:SHA,mount(next){current=next;},mounted(){return current;}});
 assert.equal(runtime.defaultScene,current);
 assert.equal(runtime.publicationStatus,'NOT_AUTHORIZED');
 assert.equal(runtime.terrainPhysicalHostStatus,'NOT_VERIFIED');
 assert.equal(runtime.sourceLinksStatus,'NOT_BOUND');
 for(const [scene,f,g,c] of modes){
  assert.equal(runtime.restore(),true);
  const result=c?runtime.setCutaway(true):f==='BOTH'&&g!=='CLOSED'?
    runtime.setGlazing(g):runtime.apply(f);
  assert.ok(result,'real scene '+scene);
  assert.equal(runtime.sceneIndex,scene);
  assert.equal(runtime.selectedScene,current);
  assert.equal(runtime.floor,f);
  assert.equal(runtime.glazing,g);
  assert.equal(runtime.cutaway,c);
  const profile=review(json,SHA,scene);
  assert.ok(profile);
  assert.ok(profile.roots[scene].length>0);
  for(const forbidden of [9008,12251,12252,12253,12254])
   assert.equal(profile.roots[scene].some(r=>r.node===forbidden),false,'terrain/ghost not MEP');
  assert.equal(profile.physicalTerrainSurveyVerified,false);
  assert.equal(profile.publicationAllowed,false);
 }
 assert.equal(runtime.restore(),true);
 assert.ok(runtime.apply('2F'));
 assert.ok(runtime.apply('1F'));
 assert.ok(runtime.apply('BOTH'));
 assert.ok(runtime.setCutaway(true));
 assert.equal(runtime.setGlazing('ONE_OPEN'),null);
 assert.ok(runtime.setCutaway(false));
 assert.ok(runtime.setGlazing('ONE_OPEN'));
 current=null;
 assert.equal(runtime.apply('1F'),null);
 current=scenes[527];
 runtime.dispose();
 assert.equal(runtime.apply('1F'),null);
 assert.equal(runtime.restore(),false);
});
test('mutated live source prevents transition and restore despite creation-time success',
 {skip:!fixture},()=>{
 const {json,gltf,scenes}=load();
 let current=scenes[526];
 const runtime=create({gltf,sha:SHA,mount(next){current=next;},mounted(){return current;}});
 const old=json.scenes[525].extras.v27ClipApplied;
 json.scenes[525].extras.v27ClipApplied=true;
 assert.equal(runtime.apply('2F'),null);
 assert.equal(current,scenes[526]);
 json.scenes[525].extras.v27ClipApplied=old;
 assert.ok(runtime.apply('2F'));
 const oldRoot=json.scenes[526].nodes[107];
 json.scenes[526].nodes[107]=9008;
 assert.equal(runtime.restore(),false);
 assert.equal(current,scenes[525]);
 json.scenes[526].nodes[107]=oldRoot;
 assert.equal(runtime.restore(),true);
 const v=json.nodes[12254].extras.physicalFoundationClaim;
 json.nodes[12254].extras.physicalFoundationClaim=true;
 assert.equal(runtime.apply('1F'),null);
 assert.equal(runtime.restore(),false);
 json.nodes[12254].extras.physicalFoundationClaim=v;
 assert.ok(runtime.apply('1F'));
 current=scenes[526];
 assert.equal(runtime.apply('2F'),null,'external scene mount must be noticed');
});

test('530 rendered root order, nested tree, loader aliases and association mismatch fail closed',()=>{
 const json={scenes:[{nodes:[0,3]}],nodes:[
  {name:'SOURCE A.root',children:[1,2]},
  {name:'CHILD ONE'}, {name:'CHILD TWO'}, {name:'OTHER ROOT'},
 ]};
 const root={name:'SOURCE_Aroot',children:[{name:'CHILD_ONE'},{name:'CHILD_TWO_1'}]};
 const other={name:'OTHER_ROOT',children:[]};
 const scene={children:[root,other]};
 assert.equal(renderedRootsMatch(json,scene,0),true);
 scene.children.push({name:'VIEWER_HELPER'});
 assert.equal(renderedRootsMatch(json,scene,0),true,'helper after roots is not a source');
 scene.children=[other,root];
 assert.equal(renderedRootsMatch(json,scene,0),false,'root order changed');
 scene.children=[root,other];
 const saved=root.children[0];
 root.children[0]={name:'DONOR_WRONG'};
 assert.equal(renderedRootsMatch(json,scene,0),false,'same root name but different glTF subtree');
 root.children[0]=saved;
 assert.equal(renderedRootsMatch(json,scene,0),true);
 const associations=new Map([[root,{nodes:3}]]);
 assert.equal(renderedRootsMatch(json,scene,0,associations),false,'loader node provenance disagrees');
 scene.children=[root];
 assert.equal(renderedRootsMatch(json,scene,0),false,'missing root');
 assert.equal(renderedRootsMatch({},scene,0),false);
});
test('530 authentic same-name wrong rendered Object3D root blocks scene swap and restore',
 {skip:!fixture},()=>{
 const {json,gltf,scenes}=load();
 const rootPos=json.scenes[526].nodes.findIndex(n=>(json.nodes[n]?.children??[]).length>0);
 assert.ok(rootPos>=0);
 let current=scenes[526];
 const runtime=create({gltf,sha:SHA,mount(next){current=next;},mounted(){return current;}});
 assert.ok(runtime.apply('2F'));
 const previous=scenes[526].children[rootPos];
 scenes[526].children[rootPos]={name:previous.name,children:[]};
 assert.equal(resolve(gltf,SHA),null,'same-named root with incorrect hierarchy');
 assert.equal(runtime.restore(),false,'pinned Object3D identity differs');
 assert.equal(current,scenes[525]);
 scenes[526].children[rootPos]=previous;
 assert.equal(runtime.restore(),true,'source root restored');
});


test('530 actual GLTFLoader source subtree blocks same-name mesh and geometry swaps',async()=>{
 const {GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');
 const {BufferGeometry,MeshBasicMaterial,Group}=await import('three');
 // Small real GLB parse on every CI run. It tests the runtime guard, not
 // the protected 55 MB original 530 source or production WebGL.
 const positions=new Float32Array([0,0,0,1,0,0,0,1,0]);
 const binary=Buffer.from(positions.buffer);
 const json={
  asset:{version:'2.0'},scene:0,
  scenes:[{name:'NESTED_SOURCE_SCENE',nodes:[0,1]}],
  nodes:[
   {name:'SOURCE_A',children:[2]},
   {name:'SOURCE_B'},
   {name:'INNER_MESH',mesh:0},
  ],
  meshes:[{primitives:[{attributes:{POSITION:0}}]}],
  accessors:[{bufferView:0,componentType:5126,count:3,type:'VEC3',
   min:[0,0,0],max:[1,1,0]}],
  bufferViews:[{buffer:0,byteOffset:0,byteLength:binary.length}],
  buffers:[{byteLength:binary.length}],
 };
 const j=Buffer.from(JSON.stringify(json),'utf8');
 const jp=(j.length+3)&~3,byteLength=12+8+jp+8+binary.length;
 const glb=Buffer.alloc(byteLength,0x20);
 glb.writeUInt32LE(0x46546c67,0);
 glb.writeUInt32LE(2,4);
 glb.writeUInt32LE(byteLength,8);
 glb.writeUInt32LE(jp,12);
 glb.writeUInt32LE(0x4e4f534a,16);
 j.copy(glb,20);
 const binAt=20+jp;
 glb.writeUInt32LE(binary.length,binAt);
 glb.writeUInt32LE(0x004e4942,binAt+4);
 binary.copy(glb,binAt+8);
 const bytes=glb.buffer.slice(glb.byteOffset,glb.byteOffset+glb.byteLength);
 const loaded=await new Promise((resolve,reject)=>new GLTFLoader().parse(bytes,'',resolve,reject));
 const scene=loaded.scene;
 assert.equal(scene.children.length,2);
 assert.equal(renderedRootsMatch(json,scene,0),true);
 const proof=snapshotTree(scene,2);
 assert.ok(proof,'capture original parsed Object3D graph');
 assert.equal(treeUnchanged(scene,proof),true);
 const first=scene.children[0],mesh=first.children[0];
 assert.equal(mesh.isMesh,true);
 const originalMaterial=mesh.material;
 mesh.material=new MeshBasicMaterial({color:0x154f7d});
 assert.equal(treeUnchanged(scene,proof),true,'technical palette material override is allowed');
 const geometry=mesh.geometry;
 mesh.geometry=new BufferGeometry();
 assert.equal(renderedRootsMatch(json,scene,0),true,'prior name/tree-only check missed geometry');
 assert.equal(treeUnchanged(scene,proof),false,'geometry rebind blocked');
 mesh.geometry.dispose();
 mesh.geometry=geometry;
 assert.equal(treeUnchanged(scene,proof),true,'geometry restore');
 const impostor=mesh.clone(false);
 first.remove(mesh);
 first.add(impostor);
 assert.equal(renderedRootsMatch(json,scene,0),true,'same-name impostor would pass old guard');
 assert.equal(treeUnchanged(scene,proof),false,'new object has no source reference');
 first.remove(impostor);
 first.add(mesh);
 assert.equal(treeUnchanged(scene,proof),true,'restored nested source identity');
 scene.add(new Group());
 assert.equal(treeUnchanged(scene,proof),true,'viewer helper after source roots is allowed');
 first.add(new Group());
 assert.equal(treeUnchanged(scene,proof),false,'source child list is immutable');
 first.remove(first.children.at(-1));
 assert.equal(treeUnchanged(scene,proof),true);
 scene.children.reverse();
 assert.equal(treeUnchanged(scene,proof),false,'source root order changed');
 scene.children.reverse();
 assert.equal(treeUnchanged(scene,proof),true);
 assert.equal(snapshotTree(null,2),null);
 assert.equal(snapshotTree(scene,9),null);
 assert.equal(treeUnchanged(scene,null),false);
 mesh.material.dispose();
 mesh.material=originalMaterial;
});


// KP011 authentic 530 source: old root9008 and new root12254 both reference
// seven identical glTF child indices across otherwise independent scenes.
// GLTFLoader caches those nodes globally. A rehydration pass must reconstruct
// exact source children, never accept a missing/wrong child by relaxing SHA.
test('GLTFLoader shared child under two scene parents needs source-exact rehydration',async()=>{
 const {GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');
 const makeGlb=(json)=>{
  const text=Buffer.from(JSON.stringify(json),'utf8');
  const pad=(text.length+3)&~3;
  const buf=Buffer.alloc(20+pad,0x20);
  buf.writeUInt32LE(0x46546c67,0);
  buf.writeUInt32LE(2,4);
  buf.writeUInt32LE(buf.length,8);
  buf.writeUInt32LE(pad,12);
  buf.writeUInt32LE(0x4e4f534a,16);
  text.copy(buf,20);
  return buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength);
 };
 const base={
  asset:{version:'2.0'},scene:0,
  scenes:[{name:'OLD_TERRAIN_SCENE',nodes:[0]},{name:'NEW_TERRAIN_SCENE',nodes:[2]}],
  nodes:[
   {name:'OLD_TERRAIN_ROOT',children:[1]},
   {name:'REUSED_SOIL_CHILD'},
   {name:'NEW_TERRAIN_ROOT',children:[1]},
  ],
 };
 const parsed=await new GLTFLoader().parseAsync(makeGlb(base),'');
 const status=[0,1].map(i=>renderedRootsMatch(base,parsed.scenes[i],i));
 assert.equal(status.some(pass=>!pass),true,
  'globally reused glTF child with two source parents cannot be assumed to retain both exact render paths');
 // Distinct source node IDs are a positive control, not a viewer gate bypass.
 const unique=structuredClone(base);
 unique.nodes[2].children=[3];
 unique.nodes.push({name:'INDEPENDENT_SOIL_CHILD'});
 const good=await new GLTFLoader().parseAsync(makeGlb(unique),'');
 assert.equal(renderedRootsMatch(unique,good.scenes[0],0),true);
 assert.equal(renderedRootsMatch(unique,good.scenes[1],1),true);
});

test('authentic C80 530 identifies the seven old/new soil-parent alias IDs',
 {skip:!fixture},()=>{
 const {json}=load();
 const old=json.nodes[9008].children??[];
 const next=json.nodes[12254].children??[];
 for(const id of [9007,5145,5148,5154,5167,5180,7318]){
  assert.ok(old.includes(id),'old terrain parent retains source child '+id);
  assert.ok(next.includes(id),'new terrain parent reuses exact child '+id);
 }
 assert.equal(json.scenes[526].nodes.includes(12254),true);
 assert.equal(json.scenes[520].nodes.includes(9008),true);
 assert.equal(json.scenes[525].nodes.includes(12254),false);
});
