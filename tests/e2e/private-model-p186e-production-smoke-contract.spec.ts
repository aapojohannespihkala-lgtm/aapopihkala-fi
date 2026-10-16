import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {
  P186E_PRODUCTION_FLOORS,expectedP186EProductionDataset,
  validateP186EProductionDataset,countP186EFramePixels,
} from '../../.github/scripts/private-model-p186e-production-probe.mjs';

const good = (floor: 'D1F'|'D2F') => ({
  ...expectedP186EProductionDataset(floor),
  p186eReviewContextRenderableCount:'5',
});

test('both exact historic D floors keep source-only 18+16 identity and no-promotion',()=>{
  expect(P186E_PRODUCTION_FLOORS).toEqual(['D1F','D2F']);
  expect(validateP186EProductionDataset('D1F',good('D1F')))
    .toMatchObject({sourceLabels:18,groups:14,special:4,noPromotion:true});
  expect(validateP186EProductionDataset('D2F',good('D2F')))
    .toMatchObject({sourceLabels:16,groups:15,special:1,noPromotion:true});
  expect(good('D1F')).toMatchObject({
    modelSource:'work-test',workTestReviewAutoload:'true',
    p186eHumanReview:'NOT_RUN',p186eCurrentClaim:'false',
    p186eCanonical:'false',p186eAsBuiltClaim:'false',
  });
});

test('missing source, wrong floor count, physical promotion, absent wall fail closed',()=>{
  for(const change of [
    {modelSource:'current'},{workTestReviewAutoload:'false'},
    {p186eReviewTargetRenderableCount:'17'},{p186eReviewGroupTargetCount:'15'},
    {p186eSourceContextReady:'false'},
    {p186eExactCurrentXYClaim:'true'}, {p186eAsBuiltClaim:'true'},
    {p186eCanonical:'true'}, {p186eHumanReview:'PASS'},
  ]){
    expect(()=>validateP186EProductionDataset('D1F',{...good('D1F'),...change}))
      .toThrow(/P186E_PROD_DATASET_SOURCE_OR_PROMOTION/);
  }
  expect(()=>validateP186EProductionDataset('D2F',{
    ...good('D2F'),p186eReviewContextRenderableCount:'0',
  })).toThrow(/DRAWABLE_ARCHITECTURE_CONTEXT/);
  expect(()=>expectedP186EProductionDataset('D3F')).toThrow(/P186E_PROD_FLOOR/);
});

test('screen pixels only support aggregate render proof, not 34 individual pixels',()=>{
  const rgba=new Uint8Array(64*64*4);
  for(let i=0;i<rgba.length;i+=4)rgba.set([32,42,52,255],i);
  for(let i=0;i<64;i+=1)rgba.set([255,211,77,255],i*4);
  const value=countP186EFramePixels(rgba,64,64);
  expect(value).toMatchObject({aggregateAmberPixels:64,
    nonBackgroundPixels:64,individuallyIsolatedTargetsVerified:0});
  expect(()=>countP186EFramePixels(new Uint8Array(4),64,64))
    .toThrow(/P186E_PROD_RGBA/);
});

test('production workflow only dispatches this probe on protected main with server-side secrets',()=>{
  const yaml=readFileSync('.github/workflows/private-model-production-review-smoke.yml','utf8');
  const script=readFileSync('.github/scripts/private-model-p186e-production-probe.mjs','utf8');
  expect(yaml).toContain('- p186e-labels-render');
  expect(yaml).toContain("github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main' && inputs.probe_mode == 'p186e-labels-render'");
  expect(yaml).toContain('node .github/scripts/private-model-p186e-production-probe.mjs');
  expect(yaml).toContain('CF_ACCESS_VIEWER_PROBE_CLIENT_ID: ${{ secrets.CF_ACCESS_VIEWER_PROBE_CLIENT_ID }}');
  expect(yaml).toContain('CF_ACCESS_VIEWER_PROBE_CLIENT_SECRET: ${{ secrets.CF_ACCESS_VIEWER_PROBE_CLIENT_SECRET }}');
  expect(script).toContain('all34IndividuallyVerified:false');
  expect(script).toContain("process.env.GITHUB_REF==='refs/heads/main'");
  expect(script).toContain("process.env.GITHUB_EVENT_NAME==='workflow_dispatch'");
  expect(script).toContain("process.env.PROBE_MODE==='p186e-labels-render'");
  expect(script).not.toContain("publishToCURRENT:true");
});
