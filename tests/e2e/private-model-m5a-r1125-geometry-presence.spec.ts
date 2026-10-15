import {test} from '@playwright/test';
import assert from 'node:assert/strict';
// @ts-ignore - Node-only ESM source guard has no generated TS declarations.
import {inspectR1125Presentation, parseOriginalR1125} from '../../src/scripts/privateModelM5AR1125GeometryPresence.mjs';

const well=['SOK1','SOK2','SOK3','PVK'];
const nominal=['PVK_SOK1','PVK_SOK3','SOK1_SOK2','SOK3_BUILDING_END','SOK2_BUILDING_END'];
const unknown=['PVK_DISCHARGE','PVK_PARKING'];
const flags=['Canonical','physicalRouteClaim','exactXYClaim','exactZClaim','physicalElevationClaim','currentGeometryClaim','asBuiltClaim','publishToCURRENT'];
const negative=()=>Object.fromEntries(flags.map(x=>[x,false]));
function fixture(){
 const bin=Buffer.alloc(42);
 const v=new DataView(bin.buffer,bin.byteOffset,bin.byteLength);
 for(const [i,x] of [[0,0],[1,0],[2,0],[3,1],[4,0],[5,0],[6,0],[7,1],[8,0]] as [number,number][])v.setFloat32(i*4,x,true);
 for(let i=0;i<3;i++)v.setUint16(36+i*2,i,true);
 const accessors=[{type:'VEC3',componentType:5126,count:3,bufferView:0},{type:'SCALAR',componentType:5123,count:3,bufferView:1},{type:'VEC3',componentType:5126,count:2,bufferView:0}];
 const bufferViews=[{buffer:0,byteOffset:0,byteLength:36},{buffer:0,byteOffset:36,byteLength:6}];
 const meshes=[{primitives:[{mode:4,attributes:{POSITION:0},indices:1}]},{primitives:[{mode:1,attributes:{POSITION:2}}]}];
 const nodes:any[]=[];
 for(const name of well)nodes.push({mesh:0,extras:{...negative(),representationKind:'wellDiameterPresentationWork',sourceNodeId:name}});
 for(const name of [...nominal,...unknown])nodes.push({mesh:0,extras:{...negative(),representationKind:'pipeDiameterPresentationWork',sourceConnection:name,physicalDiameterPerRouteSourceVerified:false,pipeDiameterMmSource:nominal.includes(name)?100:null,pipeDiameterMmNominalSource:nominal.includes(name)?100:null,pipeDiameterMmSourceScope:'AGGREGATE_SALAOJA_SYSTEM_NOT_INDIVIDUAL_ROUTE',physicalNominalDiameterStatus:nominal.includes(name)?'GENERAL_SALAOJA_SYSTEM_NOMINAL_CLASS_NOT_PER_BRANCH_MEASUREMENT':'UNKNOWN'}});
 for(const name of unknown)nodes.push({mesh:1,extras:{...negative(),representationKind:'unresolvedBoundaryMarker',boundaryRole:name,boundaryStatus:'UNRESOLVED_BOUNDARY',sourceBoundaryUnresolved:true}});
 nodes.push({name:'M5A_R1125_DIAMETER_SOURCE_SPLIT_WORK_TEST_ROOT_BABYLON_Y_UP',rotation:[-Math.SQRT1_2,0,0,Math.SQRT1_2],children:Array.from({length:13},(_,i)=>i),extras:{...negative(),humanReview:'NOT_RUN'}});
 const scenes:any[]=Array.from({length:63},()=>({nodes:[]}));
 scenes.push({name:'M5A-R1125 FIVE SALAOJA D100 + TWO UNKNOWN PVK DIAMETERS WORK_TEST - BABYLON Y-UP',nodes:[13]});
 const doc={nodes,meshes,scenes,accessors,bufferViews};
 return {doc,bin};
}

test('synthetic 13-source fixture is source-presentation only',()=>{
 const r=inspectR1125Presentation(fixture());
 assert.deepEqual([r.objects,r.wells,r.routes,r.unresolvedBoundaries,r.triangles,r.lineSegments],[13,4,7,2,11,2]);
 assert.equal(r.asBuilt,false);
 assert.equal(r.physicalDiameterMeasured,false);
});
test('raw authentication fails on forged or truncated raw GLB',()=>{
 assert.throws(()=>parseOriginalR1125(Buffer.alloc(40)),/original raw bytes/);
 assert.throws(()=>parseOriginalR1125(Buffer.alloc(3112432)),/original raw SHA-256/);
});
test('as-built or physical promotion is rejected for each source object',()=>{
 const s=fixture();s.doc.nodes[4].extras.asBuiltClaim=true;
 assert.throws(()=>inspectR1125Presentation(s),/target no-promotion/);
 const r=fixture();r.doc.nodes[13].extras.currentGeometryClaim=true;
 assert.throws(()=>inspectR1125Presentation(r),/root no-promotion/);
});
test('the two PVK branches must keep unknown physical diameters',()=>{
 const s=fixture();s.doc.nodes[9].extras.pipeDiameterMmSource=100;
 assert.throws(()=>inspectR1125Presentation(s),/PVK diameter must remain unknown/);
});
test('duplicate or omitted targets are rejected',()=>{
 const s=fixture();s.doc.nodes[13].children[0]=1;
 assert.throws(()=>inspectR1125Presentation(s),/13 unique source targets/);
 const r=fixture();r.doc.nodes[13].children.pop();
 assert.throws(()=>inspectR1125Presentation(r),/13 unique source targets/);
});
test('invalid primitive geometry must be rejected',()=>{
 const s=fixture();Object.assign(s.doc.meshes[0].primitives[0],{indices:100});
 assert.throws(()=>inspectR1125Presentation(s),/index component/);
 const r=fixture();r.doc.meshes[0].primitives[0].mode=1;
 assert.throws(()=>inspectR1125Presentation(r),/triangles\/lines class/);
 const d=fixture();d.bin.writeFloatLE(NaN,0);
 assert.throws(()=>inspectR1125Presentation(d),/nonfinite coordinate/);
});
test('zero-area source triangle and unexpected axis transform fail closed',()=>{
 const s=fixture();s.bin.writeUInt16LE(0,36);s.bin.writeUInt16LE(0,38);s.bin.writeUInt16LE(0,40);
 assert.throws(()=>inspectR1125Presentation(s),/degenerate triangle/);
 const r=fixture();r.doc.nodes[13].rotation=[0,0,0,1];
 assert.throws(()=>inspectR1125Presentation(r),/root axis transform/);
});
