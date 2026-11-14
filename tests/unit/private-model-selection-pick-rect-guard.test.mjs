import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';

// Exercise the actual TypeScript picker, without private GLB/production WebGL.
const source=readFileSync(new URL('../../src/scripts/privateModelSelectionPicking.ts',import.meta.url),'utf8');
const runnable=stripTypeScriptTypes(source,{mode:'strip'})
  .replace('export const pickSelectableObjectAtClientPoint','const pickSelectableObjectAtClientPoint');
const pick=new Function(runnable+'\nreturn pickSelectableObjectAtClientPoint;')();

function fixture({clientX=125,clientY=250,rect={left:100,top:200,width:100,height:100},mode='select',hits=true}={}) {
  const calls={set:0,intersections:0};
  const pointer={x:12,y:34};
  const object={isMesh:true,material:{visible:true},name:'known mesh'};
  const raycaster={
    setFromCamera(){calls.set++;},
    intersectObjects(){calls.intersections++;return hits?[{object}]:[];},
  };
  const options={
    canvas:{dataset:{interactionMode:mode},getBoundingClientRect:()=>rect},
    camera:{},modelRoot:{children:[object]},raycaster,pointer,clientX,clientY,
    isEffectivelyVisible:()=>true,hasVisibleMaterial:()=>true,
  };
  return {options,calls,pointer,object};
}

test('non-finite coordinates and malformed rectangles fail closed before pointer/raycast',()=>{
  const base={left:100,top:200,width:100,height:100};
  const cases=[
    {clientX:NaN},{clientX:Infinity},{clientX:-Infinity},
    {clientY:NaN},{clientY:Infinity},{clientY:-Infinity},
    {rect:{...base,left:NaN}},{rect:{...base,top:Infinity}},
    {rect:{...base,width:NaN}},{rect:{...base,height:Infinity}},
    {rect:{...base,width:0}},{rect:{...base,height:-1}},
    {rect:{...base,left:Number.MAX_VALUE,width:Number.MAX_VALUE},clientX:Number.MAX_VALUE},
    {rect:{...base,top:Number.MAX_VALUE,height:Number.MAX_VALUE},clientY:Number.MAX_VALUE},
  ];
  for(const item of cases){
    const f=fixture(item);
    assert.equal(pick(f.options),null,JSON.stringify(item));
    assert.deepEqual(f.calls,{set:0,intersections:0},JSON.stringify(item));
    assert.deepEqual(f.pointer,{x:12,y:34},'stale pointer must not change');
  }
});

test('off-canvas coordinates never create selection from a stale mock raycast hit',()=>{
  for(const [clientX,clientY] of [
    [99.999,250],[200.001,250],[125,199.999],[125,300.001],
  ]){
    const f=fixture({clientX,clientY,hits:true});
    assert.equal(pick(f.options),null);
    assert.equal(f.calls.set,0);
    assert.equal(f.calls.intersections,0);
    assert.deepEqual(f.pointer,{x:12,y:34});
  }
});

test('valid inside and exact-boundary selections preserve NDC, hit and raycast',()=>{
  for(const [clientX,clientY,x,y] of [
    [100,200,-1,1],[200,300,1,-1],[150,250,0,0],
  ]){
    const f=fixture({clientX,clientY});
    assert.equal(pick(f.options),f.object);
    assert.equal(f.calls.set,1);
    assert.equal(f.calls.intersections,1);
    assert.deepEqual(f.pointer,{x,y});
  }
});

test('selection mode and genuine no-hit behavior remain unchanged',()=>{
  const disabled=fixture({mode:'point-pick'});
  assert.equal(pick(disabled.options),null);
  assert.equal(disabled.calls.set,0);
  const noHit=fixture({hits:false});
  assert.equal(pick(noHit.options),null);
  assert.equal(noHit.calls.set,1);
  assert.equal(noHit.calls.intersections,1);
});
