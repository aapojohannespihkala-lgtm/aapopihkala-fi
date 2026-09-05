type Point2 = {
  x: number;
  y: number;
};

type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
};

type RotationStart = {
  x: number;
  y: number;
  yaw: number;
  pitch: number;
};

let html2canvasPromise: Promise<typeof import('html2canvas').default> | null = null;

const loadHtml2Canvas = async () => {
  if (!html2canvasPromise) {
    html2canvasPromise = import('html2canvas').then((module) => module.default);
  }

  return html2canvasPromise;
};

export const initializeAreaRaster = () => {
  const selectionSvg = document.querySelector<SVGSVGElement>('[data-area-free-select]');
  const selectionContrast = document.querySelector<SVGPathElement>('[data-area-free-select-contrast]');
  const selectionFill = document.querySelector<SVGPathElement>('[data-area-free-select-fill]');
  const selectionPath = document.querySelector<SVGPathElement>('[data-area-free-select-path]');
  const grid = document.querySelector<HTMLElement>('[data-area-mode-grid]');
  const rasterSurface = document.querySelector<HTMLElement>('[data-area-raster-surface]');
  const rasterPlane = document.querySelector<HTMLElement>('[data-area-raster-plane]');
  const rasterImage = document.querySelector<HTMLImageElement>('[data-area-raster-image]');
  const rasterOutline = document.querySelector<SVGSVGElement>('[data-area-raster-outline]');
  const rasterOutlinePath = document.querySelector<SVGPathElement>('[data-area-raster-outline-path]');
  const overlay = document.querySelector<HTMLElement>('[data-area-overlay]');
  const nativePath = document.querySelector<SVGPathElement>('[data-area-path]');
  const centroidSymbol = document.querySelector<SVGGElement>('[data-area-centroid-symbol]');
  const areaHint = document.querySelector<HTMLElement>('[data-area-hint]');
  const rectRoot = document.querySelector<HTMLElement>('[data-rect-area]');

  if (
    !selectionSvg ||
    !selectionContrast ||
    !selectionFill ||
    !selectionPath ||
    !grid ||
    !rasterSurface ||
    !rasterPlane ||
    !rasterImage ||
    !rasterOutline ||
    !rasterOutlinePath ||
    !overlay ||
    !nativePath ||
    !centroidSymbol
  ) return;

  if (selectionSvg.dataset.areaFreeSelectInitialized === 'true') return;
  selectionSvg.dataset.areaFreeSelectInitialized = 'true';

  let persistentPoints: Point2[] = [];
  let sourcePoints: Point2[] = [];
  let syncFrame = 0;
  let wasFinished = false;
  let captureGeneration = 0;
  let captureInFlight = false;
  let rasterReady = false;
  let yaw = 0;
  let pitch = 0;
  let rotating = false;
  let rotationStart: RotationStart | null = null;
  let bounds: Bounds | null = null;

  const parsePathPoints = (): Point2[] => {
    const d = nativePath.getAttribute('d') ?? '';
    const values = d.match(/[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi);
    if (!values || values.length < 2) return [];

    const numbers = values.map(Number).filter(Number.isFinite);
    const points: Point2[] = [];

    for (let index = 0; index + 1 < numbers.length; index += 2) {
      points.push({ x: numbers[index], y: numbers[index + 1] });
    }

    return points;
  };

  const pathFromPoints = (points: Point2[]) => {
    if (!points.length) return '';
    return `${points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ')} Z`;
  };

  const calculateBounds = (points: Point2[]): Bounds => {
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
    };
  };

  const localPathFromPoints = (points: Point2[], box: Bounds) =>
    `${points
      .map(
        (point, index) =>
          `${index === 0 ? 'M' : 'L'} ${point.x - box.minX} ${point.y - box.minY}`
      )
      .join(' ')} Z`;

  const clipPolygonFromPoints = (points: Point2[], box: Bounds) =>
    `polygon(${points
      .map((point) => `${point.x - box.minX}px ${point.y - box.minY}px`)
      .join(', ')})`;

  const updateGrid = () => {
    const freeAreaVisible = overlay.classList.contains('is-visible');
    const rectVisible = rectRoot?.classList.contains('is-visible') ?? false;
    grid.classList.toggle('is-visible', freeAreaVisible || rectVisible);
  };

  const hideVector = () => {
    selectionSvg.classList.remove('is-visible');
    selectionContrast.setAttribute('d', '');
    selectionFill.setAttribute('d', '');
    selectionPath.setAttribute('d', '');
  };

  const renderVector = (points: Point2[]) => {
    if (!overlay.classList.contains('is-visible') || points.length < 3) {
      hideVector();
      return;
    }

    const path = pathFromPoints(points);
    selectionSvg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
    selectionContrast.setAttribute('d', path);
    selectionFill.setAttribute('d', path);
    selectionPath.setAttribute('d', path);
    selectionSvg.classList.add('is-visible');
  };

  const applyRasterTransform = () => {
    if (!rasterReady || !bounds) return;
    rasterPlane.style.transform = `perspective(700px) rotateY(${yaw}rad) rotateX(${pitch}rad)`;
  };

  const clearRaster = () => {
    captureGeneration += 1;
    captureInFlight = false;
    rasterReady = false;
    sourcePoints = [];
    bounds = null;
    yaw = 0;
    pitch = 0;
    rotating = false;
    rotationStart = null;
    rasterSurface.classList.remove('is-visible');
    rasterPlane.style.removeProperty('left');
    rasterPlane.style.removeProperty('top');
    rasterPlane.style.removeProperty('width');
    rasterPlane.style.removeProperty('height');
    rasterPlane.style.removeProperty('clip-path');
    rasterPlane.style.removeProperty('transform-origin');
    rasterPlane.style.removeProperty('transform');
    rasterImage.removeAttribute('src');
    rasterOutlinePath.setAttribute('d', '');
  };

  const prepareRasterPlane = (points: Point2[]) => {
    bounds = calculateBounds(points);
    const localPath = localPathFromPoints(points, bounds);
    const clip = clipPolygonFromPoints(points, bounds);

    rasterPlane.style.left = `${bounds.minX}px`;
    rasterPlane.style.top = `${bounds.minY}px`;
    rasterPlane.style.width = `${bounds.width}px`;
    rasterPlane.style.height = `${bounds.height}px`;
    rasterPlane.style.clipPath = clip;

    const centroidX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
    const centroidY = points.reduce((sum, point) => sum + point.y, 0) / points.length;
    rasterPlane.style.transformOrigin = `${centroidX - bounds.minX}px ${centroidY - bounds.minY}px`;

    rasterOutline.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
    rasterOutlinePath.setAttribute('d', localPath);
    applyRasterTransform();
  };

  const captureViewport = async (points: Point2[], generation: number) => {
    if (points.length < 3) return;

    captureInFlight = true;
    hideVector();
    rasterSurface.classList.remove('is-visible');

    const box = calculateBounds(points);
    const captureWidth = Math.max(1, Math.round(box.width));
    const captureHeight = Math.max(1, Math.round(box.height));

    try {
      const html2canvas = await loadHtml2Canvas();
      const viewportCanvas = await html2canvas(document.documentElement, {
        backgroundColor: null,
        logging: false,
        useCORS: true,
        scale: 1,
        x: window.scrollX,
        y: window.scrollY,
        width: window.innerWidth,
        height: window.innerHeight,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        ignoreElements: (element) =>
          Boolean(
            element.closest(
              '[data-area-overlay], [data-area-free-select], [data-area-raster-surface], [data-area-mode-grid], [data-rect-area], [data-a-readout], [data-a-axis], [data-site-grid]'
            )
          ),
      });

      if (generation !== captureGeneration || !overlay.classList.contains('is-visible')) return;

      const crop = document.createElement('canvas');
      crop.width = captureWidth;
      crop.height = captureHeight;
      const context = crop.getContext('2d');
      if (!context) throw new Error('AREA raster canvas context unavailable');

      context.drawImage(
        viewportCanvas,
        Math.max(0, Math.round(box.minX)),
        Math.max(0, Math.round(box.minY)),
        captureWidth,
        captureHeight,
        0,
        0,
        captureWidth,
        captureHeight
      );

      sourcePoints = points.map((point) => ({ ...point }));
      yaw = 0;
      pitch = 0;
      rasterImage.src = crop.toDataURL('image/png');
      rasterReady = true;
      prepareRasterPlane(sourcePoints);
      rasterSurface.classList.add('is-visible');
      hideVector();
    } catch {
      if (generation !== captureGeneration) return;
      rasterReady = false;
      renderVector(points);
    } finally {
      if (generation === captureGeneration) captureInFlight = false;
    }
  };

  const normalizeHint = () => {
    if (!areaHint) return;
    const text = areaHint.textContent ?? '';
    const normalized = text.replaceAll('TOPOGRAPHY', 'RASTER SURFACE');
    if (normalized !== text) areaHint.textContent = normalized;
  };

  const sync = () => {
    syncFrame = 0;
    updateGrid();
    normalizeHint();

    if (!overlay.classList.contains('is-visible')) {
      persistentPoints = [];
      wasFinished = false;
      hideVector();
      clearRaster();
      return;
    }

    const d = nativePath.getAttribute('d') ?? '';
    const points = parsePathPoints();
    const finished = centroidSymbol.classList.contains('is-visible');

    if (!finished) {
      if (wasFinished) clearRaster();
      wasFinished = false;
      persistentPoints = [];
      if (d.trim()) renderVector(points);
      else hideVector();
      return;
    }

    if (!wasFinished && points.length >= 3) {
      wasFinished = true;
      persistentPoints = points.map((point) => ({ ...point }));
      const generation = ++captureGeneration;
      void captureViewport(persistentPoints, generation);
      return;
    }

    wasFinished = true;

    if (rasterReady || captureInFlight) {
      hideVector();
      return;
    }

    if (persistentPoints.length >= 3) renderVector(persistentPoints);
  };

  const scheduleSync = () => {
    if (syncFrame) return;
    syncFrame = window.requestAnimationFrame(sync);
  };

  const handlePointerDown = (event: PointerEvent) => {
    if (!rasterReady || !overlay.classList.contains('is-visible') || event.button !== 0) return;

    window.requestAnimationFrame(() => {
      if (!overlay.classList.contains('is-rotating-area')) return;
      rotating = true;
      rotationStart = {
        x: event.clientX,
        y: event.clientY,
        yaw,
        pitch,
      };
    });
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (!rotating || !rotationStart || !rasterReady) return;

    const dx = event.clientX - rotationStart.x;
    const dy = event.clientY - rotationStart.y;
    yaw = rotationStart.yaw + dx * 0.012;
    pitch = rotationStart.pitch - dy * 0.012;
    applyRasterTransform();
  };

  const handlePointerUp = () => {
    if (!rotating) return;
    rotating = false;
    rotationStart = null;
  };

  const observer = new MutationObserver(scheduleSync);
  observer.observe(nativePath, { attributes: true, attributeFilter: ['d'] });
  observer.observe(centroidSymbol, { attributes: true, attributeFilter: ['class'] });
  observer.observe(overlay, { attributes: true, attributeFilter: ['class'] });
  if (rectRoot) {
    observer.observe(rectRoot, { attributes: true, attributeFilter: ['class'] });
  }
  if (areaHint) {
    observer.observe(areaHint, { childList: true, characterData: true, subtree: true });
  }

  const handleResize = () => {
    selectionSvg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
    clearRaster();
    scheduleSync();
  };

  const cleanup = () => {
    observer.disconnect();
    window.removeEventListener('pointerdown', handlePointerDown, true);
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp, true);
    window.removeEventListener('pointercancel', handlePointerUp, true);
    window.removeEventListener('resize', handleResize);
    if (syncFrame) window.cancelAnimationFrame(syncFrame);
    persistentPoints = [];
    hideVector();
    clearRaster();
  };

  window.addEventListener('pointerdown', handlePointerDown, true);
  window.addEventListener('pointermove', handlePointerMove, { passive: true });
  window.addEventListener('pointerup', handlePointerUp, true);
  window.addEventListener('pointercancel', handlePointerUp, true);
  window.addEventListener('resize', handleResize, { passive: true });
  window.addEventListener('pagehide', cleanup, { once: true });

  updateGrid();
  scheduleSync();
};
