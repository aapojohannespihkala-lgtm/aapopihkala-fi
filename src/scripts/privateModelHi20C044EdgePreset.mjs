// C80-044: protect source-verified HI20/U64 facade presets from artificial
// viewer edge overlays when a different preset initialized layers first.
// Never override a user-selected edge mode; never modify source geometry.
const SEAM_FREE_PRESETS = new Set(['d-2f', 'd-apartment']);
export function shouldApplyC044SeamlessEdgeDefault({
  sourceVerified, preset, edgeModeManuallySelected, edgeMode,
}) {
  return sourceVerified === true &&
    SEAM_FREE_PRESETS.has(preset) &&
    edgeModeManuallySelected === false &&
    ['object', 'unified', 'visible'].includes(edgeMode);
}
