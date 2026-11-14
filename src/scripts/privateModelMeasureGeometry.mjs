/**
 * Geometry-based WORK_TEST measurement primitives for the Ylisrinne viewer.
 * Coordinates are YLIS-G1-LOCAL metres: +X east, +Y north, +Z up.
 * No source evidence, surveyed accuracy or as-built status is implied.
 * A viewer caller must first validate the frontmost visible source-mesh hit.
 */
const valid = (p) => !!p && [p.xM, p.yM, p.sourceHeightYUpM].every(Number.isFinite);
const coords = (p) => [p.xM, p.yM, p.sourceHeightYUpM];
const point = (v) => ({xM:v[0], yM:v[1], sourceHeightYUpM:v[2]});
const subtract = (a,b) => a.map((v,i)=>v-b[i]);
const dot = (a,b) => a.reduce((s,v,i)=>s+v*b[i],0);
const norm = (a) => Math.hypot(...a);
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const weldKey = (v) => v.map(n=>Math.round(n*1e5)).join(':');

/** Project the B point onto a G1 coordinate axis from A, or onto the XY plane.
 * Returns null rather than fabricating coordinates for invalid or unrecognised modes.
 */
export const measureAlongG1Axis = (a,b,mode='free') => {
  if (!valid(a) || !valid(b) || !['free','x','y','z','xy'].includes(mode)) return null;
  const av=coords(a), bv=coords(b);
  const projected = mode==='free' ? bv
    : mode==='xy' ? [bv[0],bv[1],av[2]]
    : av.map((v,i)=>mode==='xyz'[i] ? bv[i] : v);
  const delta=subtract(projected,av);
  return Object.freeze({
    mode,from:point(av),to:point(projected),signedXM:delta[0],
    signedYM:delta[1],signedZM:delta[2],distanceM:norm(delta),
    workTestOnly:true,
  });
};

/** Extract boundary and crease edges from a triangle mesh, omitting flat
 * triangulation diagonals. Works with indexed and non-indexed BufferGeometry
 * inputs. The mandatory toG1 transform must include the mesh world matrix
 * and Y-up -> G1 conversion; no local-space coordinates are assumed.
 * Non-manifold edges and overly large inputs fail closed.
 */
export const extractMeasureFeatureEdges = ({
  positions,indices=null,toG1,creaseDegrees=25,
  maxTriangles=30000,maxSegments=30000,
}) => {
  if (!positions || typeof toG1!=='function' || positions.length%3!==0 ||
      !Number.isFinite(creaseDegrees) || creaseDegrees<0 || creaseDegrees>180 ||
      !Number.isInteger(maxTriangles) || maxTriangles<1 ||
      !Number.isInteger(maxSegments) || maxSegments<1) return [];
  if (indices && indices.length%3!==0) return [];
  const triangleCount=indices ? indices.length/3 : positions.length/9;
  if (!Number.isInteger(triangleCount) || triangleCount>maxTriangles) return [];
  const edges=new Map(), vertices=new Map();
  const getVertex=(index)=>{
    if (!Number.isInteger(index) || index<0 || index*3+2>=positions.length) return null;
    if (vertices.has(index)) return vertices.get(index);
    const p=toG1(positions[index*3],positions[index*3+1],positions[index*3+2]);
    const v=valid(p) ? coords(p) : null;
    vertices.set(index,v);
    return v;
  };
  for(let f=0;f<triangleCount;f++){
    const ids=[0,1,2].map(j=>indices ? indices[f*3+j] : f*3+j);
    const v=ids.map(getVertex);
    if(v.some(x=>!x)) return [];
    const n=cross(subtract(v[1],v[0]),subtract(v[2],v[0]));
    const nlen=norm(n);
    if(nlen<1e-12) continue;
    const unit=n.map(x=>x/nlen);
    for(let k=0;k<3;k++){
      const a=v[k],b=v[(k+1)%3];
      const ka=weldKey(a),kb=weldKey(b);
      if(ka===kb) continue;
      const key=ka<kb?ka+'|'+kb:kb+'|'+ka;
      const entry=edges.get(key);
      if(entry){entry.normals.push(unit);}
      else edges.set(key,{a:point(a),b:point(b),normals:[unit]});
    }
  }
  const threshold=Math.cos(creaseDegrees*Math.PI/180);
  const result=[];
  for(const item of edges.values()){
    const normals=item.normals;
    if(normals.length===1 || (normals.length===2 && dot(normals[0],normals[1])<threshold)){
      result.push({a:item.a,b:item.b});
      if(result.length>maxSegments) return [];
    }
  }
  return result;
};

/** Pick an actual corner (two noncollinear feature edges) before an edge.
 * Projector yields {x,y,visible}; caller supplies a visibility/occlusion test.
 * Snapping is forbidden without a validated surface-hit point and checker.
 */
export const chooseMeasureFeatureSnap = ({
  pointerPx,hitPointG1,segments,projectToScreen,isCandidateVisible,
  tolerancePx=12,maxWorldGapM=0.4,
}) => {
  if(!pointerPx || ![pointerPx.x,pointerPx.y].every(Number.isFinite) ||
     !valid(hitPointG1) || !Array.isArray(segments) ||
     typeof projectToScreen!=='function' || typeof isCandidateVisible!=='function' ||
     !Number.isFinite(tolerancePx) || tolerancePx<=0 ||
     !Number.isFinite(maxWorldGapM) || maxWorldGapM<=0 ||
     segments.length>30000) return null;
  const base=coords(hitPointG1);
  const projected=new Map(),junctions=new Map();
  const getPixel=(p)=>{
    const k=weldKey(coords(p));
    if(!projected.has(k)) projected.set(k,projectToScreen(p));
    const q=projected.get(k);
    return q && q.visible===true && Number.isFinite(q.x) && Number.isFinite(q.y) ? q : null;
  };
  const clean=segments.filter(s=>s && valid(s.a) && valid(s.b) &&
    norm(subtract(coords(s.b),coords(s.a)))>1e-8);
  for(const s of clean){
    const a=coords(s.a),b=coords(s.b);
    for(const [p,other] of [[a,b],[b,a]]){
      const k=weldKey(p);
      if(!junctions.has(k)) junctions.set(k,{pos:point(p),dirs:[]});
      const d=subtract(other,p), n=norm(d);
      junctions.get(k).dirs.push(d.map(x=>x/n));
    }
  }
  let bestCorner=null,bestEdge=null;
  const withinWorld=(p)=>norm(subtract(coords(p),base))<=maxWorldGapM;
  const consider=(kind,p,pix,distancePx)=>{
    if(distancePx>tolerancePx || !withinWorld(p) ||
       isCandidateVisible(p,kind)!==true) return;
    const candidate={kind,pointG1:p,distancePx,workTestOnly:true};
    if(kind==='corner'){
      if(!bestCorner || distancePx<bestCorner.distancePx) bestCorner=candidate;
    }else if(!bestEdge || distancePx<bestEdge.distancePx) bestEdge=candidate;
  };
  for(const v of junctions.values()){
    if(v.dirs.length<2) continue;
    let corner=false;
    for(let i=0;i<v.dirs.length && !corner;i++)
      for(let j=i+1;j<v.dirs.length;j++)
        if(Math.abs(dot(v.dirs[i],v.dirs[j]))<Math.cos(20*Math.PI/180)) {corner=true;break;}
    if(!corner) continue;
    const pix=getPixel(v.pos);
    if(pix) consider('corner',v.pos,pix,Math.hypot(pointerPx.x-pix.x,pointerPx.y-pix.y));
  }
  for(const s of clean){
    const a=getPixel(s.a),b=getPixel(s.b);
    if(!a || !b) continue;
    const dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy;
    if(den<1e-10) continue;
    const t=Math.max(0,Math.min(1,((pointerPx.x-a.x)*dx+(pointerPx.y-a.y)*dy)/den));
    const nearest={x:a.x+t*dx,y:a.y+t*dy};
    const av=coords(s.a),bv=coords(s.b);
    const p=point(av.map((v,i)=>v+t*(bv[i]-v)));
    consider('edge',p,nearest,Math.hypot(pointerPx.x-nearest.x,pointerPx.y-nearest.y));
  }
  return bestCorner || bestEdge;
};
