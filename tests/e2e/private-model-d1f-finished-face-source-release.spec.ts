import {test,expect} from '@playwright/test';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {runInNewContext} from 'node:vm';

const id='d1f-finished-face-2360-wall-basin-20261014';
const correctedId='d1f-four-review-corrections-20261014';
const wcThemoId='d1f-wc-enclosure-themos-20261015';
const bathroomId='d1f-bathroom-surfaces-cabinet-20261015';
const workflow=readFileSync('.github/workflows/publish-work-test.yml','utf8');

test('exact production byte proof gates a bounded trusted-main render dispatch for all supported successors',()=>{
  const step=workflow.split('      - name: Dispatch finished-face source render after exact production proof\n')[1].split('      - name: Remove private temporary files')[0];
  expect(workflow.indexOf('Read full production GLB back and verify bytes')).toBeLessThan(workflow.indexOf('Dispatch finished-face'));
  const condition=step.split('\n').find(line=>line.trim().startsWith('if:'))!.trim().slice(4);
  for(const candidate of [id,correctedId,bathroomId,wcThemoId,'unknown']) {
    expect(runInNewContext('('+condition+')',{success:()=>true,inputs:{candidate}})).toBe(candidate!=='unknown');
    expect(runInNewContext('('+condition+')',{success:()=>false,inputs:{candidate}})).toBe(false);
  }
  expect(step).toContain('[[ "$GITHUB_REF" == "refs/heads/main" ]]');
  expect(step).toContain('[[ "$GITHUB_EVENT_NAME" == "workflow_dispatch" ]]');
  expect(step).toContain('--connect-timeout 10 --max-time 30');
  expect(workflow).toContain('  actions: write');
  const python=step.split('<<\'PY\'\n')[1].split('\n          PY')[0].split('\n').map(line=>line.slice(10)).join('\n');
  const dir=mkdtempSync(join(tmpdir(),'d1f-dispatch-'));
  try {
    const output=join(dir,'dispatch.json');
    for(const candidate of [id,correctedId,bathroomId,wcThemoId]) {
    execFileSync('python3',['-c',python,output],{env:{...process.env,CANDIDATE_ID:candidate}});
    expect(JSON.parse(readFileSync(output,'utf8'))).toEqual({ref:'main',inputs:{
      probe_mode:'d1f-measured-pixels',measured_candidate:candidate,candidate_id:candidate,review_id:candidate+'-review',
      expected_dataset_json:'{"d1fCombinedWallHumanReview":"NOT_RUN"}',
      min_non_background_pixels:'1500',min_changed_pixels:'750'}});
    }
    expect(()=>execFileSync('python3',['-c',python,output],{env:{...process.env,CANDIDATE_ID:'old'},stdio:'pipe'})).toThrow();
  } finally {rmSync(dir,{recursive:true,force:true});}
});

test('production runner rejects an unsupported source before credentials or browser access',()=>{
  const script=readFileSync('.github/scripts/private-model-d1f-measured-production-probe.mjs','utf8');
  const start=script.indexOf('const DEFAULT_ID'),end=script.indexOf('const ASSET');
  expect(end).toBeGreaterThan(start);
  const prefix=script.slice(start,end);
  expect(prefix).toContain('D1F_MEASURED_SOURCE_REJECTED');
  expect(()=>runInNewContext(prefix,{process:{env:{D1F_MEASURED_CANDIDATE_ID:'unknown'}}})).toThrow('D1F_MEASURED_SOURCE_REJECTED');
  for(const candidate of [id,correctedId,bathroomId,wcThemoId])
    expect(()=>runInNewContext(prefix,{process:{env:{D1F_MEASURED_CANDIDATE_ID:candidate}}})).not.toThrow();
});
