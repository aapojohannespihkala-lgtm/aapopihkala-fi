import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
 C80_K05_PRIMARY as PRIMARY,
 C80_K05_SIBLING_GLB_SHA256 as SIBLING,
 C80_K05_SCENES as SCENES,
 c80536K05Fnv32 as fnv,
 c80536K05RootReplacement as replaced,
 isC80536K05PrimarySourceScene as valid,
 c80536K05SourceReceipt as receipt,
} from '../../src/scripts/privateModelC80536K05SourceGate.mjs';

test('K05 primary and metadata-different sibling are never SHA aliases',()=>{
 expect(PRIMARY.glbSha256).toHaveLength(64);
 expect(PRIMARY.glbSha256).not.toBe(SIBLING);
 expect(PRIMARY.glbBytes).toBe(55664796);
 expect(PRIMARY.zipDriveId).toBe('1kjUpRz7Jf4fclyQawNiw6hf3ny3KF1X8');
 expect(Object.keys(SCENES).map(Number)).toEqual([530,531,532,533,534,535]);
 expect(SCENES[530].hasDoor).toBe(false);
 for(const i of [531,532,533,534,535])expect(SCENES[i].hasDoor).toBe(true);
});
test('K05 removes only the two ROOM3 legacy handles, never ROOM4 or PHOTO',()=>{
 const before=[17,9195,9196,12222,9197,9198,99];
 const after=[17,12222,9197,9198,99];
 expect(replaced(before,after,true)).toBe(true);
 expect(replaced(before,before,true)).toBe(false);
 expect(replaced(before,[17,12222,9198,99],true)).toBe(false);
 expect(replaced(before,after,false)).toBe(false);
 expect(replaced(before,before,false)).toBe(true);
 expect(replaced([17,9195,9196,9195,12222,9197,9198],after,true)).toBe(false);
 expect(fnv([])).toBe('811c9dc5');
 expect(fnv([17,12222,9197])).not.toBe(fnv([17,12222,9198]));
 expect(fnv(['17' as unknown as number])).toBeNull();
});
test('bad SHA, incomplete graph or false model evidence fail closed',()=>{
 expect(valid(null,PRIMARY.glbSha256,531,'2F')).toBe(false);
 expect(valid({scenes:[]},SIBLING,531,'2F')).toBe(false);
 expect(valid({scenes:[],scene:292},PRIMARY.glbSha256,999,'2F')).toBe(false);
 const result=receipt(null,PRIMARY.glbSha256,531,'2F');
 expect(result.exactSource).toBe(false);
 expect(result.primarySourceOnly).toBe(true);
 expect(result.viewerMounted).toBe(false);
 expect(result.sourceLinksBound).toBe(false);
 expect(result.publishAllowed).toBe(false);
 expect(result.current).toBe(false);
 expect(result.asBuilt).toBe(false);
 expect(result.productionWebGLVerified).toBe(false);
 expect(result.humanReview).toBe('NOT_RUN');
});
test('original source GLB: exact SHA and six real root/DFS checks',()=>{
 const path=process.env.C80_536_K05_PRIMARY_GLB_PATH;
 test.skip(!path,'Optional original 55 MB private GLB is absent in CI');
 const bin=readFileSync(path!);
 expect(bin.byteLength).toBe(PRIMARY.glbBytes);
 expect(createHash('sha256').update(bin).digest('hex')).toBe(PRIMARY.glbSha256);
 expect(bin.toString('utf8',0,4)).toBe('glTF');
 const size=bin.readUInt32LE(12);
 const json=JSON.parse(bin.subarray(20,20+size).toString('utf8'));
 for(const spec of Object.values(SCENES)){
  expect(valid(json,PRIMARY.glbSha256,spec.index,spec.floor)).toBe(true);
  expect(valid(json,SIBLING,spec.index,spec.floor)).toBe(false);
  expect(valid(json,PRIMARY.glbSha256,spec.index,'WRONG')).toBe(false);
  const altered={...json,scenes:[...json.scenes]};
  altered.scenes[spec.index]={...json.scenes[spec.index],nodes:[...json.scenes[spec.index].nodes].reverse()};
  expect(valid(altered,PRIMARY.glbSha256,spec.index,spec.floor)).toBe(false);
  const accepted=receipt(json,PRIMARY.glbSha256,spec.index,spec.floor);
  expect(accepted.exactSource).toBe(true);
  expect(accepted.publishAllowed).toBe(false);
 }
});
