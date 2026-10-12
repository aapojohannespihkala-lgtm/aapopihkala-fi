import {expect,test} from '@playwright/test';
import { installScene67SyntheticDigest, padScene67SyntheticGlb, routeScene67SyntheticHttpsAssets, SYNTHETIC_SCENE67_ORIGIN } from './p137eScene67SyntheticBrowserHarness';
// Synthetic reuse of verified source identities; NOT the original GLB.
const candidateId = 'p137e-d1f-three-wall-mounted-themos';
const reviewId = candidateId + '-review';
const candidatePath = '/private-model/work-test/' + candidateId + '.glb';
const sceneName =
  'P137E D1F THREE PHOTO_REFERENCED THEMO WALL_FLUSH WORK_TEST (NOT CURRENT) BABYLON Y_UP';
const rootName = 'P137E_D_THEMOS_REAL_WALL_FACE_WORK_TEST_ROOT_BABYLON_Y_UP';
const wallName = 'P137E_ORIGINAL_P123C_D1F_NODE798_MESH406_PRESENTATION_INSTANCE';

const noPromotion = {
  Canonical: false,
  asBuilt: false,
  publishToCURRENT: false,
  HUMAN_REVIEW: 'NOT_RUN',
};

const makeScene67Glb = () => {
  const wallPositions = [-2,0,0, 2,0,0, -2,0,2, 2,0,0, 2,0,2, -2,0,2];
  // Themo housing mesh ~94 mm: source-projected housing ROI must fit
  // the actual 2D camera viewport, not an oversized synthetic square.
  const devicePositions = [-0.047,0,0, 0.047,0,0, -0.047,0,0.094, 0.047,0,0, 0.047,0,0.094, -0.047,0,0.094];
  const floats = [...wallPositions, ...devicePositions];
  const binary = Buffer.alloc(floats.length * 4);
  floats.forEach((value, index) => binary.writeFloatLE(value, index * 4));

  const nodes: Record<string, unknown>[] = Array.from({ length: 1108 }, () => ({}));
  // The real viewer first resolves the independent D1F interior carrier
  // before opening the exact scene67 P123C wall. Keep this minimal semantic
  // context in the fixture, never as a substitute for the original wall.
  nodes[1] = { name: 'D_1F_SYNTHETIC_INTERIOR_CONTEXT_NOT_THEMO_SOURCE', mesh: 1 };
  nodes[798] = { name: 'ORIGINAL_P123C_WALL_SOURCE', mesh: 406 };
  nodes[1106] = {
    name: wallName,
    mesh: 406,
    translation: [0, 5.072, 0],
    extras: {
      sourceNodeIndex: 798,
      sourceMeshIndex: 406,
      originalSourceGeometryUnmodified: true,
      presentationOnly: true,
      ...noPromotion,
    },
  };

  const targets = [
    { index: 1091, name: 'P137E_THEMO_LOBBY_WALL_CONTACT_WORK_TEST',
      id: 'D_THEMO_CURRENT_LOBBY_01', side: 'NORTH', faceY: 5.112, sign: 1, x: -0.9 },
    { index: 1096, name: 'P137E_THEMO_BEDROOM_WALL_CONTACT_WORK_TEST',
      id: 'D_THEMO_CURRENT_BEDROOM_01', side: 'SOUTH', faceY: 5.032, sign: -1, x: 0.4 },
    { index: 1101, name: 'P137E_THEMO_BATHROOM_WALL_CONTACT_WORK_TEST',
      id: 'D_THEMO_CURRENT_BATHROOM_01', side: 'SOUTH', faceY: 5.032, sign: -1, x: 1.2 },
  ];
  for (const target of targets) {
    nodes[target.index] = {
      name: target.name,
      mesh: 0,
      translation: [target.x, target.faceY, 1],
      extras: {
        logicalDeviceId: target.id,
        representationKind: 'photoReferencedThermostatWallMountWorkTest',
        sourceFaceMeshIndex: 406,
        sourceFaceNodeIndex: 798,
        sourceFaceSide: target.side,
        sourceFaceYM: target.faceY,
        backplateContactYM: target.faceY,
        frontFacesTowardYSign: target.sign,
        wallBackplateAirGapM: 0,
        fitOriginalPresentationSourceWallPlanePassed: true,
        fitExactPhysicalWallHostVerified: false,
        exactXYClaim: false,
        exactZClaim: false,
        currentGeometryClaim: false,
        wallHostPhysicalAsBuiltClaim: false,
        presentationOnly: true,
        ...noPromotion,
      },
    };
  }
  nodes[1107] = {
    name: rootName,
    children: [1106, 1091, 1096, 1101],
    // Babylon Y-up: +Y -> world -Z, +Z -> world +Y.
    rotation: [-Math.SQRT1_2, 0, 0, Math.SQRT1_2],
    extras: {
      Pass: 'P137E',
      sourceOriginalWallNode: 798,
      sourceOriginalWallMesh: 406,
      WORK_TEST_ONLY: true,
      oldMarkersSuppressedInNewSceneOnly: true,
      ...noPromotion,
    },
  };

  const meshes = Array.from({ length: 407 }, (_, index) => ({
    primitives: [{ attributes: { POSITION: index === 406 ? 0 : 1 }, material: index === 406 ? 0 : 1 }],
  }));
  const scenes = Array.from({ length: 68 }, (_, index) => ({
    name: 'UNRELATED_SCENE_' + index,
    nodes: [] as number[],
  }));
  // The actual source GLB contains this separately named interior scene.
  // Without it, activateDPlan cannot select D1F and the P137E viewer must
  // reject the test fixture before any NORTH/SOUTH/RASTI/MITTAA assertions.
  scenes[0] = { name: 'D CURRENT INTERIOR - BABYLON Y-UP', nodes: [1] };
  scenes[67] = {
    name: sceneName,
    nodes: [1107],
    extras: {
      sourceSceneIndex: 66,
      sourceOriginalWallMeshIndex: 406,
      targetLogicalDeviceCount: 3,
      workTestOnly: true,
      noCurrentPromotion: true,
      HUMAN_REVIEW: 'NOT_RUN',
    },
  } as typeof scenes[number];

  const manifest = {
    asset: { version: '2.0' },
    scene: 67,
    scenes,
    nodes,
    meshes,
    materials: [
      { doubleSided: true, alphaMode: 'BLEND', pbrMetallicRoughness: { baseColorFactor: [0.15,0.4,0.2,0.38], metallicFactor: 0, roughnessFactor: 1 } },
      { doubleSided: true, pbrMetallicRoughness: { baseColorFactor: [0.96,0.96,0.95,1], metallicFactor: 0, roughnessFactor: 1 } },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 6, type: 'VEC3',
        min: [-2, 0, 0], max: [2, 0, 2] },
      { bufferView: 1, componentType: 5126, count: 6, type: 'VEC3',
        min: [-0.047, 0, 0], max: [0.047, 0, 0.094] },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: wallPositions.length * 4, target: 34962 },
      { buffer: 0, byteOffset: wallPositions.length * 4,
        byteLength: devicePositions.length * 4, target: 34962 },
    ],
    buffers: [{ byteLength: binary.length }],
  };
  const json = Buffer.from(JSON.stringify(manifest));
  const paddedJson = Buffer.concat([json, Buffer.alloc((4 - json.length % 4) % 4, 0x20)]);
  const paddedBinary = Buffer.concat([binary, Buffer.alloc((4 - binary.length % 4) % 4)]);
  const header = Buffer.alloc(12);
  header.write('glTF');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + paddedJson.length + 8 + paddedBinary.length, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(paddedJson.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binaryHeader = Buffer.alloc(8);
  binaryHeader.writeUInt32LE(paddedBinary.length, 0);
  binaryHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jsonHeader, paddedJson, binaryHeader, paddedBinary]);
};


/**
 * Chromium WebGL fixture, NOT the original Drive GLB or production pixel proof.
 * Exact scene67 identifiers, 0.38-alpha wall and 94-mm light housing triangles
 * test reversible on-screen visibility without promoting HUMAN_REVIEW/CURRENT.
 */
test('synthetic transparent source wall preserves three independent THREE housing pixel deltas', async ({page}) => {
  test.setTimeout(60_000);
  await page.setViewportSize({width:1536,height:768});
  const glb=padScene67SyntheticGlb(makeScene67Glb());
  await installScene67SyntheticDigest(page);
  await routeScene67SyntheticHttpsAssets(page);
  await page.route('**/private-model/model.glb',r=>r.fulfill({status:200,contentType:'model/gltf-binary',body:glb}));
  await page.route('**/private-model/work-test/catalog.json',r=>r.fulfill({status:200,contentType:'application/json',
    body:JSON.stringify({candidates:[{id:candidateId,path:candidatePath,label:'synthetic alpha 0.38 wall'}]})}));
  await page.route('**'+candidatePath,r=>r.fulfill({status:200,contentType:'model/gltf-binary',body:glb}));
  await page.goto(SYNTHETIC_SCENE67_ORIGIN + '/private-model/?review='+reviewId);
  const canvas=page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-mode',reviewId,{timeout:20000});
  await expect(canvas).toHaveAttribute('data-p137e-wall-mounted-themo-count','3');
  const ids=['D_THEMO_CURRENT_LOBBY_01','D_THEMO_CURRENT_BEDROOM_01','D_THEMO_CURRENT_BATHROOM_01'];
  const switchHidden=async(id:string|null)=>{
    await page.evaluate(hiddenLogicalDeviceId=>window.dispatchEvent(
      new CustomEvent('p137e-scene67-housing-probe',{detail:{hiddenLogicalDeviceId}})),id);
    await expect(canvas).toHaveAttribute('data-p137e-scene67-housing-probe-hidden-id',id??'NONE');
    await page.waitForTimeout(160);
  };
  const capture=async()=> (await canvas.screenshot()).toString('base64');
  const pixels=async(a:string,b:string,roi:{x:number;y:number;radius:number}|null)=>
    page.evaluate(async({a,b,roi})=>{
      const load=async(s:string)=>{
        const bytes=Uint8Array.from(atob(s),c=>c.charCodeAt(0));
        const bitmap=await createImageBitmap(new Blob([bytes],{type:'image/png'}));
        const c=document.createElement('canvas'); c.width=bitmap.width;c.height=bitmap.height;
        const ctx=c.getContext('2d')!;ctx.drawImage(bitmap,0,0);
        return {w:c.width,h:c.height,rgba:ctx.getImageData(0,0,c.width,c.height).data};
      };
      const A=await load(a),B=await load(b);
      if(A.w!==B.w||A.h!==B.h)throw Error('frame sizes differ');
      let inside=0,outside=0;
      for(let y=0;y<A.h;y++)for(let x=0;x<A.w;x++){
        const k=(y*A.w+x)*4;
        const changed=[0,1,2,3].some(ch=>Math.abs(A.rgba[k+ch]-B.rgba[k+ch])>=20);
        if(!changed)continue;
        if(roi&&(x-roi.x)**2+(y-roi.y)**2<=roi.radius**2)inside++;
        else outside++;
      }
      return {inside,outside};
    },{a,b,roi});
  for(const side of ['NORTH','SOUTH'] as const){
    if(side==='SOUTH'){
      await page.locator('#view-menu > summary').click();
      await page.locator('#p137e-south-face-button').click();
    }
    await expect(canvas).toHaveAttribute('data-p137e-scene67-camera-face',side);
    await expect(canvas).toHaveAttribute('data-p137e-scene67-wall-presentation',
      'ORIGINAL_P123C_SOURCE_ALPHA_0_38_UNMODIFIED');
    await expect(canvas).toHaveAttribute('data-p137e-scene67-source-housing-roi-status','SOURCE_ONLY_PROJECTED');
    const regions=JSON.parse((await canvas.getAttribute('data-p137e-scene67-source-housing-rois'))!);
    const expected=side==='NORTH'?[ids[0]]:ids.slice(1);
    expect(regions.projectedTargets.map((r:{logicalDeviceId:string})=>r.logicalDeviceId)).toEqual(expected);
    await switchHidden(null);
    const base=await capture();
    for(const id of ids){
      await switchHidden(id);
      const delta=await capture();
      const roi=(regions.projectedTargets as Array<{logicalDeviceId:string;x:number;y:number;radius:number}>)
        .find(r=>r.logicalDeviceId===id)??null;
      const count=await pixels(base,delta,roi);
      if(expected.includes(id)){
        expect(count.inside,side+'/'+id+' changed housing pixels').toBeGreaterThanOrEqual(48);
        expect(count.outside,side+'/'+id+' unowned frame pixels').toBeLessThanOrEqual(12);
      }else{
        expect(count.inside+count.outside,side+'/'+id+' wrong face').toBeLessThanOrEqual(12);
      }
    }
    await switchHidden(null);
  }
  await expect(canvas).toHaveAttribute('data-p137e-human-review','NOT_RUN');
  await expect(canvas).toHaveAttribute('data-p137e-current-claim','false');
});
