// C80-020 / D2F-WP3 U64: source-locked pale INNER, dark OUTER balcony boards.
// This ports the already proven 52-scene split to exact 64-scene 2F62/BOTH63, without new geometry. Reversible WORK_TEST, not a physical color survey.
export const C020_U64_BOARD_SOURCE_SHA='15a13623be601b1cbc70aaced46e497146d50894da9a3a54b4c47b438b4acee9';
const TARGETS=[
  {scene:62,node:5795,name:'C80_020_HI14_2F_BOARDING_WORK_TEST_NONCURRENT'},
  {scene:63,node:5797,name:'C80_020_HI14_BOTH_BOARDING_WORK_TEST_NONCURRENT'},
];
const unavailable=reason=>({available:false,reason,count:0,enabled:false,setEnabled:()=>false,dispose:()=>{}});
const near=(v,x)=>Number.isFinite(v)&&Math.abs(v-x)<1e-6;
function splitFaces(geo){
  const p=geo?.getAttribute?.('position'),index=geo?.index;
  if(!p||p.count!==192||!index||index.count!==288||
      typeof index.getX!=='function'||typeof p.getZ!=='function'||
      typeof geo.clone!=='function')return null;
  const dark=[],inner=[];
  for(let i=0;i<288;i+=3){
    const ids=[index.getX(i),index.getX(i+1),index.getX(i+2)];
    if(ids.some(k=>!Number.isInteger(k)||k<0||k>=192))return null;
    const v=ids.map(k=>[p.getX(k),p.getY(k),p.getZ(k)]);
    const a=v[1].map((n,k)=>n-v[0][k]),b=v[2].map((n,k)=>n-v[0][k]);
    const normal=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
    const len=Math.hypot(...normal);
    if(!Number.isFinite(len)||len<1e-9)return null;
    if(normal[2]/len<-.999&&Math.abs(normal[0]/len)<.002&&Math.abs(normal[1]/len)<.002)
      inner.push(...ids);
    else dark.push(...ids);
  }
  return dark.length===240&&inner.length===48?{dark,inner}:null;
}
export function createUnified64C020BoardPresentation(gltf,sha){
  const json=gltf?.parser?.json, assoc=gltf?.parser?.associations;
  if(sha!==C020_U64_BOARD_SOURCE_SHA||json?.asset?.version!=='2.0'||
     json?.asset?.extras?.current!==false||json?.asset?.extras?.asBuilt!==false||
     json?.scene!==0||json?.scenes?.length!==64||gltf?.scenes?.length!==64||
     typeof assoc?.get!=='function')return unavailable('source-sha-or-scene');
  const mesh=json.meshes?.[1736],prim=mesh?.primitives?.[0],mat=json.materials?.[285];
  if(mesh?.name!=='C80_020_HI14_8_LOWER_GLAZING_BOARD_SLATS_WORK_TEST'||
     mesh.primitives?.length!==1||mesh.extras?.physicalHost!=='HOST_HOLD'||
     mesh.extras?.current!==false||prim?.material!==285||prim?.indices!==2883||
     prim?.attributes?.POSITION!==2881||prim?.attributes?.NORMAL!==2882||
     mat?.name!=='C80_020_BALCONY_BOTTOM_DARK_BOARD_WORK_ASSUMPTION'||
     !Array.isArray(mat?.pbrMetallicRoughness?.baseColorFactor)||
     !mat.pbrMetallicRoughness.baseColorFactor.every((n,i)=>near(n,[.29,.25,.21,1][i])))
    return unavailable('source-mesh-or-material');
  const targets=[];
  for(const t of TARGETS){
    const node=json.nodes?.[t.node],scene=gltf.scenes[t.scene];
    if(node?.mesh!==1736||node.name!==t.name||
       !json.scenes[t.scene]?.nodes?.includes(t.node)||
       node.extras?.physicalHost!=='HOST_HOLD'||node.extras?.sourceOnly!==true||
       node.extras?.asBuilt!==false||node.extras?.current!==false)
      return unavailable('target-node');
    const found=[];
    scene?.traverse?.(obj=>{
      if(obj?.isMesh===true&&obj.name===t.name&&assoc.get(obj)?.nodes===t.node)
        found.push(obj);
    });
    if(found.length!==1)return unavailable('target-object');
    const obj=found[0],geo=obj.geometry;
    if(!obj.visible||Array.isArray(obj.material)||
       typeof obj.material?.clone!=='function'||
       typeof obj.material.color?.setRGB!=='function')return unavailable('target-material');
    const faces=splitFaces(geo);
    if(!faces)return unavailable('target-topology');
    targets.push({obj,geometry:geo,material:obj.material,faces});
  }
  if(targets.length!==2||targets[0].obj===targets[1].obj)return unavailable('roster');
  let enabled=false,clones=[];
  function disable(){
    if(!enabled)return true;
    targets.forEach((t,i)=>{
      t.obj.geometry=t.geometry;t.obj.material=t.material;
      clones[i]?.geometry?.dispose?.();clones[i]?.innerMaterial?.dispose?.();
    });
    clones=[];enabled=false;return true;
  }
  function setEnabled(next){
    if(!next)return disable();
    if(enabled)return true;
    const made=[];
    try{
      for(const t of targets){
        const geometry=t.geometry.clone();
        geometry.setIndex([...t.faces.dark,...t.faces.inner]);
        geometry.clearGroups();
        geometry.addGroup(0,240,0);
        geometry.addGroup(240,48,1);
        const innerMaterial=t.material.clone();
        innerMaterial.color.setRGB(.78,.80,.76);
        innerMaterial.needsUpdate=true;
        made.push({geometry,innerMaterial});
      }
    }catch{
      made.forEach(p=>{p.geometry?.dispose?.();p.innerMaterial?.dispose?.();});
      return false;
    }
    targets.forEach((t,i)=>{
      t.obj.geometry=made[i].geometry;
      t.obj.material=[t.material,made[i].innerMaterial];
    });
    clones=made;enabled=true;return true;
  }
  return {available:true,reason:null,count:2,get enabled(){return enabled;},setEnabled,
    dispose(){disable();}};
}
