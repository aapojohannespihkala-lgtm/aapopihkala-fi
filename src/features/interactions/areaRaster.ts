type Point2 = {
  x: number;
  y: number;
};

type RasterBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
};

export type AreaRasterController = {
  renderVector: (points: readonly Point2[]) => void;
  hideVector: () => void;
  capture: (points: readonly Point2[]) => Promise<boolean>;
  clear: () => void;
  setRotation: (yaw: number, pitch: number) => void;
  syncMode: (mode: string) => void;
  cleanup: () => void;
};

const pathFromPoints = (points: readonly Point2[]) => {
  if (!points.length) return '';

  return `${points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')} Z`;
};

const calculateBounds = (points: readonly Point2[]): RasterBounds => {
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

const localPathFromPoints = (
  points: readonly Point2[],
  bounds: RasterBounds
) =>
  `${points
    .map(
      (point, index) =>
        `${index === 0 ? 'M' : 'L'} ${point.x - bounds.minX} ${point.y - bounds.minY}`
    )
    .join(' ')} Z`;

const clipPolygonFromPoints = (
  points: readonly Point2[],
  bounds: RasterBounds
) =>
  `polygon(${points
    .map((point) => `${point.x - bounds.minX}px ${point.y - bounds.minY}px`)
    .join(', ')})`;

export const createAreaRasterController = (): AreaRasterController | null => {
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
    !overlay
  ) return null;

  if (selectionSvg.dataset.areaRasterInitialized === 'true') return null;
  selectionSvg.dataset.areaRasterInitialized = 'true';

  let captureGeneration = 0;
  let rasterReady = false;
  let bounds: RasterBounds | null = null;

  const hideVector = () => {
    selectionSvg.classList.remove('is-visible');
    selectionContrast.setAttribute('d', '');
    selectionFill.setAttribute('d', '');
    selectionPath.setAttribute('d', '');
  };

  const renderVector = (points: readonly Point2[]) => {
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

  const setRotation = (yaw: number, pitch: number) => {
    if (!rasterReady || !bounds) return;

    rasterPlane.style.transform =
      `perspective(700px) rotateY(${yaw}rad) rotateX(${pitch}rad)`;
  };

  const clearRaster = () => {
    captureGeneration += 1;
    rasterReady = false;
    bounds = null;
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

  const clear = () => {
    hideVector();
    clearRaster();
  };

  const prepareRasterPlane = (points: readonly Point2[]) => {
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
    rasterPlane.style.transformOrigin =
      `${centroidX - bounds.minX}px ${centroidY - bounds.minY}px`;

    rasterOutline.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
    rasterOutlinePath.setAttribute('d', localPath);
  };

  const capture = async (points: readonly Point2[]) => {
    if (points.length < 3) return false;

    const generation = ++captureGeneration;
    hideVector();
    rasterSurface.classList.remove('is-visible');

    const box = calculateBounds(points);
    const captureWidth = Math.max(1, Math.round(box.width));
    const captureHeight = Math.max(1, Math.round(box.height));

    try {
      const { default: html2canvas } = await import('html2canvas');
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

      if (
        generation !== captureGeneration ||
        !overlay.classList.contains('is-visible')
      ) return false;

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

      rasterImage.src = crop.toDataURL('image/png');
      rasterReady = true;
      prepareRasterPlane(points);
      rasterSurface.classList.add('is-visible');
      hideVector();
      return true;
    } catch {
      if (generation !== captureGeneration) return false;
      rasterReady = false;
      renderVector(points);
      return false;
    }
  };

  const syncMode = (mode: string) => {
    grid.classList.toggle('is-visible', mode === 'area' || mode === 'rect');

    if (mode !== 'area') clear();
  };

  const handleResize = () => {
    selectionSvg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
  };

  const cleanup = () => {
    window.removeEventListener('resize', handleResize);
    clear();
  };

  selectionSvg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
  window.addEventListener('resize', handleResize, { passive: true });

  return {
    renderVector,
    hideVector,
    capture,
    clear,
    setRotation,
    syncMode,
    cleanup,
  };
};
