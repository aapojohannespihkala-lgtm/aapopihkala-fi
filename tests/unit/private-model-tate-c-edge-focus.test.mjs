import test from 'node:test';
import assert from 'node:assert/strict';
import {isTateCSource,isTateCFocusedContour,TATE_C_OPACITY,TATE_C_R22_SOURCE_SHA256,TATE_C_R22_SCENE} from '../../src/scripts/privateModelTateCEdgeFocus.mjs';
const auth={sha:TATE_C_R22_SOURCE_SHA256,sceneIndex:TATE_C_R22_SCENE,technicalReview:true};
const p={x:4.1,y:0.1,z:-3.1};
const focus=ownerNames=>isTateCFocusedContour({...auth,midpoint:p,ownerNames});
test('R22 scene686 technical review alone enables reversible C emphasis',()=>{
 assert.equal(isTateCSource(auth),true);
 assert.equal(isTateCSource({...auth,sha:'0'.repeat(64)}),false);
 assert.equal(isTateCSource({...auth,sceneIndex:688}),false);
 assert.equal(isTateCSource({...auth,technicalReview:false}),false);
 assert.deepEqual(TATE_C_OPACITY,{normal:.20,focused:.72});
});
test('major room contours get the strong style without elevating tile seams',()=>{
 assert.equal(focus(['C80R2_V8_D1F_UNIFIED_INTERIOR_WALLS_INCL_SAUNA_WALL_WORK_TEST_HOST_HOLD_20261101']),true);
 assert.equal(focus(['C80R2_V7_D1F_KPH_BEDROOM_CORRIDOR_DOOR_FRAME_WHITE_WORK_ASSUMPTION']),true);
 assert.equal(focus(['HI08_R1_DOOR__D6SC_KPH2360_895_SOURCE_ONLY_COW']),true);
 assert.equal(focus(['K18_PHYSICAL_PREVIEW__R989_FLOOR_INTEGRATION_DERIVED_CLONE_2897_PRESENTATION_CLONE']),true);
 assert.equal(focus(['K11_XMIRROR_KPH09_NORDIC3_3530_NORDIC3_3530_BOWL_CERAMIC']),true);
 for(const name of ['K12_KPH_FLOOR_100x100_TILE_SOURCE_GEOMETRY','K11_XMIRROR_KPH_PHOTO_LOWER_WOOD_GRAIN_BAND_01','C80_KV17_IV15_3PORT_TCOLLECTOR','R22_ELECTRICAL_WIRE',''])
  assert.equal(focus([name]),false,name);
});
test('source, coordinates and tree context fail closed',()=>{
 const name='C80R2_V8_D1F_UNIFIED_INTERIOR_WALLS_INCL_SAUNA_WALL_WORK_TEST_HOST_HOLD_20261101';
 assert.equal(isTateCFocusedContour({...auth,midpoint:{x:20,y:0,z:-3},ownerNames:[name]}),false);
 assert.equal(isTateCFocusedContour({...auth,midpoint:{x:4.1,y:NaN,z:-3},ownerNames:[name]}),false);
 assert.equal(isTateCFocusedContour({...auth,midpoint:p,ownerNames:null}),false);
 assert.equal(isTateCFocusedContour({...auth,midpoint:p,ownerNames:['K12_KPH_FLOOR',name]}),true);
 assert.equal(isTateCFocusedContour({...auth,technicalReview:false,midpoint:p,ownerNames:[name]}),false);
 assert.equal(isTateCFocusedContour({...auth,sceneIndex:687,midpoint:p,ownerNames:[name]}),false);
});
