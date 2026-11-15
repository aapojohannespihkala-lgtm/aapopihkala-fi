import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
 K13_C80602_SOURCE as SOURCE,
 K13_C80602_SCENES as SCENES,
 k13SourceRootHash,
 isK13SourceRolePair,
 k13C80602IvHighlightEvidence as evidence,
} from '../../src/scripts/privateModelK13IvHighlightEvidence.mjs';

function sourcePair(){
 const nodes: any[]=[];
 const meshes: any[]=[];
 const materials: any[]=[];
 nodes[1730]={mesh:4015,name:'KPH11_IV_18MM_REARWALL_END_WORKFIT',
  extras:{ylisViewScope:{role:'CONTENT'}}};
 nodes[10060]={mesh:3788,
  name:'C80_KV17_IV15_OPTIN__D1F_IV2015_3PORT_TCOLLECTOR_XMIRROR_WORK_TEST',
  extras:{m5System:'IV',modelStage:'WORK_TEST',hostHold:true,verifiedConnections:0}};
 nodes[12329]={children:[1730]};
 nodes[11728]={children:[10060]};
 meshes[4015]={primitives:[{material:121}]};
 materials[121]={name:'D1F_KPH11_IV_BOX_SMOOTH_OFFWHITE_VISUAL_WORK_ASSUMPTION'};
 return {nodes,meshes,materials};
}
test('K13 role handoff is pinned to C80 602 and exactly six glTF scenes',()=>{
 expect(SOURCE.glbBytes).toBe(56765356);
 expect(SOURCE.glbSha256).toHaveLength(64);
 expect(SOURCE.zipDriveId).toBe('1FH4aHwm24niQbVMMK5keZotms1lUYUM7');
 expect(Object.keys(SCENES).map(Number)).toEqual([596,597,598,599,600,601]);
 expect(SCENES[596].k13Active).toBe(true);
 expect(SCENES[597].k13Active).toBe(false);
 expect(SCENES[598].floor).toBe('BOTH');
 expect(k13SourceRootHash([1,2,3])).toMatch(/^[a-f0-9]{8}$/);
 expect(k13SourceRootHash([1,-2,3])).toBeNull();
});
test('K13 distinguishes WHITE ENCLOSURE from IV ROUTE without deleting either',()=>{
 const pair=sourcePair();
 expect(isK13SourceRolePair(pair)).toBe(true);
 pair.nodes[1730].extras.m5System='IV';
 expect(isK13SourceRolePair(pair)).toBe(false,'source shell must not inherit route system');
 delete pair.nodes[1730].extras.m5System;
 pair.nodes[10060].extras.verifiedConnections=1;
 expect(isK13SourceRolePair(pair)).toBe(false,'physical verification must not be invented');
 pair.nodes[10060].extras.verifiedConnections=0;
 pair.nodes[11728].children=[];
 expect(isK13SourceRolePair(pair)).toBe(false,'wrong parent fails closed');
});
test('K13 exact receipt rejects wrong source SHA and incomplete glTF',()=>{
 const p=sourcePair();
 expect(evidence(p,'0'.repeat(64),596)).toBeNull();
 expect(evidence(p,SOURCE.glbSha256,596)).toBeNull();
 expect(evidence(p,SOURCE.glbSha256,999)).toBeNull();
});
test('optional authentic original C80 602: 1F/BOTH are split roles, 2F has no K13 roles',()=>{
 const path=process.env.C80_602_K13_GLB_PATH;
 test.skip(!path,'Private 56.8 MB original GLB fixture not present on CI');
 const binary=readFileSync(path!);
 expect(binary.length).toBe(SOURCE.glbBytes);
 expect(binary.toString('ascii',0,4)).toBe('glTF');
 expect(createHash('sha256').update(binary).digest('hex')).toBe(SOURCE.glbSha256);
 const length=binary.readUInt32LE(12);
 const json=JSON.parse(binary.subarray(20,20+length).toString('utf8'));
 expect(isK13SourceRolePair(json)).toBe(true);
 for(const index of [596,597,598,599,600,601]){
  const got=evidence(json,SOURCE.glbSha256,index);
  expect(got).not.toBeNull();
  expect(got!.sourceExact).toBe(true);
  expect(got!.roles.map((r:any)=>[r.nodeIndex,r.role,r.system])).toEqual(
   index===597?[]:[[1730,'ENCLOSURE','IV'],[10060,'ROUTE','IV']]);
  expect(got!.publishAllowed).toBe(false);
  expect(got!.viewerMounted).toBe(false);
  expect(got!.physicalHostVerified).toBe(false);
  expect(got!.routeContinuityVerified).toBe(false);
  expect(evidence(json,'0'.repeat(64),index)).toBeNull();
 }
});
