import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_602_GLB_SHA256 as SHA,
 C80_602_GLB_BYTES as BYTES,
 C80_602_ZIP_DRIVE_ID as ZIP,
 C80_602_SCENES as SPECS,
 C80_602_K04_ROOTS,
 C80_602_K04_REPLACED,
 isC80602SourceScene,
} from '../../src/scripts/privateModelC80602SourceProfile.mjs';
import {resolveC80602SceneIndex,resolveC80602Scenes,c80602ReviewProfile} from '../../src/scripts/privateModelC80602FloorRuntime.mjs';
import {isC80LayerSuccessorSha,resolveC80437SuccessorReceiptScene,resolveC80SuccessorTechnicalNode} from '../../src/scripts/privateModelC80437SuccessorLayerInheritance.mjs';
const read = path => readFileSync(new URL(path,import.meta.url),'utf8');
const ID='c80-602-all5-k12-k09-k16-k18-k04-20261115';

test('C80 602 floor roles map to its own six source scenes only',()=>{
 assert.equal(resolveC80602SceneIndex('1F'),596);
 assert.equal(resolveC80602SceneIndex('2F'),597);
 assert.equal(resolveC80602SceneIndex('BOTH'),598);
 assert.equal(resolveC80602SceneIndex('BOTH','ONE_OPEN'),599);
 assert.equal(resolveC80602SceneIndex('BOTH','STACKED'),600);
 assert.equal(resolveC80602SceneIndex('BOTH','CLOSED',true),601);
 assert.equal(resolveC80602SceneIndex('2F','ONE_OPEN'),null);
 assert.equal(resolveC80602SceneIndex('BOTH','STACKED',true),null);
 assert.deepEqual(Object.keys(SPECS).map(Number),[596,597,598,599,600,601]);
 assert.equal(SPECS[596].k04,false);
 assert.equal(resolveC80602Scenes({parser:{json:{}},scenes:[]},'0'.repeat(64)),null);
 assert.equal(isC80602SourceScene({},'0'.repeat(64),598,'BOTH'),false);
});

test('C80 602 viewer, content inheritance and technical review wiring',()=>{
 const index=read('../../src/pages/private-model/index.astro');
 const inheritance=read('../../src/scripts/privateModelC80437SuccessorLayerInheritance.mjs');
 const tech=read('../../src/scripts/privateModelTechnicalReviewPresentation.mjs');
 assert.ok(index.includes('loadedModelSha256(gltf) === C80_602_GLB_SHA256'));
 assert.ok(index.includes("if(loadedModelSha256(gltf)===C80_602_GLB_SHA256&&!c80602)throw new Error('C80_602_SOURCE_SCENE_MISMATCH')"));
 assert.ok(index.includes('if(c80602) gltf.scene=c80602[598];'));
 assert.ok(index.includes('(layersLoadedSha===C80_602_GLB_SHA256 && runtime?.isC80602)'));
 assert.ok(index.includes('(layersLoadedSha===C80_602_GLB_SHA256&&runtime?.isC80602)'));
 assert.match(index.match(/const verifiedChainSourceSha =([\s\S]*?)\? layersLoadedSha : null;/)[1],/layersLoadedSha === C80_602_GLB_SHA256 \|\|/);
 assert.ok(inheritance.includes('isC80602SourceScene(json,sha,index,C80_602_SCENES[index].floor)'));
 assert.ok(tech.includes('loadedSha === C80_602_GLB_SHA256 ? c80602ReviewProfile(json,loadedSha,sceneIndex)'));
 assert.ok(isC80LayerSuccessorSha(SHA));
});

test('C80 602 Worker candidate points to the immutable original Drive ZIP and GLB',()=>{
 const catalog=JSON.parse(read('../../.github/work-test-candidates.json'));
 const worker=read('../../worker/privateWorkTest.ts');
 assert.equal(catalog.candidates[ID].driveFileId,ZIP);
 assert.ok(worker.includes("id: '"+ID+"'"));
 assert.ok(worker.includes('expectedSize: '+BYTES));
 assert.ok(worker.includes("expectedSha256: '"+SHA+"'"));
 assert.ok(worker.includes('C80_602_ALL5_K04_WORK_TEST_CANDIDATE,'));
});

test('authentic 602 optional GLB: six scenes, K04 delta, 437 inheritance, mutation rejected',
 {skip:!process.env.C80_602_GLB_PATH},()=>{
 const bytes=readFileSync(process.env.C80_602_GLB_PATH);
 assert.equal(bytes.length,BYTES);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),SHA);
 const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'));
 for(const [i,spec] of Object.entries(SPECS)){
  assert.ok(isC80602SourceScene(json,SHA,+i,spec.floor),'scene '+i);
  assert.ok(resolveC80437SuccessorReceiptScene(json,SHA,+i),'receipt '+i);
 }
 assert.equal(isC80602SourceScene(json,SHA,598,'2F'),false);
 assert.ok(C80_602_K04_ROOTS.every(n=>json.scenes[597].nodes.includes(n)));
 assert.ok(C80_602_K04_REPLACED.every(n=>!json.scenes[598].nodes.includes(n)));
 assert.equal(resolveC80SuccessorTechnicalNode(json,SHA,598,12243)?.id,'technical-water');
 const roots=c80602ReviewProfile(json,SHA,598).roots[598].map(x=>x.node);
 assert.deepEqual(c80602ReviewProfile(json,SHA,598).floors,json.asset.extras.viewerFloorScenes,
  'review profile floors must equal the asset viewerFloorScenes gate');
 assert.ok(roots.includes(12243)&&roots.includes(12239));
 const changed=structuredClone(json);
 changed.scenes[598].nodes[changed.scenes[598].nodes.indexOf(12340)]=11830;
 assert.equal(isC80602SourceScene(changed,SHA,598,'BOTH'),false,'old K04 root must not pass');
 const flipped=structuredClone(json);
 flipped.scenes[597].extras.physicalK04InstallationVerified=true;
 assert.equal(isC80602SourceScene(flipped,SHA,597,'2F'),false,'no physical installation claim');
});
