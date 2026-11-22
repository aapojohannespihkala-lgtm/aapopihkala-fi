import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {C80_524_RAIN_GLB_SHA256 as SHA,C80_524_RAIN_GLB_BYTES as BYTES,
 C80_524_RAIN_SCENES as SPECS}
 from '../../src/scripts/privateModelC80524RainZonesSourceProfile.mjs';
import {C80_524_RAIN_VIEWER_ROLES as ROLES,
 resolveC80524RainSceneIndex as index,
 resolveC80524RainScenes as resolve,
 createC80524RainFloorRuntime as create,
 c80524RenderedRootPathMatches as renderedRootsMatch,
 c80524SnapshotRenderedSourceRoots as snapshotRoots,
 c80524RenderedSourceRootsUnchanged as rootsUnchanged}
 from '../../src/scripts/privateModelC80524RainZonesFloorRuntime.mjs';

const modes=[
 [518,'1F','CLOSED',false],[519,'2F','CLOSED',false],
 [520,'BOTH','CLOSED',false],[521,'BOTH','ONE_OPEN',false],
 [522,'BOTH','STACKED',false],[523,'BOTH','CLOSED',true],
];
test('C80 524 exact six 1F/2F/BOTH modes, cutaway and invalid roles',()=>{
 assert.equal(ROLES['1F'],518);
 assert.equal(ROLES.BOTH.CUTAWAY,523);
 assert.equal(Object.keys(SPECS).length,6);
 for(const [scene,f,g,c] of modes)assert.equal(index(f,g,c),scene);
 for(const args of [['1F','ONE_OPEN',false],['2F','STACKED',false],
  ['2F','CLOSED',true],['BOTH','ONE_OPEN',true],['BOTH','NOPE',false],
  ['BOTH','CLOSED','true'],['ROOF','CLOSED',false]])
  assert.equal(index(...args),null,'reject '+args);
});
test('unknown source SHA, missing GLB or invalid mount contract fail closed',()=>{
 assert.equal(resolve(null,SHA),null);
 assert.equal(resolve({parser:{json:{}},scenes:[]},SHA),null);
 assert.throws(()=>create({gltf:null,sha:SHA,mount:null,mounted:()=>null}),/MOUNT_CONTRACT/);
 assert.throws(()=>create({gltf:null,sha:SHA,mount:()=>{},mounted:()=>null}),/SOURCE_SCENE_MISMATCH/);
});
const fixture=process.env.C80_524_RAIN_GLB_PATH;
function sourceFixture(){
 const buf=readFileSync(fixture);
 assert.equal(buf.length,BYTES);
 assert.equal(createHash('sha256').update(buf).digest('hex'),SHA);
 const json=JSON.parse(buf.subarray(20,20+buf.readUInt32LE(12)).toString('utf8'));
 const scenes=json.scenes.map(s=>({name:s.name,
  children:s.nodes.map(n=>({name:json.nodes[n]?.name??''})),
  traverse(fn){for(const n of s.nodes)fn({isMesh:Number.isInteger(json.nodes[n]?.mesh)});}}));
 return {json,scenes,gltf:{parser:{json},scenes}};
}
test('authentic 55MB GLB mounts exact 6 source scenes and resets scene modes',
 {skip:!fixture},()=>{
 const {gltf,scenes}=sourceFixture();
 const accepted=resolve(gltf,SHA);
 assert.ok(accepted);
 let current=accepted[520];
 const runtime=create({gltf,sha:SHA,mount(next){current=next;},mounted(){return current;}});
 assert.equal(runtime.defaultScene,current);
 assert.equal(runtime.publicationStatus,'NOT_AUTHORIZED');
 assert.equal(runtime.downspoutPhysicalRouteStatus,'NOT_VERIFIED');
 assert.equal(runtime.sourceLinksStatus,'NOT_BOUND');
 for(const [scene,f,g,c] of modes){
  assert.equal(runtime.restore(),true);
  if(c){assert.ok(runtime.setCutaway(true));}
  else if(f==='BOTH'&&g!=='CLOSED'){assert.ok(runtime.setGlazing(g));}
  else assert.ok(runtime.apply(f));
  assert.equal(runtime.sceneIndex,scene);
  assert.equal(runtime.selectedScene,current);
  assert.equal(runtime.floor,f);
  assert.equal(runtime.glazing,g);
  assert.equal(runtime.cutaway,c);
  assert.ok(runtime.active||f==='BOTH');
 }
 assert.equal(runtime.restore(),true);
 assert.equal(runtime.active,false);
 assert.ok(runtime.apply('2F'));
 assert.ok(runtime.apply('1F'));
 assert.ok(runtime.apply('BOTH'));
 assert.equal(runtime.sceneIndex,520);
 assert.ok(runtime.setCutaway(true));
 assert.equal(runtime.setGlazing('ONE_OPEN'),null);
 assert.ok(runtime.setCutaway(false));
 assert.ok(runtime.setGlazing('ONE_OPEN'));
 assert.equal(runtime.sceneIndex,521);
 current=null;
 assert.equal(runtime.apply('BOTH'),null);
 current=accepted[521];
 runtime.dispose();
 assert.equal(runtime.apply('1F'),null);
 assert.equal(runtime.restore(),false);
 assert.equal(accepted[518],scenes[518]);
});
test('authenticated 524 source metadata rechecked before every mount and restore',
 {skip:!fixture},()=>{
 const {json,gltf,scenes}=sourceFixture();
 let current=scenes[520];
 const runtime=create({gltf,sha:SHA,mount(next){current=next;},mounted(){return current;}});
 const e=json.scenes[519].extras,old=e.productionWebGLVerified;
 e.productionWebGLVerified=true;
 assert.equal(runtime.apply('2F'),null);
 assert.equal(current,scenes[520]);
 e.productionWebGLVerified=old;
 assert.ok(runtime.apply('2F'));
 assert.equal(runtime.sceneIndex,519);
 const original=json.scenes[520].extras.floorProfile;
 json.scenes[520].extras.floorProfile='2F';
 assert.equal(runtime.restore(),false);
 assert.equal(current,scenes[519]);
 json.scenes[520].extras.floorProfile=original;
 assert.equal(runtime.restore(),true);
 const prev=json.nodes[12249].extras.physicalRouteClaim;
 json.nodes[12249].extras.physicalRouteClaim=true;
 assert.equal(runtime.apply('1F'),null);
 assert.equal(runtime.restore(),false);
 json.nodes[12249].extras.physicalRouteClaim=prev;
 assert.ok(runtime.apply('1F'));
 current=scenes[520];
 assert.equal(runtime.apply('2F'),null,'external scene swap invalidates mounted-scene contract');
});


test('524 rendered root order/name verification rejects wrong cross-SHA nodes and permits appended viewer helpers',()=>{
 const json={scenes:[{nodes:[2,3,4]}],nodes:[{}, {},
  {name:'SOURCE_A.root'},{name:'SOURCE B.root'},{name:'SOURCE_C.root'}]};
 const rendered={children:[
  {name:'SOURCE_Aroot'}, {name:'SOURCE_Broot'}, {name:'SOURCE_Croot_2'}]};
 assert.equal(renderedRootsMatch(json,rendered,0),true,'GLTFLoader name sanitization and _N suffix');
 rendered.children.push({name:'VIEWER_HELPER_ONLY'});
 assert.equal(renderedRootsMatch(json,rendered,0),true,'extra viewer helper after source roots');
 const ordered=rendered.children.slice();
 const originalSecond=ordered[1];
 rendered.children=[ordered[1],ordered[0],ordered[2],ordered[3]];
 assert.equal(renderedRootsMatch(json,rendered,0),false,'source root order changed');
 rendered.children=ordered;
 rendered.children[1]={name:'ROOM3_DONOR_LEAF'};
 assert.equal(renderedRootsMatch(json,rendered,0),false,'wrong SHA donor rendered as real root');
 rendered.children[1]=originalSecond;
 assert.equal(renderedRootsMatch(json,rendered,0),true,'valid root restored');
 rendered.children=[ordered[0],ordered[1]];
 assert.equal(renderedRootsMatch(json,rendered,0),false,'missing source root');
 json.scenes[0].nodes=[2,3,1234];
 assert.equal(renderedRootsMatch(json,{children:ordered},0),false,'out of bounds node ID');
 assert.equal(renderedRootsMatch(json,{},0),false);
 assert.equal(renderedRootsMatch({}, {children:ordered},0),false);
});
test('C80 524 initial rendered roots reject contradictory loader node associations',()=>{
 const json={scenes:[{nodes:[2,3]}],nodes:[{},{},{name:'SOURCE_A'},{name:'SOURCE_B'}]};
 const a={name:'SOURCE_A'},b={name:'SOURCE_B'};
 const rendered={children:[a,b]};
 assert.equal(renderedRootsMatch(json,rendered,0),true);
 const bindings=new Map([[a,{nodes:3}]]);
 assert.equal(renderedRootsMatch(json,rendered,0,bindings),false,
  'known wrong node association fails even when name and order look valid');
 bindings.set(a,{nodes:2});
 assert.equal(renderedRootsMatch(json,rendered,0,bindings),true);
 bindings.set(b,{nodes:2});
 assert.equal(renderedRootsMatch(json,rendered,0,bindings),false);
 bindings.set(b,{materials:5});
 assert.equal(renderedRootsMatch(json,rendered,0,bindings),true,
  'pruned node associations do not cause an invented identity assertion');
});
test('captured rendered roots reject same-name donor object, geometry and nested-child swaps',()=>{
 const geometry={source:'original-524'},child={name:'SOURCED_CHILD',geometry};
 const root={name:'SOURCE_ROOT',geometry,children:[child]};
 const scene={children:[root]},proof=snapshotRoots(scene,1);
 assert.ok(proof);
 assert.equal(rootsUnchanged(scene,proof),true);
 scene.children.push({name:'VIEWER_HELPER_AFTER_SOURCE_ROOTS'});
 assert.equal(rootsUnchanged(scene,proof),true,'appended viewer helpers allowed');
 scene.children[0]={...root,geometry:{source:'donor-530'}};
 assert.equal(rootsUnchanged(scene,proof),false,'same-name donor clone rejected');
 scene.children[0]=root;
 assert.equal(rootsUnchanged(scene,proof),true);
 root.geometry={source:'replaced-mesh'};
 assert.equal(rootsUnchanged(scene,proof),false,'in-place geometry rebinding rejected');
 root.geometry=geometry;
 root.children=[{name:'SOURCED_CHILD',geometry}];
 assert.equal(rootsUnchanged(scene,proof),false,'same-name nested descendant replacement rejected');
 root.children=[child];
 assert.equal(rootsUnchanged(scene,proof),true,'return to original references accepted');
 // Source Object3D identity alone is not source rendering identity:
 // an unchanged source mesh can still move or scale within its parent.
 root.position={x:0,y:0,z:0};
 assert.equal(rootsUnchanged(scene,proof),true,'default TRS is unchanged');
 root.position.x=0.25;
 assert.equal(rootsUnchanged(scene,proof),false,'same Object3D moved in-place');
 root.position.x=0;
 assert.equal(rootsUnchanged(scene,proof),true,'restored local TRS');
 const manual={name:'MANUAL_SOURCE',children:[],matrixAutoUpdate:false,
  matrix:{elements:[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}};
 const manualScene={children:[manual]},manualProof=snapshotRoots(manualScene,1);
 assert.ok(manualProof);
 manual.matrix.elements[12]=0.5;
 assert.equal(rootsUnchanged(manualScene,manualProof),false,'explicit glTF matrix altered');
 manual.matrix.elements[12]=0;
 assert.equal(rootsUnchanged(manualScene,manualProof),true,'manual matrix restored');
 assert.equal(snapshotRoots({},1),null);
 assert.equal(snapshotRoots(scene,3),null);
 assert.equal(rootsUnchanged(scene,null),false);
});
test('authentic 524 scene renderer mismatch rejects init and scene restore', {skip:!fixture},()=>{
 const {json,gltf,scenes}=sourceFixture();
 assert.ok(resolve(gltf,SHA));
 const rootIndex=json.scenes[520].nodes.findIndex(n=>typeof json.nodes[n]?.name==='string'&&json.nodes[n].name.length>0);
 assert.ok(rootIndex>=0,'one named root in scene520');
 let current=scenes[520];
 const runtime=create({gltf,sha:SHA,mount(next){current=next;},mounted(){return current;}});
 assert.ok(runtime.apply('2F'));
 const previous=scenes[520].children[rootIndex];
 // The old name-only root gate accepted this same-name donor object. Captured
 // references reject it even though every source JSON field and SHA is unchanged.
 scenes[520].children[rootIndex]={...previous};
 assert.equal(renderedRootsMatch(json,scenes[520],520),true,'name-only still matches');
 assert.equal(runtime.restore(),false,'same-name object identity gate rejects donor clone');
 assert.equal(current,scenes[519]);
 scenes[520].children[rootIndex]=previous;
 scenes[520].children[rootIndex]={name:'ROOM3_DONOR_INVALID_RENDERED_ROOT'};
 assert.equal(resolve(gltf,SHA),null);
 assert.equal(runtime.restore(),false,'stale scene root blocks restore');
 assert.equal(current,scenes[519]);
 assert.equal(runtime.sceneIndex,519);
 scenes[520].children[rootIndex]=previous;
 assert.equal(runtime.restore(),true);
 assert.equal(current,scenes[520]);
});


test('real GLTFLoader GLB graph preserves source roots and rejects a same-name replacement',async()=>{
 const {GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');
 const {MeshBasicMaterial,BufferGeometry}=await import('three');
 // A small genuine binary glTF is assembled in memory so this test runs on
 // every CI pass without downloading or claiming the protected 524 source GLB.
 const positions=new Float32Array([0,0,0, 1,0,0, 0,1,0]);
 const binary=Buffer.from(positions.buffer);
 const json={
  asset:{version:'2.0'},scene:0,
  scenes:[{name:'TEST_SCENE',nodes:[0,1]}],
  nodes:[
   {name:'SOURCE_A',children:[2]},
   {name:'SOURCE_B'},
   {name:'SOURCE_MESH',mesh:0},
  ],
  meshes:[{primitives:[{attributes:{POSITION:0}}]}],
  accessors:[{bufferView:0,componentType:5126,count:3,type:'VEC3',
   min:[0,0,0],max:[1,1,0]}],
  bufferViews:[{buffer:0,byteOffset:0,byteLength:binary.length}],
  buffers:[{byteLength:binary.length}],
 };
 const source=Buffer.from(JSON.stringify(json),'utf8');
 const padded=(source.length+3)&~3;
 const length=12+8+padded+8+binary.length;
 const glb=Buffer.alloc(length,0x20);
 glb.writeUInt32LE(0x46546c67,0);
 glb.writeUInt32LE(2,4);
 glb.writeUInt32LE(length,8);
 glb.writeUInt32LE(padded,12);
 glb.writeUInt32LE(0x4e4f534a,16);
 source.copy(glb,20);
 const binStart=20+padded;
 glb.writeUInt32LE(binary.length,binStart);
 glb.writeUInt32LE(0x004e4942,binStart+4);
 binary.copy(glb,binStart+8);
 const raw=glb.buffer.slice(glb.byteOffset,glb.byteOffset+glb.byteLength);
 const loaded=await new Promise((resolve,reject)=>
  new GLTFLoader().parse(raw,'',resolve,reject));
 const scene=loaded.scene;
 assert.equal(scene.name,'TEST_SCENE');
 assert.equal(scene.children.length,2);
 assert.equal(renderedRootsMatch(json,scene,0),true);
 // Real GLTFLoader Object3Ds: a contradictory parser node binding must fail
 // before the post-parse reference snapshot is ever accepted.
 const wrongBindings=new Map([[scene.children[0],{nodes:1}]]);
 assert.equal(renderedRootsMatch(json,scene,0,wrongBindings),false);
 wrongBindings.set(scene.children[0],{nodes:0});
 assert.equal(renderedRootsMatch(json,scene,0,wrongBindings),true);
 const proof=snapshotRoots(scene,2);
 assert.ok(proof);
 const first=scene.children[0];
 const mesh=first.children[0];
 assert.equal(mesh.isMesh,true);
 assert.equal(rootsUnchanged(scene,proof),true);
 const previousMaterial=mesh.material;
 mesh.material=new MeshBasicMaterial({color:0x224466});
 assert.equal(rootsUnchanged(scene,proof),true,'review may change material');
 const oldX=mesh.position.x;
 mesh.position.x+=0.125;
 assert.equal(rootsUnchanged(scene,proof),false,'source mesh cannot translate after parse');
 mesh.position.x=oldX;
 assert.equal(rootsUnchanged(scene,proof),true,'source translation restored');
 const oldScale=mesh.scale.z;
 mesh.scale.z=oldScale*1.25;
 assert.equal(rootsUnchanged(scene,proof),false,'source mesh cannot stretch after parse');
 mesh.scale.z=oldScale;
 assert.equal(rootsUnchanged(scene,proof),true,'source scale restored');
 const oldQ=mesh.quaternion.clone();
 mesh.quaternion.set(0,0,0.2,0.9797958971);
 assert.equal(rootsUnchanged(scene,proof),false,'source mesh rotation changed');
 mesh.quaternion.copy(oldQ);
 assert.equal(rootsUnchanged(scene,proof),true,'source quaternion restored');
 const oldSceneX=scene.position.x;
 scene.position.x+=1;
 assert.equal(rootsUnchanged(scene,proof),true,'mount-group translation is not a source mutation');
 scene.position.x=oldSceneX;
 const originalGeometry=mesh.geometry;
 mesh.geometry=new BufferGeometry();
 assert.equal(rootsUnchanged(scene,proof),false,'geometry rebinding blocked');
 mesh.geometry=originalGeometry;
 const impostor=first.clone(true);
 scene.children[0]=impostor;
 assert.equal(renderedRootsMatch(json,scene,0),true,'name-only false positive');
 assert.equal(rootsUnchanged(scene,proof),false,'same-name real Object3D clone blocked');
 scene.children[0]=first;
 assert.equal(rootsUnchanged(scene,proof),true);
 scene.add(new (await import('three')).Group());
 assert.equal(rootsUnchanged(scene,proof),true,'appended viewer helper permitted');
 first.remove(mesh);
 assert.equal(rootsUnchanged(scene,proof),false,'removing source descendant blocked');
 first.add(mesh);
 assert.equal(rootsUnchanged(scene,proof),true,'restored child order accepted');
 mesh.material.dispose();
 mesh.material=previousMaterial;
});
