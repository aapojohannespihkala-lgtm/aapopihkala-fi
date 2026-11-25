import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { receiveR34Ilp4K5Wpt2 as receive, noUnverifiedR34Ilp4Approvals as approvalSafe } from '../../src/scripts/privateModelR34Ilp4K5Wpt2SourceGate.mjs';

test('inherited P186/HIST2015 and ILP4 metadata cannot assert unreviewed approvals',()=>{
  const baseline={
    current:false,asBuilt:false,sourceLinksBound:false,productionWebGLVerified:false,
    physicalHostVerified:false,structuralCutVerified:false,physicalConnectionsVerified:0,
    humanReview:'NOT_RUN',r34HistoricalImport:{sourceLinksBoundForOutputSHA:false},
  };
  assert.equal(approvalSafe(baseline),true);
  assert.equal(approvalSafe({...baseline,humanReview:'HOLD'}),true);
  assert.equal(approvalSafe(null),false);
  const unsupported=[
    'sourceLinksBound','sourceLinksBoundNewSHA','sourceLinksBoundToNewSHA',
    'sourceLinksBoundForNewSHA','physicalCable','physicalRouteVerified',
    'physicalCableRouteVerified','electricalCircuitVerified','physicalHostVerified',
    'physicalVerified','structuralCutVerified','productionWebGLVerified',
    'humanReviewVerified','current','asBuilt',
  ];
  for(const flag of unsupported)
    assert.equal(approvalSafe({...baseline,[flag]:true}),false,flag);
  assert.equal(approvalSafe({...baseline,physicalConnectionsVerified:1}),false);
  assert.equal(approvalSafe({...baseline,humanReview:'APPROVED'}),false);
  assert.equal(approvalSafe({...baseline,r34HistoricalImport:{sourceLinksBoundForOutputSHA:true}}),false);
});

test('ILP4 combined receipt rejects absent, malformed or non-BOTH input',()=>{
  assert.equal(receive(null,null,'BOTH'),null);
  assert.equal(receive(Buffer.alloc(12),Buffer.alloc(12),'BOTH'),null);
  assert.equal(receive(null,null,'2F'),null);
  assert.equal(receive(null,null,'BOTH','true'),null);
});
const receiver=process.env.R34_ILP4_K5_WPT2_RECEIVER_GLB;
const cofit=process.env.R34_ILP4_K5_WPT2_COFIT_GLB;
test('exact private GLBs: append-only ILP4 receipt and fail-closed source identity',{skip:!receiver||!cofit},()=>{
  const a=readFileSync(receiver), b=readFileSync(cofit);
  const clean=receive(a,b,'BOTH',false), hist=receive(a,b,'BOTH',true);
  assert.equal(clean?.scene,868); assert.equal(hist?.scene,869);
  for(const receipt of [clean,hist]) {
    for(const key of ['geometryChanged','sourceLinksBound','productionWebGLVerified','physicalHostVerified','current','asBuilt']) assert.equal(receipt[key],false);
    assert.equal(receipt.humanReview,'NOT_RUN');
  }
  assert.equal(receive(a,b,'1F'),null);
  assert.equal(receive(a,b,'2F',true),null);
  assert.equal(receive(b,a,'BOTH'),null);
  assert.equal(receive(a,a,'BOTH'),null);
  b[b.length-1]^=1; assert.equal(receive(a,b,'BOTH'),null); b[b.length-1]^=1;
  a[a.length-1]^=1; assert.equal(receive(a,b,'BOTH'),null);
});
