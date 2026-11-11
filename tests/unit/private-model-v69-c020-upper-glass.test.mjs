import test from 'node:test';
import assert from 'node:assert/strict';
import {createV69C020UpperGlassPresentation,V69_C020_UPPER_GLASS_SHA} from '../../src/scripts/privateModelV69C020UpperGlassPresentation.mjs';

class Object3D {
  constructor({name='',isGroup=false,isMesh=false,material=null}={}){
    Object.assign(this,{name,isGroup,isMesh,isObject3D:true,material,children:[],parent:null,visible:true,
      position:[0,0,0],quaternion:[0,0,0,1],scale:[1,1,1],userData:{}});
  }
  add(child){if(child.parent)child.parent.remove(child);this.children.push(child);child.parent=this;}
  remove(child){const i=this.children.indexOf(child);if(i>=0)this.children.splice(i,1);child.parent=null;}
  traverse(fn){fn(this);for(const child of this.children)child.traverse(fn);}
  clone(deep=false){
    const c=new Object3D({name:this.name,isGroup:this.isGroup,isMesh:this.isMesh,material:this.material});
    c.position=[...this.position];c.quaternion=[...this.quaternion];c.scale=[...this.scale];
    c.userData={...this.userData};
    if(deep)for(const x of this.children)c.add(x.clone(true));
    return c;
  }
}
function fixture(){
  const nodes=Array.from({length:9914},()=>({}));
  const meshes=Array.from({length:3592},()=>({primitives:[]}));
  meshes[1859]={primitives:[{material:342}]};
  const materials=Array.from({length:532},()=>({}));
  materials[342]={alphaMode:'BLEND',doubleSided:true,extensions:{KHR_materials_unlit:{}},
    pbrMetallicRoughness:{baseColorFactor:[.65,.82,.9,.62]}};
  const scenes=Array.from({length:293},()=>new Object3D({isGroup:true}));
  const jsonScenes=Array.from({length:293},()=>({nodes:[],name:'OTHER'}));
  const associations=new Map();
  const upper=Array.from({length:8},(_,i)=>6463+i);
  const lower=Array.from({length:5},(_,i)=>6472+i);
  jsonScenes[54]={name:'D2F_WP3_BALCONY_GLASS_VISIBILITY_2F',nodes:[6471]};
  nodes[6471]={name:'HI20_COMBINED_WP1_WP3_ROOT_2F_WORK_TEST_HOST_HOLD_K17_1125_COW',children:[...upper],rotation:[-Math.SQRT1_2,0,0,Math.SQRT1_2]};
  const parent=new Object3D({isGroup:true,name:nodes[6471].name});
  parent.quaternion=[-Math.SQRT1_2,0,0,Math.SQRT1_2];
  scenes[54].add(parent);associations.set(parent,{nodes:6471});
  for(let i=0;i<8;i++){
    const id=upper[i];
    nodes[id]={name:`G2_D_2F_BALCONY_GLASS_FIELD_20261024_PANEL_${String(i+1).padStart(2,'0')}_758MM`,
      mesh:1859,translation:[.5135+i*.764,-1.569,4.49],extras:{asBuilt:false,current:false}};
    const mesh=new Object3D({isMesh:true,name:nodes[id].name,material:{transparent:true,opacity:.62}});
    parent.add(mesh);associations.set(mesh,{nodes:id,meshes:1859,primitives:0});
  }
  for(const index of [291,292]){
    jsonScenes[index]={name:`C80R2_V69_${index===291?'2F':'BOTH'}`,nodes:[...lower]};
    for(const id of lower){
      const n=id-6472;
      nodes[id]={name:`C80_020_D2F_WP3_LOWER_INNER_GLAZING_PANEL_${String(n+1).padStart(2,'0')}_1195MM_WORK_TEST_HOST_HOLD`,mesh:1859};
      const mesh=new Object3D({isMesh:true,name:nodes[id].name});
      scenes[index].add(mesh);associations.set(mesh,{nodes:id});
    }
  }
  const json={asset:{version:'2.0',extras:{current:false,asBuilt:false}},scene:292,scenes:jsonScenes,nodes,meshes,materials};
  return {gltf:{scenes,parser:{json,associations}},parent,upper,lower,associations};
}
const make=f=>createV69C020UpperGlassPresentation(f.gltf,V69_C020_UPPER_GLASS_SHA,V69_C020_UPPER_GLASS_SHA);
test('exact V69 restores eight historical panes in both 2F and BOTH with source transforms',()=>{
  const f=fixture(),r=make(f);
  assert(r.available,r.reason);assert.equal(r.count,16);assert.equal(r.setApplied(true),true);
  assert.equal(r.setApplied(true),true);
  for(const index of [291,292]){
    const s=f.gltf.scenes[index],grp=s.children.at(-1);
    assert.equal(s.children.length,6);assert.equal(grp.children.length,8);
    assert.deepEqual(grp.quaternion,[-Math.SQRT1_2,0,0,Math.SQRT1_2]);
    assert.equal(grp.userData.physicalHost,'HOST_HOLD');
    for(let i=0;i<8;i++){
      assert.notEqual(grp.children[i],f.parent.children[i]);
      assert.equal(grp.children[i].material,f.parent.children[i].material);
      assert.equal(f.associations.get(grp.children[i]).nodes,6463+i);
    }
  }
  assert.equal(f.gltf.scenes[290].children.length,0);
  assert.equal(r.setApplied(false),true);assert.equal(r.applied,false);
  for(const index of [291,292])assert.equal(f.gltf.scenes[index].children.length,5);
  assert.equal(r.setApplied(true),true);r.dispose();
  for(const index of [291,292])assert.equal(f.gltf.scenes[index].children.length,5);
});
test('wrong SHA or changed GLB scene, pane, glass alpha and lower roots fail closed',()=>{
  const f=fixture(),g=f.gltf;
  assert.equal(createV69C020UpperGlassPresentation(g,'wrong','wrong').available,false);
  assert.equal(createV69C020UpperGlassPresentation(g,V69_C020_UPPER_GLASS_SHA,'wrong').available,false);
  g.parser.json.scene=291;assert.equal(make(f).available,false);g.parser.json.scene=292;
  g.parser.json.scenes[291].nodes.pop();assert.equal(make(f).available,false);
  g.parser.json.scenes[291].nodes.push(6476);
  g.parser.json.materials[342].pbrMetallicRoughness.baseColorFactor[3]=.24;
  assert.equal(make(f).available,false);
  g.parser.json.materials[342].pbrMetallicRoughness.baseColorFactor[3]=.62;
  g.parser.json.nodes[6463].translation[2]=4.5;assert.equal(make(f).available,false);
  assert.equal(g.scenes[291].children.length,5);
});
test('missing historical runtime mesh or lower mesh fails closed and preserves source',()=>{
  const f=fixture();f.parent.remove(f.parent.children[0]);assert.equal(make(f).available,false);
  assert.equal(f.gltf.scenes[292].children.length,5);
  const q=fixture();q.gltf.scenes[291].remove(q.gltf.scenes[291].children[0]);
  assert.equal(make(q).available,false);
  assert.equal(q.gltf.scenes[292].children.length,5);
});
test('clone failure leaves both target scenes unchanged',()=>{
  const f=fixture(),r=make(f);assert(r.available);
  f.parent.children[1].clone=()=>{throw new Error('clone failure')};
  assert.equal(r.setApplied(true),false);
  assert.equal(r.applied,false);
  for(const index of [291,292])assert.equal(f.gltf.scenes[index].children.length,5);
});

test('r185 dropped scene associations use exact scene-root ordinal and upper child order',()=>{
  const f=fixture();
  f.associations.clear(); // GLTFLoader r185 keeps only the last scene mappings.
  f.gltf.scenes[292].children[0].name+='_instance_1';
  const r=make(f);
  assert(r.available,r.reason);
  assert.equal(r.setApplied(true),true);
  for(const sceneIndex of [291,292]){
    const group=f.gltf.scenes[sceneIndex].children.at(-1);
    assert.equal(group.children.length,8);
    for(let i=0;i<8;i++){
      assert.equal(f.associations.get(group.children[i]).nodes,6463+i);
      assert.equal(f.associations.get(group.children[i]).meshes,1859);
      assert.equal(f.associations.get(group.children[i]).primitives,0);
    }
  }
  r.dispose();
  assert.equal(f.gltf.scenes[291].children.length,5);
  assert.equal(f.gltf.scenes[292].children.length,5);
});
test('actual GLTFLoader child-only historical root is Object3D, not Group',()=>{
  const f=fixture();
  // Historical source node 6471 contains children but no mesh or camera.
  // r185 makes a plain THREE.Object3D for that exact node, so an isGroup
  // requirement must not suppress the eight SHA-bound upper panes.
  f.parent.isGroup=false;
  assert.equal(f.parent.isObject3D,true);
  const r=make(f);
  assert(r.available,r.reason);
  assert.equal(r.setApplied(true),true);
  for(const index of [291,292]) {
    const group=f.gltf.scenes[index].children.at(-1);
    assert.equal(group.isGroup,false);
    assert.equal(group.isObject3D,true);
    assert.deepEqual(group.children.map((o)=>o.name),f.parent.children.map((o)=>o.name));
  }
  r.dispose();
  assert.equal(f.gltf.scenes[291].children.length,5);
  assert.equal(f.gltf.scenes[292].children.length,5);
});

test('wrong existing mapping is authoritative and blocks historical or target fallback',()=>{
  const p=fixture();p.associations.clear();
  p.associations.set(p.parent.children[0],{nodes:9999});
  assert.equal(make(p).available,false);
  const q=fixture();q.associations.clear();
  q.associations.set(q.gltf.scenes[291].children[0],{nodes:6473});
  assert.equal(make(q).available,false);
});
test('shuffled target roots or changed historical child names fail closed',()=>{
  const p=fixture();p.associations.clear();
  const r=p.gltf.scenes[291];
  [r.children[0],r.children[1]]=[r.children[1],r.children[0]];
  assert.equal(make(p).available,false);
  const q=fixture();q.associations.clear();
  q.parent.children[0].name='IMPOSTOR';
  assert.equal(make(q).available,false);
  const s=fixture();s.associations.clear();
  s.gltf.scenes[54].add(new Object3D({isGroup:true,name:'EXTRA'}));
  assert.equal(make(s).available,false);
});
