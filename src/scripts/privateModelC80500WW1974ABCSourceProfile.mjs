import { nameMatches, sameSourceName } from './privateModelSourceNodeAssociations.mjs';

// WORK_TEST_HOST_HOLD. 500 is an append-only successor of the 495 sewer/Savo GLB.
export const C80_500_GLB_SHA256 = 'f3ed1f4520d3f1d8dfab6451ff3adbbba0ca600a3b8b29753adf04c601ccba2d';
export const C80_500_GLB_BYTES = 55220144;
export const C80_500_PARENT_SHA256 = 'cf4706c72f759965b1f363e1b8cf08700a8178ec882ed44e977355f7a58e3992';
export const C80_500_ABC_ROOT = 12237;
export const C80_500_L150_ROOT = 12228;
export const C80_500_SAVO_ROOT = 12230;
export const C80_500_NEW_PARENT_SCENES = Object.freeze({495:483,496:489,497:491,498:493,499:494});
export const C80_500_VIEWER_ROLES = Object.freeze({
  495:Object.freeze({floor:'1F',glazing:'CLOSED',cutaway:false}),
  488:Object.freeze({floor:'2F',glazing:'CLOSED',cutaway:false}),
  496:Object.freeze({floor:'BOTH',glazing:'CLOSED',cutaway:false}),
  490:Object.freeze({floor:'2F',glazing:'ONE_OPEN',cutaway:false}),
  497:Object.freeze({floor:'BOTH',glazing:'ONE_OPEN',cutaway:false}),
  492:Object.freeze({floor:'2F',glazing:'STACKED',cutaway:false}),
  498:Object.freeze({floor:'BOTH',glazing:'STACKED',cutaway:false}),
  499:Object.freeze({floor:'BOTH',glazing:'CLOSED',cutaway:true}),
});
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const children=[12231,12232,12233,12234,12235,12236];
const letters=['A','A','B','B','C','C'];

export function isC80500ABCSourceScene(json,sha,index) {
  if (sha!==C80_500_GLB_SHA256 || json?.scene!==292 ||
      json?.scenes?.length!==500 || json?.nodes?.length!==12238 ||
      json?.meshes?.length!==4611 || json?.materials?.length!==739) return false;
  const abc=json.nodes[C80_500_ABC_ROOT], sewer=json.nodes[C80_500_L150_ROOT], savo=json.nodes[C80_500_SAVO_ROOT];
  if(abc?.name!=='M5_WW1974_APT_ABC_L100_THREE_BRANCHES_TO_L150_WORK_TEST_HOST_HOLD' ||
     !same(abc.children,children) || abc.extras?.current!==false ||
     abc.extras?.asBuilt!==false || abc.extras?.sourceLinksBound!==false ||
     abc.extras?.originalMainRoot!==C80_500_L150_ROOT ||
     sewer?.name!=='M5_INTEGRATION_CLAUDE_WW_D1F_TO_SITE_SEWER_L150_WORK_TEST_HOST_HOLD' ||
     !same(sewer.children,[12225,12226,12227]) ||
     savo?.name!=='SAVO_MJ83_OWNERPHOTO_CORRECTED_KEYPAD_ROOT_WORK_TEST_HOST_HOLD' ||
     !same(savo.children,[12229])) return false;
  for(let i=0;i<children.length;i++){
    const n=json.nodes[children[i]];
    if(n?.mesh!==4605+i || !n.name?.startsWith('WW1974_'+letters[i]+'_L100_DRAIN_') ||
       !n.name.endsWith('WORK_TEST_HOST_HOLD') ||
       n.extras?.asBuilt!==false || n.extras?.current!==false ||
       n.extras?.sourceLinksBound!==false) return false;
  }
  const scene=json.scenes[index];
  if(!scene || !Array.isArray(scene.nodes)) return false;
  const prior=C80_500_NEW_PARENT_SCENES[index];
  if(prior!==undefined){
    const parent=json.scenes[prior], metadata=scene.extras, branch=metadata?.ww1974AbcBranches;
    return !!parent?.nodes &&
      scene.name==='C80_WW1974_ABC_L100_TO_L150_FROM_SCENE_'+prior+'_WORK_TEST_HOST_HOLD' &&
      metadata?.stage==='WORK_TEST_HOST_HOLD' && metadata?.asBuilt===false &&
      branch?.WORK_TEST===true && branch?.current===false && branch?.asBuilt===false &&
      branch?.mainRoot===C80_500_L150_ROOT && branch?.newRoot===C80_500_ABC_ROOT &&
      branch?.parentSourceScene===prior &&
      parent.nodes.includes(C80_500_L150_ROOT) &&
      (prior===483 ? !parent.nodes.includes(C80_500_SAVO_ROOT) : parent.nodes.includes(C80_500_SAVO_ROOT)) &&
      same(scene.nodes,[...parent.nodes,C80_500_ABC_ROOT]);
  }
  return [488,490,492].includes(index) &&
    /^C80_495_WW74_L150_SAVO_OWNERPHOTO_UV_COFIT_/.test(scene.name||'') &&
    scene.extras?.stage==='WORK_TEST_HOST_HOLD' &&
    scene.extras?.cofitSavoPhotoUV===true &&
    scene.extras?.sourceLinksBoundForNewSHA===false &&
    scene.nodes.includes(C80_500_SAVO_ROOT) &&
    !scene.nodes.includes(C80_500_L150_ROOT) && !scene.nodes.includes(C80_500_ABC_ROOT);
}
export function resolveC80500ABCScenes(gltf,sha){
  const json=gltf?.parser?.json;
  if(sha!==C80_500_GLB_SHA256||gltf?.scenes?.length!==500||!json) return null;
  const result={};
  for(const index of Object.keys(C80_500_VIEWER_ROLES).map(Number)){
    const source=json.scenes[index], rendered=gltf.scenes[index];
    if(!isC80500ABCSourceScene(json,sha,index) || !rendered ||
       !sameSourceName(rendered.name,source.name) ||
       !Array.isArray(rendered.children) || rendered.children.length<source.nodes.length ||
       !source.nodes.every((n,i)=>nameMatches(rendered.children[i],json.nodes[n]))) return null;
    result[index]=rendered;
  }
  return result;
}
export function resolveC80500ABCSceneIndex(floor,glazing='CLOSED',cutaway=false){
  const eligible=Object.entries(C80_500_VIEWER_ROLES).filter(([,r])=>
    r.floor===floor&&r.glazing===glazing&&r.cutaway===cutaway);
  return eligible.length===1?Number(eligible[0][0]):null;
}
