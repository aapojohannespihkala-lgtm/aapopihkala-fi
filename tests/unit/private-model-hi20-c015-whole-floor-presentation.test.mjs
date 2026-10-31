import test from 'node:test';
import assert from 'node:assert/strict';
import { C015_SOURCE_SHA, createHi20C015WholeFloorPresentation }
  from '../../src/scripts/privateModelHi20C015WholeFloorPresentation.mjs';

const v = () => ({ equals(other) { return other === this; } });
function source() {
  const geometry = {}, material = { name:'HI02_C80-015_2F_FLOOR_PALE_NEUTRAL_WORK_TEST' };
  const root = {
    isMesh:true, visible:true,
    name:'HI20_WP2_C017_NORTH_86MM_GAP_FLOOR_BOTH_OPTIN_WORK_TEST_HOST_HOLD',
    geometry, material, position:v(), quaternion:v(), scale:v(),
    userData:{sourceLinks:['C80-017 HI20 floor']},
    clone() {
      return { ...this, userData:{...this.userData},
        clone:this.clone };
    },
  };
  const scenes = Array.from({length:52},()=>({
    isScene:true,children:[],
    add(obj){this.children.push(obj);obj.parent=this;},
    remove(obj){this.children=this.children.filter(x=>x!==obj);obj.parent=null;},
    traverse(fn){for(const child of this.children)fn(child);},
  }));
  scenes[51].children.push(root);
  const assoc = new Map([[root,{nodes:5892,meshes:1795}]]);
  const nodes=Array.from({length:5893},()=>({}));
  nodes[5892]={
    mesh:1795,name:root.name,extras:{
      stage:'WORK_TEST',physicalHost:'HOST_HOLD',current:false,asBuilt:false,
      areaM2:63.006272305026044,addedStripAreaM2:0.15479991851807995,
      sourceFloorNode:5869,sourceLinks:['C80-017 HI20 floor'],
    },
  };
  const meshes=Array.from({length:1796},()=>({}));
  meshes[1795]={
    name:'HI20_WP2_C80-017_NORTH_86MM_GAP_FILLED_ONE_TOPOLOGIC_FLOOR',
    primitives:[{material:216}],
    extras:{physicalHost:'HOST_HOLD',originalSourceNodes:[5229,5317,5319]},
  };
  const json={
    asset:{version:'2.0',extras:{current:false,asBuilt:false}},
    scene:0,scenes:Array.from({length:52},()=>({nodes:[]})),nodes,meshes,
  };
  json.scenes[51].nodes=[5892];
  return {root,scenes,parser:{json,associations:{get:o=>assoc.get(o)}}};
}
test('WHOLE23 gets only a reversible existing unified 2F floor',()=>{
  const gltf=source();
  const p=createHi20C015WholeFloorPresentation(gltf,C015_SOURCE_SHA);
  assert.equal(p.available,true,p.reason);
  assert.equal(p.count,1);
  assert.equal(gltf.scenes[23].children.length,1);
  assert.equal(gltf.scenes[51].children.length,1);
  assert.equal(gltf.scenes[23].children[0].geometry,gltf.root.geometry);
  assert.equal(gltf.scenes[23].children[0].material,gltf.root.material);
  assert.deepEqual(gltf.scenes[23].children[0].userData.sourceLinks,gltf.root.userData.sourceLinks);
  assert.equal(gltf.scenes[23].children[0].userData.workTestDisplaySourceNode,5892);
  assert.equal(p.setEnabled(false),true);
  assert.equal(gltf.scenes[23].children[0].visible,false);
  assert.equal(gltf.root.visible,true);
  p.setEnabled(true);
  assert.equal(gltf.scenes[23].children[0].visible,true);
  p.dispose();
  assert.equal(gltf.scenes[23].children.length,0);
  assert.equal(gltf.scenes[51].children[0],gltf.root);
  assert.equal(gltf.scenes[50].children.length,0);
});
test('wrong SHA/scene fails closed without changing WHOLE',()=>{
  const gltf=source();
  assert.equal(createHi20C015WholeFloorPresentation(gltf,'wrong').available,false);
  gltf.parser.json.scenes[23].nodes=[5892];
  assert.equal(createHi20C015WholeFloorPresentation(gltf,C015_SOURCE_SHA).available,false);
  assert.equal(gltf.scenes[23].children.length,0);
});
test('duplicate or invalid source floor cannot be overlaid',()=>{
  const gltf=source();
  gltf.scenes[23].children.push(gltf.root);
  assert.equal(createHi20C015WholeFloorPresentation(gltf,C015_SOURCE_SHA).available,false);
  gltf.scenes[23].children=[];
  gltf.parser.json.meshes[1795].primitives[0].material=99;
  assert.equal(createHi20C015WholeFloorPresentation(gltf,C015_SOURCE_SHA).available,false);
});
