import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createM5AR1125Scene64PixelIsolation,
  M5A_R1125_SCENE64_SOURCE_PIXEL_TARGET_COUNT,
} from '../src/scripts/privateModelM5AR1125Scene64PixelIsolation.mjs';
import { M5A_R1125_NUMBERED_SOURCE_IDS as ids } from
  '../src/scripts/privateModelM5AR1125NumberedScene64Review.mjs';

const makeSource = () => {
  const originalIds = [1104,1105,1106,1107,1118,1119,1120,1121,1122,1123,1124,1115,1116];
  const originalNames = [
    'M5A_Z2D_SOK1_WELL_D300_HISTORICAL_CLASS_PRESENTATION_WORK_TEST',
    'M5A_Z2D_SOK2_WELL_D300_HISTORICAL_CLASS_PRESENTATION_WORK_TEST',
    'M5A_Z2D_SOK3_WELL_D300_HISTORICAL_CLASS_PRESENTATION_WORK_TEST',
    'M5A_Z2D_PVK_WELL_D300_HISTORICAL_CLASS_PRESENTATION_WORK_TEST',
    ...['PVK_SOK1','PVK_SOK3','SOK1_SOK2','SOK3_BUILDING_END','SOK2_BUILDING_END','PVK_DISCHARGE','PVK_PARKING']
      .map(id => 'M5A_Z2D_' + id + '_R1125_SOURCE_CLASS_PIPE_PRESENTATION_WORK_TEST'),
    'M5A_Z2D_M5A_Z2_PVK_DISCHARGE_UNRESOLVED_BOUNDARY_MARKER',
    'M5A_Z2D_M5A_Z2_PVK_PARKING_UNRESOLVED_BOUNDARY_MARKER',
  ];
  const numberedIds = [];
  const nodes = Array.from({ length: 1222 }, () => ({}));
  for (let i=0;i<originalIds.length;i++) nodes[originalIds[i]]={name:originalNames[i]};
  let idx=1127;
  for (let i=0;i<7;i++) {
    const count=[9,15,15,13,15,17,11][i];
    const prefix='R1125_INDEX_0'+(i+1)+'_'+ids[i]+'_';
    for(let k=0;k<count;k++) {
      const id=idx++;
      numberedIds.push(id);
      nodes[id]={name:prefix+(k===0?'PLATE':k===count-1?'ROD':'DIGIT_'+k)};
    }
  }
  assert.equal(idx,1222);
  nodes[1125]={name:'M5A_R1125_DIAMETER_SOURCE_SPLIT_WORK_TEST_ROOT_BABYLON_Y_UP',
    children:originalIds};
  nodes[1126]={name:'M5A_R1125_SOURCE_INDEX_NUMBERS_1_7_PRESENTATION_ONLY_Y_UP',
    children:numberedIds};
  const association=new Map();
  const objects=[...originalIds,...numberedIds].map(nodeId=>{
    const object={name:nodes[nodeId].name,visible:true};
    association.set(object,{nodes:nodeId});
    return object;
  });
  const roots=Array.from({length:20},()=>({}));
  const scene={children:roots,traverse:cb=>objects.forEach(cb),updateMatrixWorld:()=>{}};
  const gltf={scene,parser:{json:{scene:64,
    scenes:Array.from({length:65},()=>({nodes:[]})),
    nodes},associations:association}};
  gltf.parser.json.scenes[64]={nodes:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,1125,18,1126]};
  return {gltf,nodes,originalIds,numberedIds,objects,association};
};
const fakeThree = {
  Vector3: class {
    x=0;y=0;z=0;
    clone() {return this;}
    project() {return this;}
  },
  Box3: class {
    used=false;
    makeEmpty(){return this;}
    expandByObject(){this.used=true;return this;}
    isEmpty(){return !this.used;}
    getCenter(v){return v;}
  },
};
const fakeCamera={updateMatrixWorld(){},updateProjectionMatrix(){}};

test('13 genuine originals plus seven numbered groups only; source names remain keys',()=>{
  const source=makeSource();
  const pixel=createM5AR1125Scene64PixelIsolation(source.gltf);
  assert.equal(pixel.targets.length, M5A_R1125_SCENE64_SOURCE_PIXEL_TARGET_COUNT);
  assert.equal(pixel.originalCount,13);
  assert.equal(pixel.numberCount,7);
  const labels=pixel.targets.filter(t=>t.kind==='number');
  assert.deepEqual(labels.map(t=>t.sourceId),ids);
  assert.deepEqual(labels.map(t=>t.meshCount),[9,15,15,13,15,17,11]);
  assert.equal(pixel.targets.filter(t=>t.kind==='original').length,13);
  assert.equal(source.objects.every(x=>x.visible),true);
});

test('hide one genuine original and restore it without side effects',()=>{
  const source=makeSource();
  const p=createM5AR1125Scene64PixelIsolation(source.gltf);
  const key=p.targets[0].key;
  const h=p.setSourceVisibility(key,'HIDE');
  assert.equal(h.activeHiddenCount,1);
  assert.equal(source.objects.filter(x=>!x.visible).length,1);
  assert.throws(()=>p.setSourceVisibility(p.targets[1].key,'HIDE'),/isolation-requires-pristine-source/);
  assert.throws(()=>p.setSourceVisibility(p.targets[1].key,'RESTORE'),/restore-wrong-target/);
  assert.equal(p.setSourceVisibility(key,'RESTORE').activeHiddenCount,0);
  assert.equal(source.objects.every(x=>x.visible),true);
});

test('seven linked visual number groups change exactly their original mesh group only',()=>{
  const source=makeSource();
  const p=createM5AR1125Scene64PixelIsolation(source.gltf);
  for(const target of p.targets.filter(t=>t.kind==='number')) {
    assert.equal(p.setSourceVisibility(target.key,'HIDE').productionPixelsVerified,false);
    assert.equal(source.objects.filter(x=>!x.visible).length,target.meshCount);
    assert.equal(p.setSourceVisibility(target.key,'RESTORE').activeHiddenCount,0);
    assert.equal(source.objects.every(x=>x.visible),true);
  }
});

test('teardown restores a canceled isolation; invalid status cannot be asserted',()=>{
  const source=makeSource();
  const p=createM5AR1125Scene64PixelIsolation(source.gltf);
  const key=p.targets[13].key;
  p.setSourceVisibility(key,'HIDE');
  assert.equal(p.restore().productionPixelsVerified,false);
  assert.equal(source.objects.every(x=>x.visible),true);
  assert.throws(()=>p.setSourceVisibility('number:FAKE','HIDE'),/unknown-source-operation/);
  assert.throws(()=>p.setSourceVisibility(key,'RESTORE'),/restore-wrong-target/);
});

test('genuine live camera projection offers 20 ROI centers but never claims screenshots',()=>{
  const source=makeSource();
  const p=createM5AR1125Scene64PixelIsolation(source.gltf);
  const data=p.projectSourceTargets({THREE:fakeThree,camera:fakeCamera,
    imageWidth:900,imageHeight:600});
  assert.equal(data.sourceSceneIndex,64);
  assert.equal(data.centers.length,20);
  assert.equal(data.centers.filter(x=>x.kind==='number').length,7);
  assert.equal(data.centers.every(x=>x.onScreen&&x.imageX===450&&x.imageY===300),true);
  assert.equal(data.centers.every(x=>x.onScreen),true);
  assert.equal(data.productionPixelsVerified,false);
  assert.equal(data.humanReview,'NOT_RUN');
  p.setSourceVisibility(p.targets[0].key,'HIDE');
  assert.throws(()=>p.projectSourceTargets({THREE:fakeThree,camera:fakeCamera,
    imageWidth:900,imageHeight:600}),/camera-or-source-not-ready/);
});

test('wrong source identity, duplicate GLTF association and missing donor geometry fail closed',()=>{
  for(const defect of [
    source=>{source.gltf.parser.json.scenes[64].nodes[17]=0;},
    source=>{source.gltf.parser.json.nodes[1125].children.pop();},
    source=>{source.gltf.parser.json.nodes[1126].children.pop();},
    source=>{source.gltf.parser.associations.delete(source.objects[0]);},
    source=>{source.gltf.parser.json.nodes[1127].name='FAKE_PLATE';},
    source=>{source.objects[107].visible=false;},
  ]) {
    const src=makeSource();
    defect(src);
    assert.throws(()=>createM5AR1125Scene64PixelIsolation(src.gltf),
      /M5A_R1125_SCENE64_PIXEL_SOURCE_INVALID/);
  }
});
