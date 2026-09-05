type Point2 = {
  x: number;
  y: number;
};

type TerrainPoint = Point2 & {
  z: number;
};

type ProjectedPoint = Point2 & {
  scale: number;
};

type Bounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

type SurfacePoint = TerrainPoint & {
  radius: number;
  element: SVGCircleElement;
};

type ContourSegment = {
  start: TerrainPoint;
  end: TerrainPoint;
};

const svgNamespace = 'http://www.w3.org/2000/svg';

export const initializeAreaInteraction = () => {
  const readout = document.querySelector<HTMLElement>('[data-a-readout]');
  const readoutLabel = document.querySelector<HTMLElement>('[data-a-readout-label]');
  const overlay = document.querySelector<HTMLElement>('[data-area-overlay]');
  const svg = document.querySelector<SVGSVGElement>('[data-area-svg]');
  const path = document.querySelector<SVGPathElement>('[data-area-path]');
  const startMarker = document.querySelector<SVGCircleElement>('[data-area-start]');
  const pointsGroup = document.querySelector<SVGGElement>('[data-area-points]');
  const contoursPath = document.querySelector<SVGPathElement>('[data-area-contours]');
  const centroidSymbol = document.querySelector<SVGGElement>('[data-area-centroid-symbol]');
  const label = document.querySelector<HTMLElement>('[data-area-label]');
  const hint = document.querySelector<HTMLElement>('[data-area-hint]');

  if (
    !readout ||
    !readoutLabel ||
    !overlay ||
    !svg ||
    !path ||
    !startMarker ||
    !pointsGroup ||
    !contoursPath ||
    !centroidSymbol ||
    !label ||
    !hint
  ) return;

  if (overlay.dataset.areaInteractionInitialized === 'true') return;
  overlay.dataset.areaInteractionInitialized = 'true';

  let pointer: Point2 = {
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.5,
  };

  let drawingArea = false;
  let areaFinished = false;
  let areaPoints: Point2[] = [];
  let areaSourcePoints: Point2[] = [];
  let areaSurfacePoints: SurfacePoint[] = [];
  let areaContourSegments: ContourSegment[] = [];
  let measuredArea = 0;
  let areaCentroid: Point2 | null = null;

  let rotatingArea = false;
  let areaYaw = 0;
  let areaPitch = 0;
  let rotationStartPointer: Point2 | null = null;
  let rotationStartYaw = 0;
  let rotationStartPitch = 0;

  const setAreaViewBox = () => {
    svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
  };

  const polygonArea = (points: Point2[]) => {
    if (points.length < 3) return 0;

    let sum = 0;

    for (let index = 0; index < points.length; index += 1) {
      const current = points[index];
      const next = points[(index + 1) % points.length];
      sum += current.x * next.y - next.x * current.y;
    }

    return Math.abs(sum) * 0.5;
  };

  const polygonCentroid = (points: Point2[]): Point2 => {
    if (points.length < 3) {
      return points[0] ?? { x: pointer.x, y: pointer.y };
    }

    let signedArea = 0;
    let cx = 0;
    let cy = 0;

    for (let index = 0; index < points.length; index += 1) {
      const current = points[index];
      const next = points[(index + 1) % points.length];
      const factor = current.x * next.y - next.x * current.y;
      signedArea += factor;
      cx += (current.x + next.x) * factor;
      cy += (current.y + next.y) * factor;
    }

    if (Math.abs(signedArea) < 0.001) {
      const average = points.reduce(
        (result, point) => ({
          x: result.x + point.x,
          y: result.y + point.y,
        }),
        { x: 0, y: 0 }
      );

      return {
        x: average.x / points.length,
        y: average.y / points.length,
      };
    }

    return {
      x: cx / (3 * signedArea),
      y: cy / (3 * signedArea),
    };
  };

  const polygonBounds = (points: Point2[]): Bounds => {
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);

    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
    };
  };

  const pointInPolygon = (point: Point2, points: Point2[]) => {
    if (points.length < 3) return false;

    let inside = false;

    for (
      let index = 0, previousIndex = points.length - 1;
      index < points.length;
      previousIndex = index, index += 1
    ) {
      const current = points[index];
      const previous = points[previousIndex];
      const crosses =
        current.y > point.y !== previous.y > point.y &&
        point.x <
          ((previous.x - current.x) * (point.y - current.y)) /
            (previous.y - current.y || 0.00001) +
            current.x;

      if (crosses) inside = !inside;
    }

    return inside;
  };

  const distanceToSegment = (point: Point2, start: Point2, end: Point2) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    if (dx === 0 && dy === 0) {
      return Math.hypot(point.x - start.x, point.y - start.y);
    }

    const t = Math.max(
      0,
      Math.min(
        1,
        ((point.x - start.x) * dx + (point.y - start.y) * dy) /
          (dx * dx + dy * dy)
      )
    );

    const projection = {
      x: start.x + t * dx,
      y: start.y + t * dy,
    };

    return Math.hypot(point.x - projection.x, point.y - projection.y);
  };

  const distanceToPolygonEdge = (point: Point2, points: Point2[]) => {
    let minimum = Infinity;

    for (let index = 0; index < points.length; index += 1) {
      const current = points[index];
      const next = points[(index + 1) % points.length];
      minimum = Math.min(minimum, distanceToSegment(point, current, next));
    }

    return minimum;
  };

  const simplifyPoints = (points: Point2[], epsilon = 5.5): Point2[] => {
    if (points.length <= 2) return points.slice();

    const start = points[0];
    const end = points[points.length - 1];
    let farthestDistance = 0;
    let farthestIndex = -1;

    for (let index = 1; index < points.length - 1; index += 1) {
      const distance = distanceToSegment(points[index], start, end);

      if (distance > farthestDistance) {
        farthestDistance = distance;
        farthestIndex = index;
      }
    }

    if (farthestDistance <= epsilon || farthestIndex < 0) {
      return [start, end];
    }

    const firstHalf = simplifyPoints(points.slice(0, farthestIndex + 1), epsilon);
    const secondHalf = simplifyPoints(points.slice(farthestIndex), epsilon);

    return firstHalf.slice(0, -1).concat(secondHalf);
  };

  const isNearStart = (x: number, y: number) => {
    if (areaPoints.length < 8 || areaFinished) return false;
    const start = areaPoints[0];
    return Math.hypot(x - start.x, y - start.y) <= 15;
  };

  const setAreaLabel = (text: string, x: number, y: number) => {
    const estimatedWidth = 170;
    const left = Math.max(10, Math.min(window.innerWidth - estimatedWidth - 10, x));
    const top = Math.max(70, Math.min(window.innerHeight - 30, y));

    label.textContent = text;
    label.style.left = `${Math.round(left)}px`;
    label.style.top = `${Math.round(top)}px`;
    label.classList.add('is-visible');
  };

  const setAreaHint = (text: string) => {
    hint.textContent = text;
  };

  const reliefHeight = (x: number, y: number) => {
    if (!areaCentroid) return 0;

    const dx = x - areaCentroid.x;
    const dy = y - areaCentroid.y;

    return (
      Math.sin(dx * 0.020 + dy * 0.004) * 5.4 +
      Math.sin(dy * 0.026 - dx * 0.003) * 3.1 +
      Math.sin((dx + dy) * 0.012) * 2.1
    );
  };

  const deterministicJitter = (x: number, y: number, seed: number) => {
    const value = Math.sin(x * 12.9898 + y * 78.233 + seed * 37.719) * 43758.5453;
    return value - Math.floor(value) - 0.5;
  };

  const projectAreaPoint = (point: TerrainPoint): ProjectedPoint => {
    if (!areaCentroid) return { x: point.x, y: point.y, scale: 1 };

    const localX = point.x - areaCentroid.x;
    const localY = point.y - areaCentroid.y;
    const localZ = point.z ?? 0;

    const cosPitch = Math.cos(areaPitch);
    const sinPitch = Math.sin(areaPitch);
    const cosYaw = Math.cos(areaYaw);
    const sinYaw = Math.sin(areaYaw);

    const pitchedY = localY * cosPitch - localZ * sinPitch;
    const pitchedZ = localY * sinPitch + localZ * cosPitch;
    const rotatedX = localX * cosYaw + pitchedZ * sinYaw;
    const rotatedZ = -localX * sinYaw + pitchedZ * cosYaw;
    const perspectiveDistance = 700;
    const denominator = Math.max(170, perspectiveDistance + rotatedZ);
    const perspective = perspectiveDistance / denominator;

    return {
      x: areaCentroid.x + rotatedX * perspective,
      y: areaCentroid.y + pitchedY * perspective,
      scale: perspective,
    };
  };

  const clearAreaTopography = () => {
    areaSurfacePoints = [];
    areaContourSegments = [];
    pointsGroup.replaceChildren();
    contoursPath.setAttribute('d', '');
  };

  const addContourSegment = (start: Point2, end: Point2, level: number) => {
    const midpoint = {
      x: (start.x + end.x) * 0.5,
      y: (start.y + end.y) * 0.5,
    };

    if (!pointInPolygon(midpoint, areaSourcePoints)) return;

    areaContourSegments.push({
      start: { x: start.x, y: start.y, z: level },
      end: { x: end.x, y: end.y, z: level },
    });
  };

  const buildContourSegments = (bounds: Bounds, step: number) => {
    const samples: number[] = [];
    let minimum = Infinity;
    let maximum = -Infinity;

    for (let y = bounds.minY; y <= bounds.maxY + step; y += step) {
      for (let x = bounds.minX; x <= bounds.maxX + step; x += step) {
        const z = reliefHeight(x, y);
        samples.push(z);
        minimum = Math.min(minimum, z);
        maximum = Math.max(maximum, z);
      }
    }

    if (!samples.length || !Number.isFinite(minimum) || !Number.isFinite(maximum)) return;

    const levels = Array.from(
      { length: 5 },
      (_, index) => minimum + ((index + 1) / 6) * (maximum - minimum)
    );

    const interpolate = (a: TerrainPoint, b: TerrainPoint, level: number): Point2 => {
      const denominator = b.z - a.z;
      const t = Math.abs(denominator) < 0.00001 ? 0.5 : (level - a.z) / denominator;
      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
      };
    };

    const crossesLevel = (a: TerrainPoint, b: TerrainPoint, level: number) =>
      (a.z < level && b.z >= level) || (b.z < level && a.z >= level);

    for (const level of levels) {
      for (let y = bounds.minY; y < bounds.maxY; y += step) {
        for (let x = bounds.minX; x < bounds.maxX; x += step) {
          const p00 = { x, y, z: reliefHeight(x, y) };
          const p10 = { x: x + step, y, z: reliefHeight(x + step, y) };
          const p11 = { x: x + step, y: y + step, z: reliefHeight(x + step, y + step) };
          const p01 = { x, y: y + step, z: reliefHeight(x, y + step) };
          const edges: Array<[TerrainPoint, TerrainPoint]> = [
            [p00, p10],
            [p10, p11],
            [p11, p01],
            [p01, p00],
          ];
          const intersections: Point2[] = [];

          for (const [start, end] of edges) {
            if (crossesLevel(start, end, level)) {
              intersections.push(interpolate(start, end, level));
            }
          }

          if (intersections.length === 2) {
            addContourSegment(intersections[0], intersections[1], level);
          } else if (intersections.length === 4) {
            addContourSegment(intersections[0], intersections[1], level);
            addContourSegment(intersections[2], intersections[3], level);
          }
        }
      }
    }
  };

  const buildAreaTopography = () => {
    clearAreaTopography();

    if (!areaFinished || !areaCentroid || areaSourcePoints.length < 3) return;

    const bounds = polygonBounds(areaSourcePoints);
    const boundsWidth = Math.max(1, bounds.maxX - bounds.minX);
    const boundsHeight = Math.max(1, bounds.maxY - bounds.minY);
    const targetPointCount = 900;
    const pointStep = Math.max(12, Math.sqrt((boundsWidth * boundsHeight) / targetPointCount));

    let pointIndex = 0;

    for (let y = bounds.minY; y <= bounds.maxY; y += pointStep) {
      for (let x = bounds.minX; x <= bounds.maxX; x += pointStep) {
        const jittered = {
          x: x + deterministicJitter(x, y, 1) * pointStep * 0.42,
          y: y + deterministicJitter(x, y, 2) * pointStep * 0.42,
        };

        if (!pointInPolygon(jittered, areaSourcePoints)) continue;

        const z = reliefHeight(jittered.x, jittered.y);
        const edgeDistance = distanceToPolygonEdge(jittered, areaSourcePoints);
        const edge = edgeDistance <= Math.max(16, pointStep * 1.65);
        const high = z > 3.2;
        const radius = edge ? 1.55 : 1.18;
        const element = document.createElementNS(svgNamespace, 'circle');
        element.classList.add('site-area-point');
        if (edge) element.classList.add('is-edge');
        if (high) element.classList.add('is-high');
        element.dataset.areaPointIndex = String(pointIndex);
        pointsGroup.append(element);

        areaSurfacePoints.push({
          x: jittered.x,
          y: jittered.y,
          z,
          radius,
          element,
        });
        pointIndex += 1;
      }
    }

    buildContourSegments(bounds, Math.max(18, pointStep * 1.45));
  };

  const updateCentroidSymbol = () => {
    if (!areaFinished || !areaCentroid) {
      centroidSymbol.classList.remove('is-visible');
      return;
    }

    centroidSymbol.setAttribute(
      'transform',
      `translate(${areaCentroid.x} ${areaCentroid.y})`
    );
    centroidSymbol.classList.add('is-visible');
  };

  const renderAreaTopography = () => {
    if (!areaFinished) {
      contoursPath.setAttribute('d', '');
      return;
    }

    for (const point of areaSurfacePoints) {
      const projected = projectAreaPoint(point);
      point.element.setAttribute('cx', String(projected.x));
      point.element.setAttribute('cy', String(projected.y));
      point.element.setAttribute(
        'r',
        String(Math.max(0.78, Math.min(2.2, point.radius * projected.scale)))
      );
    }

    const contourPath = areaContourSegments
      .map((segment) => {
        const start = projectAreaPoint(segment.start);
        const end = projectAreaPoint(segment.end);
        return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
      })
      .join(' ');

    contoursPath.setAttribute('d', contourPath);
    updateCentroidSymbol();
  };

  const updateAreaCursorLabel = () => {
    if (readout.dataset.mode !== 'area') return;

    if (rotatingArea) {
      readoutLabel.textContent = 'AREA / ROTATE 3D';
      return;
    }

    if (drawingArea) {
      readoutLabel.textContent = isNearStart(pointer.x, pointer.y)
        ? 'AREA / JOIN'
        : 'AREA / DRAW';
      return;
    }

    if (areaFinished && pointInPolygon(pointer, areaPoints)) {
      readoutLabel.textContent = 'AREA / DRAG TO ROTATE';
      return;
    }

    readoutLabel.textContent = areaFinished
      ? 'AREA / DRAW NEW'
      : 'AREA / DRAW';
  };

  const clearAreaVisuals = () => {
    drawingArea = false;
    areaFinished = false;
    rotatingArea = false;
    areaPoints = [];
    areaSourcePoints = [];
    measuredArea = 0;
    areaCentroid = null;
    areaYaw = 0;
    areaPitch = 0;
    rotationStartPointer = null;
    path.setAttribute('d', '');
    startMarker.setAttribute('cx', '0');
    startMarker.setAttribute('cy', '0');
    startMarker.style.opacity = '0';
    centroidSymbol.classList.remove('is-visible');
    label.classList.remove('is-visible');
    label.textContent = 'AREA / DRAW';
    overlay.classList.remove('is-hovering-area', 'is-rotating-area');
    clearAreaTopography();
    setAreaHint('AREA / HOLD + DRAW');
    updateAreaCursorLabel();
  };

  const renderArea = (closed = areaFinished) => {
    if (!areaPoints.length) {
      path.setAttribute('d', '');
      startMarker.style.opacity = '0';
      updateCentroidSymbol();
      return;
    }

    const d = areaPoints
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');

    path.setAttribute('d', closed ? `${d} Z` : d);

    const start = areaPoints[0];
    startMarker.setAttribute('cx', String(start.x));
    startMarker.setAttribute('cy', String(start.y));
    startMarker.style.opacity = closed ? '0' : '0.82';
    updateCentroidSymbol();
  };

  const projectArea3D = () => {
    if (!areaFinished || !areaCentroid || !areaSourcePoints.length) return;

    areaPoints = areaSourcePoints.map((point) =>
      projectAreaPoint({ ...point, z: 0 })
    );
    renderArea(true);
    renderAreaTopography();
  };

  const updateFinishedAreaLabel = () => {
    if (!areaFinished || !areaCentroid) return;
    setAreaLabel(
      `AREA / ${Math.round(measuredArea)} px²`,
      areaCentroid.x + 14,
      areaCentroid.y - 16
    );
  };

  const startAreaDrawing = (x: number, y: number) => {
    clearAreaVisuals();
    drawingArea = true;
    areaPoints = [{ x, y }];
    renderArea(false);
    setAreaLabel('AREA / DRAW', x + 16, y + 16);
    setAreaHint('AREA / RELEASE TO CLOSE');
    updateAreaCursorLabel();
  };

  const addAreaPoint = (x: number, y: number) => {
    if (!drawingArea) return;

    const last = areaPoints[areaPoints.length - 1];
    if (!last) return;

    if (Math.hypot(x - last.x, y - last.y) >= 5) {
      areaPoints.push({ x, y });
    }

    renderArea(false);

    const nearStart = isNearStart(x, y);
    setAreaLabel(
      nearStart ? 'AREA / CLOSE' : 'AREA / DRAW',
      x + 16,
      y + 16
    );
    setAreaHint(nearStart ? 'AREA / RELEASE TO JOIN' : 'AREA / RELEASE TO CLOSE');
    updateAreaCursorLabel();
  };

  const finishAreaDrawing = (x: number, y: number, snapToStart = false) => {
    if (!drawingArea) return;

    const start = areaPoints[0];
    const endPoint = snapToStart && start
      ? { ...start }
      : { x, y };
    const last = areaPoints[areaPoints.length - 1];

    if (!last || Math.hypot(endPoint.x - last.x, endPoint.y - last.y) >= 3) {
      areaPoints.push(endPoint);
    }

    drawingArea = false;

    if (areaPoints.length < 4) {
      clearAreaVisuals();
      return;
    }

    let rawPoints = areaPoints.slice();
    const rawLast = rawPoints[rawPoints.length - 1];

    if (
      rawPoints.length > 1 &&
      Math.hypot(rawLast.x - rawPoints[0].x, rawLast.y - rawPoints[0].y) <= 1
    ) {
      rawPoints = rawPoints.slice(0, -1);
    }

    const simplified = simplifyPoints(rawPoints, 5.5);
    areaSourcePoints = simplified.length >= 3 ? simplified : rawPoints;
    measuredArea = polygonArea(areaSourcePoints);

    if (areaSourcePoints.length < 3 || measuredArea < 25) {
      clearAreaVisuals();
      return;
    }

    areaFinished = true;
    areaCentroid = polygonCentroid(areaSourcePoints);
    areaYaw = 0;
    areaPitch = 0;
    areaPoints = areaSourcePoints.map((point) => ({ ...point }));
    buildAreaTopography();
    projectArea3D();
    updateFinishedAreaLabel();
    setAreaHint('AREA / DRAG TO ROTATE TOPOGRAPHY');
    updateAreaCursorLabel();
  };

  const beginAreaRotation = (x: number, y: number) => {
    if (!areaFinished || !areaCentroid) return false;
    if (!pointInPolygon({ x, y }, areaPoints)) return false;

    rotatingArea = true;
    rotationStartPointer = { x, y };
    rotationStartYaw = areaYaw;
    rotationStartPitch = areaPitch;
    overlay.classList.add('is-rotating-area');
    setAreaHint('AREA / ROTATE TOPOGRAPHY');
    updateAreaCursorLabel();
    return true;
  };

  const rotateAreaToPointer = (x: number, y: number) => {
    if (!rotatingArea || !rotationStartPointer) return;

    const dx = x - rotationStartPointer.x;
    const dy = y - rotationStartPointer.y;

    areaYaw = rotationStartYaw + dx * 0.012;
    areaPitch = rotationStartPitch - dy * 0.012;

    projectArea3D();
    updateFinishedAreaLabel();
    setAreaHint(
      `AREA / X ${((areaPitch * 180) / Math.PI).toFixed(1)}° / Y ${((areaYaw * 180) / Math.PI).toFixed(1)}°`
    );
    updateAreaCursorLabel();
  };

  const endAreaRotation = () => {
    if (!rotatingArea) return;
    rotatingArea = false;
    rotationStartPointer = null;
    overlay.classList.remove('is-rotating-area');
    setAreaHint('AREA / DRAG TO ROTATE TOPOGRAPHY');
    updateAreaCursorLabel();
  };

  const updateAreaHover = (x: number, y: number) => {
    if (!areaFinished || drawingArea || rotatingArea) {
      overlay.classList.remove('is-hovering-area');
      updateAreaCursorLabel();
      return;
    }

    const inside = pointInPolygon({ x, y }, areaPoints);
    overlay.classList.toggle('is-hovering-area', inside);
    setAreaHint(inside ? 'AREA / DRAG TO ROTATE TOPOGRAPHY' : 'AREA / HOLD + DRAW NEW');
    updateAreaCursorLabel();
  };

  const handlePointerMove = (event: PointerEvent) => {
    pointer = {
      x: event.clientX,
      y: event.clientY,
    };

    if (readout.dataset.mode !== 'area') return;

    if (rotatingArea) {
      rotateAreaToPointer(event.clientX, event.clientY);
      return;
    }

    if (drawingArea) {
      addAreaPoint(event.clientX, event.clientY);
      return;
    }

    updateAreaHover(event.clientX, event.clientY);
  };

  const handlePointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;

    pointer = {
      x: event.clientX,
      y: event.clientY,
    };

    if (readout.dataset.mode !== 'area') return;

    event.preventDefault();
    event.stopPropagation();

    if (beginAreaRotation(event.clientX, event.clientY)) return;
    startAreaDrawing(event.clientX, event.clientY);
  };

  const handlePointerUp = (event: PointerEvent) => {
    if (event.button !== 0 || readout.dataset.mode !== 'area') return;

    if (rotatingArea) {
      event.preventDefault();
      event.stopPropagation();
      endAreaRotation();
      updateAreaHover(event.clientX, event.clientY);
      return;
    }

    if (!drawingArea) return;

    event.preventDefault();
    event.stopPropagation();
    finishAreaDrawing(
      event.clientX,
      event.clientY,
      isNearStart(event.clientX, event.clientY)
    );
    updateAreaHover(event.clientX, event.clientY);
  };

  const handlePointerCancel = () => {
    if (readout.dataset.mode !== 'area') return;

    if (rotatingArea) {
      endAreaRotation();
      return;
    }

    if (drawingArea) clearAreaVisuals();
  };

  const handleResize = () => {
    setAreaViewBox();

    if (readout.dataset.mode === 'area') clearAreaVisuals();
  };

  const syncAreaMode = () => {
    const areaModeActive = readout.dataset.mode === 'area';
    overlay.classList.toggle('is-visible', areaModeActive);
    clearAreaVisuals();
    if (areaModeActive) updateAreaCursorLabel();
  };

  const modeObserver = new MutationObserver(syncAreaMode);
  modeObserver.observe(readout, {
    attributes: true,
    attributeFilter: ['data-mode'],
  });

  const cleanup = () => {
    modeObserver.disconnect();
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerdown', handlePointerDown, true);
    window.removeEventListener('pointerup', handlePointerUp, true);
    window.removeEventListener('pointercancel', handlePointerCancel, true);
    window.removeEventListener('resize', handleResize);
  };

  setAreaViewBox();
  syncAreaMode();

  window.addEventListener('pointermove', handlePointerMove, { passive: true });
  window.addEventListener('pointerdown', handlePointerDown, true);
  window.addEventListener('pointerup', handlePointerUp, true);
  window.addEventListener('pointercancel', handlePointerCancel, true);
  window.addEventListener('resize', handleResize, { passive: true });
  window.addEventListener('pagehide', cleanup, { once: true });
};
