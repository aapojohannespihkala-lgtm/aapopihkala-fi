import test from 'node:test';
import assert from 'node:assert/strict';
import {inflateSync} from 'node:zlib';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_419_GLB_SHA256 as SHA,C80_419_GLB_BYTES as BYTES,
 C80_419_ZIP_SHA256,C80_419_ZIP_DRIVE_ID,
 C80_419_PARENT_GLB_SHA256 as BASE,C80_419_V84_DONOR_GLB_SHA256 as DONOR,
 C80_419_SCENES as SCENES,isC80419SourceScene as valid,
 resolveC80419SceneIndex as choose,c80419RootFnv32 as fnv,
} from '../../src/scripts/privateModelC80419V84FloorSourceProfile.mjs';
// Compressed original nine full parent root arrays from authenticated 419 GLB.
// Fixtures deliberately avoid treating zip __scene412 as an internal index.
const parentRoots=JSON.parse(inflateSync(Buffer.from('eNrtm0uSHikMhC9UC8RL4iwO3/8ak/mVF54eL2zPLMbRbDIoIHkIKUG/21++7DnacyLXc3q1p3JuQxrKcATLDSsM3TCe3nt7cqvz6n0+e6589sh0HVBPnnM8aKhLrWefBWxDGspwBLs9e48wdHE1kYDSMMznnBgafmuAGWJMTS4QYx7PppG1Ki18Z39Ena7bBlrLDRpgs2bNFm1pJq1Xi/FMoqVBKyotX1BaeQtDNwzDNNhObRvSQD9vM5rBjDAjzAgzwozQRCUrZu9YUctaZ7pULnmo6rbYMEzDMmhLzRPl8UQ7WPkAJ7jADfrMtDntdRpkky3jC/xZnmPr9MoHvI+XW16kz7YWK1DDUZfTvN/mXTZvMI73Md7JvQ7GSlfK3NFsURVV6RM6w740tB3BNPCZT8goLmqPArccPjXNkn3G1h4jfAiaZ7PJzSY3m9xscif49jnG5DiT1bGclXATbsJNuAk34SbcgltwC27BLbgFt+AW3IJbcA/cA/fAPXAP3AP3wD1wD9xj7m4NDBATtgFOcIEbTLBAuAE34AbcgBtwA27ADbgBN+B2uB1uh9vhdrgdbofb4XIWu8MdcPECh6kRLo64ccSNIyqsQLgD7oQ74U64E+6EO+FOuBPuhDvhLrgL7oK74EoWFE1ph9Z3DFsthtzX5QQLPEZbTRigZgrHRyh03Wd57lgWhsBXgjMOTjc4lcD6gcUDiyvYJ7jAje8G2EGvKm01obm56WOvVSR4zPQahNTbI6MC9HnEsZcIA+zgAN/WBZp72N3xScd5ucx7Bq0T7qS/PVKa1kDW71ORmFFfLyZY4MFK9D/0tK8LN7sO9tK+Pl9ySHC7tbbvbWEeQDcQF9byoRbBNuQjDaauXNKnHU0h1lznknxKYK3d7pfWfNWpFJZFCfq03M+k5EsofUFY1Jd8X1AG3RflxZQXY0nZVpSNzA4PYIeS+Ksfx9WSEE6rk7XkWEqOleTYOdL2T5s/bX1BGnzfyUXyODZkE7foSMtWFiwDW9GnjkFue3Acq2x4qjiU0oDo+lZpVtaFfvgaHBpcd2EYVEqZU3Xl0jBMg2OkiMFD1JxX/b5dG6/GomALjVq0fpsDjVq0vtfke+XsN+6IUHpu+iQqnShwosCJAme+9ZgRBcbHhQkWyAgocKLAiQInCpwocKLAiQInCpwocKLAed7DgosCpxU4+nnjfhLrRD/xNyYaMNEAYmK8yjHpSXwMlGBM9GMyzoS74C64C+6Cu+AuuAvugrvgLrjoil1fWmGdDC7sQHUD1Q1UMVDCQP1iM+ZGz3ZyewaK8qL1+Qd6U8R9jbe8QRSF8Yvxi7XVeXWFWMcC3JgqE/frjWxavVMhrQvVXOjESsX9fT/e9+N9P973430//tv3431B/a9fULp55301/amvpt7+8/zs199aP53Pffcq+5ncjrvq7xner7zi/pERjpsRftKM8KrazQV/MxdEM25GeDPCmxHejPBmhDcj/DwZ4X013Vzw5oIfc8H22twrdF54M8I/MCO8inXzvB/lefRPor+I/iL6i+gvuAW31s0Ib0Z4M8KbEd6M8GaEnyQjvK+mm+d9pjzvF16DHzLC33wZeuq8T8P7NLxPw/s0vE/Dz/rfD+5Fci+Se5Hci+ReJPc3hvt3yPffnu9vEvc3iY9/h/z1L+QA0lo=','base64')).toString());
const entries=Object.entries(SCENES).map(([i,s])=>[Number(i),s]);
function fixture(){
  const scenes=Array.from({length:419},()=>({nodes:[]}));
  for(const [i,s] of entries){
    const parent=parentRoots[i-410];
    scenes[s.parent]={name:s.parentName,nodes:[...parent]};
    scenes[i]={name:s.name,nodes:parent.map(n=>n===10793?12144:n===9913?12145:n),
      extras:{stage:'WORK_TEST_HOST_HOLD',sourceSceneIndex:s.parent,
      sourceGlbSHA256:BASE,donorGlbSHA256:DONOR,sourceLinksBindingVerified:false,
      productionWebGLVerified:false,humanReviewApproved:false,
      nonPhysicalStorageProxyRetained:true,rejectedHigh3Excluded:true}};
  }
  const nodes=Array.from({length:12146},()=>({}));
  nodes[12144]={name:'OM_2F_WALL_V84_RAISED_TOP_TO_Z5_280_5MM_COW_WORK_TEST',mesh:4570,extras:{
    stage:'WORK_TEST_HOST_HOLD',current:false,asBuilt:false,originalGlbNodeId:10793,originalMeshId:4187,
    correctedTopHeightMeters:5.28,originalTopHeightMeters:5.275,correctionDeltaMeters:0.005,
    commonBaseGlbSHA256:BASE,integratedFromDonorGlbSHA256:DONOR,
    humanReviewApproved:false,productionWebGLVerified:false}};
  nodes[12145]={name:'OM_V84_2F_STORAGE_WALL_NO_TOP_CAP_COFIT_FLOOR_ZFIGHT_WORK_TEST',mesh:4571,extras:{
    stage:'WORK_TEST',presentationOnly:true,physicalHost:'HOST_HOLD',current:false,asBuilt:false,
    canPublish:false,canApplyToViewer:false,representationKind:'DISPLAY_VOLUME_NOT_PHYSICAL_STRUCTURE',
    sourceMetadata:{floorHostValidated:false}}};
  const meshes=Array.from({length:4572},()=>({}));
  meshes[4570]={name:'OM_2F_WALL_V84_UPPER_EDGE_Z5280_COW_5MM_WORK_TEST',primitives:[{attributes:{POSITION:10231}}]};
  meshes[4571]={name:'OM_V84_2F_FLOOR_TOP_COW_ZFIGHT_INTEGRATED_WORK_TEST',primitives:[{indices:10232}]};
  return {asset:{extras:{Canonical:false,ModelStage:'WORK_TEST',current:false,asBuilt:false,HUMAN_REVIEW:'NOT_RUN'}},
    scene:292,scenes,nodes,meshes,accessors:Array.from({length:10233},()=>({}))};
}
test('source identity and exact opt-in mapping 410-418',()=>{
  assert.equal(BYTES,54335408);
  assert.match(SHA,/^[0-9a-f]{64}$/);
  assert.match(C80_419_ZIP_SHA256,/^[0-9a-f]{64}$/);
  assert.equal(C80_419_ZIP_DRIVE_ID,'1QxdFsdmMtT7tyX8y4049gXrIezU8OE-K');
  assert.deepEqual(entries.map(([i])=>i),[410,411,412,413,414,415,416,417,418]);
  for(const [i,s] of entries){
    assert.equal(choose(SHA,s.floor,s.glazing,s.cutaway),i);
    assert.equal(fnv(parentRoots[i-410]),s.parentFnv);
    assert.equal(fnv(parentRoots[i-410].map(n=>n===10793?12144:n===9913?12145:n)),s.fnv);
  }
});
test('nine original-root-derived opt-in scenes match source gate',()=>{
  const g=fixture();
  for(const [i,s] of entries)assert.equal(valid(g,SHA,i,s.floor,s.glazing,s.cutaway),true,'scene '+i);
});
test('wrong SHA, scene, floor, glazing, cutaway, and default reject',()=>{
  const g=fixture();
  assert.equal(choose(SHA,'1F','STACKED',false),null);
  assert.equal(choose('0'.repeat(64),'2F','CLOSED',false),null);
  assert.equal(valid(g,'0'.repeat(64),412),false);
  assert.equal(valid(g,SHA,409),false);
  assert.equal(valid(g,SHA,419),false);
  assert.equal(valid(g,SHA,412,'2F'),false);
  assert.equal(valid(g,SHA,412,'BOTH','ONE_OPEN'),false);
  assert.equal(valid(g,SHA,412,'BOTH','CLOSED',true),false);
  assert.equal(valid({...g,scene:412},SHA,412),false);
});
test('mutated scene root, parent, geometry, provenance or approval fails closed',()=>{
 const bad=[
  x=>x.scenes[412].nodes.reverse(),
  x=>x.scenes[412].nodes.push(12144),
  x=>x.scenes[412].nodes[x.scenes[412].nodes.indexOf(12144)]=10793,
  x=>x.scenes[403].nodes[0]=1,
  x=>x.scenes[412].extras.sourceGlbSHA256='0'.repeat(64),
  x=>x.scenes[412].extras.sourceLinksBindingVerified=true,
  x=>x.scenes[412].extras.rejectedHigh3Excluded=false,
  x=>x.nodes[12144].extras.commonBaseGlbSHA256='0'.repeat(64),
  x=>x.nodes[12144].extras.correctedTopHeightMeters=5.275,
  x=>x.nodes[12145].extras.physicalHost='VALIDATED',
  x=>x.nodes[12145].extras.sourceMetadata.floorHostValidated=true,
  x=>x.meshes[4571].primitives[0].indices=10231,
  x=>x.asset.extras.current=true,
 ];
 for(const mutate of bad){const x=fixture();mutate(x);assert.equal(valid(x,SHA,412,'BOTH','CLOSED',false),false,mutate.toString());}
});
test('raw original GLB from Drive validates all nine scenes and full-file SHA',
 {skip:!process.env.YLIS_C80419_GLB},()=>{
  const bytes=readFileSync(process.env.YLIS_C80419_GLB);
  assert.equal(bytes.length,BYTES);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),SHA);
  assert.equal(bytes.toString('utf8',0,4),'glTF');
  const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
  for(const [i,s] of entries)assert.equal(valid(json,SHA,i,s.floor,s.glazing,s.cutaway),true,'scene '+i);
  assert.equal(valid(json,SHA,401),false);
  assert.equal(valid(json,'0'.repeat(64),412),false);
 });
