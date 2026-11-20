import test from 'node:test';
import assert from 'node:assert/strict';
import {inflateSync} from 'node:zlib';
import {
  TATE4_MJ6263_SOURCE_SHA256,TATE4_MJ6263_PARENT_SHA256,
  TATE4_MJ6263_MJ62_SHA256,TATE4_MJ6263_MJ63_SHA256,
  TATE4_MJ6263_PARENT_FLOORS,TATE4_MJ6263_SCENES,
  TATE4_MJ6263_MJ62_NEW,TATE4_MJ6263_MJ63_NEW,
  TATE4_MJ6263_OWNER_MJ62_DOC,TATE4_MJ6263_OWNER_MJ63_DOC,
  tate4Mj6263RootsFnv32,isTate4Mj6263CombinedSourceScene
} from '../../src/scripts/privateModelTate4Mj6263CombinedSourceProfile.mjs';

// Ordered 2F closed root snapshot from the independently SHA256-verified
// 53,943,060-byte inner GLB. The ZIP itself is never used as a source SHA.
const SCENE354_ROOTS='eJwtkssVXSEMAxu6Cwz4Qy056b+NSPOymQPGko3hT5+sb1eOUPHVPWAb54uVeb4+OhHK6C/PJjZeaVv7fTmzHPPqpFHf2+W8XvZKr+KbtY62bf9mdY006quMNsZ4X42bGTeTdQ3lvXdtpViptWoVrz5LrbZOzPxeylu4Blu1/tY10mDbxhhPUJVYozv366c+9zXS4CraxtPByH9eyD9cKV4ZbYzxlLyWkM341MOR93sRhlataSo2Xh3jGr/y1rwMUz1L/3sEJUf4qnZMyOn/GgM5rQUD2rPILDKLHFcVm5l1wA1/cabYCQs2HIjDoB20g3bQDtpBO2gH7aAdtO/3Vmgf2idt7Oc7Hj2SqMcXD7wLBtzwQDJvwoIN8bloE22iTbSJNtEm2kSbaBNtoi20nmTkSejM2hc6UvRT97e2tvCsIu65ia7YAXfDgBs6Pv6/4c9nFnQPg//gP/Q2nluMf0L4B5uK78U0/L3Up19QEeK+u7jhgZy6T7Fg//0HkO7MMw==';
const roots=JSON.parse(inflateSync(Buffer.from(SCENE354_ROOTS,'base64')).toString('utf8'));
const mj62Link=[{role:'ownerCurrentMovement',doc:TATE4_MJ6263_OWNER_MJ62_DOC}];
const mj63Links=[{role:'ownerCorrection',link:TATE4_MJ6263_OWNER_MJ63_DOC},
 {role:'owner2026Correction',link:TATE4_MJ6263_OWNER_MJ63_DOC}];
function fixture(){
  const nodes=Array.from({length:12097},()=>({}));
  const meshes=Array.from({length:4549},()=>({}));
  const scenes=Array.from({length:360},()=>({name:'historical',nodes:[]}));
  for(const id of TATE4_MJ6263_MJ62_NEW){
    nodes[id]={
      name:id===12077?'MJ62_C80_D2F_LEFT_END_OPEN_SOURCE_OWNER_20261111_WORK_TEST_HOST_HOLD':
        `MJ62_C80_D2F_STACK_PANEL_${String(id-12077).padStart(2,'0')}_SOURCE_OWNER_20261111_WORK_TEST_HOST_HOLD`,
      mesh:1859,extras:{measuredKinematics:false,safeCleaningApproved:false,sourceLinks:mj62Link}
    };
  }
  for(let id=12086;id<=12091;id++)nodes[id]={mesh:4542+id-12086,extras:{physicalAirflowMeasured:false}};
  nodes[12092]={name:'MJ63R2_WARDROBE_EXHAUST_VALVE_IN_ROOM_ADJACENT_TO_OUTDOOR_STORAGE',
    children:[12093,12094,12095],extras:{wallHostNode:7999,sourceLinks:mj63Links}};
  for(let id=12093;id<=12095;id++)nodes[id]={mesh:460+id-12093,extras:{physicalXYZ:'WORK_ASSUMPTION'}};
  nodes[12096]={name:'MJ63R2_INNER_ROOM_THROUGH_STORAGE_TO_OUTSIDE_SINGLE_SEALED_DUCT_WORK_TEST',
    mesh:4548,extras:{geomAssumed:true,sealed:true,storageAirConnection:false,E220SConnection:false,sourceLinks:mj63Links}};
  const p=TATE4_MJ6263_SCENES[354];
  scenes[354]={name:p.name,nodes:[...roots],extras:{
    stage:'WORK_TEST_HOST_HOLD',current:false,asBuilt:false,
    productionWebGL:'NOT_RUN',humanReview:'NOT_RUN',physicalConnectionsVerified:0,
    sourceParentGLBSHA256:TATE4_MJ6263_PARENT_SHA256,
    integration:{task:'GPT6-TATE4-MJ62-MJ63-INTEGRAATIO-20261113',
      floor:'2F',parentScene:351,glazingState:'CLOSED',
      sourceGLBSHA256:{tate4:TATE4_MJ6263_PARENT_SHA256,
        mj62:TATE4_MJ6263_MJ62_SHA256,mj63:TATE4_MJ6263_MJ63_SHA256}}
  }};
  return {scene:292,scenes,nodes,meshes,asset:{extras:{
    Canonical:false,canonical:false,current:false,asBuilt:false,ModelStage:'WORK_TEST',
    viewerFloorScenes:{...TATE4_MJ6263_PARENT_FLOORS}
  }}};
}
test('source exact scene inventory and true root fingerprint',()=>{
  assert.deepEqual(Object.keys(TATE4_MJ6263_SCENES),['353','354','355','356','357','358','359']);
  assert.equal(roots.length,184);
  assert.equal(tate4Mj6263RootsFnv32(roots),'4e28cbb7');
  assert.equal(isTate4Mj6263CombinedSourceScene(fixture(),TATE4_MJ6263_SOURCE_SHA256,354,'2F'),true);
});
test('a wrong SHA, floor, parent, scene, source or binding must fail closed',()=>{
  const check=(mutate)=>{const j=fixture();mutate(j);
    assert.equal(isTate4Mj6263CombinedSourceScene(j,TATE4_MJ6263_SOURCE_SHA256,354,'2F'),false);};
  assert.equal(isTate4Mj6263CombinedSourceScene(fixture(),'0'.repeat(64),354,'2F'),false);
  assert.equal(isTate4Mj6263CombinedSourceScene(fixture(),TATE4_MJ6263_SOURCE_SHA256,354,'1F'),false);
  assert.equal(isTate4Mj6263CombinedSourceScene(fixture(),TATE4_MJ6263_SOURCE_SHA256,350),false);
  check(j=>j.scenes[354].nodes.reverse());
  check(j=>j.scenes[354].extras.integration.sourceGLBSHA256.mj63='0'.repeat(64));
  check(j=>j.scenes[354].extras.integration.parentScene=352);
  check(j=>j.scenes[354].extras.physicalConnectionsVerified=1);
  check(j=>j.asset.extras.current=true);
  check(j=>j.nodes[12092].extras.wallHostNode=11315);
  check(j=>j.nodes[12096].extras.storageAirConnection=true);
  check(j=>j.nodes[12077].extras.sourceLinks=[]);
});
