import {
  c80530ElectricalGroupEvidenceForNode as electricalGroup,
  createC80530ElectricalGroupEvidenceResolver as groupResolver,
  c80530MountedSourceChain as mountedChain,
} from '../../src/scripts/privateModelC80530ElectricalGroupEvidence.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {firstVisibleTechnicalReviewHit} from '../../src/scripts/privateModelTechnicalReviewHitPriority.mjs';

// Exercise the actual TypeScript picker, without private GLB/production WebGL.
const source=readFileSync(new URL('../../src/scripts/privateModelSelectionPicking.ts',import.meta.url),'utf8');
const runnable=stripTypeScriptTypes(source
  .replace(/^import \{firstVisibleTechnicalReviewHit\} from .*;\n/,''),{mode:'strip'})
  .replace('export const pickSelectableObjectAtClientPoint','const pickSelectableObjectAtClientPoint');
const pick=new Function('firstVisibleTechnicalReviewHit',runnable+
  '\nreturn pickSelectableObjectAtClientPoint;')(firstVisibleTechnicalReviewHit);

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

test('C80 530 exact historical circuit evidence never asserts a 2026 feed',()=>{
 const nodes=[];
 nodes[11560]={name:'D_1F_EXTERIOR_DOUBLE_OUTLET_COMMON_WEATHER_FLAP_OWNER_APPROVED_ROOT_WORK_TEST_HOST_HOLD',
   extras:{group2015:'RK11.1 2015 PLAN_ONLY',current:false,asBuilt:false}};
 nodes[11574]={name:'D_2F_EXTERIOR_DOUBLE_OUTLET_COMMON_WEATHER_FLAP_OWNER_APPROVED_ROOT_WORK_TEST_HOST_HOLD',
   extras:{group2015:'RK11.2 2015 PLAN_ONLY',current:false,asBuilt:false}};
 nodes[11590]={name:'RK4_2_D1F_INNER_STORAGE_FROM_2015_HISTORIC_ENDPOINT_TO_OWNER2026_LAMP_CONCEALED_LASTLEG_WORK_ASSUMPTION',
   extras:{circuitId:'RK4.2',current:false,asBuilt:false,noCurrentPhysicalCircuitClaim:true}};
 nodes[11996]={name:'MJ54_BOSCH_WNG254ABSN_CORRECT_PUMP_FRONT_RIGHT_WORK_TEST_HOST_HOLD_SAVO180_SG5_RIGHT_COFIT_BOSCH_FRONT_CONTROL_LEFT_RIGHT_OWNER_MANUFACTURER_CORRECT_20261111'};
 const json={nodes};
 for(const [id,group] of [[11560,'RK11.1'],[11574,'RK11.2'],[11590,'RK4.2']]){
   const rows=electricalGroup(json,id);
   assert.deepEqual(rows,[
     ['Sähköryhmä (2015)',group+' - historiallinen suunnitelma'],
     ['Nykyinen sähkösyöttö','NOT_VERIFIED'],
   ]);
 }
 assert.deepEqual(electricalGroup(json,11996),[
   ['Sähköryhmä','NOT_VERIFIED'],['Nykyinen sähkösyöttö','NOT_VERIFIED'],
 ]);
 nodes[9516]={name:'C80R2_V55_TOSHIBA_DAISEIKAI8_PHOTO_R1_CLOSED_HOST_HOLD_COW_WORK_TEST'};
 nodes[10853]={name:'R6_OVEN_TRANSFORMED_TO_LEFT_PHOTO_POSITION_WORK_ASSUMPTION'};
 nodes[10975]={name:'C80R2_V69_P12_OPTIN__LOW3_BAY1_OWNER_WIDTH_595MM_DISHWASHER_LEFT_595_ORDER_ASSUMPTION_V9COW'};
 nodes[11311]={name:'V86_SAUNA_HARVIA_CILINDRO_PC90_HPC900400_FROM_R1_PRODUCT_MODEL'};
 nodes[11642]={name:'NIBE_R200_OWNER_TRUE_LEFT_BACK_CORNER_DROPS_REV4_WORK_TEST'};
 nodes[12048]={name:'MJ16_SAVO_IH7603W_MANUFACTURER_TWO_WHITE_SHELLS_JOINT_CORRECTED_ROOT_20261111'};
 nodes[12098]={name:'MJ72_OWNER2026_STORAGE_SOCKET_TWO_CLOSED_COVERS_UPPER_DOOR_WALL_COW_ROOT_WORK_TEST_HOST_HOLD'};
 for(const id of [11311,9516,12098,12048,10975,10853,11642]){
   assert.deepEqual(electricalGroup(json,id),[
     ['Sähköryhmä','NOT_VERIFIED'],['Nykyinen sähkösyöttö','NOT_VERIFIED'],
   ],'exact 530 source device '+id);
 }
 assert.equal(electricalGroup(json,10),null);
 const swapped={...nodes[11560],name:'ROOM3_DONOR_SAME_INDEX'};
 nodes[11560]=swapped;
 assert.equal(electricalGroup(json,11560),null,'cross-SHA same-index donor rejected');
 nodes[11560]={...swapped,name:'D_1F_EXTERIOR_DOUBLE_OUTLET_COMMON_WEATHER_FLAP_OWNER_APPROVED_ROOT_WORK_TEST_HOST_HOLD_EXTRA'};
 assert.equal(electricalGroup(json,11560),null,'same prefix but altered exact node name rejected');
 nodes[11560]={name:'D_1F_EXTERIOR_DOUBLE_OUTLET_COMMON_WEATHER_FLAP_OWNER_APPROVED_ROOT_WORK_TEST_HOST_HOLD',
   extras:{group2015:'RK11.2 2015 PLAN_ONLY',current:false,asBuilt:false}};
 assert.equal(electricalGroup(json,11560),null,'different historical group rejected');
 nodes[11560].extras.group2015='RK11.1 2015 PLAN_ONLY';
 nodes[11560].extras.current=true;
 assert.equal(electricalGroup(json,11560),null,'CURRENT forged status rejected');
 nodes[11560].extras.current=false;
 nodes[11590].extras.noCurrentPhysicalCircuitClaim=false;
 assert.equal(electricalGroup(json,11590),null,'missing no-current warning rejected');
});

test('C80 530 electrical group resolver fails closed without SHA and scene binding',()=>{
 const scene={children:[]},mesh={name:'D_1F_EXTERIOR_DOUBLE_OUTLET_COMMON_WEATHER_FLAP'};
 const fake={parser:{json:{scenes:Array.from({length:530},()=>({nodes:[]}))},
   associations:new Map([[mesh,{nodes:11560}]])},scenes:[scene]};
 assert.deepEqual(groupResolver(fake,'0'.repeat(64))(mesh,scene),[]);
 assert.deepEqual(groupResolver(fake,'1a99cc32c80e1b87bbefcf9e6f373af42aee7e72ede574eabafe375298fd9f9e')(mesh,scene),[]);
});

// The real resolver also validates the original 530 scene/asset SHA; these
// structural tests protect the mounted Object3D ancestry independently.
test('C80 530 source selection requires real mounted-scene ancestry',()=>{
 const activeScene={parent:null,name:'source scene'};
 const foreign={parent:null,name:'helper scene'};
 const selected={parent:activeScene,name:'source mesh'};
 const other={parent:foreign,name:'foreign cloned helper'};
 assert.deepEqual(mountedChain(selected,activeScene),[selected]);
 assert.equal(mountedChain(other,activeScene),null);
 assert.equal(mountedChain(activeScene,activeScene)?.length,0);
 const cyclic={name:'orphan cycle'};
 cyclic.parent=cyclic;
 assert.equal(mountedChain(cyclic,activeScene),null);
});
