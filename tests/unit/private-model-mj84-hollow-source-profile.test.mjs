import test from 'node:test';
import assert from 'node:assert/strict';
import {inflateSync} from 'node:zlib';
import {
  MJ84_HOLLOW_SOURCE_SHA256, MJ84_HOLLOW_PARENT_SHA256, MJ84_HOLLOW_OLD_SHA256,
  MJ84_HOLLOW_V2_SHA256, MJ84_HOLLOW_SCENES, MJ84_HOLLOW_FLOORS,
  MJ84_HOLLOW_SCENE_COUNT, MJ84_HOLLOW_NODE_COUNT, MJ84_HOLLOW_MESH_COUNT,
  MJ84_HOLLOW_DEFAULT_SCENE, MJ84_HOLLOW_BASE_FLOORS,
  MJ84_HOLLOW_COMPONENTS, MJ84_HOLLOW_FORK_ROOT,
  MJ84_HOLLOW_WC_CEILING, MJ84_HOLLOW_HISTORIC_DISABLED,
  mj84HollowRootFnv32, isMJ84HollowSourceScene,
} from '../../src/scripts/privateModelMJ84HollowSourceProfile.mjs';

// Source-native ordered roots, zlib/base64 snapshots extracted from inner GLB
// SHA 55dd33c8..., not the ZIP SHA nor parent MJ84 scene 356/357.
const ROOTS=Object.freeze({
  358:'eNotksGRQCEIQxvyICoQatnZ/tvYJH8vbxAIIPrTN2udShAVq941jnBX7My7+jJClNAr77EPsnisMyuBLZ+sm0KtOaW83qqVsmJh78tjq37bekIKtSqjBQizChoGGibrCcybeSpFX3G0ajavvpujNiNirknWJp7gI0ef/YQUfGwBwhDsInGT4M1pDac9T0jBF+IxhgGwCybYJdQvpoQWIAyT9yayvUROctlhJkKg1dwpfZB1hScct5dmMkROTv33FEyOmPgqpunofw+YI9Y2w1TNcmY5s5yjrmR7cx2mV9Cf37vsNMtsE6YrwFpYC2thLayFtbAW1sJaWDvfi1k73+qpjTO64+VTkfwC5DXfNsM85jWd+dIss03XedamtWltWpvWprVpbVqb1qa1aW1Zq01G3jSVWeeZ8pTnqffZ0pZr8gfILke1PVJ9O8zTZpjHlB/6y6EvKJapSeAucBd4Qmh7gaOofrP4/ZBthnk8Sfz+AQfOxnI=',
  359:'eNotlskR3DAQAxPSg8Njjlhczj8NA73+oLgUWyTngPZP3rO+iXrf7F5f101LWdoykucHLyzbcr699/oqtfjtfb+8r748VZ5D+quZ8UtDS/p9OQ9JS1naMpJc36tzvswTlq0XaDcJo2O530xoyUm95YawqxNIRNzxlnq9jqbTZ+1P6PVcWnjafuA9OLi2jPW0kw6tE3knYWXRsVp3kLSOv8KyLcdyLQ7WSktZWOe7xrKYCBNhIkyEidBGrVDW3oRSx3pzPWqP/KreDtuxXMuz6ErLG9V4owxOftCLPjRRJ06X012vRTFJZUDin+09UilsZznHx20f0gnuxwn0YLRklu+7fMvlC8b4Hue3uc/Bu8qTCncsR1RDTTpDc1xQR9eRXAs//XTCcix+MH6gK85TeE7qihHOgbZJ7pjcMbljcscs9LdmrEU2i8NxGpUTCluwBVuwBVuwDduwDduwDduwDduwDduwAzuwAzuwAzuwAzuwAztmcy00UCK4DnrRhyZaaKOwARuwARuwARuwARuwARuwG3bDbtgNu2E37IbdsOQiN+yBpQjcpVZY6jCpw6QO1VUo7IG9sBf2wl7YC3thL+yFvbAX9sE+2Af7YOUKaqZyPet3HEctjqrX40IbHaujJg2UlY5RXMc93CoRzyeTev7ZI4K6CfIdZDrIa5CnIB9BDoIcBDkIchDOQR150Lb97Ex71UG2hVqxvR09kXi1ilu2xFx7pJ8Ovspuec4jxVli+0mvK9ug5jQKO4U87toBbzGyOZc90z73VA+StshC24dpH8Ztlu6yxHmOX+Agyw+1rkh8UdbljnV/jdtr3F3jINUsW9ayZS1+lsXfAQWphnop+qCPHU7t10tVJ3kWLqSfof7o1i5tw5fxPEtayoIZ2W2XHefRWP48HO2gb0RYNKq00diqSmGSXMtmezNDOQ3pHRrkPRr20bD/3/ubp9l/n4yf/eavCClXViZrCssq7Kiwo8KOqn7zxA87KuyosKPCjgo7KuyosKPCjgo7KuyosKPCjgo7KuyosKOaX5Zg5xdul+SeXxNcSp5WOOilIS4NQeGfXxtdVl5ahFY4l2a6vOfCPtgH+2Af7IN9sA/2wT7YB0tjuebVTIe2s2kEFhRYUGARgS0EVhDJO8f2FUmLp6MX/qjrk2Gj04djoYFulKeHeW5d/ohIGRdraH0yEmQhiHw0sWpO1Zsx73H5WhNlntM2p21u2ljF2OSlv/FGD3pRbrSoQOxqsKvBqAajGqxF/x3+/gMi/OlY',
});
const roots=(n)=>JSON.parse(inflateSync(Buffer.from(ROOTS[n],'base64')).toString('utf8'));
const links=[
  {docId:'DOC:13JgMhHVCFqHjR0PP-J6KDWZOnz6GkIl5UZoaozbA7IA'},
  {docId:'DOC:1gb4mEwhOgxIkgxH9kXOecUxjs8eN7XF9'},
];
function fixture() {
  const nodes=Array.from({length:MJ84_HOLLOW_NODE_COUNT},()=>({}));
  for(const c of Object.values(MJ84_HOLLOW_COMPONENTS)) nodes[c.node]={
    name:c.name,mesh:c.mesh,extras:{asBuilt:false,physicalConnectionVerified:false},
  };
  nodes[11919].extras={physicalConnectionVerified:false,physicalJunctionOpenVerified:false,sourceLinks:links,asBuilt:false};
  nodes[11921].extras={
    sourceGLBSHA256:MJ84_HOLLOW_PARENT_SHA256,
    hollowBoreLocalVerified:true,throughOpenEndcapsLocalVerified:true,
    entireSystemContinuityVerified:false,junctionOpenVerified:false,
    hostCavityVerified:false,physicalConnectionVerified:false,
    designDiameterAssumption_mm:125,wallThicknessIllustrative_m:0.0015,
    sourceLinks:links,
  };
  nodes[MJ84_HOLLOW_FORK_ROOT]={
    children:[11919,10104,...MJ84_HOLLOW_WC_CEILING],
    extras:{sourceLinks:links,physicalConnectionVerified:false},
  };
  const scenes=Array.from({length:MJ84_HOLLOW_SCENE_COUNT},()=>({name:'historic',nodes:[]}));
  for(const [id,p] of Object.entries(MJ84_HOLLOW_SCENES)) scenes[id]={
    name:p.name,nodes:roots(id),
    extras:{
      verificationStage:'WORK_TEST_HOST_HOLD',physicalConnectionVerified:false,
      ductInternalBoreOpenVerified:false,verifiedAirflowLps:null,
      ownerG1XYZ:[5.004,5.494,5.195],sourceLinks:links,
      sourceRoot:p.priorSourceRoot,COWRoot:p.priorCowRoot,
      MJ84SourceRootUpdate:{fromGLBSHA256:MJ84_HOLLOW_OLD_SHA256,
        fromScene:p.ownerScene,modelStage:'WORK_TEST_HOST_HOLD'},
      MJ84SemanticIndexCorrection:{sourceGLBSHA256:MJ84_HOLLOW_V2_SHA256,
        sourceScene:p.historyScene,replacementCorrectSceneRoot:11920,
        replacementForkGeometryNode:11919,NO_PHYSICAL_FLOW_CLAIM:true,
        badReferencesRemovedFromClone:{sourceDuctNode:11655,sourceOutlets:[11637,11640]}},
      MJ84HollowSleeve:{parentGLBSHA256:MJ84_HOLLOW_PARENT_SHA256,
        parentSceneIndex:p.priorScene,newNode:11921,
        oldSingleSurfaceNodeInactiveOnlyHere:11915,localAnnulusThroughBore:true,
        closedEndcap:false,globalNetworkThroughBore:'NOT_VERIFIED',
        stage:'WORK_TEST_HOST_HOLD',productionWebGL:'NOT_RUN',humanReview:'NOT_RUN'},
    },
  };
  return {scene:MJ84_HOLLOW_DEFAULT_SCENE,scenes,nodes,
    meshes:Array.from({length:MJ84_HOLLOW_MESH_COUNT},()=>({})),
    asset:{extras:{current:false,canonical:false,asBuilt:false,ModelStage:'WORK_TEST',
      viewerFloorScenes:{...MJ84_HOLLOW_BASE_FLOORS}}}};
}
test('MJ84 raw GLB roots match source-locked 2F/BOTH (not old PR1935)',()=>{
  const j=fixture();
  for(const [floor,s] of Object.entries(MJ84_HOLLOW_FLOORS)){
    assert.equal(j.scenes[s].nodes.length,MJ84_HOLLOW_SCENES[s].count);
    assert.equal(mj84HollowRootFnv32(j.scenes[s].nodes),MJ84_HOLLOW_SCENES[s].fnv);
    assert.equal(isMJ84HollowSourceScene(j,MJ84_HOLLOW_SOURCE_SHA256,s,floor),true);
  }
  assert.equal(isMJ84HollowSourceScene(j,MJ84_HOLLOW_SOURCE_SHA256,352),false);
  assert.equal(isMJ84HollowSourceScene(j,MJ84_HOLLOW_OLD_SHA256,358),false);
});
test('fail closed on non-exact bytes, scene, ancestry, geometry or old KSO/T',()=>{
  const j=fixture();
  assert.equal(isMJ84HollowSourceScene(j,'0'.repeat(64),358),false);
  assert.equal(isMJ84HollowSourceScene(j,MJ84_HOLLOW_SOURCE_SHA256,359,'2F'),false);
  let x=structuredClone(j);x.scenes[358].nodes.reverse();
  assert.equal(isMJ84HollowSourceScene(x,MJ84_HOLLOW_SOURCE_SHA256,358),false);
  x=structuredClone(j);x.scenes[359].extras.MJ84HollowSleeve.parentGLBSHA256='0'.repeat(64);
  assert.equal(isMJ84HollowSourceScene(x,MJ84_HOLLOW_SOURCE_SHA256,359),false);
  x=structuredClone(j);x.nodes[11920].children.push(11656);
  assert.equal(isMJ84HollowSourceScene(x,MJ84_HOLLOW_SOURCE_SHA256,358),false);
  x=structuredClone(j);x.nodes[11920].children.push(10122);
  assert.equal(isMJ84HollowSourceScene(x,MJ84_HOLLOW_SOURCE_SHA256,359),false);
  x=structuredClone(j);x.nodes[11920].children.push(11915);
  assert.equal(isMJ84HollowSourceScene(x,MJ84_HOLLOW_SOURCE_SHA256,359),false);
});
test('2026 owner KSO and WC separate, no false physical IV->waste connection',()=>{
  const j=fixture();
  let x=structuredClone(j);x.nodes[11919].extras.sourceDuctNode=11655;
  assert.equal(isMJ84HollowSourceScene(x,MJ84_HOLLOW_SOURCE_SHA256,358),false);
  x=structuredClone(j);x.nodes[11919].extras.sourceOutlets=[11637,11640];
  assert.equal(isMJ84HollowSourceScene(x,MJ84_HOLLOW_SOURCE_SHA256,359),false);
  x=structuredClone(j);x.nodes[11921].extras.entireSystemContinuityVerified=true;
  assert.equal(isMJ84HollowSourceScene(x,MJ84_HOLLOW_SOURCE_SHA256,358),false);
  x=structuredClone(j);x.nodes[11921].extras.throughOpenEndcapsLocalVerified=false;
  assert.equal(isMJ84HollowSourceScene(x,MJ84_HOLLOW_SOURCE_SHA256,359),false);
  x=structuredClone(j);x.nodes[11920].extras.sourceLinks=[];
  assert.equal(isMJ84HollowSourceScene(x,MJ84_HOLLOW_SOURCE_SHA256,358),false);
  x=structuredClone(j);x.nodes[11920].children=x.nodes[11920].children.filter(i=>i!==11620);
  assert.equal(isMJ84HollowSourceScene(x,MJ84_HOLLOW_SOURCE_SHA256,358),false);
  x=structuredClone(j);x.asset.extras.asBuilt=true;
  assert.equal(isMJ84HollowSourceScene(x,MJ84_HOLLOW_SOURCE_SHA256,359),false);
  x=structuredClone(j);x.scenes[358].extras.ownerG1XYZ[0]=5;
  assert.equal(isMJ84HollowSourceScene(x,MJ84_HOLLOW_SOURCE_SHA256,358),false);
});
