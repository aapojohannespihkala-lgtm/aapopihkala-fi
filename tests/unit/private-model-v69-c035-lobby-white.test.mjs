import test from 'node:test';
import assert from 'node:assert/strict';
import {createV69C035WhiteLobbyPresentation,V69_C035_LOBBY_SHA} from '../../src/scripts/privateModelV69C035WhiteLobbyPresentation.mjs';
const targets=[[9382,3332,504,'V48_D1F_700_WEST_JAMB_X2620_2820'],[9384,3334,504,'V48_D1F_700_OPENING_HEAD_ABOVE_Y2090'],[9391,3341,509,'V49_D1F_RIGHT_JAMB_105MM_COVERS_POST_THERMOSTAT_FACE_3512'],[9394,3344,512,'V50_D1F_LEFT_JAMB_UPPER_CONTINUITY_TO_ASSUMED_SLAB_BOTTOM_Y2500'],[9395,3345,513,'V50_D1F_RIGHT_JAMB_UPPER_CONTINUITY_105MM_TO_Y2500'],[9396,3346,514,'V50_D1F_DOORLESS_700MM_HEADER_UPPER_CONTINUITY_Y2500']];
function fixture(){
  const nodes=Array.from({length:9914},()=>({}));
  const meshes=Array.from({length:3592},()=>({primitives:[]}));
  const materials=Array.from({length:532},()=>({alphaMode:'OPAQUE'}));
  materials[333]={alphaMode:'OPAQUE',doubleSided:true,pbrMetallicRoughness:{baseColorFactor:[.93,.93,.93,1],metallicFactor:0,roughnessFactor:.96}};
  const scenes=Array.from({length:293},()=>({children:[],traverse(fn){for(const child of this.children)fn(child);}}));
  const srcScenes=Array.from({length:293},()=>({nodes:[],name:'other'}));
  const assoc=new Map(), objects=[];
  for(const sceneId of [290,292]){
    const sc=scenes[sceneId]; srcScenes[sceneId].name=`C80R2_V69_${sceneId===290?'1F':'BOTH'}`;
    for(const [id,mesh,material,name] of targets){
      nodes[id]={name,mesh,extras:{asBuilt:false,current:false}};
      meshes[mesh]={primitives:[{material}]};
      srcScenes[sceneId].nodes.push(id);
      const original={name:'gray',color:{setRGB(){}},clone(){return {color:{setRGB(...v){this.rgb=v}},dispose(){this.disposed=true;}}}};
      const object={isMesh:true,parent:sc,material:original};
      sc.children.push(object);assoc.set(object,{nodes:id});objects.push({object,original});
    }
  }
  const json={asset:{version:'2.0',extras:{current:false,asBuilt:false}},scene:292,scenes:srcScenes,nodes,meshes,materials};
  return {gltf:{scenes,parser:{json,associations:assoc}},objects};
}
test('exact V69 source applies white only to six jamb surfaces per 1F/BOTH; 2F unaffected',()=>{
  const f=fixture();const r=createV69C035WhiteLobbyPresentation(f.gltf,V69_C035_LOBBY_SHA,V69_C035_LOBBY_SHA);
  assert.equal(r.available,true);assert.equal(r.count,12);assert(r.setApplied(true));assert(r.setApplied(true));
  for(const t of f.objects){assert.notEqual(t.object.material,t.original);assert.deepEqual(t.object.material.color.rgb,[.93,.93,.93]);assert.equal(t.object.material.roughness,.96);}
  assert.equal(f.gltf.scenes[291].children.length,0);
  assert(r.setApplied(false));assert.equal(r.applied,false);
  for(const t of f.objects)assert.equal(t.object.material,t.original);
  assert(r.setApplied(true));r.dispose();for(const t of f.objects)assert.equal(t.object.material,t.original);
});
test('source is fail-closed on incorrect SHA, absent 1F roots, modified material and missing runtime node',()=>{
  const f=fixture();const run=()=>createV69C035WhiteLobbyPresentation(f.gltf,V69_C035_LOBBY_SHA,V69_C035_LOBBY_SHA);
  assert.equal(createV69C035WhiteLobbyPresentation(f.gltf,'wrong','wrong').available,false);
  assert.equal(createV69C035WhiteLobbyPresentation(f.gltf,V69_C035_LOBBY_SHA,'wrong').available,false);
  f.gltf.parser.json.scenes[290].nodes.pop();assert.equal(run().available,false);
  f.gltf.parser.json.scenes[290].nodes.push(targets.at(-1)[0]);
  f.gltf.parser.json.meshes[3332].primitives[0].material=1;assert.equal(run().available,false);
  f.gltf.parser.json.meshes[3332].primitives[0].material=504;
  f.gltf.scenes[292].children.pop();assert.equal(run().available,false);
  assert(f.objects.every(t=>t.object.material===t.original));
});
test('staged clone failure rolls back without changing an existing scene material',()=>{
  const f=fixture();f.objects[4].original.clone=()=>{throw new Error('clone failed')};
  const r=createV69C035WhiteLobbyPresentation(f.gltf,V69_C035_LOBBY_SHA,V69_C035_LOBBY_SHA);
  assert(r.available);assert.equal(r.setApplied(true),false);
  assert(f.objects.every(t=>t.object.material===t.original));
});
