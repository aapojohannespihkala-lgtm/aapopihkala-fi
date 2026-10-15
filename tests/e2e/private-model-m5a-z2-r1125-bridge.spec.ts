import {test} from '@playwright/test';
import assert from 'node:assert/strict';
// @ts-ignore - Node-only ESM source guard has no separate TS declarations
import {assertSourcePrefix,inspectParsedSemantics,inspectRawBridge} from '../../src/scripts/privateModelM5AZ2R1125Bridge.mjs';
// @ts-ignore - Node-only ESM source guard has no separate TS declarations
import {SOURCES} from '../../src/scripts/privateModelM5AZ2R1125BridgeCli.mjs';

const five=['PVK_SOK1','PVK_SOK3','SOK1_SOK2','SOK3_BUILDING_END','SOK2_BUILDING_END'];
const two=['PVK_DISCHARGE','PVK_PARKING'];
const four=['PVK','SOK1','SOK2','SOK3'];
const noPromo=['Canonical','physicalRouteClaim','exactXYClaim','exactZClaim','physicalElevationClaim','currentGeometryClaim','asBuiltClaim','publishToCURRENT'];
const forbidden=()=>Object.fromEntries(noPromo.map(k=>[k,false]));

function fixture(){
  const nodes=Array.from({length:1097},(_,i)=>({name:'original-node-'+i}));
  nodes[0]={name:'M5A-Z2_ABSOLUTE_Z_HOST_FLOOR_DATUM_DRAIN_TOPOLOGY_WORK_ROOT_BABYLON_Y_UP',children:Array.from({length:13},(_,i)=>i+1)};
  for(let i=0;i<four.length;i++)nodes[i+1]={extras:{sourceNodeId:four[i]}};
  for(let i=0;i<seven.length;i++)nodes[i+5]={extras:{sourceConnection:seven[i]}};
  const scenes=Array.from({length:60},(_,i)=>({name:'source-'+i}));
  scenes[59]={name:'M5A-Z2 ABSOLUTE-Z HOST-FLOOR DATUM WORK_TEST - BABYLON Y-UP'};
  const base={scenes,nodes,meshes:[{name:'source-mesh'}],accessors:[{}],bufferViews:[{}],materials:[{}]};
  const newer=structuredClone(base);
  while(newer.scenes.length<63)newer.scenes.push({name:'intermediate'});
  const rootIndex=newer.nodes.length;
  const children=[];
  for(const w of four){
    children.push(newer.nodes.length);
    newer.nodes.push({extras:{...forbidden(),representationKind:'wellDiameterPresentationWork',sourceNodeId:w,
      perWellMaterialDiameterClaim:false,individualWellDiameterStatus:'UNRESOLVED',
      groundSurfaceReferencePhysicalClaim:false}});
  }
  for(const name of seven){
    children.push(newer.nodes.length);
    newer.nodes.push({extras:{...forbidden(),representationKind:'pipeDiameterPresentationWork',
      sourceConnection:name,G2IdCandidate:'G2_DRAIN_LINK_'+name+'_001',
      sourceDiameterCorrectionContract:'G2_R1125',
      presentationDiameterMm:100,presentationDiameterRole:'WORK_TEST_VISUAL_PROXY',
      physicalDiameterPerRouteSourceVerified:false,diameterIsPhysicalAsBuiltClaim:false,
      physicalDiameterAsBuiltClaim:false,pipeCenterlineExactClaim:false,
      externalNetworkConnectionClaim:false,
      pipeDiameterMmSource:five.includes(name)?100:null,
      pipeDiameterMmNominalSource:five.includes(name)?100:null,
      pipeDiameterMmSourceScope:'AGGREGATE_SALAOJA_SYSTEM_NOT_INDIVIDUAL_ROUTE',
      physicalNominalDiameterStatus:five.includes(name)?
        'GENERAL_SALAOJA_SYSTEM_NOMINAL_CLASS_NOT_PER_BRANCH_MEASUREMENT':'UNKNOWN',
      pipeDiameterSourceRole:'PVK_SOURCE_DIAMETER_UNKNOWN_PRESENTATION_D100',
      terminatesAtUnresolvedBoundary:true,unresolvedBoundaryRole:name}});
  }
  for(const name of two){
    children.push(newer.nodes.length);
    newer.nodes.push({extras:{...forbidden(),representationKind:'unresolvedBoundaryMarker',
      boundaryRole:name,boundaryStatus:'UNRESOLVED_BOUNDARY',
      sourceBoundaryUnresolved:true,externalNetworkConnectionClaim:false}});
  }
  newer.nodes.push({name:'M5A_R1125_DIAMETER_SOURCE_SPLIT_WORK_TEST_ROOT_BABYLON_Y_UP',children,
    extras:{sourceDiameterCorrectionContract:'G2_R1125',
      diameterSourceBreakdown:'5_SALAOJA_SYSTEM_NOMINAL_D100_PLUS_2_PVK_DIAMETER_UNKNOWN',
      sourceMetadataOnlySuccessor:true,originalGeometryByteMutation:false,
      Canonical:false,currentGeometryClaim:false,asBuiltClaim:false,
      publishToCURRENT:false,humanReview:'NOT_RUN'}});
  // Reorder root ahead of its children while preserving the original 1097 nodes.
  const root=newer.nodes.pop();
  newer.nodes.splice(rootIndex,0,root);
  root.children=Array.from({length:13},(_,i)=>rootIndex+1+i);
  newer.scenes.push({name:'M5A-R1125 FIVE SALAOJA D100 + TWO UNKNOWN PVK DIAMETERS WORK_TEST - BABYLON Y-UP',
    nodes:[rootIndex],extras:{sourceDiameterCorrectionContract:'G2_R1125',
      sourceDiameterClassBreakdown:'5_SALAOJA_AGGREGATE_NOMINAL_100MM__2_PVK_UNKNOWN',
      physicalRouteDiameterMeasuredClaim:false,currentGeometryClaim:false,publishToCURRENT:false}});
  const z={doc:base,bin:Buffer.from([1,2,3,4])};
  const r={doc:newer,bin:Buffer.from([1,2,3,4,5])};
  return {z,r,rootIndex};
}
const seven=[...five,...two];

test('valid parsed successor preserves every original array and BIN prefix',()=>{
  const {z,r}=fixture();
  assert.doesNotThrow(()=>assertSourcePrefix(z,r));
  const result=inspectParsedSemantics(z,r);
  assert.equal(result.status,'PARSED_SOURCE_MODEL_LINEAGE_ONLY');
  assert.equal(result.originalSourceBytesAuthenticated,false);
  assert.deepEqual(result.targets,{wells:4,routes:7,unresolvedBoundaries:2});
  assert.equal(result.physicalConnectionsVerified,false);
});

test('changed original node or binary byte fails lineage check',()=>{
  const {z,r}=fixture();
  r.doc.nodes[5].extras.sourceConnection='FORGED';
  assert.throws(()=>assertSourcePrefix(z,r),/nodes source prefix drift/);
  const f=fixture();f.r.bin[0]=255;
  assert.throws(()=>assertSourcePrefix(f.z,f.r),/binary prefix drift/);
});

test('truncated original array fails lineage check',()=>{
  const {z,r}=fixture();
  r.doc.meshes=[];
  assert.throws(()=>assertSourcePrefix(z,r),/meshes source length/);
});

test('PVK unknown diameter cannot be promoted to a measured nominal D100',()=>{
  const {z,r,rootIndex}=fixture();
  const root=r.doc.nodes[rootIndex];
  const idx=root.children.find((id:number)=>r.doc.nodes[id].extras?.sourceConnection==='PVK_DISCHARGE');
  assert.ok(idx!==undefined);
  r.doc.nodes[idx].extras.pipeDiameterMmSource=100;
  assert.throws(()=>inspectParsedSemantics(z,r),/two PVK branches must remain unknown/);
});

test('physical/as-built promotion flags fail even with a plausible source label',()=>{
  const {z,r,rootIndex}=fixture();
  const first=r.doc.nodes[rootIndex].children[0];
  r.doc.nodes[first].extras.asBuiltClaim=true;
  assert.throws(()=>inspectParsedSemantics(z,r),/no-promotion/);
});

test('source-roster and scene identities must remain exactly 4+7+2',()=>{
  const {z,r,rootIndex}=fixture();
  r.doc.nodes[rootIndex].children.pop();
  assert.throws(()=>inspectParsedSemantics(z,r),/thirteen unique targets/);
  const f=fixture();f.r.doc.scenes[63].name='unexpected production scene';
  assert.throws(()=>inspectParsedSemantics(f.z,f.r),/exact scene index\/name/);
});

test('parsed fixtures are never substitutes for authenticated raw source bytes',()=>{
  assert.throws(()=>inspectRawBridge(Buffer.alloc(SOURCES.z2.bytes),Buffer.alloc(SOURCES.r1125.bytes)),/SHA-256 mismatch/);
});
