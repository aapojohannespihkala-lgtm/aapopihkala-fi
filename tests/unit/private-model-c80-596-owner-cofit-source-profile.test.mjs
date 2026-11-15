import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {inflateSync} from 'node:zlib';
import {C80596_GLB_SHA256,C80596_GEOMETRY_EQUIVALENT_DIFFERENT_SHA,
 C80596_GLB_BYTES,C80596_SCENES,isC80596ExactSourceScene,
 c80596RootFnv32,resolveC80596SourceScene,c80596SourceReceipt} from
 '../../src/scripts/privateModelC80596OwnerCofitSourceProfile.mjs';
const rootZip='eNrtm12u3SgQhDfkBzd/DWuJsv9tTNVHHm6kjJQZXSmTSb+UsKEMNHRRPkf+8mWN/j4ncj6n7ffZOZYhDdtwBNMVMwzN0J/W2vvkUuPZ2njWmPmsnul7wH7ynOOHhprs+awzgWVIwzYcwXqftXoYmrjqSECpG8YTLcYUdjcaIc5Q9wJfHvenZ2tcGvrK9og8fG8ZqN2u6OqAUau/eKf60og1HPclWho0pq0JCLbG/oahGbphGBypdxnSQDtPNF6DGWFGmBFmhBmhjrbimK0RRw1rnuHSdsmP2s0x64ZhmAZN6XVHedzRCkbewQFOcIFeNU1Ocx0GxWQp/AJfbvextH7bS7yOh7s9SK/unoxAFUdNzuv5vppltKb4nzieSL+9eyA8LH1T8Y7XIVVRN/vSbLu3U9d8BMPAZXodu4uapMA1h0tFcypAfWmSEV4F9bOY5WKWi1kuZrkSvG2OMVnPZHQMZybchJtwE27CTbgJd8PdcDfcDXfD3XA33A13w91wD9wD98A9cA/cA/fAPXAP3GPuel8wQEL4dnCAE1xgghuEG3ADbsANuAE34AbcgBtwA26D2+A2uA1ug9vgNrgNLmuxGtwOl13gTDXCZScuduJiJyqvQLgd7oA74A64A+6AO+FOuBPuhDvhTrgT7oQ74W5z1/uCAeLEt4MDnOACEywQbsANuAE34AbcgBtwA27ADbgNboPb4Da4DW6D2+A2uMRiNbgdLnngq2qESy4ucnGRi7pZINwOd8AdcAfcAXfAHXAH3AF3wB1wJ9wJd8KdcJWbulDpnNbv6PZadGWw2wkWuI32mjBA7RSLPH3Juem9Y1obglwJYhxEN4hK4P3A44HHdd8RpyDT+8ndABtoq9JeE5qbzmDh5iZ4zbQNQvqdkVEBOh6xnSXCABvYwTM6Qd/T2PQ70rEPl32346H7C3cw3xkpWXtB7F+0k/46mGCBGy8xx94QNpB97U+dxaPNuSI/mNscESGeGfTM+PJ8ZJcgNEtyW8v63YFm4O5Y87tGBMuQj6SavnJLP52Muoav+9xS3gksycvz0k+D+tQKq6d0f/hVGEnLj1X6HbH2T90PQRn0rJSNKRtj2VlWnYUady/gpNMboXmE9E2ueVrBrDfbcrOtNtsJlI5ROkTpCAnS4HdRaZTb90d+84jCXo6EYBo4in4qVEpty4hel2UZngZaaSiDH5/X+jvRGOt11+J7+zHafoxS7lRfudUNw9CImG/T5mbto5BfX5eTy6jcRMcmo1/3QMcmo+c1PS/TOneTW8zMxZxEyROVTlQ6UenM048bUWnugTDBAlkBlU5UOlHpRKUTlU5UOlHpRKUTlU5UOvcJFlwyN8bJ+oE2gNy5zh3tA50Y6AT3ph91GczkDnXUog80ZqAxA+6EO+FOuBPuhDvhTrgT7oQ74aI9Tn3pibU0eNcDZQ6UOVDOQC0DhYzFmgvNW8kLy8oZaE/LH2pSoQ3VT3uBqM7AP07sKGyrfbQHPcADvKpqow3z3H5GfVIho7z976SCQBtikcYLzVjYuVALdmxEpA3ms/JRi1ud3ur0Vqe3Or3V6WdUp7f2+q1rL73Z49Zb/9d6q72f/vX361XaT34tflvP/dSXI2/V99+Pv1j/ff+92T/le/Mfa8pvv0PtsR99jd6K81act+K8FeetOG/F+cdXnLfWvLXmrTX/Xmu+x+en1jx15604b8V5K85bcd6K81act+L8zxXnrSNvHfkn1ZHMSeYUc4o5xZxi5cKGmr9vxenj5C05b8l5S85bct6S85ac92/1W6LeEvX+rf6vJeeXvwB+fFh6';
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
  g.nodes[id]={mesh,extras:{sourceC80542Node:donor,originalNodeIndex:old,
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
