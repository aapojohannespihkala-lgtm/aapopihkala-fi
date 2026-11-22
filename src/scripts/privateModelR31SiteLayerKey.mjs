/**
 * Map source-bound R31 site overlay groups to the three existing Layerit rows.
 * The fiber-entry drop/link belongs to the same optical network as Locus fiber,
 * not to a new layer or an independently claimed physical connection.
 */
export function r31SiteLayerKeyForNetwork(key) {
  if (key === 'fiberEntry') return 'fiber';
  if (key === 'fiber' || key === 'infra' || key === 'drainage') return key;
  return null;
}
