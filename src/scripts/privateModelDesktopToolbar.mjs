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
const house = (fillLower, fillUpper, roof) =>
  `<path d="M4 11 L12 4 L20 11" ${roof ? 'fill="currentColor" fill-opacity=".55"' : ''}/>` +
  `<rect x="6" y="11" width="12" height="4.5" ${fillUpper ? 'fill="currentColor" fill-opacity=".55"' : ''}/>` +
  `<rect x="6" y="15.5" width="12" height="4.5" ${fillLower ? 'fill="currentColor" fill-opacity=".55"' : ''}/>`;
const elev = (letter) =>
  `<path d="M4 19 V10 L12 5 L20 10 V19 Z"/><text x="12" y="17" text-anchor="middle" font-size="7.5" font-family="sans-serif" fill="currentColor" stroke="none">${letter}</text>`;

/** Latest published WORK_TEST opened by a plain /private-model/ (owner decision 21.11.2026). */
export const DESKTOP_START_CANDIDATE_ID = 'c80-r31-9e0bf34f-d-2f-sc769-sc772-work-test';

export const DESKTOP_PRESETS = Object.freeze([
  Object.freeze({ id: 'd-1f', label: 'D alakerta', icon: svg(house(true, false, false)) }),
  Object.freeze({ id: 'd-2f', label: 'D yläkerta', icon: svg(house(false, true, false)) }),
  Object.freeze({ id: 'd-apartment', label: 'Koko D, katto piilossa', icon: svg(house(true, true, false)) }),
  Object.freeze({ id: 'd-roof', label: 'Koko D katolla', icon: svg(house(true, true, true)) }),
  Object.freeze({ id: 'whole-building', label: 'Koko rakennus', aria: 'rakennus kokonaan', icon: svg(
    '<path d="M2 12 L7 8 L12 12 L17 8 L22 12"/><rect x="3" y="12" width="18" height="8"/><path d="M9 12 V20 M15 12 V20"/>') }),
  Object.freeze({ id: 'technical', label: 'Talotekniikka korostettuna', toggle: true, icon: svg(
    '<path d="M3 7 H13 V17 H21"/><circle cx="13" cy="7" r="1.6"/><path d="M3 15 H8 V21" stroke-dasharray="2 2"/>') }),
]);
export const DESKTOP_ANGLES = Object.freeze([
  Object.freeze({ id: 'orbit', label: 'Vapaa 3D', aria: '3D, vapaa kierto', icon: svg('<path d="M12 3 L20 7.5 V16.5 L12 21 L4 16.5 V7.5 Z"/><path d="M4 7.5 L12 12 L20 7.5 M12 12 V21"/>') }),
  Object.freeze({ id: 'iso', label: 'Isometrinen', aria: 'isometria', icon: svg('<path d="M12 4 L20 8.5 L12 13 L4 8.5 Z"/><path d="M4 8.5 V15.5 L12 20 L20 15.5 V8.5 M12 13 V20"/>') }),
  Object.freeze({ id: 'top', label: 'Pohja ylhäältä', icon: svg('<rect x="4" y="4" width="16" height="16"/><path d="M4 11 H13 V4 M13 11 V20"/>') }),
  Object.freeze({ id: 'elev-pos-y', label: 'Julkisivu +Y (pohjoinen, YLIS-G1)', icon: svg(elev('N')) }),
  Object.freeze({ id: 'elev-neg-y', label: 'Julkisivu −Y (etelä, YLIS-G1)', icon: svg(elev('S')) }),
  Object.freeze({ id: 'elev-pos-x', label: 'Julkisivu +X (itä, YLIS-G1)', icon: svg(elev('E')) }),
  Object.freeze({ id: 'elev-neg-x', label: 'Julkisivu −X (länsi, YLIS-G1)', icon: svg(elev('W')) }),
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
 * Build the toolbar. `actions` = { preset(id), angle(id), layers(), morePresets(anchor), moreAngles(anchor) }.
 * Returns { root, sync(state) } where state = { preset, angle, technical, layersOpen }.
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
      b.setAttribute('aria-label', `${kind === 'preset' ? 'Preset' : 'Kuvakulma'}: ${item.aria ?? item.label}`);
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
  const layers = doc.createElement('button');
  layers.type = 'button';
  layers.className = 'desk-icon desk-layers';
  layers.title = 'Layerit';
  layers.setAttribute('aria-label', 'Layerit');
  layers.setAttribute('aria-expanded', 'false');
  layers.innerHTML = DESKTOP_LAYERS_ICON;
  layers.addEventListener('click', (event) => { event.stopPropagation(); actions.layers(); });
  root.append(layers);
  const sync = ({ preset, angle, technical, layersOpen }) => {
    for (const [key, b] of buttons) {
      const [kind, id] = key.split(':');
      const on = kind === 'preset'
        ? (id === 'technical' ? !!technical : id === preset)
        : id === angle;
      b.setAttribute('aria-pressed', String(on));
    }
    layers.setAttribute('aria-expanded', String(!!layersOpen));
  };
  return { root, buttons, layers, sync };
}
