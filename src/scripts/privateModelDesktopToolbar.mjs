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

export const DESKTOP_PRESETS = Object.freeze([
  Object.freeze({ id: 'whole-building', label: 'Koko rakennus', aria: 'rakennus kokonaan', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <g transform="translate(12 0) scale(0.93 1) translate(-12 0)">
    <path fill="#F7F8F9" d="M4.1 3.5H19.9Q20.25 3.5 20.34 3.86L21.6 8.93Q21.74 9.5 21.15 9.5H2.85Q2.26 9.5 2.4 8.93L3.66 3.86Q3.75 3.5 4.1 3.5Z"/>
    <rect x="3.2" y="10.75" width="3.65" height="10.75" rx=".48" fill="#F7F8F9"/>
    <rect x="7.85" y="10.75" width="3.65" height="10.75" rx=".48" fill="#F7F8F9"/>
    <rect x="12.5" y="10.75" width="3.65" height="10.75" rx=".48" fill="#F7F8F9"/>
    <rect x="17.15" y="10.75" width="3.65" height="10.75" rx=".48" fill="#F7F8F9"/>
  </g>
</svg>` }),
  Object.freeze({ id: 'd-roof', label: 'Koko D katolla', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <g transform="translate(12 0) scale(1.17 1) translate(-12 0)">
    <path fill="#F7F8F9" d="M11.6 3.65Q12 3.35 12.4 3.65L19.48 8.77Q19.68 8.93 19.68 9.18Q19.68 9.5 19.3 9.5H4.7Q4.32 9.5 4.32 9.18Q4.32 8.93 4.52 8.77Z"/>
    <rect x="5.15" y="10.75" width="13.7" height="4.75" rx=".58" fill="#F7F8F9"/>
    <rect x="5.15" y="16.75" width="13.7" height="4.75" rx=".58" fill="#F7F8F9"/>
  </g>
</svg>` }),
  Object.freeze({ id: 'd-apartment', label: 'Koko D, katto piilossa', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <g transform="translate(12 0) scale(1.17 1) translate(-12 0)">
    <path fill="#8597A3" fill-rule="evenodd" d="M11.6 3.65Q12 3.35 12.4 3.65L19.48 8.77Q19.68 8.93 19.68 9.18Q19.68 9.5 19.3 9.5H4.7Q4.32 9.5 4.32 9.18Q4.32 8.93 4.52 8.77ZM12 4.86L17 8.42H7Z"/>
    <rect x="5.15" y="10.75" width="13.7" height="4.75" rx=".58" fill="#F7F8F9"/>
    <rect x="5.15" y="16.75" width="13.7" height="4.75" rx=".58" fill="#F7F8F9"/>
  </g>
</svg>` }),
  Object.freeze({ id: 'd-2f', label: 'D yläkerta', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <g transform="translate(12 0) scale(1.17 1) translate(-12 0)">
    <path fill="#8597A3" fill-rule="evenodd" d="M11.6 3.65Q12 3.35 12.4 3.65L19.48 8.77Q19.68 8.93 19.68 9.18Q19.68 9.5 19.3 9.5H4.7Q4.32 9.5 4.32 9.18Q4.32 8.93 4.52 8.77ZM12 4.86L17 8.42H7Z"/>
    <rect x="5.15" y="10.75" width="13.7" height="4.75" rx=".58" fill="#F7F8F9"/>
    <rect x="5.7" y="17.3" width="12.6" height="3.65" rx=".18" fill="none" stroke="#8597A3" stroke-width="1.1"/>
  </g>
</svg>` }),
  Object.freeze({ id: 'd-1f', label: 'D alakerta', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <g transform="translate(12 0) scale(1.17 1) translate(-12 0)">
    <path fill="#8597A3" fill-rule="evenodd" d="M11.6 3.65Q12 3.35 12.4 3.65L19.48 8.77Q19.68 8.93 19.68 9.18Q19.68 9.5 19.3 9.5H4.7Q4.32 9.5 4.32 9.18Q4.32 8.93 4.52 8.77ZM12 4.86L17 8.42H7Z"/>
    <rect x="5.7" y="11.3" width="12.6" height="3.65" rx=".18" fill="none" stroke="#8597A3" stroke-width="1.1"/>
    <rect x="5.15" y="16.75" width="13.7" height="4.75" rx=".58" fill="#F7F8F9"/>
  </g>
</svg>` }),
  Object.freeze({ id: 'technical', label: 'Talotekniikka korostettuna', toggle: true, icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <g transform="translate(12 0) scale(1.17 1) translate(-12 0)">
    <path fill="#8597A3" fill-rule="evenodd" d="M11.6 3.65Q12 3.35 12.4 3.65L19.48 8.77Q19.68 8.93 19.68 9.18Q19.68 9.5 19.3 9.5H4.7Q4.32 9.5 4.32 9.18Q4.32 8.93 4.52 8.77ZM12 4.86L17 8.42H7Z"/>
    <rect x="5.7" y="11.3" width="12.6" height="9.65" rx=".18" fill="none" stroke="#8597A3" stroke-width="1.1"/>
  </g>
  <path fill="#F7F8F9" fill-rule="evenodd" d="M11.341 13.28L11.357 12.603L12.643 12.603L12.659 13.28A2.92 2.92 0 0 1 13.545 13.647L14.035 13.18L14.945 14.09L14.478 14.58A2.92 2.92 0 0 1 14.845 15.466L15.522 15.482L15.522 16.768L14.845 16.784A2.92 2.92 0 0 1 14.478 17.67L14.945 18.16L14.035 19.07L13.545 18.603A2.92 2.92 0 0 1 12.659 18.97L12.643 19.647L11.357 19.647L11.341 18.97A2.92 2.92 0 0 1 10.455 18.603L9.965 19.07L9.055 18.16L9.522 17.67A2.92 2.92 0 0 1 9.155 16.784L8.478 16.768L8.478 15.482L9.155 15.466A2.92 2.92 0 0 1 9.522 14.58L9.055 14.09L9.965 13.18L10.455 13.647A2.92 2.92 0 0 1 11.341 13.28ZM12 14.775A1.35 1.35 0 1 1 12 17.475A1.35 1.35 0 1 1 12 14.775Z"/>
</svg>` }),
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
export function activeDesktopAngle({ standardViewPreset, viewPreset }) {
  if (typeof standardViewPreset === 'string' && standardViewPreset.startsWith('elev-')) return standardViewPreset;
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
