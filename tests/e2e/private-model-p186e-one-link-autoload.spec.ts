import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';

const candidateId='p186e-x1-d2015-electrical-source-label-anchors-p28-corrected';
const reviewId=candidateId+'-review';

// Execute the actual final viewer bootstrap, including its awaited call order.
// Browser cases below also exercise the real URL predicate and page startup.
async function sourceBootstrap(exactP186e:boolean,exactC70=false,exactC80=false,exactHi12=false){
  const source=readFileSync('src/pages/private-model/index.astro','utf8');
  const tail=source.slice(source.lastIndexOf('      void (async () => {'));
  const end='      })();';
  const program=tail.slice(0,tail.indexOf(end)+end.length).trim().replace(/^void /,'');
  // Preserve actual bootstrap semantics while erasing Astro TypeScript annotations.
  const jsProgram=ts.transpileModule(program,{
    compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None},
  }).outputText;
  const calls:string[]=[],canvas={dataset:{} as Record<string,string>};
  const candidate=exactP186e?{id:candidateId}:null;
  await runInNewContext(jsProgram,{
    window:{location:{search:exactP186e?'?review='+reviewId:''}},
    hi12DirectRequested:exactHi12,
    c70DirectRequested:exactC70,
    c80DirectRequested:exactC80,
    loadProtectedHi12:async()=>{calls.push('HI12_WORK_TEST');},
    loadProtectedC70:async()=>{calls.push('C70_WORK_TEST');},
    loadProtectedC80:async()=>{calls.push('C80_WORK_TEST');},
    isP137EScene67ReviewRequested:()=>false,
    isP186eElectricalLabelReviewRequested:()=>exactP186e,
    isD1FCombinedWallReviewRequested:()=>false,
    isD1FShowerPhotoReviewRequested:()=>false,
    // In the ordinary CURRENT-first case these separate exact review routes
    // must be false; the test executes the real bootstrap with VM fixtures.
    isM5AR1125NumberedScene64Requested:()=>false,
    isD1FScene150ReviewRequested:()=>false,
    d1fSource156ReviewRequested:()=>false,
    d1fSource156OriginalFocusFromLink:()=>null,
    isPrivateModelReviewRequested:()=>false,m5aZ2R1125ReviewId:'r1125-review',
    getRequestedReviewCandidateId:()=>candidate?.id??null,
    loadCurrentModel:async()=>{calls.push('CURRENT');},
    importWorkTestCandidateFromFragment:async()=>false,
    loadWorkTestCatalog:async()=>{calls.push('CATALOG');},
    workTestCandidates:new Map(candidate?[[candidate.id,candidate]]:[]),
    loadWorkTestCandidate:async()=>{calls.push('P186E_WORK_TEST');return true;},
    setWorkTestUploadFallback:()=>{},status:{textContent:''},canvas,
  });
  return {calls,dataset:canvas.dataset};
}

test('source bootstrap directly loads exact P186E without CURRENT dependency',async()=>{
  const result=await sourceBootstrap(true);
  expect(result.calls).toEqual(['CATALOG','P186E_WORK_TEST']);
  expect(result.dataset.workTestReviewAutoload).toBe('true');
});

test('source bootstrap preserves ordinary CURRENT-first startup',async()=>{
  const result=await sourceBootstrap(false);
  expect(result.calls).toEqual(['CURRENT','CATALOG']);
  expect(result.dataset.workTestReviewAutoload).toBeUndefined();
});

test('source bootstrap isolates explicit C70 direct opening from CURRENT and generic reviews',async()=>{
  const result=await sourceBootstrap(false,true);
  expect(result.calls).toEqual(['C70_WORK_TEST']);
  expect(result.dataset.workTestReviewAutoload).toBeUndefined();
});

test('source bootstrap isolates explicit C80 and never falls back to C70 or CURRENT',async()=>{
  for (const c70 of [false, true]) {
    const result=await sourceBootstrap(false,c70,true);
    expect(result.calls).toEqual(['C80_WORK_TEST']);
    expect(result.dataset.workTestReviewAutoload).toBeUndefined();
  }
});

test('source bootstrap isolates HI12 before legacy sources and CURRENT',async()=>{
  for (const c70 of [false,true]) for (const c80 of [false,true]) {
    const result=await sourceBootstrap(false,c70,c80,true);
    expect(result.calls).toEqual(['HI12_WORK_TEST']);
    expect(result.dataset.workTestReviewAutoload).toBeUndefined();
  }
});

for (const suffix of ['?hi12=1','?review=ylisrinne-d-c80-hi12-work-test-20261029-review']) {
  test('HI12 source rejection never loads CURRENT or legacy fallback '+suffix,async({page})=>{
    let currentRequests=0,hi12Requests=0;
    await page.route('**/private-model/model.glb',route=>{
      currentRequests++;return route.fulfill({status:404,body:'CURRENT unavailable'});
    });
    await page.route('**/private-model/work-test/ylisrinne-d-c80-hi12-work-test-20261029.glb',route=>{
      hi12Requests++;return route.fulfill({status:404,body:'HI12 unavailable'});
    });
    await page.goto('/private-model/'+suffix);
    const canvas=page.locator('#private-model-canvas');
    await expect(canvas).toHaveAttribute('data-c80-preview','rejected');
    expect(currentRequests).toBe(0);expect(hi12Requests).toBe(1);
    expect(await canvas.getAttribute('data-c80-source-sha256')).toBeNull();
  });
}

for(const floor of ['d1f','d2f']){
  test('real browser exact P186E '+floor+' does not request CURRENT before its catalog',async({page})=>{
    let currentRequests=0;
    await page.route('**/private-model/model.glb',route=>{
      currentRequests++;return route.fulfill({status:404,body:'CURRENT deliberately unavailable'});
    });
    await page.route('**/private-model/work-test/catalog.json',route=>route.fulfill({
      json:{candidates:[]},
    }));
    await page.goto('/private-model/?review='+reviewId+'&floor='+floor);
    const canvas=page.locator('#private-model-canvas');
    await expect(canvas).toHaveAttribute('data-work-test-catalog','empty');
    expect(currentRequests).toBe(0);
    // A missing candidate remains unapproved. No synthetic render proof.
    expect(await canvas.getAttribute('data-work-test-review-autoload')).not.toBe('true');
  });
}

for(const suffix of ['', '?review=unrecognized-p186e-review']){
  test('real browser ordinary or unknown review retains CURRENT-first '+(suffix||'default'),async({page})=>{
    let currentRequests=0;
    await page.route('**/private-model/model.glb',route=>{
      currentRequests++;return route.fulfill({status:404,body:'CURRENT deliberately unavailable'});
    });
    await page.route('**/private-model/work-test/catalog.json',route=>route.fulfill({json:{candidates:[]}}));
    await page.goto('/private-model/'+suffix);
    await expect(page.locator('#private-model-canvas')).toHaveAttribute('data-work-test-catalog','empty');
    expect(currentRequests).toBe(1);
  });
}

