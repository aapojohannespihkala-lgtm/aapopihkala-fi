import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { R32H_NW_PHOTO_SPOUT_SOURCE as P7 } from '../../src/scripts/privateModelR32HMerikaNWPhotoSpoutReceiver.mjs';
import { createR32HMerikaP7WellOverlay as create } from '../../src/scripts/privateModelR32HMerikaP7WellOverlay.mjs';

const make = () => {
  const meshes = Array.from({length: 28}, () => ({}));
  const nodes = Array.from({length: 29}, () => ({}));
  nodes[0] = {name: 'world', children: Array.from({length: 27}, (_,i)=>i+1)};
  const sourceRoot = new THREE.Group(); sourceRoot.name='world';
  for(let i=1;i<=27;i++){
    const zone=i<=9?'NW':i<=18?'NE':'SE';
    nodes[i]={name: 'RK_'+zone+'_ELEGANCE_1790RS_WORK_TEST__'+String(i),mesh:i-1};
    const geo=new THREE.BoxGeometry(0.1,0.1,0.1);
    const mesh=new THREE.Mesh(geo,new THREE.MeshBasicMaterial());
    mesh.name=nodes[i].name;sourceRoot.add(mesh);
  }
  nodes[28]={name:'R32H_T12_NW_PHOTO_CONSTRAINED_SPOUT_WORK_TEST',mesh:27};
  const pipe=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial());
  pipe.name=nodes[28].name;
  const scene=new THREE.Group();scene.add(sourceRoot,pipe);
  const gltf={scenes:[scene],parser:{json:{
    scenes:[{nodes:[0,28]}],nodes,meshes,
  }}};
  const target=new THREE.Group();
  const calls=[];
  const receiver={
    status:'WORK_TEST_NW_PHOTO_SPOUT_READY',
    sourceVerified:true,available:true,
    approvedForViewer:false,asBuiltClaim:false,
    setApplied(on){calls.push(Boolean(on));return true;},
    dispose(){calls.push('dispose');},
  };
  return {gltf,scene,sourceRoot,pipe,target,calls,receiver};
};
const args=(x,extra={})=>({
  siteGltf:x.gltf,siteSha256:P7.donorPreviewSha256,
  targetScene:x.target,sourceReceiver:x.receiver,...extra,
});
test('27 real well mesh clones, no donor preview pipe, reversible original source root',()=>{
  const x=make();
  const original=x.sourceRoot.children.slice();
  const v=create(args(x));
  assert.equal(v.available,true);
  assert.equal(v.meshCount,27);
  assert.equal(v.applied,false);
  assert.equal(x.target.children.length,0);
  assert.equal(v.setApplied(true),true);
  assert.equal(v.applied,true);
  assert.equal(x.target.children.length,1);
  const clone=x.target.children[0];
  assert.notStrictEqual(clone,x.sourceRoot);
  assert.equal(clone.userData.viewerDerived,true);
  assert.equal(clone.userData.asBuiltClaim,false);
  assert.equal(clone.children.length,27);
  assert.equal(clone.children.some(o=>o.name===x.pipe.name),false);
  assert.equal(x.scene.children.length,2);
  assert.deepEqual(x.sourceRoot.children,original);
  assert.equal(v.setApplied(true),true);
  assert.equal(x.target.children.length,1);
  assert.equal(v.setApplied(false),true);
  assert.equal(v.applied,false);
  assert.equal(x.target.children.length,0);
  assert.equal(v.setApplied(true),true);
  v.dispose();
  assert.equal(x.target.children.length,0);
  assert.deepEqual(x.calls,[true,false,true,false,'dispose']);
  assert.equal(v.setApplied(true),false);
});
for(const [label,mutate] of [
  ['wrong donor SHA',x=>x.sha='bad'],
  ['source receiver denied',x=>x.receiver.status='HOST_HOLD'],
  ['receiver unsourced',x=>x.receiver.sourceVerified=false],
  ['receiver published',x=>x.receiver.approvedForViewer=true],
  ['donor has 28 well mesh children',x=>x.sourceRoot.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial()))],
  ['donor missing one well',x=>x.sourceRoot.remove(x.sourceRoot.children[0])],
  ['donor NW name no longer source',x=>x.sourceRoot.children[0].name='UNKNOWN'],
  ['donor pipe also nested in well-root',x=>x.sourceRoot.add(x.pipe)],
  ['different scene root count',x=>x.gltf.parser.json.scenes[0].nodes=[0]],
  ['different source node count',x=>x.gltf.parser.json.nodes.pop()],
  ['non-well mesh in scene',x=>x.sourceRoot.children[0].isMesh=false],
]) {
  test(label+' fails closed',()=>{
    const x=make();mutate(x);
    const v=create(args(x,{siteSha256:x.sha||P7.donorPreviewSha256}));
    assert.equal(v.available,false);
    assert.equal(v.setApplied(true),false);
    assert.equal(x.target.children.length,0);
    assert.deepEqual(x.calls,[]);
  });
}
test('third-party displaced overlay cannot be silently removed or restored',()=>{
  const x=make(),v=create(args(x));
  assert.equal(v.setApplied(true),true);
  const other=new THREE.Group();other.add(x.target.children[0]);
  assert.equal(v.setApplied(false),false);
  assert.equal(x.calls.at(-1),true); // receiver not altered if overlay no longer belongs to target
  other.remove(other.children[0]);
  v.dispose(); // no unsafe forced rollback
});
test('source receiver rejection does not leak alternate well geometry',()=>{
  const x=make();
  x.receiver.setApplied=()=>false;
  const v=create(args(x));
  assert.equal(v.available,true);
  assert.equal(v.setApplied(true),false);
  assert.equal(x.target.children.length,0);
  assert.equal(v.applied,false);
});
