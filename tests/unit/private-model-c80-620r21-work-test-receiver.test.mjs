import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_620R21_GLB_SHA256 as SHA, C80_620R21_GLB_BYTES as BYTES, C80_620R21_ZIP_DRIVE_ID as ZIP,
 C80_620R21_SCENES as SPECS, C80_620R21_COW_ALIASES as ALIASES, C80_620R21_ROOT_REPLACEMENTS as REPL,
 C80_620R21_APPENDED_ROOTS as APPENDED, C80_620R21_TCOLLECTOR_ROOT as TCOLL, isC80620R21SourceScene,
} from '../../src/scripts/privateModelC80620R21SourceProfile.mjs';
import {C80_620R20_GLB_SHA256,C80_620R20_COW_ALIASES} from '../../src/scripts/privateModelC80620R20SourceProfile.mjs';
import {resolveC80620R21SceneIndex,c80620R21ReviewProfile} from '../../src/scripts/privateModelC80620R21FloorRuntime.mjs';
import {isC80LayerSuccessorSha,resolveC80437SuccessorReceiptScene,resolveC80SuccessorTechnicalNode,withC80SuccessorMemo,resolveC80437SuccessorBuildingNode} from '../../src/scripts/privateModelC80437SuccessorLayerInheritance.mjs';
const read = path => readFileSync(new URL(path,import.meta.url),'utf8');
const ID='c80-620r21-r20-plus-r19-donors-20261119';

test('C80 620R21 floor roles map to its own six scenes on top of 620R20',()=>{
 assert.deepEqual([resolveC80620R21SceneIndex('1F'),resolveC80620R21SceneIndex('2F'),resolveC80620R21SceneIndex('BOTH'),
  resolveC80620R21SceneIndex('BOTH','ONE_OPEN'),resolveC80620R21SceneIndex('BOTH','STACKED'),resolveC80620R21SceneIndex('BOTH','CLOSED',true)],
  [680,681,682,683,684,685]);
 assert.deepEqual(Object.values(SPECS).map(s=>s.parent),[674,675,676,677,678,679]);
 assert.equal(isC80620R21SourceScene({},'0'.repeat(64),676,'BOTH'),false);
 assert.ok(isC80LayerSuccessorSha(SHA));
 assert.notEqual(SHA,C80_620R20_GLB_SHA256);
 // Parent aliases are kept unless the same receipt node is copied again in R21.
 const recopied=new Set(Object.entries(ALIASES).filter(([k])=>!(k in C80_620R20_COW_ALIASES)).map(([,a])=>a.orig));
 for(const [k,v] of Object.entries(C80_620R20_COW_ALIASES))
  if(!recopied.has(v.orig))assert.deepEqual(ALIASES[k],v,'parent alias '+k);
 assert.equal(ALIASES[12951].orig,11728);
 assert.equal(ALIASES[12854].orig,10060);
 assert.ok(!(12557 in ALIASES)&&!(12467 in ALIASES)&&!(10060 in ALIASES));
 assert.equal(TCOLL,12951);
 assert.deepEqual(APPENDED,{'1F':[12632],'2F':[12644,12695],BOTH:[12632,12644,12695]});
 assert.deepEqual(REPL,{11576:12629,12557:12951,10770:12633,10788:12635,10789:12636,10790:12637,10791:12638,10792:12639,12164:12634,12494:12643});
});

test('C80 620R21 viewer, review, concealed routes and Worker wiring',()=>{
 const index=read('../../src/pages/private-model/index.astro');
 const tech=read('../../src/scripts/privateModelTechnicalReviewPresentation.mjs');
 const concealed=read('../../src/scripts/privateModelConcealedTechnicalPresentation.mjs');
 const worker=read('../../worker/privateWorkTest.ts');
 const catalog=JSON.parse(read('../../.github/work-test-candidates.json'));
 assert.ok(index.includes("if(loadedModelSha256(gltf)===C80_620R21_GLB_SHA256&&!c80620r21)throw new Error('C80_620R21_SOURCE_SCENE_MISMATCH')"));
 assert.ok(index.includes('if(c80620r21) gltf.scene=c80620r21[682];') && index.includes('else if(c80620r20) gltf.scene=c80620r20[676];'));
 assert.ok(index.includes('(layersLoadedSha===C80_620R21_GLB_SHA256 && runtime?.isC80620R21)'));
 assert.ok(tech.includes('loadedSha === C80_620R21_GLB_SHA256 ? c80620R21ReviewProfile(json,loadedSha,sceneIndex)'));
 assert.ok(concealed.includes('is620R21 || is620R20 || is620R19 || is620R18 || is620R17 || is620R16 || is620R15 || is620R14 || is620R13 || is620R12 || is620R11 || loadedSha === C80_620R10_GLB_SHA256'));
 assert.ok(concealed.includes('path: [12951, 12854]') && concealed.includes('const specs=is620R21 ? [...C80_620R21_CONCEALED]'));
 assert.equal(catalog.candidates[ID].driveFileId,ZIP);
 assert.match(ZIP,/^[A-Za-z0-9_-]{25,128}$/);
 assert.ok(worker.includes("id: '"+ID+"'") && worker.includes('expectedSize: '+BYTES) && worker.includes("expectedSha256: '"+SHA+"'"));
 assert.ok(worker.indexOf('C80_620R21_R20_PLUS_R19_DONORS_WORK_TEST_CANDIDATE,')<worker.indexOf('C80_620R20_ALL_R19_DONORS_WORK_TEST_CANDIDATE,'));
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
test('authentic 620R21 optional GLB: four donors merged, every R20 layer binding kept through the COW copies',
 {skip:!(process.env.C80_620R21_GLB_PATH&&process.env.C80_620R20_GLB_PATH)},()=>{
 const bytes=readFileSync(process.env.C80_620R21_GLB_PATH);
 assert.equal(bytes.length,BYTES);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),SHA);
 const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'));
 const pb=readFileSync(process.env.C80_620R20_GLB_PATH);
 const parent=JSON.parse(pb.subarray(20,20+pb.readUInt32LE(12)).toString('utf8'));
 // Copied COW node -> R19 node it replaces, for comparing bindings node by node.
 const back=new Map(Object.entries({"12627": 11577, "12628": 11583, "12629": 11576, "12633": 10770, "12634": 12164, "12635": 10788, "12636": 10789, "12637": 10790, "12638": 10791, "12639": 10792, "12640": 10851, "12641": 10849, "12642": 12493, "12643": 12494, "12854": 10060, "12855": 10062, "12856": 10064, "12857": 10066, "12858": 10124, "12859": 10126, "12860": 10130, "12861": 10132, "12862": 10134, "12863": 10136, "12864": 10138, "12865": 10140, "12866": 10142, "12868": 10148, "12869": 10151, "12870": 11726, "12871": 10179, "12872": 10181, "12873": 10183, "12874": 10185, "12875": 10187, "12876": 10189, "12877": 10191, "12878": 10193, "12879": 10195, "12880": 10197, "12881": 10199, "12882": 10201, "12883": 10203, "12884": 10205, "12885": 10207, "12886": 10209, "12887": 10211, "12888": 10213, "12889": 10215, "12890": 10217, "12891": 10219, "12892": 10221, "12893": 10223, "12894": 10225, "12895": 10227, "12896": 10229, "12897": 10231, "12898": 10233, "12899": 10235, "12900": 10237, "12901": 10239, "12902": 10241, "12903": 10243, "12904": 10245, "12905": 10247, "12906": 10249, "12907": 10251, "12908": 10253, "12909": 10255, "12910": 10257, "12911": 10259, "12912": 10261, "12913": 10263, "12914": 10265, "12915": 10267, "12916": 10269, "12917": 10271, "12918": 10273, "12919": 10275, "12920": 10277, "12921": 10279, "12922": 10281, "12923": 10283, "12924": 10285, "12925": 10310, "12926": 10316, "12927": 10322, "12928": 10356, "12929": 10392, "12930": 10402, "12931": 10404, "12932": 10406, "12933": 10408, "12934": 10410, "12935": 10412, "12936": 10414, "12937": 10416, "12938": 10418, "12939": 10504, "12940": 10506, "12941": 10508, "12942": 11323, "12943": 11320, "12944": 11321, "12945": 11330, "12947": 11334, "12948": 11724, "12949": 11363, "12950": 11365, "12951": 12557}).map(([a,b])=>[+a,b]));
 for(const [i,spec] of Object.entries(SPECS)){
  assert.ok(isC80620R21SourceScene(json,SHA,+i,spec.floor),'scene '+i);
  assert.ok(resolveC80437SuccessorReceiptScene(json,SHA,+i),'receipt '+i);
  const now=bindings(json,SHA,+i),before=bindings(parent,C80_620R20_GLB_SHA256,spec.parent);
  const mapped=new Map([...now].map(([n,v])=>[back.get(n)??n,v]));
  const lost=[...before.keys()].filter(n=>!mapped.has(n));
  assert.deepEqual(lost,[],'bindings lost in '+i);
  for(const [n,v] of before) if(mapped.has(n)) assert.equal(mapped.get(n),v,'binding of '+n+' in '+i);
  assert.ok([...mapped.keys()].every(n=>before.has(n)),'no new bindings in '+i);
 }
 assert.ok(c80620R21ReviewProfile(json,SHA,682).roots[682].length>0);
 assert.ok(json.nodes[TCOLL].children.includes(12854)&&json.nodes[TCOLL].children.includes(12555));
 assert.ok(!json.scenes[681].nodes.includes(12632),'2F gets no WC hatch');
 // H1911-4 island body keeps its fixture identity with the cavity-edited mesh (alias.building).
 const pathTo=(s,target)=>{let found=null;const w=(n,p)=>{const q=[...p,n];if(n===target)found=q;for(const c of json.nodes[n].children??[])w(c,q);};for(const r of json.scenes[s].nodes)w(r,[]);return found;};
 const island=withC80SuccessorMemo(()=>resolveC80437SuccessorBuildingNode(json,SHA,682,12633,pathTo(682,12633)));
 assert.equal(island?.mesh,json.nodes[12633].mesh);
 assert.equal(island?.name,json.nodes[12633].name);
});
