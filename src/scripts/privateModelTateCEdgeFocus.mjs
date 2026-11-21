/** Source-locked, presentation-only edge emphasis for the owner's C review.
 * Never changes GLB nodes, layer state, material provenance, or sourceLinks.
 */
export const TATE_C_R22_SOURCE_SHA256 = '20beae53cd85b87beffc7afea8f22494b4c15eec8ddaf07eeca9bf5455ef8533';
export const TATE_C_R22_SCENE = 686;
export const TATE_C_OPACITY = Object.freeze({ normal: 0.20, focused: 0.72 });

// D1F KPH/WC source scene review region, GLB Y-up in metres; NOT an as-built room survey.
const roi = Object.freeze({ x: [3.75, 6.32], y: [-0.06, 2.50], z: [-5.08, -1.85] });
// Only structural and large furniture contours; never tile seams, pipes or wiring.
const roleNames = Object.freeze([
  'C80R2_V8_D1F_UNIFIED_INTERIOR_WALLS_',
  'C80R2_V7_D1F_KPH_BEDROOM_CORRIDOR_DOOR_FRAME_',
  'C80R2_V7_D1F_KPH_BEDROOM_CORRIDOR_DOOR_LEAF_',
  'HI08_R1_DOOR__',
  'K18_PHYSICAL_PREVIEW__R989_FLOOR_INTEGRATION_DERIVED_CLONE_2897_',
  'K18_PHYSICAL_PREVIEW__R989_FLOOR_INTEGRATION_DERIVED_CLONE_2895_',
  'K11_XMIRROR_R989_FLOOR_INTEGRATION_DERIVED_CLONE_2960_',
  'K11_XMIRROR_KPH09_NORDIC3_3530_NORDIC3_3530_BOWL_CERAMIC',
]);
export function isTateCSource({sha,sceneIndex,technicalReview=false}={}){
 return technicalReview===true && sha===TATE_C_R22_SOURCE_SHA256 && sceneIndex===TATE_C_R22_SCENE;
}
export function isTateCFocusedContour({sha,sceneIndex,technicalReview=false,midpoint,ownerNames}={}){
 if(!isTateCSource({sha,sceneIndex,technicalReview})||!midpoint||!Array.isArray(ownerNames))return false;
 if(!['x','y','z'].every(axis=>Number.isFinite(midpoint[axis]) &&
   midpoint[axis]>=roi[axis][0] && midpoint[axis]<=roi[axis][1]))return false;
 return ownerNames.some(name=>typeof name==='string'&&roleNames.some(prefix=>name.startsWith(prefix)));
}
