/**
 * P137E placement review: suggest a single, source-bound wall host for an
 * already computed YLIS-G1-LOCAL pointer readout. Never infer an installation,
 * accept unreviewed walls or silently choose among competing hosts.
 *
 * This is an offline proposal helper, not a G2 write, viewer release,
 * HUMAN_REVIEW result, or physical/as-built/CURRENT assertion.
 */
const fail = reason => { throw new Error('P137E_APPROVED_WALL_HOST_REJECTED:' + reason); };
const finite = x => typeof x === 'number' && Number.isFinite(x);
const floorTokens = Object.freeze({ D1F:'D_1F', D2F:'D_2F' });
const sourcePoint = readout => readout &&
  readout.sourceCoordinateSystem === 'YLIS-G1-LOCAL' &&
  readout.coordinateMethod === 'RAY_TO_EXPLICIT_SOURCE_FLOOR_WITH_RIGID_INVERSE' &&
  readout.transformProvenance === 'CALLER_VERIFIED_SOURCE_MATRIX' &&
  readout.presentationOnly === true &&
  readout.physicalDevicePositionVerified === false &&
  readout.humanReview === 'NOT_RUN' &&
  [readout.sourceXMetres,readout.sourceYMetres,readout.sourceFloorZMetres].every(finite);

const noPromotion = Object.freeze({
  presentationOnly:true,
  physicalDevicePositionVerified:false,
  physicalWallSideVerified:false,
  physicalInstallationVerified:false,
  current:false,canonical:false,asBuilt:false,publishToCURRENT:false,
  humanReview:'NOT_RUN',
});

/**
 * The caller must pass a caller-verified wall list for one floor only.
 * Segment direction is source-defined; LEFT/RIGHT are mathematical suggestions,
 * not interior/exterior or installer-facing designations.
 * Every wall must also declare an explicitly complete opening list. Opening
 * startM/endM are distances in metres along its oriented source segment.
 */
export function proposeP137EApprovedWallHost({
  pointerReadout, floor, reviewedWallSegments,
  maxSnapDistanceMetres, sideDeadbandMetres,
}={}) {
  if (!Object.hasOwn(floorTokens,floor) || !sourcePoint(pointerReadout) ||
      !Array.isArray(reviewedWallSegments) || reviewedWallSegments.length<1 ||
      reviewedWallSegments.length>500 ||
      !finite(maxSnapDistanceMetres) || maxSnapDistanceMetres<=0 ||
      maxSnapDistanceMetres>5 ||
      !finite(sideDeadbandMetres) || sideDeadbandMetres<0 ||
      sideDeadbandMetres>=maxSnapDistanceMetres) {
    fail('explicit validated floor, source pointer, reviewed walls and tolerances required');
  }
  const ids=new Set();
  const {sourceXMetres:px,sourceYMetres:py,sourceFloorZMetres:pz}=pointerReadout;
  const candidates=[];
  let openingOverlapDetected=false;
  for(const w of reviewedWallSegments) {
    if(!w || typeof w.id!=='string' ||
        !/^[A-Za-z0-9_.:-]{2,128}$/.test(w.id) || ids.has(w.id) ||
        w.hostStorey!==floorTokens[floor] ||
        w.sourceCoordinateSystem!=='YLIS-G1-LOCAL' ||
        w.reviewStatus!=='HUMAN_REVIEW_PASS_SCOPED' ||
        w.verifiedForPlacementContext!==true ||
        [w.startXMetres,w.startYMetres,w.endXMetres,w.endYMetres,w.floorZMetres].some(x=>!finite(x)) ||
        Math.abs(w.floorZMetres-pz)>1e-6) {
      fail('ambiguous, unreviewed, opposite-floor or source-mismatched wall');
    }
    ids.add(w.id);
    const dx=w.endXMetres-w.startXMetres,dy=w.endYMetres-w.startYMetres;
    const lengthSquared=dx*dx+dy*dy;
    if(!finite(lengthSquared) || lengthSquared<=1e-12 || lengthSquared>250000) {
      fail('degenerate or implausible source wall segment');
    }
    const lengthMetres=Math.sqrt(lengthSquared);
    if(w.openingsComplete!==true || !Array.isArray(w.openings) ||
        w.openings.length>100 ||
        w.openings.some(o=>!o || !finite(o.startM) || !finite(o.endM) ||
          o.startM<0 || o.startM>=o.endM || o.endM>lengthMetres) ||
        w.openings.some((o,i)=>w.openings.some((other,j)=>
          i!==j && o.startM<other.endM && other.startM<o.endM))) {
      fail('unverified, out-of-span or overlapping source wall openings');
    }
    const t=Math.max(0,Math.min(1,
      ((px-w.startXMetres)*dx+(py-w.startYMetres)*dy)/lengthSquared));
    const nearestX=w.startXMetres+t*dx,nearestY=w.startYMetres+t*dy;
    const distanceMetres=Math.hypot(px-nearestX,py-nearestY);
    if(distanceMetres>maxSnapDistanceMetres) continue;
    const alongMetres=t*lengthMetres;
    if(w.openings.some(o=>alongMetres>=o.startM && alongMetres<=o.endM)) {
      openingOverlapDetected=true;
      continue;
    }
    const signedSideMetres=(dx*(py-w.startYMetres)-dy*(px-w.startXMetres))/
      Math.sqrt(lengthSquared);
    const sideSuggestion=Math.abs(signedSideMetres)<=sideDeadbandMetres
      ? 'UNDETERMINED_ON_SOURCE_LINE'
      : signedSideMetres>0
        ? 'LEFT_OF_ORIENTED_SOURCE_SEGMENT'
        : 'RIGHT_OF_ORIENTED_SOURCE_SEGMENT';
    candidates.push(Object.freeze({
      wallId:w.id,distanceMetres,nearestSourceXMetres:nearestX,
      nearestSourceYMetres:nearestY,segmentParameter:t,sideSuggestion,
    }));
  }
  candidates.sort((a,b)=>a.distanceMetres-b.distanceMetres ||
    a.wallId.localeCompare(b.wallId));
  // A nearby door opening cannot be disguised by another eligible wall.
  const status=openingOverlapDetected?'UNRESOLVED_SOURCE_WALL_OPENING'
    :candidates.length===0?'UNRESOLVED_NO_APPROVED_WALL_IN_TOLERANCE'
    :candidates.length>1?'UNRESOLVED_AMBIGUOUS_WALL_HOST'
    :'SINGLE_APPROVED_WALL_HOST_PROPOSAL_ONLY';
  return Object.freeze({
    status,floor,sourceCoordinateSystem:'YLIS-G1-LOCAL',
    sourceXMetres:px,sourceYMetres:py,sourceFloorZMetres:pz,
    maxSnapDistanceMetres,sideDeadbandMetres,
    wallHostSuggestedNotConfirmed:!openingOverlapDetected && candidates.length===1,
    openingOverlapDetected,
    candidates:Object.freeze(openingOverlapDetected?[]:candidates),
    ...noPromotion,
  });
}
