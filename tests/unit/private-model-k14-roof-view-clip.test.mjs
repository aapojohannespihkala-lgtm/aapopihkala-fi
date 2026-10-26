import test from 'node:test';
import assert from 'node:assert/strict';
import {
  R4E_K14_SOURCE_LOCK, K14_EIGHT_UNRESOLVED, deriveK14RoofViewClip,
} from '../../src/scripts/privateModelK14RoofViewClip.mjs';

const model = () => ({
  zipSha256: R4E_K14_SOURCE_LOCK.zipSha256,
  glbSha256: R4E_K14_SOURCE_LOCK.glbSha256, sceneIndex: 32,
});
const source = () => ({
  nodeIndex: 2764, objectKey: 'sha-bound-K14-D-roof-2764',
  apartmentScope: 'D', storeyScope: 'UNKNOWN', role: 'UNCLASSIFIED',
  phaseScope: 'ACTIVE_IN_SELECTED_WORKTEST', k14SourceStatus: 'HOLD_STOREY_ROLE',
});
const permit = () => ({
  status: 'SOURCE_APPROVED_X_BAND', zipSha256: R4E_K14_SOURCE_LOCK.zipSha256,
  nodeIndex: 2764, sourceObjectKey: 'sha-bound-K14-D-roof-2764',
  apartmentSijId: 'SIJ033', boundarySijId: 'SIJ062',
  sourceDocIds: [
    'DOC:1etsXWpaOUnY8cI9E6anaiqTifO_IXnY3b12CbjHV0TU',
    'DOC:1wSF0UmWRf7mhtwr-mTDugJNJoAZmH82Wys6V-D4yeYI',
  ],
  purpose: 'VIEW_ONLY_NOT_AS_BUILT',
  minX: -0.60, maxX: 6.375,
});
const matrix = [
  0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 4, 5, 6, 1,
];
const fixture = () => ({
  view: 'D_BOTH', model: model(), source: source(), sliceProof: permit(),
  matrixReference: 'G1_LOCAL_TO_WORLD', g1LocalToWorld: [...matrix],
});
const world = (m, [x,y,z]) => [
  m[0]*x+m[4]*y+m[8]*z+m[12],
  m[1]*x+m[5]*y+m[9]*z+m[13],
  m[2]*x+m[6]*y+m[10]*z+m[14],
];
const distance = (plane, point) =>
  plane.normal.reduce((sum,n,i) => sum+n*point[i], plane.constant);
const approx = (a,b) => assert.ok(Math.abs(a-b)<1e-9, `${a} vs ${b}`);
const reject = (x, reason) => {
  const q = deriveK14RoofViewClip(x);
  assert.equal(q.ok, false);
  assert.equal(q.status, 'K14_HOLD');
  assert.equal(q.reason, reason);
  assert.deepEqual(q.planes, []);
  assert.equal(q.canApplyToViewer, false);
  assert.equal(q.canPublish, false);
};

test('R4E 8 HOLD source cannot silently reveal roof in D_BOTH', () => {
  const x=fixture();delete x.sliceProof;
  reject(x,'K14_EIGHT_HOLD_SOURCE_GATE');
  assert.deepEqual(K14_EIGHT_UNRESOLVED,[2762,2763,2764,2765,2784,2785,2786,2787]);
});
test('WHOLE preserves original; D floors hide upper roof without any D-band guess', () => {
  for(const view of ['WHOLE','D_1F','D_2F']){
    const x=fixture();delete x.sliceProof;x.view=view;
    const q=deriveK14RoofViewClip(x);
    assert.equal(q.ok,true);
    assert.deepEqual(q.planes,[]);
    assert.equal(q.canApplyToViewer,false);
    assert.equal(q.status,view==='WHOLE'?'WHOLE_UNCHANGED':'D_FLOOR_ROOF_HIDDEN');
  }
});
test('two local X clip planes become WORLD Z planes after verified rotated root', () => {
  const x=fixture(),q=deriveK14RoofViewClip(x);
  assert.equal(q.ok,true);
  assert.equal(q.planes.length,2);
  assert.equal(q.status,'STAGING_ONLY_SOURCE_APPROVAL_NOT_INDEPENDENTLY_ATTESTED');
  assert.equal(q.needsExternalProofVerification,true);
  assert.deepEqual(q.referenceLocalBandX,[-.6,6.375]);
  const [lo,hi]=q.planes;
  for(const p of [[-.6,0,2],[6.375,4,8]]) {
    const w=world(x.g1LocalToWorld,p);
    if(p[0]===-.6) approx(distance(lo,w),0);
    if(p[0]===6.375) approx(distance(hi,w),0);
  }
  for(const p of [[0,0,0],[2,2,5],[6,0,-3]]) {
    const w=world(x.g1LocalToWorld,p);
    // Three.js clips NEGATIVE signed distances. Both planes must keep the
    // interior on their nonnegative side, including after a root transform.
    assert.ok(distance(lo,w)>0);
    assert.ok(distance(hi,w)>0);
  }
  assert.ok(distance(lo,world(matrix,[-.7,0,0]))<0);
  assert.ok(distance(hi,world(matrix,[6.45,0,0]))<0);
  assert.equal(q.keepSourceVisible,false);
  assert.equal(q.canApplyToViewer,false);
  assert.equal(q.canPublish,false);
});
test('nonuniform scale and shear preserve local-X band, not a world axis heuristic', () => {
  const x=fixture();x.g1LocalToWorld=[2,1,0,0,1,3,0,0,0,0,2,0,4,-3,7,1];
  const q=deriveK14RoofViewClip(x);assert.equal(q.ok,true);
  const [lo,hi]=q.planes;
  for(const xG1 of [-1,0,3,6.4]) {
    const w=world(x.g1LocalToWorld,[xG1,8,4]);
    assert.equal(distance(lo,w)<-1e-9,xG1<-.6);
    assert.equal(distance(hi,w)<-1e-9,xG1>6.375);
  }
});
test('mirrored local X axis preserves the clipped side', () => {
  const x=fixture();x.g1LocalToWorld=[-1,0,0,0,0,2,0,0,0,0,1,0,12,3,7,1];
  const q=deriveK14RoofViewClip(x);assert.equal(q.ok,true);
  assert.ok(distance(q.planes[0],world(x.g1LocalToWorld,[-1,0,0]))<0);
  assert.ok(distance(q.planes[0],world(x.g1LocalToWorld,[0,0,0]))>0);
  assert.ok(distance(q.planes[1],world(x.g1LocalToWorld,[7,0,0]))<0);
});
test('invalid model hash, scene, or source identity fail closed', () => {
  for(const [edit,code] of [
    [x=>x.model.zipSha256='0'.repeat(64),'SELECTED_MODEL_SHA_MISMATCH'],
    [x=>x.model.glbSha256='0'.repeat(64),'SELECTED_MODEL_SHA_MISMATCH'],
    [x=>x.model.sceneIndex=33,'SELECTED_MODEL_SHA_MISMATCH'],
    [x=>x.source.nodeIndex=2765,'K14_ROOF_SOURCE_IDENTITY_NOT_VERIFIED'],
    [x=>x.source.objectKey='','K14_ROOF_SOURCE_IDENTITY_NOT_VERIFIED'],
    [x=>x.source.role='UPPER_OCCLUDER','K14_ROOF_SOURCE_IDENTITY_NOT_VERIFIED'],
    [x=>x.source.storeyScope='ROOF','K14_ROOF_SOURCE_IDENTITY_NOT_VERIFIED'],
    [x=>x.source.phaseScope='HISTORICAL','K14_ROOF_SOURCE_IDENTITY_NOT_VERIFIED'],
  ]) {const x=fixture();edit(x);reject(x,code);}
});
test('fabricated/mismatched slice-proof document, object, purpose or scope fails', () => {
  for(const edit of [
    x=>x.sliceProof.status='INFERRED_FROM_NODE_NAME',
    x=>x.sliceProof.zipSha256='0'.repeat(64),
    x=>x.sliceProof.sourceObjectKey='different',
    x=>x.sliceProof.nodeIndex=2765,
    x=>x.sliceProof.apartmentSijId='SIJ032',
    x=>x.sliceProof.boundarySijId='SIJ041',
    x=>x.sliceProof.purpose='AS_BUILT',
    x=>x.sliceProof.sourceDocIds.pop(),
  ]) {const x=fixture();edit(x);reject(x,'K14_EIGHT_HOLD_SOURCE_GATE');}
});
test('unsupported or guessed physical band is rejected; exact boundary remains a source decision', () => {
  for(const [l,r] of [[-1,6.375],[.5,6.375],[-.6,6],[-.6,6.6],[6.375,6.375],[NaN,6.375],[0,Infinity]]) {
    const x=fixture();x.sliceProof.minX=l;x.sliceProof.maxX=r;
    reject(x,'K14_SOURCE_BAND_OUTSIDE_REFERENCE');
  }
});
test('bad/unknown G1 coordinate transform never exposes roof', () => {
  for(const [edit,reason] of [
    [x=>x.matrixReference='WORLD_Y_ASSUMED','G1_TRANSFORM_NOT_VERIFIED'],
    [x=>x.g1LocalToWorld=[1,2,3],'G1_TRANSFORM_SINGULAR_OR_INVALID'],
    [x=>x.g1LocalToWorld[3]=.2,'G1_TRANSFORM_SINGULAR_OR_INVALID'],
    [x=>x.g1LocalToWorld[5]=NaN,'G1_TRANSFORM_SINGULAR_OR_INVALID'],
    [x=>{x.g1LocalToWorld[0]=0;x.g1LocalToWorld[1]=0;x.g1LocalToWorld[2]=0;},'G1_TRANSFORM_SINGULAR_OR_INVALID'],
  ]) {const x=fixture();edit(x);reject(x,reason);}
});
test('planning result does not mutate materials, model scopes, approval or world matrix',()=>{
  const x=fixture();const before=JSON.stringify(x);
  const a=deriveK14RoofViewClip(x),b=deriveK14RoofViewClip(x);
  assert.deepEqual(a,b);assert.equal(JSON.stringify(x),before);
  assert.equal(a.canApplyToViewer,false);assert.equal(a.physicalRoofVerified,false);
});
test('invalid or missing arguments fail closed',()=>{
  reject(null,'INVALID_INPUT');
  reject({},'INVALID_VIEW');
  const x=fixture();x.view='D_3F';reject(x,'INVALID_VIEW');
});
