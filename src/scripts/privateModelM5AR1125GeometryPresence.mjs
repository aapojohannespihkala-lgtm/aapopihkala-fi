/** Raw-authenticated R1125 WORK_TEST geometry presence only, never as-built proof. */
import { createHash } from 'node:crypto';

const HASH = 'c465417fc101e7de495d0a04bb4feb2bee61b80cd5efccf876f6eb76326f9a48';
const ROOT = 'M5A_R1125_DIAMETER_SOURCE_SPLIT_WORK_TEST_ROOT_BABYLON_Y_UP';
const WELL = new Set(['SOK1', 'SOK2', 'SOK3', 'PVK']);
const NOMINAL = new Set(['PVK_SOK1', 'PVK_SOK3', 'SOK1_SOK2', 'SOK3_BUILDING_END', 'SOK2_BUILDING_END']);
const UNKNOWN = new Set(['PVK_DISCHARGE', 'PVK_PARKING']);
const NO_PROMOTION = ['Canonical', 'physicalRouteClaim', 'exactXYClaim', 'exactZClaim', 'physicalElevationClaim', 'currentGeometryClaim', 'asBuiltClaim', 'publishToCURRENT'];
const fail = (name) => { throw new Error('R1125_GEOMETRY_SOURCE_GATE: ' + name); };
const need = (ok, name) => { if (!ok) fail(name); };
const exactSet = (a, b) => a.size === b.size && [...a].every(x => b.has(x));

export function parseOriginalR1125(raw) {
  need(Buffer.isBuffer(raw) && raw.length === 3112432, 'original raw bytes');
  need(createHash('sha256').update(raw).digest('hex') === HASH, 'original raw SHA-256');
  need(raw.toString('ascii',0,4) === 'glTF' && raw.readUInt32LE(4) === 2 && raw.readUInt32LE(8) === raw.length, 'GLB v2 header');
  const n = raw.readUInt32LE(12), at = 20 + n;
  need(at + 8 <= raw.length && raw.toString('ascii',16,20) === 'JSON', 'JSON chunk');
  need(raw.toString('ascii',at+4,at+8) === 'BIN\0' && at + 8 + raw.readUInt32LE(at) === raw.length, 'BIN chunk');
  return { doc: JSON.parse(raw.toString('utf8',20,at)), bin: raw.subarray(at+8) };
}

function accessor(doc, bin, id, expectedType, codes) {
  need(Number.isInteger(id) && id >= 0 && id < doc.accessors.length, 'invalid accessor reference');
  const a = doc.accessors[id];
  need(a.type === expectedType && codes.includes(a.componentType) && !a.sparse, 'accessor type');
  const v = doc.bufferViews[a.bufferView];
  need(v && (v.buffer ?? 0) === 0, 'bufferView missing');
  const count = a.count;
  need(Number.isInteger(count) && count > 0 && count < 1000000, 'accessor count');
  const size = a.componentType === 5126 || a.componentType === 5125 ? 4 : a.componentType === 5123 ? 2 : 1;
  const components = expectedType === 'VEC3' ? 3 : 1;
  const bytes = size * components, stride = v.byteStride ?? bytes;
  const viewStart = v.byteOffset ?? 0, start = viewStart + (a.byteOffset ?? 0);
  need(Number.isInteger(stride) && stride >= bytes && start >= viewStart &&
       start+(count-1)*stride+bytes <= viewStart+v.byteLength && start+(count-1)*stride+bytes <= bin.length, 'accessor bounds');
  const data = new DataView(bin.buffer,bin.byteOffset,bin.byteLength), result = [];
  for (let i=0;i<count;i++) {
    const at = start+i*stride, values=[];
    for (let j=0;j<components;j++) {
      const offset = at+j*size;
      const val = a.componentType === 5126 ? data.getFloat32(offset,true) : a.componentType === 5125 ? data.getUint32(offset,true) : a.componentType === 5123 ? data.getUint16(offset,true) : data.getUint8(offset);
      need(Number.isFinite(val), 'nonfinite coordinate');
      values.push(val);
    }
    result.push(components === 3 ? values : values[0]);
  }
  return result;
}

function trianglesValid(p, indices) {
  for (let i=0;i<indices.length;i+=3) {
    const a=p[indices[i]], b=p[indices[i+1]], c=p[indices[i+2]];
    const x=b.map((v,j)=>v-a[j]), y=c.map((v,j)=>v-a[j]);
    const cross=[x[1]*y[2]-x[2]*y[1],x[2]*y[0]-x[0]*y[2],x[0]*y[1]-x[1]*y[0]];
    need(cross.reduce((s,v)=>s+v*v,0)>1e-20, 'degenerate triangle');
  }
}

export function inspectR1125Presentation({doc,bin}) {
  need(doc && Buffer.isBuffer(bin) && Array.isArray(doc.nodes) && Array.isArray(doc.meshes) && Array.isArray(doc.scenes) && Array.isArray(doc.accessors) && Array.isArray(doc.bufferViews), 'parsed source structure');
  const scene=doc.scenes[63];
  need(scene?.name === 'M5A-R1125 FIVE SALAOJA D100 + TWO UNKNOWN PVK DIAMETERS WORK_TEST - BABYLON Y-UP', 'R1125 review scene');
  const roots=scene.nodes.filter(id=>doc.nodes[id]?.name===ROOT);
  need(roots.length===1, 'unique source root');
  const root=doc.nodes[roots[0]], q=root.rotation;
  need(Array.isArray(q)&&q.length===4&&q.every(Number.isFinite)&&q.every((v,i)=>Math.abs(v-[-Math.SQRT1_2,0,0,Math.SQRT1_2][i])<1e-7)&&!('matrix' in root)&&!('scale' in root)&&!('translation' in root), 'root axis transform');
  need(NO_PROMOTION.every(k=>root.extras?.[k]===false)&&root.extras?.humanReview==='NOT_RUN', 'root no-promotion');
  const children=root.children;
  need(Array.isArray(children)&&children.length===13&&new Set(children).size===13, '13 unique source targets');
  const found={well:new Set(),route:new Set(),boundary:new Set()};
  let triangles=0,lines=0;
  for(const id of children){
    need(Number.isInteger(id)&&doc.nodes[id], 'source target index');
    const node=doc.nodes[id],e=node.extras??{},kind=e.representationKind;
    need(NO_PROMOTION.every(k=>e[k]===false), 'target no-promotion');
    let type,key,known,mode;
    if(kind==='wellDiameterPresentationWork'){type='well';key=e.sourceNodeId;known=WELL;mode=4;}
    else if(kind==='pipeDiameterPresentationWork'){
      type='route';key=e.sourceConnection;known=new Set([...NOMINAL,...UNKNOWN]);mode=4;
      need(e.physicalDiameterPerRouteSourceVerified===false, 'route physical status');
      if(UNKNOWN.has(key))need(e.pipeDiameterMmSource==null && e.pipeDiameterMmNominalSource==null && e.physicalNominalDiameterStatus==='UNKNOWN', 'PVK diameter must remain unknown');
      else need(e.pipeDiameterMmSource===100 && e.pipeDiameterMmNominalSource===100 && e.pipeDiameterMmSourceScope==='AGGREGATE_SALAOJA_SYSTEM_NOT_INDIVIDUAL_ROUTE', 'only aggregate nominal D100');
    }else if(kind==='unresolvedBoundaryMarker'){
      type='boundary';key=e.boundaryRole;known=UNKNOWN;mode=1;
      need(e.boundaryStatus==='UNRESOLVED_BOUNDARY'&&e.sourceBoundaryUnresolved===true, 'boundary unresolved');
    }else fail('representation class');
    need(known.has(key)&&!found[type].has(key),'source target roster');
    found[type].add(key);
    need(Number.isInteger(node.mesh)&&doc.meshes[node.mesh]&&!('matrix' in node)&&!('rotation' in node)&&!('scale' in node), 'mesh reference or transform');
    const prims=doc.meshes[node.mesh].primitives;
    need(Array.isArray(prims)&&prims.length===1, 'primitive count');
    const p=prims[0];need((p.mode??4)===mode,'triangles/lines class');
    const positions=accessor(doc,bin,p.attributes?.POSITION,'VEC3',[5126]);
    let indices;
    if(p.indices===undefined)indices=positions.map((_,i)=>i);
    else {
      const a=doc.accessors[p.indices];
      need(a&&[5121,5123,5125].includes(a.componentType),'index component');
      indices=accessor(doc,bin,p.indices,'SCALAR',[a.componentType]);
    }
    need(indices.length>0 && indices.length%(mode===4?3:2)===0 && indices.every(i=>i<positions.length), 'primitive indices');
    if(mode===4){trianglesValid(positions,indices);triangles+=indices.length/3;}
    else lines+=indices.length/2;
  }
  need(exactSet(found.well,WELL)&&exactSet(found.route,new Set([...NOMINAL,...UNKNOWN]))&&exactSet(found.boundary,UNKNOWN),'complete roster');
  return {result:'PASS',gate:'AUTHENTICATED_R1125_PRESENTATION_GEOMETRY_ONLY',objects:13,wells:4,routes:7,unresolvedBoundaries:2,triangles,lineSegments:lines,physicalDiameterMeasured:false,physicalElevationsVerified:false,installedConnectionsVerified:false,current:false,canonical:false,asBuilt:false,productionVerified:false,humanReview:'NOT_RUN'};
}

export function inspectOriginalR1125(raw) {return inspectR1125Presentation(parseOriginalR1125(raw));}
