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
const cachedTopologies = new WeakMap();

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
  maxTriangles=30000,maxSegments=30000,cacheTopology=false,
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
  // The adapter owns a stable snapshot per mesh/transform/version.
  if(cacheTopology) cachedTopologies.set(result,null);
  return result;
};

const maxJunctionDegree=6;
const straightCos=Math.cos(10*Math.PI/180);
const cornerCos=Math.cos(20*Math.PI/180);

/** Camera-independent adjacency and bounded, unambiguous feature chains. */
const buildMeasureTopology=(segments)=>{
  const edges=[],junctions=new Map();
  for(const segment of segments){
    if(!segment || !valid(segment.a) || !valid(segment.b)) continue;
    const av=coords(segment.a),bv=coords(segment.b);
    const delta=subtract(bv,av),length=norm(delta);
    if(length<=1e-8) continue;
    const aKey=weldKey(av),bKey=weldKey(bv),unit=delta.map(x=>x/length);
    if(aKey===bKey) continue;
    const edge={segment,av,bv,aKey,bKey,chain:null};
    edges.push(edge);
    for(const [key,pos,vector] of [[aKey,segment.a,unit],[bKey,segment.b,unit.map(x=>-x)]]){
      if(!junctions.has(key)) junctions.set(key,{pos,dirs:[]});
      junctions.get(key).dirs.push({vector,edge});
    }
  }
  const continueStraight=(junction,previous)=>{
    if(junction.dirs.length<2 || junction.dirs.length>maxJunctionDegree) return null;
    const incoming=junction.dirs.find(dir=>dir.edge===previous);
    let continuation=null;
    for(const dir of junction.dirs){
      if(dir.edge===previous || dot(incoming.vector,dir.vector)>=-straightCos) continue;
      if(continuation) return null;
      continuation=dir.edge;
    }
    return continuation;
  };
  const chainFor=(root)=>{
    if(root.chain) return root.chain;
    const seen=new Set([root]);
    const endKeys=[root.aKey,root.bKey];
    for(let side=0;side<2;side++){
      let key=endKeys[side],previous=root;
      while(true){
        const junction=junctions.get(key);
        const next=continueStraight(junction,previous);
        if(!next || next.chain || seen.has(next) || continueStraight(junction,next)!==previous) break;
        seen.add(next);
        key=next.aKey===key ? next.bKey : next.aKey;
        previous=next;
      }
      endKeys[side]=key;
    }
    const [a,b]=endKeys.map(key=>junctions.get(key).pos);
    const origin=coords(a),direction=subtract(coords(b),origin),length=norm(direction);
    // A gently bent chain can be salient. Only a physically straight chain
    // can provide a longer finite segment for the perpendicular measurement.
    let straightSegment=null;
    if(seen.size>1 && length>1e-8){
      const axis=direction.map(value=>value/length);
      const onSegment=(v)=>{
        const delta=subtract(v,origin),along=dot(delta,axis);
        return along>=-1e-5 && along<=length+1e-5 && norm(cross(delta,axis))<=1e-5;
      };
      if([...seen].every(edge=>onSegment(edge.av) && onSegment(edge.bv))) straightSegment={a,b};
    }
    const chain={a,b,straightSegment};
    for(const edge of seen) edge.chain=chain;
    return chain;
  };
  return {edges,junctions,chainFor};
};

/** Pick an actual corner (two noncollinear feature edges) before an edge.
 * Projector yields {x,y,visible} and may mark offscreen endpoints explicitly.
 * The interpolated edge point still needs the caller's visibility check.
 * Snapping is forbidden without a validated surface-hit point and checker.
 */
export const chooseMeasureFeatureSnap = ({
  pointerPx,hitPointG1,segments,projectToScreen,isCandidateVisible,
  tolerancePx=12,maxWorldGapM=0.4,cornerPriorityPx=tolerancePx,
  // Small details remain free surface points until they are large enough on screen.
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
  const projected=new Map(),chainSpans=new Map();
  const getPixel=(p)=>{
    if(!valid(p)) return null;
    const k=weldKey(coords(p));
    if(!projected.has(k)) projected.set(k,projectToScreen(p));
    const q=projected.get(k);
    return q && (q.visible===true || q.offscreen===true) &&
      Number.isFinite(q.x) && Number.isFinite(q.y) ? q : null;
  };
  let topology=cachedTopologies.get(segments);
  if(!topology){
    topology=buildMeasureTopology(segments);
    if(cachedTopologies.has(segments)) cachedTopologies.set(segments,topology);
  }
  const {edges,junctions,chainFor}=topology;
  // The 0.4m limit applies to selectable points, not to the entire edge
  // which supports a feature across short tessellation segments.
  const localEdges=edges.filter(({av,bv})=>base.every((value,i)=>
    value>=Math.min(av[i],bv[i])-maxWorldGapM && value<=Math.max(av[i],bv[i])+maxWorldGapM));
  if(!localEdges.length) return null;
  const localJunctionKeys=new Set();
  for(const edge of localEdges){
    localJunctionKeys.add(edge.aKey);
    localJunctionKeys.add(edge.bKey);
  }
  const spanOf=(edge)=>{
    const chain=chainFor(edge);
    if(!chainSpans.has(chain)){
      const pa=getPixel(chain.a),pb=getPixel(chain.b);
      const span=pa && pb ? Math.hypot(pa.x-pb.x,pa.y-pb.y) : 0;
      chainSpans.set(chain,Number.isFinite(span) ? span : 0);
    }
    return chainSpans.get(chain);
  };
  // Rank geometrically possible features before expensive source/occlusion
  // raycasts. The first visible candidate in each class is exactly the
  // nearest visible candidate; stable sorting preserves first-seen ties.
  const cornerCandidates=[],edgeCandidates=[];
  const withinWorld=(p)=>norm(subtract(coords(p),base))<=maxWorldGapM;
  const consider=(kind,p,distancePx,segment)=>{
    if(distancePx>tolerancePx || !withinWorld(p)) return;
    const candidate={kind,pointG1:p,distancePx,workTestOnly:true,...(segment ? {segment} : {})};
    (kind==='corner' ? cornerCandidates : edgeCandidates).push(candidate);
  };
  for(const key of localJunctionKeys){
    const v=junctions.get(key);
    if(!v || v.dirs.length<2 || v.dirs.length>maxJunctionDegree ||
       norm(subtract(coords(v.pos),base))>maxWorldGapM) continue;
    let corner=false;
    for(let i=0;i<v.dirs.length && !corner;i++){
      if(spanOf(v.dirs[i].edge)<minCornerArmPx) continue;
      for(let j=i+1;j<v.dirs.length;j++)
        if(Math.abs(dot(v.dirs[i].vector,v.dirs[j].vector))<cornerCos &&
           spanOf(v.dirs[j].edge)>=minCornerArmPx) {
          corner=true;break;
        }
    }
    if(!corner) continue;
    const pix=getPixel(v.pos);
    if(pix?.visible) consider('corner',v.pos,Math.hypot(pointerPx.x-pix.x,pointerPx.y-pix.y));
  }
  for(const edge of localEdges){
    const {segment,av,bv}=edge;
    const a=getPixel(segment.a),b=getPixel(segment.b);
    if(!a || !b) continue;
    const dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy;
    if(den<1e-10) continue;
    const t=Math.max(0,Math.min(1,((pointerPx.x-a.x)*dx+(pointerPx.y-a.y)*dy)/den));
    const distancePx=Math.hypot(pointerPx.x-a.x-t*dx,pointerPx.y-a.y-t*dy);
    if(distancePx>tolerancePx || distancePx>=(bestEdge?.distancePx ?? Infinity) ||
       Math.max(Math.sqrt(den),spanOf(edge))<minCornerArmPx) continue;
    // Perspective screen interpolation is not linear in world-space. A caller
    // projecting a perspective camera provides inverse clip W on both endpoints.
    // Orthographic projections (W=1) or legacy pure projectors use affine t.
    const hasDepth=('invW' in a)||('invW' in b);
    if(hasDepth && (!Number.isFinite(a.invW)||!Number.isFinite(b.invW)||
      a.invW<=0||b.invW<=0)) continue;
    const denom=hasDepth ? (1-t)*a.invW+t*b.invW : 1;
    if(!Number.isFinite(denom)||denom<=0) continue;
    const worldT=hasDepth ? t*b.invW/denom : t;
    const p=point(av.map((v,i)=>v+worldT*(bv[i]-v)));
    consider('edge',p,distancePx,chainFor(edge).straightSegment ?? segment);
  }
  const nearestVisible=(candidates)=>{
    candidates.sort((a,b)=>a.distancePx-b.distancePx);
    for(const candidate of candidates)
      if(isCandidateVisible(candidate.pointG1,candidate.kind)===true) return candidate;
    return null;
  };
  const bestCorner=nearestVisible(cornerCandidates);
  if(bestCorner?.distancePx<=cornerPriorityPx) return bestCorner;
  return nearestVisible(edgeCandidates) || bestCorner;
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
