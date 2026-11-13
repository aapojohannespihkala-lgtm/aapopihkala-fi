import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 SUCCESSOR_R1_SHA256,SUCCESSOR_R1_DRIVE_ID,SUCCESSOR_R1_ZIP_SHA256,
 SUCCESSOR_R1_SCENE_COUNT,SUCCESSOR_R1_DEFAULT_SCENE,
} from '../../src/scripts/privateModelM6263Mj72Kiv005Pk1SuccessorSourceProfile.mjs';

const id='c80-m6263-mj72-kiv005-pk1-successor-20261113';
const read=(path)=>readFileSync(new URL(path,import.meta.url),'utf8');
const registry=JSON.parse(read('../../.github/work-test-candidates.json'));
const worker=read('../../worker/privateWorkTest.ts');

test('only the intended immutable Drive original ZIP is used for the new candidate',()=>{
 assert.equal(SUCCESSOR_R1_DRIVE_ID,'152JZBJ5VtfvtQUXwgUuy27dhsDv7GXHV');
 assert.equal(SUCCESSOR_R1_ZIP_SHA256,'f0d42d10f9e7a1a8f4135a8a5b319145d25dceccff317a4a5a1d7c059107fafe');
 assert.equal(SUCCESSOR_R1_SHA256,'31dc12c484fcf951c4373387b9653e26206a8ac3bc4978d5d980daeac3a6ade2');
 assert.deepEqual(registry.candidates[id],{driveFileId:SUCCESSOR_R1_DRIVE_ID});
 assert.equal(Object.keys(registry.candidates).filter(x=>x===id).length,1);
 assert.deepEqual(registry.candidates['c80-tate-mj62-mj63-integrated-20261113'],{
  driveFileId:'1N5XOx_Nnd51dK2QQ4iOg1FzIyRJzQboz'
 });
});
test('trusted worker candidate is SHA-locked, not an auto-publisher or CURRENT',()=>{
 const match=worker.match(/const C80_M6263_MJ72_KIV005_PK1_SUCCESSOR_WORK_TEST_CANDIDATE = \{([\s\S]*?)\n\} as const satisfies PrivateWorkTestCandidate;/);
 assert.ok(match,'exact candidate must be present');
 const code=match[1];
 assert.ok(code.includes(`id: '${id}'`));
 assert.ok(code.includes("expectedSize: 54018652"));
 assert.ok(code.includes(`expectedSha256: '${SUCCESSOR_R1_SHA256}'`));
 assert.ok(code.includes(`objectKey: 'work-test/${id}.glb'`));
 assert.ok(code.includes(`path: \`\${PRIVATE_WORK_TEST_PREFIX}/${id}.glb\``));
 assert.match(worker,/const PRIVATE_WORK_TEST_RUNTIME_CANDIDATES = \[\s*C80_M6263_MJ72_KIV005_PK1_SUCCESSOR_WORK_TEST_CANDIDATE,\s*C80_TATE_MJ6263_WORK_TEST_CANDIDATE/);
 assert.equal(worker.split("id: '"+id+"'").length-1,1);
});
test('new model remains opt-in WORK_TEST and not a default or physical acceptance',()=>{
 assert.equal(SUCCESSOR_R1_SCENE_COUNT,369);
 assert.equal(SUCCESSOR_R1_DEFAULT_SCENE,292);
 const viewer=read('../../src/pages/private-model/index.astro');
 assert.ok(viewer.includes("SUCCESSOR_R1_SHA256"));
 assert.ok(viewer.includes("resolveSuccessor369Scenes(gltf,loadedModelSha256(gltf))"));
});
