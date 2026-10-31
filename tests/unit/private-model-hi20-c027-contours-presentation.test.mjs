import test from 'node:test';
import assert from 'node:assert/strict';
import {createHi20C027ContourPresentation,C027_CONTOUR_SOURCE_SHA} from '../../src/scripts/privateModelHi20C027ContourPresentation.mjs';
function geometry(){
  const xyz=[],indices=[];
  for(let i=0;i<1947;i++){
    const major=i<995,level=major?(i%6)-2:(i%6)-1.5;
    const z=level+.03;
    const x=i%50,y=Math.floor(i/50),base=xyz.length;
    xyz.push([x-.026,y,z],[x+.026,y,z],[x-.026,y+.2,z],[x+.026,y+.2,z]);
    indices.push(base,base+1,base+2,base,base+2,base+3);
  }
  const pos={count:xyz.length,getX:i=>xyz[i][0],getY:i=>xyz[i][1],
    getZ:i=>xyz[i][2],setXY(i,x,y){xyz[i][0]=x;xyz[i][1]=y;},needsUpdate:false};
  return {getAttribute:n=>n==='position'?pos:null,index:{count:indices.length,getX:i=>indices[i]},
    clone(){const g=geometry();g.getAttribute('position').needsUpdate=false;return g;},
    setIndex(v){this.index={count:v.length,getX:i=>v[i]};},clearGroups(){this.groups=[];},
    addGroup(start,count,materialIndex){this.groups.push({start,count,materialIndex});},
    computeBoundingBox(){},computeBoundingSphere(){},dispose(){this.disposed=true;}};
}
function material(){
  return {color:{setRGB(...rgb){this.rgb=rgb;}},clone(){
    const m=material();m.dispose=()=>{m.disposed=true;};return m;
  }};
}
function fixture(){
  const ns=Array.from({length:6457},()=>({})),scenes=Array.from({length:52},()=>({nodes:[]}));
  const meshes=Array.from({length:1858},()=>({}));
  meshes[1857]={name:'C80_027_HI20_EXISTING_0P5M_CONTOUR_TRIANGLE_RIBBONS_DISPLAY_ONLY',
    primitives:[{indices:3060,attributes:{POSITION:3058},material:341}],
    extras:{originalSegments:1947,newTriangles:3894}};
  const materials=Array.from({length:342},()=>({}));
  materials[341]={pbrMetallicRoughness:{baseColorFactor:[.105,.155,.165,1]},
    extras:{datum:'MODEL_LOCAL_ONLY'}};
  const world=Array.from({length:52},()=>({meshes:[],traverse(fn){this.meshes.forEach(fn);}}));
  const assoc=new Map(),objects=[];
  for(const t of [{scene:50,parent:6454,node:6453,part:'1F'},{scene:51,parent:6456,node:6455,part:'BOTH'}]){
    const parentName='C80R1_SCALGO_SITE_CONTEXT_'+t.part;
    const name='C80_027_HI20_MODEL_LOCAL_0P5M_CONTOURS_THICKENED_DISPLAY_ONLY_'+t.part;
    ns[t.parent]={name:parentName,children:[t.node]};
    ns[t.node]={name,mesh:1857,extras:{
      representationKind:'DERIVED_TERRAIN_ISOLINES_ONLY',physicalHost:'HOST_HOLD',
      sourceOnly:true,current:false,asBuilt:false,
      sourceLinks:[{driveId:'1XOld_YLurqS-NHzXWotzywD0YiP4nFOK'}],contourIntervalModelMeters:.5}};
    scenes[t.scene].nodes=[t.parent];
    const parent={name:parentName};
    const obj={name,isMesh:true,visible:true,geometry:geometry(),material:material(),parent};
    world[t.scene].meshes.push(obj);objects.push(obj);
    assoc.set(obj,{nodes:t.node});assoc.set(parent,{nodes:t.parent});
  }
  return {gltf:{parser:{json:{asset:{version:'2.0',extras:{asBuilt:false,current:false}},scene:0,
    scenes,nodes:ns,meshes,materials},associations:assoc},scenes:world},objects};
}
test('1F/BOTH source-only split is reversible, two materials and narrower intermediate lines',()=>{
  const {gltf,objects}=fixture(),orig=objects.map(o=>({g:o.geometry,m:o.material}));
  const result=createHi20C027ContourPresentation(gltf,C027_CONTOUR_SOURCE_SHA);
  assert.equal(result.available,true,result.reason);assert.equal(result.count,2);
  assert.equal(result.majorSegments,995);assert.equal(result.minorSegments,952);
  assert.equal(result.setEnabled(true),true);
  for(let i=0;i<2;i++){
    const o=objects[i],p=o.geometry.getAttribute('position'),source=orig[i].g.getAttribute('position');
    assert.notEqual(o.geometry,orig[i].g);
    assert.equal(o.material[0],orig[i].m);
    assert.deepEqual(o.material[1].color.rgb,[.58,.64,.63]);
    assert.deepEqual(o.geometry.groups,[{start:0,count:5970,materialIndex:0},
      {start:5970,count:5712,materialIndex:1}]);
    assert.equal(p.count,7788);assert.equal(o.geometry.index.count,11682);
    assert.equal(p.getX(0),source.getX(0));
    const minorVertex=995*4;
    assert.ok(Math.abs(p.getX(minorVertex)-source.getX(minorVertex))>0.012);
    assert.equal(p.getZ(minorVertex),source.getZ(minorVertex));
  }
  assert.equal(result.setEnabled(true),true);
  result.dispose();
  objects.forEach((o,i)=>{assert.equal(o.geometry,orig[i].g);assert.equal(o.material,orig[i].m);});
});
test('wrong SHA, node, provenance or scene fail closed without editing source',()=>{
  for(const alter of [
    g=>g.parser.json.nodes[6455].extras.sourceLinks=[],
    g=>g.parser.json.scenes[50].nodes=[],
    g=>g.parser.json.nodes[6453].mesh=1856,
    g=>g.parser.json.nodes[6456].children=[],
    g=>g.parser.json.materials[341].pbrMetallicRoughness.baseColorFactor[0]=.6,
  ]){
    const {gltf,objects}=fixture(),source=objects[0].geometry;
    alter(gltf);
    const r=createHi20C027ContourPresentation(gltf,C027_CONTOUR_SOURCE_SHA);
    assert.equal(r.available,false);
    assert.equal(objects[0].geometry,source);
  }
  assert.equal(createHi20C027ContourPresentation(fixture().gltf,'bad').available,false);
});
test('corrupted minor-line height fails closed',()=>{
  const {gltf,objects}=fixture();
  const attr=objects[1].geometry.getAttribute('position'),real=attr.getZ.bind(attr);
  attr.getZ=i=>i===4000?2.123:real(i);
  assert.equal(createHi20C027ContourPresentation(gltf,C027_CONTOUR_SOURCE_SHA).available,false);
});
