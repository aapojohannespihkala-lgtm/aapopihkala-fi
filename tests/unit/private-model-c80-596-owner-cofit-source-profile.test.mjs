import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {inflateSync} from 'node:zlib';
import {C80596_GLB_SHA256,C80596_GEOMETRY_EQUIVALENT_DIFFERENT_SHA,
 C80596_GLB_BYTES,C80596_SCENES,isC80596ExactSourceScene,
 c80596RootFnv32,resolveC80596SourceScene,c80596SourceReceipt} from
 '../../src/scripts/privateModelC80596OwnerCofitSourceProfile.mjs';
const rootZip='eNrtm12u3SgQhDfkBzd/DWuJsv9tTNVHHm6kjJQZXSmTSb+UsKEMNHRRPkf+8mWN/j4ncj6n7ffZOZYhDdtwBNMVMwzN0J/W2vvkUuPZ2njWmPmsnul7wH7ynOOHhprs+awzgWVIwzYcwXqftXoYmrjqSECpG8YTLcYUdjcaIc5Q9wJfHvenZ2tcGvrK9og8fG8ZqN2u6OqAUau/eKf60og1HPclWho0pq0JCLbG/oahGbphGBypdxnSQDtPNF6DGWFGmBFmhBmhjrbimK0RRw1rnuHSdsmP2s0x64ZhmAZN6XVHedzRCkbewQFOcIFeNU1Ocx0GxWQp/AJfbvextH7bS7yOh7s9SK/unoxAFUdNzuv5vppltKb4nzieSL+9eyA8LH1T8Y7XIVVRN/vSbLu3U9d8BMPAZXodu4uapMA1h0tFcypAfWmSEV4F9bOY5WKWi1kuZrkSvG2OMVnPZHQMZybchJtwE27CTbgJd8PdcDfcDXfD3XA33A13w91wD9wD98A9cA/cA/fAPXAP3GPuel8wQEL4dnCAE1xgghuEG3ADbsANuAE34AbcgBtwA26D2+A2uA1ug9vgNrgNLmuxGtwOl13gTDXCZScuduJiJyqvQLgd7oA74A64A+6AO+AOuAPugDvgTrgT7oQ74WpnKp3SO1rX0R216Nq/Lie4wWN01IQBqqdwgoRy122m+45pZQj2SrDGweoGqxJEP4h4646Ish1tcsRb63fvBthAjyodNaG56R0shOuoRXoMQt/fXqHYXok43h/CABvYwVs7QfKT8Z8AL5cej1dCeQt30N57UXL2gox8UU7u74sJbvAQH9o4DsIGLmYdzMK16JIiYG7zWgiJiddSsjG/Pl+yS4+bpbitZd1Gyy3C4+qZxb6rRrAM+Uiiubdd0qW3oRLw9T2XtOMEluLldukjQfdUCqum9H74NBhJyaeUoi2QFE9lhmAbdJxsD2Z7MBacZb1ZqHD3A7zddDaoHYv5Jgme1i4rzbHQHOvM8dZJr1F6idIrJEiDD0RtoDzOHMXNNZKg7ZUQTANT0aWWSpvaAqJTZVl+p4FSGrbBh85r3Z2oi3W66+Hn+BA6PoRS4dS97VI3DIP7b+T+IafO1cZvp8rdxejbRMEmtd/6QMEmtfcUvSfSullJ/tJy0SbR8ESfE31O9Dnz3ieM6DMZIExwgzwBfU70OdHnRJ8TfU70OdHnRJ8TfU70Oc9dLLjs3Bh31w9UASTnOtnZBwoxUAjypl9dGbQkhzo60QfqMlCXAXfCnXAn3EkeuC8h2bDI10WW+PwSOsNakkOOT3CeB+d5oMmBJgeaGehkoI1hyyNE7VZytjrykYHqtPyhGm20YfdbRnWY+x6oGuq4vcqxz9Ue9IAIcJ6qjDbMm/3UMtMXn/ZONHWiEMw61i0zwjtr+mqsRRvEhGd2dLRffY0lzShzWua0zGmZ0zKnn2BOy4D9pw2YDu5Rput3NV3t/cSXv39u0n7yZfGjnfupF0dOqe9fH3/a/n3/otk/5UXzby3lxxfQfn74GlqGswxnGc4ynGU4y3CW4fxgOMtqltUsq0nLG+drNa/tLMNZhrMMZxnOMpxlOMtwfobhLBtZNvL/biNpk7TZtNm02bTZPHnT+56/h+H01LIcZznOcpzlOMtxluOs/9TLoZZDrf/U6yfOMpy/yHB6tdhmvZflLMv5Ky2n9uCob4zqG6Oy4/WNUX1jVN8YlT0te1r2tOzpn2dPy4LVL6Jlu+oX0fpFtCxnWc6ynGU5y3KW5SzLWWazzGaZzfrOqCxnWc6ynGU5y3KW5awvjcpIlpGsL43qS6PynOU5y3OW5yzPWf+sl0ctj1r/rP8bz/n1L30LsAU=';
const roots=JSON.parse(inflateSync(Buffer.from(rootZip,'base64')).toString('utf8'));
const floors=['1F','2F','BOTH','BOTH','BOTH','BOTH'];
function mock() {
 const g={scene:292,asset:{extras:{ModelStage:'WORK_TEST',Canonical:false,
    asBuilt:false,HUMAN_REVIEW:'NOT_RUN'}},scenes:Array(596).fill(null),
    nodes:Array(12335).fill(null),meshes:Array(4635).fill(null),
    accessors:Array(10434).fill(null),bufferViews:Array(10440).fill(null),
    buffers:[{byteLength:33606952}]};
 g.nodes[12329]={children:[12320,12321,12323,12324,12325,12326,12327,12328]};
 g.nodes[12330]={translation:[5.05,5.032,1.48]};
 g.nodes[12331]={children:[6350,6355,12330]};
 for(const [id,old,donor] of [[12332,9382,12255],[12333,9384,12256],[12334,11309,12257]]) {
  const mesh=id-12332+4632;
  g.nodes[id]={mesh,extras:{sourceC80542Node:donor,originalNodeIndex:old,sourceNodeIndex:old,
    sourceLinksBound:false,asBuilt:false,current:false,
    donorC80542GLBSHA256:'283f4447eb7ba9ac2135569d9cb8557530a83bd2df6c6a5ecbf5434bccc2c260',
    baseC80590GLBSHA256:'ff044811bf0f6277c3268c90dd134d73d7ce286b3946a6bab85d94a627e61dd9',
    C80596Stage:'WORK_TEST_HOST_HOLD'}};
  g.meshes[mesh]={primitives:[{material:333,indices:id===12334?10433:6326,
    attributes:id===12334?{POSITION:9129}:{POSITION:10431+id-12332,NORMAL:6325}}]};
  g.accessors[10431+id-12332]={count:id===12334?60:24};
 }
 for(let i=0;i<6;i++){
  const active=i!==1,root=roots[i],cofitRoot=roots[6+i],floor=floors[i];
  g.scenes[584+i]={nodes:root,extras:{stage:'WORK_TEST_HOST_HOLD',floor}};
  g.scenes[590+i]={nodes:cofitRoot,extras:{
    stage:'WORK_TEST_HOST_HOLD',floor,sourceLinksBound:false,
    sourceLinksBoundNewSHA:false,current:false,asBuilt:false,
    HUMAN_REVIEW:'NOT_RUN',productionWebGLVerified:false,
    K09ControlsRoot:active?12329:null,Themo3CopyRoot:active?12331:null,
    bathThemoXMetres:active?5.05:null,
    switchAndThemoSameVerticalX:active,K12Tile100Active:active,
    C80596K16K18Cofit:{
      parentSceneIndex:584+i,donorSceneIndex:536+i,
      sourceParentGLBSHA256:'ff044811bf0f6277c3268c90dd134d73d7ce286b3946a6bab85d94a627e61dd9',
      donorC80542GLBSHA256:'283f4447eb7ba9ac2135569d9cb8557530a83bd2df6c6a5ecbf5434bccc2c260',
      activeCorrection:active,sourceLinksBoundNewSHA:false,CURRENT:false,asBuilt:false,
      humanReview:'NOT_RUN',productionWebGL:'NOT_RUN',
      K16Replacements:active?[12332,12333]:[],K18Replacement:active?12334:null,
      K18PreservedHoleAndSlabTriangles:active?20:0,K18RemovedWallTriangles:active?8:0,
      K09FrameX:active?5.05:null,bathThemoX:active?5.05:null
    }
  }};
 }
 return g;
}
test('six exact rooted C80 596 opt-in scenes, no publishing',()=>{
 const g=mock();
 assert.equal(Object.keys(C80596_SCENES).length,6);
 for(let i=590;i<596;i++){
  assert.equal(isC80596ExactSourceScene(g,C80596_GLB_SHA256,i,floors[i-590]),true,'scene '+i);
  assert.equal(resolveC80596SourceScene(C80596_GLB_SHA256,i-6,floors[i-590]),i);
 }
 assert.equal(c80596RootFnv32([0,1]),'1076963a');
 assert.deepEqual(c80596SourceReceipt(g,C80596_GLB_SHA256,592),
   {exactSource:true,sourceLinksBound:false,publishAllowed:false,current:false,
    asBuilt:false,productionWebGLVerified:false,humanReview:'NOT_RUN',physicalHostVerified:false});
});
test('second 596 version SHA, wrong stage, roles, K09/Themo and replaced nodes rejected',()=>{
 const g=mock(),sha=C80596_GLB_SHA256;
 assert.equal(isC80596ExactSourceScene(g,C80596_GEOMETRY_EQUIVALENT_DIFFERENT_SHA,592),false);
 assert.equal(resolveC80596SourceScene(C80596_GEOMETRY_EQUIVALENT_DIFFERENT_SHA,586,'BOTH'),null);
 const mutations=[
  x=>x.scenes[592].nodes[0]=11309,
  x=>x.scenes[590].extras.C80596K16K18Cofit.activeCorrection=false,
  x=>x.scenes[591].nodes.push(12334),
  x=>x.scenes[590].extras.sourceLinksBoundNewSHA=true,
  x=>x.scenes[592].extras.K09ControlsRoot=0,
  x=>x.nodes[12330].translation[0]=4.88,
  x=>x.nodes[12334].extras.asBuilt=true,
  x=>x.meshes[4634].primitives[0].indices=0,
  x=>x.scenes[592].extras.C80596K16K18Cofit.K18RemovedWallTriangles=0,
  x=>x.asset.extras.Canonical=true,
  x=>x.buffers[0].byteLength=0
 ];
 for(let n=0;n<mutations.length;n++){const v=mock();mutations[n](v);
  assert.equal(isC80596ExactSourceScene(v,sha,592),false,'tamper '+n);}
 assert.equal(isC80596ExactSourceScene(g,sha,592,'2F'),false);
 assert.equal(resolveC80596SourceScene(sha,596,'BOTH'),null);
});
test('original 56MB GLB optional, never treated as CI fixture PASS when missing',{
 skip:!process.env.C80596_GLB_PATH},()=>{
 const bytes=readFileSync(process.env.C80596_GLB_PATH);
 assert.equal(bytes.length,C80596_GLB_BYTES);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),C80596_GLB_SHA256);
 assert.equal(bytes.toString('ascii',0,4),'glTF');
 const len=bytes.readUInt32LE(12);
 const g=JSON.parse(bytes.subarray(20,20+len).toString('utf8'));
 for(let i=590;i<596;i++) assert.equal(isC80596ExactSourceScene(g,C80596_GLB_SHA256,i),true,'original scene '+i);
});
