import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_620R20_GLB_SHA256 as SHA, C80_620R20_GLB_BYTES as BYTES, C80_620R20_ZIP_DRIVE_ID as ZIP,
 C80_620R20_SCENES as SPECS, C80_620R20_COW_ALIASES as ALIASES, C80_620R20_ROOT_REPLACEMENTS as REPL,
 C80_620R20_APPENDED_ROOTS as APPENDED, C80_620R20_TCOLLECTOR_ROOT as TCOLL, isC80620R20SourceScene,
} from '../../src/scripts/privateModelC80620R20SourceProfile.mjs';
import {C80_620R19_GLB_SHA256,C80_620R19_COW_ALIASES} from '../../src/scripts/privateModelC80620R19SourceProfile.mjs';
import {resolveC80620R20SceneIndex,c80620R20ReviewProfile} from '../../src/scripts/privateModelC80620R20FloorRuntime.mjs';
import {isC80LayerSuccessorSha,resolveC80437SuccessorReceiptScene,resolveC80SuccessorTechnicalNode,withC80SuccessorMemo,resolveC80437SuccessorBuildingNode} from '../../src/scripts/privateModelC80437SuccessorLayerInheritance.mjs';
const read = path => readFileSync(new URL(path,import.meta.url),'utf8');
const ID='c80-620r20-all-r19-donors-20261119';

test('C80 620R20 floor roles map to its own six scenes on top of 620R19',()=>{
 assert.deepEqual([resolveC80620R20SceneIndex('1F'),resolveC80620R20SceneIndex('2F'),resolveC80620R20SceneIndex('BOTH'),
  resolveC80620R20SceneIndex('BOTH','ONE_OPEN'),resolveC80620R20SceneIndex('BOTH','STACKED'),resolveC80620R20SceneIndex('BOTH','CLOSED',true)],
  [674,675,676,677,678,679]);
 assert.deepEqual(Object.values(SPECS).map(s=>s.parent),[668,669,670,671,672,673]);
 assert.equal(isC80620R20SourceScene({},'0'.repeat(64),676,'BOTH'),false);
 assert.ok(isC80LayerSuccessorSha(SHA));
 assert.notEqual(SHA,C80_620R19_GLB_SHA256);
 // Parent aliases are kept unless the same receipt node is copied again in R20.
 const recopied=new Set([10145,11332,11728,2220,11609,11605,11606,11607,11608,12048,12053,12054,12055,12056]);
 for(const [k,v] of Object.entries(C80_620R19_COW_ALIASES))
  if(!recopied.has(v.orig))assert.deepEqual(ALIASES[k],v,'parent alias '+k);
 assert.ok(!(12467 in ALIASES)&&!(12462 in ALIASES));
 assert.deepEqual([12557,12621,12619,12615,12618,12622,12623,12626].map(n=>ALIASES[n]?.orig),[11728,2220,11609,11605,11608,12048,12053,12056]);
 assert.deepEqual([12623,12624,12625,12626].map(n=>ALIASES[n].mesh),[4771,4772,4773,4774]);
 assert.equal(TCOLL,12557);
 assert.deepEqual(APPENDED,[12558,12559,12568]);
 assert.deepEqual(REPL,{12467:12557,12541:12554,2220:12621,11609:12619,12048:12622,12462:12623,12463:12624,12464:12625,12465:12626});
});

test('C80 620R20 viewer, review, concealed routes and Worker wiring',()=>{
 const index=read('../../src/pages/private-model/index.astro');
 const tech=read('../../src/scripts/privateModelTechnicalReviewPresentation.mjs');
 const concealed=read('../../src/scripts/privateModelConcealedTechnicalPresentation.mjs');
 const worker=read('../../worker/privateWorkTest.ts');
 const catalog=JSON.parse(read('../../.github/work-test-candidates.json'));
 assert.ok(index.includes("if(loadedModelSha256(gltf)===C80_620R20_GLB_SHA256&&!c80620r20)throw new Error('C80_620R20_SOURCE_SCENE_MISMATCH')"));
 assert.ok(index.includes('if(c80620r20) gltf.scene=c80620r20[676];') && index.includes('else if(c80620r19) gltf.scene=c80620r19[670];'));
 assert.ok(index.includes('(layersLoadedSha===C80_620R20_GLB_SHA256 && runtime?.isC80620R20)'));
 assert.ok(tech.includes('loadedSha === C80_620R20_GLB_SHA256 ? c80620R20ReviewProfile(json,loadedSha,sceneIndex)'));
 assert.ok(concealed.includes('is620R20 || is620R19 || is620R18 || is620R17 || is620R16 || is620R15 || is620R14 || is620R13 || is620R12 || is620R11 || loadedSha === C80_620R10_GLB_SHA256'));
 assert.ok(concealed.includes('path: [12557, 10060]') && concealed.includes('is620R20 ? [...C80_620R20_CONCEALED]'));
 assert.equal(catalog.candidates[ID].driveFileId,ZIP);
 assert.match(ZIP,/^[A-Za-z0-9_-]{25,128}$/);
 assert.ok(worker.includes("id: '"+ID+"'") && worker.includes('expectedSize: '+BYTES) && worker.includes("expectedSha256: '"+SHA+"'"));
 assert.ok(worker.indexOf('C80_620R20_ALL_R19_DONORS_WORK_TEST_CANDIDATE,')<worker.indexOf('C80_620R19_ILP4_PA2_LSTEP_DONORS_WORK_TEST_CANDIDATE,'));
});

const bindings=(json,sha,s)=>{
 const out=new Map();
 withC80SuccessorMemo(()=>{
  const walk=(n,path)=>{const p=[...path,n],nd=json.nodes[n];
   if(nd.mesh!==undefined){const b=resolveC80437SuccessorBuildingNode(json,sha,s,n,p);const t=b?null:resolveC80SuccessorTechnicalNode(json,sha,s,n);
    if(b||t)out.set(n,(b?'B:':'T:')+(b||t).id+':'+((b||t).storey??''));}
   for(const c of nd.children||[])walk(c,p);};
  for(const r of json.scenes[s].nodes)walk(r,[]);});
 return out;
};
test('authentic 620R20 optional GLB: six donors merged, every R19 layer binding kept through the COW copies',
 {skip:!(process.env.C80_620R20_GLB_PATH&&process.env.C80_620R19_GLB_PATH)},()=>{
 const bytes=readFileSync(process.env.C80_620R20_GLB_PATH);
 assert.equal(bytes.length,BYTES);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),SHA);
 const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'));
 const pb=readFileSync(process.env.C80_620R19_GLB_PATH);
 const parent=JSON.parse(pb.subarray(20,20+pb.readUInt32LE(12)).toString('utf8'));
 // Copied COW node -> R19 node it replaces, for comparing bindings node by node.
 const back=new Map([[12557,12467],[12621,2220],[12619,11609],[12615,11605],[12616,11606],[12617,11607],[12618,11608],
  [12622,12048],[12623,12462],[12624,12463],[12625,12464],[12626,12465],[12555,10145],[12556,11332]]);
 for(const [i,spec] of Object.entries(SPECS)){
  assert.ok(isC80620R20SourceScene(json,SHA,+i,spec.floor),'scene '+i);
  assert.ok(resolveC80437SuccessorReceiptScene(json,SHA,+i),'receipt '+i);
  const now=bindings(json,SHA,+i),before=bindings(parent,C80_620R19_GLB_SHA256,spec.parent);
  const mapped=new Map([...now].map(([n,v])=>[back.get(n)??n,v]));
  const lost=[...before.keys()].filter(n=>!mapped.has(n));
  assert.deepEqual(lost,[],'bindings lost in '+i);
  for(const [n,v] of before) if(mapped.has(n)) assert.equal(mapped.get(n),v,'binding of '+n+' in '+i);
  assert.ok([...mapped.keys()].every(n=>before.has(n)),'no new bindings in '+i);
 }
 assert.ok(c80620R20ReviewProfile(json,SHA,676).roots[676].length>0);
 // T110 vent copies keep their receipt identity; review colours them VIEMARI by their new names.
 assert.equal(resolveC80SuccessorTechnicalNode(json,SHA,674,12556)?.id,'technical-water');
 assert.equal(resolveC80SuccessorTechnicalNode(json,SHA,676,12555)?.id,'technical-water');
 assert.match(json.nodes[12555].name,/_T110_.*VIEMARI/);
 assert.ok(json.nodes[TCOLL].children.includes(10060));
 assert.ok(!json.scenes[675].nodes.some(n=>APPENDED.includes(n)),'2F gets no 1F additions');
});
