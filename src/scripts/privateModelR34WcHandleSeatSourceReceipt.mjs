/** Exact R34 WC handle-seat source receipt. Caller independently hashes the authenticated GLB bytes and parses the same bytes. No viewer mount, registry, publishing or sourceLinks promotion. */
export const SOURCE=Object.freeze({
  "glbSha256": "052950bed2adb3e9eff8e4d7d4b078e55360318d54dfd0dc1f6cd85a3f7b5494",
  "glbBytes": 65281468,
  "zipDriveId": "1Bo_ybaDHxHf8if0LSGy5dcZQ-l5JUC3h",
  "zipSha256": "61ef4c1e5846bb8dda8e882da53cfb4825bf7ded504d448bfbf560876eb7813e",
  "parentGlbSha256": "ff4724e8a844769c616447a825c001e59330e8d53e050bbbee1a2b14081d17dc",
  "originalGlbSha256": "99210ea517c18cf24fa5f9702abe12ed2a8058a0c606d38b863e19802a270725",
  "counts": Object.freeze({
    "scenes": 838,
    "nodes": 13864,
    "meshes": 5242,
    "materials": 826,
    "accessors": 11449,
    "bufferViews": 11455
  }),
  "defaultScene": 292
});
const fingerprints=["673ba191","f9009603","abdbe8d4","241f1e49","adb5d44d","737144ef","d17ef700","d8b4a76d","24fe22f1","25141da3","90bb75d4","cf03c349","0e4d7a99","40e659eb","f221e1b0","4303bffd"];
const viewNames=[
  "Ylisrinne_R34_FACADES_PARTYWALL_FRIEZE_BOTH_NORMAL_PLEXI_ON_WORK_TEST_HOST_HOLD__scene822",
  "Ylisrinne_R34_FACADES_PARTYWALL_FRIEZE_BOTH_SERVICE_PLEXI_OFF_WORK_TEST_HOST_HOLD__scene823",
  "Ylisrinne_R34_FACADES_PARTYWALL_FRIEZE_2F_NORMAL_PLEXI_ON_WORK_TEST_HOST_HOLD__scene824",
  "Ylisrinne_R34_FACADES_PARTYWALL_FRIEZE_2F_SERVICE_PLEXI_OFF_WORK_TEST_HOST_HOLD__scene825",
  "Ylisrinne_R34_FACADES_PARTYWALL_FRIEZE_BOTH_NORMAL_PLEXI_ON_WORK_TEST_HOST_HOLD__WC_CLOSED_WORK_TEST_HOST_HOLD__scene826",
  "Ylisrinne_R34_FACADES_PARTYWALL_FRIEZE_BOTH_SERVICE_PLEXI_OFF_WORK_TEST_HOST_HOLD__WC_CLOSED_WORK_TEST_HOST_HOLD__scene827",
  "Ylisrinne_R34_FACADES_PARTYWALL_FRIEZE_2F_NORMAL_PLEXI_ON_WORK_TEST_HOST_HOLD__WC_CLOSED_WORK_TEST_HOST_HOLD__scene828",
  "Ylisrinne_R34_FACADES_PARTYWALL_FRIEZE_2F_SERVICE_PLEXI_OFF_WORK_TEST_HOST_HOLD__WC_CLOSED_WORK_TEST_HOST_HOLD__scene829",
  "Ylisrinne_R34_FACADES_PARTYWALL_FRIEZE_BOTH_NORMAL_PLEXI_ON_WORK_TEST_HOST_HOLD__ROSE_SEAT_WORK_TEST__scene830",
  "Ylisrinne_R34_FACADES_PARTYWALL_FRIEZE_BOTH_SERVICE_PLEXI_OFF_WORK_TEST_HOST_HOLD__ROSE_SEAT_WORK_TEST__scene831",
  "Ylisrinne_R34_FACADES_PARTYWALL_FRIEZE_2F_NORMAL_PLEXI_ON_WORK_TEST_HOST_HOLD__ROSE_SEAT_WORK_TEST__scene832",
  "Ylisrinne_R34_FACADES_PARTYWALL_FRIEZE_2F_SERVICE_PLEXI_OFF_WORK_TEST_HOST_HOLD__ROSE_SEAT_WORK_TEST__scene833",
  "Ylisrinne_R34_FACADES_PARTYWALL_FRIEZE_BOTH_NORMAL_PLEXI_ON_WORK_TEST_HOST_HOLD__WC_CLOSED_WORK_TEST_HOST_HOLD__ROSE_SEAT_WORK_TEST__scene834",
  "Ylisrinne_R34_FACADES_PARTYWALL_FRIEZE_BOTH_SERVICE_PLEXI_OFF_WORK_TEST_HOST_HOLD__WC_CLOSED_WORK_TEST_HOST_HOLD__ROSE_SEAT_WORK_TEST__scene835",
  "Ylisrinne_R34_FACADES_PARTYWALL_FRIEZE_2F_NORMAL_PLEXI_ON_WORK_TEST_HOST_HOLD__WC_CLOSED_WORK_TEST_HOST_HOLD__ROSE_SEAT_WORK_TEST__scene836",
  "Ylisrinne_R34_FACADES_PARTYWALL_FRIEZE_2F_SERVICE_PLEXI_OFF_WORK_TEST_HOST_HOLD__WC_CLOSED_WORK_TEST_HOST_HOLD__ROSE_SEAT_WORK_TEST__scene837"
];
export const VIEWS=Object.freeze([
  {
    "sceneIndex": 830,
    "parentSceneIndex": 822,
    "floor": "BOTH",
    "mode": "normal",
    "doorState": "OPEN"
  },
  {
    "sceneIndex": 831,
    "parentSceneIndex": 823,
    "floor": "BOTH",
    "mode": "service",
    "doorState": "OPEN"
  },
  {
    "sceneIndex": 832,
    "parentSceneIndex": 824,
    "floor": "2F",
    "mode": "normal",
    "doorState": "OPEN"
  },
  {
    "sceneIndex": 833,
    "parentSceneIndex": 825,
    "floor": "2F",
    "mode": "service",
    "doorState": "OPEN"
  },
  {
    "sceneIndex": 834,
    "parentSceneIndex": 826,
    "floor": "BOTH",
    "mode": "normal",
    "doorState": "CLOSED"
  },
  {
    "sceneIndex": 835,
    "parentSceneIndex": 827,
    "floor": "BOTH",
    "mode": "service",
    "doorState": "CLOSED"
  },
  {
    "sceneIndex": 836,
    "parentSceneIndex": 828,
    "floor": "2F",
    "mode": "normal",
    "doorState": "CLOSED"
  },
  {
    "sceneIndex": 837,
    "parentSceneIndex": 829,
    "floor": "2F",
    "mode": "service",
    "doorState": "CLOSED"
  }
].map(Object.freeze));
function same(a,b){return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((v,i)=>v===b[i]);}
function fingerprint(a){if(!Array.isArray(a)||a.some(v=>!Number.isInteger(v)||v<0))return null;let h=2166136261;for(const v of a)h=Math.imul(h^v,16777619)>>>0;return h.toString(16).padStart(8,"0");}
function replace(roots,mapping){return roots.map(v=>mapping[v]??v);}
// Both source and COW handle transforms must be dense, finite affine matrices.
function validHandleMatrix(node){
 const m=node?.matrix;
 if(!Array.isArray(m)||m.length!==16||["translation","rotation","scale"].some(k=>Object.hasOwn(node,k)))return false;
 for(let i=0;i<16;i++)if(!Object.hasOwn(m,i)||!Number.isFinite(m[i]))return false;
 if(m[3]!==0||m[7]!==0||m[11]!==0||m[15]!==1)return false;
 const det=m[0]*(m[5]*m[10]-m[9]*m[6])-m[4]*(m[1]*m[10]-m[9]*m[2])+m[8]*(m[1]*m[6]-m[5]*m[2]);
 return Number.isFinite(det)&&det!==0;
}
function stage(e){return e?.stage==="WORK_TEST"&&e?.current===false&&e?.asBuilt===false&&e?.HUMAN_REVIEW==="NOT_RUN";}
export function wcHandleSeatReceipt(json, authenticatedSha, request){
 const view=VIEWS.find(v=>v.sceneIndex===request?.sceneIndex);
 if(request?.explicitPreview!==true||!view||request.floor!==view.floor||request.mode!==view.mode||request.doorState!==view.doorState||authenticatedSha!==SOURCE.glbSha256||json?.scene!==SOURCE.defaultScene)return null;
 const e=json?.asset?.extras;
 if(e?.ModelStage!=="WORK_TEST"||e?.current!==false||e?.asBuilt!==false||e?.HUMAN_REVIEW!=="NOT_RUN"||e?.canonical!==false||e?.Canonical!==false)return null;
 if(!Object.entries(SOURCE.counts).every(([k,n])=>Array.isArray(json[k])&&json[k].length===n))return null;
 for(let i=0;i<16;i++){
  const s=json.scenes[822+i],roots=s?.nodes;
  if(s?.name!==viewNames[i]||!stage(s?.extras)||fingerprint(roots)!==fingerprints[i]||roots.length!==[505,504,207,206][i%4]||new Set(roots).size!==roots.length)return null;
  if(i>=4&&i<8&&!same(roots,replace(json.scenes[818+i].nodes,{13843:13859,13844:13855,13845:13856})))return null;
  if(i>=8){
   const old=json.scenes[814+i].nodes,map=i<12?{13844:13860,13845:13861}:{13855:13862,13856:13863};
   if(!same(roots,replace(old,map))||s.extras.handleSeatSourceScene!==814+i||s.extras.handleSeatSourceGLBSHA256!==SOURCE.parentGlbSha256)return null;
  }
 }
 const n=json.nodes;
 for(const [root,mid,group,leaf] of [[13843,13842,13841,13840],[13859,13858,13857,13854]]){
  if(!same(n[root]?.children,[mid])||!same(n[mid]?.children,[group,10835,12641,10874,10891,12394])||!same(n[group]?.children,[12491,8030,leaf,12210,12211,12212,12213,12214,12215,12216,12217,12218])||n[leaf]?.mesh!==2463)return null;
 }
 for(const [id,old,mesh] of [[13860,13844,3241],[13861,13845,3242],[13862,13855,3241],[13863,13856,3242]]){
  const h=n[id],p=n[old],x=h?.extras;
  if(h?.mesh!==mesh||p?.mesh!==mesh||x?.handleSeatCowOf!==old||x?.handleSeatSourceGLBSHA256!==SOURCE.parentGlbSha256||x?.handleSeatPhysicalClaim!==false||x?.current!==false||x?.asBuilt!==false||!validHandleMatrix(h)||!validHandleMatrix(p))return null;
  const axis=id<13862?14:12, sign=id===13860||id===13863?1:-1;
  if(!h.matrix.every((v,i)=>Number.isFinite(v)&&Number.isFinite(p.matrix[i])&&(i===axis?Math.abs((v-p.matrix[i])-sign*0.001500129699707)<1e-10:v===p.matrix[i])))return null;
 }
 return Object.freeze({...view,sourceSha256:SOURCE.glbSha256,status:"WORK_TEST_HOST_HOLD",physicalHostVerified:false,sourceLinksBound:false,productionWebGLVerified:false,publishAllowed:false});
}
