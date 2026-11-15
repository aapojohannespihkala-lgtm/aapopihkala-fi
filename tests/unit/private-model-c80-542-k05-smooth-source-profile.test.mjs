import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
  C80_542_K05_SMOOTH as SOURCE,
  K05_REJECTED_OLD_GLB_SHA256 as OLD,
  C80_542_K05_SCENES as SCENES,
  K05_BLACK_RECESS_NODES as RECESS,
  K05_PHOTO_HANDLE_NODES as PHOTO,
  c80542K05Fnv32 as fnv,
  c80542K05RootDelta as roots,
  c80542K05Reachable as reachable,
  isC80542K05SmoothSourceScene as valid,
  c80542K05SmoothReceipt as receipt,
} from '../../src/scripts/privateModelC80542K05SmoothSourceProfile.mjs';

test('K05 smooth owner version is distinct from both uncorrected 536 GLBs',()=>{
  assert.equal(SOURCE.glbBytes,55698080);
  assert.equal(SOURCE.zipDriveId,'1-QAFBIt4QnPsNwfnbLryp03zlI39Gjmq');
  assert.equal(SOURCE.stage,'WORK_TEST_HOST_HOLD');
  assert.equal(SOURCE.glbSha256.length,64);
  assert.equal(SOURCE.zipSha256.length,64);
  for(const old of OLD)assert.notEqual(SOURCE.glbSha256,old);
  assert.deepEqual(Object.keys(SCENES).map(Number),[536,537,538,539,540,541]);
  assert.deepEqual(RECESS,[12199,12200,12201,12205,12206,12207]);
  assert.equal(PHOTO.length,9);
});
test('K05 opt-in scene roots change only the PHOTO wrapper',()=>{
  const parent=[2,12222,9197,9198,3],fixed=[2,12258,9197,9198,3];
  assert.equal(roots(parent,fixed,true),true);
  assert.equal(roots(parent,parent,false),true);
  assert.equal(roots(parent,fixed,false),false);
  assert.equal(roots(parent,parent,true),false);
  assert.equal(roots(parent,[2,12258,9198,3],true),false);
  assert.equal(roots([12222,12222],fixed,true),false);
  assert.equal(fnv([]),'811c9dc5');
  assert.notEqual(fnv(parent),fnv(fixed));
  assert.equal(fnv(['12222']),null);
});
test('K05 black inlays must not be reachable in the corrected branch',()=>{
  const nodes=Array.from({length:18},()=>({children:[]}));
  nodes[1].children=[2,3,4,5,6,7,8];
  nodes[9].children=[2,3,4,5,6,7,8,10];
  let old=reachable(nodes,[1]),corrected=reachable(nodes,[9]);
  assert.equal(old.has(8),true);
  assert.equal(corrected.has(10),true);
  assert.equal(reachable(nodes,[99]),null);
  nodes[9].children=[10,17];
  corrected=reachable(nodes,[9]);
  for(const id of [2,3,4,5,6,7,8])assert.equal(corrected.has(id),false);
  assert.equal(corrected.has(10),true);
});
test('wrong SHA, wrong floor, unverified statuses or missing source fail closed',()=>{
  assert.equal(valid(null,SOURCE.glbSha256,537,'2F'),false);
  assert.equal(valid({scenes:[]},OLD[0],537,'2F'),false);
  assert.equal(valid({scene:292,scenes:[]},SOURCE.glbSha256,537,'2F'),false);
  assert.equal(valid({scene:292,scenes:[]},SOURCE.glbSha256,999,'2F'),false);
  const r=receipt(null,SOURCE.glbSha256,537,'2F');
  assert.equal(r.exactSource,false);
  assert.equal(r.sourceOnly,true);
  assert.equal(r.viewerMounted,false);
  assert.equal(r.sourceLinksBound,false);
  assert.equal(r.publishAllowed,false);
  assert.equal(r.current,false);
  assert.equal(r.asBuilt,false);
  assert.equal(r.physicalHardwareVerified,false);
  assert.equal(r.productionWebGLVerified,false);
  assert.equal(r.humanReview,'NOT_RUN');
});
test('optional authentic 55.7 MB K05 smooth GLB: six source-exact scenes and falsification',t=>{
  const path=process.env.C80_542_K05_SMOOTH_GLB_PATH;
  if(!path)return t.skip('Original 55.7MB private GLB not available in CI');
  const bin=readFileSync(path);
  assert.equal(bin.byteLength,SOURCE.glbBytes);
  assert.equal(createHash('sha256').update(bin).digest('hex'),SOURCE.glbSha256);
  assert.equal(bin.toString('utf8',0,4),'glTF');
  assert.equal(bin.readUInt32LE(8),bin.length);
  assert.equal(bin.toString('utf8',16,20),'JSON');
  const len=bin.readUInt32LE(12);
  const json=JSON.parse(bin.subarray(20,20+len).toString('utf8'));
  for(const spec of Object.values(SCENES)){
    assert.equal(valid(json,SOURCE.glbSha256,spec.index,spec.floor),true);
    assert.equal(valid(json,OLD[0],spec.index,spec.floor),false);
    assert.equal(valid(json,SOURCE.glbSha256,spec.index,'WRONG'),false);
    assert.equal(receipt(json,SOURCE.glbSha256,spec.index,spec.floor).publishAllowed,false);
    const reversed=structuredClone(json);
    reversed.scenes[spec.index].nodes.reverse();
    assert.equal(valid(reversed,SOURCE.glbSha256,spec.index,spec.floor),false);
    if(spec.index!==536){
      const rogue=structuredClone(json);
      rogue.nodes[12255].children.push(RECESS[0]);
      assert.equal(valid(rogue,SOURCE.glbSha256,spec.index,spec.floor),false);
      const fake=structuredClone(json);
      fake.scenes[spec.index].extras.current=true;
      assert.equal(valid(fake,SOURCE.glbSha256,spec.index,spec.floor),false);
    }
  }
});