/**
 * Source-independent screen math for the Ylisrinne D-viewer mobile camera.
 * Screen coordinates are CSS pixels relative to the WebGL canvas (not window).
 * Does not alter geometry, transform matrices or any scene membership.
 */
export function selectUnobstructedRect(width, height, obstacles, minFraction = 0.27) {
  if (!(width > 0 && height > 0)) throw new Error('SAFE_VIEWPORT_INVALID');
  const boxes = obstacles.map(b => ({
    left: Math.max(0, Math.min(width, b.left)),
    top: Math.max(0, Math.min(height, b.top)),
    right: Math.max(0, Math.min(width, b.right)),
    bottom: Math.max(0, Math.min(height, b.bottom)),
  })).filter(b => b.left < b.right && b.top < b.bottom);
  const xs = [...new Set([0, width, ...boxes.flatMap(b => [b.left, b.right])])].sort((a, b) => a - b);
  const ys = [...new Set([0, height, ...boxes.flatMap(b => [b.top, b.bottom])])].sort((a, b) => a - b);
  let best = null;
  for (let i = 0; i < xs.length; i++) for (let j = i + 1; j < xs.length; j++) {
    const x = xs[i], w = xs[j] - x;
    if (w < Math.min(width * minFraction, 180)) continue;
    for (let k = 0; k < ys.length; k++) for (let l = k + 1; l < ys.length; l++) {
      const y = ys[k], h = ys[l] - y;
      if (h < Math.min(height *minFraction, 120)) continue;
      if (boxes.some(b => b.left < x + w - .01 && b.right > x + .01 && b.top < y + h - .01 && b.bottom > y + .01)) continue;
      const area = w * h;
      if (!best || area > best.width * best.height) best = { x, y, width: w, height: h };
    }
  }
  return best; // fail closed: null means HUD leaves no safe rendering rectangle
}

export function solvePerspectiveSafeFit({width,height,safeRect,bounds,target,orbit,fovDeg,zoomRatio=1}) {
  if (!safeRect || !(width > 0 && height > 0 && fovDeg > 0 && fovDeg < 150))
    throw new Error('CAMERA_SAFE_RECT_INVALID');
  const mag = Math.hypot(orbit.x, orbit.y, orbit.z);
  if (mag < 1e-6) throw new Error('CAMERA_ORBIT_INVALID');
  const forward = { x: orbit.x / mag, y: orbit.y / mag, z: orbit.z / mag };
  // Consistent with camera.up=(0,1,0), camera looking toward controls.target.
  let right = { x: forward.z, y: 0, z: -forward.x };
  let m = Math.hypot(right.x, right.z);
  if (m < 1e-7) { right = { x: 1, y: 0, z: 0 }; m = 1; }
  right = { x: right.x/m, y:0, z:right.z/m };
  const up = {
    x: forward.y * right.z - forward.z * right.y,
    y: forward.z * right.x - forward.x * right.z,
    z: forward.x * right.y - forward.y * right.x,
  };
  const fovY = Math.tan(fovDeg * Math.PI / 360);
  const fovX = fovY * width / height;
  const margin = Math.min(safeRect.width,safeRect.height) * .08;
  const hx = safeRect.width/2-margin, hy = safeRect.height/2-margin;
  if (!(hx>0 && hy>0)) throw new Error('CAMERA_SAFE_RECT_TOO_SMALL');
  let required = .1;
  const dots = [];
  for (const x of [bounds.min.x,bounds.max.x])
    for (const y of [bounds.min.y,bounds.max.y])
      for (const z of [bounds.min.z,bounds.max.z]) {
        const p={x:x-target.x,y:y-target.y,z:z-target.z};
        const dot = (a,b) => a.x*b.x+a.y*b.y+a.z*b.z;
        const depth = dot(p,forward);
        const vx = dot(p,right), vy=dot(p,up);
        dots.push({depth,vx,vy});
        required = Math.max(required,depth + Math.abs(vx)*width/(2*fovX*hx),depth+Math.abs(vy)*height/(2*fovY*hy));
      }
  const baseDistance = required * 1.015;
  const distance = baseDistance * Math.max(0.05,Number.isFinite(zoomRatio)?zoomRatio:1);
  const offsetX = width/2-(safeRect.x+safeRect.width/2);
  const offsetY = height/2-(safeRect.y+safeRect.height/2);
  const projected = dots.map(({depth,vx,vy}) => {
    const z=distance-depth;
    return {x: width/2-offsetX+(vx/z)*width/(2*fovX),
            y:height/2-offsetY-(vy/z)*height/(2*fovY),front:z>.001};
  });
  const covered = projected.every(p=>p.front&&p.x>=safeRect.x+margin-.2&&
    p.x<=safeRect.x+safeRect.width-margin+.2&&p.y>=safeRect.y+margin-.2&&
    p.y<=safeRect.y+safeRect.height-margin+.2);
  return {distance,baseDistance,offsetX,offsetY,projected,covered,margin,zoomRatio:distance/baseDistance};
}
