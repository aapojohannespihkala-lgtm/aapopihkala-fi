import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_530_V27_GLB_SHA256 as SHA,
 C80_530_V27_GLB_BYTES as BYTES,
 C80_530_V27_ZIP_DRIVE_ID as ZIP,
 C80_530_V27_SCENES as SPECS,
} from '../../src/scripts/privateModelC80530V27SourceProfile.mjs';
import {resolveC80530V27SceneIndex,c80530V27ReviewProfile} from '../../src/scripts/privateModelC80530V27FloorRuntime.mjs';
import {isC80LayerSuccessorSha,resolveC80437SuccessorReceiptScene,resolveC80SuccessorNewTechnicalNode} from '../../src/scripts/privateModelC80437SuccessorLayerInheritance.mjs';
const read = path => readFileSync(new URL(path,import.meta.url),'utf8');
const ID='c80-530-v27-no-trench-terrain-20261115';

test('C80 530 viewer uses only its authenticated six opt-in scenes, not historical default',()=>{
 const index=read('../../src/pages/private-model/index.astro');
 assert.ok(index.includes("loadedModelSha256(gltf) === C80_530_V27_GLB_SHA256"));
 assert.ok(index.includes("createC80530V27FloorRuntime({gltf,sha:loadedModelSha256(gltf)"));
 assert.ok(index.includes("if(loadedModelSha256(gltf)===C80_530_V27_GLB_SHA256&&!c80530)throw new Error('C80_530_SOURCE_SCENE_MISMATCH')"));
 assert.ok(index.includes('if(c80530) gltf.scene=c80530[526];\n            else if(c80524) gltf.scene=c80524[520];'));
 assert.equal(resolveC80530V27SceneIndex('1F'),524);
 assert.equal(resolveC80530V27SceneIndex('2F'),525);
 assert.equal(resolveC80530V27SceneIndex('BOTH'),526);
 assert.equal(resolveC80530V27SceneIndex('BOTH','ONE_OPEN'),527);
 assert.equal(resolveC80530V27SceneIndex('BOTH','STACKED'),528);
 assert.equal(resolveC80530V27SceneIndex('BOTH','CLOSED',true),529);
 assert.equal(resolveC80530V27SceneIndex('2F','ONE_OPEN'),null);
});

test('C80 530 content inheritance, glazing/cutaway and MEP remain source-only',()=>{
 const index=read('../../src/pages/private-model/index.astro');
 const inheritance=read('../../src/scripts/privateModelC80437SuccessorLayerInheritance.mjs');
 const tech=read('../../src/scripts/privateModelTechnicalReviewPresentation.mjs');
 assert.match(index, /isC80530V27/);
 assert.ok(index.includes('(layersLoadedSha===C80_530_V27_GLB_SHA256 && runtime?.isC80530V27)'));
 assert.ok(index.includes('(layersLoadedSha===C80_530_V27_GLB_SHA256&&runtime?.isC80530V27)'));
 assert.match(index.match(/const verifiedChainSourceSha =([\s\S]*?)\? layersLoadedSha : null;/)[1],/layersLoadedSha === C80_530_V27_GLB_SHA256 \|\|/);
 assert.ok(inheritance.includes("isC80530V27SourceScene(json,sha,index,C80_530_V27_SCENES[index].floor)"));
 assert.ok(tech.includes('loadedSha === C80_530_V27_GLB_SHA256 ? c80530V27ReviewProfile(json,loadedSha,sceneIndex)'));
 assert.ok(isC80LayerSuccessorSha(SHA));
 assert.equal(Object.keys(SPECS).length,6);
});

test('C80 530 Worker catalog points to immutable original Drive ZIP and GLB',()=>{
 const catalog=JSON.parse(read('../../.github/work-test-candidates.json'));
 const worker=read('../../worker/privateWorkTest.ts');
 assert.equal(catalog.candidates[ID].driveFileId,ZIP);
 assert.ok(worker.includes("id: '"+ID+"'"));
 assert.ok(worker.includes('expectedSize: '+BYTES));
 assert.ok(worker.includes("expectedSha256: '"+SHA+"'"));
 assert.ok(worker.includes('C80_530_V27_NO_TRENCH_WORK_TEST_CANDIDATE,'));
});

test('authentic 530 optional GLB: 437 inherited roots, MEP, terrain stays context', {skip:!process.env.C80_530_V27_GLB_PATH},()=>{
 const bytes=readFileSync(process.env.C80_530_V27_GLB_PATH);
 assert.equal(bytes.length,BYTES);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),SHA);
 assert.equal(bytes.toString('utf8',0,4),'glTF');
 const gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'));
 assert.equal(gltf.scenes.length,530);
 for(const i of [524,525,526,527,528,529])assert.ok(resolveC80437SuccessorReceiptScene(gltf,SHA,i));
 const scene=resolveC80437SuccessorReceiptScene(gltf,SHA,526);
 assert.ok(scene?.technical);
 const n=Object.keys(scene.technical).filter(x=>resolveC80SuccessorNewTechnicalNode(gltf,SHA,526,+x));
 assert.ok(n.length>=0);
 assert.equal(resolveC80SuccessorNewTechnicalNode(gltf,SHA,526,12243)?.id,'technical-water');
 assert.equal(resolveC80SuccessorNewTechnicalNode(gltf,SHA,526,12239)?.id,'technical-drainage');
 const roots=c80530V27ReviewProfile(gltf,SHA,526).roots[526].map(x=>x.node);
 assert.ok(roots.includes(12243)&&roots.includes(12239));
 assert.ok(!roots.includes(12251)&&!roots.includes(12254)&&!roots.includes(12238));
});
