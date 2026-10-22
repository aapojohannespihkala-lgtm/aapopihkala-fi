import manifest from './private-model-source-cards/integration_manifest.json' with { type: 'json' };
import lookup from './private-model-source-cards/selection_lookup.json' with { type: 'json' };
import electrical from './private-model-source-cards/modules/D2015/source_cards.json' with { type: 'json' };
import switches from './private-model-source-cards/modules/KPH09_SWITCH/source_cards.json' with { type: 'json' };
import mirror from './private-model-source-cards/modules/KPH_MIRROR/source_cards.json' with { type: 'json' };
import versionBindings from './private-model-source-cards/version_bindings.json' with { type: 'json' };

// Keep private sidecars in the Worker bundle, never in public Astro assets.
// Original module bytes and roles are preserved; this is a read-only adapter.
export const privateModelSourceCards = {
  schema: 'ylisrinne-viewer-source-cards-v1',
  manifest,
  lookup,
  modules: { D2015: electrical, KPH09_SWITCH: switches, KPH_MIRROR: mirror },
  versionBindings,
};
