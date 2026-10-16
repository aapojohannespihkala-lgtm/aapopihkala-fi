/**
 * P186E historical D 2015 label capture bridge, caller-renderer only.
 * Must not be treated as authenticated production, measured device positions or HUMAN_REVIEW.
 */
import {
  verifyP186E34SourcePixelEvidence,
  p186ePixelCandidateId,
  p186ePixelExpected,
} from './privateModelP186E34PixelEvidence.mjs';

const fail = (why) => { throw new Error('P186E_CAPTURE_BRIDGE: ' + why); };
const check = (ok, why) => { if (!ok) fail(why); };
const live = (node) => {
  let cursor=node, depth=0, seen=new Set();
  while (cursor) {
    check(!seen.has(cursor) && ++depth<=100, 'parent tree loop/depth');
    seen.add(cursor);
    if (cursor.visible === false) return false;
    cursor=cursor.parent;
  }
  return true;
};
// Capturing 34 muted frames and two baseline frames retains 36 RGBA copies.
// A 4096x4096 source would occupy more than 2 GiB before verifier overhead.
// Keep one renderer's captured frame at or below a 1920x1200 presentation.
export const p186eMaxCapturePixels = 2_304_000;
const samePixels = (a,b) =>
  a.length===b.length && a.every((value,i)=>value===b[i]);
const cleanFrame = (value) => {
  check(value && Number.isSafeInteger(value.width) && Number.isSafeInteger(value.height)
    && value.width>=16 && value.height>=16 && value.width<=4096 && value.height<=4096
    && value.width * value.height <= p186eMaxCapturePixels
    && value.pixels instanceof Uint8Array
    && value.pixels.length===value.width*value.height*4, 'real RGBA frame shape');
  // WebGL capture callbacks may reuse the same backing buffer.
  return {...value,pixels:Uint8Array.from(value.pixels)};
};

/**
 * captureRGBA(session) must perform the real renderer readback, NOT manufacture pixels.
 * readCameraFingerprint(session) must cover camera transforms, projection and canvas viewport.
 * Neither callback independently authenticates the browser, GLB or production source.
 */
export async function captureP186E34SourceFrames({
  sourceCandidateId=p186ePixelCandidateId, floors, captureRGBA, readCameraFingerprint,
}={}) {
  check(sourceCandidateId===p186ePixelCandidateId && Array.isArray(floors)
    && floors.length===2 && typeof captureRGBA==='function'
    && typeof readCameraFingerprint==='function', 'capture contract');
  const prepared=[];
  const done=new Set();
  for (const session of floors) {
    const expected=p186ePixelExpected[session?.floor];
    check(expected && !done.has(session.floor)
      && Array.isArray(session.targets)
      && session.targets.length===expected.total, 'floor identity/count');
    done.add(session.floor);
    const objects=session.targets.map(t=>t.object);
    check(objects.every(o=>o && typeof o==='object' && o.visible===true && live(o))
      && new Set(objects).size===objects.length, 'visible distinct source objects');
    const camera=readCameraFingerprint(session);
    check(typeof camera==='string' && camera.length>=8, 'camera fingerprint');
    const stable=()=>check(readCameraFingerprint(session)===camera, 'camera drift');
    const capture=async()=>{
      stable();
      const frame=cleanFrame(await captureRGBA(session));
      stable();
      check(frame.floor===session.floor && frame.cameraKey===session.cameraKey
        && frame.sceneKey===session.sceneKey
        && frame.sourceCandidateId===sourceCandidateId, 'frame provenance');
      return frame;
    };
    const baseline=await capture();
    const hiddenFrames=Object.create(null);
    for (const target of session.targets) {
      check(objects.every(o=>o.visible===true && live(o)), 'peer visibility before hide');
      const object=target.object;
      let hidden;
      object.visible=false;
      try {
        check(!live(object)
          && objects.every(o=>o===object || o.visible===true && live(o)),
          'selective target visibility');
        hidden=await capture();
        check(objects.every(o=>o===object || o.visible===true && live(o)),
          'peer visibility during capture');
      } finally {
        object.visible=true;
      }
      check(objects.every(o=>o.visible===true && live(o)), 'restore visibility');
      const restored=await capture();
      check(restored.width===baseline.width && restored.height===baseline.height
        && samePixels(restored.pixels,baseline.pixels),
        'restored frame differs from baseline');
      hiddenFrames[target.sourceKey]=hidden;
    }
    prepared.push({
      floor:session.floor,cameraKey:session.cameraKey,sceneKey:session.sceneKey,
      baseline, hiddenFrames,
      targets:session.targets.map(({object,...target})=>target),
    });
  }
  const evidence=verifyP186E34SourcePixelEvidence({
    sourceCandidateId,floors:prepared,
  });
  return Object.freeze({
    ...evidence, captureBridge:'CALLER_RENDERER_ONLY',
    exactRestoresVerified:true,
    sourceAuthenticated:false, productionScreenshotVerified:false,
    humanReview:'NOT_RUN',
  });
}
