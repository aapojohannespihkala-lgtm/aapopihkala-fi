/**
 * C80 537: four owner-identified Vieser floor drains, schematic water seals.
 * Historical 2015 LK-75 / KK-32 are NOT evidence of 2026 installed trap SKUs.
 * Metadata-only receiver, never sourceLinks/current/as-built/publish permission.
 */
import {c80530Fnv32} from './privateModelC80530V27SourceProfile.mjs';
export const C80_537_VIESER4_GLB_SHA256='97d0b52a831185896ef63e897e358e85df7054fd2bb0b5156ab2a4b34ec1516b';
export const C80_537_VIESER4_GLB_BYTES=55712088;
export const C80_537_VIESER4_ZIP_SHA256='4278e9729970d1bbbf1af938860c6184b11e129b3d6442fd178d5dab62ae5cd9';
export const C80_537_VIESER4_ZIP_DRIVE_ID='1-hgR5kLcR0tm_nEiN69yhxouaYAarKNF';
export const C80_537_VIESER4_PARENT_SHA256='1a99cc32c80e1b87bbefcf9e6f373af42aee7e72ede574eabafe375298fd9f9e';
export const C80_537_VIESER4_PARENT_ZIP='1p0TAFQ5d2shItVg9JuvMls-hz21ScN6s';
const specs=[
  [530,524,'1F',295,'361f4e8c','ef21913f',[12283]],
  [531,525,'2F',191,'0858b144','b6394bd0',[12284]],
  [532,526,'BOTH',479,'d71000b4','6847aefb',[12283,12284]],
  [533,527,'BOTH',479,'04b2e4bc','9d3081c3',[12283,12284]],
  [534,528,'BOTH',479,'351ee37a','c0e4d46d',[12283,12284]],
  [535,529,'BOTH',479,'0fad96f5','2b0e6572',[12283,12284]],
];
export const C80_537_VIESER4_SCENES=Object.freeze(Object.fromEntries(specs.map(
  ([scene,parent,floor,rootCount,rootHash,parentHash,addedRoots])=>
    [scene,Object.freeze({scene,parent,floor,rootCount,rootHash,parentHash,addedRoots:Object.freeze(addedRoots)})]
)));
const drains=[
 [12261,'D1F_PESUHUONE_SUIHKU1','1F suihku 1',[5.7755,0.0845,-2.4705],[1795,1796,10504,11610]],
 [12268,'D1F_PESUHUONE_SUIHKU2','1F suihku 2',[5.8155,0.0845,-3.3635],[1797,1798,10506,11611]],
 [12275,'D1F_SAUNA','1F sauna',[5.46,0.089,-1.463],[6620,10508]],
 [12282,'D2F_WC','2F WC',[5.72,2.844,-5.997],[11643,11644,11645]],
];
const childrenFor=id=>Array.from({length:6},(_,i)=>id-6+i);
const eq=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((v,i)=>v===b[i]);
const approx=(a,b)=>typeof a==='number'&&Number.isFinite(a)&&Math.abs(a-b)<1e-6;
const vec=(a,b)=>Array.isArray(a)&&a.length===b.length&&a.every((v,i)=>approx(v,b[i]));
export function isC80537Vieser4WaterSealEvidence(json){
 const nodes=json?.nodes;
 if(!Array.isArray(nodes))return false;
 const one=nodes[12283],two=nodes[12284];
 if(one?.name!=='DRAIN4_D1F_THREE_VIESER_TRAP_INSERTS_OPTIONAL_WORK_TEST'||
    !eq(one.children,[12261,12268,12275])||one.extras?.noSourceNodeModified!==true||
    two?.name!=='DRAIN4_D2F_ONE_VIESER_TRAP_INSERT_OPTIONAL_WORK_TEST'||
    !eq(two.children,[12282])||two.extras?.noSourceNodeModified!==true)return false;
 for(const [id,key,,position,hosts] of drains){
   const n=nodes[id],e=n?.extras;
   if(n?.name!==`DRAIN4_${key}_VIESER_WATERSEAL_GENERIC_OWNER_BRAND_CONFIRMED_WORK_TEST`||
      !eq(n.children,childrenFor(id))||!vec(n.translation,position)||
      e?.status!=='WORK_TEST_HOST_HOLD_NOT_CURRENT'||e?.m5System!=='VESI'||
      e?.ownerConfirmed!=='four Vieser drain locations 2026-11-15'||
      e?.ownerConfirmedFact!=='Vieser manufacturer and four visible drain locations, not internal SKU or water seal shape'||
      e?.schema!=='GENERIC_CONCEPTUAL_WATER_LOCK_INSERT_NOT_MANUFACTURER_EXACT'||
      e?.physicalTrapVerified!==false||e?.physicalXYZSurveyed!==false||
      e?.verifiedPipeConnections!==0||e?.current!==false||e?.asBuilt!==false||
      e?.hostHold!==true||e?.noNewPipeRoute!==true||e?.noCutFloor!==true||
      e?.noOverwriteOfExistingCovers!==true||
      !eq(e?.sourceExactHostNodeRefs,hosts)||
      e?.sourceModelGLBSHA256!==C80_537_VIESER4_PARENT_SHA256||
      e?.sourceModelZIPDriveID!==C80_537_VIESER4_PARENT_ZIP||
      !approx(e?.assemblyHeightM_WORK_ASSUMPTION,0.14)||
      !approx(e?.assemblyOuterDiameterM_WORK_ASSUMPTION,0.076))return false;
   for(let i=0;i<6;i++){
     const leaf=nodes[id-6+i],x=leaf?.extras;
     if(leaf?.mesh!==4621+i||
        leaf?.name!==`DRAIN4_${key}_${i+1}_SCHEMATIC_NOT_VERIFIED`||
        x?.stage!=='WORK_TEST'||x?.manufacturerOwnerConfirmed!=='Vieser'||
        x?.isPhysicalSKUVerified!==false||
        x?.isPhysicalWaterSealMechanismVerified!==false||
        x?.asBuilt!==false||x?.m5System!=='VESI')return false;
   }
 }
 return true;
}
export function isC80537Vieser4SourceScene(json,sha,sceneIndex,floor){
 const spec=C80_537_VIESER4_SCENES[sceneIndex];
 if(sha!==C80_537_VIESER4_GLB_SHA256||!spec||
    (floor!==undefined&&floor!==spec.floor)||
    json?.asset?.extras?.ModelStage!=='WORK_TEST'||
    json.asset.extras.current!==false||json.asset.extras.asBuilt!==false||
    json.asset.extras.HUMAN_REVIEW!=='NOT_RUN'||json.scene!==292||
    json.scenes?.length!==537||json.nodes?.length!==12285||
    json.meshes?.length!==4627||json.materials?.length!==749||
    json.accessors?.length!==10426||json.bufferViews?.length!==10430)return false;
 const scene=json.scenes[sceneIndex],parent=json.scenes[spec.parent];
 const roots=scene?.nodes,prior=parent?.nodes,e=scene?.extras;
 if(scene?.name!==`C80_530_OWNER_DRAIN4_VIESER_WATERSEAL_OPTIN_FROM_SCENE_${spec.parent}_WORK_TEST_HOST_HOLD`||
    roots?.length!==spec.rootCount||prior?.length!==spec.rootCount-spec.addedRoots.length||
    c80530Fnv32(roots)!==spec.rootHash||c80530Fnv32(prior)!==spec.parentHash||
    !eq(roots,[...prior,...spec.addedRoots])||
    new Set(roots).size!==roots.length||
    e?.sourceScene!==spec.parent||e?.sourceGLBSHA256!==C80_537_VIESER4_PARENT_SHA256||
    e?.sourceZIPDriveID!==C80_537_VIESER4_PARENT_ZIP||
    e?.ownerConfirmedLocations!==4||e?.physicalTrapShapeVerified!==false||
    e?.stage!=='WORK_TEST_HOST_HOLD'||!isC80537Vieser4WaterSealEvidence(json))return false;
 return true;
}
function reachable(json,sceneIndex){
 const ns=json?.nodes,roots=json?.scenes?.[sceneIndex]?.nodes;
 if(!Array.isArray(ns)||!Array.isArray(roots))return null;
 const seen=new Set(),stack=[...roots];
 while(stack.length){
   const id=stack.pop();
   if(!Number.isInteger(id)||id<0||id>=ns.length||!ns[id])return null;
   if(seen.has(id))continue;
   seen.add(id);
   const ch=ns[id].children;
   if(ch!==undefined&&!Array.isArray(ch))return null;
   if(ch)stack.push(...ch);
 }
 return seen;
}
/** Must be invoked behind exact loaded-GLB SHA and source scene/member gates. */
export function c80537Vieser4NodeLabel(id){
 const found=drains.find(([node])=>node===id);
 return found?.[2]??null;
}
const genericRows=Object.freeze([
 ['Vesilukon esitystapa','Havainnollistava WORK_TEST, ei valmistajan tarkka malli'],
 ['Valmistaja / sijainnit','Vieser, neljä sijaintia omistajan vahvistamia'],
 ['Sisäosan SKU / todellinen rakenne','NOT_VERIFIED'],
 ['Fyysiset liitokset / toteuma','NOT_VERIFIED, ei CURRENT/as-built'],
]);
/** Never creates sourceLinks; prevents same-name donors and cross-scene leaks. */
export function createC80537Vieser4SelectionEvidenceResolver(gltf,loadedSha){
 const json=gltf?.parser?.json,associations=gltf?.parser?.associations;
 if(loadedSha!==C80_537_VIESER4_GLB_SHA256||
    !Array.isArray(gltf?.scenes)||gltf.scenes.length!==537||
    typeof associations?.get!=='function')return()=>[];
 return (selectedObject,mountedScene)=>{
   const sceneIndex=gltf.scenes.indexOf(mountedScene);
   const spec=C80_537_VIESER4_SCENES[sceneIndex];
   if(!spec||!isC80537Vieser4SourceScene(json,loadedSha,sceneIndex,spec.floor))return [];
   const seen=reachable(json,sceneIndex);
   if(!seen)return [];
   const chain=[];let node=selectedObject;
   for(let depth=0;node&&node!==mountedScene&&depth<128;depth++,node=node.parent)
     chain.push(node);
   if(node!==mountedScene)return [];
   for(const current of chain){
     const id=associations.get(current)?.nodes;
     if(!Number.isInteger(id)||!seen.has(id))continue;
     const label=c80537Vieser4NodeLabel(id);
     if(label)return [['Vesilukon sijainti',label],...genericRows];
   }
   return [];
 };
}
