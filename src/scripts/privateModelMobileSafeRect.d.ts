export type ScreenRect = {x:number;y:number;width:number;height:number};
export type BlockerRect = {left:number;top:number;right:number;bottom:number};
export type Vec3 = {x:number;y:number;z:number};
export function selectUnobstructedRect(width:number,height:number, obstacles:BlockerRect[],minFraction?:number):ScreenRect|null;
export function solvePerspectiveSafeFit(input:{width:number;height:number;safeRect:ScreenRect;bounds:{min:Vec3;max:Vec3};target:Vec3;orbit:Vec3;fovDeg:number;zoomRatio?:number}): {distance:number;baseDistance:number;offsetX:number;offsetY:number;projected:{x:number;y:number;front:boolean}[];covered:boolean;margin:number;zoomRatio:number};
