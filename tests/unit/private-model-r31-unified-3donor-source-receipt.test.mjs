import test from 'node:test';
import assert from 'node:assert/strict';
import {inflateSync} from 'node:zlib';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {R31_3DONOR_UNIFIED as C,r31UnifiedRootsFnv32 as fnv,
  isR31Unified3DonorSource as valid,r31Unified3DonorReceipt as receipt}
  from '../../src/scripts/privateModelR31Unified3DonorSourceReceipt.mjs';

// Exact root-order indices, compacted from the authenticated source GLB.
// No model mesh data, photographs, physical address or credentials.
const roots=JSON.parse(inflateSync(Buffer.from('eNrtmFuu3jYMhPeSZz+YpK7dStGVFN17Zz4dBH+QFOe0KZq28MtAtjWURFFDWr9+mrM+/fTzaHVfkS36tXPd15pt6Lm37uaiOdTsN83pZtLUt2pDnSuEPbNdo/Xp59WuOdRXsDAeNh7qtPo1dgeGYRqWYQvGfY1RYUiRexholaHJVmhisph88hxlZ42Zlzp6VD0KPLTM6kPJWN56HCyzNIxNijENGnppooKlKd6e552GMjSDHXMPwzSwoEywwAaeaQ1wgqenBlz9jM3Hva7Zd/PMadnowlycjThtTIe63Qw7ws+3aVqI1tUMWv+QWwV+XHTMay3v2Ni3LWNHk16rM5L3KzXyvr3E+/actJnXjs067u1eLAAfyLNx23lq8rbOjsohpc0U8DZkvGRB4JebsKh51dB64+6jwAZ2cIATPH22cd5ggAnCnXAn3Al3wp1wJ9wFd8FdcBfcBXfBXXAX3AV3wd1wN9wNd8PdcDfcDXfDPeva5o77BgPEYXeBDezgACe4QLgBN+AG3IAbcANuwA24ATfgJtyEm3ATbsJNuAk34SbchFtwC27BLbgFt+AW3IJbcAtug9vgNrgNboPb4Da4DW6D2+B2uB1uh9vhKgZnapqKXj1HKZCF9peQmLt5Y38JfR66Vx4+BpG39yOsVULOOusMdjfY12A/Kr2qwNcZgabYy5leYUxsTntT6JlMBLJ7XHEn6PmEPRXTo+uNR1kB2vuxHRPCABMs0HMIx6t0EsuepxBVRVI6ktKRlO7909nsRsef9OkGsTOOHXvjXnzlPN6ObOHGM/TfKAh9mucpdJ+jLKxLCl4g3vDOZeGZtxTRsFAHUalCXQrhcMRoPqjBUQqf0ir6d7S7rZMdsMnc+tnH7lyS7BpakESkep73ZTuOhCo8k44e+b//cimLNWWxWdL9tOSPtwk6RDUdBVVphYJhmFfXXrm13NIjUaKO3S/3JcHoBuv9cEfJ0fDa1AqLsfJJc7Zpk5ZzniJgeLEK6mlYBsu+M9kqpybNY1j3xt6ekQ047JWA1O8EWOOYTcunFW9b8Lb1blvupuNG0A08TsMybAH7oUOjpkJrOToE3cBS9Kjw0eGykGU4n4VTT+jYbH9RZrPGO0nIy9feztlbh2RP+U/vlltlaAb2BwXY7HNH5Xo/iE52dLKjkx2NHWjsQGPHOfuoBD0HfTyG99+aMMkCkyww53nTwA4OELeRBSZZYJIFJllgkgUmWWCSBSZZYJIFJmcFrUu0LtG6ROsSrVO90Wg3dAjklBcnvhpqZD8I0aejXo2enNpCk6qhZFRNljnjaW/046gLZ3EQ44NTOMjPnKoc57x6VuksKfS43fMXompoD8of6HCgvXXmPNDUwekMKrW2j9rNbymfDluCp412NtSOErG8szrM4D46Zztk6iQfqXg6J5URWVGwoqMTcVbkURL7eSwnVePRnkKnK8Z72pPkoCQDJn5I/JBkQDmeepUip9+o7A3X2TyJ3jqaN3xE1J+194NHgTYKxFfnfcX8DSY4UKP+qNGjRo8avarRo0M/QIfG82//z/3bax/682///Ns///b/4n/7pyr7YVWZcgk56636eqqy/+I/4t9yL/YXarkP3qOdqu9Dt2nkmy/u1L6uEl9v2ZIc/z23bH9Yc77evhFLX9/Bfawi/XM3dKdGfbmne6defecW7+s69mj43T/f7jX6v97uvVa5bzd9L1XuF7d+bxVv+1z31vmKqriS8tFJcHyumdmFU2l/u05+uUOcT7X8VMtPtfxUy0+1/FTLT7X8VMvfcYf51MlPnfx/rJN/+x1o8oWX','base64')).toString('utf8'));
function fixture(i){
  const scenes=Array.from({length:C.sceneCount},()=>({nodes:[]})),v=C.views[i];
  scenes[i]={name:'Ylisrinne_C80_R31_3DONOR_COFIT_'+v.role+
    '_SOURCE_REVIEW_WORK_TEST_HOST_HOLD__scene'+i,nodes:[...roots[i]],
    extras:{stage:'WORK_TEST_HOST_HOLD',sceneRole:v.role,
      cofit:'H1811-6+KORJ7-04+L5',baseGlbSha256:C.baseGlbSha256,
      current:false,asBuilt:false,humanReview:'NOT_RUN',sourceLinksOutputSHA:'NOT_BOUND'}};
  const nodes=Array.from({length:C.nodeCount},()=>({}));
  nodes[12135]={name:'OM_KORJ7_04_V49_D1F_RIGHT_JAMB_COW_RECTANGULAR_WORK_TEST',mesh:4568,
    extras:{sourceLinksVerified:false,unmeasuredHost:true,current:false,asBuilt:false,humanReview:'NOT_RUN'}};
  nodes[13466]={name:'D1F_S1_OWNER_CONFIRMED_FOUR_HANDLES_R31_R300_E220S_WORK_TEST_HOST_HOLD_ROOT__scene749',
    children:[12620],extras:{owner4HandlesPhotoProxy:{ownerConfirmedCount:4,humanReview:'NOT_RUN'},
      canPublish:false,current:false,asBuilt:false}};
  nodes[12620]={extras:{physicalConnectionsVerified:0}};
  nodes[13482]={name:'H18116_D2F_PINK_LIVING_EXPLICIT_RECLASSIFIED_VISUAL_ROOT_HOST_HOLD',
    children:[13171,13172,13173,13174,13175],
    extras:{identityStatus:'SEPARATE_PHYSICAL_OUTLET_FROM_K5_2026_PHOTOS',
      exactPhysicalPositionVerified:false,presentationOnly:true,sourceLinksBound:false,
      current:false,asBuilt:false,humanReview:'NOT_RUN'}};
  return {asset:{extras:{ModelStage:'WORK_TEST',Canonical:false,current:false,asBuilt:false,
    HUMAN_REVIEW:'NOT_RUN'}},scene:C.defaultScene,scenes,nodes,meshes:Array(C.meshCount),
    materials:Array(C.materialCount),accessors:Array(C.accessorCount),bufferViews:Array(C.bufferViewCount)};
}
const ok=(j,i)=>valid(j,C.glbSha256,i,C.views[i].role,C.views[i].floor);
test('five scene fingerprints and fail-closed component selections',()=>{
  for(const [key,v] of Object.entries(C.views)){
    const i=Number(key),j=fixture(i);
    assert.equal(roots[i].length,v.rootCount);
    assert.equal(fnv(roots[i]),v.rootsFNV);
    assert.equal(ok(j,i),true,'source scene '+i);
    for(const component of ['jamb','newS1','living','legacyS1','oldKitchen','UNKNOWN']){
      const r=receipt(j,C.glbSha256,i,v.role,v.floor,component);
      const active=v.active.includes(component);
      assert.equal(r.exactSource,true);
      assert.equal(r.componentActive,active);
      assert.equal(r.rootNode,active?C.roots[component]:null);
      assert.equal(r.publishAllowed,false);
      assert.equal(r.sourceLinksBound,false);
      assert.equal(r.humanReview,'NOT_RUN');
    }
  }
});
test('reject false versions, wrong scenes, added sourceLinks and invalid roots',()=>{
  const j=fixture(776),v=C.views[776];
  for(const sha of ['0'.repeat(64),C.baseGlbSha256,C.zipSha256,''])
    assert.equal(valid(j,sha,776,v.role,v.floor),false);
  for(const [i,role,floor] of [[773,'BOTH_NORMAL','BOTH'],[776,'BOTH_SERVICE','BOTH'],
    [776,'BOTH_NORMAL','2F'],[777,'BOTH_NORMAL','BOTH']])
    assert.equal(valid(j,C.glbSha256,i,role,floor),false);
  const mutations=[
    x=>x.scene=776,x=>x.asset.extras.current=true,x=>x.asset.extras.Canonical=true,
    x=>x.scenes.length--,x=>x.nodes.pop(),x=>x.meshes.pop(),
    x=>x.scenes[776].name='wrong __scene776',
    x=>x.scenes[776].extras.sourceLinksOutputSHA=C.glbSha256,
    x=>x.scenes[776].extras.current=true,
    x=>x.scenes[776].extras.baseGlbSha256='bad',
    x=>x.scenes[776].nodes.reverse(),
    x=>x.scenes[776].nodes.push(x.scenes[776].nodes[0]),
    x=>x.nodes[12135].mesh=3341,
    x=>x.nodes[12135].extras.sourceLinksVerified=true,
    x=>x.nodes[13466].extras.owner4HandlesPhotoProxy.ownerConfirmedCount=2,
    x=>x.nodes[12620].extras.physicalConnectionsVerified=1,
    x=>x.nodes[13482].extras.exactPhysicalPositionVerified=true,
    x=>x.nodes[13482].extras.sourceLinksBound=true,
  ];
  for(const mutate of mutations){const x=fixture(776);mutate(x);assert.equal(ok(x,776),false);}
  for(const input of [undefined,[-1],[1.5],[Number.MAX_SAFE_INTEGER+1]])assert.equal(fnv(input),null);
});
const original=process.env.R31_3DONOR_UNIFIED_ORIGINAL_GLB;
test('optional original authenticated GLB byte replay',{skip:!original},()=>{
  const bytes=readFileSync(original),sha=createHash('sha256').update(bytes).digest('hex');
  assert.equal(bytes.length,C.glbBytes);
  assert.equal(sha,C.glbSha256);
  assert.equal(bytes.toString('ascii',0,4),'glTF');
  assert.equal(bytes.readUInt32LE(8),bytes.length);
  assert.equal(bytes.toString('ascii',16,20),'JSON');
  const j=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'));
  for(const [key,v] of Object.entries(C.views))
    assert.equal(valid(j,sha,Number(key),v.role,v.floor),true);
});
