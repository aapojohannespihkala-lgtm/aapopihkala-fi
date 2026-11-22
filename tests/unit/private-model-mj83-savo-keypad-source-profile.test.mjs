import test from 'node:test';
import assert from 'node:assert/strict';
import {inflateSync} from 'node:zlib';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 MJ83_KEYPAD_GLB_SHA256 as SHA,MJ83_KEYPAD_GLB_BYTES as BYTES,
 MJ83_KEYPAD_ZIP_SHA256,MJ83_KEYPAD_ZIP_DRIVE_ID,
 MJ83_KEYPAD_PARENT_GLB_SHA256 as PARENT,MJ83_KEYPAD_PARENT_ZIP_DRIVE_ID as PARENT_ZIP,
 MJ83_KEYPAD_SCENES as SCENES,MJ83_KEYPAD_OWNER_POINT_G1 as POINT,
 isMJ83SavoKeypadSourceScene as valid,
 resolveMJ83SavoKeypadSourceSceneIndex as choose,
 mj83KeypadRootFnv32 as fnv,
} from '../../src/scripts/privateModelMJ83SavoKeypadSourceProfile.mjs';

// Three exact root arrays extracted from the SHA-verified embedded GLB, not
// from the zip's __sceneN suffix or a guessed building-scene index.
const rootLists=JSON.parse(inflateSync(Buffer.from('eNrtlkGOICcMRe/S61pgwMbkKtGcJMrd8/+rVkuRJovZZaTePFEUH1wG/+Kvj3Xq448/z8p6ZmULFU/tBaaxnhiZ6zlLb4QyzpNr0tdu6bHmfbJ7uM+tlUY9d5bHneG50q14eoylx+P5D61tpFFPZRyjjftUO5h2MFnb0Lh7t6dSXym0Olq8zhoK9eiNmc9NzS1sg0eFfsc20uDxGG1cQavEDJ7PVZxzG2nwKXqMqxet+T1QneGl4tI6RhtXo8cQ8pA/BbE0+b0RhlpH6VRfu7WMbWj90cuam2EqaOnfXdDgCH+rZ0zI2881GvK2BgzoOYuRxchijFcVD0k7ASd8+0njSVjwwIbM0GgbbaNttI220TbaRttoG+19NwvtRXuljXn9jUu7JGr3xQX3gAEnXJCRO2HBA5lno020iTbRJtpEm2gTbaJNtIm20DqTkSuhR9bc0D1FPLXftrXFnFX0O2+iVzwB54EBJ3R/+wCLb7ugY2jmb+ZvYmvnLdonIXyETfXPQTZ8vBSnd1A99PvbdVwv7QV56zjF8tuIH4/84MgPVKo6u+GqmdrkPsqscIw2VAIn/UITC9NYz5xT9V8anHO6pJXO0ozuA64rSkNnJme7kBOUcYw2VM1Xia9y6Zfq5sgKDFrL2C4jlf6yHWz7xJ72mGnnul5NMysqBV72iVRAx1VwXATHXtfeFG2SY34LxiazbEFeqbxPgiJqhS+0izqMaSxjG86TvWBqLwTG+TPDDuCKn674GVaEFWFFaKFWFnUGyKLCSrmXWu2Wp1JVKWPLsG9d+5asRgaqt8dWM98i/zSIDbGG9RqH90wfp2/dhnJSSr7gx/YaOqXd3uC6DrcdpPe2kwj04mrItWcLZWBx/o4Vn76kgR5ts53YiDOqpjq9Q3f5LC19jmAvbB799toG9YmCX9hNl900lR79Sl7Lw9owLP8DTL6x+MbC/uodg/1haompJdEkpkZJjMTU8jVWTC0xtcTUElNLTC0xtcTUElNLTC0xtcTUElNLTC0xtcTUElPLi5Z/Ul60F+1Fe9Fea2sMGJAMjgU3TIiJD0zcBS+iDbSBNtAG2kAbaANtoA20gXainWgn2ol2op1oJ9qJlr0ofkLFH7c4BK5SEy3nsDiHxTksfmm10C60G+1Gu9FutBvtRrvRbrQb7UabaPlBulJNtHIFFdPxecbgB9aODS9sco3394K1B9Ye/BYCUz/YIWcu+ZnwIw3OSrDHwe4GuxJkP8h4kPEg40HGwxn/vlj9ry9W+iHv78vU73qZsnP95BrFcRW94il2uWgfxngX4ry7f7hekZkmhvdK9asXsWvvFt/2hAtyHcOFXBU/v6yNryvbtS/HJZJLDJfV7/660KnNbP6L/Nrlzm1nbLr2xNfrDvP0ywOZs5ntMv6i9bkSi0ti65L47/X/c2W+9Y3OV8y//wGFWdvL','base64')).toString());
const clone=o=>structuredClone(o);
function fixture(){
 const nodes=Array.from({length:12112},()=>({}));
 nodes[12110]={name:'MJ83_SAVO_I7603_OWNERPHOTO05_CONTROL_DECAL_AT_SCREEN_POINT_XPOS_20261114',mesh:4540,
  matrix:[6.123233995736766e-17,0,-1,0,0,1,0,0,1,0,6.123233995736766e-17,0,7.568999999999999,0,0.4690000000000003,1],
  extras:{stage:'WORK_TEST_HOST_HOLD',kind:'PHOTO_DERIVED_TRANSPARENT_CURVED_KEYPAD_DECAL',current:false,asBuilt:false,
   sourceGlbSha256:PARENT,sourceLinks:[{url:'https://drive.google.com/file/d/1FNCe2RX7cj1XEf8qiwHTF9imaA6WqB7u/view',role:'OWNER_2026_11_01_ACTUAL_DEVICE_PHOTO'}]}};
 nodes[12111]={name:'MJ83_SAVO_I7603_KEYPAD_PHOTO05_OWNER_POINT_CORRECTED_COMPONENT_ROOT',children:[12110],
  extras:{stage:'WORK_TEST_HOST_HOLD',current:false,asBuilt:false,sourceGlbSha256:PARENT,
   ownerPointG1:[...POINT],sourceSceneRefs:[369,370],surface:'source photo-textured 3D mesh; no duplicate raised keys'}};
 const scenes=Array.from({length:379},()=>({nodes:[]}));
 for(const [i,s] of Object.entries(SCENES))scenes[i]={name:s.name,nodes:[...rootLists[i]],
  extras:{stage:'WORK_TEST_HOST_HOLD',current:false,asBuilt:false,humanReview:'NOT_RUN',productionWebGL:'NOT_RUN',physicalConnectionsVerified:0,
   sourceSceneIndex:s.parent,...(i==='378'?{}:{sourceGlbSha256:PARENT,sourceZipDriveId:PARENT_ZIP,ownerPointG1:[...POINT]})}};
 const meshes=Array.from({length:4556},()=>({}));
 meshes[4540]={name:'SAVO_IH7603W_REAL_OWNERPHOTO_VERTICAL_CONTROLS_REPOSITIONED_LOWER_BODY_20261111'};
 return {scene:292,scenes,nodes,meshes,asset:{extras:{ModelStage:'WORK_TEST',current:false,asBuilt:false,HUMAN_REVIEW:'NOT_RUN'}}};
}
const entries=[[376,'2F'],[377,'BOTH'],[378,'FOCUS']];
test('source identity: exactly three authored opt-in internal scenes, not filename index',()=>{
 assert.equal(BYTES,54066016);
 assert.equal(SHA,'dafe740cd1f0fd4bf483b2fac35edefd617adc20cf4404e23bf451976363bf56');
 assert.match(MJ83_KEYPAD_ZIP_SHA256,/^[a-f0-9]{64}$/);
 assert.equal(MJ83_KEYPAD_ZIP_DRIVE_ID,'1RAVTbylCZwQKB0siLZnr0i_NcGwF5v9K');
 assert.deepEqual(Object.keys(SCENES).map(Number),entries.map(e=>e[0]));
 for(const [i,floor] of entries){
  assert.equal(choose(SHA,floor),i);
  assert.equal(fnv(rootLists[i]),SCENES[i].fnv);
 }
});
test('valid real-source shaped 2F/BOTH/FOCUS fixtures accepted and noncurrent',()=>{
 const g=fixture();
 for(const [i,floor] of entries){
  assert.equal(valid(g,SHA,i,floor),true,'scene '+i);
  assert.equal(g.scenes[i].extras.current,false);
  assert.equal(g.scenes[i].extras.asBuilt,false);
 }
});
test('wrong hash, unsupported floor/index, or default scene fails closed',()=>{
 const g=fixture();
 for(const val of ['1F','BOTH_OPEN','CURRENT','floor2',''])assert.equal(choose(SHA,val),null);
 assert.equal(choose('0'.repeat(64),'BOTH'),null);
 assert.equal(valid(g,'0'.repeat(64),377,'BOTH'),false);
 assert.equal(valid(g,SHA,370),false);
 assert.equal(valid(g,SHA,379),false);
 assert.equal(valid(g,SHA,377,'2F'),false);
 assert.equal(valid({...g,scene:377},SHA,377),false);
 assert.equal(valid({...g,asset:{extras:{...g.asset.extras,current:true}}},SHA,377),false);
});
test('root order, duplicate panel, source ancestry, transform and provenance mutations are rejected',()=>{
 const g=fixture();
 const bad=[
  x=>x.scenes[377].nodes.reverse(),
  x=>x.scenes[377].nodes[0]=12057,
  x=>x.scenes[377].nodes.push(12111),
  x=>x.scenes[377].extras.sourceGlbSha256='0'.repeat(64),
  x=>x.scenes[377].extras.ownerPointG1[0]+=0.03,
  x=>x.scenes[377].extras.productionWebGL='SUCCESS',
  x=>x.nodes[12111].children.push(12110),
  x=>x.nodes[12110].mesh=4541,
  x=>x.nodes[12110].matrix[12]+=0.01,
  x=>x.nodes[12110].extras.sourceLinks=[],
  x=>x.nodes[12111].extras.asBuilt=true,
  x=>x.meshes[4540].name='different',
 ];
 for(const mutate of bad){const v=clone(g);mutate(v);assert.equal(valid(v,SHA,377,'BOTH'),false,mutate.toString());}
});
// CI uses the compact exact root fixture. This optional test loads the true
// entire 54 MB GLB for independent SHA/length and scene validation.
test('optional authenticated raw GLB validates all three scenes',
 {skip:!process.env.YLIS_MJ83_SAVO_GLB},()=>{
  const buf=readFileSync(process.env.YLIS_MJ83_SAVO_GLB);
  assert.equal(buf.length,BYTES);
  assert.equal(createHash('sha256').update(buf).digest('hex'),SHA);
  const json=JSON.parse(buf.subarray(20,20+buf.readUInt32LE(12)).toString());
  for(const [i,floor] of entries)assert.equal(valid(json,SHA,i,floor),true,'scene '+i);
  assert.equal(valid(json,SHA,375),false);
 });
