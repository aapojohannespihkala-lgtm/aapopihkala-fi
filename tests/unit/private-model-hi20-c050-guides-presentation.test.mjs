import test from 'node:test';
import assert from 'node:assert/strict';
import {createHi20C050GuidesPresentation,C050_SOURCE_SHA} from '../../src/scripts/privateModelHi20C050GuidesPresentation.mjs';
function fixture() {
  const nodes=Array.from({length:6463},()=>({}));
  const scenes=Array.from({length:52},()=>({children:[],traverse(fn){const visit=o=>{fn(o);for(const c of o.children??[])visit(c);};for(const c of this.children)visit(c);}}));
  const associations=new Map();
  const objects=new Map();
  const attach=(scene,id,mesh,name,extras,owner)=>{
    const obj={name,isMesh:mesh!==undefined,visible:true,children:[],parent:owner??scenes[scene]};
    (owner??scenes[scene]).children.push(obj);
    nodes[id]={name,extras,...(mesh!==undefined?{mesh}:{})};
    associations.set(obj,{nodes:id});objects.set(id,obj);return obj;
  };
  for(const [sc,first,parent] of [[50,5746,6459],[51,5767,6462]]){
    nodes[parent]={name:'KPH07_PARENT',children:Array.from({length:8},(_,i)=>first+i)};
    for(let i=0;i<8;i++)attach(sc,first+i,860+i,
      'HI09_SOURCE_CONTEXT_KPH07_A_MEASURE_GUIDE_'+i,
      {sourceOnly:true,presentationOnly:true,contextOnly:true});
  }
  const parent=attach(51,485,undefined,'NORTH_DOOR_OWNER_PRESERVED',{});
  const group=attach(51,484,undefined,'D1F_NORTH_DOOR_AXISFIX_NONPHYSICAL_W955_GUIDE',
    {isPhysicalOpening:false},parent);
  nodes[485].children=[484];nodes[484].children=[481,482,483];
  for(const [id,m] of [[481,504],[482,505],[483,506]]) attach(51,id,m,'SC3_GUIDE_NONPHYSICAL_'+id,{},group);
  const gltf={scenes,parser:{json:{scenes:Array.from({length:52},()=>({})),nodes},associations}};
  return {gltf,objects};
}
test('exact source filters only 16 source guides + 3 north-door gauges',()=>{
  const f=fixture();
  const api=createHi20C050GuidesPresentation(f.gltf,C050_SOURCE_SHA);
  assert.equal(api.available,true);assert.equal(api.count,19);
  api.setCleaned(true);
  for(let i=5746;i<=5753;i++)assert.equal(f.objects.get(i).visible,false);
  for(let i=5767;i<=5774;i++)assert.equal(f.objects.get(i).visible,false);
  assert.equal(f.objects.get(484).visible,false);
  assert.equal(f.objects.get(485).visible,true); // owner door remains
  assert([481,482,483].every(id=>f.objects.get(id).visible===true)); // no mesh mutation
  api.setCleaned(false);
  assert.equal(f.objects.get(484).visible,true);
  api.setCleaned(true);api.dispose();
  assert.equal(f.objects.get(484).visible,true);
  assert.equal(f.objects.get(5746).visible,true);
});
test('reject changed source SHA, scene count, node identity, mesh, or parent',()=>{
  const f=fixture();
  assert.equal(createHi20C050GuidesPresentation(f.gltf,'other').available,false);
  f.gltf.scenes.length=51;
  assert.equal(createHi20C050GuidesPresentation(f.gltf,C050_SOURCE_SHA).available,false);
  f.gltf.scenes.length=52;
  f.gltf.parser.json.nodes[5746].mesh=999;
  assert.equal(createHi20C050GuidesPresentation(f.gltf,C050_SOURCE_SHA).available,false);
  f.gltf.parser.json.nodes[5746].mesh=860;
  f.gltf.parser.json.nodes[5767].extras.sourceOnly=false;
  assert.equal(createHi20C050GuidesPresentation(f.gltf,C050_SOURCE_SHA).available,false);
  f.gltf.parser.json.nodes[5767].extras.sourceOnly=true;
  f.gltf.parser.json.nodes[485].children=[];
  assert.equal(createHi20C050GuidesPresentation(f.gltf,C050_SOURCE_SHA).available,false);
  assert.equal(f.objects.get(484).visible,true);
});

test('originally hidden guides stay hidden after reversible cleanup and unmount',()=>{
  const f=fixture();
  f.objects.get(5746).visible=false;
  f.objects.get(484).visible=false;
  const api=createHi20C050GuidesPresentation(f.gltf,C050_SOURCE_SHA);
  assert.equal(api.available,true);
  assert.equal(api.setCleaned(true),true);
  assert.equal(api.setCleaned(true),true); // animation-loop idempotence
  api.setCleaned(false);
  assert.equal(f.objects.get(5746).visible,false);
  assert.equal(f.objects.get(484).visible,false);
  assert.equal(f.objects.get(485).visible,true); // physical door owner untouched
  api.dispose();
  assert.equal(f.objects.get(5746).visible,false);
  assert.equal(f.objects.get(484).visible,false);
});
