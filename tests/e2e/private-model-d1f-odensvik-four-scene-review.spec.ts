import { expect, test } from '@playwright/test';
// @ts-ignore - exact-source ESM contract deliberately tested without a production GLB.
import {
  D1F_ODENSVIK_CANDIDATE_ID, D1F_ODENSVIK_REVIEW_ID,
  D1F_ODENSVIK_SOURCE, D1F_ODENSVIK_VARIANTS,
  isD1FOdensvikReviewRequested, selectD1FOdensvikScene,
  verifyD1FOdensvikRawGlb, loadD1FOdensvikReview,
} from '../../src/scripts/privateModelD1FOdensvikSourceReview.mjs';

const buildSceneSource = () => {
  const nodes = Array.from({ length: 2652 }, () => ({ children: [] as number[] })) as any[];
  const scenes = Array.from({ length: 112 }, () => ({ nodes: [] as number[] })) as any[];
  for (const v of D1F_ODENSVIK_VARIANTS) {
    const targets = Array.from({ length: 10 }, (_, i) => v.rootNode + i + 1);
    const surfaces = Object.fromEntries(['KPH_FLOOR','SAUNA_FLOOR','ORDINARY_FLOOR','KPH_CEILING','SAUNA_CEILING']
      .map((name, i) => [name, targets[i + 2]]));
    const themos = Object.fromEntries(['THEMO_LOBBY','THEMO_BEDROOM','THEMO_BATHROOM']
      .map((name, i) => [name, targets[i + 7]]));
    nodes[v.rootNode] = {
      name: 'D1F_WC_THEMO_ROOT_' + v.variant + '_SERVICE_WC3530_CENTERED_LID450_ODENSVIK00193937_WORK_TEST',
      children: targets,
      extras: {
        WORK_TEST_ONLY: true, current:false, Canonical:false, asBuilt:false,
        publishToCURRENT:false, HUMAN_REVIEW:'NOT_RUN',
        counterNode:targets[0], cabinetNode:targets[1],
        surfaceNodes:surfaces, themoNodes:themos,
        parentNodeIndex:999, parentServiceRoot:998,
      },
    };
    scenes[v.sceneIndex] = {
      name: 'D1F WC CLOSED LID450 ' + v.variant + ' WORK_TEST + IKEA ODENSVIK 00193937 BOWL/TOP PRODUCT CORRECTION WORK_TEST',
      nodes:[v.rootNode],
      extras:{
        WORK_TEST_ONLY:true, current:false, Canonical:false, asBuilt:false,
        publishToCURRENT:false, HUMAN_REVIEW:'NOT_RUN', productNumber:'001.939.37',
        parentApprovedWCModelSha256:D1F_ODENSVIK_SOURCE.wcParentSha256,
      },
    };
  }
  return { asset:{version:'2.0'}, nodes, scenes };
};

test('D1F ODENSVIK one-link source selection validates 4 exact review scenes and all 40 live pointers', () => {
  const source = buildSceneSource();
  expect(D1F_ODENSVIK_VARIANTS.map((x:any)=>x.sceneIndex)).toEqual([108,109,110,111]);
  expect(D1F_ODENSVIK_SOURCE.originalSceneCount).toBe(108);
  expect(D1F_ODENSVIK_SOURCE.bytes).toBe(8876156);
  expect(D1F_ODENSVIK_SOURCE.sha256).toBe('362f5dce1041e8f529ed8f69a10d06dad58b59d8bfad0fe9db31c62d870f2e25');
  expect(isD1FOdensvikReviewRequested('?review='+D1F_ODENSVIK_REVIEW_ID)).toBe(true);
  expect(isD1FOdensvikReviewRequested('?review='+D1F_ODENSVIK_CANDIDATE_ID)).toBe(false);
  for (const v of D1F_ODENSVIK_VARIANTS) {
    const selected = selectD1FOdensvikScene(source, v.variant);
    expect(selected).toMatchObject({
      variant:v.variant, sceneIndex:v.sceneIndex, rootNode:v.rootNode,
      sourceSemanticTargetsVerified:40, individualProductionPixelsVerified:false,
      humanReview:'NOT_RUN', current:false, canonical:false, asBuilt:false,
    });
  }
});

test('source review rejects even one stale counter/cabinet/surface/themo pointer in an unselected scene', () => {
  const corruptions = [
    (r:any) => r.counterNode = 2243,
    (r:any) => r.cabinetNode = 2245,
    (r:any) => r.surfaceNodes.KPH_FLOOR = 2246,
    (r:any) => r.themoNodes.THEMO_BATHROOM = 2238,
  ];
  for (const corrupt of corruptions) {
    const source = buildSceneSource();
    corrupt(source.nodes[D1F_ODENSVIK_VARIANTS[2].rootNode].extras);
    expect(() => selectD1FOdensvikScene(source, D1F_ODENSVIK_VARIANTS[0].variant))
      .toThrow('D1F_ODENSVIK_SOURCE_SCENE_REJECTED');
  }
});

test('source review fails closed for scene identity, WC approval provenance and non-WORK_TEST flags', () => {
  const changes = [
    (s:any)=>s.scenes[108].extras.current=true,
    (s:any)=>s.scenes[111].extras.HUMAN_REVIEW='PASS',
    (s:any)=>s.scenes[109].extras.parentApprovedWCModelSha256='wrong',
    (s:any)=>s.scenes[110].nodes=[0],
    (s:any)=>s.nodes[2428].extras.publishToCURRENT=true,
    (s:any)=>s.scenes[108].name='old WC scene',
  ];
  for(const change of changes) {
    const s=buildSceneSource();change(s);
    expect(()=>selectD1FOdensvikScene(s)).toThrow('D1F_ODENSVIK_SOURCE_SCENE_REJECTED');
  }
  expect(()=>selectD1FOdensvikScene(buildSceneSource(),'UNSUPPORTED_VARIANT'))
    .toThrow('D1F_ODENSVIK_SOURCE_SCENE_REJECTED');
});

test('source loader refuses old SHA candidate and bypassed/non-review URLs before fetching', async () => {
  let fetchCount=0;
  const fetcher=async()=>{fetchCount++;throw Error('fetch must not happen')};
  const candidate={
    id:D1F_ODENSVIK_CANDIDATE_ID,
    path:'/private-model/work-test/'+D1F_ODENSVIK_CANDIDATE_ID+'.glb',
    expectedSize:D1F_ODENSVIK_SOURCE.bytes,
    expectedSha256:'cf1ab6925f5aa200929739c0a0b71455f79d5d4e500e4d0b601a0e9eda3e8a9e',
  };
  const loader={parseAsync:async()=>{throw Error('parse must not happen')}};
  await expect(loadD1FOdensvikReview({
    candidate,search:'?review='+D1F_ODENSVIK_REVIEW_ID,loader,fetcher,
  })).rejects.toThrow('D1F_ODENSVIK_SOURCE_SCENE_REJECTED');
  await expect(loadD1FOdensvikReview({
    candidate:{...candidate,expectedSha256:D1F_ODENSVIK_SOURCE.sha256},
    search:'?review=some-other-candidate-review',loader,fetcher,
  })).rejects.toThrow('D1F_ODENSVIK_SOURCE_SCENE_REJECTED');
  expect(fetchCount).toBe(0);
  await expect(verifyD1FOdensvikRawGlb(new Uint8Array(100),D1F_ODENSVIK_VARIANTS[0].variant))
    .rejects.toThrow('D1F_ODENSVIK_SOURCE_SCENE_REJECTED');
});
