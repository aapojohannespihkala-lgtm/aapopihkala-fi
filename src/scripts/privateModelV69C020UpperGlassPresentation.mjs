// Restore the eight source-modeled upper balcony panes in exact V69 2F/BOTH.
// The source GLB and historical geometry stay unchanged. This is WORK_TEST/HOST_HOLD.
export const V69_C020_UPPER_GLASS_SHA = '5b720c9b9f87358867463e725b1500c63bafd9de15d121cdf6c36a3e23ca36fd';
const HISTORICAL_SCENE = 54;
const HISTORICAL_ROOT = 6471;
const UPPER = [6463,6464,6465,6466,6467,6468,6469,6470];
const LOWER = [6472,6473,6474,6475,6476];
const TARGET_SCENES = [291,292];
const unavailable = reason => ({
  available:false,reason,count:0,applied:false,setApplied:()=>false,dispose:()=>{},
});
const near = (a,b) => typeof a==='number' && Math.abs(a-b)<0.00001;

// GLTFLoader r185 can discard parser.associations for earlier scenes.
 // Only an exact source-root ordinal, source name and parent match may
 // substitute for an absent association. Conflicting mappings fail closed.
function sourceNameMatches(runtime,sourceName){
  if(typeof runtime?.name!=='string' || typeof sourceName!=='string')return false;
  const suffix=runtime.name.slice(sourceName.length);
  return runtime.name===sourceName ||
    (runtime.name.startsWith(sourceName) && /^_instance_[0-9]+$/.test(suffix));
}
function exactSceneRoot(scene,sourceScene,id,json,associations,{group=false}={}){
  const roots=sourceScene?.nodes;
  if(!Array.isArray(roots) || scene?.children?.length!==roots.length)return null;
  const ordinal=roots.indexOf(id);
  if(ordinal<0 || roots.lastIndexOf(id)!==ordinal)return null;
  const object=scene.children[ordinal],node=json.nodes[id];
  if(!sourceNameMatches(object,node?.name) || object?.parent!==scene)return null;
  if(group){
    // glTF child-only nodes have no mesh/camera attachment. GLTFLoader r185
    // instantiates them as plain Object3D, not Group. Preserve exact source
    // identity, root ordinal, name, parent, and child-count guards.
    if(!object.isObject3D || object.isMesh || object.isCamera ||
       object.children?.length!==node.children?.length)return null;
  }else if(!object.isMesh || object.children?.length!==0 || node?.children?.length)return null;
  const mapping=associations.get(object);
  if(mapping && mapping.nodes!==id)return null;
  return object;
}
function exactSourceChild(parent,jsonParent,id,i,json,associations){
  if(jsonParent?.children?.[i]!==id)return null;
  const child=parent.children?.[i],node=json.nodes[id];
  if(!child?.isMesh || child.parent!==parent || child.children?.length!==0 ||
     node?.children?.length || !sourceNameMatches(child,node?.name))return null;
  const mapping=associations.get(child);
  if(mapping && mapping.nodes!==id)return null;
  return child;
}

export function createV69C020UpperGlassPresentation(gltf,loadedSha,expectedSha) {
  const json=gltf?.parser?.json;
  const associations=gltf?.parser?.associations;
  const mat=json?.materials?.[342];
  const factor=mat?.pbrMetallicRoughness?.baseColorFactor;
  if (loadedSha!==V69_C020_UPPER_GLASS_SHA || expectedSha!==loadedSha ||
      json?.asset?.version!=='2.0' || json?.asset?.extras?.current!==false ||
      json?.asset?.extras?.asBuilt!==false || json?.scene!==292 ||
      json?.scenes?.length!==293 || gltf?.scenes?.length!==293 ||
      json?.nodes?.length!==9914 || json?.meshes?.length!==3592 ||
      mat?.alphaMode!=='BLEND' || mat?.doubleSided!==true ||
      !mat?.extensions?.KHR_materials_unlit ||
      !Array.isArray(factor) || factor.length!==4 ||
      !factor.every((v,i)=>near(v,[.65,.82,.9,.62][i])) ||
      typeof associations?.get!=='function' ||
      typeof associations?.set!=='function' ||
      typeof associations?.delete!=='function')return unavailable('source-sha-or-glass-material');

  const historical=json.scenes[HISTORICAL_SCENE];
  const parent=json.nodes[HISTORICAL_ROOT];
  if(!historical?.nodes?.includes(HISTORICAL_ROOT) ||
     !historical.name?.includes('BALCONY_GLASS_VISIBILITY') ||
     !Array.isArray(parent?.children) ||
     !UPPER.every((id,i)=>parent.children[i]===id) ||
     !Array.isArray(parent.rotation) || parent.rotation.length!==4 ||
     !parent.rotation.every((v,i)=>near(v,[-Math.SQRT1_2,0,0,Math.SQRT1_2][i])))
    return unavailable('historical-upper-source-parent');
  const sourceParent=exactSceneRoot(gltf.scenes[HISTORICAL_SCENE],historical,HISTORICAL_ROOT,json,associations,{group:true});
  if(!sourceParent?.isObject3D || sourceParent.isMesh || sourceParent.isCamera ||
     sourceParent.parent!==gltf.scenes[HISTORICAL_SCENE] ||
     typeof sourceParent.clone!=='function' ||
     typeof sourceParent.add!=='function')return unavailable('historical-runtime-parent');

  const sourcePanes=[];
  for(let i=0;i<UPPER.length;i++){
    const id=UPPER[i],node=json.nodes[id];
    const primitive=json.meshes?.[1859]?.primitives?.[0];
    const name=`G2_D_2F_BALCONY_GLASS_FIELD_20261024_PANEL_${String(i+1).padStart(2,'0')}_758MM`;
    if(node?.name!==name || node?.mesh!==1859 ||
       json.meshes[1859].primitives.length!==1 || primitive?.material!==342 ||
       !near(node.translation?.[0],.5135+i*.764) ||
       !near(node.translation?.[1],-1.569) || !near(node.translation?.[2],4.49) ||
       node.extras?.asBuilt===true || node.extras?.current===true)
      return unavailable('historical-upper-source-node');
    const source=exactSourceChild(sourceParent,parent,id,i,json,associations);
    if(!source?.isMesh || Array.isArray(source.material) ||
       !source.material?.transparent || !near(source.material.opacity,.62) ||
       typeof source.clone!=='function')return unavailable('historical-upper-runtime-mesh');
    sourcePanes.push(source);
  }
  if(new Set(sourcePanes).size!==8)return unavailable('historical-panes-not-unique');

  for(const sceneIndex of TARGET_SCENES) {
    const s=json.scenes[sceneIndex];
    const root=gltf.scenes[sceneIndex];
    if(!root || !Array.isArray(s?.nodes) ||
       !s.name?.startsWith('C80R2_V69_') ||
       s.nodes.includes(HISTORICAL_ROOT) ||
       UPPER.some(id=>s.nodes.includes(id)) ||
       !LOWER.every(id=>s.nodes.includes(id)) ||
       !LOWER.every(id=>exactSceneRoot(root,s,id,json,associations)?.isMesh))
      return unavailable('target-scene-or-lower-glazing');
  }

  let applied=false;
  let inserted=[];
  const restore=()=>{
    for(const {scene,group,clones} of inserted){
      scene.remove(group);
      for(const clone of clones)associations.delete(clone);
    }
    inserted=[];
    applied=false;
  };
  return {
    available:true,reason:null,count:16,get applied(){return applied;},
    setApplied(next){
      if(!next){restore();return true;}
      if(applied)return true;
      const staged=[];
      try {
        for(const sceneIndex of TARGET_SCENES) {
          const scene=gltf.scenes[sceneIndex];
          const group=sourceParent.clone(false);
          group.name=`V69_C80_020_UPPER8_SOURCE_VISIBLE_${sceneIndex}_WORK_TEST_HOST_HOLD`;
          group.userData={modelStage:'WORK_TEST',physicalHost:'HOST_HOLD',
            asBuilt:false,current:false,sourceGLBSHA256:V69_C020_UPPER_GLASS_SHA,
            sourceRoot:HISTORICAL_ROOT,sourceNodes:[...UPPER],viewerPresentationOnly:true};
          const clones=[];
          for(let i=0;i<UPPER.length;i++) {
            const clone=sourcePanes[i].clone(false);
            group.add(clone);
            clones.push(clone);
          }
          staged.push({scene,group,clones});
        }
        for(const item of staged) {
          for(let i=0;i<UPPER.length;i++){
            const src=associations.get(sourcePanes[i]);
            associations.set(item.clones[i],src ? {...src,nodes:UPPER[i]} :
              {nodes:UPPER[i],meshes:1859,primitives:0});
          }
          item.scene.add(item.group);
        }
        inserted=staged;
        applied=true;
        return true;
      }catch{
        for(const item of staged){
          item.scene.remove(item.group);
          for(const clone of item.clones)associations.delete(clone);
        }
        return false;
      }
    },
    dispose:restore,
  };
}
