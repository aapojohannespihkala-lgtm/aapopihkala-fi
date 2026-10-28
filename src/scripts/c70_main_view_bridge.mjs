/**
 * C70 -> current src/pages/private-model/index.astro mainViewScope bridge.
 * Explicit browser-local WORK_TEST staging preview, never CURRENT.
 * Uses the existing unchanged d_floor_router.mjs 14-mode router and verified
 * original C70 model bytes. Does not copy or mutate any mesh/source metadata.
 */
import {verifyC70GLB,createC70Router} from './d_floor_router.mjs';
const reject = why => { throw Error(`C70_VIEWER_BRIDGE_FAIL_CLOSED: ${why}`); };
const VALID_FLOORS = new Set(['1F','2F','BOTH']);
/**
 * This is a *parsed-source* loader, not a new/offline renderer. MUST feed
 * GLTFLoader.parseAsync precisely the ArrayBuffer verified here, once.
 */
export async function prepareC70Preview({glbBytes,contract,loader,baseUrl,previewGate,sourceKind}) {
  if(previewGate!=='EXPLICIT_WORK_TEST_PREVIEW'||sourceKind!=='work-test') reject('Explicit WORK_TEST staging preview required');
  if(!loader||typeof loader.parseAsync!=='function')reject('Exact GLTFLoader.parseAsync unavailable');
  if(typeof baseUrl!=='string'||(!baseUrl.startsWith('/')&&!/^https:\/\//.test(baseUrl)))reject('Trusted base URL required');
  const verification=await verifyC70GLB(glbBytes,contract);
  const bytes=glbBytes instanceof ArrayBuffer?glbBytes:glbBytes.buffer.slice(glbBytes.byteOffset,glbBytes.byteOffset+glbBytes.byteLength);
  const gltf=await loader.parseAsync(bytes,baseUrl);
  if(!gltf||!Array.isArray(gltf.scenes)||gltf.scenes.length!==verification.sceneCount ||
     gltf.scene!==gltf.scenes[contract.glbDefaultScene]||gltf.parser?.json?.scene!==contract.glbDefaultScene||
     gltf.parser?.json?.scenes?.length!==verification.sceneCount)reject('Parsed model does not match verified source');
  const router=createC70Router(contract,verification);
  return Object.freeze({gltf,router,contract,verification});
}
/**
 * `setScene` = existing index.astro setModelScene, `defaultScene` = original
 * gltf.scene. The returned facade implements the mainViewScope fields read by
 * index.astro; source-scene-specific UI labels need the accompanying patch.
 */
export function createC70MainViewBridge({session,setScene,readMountedScene,previewGate,sourceKind}) {
  if(previewGate!=='EXPLICIT_WORK_TEST_PREVIEW'||sourceKind!=='work-test')reject('Viewer source is not explicitly WORK_TEST');
  if(!session?.verification?.verified||session.verification.safeForProduction!==false||
     session.verification.glbSha256!==session.contract?.glbSha256 ||
     session.contract?.canApplyToViewer!==false || session.contract?.canPublish!==false)reject('Source/safety gate missing');
  const {gltf,router,contract}=session;
  const wholeScene=gltf.scenes[contract.viewerWholeScene??contract.glbDefaultScene];
  if(typeof setScene!=='function'||typeof readMountedScene!=='function'||gltf.scenes.length!==session.verification.sceneCount||
     gltf.scene!==gltf.scenes[contract.glbDefaultScene]||!wholeScene)reject('Invalid/unobservable host scene switch');
  let active=false,disposed=false,poisoned=false,currentFloor='BOTH',activeSceneIndex=null;
  let options={doorMode:'WORK_TEST',gable:contract.model==='D_C80'?'NONE':'K14_SHIFT_220',k9Reference:false,targetFloor:null};
  const ensure=()=>{if(disposed||poisoned)reject('Disposed or poisoned bridge')};
  const restore=()=>{
    if(disposed)return;
    // Clear before calling setModelScene: the real host resets an active scope
    // when root != fullModelScene; do not accidentally re-enter bridge.restore.
    const wasActive=active;active=false;currentFloor='BOTH';activeSceneIndex=null;
    if(wasActive){
      try {
        setScene(wholeScene);
        if(readMountedScene()!==wholeScene)reject('WHOLE restore was not mounted');
      } catch(error){poisoned=true;reject('WHOLE restore failed; discard viewer session');}
    }
  };
  const select=nextFloor=>{
    ensure();if(!VALID_FLOORS.has(nextFloor))reject('Unsupported floor');
    // Explicit opt-ins stay tied to their verified source floor. Baseline
    // changes are reset by the host when switching between 1F/2F/BOTH.
    if(options.targetFloor && options.targetFloor!==nextFloor)
      reject('Opt-in source floor differs from requested floor');
    const selection=nextFloor==='BOTH'
       ? {floor:nextFloor,doorMode:options.doorMode,gable:options.gable,k9Reference:options.k9Reference}
       : {floor:nextFloor,doorMode:options.doorMode,gable:'NONE',k9Reference:options.k9Reference};
    const row=router.route(selection); // authoritative contract fails closed
    const target=gltf.scenes[row.sceneIndex];
    if(!target)reject('Parsed source scene missing');
    // Fail before any host mutation. The host setScene owns modelRoot and edge
    // refresh; our bridge never attaches a duplicate root or mutates meshes.
    // A silent host no-op is dangerous: require observable mounted-scene parity.
    active=false;
    try {
      setScene(target);
      if(readMountedScene()!==target)reject('Host mounted a different scene');
    }catch(error){
      // Best effort WHOLE rollback; poison even after successful rollback, to
      // prevent an unnoticed transient partial mount from being reused.
      poisoned=true;
      try {setScene(wholeScene);}catch(_){/* host will require reload */}
      reject('Scene mount failed; discard viewer session');
    }
    currentFloor=nextFloor;activeSceneIndex=row.sceneIndex;active=true;
    return {
      included:row.rootCount, // SOURCE ROOTS, not physically classified meshes
      exceptions:[{objectKey:'C70_WORK_TEST_SCENE',reason:'SOURCE_ONLY_HOST_HOLD'}],
      sourceRoots:row.rootCount,sceneIndex:row.sceneIndex,sourceSceneName:row.sceneName,
      sourceStatus:'WORK_TEST_SOURCE_ONLY_STAGING_HOLD',
      canPublish:false,physicalHost:'HOLD',historical:options.doorMode!=='WORK_TEST',
    };
  };
  return Object.freeze({
    isC70SourceScene:contract.model==='D_C70', isSourceScene:true, sourceModel:contract.model,
    apply:select, restore,
    enforce:()=>{
      if(disposed||poisoned||!active)return;
      if(readMountedScene()!==gltf.scenes[activeSceneIndex]){
        poisoned=true;active=false;currentFloor='BOTH';activeSceneIndex=null;
        try{setScene(wholeScene);}catch(_){/* reload required */}
        // The caller must reload this failed source session, never reuse it.
      }
    },
    referenceCandidates:()=>[],
    dispose(){
      if(disposed)return;
      restore();disposed=true;
      // GLTFLoader shares resources across the 70 scenes. Release each once
      // when leaving the local preview, never on individual floor switches.
      const geometries=new Set(),materials=new Set();
      for(const root of gltf.scenes)root.traverse(object=>{
        if(object.geometry)geometries.add(object.geometry);
        for(const material of Array.isArray(object.material)?object.material:[object.material])
          if(material)materials.add(material);
      });
      for(const geometry of geometries)geometry.dispose();
      for(const material of materials)material.dispose();
    },
    setPreviewOptions(next){
      ensure();if(active)reject('Restore before changing options');
      const keys=next && typeof next==='object' ? Object.keys(next).sort().join(',') : '';
      const explicit=keys==='doorMode,gable,k9Reference,targetFloor';
      const legacy=keys==='doorMode,gable,k9Reference';
      if((!explicit&&!legacy)||typeof next.k9Reference!=='boolean')
        reject('Exact source-scoped opt-in fields required');
      const targetFloor=explicit?next.targetFloor:'BOTH';
      if(!VALID_FLOORS.has(targetFloor))reject('Unsupported opt-in floor');
      // Source contract validates the actual selection, never a fabricated
      // BOTH route for the 2F historical or single-floor K9 source scenes.
      router.route({floor:targetFloor,doorMode:next.doorMode,
        gable:next.gable,k9Reference:next.k9Reference});
      options={doorMode:next.doorMode,gable:next.gable,
        k9Reference:next.k9Reference,targetFloor};
    },
    get available(){return !disposed&&!poisoned}, get active(){return active&&!poisoned},
    get floor(){return currentFloor}, get sceneIndex(){return activeSceneIndex},
    get t04Status(){return 'T04_HOLD'}, stairStatus:'HOST_HOLD',
    sourceSha256:contract.glbSha256, sourceStatus:'WORK_TEST_SOURCE_ONLY',
    canPublish:false,canApplyToViewer:false,
    get defaultScene(){return wholeScene},
    get selectedScene(){return active&&!poisoned?gltf.scenes[activeSceneIndex]:wholeScene},
  });
}

