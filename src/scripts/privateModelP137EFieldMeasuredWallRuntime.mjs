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
  const seg=[...Array(8)].map((_,i)=>[pos[(128+i)*3],pos[(128+i)*3+1],pos[(128+i)*3+2]]);
  const min=(axis)=>Math.min(...seg.map(p=>p[axis]));
  const max=(axis)=>Math.max(...seg.map(p=>p[axis]));
  if (![min(0),min(1),min(2),max(0),max(1),max(2)]
       .every((v,i)=>same(v,[5.098,4.206,0,6.306,4.286,2.76][i]))) fail('I03 original geometry bounds');
  const eastX=6.306, westX=eastX-0.960;
  const northY=5.072-1.020, southY=northY-0.205;
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
