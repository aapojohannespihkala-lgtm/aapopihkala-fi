// Source-only C80 505/H24 receiver. WORK_TEST_HOST_HOLD, not a publication gate.
export const C80_505_GLB_SHA256 = '78fbc1c65d3a879a3097d16cc9646c098499c839828563ea23afab0ecf5214ab';
export const C80_505_GLB_BYTES = 55258836;
export const C80_505_PARENT_SHA256 = 'f3ed1f4520d3f1d8dfab6451ff3adbbba0ca600a3b8b29753adf04c601ccba2d';
export const C80_505_H24_OLD_ROOT = 12116;
export const C80_505_H24_NEW_ROOT = 12238;
export const C80_505_NEW_PARENT_SCENES = Object.freeze({500:495,501:496,502:497,503:498,504:499});
export const C80_505_VIEWER_ROLES = Object.freeze({
  500:{floor:'1F',glazing:'CLOSED',cutaway:false},
  488:{floor:'2F',glazing:'CLOSED',cutaway:false},
  501:{floor:'BOTH',glazing:'CLOSED',cutaway:false},
  490:{floor:'2F',glazing:'ONE_OPEN',cutaway:false},
  502:{floor:'BOTH',glazing:'ONE_OPEN',cutaway:false},
  492:{floor:'2F',glazing:'STACKED',cutaway:false},
  503:{floor:'BOTH',glazing:'STACKED',cutaway:false},
  504:{floor:'BOTH',glazing:'CLOSED',cutaway:true},
});
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const base=(j,sha)=>sha===C80_505_GLB_SHA256 && j?.scene===292 &&
  j?.scenes?.length===505 && j?.nodes?.length===12239 &&
  j?.meshes?.length===4611 && j?.materials?.length===739;
export function isC80505H24SourceScene(json,sha,index){
  if(!base(json,sha))return false;
  const newNode=json.nodes[C80_505_H24_NEW_ROOT], oldNode=json.nodes[C80_505_H24_OLD_ROOT];
  if(newNode?.name!=='C80_505_H24_WC_FRAME_4MM_Z_CLEARANCE_TEST_FROM_n12116_WORK_TEST_HOST_HOLD' ||
     newNode.mesh!==4417 || oldNode?.mesh!==4417 ||
     !same(newNode.translation,[0,0,0.004]) ||
     newNode.extras?.sourceRootNode!==C80_505_H24_OLD_ROOT ||
     newNode.extras?.sourceParentGlbSha256!==C80_505_PARENT_SHA256 ||
     !same(newNode.extras?.cofitShiftWorldGlbYUpZ_m,[0,0,0.004]) ||
     newNode.extras?.current!==false || newNode.extras?.asBuilt!==false ||
     newNode.extras?.hostHold!==true || newNode.extras?.sourceLinksBoundForNewSHA!==false ||
     newNode.extras?.productionWebGLVerified!==false)return false;
  const s=json.scenes[index], parentIndex=C80_505_NEW_PARENT_SCENES[index];
  if(!s || !Array.isArray(s.nodes))return false;
  if(parentIndex===undefined){
    return [488,490,492].includes(index) &&
      /^C80_495_WW74_L150_SAVO_OWNERPHOTO_UV_COFIT_/.test(s.name||'') &&
      s.extras?.stage==='WORK_TEST_HOST_HOLD' &&
      s.extras?.sourceLinksBoundForNewSHA===false &&
      !s.nodes.includes(C80_505_H24_NEW_ROOT) && !s.nodes.includes(C80_505_H24_OLD_ROOT);
  }
  const parent=json.scenes[parentIndex], h=s.extras?.h24FrameCofit;
  if(!parent || !Array.isArray(parent.nodes))return false;
  const oldPos=parent.nodes.indexOf(C80_505_H24_OLD_ROOT);
  if(oldPos<0 || parent.nodes.includes(C80_505_H24_NEW_ROOT))return false;
  const expected=parent.nodes.slice(); expected[oldPos]=C80_505_H24_NEW_ROOT;
  return s.name===`C80_505_H24_FRAME_CLEARANCE_FROM_SCENE_${parentIndex}_WORK_TEST_HOST_HOLD` &&
    s.extras?.stage==='WORK_TEST_HOST_HOLD' && s.extras?.asBuilt===false &&
    s.extras?.sourceLinksBindingVerified===false &&
    h?.sourceScene===parentIndex && h?.oldNode===C80_505_H24_OLD_ROOT &&
    h?.newNode===C80_505_H24_NEW_ROOT &&
    h?.shiftWorldGLB_Z_m===0.004 &&
    h?.sourceGLBSHA256===C80_505_PARENT_SHA256 &&
    h?.sourceLinksBound===false && h?.current===false && h?.asBuilt===false &&
    h?.stage==='WORK_TEST_HOST_HOLD' && same(s.nodes,expected);
}
export function resolveC80505H24Scenes(gltf,sha){
  const json=gltf?.parser?.json;
  if(!base(json,sha) || gltf?.scenes?.length!==505)return null;
  const out={};
  for(const key of Object.keys(C80_505_VIEWER_ROLES)){
    const i=Number(key), s=json.scenes[i], r=gltf.scenes[i];
    if(!isC80505H24SourceScene(json,sha,i) || !r || r.name!==s.name ||
       !Array.isArray(r.children) || r.children.length<s.nodes.length ||
       !s.nodes.every((n,k)=>r.children[k]?.name===json.nodes[n]?.name))return null;
    out[i]=r;
  }
  return out;
}
export function resolveC80505H24SceneIndex(floor,glazing='CLOSED',cutaway=false){
  const x=Object.entries(C80_505_VIEWER_ROLES).filter(([,v])=>v.floor===floor && v.glazing===glazing && v.cutaway===cutaway);
  return x.length===1?Number(x[0][0]):null;
}
