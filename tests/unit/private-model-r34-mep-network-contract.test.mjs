import test from 'node:test';
import assert from 'node:assert/strict';
import {R34_MEP_CHAINS,R34_MEP_SOURCE,R34_NIBE_OPEN_INTERFACES,inspectR34MepNetwork} from '../../src/scripts/privateModelR34MepNetworkContract.mjs';

// Synthetic source fixture; the private original R34 GLB is not committed.
function fixture(sceneIndex=822) {
  const nodes=Array.from({length:13854},(_,id)=>({name:'N'+id,mesh:0,extras:{}}));
  const scenes=Array.from({length:826},()=>({nodes:[]}));
  const role=R34_MEP_SOURCE.scenes[sceneIndex];
  for(const c of R34_MEP_CHAINS.filter(c=>c.views.includes(role)))for(const n of c.nodes){
    if(n.role==='WORK_SHELL') nodes[n.id].name='C80_D1F_WORK_SHELL';
    else if(n.role==='DEVICE') nodes[n.id].name='R300_CASING';
    else if(n.role==='VISUAL_ONLY') nodes[n.id].name='D2F_NIBE_COPPER_VISIBLE_ONLY';
    else if(n.role==='ROOFWATER') nodes[n.id].name='T12_GUTTER_OR_COLLAR';
    else if(n.role==='PARENT_VESI') nodes[n.id].name='PA2_BOTH_PIPING';
    else nodes[n.id].extras.m5System=n.role;
    if(!scenes[sceneIndex].nodes.includes(n.id))scenes[sceneIndex].nodes.push(n.id);
  }
  for(const c of R34_MEP_CHAINS.filter(c=>c.views.includes(role)))for(const n of c.nodes){
    if(n.role==='PARENT_VESI') {
      const parentId=n.id===12148?12514:12513;
      nodes[parentId]={mesh:0,name:'P02_KV_LV_PARENT',extras:{m5System:'VESI'},children:[n.id]};
      scenes[sceneIndex].nodes=scenes[sceneIndex].nodes.filter(i=>i!==n.id);
      scenes[sceneIndex].nodes.push(parentId);
    }
  }
  return {scenes,nodes};
}
for(const s of [822,823,824,825]) test('scene '+s+' source presence is never physical acceptance',()=>{
  const result=inspectR34MepNetwork(fixture(s),R34_MEP_SOURCE.sha256,s);
  assert.equal(result.sourceValid,true);
  assert.equal(result.ok,true);
  assert.equal(result.physicalVerified,false);
  assert.ok(result.chains.length>=3);
  assert.ok(result.chains.every(c=>c.modelPresent&&c.status==='MODEL_PRESENT_PHYSICAL_HOLD'&&!c.physicalVerified));
});
test('wrong SHA and glTF scene index fail closed',()=>{
  assert.equal(inspectR34MepNetwork(fixture(),'bad',822).sourceValid,false);
  assert.equal(inspectR34MepNetwork(fixture(),R34_MEP_SOURCE.sha256,292).sourceValid,false);
});
test('no geometry promotion when source physical flags are forced true',()=>{
  const json=fixture();for(const n of json.nodes){n.extras.physicalConnectionsVerified=true;n.extras.current=true;n.extras.asBuilt=true;}
  const result=inspectR34MepNetwork(json,R34_MEP_SOURCE.sha256,822);
  assert.ok(result.chains.every(c=>!c.physicalVerified));
});
test('missing part identifies the exact node, not guessed replacement',()=>{
  const j=fixture();j.scenes[822].nodes=j.scenes[822].nodes.filter(n=>n!==13545);
  const c=inspectR34MepNetwork(j,R34_MEP_SOURCE.sha256,822).chains.find(c=>c.id==='D_IV_1F_TO_2F');
  assert.deepEqual(c.missing,[13545]);assert.equal(c.status,'SOURCE_MODEL_INCOMPLETE');
});
test('T110 wastewater vent cannot silently become room ventilation',()=>{
  const j=fixture();j.nodes[12239].extras.m5System='IV';
  const c=inspectR34MepNetwork(j,R34_MEP_SOURCE.sha256,822).chains.find(c=>c.id==='D_WASTE_AND_T110');
  assert.deepEqual(c.badType,[12239]);
});
test('unmounted PA2 parent never supplies a hidden water classification',()=>{
  const j=fixture();j.scenes[822].nodes=j.scenes[822].nodes.filter(n=>n!==12514);j.scenes[822].nodes.push(12148);
  const c=inspectR34MepNetwork(j,R34_MEP_SOURCE.sha256,822).chains.find(c=>c.id==='D_PA2_UNDERFLOOR');
  assert.deepEqual(c.badType,[12148]);
});
test('cyclic source scene is rejected without partial contract',()=>{
  const j=fixture();j.nodes[13543].children=[13543];
  assert.equal(inspectR34MepNetwork(j,R34_MEP_SOURCE.sha256,822).sourceValid,false);
});
test('2F excludes 1F/roofwater and includes 2F T110 and IV fan',()=>{
  const c=inspectR34MepNetwork(fixture(824),R34_MEP_SOURCE.sha256,824).chains;
  assert.equal(c.some(x=>x.id==='D_IV_1F_TO_2F'),false);
  assert.equal(c.some(x=>x.id==='ROOF_GUTTER_FIVE_OUTLETS'),false);
  assert.equal(c.some(x=>x.id==='D_WASTE_T110_2F'),true);
});

test('NIBE open interface retains prior QA gaps without claiming a fitted port',()=>{
  const j=fixture(822);
  j.scenes[822].nodes.push(11703,11704);
  const r=inspectR34MepNetwork(j,R34_MEP_SOURCE.sha256,822);
  assert.equal(r.ok,true);
  assert.equal(R34_NIBE_OPEN_INTERFACES.length,4);
  assert.equal(r.openInterfaces.length,4);
  assert.deepEqual(r.openInterfaces.slice(0,2).map(x=>x.priorQaGapMm),[2,2]);
  assert.deepEqual(r.openInterfaces.slice(2).map(x=>x.priorQaNearestWaterMeshMm),[424,305]);
  assert.ok(r.openInterfaces.every(x=>x.modelNodesPresent&&!x.physicalVerified&&!x.installedPortRoleVerified&&!x.geometryConnectedVerified&&!x.technicalFunctionVerified&&!x.gapRecheckedInThisRun));
  assert.deepEqual(r.openInterfaces.map(x=>x.status),[
    'OPEN_INTERFACE_NOT_CONNECTED_VERIFIED','OPEN_INTERFACE_NOT_CONNECTED_VERIFIED',
    'DEVICE_PROXY_CONNECTION_UNKNOWN','DEVICE_PROXY_CONNECTION_UNKNOWN']);
});
test('NIBE missing source endpoint is not silently bridged by nearby visual',()=>{
  const j=fixture(822);
  j.scenes[822].nodes=j.scenes[822].nodes.filter(id=>id!==13492);
  const r=inspectR34MepNetwork(j,R34_MEP_SOURCE.sha256,822);
  const a=r.openInterfaces.find(x=>x.id==='NIBE_A_VISUAL_MARKER');
  assert.equal(a.modelNodesPresent,false);
  assert.equal(a.status,'SOURCE_NODE_NOT_MOUNTED');
  assert.equal(a.geometryConnectedVerified,false);
});
test('NIBE cannot promote forced source metadata into physical or CURRENT approval',()=>{
  const j=fixture(824);
  for(const id of [11681,11682,13492,13493,11703,11704]){
    j.scenes[824].nodes.push(id);
    Object.assign(j.nodes[id].extras,{physicalConnectionsVerified:true,current:true,asBuilt:true,installedPortVerified:true});
  }
  const r=inspectR34MepNetwork(j,R34_MEP_SOURCE.sha256,824);
  assert.equal(r.openInterfaces.length,4);
  assert.ok(r.openInterfaces.every(x=>!x.physicalVerified&&!x.technicalFunctionVerified&&!x.current&&!x.asBuilt));
  assert.deepEqual(inspectR34MepNetwork(j,'wrong-sha',824).openInterfaces,[]);
});
