import test from 'node:test';
import assert from 'node:assert/strict';
import { C029_SOURCE_SHA, createHi20C029RoofPresentation }
  from '../../src/scripts/privateModelHi20C029RoofPresentation.mjs';

function fakeSource() {
  const geometry = {}, material = {};
  const roots = new Map([5757, 5778].map((id) => [id, {
    isMesh:true, name:'K3_D_STORAGE_ROOF_PRESENTATION_REFERENCE_NODE',
    geometry, material, visible:true,
    clone() {
      return { ...this, userData: { sourceLinks: ['source://roof'] } };
    },
  }]));
  const scenes = Array.from({length:52},()=>({
    isScene:true, children:[],
    add(obj){this.children.push(obj);obj.parent=this;},
    remove(obj){this.children=this.children.filter(o=>o!==obj);obj.parent=null;},
  }));
  const nodes = Array.from({length:5779},()=>({}));
  for(const id of [5757,5778]) nodes[id]={
    mesh:514, name:'K3_D_STORAGE_ROOF_PRESENTATION_REFERENCE_NODE',
    extras:{presentationOnly:true,sourceDriveId:'source-roof-id'},
  };
  const json={
    asset:{version:'2.0',extras:{current:false,asBuilt:false}},scene:0,
    scenes:Array.from({length:52},()=>({nodes:[]})),nodes,
    meshes:Array.from({length:515},()=>({})),
    materials:Array.from({length:86},()=>({})),
  };
  json.meshes[514]={primitives:[{material:85}]};
  json.materials[85]={
    alphaMode:'BLEND',doubleSided:true,
    pbrMetallicRoughness:{baseColorFactor:[1,1,1,.58]},
  };
  return { scenes,parser:{json,getDependency:async(_type,id)=>roots.get(id)} };
}
test('C029 exact source mounts two existing material-sharing roofs, reversible',async()=>{
  const source=fakeSource();
  const p=await createHi20C029RoofPresentation(source,C029_SOURCE_SHA);
  assert.equal(p.available,true,p.reason);
  assert.equal(p.count,2);
  assert.equal(source.scenes[50].children.length,1);
  assert.equal(source.scenes[51].children.length,1);
  assert.equal(source.scenes[49].children.length,0);
  assert.equal(source.scenes[50].children[0].material,
    source.scenes[51].children[0].material);
  assert.deepEqual(source.scenes[50].children[0].userData.sourceLinks,['source://roof']);
  assert.equal(p.setVisible(false),true);
  assert.equal(source.scenes[50].children[0].visible,false);
  assert.equal(source.scenes[51].children[0].visible,false);
  p.setVisible(true);
  p.dispose();
  assert.equal(source.scenes[50].children.length,0);
  assert.equal(source.scenes[51].children.length,0);
});
test('C029 rejects other source SHA and wrong source roof identity',async()=>{
  const source=fakeSource();
  assert.equal((await createHi20C029RoofPresentation(source,'other')).available,false);
  source.parser.json.nodes[5778].mesh=888;
  const p=await createHi20C029RoofPresentation(source,C029_SOURCE_SHA);
  assert.equal(p.available,false);
  assert.equal(source.scenes[50].children.length,0);
});
test('C029 fails closed on a roof already parented in original source',async()=>{
  const source=fakeSource();
  source.parser.json.nodes[1].children=[5757];
  const p=await createHi20C029RoofPresentation(source,C029_SOURCE_SHA);
  assert.equal(p.available,false);
  assert.equal(source.scenes[50].children.length,0);
});
