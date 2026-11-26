import test from 'node:test';
import assert from 'node:assert/strict';
import { inflateSync } from 'node:zlib';
import {
  K3_D1F_SW05_VISUAL_SOURCE as S,
  sw05RootsFnv32 as fnv,
  isK3D1fSw05VisualSource as accepts,
  k3D1fSw05VisualSourceReceipt as receipt,
} from '../../src/scripts/privateModelK3D1fSw05VisualSourceAssociation.mjs';

// Original authenticated GLB scene787 ordered root list, compressed. The
// SERVICE list drops only plexiglass n11625; __sceneN is a filename suffix,
// not the identifier accepted by this source contract.
const normal = JSON.parse(inflateSync(Buffer.from('eNotlstxACEMQxvaA7YBQy2Z9N9GpEcuGnaxDPgj+Nmzxhc5Y303z/hOz63vNZeHh+HWcA2G7WEy1FzNLeMK4cqc356r/X3m11u2goPzsPOQ0VnfvgvYhjYcwxXs8e1dYUiRVxgYlWHKV2hj8phMeY/yc3bnJ0Ovqk+Bl5ZbTZSc5dDn5pilZexSjDZo6aONCo62OLzPkYYyTIMDM7ahDRwoEyxwgm9bG2zwWWrB4+DVvJjc8/W60ztnZKcHd/ES8ca4DpkNlt3h72GaDqJzTYPOvxVWgT8Phvmd44ztO+wZP9r0OYuVnK/Uynf4iGN4w0rmd+NyjnFtxQGIgSIbw8HTkL/1MqqAlJIp4G/IecmDwD8vZVH91dZ5Y6xd4AQXuMEGn8019gADTBBuw224DbfhNtyGe+AeuAfugXvgHrgH7oF74B64F+6Fe+FeuBfuhXvhXrjvXNfcPQYYIAEbBU5wgRts8IBwA27ADbgBN+AG3IAbcANuwE24CTfhJtyEm3ATbsJNuAm34BbcgltwC27BLbgFt+AW3Al3wp1wJ9wJd8KdcCfcCXfCXXAX3AV3wVUNdmqbql59R6mQhY6XkJob/HG8hO6H5ZOH2yByOB9hrRLS65wzyG6Q1yAflT5VEOuMQFMc5UydsEv6kZYOnYiW81ElcNpcqQcF29Dfkh+Pjkf6ZDUZLv+8nwpvGawb24Yqa7n0rEr7uPkUmzQwsnbqHALJ4lKmBcdg+bAinrLEaR/b/bPv9Y7swOGTkMmun5KTrnYbunOuG+e6b67bpq9iIFgGPttwDFdQRKU8o5Y6I61AKiQBR9FnqObPQczCuhiWsFD4r2ekkNYKi03J2b3W/qtg31b89O94VIZpSEfNlaS7xBGsRV8t+m3Rb4t++/9Pr256ddOr+9UQ1YblxsZrqAao6UZNGjXpfn8muMANEjbUpFGTRk0aNWnUpFGTRk0aNWnUpNFAeibpmaRnkp5Jekb31mQ8qWfQPawDg5OqdhyE1PnrgomlO8oBAukIbl+3i/GNL7U9QJeuk2Wktjc6b7UVHtC7Squt0Osu719Id1hBAgUJ+jno4Xp73vTm5j4IbvxJf3U+TND7fyW53LO18tWWPRN5/bHng8+T9CaPD2ogzkM8Xyus8I0TLNCsaHrvPJtGGS7IS4VrenFNs6IQlXAN6NbzHu4la9gPa1MGGRxW2Bxvb9zi4XrQK2CD2PgWEV5UCPuLdGAzfTqhbYJcBLkIchH/uSBfrJhUSzr7QnI3+U/9vPgkr6pCtQodq2CtJwCT1Z980c+zeAUUF7yzXG91VFvuucH7RYCuIVZkP7k/VG5kH5+Ld9g876XHm4azr0GcB7OXLDyVHsR88V7Envs+uXXqnW5fdsUqufjvW6GsnVrXORWiD+SivLeqN4tu+K3k5kjw7ZkxL555mfVtXWtQja4ioWetsh43Y2Z9BwuZzfP7B9P1MfU=','base64')).toString('utf8'));
const service = normal.filter(n=>n!==11625);
const roots = { 787: normal, 788: service };
function synthetic(index) {
  const v=Object.values(S.views).find(x=>x.index===index);
  assert.ok(v);
  const scenes=Array.from({length:S.sceneCount},()=>({nodes:[]}));
  scenes[v.parent]={nodes: roots[index].slice(0,-1)};
  scenes[index]={
    name:v.name, nodes:[...roots[index]],
    extras:{
      stage:'WORK_TEST_HOST_HOLD', role:v.role,
      sourceParentScene:v.parent, sourceOriginalGLBSHA256:S.parentGlbSha256,
      newD1FSW04Root:13528, current:false, asBuilt:false,
      humanReview:false, productionWebGLVerified:false,
      sourceLinksBoundToOutputSHA:false,
    },
  };
  const nodes=Array.from({length:S.nodeCount},()=>({}));
  nodes[11772]={name:'D1F-SW-05_2026_GREEN_SWITCH_OWNER_WORKTEST_ROOT',
    extras:{
      stableID:'D1F-SW-05', floor:'D1F', sourceMarkerCenter_px:[657,977],
      physicalWallHost:'HOLD_UNVERIFIED', current:false, asBuilt:false,
    },
  };
  nodes[12134]={
    name:'MJ89_D_D1F_SW05_EXISTING_SINGLE_SWITCH_CORRECTED_TO_TWO_ROCKER_ONE_FRAME_HOST_WORK_TEST_HOLD',
    translation:[0,0,0.269], children:[12131,12132,12133],
    extras:{
      sourceRootIndex:11772, noSecondDevice:true,
      photoMorphology:'TWO_STACKED_ROCKERS_ONE_SWITCH_FRAME',
      sourceBackWallNode:7221, sourceWallFaceGLTF_Z_m:-5.092,
      correctedFrameBackZ_m:-5.093, shiftZ_m_WORK_ASSUMPTION:0.269,
      physicalXYZ:'UNKNOWN', electricalCircuit:'UNKNOWN',
      sourceLinksBindingVerified:false,
      stage:'PHOTO_RELATIVE_WORK_TEST_HOST_HOLD',
      current:false, asBuilt:false,
    },
  };
  nodes[12131]={
    mesh:4565,
    extras:{photoSource:S.photoSourceDriveId,sameMeshAsSource:true,sourceNodeIndex:11773},
  };
  nodes[12132]={mesh:4566,extras:{photoSource:S.photoSourceDriveId,asBuilt:false}};
  nodes[12133]={mesh:4567,extras:{photoSource:S.photoSourceDriveId,asBuilt:false}};
  return {
    asset:{extras:{ModelStage:'WORK_TEST',current:false,asBuilt:false,HUMAN_REVIEW:'NOT_RUN'}},
    scene:S.defaultScene,scenes,nodes,meshes:Array(S.meshCount),
    materials:Array(S.materialCount), accessors:Array(S.accessorCount),
    bufferViews:Array(S.bufferViewCount),
  };
}
const good=(json,index)=>
  accepts(json,S.glbSha256,index,index===787?'NORMAL':'SERVICE','D1F');
test('both real-source root signatures and the SW05 one-frame two-rocker association',()=>{
  assert.equal(normal.length,500);
  assert.equal(service.length,499);
  assert.deepEqual(normal.filter(n=>n!==11625),service);
  for(const i of [787,788]){
    const j=synthetic(i),v=Object.values(S.views).find(x=>x.index===i);
    assert.equal(fnv(j.scenes[i].nodes),v.rootFnv);
    assert.equal(fnv(j.scenes[v.parent].nodes),v.parentFnv);
    assert.equal(good(j,i),true);
    const r=receipt(j,S.glbSha256,i,v.role,'D1F');
    assert.equal(r.exactSource,true);
    assert.equal(r.publishAllowed,false);
    assert.equal(r.sourceLinksBound,false);
    assert.equal(r.current,false);
    assert.equal(Object.isFrozen(r),true);
  }
});
test('source SHA, glTF index, role and floor must match all identities',()=>{
  const j=synthetic(787);
  assert.equal(accepts(j,S.parentGlbSha256,787,'NORMAL','D1F'),false);
  assert.equal(accepts(j,'0'.repeat(64),787,'NORMAL','D1F'),false);
  assert.equal(accepts(j,S.glbSha256,788,'NORMAL','D1F'),false);
  assert.equal(accepts(j,S.glbSha256,787,'SERVICE','D1F'),false);
  assert.equal(accepts(j,S.glbSha256,787,'NORMAL','D2F'),false);
  assert.equal(accepts(j,S.glbSha256,789,'NORMAL','D1F'),false);
});
test('do not invent a second device or reactivate the old green-dot schematic',()=>{
  let j=synthetic(787);
  j.scenes[787].nodes.push(11772);
  assert.equal(good(j,787),false);
  j=synthetic(787);
  j.nodes[12134].extras.noSecondDevice=false;
  assert.equal(good(j,787),false);
  j=synthetic(787);
  j.nodes[12134].children.push(11773);
  assert.equal(good(j,787),false);
  j=synthetic(787);
  j.nodes[12132].mesh=5092;
  assert.equal(good(j,787),false);
  j=synthetic(787);
  j.nodes[12134].extras.photoMorphology='TWO_SEPARATE_SWITCHES';
  assert.equal(good(j,787),false);
  j=synthetic(787);
  j.nodes[12134].extras.sourceRootIndex=11775;
  assert.equal(good(j,787),false);
});
test('parent roots, plexiglass and retained switches cannot be silently replaced',()=>{
  let j=synthetic(788);
  j.scenes[788].nodes.unshift(11625);
  assert.equal(good(j,788),false);
  j=synthetic(787);
  j.scenes[785].nodes.reverse();
  assert.equal(good(j,787),false);
  j=synthetic(787);
  j.scenes[787].nodes.splice(j.scenes[787].nodes.indexOf(13519),1);
  assert.equal(good(j,787),false);
  j=synthetic(787);
  j.scenes[787].extras.sourceParentScene=783;
  assert.equal(good(j,787),false);
});
test('unknown physical state and WORK_TEST publication gates stay closed',()=>{
  let j=synthetic(787);
  j.nodes[12134].extras.sourceLinksBindingVerified=true;
  assert.equal(good(j,787),false);
  j=synthetic(787);
  j.asset.extras.current=true;
  assert.equal(good(j,787),false);
  j=synthetic(787);
  j.scenes[787].extras.productionWebGLVerified=true;
  assert.equal(good(j,787),false);
  j=synthetic(787);
  j.nodes[12134].extras.physicalXYZ=[2.44,1.175,-5.1035];
  assert.equal(good(j,787),false);
  const r=receipt(j,S.glbSha256,787,'NORMAL','D1F');
  assert.equal(r.exactSource,false);
  assert.equal(r.publishAllowed,false);
});
test('invalid ordered root arrays cannot forge a signature',()=>{
  for(const a of [null,[1,-1],[1,1.5],[Number.MAX_SAFE_INTEGER+1]])
    assert.equal(fnv(a),null);
});
