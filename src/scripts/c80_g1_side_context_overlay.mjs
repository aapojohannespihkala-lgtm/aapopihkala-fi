/**
 * Opt-in presentation layer for exactly two C80 BOTH G1 contextual facades.
 * Changes only mesh.visible on the TWO source-context children; never group,
 * geometry, materials, roof nodes, K17, other floor scenes or FULL_CONTEXT.
 * WORK_TEST / SOURCE_ONLY / HOST_HOLD, not evidence of as-built structure.
 */
export const C80_SOURCE_SHA256 = 'c8230e1877a2fc2cd0c633c5247a92975b4669ae685f491fad9f45092fc11b8d';
export const TARGETS = Object.freeze([
  Object.freeze({sourceNode:4954,name:'C80_SOURCE_CONTEXT__1F_G1_NORTH_AND_SOUTH_CONTEXT',objectKey:'C80_CONTEXT:1F_G1_NORTH_AND_SOUTH_CONTEXT:1F'}),
  Object.freeze({sourceNode:4956,name:'C80_SOURCE_CONTEXT__2F_G1_NORTH_AND_SOUTH_CONTEXT',objectKey:'C80_CONTEXT:2F_G1_NORTH_AND_SOUTH_CONTEXT:2F'})
]);
const fail=reason=>{throw new Error('C80_G1_SIDE_FAIL_CLOSED: '+reason)};
const ROOT_NAME='C80_SOURCE_CONTEXT_SEPARATE_FROM_FLOOR_CONTENT';

export function createC80G1SideContextOverlay({gltf,verifiedGlbSha256,sourceKind='work-test',readMountedScene=null}={}){
  if(verifiedGlbSha256!==C80_SOURCE_SHA256 || sourceKind!=='work-test')fail('original SHA or stage not verified');
  if(readMountedScene!==null && typeof readMountedScene!=='function')fail('invalid mount observer');
  const json=gltf?.parser?.json;
  if(json?.scene!==0 || json.scenes?.length!==4 || gltf.scenes?.length!==4 || !Array.isArray(json.nodes) ||
     json.asset?.extras?.current===true || json.asset?.extras?.asBuilt===true)fail('model or scene contract');
  const map=json.extras?.C80Delivery?.sceneMap;
  if(!map || [map.BOTH,map['1F'],map['2F'],map.FULL_CONTEXT].join(',')!=='0,1,2,3')fail('scene routing contract');
  const srcScene=json.scenes[0],runtimeScene=gltf.scenes[0];
  if(srcScene.name!=='D_BOTH_C80_SOURCE_PRESENTATION_WORK_TEST_HOST_HOLD' ||
     runtimeScene?.children?.length!==srcScene.nodes.length)fail('scene 0 root order/count');
  const rootPositions=srcScene.nodes.map((id,pos)=>json.nodes[id]?.name===ROOT_NAME?pos:-1).filter(i=>i>=0);
  if(rootPositions.length!==1)fail('context group missing/ambiguous');
  const sourceRoot=json.nodes[srcScene.nodes[rootPositions[0]]];
  const root=runtimeScene.children[rootPositions[0]];
  if(sourceRoot?.children?.length!==18 || sourceRoot.extras?.sourceOnly!==true || sourceRoot.extras?.presentationOnly!==true ||
     sourceRoot.extras?.physicalHost!=='HOST_HOLD' || root?.children?.length!==18 || root.userData?.sourceOnly!==true ||
     root.userData?.physicalHost!=='HOST_HOLD')fail('source-context root verification');
  const entries=TARGETS.map(target=>{
    const ordinal=sourceRoot.children.indexOf(target.sourceNode);
    const src=json.nodes[target.sourceNode],obj=root.children[ordinal];
    if(ordinal<0 || src?.name!==target.name || src?.mesh===undefined || !obj?.isMesh ||
       src.extras?.sourceOnly!==true || src.extras?.presentationOnly!==true || src.extras?.physicalHost!=='HOST_HOLD' ||
       src.extras?.representationKind!=='SOURCE_CONTEXT' || src.extras?.ylisViewScope?.objectKey!==target.objectKey ||
       src.extras?.current!==false || src.extras?.asBuilt!==false ||
       obj.userData?.representationKind!==src.extras.representationKind ||
       obj.userData?.ylisViewScope?.objectKey!==target.objectKey)fail('target source/runtime node: '+target.sourceNode);
    return {obj,originalVisible:obj.visible,target};
  });
  if(entries[0].obj===entries[1].obj)fail('runtime mesh collision');
  let disposed=false,active=false,interior=true;
  const guard=()=>{if(disposed)fail('disposed')};
  const restore=()=>{for(const e of entries)e.obj.visible=e.originalVisible;active=false;interior=true};
  const selectScene=(sceneIndex,interiorMode=true)=>{
    guard();if(!Number.isInteger(sceneIndex) || typeof interiorMode!=='boolean')fail('invalid scene/mode');
    restore();
    if(sceneIndex!==0)return Object.freeze({supported:false,sourceContextChanged:0});
    if(readMountedScene && readMountedScene()!==runtimeScene)fail('selected scene not mounted');
    if(!runtimeScene.children.includes(root) || !entries.every(e=>root.children.includes(e.obj)))fail('runtime association changed');
    active=true;interior=interiorMode;
    for(const e of entries)e.obj.visible=e.originalVisible && !interior;
    return Object.freeze({supported:true,scene:'BOTH',interiorMode:interior,sideContextVisible:!interior,sourceContextChanged:2,sourceStage:'WORK_TEST_SOURCE_ONLY_HOST_HOLD'});
  };
  const setInteriorMode=(value)=>{guard();if(typeof value!=='boolean')fail('boolean mode required');
    if(!active)return Object.freeze({supported:false,sourceContextChanged:0});
    return selectScene(0,value);
  };
  const onModelUnmount=()=>{guard();restore()};
  const dispose=()=>{if(disposed)return;restore();disposed=true};
  return Object.freeze({selectScene,setInteriorMode,onModelUnmount,dispose,sourceSha256:C80_SOURCE_SHA256,
    get active(){return active},get interiorMode(){return active&&interior},get sourceTargets(){return TARGETS}});
}
