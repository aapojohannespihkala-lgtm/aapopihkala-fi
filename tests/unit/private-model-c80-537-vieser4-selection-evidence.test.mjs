import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_537_VIESER4_GLB_SHA256 as SHA,
 C80_537_VIESER4_GLB_BYTES as BYTES,
 C80_537_VIESER4_ZIP_DRIVE_ID,
 C80_537_VIESER4_PARENT_SHA256 as PARENT,
 C80_537_VIESER4_PARENT_ZIP,
 C80_537_VIESER4_SCENES,
 isC80537Vieser4WaterSealEvidence as evidence,
 isC80537Vieser4SourceScene as valid,
 c80537Vieser4NodeLabel as label,
 createC80537Vieser4SelectionEvidenceResolver as resolver,
} from '../../src/scripts/privateModelC80537Vieser4SelectionEvidence.mjs';

const roots=[
 [12261,'D1F_PESUHUONE_SUIHKU1',[5.7755,0.0845,-2.4705],[1795,1796,10504,11610]],
 [12268,'D1F_PESUHUONE_SUIHKU2',[5.8155,0.0845,-3.3635],[1797,1798,10506,11611]],
 [12275,'D1F_SAUNA',[5.46,0.089,-1.463],[6620,10508]],
 [12282,'D2F_WC',[5.72,2.844,-5.997],[11643,11644,11645]],
];
function sample(){
 const nodes=new Array(12285).fill(null);
 for(const [id,key,translation,hosts] of roots){
   nodes[id]={name:`DRAIN4_${key}_VIESER_WATERSEAL_GENERIC_OWNER_BRAND_CONFIRMED_WORK_TEST`,
     translation,children:Array.from({length:6},(_,i)=>id-6+i),extras:{
       status:'WORK_TEST_HOST_HOLD_NOT_CURRENT',m5System:'VESI',
       ownerConfirmed:'four Vieser drain locations 2026-11-15',
       ownerConfirmedFact:'Vieser manufacturer and four visible drain locations, not internal SKU or water seal shape',
       schema:'GENERIC_CONCEPTUAL_WATER_LOCK_INSERT_NOT_MANUFACTURER_EXACT',
       physicalTrapVerified:false,physicalXYZSurveyed:false,verifiedPipeConnections:0,
       current:false,asBuilt:false,hostHold:true,noNewPipeRoute:true,noCutFloor:true,
       noOverwriteOfExistingCovers:true,sourceExactHostNodeRefs:hosts,
       sourceModelGLBSHA256:PARENT,sourceModelZIPDriveID:C80_537_VIESER4_PARENT_ZIP,
       assemblyHeightM_WORK_ASSUMPTION:0.14,assemblyOuterDiameterM_WORK_ASSUMPTION:0.076,
     }};
   for(let i=0;i<6;i++){
     nodes[id-6+i]={name:`DRAIN4_${key}_${i+1}_SCHEMATIC_NOT_VERIFIED`,
       mesh:4621+i,extras:{
         stage:'WORK_TEST',m5System:'VESI',manufacturerOwnerConfirmed:'Vieser',
         isPhysicalSKUVerified:false,isPhysicalWaterSealMechanismVerified:false,
         asBuilt:false,
       }};
   }
 }
 nodes[12283]={name:'DRAIN4_D1F_THREE_VIESER_TRAP_INSERTS_OPTIONAL_WORK_TEST',
   children:[12261,12268,12275],extras:{noSourceNodeModified:true}};
 nodes[12284]={name:'DRAIN4_D2F_ONE_VIESER_TRAP_INSERT_OPTIONAL_WORK_TEST',
   children:[12282],extras:{noSourceNodeModified:true}};
 return {nodes};
}
test('C80 537 real source identity, six user-selectable historical scenes, no exact SKU claim',()=>{
 assert.match(SHA,/^[0-9a-f]{64}$/);
 assert.equal(BYTES,55712088);
 assert.equal(C80_537_VIESER4_ZIP_DRIVE_ID,'1-hgR5kLcR0tm_nEiN69yhxouaYAarKNF');
 assert.deepEqual(Object.keys(C80_537_VIESER4_SCENES),['530','531','532','533','534','535']);
 assert.equal(C80_537_VIESER4_SCENES[530].floor,'1F');
 assert.equal(C80_537_VIESER4_SCENES[531].floor,'2F');
 assert.equal(C80_537_VIESER4_SCENES[532].floor,'BOTH');
 assert.deepEqual(C80_537_VIESER4_SCENES[530].addedRoots,[12283]);
 assert.deepEqual(C80_537_VIESER4_SCENES[531].addedRoots,[12284]);
 assert.deepEqual(C80_537_VIESER4_SCENES[532].addedRoots,[12283,12284]);
 assert.equal(label(12261),'1F suihku 1');
 assert.equal(label(12282),'2F WC');
 assert.equal(label(12283),null,'group is not an individual trap');
 assert.equal(valid({},SHA,530,'1F'),false);
 assert.equal(valid({},SHA,536),false,'standalone inspection scene is not a floor role');
});
test('all four Vieser concept parts require noncurrent and no physical mechanism claims',()=>{
 const json=sample();
 assert.equal(evidence(json),true);
 const mutate=(object,key,value)=>{
   const before=object[key];object[key]=value;
   try{assert.equal(evidence(json),false,'should reject '+key);}
   finally{object[key]=before;}
 };
 mutate(json.nodes[12261].extras,'physicalTrapVerified',true);
 mutate(json.nodes[12261].extras,'physicalXYZSurveyed',true);
 mutate(json.nodes[12282].extras,'current',true);
 mutate(json.nodes[12275].extras,'noCutFloor',false);
 mutate(json.nodes[12268].extras,'verifiedPipeConnections',1);
 mutate(json.nodes[12275].extras,'schema','MANUFACTURER_EXACT');
 mutate(json.nodes[12261].extras,'sourceModelGLBSHA256',SHA);
 mutate(json.nodes[12282].extras,'ownerConfirmed','not Vieser');
 mutate(json.nodes[12275].extras,'hostHold',false);
 mutate(json.nodes[12283],'children',[12261,12261,12275]);
 mutate(json.nodes[12282],'translation',[5.72,2.844,0]);
 mutate(json.nodes[12269],'mesh',4600);
 mutate(json.nodes[12276].extras,'isPhysicalSKUVerified',true);
 assert.equal(evidence(json),true,'restore checks after every mutation');
});
test('Vieser4 source selection fails closed on SHA, model, missing associations, wrong role',()=>{
 const json=sample(),scenes=Array.from({length:537},()=>({}));
 const selected={parent:scenes[532]},association=new Map([[selected,{nodes:12261}]]);
 const gltf={scenes,parser:{json,associations:association}};
 for(const sha of ['',PARENT,'0'.repeat(64),null]){
   assert.deepEqual(resolver(gltf,sha)(selected,scenes[532]),[],'wrong SHA');
 }
 assert.deepEqual(resolver(gltf,SHA)(selected,scenes[532]),[],
   'unverified synthetic glTF JSON cannot pass source-root hashes');
 assert.deepEqual(resolver({scenes,parser:{json}},SHA)(selected,scenes[532]),[]);
 assert.deepEqual(resolver({scenes:scenes.slice(1),parser:{json,associations:association}},SHA)(selected,scenes[532]),[]);
});
test('index source metadata wire is additive and does not bind sourceLinks',()=>{
 const source=readFileSync('src/pages/private-model/index.astro','utf8');
 assert.match(source,/createC80537Vieser4SelectionEvidenceResolver/);
 assert.match(source,/resolveVieser4HistoricalEvidence\(object, modelRoot\.children\[0\] \?\? null\)/);
 assert.match(source,/sourceNodeModel\(gltf\)/);
});
const input=process.env.C80_537_VIESER4_GLB_PATH;
const binary=input?readFileSync(input):null;
const sha=binary?createHash('sha256').update(binary).digest('hex'):null;
const json=binary?.toString('ascii',0,4)==='glTF'
  ? JSON.parse(binary.subarray(20,20+binary.readUInt32LE(12)).toString('utf8')):null;
test('optional genuine 55 MB GLB 1F/2F/BOTH source/root/selection proof',
  {skip:!json},()=>{
 assert.equal(binary.length,BYTES);
 assert.equal(sha,SHA);
 assert.equal(evidence(json),true);
 for(const [key,s] of Object.entries(C80_537_VIESER4_SCENES)){
   assert.equal(valid(json,sha,Number(key),s.floor),true,'verified genuine scene '+key);
   assert.equal(valid(json,PARENT,Number(key),s.floor),false,'source SHA mismatch');
 }
 const scenes=Array.from({length:537},()=>({}));
 const selected={parent:scenes[532]},association=new Map([[selected,{nodes:12261}]]);
 const gltf={scenes,parser:{json,associations:association}};
 const read=resolver(gltf,sha);
 let rows=read(selected,scenes[532]);
 assert.equal(rows[0][1],'1F suihku 1');
 assert.match(rows.map(x=>x.join(':')).join('|'),/NOT_VERIFIED/);
 assert.deepEqual(read(selected,scenes[531]),[],'wrong floor');
 assert.deepEqual(read({name:selected.name,parent:scenes[532]},scenes[532]),[],
   'same-name donor with no source association denied');
 const donor={parent:null};association.set(donor,{nodes:12261});
 assert.deepEqual(read(donor,scenes[532]),[],'detached source-associated donor denied');
 association.set(selected,{nodes:12282});
 assert.deepEqual(read(selected,scenes[530]),[],'2F trap must not leak into 1F');
 association.set(selected,{nodes:12261});
 json.nodes[12275].extras.physicalTrapVerified=true;
 assert.deepEqual(read(selected,scenes[532]),[],'changed verification rejected');
 json.nodes[12275].extras.physicalTrapVerified=false;
 rows=read(selected,scenes[532]);assert.equal(rows[0][1],'1F suihku 1');
});
