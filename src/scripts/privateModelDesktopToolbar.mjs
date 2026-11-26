/**
 * Desktop icon toolbar for the private Ylisrinne viewer (owner decisions 21.11.2026):
 * - one-click preset icons (whole building, D with roof, whole D, D 2F, D 1F, technical review)
 * - one-click camera-angle icons (3D, isometric, plan, four elevations)
 * - a small arrow at the right edge of each group opens the remaining choices
 * - Layers opens the existing layer tree from its own icon
 * The toolbar only calls the viewer's existing actions; it never changes model data.
 */
/**
 * WORK_TEST opened by a plain /private-model/. Owner 21.11.2026: latest WORK_TEST.
 * Owner 22.11.2026 (04.11): roof in the model and the whole building forward.
 * Owner 25.11.2026: open the whole building preset.
 * R31 9e0bf34f scene 769 = R22 scene 688 (468/480 roots shared) + whole-building
 * roof group (intendedViewerLayer 'roof') + ABC building masses. Its D-scope
 * presets looked odd; the start therefore opens the whole building with the roof.
 * 23.11.2026: R32H c26d99c1 (R31 + baked gables/gutters/downpipes, P6 V8 carport,
 * hallface SW04/SW05) replaces R31 as the latest WORK_TEST after its production
 * WebGL check (scenes 814-817, Layerit/technical/site networks, no runtime doubles).
 * 23.11.2026 20.30: R33 3a226f98 (R32H + D2F WC open door leaf out of the wall end and
 * floor) after its production check (818/820 receipts, Layerit, technical review, networks).
 * 23.11.2026 21.20: R34 99210ea5 (R33 + D/C party wall attic gable, balcony frieze, unified
 * west gable, north facade boarding, east gable brick) after its production check (822/824,
 * Layerit, technical review SADEVESI 28, site networks).
 */
export const DESKTOP_START_CANDIDATE_ID = 'c80-r34-99210ea5-d-2f-sc822-sc825-work-test';

// The renderer can die during a large model load before the viewer's catch
// block runs. A reload in that tab gets one recovery attempt with CURRENT.
export async function runDesktopStartupAttempt(candidateId, load, getStorage = () => window.sessionStorage) {
  const key = 'ylisrinne-viewer:pending-start';
  const tracked = (update) => {
    try { return update(getStorage()); } catch { return undefined; }
  };
  if (tracked(storage => storage.getItem(key)) === candidateId) {
    tracked(storage => storage.removeItem(key));
    return 'interrupted';
  }
  tracked(storage => storage.setItem(key, candidateId));
  try {
    return await load() ? 'loaded' : 'unavailable';
  } finally {
    tracked(storage => {
      if (storage.getItem(key) === candidateId) storage.removeItem(key);
    });
  }
}

const presetOutlineIcon = shapes => `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <g fill="none" stroke="#F7F8F9" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round">
${shapes}
  </g>
</svg>`;

export const DESKTOP_PRESETS = Object.freeze([
  Object.freeze({ id: 'whole-building', label: 'Koko rakennus', aria: 'rakennus kokonaan', icon: presetOutlineIcon(`
    <path d="M2.6 8.3 4.7 4.1H19.3L21.4 8.3Z M3.25 8.3V19.9H20.75V8.3 M7.6 8.3V19.9 M12 8.3V19.9 M16.4 8.3V19.9"/>`) }),
  Object.freeze({ id: 'd-roof', label: 'Koko D katolla', icon: presetOutlineIcon(`
    <path d="M3.6 9.2 12 3.65 20.4 9.2"/>
    <path d="M4.7 9.2H19.3V19.5H4.7Z M4.7 14.35H19.3"/>`) }),
  Object.freeze({ id: 'd-apartment', label: 'Koko D, katto piilossa', icon: presetOutlineIcon(`
    <path d="M3.6 9.2 12 3.65 20.4 9.2" stroke="#8597A3"/>
    <path d="M4.7 9.2H19.3V19.5H4.7Z M4.7 14.35H19.3"/>`) }),
  Object.freeze({ id: 'd-2f', label: 'D yläkerta', icon: presetOutlineIcon(`
    <path d="M3.6 9.2 12 3.65 20.4 9.2" stroke="#8597A3"/>
    <path d="M4.7 14.35V19.5H19.3V14.35" stroke="#8597A3"/>
    <path d="M4.7 9.2H19.3V14.35H4.7Z"/>`) }),
  Object.freeze({ id: 'd-1f', label: 'D alakerta', icon: presetOutlineIcon(`
    <path d="M3.6 9.2 12 3.65 20.4 9.2" stroke="#8597A3"/>
    <path d="M4.7 14.35V9.2H19.3V14.35" stroke="#8597A3"/>
    <path d="M4.7 14.35H19.3V19.5H4.7Z"/>`) }),
  Object.freeze({ id: 'technical', label: 'Talotekniikka korostettuna', toggle: true, icon: presetOutlineIcon(`
    <path d="M3.6 9.2 12 3.65 20.4 9.2 M4.7 9.2V19.5H19.3V9.2" stroke="#8597A3"/>
    <path d="M10.28 16.4H11.8V12.68 M11.8 13.95H14.32"/>
    <circle cx="9.1" cy="16.4" r="1.18"/>
    <circle cx="11.8" cy="11.5" r="1.18"/>
    <circle cx="15.5" cy="13.95" r="1.18"/>`) }),
]);

export const DESKTOP_ANGLES = Object.freeze([
  Object.freeze({ id: 'orbit', label: 'Vapaa 3D (perspektiivi)', aria: '3D, vapaa kierto', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <polygon points="15.333 3.500 19.518 7.001 19.518 16.999 15.333 20.500" fill="#8597A3" opacity=".48"/>
  <path d="M4.482 6.087L15.333 3.500L19.518 7.001L19.518 16.999L15.333 20.500L4.482 17.913Z" fill="none" stroke="#F7F8F9" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M15.333 3.500L15.333 20.500" fill="none" stroke="#F7F8F9" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>` }),
  Object.freeze({ id: 'iso', label: 'Isometrinen', aria: 'isometria', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <path d="M12 12.35l7.6-4.4v8.8l-7.6 4.4z" fill="#8597A3" opacity=".48"/>
  <path d="M12 3.55l7.6 4.4v8.8l-7.6 4.4-7.6-4.4v-8.8zM4.4 7.95l7.6 4.4 7.6-4.4M12 12.35v8.8" fill="none" stroke="#F7F8F9" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"/>
</svg>` }),
  Object.freeze({ id: 'top', label: 'Pohja ylhäältä', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <rect x="4.15" y="4.15" width="15.7" height="15.7" rx="1" fill="none" stroke="#F7F8F9" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M5 11.55h8.05m0-6.55v14" fill="none" stroke="#8597A3" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"/>
</svg>` }),
  Object.freeze({ id: 'elev-pos-y', label: 'Julkisivu +Y (pohjoinen, YLIS-G1)', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <rect x="4.5" y="5" width="15" height="15" rx="1.5" fill="none" stroke="#F7F8F9" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"/>
  <g transform="translate(-2.4 -6.7) scale(1.2)"><path d="M9.8 18.55v-5.05l4.4 5.05v-5.05" fill="none" stroke="#F7F8F9" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/></g>
</svg>` }),
  Object.freeze({ id: 'elev-neg-y', label: 'Julkisivu −Y (etelä, YLIS-G1)', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <rect x="4.5" y="5" width="15" height="15" rx="1.5" fill="none" stroke="#F7F8F9" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"/>
  <g transform="translate(-2.4 -6.7) scale(1.2)"><path d="M14 14.08c-.56-.51-1.27-.69-2.04-.69-1.08 0-1.82.51-1.82 1.23 0 .77.67 1.06 1.95 1.4 1.24.33 1.9.69 1.9 1.44 0 .82-.79 1.28-1.95 1.28-.83 0-1.58-.27-2.19-.78" fill="none" stroke="#F7F8F9" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/></g>
</svg>` }),
  Object.freeze({ id: 'elev-pos-x', label: 'Julkisivu +X (itä, YLIS-G1)', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <rect x="4.5" y="5" width="15" height="15" rx="1.5" fill="none" stroke="#F7F8F9" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"/>
  <g transform="translate(-2.4 -6.7) scale(1.2)"><path d="M14.25 13.5H9.9v5.05h4.35m-4.3-2.52h3.67" fill="none" stroke="#F7F8F9" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/></g>
</svg>` }),
  Object.freeze({ id: 'elev-neg-x', label: 'Julkisivu −X (länsi, YLIS-G1)', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <rect x="4.5" y="5" width="15" height="15" rx="1.5" fill="none" stroke="#F7F8F9" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"/>
  <g transform="translate(-2.4 -6.7) scale(1.2)"><path d="M8.35 13.5l1.63 5.05 2.02-3.62 2.02 3.62 1.63-5.05" fill="none" stroke="#F7F8F9" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/></g>
</svg>` }),
]);

export const DESKTOP_EDGES = Object.freeze([
  Object.freeze({ id: 'visible', label: 'Näkyvät reunat', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <path d="M12 3.55l7.6 4.4-7.6 4.4-7.6-4.4z" fill="#82919C"/>
  <path d="M4.4 7.95l7.6 4.4v8.8l-7.6-4.4z" fill="#62717D"/>
  <path d="M12 12.35l7.6-4.4v8.8l-7.6 4.4z" fill="#46555F"/>
  <path d="M12 3.55l7.6 4.4v8.8l-7.6 4.4-7.6-4.4v-8.8z" fill="none" stroke="#F7F8F9" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M4.4 7.95l7.6 4.4 7.6-4.4M12 12.35v8.8" fill="none" stroke="#F7F8F9" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"/>
</svg>` }),
  Object.freeze({ id: 'object', label: 'Objektireunat', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <path d="M12 3.55l7.6 4.4-7.6 4.4-7.6-4.4z" fill="#4E5F6A"/>
  <path d="M4.4 7.95l7.6 4.4v8.8l-7.6-4.4z" fill="#34444F"/>
  <path d="M12 12.35l7.6-4.4v8.8l-7.6 4.4z" fill="#293941"/>
  <path d="M12 3.55l7.6 4.4v8.8l-7.6 4.4-7.6-4.4v-8.8z" fill="none" stroke="#F7F8F9" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M4.4 7.95l7.6 4.4 7.6-4.4M12 12.35v8.8" fill="none" stroke="#F7F8F9" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12 3.7v8.65l-7.5 4.35M12 12.35l7.5 4.35" fill="none" stroke="#DCE6ED" stroke-width="1.12" stroke-linecap="round" stroke-linejoin="round"/>
</svg>` }),
  Object.freeze({ id: 'unified', label: 'Yhdistetyt reunat (myös piilossa olevat)', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <path d="M12 3.55l7.6 4.4-7.6 4.4-7.6-4.4z" fill="#82919C"/>
  <path d="M4.4 7.95l7.6 4.4v8.8l-7.6-4.4z" fill="#62717D"/>
  <path d="M12 12.35l7.6-4.4v8.8l-7.6 4.4z" fill="#46555F"/>
  <path d="M12 3.55l7.6 4.4v8.8l-7.6 4.4-7.6-4.4v-8.8z" fill="none" stroke="#F7F8F9" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"/>
</svg>` }),
  Object.freeze({ id: 'none', label: 'Ei reunaviivoja', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <path d="M12 3.55l7.6 4.4-7.6 4.4-7.6-4.4z" fill="#82919C"/>
  <path d="M4.4 7.95l7.6 4.4v8.8l-7.6-4.4z" fill="#62717D"/>
  <path d="M12 12.35l7.6-4.4v8.8l-7.6 4.4z" fill="#46555F"/>
</svg>` }),
]);

export const DESKTOP_LAYERS_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <path d="M12 4l8 4.2-8 4.2-8-4.2zM4 12.1l8 4.2 8-4.2M4 16l8 4.2 8-4.2" fill="none" stroke="#F7F8F9" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export const DESKTOP_MORE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <path d="M5.33 9l6.67 6 6.67-6" fill="none" stroke="#D9E1E7" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export const DESKTOP_FOLDER_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <path d="M3.2 6.7a1.3 1.3 0 0 1 1.3-1.3h4.3l2 2h8.7a1.3 1.3 0 0 1 1.3 1.3v8.6a1.3 1.3 0 0 1-1.3 1.3h-15a1.3 1.3 0 0 1-1.3-1.3z" fill="none" stroke="#F7F8F9" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export const DESKTOP_NAV_CUBE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <path d="M12 12.35L12.00 6.80" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round"/>
  <polygon points="12,3.2 10.25,6.80 13.75,6.80" fill="currentColor"/>
  <path d="M12 12.35L7.12 15.16" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round"/>
  <polygon points="4,16.95 7.99,16.67 6.25,13.64" fill="currentColor"/>
  <path d="M12 12.35L16.88 15.16" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round"/>
  <polygon points="20,16.95 17.75,13.64 16.01,16.67" fill="currentColor"/>
</svg>`;

/** Which preset icon is pressed for a viewer state. */
export function activeDesktopPreset({ standardViewPreset, roofVisible }) {
  if (standardViewPreset === 'd-apartment') return roofVisible ? 'd-roof' : 'd-apartment';
  return DESKTOP_PRESETS.some(p => p.id === standardViewPreset) ? standardViewPreset : null;
}
/** Which camera-angle icon is pressed for a viewer state. */
export function activeDesktopAngle({ viewPreset, elevationDirection }) {
  if (viewPreset === 'elevation') {
    const id = `elev-${elevationDirection}`;
    return DESKTOP_ANGLES.some(angle => angle.id === id) ? id : null;
  }
  if (viewPreset === 'isometric') return 'iso';
  return ['orbit', 'top'].includes(viewPreset) ? viewPreset : null;
}

/**
 * Build the toolbar. `actions` = { preset(id), angle(id), edge?(id), layers() }.
 * Returns { root, sync(state) } where state = { preset, angle, technical, layersOpen, edge }.
 */
export function mountDesktopToolbar(doc, actions) {
  const root = doc.createElement('div');
  root.className = 'desk-toolbar';
  root.setAttribute('role', 'toolbar');
  root.setAttribute('aria-label', 'Näkymät ja kuvakulmat');
  const buttons = new Map();
  const group = (name, items, kind) => {
    const g = doc.createElement('div');
    g.className = 'desk-group';
    g.setAttribute('role', 'group');
    g.setAttribute('aria-label', name);
    for (const item of items) {
      const b = doc.createElement('button');
      b.type = 'button';
      b.className = 'desk-icon';
      b.dataset.deskKind = kind;
      b.dataset.deskId = item.id;
      b.title = item.label;
      // Prefixed so the old menu buttons keep their unique accessible names.
      b.setAttribute('aria-label', `${{ preset: 'Preset', angle: 'Kuvakulma', edge: 'Reunaviivat' }[kind]}: ${item.aria ?? item.label}`);
      b.setAttribute('aria-pressed', 'false');
      b.innerHTML = item.icon;
      b.addEventListener('click', (event) => { event.stopPropagation(); actions[kind](item.id); });
      buttons.set(`${kind}:${item.id}`, b);
      g.append(b);
    }
    return g;
  };
  root.append(
    group('Presetit', DESKTOP_PRESETS, 'preset'),
    group('Kuvakulmat', DESKTOP_ANGLES, 'angle'),
  );
  if (actions.edge) root.append(group('Reunaviivat', DESKTOP_EDGES, 'edge'));
  const layers = doc.createElement('button');
  layers.type = 'button';
  layers.className = 'desk-icon desk-layers';
  layers.title = 'Layerit';
  layers.setAttribute('aria-label', 'Layerit');
  layers.setAttribute('aria-expanded', 'false');
  layers.innerHTML = DESKTOP_LAYERS_ICON;
  layers.addEventListener('click', (event) => { event.stopPropagation(); actions.layers(); });
  root.append(layers);
  const sync = ({ preset, angle, technical, layersOpen, edge }) => {
    for (const [key, b] of buttons) {
      const [kind, id] = key.split(':');
      const on = kind === 'preset'
        ? (id === 'technical' ? !!technical : id === preset)
        : kind === 'edge' ? id === edge : id === angle;
      b.setAttribute('aria-pressed', String(on));
    }
    layers.setAttribute('aria-expanded', String(!!layersOpen));
  };
  return { root, buttons, layers, sync };
}
