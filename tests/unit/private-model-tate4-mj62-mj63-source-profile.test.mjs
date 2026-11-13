import test from 'node:test';
import assert from 'node:assert/strict';
import {inflateSync} from 'node:zlib';
import {
 TATE4_MJ6263_SOURCE_SHA256,TATE4_MJ6263_PARENT_SHA256,TATE4_MJ6263_MJ62_SHA256,
 TATE4_MJ6263_MJ63_SHA256,TATE4_MJ6263_DONOR_IDS,TATE4_MJ6263_SCENES,
 TATE4_MJ6263_NODE_COUNT,TATE4_MJ6263_SCENE_COUNT,TATE4_MJ6263_MESH_COUNT,
 tate4Mj6263RootsFnv32,isTate4Mj62Mj63SourceScene,
} from '../../src/scripts/privateModelTate4Mj62Mj63SourceProfile.mjs';
// Ordered root snapshots from the SHA-verified original GLB; not inferred
// from a source floor count or inherited TATE4 geometry.
const ROOTS=Object.freeze({
 354:'eNotkssVXSEMAxu6Cwz4Qy056b+NSPOymQPGko3hT5+sb1eOUPHVPWAb54uVeb4+OhHK6C/PJjZeaVv7fTmzHPPqpFHf2+W8XvZKr+KbtY62bf9mdY006quMNsZ4X42bGTeTdQ3lvXdtpViptWoVrz5LrbZOzPxeylu4Blu1/tY10mDbxhhPUJVYozv366c+9zXS4CraxtPByH9eyD9cKV4ZbYzxlLyWkM341MOR93sRhlataSo2Xh3jGr/y1rwMUz1L/3sEJUf4qnZMyOn/GgM5rQUD2rPILDKLHFcVm5l1wA1/cabYCQs2HIjDoB20g3bQDtpBO2gH7aAdtO/3Vmgf2idt7Oc7Hj2SqMcXD7wLBtzwQDJvwoIN8bloE22iTbSJNtEm2kSbaBNtoi20nmTkSejM2hc6UvRT97e2tvCsIu65ia7YAXfDgBs6Pv6/4c9nFnQPg//gP/Q2nluMf0L4B5uK78U0/L3Up19QEeK+u7jhgZy6T7Fg//0HkO7MMw==',
 355:'eNotlskRHDEMAxPah6iDRywu55+GgR5/ujSSoIMisfsn71m/iXq/2b1+XTeNMtoY4XnghbGN89t7r1+lJr+97y/vq1+eKveB/tXMeNHQlH6/nAfSKKONEXL9Mk8YW1ptJNA6xv3NxNHyqQVuSHG1uSDFHe+mlXUqHTxr/yS97kuD0faAFkjOrN1iPe2k8+ow3kmyMnSi1vGF1slXGNs4xjUcp5VGGczzNWMZVoQVYUVYEVaENmpFsfYmijrWm+tWu+Wlejtix7jGM3Sl5Y1qvFEGJz/wwgcT+s10Od31GopJKviCP9t7pF6v/cA5Pm77kH7bfpxAA6Mps3zf5VsuXzDG9zjf5j4Ha5U7Fe5Yjqia6vQLzXEuHV1HuAafHp0wjuGB8YCuOE/hOakrRvgNtE1yx+SOyR2TO2bBb86YxWsWh+M0r9AW2kJbaAttoS20jbbRNtpG22gbbaNttI220Q7aQTtoB+2gHbSDdtAO2rE214IBieA68MIHExZsiDbQBtpAG2gDbaANtIE20AbajXaj3Wg32o12o91oN1reIjfag5YkcJWaaMnDJA+TPFRVQbQH7UV70V60F+1Fe9FetBftRXvRPrQP7UP70MoVVEzlfNZ3HEctjrLX7YINx3TUxIDaKVweEc+nEd3z7AtBrgRvHLxu8CpB9IOIBxEPIh5EPBzxOnKcbbPZmXamA7ZBZtjMjkYEz1Yqy4Toa7f06VAryZb73FJUBZtNel7Z9NSnVtgX5GjXfneLll247JB2tafXF9qQYbYP0z6MiypdU4nPHC/gkMr9NK945iKJy/XpahoX07iWxuGpWTaoZYNafJZhw1eQasiOPnYylVkvZZfwDK6iz1AddGv9trHLYJ6RRhmYjl112VkeBeSfgaO19VsQhlqVNhRbUilAwjW+7a0Z0mZ40qJA3qMwH4X5f10K81HU30/DZ7P5JRtpycxkTmFNhe0UtlPYTtXXT+SwncJ2CtspbKewncJ2CtspbKewncJ2CtspbKewncJ2Ctup+d4HLbZTtp3Y8yX7JcFJ+QMviX9JfJL9fOVymXkpGtL/XIrmss5F+9A+tA/tQ/vQPrQP7UP70D60FJOzXWV0KLVD2W2KZlM0nIfyD0o+kjWTIk7HLfyz7R+FBQNuSP+hn5tW8spJu5hDidf3+o58NJFpztCbNis4Wc2E9HO25mzNvRozGFu3+LU3PPDCBxMWlFb/HBjFhAYLGdtyDCcZzjDsPp8hFf3s7v8AXoF1/Bbihgde+CAz/Rb617Igo8VoMdofmdOs6bzSXxjmD+sP60/+/QcUa/+t',
});
const roots=i=>JSON.parse(inflateSync(Buffer.from(ROOTS[i],'base64')).toString('utf8'));
function fixture(sceneIndex=355){
 const desc=TATE4_MJ6263_SCENES[sceneIndex];
 const nodes=Array.from({length:TATE4_MJ6263_NODE_COUNT},()=>({}));
 for(let i=12077;i<=12096;i++){
  const isMJ62=i<=12085;
  nodes[i]={name:'source-'+i,extras:{modelStage:'WORK_TEST',current:false,asBuilt:false,humanReview:'NOT_RUN',productionWebGL:'NOT_RUN',sourceLinks:[{role:'source'}],integrationSource:{donorGLBSHA256:isMJ62?TATE4_MJ6263_MJ62_SHA256:TATE4_MJ6263_MJ63_SHA256,donorDriveId:isMJ62?TATE4_MJ6263_DONOR_IDS.mj62:TATE4_MJ6263_DONOR_IDS.mj63}}};
 }
 nodes[12092].name='MJ63R2_WARDROBE_EXHAUST_VALVE_IN_ROOM_ADJACENT_TO_OUTDOOR_STORAGE';
 nodes[12092].children=[12093,12094,12095];
 nodes[12096].name='MJ63R2_INNER_ROOM_THROUGH_STORAGE_TO_OUTSIDE_SINGLE_SEALED_DUCT_WORK_TEST';
 const scenes=Array.from({length:TATE4_MJ6263_SCENE_COUNT},()=>({nodes:[]}));
 scenes[sceneIndex]={name:'C80_TATE_MJ62_MJ63_'+desc.floor+'_'+desc.glazing+'_WORK_TEST_HOST_HOLD_20261113__scene'+sceneIndex,nodes:roots(sceneIndex),extras:{current:false,asBuilt:false,stage:'WORK_TEST_HOST_HOLD',physicalConnectionsVerified:0,productionWebGL:'NOT_RUN',humanReview:'NOT_RUN',sourceParentGLBSHA256:TATE4_MJ6263_PARENT_SHA256,integration:{task:'GPT6-TATE4-MJ62-MJ63-INTEGRAATIO-20261113',parentScene:desc.parent,floor:desc.floor,glazingState:desc.glazing,sourceGLBSHA256:{tate4:TATE4_MJ6263_PARENT_SHA256,mj62:TATE4_MJ6263_MJ62_SHA256,mj63:TATE4_MJ6263_MJ63_SHA256}}}};
 return {scene:292,asset:{extras:{Canonical:false,ModelStage:'WORK_TEST',current:false,asBuilt:false,HUMAN_REVIEW:'NOT_RUN',viewerFloorScenes:{'1F':350,'2F':351,BOTH:352}}},scenes,nodes,meshes:Array.from({length:TATE4_MJ6263_MESH_COUNT},()=>({}))};
}
test('snapshot 2F/BOTH root hashes are distinct and source-exact',()=>{
 for(const i of [354,355]){
  assert.equal(tate4Mj6263RootsFnv32(roots(i)),TATE4_MJ6263_SCENES[i].fnv);
  assert.equal(new Set(roots(i)).size,TATE4_MJ6263_SCENES[i].roots);
 }
});
test('source-locked positive 2F and BOTH scene, not generic TATE4',()=>{
 for(const i of [354,355])assert.equal(isTate4Mj62Mj63SourceScene(fixture(i),TATE4_MJ6263_SOURCE_SHA256,i),true);
});
test('wrong hash, floor, mode, unknown and inherited scenes fail closed',()=>{
 const d=fixture();
 assert.equal(isTate4Mj62Mj63SourceScene(d,TATE4_MJ6263_PARENT_SHA256,355),false);
 assert.equal(isTate4Mj62Mj63SourceScene(d,TATE4_MJ6263_SOURCE_SHA256,355,'2F'),false);
 assert.equal(isTate4Mj62Mj63SourceScene(d,TATE4_MJ6263_SOURCE_SHA256,355,'BOTH','STACKED'),false);
 assert.equal(isTate4Mj62Mj63SourceScene(d,TATE4_MJ6263_SOURCE_SHA256,350),false);
});
test('wrong donor or legacy root fails closed',()=>{
 const d=fixture();
 d.nodes[12096].extras.integrationSource.donorDriveId='wrong';
 assert.equal(isTate4Mj62Mj63SourceScene(d,TATE4_MJ6263_SOURCE_SHA256,355),false);
 d.nodes[12096].extras.integrationSource.donorDriveId=TATE4_MJ6263_DONOR_IDS.mj63;
 d.scenes[355].nodes[0]=11315;
 assert.equal(isTate4Mj62Mj63SourceScene(d,TATE4_MJ6263_SOURCE_SHA256,355),false);
});
test('current/as-built promotion and lost corrected valve children fail closed',()=>{
 const d=fixture();
 d.asset.extras.current=true;
 assert.equal(isTate4Mj62Mj63SourceScene(d,TATE4_MJ6263_SOURCE_SHA256,355),false);
 d.asset.extras.current=false;d.nodes[12092].children=[12093];
 assert.equal(isTate4Mj62Mj63SourceScene(d,TATE4_MJ6263_SOURCE_SHA256,355),false);
});
