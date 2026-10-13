import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { BufferGeometry, Float32BufferAttribute, Group, Mesh, MeshBasicMaterial, Uint16BufferAttribute } from 'three';
// @ts-ignore - narrow runtime candidate has its own fail-closed source proof.
import {
  stageP137EI03NormalWallReplacement,
  P137E_I03_NORMAL_INTEGRATION_QA_ID,
} from '../../src/scripts/privateModelP137EI03AtomicWallSwap.mjs';

const ROOT = 'P137E_SCENE69_THREE_SOURCE_CORNERS_AND_I03_FIELD_WORK_TEST_ROOT';
const arr = () => new Float32Array(176 * 3);
const box = (positions: Float32Array, first: number, x0: number, x1: number, y0: number, y1: number) => {
  const xy = [[x0,y1],[x1,y1],[x1,y0],[x0,y0]];
  for(let i=0;i<8;i++)
    positions.set([xy[i%4][0],xy[i%4][1],i<4?0:2.76],(first+i)*3);
};
const positions = () => {
  const p=arr();
  box(p,128,5.098,6.306,4.206,4.286);
  box(p,64,6.266,6.346,-1.124,10.544);
  box(p,136,.231,6.306,5.032,5.112);
  for(let i=0;i<176;i++) if (![64,65,66,67,68,69,70,71,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143].includes(i))
    p.set([i*.00001,i*.00002,i*.00003], i*3);
  return p;
};
const mesh = (p: Float32Array) => {
  const geom = new BufferGeometry();
  geom.setAttribute('position',new Float32BufferAttribute(p,3));
  return new Mesh(geom,new MeshBasicMaterial());
};
const patch = () => {
  const p=new Float32Array(72*3);
  for(let j=0;j<3;j++) {
    const [x,y]=[[2.297,10.544],[2.297,7.245149],[2.549,3.184]][j];
    for(let i=0;i<24;i++) p.set([x+(i%2)*.04,y+(Math.floor(i/2)%2)*.04,
      Math.floor(i/4)%2?2.76:0],(j*24+i)*3);
  }
  const geom=new BufferGeometry();
  geom.setAttribute('position',new Float32BufferAttribute(p,3));
  geom.setIndex(new Uint16BufferAttribute(Array.from({length:108},(_,i)=>i%72),1));
  const object=new Mesh(geom,new MeshBasicMaterial());
  object.name='P137E_THREE_CORNER_SOURCE_PATCHES';
  return object;
};
const fixture = () => {
  const scene=new Group();
  scene.name='D CURRENT INTERIOR - BABYLON Y-UP';
  const context=new Group();context.name='rest-of-building';
  const current=new Group(); current.name='P136B_VIEW_ROOT_D_CURRENT_INTERIOR_CORRECTED_BABYLON_Y_UP';
  const before=mesh(positions());before.name='P123C_D1F_WINDOW_TRANSPARENT_WALL_HELPER';
  const preservedChild=new Group();preservedChild.name='existing-wall-child';
  before.add(preservedChild);
  current.add(before);
  const sibling=mesh(new Float32Array(6*3));sibling.name='unrelated-building-mesh';
  current.add(sibling);
  scene.add(context,current);

  const measured=positions();
  box(measured,128,5.306,6.266,3.807,4.012);
  const candidate=mesh(measured);
  candidate.name='P137E_FIELD_I03_WALL_WITH_THREE_SOURCE_CORNER_PATCHES';
  candidate.add(patch());
  const root=new Group();root.name=ROOT;
  root.userData={sourceCornerGapsClosed:3,fieldMeasurementsCurrent:true,
    current:false,publishToCURRENT:false};
  root.add(candidate,new Group(),new Group(),new Group());
  const source=new Group();
  source.name='P137E D1F THREE SOURCE L CORNERS + MEASURED I03 WORK_TEST';
  source.add(root);
  return {scene,before,sibling,current,source,candidate,root,context};
};

test('unique normal-scene I03 replacement is atomic, not an overlay or 22-wall deletion', () => {
  const f=fixture();
  const beforeSiblings=[...f.current.children];
  const preservedGeometry=f.sibling.geometry;
  const basePositions=f.before.geometry.getAttribute('position');
  const result=stageP137EI03NormalWallReplacement(f.scene,f.source);
  expect(result.originalDetached).toBe(true);
  expect(result.insertedCount).toBe(1);
  expect(result.untouchedVertices).toBe(168);
  expect(result.sourceCorners).toBe(3);
  expect(f.before.parent).toBeNull();
  expect(f.current.children).toHaveLength(beforeSiblings.length);
  expect(f.current.children[0]).toBe(result.replacement);
  expect(f.current.children[1]).toBe(f.sibling);
  expect(f.scene.children).toEqual([f.context,f.current]);
  expect(f.sibling.geometry).toBe(preservedGeometry);
  expect(result.replacement.children.map((o:any)=>o.name))
    .toEqual(['existing-wall-child','P137E_THREE_CORNER_SOURCE_PATCHES']);
  const successor=result.replacement.geometry.getAttribute('position');
  for(let i=0;i<176;i++) if(i<128||i>=136)
    for(const axis of ['getX','getY','getZ'] as const)
      expect(successor[axis](i)).toBeCloseTo(basePositions[axis](i),5);
  const xs=Array.from({length:8},(_,i)=>successor.getX(128+i));
  const ys=Array.from({length:8},(_,i)=>successor.getY(128+i));
  expect(Math.max(...xs)-Math.min(...xs)).toBeCloseTo(.960,5);
  expect(Math.max(...ys)-Math.min(...ys)).toBeCloseTo(.205,5);
  expect(result.replacement.userData.i03IntegrationQa).toBe(P137E_I03_NORMAL_INTEGRATION_QA_ID);
  expect(result.replacement.userData.current).toBe(false);
  expect(result.replacement.userData.publishToCURRENT).toBe(false);
  expect(result.replacement.userData.HUMAN_REVIEW).toBe('NOT_RUN');
  expect(()=>stageP137EI03NormalWallReplacement(f.scene,f.source)).toThrow(/NORMAL_WALL_UNIQUE_MATCH_0/);
  expect(result.restoreOriginal()).toBe(true);
  expect(f.before.parent).toBe(f.current);
  expect(f.current.children).toEqual(beforeSiblings);
  expect(result.replacement.parent).toBeNull();
});

test('wrong source, missing 40mm patch or shared duplicate wall refuses all mutations', () => {
  for(const mutate of [
    (f:ReturnType<typeof fixture>)=>{f.source.name='unverified-source';},
    (f:ReturnType<typeof fixture>)=>{f.root.userData.sourceCornerGapsClosed=2;},
    (f:ReturnType<typeof fixture>)=>{f.candidate.remove(f.candidate.children[0]);},
    (f:ReturnType<typeof fixture>)=>{const duplicate=mesh(positions());duplicate.name='P123C_D1F_WINDOW_TRANSPARENT_WALL_HELPER';f.current.add(duplicate);},
    (f:ReturnType<typeof fixture>)=>{f.scene.name='unknown scene carrier';},
    (f:ReturnType<typeof fixture>)=>{f.before.name='lookalike wrong wall';},
    (f:ReturnType<typeof fixture>)=>{f.current.name='wrong D source host';},
    (f:ReturnType<typeof fixture>)=>{box(
      (f.candidate.geometry.getAttribute('position').array as Float32Array),64,6.1,6.4,-1.124,10.544);},
    (f:ReturnType<typeof fixture>)=>{f.current.position.x=.5;},
  ]) {
    const f=fixture();mutate(f);
    const oldChildren=[...f.current.children];
    expect(()=>stageP137EI03NormalWallReplacement(f.scene,f.source)).toThrow(/SWAP_BLOCKED/);
    expect(f.current.children).toEqual(oldChildren);
    expect(f.before.parent).toBe(f.current);
  }
});

test('unchanged non-I03 vertices and invisible source mismatch prevent destructive mesh replacement', () => {
  const f=fixture();
  const a=f.candidate.geometry.getAttribute('position');
  a.setXYZ(28,18,19,20);
  expect(()=>stageP137EI03NormalWallReplacement(f.scene,f.source))
    .toThrow(/UNRELATED_WALL_VERTEX_DRIFT_28/);
  expect(f.before.parent).toBe(f.current);
  expect(f.current.children).toHaveLength(2);
});

test('normal viewer path stays original GLB and measurement code remains wired; source69 is opt-in only', () => {
  const source=readFileSync('src/pages/private-model/index.astro','utf8');
  expect(source).toContain("loader.loadAsync('/private-model/model.glb')");
  expect(source).toContain("get('i03IntegrationQA') ===");
  expect(source).toContain("findSourceNamedScene(gltf, 'D CURRENT INTERIOR - BABYLON Y-UP')");
  expect(source).toContain("stageP137EI03NormalWallReplacement(\n                i03Interior");
  expect(source).toContain("canvas.dataset.i03IntegrationQa = 'BLOCKED'");
  expect(source).toContain("stagedI03.restoreOriginal()");
  expect(source).toContain("applyLoadedModel(gltf, 'current', 'CURRENT')");
  expect(source).toContain("applyStandardViewPreset('d-1f')");
  expect(source).toContain('stageP137EI03NormalWallReplacement(');
  expect(source).toContain("applyLoadedModel(gltf, 'current', 'CURRENT')");
  expect(source).toContain("axisMeasureToolButton.addEventListener('click'");
  expect(source).toContain("clickDAxisMeasurement(event.clientX, event.clientY)");
  expect(source).toContain("setModelScene(fullModelScene)");
  expect(source).toContain("i03IntegrationQa");
});

test('scene5 host identity isolates exact I03 from a geometry-identical room elsewhere', () => {
  const f=fixture();
  const unrelated=new Group();
  unrelated.name='unrelated-room-with-same-wall-mesh';
  const duplicate=mesh(positions());
  duplicate.name='P123C_D1F_WINDOW_TRANSPARENT_WALL_HELPER';
  unrelated.add(duplicate);
  f.scene.add(unrelated);
  const result=stageP137EI03NormalWallReplacement(f.scene,f.source);
  expect(result.insertedCount).toBe(1);
  expect(duplicate.parent).toBe(unrelated);
  expect(f.before.parent).toBeNull();
  expect(result.restoreOriginal()).toBe(true);
});
