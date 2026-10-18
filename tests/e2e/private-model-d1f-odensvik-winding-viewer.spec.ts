import { test, expect } from '@playwright/test';
import {
  D1F_ODENSVIK_WINDING_CANDIDATE_ID,
  D1F_ODENSVIK_WINDING_REVIEW_ID,
  D1F_ODENSVIK_WINDING_SOURCE,
  D1F_ODENSVIK_WINDING_VARIANTS,
  isD1FOdensvikWindingReviewRequested,
  selectD1FOdensvikWindingScene,
  loadD1FOdensvikWindingReview,
} from '../../src/scripts/privateModelD1FOdensvikWindingReview.mjs';

// Synthetic geometry index, not an alternate source or a physical model.
// The runtime must still authenticate and SHA-check the exact real 8.9 MB GLB.
function fixture() {
  const nodes: Array<{ name?: string; children?: number[]; mesh?: number; extras?: any }> = Array.from({length:2660},()=>({name:'',children:[]}));
  const meshes = Array.from({length:769},()=>({}));
  const scenes: Array<{ name?: string; nodes?: number[]; extras?: any }> = Array.from({length:116},()=>({}));
  D1F_ODENSVIK_WINDING_VARIANTS.forEach((row,i)=>{
    const oldRoot = 2428 + 56*i;
    scenes[108+i] = {nodes:[oldRoot],extras:{WORK_TEST_ONLY:true}};
    const counter = row.counterNode;
    const cabinet = 100 + i*100;
    const bowl = 101 + i*100;
    const surface = Array.from({length:5},(_,j)=>102+i*100+j);
    const themos = Array.from({length:3},(_,j)=>107+i*100+j);
    nodes[counter] = {name:'COUNTER_WINDING_FIX104',mesh:768};
    nodes[cabinet] = {name:'CABINET',mesh:624+9*i};
    nodes[bowl] = {name:'D1F_SERVICE_BASIN_BOWL_SOURCE',mesh:i<2?766:767};
    const children = [counter,cabinet,bowl,...surface,...themos,
      ...Array.from({length:32},(_,j)=>1000+i*50+j)];
    // Three source elements overlap the padding in neither ID nor semantics.
    expect(children).toHaveLength(43);
    nodes[row.rootNode] = {
      name:'D1F_WC_THEMO_ROOT_'+row.variant+'_ODENSVIK00193937_WORK_TEST_WINDING_CORRECTED',
      children,
      extras:{
        counterNode:counter,cabinetNode:cabinet,
        surfaceNodes:Object.fromEntries(surface.map((id,j)=>['surface'+j,id])),
        themoNodes:Object.fromEntries(themos.map((id,j)=>['themo'+j,id])),
        counterFaceWindingCorrected:true,
        counterFaceWindingSourceMesh:765,counterFaceWindingNewMesh:768,
        WORK_TEST_ONLY:true,current:false,Canonical:false,asBuilt:false,
        publishToCURRENT:false,HUMAN_REVIEW:'NOT_RUN',
      },
    };
    scenes[row.sceneIndex] = {
      name:'SOURCE_'+row.variant+'_COUNTER_WINDING_CORRECTED_WORK_TEST',
      nodes:[row.rootNode],
      extras:{
        sourceScenePreserved:108+i,sourceCounterMesh:765,correctedCounterMesh:768,
        counterFaceWindingCorrected:true,productNumber:'001.939.37',
        WORK_TEST_ONLY:true,current:false,Canonical:false,asBuilt:false,
        publishToCURRENT:false,HUMAN_REVIEW:'NOT_RUN',
      },
    };
  });
  return {asset:{version:'2.0'},scene:112,scenes,nodes,meshes};
}
test('corrected ODENSVIK identity is separate from original 112-scene review',()=>{
  expect(isD1FOdensvikWindingReviewRequested('?review='+D1F_ODENSVIK_WINDING_REVIEW_ID)).toBe(true);
  expect(isD1FOdensvikWindingReviewRequested('?review=d1f-odensvik-00193937-basin-correction-20261017-review')).toBe(false);
  expect(D1F_ODENSVIK_WINDING_CANDIDATE_ID).toBe('d1f-odensvik-00193937-counter-winding-fixed-20261018');
  expect(D1F_ODENSVIK_WINDING_SOURCE.bytes).toBe(8899324);
  expect(D1F_ODENSVIK_WINDING_SOURCE.sha256).toHaveLength(64);
});
test('all four corrected source scenes retain 40 unique semantic pointers',()=>{
  const source=fixture();
  for(const [i,row] of D1F_ODENSVIK_WINDING_VARIANTS.entries()){
    const selected=selectD1FOdensvikWindingScene(source,row.variant);
    expect(selected.sceneIndex).toBe(112+i);
    expect(selected.rootNode).toBe(row.rootNode);
    expect(selected.counterNode).toBe(row.counterNode);
    expect(selected.sourceTargetCount).toBe(40);
    expect(selected.humanReview).toBe('NOT_RUN');
    expect(selected.individualProductionPixelsVerified).toBe(false);
  }
});
test('fail closed on changed corrected face, wrong source default and old source alias',()=>{
  const a=fixture();
  a.nodes[2652].mesh=765;
  expect(()=>selectD1FOdensvikWindingScene(a)).toThrow(/ORIGINAL|source/i);
  const b=fixture();
  b.scene=108;
  expect(()=>selectD1FOdensvikWindingScene(b)).toThrow(/SOURCE_REJECTED/);
  const c=fixture();
  c.scenes[112].extras.HUMAN_REVIEW='PASS';
  expect(()=>selectD1FOdensvikWindingScene(c)).toThrow(/SOURCE_REJECTED/);
  const d=fixture();
  d.nodes[2653].extras.surfaceNodes.surface1=d.nodes[2653].extras.surfaceNodes.surface0;
  expect(()=>selectD1FOdensvikWindingScene(d)).toThrow(/SOURCE_REJECTED/);
  expect(()=>selectD1FOdensvikWindingScene(fixture(),'unknown' as any)).toThrow(/SOURCE_REJECTED/);
});

// A genuine catalog candidate has exactly three fields; its bytes and hash
// are verified against this module's pinned source, NEVER catalog metadata.
test('production catalog three-field candidate reaches exact raw GLB verifier',async()=>{
  const path='/private-model/work-test/'+D1F_ODENSVIK_WINDING_CANDIDATE_ID+'.glb';
  const catalogCandidate={id:D1F_ODENSVIK_WINDING_CANDIDATE_ID,
    label:'Corrected counter WORK_TEST',path};
  let fetched=0;
  const fetcher=async (url:string,options:any)=>{
    fetched++;
    expect(url).toBe(path);
    expect(options.credentials).toBe('same-origin');
    expect(options.redirect).toBe('error');
    expect(options.cache).toBe('no-store');
    // Not the source: deliberately reject invalid bytes after fetch.
    return {status:200,redirected:false,url:'https://aapopihkala.fi'+path,
      arrayBuffer:async()=>new Uint8Array([103,108,84,70]).buffer};
  };
  await expect(loadD1FOdensvikWindingReview({
    candidate:catalogCandidate,
    search:'?review='+D1F_ODENSVIK_WINDING_REVIEW_ID,
    loader:{parseAsync:async()=>{throw Error('must-not-parse-invalid-raw');}},
    fetcher:fetcher as any,origin:'https://aapopihkala.fi',
  })).rejects.toThrow('ODENSVIK_WINDING_SOURCE_REJECTED:source-size-or-crypto');
  expect(fetched).toBe(1);
});
test('wrong catalog candidate or path never fetches any GLB',async()=>{
  const path='/private-model/work-test/'+D1F_ODENSVIK_WINDING_CANDIDATE_ID+'.glb';
  let fetched=0;
  const fetcher=async()=>{fetched++;throw Error('wrong asset fetched');};
  for(const candidate of [
    {id:'d1f-odensvik-00193937-basin-correction-20261017',label:'Old',path},
    {id:D1F_ODENSVIK_WINDING_CANDIDATE_ID,label:'Wrong path',path:'/private-model/work-test/other.glb'},
  ]){
    await expect(loadD1FOdensvikWindingReview({
      candidate,search:'?review='+D1F_ODENSVIK_WINDING_REVIEW_ID,
      loader:{parseAsync:async()=>{}},fetcher:fetcher as any,origin:'https://aapopihkala.fi',
    })).rejects.toThrow('ODENSVIK_WINDING_SOURCE_REJECTED:candidate-review-identity');
  }
  expect(fetched).toBe(0);
});
