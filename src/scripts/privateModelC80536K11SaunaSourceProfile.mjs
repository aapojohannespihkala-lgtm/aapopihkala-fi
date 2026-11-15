/**
 * K11 U-sauna wide-deck C80 536 immutable source receipt.
 * SHA must be computed independently from the complete authenticated GLB bytes.
 * Work-test source authentication grants neither viewer mounting nor publication.
 */
export const C80_K11_GLB_SHA256='030ccbb5f9f23ee837d9cd3ac4a2efc0df2f5189f5d42ae87c7cef5380694f6a';
export const C80_K11_GLB_BYTES=55711372;
export const C80_K11_ZIP_SHA256='72c2224fa721957a32fc307cf2e93ac41a602915ae4674ec30304c6d368fad93';
export const C80_K11_ZIP_DRIVE_ID='1HdCxGon2IiSQQUWQp0aT7fO3XWdobbIj';
export const C80_K11_PARENT_GLB_SHA256='1a99cc32c80e1b87bbefcf9e6f373af42aee7e72ede574eabafe375298fd9f9e';
export const C80_K11_OWNER_PDF_DRIVE_ID='1rVMhTd5jugp7WOQYvhzA1jdki-toYLGT';
const floors=['1F','2F','BOTH','BOTH','BOTH','BOTH'];
const oldHashes=['ef21913f','b6394bd0','6847aefb','9d3081c3','c0e4d46d','2b0e6572'];
const newHashes=['6c7a4229','b6394bd0','665bea21','6dede755','5d63444b','4e2a647c'];
const counts=[294,190,477,477,477,477];
export const C80_K11_SCENES=Object.freeze(Object.fromEntries(floors.map((floor,k)=>[
 530+k,Object.freeze({scene:530+k,parentScene:524+k,floor,
  rootCount:counts[k],parentRootFnv:oldHashes[k],rootFnv:newHashes[k],wideDeckActive:k!==1})
])));
export function c80K11Fnv32(a){
 if(!Array.isArray(a))return null;
 let v=2166136261;
 for(const n of a){if(!Number.isInteger(n)||n<0)return null;v=Math.imul(v^n,16777619)>>>0;}
 return v.toString(16).padStart(8,'0');
}
const same=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((v,i)=>v===b[i]);
function reach(nodes,rootIds){
 if(!Array.isArray(nodes)||!Array.isArray(rootIds))return null;
 const seen=new Set(),todo=[...rootIds];
 while(todo.length){
  const n=todo.pop();if(!Number.isInteger(n)||n<0||n>=nodes.length||!nodes[n])return null;
  if(seen.has(n))continue;seen.add(n);
  if(nodes[n].children!==undefined){
   if(!Array.isArray(nodes[n].children))return null;
   todo.push(...nodes[n].children);
  }
 }
 return seen;
}
export function isC80K11SaunaSourceScene(json,authenticatedGlbSha256,index,floor){
 const p=C80_K11_SCENES[index];
 if(!p||authenticatedGlbSha256!==C80_K11_GLB_SHA256||
  (floor!==undefined&&floor!==p.floor)||json?.scene!==292||
  json.asset?.extras?.ModelStage!=='WORK_TEST'||
  json.asset.extras.Canonical!==false||json.asset.extras.current!==false||
  json.asset.extras.asBuilt!==false||json.asset.extras.HUMAN_REVIEW!=='NOT_RUN'||
  json.scenes?.length!==536||json.nodes?.length!==12256||
  json.meshes?.length!==4622||json.materials?.length!==744||
  json.accessors?.length!==10410||json.bufferViews?.length!==10414)return false;
 const old=json.scenes[p.parentScene],s=json.scenes[index],e=s?.extras;
 if(old?.name!=="C80_530_V27_NO_TRENCH_FROM_SCENE_"+(p.parentScene-6)+"_WORK_TEST_HOST_HOLD"||
  s?.name!=="C80_536_K11_SAUNA_U_DECK_BROAD_FROM_SCENE_"+p.parentScene+"_WORK_TEST_HOST_HOLD"||
  old?.extras?.stage!=='WORK_TEST_HOST_HOLD'||old.extras.floor!==p.floor||
  old.extras.sourceLinksBindingVerified!==false||
  !Array.isArray(old.nodes)||!Array.isArray(s.nodes)||
  old.nodes.length!==p.rootCount||s.nodes.length!==p.rootCount||
  new Set(old.nodes).size!==p.rootCount||new Set(s.nodes).size!==p.rootCount||
  c80K11Fnv32(old.nodes)!==p.parentRootFnv||c80K11Fnv32(s.nodes)!==p.rootFnv||
  e?.sourceGLBSHA256!==C80_K11_PARENT_GLB_SHA256||e?.sourceScene!==p.parentScene||
  e?.newSourceDeckRoot!==(p.wideDeckActive?12255:null)||e?.boardWidthChanged!==p.wideDeckActive||
  e?.sourceNodeRemovedOnlyInNewOptin!==(p.wideDeckActive?11305:null)||
  e?.allOldSceneObjectsPreserved!==true||e?.WORK_TEST!==true||
  e?.sourceLinksBound!==false||e?.CURRENT!==false||e?.asBuilt!==false||
  e?.HUMAN_REVIEW!=='NOT_RUN')return false;
 const expected=old.nodes.map(n=>p.wideDeckActive&&n===11305?12255:n);
 if(!same(s.nodes,expected))return false;
 if(p.wideDeckActive&&old.nodes.filter(n=>n===11305).length!==1)return false;
 if(json.nodes[11305]?.mesh!==4195||json.nodes[11307]?.mesh!==4197||
  json.nodes[11308]?.mesh!==4198||json.nodes[11311]?.mesh!==4201)return false;
 const n=json.nodes[12255],x=n?.extras,m=json.meshes[4621],mX=m?.extras;
 if(n?.name!=='C80_536_K11_SAUNA_U_DECK_WIDE_SAME_AS_BENCH_96MM_FROM_V85_OWNER_POINT_WORK_TEST_HOST_HOLD'||
  n?.mesh!==4621||x?.sourceGLBSHA256!==C80_K11_PARENT_GLB_SHA256||
  x?.sourceScene524Root!==11305||x?.sourceMeshIndex!==4195||
  x?.boardWidthM!==0.096||x?.gapM!==0.005||
  x?.boardWidthType!=='PHOTO_DERIVED_FROM_EXISTING_90-99mm_BENCHES_NOT_FIELD_MEASURED'||
  x?.UNotchOriginalSourceNode!==11307||x?.heaterHoleDiameterM!==0.435||
  x?.sourceSupportGeometryReusedExact!==true||x?.sameMaterialAsSource!==true||
  x?.physicalInstallVerified!==false||x?.sourceLinksBound!==false||x?.WORK_TEST!==true||
  x?.CURRENT!==false||x?.asBuilt!==false||x?.HUMAN_REVIEW!=='NOT_RUN'||
  m?.primitives?.length!==1||m.primitives[0].attributes?.POSITION!==10408||
  m.primitives[0].indices!==10409||m.primitives[0].material!==585||
  mX?.sourceMeshIndex!==4195||mX?.sourceNodeIndex!==11305||
  mX?.sourceMaterialIndex!==585||mX?.boardCount!==16||
  mX?.nominalBoardWidthM!==0.096||mX?.gapWorkAssumptionM!==0.005||
  mX?.heaterHoleRadiusM!==0.2175||mX?.UNotchFromSourceNode!==11307||
  mX?.WORK_TEST!==true)return false;
 const active=reach(json.nodes,s.nodes);
 if(!active||active.has(11305)&&p.wideDeckActive||active.has(12255)!==p.wideDeckActive)return false;
 return true;
}
export function c80K11SaunaReceipt(json,sha,index,floor){
 return Object.freeze({exactSource:isC80K11SaunaSourceScene(json,sha,index,floor),
  sourceOnly:true,stage:'WORK_TEST_HOST_HOLD',photoDerivedBoardWidth:true,
  physicallyMeasured:false,sourceLinksBound:false,publishAllowed:false,
  productionWebGLVerified:false,humanReview:'NOT_RUN',current:false,asBuilt:false});
}
