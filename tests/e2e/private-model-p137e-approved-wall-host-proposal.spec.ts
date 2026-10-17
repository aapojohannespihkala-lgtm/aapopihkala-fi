import { test, expect } from '@playwright/test';
// @ts-ignore - portable native ESM helper, no TypeScript declaration.
import { proposeP137EApprovedWallHost } from '../../src/scripts/privateModelP137EApprovedWallHostProposal.mjs';

const point = (x=2,y=1,z=0)=>({
  sourceCoordinateSystem:'YLIS-G1-LOCAL',
  coordinateMethod:'RAY_TO_EXPLICIT_SOURCE_FLOOR_WITH_RIGID_INVERSE',
  transformProvenance:'CALLER_VERIFIED_SOURCE_MATRIX',
  presentationOnly:true,physicalDevicePositionVerified:false,
  humanReview:'NOT_RUN',
  sourceXMetres:x,sourceYMetres:y,sourceFloorZMetres:z,
});
const wall=(id='W1',startXMetres=0,startYMetres=0,endXMetres=4,endYMetres=0)=>({
  id,hostStorey:'D_1F',sourceCoordinateSystem:'YLIS-G1-LOCAL',
  reviewStatus:'HUMAN_REVIEW_PASS_SCOPED',
  verifiedForPlacementContext:true,
  openingsComplete:true,
  openings:[] as Array<{startM:number,endM:number}>,
  floorZMetres:0,startXMetres,startYMetres,endXMetres,endYMetres,
});
const propose=(extra:any={})=>proposeP137EApprovedWallHost({
  pointerReadout:point(),floor:'D1F',reviewedWallSegments:[wall()],
  maxSnapDistanceMetres:1.5,sideDeadbandMetres:0.02,...extra,
});

test('single reviewed source wall is only a mathematical proposal with no promotion',()=>{
  const result=propose();
  expect(result.status).toBe('SINGLE_APPROVED_WALL_HOST_PROPOSAL_ONLY');
  expect(result.wallHostSuggestedNotConfirmed).toBe(true);
  expect(result.candidates).toHaveLength(1);
  expect(result.candidates[0].nearestSourceXMetres).toBe(2);
  expect(result.candidates[0].nearestSourceYMetres).toBe(0);
  expect(result.candidates[0].distanceMetres).toBe(1);
  expect(result.candidates[0].sideSuggestion).toBe('LEFT_OF_ORIENTED_SOURCE_SEGMENT');
  expect(result.physicalWallSideVerified).toBe(false);
  expect(result.physicalInstallationVerified).toBe(false);
  expect(result.current).toBe(false);
  expect(result.canonical).toBe(false);
  expect(result.asBuilt).toBe(false);
  expect(result.humanReview).toBe('NOT_RUN');
});
test('unapproved host rejects rather than inheriting physical approval',()=>{
  expect(()=>propose({reviewedWallSegments:[{...wall(),reviewStatus:'NOT_REVIEWED'}]}))
    .toThrow('P137E_APPROVED_WALL_HOST_REJECTED');
});
test('other floor and mismatched explicit elevation reject',()=>{
  expect(()=>propose({reviewedWallSegments:[{...wall(),hostStorey:'D_2F'}]}))
    .toThrow('P137E_APPROVED_WALL_HOST_REJECTED');
  expect(()=>propose({reviewedWallSegments:[{...wall(),floorZMetres:0.5}]}))
    .toThrow('P137E_APPROVED_WALL_HOST_REJECTED');
});
test('equally eligible intersection walls remain unresolved with both IDs',()=>{
  const result=propose({pointerReadout:point(2,0.5),
    reviewedWallSegments:[wall('W1'),wall('W2',2,-1,2,2)]});
  expect(result.status).toBe('UNRESOLVED_AMBIGUOUS_WALL_HOST');
  expect(result.candidates).toHaveLength(2);
  expect(result.wallHostSuggestedNotConfirmed).toBe(false);
});
test('out-of-tolerance pointer has no invented host',()=>{
  const result=propose({pointerReadout:point(2,3)});
  expect(result.status).toBe('UNRESOLVED_NO_APPROVED_WALL_IN_TOLERANCE');
  expect(result.candidates).toHaveLength(0);
});
test('oriented source side is only suggested and zero deadband is unresolved',()=>{
  const other=propose({pointerReadout:point(2,-1)});
  expect(other.candidates[0].sideSuggestion).toBe('RIGHT_OF_ORIENTED_SOURCE_SEGMENT');
  const line=propose({pointerReadout:point(2,0)});
  expect(line.candidates[0].sideSuggestion).toBe('UNDETERMINED_ON_SOURCE_LINE');
});

test('verified source opening blocks host even when its wall would otherwise be nearest',()=>{
  const r=propose({pointerReadout:point(2,0.25),
    reviewedWallSegments:[{...wall(),openings:[{startM:1,endM:3}]}]});
  expect(r.status).toBe('UNRESOLVED_SOURCE_WALL_OPENING');
  expect(r.openingOverlapDetected).toBe(true);
  expect(r.candidates).toHaveLength(0);
  expect(r.wallHostSuggestedNotConfirmed).toBe(false);
  expect(r.humanReview).toBe('NOT_RUN');
});

test('opening boundary and a nearby different approved host never silently override the opening',()=>{
  const opened={...wall(),openings:[{startM:1,endM:3}]};
  for (const x of [1,3]) {
    const r=propose({pointerReadout:point(x,0.1),
      reviewedWallSegments:[opened]});
    expect(r.status).toBe('UNRESOLVED_SOURCE_WALL_OPENING');
  }
  const r=propose({pointerReadout:point(2,0.1),
    reviewedWallSegments:[opened,wall('W2',2,-1,2,2)]});
  expect(r.status).toBe('UNRESOLVED_SOURCE_WALL_OPENING');
  expect(r.wallHostSuggestedNotConfirmed).toBe(false);
  expect(r.candidates).toHaveLength(0);
});

test('known complete opening away from pointer still permits source-only wall suggestion',()=>{
  const r=propose({pointerReadout:point(0.5,0.1),
    reviewedWallSegments:[{...wall(),openings:[{startM:2,endM:3}]}]});
  expect(r.status).toBe('SINGLE_APPROVED_WALL_HOST_PROPOSAL_ONLY');
  expect(r.openingOverlapDetected).toBe(false);
  expect(r.candidates[0].wallId).toBe('W1');
});

test('unknown, malformed and overlapping opening evidence fails closed',()=>{
  const baseline=wall();
  const invalid=[
    {...baseline,openingsComplete:false},
    {...baseline,openings:undefined},
    {...baseline,openings:[{startM:1,endM:5}]},
    {...baseline,openings:[{startM:-1,endM:1}]},
    {...baseline,openings:[{startM:2,endM:1}]},
    {...baseline,openings:[{startM:1,endM:2},{startM:1.5,endM:2.5}]},
  ];
  for(const suspect of invalid) {
    expect(()=>propose({reviewedWallSegments:[suspect]}))
      .toThrow('P137E_APPROVED_WALL_HOST_REJECTED');
  }
});
test('explicit source proof and tolerances are mandatory',()=>{
  expect(()=>propose({pointerReadout:{...point(),transformProvenance:'GUESSED'}}))
    .toThrow('P137E_APPROVED_WALL_HOST_REJECTED');
  expect(()=>propose({maxSnapDistanceMetres:undefined}))
    .toThrow('P137E_APPROVED_WALL_HOST_REJECTED');
  expect(()=>propose({reviewedWallSegments:[wall('DUP'),wall('DUP')]}))
    .toThrow('P137E_APPROVED_WALL_HOST_REJECTED');
});
