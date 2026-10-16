/**
 * R1125 original-source-space orthographic oblique candidate only.
 * Never infer physical pipe geometry, live browser pixels or HUMAN_REVIEW.
 * A viewer must separately apply/validate the Babylon Y-up root transform,
 * camera, materials, occlusion and 27 original-source screenshot frames.
 */
import {parseOriginalR1125,inspectR1125Presentation} from './privateModelM5AR1125GeometryPresence.mjs';
const expected=['PVK','SOK1','SOK2','SOK3','PVK_SOK1','PVK_SOK3','SOK1_SOK2','SOK3_BUILDING_END','SOK2_BUILDING_END','PVK_DISCHARGE','PVK_PARKING','boundary:PVK_DISCHARGE','boundary:PVK_PARKING'];
const fail=(m)=>{throw new Error('R1125_SOURCE_CAMERA_ONLY: '+m);};
const requireTrue=(x,m)=>{if(!x)fail(m);};
const finite=(x)=>typeof x==='number'&&Number.isFinite(x);
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);

export function projectR1125SourceOnly(targets,{width=960,height=600,azimuthDegrees=0,elevationDegrees=15,padding=0.12}={}){
  requireTrue(Number.isInteger(width)&&Number.isInteger(height)&&width>=320&&width<=4096&&height>=240&&height<=4096&&width*height<=5000000,'viewport');
  requireTrue(azimuthDegrees===0&&elevationDegrees===15,'unverified camera angle override');
  requireTrue(finite(padding)&&padding>=.05&&padding<=.25,'source padding');
  requireTrue(Array.isArray(targets)&&targets.length===13,'13 source targets');
  const seen=new Set(),all=[];
  for(const t of targets){
    requireTrue(t&&expected.includes(t.key)&&!seen.has(t.key),'duplicate or unknown source identity');
    seen.add(t.key);
    requireTrue(Array.isArray(t.points)&&t.points.length>=2&&t.points.length<=50000,'source points');
    for(const p of t.points){
      requireTrue(Array.isArray(p)&&p.length===3&&p.every(finite),'nonfinite source vertex');
      all.push(p);
    }
  }
  requireTrue(seen.size===expected.length&&expected.every(x=>seen.has(x))&&all.length<=200000,'source roster or budget');
  const tilt=Math.PI/12,right=[0,1,0],up=[-Math.sin(tilt),0,Math.cos(tilt)],forward=[Math.cos(tilt),0,Math.sin(tilt)];
  const proj=all.map(p=>{const v=[dot(p,right),dot(p,up),dot(p,forward)];
    requireTrue(v.every(finite),'nonfinite projected vertex');return v;});
  // Bounded loops avoid V8's spread-argument limit for the allowed 200000 vertices.
  const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
  for(const p of proj)for(let i=0;i<3;i++){
    if(p[i]<lo[i])lo[i]=p[i];
    if(p[i]>hi[i])hi[i]=p[i];
  }
  // Finite vertices alone do not guarantee a finite projected envelope.
  // A nonfinite span silently collapses every normalized rectangle to 0.5.
  requireTrue(lo.every(finite)&&hi.every(finite),'nonfinite projected envelope');
  const dx=hi[0]-lo[0],dy=hi[1]-lo[1];
  requireTrue(finite(dx)&&finite(dy),'nonfinite projected span');
  const cx=lo[0]+dx/2,cy=lo[1]+dy/2;
  const span=Math.max(dx/(1-2*padding),dy/(1-2*padding)*width/height,1e-6);
  requireTrue(finite(cx)&&finite(cy)&&finite(span),'nonfinite camera fit');
  const rects=targets.map(t=>{
    const ps=t.points.map(p=>{
      const u=.5+(dot(p,right)-cx)/span,v=.5-(dot(p,up)-cy)*width/(span*height);
      requireTrue(finite(u)&&finite(v)&&u>0&&u<1&&v>0&&v<1,'source point outside candidate');
      return [u,v];
    });
    const rect={uMin:Infinity,uMax:-Infinity,vMin:Infinity,vMax:-Infinity};
    for(const [u,v] of ps){
      if(u<rect.uMin)rect.uMin=u;
      if(u>rect.uMax)rect.uMax=u;
      if(v<rect.vMin)rect.vMin=v;
      if(v>rect.vMax)rect.vMax=v;
    }
    // A point-like projected source cannot provide meaningful visibility evidence.
    // Keep this stricter than merely checking that every vertex lies in-frame.
    requireTrue(rect.uMax-rect.uMin+rect.vMax-rect.vMin>1e-12,'collapsed source projection: '+t.key);
    return {key:t.key,pointCount:ps.length,rect};
  });
  return {status:'SOURCE_SPACE_CAMERA_CANDIDATE_ONLY',sceneIndex:63,azimuthDegrees,elevationDegrees,width,height,padding,
    sourceSpaceOnly:true,babylonSceneRootRotationNotApplied:true,
    basis:{right,up,forward},targets:rects,sourcePointCount:all.length,
    originalRawDigestVerified:false,viewerCameraApplied:false,productionPixelProof:false,
    occlusionVerified:false,physicalXYVerified:false,physicalElevationsVerified:false,
    physicalPipeDiameterVerified:false,current:false,canonical:false,asBuilt:false,humanReview:'NOT_RUN'};
}
function getPoints(doc,bin,node){
  requireTrue(Number.isInteger(node.mesh)&&doc.meshes?.[node.mesh]?.primitives?.length===1,'original mesh');
  requireTrue(!('matrix' in node)&&!('rotation' in node)&&!('scale' in node),'source child transform');
  const p=doc.meshes[node.mesh].primitives[0],a=doc.accessors?.[p.attributes?.POSITION];
  requireTrue(a?.componentType===5126&&a.type==='VEC3'&&!a.sparse&&Number.isInteger(a.count)&&a.count>=2&&a.count<=50000,'source positions');
  const view=doc.bufferViews?.[a.bufferView];
  requireTrue(view&&(view.buffer??0)===0,'source bufferView');
  const stride=view.byteStride??12,base=view.byteOffset??0,start=base+(a.byteOffset??0);
  requireTrue(Number.isInteger(stride)&&stride>=12&&start>=base&&start+(a.count-1)*stride+12<=base+view.byteLength&&start+(a.count-1)*stride+12<=bin.length,'source buffer bounds');
  const move=node.translation??[0,0,0];
  requireTrue(Array.isArray(move)&&move.length===3&&move.every(finite),'source translation');
  return Array.from({length:a.count},(_,i)=>[0,1,2].map(j=>bin.readFloatLE(start+i*stride+j*4)+move[j]));
}
export function proposeAuthenticatedR1125SourceCamera(raw,options){
  const parsed=parseOriginalR1125(raw);
  const verified=inspectR1125Presentation(parsed); // all 13, geometry, no-promotion and PVK UNKNOWN
  requireTrue(verified.result==='PASS','original source semantic guard');
  const {doc,bin}=parsed,scene=doc.scenes[63];
  const found=scene.nodes.filter(i=>doc.nodes[i]?.name==='M5A_R1125_DIAMETER_SOURCE_SPLIT_WORK_TEST_ROOT_BABYLON_Y_UP');
  requireTrue(found.length===1,'unique R1125 review root');
  const root=doc.nodes[found[0]],q=root.rotation;
  requireTrue(Array.isArray(q)&&q.length===4&&q.every((x,i)=>finite(x)&&Math.abs(x-[-Math.SQRT1_2,0,0,Math.SQRT1_2][i])<1e-7),'Babylon Y-up root');
  const targets=root.children.map(i=>{
    const n=doc.nodes[i],e=n.extras??{};
    const key=e.representationKind==='unresolvedBoundaryMarker'?'boundary:'+e.boundaryRole:
      e.representationKind==='wellDiameterPresentationWork'?e.sourceNodeId:e.sourceConnection;
    return {key,points:getPoints(doc,bin,n)};
  });
  return {...projectR1125SourceOnly(targets,options),originalRawDigestVerified:true,
    originalByteCount:raw.length,sourceRootIndex:found[0]};
}
