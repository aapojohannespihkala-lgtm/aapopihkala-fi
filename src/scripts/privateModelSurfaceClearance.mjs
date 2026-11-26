/**
 * WORK_TEST: minimum geometric distance between two explicitly selected,
 * visible, triangulated source surfaces in YLIS-G1-LOCAL metres.
 *
 * +X east, +Y north, +Z up. Never pass raw glTF Y-up vertices.
 * This is not a surveyed, installed or as-built clearance. The caller must
 * validate source identity, clipping, occlusion and surface visibility.
 * No viewer controls or model geometry are modified here.
 */
const finite=p=>p && [p.xM,p.yM,p.sourceHeightYUpM].every(Number.isFinite);
const xyz=p=>[p.xM,p.yM,p.sourceHeightYUpM];
const point=v=>Object.freeze({xM:v[0],yM:v[1],sourceHeightYUpM:v[2]});
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const add=(a,b)=>a.map((v,i)=>v+b[i]);
const scale=(v,k)=>v.map(x=>x*k);
const dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const clamp=v=>Math.max(0,Math.min(1,v));
const norm2=v=>dot(v,v);
const edges=t=>[[t[0],t[1]],[t[1],t[2]],[t[2],t[0]]];
const validTri=t=>Array.isArray(t) && t.length===3 && t.every(finite) &&
  norm2(cross(sub(xyz(t[1]),xyz(t[0])),sub(xyz(t[2]),xyz(t[0]))))>1e-20;

// Ericson's closest point on a finite triangle, including its edges.
const nearestTriangle=(p,t)=>{
  const [a,b,c]=t,ab=sub(b,a),ac=sub(c,a),ap=sub(p,a);
  const d1=dot(ab,ap),d2=dot(ac,ap);
  if(d1<=0&&d2<=0) return a;
  const bp=sub(p,b),d3=dot(ab,bp),d4=dot(ac,bp);
  if(d3>=0&&d4<=d3) return b;
  const vc=d1*d4-d3*d2;
  if(vc<=0&&d1>=0&&d3<=0) return add(a,scale(ab,d1/(d1-d3)));
  const cp=sub(p,c),d5=dot(ab,cp),d6=dot(ac,cp);
  if(d6>=0&&d5<=d6) return c;
  const vb=d5*d2-d1*d6;
  if(vb<=0&&d2>=0&&d6<=0) return add(a,scale(ac,d2/(d2-d6)));
  const va=d3*d6-d5*d4;
  if(va<=0&&(d4-d3)>=0&&(d5-d6)>=0){
    const bc=sub(c,b),w=(d4-d3)/((d4-d3)+(d5-d6));
    return add(b,scale(bc,w));
  }
  const denom=va+vb+vc;
  if(!(denom>0)) return null;
  return add(a,add(scale(ab,vb/denom),scale(ac,vc/denom)));
};

// Finite segment -> finite triangle, including oblique intersections.
const intersectsTriangle=(p,q,t)=>{
  const dir=sub(q,p),e1=sub(t[1],t[0]),e2=sub(t[2],t[0]);
  const pvec=cross(dir,e2),det=dot(e1,pvec);
  if(Math.abs(det)<1e-12) return null;
  const inv=1/det,tvec=sub(p,t[0]),u=dot(tvec,pvec)*inv;
  if(u< -1e-10||u>1+1e-10) return null;
  const qvec=cross(tvec,e1),v=dot(dir,qvec)*inv;
  if(v< -1e-10||u+v>1+1e-10) return null;
  const along=dot(e2,qvec)*inv;
  if(along< -1e-10||along>1+1e-10) return null;
  return add(p,scale(dir,clamp(along)));
};

const nearestSegments=(p1,q1,p2,q2)=>{
  const d1=sub(q1,p1),d2=sub(q2,p2),r=sub(p1,p2);
  const a=norm2(d1),e=norm2(d2),b=dot(d1,d2),c=dot(d1,r),f=dot(d2,r);
  let s=0,t=0;
  if(a<=1e-20&&e<=1e-20) return [p1,p2];
  if(a<=1e-20) t=clamp(f/e);
  else if(e<=1e-20) s=clamp(-c/a);
  else{
    const denom=a*e-b*b;
    s=denom>1e-20 ? clamp((b*f-c*e)/denom) : 0;
    t=(b*s+f)/e;
    if(t<0){t=0;s=clamp(-c/a);}
    else if(t>1){t=1;s=clamp((b-c)/a);}
  }
  return [add(p1,scale(d1,s)),add(p2,scale(d2,t))];
};

/**
 * Input: {surfaceA:{sourceId,triangles}, surfaceB:{sourceId,triangles},
 *         acceptsTriangleA, acceptsTriangleB}
 * Both independent, real source/visibility checks are REQUIRED.
 * Every triangle must be finite and nondegenerate. Up to 64 triangles per
 * surface, and at most 4096 raw pairs, are allowed; excessive work fails closed.
 * Hidden triangles are excluded, never used as invisible snap endpoints.
 */
export const closestClearanceBetweenSelectedSurfaces=({
  surfaceA,surfaceB,acceptsTriangleA,acceptsTriangleB,maxPairs=4096,
}={})=>{
  if(!surfaceA || !surfaceB || !Array.isArray(surfaceA.triangles) ||
     !Array.isArray(surfaceB.triangles) ||
     typeof surfaceA.sourceId!=='string' || !surfaceA.sourceId.trim() ||
     typeof surfaceB.sourceId!=='string' || !surfaceB.sourceId.trim() ||
     surfaceA.sourceId===surfaceB.sourceId ||
     typeof acceptsTriangleA!=='function'||typeof acceptsTriangleB!=='function' ||
     !Number.isInteger(maxPairs)||maxPairs<1||maxPairs>4096 ||
     !surfaceA.triangles.length||!surfaceB.triangles.length ||
     surfaceA.triangles.length>64||surfaceB.triangles.length>64||
     surfaceA.triangles.length*surfaceB.triangles.length>maxPairs ||
     !surfaceA.triangles.every(validTri)||!surfaceB.triangles.every(validTri)) return null;
  let visibleA,visibleB;
  try{
    visibleA=surfaceA.triangles.flatMap((t,i)=>acceptsTriangleA(t,i,surfaceA.sourceId)===true ? [{t,i}] : []);
    visibleB=surfaceB.triangles.flatMap((t,i)=>acceptsTriangleB(t,i,surfaceB.sourceId)===true ? [{t,i}] : []);
  }catch{return null;}
  if(!visibleA.length||!visibleB.length) return null;
  let best=null;
  const consider=(p,q,i,j)=>{
    if(!p||!q)return;
    const d2=norm2(sub(q,p));
    if(!Number.isFinite(d2))return;
    if(!best||d2<best.d2)best={p,q,d2,i,j};
  };
  for(const a of visibleA)for(const b of visibleB){
    const t1=a.t.map(xyz),t2=b.t.map(xyz);
    for(const [p,q] of edges(t1)){
      const crossing=intersectsTriangle(p,q,t2);
      if(crossing)consider(crossing,crossing,a.i,b.i);
    }
    for(const [p,q] of edges(t2)){
      const crossing=intersectsTriangle(p,q,t1);
      if(crossing)consider(crossing,crossing,a.i,b.i);
    }
    if(best?.d2===0)break;
    for(const p of t1)consider(p,nearestTriangle(p,t2),a.i,b.i);
    for(const p of t2)consider(nearestTriangle(p,t1),p,a.i,b.i);
    for(const [a0,a1] of edges(t1))for(const [b0,b1] of edges(t2)){
      const [p,q]=nearestSegments(a0,a1,b0,b1);
      consider(p,q,a.i,b.i);
    }
  }
  if(!best)return null;
  const delta=sub(best.q,best.p),distanceM=Math.sqrt(best.d2);
  return Object.freeze({
    sourceAId:surfaceA.sourceId,sourceBId:surfaceB.sourceId,
    triangleAIndex:best.i,triangleBIndex:best.j,
    from:point(best.p),to:point(best.q),distanceM,
    deltaXM:delta[0],deltaYM:delta[1],deltaZM:delta[2],
    directionG1:distanceM>0 ? point(scale(delta,1/distanceM)) : null,
    workTestOnly:true,visibleTrianglesOnly:true,
    surveyedClearanceVerified:false,asBuilt:false,
  });
};
