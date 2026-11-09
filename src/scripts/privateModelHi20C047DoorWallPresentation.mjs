import { createHi20C029SideWallsPresentation } from './privateModelHi20C029SideWallsPresentation.mjs';

// C80-047: owner-approved 100 mm DISPLAY_ONLY storage door wall (31.10.2026).
// Exact HI20 52-scene COW. Preserve external X=2.337, the original door opening,
// all source links, both scenes, and noncurrent HOST_HOLD limitations.
export const C047_SOURCE_SHA='15a13623be601b1cbc70aaced46e497146d50894da9a3a54b4c47b438b4acee9';
const TARGETS=[
  {scene:50,node:6345,name:'C80_047_D1F_STORAGE_EAST_DOORWALL_DIMENSIONAL_DISPLAY_ONLY_WORK_TEST_HOST_HOLD'},
  {scene:51,node:6396,name:'C80_047_D1F_STORAGE_EAST_DOORWALL_DIMENSIONAL_DISPLAY_ONLY_WORK_TEST_HOST_HOLD_INDEPENDENT_BOTH'},
];
const unavailable=reason=>({available:false,reason,count:0,enabled:false,setEnabled:()=>false,dispose:()=>{}});
const near=(a,b,t=0.00015)=>Math.abs(a-b)<=t;
export function createHi20C047DoorWallPresentation(gltf,sha) {
  if(sha!==C047_SOURCE_SHA || gltf?.scenes?.length!==52 ||
     gltf?.parser?.json?.scenes?.length!==52) return unavailable('sha-or-scenes');
  const json=gltf.parser.json, associations=gltf.parser.associations;
  if(typeof associations?.get!=='function') return unavailable('associations');
  if(json.meshes?.[1820]?.name!=='C80_047_D1F_STORAGE_EAST_DOORWALL_60MM_DISPLAY_EXTRUSION_ONLY' ||
     json.meshes[1820].primitives?.length!==1 ||
     json.meshes[1820].primitives[0].material!==333)
    return unavailable('source-mesh');
  const targets=[];
  for(const t of TARGETS) {
    const scene=gltf.scenes[t.scene], root=json.nodes?.[t.node];
    if(root?.mesh!==1820 || root.name!==t.name ||
       root.extras?.stage!=='WORK_TEST' ||
       root.extras?.physicalHost!=='HOST_HOLD' ||
       root.extras?.representationKind!=='DISPLAY_VOLUME_NOT_PHYSICAL_STRUCTURE' ||
       root.extras?.asBuilt!==false || root.extras?.current!==false ||
       !Array.isArray(root.extras?.sourceLinks) || root.extras.sourceLinks.length!==2)
      return unavailable('source-node');
    const found=scene?.children?.filter(obj=>obj?.isMesh===true &&
      obj.name===t.name && associations.get(obj)?.nodes===t.node);
    if(found?.length!==1) return unavailable('scene-node');
    const obj=found[0], geo=obj.geometry, attr=geo?.getAttribute?.('position');
    if(!attr || attr.count!==84 || typeof attr.getX!=='function' ||
       typeof attr.setX!=='function' || typeof geo.clone!=='function')
      return unavailable('position-accessor');
    let inner=0,outer=0;
    for(let i=0;i<attr.count;i++) {
      const x=attr.getX(i);
      if(near(x,2.277)) inner++;
      else if(near(x,2.337)) outer++;
      else return unavailable('unexpected-wall-x');
    }
    if(inner!==42 || outer!==42) return unavailable('wall-face-count');
    geo.computeBoundingBox?.();
    const b=geo.boundingBox;
    if(!b || !near(b.min.x,2.277) || !near(b.max.x,2.337) ||
       !near(b.min.y,0) || !near(b.max.y,2.76) ||
       !near(b.min.z,-10.81) || !near(b.max.z,-8.928))
      return unavailable('wall-bounds');
    targets.push({obj,original:geo});
  }
  // C80-029 WEST+NORTH original source planes, DISPLAY_ONLY 60mm helper.
  // This remains independent of the C047 100mm door wall.
  const sideWalls=createHi20C029SideWallsPresentation(gltf,sha);
  let enabled=false, clones=[];
  function setEnabled(next) {
    const want=Boolean(next);
    if(want===enabled) return true;
    if(!want) {
      targets.forEach((t,i)=>{t.obj.geometry=t.original;clones[i]?.dispose?.();});
      clones=[]; enabled=false;
      if(sideWalls.available) sideWalls.setEnabled(false);
      return true;
    }
    const made=[];
    try {
      for(const t of targets) {
        const g=t.original.clone(),p=g.getAttribute('position');
        for(let i=0;i<p.count;i++) {
          const x=p.getX(i);
          if(near(x,2.277)) p.setX(i,x-0.04);
        }
        p.needsUpdate=true;
        g.computeBoundingBox?.();g.computeBoundingSphere?.();
        if(!g.boundingBox || !near(g.boundingBox.min.x,2.237) ||
           !near(g.boundingBox.max.x,2.337)) throw new Error('clone-bounds');
        made.push(g);
      }
    } catch {
      made.forEach(g=>g.dispose?.());return false;
    }
    targets.forEach((t,i)=>{t.obj.geometry=made[i];});
    clones=made;enabled=true;
    if(sideWalls.available) sideWalls.setEnabled(true);
    return true;
  }
  return {available:true,reason:null,count:2,get enabled(){return enabled;},
    get c029SideWallsAvailable(){return sideWalls.available;},
    get c029SideWallsEnabled(){return sideWalls.enabled;},
    setEnabled,dispose(){setEnabled(false);sideWalls.dispose();}};
}
