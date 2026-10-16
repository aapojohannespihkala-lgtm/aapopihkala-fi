import { D1F_SHOWER_PHOTO_SOURCE, D1F_SHOWER_PHOTO_VARIANTS } from './privateModelD1FShowerPhotoSourceContract.mjs';

/**
 * A fail-closed, target-specific RGBA contract for an actual browser collector.
 * The caller must authenticate and fetch the original GLB, project each
 * source primitive's geometry, hide JUST that primitive, capture the same
 * camera, restore it and capture a third frame. This pure helper cannot
 * authenticate the production viewer or assert that screenshots are genuine.
 * In particular, a whole-scene WebGL screenshot is not proof of shower glass.
 */
export const D1F_SHOWER_GLASS_PARTS = Object.freeze([
  Object.freeze({part:'LEFT_CURVED_GLASS', primitiveIndex:0, minChanged:10, deltaThreshold:6}),
  Object.freeze({part:'RIGHT_CURVED_GLASS', primitiveIndex:1, minChanged:10, deltaThreshold:6}),
  Object.freeze({part:'ALUMINIUM_FRAME_HANDLES', primitiveIndex:2, minChanged:12, deltaThreshold:16}),
]);
export const D1F_SHOWER_GLASS_PIXEL_CANDIDATE = 'd1f-shower-glass-photo-20261016';
export const D1F_SHOWER_GLASS_EXPECTED_SAMPLES = 12;
const reject = reason => { throw new Error('D1F_SHOWER_GLASS_PIXEL_GATE_REJECTED: ' + reason); };
const integer = n => Number.isSafeInteger(n) && n >= 0;
const digest = n => typeof n === 'string' && /^[a-f0-9]{64}$/.test(n);
const validRoi = (r,w,h) => r && [r.x,r.y,r.width,r.height].every(integer) &&
  r.width >= 8 && r.height >= 8 && r.x+r.width <= w && r.y+r.height <= h;
const maxColorDifference = (a,b,offset) =>
  Math.max(Math.abs(a[offset]-b[offset]),Math.abs(a[offset+1]-b[offset+1]),
    Math.abs(a[offset+2]-b[offset+2]),Math.abs(a[offset+3]-b[offset+3]));
const frameValid = (f, s) => f && integer(f.width) && integer(f.height) &&
  f.width >= 32 && f.height >= 32 && f.width <= 4096 && f.height <= 4096 &&
  f.rgba instanceof Uint8Array && f.rgba.length === f.width*f.height*4 &&
  f.cameraFingerprint === s.cameraFingerprint &&
  f.sourceSha256 === D1F_SHOWER_PHOTO_SOURCE.sha256 &&
  f.sceneIndex === s.sceneIndex && f.variant === s.variant;

/**
 * Strictly evaluates 4 source-scene variants x 3 independently suppressed
 * primitives. No CURRENT/as-built or HUMAN_REVIEW upgrade is emitted.
 */
export function evaluateD1FShowerGlassPixelEvidence(samples) {
  if (!Array.isArray(samples) || samples.length !== D1F_SHOWER_GLASS_EXPECTED_SAMPLES) {
    reject('four source variants and all three primitives required');
  }
  const results = [];
  const seen = new Set();
  const baselineByVariant = new Map();
  for (const sample of samples) {
    const s = sample;
    const row = D1F_SHOWER_PHOTO_VARIANTS.find(v => v.name === s?.variant);
    const part = D1F_SHOWER_GLASS_PARTS.find(p => p.part === s?.part);
    if (!row || !part || s.candidateId !== D1F_SHOWER_GLASS_PIXEL_CANDIDATE ||
        s.sceneIndex !== row.sceneIndex || s.rootNode !== row.rootNode ||
        s.glassNode !== row.glassNode || s.meshIndex !== 777 ||
        s.primitiveIndex !== part.primitiveIndex || s.sourceBytes !== D1F_SHOWER_PHOTO_SOURCE.bytes ||
        s.sourceSha256 !== D1F_SHOWER_PHOTO_SOURCE.sha256 ||
        !digest(s.sourceSha256) ||
        typeof s.cameraFingerprint !== 'string' || s.cameraFingerprint.length < 12 ||
        s.targetIsolationMethod !== 'SOURCE_GLTF_MESH_777_PRIMITIVE_' + part.primitiveIndex + '_ONLY' ||
        s.targetIdentityVerified !== true || s.singlePrimitiveSuppressionVerified !== true ||
        s.sameCameraVerified !== true || s.suppressionRestoredVerified !== true ||
        s.roiProvenance !== 'PROJECTED_EXACT_GLASS_PRIMITIVE_GEOMETRY' ||
        !s.frames || !frameValid(s.frames.baseline,s) ||
        !frameValid(s.frames.suppressed,s) || !frameValid(s.frames.restored,s)) {
      reject('source identity, single primitive isolation, ROI or frame provenance');
    }
    const key = s.variant + ':' + s.part;
    if (seen.has(key)) reject('duplicate primitive evidence');
    seen.add(key);
    const a=s.frames.baseline,b=s.frames.suppressed,c=s.frames.restored;
    if (a.width !== b.width || b.width !== c.width ||
        a.height !== b.height || b.height !== c.height ||
        !validRoi(s.roi,a.width,a.height)) reject('frame dimensions or target ROI');
    // All three primitive captures of one scene MUST use the same pixel-identical baseline.
    const previous=baselineByVariant.get(s.variant);
    if (previous) {
      if (previous.cameraFingerprint !== s.cameraFingerprint ||
          previous.rgba.length !== a.rgba.length) reject('baseline identity drift');
      for (let i=0;i<a.rgba.length;i++) {
        if (a.rgba[i]!==previous.rgba[i]) reject('baseline image drift');
      }
    } else baselineByVariant.set(s.variant,{cameraFingerprint:s.cameraFingerprint,rgba:a.rgba});
    let inside=0,outside=0,restorationDrift=0;
    for(let y=0;y<a.height;y++)for(let x=0;x<a.width;x++) {
      const i=(y*a.width+x)*4;
      if(maxColorDifference(a.rgba,c.rgba,i)>2) restorationDrift++;
      if(maxColorDifference(a.rgba,b.rgba,i)<part.deltaThreshold) continue;
      if(x>=s.roi.x && x<s.roi.x+s.roi.width &&
         y>=s.roi.y && y<s.roi.y+s.roi.height) inside++;
      else outside++;
    }
    if (inside < part.minChanged || outside > 8 ||
        outside > Math.ceil(inside*0.06) || restorationDrift !== 0) {
      reject('primitive is not independently visible, change spills out or restoration differs');
    }
    results.push(Object.freeze({
      variant:s.variant, sceneIndex:s.sceneIndex, part:s.part,
      glassNode:s.glassNode, primitiveIndex:s.primitiveIndex,
      changedInsideTarget:inside, changedOutsideTarget:outside,
      restoredPixelDrift:restorationDrift, provenance:'SUPPLIED_TARGET_RGBA_ONLY',
    }));
  }
  if (seen.size !== 12 || baselineByVariant.size !== 4) reject('source roster incomplete');
  return Object.freeze({
    result:'PASS_TWELVE_SUPPLIED_OBJECT_DIFFERENTIALS_ONLY',
    candidateId:D1F_SHOWER_GLASS_PIXEL_CANDIDATE,
    originalGlbSha256:D1F_SHOWER_PHOTO_SOURCE.sha256,
    sceneIndices:Object.freeze(D1F_SHOWER_PHOTO_VARIANTS.map(v=>v.sceneIndex)),
    samples:Object.freeze(results),
    checkedSourceScenes:4, checkedSeparateGlassSubparts:12,
    rawGlbAuthenticatedByThisFunction:false,
    authenticatedProductionBrowserVerifiedByThisFunction:false,
    screenshotOriginAuthenticatedByThisFunction:false,
    humanReview:'NOT_RUN', current:false, canonical:false, asBuilt:false,
  });
}
