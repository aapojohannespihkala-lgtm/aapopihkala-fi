import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import ts from 'typescript';
import * as THREE from 'three';
import {createTechnicalReviewPresentation} from '../../src/scripts/privateModelTechnicalReviewPresentation.mjs';
import {
  markTechnicalReviewPickMaterials, technicalReviewHitRole,
  firstVisibleTechnicalReviewHit,
} from '../../src/scripts/privateModelTechnicalReviewHitPriority.mjs';

// Run the real point and selection predicates without mounting production WebGL.
const selSource=readFileSync(new URL('../../src/scripts/privateModelSelectionPicking.ts',import.meta.url),'utf8');
const selJs=stripTypeScriptTypes(selSource
  .replace(/^import \{firstVisibleTechnicalReviewHit\} from .*;\n/,''),{mode:'strip'})
  .replace('export const pickSelectableObjectAtClientPoint','const pickSelectableObjectAtClientPoint');
const pickSelect=new Function('firstVisibleTechnicalReviewHit',selJs+
  '\nreturn pickSelectableObjectAtClientPoint;')(firstVisibleTechnicalReviewHit);

const pointSource=readFileSync(new URL('../../src/scripts/privateModelWorkTest3DPoint.ts',import.meta.url),'utf8');
const start=pointSource.indexOf('const hasPresentationOnlyAncestor =');
assert.ok(start>=0 && pointSource.includes('firstVisibleTechnicalReviewHit(raycaster.intersectObjects'));
const pointJs=ts.transpileModule(pointSource.slice(start).replace(
  'export const pickVisibleWorkTest3DPoint','const pickVisibleWorkTest3DPoint'),
  {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
const hasVisibleMaterial=({material})=>!material || 
  (material.visible!==false && material.colorWrite!==false && (material.opacity===undefined || material.opacity>0.01));
const pickPoint=new Function('THREE','firstVisibleTechnicalReviewHit',
  'hasVisibleMaterial','isEffectivelyVisible','isPointVisibleThroughViewerHorizontalClip',
  pointJs+'\nreturn pickVisibleWorkTest3DPoint;')(
    THREE,firstVisibleTechnicalReviewHit,hasVisibleMaterial,
    (obj)=>obj.visible!==false,()=>true);

function makeNode(name,extra={}){
  const node={name,parent:null,children:[],visible:true,userData:{},...extra};
  node.add=function(child){child.parent=node;node.children.push(child);return node;};
  node.traverse=function(visit){visit(node);for(const child of node.children)child.traverse(visit);};
  return node;
}
function setup() {
  const root=makeNode('scene');
  const wallOriginal={name:'wall-original',opacity:1};
  const pipeOriginal={name:'pipe-original',opacity:1};
  const wall=makeNode('wall',{isMesh:true,material:wallOriginal});
  const techRoot=makeNode('verified-tech-root');
  const pipe=makeNode('verified-pipe',{isMesh:true,material:pipeOriginal,userData:{m5System:'VESI'}});
  root.add(wall).add(techRoot);techRoot.add(pipe);
  const review=createTechnicalReviewPresentation(root,[techRoot],()=>{
    const material=()=>({opacity:1,visible:true,userData:{},dispose(){}});
    return {surface:{...material(),opacity:0.05},line:{...material(),opacity:0.14},
      systems:{VESI:material()}};
  },obj=>obj.userData?.m5System??null);
  const hits=[
    {object:wall,point:new THREE.Vector3(1,2,3),distance:1},
    {object:pipe,point:new THREE.Vector3(4,5,6),distance:2},
  ];
  const raycaster={ray:{direction:new THREE.Vector3(0,0,-1)},setFromCamera(){},
    intersectObjects(){return hits;}};
  const modelRoot={children:[root],parent:null};
  const rect={left:100,top:200,width:100,height:100};
  const pickOptions={clientX:150,clientY:250,rect,camera:{},modelRoot,raycaster};
  const select=()=>pickSelect({
    ...pickOptions,canvas:{dataset:{interactionMode:'select'},getBoundingClientRect:()=>rect},
    pointer:{x:0,y:0},isEffectivelyVisible:(obj)=>obj.visible!==false,
    hasVisibleMaterial,
  });
  const point=()=>pickPoint(pickOptions);
  return {review,hits,wall,pipe,wallOriginal,pipeOriginal,select,point};
}

test('only palette with exact-source systems receives transient hit role',()=>{
  const legacy={surface:{userData:{}},line:{userData:{}}};
  markTechnicalReviewPickMaterials(legacy);
  assert.equal(legacy.surface.userData.ylisTechnicalReviewPickRole,undefined);
  const systems={surface:{userData:{other:1}},line:{userData:{}},
    systems:{VESI:{userData:{}}}};
  markTechnicalReviewPickMaterials(systems);
  assert.equal(systems.surface.userData.ylisTechnicalReviewPickRole,'context');
  assert.equal(systems.surface.userData.other,1);
  assert.equal(systems.systems.VESI.userData.ylisTechnicalReviewPickRole,'system');
  assert.equal(technicalReviewHitRole({object:{material:[systems.surface,systems.systems.VESI]},face:{materialIndex:1}}),'system');
  assert.equal(technicalReviewHitRole({object:{material:[systems.surface]},face:{materialIndex:9}}),null);
});

test('grey context cannot steal color-verified technical hit in both tools',()=>{
  const f=setup();f.review.apply(true);
  assert.equal(technicalReviewHitRole(f.hits[0]),'context');
  assert.equal(technicalReviewHitRole(f.hits[1]),'system');
  assert.equal(f.select(),f.pipe);
  const point=f.point();
  assert.equal(point?.surfaceObjectName,'verified-pipe');
  assert.deepEqual([point?.xM,point?.yM,point?.sourceHeightYUpM],[4,-6,5]);
  assert.equal(point?.interpretation,'WORK_TEST_MODEL_POINT_ONLY');
  assert.equal(point?.asBuilt,false);
  f.review.apply(false);
  assert.equal(f.wall.material,f.wallOriginal);
  assert.equal(f.pipe.material,f.pipeOriginal);
  assert.equal(f.select(),f.wall,'normal view selects nearest real wall');
  assert.equal(f.point()?.surfaceObjectName,'wall');
  f.review.dispose();
});

test('shell remains selectable when no verified technical hit is behind it',()=>{
  const f=setup();f.review.apply(true);
  f.hits.pop();
  assert.equal(f.select(),f.wall);
  assert.equal(f.point()?.surfaceObjectName,'wall');
  f.review.dispose();
});

test('never tunnel through unrelated glass or opaque non-review hits',()=>{
  const f=setup();f.review.apply(true);
  const glass=makeNode('glass',{isMesh:true,material:{opacity:0.4,visible:true}});
  f.hits.unshift({object:glass,point:new THREE.Vector3(9,8,7),distance:0.5});
  assert.equal(f.select(),glass);
  assert.equal(f.point()?.surfaceObjectName,'glass');
  f.hits.shift();
  f.hits.splice(1,0,{object:glass,point:new THREE.Vector3(9,8,7),distance:1.5});
  assert.equal(f.select(),f.wall,'unknown material behind grey shell stops look-through');
  assert.equal(f.point()?.surfaceObjectName,'wall');
  f.review.dispose();
});

test('material array uses intersected face and rejects unmarked impostors',()=>{
  const f=setup();f.review.apply(true);
  const fake=makeNode('fake-technical',{isMesh:true,material:[f.wall.material,f.pipe.material]});
  f.hits.splice(1,1,{object:fake,face:{materialIndex:0},point:new THREE.Vector3(4,5,6)});
  assert.equal(f.select(),f.wall,'context triangle cannot inherit system role');
  assert.equal(f.point()?.surfaceObjectName,'wall');
  f.hits[1].face.materialIndex=1;
  assert.equal(f.select(),fake);
  assert.equal(f.point()?.surfaceObjectName,'fake-technical');
  f.review.dispose();
});

test('outside canvas fails closed before reading any technical hits',()=>{
  const f=setup();f.review.apply(true);
  const x=f.point();
  assert.equal(x?.surfaceObjectName,'verified-pipe');
  // Normal selection/pick entry guards must survive the new priority helper.
  const point=pickPoint({...{
    clientX:95,clientY:250,rect:{left:100,top:200,width:100,height:100},
    camera:{},modelRoot:{children:[f.wall]},raycaster:{setFromCamera(){throw Error('raycast called');}}
  }});
  assert.equal(point,null);
  f.review.dispose();
});
