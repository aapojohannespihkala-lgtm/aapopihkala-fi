/**
 * Desktop icon toolbar for the private Ylisrinne viewer (owner decisions 21.11.2026):
 * - one-click preset icons (D 1F, D 2F, whole D, D with roof, whole building, technical review)
 * - one-click camera-angle icons (3D, isometric, plan, four elevations)
 * - a small arrow at the right edge of each group opens the remaining choices
 * - Layers opens the existing layer tree from its own icon
 * The toolbar only calls the viewer's existing actions; it never changes model data.
 */
const svg = (body) =>
  `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round">${body}</svg>`;
// One visual language (owner feedback 22.11.2026): every building icon uses the
// same house outline (roof + two storeys); fills mark what the preset shows.
const F = 'fill="currentColor" fill-opacity=".55"';
const house = (fillLower, fillUpper, roof, extra = '') =>
  `<path d="M4 11 L12 4 L20 11" ${roof ? F : ''}/>` +
  `<rect x="6" y="11" width="12" height="4.5" ${fillUpper ? F : ''}/>` +
  `<rect x="6" y="15.5" width="12" height="4.5" ${fillLower ? F : ''}/>` + extra;
const elev = (letter) =>
  house(false, false, false).replace(/<rect[^>]*\/>/g, '') +
  `<rect x="6" y="11" width="12" height="9"/>` +
  `<text x="12" y="18.2" text-anchor="middle" font-size="7" font-weight="700" font-family="sans-serif" fill="currentColor" stroke="none">${letter}</text>`;
// Cube shapes shared by the camera and edge icons.
const ISO_CUBE = '<path d="M12 3.5 L19.5 7.8 V16.2 L12 20.5 L4.5 16.2 V7.8 Z"/>';
const ISO_FRONT_EDGES = '<path d="M4.5 7.8 L12 12 L19.5 7.8 M12 12 V20.5"/>';
const ISO_HIDDEN_EDGES = '<path d="M12 3.5 V12 M4.5 16.2 L12 12 M19.5 16.2 L12 12" stroke-dasharray="1.6 1.6" opacity=".75"/>';

/**
 * WORK_TEST opened by a plain /private-model/. Owner 21.11.2026: latest WORK_TEST.
 * Owner 22.11.2026 (04.11): roof in the model and the whole building forward.
 * R31 9e0bf34f scene 769 = R22 scene 688 (468/480 roots shared) + whole-building
 * roof group (intendedViewerLayer 'roof') + ABC building masses. Its D-scope
 * presets looked odd; the start therefore opens the whole building with the roof.
 * 23.11.2026: R32H c26d99c1 (R31 + baked gables/gutters/downpipes, P6 V8 carport,
 * hallface SW04/SW05) replaces R31 as the latest WORK_TEST after its production
 * WebGL check (scenes 814-817, Layerit/technical/site networks, no runtime doubles).
 * 23.11.2026 20.30: R33 3a226f98 (R32H + D2F WC open door leaf out of the wall end and
 * floor) after its production check (818/820 receipts, Layerit, technical review, networks).
 */
export const DESKTOP_START_CANDIDATE_ID = 'c80-r33-3a226f98-d-2f-sc818-sc821-work-test';

export const DESKTOP_PRESETS = Object.freeze([
  Object.freeze({ id: 'd-1f', label: 'D alakerta', icon: svg(house(true, false, false)) }),
  Object.freeze({ id: 'd-2f', label: 'D yläkerta', icon: svg(house(false, true, false)) }),
  Object.freeze({ id: 'd-apartment', label: 'Koko D, katto piilossa', icon: svg(house(true, true, false)) }),
  Object.freeze({ id: 'd-roof', label: 'Koko D katolla', icon: svg(house(true, true, true)) }),
  // Same storeys and roof, but the whole row house: three units, all shown.
  Object.freeze({ id: 'whole-building', label: 'Koko rakennus', aria: 'rakennus kokonaan', icon: svg(
    `<path d="M1.5 11 L6 7 H18 L22.5 11" ${F}/><rect x="2.5" y="11" width="19" height="9" ${F}/><path d="M8.8 11 V20 M15.2 11 V20"/>`) }),
  // Same house outline with a pipe run inside it.
  Object.freeze({ id: 'technical', label: 'Talotekniikka korostettuna', toggle: true, icon: svg(
    house(false, false, false).replace(/<rect[^>]*\/>/g, '') + '<rect x="6" y="11" width="12" height="9"/>' +
    '<path d="M9 20 V14 H15 V11" stroke-width="2.2"/><circle cx="9" cy="14" r="1.3" fill="currentColor" stroke="none"/>') }),
]);
export const DESKTOP_ANGLES = Object.freeze([
  // Perspective: the far face is smaller and the side edges converge.
  Object.freeze({ id: 'orbit', label: 'Vapaa 3D (perspektiivi)', aria: '3D, vapaa kierto', icon: svg(
    '<rect x="3.5" y="9" width="11" height="11"/><path d="M3.5 9 L11.5 4 H19.5 V12.5 L14.5 20 M14.5 9 L19.5 4"/><path d="M11.5 4 V12.5 H19.5 M11.5 12.5 L3.5 20" stroke-dasharray="1.6 1.6" opacity=".6"/>') }),
  // Isometric: parallel edges, equal sides.
  Object.freeze({ id: 'iso', label: 'Isometrinen', aria: 'isometria', icon: svg(ISO_CUBE + ISO_FRONT_EDGES) }),
  Object.freeze({ id: 'top', label: 'Pohja ylhäältä', icon: svg('<rect x="4" y="4" width="16" height="16"/><path d="M4 11 H13 V4 M13 11 V20"/>') }),
  Object.freeze({ id: 'elev-pos-y', label: 'Julkisivu +Y (pohjoinen, YLIS-G1)', icon: svg(elev('N')) }),
  Object.freeze({ id: 'elev-neg-y', label: 'Julkisivu −Y (etelä, YLIS-G1)', icon: svg(elev('S')) }),
  Object.freeze({ id: 'elev-pos-x', label: 'Julkisivu +X (itä, YLIS-G1)', icon: svg(elev('E')) }),
  Object.freeze({ id: 'elev-neg-x', label: 'Julkisivu −X (länsi, YLIS-G1)', icon: svg(elev('W')) }),
]);
// Edge presentation (owner feedback 22.11.2026): same one-click group as presets.
export const DESKTOP_EDGES = Object.freeze([
  Object.freeze({ id: 'none', label: 'Ei reunaviivoja', icon: svg(
    '<path d="M12 3.5 L19.5 7.8 V16.2 L12 20.5 L4.5 16.2 V7.8 Z" fill="currentColor" fill-opacity=".55" stroke="none"/><path d="M4.5 7.8 L12 12 L19.5 7.8 L12 3.5 Z" fill="currentColor" fill-opacity=".35" stroke="none"/>') }),
  Object.freeze({ id: 'object', label: 'Objektireunat', icon: svg(ISO_CUBE) }),
  Object.freeze({ id: 'unified', label: 'Yhdistetyt reunat (myös piilossa olevat)', icon: svg(ISO_CUBE + ISO_FRONT_EDGES + ISO_HIDDEN_EDGES) }),
  Object.freeze({ id: 'visible', label: 'Näkyvät reunat', icon: svg(ISO_CUBE + ISO_FRONT_EDGES) }),
]);
export const DESKTOP_LAYERS_ICON = svg('<path d="M12 4 L21 9 L12 14 L3 9 Z"/><path d="M3 13 L12 18 L21 13"/><path d="M3 17 L12 22 L21 17" opacity=".6"/>');
export const DESKTOP_MORE_ICON = svg('<path d="M8 10 L12 14 L16 10"/>');

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
 * Build the toolbar. `actions` = { preset(id), angle(id), edge?(id), layers(), morePresets(anchor), moreAngles(anchor) }.
 * Returns { root, sync(state) } where state = { preset, angle, technical, layersOpen, edge }.
 */
export function mountDesktopToolbar(doc, actions) {
  const root = doc.createElement('div');
  root.className = 'desk-toolbar';
  root.setAttribute('role', 'toolbar');
  root.setAttribute('aria-label', 'Näkymät ja kuvakulmat');
  const buttons = new Map();
  const group = (name, items, kind, more) => {
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
    if (more) {
      const m = doc.createElement('button');
      m.type = 'button';
      m.className = 'desk-more';
      m.title = `Lisää: ${name.toLowerCase()}`;
      m.setAttribute('aria-label', `Lisää: ${name.toLowerCase()}`);
      m.innerHTML = DESKTOP_MORE_ICON;
      m.addEventListener('click', (event) => { event.stopPropagation(); more(m); });
      g.append(m);
    }
    return g;
  };
  root.append(
    group('Presetit', DESKTOP_PRESETS, 'preset', actions.morePresets),
    group('Kuvakulmat', DESKTOP_ANGLES, 'angle', actions.moreAngles),
  );
  if (actions.edge) root.append(group('Reunaviivat', DESKTOP_EDGES, 'edge', null));
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
