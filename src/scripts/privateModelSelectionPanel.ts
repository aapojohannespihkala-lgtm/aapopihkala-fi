import {
  formatSelectionMetadataKey,
  type SelectionMetadataEntry,
  type SelectionSourceLink,
} from './privateModelSelectionMetadata';
import { viewerBoundsToYlis, type CartesianLike } from './privateModelAiNavigator';

const formatMetersFi = (value: number) => (Math.abs(value) < 0.005 ? 0 : value).toFixed(2).replace('.', ',');

/**
 * Axis-aligned YLIS-G1-LOCAL extent of a selection from viewer world bounds
 * (viewer x = X, -z = Y, y = Z, metres). Model geometry, not a site measurement.
 */
export const formatSelectionDimensionsFi = (min: CartesianLike, max: CartesianLike) => {
  const bounds = viewerBoundsToYlis(min, max);
  const dx = bounds.max.x - bounds.min.x;
  const dy = bounds.max.y - bounds.min.y;
  const dz = bounds.max.z - bounds.min.z;
  if (![dx, dy, dz].every(Number.isFinite)) return null;
  return `X ${formatMetersFi(dx)} × Y ${formatMetersFi(dy)} × Z ${formatMetersFi(dz)} m · Z ${formatMetersFi(bounds.min.z)}…${formatMetersFi(bounds.max.z)}`;
};

type SelectionPanelElements = {
  canvas: HTMLElement;
  panel: HTMLElement;
  mesh: HTMLElement;
  group: HTMLElement;
  scene: HTMLElement;
  floor: HTMLElement;
  kind: HTMLElement;
  physicalClaim: HTMLElement;
  dimensions?: HTMLElement;
  metadataList: HTMLElement;
  metadataEmpty: HTMLElement;
  sourceLinksSection?: HTMLElement | null;
  sourceLinksList?: HTMLElement | null;
};

export type SelectionPanelContent = {
  mesh: string;
  group: string;
  scene: string;
  floor: string;
  kind: string;
  physicalClaim: string;
  dimensions?: string;
  metadataEntries: SelectionMetadataEntry[];
  sourceLinks?: SelectionSourceLink[];
};

const ensureSelectionTool = (canvas: HTMLElement) => {
  const existing = document.querySelector<HTMLButtonElement>('#selection-tool-button');
  if (existing) return existing;

  const layersButton = document.querySelector<HTMLButtonElement>('#layers-button');
  const toolbar = layersButton?.parentElement;
  if (!layersButton || !toolbar) return null;

  const button = document.createElement('button');
  button.id = 'selection-tool-button';
  button.type = 'button';
  button.setAttribute('aria-label', 'Objektin valinta');
  button.setAttribute('aria-pressed', 'false');
  button.title = 'Valitse objekteja';

  const icon = document.createElement('span');
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '⌖';
  button.append(icon, document.createTextNode(' Valitse'));
  layersButton.insertAdjacentElement('afterend', button);

  const setActive = (active: boolean) => {
    canvas.dataset.interactionMode = active ? 'select' : 'navigate';
    button.setAttribute('aria-pressed', String(active));
    button.title = active ? 'Poista objektin valinta käytöstä' : 'Valitse objekteja';
    button.style.fontWeight = active ? '750' : '';
    button.style.boxShadow = active ? 'inset 0 -2px 0 currentColor' : '';
    canvas.style.cursor = active ? 'crosshair' : '';
  };

  setActive(false);
  button.addEventListener('click', () => {
    setActive(button.getAttribute('aria-pressed') !== 'true');
  });

  window.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape' && button.getAttribute('aria-pressed') === 'true') {
        setActive(false);
      }
    },
    { capture: true },
  );

  const badge = document.querySelector<HTMLElement>('#model-source-badge');
  if (badge) {
    new MutationObserver(() => setActive(false)).observe(badge, {
      childList: true,
      characterData: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-kind'],
    });
  }

  return button;
};

export const createSelectionPanelController = ({
  canvas,
  panel,
  mesh,
  group,
  scene,
  floor,
  kind,
  physicalClaim,
  dimensions,
  metadataList,
  metadataEmpty,
  sourceLinksSection,
  sourceLinksList,
}: SelectionPanelElements) => {
  ensureSelectionTool(canvas);

  const clearSourceLinks = () => {
    sourceLinksList?.replaceChildren();
    if (sourceLinksSection) sourceLinksSection.hidden = true;
    delete canvas.dataset.selectionSourceLinkCount;
  };

  const renderSourceLinks = (links: SelectionSourceLink[]) => {
    clearSourceLinks();
    if (!sourceLinksSection || !sourceLinksList) return;
    canvas.dataset.selectionSourceLinkCount = String(links.length);
    if (links.length === 0) return;
    for (const { link, label } of links) {
      const item = document.createElement('li');
      const anchor = document.createElement('a');
      anchor.href = link;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.textContent = label;
      item.append(anchor);
      sourceLinksList.append(item);
    }
    sourceLinksSection.hidden = false;
  };

  const clearMetadata = () => {
    metadataList.replaceChildren();
    metadataEmpty.hidden = false;
    delete canvas.dataset.selectionMetadataCount;
    delete canvas.dataset.selectionMetadataSource;
    clearSourceLinks();
  };

  const clear = () => {
    panel.hidden = true;
    mesh.textContent = '-';
    group.textContent = '-';
    scene.textContent = '-';
    floor.textContent = '-';
    kind.textContent = '-';
    physicalClaim.textContent = '-';
    if (dimensions) dimensions.textContent = '-';
    delete canvas.dataset.selectionDimensions;
    clearMetadata();
  };

  const render = ({
    mesh: meshText,
    group: groupText,
    scene: sceneText,
    floor: floorText,
    kind: kindText,
    physicalClaim: physicalClaimText,
    dimensions: dimensionsText,
    metadataEntries,
    sourceLinks = [],
  }: SelectionPanelContent) => {
    mesh.textContent = meshText;
    group.textContent = groupText;
    scene.textContent = sceneText;
    floor.textContent = floorText;
    kind.textContent = kindText;
    physicalClaim.textContent = physicalClaimText;
    if (dimensions) dimensions.textContent = dimensionsText ?? '-';
    if (dimensionsText) canvas.dataset.selectionDimensions = dimensionsText;
    else delete canvas.dataset.selectionDimensions;

    metadataList.replaceChildren();
    metadataEmpty.hidden = metadataEntries.length > 0;
    canvas.dataset.selectionMetadataCount = String(metadataEntries.length);
    canvas.dataset.selectionMetadataSource = metadataEntries.length > 0 ? 'userData' : 'none';

    for (const [key, value] of metadataEntries) {
      const label = document.createElement('dt');
      label.textContent = formatSelectionMetadataKey(key);
      const content = document.createElement('dd');
      content.textContent = value;
      metadataList.append(label, content);
    }

    renderSourceLinks(sourceLinks);

    panel.hidden = false;
  };

  return { clear, render };
};
