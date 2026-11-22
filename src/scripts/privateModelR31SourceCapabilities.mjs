// What the viewer may add on top of an accepted whole-building model, keyed by
// the model's exact GLB SHA-256 (fail closed: unknown SHA -> nothing).
//
// Two separate kinds of addition:
//  - siteNetworks: independent 2D/site sources (drainage, Locus water/wastewater,
//    fibre, stormwater, low voltage). They do not depend on the building GLB and
//    must survive a model change once the new model is accepted here.
//  - runtimeExterior: temporary building geometry the viewer adds because the
//    model lacks it (gable boarding/infill/brick, downpipes + gutters, carport
//    donor, fibre box, east gable copy). A successor model that bakes a part in
//    must set that key false, so the part is never shown twice.
//
// A new model (e.g. R32) is added only after its RELEASED receipt: exact SHA,
// scene/node checks and an explicit runtimeExterior list. Never by pattern.
import { C80_R31_9E0B_SOURCE } from './privateModelC80R31ReviewRuntime.mjs';

export const R31_RUNTIME_EXTERIOR_KEYS = Object.freeze([
  'eastGable', 'gableBoarding', 'rainwater', 'carport', 'fiberBox',
]);

const SHA_RE = /^[a-f0-9]{64}$/;

function freezeEntry(entry) {
  const runtimeExterior = {};
  for (const key of R31_RUNTIME_EXTERIOR_KEYS) {
    runtimeExterior[key] = entry?.runtimeExterior?.[key] === true;
  }
  return Object.freeze({
    label: String(entry?.label ?? ''),
    siteNetworks: entry?.siteNetworks === true,
    runtimeExterior: Object.freeze(runtimeExterior),
  });
}

/** Build a lookup from a { sha: entry } table. Exposed for tests. */
export function createViewerSourceCapabilities(table) {
  const map = new Map();
  for (const [sha, entry] of Object.entries(table ?? {})) {
    if (SHA_RE.test(sha)) map.set(sha, freezeEntry(entry));
  }
  return (sha) => {
    if (typeof sha !== 'string') return null;
    const key = sha.toLowerCase();
    if (!SHA_RE.test(key)) return null;
    return map.get(key) ?? null;
  };
}

export const R31_VIEWER_SOURCE_CAPABILITY_TABLE = Object.freeze({
  // R31 9e0bf34f scene769: nothing of the exterior additions is in the model.
  [C80_R31_9E0B_SOURCE.glbSha256]: Object.freeze({
    label: 'R31 9e0bf34f (scene769)',
    siteNetworks: true,
    runtimeExterior: Object.freeze({
      eastGable: true, gableBoarding: true, rainwater: true, carport: true, fiberBox: true,
    }),
  }),
});

export const r31ViewerSourceCapabilities = createViewerSourceCapabilities(R31_VIEWER_SOURCE_CAPABILITY_TABLE);

/** True only for an accepted model that explicitly allows this runtime part. */
export function r31RuntimeExteriorAllowed(capabilities, key) {
  return Boolean(capabilities && R31_RUNTIME_EXTERIOR_KEYS.includes(key) && capabilities.runtimeExterior[key] === true);
}
