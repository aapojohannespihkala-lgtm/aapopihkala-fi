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
    if(normals.length===1 || (normals.length===2 && Math.abs(dot(normals[0],normals[1]))<threshold)){
      result.push({a:item.a,b:item.b});
      if(result.length>maxSegments) return [];
    }
  }
  return result;
};

/** Pick an actual corner (two noncollinear feature edges) before an edge.
 * Projector yields {x,y,visible} and may mark offscreen endpoints explicitly.
 * The interpolated edge point still needs the caller's visibility check.
 * Snapping is forbidden without a validated surface-hit point and checker.
 */
export const chooseMeasureFeatureSnap = ({
  pointerPx,hitPointG1,segments,projectToScreen,isCandidateVisible,
  tolerancePx=12,maxWorldGapM=0.4,cornerPriorityPx=tolerancePx,
  // Ignore tiny projected corner arms unless the user zooms close enough to inspect them.
  minCornerArmPx=18,
}) => {
  if(!pointerPx || ![pointerPx.x,pointerPx.y].every(Number.isFinite) ||
     !valid(hitPointG1) || !Array.isArray(segments) ||
     typeof projectToScreen!=='function' || typeof isCandidateVisible!=='function' ||
     !Number.isFinite(tolerancePx) || tolerancePx<=0 ||
     !Number.isFinite(maxWorldGapM) || maxWorldGapM<=0 ||
     !Number.isFinite(cornerPriorityPx) || cornerPriorityPx<0 ||
     !Number.isFinite(minCornerArmPx) || minCornerArmPx<0 ||
     segments.length>30000) return null;
  const base=coords(hitPointG1);
  const projected=new Map(),junctions=new Map(),segmentFeatures=new Map();
  const getPixel=(p)=>{
    if(!valid(p)) return null;
    const k=weldKey(coords(p));
    if(!projected.has(k)) projected.set(k,projectToScreen(p));
    const q=projected.get(k);
    return q && (q.visible===true || q.offscreen===true) &&
      Number.isFinite(q.x) && Number.isFinite(q.y) ? q : null;
  };
  const validSegments=segments.filter(s=>s && valid(s.a) && valid(s.b) &&
    norm(subtract(coords(s.b),coords(s.a)))>1e-8);
  // Only the local 0.4m context may become a snap candidate.
  // The full source-mesh topology is needed to recognise a physically long
  // edge whose short tessellation segments extend beyond that local window.
  const clean=validSegments.filter(s=>{
    const a=coords(s.a),b=coords(s.b);
    return base.every((value,i)=>value>=Math.min(a[i],b[i])-maxWorldGapM &&
      value<=Math.max(a[i],b[i])+maxWorldGapM);
  });
  if(!clean.length) return null;
  const localJunctionKeys=new Set();
  for(const s of validSegments){
    const a=coords(s.a),b=coords(s.b);
    const aKey=weldKey(a),bKey=weldKey(b);
    const edge={aKey,bKey,chainSpanPx:0};
    segmentFeatures.set(s,edge);
    for(const [pos,other] of [[a,b],[b,a]]){
      const key=weldKey(pos);
      if(!junctions.has(key)) junctions.set(key,{pos:point(pos),dirs:[]});
      const d=subtract(other,pos),n=norm(d);
      junctions.get(key).dirs.push({vector:d.map(x=>x/n),edge});
    }
  }
  for(const s of clean){
    const edge=segmentFeatures.get(s);
    localJunctionKeys.add(edge.aKey);
    localJunctionKeys.add(edge.bKey);
  }
  const straightCos=Math.cos(10*Math.PI/180),maxJunctionDegree=6;
  const continueStraight=(junction,previous)=>{
    if(!junction || junction.dirs.length<2 ||
       junction.dirs.length>maxJunctionDegree) return null;
    const incoming=junction.dirs.find(dir=>dir.edge===previous);
    if(!incoming) return null;
    let continuation=null;
    for(const dir of junction.dirs){
      if(dir.edge===previous ||
         dot(incoming.vector,dir.vector)>=-straightCos) continue;
      if(continuation) return null;
      continuation=dir.edge;
    }
    return continuation;
  };
  // Build only chains attached to locally eligible edges. Project just the two
  // chain endpoints, never every distant tessellation vertex on each preview.
  // A fork/angle/high-valence vertex terminates the chain unless there is one
  // unambiguous straight continuation. No distant chain point is snap-eligible.
  const assigned=new Set();
  const assignChain=(root)=>{
    if(assigned.has(root)) return;
    const chain=[root],endKeys=[root.aKey,root.bKey];
    assigned.add(root);
    for(let side=0;side<2;side++){
      let key=endKeys[side],previous=root;
      while(true){
        const next=continueStraight(junctions.get(key),previous);
        if(!next || assigned.has(next)) break;
        assigned.add(next);
        chain.push(next);
        key=next.aKey===key ? next.bKey : next.aKey;
        previous=next;
      }
      endKeys[side]=key;
    }
    const pa=getPixel(junctions.get(endKeys[0])?.pos);
    const pb=getPixel(junctions.get(endKeys[1])?.pos);
    const rawSpan=pa && pb ? Math.hypot(pa.x-pb.x,pa.y-pb.y) : 0;
    const spanPx=Number.isFinite(rawSpan) ? rawSpan : 0;
    for(const edge of chain) edge.chainSpanPx=spanPx;
  };
  for(const s of clean) assignChain(segmentFeatures.get(s));
  let bestCorner=null,bestEdge=null,bestDetailEdge=null;
  const withinWorld=(p)=>norm(subtract(coords(p),base))<=maxWorldGapM;
  const consider=(kind,p,distancePx,segment,visualSpanPx=Infinity)=>{
    if(distancePx>tolerancePx || !withinWorld(p) ||
       isCandidateVisible(p,kind)!==true) return;
    const candidate={kind,pointG1:p,distancePx,workTestOnly:true,...(segment ? {segment} : {})};
    if(kind==='corner'){
      if(!bestCorner || distancePx<bestCorner.distancePx) bestCorner=candidate;
    }else if(visualSpanPx<minCornerArmPx){
      // Short edges remain a fallback, but cannot steal a nearby meaningful wall edge.
      if(!bestDetailEdge || distancePx<bestDetailEdge.distancePx) bestDetailEdge=candidate;
    }else if(!bestEdge || distancePx<bestEdge.distancePx) bestEdge=candidate;
  };
  for(const key of localJunctionKeys){
    const v=junctions.get(key);
    if(!v || v.dirs.length<2 || v.dirs.length>maxJunctionDegree ||
       norm(subtract(coords(v.pos),base))>maxWorldGapM) continue;
    let corner=false;
    for(let i=0;i<v.dirs.length && !corner;i++){
      if(v.dirs[i].edge.chainSpanPx<minCornerArmPx) continue;
      for(let j=i+1;j<v.dirs.length;j++)
        if(v.dirs[j].edge.chainSpanPx>=minCornerArmPx &&
           Math.abs(dot(v.dirs[i].vector,v.dirs[j].vector))<Math.cos(20*Math.PI/180)) {
          corner=true;break;
        }
    }
    if(!corner) continue;
    const pix=getPixel(v.pos);
    if(pix?.visible) consider('corner',v.pos,Math.hypot(pointerPx.x-pix.x,pointerPx.y-pix.y));
  }
  for(const s of clean){
    const a=getPixel(s.a),b=getPixel(s.b);
    if(!a || !b) continue;
    const dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy;
    if(den<1e-10) continue;
    const t=Math.max(0,Math.min(1,((pointerPx.x-a.x)*dx+(pointerPx.y-a.y)*dy)/den));
    const nearest={x:a.x+t*dx,y:a.y+t*dy};
    // Perspective screen interpolation is not linear in world-space. A caller
    // projecting a perspective camera provides inverse clip W on both endpoints.
    // Orthographic projections (W=1) or legacy pure projectors use affine t.
    const hasDepth=('invW' in a)||('invW' in b);
    if(hasDepth && (!Number.isFinite(a.invW)||!Number.isFinite(b.invW)||
      a.invW<=0||b.invW<=0)) continue;
    const denom=hasDepth ? (1-t)*a.invW+t*b.invW : 1;
    if(!Number.isFinite(denom)||denom<=0) continue;
    const worldT=hasDepth ? t*b.invW/denom : t;
    const av=coords(s.a),bv=coords(s.b);
    const p=point(av.map((v,i)=>v+worldT*(bv[i]-v)));
    const edgeSpan=segmentFeatures.get(s)?.chainSpanPx ?? Math.sqrt(den);
    consider('edge',p,Math.hypot(pointerPx.x-nearest.x,pointerPx.y-nearest.y),s,edgeSpan);
  }
  return bestCorner?.distancePx<=cornerPriorityPx ? bestCorner : bestEdge || bestCorner || bestDetailEdge;
};

/** Foot of the perpendicular on the finite edge, or null if it needs an extension. */
export const perpendicularToMeasureEdge = (from, segment) => {
  if (!valid(from) || !valid(segment?.a) || !valid(segment?.b)) return null;
  const a = coords(segment.a);
  const direction = subtract(coords(segment.b), a);
  const lengthSquared = dot(direction, direction);
  if (lengthSquared < 1e-12) return null;
  const t = dot(subtract(coords(from), a), direction) / lengthSquared;
  if (t < 0 || t > 1) return null;
  return point(a.map((value, i) => value + t * direction[i]));
};

/** Orthogonal projection onto a picked face plane. The caller validates the finite surface. */
export const perpendicularToMeasurePlane = (from, surface, normal) => {
  if (!valid(from) || !valid(surface) || !normal) return null;
  const direction = [normal.x, normal.y, normal.z];
  if (!direction.every(Number.isFinite)) return null;
  const lengthSquared = dot(direction, direction);
  if (lengthSquared < 1e-12) return null;
  const a = coords(from);
  const t = dot(subtract(a, coords(surface)), direction) / lengthSquared;
  return point(a.map((value, i) => value - t * direction[i]));
};
