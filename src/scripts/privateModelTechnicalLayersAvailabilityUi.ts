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

// The source inventory has exactly ten technical-system identities. Runtime
// inputs may violate their TypeScript type, so never invent an available row.
const canonicalTechnicalGroupIds: ReadonlySet<TechnicalSystemSummary['id']> = new Set([
  'technical-electrical',
  'technical-ventilation',
  'technical-heating',
  'technical-water',
  'technical-drainage',
  'locus-water',
  'locus-wastewater',
  'p161-kvv-2017',
  'p161-iv-1974-plan',
  'p161-iv-1974-section',
]);

/** UI considers a layer actionable only when the inventory has real bindings. */
export const buildTechnicalAvailabilityRows = (
  summaries: readonly TechnicalSystemSummary[],
): TechnicalAvailabilityRow[] => {
  // A malformed whole inventory must clear the previous model's rows.
  if (!Array.isArray(summaries)) return [];
  // Runtime inventory may contain malformed entries despite the TS contract.
  // Omit unsourced rows, but keep each valid sibling's verified status.
  // Array.isArray narrows readonly input to any[], so retain the typed contract.
  const verifiedShape: readonly TechnicalSystemSummary[] = summaries;
  return verifiedShape.filter(item => item !== null && typeof item === 'object' &&
    !Array.isArray(item) && typeof item.id === 'string' &&
    canonicalTechnicalGroupIds.has(item.id) &&
    typeof item.labelFi === 'string' && item.labelFi.length > 0).map(item => {
    // Runtime inventory data can be malformed even when static TS types are valid.
    // Only own source-role keys are trusted; inherited names are not provenance.
    const sourceRoleVerified = Object.hasOwn(provenanceFi, item.sourceRole);
    const supported =
      sourceRoleVerified &&
      item.reason === 'AVAILABLE' &&
      item.availability === 'available' &&
      Number.isSafeInteger(item.boundCount) && item.boundCount > 0 &&
      // Bound objects are a verified subset of source-matched objects.
      // An inconsistent runtime inventory must not advertise availability.
      Number.isSafeInteger(item.matchedCount) && item.matchedCount >= item.boundCount;
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
            : Object.hasOwn(reasonFi, item.reason)
              ? reasonFi[item.reason]
              : 'Saatavuutta ei ole varmennettu.',
      provenance: sourceRoleVerified
        ? provenanceFi[item.sourceRole]
        : 'Lähteen asema ei ole varmennettu.',
    };
  });
};

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
