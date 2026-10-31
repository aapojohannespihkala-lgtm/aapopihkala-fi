import test from 'node:test';
import assert from 'node:assert/strict';
import {C025_SOURCE_SHA,createHi20C025RoofGhostPresentation}
  from '../../src/scripts/privateModelHi20C025RoofGhostPresentation.mjs';

function fixture(){
  const geometry={},material={};
  const scenes=Array.from({length:52},()=>({
    isScene:true,children:[],
    add(o){this.children.push(o);o.parent=this;},
    remove(o){this.children=this.children.filter(c=>c!==o);o.parent=null;}
  }));
  const nodes=Array.from({length:5848},()=>({}));
  const roots=new Map();
  for(const [id,which] of [[5846,'17'],[5847,'18']]){
    const name='HI17_C80_019_025_ROOF_GHOST_ALPHA020_EXISTING_TWO_HOLES_SC'+which+'_OPTIN';
    nodes[id]={mesh:1776,name,extras:{
      sourceOnly:true,presentationOnly:true,explicitOptinRequired:true,
      physicalHost:'HOST_HOLD',current:false,asBuilt:false,
      K5SkylightIdentityVerified:false,sourceDriveId:'roof-source',
      sourceLinksPreserved:true
    }};
    roots.set(id,{isMesh:true,name,geometry,material,visible:true,
      userData:{sourceDriveId:'roof-source',sourceLinks:[{url:'source'}]},
      clone(){return {...this,userData:{...this.userData}};}
    });
  }
  const json={
    asset:{version:'2.0',extras:{current:false,asBuilt:false}},scene:0,
    scenes:Array.from({length:52},()=>({nodes:[]})),nodes,
    meshes:Array.from({length:1777},()=>({})),
    materials:Array.from({length:324},()=>({}))
  };
  json.scenes[24].nodes=[5846];json.scenes[25].nodes=[5847];
  json.meshes[1776]={extras:{existingHoleCount:2},primitives:[{material:323}]};
  json.materials[323]={alphaMode:'BLEND',doubleSided:true,
    pbrMetallicRoughness:{baseColorFactor:[.43,.51,.59,.2]}};
  return {scenes,parser:{json,getDependency:async(_,id)=>roots.get(id)}};
}
test('C025 exact source: only two source roofs in 2F/BOTH, opt-in OFF, reversible',async()=>{
  const gltf=fixture();
  const p=await createHi20C025RoofGhostPresentation(gltf,C025_SOURCE_SHA);
  assert.equal(p.available,true,p.reason);assert.equal(p.visible,false);
  for(const i of [48,51]){
    assert.equal(gltf.scenes[i].children.length,1);
    assert.equal(gltf.scenes[i].children[0].visible,false);
    assert.equal(gltf.scenes[i].children[0].userData.sourceLinks[0].url,'source');
  }
  assert.equal(gltf.scenes[50].children.length,0);
  p.setVisible(true);
  for(const i of [48,51]) assert.equal(gltf.scenes[i].children[0].visible,true);
  p.setVisible(false);
  for(const i of [48,51]) assert.equal(gltf.scenes[i].children[0].visible,false);
  p.dispose();
  for(const i of [48,51]) assert.equal(gltf.scenes[i].children.length,0);
  assert.equal(p.setVisible(true),false);
});
test('C025 source guard refuses SHA/material/host/duplicate drift',async()=>{
  let g=fixture();
  assert.equal((await createHi20C025RoofGhostPresentation(g,'wrong')).available,false);
  g=fixture();g.parser.json.nodes[5846].extras.K5SkylightIdentityVerified=true;
  assert.equal((await createHi20C025RoofGhostPresentation(g,C025_SOURCE_SHA)).available,false);
  g=fixture();g.parser.json.materials[323].pbrMetallicRoughness.baseColorFactor[3]=1;
  assert.equal((await createHi20C025RoofGhostPresentation(g,C025_SOURCE_SHA)).available,false);
  g=fixture();g.parser.json.scenes[51].nodes.push(5847);
  assert.equal((await createHi20C025RoofGhostPresentation(g,C025_SOURCE_SHA)).available,false);
});
test('C025 user checkbox is opt-in and removed on dispose',async()=>{
  const g=fixture(),p=await createHi20C025RoofGhostPresentation(g,C025_SOURCE_SHA);
  const original=globalThis.document;let mounted=null;
  globalThis.document={createElement(tag){
    const handlers={};
    return {tag,children:[],checked:false,append(...a){this.children.push(...a);},
      addEventListener(k,f){handlers[k]=f;},fire(k){handlers[k]?.();},
      remove(){this.removed=true;}
    };
  }};
  try{
    assert.equal(p.mountControl({insertAdjacentElement(_,x){mounted=x;}}),true);
    const input=mounted.children[0].children[0];
    assert.equal(input.checked,false);
    input.checked=true;input.fire('change');assert.equal(p.visible,true);
    p.setVisible(false);assert.equal(input.checked,false);
    p.dispose();assert.equal(mounted.removed,true);
  }finally{globalThis.document=original;}
});
