/**
 * Fail-closed model lineage check between two authenticated, immutable raw
 * Z2 and R1125 WORK_TEST GLBs. Nothing here establishes physical pipe facts.
 */
import {isDeepStrictEqual} from 'node:util';
import {inspectRawIdentity,SOURCES} from './privateModelM5AZ2R1125BridgeCli.mjs';

const Z2_SCENE='M5A-Z2 ABSOLUTE-Z HOST-FLOOR DATUM WORK_TEST - BABYLON Y-UP';
const Z2_ROOT='M5A-Z2_ABSOLUTE_Z_HOST_FLOOR_DATUM_DRAIN_TOPOLOGY_WORK_ROOT_BABYLON_Y_UP';
const R_SCENE='M5A-R1125 FIVE SALAOJA D100 + TWO UNKNOWN PVK DIAMETERS WORK_TEST - BABYLON Y-UP';
const R_ROOT='M5A_R1125_DIAMETER_SOURCE_SPLIT_WORK_TEST_ROOT_BABYLON_Y_UP';
const FIVE=new Set(['PVK_SOK1','PVK_SOK3','SOK1_SOK2','SOK3_BUILDING_END','SOK2_BUILDING_END']);
const TWO=new Set(['PVK_DISCHARGE','PVK_PARKING']);
const WELLS=new Set(['PVK','SOK1','SOK2','SOK3']);
const SOURCE_FIELDS=['scenes','nodes','meshes','accessors','bufferViews','materials'];
const NO_PROMOTION=['Canonical','physicalRouteClaim','exactXYClaim','exactZClaim','physicalElevationClaim','currentGeometryClaim','asBuiltClaim','publishToCURRENT'];
const fail=(x)=>{throw new Error('M5A_SOURCE_LINEAGE: '+x);};
const gate=(ok,x)=>{if(!ok)fail(x);};
const exactSet=(found,expected)=>found.size===expected.size&&[...found].every(x=>expected.has(x));

export function readAuthenticatedGlb(raw,identity){
  inspectRawIdentity(raw,identity);
  const jsonLength=raw.readUInt32LE(12),at=20+jsonLength;
  return {
    doc:JSON.parse(raw.toString('utf8',20,at)),
    bin:raw.subarray(at+8),
  };
}

/**
 * Pure parser-layer guard, usable in synthetic CI tests without private GLBs.
 * Does NOT authenticate sources by itself. The exported raw wrapper does.
 */
export function assertSourcePrefix(z2,r1125){
  for(const field of SOURCE_FIELDS){
    const old=z2.doc[field],newer=r1125.doc[field];
    gate(Array.isArray(old)&&Array.isArray(newer)&&newer.length>=old.length,field+' source length');
    for(let i=0;i<old.length;i++)gate(isDeepStrictEqual(old[i],newer[i]),field+' source prefix drift '+i);
  }
  gate(Buffer.isBuffer(z2.bin)&&Buffer.isBuffer(r1125.bin)&&
    r1125.bin.length>=z2.bin.length&&
    r1125.bin.subarray(0,z2.bin.length).equals(z2.bin),'source binary prefix drift');
}

export function inspectParsedSemantics(z2,r1125){
  const z=z2.doc,r=r1125.doc;
  const zi=z.scenes.findIndex(s=>s.name===Z2_SCENE);
  gate(zi===59&&r.scenes[zi]?.name===Z2_SCENE,'Z2 scene lineage');
  const zRoot=z.nodes.find(x=>x.name===Z2_ROOT);
  gate(zRoot&&zRoot.children?.length===13,'original Z2 root 13 targets');
  const zRoutes=new Set(zRoot.children.map(i=>z.nodes[i]?.extras?.sourceConnection).filter(Boolean));
  gate(exactSet(zRoutes,new Set([...FIVE,...TWO])),'original Z2 seven route identities');
  const scene=r.scenes[63];
  gate(scene?.name===R_SCENE,'R1125 exact scene index/name');
  gate(scene.extras?.sourceDiameterCorrectionContract==='G2_R1125'&&
    scene.extras?.sourceDiameterClassBreakdown==='5_SALAOJA_AGGREGATE_NOMINAL_100MM__2_PVK_UNKNOWN'&&
    scene.extras?.physicalRouteDiameterMeasuredClaim===false&&
    scene.extras?.currentGeometryClaim===false&&
    scene.extras?.publishToCURRENT===false,'R1125 source-only scene classification');
  const roots=scene.nodes?.filter(i=>r.nodes[i]?.name===R_ROOT)??[];
  gate(roots.length===1,'R1125 unique scene root');
  const root=r.nodes[roots[0]],e=root.extras??{};
  gate(root.children?.length===13&&new Set(root.children).size===13,'R1125 thirteen unique targets');
  gate(e.sourceDiameterCorrectionContract==='G2_R1125'&&
    e.diameterSourceBreakdown==='5_SALAOJA_SYSTEM_NOMINAL_D100_PLUS_2_PVK_DIAMETER_UNKNOWN'&&
    e.sourceMetadataOnlySuccessor===true&&e.originalGeometryByteMutation===false&&
    e.Canonical===false&&e.currentGeometryClaim===false&&
    e.asBuiltClaim===false&&e.publishToCURRENT===false&&
    e.humanReview==='NOT_RUN','R1125 root no-promotion stage');
  const wells=new Set(),routes=new Set(),boundaries=new Set();
  for(const index of root.children){
    const node=r.nodes[index];gate(node&&node.extras,'missing source child');
    const x=node.extras,kind=x.representationKind;
    for(const k of NO_PROMOTION)gate(x[k]===false,'no-promotion '+kind+' '+k);
    if(kind==='wellDiameterPresentationWork'){
      const name=x.sourceNodeId;
      gate(WELLS.has(name)&&!wells.has(name)&&
        x.perWellMaterialDiameterClaim===false&&x.individualWellDiameterStatus==='UNRESOLVED'&&
        x.groundSurfaceReferencePhysicalClaim===false,'well identity/unknown diameter');
      wells.add(name);
    }else if(kind==='pipeDiameterPresentationWork'){
      const name=x.sourceConnection;
      gate(zRoutes.has(name)&&!routes.has(name)&&
        x.G2IdCandidate==='G2_DRAIN_LINK_'+name+'_001'&&
        x.sourceDiameterCorrectionContract==='G2_R1125'&&
        x.presentationDiameterMm===100&&
        x.presentationDiameterRole==='WORK_TEST_VISUAL_PROXY'&&
        x.physicalDiameterPerRouteSourceVerified===false&&
        x.diameterIsPhysicalAsBuiltClaim===false&&
        x.physicalDiameterAsBuiltClaim===false&&
        x.pipeCenterlineExactClaim===false&&
        x.externalNetworkConnectionClaim===false,'pipe proxy/no physical claim');
      if(FIVE.has(name)){
        gate(x.pipeDiameterMmSource===100&&x.pipeDiameterMmNominalSource===100&&
          x.pipeDiameterMmSourceScope==='AGGREGATE_SALAOJA_SYSTEM_NOT_INDIVIDUAL_ROUTE'&&
          x.physicalNominalDiameterStatus==='GENERAL_SALAOJA_SYSTEM_NOMINAL_CLASS_NOT_PER_BRANCH_MEASUREMENT',
          'five aggregate D100 sources');
      }else{
        gate(TWO.has(name)&&x.pipeDiameterMmSource==null&&x.pipeDiameterMmNominalSource==null&&
          x.physicalNominalDiameterStatus==='UNKNOWN'&&
          x.pipeDiameterSourceRole==='PVK_SOURCE_DIAMETER_UNKNOWN_PRESENTATION_D100'&&
          x.terminatesAtUnresolvedBoundary===true&&x.unresolvedBoundaryRole===name,
          'two PVK branches must remain unknown');
      }
      routes.add(name);
    }else if(kind==='unresolvedBoundaryMarker'){
      const name=x.boundaryRole;
      gate(TWO.has(name)&&!boundaries.has(name)&&
        x.boundaryStatus==='UNRESOLVED_BOUNDARY'&&
        x.sourceBoundaryUnresolved===true&&
        x.externalNetworkConnectionClaim===false,'unresolved boundary');
      boundaries.add(name);
    }else fail('unexpected representation kind');
  }
  gate(exactSet(wells,WELLS)&&exactSet(routes,zRoutes)&&exactSet(boundaries,TWO),
    '4 wells + 7 routes + 2 unresolved boundaries');
  return {status:'PARSED_SOURCE_MODEL_LINEAGE_ONLY',originalSourceBytesAuthenticated:false,
    sourceSceneIndex:zi,reviewSceneIndex:63,
    sourceCounts:{scenes:z.scenes.length,nodes:z.nodes.length},
    targets:{wells:wells.size,routes:routes.size,unresolvedBoundaries:boundaries.size},
    nominalD100SystemRoutes:[...FIVE].sort(),
    unknownPvkPhysicalDiameterRoutes:[...TWO].sort(),
    physicalConnectionsVerified:false,physicalPipeDiameterPerRouteVerified:false,
    physicalElevationsVerified:false,productionVerified:false,humanReviewNotAssessed:true,
    current:false,canonical:false,asBuilt:false};
}

export function inspectRawBridge(z2Raw,r1125Raw){
  const z2=readAuthenticatedGlb(z2Raw,SOURCES.z2);
  const r1125=readAuthenticatedGlb(r1125Raw,SOURCES.r1125);
  assertSourcePrefix(z2,r1125);
  const result=inspectParsedSemantics(z2,r1125);
  return {...result,status:'PASS_AUTHENTICATED_RAW_SOURCE_MODEL_LINEAGE_ONLY',
    originalSourceBytesAuthenticated:true,sourceZ2:SOURCES.z2,sourceR1125:SOURCES.r1125};
}
