import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {inflateSync} from 'node:zlib';
import {
 C80_WPD_K16K18_GLB_SHA256,C80_WPD_K16K18_GLB_BYTES,
 C80_WPD_K16K18_SOURCE_ONLY,C80_WPD_K16K18_SCENES,
 isC80WpdK16K18SourceScene,resolveC80WpdK16K18SceneIndex,
 c80WpdK16K18SourceReceipt
} from '../../src/scripts/privateModelC80542K16K18SourceProfile.mjs';

const parentRootBytes='eNrtmU2uXSkMhDd0Bsf82azlKfvfRld9ZJC00uqk9QZphUmJCxQY2xQ+uh8fa/T32ZHz2a3ep3IsQxrKsAXTAzMMzdCf1tr75NLk2dp41pj5rJ7pPqCe3Ht70dCUms/aE1iGNJRhC9b7rNXD0MTVRgJa3TCeaDFE7kswQpSh3QWijO3ttLTMkuUr2yPucN8yMFoe6Fofo7VdvFNbyWBZ461ES4NMKtkvKJn+hqEZumEY7Kh3GdLAPJ8zXoMZYUaYEWaEGaGNSm7M1nCjzJp7uFVuealqdlk3DMM06EivN8rtjVZgeQcHOMEFOmg6nM46DPLJkvcF/lneYyl85QivbXPLRjq4NbFAA1tT9uvzvjpltCb379g+SD+72xAWS3fK3/HapWqq0yHaXVubeVC+6uVekRTI7qaOKRgGfmrOlIv60jEjHAfttDjn4pyLcy7OuRI8c7YxiWhiHwbNhJtwE27CTbgJN+EW3IJbcAtuwS24BbfgFtyCu+FuuBvuhrvhbrgb7oa74W5z1/uCAeLEt4MDnOACEywQbsANuAE34AbcgBtwA27ADbgNboPb4Da4DW6D2+A2uMRiNbgdLnngq2qESy4ucnGRi7pZINwOd8AdcAfcAXfAHXAH3AF3wB1wJ9wJd8KdcJWbulDpnNbv6PZadGWw2wkWuI32mjBA7RSLPH3Juem9Y1obglwJYhxEN4hK4P3A44HHdd8RpyDT+8ndABtoq9JeE5qbzmDh5iZ4zbQNQvqdkVEBOh6xnSXCABvYwTM6Qd/T2PQ70rEPl32346H7C3cw3xkpWXtB7F+0k/46mGCBGy8xx94QNpB97U+dxaPNuSI/mNscESGeGfTM+PJ8ZJcgNEtyW8v63YFm4O5Y87tGBMuQj6SavnJLP52Muoav+9xS3gksycvz0k+D+tQKq6d0f/hVGEnLj1X6HbH2T90PQRn0rJSNKRtj2VlWnYUady/gpNMboXmE9E2ueVrBrDfbcrOtNtsJlI5ROkTpCAnS4HdRaZTb90d+84jCXo6EYBo4in4qVEpty4hel2UZngZaaSiDH5/X+jvRGOt11+J7+zHafoxS7lRfudUNw9CImG/T5mbto5BfX5eTy6jcRMcmo1/3QMcmo+c1PS/TOneTW8zMxZxEyROVTlQ6UenM048bUWnugTDBAlkBlU5UOlHpRKUTlU5UOlHpRKUTlU5UOvcJFlwyN8bJ+oE2gNy5zh3tA50Y6AT3ph91GczkDnXUog80ZqAxA+6EO+FOuBPuhDvhTrgT7oQ74aI9Tn3pibU0eNcDZQ6UOVDOQC0DhYzFmgvNW8kLy8oZaE/LH2pSoQ3VT3uBqM7AP07sKGyrfbQHPcADvKpqow3z3H5GfVIho7z976SCQBtikcYLzVjYuVALdmxEpA3ms/JRi1ud3ur0Vqe3Or3V6WdUp7f2+q1rL73Z49Zb/9d6q72f/vX361XaT34tflvP/dSXI2/V99+Pv1j/ff+92T/le/Mfa8pvv0PtsR99jd6K81act+K8FeetOG/F+cdXnLfWvLXmrTX/Xmu+x+en1jx15604b8V5K85bcd6K81act+L8zxXnrSNvHfkn1ZHMSeYUc4o5xZxi5cKGmr9vxenj5C05b8l5S85bct6S85ac92/1W6LeEvX+rf6vJeeXvwB+fFh6';
const floors=['1F','2F','BOTH','BOTH','BOTH','BOTH'];
const sourceRoots=JSON.parse(inflateSync(Buffer.from(parentRootBytes,'base64')).toString('utf8'));
assert.equal(sourceRoots.length,6);
const sceneMeta=(floor,sourceSceneIndex)=>({
 floor,sourceSceneIndex,stage:'WORK_TEST_HOST_HOLD',
 sourceLinksBindingVerified:false,sourceLinksBound:false,current:false,
 physicalHiddenRouteVerified:false,productionWebGLVerified:false,
 humanReviewApproved:false,asBuilt:false
});
const joinMeta=(parentScene,active)=>({
 stage:'WORK_TEST_HOST_HOLD',parentScene,K18DonorScene:parentScene,
 parentGLBSHA256:'5e2f0c561ac3db0cc1c6f171a14e50dc311ccccb89a28e69478bdef3fee805c3',
 K18DonorGLBSHA256:'118653c608ea3139007dfd4a2f51d6d81311eb93f425e4c032b1235c0f8a430b',
 originalC80530GLBSHA256:'1a99cc32c80e1b87bbefcf9e6f373af42aee7e72ede574eabafe375298fd9f9e',
 K16CorrectedSourceNodes:active?[9382,9384]:[],
 K16CorrectedNodes:active?[12255,12256]:[],
 K18OriginalSourceNode:active?11309:null,K18CorrectedNode:active?12257:null,
 K18WallTrianglesOmitted:active?8:0,K18HolePatchTrianglesPreserved:active?10:0,
 K18SlabEdgeTrianglesPreserved:active?10:0,
 sourceLinksBound:false,current:false,asBuilt:false,
 physicalHostVerified:false,productionWebGLVerified:false,
 humanReview:'NOT_RUN',publishAllowed:false
});
function mock(){
 const g={
 scene:292,asset:{extras:{ModelStage:'WORK_TEST',Canonical:false,
    current:false,asBuilt:false,HUMAN_REVIEW:'NOT_RUN'}},
 scenes:Array.from({length:542},()=>({})),
 nodes:Array(12258).fill(null),meshes:Array(4624).fill(null),
 accessors:Array(10411).fill(null),bufferViews:Array(10415).fill(null),
 buffers:[{byteLength:32988972}]
 };
 g.nodes[9382]={mesh:3332}; g.nodes[9383]={mesh:3333};
 g.nodes[9384]={mesh:3334};g.nodes[11309]={mesh:4199};
 for(const [id,source,sourceMesh,meshId,position,name] of [
  [12255,9382,3332,4621,10408,'K16_CORRECTED_V48_D1F_700_WEST_JAMB_X2620_2820'],
  [12256,9384,3334,4622,10409,'K16_CORRECTED_V48_D1F_700_OPENING_HEAD_ABOVE_Y2090']
 ]){
  g.nodes[id]={name,mesh:meshId,extras:{
    originalNodeIndex:source,originalMeshIndex:sourceMesh,
    sourceFaceTemplateNodeIndex:9383,
    repairedDamagedVertexCount:12,stage:'WORK_TEST_NONCURRENT',
    ownerCorrection:'K16_20261115_DOOR_FACE_SPIKE_REPAIR',
    physicalHostVerified:false,sourceLinksBound:false,current:false,asBuilt:false
  }};
  g.meshes[meshId]={primitives:[{attributes:{POSITION:position,NORMAL:6325},
    indices:6326,material:333,mode:4}]};
  g.accessors[position]={componentType:5126,count:24,type:'VEC3',
    bufferView:id===12255?10412:10413,
    min:[2.62,0,-5.0945],max:[3.52,2.762,-5.0295]};
 }
 g.nodes[12257]={mesh:4623,name:
   'K16_K18_COFIT_WP_D_K18_STAIR_V86_PRESERVE_HOLE_FILL_AND_SLAB_EDGE_DELETE_EXTRANEOUS_UNDERSTAIR_WALL',
   extras:{stage:'WORK_TEST_HOST_HOLD',sourceNodeIndex:11309,sourceMeshIndex:4199,
     preservedPatchTriangles:10,preservedSlabEdgeTriangles:10,
     excludedUnderstairWallTriangles:8,sourceLinksBound:false,current:false,
     asBuilt:false,productionWebGLVerified:false,HUMAN_REVIEW:'NOT_RUN'}};
 g.meshes[4623]={primitives:[{attributes:{POSITION:9129},indices:10410,material:333}],
   extras:{originalMeshIndex:4199,preservedTriangles:20,removedTriangles:8,notAsBuilt:true}};
 g.accessors[10410]={bufferView:10414,componentType:5125,
   count:60,type:'SCALAR',min:[0],max:[55]};
 g.bufferViews[10414]={byteOffset:32988732,byteLength:240,target:34963};
 for(let n=0;n<6;n++){
  const old=sourceRoots[n],active=n!==1,src=530+n,dst=536+n,srcBase=524+n;
  g.scenes[src]={name:'C80_536_K16_DOOR_HEAD_WESTJAMB_RECTIFIED_FROM_530_SCENE_'+srcBase+'_WORK_TEST_HOST_HOLD',
    nodes:[...old],extras:sceneMeta(floors[n],srcBase)};
  g.scenes[dst]={name:'C80_542_WPD_K16_DOOR_K18_STAIR_COFIT_FROM_C80_536_SCENE_'+src+'_'+floors[n]+'_WORK_TEST_HOST_HOLD',
    nodes:active?old.map(i=>i===11309?12257:i):[...old],
    extras:{...sceneMeta(floors[n],src),cofitK16K18:joinMeta(src,active)}};
 }
 return g;
}
const accept=(g,i=538,floor=null)=>isC80WpdK16K18SourceScene(g,C80_WPD_K16K18_GLB_SHA256,i,floor);
test('authentic-source-derived six K16+K18 cofit receipts',()=>{
 const g=mock();
 assert.equal(C80_WPD_K16K18_SOURCE_ONLY,true);
 assert.equal(Object.keys(C80_WPD_K16K18_SCENES).length,6);
 for(let i=536;i<=541;i++){
  assert.equal(accept(g,i,C80_WPD_K16K18_SCENES[i].floor),true,'scene '+i);
  assert.equal(resolveC80WpdK16K18SceneIndex(C80_WPD_K16K18_GLB_SHA256,i-6,C80_WPD_K16K18_SCENES[i].floor),i);
 }
 assert.equal(resolveC80WpdK16K18SceneIndex('0'.repeat(64),532,'BOTH'),null);
 assert.equal(resolveC80WpdK16K18SceneIndex(C80_WPD_K16K18_GLB_SHA256,542,'BOTH'),null);
 assert.equal(accept(g,538,'1F'),false);
 assert.equal(isC80WpdK16K18SourceScene(g,'0'.repeat(64),538),false);
 assert.deepEqual(c80WpdK16K18SourceReceipt(g,C80_WPD_K16K18_GLB_SHA256,538),
   {exactSource:true,sourceLinksBound:false,publishAllowed:false,current:false,
    asBuilt:false,productionWebGLVerified:false,humanReview:'NOT_RUN',physicalHostVerified:false});
});
test('K16+K18 wrong scene, donor, geometry, user-approval and bindings fail closed',()=>{
 const edits=[
  g=>{g.scenes[538].nodes[0]=11309;},
  g=>{g.scenes[536].nodes.pop();},
  g=>{g.scenes[531].nodes[0]=11309;},
  g=>{g.scenes[537].nodes.push(12257);},
  g=>{g.scenes[540].extras.floor='2F';},
  g=>{g.scenes[536].extras.cofitK16K18.K18DonorScene=531;},
  g=>{g.scenes[536].extras.cofitK16K18.sourceLinksBound=true;},
  g=>{g.scenes[538].extras.productionWebGLVerified=true;},
  g=>{g.scenes[538].extras.cofitK16K18.physicalHostVerified=true;},
  g=>{g.scenes[538].extras.cofitK16K18.K18WallTrianglesOmitted=0;},
  g=>{g.asset.extras.asBuilt=true;},
  g=>{g.nodes[12255].extras.ownerCorrection='fake';},
  g=>{g.nodes[12257].extras.sourceMeshIndex=0;},
  g=>{g.nodes[11309].mesh=4623;},
  g=>{g.meshes[4623].extras.removedTriangles=0;},
  g=>{g.meshes[4621].primitives[0].material=0;},
  g=>{g.accessors[10410].count=84;},
  g=>{g.bufferViews[10414].byteLength=336;},
  g=>{g.buffers[0].byteLength=0;}
 ];
 for(let i=0;i<edits.length;i++){const g=mock();edits[i](g);
   assert.equal(accept(g),false,'mutation '+i);}
});
test('real 55MB authenticated GLB optional, never counted when absent',{
 skip:!process.env.C80_542_K16K18_GLB_PATH
},()=>{
 const bytes=readFileSync(process.env.C80_542_K16K18_GLB_PATH);
 assert.equal(bytes.length,C80_WPD_K16K18_GLB_BYTES);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),C80_WPD_K16K18_GLB_SHA256);
 assert.equal(bytes.toString('ascii',0,4),'glTF');
 const len=bytes.readUInt32LE(12);
 const j=JSON.parse(bytes.subarray(20,20+len).toString('utf8'));
 for(let i=536;i<=541;i++)assert.equal(accept(j,i),true,'real '+i);
 j.scenes[538].extras.cofitK16K18.sourceLinksBound=true;
 assert.equal(accept(j),false);
});
