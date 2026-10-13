/**
 * Source-bound, temporary P137E D1F I03 field-measured geometry successor.
 * Accept ONLY an already SHA-verified original P137E scene67 ArrayBuffer.
 * Produces a new scene 68 without changing existing scenes, nodes, meshes or bytes.
 * Field measurements are authoritative; global XY face binding is conditional.
 */
export const P137E_MEASURED_WALL_VARIANT = 'd1f-kph-wc-field-20261013';
export const P137E_MEASURED_WALL_REVIEW_ROOT = 'P137E_SCENE68_I03_FIELD_MEASURED_WORK_TEST_ROOT';
export const P137E_MEASURED_WALL_SCENE_INDEX = 68;
export const P137E_MEASURED_WALL_METRICS_MM = Object.freeze({
  kphSideLength: 960, wcSideVisible: 710, thickness: 205, lobbyClearGap: 1020,
});
const fail = (message) => { throw new Error('P137E_I03_FIELD_WALL_SOURCE_MISMATCH: ' + message); };
const n = (value) => Number.isInteger(value) && value >= 0;
const same = (a,b) => Math.abs(a-b)<0.00015;
const clone = (v) => structuredClone(v);
const cut = (b, offset, count) => b.subarray(offset, offset+count);
const align4 = (v) => (v + 3) & ~3;

export function makeP137EFieldMeasuredWallWorkTest(original) {
  if (!(original instanceof ArrayBuffer)) fail('source must be exact verified ArrayBuffer');
  const input = new Uint8Array(original);
  const dv = new DataView(original);
  if (input.byteLength < 64 || dv.getUint32(0,true)!==0x46546c67 ||
      dv.getUint32(4,true)!==2 || dv.getUint32(8,true)!==input.byteLength) fail('GLB header');
  const jl = dv.getUint32(12,true);
  if (dv.getUint32(16,true)!==0x4e4f534a || jl<8 || 20+jl+8>input.length) fail('JSON chunk');
  const binOffset=20+jl;
  const bl=dv.getUint32(binOffset,true);
  if (dv.getUint32(binOffset+4,true)!==0x004e4942 || binOffset+8+bl!==input.length) fail('BIN chunk');
  const doc=JSON.parse(new TextDecoder().decode(cut(input,20,jl)));
  if (doc.scenes?.length!==68 || doc.nodes?.length!==1108 || doc.meshes?.length!==555 ||
      doc.scenes[67]?.nodes?.length!==1 || doc.scenes[67].nodes[0]!==1107 ||
      JSON.stringify(doc.nodes[1107]?.children)!=='[1106,1091,1096,1101]' ||
      doc.nodes[1106]?.mesh!==406 || doc.nodes[798]?.mesh!==406) fail('scene67 model identity');
  const prim=doc.meshes[406].primitives?.[0];
  const srcPositionAcc=doc.accessors?.[prim?.attributes?.POSITION];
  const sourceView=doc.bufferViews?.[srcPositionAcc?.bufferView];
  if (srcPositionAcc?.count!==176 || srcPositionAcc?.componentType!==5126 ||
      srcPositionAcc?.type!=='VEC3' || !n(sourceView?.byteOffset) ||
      sourceView.byteOffset+(srcPositionAcc.byteOffset||0)+176*12 > bl) fail('source wall positions');
  const originalPositionsOffset=binOffset+8+sourceView.byteOffset+(srcPositionAcc.byteOffset||0);
  const pos=new Float32Array(176*3);
  const sourceData=new DataView(original,originalPositionsOffset,176*12);
  for (let i=0;i<pos.length;i++) pos[i]=sourceData.getFloat32(i*4,true);
  const segmentBounds=(first,expected,label)=>{
    const vertices=[...Array(8)].map((_,i)=>[pos[(first+i)*3],pos[(first+i)*3+1],pos[(first+i)*3+2]]);
    const bounds=[...Array(3)].map((_,axis)=>Math.min(...vertices.map(p=>p[axis])))
      .concat([...Array(3)].map((_,axis)=>Math.max(...vertices.map(p=>p[axis]))));
    if (!bounds.every((v,i)=>same(v,expected[i]))) fail(label+' bounds');
    return bounds;
  };
  segmentBounds(128,[5.098,4.206,0,6.306,4.286,2.76],'I03 original geometry');
  const eastWall=segmentBounds(64,[6.266,-1.124,0,6.346,10.544,2.76],'east source display wall');
  const lobbyWall=segmentBounds(136,[0.231,5.032,0,6.306,5.112,2.76],'Lobby source display wall');
  // Bind only this WORK_TEST rendering to the source's visible inner faces.
  // Legacy 6.306/5.072 centerlines are not those faces or surveyed physical XY.
  const eastX=eastWall[0], westX=eastX-P137E_MEASURED_WALL_METRICS_MM.kphSideLength/1000;
  const northY=lobbyWall[1]-P137E_MEASURED_WALL_METRICS_MM.lobbyClearGap/1000;
  const southY=northY-P137E_MEASURED_WALL_METRICS_MM.thickness/1000;
  const xy=[[westX,northY],[eastX,northY],[eastX,southY],[westX,southY]];
  for(let i=0;i<8;i++) {
    pos[(128+i)*3]=xy[i%4][0]; pos[(128+i)*3+1]=xy[i%4][1];
  }
  const extraPositionsByteLength=pos.byteLength;
  const nextBinaryLength=bl+extraPositionsByteLength;
  doc.bufferViews.push({buffer:0,byteOffset:bl,byteLength:extraPositionsByteLength,target:34962,
    name:'D1F_KPH_WC_FIELD_WALL_POSITIONS_WORK_TEST'});
  const newAcc=clone(srcPositionAcc);
  newAcc.bufferView=doc.bufferViews.length-1; newAcc.byteOffset=0;
  newAcc.min=[Math.min(...pos.filter((_,i)=>i%3===0)),Math.min(...pos.filter((_,i)=>i%3===1)),Math.min(...pos.filter((_,i)=>i%3===2))];
  newAcc.max=[Math.max(...pos.filter((_,i)=>i%3===0)),Math.max(...pos.filter((_,i)=>i%3===1)),Math.max(...pos.filter((_,i)=>i%3===2))];
  newAcc.name='D1F_KPH_WC_I03_USER_CURRENT_MEASURED_POSITION';
  doc.accessors.push(newAcc);
  const nextMesh=clone(doc.meshes[406]);
  nextMesh.name='D1F_KPH_WC_I03_FIELD_MEASURED_WALL_MESH_WORK_TEST';
  nextMesh.primitives[0].attributes.POSITION=doc.accessors.length-1;
  nextMesh.extras={sourceOriginalMesh:406,scope:'ONLY_I03_8_OF_176_VERTICES',
    measuredFieldMM:P137E_MEASURED_WALL_METRICS_MM,
    sourceDisplayFaceBinding:{sourceMesh:406,eastWallVertexRange:[64,71],eastInnerFaceX:eastX,
      lobbyWallVertexRange:[136,143],lobbyBathroomFaceY:lobbyWall[1],purpose:'WORK_TEST_DISPLAY_ONLY'},
    sourceXYBinding:'CONDITIONAL_UNVERIFIED',fieldMeasurementsCurrent:true,
    enclosureModeled:false,physicalHeightVerified:false,workTest:true,current:false,asBuilt:false,
    Canonical:false,publishToCURRENT:false,HUMAN_REVIEW:'NOT_RUN'};
  doc.meshes.push(nextMesh);
  const nextNode=clone(doc.nodes[1106]);
  nextNode.mesh=doc.meshes.length-1;nextNode.name='P137E_D1F_I03_FIELD_CURRENT_MEASURED_WALL_PRESENTATION';
  nextNode.extras={sourceOriginalNode:1106,sourceOriginalMesh:406,workTest:true,
    sourceXYBinding:'CONDITIONAL_UNVERIFIED'};
  doc.nodes.push(nextNode);
  const root=clone(doc.nodes[1107]);
  root.name=P137E_MEASURED_WALL_REVIEW_ROOT;
  root.children=[doc.nodes.length-1,1091,1096,1101];
  root.extras={modelStage:'WORK_TEST',fieldMeasurementsCurrent:true,
    sourceXYBinding:'CONDITIONAL_UNVERIFIED',wallI03SourcePreserved:true,
    p137eThreeThemoOriginalNodesUnchanged:true,current:false,Canonical:false,
    asBuilt:false,publishToCURRENT:false,HUMAN_REVIEW:'NOT_RUN'};
  doc.nodes.push(root);
  const scene=clone(doc.scenes[67]);
  scene.name='P137E D1F I03 FIELD MEASURED WALL + 3 THEMO WORK_TEST';
  scene.nodes=[doc.nodes.length-1];
  scene.extras={modelStage:'WORK_TEST',sourceScene:67,fieldMeasurementsCurrent:true,
    sourceXYBinding:'CONDITIONAL_UNVERIFIED',current:false,Canonical:false,asBuilt:false,
    publishToCURRENT:false,HUMAN_REVIEW:'NOT_RUN'};
  doc.scenes.push(scene);doc.scene=P137E_MEASURED_WALL_SCENE_INDEX;
  doc.buffers[0].byteLength=nextBinaryLength;
  const encoded=new TextEncoder().encode(JSON.stringify(doc));
  const nextJsonLength=align4(encoded.length);
  const out=new ArrayBuffer(12+8+nextJsonLength+8+nextBinaryLength);
  const data=new DataView(out), bytes=new Uint8Array(out);
  data.setUint32(0,0x46546c67,true);data.setUint32(4,2,true);data.setUint32(8,out.byteLength,true);
  data.setUint32(12,nextJsonLength,true);data.setUint32(16,0x4e4f534a,true);
  bytes.fill(32,20,20+nextJsonLength);bytes.set(encoded,20);
  const outputBinStart=20+nextJsonLength;
  data.setUint32(outputBinStart,nextBinaryLength,true);data.setUint32(outputBinStart+4,0x004e4942,true);
  bytes.set(cut(input,binOffset+8,bl),outputBinStart+8);
  const posWrite=new DataView(out,outputBinStart+8+bl,extraPositionsByteLength);
  for(let i=0;i<pos.length;i++)posWrite.setFloat32(i*4,pos[i],true);
  return out;
}


/**
 * Source-bound combined WORK_TEST presentation. Scene68 (the already-verified
 * 960/710/205/1020 mm I03 wall) remains byte-for-byte unchanged. Scene69
 * adds only the three source-identified 40 x 40 mm L-junction gap fillers.
 * Each gap is derived from the verified neighboring source wall display
 * rectangles. Neither thickness nor XY is asserted to be a physical survey.
 *
 * This is a model constructor, NOT publication, rendering or HUMAN_REVIEW.
 */
export const P137E_THREE_CORNER_MEASURED_VARIANT = 'd1f-kph-wc-field-three-corners-20261013';
export const P137E_THREE_CORNER_MEASURED_SCENE_INDEX = 69;
export const P137E_THREE_CORNER_MEASURED_REVIEW_ROOT =
  'P137E_SCENE69_THREE_SOURCE_CORNERS_AND_I03_FIELD_WORK_TEST_ROOT';

const p137eCornerJoins = Object.freeze([
  { horizontal:104, vertical:160, x:2.337, y:10.544 },
  { horizontal:168, vertical:160, x:2.337, y:7.285 },
  { horizontal:152, vertical:144, x:2.589, y:3.224 },
]);

function p137eSourceCornerPatches(positions) {
  const bounds = (first) => {
    const p = Array.from({ length:8 }, (_, k) => [
      positions[3*(first+k)], positions[3*(first+k)+1], positions[3*(first+k)+2]
    ]);
    const low = [0,1,2].map(axis=>Math.min(...p.map(q=>q[axis])));
    const high = [0,1,2].map(axis=>Math.max(...p.map(q=>q[axis])));
    if (!same(low[2],0) || !same(high[2],2.76)) fail('corner source height '+first);
    return { low, high };
  };
  const extent=(b,a)=>b.high[a]-b.low[a];
  const patches=[];
  for (const entry of p137eCornerJoins) {
    const h=bounds(entry.horizontal), v=bounds(entry.vertical);
    if (!same(extent(h,1),.08) || !same(extent(v,0),.08) ||
        extent(h,0)<.1 || extent(v,1)<.1) fail('corner source rectangle axes');
    const cx=(v.low[0]+v.high[0])/2, cy=(h.low[1]+h.high[1])/2;
    if(Math.abs(cx-entry.x)>.012 || Math.abs(cy-entry.y)>.012 ||
       !same((h.low[1]+h.high[1])/2,cy) ||
       !same((v.low[0]+v.high[0])/2,cx)) fail('corner source centerline anchor');
    const xPositive=same(h.high[0],cx), xNegative=same(h.low[0],cx);
    const yPositive=same(v.high[1],cy), yNegative=same(v.low[1],cy);
    if(xPositive===xNegative || yPositive===yNegative)
      fail('corner source not a terminating orthogonal L');
    const dx=(xPositive ? +.04 : -.04), dy=(yPositive ? +.04 : -.04);
    const b={ minX:Math.min(cx,cx+dx),maxX:Math.max(cx,cx+dx),
      minY:Math.min(cy,cy+dy),maxY:Math.max(cy,cy+dy),
      minZ:0,maxZ:2.76, sourcePair:[entry.horizontal,entry.vertical] };
    // The missing outside quadrant must not already occupy either source wall.
    const positiveIntersection=(a0,a1,b0,b1)=>Math.max(0,Math.min(a1,b1)-Math.max(a0,b0));
    for(const neighbor of [h,v]) {
      const shared=positiveIntersection(b.minX,b.maxX,neighbor.low[0],neighbor.high[0])*
        positiveIntersection(b.minY,b.maxY,neighbor.low[1],neighbor.high[1]);
      if(shared>.000001) fail('corner patch overlaps source wall');
    }
    if(!same(b.maxX-b.minX,.04) || !same(b.maxY-b.minY,.04))
      fail('corner patch dimensions');
    patches.push(b);
  }
  return patches;
}

function p137eGlbJsonAndBinary(glb) {
  const view=new DataView(glb);
  const bytes=new Uint8Array(glb);
  const jl=view.getUint32(12,true);
  if(view.getUint32(0,true)!==0x46546c67 || view.getUint32(4,true)!==2 ||
     view.getUint32(8,true)!==glb.byteLength ||
     view.getUint32(16,true)!==0x4e4f534a) fail('combined GLB header');
  const start=20+jl, bl=view.getUint32(start,true);
  if(view.getUint32(start+4,true)!==0x004e4942 || start+8+bl!==glb.byteLength)
    fail('combined GLB BIN');
  return { doc:JSON.parse(new TextDecoder().decode(cut(bytes,20,jl))),
    bin:cut(bytes,start+8,bl) };
}

function p137eGapBoxTriangles(patches) {
  const xyz=[],norm=[],indices=[];
  const face=(corners,normal)=>{
    const base=xyz.length/3;
    for(const point of corners){xyz.push(...point);norm.push(...normal);}
    indices.push(base,base+1,base+2,base,base+2,base+3);
  };
  for(const p of patches) {
    const [a,b,c,d,z0,z1]=[p.minX,p.maxX,p.minY,p.maxY,p.minZ,p.maxZ];
    face([[a,c,z0],[a,c,z1],[a,d,z1],[a,d,z0]],[-1,0,0]);
    face([[b,c,z0],[b,d,z0],[b,d,z1],[b,c,z1]],[+1,0,0]);
    face([[a,c,z0],[b,c,z0],[b,c,z1],[a,c,z1]],[0,-1,0]);
    face([[a,d,z0],[a,d,z1],[b,d,z1],[b,d,z0]],[0,+1,0]);
    face([[a,c,z0],[a,d,z0],[b,d,z0],[b,c,z0]],[0,0,-1]);
    face([[a,c,z1],[b,c,z1],[b,d,z1],[a,d,z1]],[0,0,+1]);
  }
  if(xyz.length!==216 || norm.length!==216 || indices.length!==108)
    fail('corner mesh topology');
  return {xyz,norm,indices};
}

export function makeP137EThreeCornerMeasuredWorkTest(original) {
  // Preserve the currently integrated scene68 and its verified display-face
  // binding; never return the older scene70 local candidate's 40mm-overlap XY.
  const measured=makeP137EFieldMeasuredWallWorkTest(original);
  const {doc,bin}=p137eGlbJsonAndBinary(measured);
  if(doc.scene!==68 || doc.scenes.length!==69 || doc.meshes.length!==556 ||
     doc.scenes[68]?.nodes?.[0]!==1109 ||
     doc.nodes[1109]?.name!==P137E_MEASURED_WALL_REVIEW_ROOT)
    fail('measured source scene identity');
  const originalPositionAccessor=doc.accessors[doc.meshes[406].primitives[0].attributes.POSITION];
  const originalView=doc.bufferViews[originalPositionAccessor.bufferView];
  const byteOffset=originalView.byteOffset+(originalPositionAccessor.byteOffset||0);
  if(originalPositionAccessor.count!==176 || byteOffset+176*12>bin.length)
    fail('source positions read');
  const view=new DataView(bin.buffer,bin.byteOffset+byteOffset,176*12);
  const positions=Array.from({length:176*3},(_,i)=>view.getFloat32(i*4,true));
  const patches=p137eSourceCornerPatches(positions);
  const tri=p137eGapBoxTriangles(patches);
  const floats=tri.xyz.length;
  const posBytes=floats*4, normalBytes=floats*4, indexBytes=tri.indices.length*2;
  const appended=new Uint8Array(posBytes+normalBytes+indexBytes);
  const writer=new DataView(appended.buffer);
  tri.xyz.forEach((v,i)=>writer.setFloat32(i*4,v,true));
  tri.norm.forEach((v,i)=>writer.setFloat32(posBytes+i*4,v,true));
  tri.indices.forEach((v,i)=>writer.setUint16(posBytes+normalBytes+i*2,v,true));
  const viewStart=doc.bufferViews.length;
  doc.bufferViews.push(
    {buffer:0,byteOffset:bin.length,byteLength:posBytes,target:34962},
    {buffer:0,byteOffset:bin.length+posBytes,byteLength:normalBytes,target:34962},
    {buffer:0,byteOffset:bin.length+posBytes+normalBytes,byteLength:indexBytes,target:34963}
  );
  const a=doc.accessors.length;
  doc.accessors.push(
    {bufferView:viewStart,componentType:5126,count:tri.xyz.length/3,type:'VEC3',
      min:[Math.min(...tri.xyz.filter((_,i)=>i%3===0)),Math.min(...tri.xyz.filter((_,i)=>i%3===1)),0],
      max:[Math.max(...tri.xyz.filter((_,i)=>i%3===0)),Math.max(...tri.xyz.filter((_,i)=>i%3===1)),2.76]},
    {bufferView:viewStart+1,componentType:5126,count:tri.norm.length/3,type:'VEC3'},
    {bufferView:viewStart+2,componentType:5123,count:tri.indices.length,type:'SCALAR'}
  );
  const originalPrimitive=doc.meshes[406].primitives[0];
  const primitive={attributes:{POSITION:a,NORMAL:a+1},indices:a+2,mode:4};
  if(n(originalPrimitive.material)) primitive.material=originalPrimitive.material;
  doc.meshes.push({name:'P137E_SOURCE_BOUNDED_THREE_L_GAP_FILLERS_WORK_TEST',
    primitives:[primitive],extras:{sourceOriginalMesh:406,
      gapSizeMM:40, sourceJunctionPairs:patches.map(p=>p.sourcePair),
      patchesXY:patches.map(p=>[p.minX,p.maxX,p.minY,p.maxY]),
      presentationOnly:true,sourceXYBinding:'CONDITIONAL_UNVERIFIED',
      workTest:true,current:false,canonical:false,asBuilt:false}});
  const patchNode=doc.nodes.length;
  doc.nodes.push({mesh:doc.meshes.length-1,name:'P137E_THREE_CORNER_SOURCE_PATCHES'});
  const wallNode=doc.nodes.length;
  doc.nodes.push({...clone(doc.nodes[1108]),children:[patchNode],
    name:'P137E_FIELD_I03_WALL_WITH_THREE_SOURCE_CORNER_PATCHES'});
  const rootIndex=doc.nodes.length;
  const root=clone(doc.nodes[1109]);
  root.name=P137E_THREE_CORNER_MEASURED_REVIEW_ROOT;
  root.children=[wallNode,1091,1096,1101];
  root.extras={...root.extras,sourceCornerGapsClosed:3,
    cornerGapMM:40,physicalCornerThicknessVerified:false,
    sourceXYBinding:'CONDITIONAL_UNVERIFIED'};
  doc.nodes.push(root);
  const scene=clone(doc.scenes[68]);
  scene.name='P137E D1F THREE SOURCE L CORNERS + MEASURED I03 WORK_TEST';
  scene.nodes=[rootIndex];
  scene.extras={...scene.extras,sourceScene:67,
    scene68FieldMeasurementsPreserved:true,sourceCornerGapsClosed:3,
    physicalWallThicknessVerified:false,sourceXYBinding:'CONDITIONAL_UNVERIFIED',
    current:false,canonical:false,asBuilt:false,HUMAN_REVIEW:'NOT_RUN'};
  doc.scenes.push(scene);
  doc.scene=P137E_THREE_CORNER_MEASURED_SCENE_INDEX;
  doc.buffers[0].byteLength=bin.length+appended.length;
  const encoded=new TextEncoder().encode(JSON.stringify(doc));
  const padded=align4(encoded.byteLength);
  const out=new ArrayBuffer(12+8+padded+8+doc.buffers[0].byteLength);
  const dv=new DataView(out), target=new Uint8Array(out);
  dv.setUint32(0,0x46546c67,true);dv.setUint32(4,2,true);dv.setUint32(8,out.byteLength,true);
  dv.setUint32(12,padded,true);dv.setUint32(16,0x4e4f534a,true);
  target.fill(32,20,20+padded);target.set(encoded,20);
  const binStart=20+padded;
  dv.setUint32(binStart,doc.buffers[0].byteLength,true);
  dv.setUint32(binStart+4,0x004e4942,true);
  target.set(bin,binStart+8);
  target.set(appended,binStart+8+bin.length);
  return out;
}
