import type {
  TechnicalAvailabilityReason,
  TechnicalSourceRole,
  TechnicalSystemSummary,
} from './privateModelTechnicalSystemsLayers';

/**
 * A compact, source-honest explanation surface for HIGH2 technical Layers.
 * Presentation only: does not change layer modes, geometry, source cards,
 * source hashes, selected scenes, authorization or source-owned visibility.
 */
export type TechnicalAvailabilityRow = {
  id: TechnicalSystemSummary['id'];
  label: string;
  supported: boolean;
  message: string;
  provenance: string;
  count: number;
};

const reasonFi: Readonly<Record<TechnicalAvailabilityReason, string>> = {
  AVAILABLE: 'Mallissa on tähän näkymään sidottuja esitysobjekteja.',
  NO_OBJECTS_IN_SCENE: 'Valitusta malliscenestä ei löydy tähän ryhmään tunnistettuja objekteja.',
  SOURCE_MISMATCH: 'Lähdemallin SHA-256 ei vastaa varmennettua versiota.',
  UNVERIFIED_NODE_IDENTITY: 'Objektin scene-, node-, mesh- tai parent-lähdesidonta ei ole varmennettu.',
  UNVERIFIED_SCOPE: 'Objektin asunto- tai kerrosrajausta ei ole varmennettu.',
  OUTSIDE_SCOPE: 'Lähdeobjektit eivät kuulu valittuun asuntoon tai kerrokseen.',
  OPT_IN_REQUIRED: 'Lähde- tai suunnitelmaesitys edellyttää erillistä tutkimusnäkymän valintaa.',
  LAYER_ID_PENDING: 'Tämän ryhmän yhteinen Layers-ohjain puuttuu.',
};

const provenanceFi: Readonly<Record<TechnicalSourceRole, string>> = {
  WORK_TEST_SOURCE: 'WORK_TEST-lähde-esitys. Ei nykyasennuksen tai sijainnin toteumavarmennus.',
  HISTORICAL_PLAN: 'Historiallinen suunnitelma. Ei nykyisen asennuksen toteumavarmennus.',
  REFERENCE_ONLY: 'Lähdeviite tai tutkimusesitys. Ei toteumavarmennus.',
};

/** UI considers a layer actionable only when the inventory has real bindings. */
export const buildTechnicalAvailabilityRows = (
  summaries: readonly TechnicalSystemSummary[],
): TechnicalAvailabilityRow[] =>
  summaries.map(item => {
    // Runtime inventory data can be malformed even when static TS types are valid.
    // Unknown provenance must never be advertised as an available layer.
    const sourceRoleVerified = Object.hasOwn(provenanceFi, item.sourceRole);
    const supported =
      sourceRoleVerified &&
      item.reason === 'AVAILABLE' &&
      item.availability === 'available' &&
      Number.isSafeInteger(item.boundCount) && item.boundCount > 0;
    return {
      id: item.id,
      label: item.labelFi,
      supported,
      count: supported ? item.boundCount : 0,
      message: supported
        ? `Saatavilla: ${item.boundCount} mallin esitysobjektia.`
        : !sourceRoleVerified
          ? 'Ei käytettävissä: lähteen asemaa ei ole varmennettu.'
          : item.reason === 'AVAILABLE'
            ? 'Ei käytettävissä: vahvistettu objektisidonta puuttuu.'
            : reasonFi[item.reason] ?? 'Saatavuutta ei ole varmennettu.',
      provenance: provenanceFi[item.sourceRole] ?? 'Lähteen asema ei ole varmennettu.',
    };
  });

export type TechnicalAvailabilityView = {
  root: HTMLDetailsElement;
  update: (summaries: readonly TechnicalSystemSummary[]) => void;
  destroy: () => void;
};

/**
 * Attach once under the existing Layers panel's note, then call update()
 * whenever the selected source scene / floor / scope changes. A <details>
 * disclosure keeps unavailable reasons readable without crowding mobile UI.
 * This component never creates interactive visibility switches itself.
 */
export const mountTechnicalLayerAvailability = (
  host: HTMLElement,
  initial: readonly TechnicalSystemSummary[] = [],
): TechnicalAvailabilityView => {
  if (host.querySelector('[data-technical-layer-availability]')) {
    throw new Error('Technical Layers availability display already mounted');
  }

  const doc = host.ownerDocument;
  const root = doc.createElement('details');
  root.dataset.technicalLayerAvailability = '';
  root.className = 'yl-technical-layer-availability';
  const summary = doc.createElement('summary');
  summary.setAttribute('aria-live', 'polite');
  const list = doc.createElement('ul');
  list.className = 'yl-technical-layer-availability-list';
  const note = doc.createElement('p');
  note.textContent =
    'Himmeä on esitystapa, ei lähdetiedon varmuustaso. Historialliset suunnitelmat eivät osoita nykyisiä asennuksia.';
  note.className = 'layer-note';
  root.append(summary, list, note);
  host.append(root);

  let destroyed = false;
  const update = (items: readonly TechnicalSystemSummary[]) => {
    if (destroyed) throw new Error('Technical Layers availability display destroyed');
    const rows = buildTechnicalAvailabilityRows(items);
    const available = rows.filter(row => row.supported).length;
    // An empty list means no current, source-verified inventory was supplied.
    // In particular, never leave the previous model's availability displayed.
    root.dataset.availabilityState = rows.length ? 'source-inventory' : 'unverified';
    summary.textContent = rows.length
      ? `Teknisten järjestelmien saatavuus: ${available}/${rows.length} ryhmää. Näytä puuttuvan tuen syyt.`
      : 'Teknisten järjestelmien saatavuutta ei ole vielä varmennettu tässä näkymässä.';
    list.replaceChildren();
    for (const row of rows) {
      const item = doc.createElement('li');
      item.dataset.technicalLayer = row.id;
      item.dataset.available = row.supported ? 'true' : 'false';
      const name = doc.createElement('strong');
      name.textContent = row.label;
      const message = doc.createElement('span');
      message.textContent = ' - ' + row.message;
      const provenance = doc.createElement('small');
      provenance.textContent = ' ' + row.provenance;
      item.append(name, message, provenance);
      list.append(item);
    }
  };

  update(initial);
  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    root.remove();
  };
  return { root, update, destroy };
};
