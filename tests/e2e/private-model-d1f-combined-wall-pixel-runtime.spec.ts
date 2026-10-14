import { test, expect } from '@playwright/test';
import * as THREE from 'three';
import { createD1FCombinedWallPixelRuntime } from '../../src/scripts/privateModelD1FCombinedWallPixelRuntime.mjs';
import { D1F_COMBINED_WALL_ASSETS } from '../../src/scripts/privateModelD1FCombinedWallSceneContract.mjs';

const sha = D1F_COMBINED_WALL_ASSETS['d1f-combined-wall-115-100-20261013'].sha256;
const triangles = [0,1,2,0,2,3,4,6,5,4,7,6,0,4,5,0,5,1,1,5,6,1,6,2,2,6,7,2,7,3,3,7,4,3,4,0];
function fixture() {
  const scene = new THREE.Scene(), wall = new THREE.Group();
  wall.userData.sourceNodeIndex = 798; scene.add(wall);
  const positions = new Float32Array(600);
  const box = [[0,0,0],[.96,0,0],[.96,2.76,0],[0,2.76,0],
    [0,0,.205],[.96,0,.205],[.96,2.76,.205],[0,2.76,.205]];
  box.forEach((p,i) => positions.set(p, (128+i)*3));
  // Unindexed archive positions must not broaden the I03 projected ROI.
  positions.set([999,999,999], 2*3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions,3));
  geometry.setIndex([...triangles.map(i=>i+144), ...triangles.map(i=>i+128),
    ...Array.from({length:4},()=>triangles.map(i=>i+176)).flat()]);
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
  wall.add(mesh);
  const names = ['CORNER_NORTH_X2337','CORNER_SOUTH_X2337','CORNER_MIDDLE_X2589'];
  const corners = names.map((name,i) => {
    const object = new THREE.Mesh(new THREE.BoxGeometry(.04,2.76,.04),new THREE.MeshBasicMaterial());
    object.position.set(i+1,1.38,-1);
    object.userData.independentlyAddressableCorner=name; wall.add(object);
    return {name,object};
  });
  const camera = new THREE.PerspectiveCamera(38,1280/900,.01,5000);
  camera.position.set(4,4,4); camera.lookAt(0,0,0);camera.updateMatrixWorld(true);
  const controls:any = {target:new THREE.Vector3(),enabled:true,enableDamping:true,autoRotate:false,
    update(){ camera.lookAt(this.target);camera.updateMatrixWorld(true); }};
  const selected={scene,wall,corners,variant:'WEST_ANCHOR_725_895_740'};
  const options={THREE,selected,sourceSha:sha,camera,controls,
    canvas:{getBoundingClientRect:()=>({width:1280,height:900})},render:()=>{}};
  return {mesh,wall,corners,camera,controls,options};
}

test('I03 removes only its middle source indices and preserves first left-wall indices', () => {
  const f=fixture(), original=f.mesh.geometry;
  const runtime=createD1FCombinedWallPixelRuntime(f.options);
  const prepared=runtime.prepare('I03');
  expect(prepared.sourceI03Indices).toEqual({count:36,sourceVertices:[128,135],
    offsets:Array.from({length:12},(_,i)=>36+i*3)});
  expect(prepared.roi.width).toBeLessThan(700);
  expect(prepared.roi.height).toBeLessThan(900);
  runtime.suppress('I03');
  expect(f.mesh.geometry.index!.count).toBe(180);
  expect(Array.from(f.mesh.geometry.index!.array).slice(0,36))
    .toEqual(triangles.map(i=>i+144));
  expect(Array.from(f.mesh.geometry.index!.array).some(i=>i>=128&&i<=135)).toBe(false);
  expect(f.mesh.visible).toBe(true);
  expect(f.corners.every(c=>c.object.visible)).toBe(true);
  expect(runtime.restore()).toMatchObject({state:'RESTORED',suppressionRestored:true,
    cameraFingerprint:prepared.cameraFingerprint});
  expect(f.mesh.geometry).toBe(original);
  expect(original.index!.count).toBe(216);
  runtime.dispose();
});

test('each corner suppression affects one node and restores camera and controls on dispose', () => {
  const f=fixture(), originalPose=f.camera.matrixWorld.toArray(), originalTarget=f.controls.target.toArray();
  const runtime=createD1FCombinedWallPixelRuntime(f.options);
  for(const corner of f.corners) {
    runtime.prepare(corner.name);
    runtime.suppress(corner.name);
    expect(f.corners.filter(c=>!c.object.visible).map(c=>c.name)).toEqual([corner.name]);
    expect(f.mesh.visible).toBe(true);expect(f.mesh.geometry.index!.count).toBe(216);
    runtime.restore();
  }
  runtime.dispose();
  expect(f.camera.matrixWorld.toArray()).toEqual(originalPose);
  expect(f.controls.target.toArray()).toEqual(originalTarget);
  expect(f.controls.enabled).toBe(true);expect(f.controls.enableDamping).toBe(true);
  expect(()=>runtime.prepare('I03')).toThrow('D1F_SOURCE_PIXEL_RUNTIME_REJECTED');
});

test('wrong SHA and ambiguous I03 indices reject before geometry or visibility mutation', () => {
  const f=fixture(), original=f.mesh.geometry;
  expect(()=>createD1FCombinedWallPixelRuntime({...f.options,sourceSha:'0'.repeat(64)})).toThrow();
  f.mesh.geometry.setIndex([...triangles.map(i=>i+144),...Array.from({length:5},()=>triangles).flat()]);
  expect(()=>createD1FCombinedWallPixelRuntime(f.options)).toThrow();
  expect(f.mesh.geometry).toBe(original);expect(f.corners.every(c=>c.object.visible)).toBe(true);
});

test('unknown target, second suppression and camera drift cannot produce restored evidence', () => {
  const f=fixture(), runtime=createD1FCombinedWallPixelRuntime(f.options);
  expect(()=>runtime.prepare('SAUNA')).toThrow();
  runtime.prepare('I03');runtime.suppress('I03');
  expect(()=>runtime.suppress('I03')).toThrow();
  runtime.restore();f.camera.position.x+=1;
  expect(()=>runtime.suppress('I03')).toThrow();
  runtime.dispose();
});


test('actual production probe rejects untrusted calls and redacts upstream errors before any review claim', async () => {
  const {readFileSync} = await import('node:fs');
  const {createHash} = await import('node:crypto');
  const {runInNewContext} = await import('node:vm');
  const source=readFileSync('.github/scripts/private-model-d1f-combined-production-probe.mjs','utf8')
    .replace(/^import .* from '[^']+';\n/gm,'');
  for(const scenario of ['non-main','wrong-mode','missing-auth','upstream-error','wrong-event']) {
    const trustedVariant='WEST_ANCHOR_725_895_740';
    const canary='TEST_ONLY_PROBE_SECRET_DO_NOT_EXPORT';
    const env:Record<string,string>={GITHUB_EVENT_NAME:'workflow_dispatch',PROBE_MODE:'d1f-combined-pixels',
      D1F_COMBINED_VARIANT:trustedVariant,GITHUB_REF:'refs/heads/main',
      GITHUB_REPOSITORY:'aapojohannespihkala-lgtm/aapopihkala-fi',GITHUB_SHA:'a'.repeat(40),
      PUBLISH_SOURCE_WORKFLOW_ID:'372000543',PUBLISH_SOURCE_CONCLUSION:'success',
      PUBLISH_SOURCE_REF:'main',PUBLISH_SOURCE_TITLE:'Publish WORK_TEST - d1f-combined-wall-115-100-20261013',
      PUBLISH_SOURCE_HEAD:'a'.repeat(40),CF_ACCESS_VIEWER_PROBE_CLIENT_ID:'TEST_ONLY_CLIENT',
      CF_ACCESS_VIEWER_PROBE_CLIENT_SECRET:canary};
    if(scenario==='non-main')env.GITHUB_REF='refs/heads/untrusted';
    if(scenario==='wrong-mode')env.PROBE_MODE='full-render';
    if(scenario==='wrong-event')env.GITHUB_EVENT_NAME='pull_request';
    if(scenario==='missing-auth')env.CF_ACCESS_VIEWER_PROBE_CLIENT_ID='';
    let launch=0;const writes:string[]=[],logs:string[]=[];
    const fakeProcess:{env:Record<string,string>,exitCode?:number}={env};
    await runInNewContext('(async()=>{'+source+'\n})()',{
      fs:{mkdirSync:()=>{},writeFileSync:(_p:string,v:string)=>writes.push(v)},
      createHash,Buffer,setTimeout,clearTimeout,process:fakeProcess,
      chromium:{launch:async()=>{launch++;throw new Error(canary);}},
      D1F_COMBINED_WALL_ASSETS,D1F_COMBINED_WALL_VARIANTS:[trustedVariant],
      D1F_FOUR_PIXEL_TARGETS:[],evaluateD1FOneTargetPixelSample:()=>{},
      evaluateD1FFourTargetPixelGate:()=>{},console:{log:(v:string)=>logs.push(v)},
    });
    expect(launch).toBe(scenario==='upstream-error'?1:0);
    expect(fakeProcess.exitCode).toBe(1);expect(writes).toHaveLength(1);
    expect(JSON.parse(writes[0])).toMatchObject({result:'FAIL',authenticatedAutoloadVerified:false,
      actualBrowserWebGlVerified:false,fourTargetsRenderedVerified:false,humanReview:'NOT_RUN',
      current:false,asBuilt:false});
    expect(writes.join('')+logs.join('')).not.toContain(canary);
  }
});


test('explicit D1F dispatch gate accepts only the exact mode on main', async () => {
  const {readFileSync}=await import('node:fs');
  const {runInNewContext}=await import('node:vm');
  const source=readFileSync('.github/workflows/private-model-production-review-smoke.yml','utf8');
  const expression=source.split('  verify-d1f-combined-pixels:')[1].split('    runs-on:')[0]
    .split('    if:')[1].trim();
  const github={event_name:'workflow_dispatch',ref:'refs/heads/main'};
  expect(runInNewContext('('+expression+')',{github,inputs:{probe_mode:'d1f-combined-pixels'}})).toBe(true);
  for(const context of [
    {github:{...github,event_name:'pull_request'},inputs:{probe_mode:'d1f-combined-pixels'}},
    {github:{...github,ref:'refs/heads/topic'},inputs:{probe_mode:'d1f-combined-pixels'}},
    {github,inputs:{probe_mode:'full-render'}},
  ])expect(runInNewContext('('+expression+')',context)).toBe(false);
});

test('actual automerge selector requests the fixed main D1F probe only for relevant source changes', async () => {
  const {readFileSync}=await import('node:fs');
  const {spawnSync}=await import('node:child_process');
  const source=readFileSync('.github/workflows/build-check.yml','utf8');
  const selected=source.split('          d1f_probe_changed=false')[1].split('          state=')[0]
    .split('\n').map(l=>l.replace(/^          /,'')).join('\n');
  const script='function gh() { printf "%s\\n" "$TEST_D1F_CHANGED_FILES"; }\n'+
    'd1f_probe_changed=false'+selected+'\nprintf "%s" "$d1f_probe_changed"';
  for(const [file,want] of [
    ['src/pages/private-model/index.astro','true'],
    ['src/scripts/privateModelD1FCombinedWallPixelRuntime.mjs','true'],
    ['.github/workflows/private-model-production-review-smoke.yml','true'],
    ['src/components/current/CurrentWeather.astro','false'],['README.md','false'],
  ]) {
    const result=spawnSync('bash',['-c',script],{encoding:'utf8',
      env:{...process.env,TEST_D1F_CHANGED_FILES:file,GITHUB_REPOSITORY:'owner/repo',PR_NUMBER:'1'}});
    expect(result.status,result.stderr).toBe(0);expect(result.stdout).toBe(want);
  }
  expect(source).toContain('"probe_mode":"d1f-combined-pixels"');
  expect(source).toContain('private-model-production-review-smoke.yml/dispatches');
});


test('render frame lock preserves the exact paired camera after orbit and projection updates', () => {
  const f=fixture(), original=f.camera.matrixWorld.toArray();
  const runtime=createD1FCombinedWallPixelRuntime(f.options);
  const prepared=runtime.prepare('CORNER_NORTH_X2337');
  f.camera.position.x+=1e-12;
  f.camera.quaternion.x+=1e-14;
  f.camera.aspect+=1e-12;
  f.camera.updateProjectionMatrix();f.camera.updateMatrixWorld(true);
  runtime.pinFrame();
  runtime.suppress('CORNER_NORTH_X2337');
  f.controls.update();f.camera.position.z+=1e-12;
  runtime.pinFrame();
  expect(runtime.restore()).toMatchObject({suppressionRestored:true,
    cameraFingerprint:prepared.cameraFingerprint});
  runtime.dispose();runtime.pinFrame();
  expect(f.camera.matrixWorld.toArray()).toEqual(original);
  expect(f.controls.enabled).toBe(true);
});
