import test from 'node:test';
import assert from 'node:assert/strict';
import { createUnified64C037WasherTopPresentation } from '../src/scripts/privateModelUnified64C037WasherTopPresentation.mjs';
const SHA = '22ddaac08a290bcaa38d2b9985e9e851c25d92d3da111134062dae13a96685e8';
const v = (x, y, z) => [x,y,z];
const box = (low, high) => [
 v(-.299,low,.295),v(-.299,low,-.295),v(-.299,high,-.295),v(-.299,high,.295),
 v(.299,low,-.295),v(.299,low,.295),v(.299,high,-.295),v(.299,high,.295),
];
const idx=[1,3,0,4,1,0,0,3,2,2,4,0,1,7,3,5,1,4,5,7,1,3,7,2,6,4,2,2,7,6,6,5,4,7,5,6];
class Geometry {
 constructor(vertices, index) { this.vertices=vertices; this.ids=[...index]; this.disposed=false;
 this.attributes={position:{count:vertices.length,getX:(i)=>vertices[i][0],getY:(i)=>vertices[i][1],getZ:(i)=>vertices[i][2]}};
 this.index={getX:(i)=>this.ids[i],count:this.ids.length}; }
 getAttribute(key) {return this.attributes[key];}
 clone(){return new Geometry(this.vertices,this.ids);}
 setIndex(ids){this.ids=[...ids];this.index={getX:(i)=>this.ids[i],count:this.ids.length};}
 dispose(){this.disposed=true;}
}
function fixture() {
 const json={asset:{version:'2.0',extras:{current:false,asBuilt:false}},
   scene:0,scenes:Array.from({length:64},()=>({nodes:[]})),nodes:Array.from({length:5734},()=>({})),meshes:Array.from({length:1873},()=>({primitives:[]}))};
 json.meshes[1665].primitives=[{material:228}];json.meshes[1666].primitives=[{material:229}];
 const associations=new Map(),scenes=Array.from({length:64},()=>({traverse:()=>{}}));
 const siblings=[];
 for(const t of [{scene:60,parent:5733,cabinet:5683,cover:5684,suffix:1},{scene:63,parent:5682,cabinet:5632,cover:5633,suffix:0}]){
  json.scenes[t.scene].nodes=[t.parent];json.nodes[t.parent].children=[t.cabinet,t.cover];json.nodes[t.cabinet].mesh=1665;json.nodes[t.cover].mesh=1666;
  const parent={name:'parent',children:[]};associations.set(parent,{nodes:t.parent});
  const make=(id,name,verts)=>({isMesh:true,name,geometry:new Geometry(verts,idx),parent,userData:{asBuilt:false,current:false,sourceLinks:[{docId:'verified-c037'}]},position:{distanceTo:()=>0},quaternion:{angleTo:()=>0},scale:{distanceTo:()=>0}});
  const cab=make(t.cabinet,`C80-037_BOSCH_${t.suffix}_BOSCH_WNG254ABSN_MAIN_CABINET`,box(0,.848));
  const cover=make(t.cover,`C80-037_BOSCH_${t.suffix}_TOP_COVER`,box(.845,.848));
  parent.children=[cab,cover];for(const x of parent.children) associations.set(x,{nodes:x===cab?t.cabinet:t.cover});
  scenes[t.scene]={traverse:cb=>{cb(parent);parent.children.forEach(cb)}};
  siblings.push([cab,cover]);
 }
 return {gltf:{scenes,parser:{json,associations}},siblings};
}
test('exact UNIFIED64: removes only 2 cabinet top faces in 1F and BOTH, leaves cover and restores',()=>{
 const {gltf,siblings}=fixture(),orig=siblings.map(([cab])=>cab.geometry);
 const fix=createUnified64C037WasherTopPresentation(gltf,SHA);
 assert.equal(fix.available,true,fix.reason);assert.equal(fix.count,4);
 assert.equal(fix.setEnabled(true),true);assert.equal(fix.enabled,true);
 for (let s=0;s<2;s++){
  const [cab,cover]=siblings[s];assert.notEqual(cab.geometry,orig[s]);
  assert.equal(cab.geometry.index.count,30);assert.equal(cover.geometry.index.count,36);
  assert.equal(cab.geometry.vertices.length,8);assert.equal(orig[s].index.count,36);
 }
 assert.equal(fix.setEnabled(true),true);
 const allocated=siblings.map(([cab])=>cab.geometry);
 fix.dispose();assert.equal(fix.enabled,false);
 for(let s=0;s<2;s++){assert.equal(siblings[s][0].geometry,orig[s]);assert.equal(allocated[s].disposed,true);}
 assert.equal(fix.setEnabled(true),true);assert.equal(fix.setEnabled(false),true);
});
test('wrong SHA or absent source mesh fails closed without mutation',()=>{
 const x=fixture(),original=x.siblings[0][0].geometry;
 assert.equal(createUnified64C037WasherTopPresentation(x.gltf,'incorrect').available,false);
 assert.equal(x.siblings[0][0].geometry,original);
 x.gltf.parser.json.nodes[5683].mesh=200;
 const fix=createUnified64C037WasherTopPresentation(x.gltf,SHA);
 assert.equal(fix.available,false);assert.equal(fix.setEnabled(true),false);
});
test('stale parent, missing provenance or altered top prevents partial patch',()=>{
 for (const bad of ['parent','provenance','geometry']) {
  const x=fixture();
  if(bad==='parent') x.gltf.parser.json.nodes[5733].children=[5684];
  if(bad==='provenance') x.siblings[1][1].userData.sourceLinks=[{docId:'different'}];
  if(bad==='geometry') x.siblings[1][1].geometry.vertices[7][1]=.849;
  const fix=createUnified64C037WasherTopPresentation(x.gltf,SHA);
  assert.equal(fix.available,false,bad);
  assert.equal(x.siblings[0][0].geometry.index.count,36,bad);
 }
});

test('C80-037 is actually mounted into and disposed with the existing 52-scene viewer lifecycle', async () => {
  const { readFileSync } = await import('node:fs');
  const source = readFileSync(
    new URL('../src/scripts/privateModelHi20K17WhitePresentation.mjs', import.meta.url),
    'utf8',
  );
  assert.match(source, /createUnified64C037WasherTopPresentation\(gltf,verifiedSha\)/);
  assert.match(source, /washerTop\.available && washerTop\.setEnabled\(true\)/);
  assert.match(source, /washerTop\.dispose\(\)/);
});

test('missing original 1F/BOTH scene root fails closed',()=>{const x=fixture();x.gltf.parser.json.scenes[60].nodes=[];const p=createUnified64C037WasherTopPresentation(x.gltf,SHA);assert.equal(p.available,false);assert.equal(x.siblings[0][0].geometry.index.count,36);});
