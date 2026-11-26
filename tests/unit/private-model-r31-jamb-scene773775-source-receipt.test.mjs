import test from 'node:test';
import assert from 'node:assert/strict';
import {inflateSync} from 'node:zlib';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {R31_JAMB_773775 as S,r31JambRootsFnv32 as fnv,
  isR31Jamb773775Original as valid,r31JambSourceReceipt as receipt}
  from '../../src/scripts/privateModelR31JambScene773775SourceReceipt.mjs';

// Compressed scene-root INDEX arrays only, from SHA-authenticated original G2b GLB.
// No private mesh, BIN, material, image, texture or source document bytes in repo.
const sourceRoots=Object.fromEntries(Object.entries({
  742:'eNotlctxwCAMBRvyAUl8RC2Z9N9G3lty2QGbFSCw/LNnjS9yxvpu9vj6zK3+msvNprnVXIPmcTNp6l1lLTH2/lbm/PZcx/2e39kaKzTBw8FDg3p9+y6wjWO0cYU9vr0rjJS8wqBVxlSs0MIUMXnlNSpO75OfBnpWdQVPrbB6UQqWQ93NNkvTOKSMY2jq1kKF1hKH1znSKGMaTszYxjHYUCYsOOFb1oYHvpGasNebm5e3v7Pu9MppOWgTLt5BvDahQ8MG0+5wf1jTRrSvaWj/W2kV3G0G5tftE9t3ODJxtOjuxUzbp6aZ7/AWx/CadJjfjcs+xvUoNkAOlNkYTp6aPK13okpI6TAFnoaClyIIfng9TdT5amu/MdYuOOGCGx74xlzzDBgwIe7BPbgH9+Ae3IPbuI3buI3buI3buI3buI17cS/uxb24F/fiXtyL+/Z17e4xYEASNgpOuOCGBzbEDdzADdzADdzADdzADdzATdzETdzETdzETdzETdzELdzCLdzCLdzCLdzCLdzCnbgTd+JO3Ik7cSfuxJ24E3fhLtyFu3B1B09qmbq96kfpIovOl8idGzxxvkR/D8s7D38GkcPnEa5VIt86+wxONzjX4DxUszyGXGcENcVZzvQO4xDzOJuiV3IokMvzyj3Q6wlnKo5n1xPP0gGd/bi+E2LAhAW9hvB9VZ0kstcpUlUpKYuSsigpy+enb3OZvn+qTwMSZ784zsZo3vI9Dt9s8ZIZxl8qCGOm1yl6zKss7EsVvCDZ8MllkZn/X8QkQj1SpYrqUhSO/z8B1eBVCn+lVYxf1O7Z7+9ATNa23jku/iWcGrUguZEa+Z6X4/gmVJEZab9/TotSQA==',
  769:'eNotlslxwDAMAxvyQyR1sZZM+m8jwCqfHdkWdFAk5J89a3yRM9bXecd3z9x6XnO5eWluNdegedxMmvpWc6tzhbgy57fnOn6+8ztbfYXL4OHBQ53u+nYvsI1jXKOFPb69K4yUeIVBq4ypsUIL04jJJ69R49x98lNHz6pHwVNrWH0oDZZDj5ttlqbxkFIcQ1NfLVS4WuLwOkcaZUzDgRnbOAYbyoQFJ3zL2vDA11MTXgevZtOl73dWT6+clge9DBfvIF6boUPdBtPu8POwTBvRvqah/W+FVfDjpWN+9/rEdg+PzDha9L2LmXxeqZl7eItjeME6zK+j2cdo92IDxECRjeHgqcnbeieqgJQOU+BtaPDSCIJfNmlR56ut/cZYu+CEC2544OvT5hkwYEK0B+1Be9AetAftQXvRXrQX7UV70V60F+1Fe9FetI220TbaRttoG22jbbRvX23tHgMGJGCj4IQLbnjghWgDbaANtIE20AbaQBtoA22gTbSJNtEm2kSbaBNtok20ibbQFtpCW2gLbaEttIW20BbaiXainWgn2ol2op1oJ9qJdqJdaBfahXahVQ6e1DKVvXqOUiKLjpdIzg3eOF6i62F55+EyiBw+j7BXidQ6+wxONzjX4Dwqvasg1hmBpzjKmdrhKflH2jq0I0rOW5XBaXGlGhS2cb6lcdy6bumR2dRx+WV/Srxl2De2OyqtNaS/KrWvi0+xSYOWvVP7EGSLSyctXMP2YUe8ZYvTOrbrZ3d7RR7A4ZORqd95Ts5xHZehK6ddOO26aZfNacVAWAaPx7hGC0VUyl9UUnekHUiJJLAVPYZy/l7MLOyLYQsLhb/9RQ5pr7DZlAbrtve3gt1H8dO761YZ00hHzZmku8QRrEVdLeptUW+Levt/T61uanVTq/vlENlGz00fz6EcIKcPbnJwk3PemwkX3JCw4SYHNzm4ycFNDm5ycJODmxzc5OAmBw+kZpKaSWomqZmkZnRvTdqTfIauYW0YTrLacRDJ81cFk56uKAcIUhHcvi4X87Wb3B7QqevDMsntjc/bbcULvaq024qed3n9ItVhBwkcJKjnoIbrrXlTm5v7ILjxJ/V18jGh1/9ScsVbFaslJkEciL/eeMzLyDepUEdALPje0JNfEzIk7iPztv1XfO2EBa2NQ2Xe1+fgGw35j+ESX1zii0t8JR7iDNGd6L13c6b0H3auDM532H9zvDVzx4ezRf8IG9LHd4zYeBT9G2Ohz/SuRWLCSQUnFZxU/J8Up8mMxCqJTBITkfdk14tP8s9VeFrhchXM9exhMvszN6p9Fv8IxfXvHKg3O56u4bnfz4sANUWsyI3kdlEykhuMufhLm/f9B/LHw97XIM6Dr80pPA8fxHzxN0l//gaSO6ne7nazKmbJxftFbrjGiztCxD04i/Laqt5XXMV/Ui6dhG/NtPkfms1X3+W1nEtiwv37B6TGMMg=',
  770:'eNotlsl1ACEMQxuaA7bZXEte+m8j0icXPYaxAG+Cnz1rfJEz1td5x3fP3Ppec3l4GW4N12B4PEyG+ldzy7hCuDLnt+c6/r7zO1u2gsvi4cVDRnd9uxewDcdwDS3Y49u7wpAirzAwKsPUWqGDacXkl8+ode4++cnQu+pT4K21rH6UFsuhz42bpW28pBjHoK2vDiq4OuLwOUcayjANDszYhmPAoUywwAm+Y23wgM9SG14Hr2Zj0vc7q6dPzsiLXpaLl4g3ZumQ2WDbHf4epskR+TUN8n8rrAJ/Xgzzu9cZ2z28Muvo0PcudnK+Ujv3sItj+MBK5tfR+DHaVjhADBTZGA6ehszWy6gCUkqmgNnQ4qUVBJ5syqLOV1v+xli7wAkucIMHfDZtPAMMMEG4B+6Be+AeuAfugXvhXrgX7oV74V64F+6Fe+FeuA234TbchttwG27DbbjPrzZ3jwEGSMBGgRNc4AYPeEG4ATfgBtyAG3ADbsANuAE34CbchJtwE27CTbgJN+Em3IRbcAtuwS24BbfgFtyCW3AL7oQ74U64E+6EO+FOuBPuhDvhLrgL7oK74KoGT+qYql59R6mQhY6XkJobzDheQvfDsufhNogczkdYq4T0On4G2Q3yGuSj0l4Fsc4INMVRzpSHp6QfaemQR7ScXZXA6XClHhRsw/mW1vHoeqRPdpPh8mR/KrxlsG5sG6qstaT/qrSvm0+xSQMja6f8EEgWlzItuAbLhxXxliVO59jun93tE3kBh09CJrvzlJx0HbehO6fdOO2+abfNacVAsAx8HsM1tKCISvmPWuqOtAKpkAS4os9Qzd+LmIV1MSxhofC3/0ghrRUWm9Ji3db+VrD7KH6aux6VYRrSUXMl6S5xBGvRV4t+W/Tbot/+5+nVTa9uenW/GqLasNzYeA/VADV9UJODmpzzZia4wA0SNtTkoCYHNTmoyUFNDmpyUJODmhzU5KCB9EzSM0nPJD2T9Izurcl4Us+ge1gOg5OqdhyE1PnrgomlO8oBAukIbl+3i/GNm9oeoEvXyTJS2xudt9oKL+hTpdVW6H2Xzy+kO6wgQScH3VvvtJuu3NwEwV0/6ayTDxP0yV8xrnjn4ZxEI4gAkdeM17ysfJPetO/CAt8MljxKqI24D9m3rbzCN06wQHPj0JP32RwUo0FeMFzfi+t7cX2vRD1cG7oN7Xs32cR+WLMyyOyw8uZ4Z+Z2D9eJXgcbxMa3i7BRJ+wbScFm2mshMSFHQY6CHMV/jsgjOxKrJDJJTITMU1cvPslrq1CzQt8q2OsJw2T3J2v0+SxeB8XF7+zX2x011/Lc7OdFgG4iVtwryb2iMqQ2WHPxPpv3vQB56+D7GsR58LfJwlPvQcwX70jseQckt1E973ZzKnbJxfyiNtzdxe0gRDfIRflsVe8veuI3lJsmwXdmxryEZvPXt3gt15Iwwf37B4aAL50='
}).map(([k,v])=>[Number(k),JSON.parse(inflateSync(Buffer.from(v,'base64')).toString())]));
function fixture(sceneIndex=773) {
  const v=S.views[sceneIndex], base=sourceRoots[v.sourceScene];
  const scenes=Array.from({length:S.sceneCount},()=>({nodes:[]}));
  scenes[v.sourceScene]={name:v.sourceName,nodes:[...base],extras:{stage:'WORK_TEST_HOST_HOLD'}};
  scenes[sceneIndex]={name:v.name,nodes:[...base,S.addedRoot],extras:{
    stage:'WORK_TEST_HOST_HOLD',WORK_TEST:true,current:false,asBuilt:false,
    sourceGLBDriveId:S.originalDriveId,sourceGLBSHA256:S.originalGlbSha256,
    sourceSceneIndex:v.sourceScene,repairNode:S.addedRoot,repairMesh:S.repairMesh,
    originalCorruptedNode:S.historicalDefectiveRoot,
    originalCorruptedMesh:S.historicalDefectiveMesh,
    repairAlreadyPresentInSource:true,repairGeometryNew:false,
    sourceLinksOutputSHA:'NOT_BOUND',humanReview:'NOT_RUN',
    physicalHostVerified:false,floor:v.floor,presentation:v.role,
  }};
  const nodes=Array.from({length:S.nodeCount},()=>({}));
  nodes[S.historicalDefectiveRoot]={mesh:S.historicalDefectiveMesh};
  nodes[S.addedRoot]={name:'OM_KORJ7_04_V49_D1F_RIGHT_JAMB_COW_RECTANGULAR_WORK_TEST',
    mesh:S.repairMesh,extras:{status:'WORK_TEST_HOST_HOLD',current:false,asBuilt:false,
      unmeasuredHost:true,humanReview:'NOT_RUN',sourceLinksVerified:false,
      originalNode:S.historicalDefectiveRoot,originalMesh:S.historicalDefectiveMesh,
      geometryBasis:'existing same-name V49 ghost, not a surveyed host',
      thicknessMm:105,thinSourceMm:60,postDepthMm:95,
      thermostatReferenceZmm:-5112,exactJambX:[3520,3850]}};
  const meshes=Array.from({length:S.meshCount},()=>({}));
  meshes[S.repairMesh]={name:'OM_KORJ7_04_V49_D1F_RIGHT_JAMB_COW_FIXED_GEOMETRY_WORK_TEST'};
  return {asset:{extras:{ModelStage:'WORK_TEST',Canonical:false,canonical:false,
    current:false,asBuilt:false,HUMAN_REVIEW:'NOT_RUN'}},
    scene:S.defaultScene,scenes,nodes,meshes,materials:Array(S.materialCount),
    accessors:Array(S.accessorCount),bufferViews:Array(S.bufferViewCount)};
}
const good=(j,index=773)=>{const v=S.views[index];return valid(j,S.glbSha256,index,v.role,v.floor)};
test('three opt-in source-role views match unchanged parent roots and SHA-bound gate',()=>{
  for(const v of Object.values(S.views)){
    const j=fixture(v.index);
    assert.equal(fnv(j.scenes[v.sourceScene].nodes),v.sourceRootsFnv);
    assert.equal(fnv(j.scenes[v.index].nodes),v.rootsFnv);
    assert.equal(good(j,v.index),true);
    assert.deepEqual(j.scenes[v.index].nodes,[...j.scenes[v.sourceScene].nodes,S.addedRoot]);
    assert.equal(receipt(j,S.glbSha256,v.index,v.role,v.floor).publishAllowed,false);
  }
});
test('reject unrelated R31 scene773, wrong model digest, floor, role and scene',()=>{
  const j=fixture();
  assert.equal(valid(j,S.originalGlbSha256,773,'NORMAL','BOTH'),false);
  assert.equal(valid(j,'5cc1129753f66943e0e85355193702a5e511980ca893931049f94bb6360c489a',773,'NORMAL','BOTH'),false);
  assert.equal(valid(j,S.glbSha256,773,'SERVICE','BOTH'),false);
  assert.equal(valid(j,S.glbSha256,773,'NORMAL','1F'),false);
  assert.equal(valid(j,S.glbSha256,774,'SERVICE','BOTH'),false);
  assert.equal(valid(j,S.glbSha256,999,'NORMAL','BOTH'),false);
  assert.equal(receipt(j,'bad',773,'NORMAL','BOTH').exactSource,false);
});
test('reject model/stage/scene/parent/roots/order and metadata drift',()=>{
 for(const mutate of [
  j=>j.asset.extras.current=true,j=>j.asset.extras.canonical=true,
  j=>j.asset.extras.HUMAN_REVIEW='PASS',j=>j.scene=773,
  j=>j.scenes.length=775,j=>j.nodes.length=13506,
  j=>j.scenes[773].name='other scene773',
  j=>j.scenes[773].extras.sourceGLBSHA256='wrong',
  j=>j.scenes[773].extras.repairGeometryNew=true,
  j=>j.scenes[773].extras.sourceLinksOutputSHA=S.glbSha256,
  j=>j.scenes[773].extras.physicalHostVerified=true,
  j=>j.scenes[773].nodes.reverse(),
  j=>j.scenes[773].nodes.pop(),
  j=>j.scenes[769].nodes.reverse(),
  j=>j.scenes[773].nodes.push(S.historicalDefectiveRoot),
  j=>j.nodes[S.addedRoot].mesh=S.historicalDefectiveMesh,
  j=>j.nodes[S.addedRoot].extras.unmeasuredHost=false,
  j=>j.nodes[S.addedRoot].extras.sourceLinksVerified=true,
  j=>j.meshes[S.repairMesh].name='not-cow',
 ]) {const j=fixture();mutate(j);assert.equal(good(j),false);}
});
test('root fingerprint rejects invalid non-integers',()=>{
 for(const arr of [null,[-1],[1.1],[Number.MAX_SAFE_INTEGER+1]])
  assert.equal(fnv(arr),null);
});
const raw=process.env.R31_JAMB_773775_ORIGINAL_GLB;
test('optional RAW SHA authenticated GLB and all three scene roots',{skip:!raw},()=>{
 const buf=readFileSync(raw);
 assert.equal(buf.length,S.glbBytes);
 assert.equal(createHash('sha256').update(buf).digest('hex'),S.glbSha256);
 assert.equal(buf.toString('ascii',0,4),'glTF');
 assert.equal(buf.toString('ascii',16,20),'JSON');
 const len=buf.readUInt32LE(12);
 const gltf=JSON.parse(buf.subarray(20,20+len).toString());
 for(const v of Object.values(S.views)) assert.equal(good(gltf,v.index),true);
});
