import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

import { THREE } from '../../src/scripts/threeRuntime';
import {
  p186fExpectedRoomContextCount,
  p186fExpectedTargetCount,
  p186fX2PlacementBasis,
  p186fX3PreservedPass,
  p186fX4ControllerPlanPdfDriveId,
  p186fX4PlacementBasis,
  p186fX4ReviewPass,
  p186fX4ReviewSceneIndex,
  p186fX4ReviewSceneName,
  p186fX4ReadableRoomLabels,
  prepareP186fReviewPresentation,
} from '../../src/scripts/privateModelP186FReviewPresentation';

const runtimeFile = resolve(process.cwd(), 'src/pages/private-model/index.astro');
const candidateId = 'p186f-x4-d-themo-door-plan-clear-work-assumption';

const roomContracts = [
  {
    room: 'Bedroom',
    logicalDeviceId: 'D_THEMO_BEDROOM_CURRENT_01',
    groupKey: '10.3',
    groupName: 'makuuhuone',
    pass: p186fX3PreservedPass,
    placementBasis: p186fX2PlacementBasis,
    placementXYM: [3.56, 3.02],
  },
  {
    room: 'Lobby',
    logicalDeviceId: 'D_THEMO_LOBBY_CURRENT_01',
    groupKey: '10.1',
    groupName: 'eteinen',
    pass: p186fX4ReviewPass,
    placementBasis: p186fX4PlacementBasis,
    placementXYM: [2.8215166666666684, 4.565316666666669],
  },
  {
    room: 'Bathroom',
    logicalDeviceId: 'D_THEMO_BATHROOM_CURRENT_01',
    groupKey: '10.2',
    groupName: 'pesuhuone/sauna',
    pass: p186fX3PreservedPass,
    placementBasis: p186fX2PlacementBasis,
    placementXYM: [4.05, 3.02],
  },
] as const;

const makeMesh = (name: string) => {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.12, 0.12),
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
  );
  mesh.name = name;
  return mesh;
};

const makeTarget = (contract: (typeof roomContracts)[number]) => {
  // Match the original scene66 GL_LINES cross, not a solid object.
  const mesh = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.09, 0, 0),
      new THREE.Vector3(0.09, 0, 0),
      new THREE.Vector3(0, -0.09, 0),
      new THREE.Vector3(0, 0.09, 0),
    ]),
    new THREE.LineBasicMaterial({ color: 0xffffff }),
  );
  mesh.name = `P186F_X4_${contract.room.toUpperCase()}_ANCHOR`;
  mesh.userData = {
    Pass: contract.pass,
    Canonical: false,
    HUMAN_REVIEW: 'NOT_RUN',
    asBuilt: false,
    current: false,
    currentCircuitAsBuilt: false,
    currentDeviceRoomAssignmentEvidence: 'USER_CONFIRMED_2026-10-08',
    currentGeometryClaim: false,
    currentInstallationEvidence: 'USER_CONFIRMED_2026-10-07',
    exactXYClaim: false,
    exactZClaim: false,
    historicalGroupContext: {
      bindingAuthority: 'HIGH_CONFIDENCE_DERIVED / CROSS_SOURCE_PLAN_PARITY',
      sourceGroupKey: contract.groupKey,
      sourceGroupName: contract.groupName,
      sourceYear: 2015,
    },
    logicalDeviceId: contract.logicalDeviceId,
    physicalCableRouteClaim: false,
    physicalThermostatGeometryClaim: false,
    physicalThermostatXYClaim: false,
    placementBasis: contract.placementBasis,
    placementXYM: contract.placementXYM,
    presentationLayer: 'MEP_ELECTRICAL',
    presentationOnly: true,
    publishToCURRENT: false,
    representationKind: 'thermostatRoomPresentationAnchor',
    roomAssignment: contract.room,
    roomAssignmentEvidence: 'USER_CONFIRMED',
    roomLevelPlacement: true,
    sensorSuiteClaim: false,
    workAssumption: true,
  };
  return mesh;
};

const makeContext = (room: string) => {
  const mesh = makeMesh(`P117D_REVIEW_G2_D15_SPACE_${room}_1F_SRC`);
  mesh.userData = {
    G2Id: `G2_D15_SPACE_${room}_1F_SRC`,
    p186dReviewRoomContextBridge: true,
    presentationLayer: 'CURRENT_D',
    representationKind: 'referenceFootprint',
  };
  return mesh;
};

test('P186F-X4 scene66 mixed X3/X4 targets satisfy no-promotion presentation semantics', () => {
  const scene = new THREE.Group();
  roomContracts.map(makeTarget).forEach((target) => scene.add(target));
  ['SAUNA', 'PESUHUONE', 'WC', 'VH_WEST', 'VH_NORTH', 'HUONE2', 'VARASTO']
    .map(makeContext)
    .forEach((context) => scene.add(context));

  const presentation = prepareP186fReviewPresentation(scene, {
    preferRealArchitectureContext: true,
  });

  expect(p186fX4ReviewSceneIndex).toBe(66);
  expect(p186fX4ReviewSceneName).toBe(
    'P186F-X4 R1117 D THEMO DOOR-PLAN-CLEAR WORK_TEST BABYLON Y-UP',
  );
  expect(presentation.targetRenderableCount).toBe(p186fExpectedTargetCount);
  expect(presentation.contextRenderableCount).toBe(p186fExpectedRoomContextCount);
  expect(presentation.semanticViolationCount).toBe(0);
  expect(presentation.missingTargetRooms).toEqual([]);
  expect(presentation.unexpectedTargetRooms).toEqual([]);
  expect(presentation.realArchitectureContextRequired).toBe(true);
  expect(presentation.realArchitectureContextReady).toBe(false);
  expect(presentation.targetBounds).not.toBeNull();
  expect(p186fX4ReadableRoomLabels).toEqual({
    Bedroom: 'Makuuhuone / VH',
    Lobby: 'Aula',
    Bathroom: 'Kylpyhuone',
  });
  // Node-side presentation intentionally cannot create browser canvas labels.
  expect(presentation.x4ReadableRoomLabelCount).toBe(0);
  expect(presentation.x4VisibilityProxyCount).toBe(3);
  const targets = scene.children.filter((object) =>
    object.userData?.representationKind === 'thermostatRoomPresentationAnchor',
  );
  expect(targets).toHaveLength(3);
  for (const target of targets) {
    const proxies = target.children.filter((child) =>
      child.userData?.p186fX4VisibilityProxy === true,
    );
    expect(proxies).toHaveLength(1);
    expect(proxies[0].visible).toBe(true);
    expect(proxies[0].renderOrder).toBeGreaterThan(30);
    const proxyMaterial = (proxies[0] as any).material;
    expect(proxyMaterial.depthTest).toBe(false);
    expect(proxyMaterial.depthWrite).toBe(false);
    expect(proxyMaterial.opacity).toBe(0.8);
    expect(proxies[0].userData.Canonical).toBe(false);
    expect(proxies[0].userData.asBuilt).toBe(false);
    expect(proxies[0].userData.publishToCURRENT).toBe(false);
    expect(proxies[0].userData.HUMAN_REVIEW).toBe('NOT_RUN');
  }
  // Re-entering a review must not duplicate or hide the viewer-only proxies.
  const again = prepareP186fReviewPresentation(scene, {
    preferRealArchitectureContext: true,
  });
  expect(again.targetRenderableCount).toBe(3);
  expect(again.x4VisibilityProxyCount).toBe(3);
  for (const target of targets) {
    expect(target.children.filter((child) => child.userData?.p186fX4VisibilityProxy)).toHaveLength(1);
    expect(target.children[0]?.visible).toBe(true);
  }
});

test('X4 visibility halos fail closed for incomplete scenes and legacy X2', () => {
  const incomplete = new THREE.Group();
  roomContracts.slice(0, 2).map(makeTarget).forEach((target) => incomplete.add(target));
  const incompleteReview = prepareP186fReviewPresentation(incomplete);
  expect(incompleteReview.x4VisibilityProxyCount).toBe(0);

  const legacy = new THREE.Group();
  roomContracts.map((contract) => {
    const target = makeTarget(contract);
    target.userData.Pass = 'P186F-X2';
    target.userData.placementBasis = p186fX2PlacementBasis;
    return target;
  }).forEach((target) => legacy.add(target));
  const legacyReview = prepareP186fReviewPresentation(legacy);
  expect(legacyReview.targetRenderableCount).toBe(3);
  expect(legacyReview.x4VisibilityProxyCount).toBe(0);
  expect(legacy.children.every((object) => object.children.length === 0)).toBe(true);
});

test('P186F-X4 runtime fails closed on exact scene66 identity before applying the X4 review state', () => {
  const runtime = readFileSync(runtimeFile, 'utf8');

  expect(runtime).toContain(`const p186fX4CandidateId = '${candidateId}';`);
  expect(runtime).toContain('candidate.id === p186fX4CandidateId && isP186fX4ThemoRoomReviewRequested()');
  expect(runtime).toContain('const reviewScene = gltf.scenes?.[p186fX4ReviewSceneIndex];');
  expect(runtime).toContain("String(sourceScene?.name ?? '') !== p186fX4ReviewSceneName");
  expect(runtime).toContain("String(reviewScene.userData?.Pass ?? '') !== p186fX4ReviewPass");
  expect(runtime).toContain('Number(reviewScene.userData?.workTestSceneIndex) !== p186fX4ReviewSceneIndex');
  expect(runtime).toContain("throw new Error('P186F-X4 scene66 identity mismatch')");
  expect(runtime).toContain('gltf.scene = reviewScene;');
  expect(runtime).toContain("applyP186fReviewState('X4')");
  expect(runtime).toContain("p186fHumanReview: 'NOT_RUN'");
  expect(p186fX4ControllerPlanPdfDriveId).toBe('1cbo8g7mcs9zAWgUE9w2EOm_t9R1vIl1X');
  expect(runtime).toContain('p186fX4ControllerPlanPdfDriveId = p186fX4ControllerPlanPdfDriveId');
  expect(runtime).toContain("p186fCanonical: 'false'");
  expect(runtime).toContain("p186fPublishToCurrent: 'false'");
});

test('X4-only browser viewport keeps orientation HUD away from three Themo positions', async ({ page }) => {
  // CSS layout regression; NOT authenticated production-render evidence.
  // In production screenshot 38145250042 the lower-right HUD covered Bathroom.
  const runtime = readFileSync(runtimeFile, 'utf8');
  const selector = '.viewport:has(#private-model-canvas[data-p186f-review-variant="X4"]) .orientation-gizmo {';
  const ruleStart = runtime.indexOf(selector);
  expect(ruleStart).toBeGreaterThan(0);
  const cssRule = runtime.slice(ruleStart, runtime.indexOf('}', ruleStart) + 1);

  await page.setViewportSize({ width: 1024, height: 820 });
  await page.setContent(
    '<!doctype html><style>body{margin:0}.viewport{width:876px;height:789px;position:relative}' +
      '#private-model-canvas{position:absolute;inset:0}' +
      '.orientation-gizmo{position:absolute;right:12px;bottom:12px;width:212px;height:230px}' +
      cssRule + '</style><div class="viewport">' +
      '<canvas id="private-model-canvas" data-p186f-review-variant="X4"></canvas>' +
      '<aside class="orientation-gizmo"></aside></div>',
  );
  const hud = page.locator('.orientation-gizmo');
  const intersects = (rect: { x: number; y: number; width: number; height: number }, x: number, y: number) =>
    x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;

  // Source-derived XY projections in the exact 876x789 failure screenshot.
  const sourceFrameTargets = [
    { room: 'Lobby', x: 178, y: 68 },
    { room: 'Bedroom', x: 490, y: 722 },
    { room: 'Bathroom', x: 695, y: 722 },
  ];
  const x4Hud = await hud.boundingBox();
  expect(x4Hud).not.toBeNull();
  expect(x4Hud!.y).toBe(12);
  for (const target of sourceFrameTargets) {
    expect(intersects(x4Hud!, target.x, target.y), target.room).toBe(false);
  }

  // Ordinary (non-X4) reviews retain their pre-existing bottom-right HUD.
  await page.locator('#private-model-canvas').evaluate((canvas) => {
    canvas.removeAttribute('data-p186f-review-variant');
  });
  const normalHud = await hud.boundingBox();
  expect(normalHud).not.toBeNull();
  expect(normalHud!.y).toBe(789 - 12 - 230);
  expect(intersects(normalHud!, 695, 722)).toBe(true);
});


// LOCAL scene-shaped fixture. This does not certify authenticated production rendering.
test('X4 actual viewer D1F camera pans with right mouse while rotation stays disabled', async ({ page }) => {
  test.setTimeout(55_000);
  const rooms = ['SAUNA','PESUHUONE','WC','VH_WEST','VH_NORTH','HUONE2','VARASTO'];
  const encodeModel = (candidate: boolean) => {
    const line = [-0.1,0,0, 0.1,0,0, 0,0,-0.1, 0,0,0.1];
    const surface = [-0.15,0,-0.15, 0.15,0,-0.15, 0.15,0,0.15,
      -0.15,0,-0.15, 0.15,0,0.15, -0.15,0,0.15];
    const data = Buffer.alloc((line.length + surface.length) * 4);
    [...line,...surface].forEach((n,i) => data.writeFloatLE(n,i*4));
    const contexts = rooms.map((room,i) => ({
      name: 'P117D_REVIEW_G2_D15_SPACE_' + room + '_1F_SRC',
      mesh: 1, translation: [1.5+(i%4)*0.7, 0, 3+Math.floor(i/4)*0.7],
      extras: {
        G2Id: 'G2_D15_SPACE_' + room + '_1F_SRC',
        storey: '1F', presentationLayer: 'CURRENT_D',
        representationKind: 'referenceFootprint',
      },
    }));
    const markers = roomContracts.map(contract => ({
      name: 'P186F_X4_' + contract.room.toUpperCase() + '_ANCHOR',
      mesh: 0, translation: [contract.placementXYM[0], 0.09, contract.placementXYM[1]],
      extras: {
        Pass: contract.pass, Canonical: false, HUMAN_REVIEW: 'NOT_RUN',
        asBuilt: false, current: false, currentCircuitAsBuilt: false,
        currentDeviceRoomAssignmentEvidence: 'USER_CONFIRMED_2026-10-08',
        currentGeometryClaim: false,
        currentInstallationEvidence: 'USER_CONFIRMED_2026-10-07',
        exactXYClaim: false, exactZClaim: false,
        historicalGroupContext: {
          bindingAuthority: 'HIGH_CONFIDENCE_DERIVED / CROSS_SOURCE_PLAN_PARITY',
          sourceGroupKey: contract.groupKey, sourceGroupName: contract.groupName, sourceYear: 2015,
        },
        logicalDeviceId: contract.logicalDeviceId,
        physicalCableRouteClaim: false, physicalThermostatGeometryClaim: false,
        physicalThermostatXYClaim: false,
        placementBasis: contract.placementBasis, placementXYM: contract.placementXYM,
        presentationLayer: 'MEP_ELECTRICAL', presentationOnly: true,
        publishToCURRENT: false, representationKind: 'thermostatRoomPresentationAnchor',
        roomAssignment: contract.room, roomAssignmentEvidence: 'USER_CONFIRMED',
        roomLevelPlacement: true, sensorSuiteClaim: false, workAssumption: true,
      },
    }));
    const scenes = Array.from({length:67}, (_,i) => ({
      name: i===0 ? 'D CURRENT INTERIOR - BABYLON Y-UP' :
        i===66 ? p186fX4ReviewSceneName : 'INHERITED_SCENE_' + i,
      nodes: candidate && i===0 ? contexts.map((_,j)=>j) :
        candidate && i===66 ? markers.map((_,j)=>j+contexts.length) : [],
      ...(candidate && i===66 ? {extras:{Pass:p186fX4ReviewPass,workTestSceneIndex:66}} : {}),
    }));
    const json = {
      asset:{version:'2.0'}, scene:candidate?66:0, scenes,
      nodes:candidate?[...contexts,...markers]:[],
      meshes:[
        {primitives:[{attributes:{POSITION:0},material:0,mode:1}]},
        {primitives:[{attributes:{POSITION:1},material:1,mode:4}]},
      ],
      materials:[
        {doubleSided:true,pbrMetallicRoughness:{baseColorFactor:[1,1,1,1],metallicFactor:0,roughnessFactor:1}},
        {doubleSided:true,pbrMetallicRoughness:{baseColorFactor:[0.7,0.8,1,1],metallicFactor:0,roughnessFactor:1}},
      ],
      accessors:[
        {bufferView:0,componentType:5126,count:4,type:'VEC3',min:[-0.1,0,-0.1],max:[0.1,0,0.1]},
        {bufferView:1,componentType:5126,count:6,type:'VEC3',min:[-0.15,0,-0.15],max:[0.15,0,0.15]},
      ],
      bufferViews:[
        {buffer:0,byteOffset:0,byteLength:line.length*4,target:34962},
        {buffer:0,byteOffset:line.length*4,byteLength:surface.length*4,target:34962},
      ],
      buffers:[{byteLength:data.length}],
    };
    const j=Buffer.from(JSON.stringify(json),'utf8');
    const j4=Buffer.concat([j,Buffer.alloc((4-j.length%4)%4,0x20)]);
    const b4=Buffer.concat([data,Buffer.alloc((4-data.length%4)%4)]);
    const h=Buffer.alloc(12); h.write('glTF');h.writeUInt32LE(2,4);
    h.writeUInt32LE(28+j4.length+b4.length,8);
    const jh=Buffer.alloc(8);jh.writeUInt32LE(j4.length,0);jh.writeUInt32LE(0x4e4f534a,4);
    const bh=Buffer.alloc(8);bh.writeUInt32LE(b4.length,0);bh.writeUInt32LE(0x004e4942,4);
    return Buffer.concat([h,jh,j4,bh,b4]);
  };
  const candidatePath = '/private-model/work-test/' + candidateId + '.glb';
  await page.setViewportSize({width:1536,height:900});
  await page.route('**/private-model/model.glb', route => route.fulfill({
    status:200,contentType:'model/gltf-binary',body:encodeModel(false)}));
  await page.route('**/private-model/work-test/catalog.json', route => route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify({candidates:[{id:candidateId,path:candidatePath,label:'Synthetic X4 review'}]})}));
  await page.route('**' + candidatePath, route => route.fulfill({
    status:200,contentType:'model/gltf-binary',body:encodeModel(true)}));
  await page.goto('/private-model/?review=' + candidateId + '-review');
  const canvas=page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload','true');
  await expect(canvas).toHaveAttribute('data-p186f-review-variant','X4');
  await expect(canvas).toHaveAttribute('data-p186f-review-target-renderable-count','3');
  await expect(canvas).toHaveAttribute('data-view-preset','d-plan');
  await expect(canvas).toHaveAttribute('data-camera-projection','orthographic');
  await expect(canvas).toHaveAttribute('data-camera-rotation','disabled');
  await expect(canvas).toHaveAttribute('data-camera-pan','enabled');
  await expect(canvas).toHaveAttribute('data-p186f-human-review','NOT_RUN');
  await page.waitForTimeout(550);
  const before=await canvas.screenshot();
  // The source-bound room names are bright neutral text painted into the
  // WebGL canvas, not DOM HUD text; without the labels this scene has only
  // cyan halos and low-opacity room outlines. This is synthetic browser QA.
  const readableTextPixels=await page.evaluate(async (url) => {
    const image=new Image();image.src=url;await image.decode();
    const surface=document.createElement('canvas');
    surface.width=image.width;surface.height=image.height;
    const ctx=surface.getContext('2d');
    if(!ctx)throw new Error('X4 label pixel canvas missing');
    ctx.drawImage(image,0,0);
    const data=ctx.getImageData(0,0,image.width,image.height).data;
    let brightNeutral=0;
    for(let i=0;i<data.length;i+=4) {
      if(data[i]>=205 && data[i+1]>=205 && data[i+2]>=205 &&
        Math.max(data[i],data[i+1],data[i+2])-
          Math.min(data[i],data[i+1],data[i+2])<=18)brightNeutral++;
    }
    return brightNeutral;
  },'data:image/png;base64,'+before.toString('base64'));
  expect(readableTextPixels).toBeGreaterThan(45);
  const rect=await canvas.boundingBox();
  expect(rect).not.toBeNull();
  const x=rect!.x+rect!.width*0.5,y=rect!.y+rect!.height*0.48;
  await page.mouse.move(x,y);
  await page.mouse.down({button:'right'});
  await page.mouse.move(x+130,y+52,{steps:16});
  await page.mouse.up({button:'right'});
  await page.waitForTimeout(650);
  const after=await canvas.screenshot();
  const changed=await page.evaluate(async (frames) => {
    const pixels=async (url:string) => {
      const img=new Image();img.src=url;await img.decode();
      const c=document.createElement('canvas');c.width=img.width;c.height=img.height;
      const ctx=c.getContext('2d');if(!ctx)throw new Error('No canvas');
      ctx.drawImage(img,0,0);
      return ctx.getImageData(0,0,img.width,img.height).data;
    };
    const a=await pixels(frames[0]),b=await pixels(frames[1]);
    if(a.length!==b.length)throw new Error('Screenshot size changed');
    let changed=0;
    for(let i=0;i<a.length;i+=4) {
      const diff=Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]);
      if(diff>36)changed++;
    }
    return changed;
  },['data:image/png;base64,'+before.toString('base64'),'data:image/png;base64,'+after.toString('base64')] as [string,string]);
  expect(changed).toBeGreaterThanOrEqual(750);
  await expect(canvas).toHaveAttribute('data-camera-rotation','disabled');
});
