import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

// This is a workflow-contract regression, NOT authenticated production proof.
// The authenticated runtime scene63 and 13 original source/camera projections
// are a mandatory separate release input.
const workflow = readFileSync(resolve(
  process.cwd(), '.github/workflows/private-model-production-review-smoke.yml',
), 'utf8');
const reviewId = 'm5a-r1125-pvk-diameter-source-split-review';
const candidateId = 'm5a-r1125-pvk-diameter-source-split';

test('R1125 production pixel verifier is scoped to its exact review/candidate pair', () => {
  expect(workflow).toContain("reviewId === '" + reviewId + "'");
  expect(workflow).toContain("candidateId === '" + candidateId + "'");
  expect(workflow).toContain('if (isR1125SourceReview) {');
  expect(workflow).toContain('buildM5AR1125BrowserScreenshotProofExpression(');
  expect(workflow).toContain('m5aR1125PixelEvidence.allSourceTargetsVisible !== true');
  expect(workflow).toContain('m5aR1125PixelEvidence.sourceRoiPixels?.length !== 13');
  expect(workflow).toContain('m5aR1125PixelEvidence.ambiguousSourceKeys?.length !== 0');
  expect(workflow).toContain('m5aR1125PixelEvidence.missingKeys?.length !== 0');
  expect(workflow).toContain('m5a-r1125-source-13-pixels.json');
});

test('R1125 requires the actual viewer scene63 projections and rejects substitutes', () => {
  expect(workflow).toContain("d.m5aR1125SourceDriveId !== '13qxYc9PF7Z6eo_OXs1RrYCyo5CbTIAKs'");
  expect(workflow).toContain("d.m5aR1125SourceContract !== 'G2_R1125'");
  expect(workflow).toContain("d.m5aR1125SceneIndex !== '63'");
  expect(workflow).toContain("d.m5aR1125HumanReview !== 'NOT_RUN'");
  expect(workflow).toContain("JSON.parse(d.m5aR1125SourceCameraCenters ?? '')");
  expect(workflow).toContain('R1125 original source-camera projections missing from actual viewer');
  expect(workflow).toContain('projection.sourceSceneIndex !== 63');
  expect(workflow).toContain('projection.sourceTargetCount !== 13');
  expect(workflow).toContain('projection.radiusPx !== radius');
  expect(workflow).toContain('projection.originalGlbDigestAuthenticated !== false');
  expect(workflow).toContain('projection.productionScreenshotVerified !== false');
  expect(workflow).toContain('m5aR1125PixelEvidence.productionProvenanceVerified !== false');
  expect(workflow).toContain("humanReview: 'NOT_RUN'");
});

test('R1125 uses a captured PNG clip and keeps other review hard floors', () => {
  expect(workflow).toContain('const before = (isX4Themo || isR1125SourceReview || p137eScene67SourceEvidence)');
  expect(workflow).toContain('const after = (isX4Themo || isR1125SourceReview || p137eScene67SourceEvidence)');
  expect(workflow).toContain("clip: box, animations: 'disabled'");
  expect(workflow).toContain("'data:image/png;base64,' + before.toString('base64')");
  expect(workflow).toContain("MIN_NON_BACKGROUND_PIXELS_HARD_FLOOR: '1500'");
  expect(workflow).toContain("MIN_CHANGED_PIXELS_HARD_FLOOR: '750'");
  expect(workflow).toContain('detectP186FX4OriginalGreenWallPixels');
  expect(workflow).toContain('detectP186FX4CyanTargetComponents');
  expect(workflow).toContain('detectM5BR1109CyanLocatorComponents');
  expect(workflow).toContain('if (pixelEvidence.nonBackgroundPixels < minNonBackgroundPixels)');
  expect(workflow).toContain('if (pixelEvidence.changedPixels < minChangedPixels)');
});

test('R1125 pixel-only evidence does not promote physical measurements or review', () => {
  expect(workflow).toContain('exactRawGlbByteReadbackVerified: false');
  expect(workflow).toContain("d.m5aPublishToCurrent !== 'false'");
  expect(workflow).toContain("m5aR1125PixelEvidence.humanReview !== 'NOT_RUN'");
  expect(workflow).toContain('m5aR1125PixelEvidence,');
  expect(workflow).not.toMatch(/m5aR1125HumanReview:\s*'PASS'/);
});


// Exercise the actual viewer fragment that performs source binding; do not
// duplicate its algorithm in a separate test-only implementation. This is a
// SYNTHETIC glTF association fixture, NOT original-byte or production proof.
test('R1125 viewer source binding isolates exactly one original node and restores it', async () => {
  const { transpileModule, ScriptTarget, ModuleKind } = await import('typescript');
  const { m5aR1125SourcePixelKinds } = await import(
    '../../src/scripts/privateModelM5AR1125SourceRoiPixelProof.mjs'
  );
  const viewer = readFileSync(resolve(
    process.cwd(), 'src/pages/private-model/index.astro',
  ), 'utf8');
  const fromMarker = 'const sourceJson = gltf?.parser?.json;';
  const untilMarker = '// A production screenshot taken AFTER a user orbit';
  const start = viewer.indexOf(fromMarker);
  const end = viewer.indexOf(untilMarker, start);
  expect(start).toBeGreaterThan(0);
  expect(end).toBeGreaterThan(start);
  const fragment = transpileModule(
    viewer.slice(start, end), {
      compilerOptions: { target: ScriptTarget.ES2022, module: ModuleKind.None },
    },
  ).outputText;
  const bind = new Function(
    'gltf', 'fullModelScene', 'canvas', 'sourceCameraProjection',
    'm5aZ2R1125ReviewId',
    fragment + '\nreturn canvas.m5aR1125SetOriginalSourceVisibility;',
  );
  const keys = Object.keys(m5aR1125SourcePixelKinds);
  expect(keys).toHaveLength(13);
  const sourceRootId = 90;
  const root: any = { children: [] as any[], visible: true };
  const nodes: any[] = [];
  const meshes: any[] = [];
  const associations = new Map<any, any>([[root, { nodes: sourceRootId }]]);
  const objects: any[] = [];
  keys.forEach((key, i) => {
    const boundary = key.startsWith('boundary:');
    const extras = {
      ...(boundary
        ? { representationKind: 'unresolvedBoundaryMarker',
            boundaryRole: key.substring('boundary:'.length) }
        : { representationKind: key.startsWith('G2_DRAIN_WELL_')
            ? 'wellDiameterPresentationWork' : 'pipeDiameterPresentationWork',
            G2IdCandidate: key }),
      Canonical: false, presentationOnly: true,
      currentGeometryClaim: false, asBuiltClaim: false,
      publishToCURRENT: false,
    };
    const mesh = i;
    const object = {
      parent: root, visible: true,
      isMesh: !boundary, isLineSegments: boundary,
      userData: {...extras},
    };
    nodes[i] = { mesh, extras };
    meshes[mesh] = { primitives: [{mode:boundary ? 1 : 4}] };
    associations.set(object, {nodes:i, meshes:mesh, primitives:0});
    root.children.push(object);
    objects.push(object);
  });
  nodes[sourceRootId] = {
    name:'M5A_R1125_DIAMETER_SOURCE_SPLIT_WORK_TEST_ROOT_BABYLON_Y_UP',
    children:keys.map((_, i) => i),
  };
  const sourceJson = {
    scenes:Array.from({length:64}, (_, i) => i === 63 ?
      { nodes:[sourceRootId] } : {nodes:[]}),
    nodes, meshes,
  };
  const scene = {
    traverse(callback: (object:any)=>void) {
      callback(root);
      objects.forEach(callback);
    },
  };
  const gltf = {scene, parser:{json:sourceJson, associations}};
  const canvas: any = {
    dataset:{modelSource:'work-test',workTestReviewMode:'test-r1125'},
  };
  const centers = keys.map(key => ({key}));
  const hide = bind(gltf,scene,canvas,{centers},'test-r1125') as
    (key:string, state:'HIDE'|'RESTORE')=>any;
  expect(typeof hide).toBe('function');
  const first = keys[0]!;
  expect(hide(first,'HIDE')).toMatchObject({
    sourceKey:first,state:'HIDE',originalSourceCount:13,
    activeHiddenCount:1,humanReview:'NOT_RUN',publishToCURRENT:false,
  });
  expect(objects[0].visible).toBe(false);
  expect(objects.slice(1).every(o=>o.visible)).toBe(true);
  expect(() => hide(keys[1]!,'HIDE')).toThrow(/all 13 originals visible/);
  expect(() => hide(keys[1]!,'RESTORE')).toThrow(/non-owned/);
  expect(hide(first,'RESTORE')).toMatchObject({
    sourceKey:first,state:'RESTORE',activeHiddenCount:0,
  });
  expect(objects.every(o=>o.visible)).toBe(true);
  expect(() => hide('invented-source','HIDE')).toThrow(/not bound/);
  expect(() => hide(first,'RESTORE')).toThrow(/non-owned/);

  // Wrong original association cannot pass merely because a name matches.
  const second = objects[1];
  associations.set(second,{nodes:1,meshes:999,primitives:0});
  const badCanvas = {dataset:{...canvas.dataset}};
  expect(() => bind(gltf,scene,badCanvas,{centers},'test-r1125'))
    .toThrow(/original source node\/mesh identity mismatch/);
  expect(objects.every(o=>o.visible)).toBe(true);
  // Wrong original representation class also rejects the source identity.
  associations.set(second,{nodes:1,meshes:1,primitives:0});
  nodes[1].extras.representationKind = 'unresolvedBoundaryMarker';
  expect(() => bind(gltf,scene,badCanvas,{centers},'test-r1125'))
    .toThrow(/original source node\/mesh identity mismatch/);
});

test('R1125 source visibility capability is removed and restored at model change', () => {
  const viewer = readFileSync(resolve(
    process.cwd(), 'src/pages/private-model/index.astro',
  ), 'utf8');
  const beforeCleanup = viewer.indexOf('const applyLoadedModel =');
  const cleanup = viewer.slice(beforeCleanup, beforeCleanup + 2600);
  const restore = cleanup.indexOf('m5aR1125RestoreOriginalSourceVisibility?.()');
  const drop = cleanup.indexOf('delete (canvas as any).m5aR1125SetOriginalSourceVisibility');
  expect(restore).toBeGreaterThan(0);
  expect(drop).toBeGreaterThan(restore);
  expect(cleanup).toContain('delete (canvas as any).m5aR1125RestoreOriginalSourceVisibility');
  expect(cleanup).toContain('delete (canvas as any).m5aR1125RefreshSourceProjection');
});


test('R1125 original node pixel evidence uses exactly two live authenticated view frames', () => {
  const viewer = readFileSync(resolve(
    process.cwd(),'src/pages/private-model/index.astro'), 'utf8');
  const helper = 'const verifyR1125OriginalNodePixels = async (baselinePng, view, label) => {';
  const first = "verifyR1125OriginalNodePixels(before,projection,'opening')";
  const second = "verifyR1125OriginalNodePixels(after,secondProjection,'orbit')";
  const original = workflow.indexOf('authenticateM5AR1125OriginalGlb(');
  const proof = workflow.indexOf(helper);
  expect(original).toBeGreaterThanOrEqual(0);
  expect(proof).toBeGreaterThan(0);
  expect(workflow.indexOf(first)).toBeGreaterThan(proof);
  expect(workflow.indexOf(second)).toBeGreaterThan(workflow.indexOf(first));
  expect(workflow).toContain('r1125FirstOriginalNodePixels?.perSource?.length === 13');
  expect(workflow).toContain('r1125OrbitOriginalNodePixels?.perSource?.length === 13');
  expect(workflow).toContain('m5a-r1125-original-node-');
  expect(workflow).toContain('originalNodeMeshAssociationViewerChecked');
  expect(viewer).toContain('m5aR1125SetOriginalSourceVisibility');
  expect(viewer).toContain('m5aR1125RestoreOriginalSourceVisibility');
});

test('R1125 live node muting fails closed and restores before next original', () => {
  const from = workflow.indexOf('const verifyR1125OriginalNodePixels = async');
  const until = workflow.indexOf('let r1125FirstOriginalNodePixels=null;',from);
  expect(until).toBeGreaterThan(from);
  const method = workflow.slice(from,until);
  expect(method).toContain('new Set(view.centers.map(x => x.key)).size !== 13');
  expect(method).toContain("view.sourceSceneIndex !== 63");
  expect(method).toContain("el.m5aR1125SetOriginalSourceVisibility(key, 'HIDE')");
  expect(method).toContain("el.m5aR1125SetOriginalSourceVisibility(key, 'RESTORE')");
  expect(method.indexOf('let mutedPng;')).toBeLessThan(method.indexOf('finally {'));
  expect(method.indexOf('finally {')).toBeLessThan(method.indexOf('const restoredPng ='));
  expect(method).toContain('delta.sourceChangedPixels < minPixels');
  expect(method).toContain('delta.otherSourceChangedPixels !== 0');
  expect(method).toContain('delta.restoreChangedPixels !== 0');
  expect(method).toContain("humanReview:'NOT_RUN'");
  expect(method).toContain('publishToCURRENT:false');
  expect(method).not.toContain('humanReview:PASS');
});
