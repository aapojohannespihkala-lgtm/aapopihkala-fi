import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
// @ts-ignore - exact source-loader uses a source-authenticated standalone ESM contract.
import {
  D1F_SHOWER_PHOTO_CANDIDATE_ID,
  isD1FShowerPhotoReviewRequested,
  loadD1FShowerPhotoReview,
} from '../../src/scripts/privateModelD1FShowerPhotoSourceContract.mjs';

const candidate = Object.freeze({
  id: 'd1f-shower-glass-photo-20261016',
  path: '/private-model/work-test/d1f-shower-glass-photo-20261016.glb',
});
const search = '?review=d1f-shower-glass-photo-20261016-review';
const reject = 'D1F_SHOWER_PHOTO_SOURCE_OR_VARIANT_INVALID';
const asFetch = (fake: (...args: any[]) => any): typeof fetch => fake as typeof fetch;
const makeLoader = () => {
  let count = 0;
  return { parseAsync: async () => { count++; return {}; }, get calls(){return count;} };
};

test('only exact shower review query activates dedicated source route', () => {
  expect(D1F_SHOWER_PHOTO_CANDIDATE_ID).toBe(candidate.id);
  expect(isD1FShowerPhotoReviewRequested(search)).toBe(true);
  expect(isD1FShowerPhotoReviewRequested('?review=d1f-bathroom-surfaces-cabinet-20261015-review')).toBe(false);
  expect(isD1FShowerPhotoReviewRequested('?review=d1f-shower-glass-photo-20261016')).toBe(false);
});

test('viewer uses source-bound fetch-and-parse, selected scene, and no-current bootstrap', () => {
  const index = readFileSync('src/pages/private-model/index.astro', 'utf8');
  expect(index).toContain('loadD1FShowerPhotoReview({ candidate, search: window.location.search, loader })');
  expect(index).toContain('serviceModel?.gltf ?? showerPhotoReview?.gltf ?? odensvikReview?.gltf ?? combinedWallReview?.gltf');
  expect(index).toContain('!isD1FShowerPhotoReviewRequested(window.location.search)');
  expect(index).toContain('d1fShowerPhotoSourceAuthenticated');
  expect(index).toContain("d1fShowerPhotoProductionPixelsVerified: 'false'");
  expect(index).toContain("d1fShowerPhotoHumanReview: 'NOT_RUN'");
  expect(index).not.toContain("d1fShowerPhotoHumanReview: 'PASS'");
});

test('rejects wrong candidate id and wrong catalog path before any fetch', async () => {
  let called = false;
  const fetcher = async () => {called = true; return null;};
  const loader = makeLoader();
  await expect(loadD1FShowerPhotoReview({
    candidate: {...candidate,id:'d1f-bathroom-surfaces-cabinet-20261015'},
    search,loader,fetcher:asFetch(fetcher),
  })).rejects.toThrow(reject);
  await expect(loadD1FShowerPhotoReview({
    candidate: {...candidate,path:'https://other.example/model.glb'},
    search,loader,fetcher:asFetch(fetcher),
  })).rejects.toThrow(reject);
  expect(called).toBe(false);
  expect(loader.calls).toBe(0);
});

test('rejects incompatible review query or unrecognized variant before fetch', async () => {
  const loader=makeLoader();let fetches=0;
  const fetcher = async () => {fetches++;return null;};
  for(const query of [
    '?review=d1f-bathroom-surfaces-cabinet-20261015-review',
    search+'&wallVariant=WRONG_GUESS',
  ]) {
    await expect(loadD1FShowerPhotoReview({candidate,search:query,loader,fetcher:asFetch(fetcher)})).rejects.toThrow(reject);
  }
  expect(fetches).toBe(0);expect(loader.calls).toBe(0);
});

test('rejects insecure origin or invalid timeout without fetch', async () => {
  const loader=makeLoader();let calls=0;
  const fetcher=async()=>{calls++; return null;};
  await expect(loadD1FShowerPhotoReview({candidate,search,loader,fetcher:asFetch(fetcher),origin:'http://aapopihkala.fi'})).rejects.toThrow(reject);
  await expect(loadD1FShowerPhotoReview({candidate,search,loader,fetcher:asFetch(fetcher),timeoutMs:25_001})).rejects.toThrow(reject);
  expect(calls).toBe(0);expect(loader.calls).toBe(0);
});

test('enforces exact same-origin request, no redirects, and auth configuration', async () => {
  const loader=makeLoader();let captured:any;
  const fetcher=async (url:string,init:any) => {
    captured={url,init};
    return {status:200,url:'https://untrusted.example/work-test/file.glb',redirected:false,arrayBuffer:async()=>new ArrayBuffer(1)};
  };
  await expect(loadD1FShowerPhotoReview({candidate,search,loader,fetcher:asFetch(fetcher)})).rejects.toThrow(reject);
  expect(captured.url).toBe(candidate.path);
  expect(captured.init.credentials).toBe('same-origin');
  expect(captured.init.mode).toBe('same-origin');
  expect(captured.init.redirect).toBe('error');
  expect(loader.calls).toBe(0);
});

test('refuses redirects, 403 and response body mutation before GLTFLoader', async () => {
  const loader=makeLoader();
  const url='https://aapopihkala.fi'+candidate.path;
  for(const response of [
    {status:200,url,redirected:true,arrayBuffer:async()=>new ArrayBuffer(1)},
    {status:403,url,redirected:false,arrayBuffer:async()=>new ArrayBuffer(1)},
    {status:200,url,redirected:false,arrayBuffer:async()=>new ArrayBuffer(1)},
  ]) {
    await expect(loadD1FShowerPhotoReview({candidate,search,loader,fetcher:asFetch(async()=>response)})).rejects.toThrow(reject);
  }
  expect(loader.calls).toBe(0);
});

test('same-size forged bytes are rejected by GLB before scene parse', async () => {
  const loader=makeLoader();
  const raw=new ArrayBuffer(8_914_072);
  await expect(loadD1FShowerPhotoReview({
    candidate,search,loader,fetcher:asFetch(async()=>({
      status:200,url:'https://aapopihkala.fi'+candidate.path,redirected:false,arrayBuffer:async()=>raw,
    })),
  })).rejects.toThrow(reject);
  expect(loader.calls).toBe(0);
});

test('pending or failed fetch does not fall back to other scene or CURRENT', async () => {
  const loader=makeLoader();
  await expect(loadD1FShowerPhotoReview({
    candidate,search,loader,timeoutMs:1,fetcher:asFetch(()=>new Promise(()=>{})),
  })).rejects.toThrow('D1F_SHOWER_PHOTO_FETCH_TIMEOUT');
  expect(loader.calls).toBe(0);
});

test('actual one-link shower viewer calls merged PR1353 original-glass oblique camera', () => {
  const index = readFileSync('src/pages/private-model/index.astro', 'utf8');
  expect(index).toContain("from '../../scripts/privateModelD1FShowerGlassSourceCameraFit.mjs'");
  const actualViewer = index.split('} else if (showerPhotoReview) {')[1]
    ?.split('} else if (combinedWallReview) {')[0] ?? '';
  expect(actualViewer).toContain('const showerCameraFit = planD1FSourceGlassCamera({');
  expect(actualViewer).toContain('sceneIndex: showerPhotoReview.selected.sceneIndex');
  expect(actualViewer).toContain('rootNode: showerPhotoReview.selected.rootNode');
  expect(actualViewer).toContain('glassNode: showerPhotoReview.selected.glassNode');
  expect(actualViewer).toContain('glassMeshIndex: 777');
  expect(actualViewer).toContain('min: glassBounds.min.toArray()');
  expect(actualViewer).toContain('max: glassBounds.max.toArray()');
  expect(actualViewer).toContain('sha256: showerPhotoReview.asset.sha256');
  expect(actualViewer).toContain('camera.position.set(');
  expect(actualViewer).toContain('showerCameraFit.position[0]');
  expect(actualViewer).toContain('controls.target.set(');
  expect(actualViewer).toContain("canvas.dataset.d1fShowerPhotoCameraFraming = 'SOURCE_WORLD_BOUNDS_OBLIQUE'");
  expect(actualViewer).toContain('controls.enabled = true');
  expect(actualViewer).toContain("canvas.dataset.d1fShowerPhotoProductionPixelsVerified = 'false'");
  expect(actualViewer).toContain("d1fShowerPhotoHumanReview: 'NOT_RUN'");
  expect(actualViewer).not.toContain('showerDistance * 0.78');
});
