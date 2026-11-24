import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
  C80_536_WW74_GLB_SHA256 as SOURCE_SHA,
  C80_536_WW74_PARENT_GLB_SHA256 as PARENT_SHA,
} from '../../src/scripts/privateModelC80536WW74SiteGradeSourceProfile.mjs';
import {
  c80536WW74EvidenceForNode as nodeEvidence,
  createC80536WW74SelectionEvidenceResolver as resolver,
} from '../../src/scripts/privateModelC80536WW74SelectionEvidence.mjs';

function syntheticEvidence(){
  const nodes=new Array(12258).fill(null);
  nodes[12228]={name:'M5_INTEGRATION_CLAUDE_WW_D1F_TO_SITE_SEWER_L150_WORK_TEST_HOST_HOLD',children:[12225,12226,12227]};
  nodes[12227]={name:'WW74_SITE150_SOURCE_EXACT_TO_STREET_DRAIN_WORK_TEST_HOST_HOLD',mesh:4603};
  nodes[12257]={name:'M5_WW74_BUILDING_TO_1974_SITE_DESIGN_GRADE_WORK_TEST_HOST_HOLD',
    children:[12225,12226,12255,12256],extras:{
      sourceParentNode:12228,oldSiteNode12227ExcludedFromNewScenes:true,oldRootStillExists:true,
      openEnds:1,m5System:'VIEMARI',stage:'WORK_TEST_HOST_HOLD',sourceGLBSHA256:PARENT_SHA,
      current:false,asBuilt:false,sourceLinksBound:false,physicalRouteVerified:false,
    }};
  nodes[12255]={name:'WW74_SITE150_1974_1815_TO_1790_TRANSLATED_WORK_TEST_HOST_HOLD',
    mesh:4603,translation:[0,-2.4,0],extras:{
      sourceNode:12227,sourceMesh:4603,sourceGeometryPositionIndexExact:true,
      sourceGLBSHA256:PARENT_SHA,transformOnlyVerticalShiftM:-2.4,
      referenceLevelLocalZ0M:21.75,crossSourceDatum:'UNVERIFIED',
      '1974UpstreamDesignInvertM':18.15,'1974StreetDesignInvertM':17.9,
      streetConnection:'NOT_PHYSICALLY_VERIFIED',workAssumption:true,m5System:'VIEMARI',
      current:false,asBuilt:false,sourceLinksBound:false,physicalRouteVerified:false,
    }};
  nodes[12256]={name:'WW74_BUILDING_END_VERTICAL_DROP_2400MM_WORK_ASSUMPTION_NO_WELL_HOST',
    mesh:4621,extras:{sourceNode:12226,centerlineDropM:2.4,sourceGLBSHA256:PARENT_SHA,
      physicalWellOrDropChamber:'NOT_VERIFIED',workAssumption:true,m5System:'VIEMARI',
      current:false,asBuilt:false,sourceLinksBound:false}};
  return {nodes};
}
test('1974 source labels require verified WW74 grade node evidence',()=>{
  const json=syntheticEvidence();
  const rows=nodeEvidence(json,12255);
  assert.equal(rows.length,4);
  assert.match(rows[0][1],/WORK_TEST/);
  assert.match(rows[1][1],/18,15 m -> 17,90 m/);
  assert.deepEqual(rows[2],['Fyysinen katuliitos','NOT_VERIFIED']);
  assert.deepEqual(rows[3],['Nykytila / as-built','EI VARMENNETTU']);
  assert.equal(nodeEvidence(json,12256).length,5);
  assert.equal(nodeEvidence(json,12257).length,4);
  assert.deepEqual(nodeEvidence(json,12227),[]);
  json.nodes[12255].extras.current=true;
  assert.deepEqual(nodeEvidence(json,12255),[],'forged current state denied');
  json.nodes[12255].extras.current=false;
  json.nodes[12256].extras.physicalWellOrDropChamber='VERIFIED';
  assert.deepEqual(nodeEvidence(json,12255),[],'forged installation denied');
  json.nodes[12256].extras.physicalWellOrDropChamber='NOT_VERIFIED';
  json.nodes[12255].translation=[0,-1.9,0];
  assert.deepEqual(nodeEvidence(json,12255),[],'different vertical drop denied');
});
test('selection resolver must fail closed before source SHA and mounted association proof',()=>{
  const json=syntheticEvidence(),scenes=Array.from({length:536},()=>({}));
  const root=scenes[532],selected={parent:root};
  const associations=new Map([[selected,{nodes:12255}]]);
  const gltf={parser:{json,associations},scenes};
  for(const sha of ['',PARENT_SHA,'f'.repeat(64),undefined]){
    assert.deepEqual(resolver(gltf,sha)(selected,root),[],'forged SHA denied');
  }
  assert.deepEqual(resolver(gltf,SOURCE_SHA)(selected,root),[],
    'synthetic/unchecked 536-scene JSON must not impersonate original source');
  assert.deepEqual(resolver({scenes,parser:{json}},SOURCE_SHA)(selected,root),[],
    'no parser association map denied');
  assert.deepEqual(resolver({scenes:[],parser:{json,associations}},SOURCE_SHA)(selected,root),[],
    'wrong source scene count denied');
});
test('current index routes WW74 evidence through selection metadata without adding sourceLinks',()=>{
  const source=readFileSync('src/pages/private-model/index.astro','utf8');
  assert.match(source,/createC80536WW74SelectionEvidenceResolver/);
  assert.match(source,/resolveWW74HistoricalEvidence\(object, modelRoot\.children\[0\] \?\? null\)/);
  assert.match(source,/sourceNodeModel\(gltf\)/);
});
const filename=process.env.C80_536_WW74_GLB_PATH;
const binary=filename?readFileSync(filename):null;
const sha=binary?createHash('sha256').update(binary).digest('hex'):null;
const json=binary?.toString('ascii',0,4)==='glTF'
  ?JSON.parse(binary.subarray(20,20+binary.readUInt32LE(12)).toString('utf8')):null;
test('optional authentic C80 536 scene532 source association and selection',
  {skip:!json},()=>{
    assert.equal(sha,SOURCE_SHA,'complete inner GLB SHA');
    const scenes=Array.from({length:536},()=>({}));
    const mounted=scenes[532],selected={parent:mounted};
    const associations=new Map([[selected,{nodes:12255}]]);
    const gltf={scenes,parser:{json,associations}};
    const select=resolver(gltf,sha);
    assert.equal(select(selected,mounted).length,4);
    assert.deepEqual(select(selected,scenes[531]),[],'2F cannot claim 1F route');
    assert.deepEqual(select({name:selected.name,parent:mounted},mounted),[],
      'same-name unassociated helper denied');
    const detached={parent:null};
    associations.set(detached,{nodes:12255});
    assert.deepEqual(select(detached,mounted),[],'unmounted donor denied');
    selected.parent=scenes[531];
    assert.deepEqual(select(selected,mounted),[],'source object moved to another scene denied');
    selected.parent=mounted;
    json.nodes[12255].extras.current=true;
    assert.deepEqual(select(selected,mounted),[],'mutated source claim denied');
    json.nodes[12255].extras.current=false;
    assert.equal(select(selected,mounted).length,4,'exact source recovered');
  });
