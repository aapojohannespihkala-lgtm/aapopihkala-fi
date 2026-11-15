// C80 596, exact-source-only receipt. Neither another SHA nor a matching version name is sufficient.
// This does not mount a viewer, bind sourceLinks, approve as-built, or publish any model.
export const C80596_DRIVE_ZIP_ID='1p74OzCIJRrtRhmsHSrYavH7lguZErys7';
export const C80596_ZIP_SHA256='756b6f8ee2206815dd5249640b963760dd0f414eca91761ae9fe1025ad1ceaeb';
export const C80596_GLB_SHA256='10515e412ea523dbe10ea6b551235e8aedb3eedb0ac2247e9f90923b35cb34c3';
export const C80596_GLB_BYTES=56704588;
export const C80596_GEOMETRY_EQUIVALENT_DIFFERENT_SHA='0d538978a33ab3066f703fb0c5fc787ad70680d89028ed992b70966eeaaecbc9';
export const C80596_PARENT_GLB_SHA256='ff044811bf0f6277c3268c90dd134d73d7ce286b3946a6bab85d94a627e61dd9';
export const C80596_K16K18_DONOR_GLB_SHA256='283f4447eb7ba9ac2135569d9cb8557530a83bd2df6c6a5ecbf5434bccc2c260';
export const C80596_SOURCE_LINKS_BOUND=false;
export const C80596_PUBLISH_ALLOWED=false;
const floors=['1F','2F','BOTH','BOTH','BOTH','BOTH'];
const counts=[293,191,477,477,477,477];
const parentFnv=['b9fa4dc2','922e7205','ab0f78e5','716a5adb','00330a53','630b1f2c'];
const targetFnv=['b1a93af0','922e7205','e18d79af','d5f94459','e3d2d665','ec7415aa'];
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export const C80596_SCENES=Object.freeze(Object.fromEntries(floors.map((floor,i)=>[590+i,
 Object.freeze({floor,parentScene:584+i,donorScene:536+i,rootCount:counts[i],rootFnv:targetFnv[i]})])));
export function c80596RootFnv32(ids) {
 if(!Array.isArray(ids))return null;
 let h=2166136261;
 for(const id of ids){if(!Number.isInteger(id)||id<0)return null;h=Math.imul(h^id,16777619)>>>0;}
 return h.toString(16).padStart(8,'0');
}
function goodNode(g,id,mesh,old,donor) {
 const n=g.nodes?.[id],e=n?.extras,p=g.meshes?.[mesh]?.primitives?.[0];
 return n?.mesh===mesh&&e?.sourceC80542Node===donor&&
   (id===12334?e?.sourceNodeIndex:e?.originalNodeIndex)===old&&e?.sourceLinksBound===false&&e?.asBuilt===false&&
   e?.current===false&&e?.donorC80542GLBSHA256===C80596_K16K18_DONOR_GLB_SHA256&&
   e?.baseC80590GLBSHA256===C80596_PARENT_GLB_SHA256&&
   e?.C80596Stage==='WORK_TEST_HOST_HOLD'&&p?.material===333&&
   (id===12334?(p?.indices===10433&&p?.attributes?.POSITION===9129):
     (p?.indices===6326&&p?.attributes?.POSITION===10431+(id-12332)&&p?.attributes?.NORMAL===6325));
}
export function isC80596ExactSourceScene(g,sha,index,floor=null) {
 const profile=C80596_SCENES[index],asset=g?.asset?.extras;
 if(sha!==C80596_GLB_SHA256||!profile||(floor!==null&&floor!==profile.floor)||
   g?.scene!==292||g.scenes?.length!==596||g.nodes?.length!==12335||
   g.meshes?.length!==4635||g.accessors?.length!==10434||
   g.bufferViews?.length!==10440||g.buffers?.[0]?.byteLength!==33606952||
   asset?.ModelStage!=='WORK_TEST'||asset?.Canonical!==false||
   asset?.asBuilt!==false||asset?.HUMAN_REVIEW!=='NOT_RUN'||
   !goodNode(g,12332,4632,9382,12255)||
   !goodNode(g,12333,4633,9384,12256)||
   !goodNode(g,12334,4634,11309,12257)||
   g.accessors?.[10431]?.count!==24||g.accessors?.[10432]?.count!==24||
   g.accessors?.[10433]?.count!==60||
   g.nodes?.[12330]?.translation?.[0]!==5.05||
   !same(g.nodes?.[12331]?.children,[6350,6355,12330])||
   !g.nodes?.[12329]?.children?.includes(12320)||
   !g.nodes?.[12329]?.children?.includes(12321)||
   ![12323,12324,12325,12326,12327,12328].every(n=>g.nodes[12329].children.includes(n)))
   return false;
 for(let i=0;i<6;i++) {
   const active=i!==1,p=g.scenes[584+i],s=g.scenes[590+i],px=p?.extras,sx=s?.extras,c=sx?.C80596K16K18Cofit;
   if(!p||!s||p.nodes?.length!==counts[i]||s.nodes?.length!==counts[i]||
     new Set(p.nodes).size!==counts[i]||new Set(s.nodes).size!==counts[i]||
     c80596RootFnv32(p.nodes)!==parentFnv[i]||
     c80596RootFnv32(s.nodes)!==targetFnv[i]||
     px?.stage!=='WORK_TEST_HOST_HOLD'||sx?.stage!=='WORK_TEST_HOST_HOLD'||
     sx.floor!==floors[i]||sx.sourceLinksBound!==false||
     sx.sourceLinksBoundNewSHA!==false||sx.current!==false||
     sx.asBuilt!==false||sx.HUMAN_REVIEW!=='NOT_RUN'||
     sx.productionWebGLVerified!==false||
     c?.parentSceneIndex!==584+i||c?.donorSceneIndex!==536+i||
     c?.sourceParentGLBSHA256!==C80596_PARENT_GLB_SHA256||
     c?.donorC80542GLBSHA256!==C80596_K16K18_DONOR_GLB_SHA256||
     c?.activeCorrection!==active||c?.sourceLinksBoundNewSHA!==false||
     c?.CURRENT!==false||c?.asBuilt!==false||
     c?.humanReview!=='NOT_RUN'||c?.productionWebGL!=='NOT_RUN'||
     !same(c.K16Replacements,active?[12332,12333]:[])||
     c.K18Replacement!==(active?12334:null)||
     c.K18PreservedHoleAndSlabTriangles!==(active?20:0)||
     c.K18RemovedWallTriangles!==(active?8:0))
     return false;
   const expected=active?p.nodes.map(n=>n===9382?12332:n===9384?12333:n===11309?12334:n):p.nodes;
   if(!same(s.nodes,expected)||[9382,9384,11309,11779].some(n=>s.nodes.includes(n)))return false;
   if(active) {
     if(![12332,12333,12334,12329,12331].every(n=>s.nodes.includes(n))||
       sx.K09ControlsRoot!==12329||sx.Themo3CopyRoot!==12331||
       sx.bathThemoXMetres!==5.05||sx.switchAndThemoSameVerticalX!==true||
       sx.K12Tile100Active!==true||c.K09FrameX!==5.05||c.bathThemoX!==5.05)return false;
   } else if([12332,12333,12334,12329,12331].some(n=>s.nodes.includes(n)))return false;
 }
 return true;
}
export function resolveC80596SourceScene(sha,parentScene,floor) {
 const candidate=parentScene+6,p=C80596_SCENES[candidate];
 return sha===C80596_GLB_SHA256&&p?.parentScene===parentScene&&p.floor===floor?candidate:null;
}
export function c80596SourceReceipt(g,sha,index) {
 return Object.freeze({exactSource:isC80596ExactSourceScene(g,sha,index),
  sourceLinksBound:false,publishAllowed:false,current:false,asBuilt:false,
  productionWebGLVerified:false,humanReview:'NOT_RUN',physicalHostVerified:false});
}
