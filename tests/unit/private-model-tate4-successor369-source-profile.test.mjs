import test from 'node:test';
import assert from 'node:assert/strict';
import {inflateSync} from 'node:zlib';
import {SUCC369_SHA256,SUCC369_SOURCE_LINKS_BOUND,SUCC369_SCENES,
 isSucc369SourceScene} from '../../src/scripts/privateModelTate4Successor369SourceProfile.mjs';
import {TATE4_MJ6263_SCENES,tate4Mj6263RootsFnv32} from '../../src/scripts/privateModelTate4Mj62Mj63SourceProfile.mjs';
// Base roots compressed from the original successor GLB SHA31dc12c4, not synthetic placeholders.
const BASE64={
 354:'eNotkssVXSEMAxu6Cwz4Qy056b+NSPOymQPGko3hT5+sb1eOUPHVPWAb54uVeb4+OhHK6C/PJjZeaVv7fTmzHPPqpFHf2+W8XvZKr+KbtY62bf9mdY006quMNsZ4X42bGTeTdQ3lvXdtpViptWoVrz5LrbZOzPxeylu4Blu1/tY10mDbxhhPUJVYozv366c+9zXS4CraxtPByH9eyD9cKV4ZbYzxlLyWkM341MOR93sRhlataSo2Xh3jGr/y1rwMUz1L/3sEJUf4qnZMyOn/GgM5rQUD2rPILDKLHFcVm5l1wA1/cabYCQs2HIjDoB20g3bQDtpBO2gH7aAdtO/3Vmgf2idt7Oc7Hj2SqMcXD7wLBtzwQDJvwoIN8bloE22iTbSJNtEm2kSbaBNtoi20nmTkSejM2hc6UvRT97e2tvCsIu65ia7YAXfDgBs6Pv6/4c9nFnQPg//gP/Q2nluMf0L4B5uK78U0/L3Up19QEeK+u7jhgZy6T7Fg//0HkO7MMw==',
 355:'eNotlskRHDEMAxPah6iDRywu55+GgR5/ujSSoIMisfsn71m/iXq/2b1+XTeNMtoY4XnghbGN89t7r1+lJr+97y/vq1+eKveB/tXMeNHQlH6/nAfSKKONEXL9Mk8YW1ptJNA6xv3NxNHyqQVuSHG1uSDFHe+mlXUqHTxr/yS97kuD0faAFkjOrN1iPe2k8+ow3kmyMnSi1vGF1slXGNs4xjUcp5VGGczzNWMZVoQVYUVYEVaENmpFsfYmijrWm+tWu+Wlejtix7jGM3Sl5Y1qvFEGJz/wwgcT+s10Od31GopJKviCP9t7pF6v/cA5Pm77kH7bfpxAA6Mps3zf5VsuXzDG9zjf5j4Ha5U7Fe5Yjqia6vQLzXEuHV1HuAafHp0wjuGB8YCuOE/hOakrRvgNtE1yx+SOyR2TO2bBb86YxWsWh+M0r9AW2kJbaAttoS20jbbRNtpG22gbbaNttI220Q7aQTtoB+2gHbSDdtAO2rE214IBieA68MIHExZsiDbQBtpAG2gDbaANtIE20AbajXaj3Wg32o12o91oN1reIjfag5YkcJWaaMnDJA+TPFRVQbQH7UV70V60F+1Fe9FetBftRXvRPrQP7UP70MoVVEzlfNZ3HEctjrLX7YINx3TUxIDaKVweEc+nEd3z7AtBrgRvHLxu8CpB9IOIBxEPIh5EPBzxOnKcbbPZmXamA7ZBZtjMjkYEz1Yqy4Toa7f06VAryZb73FJUBZtNel7Z9NSnVtgX5GjXfneLll247JB2tafXF9qQYbYP0z6MiypdU4nPHC/gkMr9NK945iKJy/XpahoX07iWxuGpWTaoZYNafJZhw1eQasiOPnYylVkvZZfwDK6iz1AddGv9trHLYJ6RRhmYjl112VkeBeSfgaO19VsQhlqVNhRbUilAwjW+7a0Z0mZ40qJA3qMwH4X5f10K81HU30/DZ7P5JRtpycxkTmFNhe0UtlPYTtXXT+SwncJ2CtspbKewncJ2CtspbKewncJ2CtspbKewncJ2Ctup+d4HLbZTtp3Y8yX7JcFJ+QMviX9JfJL9fOVymXkpGtL/XIrmss5F+9A+tA/tQ/vQPrQP7UP70D60FJOzXWV0KLVD2W2KZlM0nIfyD0o+kjWTIk7HLfyz7R+FBQNuSP+hn5tW8spJu5hDidf3+o58NJFpztCbNis4Wc2E9HO25mzNvRozGFu3+LU3PPDCBxMWlFb/HBjFhAYLGdtyDCcZzjDsPp8hFf3s7v8AXoF1/Bbihgde+CAz/Rb617Igo8VoMdofmdOs6bzSXxjmD+sP60/+/QcUa/+t'
};
const oldRoots=i=>JSON.parse(inflateSync(Buffer.from(BASE64[i],'base64')).toString('utf8'));
function fixture(idx=362){
 const desc=SUCC369_SCENES[idx],base=desc.base,old=TATE4_MJ6263_SCENES[base];
 const nodes=Array.from({length:12108},()=>({}));
 nodes[2220]={children:[2202,2153,2154]};
 nodes[12097]={name:'PK1_INSPECT_1F_C77_WRAPPER_NO_PRESENTATION_CABINET_2202_WORK_TEST',children:[2153,2154],extras:{current:false,asBuilt:false,pk1Diagnostic:{removedFromNewScenesOnly:2202,notPhysicalModification:true}}};
 nodes[12098]={name:'MJ72_OWNER2026_STORAGE_SOCKET_TWO_CLOSED_COVERS_UPPER_DOOR_WALL_COW_ROOT_WORK_TEST_HOST_HOLD',children:[12099,12100,12101,12102,12103,12104,12105],extras:{current:false,asBuilt:false,closedCoverCountVisible:2,sourceLinks:[{role:'owner'}],sourceLinksBindingNewSHA:'NOT_VERIFIED; source URL provenance only'}};
 for(let n=12099;n<=12105;n++)nodes[n]={extras:{sourceLinks:[{role:'donor'}],currentGLBSourceLinksBindingVerified:false}};
 nodes[12106]={name:'C80R2_V29_KIV_WALLFIT_2F_OWNER2026_KIV005_POINT_COW_GROUP_WORK_TEST_HOST_HOLD',children:[12107],extras:{sourceLinksRequireRebind:true,notCurrent:true,notAsBuilt:true,sourceLinks:[{role:'source'}]}};
 nodes[12107]={extras:{sourceLinksRequireRebind:true,sourceLinks:[{role:'source'}]}};
 const scenes=Array.from({length:369},()=>({}));
 scenes[base]={name:'C80_TATE_MJ62_MJ63_'+old.floor+'_'+old.glazing+'_WORK_TEST_HOST_HOLD_20261113__scene'+base,nodes:oldRoots(base),extras:{integration:{parentScene:old.parent}}};
 let roots=oldRoots(base);
 if(desc.floor!=='2F')roots=roots.map(n=>n===11542?12098:n);
 if(desc.floor!=='1F')roots=roots.map(n=>n===8913?12106:n);
 if(desc.cutaway)roots=roots.map(n=>n===2220?12097:n);
 scenes[idx]={name:'C80_M6263_MJ72_KIV005_'+(desc.cutaway?'PK1_CUTAWAY_':'')+desc.floor+'_'+desc.glazing+'_WORK_TEST_HOST_HOLD_20261113',nodes:roots,extras:{
  current:false,asBuilt:false,stage:'WORK_TEST_HOST_HOLD',physicalConnectionsVerified:0,
  humanReview:'NOT_RUN',productionWebGL:'NOT_RUN',
  sourceParentGLBSHA256:'ea4050b463a886ff0cb0c7d544495e6c753d9b87e76459f134c1d439e42a215b',
  integration:{task:'GPT6-TATE4-MJ62-MJ63-INTEGRAATIO-20261113',
   parentScene:old.parent,floor:desc.floor,glazingState:desc.glazing,
   sourceGLBSHA256:{tate4:'ea4050b463a886ff0cb0c7d544495e6c753d9b87e76459f134c1d439e42a215b',
    mj62:'4fed8b19d45aae96e6efe7a4dcda173cd4ca8af1da7d11e165d02dccf60f6d8e',
    mj63:'2e251b08c94f3f4bee8c51eabf66b93b86b03d2b15c90ee2b306fbc15c7db008'}}}};
 return {asset:{extras:{Canonical:false,ModelStage:'WORK_TEST',current:false,asBuilt:false,HUMAN_REVIEW:'NOT_RUN',viewerFloorScenes:{'1F':350,'2F':351,BOTH:352}}},scene:292,scenes,nodes,meshes:Array.from({length:4556},()=>({}))};
}
test('source-only LOCK: actual donor base root snapshots',()=>{
 for(const idx of [354,355]){
  assert.equal(oldRoots(idx).length,TATE4_MJ6263_SCENES[idx].roots);
  assert.equal(tate4Mj6263RootsFnv32(oldRoots(idx)),TATE4_MJ6263_SCENES[idx].fnv);
 }
 assert.equal(SUCC369_SOURCE_LINKS_BOUND,false);
});
test('2F, BOTH and PK1 cutaway BOTH accept exact source snapshot only',()=>{
 for(const idx of [361,362,368]){
  const doc=fixture(idx);
  assert.equal(tate4Mj6263RootsFnv32(doc.scenes[idx].nodes),SUCC369_SCENES[idx].fnv);
  assert.equal(isSucc369SourceScene(doc,SUCC369_SHA256,idx),true);
 }
});
test('wrong SHA, unsupported inherited scene or false scope fail closed',()=>{
 const doc=fixture();
 assert.equal(isSucc369SourceScene(doc,'8aaadccf',362),false);
 assert.equal(isSucc369SourceScene(doc,SUCC369_SHA256,355),false);
 assert.equal(isSucc369SourceScene(doc,SUCC369_SHA256,362,'2F'),false);
 assert.equal(isSucc369SourceScene(doc,SUCC369_SHA256,362,'BOTH','STACKED'),false);
 assert.equal(isSucc369SourceScene(doc,SUCC369_SHA256,362,'BOTH','CLOSED',true),false);
});
test('changed source root or unverified binding promoted fail closed',()=>{
 const doc=fixture();
 doc.scenes[362].nodes[0]=11315;
 assert.equal(isSucc369SourceScene(doc,SUCC369_SHA256,362),false);
 const clean=fixture();
 clean.nodes[12098].extras.sourceLinksBindingNewSHA=true;
 assert.equal(isSucc369SourceScene(clean,SUCC369_SHA256,362),false);
});
test('lost KIV provenance or physical-cutaway alias fails closed',()=>{
 const doc=fixture(368);
 doc.nodes[12106].extras.sourceLinksRequireRebind=false;
 assert.equal(isSucc369SourceScene(doc,SUCC369_SHA256,368),false);
 const clean=fixture(368);
 clean.nodes[12097].children.push(2202);
 assert.equal(isSucc369SourceScene(clean,SUCC369_SHA256,368),false);
});
test('promoting source to CURRENT or changing old source provenance fails closed',()=>{
 const doc=fixture(361);
 doc.asset.extras.current=true;
 assert.equal(isSucc369SourceScene(doc,SUCC369_SHA256,361),false);
 const clean=fixture(361);
 clean.scenes[354].extras.integration.parentScene=352;
 assert.equal(isSucc369SourceScene(clean,SUCC369_SHA256,361),false);
});
