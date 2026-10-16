import { Vector3 } from 'three';
import { detectP186FX4CyanTargetComponents } from './privateModelP186FX4CyanPixelProof.mjs';

// P186F-X4 scene66 is a non-current WORK_TEST with two preserved X3 source
// marks and a Lobby X4 work-assumption. These IDs are historical presentation
// anchors, NOT G2 R989 current-only identity or verified installation points.
const rooms = Object.freeze({
  Bedroom: ['D_THEMO_BEDROOM_CURRENT_01','P186F-X3-R1114'],
  Bathroom: ['D_THEMO_BATHROOM_CURRENT_01','P186F-X3-R1114'],
  Lobby: ['D_THEMO_LOBBY_CURRENT_01','P186F-X4-R1117'],
});
const exactScene = 'P186F-X4 R1117 D THEMO DOOR-PLAN-CLEAR WORK_TEST BABYLON Y-UP';
const reject = why => { throw new Error('P186F_X4_NAMED_HALO_PIXEL_REJECTED: ' + why); };
const finite = value => typeof value === 'number' && Number.isFinite(value);

/**
 * Bind each detected cyan screenshot component to the corresponding real
 * source-attached halo's projected world center, not an anonymous count of 3.
 *
 * The caller must separately prove actual source bytes, authenticated browser
 * and screenshot provenance; even PASS here is not production, installation or
 * human-review evidence. This function changes no source geometry or visibility.
 */
export function evaluateP186FX4NamedHaloPixels({
  gltfScene, sceneIndex, camera, rgba, width, height,
}={}) {
  if (sceneIndex !== 66 || !gltfScene?.isGroup ||
      gltfScene.name !== exactScene ||
      !camera?.isCamera || !(camera.isOrthographicCamera || camera.isPerspectiveCamera) ||
      !Number.isInteger(width) || width<64 || width>4096 ||
      !Number.isInteger(height) || height<64 || height>4096 ||
      !rgba || rgba.length!==width*height*4) reject('scene, camera or frame contract');

  const originals=[];
  gltfScene.traverse(object => {
    if (object.userData?.representationKind === 'thermostatRoomPresentationAnchor') {
      originals.push(object);
    }
  });
  if (originals.length!==3) reject('three original source anchors required');

  const found=new Map();
  for (const target of originals) {
    const data=target.userData;
    const spec=rooms[data.roomAssignment];
    if (!target.isLineSegments || target.geometry?.getAttribute('position')?.count!==4 ||
        !spec || found.has(data.roomAssignment) ||
        data.logicalDeviceId!==spec[0] || data.Pass!==spec[1] ||
        data.presentationOnly!==true || data.workAssumption!==true ||
        data.current!==false || data.Canonical!==false ||
        data.asBuilt!==false || data.exactXYClaim!==false ||
        data.physicalThermostatXYClaim!==false ||
        data.HUMAN_REVIEW!=='NOT_RUN' || target.visible!==true) {
      reject('original room, pass or no-promotion identity mismatch');
    }
    const attached=target.children.filter(child =>
      child.userData?.p186fX4VisibilityProxy===true);
    if (attached.length!==1) reject('missing or duplicated source-attached halo');
    const halo=attached[0],mat=halo.material;
    if (!halo.isMesh || !halo.visible ||
        halo.name!==`P186F_X4_${data.roomAssignment.toUpperCase()}_VIEWER_ONLY_HALO` ||
        halo.userData.presentationOnly!==true ||
        halo.userData.current!==false ||
        halo.userData.Canonical!==false ||
        halo.userData.asBuilt!==false ||
        halo.userData.HUMAN_REVIEW!=='NOT_RUN' ||
        !mat?.isMeshBasicMaterial || mat.color?.getHex()!==0x22d3ee ||
        mat.depthTest!==false || mat.depthWrite!==false ||
        mat.opacity!==0.8) reject('halo must be exact non-current cyan presentation proxy');
    found.set(data.roomAssignment,halo);
  }
  if (found.size!==3) reject('not all source rooms present');

  gltfScene.updateMatrixWorld(true);
  camera.updateMatrixWorld(true);
  camera.updateProjectionMatrix();
  const pixels=detectP186FX4CyanTargetComponents(rgba,width,height);
  if (pixels.componentCount!==3) reject('three separately rendered cyan components required');
  const matches=[],claimed=new Set();
  const tolerance=Math.max(5,Math.min(14,Math.ceil(width*0.01)));
  for(const room of ['Bedroom','Bathroom','Lobby']) {
    const world=found.get(room).getWorldPosition(new Vector3());
    const clip=world.clone().project(camera);
    if (![clip.x,clip.y,clip.z].every(finite) ||
        clip.x<=-1 || clip.x>=1 || clip.y<=-1 || clip.y>=1 ||
        clip.z<=-1 || clip.z>=1) reject('halo is outside the camera frustum');
    const x=(clip.x+1)*width/2,y=(1-clip.y)*height/2;
    const near=pixels.components.filter((c,i)=>
      !claimed.has(i) &&
      x>=c.minX-tolerance && x<=c.maxX+tolerance &&
      y>=c.minY-tolerance && y<=c.maxY+tolerance);
    if(near.length!==1) reject('missing, ambiguous or swapped room halo pixels');
    const componentIndex=pixels.components.indexOf(near[0]);
    claimed.add(componentIndex);
    matches.push(Object.freeze({
      room, sourceMarkerId:rooms[room][0], originalSourcePass:rooms[room][1],
      sourceAttachedViewerHalo:true,projectedPixelX:x,projectedPixelY:y,
      componentIndex,componentBounds:Object.freeze({
        minX:near[0].minX,minY:near[0].minY,
        maxX:near[0].maxX,maxY:near[0].maxY,
      }),
      workAssumption:true,physicalInstallationVerified:false,
    }));
  }
  if(claimed.size!==3) reject('one-to-one original source identity required');
  return Object.freeze({
    result:'THREE_NAMED_SOURCE_HALO_PIXELS_IN_SUPPLIED_FRAME_ONLY',
    sceneIndex:66,checkedRooms:3,matches:Object.freeze(matches),
    pixelColorGatePassed:true,individualRoomPixelAssociationVerified:true,
    originalGlbBytesVerifiedByThisFunction:false,
    authenticatedProductionBrowserVerifiedByThisFunction:false,
    placementVerified:false,current:false,canonical:false,asBuilt:false,
    humanReview:'NOT_RUN',
  });
}
