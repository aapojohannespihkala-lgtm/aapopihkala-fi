import test from 'node:test';
import assert from 'node:assert/strict';
import {inflateSync} from 'node:zlib';
import {
  TATE4_MJ72_SOURCE_SHA256, TATE4_MJ72_PARENT_SHA256,
  TATE4_MJ72_DONOR_SHA256, TATE4_MJ72_SCENES,
  TATE4_MJ72_SCENE_COUNT,TATE4_MJ72_NODE_COUNT,TATE4_MJ72_MESH_COUNT,
  TATE4_MJ72_DEFAULT_SCENE,TATE4_MJ72_PARENT_FLOORS,
  TATE4_MJ72_FLOORS,TATE4_MJ72_ROOT,TATE4_MJ72_CHILDREN,
  TATE4_MJ72_PHOTO_URL,TATE4_MJ72_OWNER_DOC,TATE4_MJ72_PART_NAMES,
  tate4Mj72RootsFnv32,isTate4Mj72SocketSourceScene,
} from '../../src/scripts/privateModelTate4Mj72SocketSourceProfile.mjs';

// Ordered root snapshots read from the verified inner GLB SHA 75c56ed3,
// compressed as zlib/base64. Not inherited from old TATE4 scene350-352.
const ROOTS=Object.freeze({
  353:'eNollMtxwCAMBRvyAYGQUC2Z9N9G3ttcdrBh0Qfsn8qzvom+3+y3vtdZRhvPGOF64oaxjfPtvdfXpcV37/wqb391uv0OvK9nxpuGlrz71VxQRhvPGKHWV3XC2HIVSGB0jPxm4mj70gYZMlLBBRk5jqadlZUSr96f1PS7Mph9ntAGRc6KFusqkvJVMo4krQ1l9JS+8JT5CmMbx0jDfVpltME6lxnLsBE2wkbYCBuhQE9d7L3potK6kx49j7zV2+7YMdK4hkpaDtTjQBVkfmDCCwv6zFScak1DPSk1X/Djc4zS6T0fcI3TfU7SZ/suGWhitGSW612ucrnAGNdx/oM7D/Zqv1S7Y7mjGuqlT2iO79JROUIaPHp2wjiGJ8YTKnGu2nNKJUb4DBSmqLGosaixqLEa/q8ZsznNJjmyuY3buI3buI3buI37cB/uw324D/fhPtyH+3Af7uAO7uAO7uAO7uAO7uCO3VoLBqSD68CEFxZs+CBu4AZu4AZu4AZu4AZu4Abuxt24G3fjbtyNu3E3LmdRG/fgcgn8lZq43MPiHhb3UF8VxD24iZu4iZu4iZu4iZu4iZu4F/fiXtyLq7+CPqb2fdZzHHctjm6vxw0fHNNdEwOy0j0KfyQR17Hj+r8Q3JXgjIPTDU4l6H7Q8aDjQceDjgcd190NuKHXtLsm2u1iTTFu1hC9idi+kfEC+jxEj8d3RQy44YEJLyzoeodKhzwneMNuQyZzWJnMJq7vqH5yC6bpWf3deP/y9w8LkDZX',
  354:'eNotkssVXSEMAxu6Cwz4Qy056b+NSPOymQPGko3hT5+sb1eOUPHVPWAb54uVeb4+OhHK6C/PJjZeaVv7fTmzHPPqpFHf2+W8XvZKr+KbtY62bf9mdY006quMNsZ4X42bGTeTdQ3lvXdtpViptWoVrz5LrbZOzPxeylu4Blu1/tY10mDbxhhPUJVYozv366c+9zXS4CraxtPByH9eyD9cKV4ZbYzxlLyWkM341MOR93sRhlataSo2Xh3jGr/y1rwMUz1L/3sEJUf4qnZMyOn/GgM5rQUD2rPILDKLHFcVm5l1wA1/cabYCQs2HIjDoB20g3bQDtpBO2gH7aAdtO/3Vmgf2idt7Oc7Hj2SqMcXD7wLBtzwQDJvwoIN8bloE22iTbSJNtEm2kSbaBNtoi20nmTkSejM2hc6UvRT97e2tvCsIu65ia7YAXfDgBs6Pv6/4c9nFnQPg//gP/Q2nluMf0L4B5uK78U0/L3Up19QEeK+u7jhgZy6T7Fg//0HkO7MMw==',
  355:'eNotlskR3DAMBBPaB8EDRywu55+GZ1r+dHElDgmCwGj/5D3rN1HvN7vXr+umUUYbIzy/eGFs4/z23utXqclv7/vL++qXp8rPQP9qZrxoaEq/X84DaZTRxgi5fpknjC2tNhIYHeP+ZuJo+dQCN6S42lyQ4o5308qKSoFn7Z+k18/S4G37hRZIYtZusZ52UrwKxjtJVoYiaoUvtCJfYWzjGNdwnlYaZTDPx4xlWBFWhBVhRVgR2qiVxdqbLCqsN9ej9shL9XbGjnGNZ+hIyxvVeKMMIj/wwgcT+s50OJ31GspJKvmCf7b3SN1e+4JzHG47SN9tPyLQi9GUWT7v8imXDxjjc5xvc8fBWuWHSncsZ1RDPfQNzXEtHR1HuAY//XbCOIZfjF/oiPOUnpM6YoTvQNskZ0zOmJwxOWMW/OaMWdxmERzRvEJbaAttoS20hbbQNtpG22gbbaNttI220TbaRjtoB+2gHbSDdtAO2kE7aMfaXAsGJIPrwAsfTFiwIdpAG2gDbaANtIE20AbaQBtoN9qNdqPdaDfajXaj3Wi5i9xoD1qKwF1qoqUOkzpM6lBdBdEetBftRXvRXrQX7UV70V60F+1F+9A+tA/tQytXUDOV61m/4zhrcVS9HhdsOKazJgZkpnMUbpKI573j2ReCWgnuOLjd4FaC7AcZDzIeZDzIeDjjdeQ422azM+1MB2yDyrCZHb0RPFulLBPiWXukn061imz5mUfKqmCzSc8rm56eaRT2BTnatd/dYmQXLjukXe3p9oU2ZJjtYNrBuKnSPZX4zPECTqncT/OKay6KuNyf7qZxM417aZyemmWDWjaoxc8ybPhKUg3V0cdOpjbrpeoSnsFR9DPUB91av23sMphnpFEGpmNXXXaWRwP5M3C0tr4FYWhUaUOxJZUSJFzj296aoWyGKy0a5D0a89GY/9elMR9N/X0aPpvNr9goS2YmcwprKmynsJ3Cdqq+52QO2ylsp7CdwnYK2ylsp7CdwnYK2ylsp7CdwnYK2ylsp7Cdmu9+0GI7ZduJPV+xX0qbkj/wUviXwr80x9cul5mXVqD8z6VpLutctA/tQ/vQPrQP7UP70D+1DSzO52tVGhyY7NNymaTZNQzy0f9DykayZNHE6b+HPtj8KCwbckOeH55y0kltOxsUcmru+23fmo8lME0NvxqzgYjUT8pzYmtiaczVmMLZu8RtveOCFDyYsKK3+OfAWExosZGzLMUQyxDDsPuzLx0tjVvNHRCuwju9C3PDACx9kpu9C/1oW5G3xtnjb9+8/xUD3cw==',
});
const roots=(id)=>JSON.parse(inflateSync(Buffer.from(ROOTS[id],'base64')).toString('utf8'));
const sourceLinks=[
  {role:'OWNER_PHOTO_VISIBLE_2026',url:TATE4_MJ72_PHOTO_URL},
  {role:'MJ72_DOC_CURRENT_PHOTO',url:TATE4_MJ72_OWNER_DOC},
];
function fixture() {
  const nodes=Array.from({length:TATE4_MJ72_NODE_COUNT},()=>({}));
  nodes[TATE4_MJ72_ROOT]={
    name:'MJ72_OWNER2026_STORAGE_SOCKET_TWO_CLOSED_COVERS_UPPER_DOOR_WALL_COW_ROOT_WORK_TEST_HOST_HOLD',
    children:[...TATE4_MJ72_CHILDREN],
    extras:{
      supersedesRootInOptInScenesOnly:11542,
      TATE4ParentExactGLBSHA256:TATE4_MJ72_PARENT_SHA256,
      MJ72donorExactGLBSHA256:TATE4_MJ72_DONOR_SHA256,
      modelStage:'WORK_TEST_HOST_HOLD',exact2026XYZMeasured:false,
      physicalElectricalConnectionVerified:false,electricalOutletCountVerified:false,
      closedCoverCountVisible:2,sourceLinksBindingNewSHA:'NOT_VERIFIED; source URL provenance only',
      sourceLinks,
    },
  };
  for(let i=0;i<TATE4_MJ72_CHILDREN.length;i++){
    nodes[TATE4_MJ72_CHILDREN[i]]={
      name:TATE4_MJ72_PART_NAMES[i],
      mesh:4542+i,
      extras:{provenanceDonorNodeIndex:12057+i,
        sourceMJ72GLBSHA256:TATE4_MJ72_DONOR_SHA256,
        physicalMountingHeightVerified:false,electricalCircuitVerified:false,
        photoApproximation:true,currentGLBSourceLinksBindingVerified:false,sourceLinks},
    };
  }
  const scenes=Array.from({length:TATE4_MJ72_SCENE_COUNT},()=>({name:'historical',nodes:[]}));
  for(const [key,p] of Object.entries(TATE4_MJ72_SCENES)) scenes[key]={
    name:p.name,nodes:roots(key),
    extras:{
      TATE4ParentExactGLBSHA256:TATE4_MJ72_PARENT_SHA256,
      sourceScene:p.parentScene,
      MJ72DonorExactGLBSHA256:TATE4_MJ72_DONOR_SHA256,
      MJ72SourceScene:p.donorScene,newRoot:p.socket?TATE4_MJ72_ROOT:null,
      legacySocketInactiveNewOptIn:p.socket,
      newSocketPhotoRelativeNotMeasured:true,C70AndDefaultUnchanged:true,
      modelStage:'WORK_TEST_HOST_HOLD',current:false,asBuilt:false,
      productionWebGLVerified:false,humanReviewVerified:false,
    },
  };
  return {scene:TATE4_MJ72_DEFAULT_SCENE,scenes,nodes,
    meshes:Array.from({length:TATE4_MJ72_MESH_COUNT},()=>({})),
    asset:{extras:{current:false,asBuilt:false,canonical:false,ModelStage:'WORK_TEST',
      viewerFloorScenes:{...TATE4_MJ72_PARENT_FLOORS}}}};
}
test('three true ordered GLB root snapshots are SHA and scene locked',()=>{
  const json=fixture();
  for(const [floor,scene] of Object.entries(TATE4_MJ72_FLOORS)){
    assert.equal(json.scenes[scene].nodes.length,TATE4_MJ72_SCENES[scene].count);
    assert.equal(tate4Mj72RootsFnv32(json.scenes[scene].nodes),TATE4_MJ72_SCENES[scene].fnv);
    assert.equal(isTate4Mj72SocketSourceScene(json,TATE4_MJ72_SOURCE_SHA256,scene,floor),true);
  }
  assert.equal(isTate4Mj72SocketSourceScene(json,TATE4_MJ72_SOURCE_SHA256,350),false);
  assert.equal(isTate4Mj72SocketSourceScene(json,TATE4_MJ72_PARENT_SHA256,353),false);
});
test('rejects a wrong SHA, floor, root order, parent, links or source-bound state',()=>{
  const base=fixture();
  const cases=[
    [353,x=>{x.scenes[353].nodes.reverse()}],
    [355,x=>{x.scenes[355].extras.TATE4ParentExactGLBSHA256='0'.repeat(64)}],
    [354,x=>{x.scenes[354].extras.newRoot=TATE4_MJ72_ROOT}],
    [353,x=>{x.nodes[TATE4_MJ72_ROOT].children.pop()}],
    [353,x=>{x.nodes[TATE4_MJ72_ROOT].extras.sourceLinks=[]}],
    [355,x=>{x.nodes[12077].extras.currentGLBSourceLinksBindingVerified=true}],
    [353,x=>{x.nodes[12078].extras.electricalCircuitVerified=true}],
    [353,x=>{x.nodes[TATE4_MJ72_ROOT].extras.physicalElectricalConnectionVerified=true}],
    [354,x=>{x.asset.extras.current=true}],
    [353,x=>{x.nodes[TATE4_MJ72_ROOT].children.push(11542)}],
    [355,x=>{x.nodes[12077].name='mismatched'}],
  ];
  for(const [scene,mutate] of cases) {
    const x=structuredClone(base);mutate(x);
    assert.equal(isTate4Mj72SocketSourceScene(x,TATE4_MJ72_SOURCE_SHA256,scene),false);
  }
  assert.equal(isTate4Mj72SocketSourceScene(base,TATE4_MJ72_SOURCE_SHA256,353,'2F'),false);
  assert.equal(isTate4Mj72SocketSourceScene(base,'0'.repeat(64),355),false);
});
