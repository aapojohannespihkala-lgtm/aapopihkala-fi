import {
  formatSelectionMetadataKey,
  type SelectionMetadataEntry,
} from './privateModelSelectionMetadata';

type SelectionPanelElements = {
  canvas: HTMLElement;
  panel: HTMLElement;
  mesh: HTMLElement;
  group: HTMLElement;
  scene: HTMLElement;
  floor: HTMLElement;
  kind: HTMLElement;
  metadataList: HTMLElement;
  metadataEmpty: HTMLElement;
};

export type SelectionPanelContent = {
  mesh: string;
  group: string;
  scene: string;
  floor: string;
  kind: string;
  metadataEntries: SelectionMetadataEntry[];
};

export const createSelectionPanelController = ({
  canvas,
  panel,
  mesh,
  group,
  scene,
  floor,
  kind,
  metadataList,
  metadataEmpty,
}: SelectionPanelElements) => {
  const clearMetadata = () => {
    metadataList.replaceChildren();
    metadataEmpty.hidden = false;
    delete canvas.dataset.selectionMetadataCount;
    delete canvas.dataset.selectionMetadataSource;
  };

  const clear = () => {
    panel.hidden = true;
    mesh.textContent = '-';
    group.textContent = '-';
    scene.textContent = '-';
    floor.textContent = '-';
    kind.textContent = '-';
    clearMetadata();
  };

  const render = ({
    mesh: meshText,
    group: groupText,
    scene: sceneText,
    floor: floorText,
    kind: kindText,
    metadataEntries,
  }: SelectionPanelContent) => {
    mesh.textContent = meshText;
    group.textContent = groupText;
    scene.textContent = sceneText;
    floor.textContent = floorText;
    kind.textContent = kindText;

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

    panel.hidden = false;
  };

  return { clear, render };
};
