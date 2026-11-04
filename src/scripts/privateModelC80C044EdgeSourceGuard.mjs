// C80-044: narrowly enable the existing conservative T-junction filter
// for the exact V69 D 2F/BOTH work-test source. Does not hide physical edges.

export function shouldSuppressC044CoplanarTJunctions({
  hi20Verified = false,
  loadedSha = null,
  expectedSha = null,
  preset = '',
  v69SourceSha = null,
} = {}) {
  if (preset !== 'd-2f' && preset !== 'd-apartment') return false;
  // Preserve the already deployed HI20-specific behavior exactly.
  if (hi20Verified === true) return true;
  // Both identifiers are populated by the authenticated, source-verified
  // model load. A SHA-only guess or mismatched candidate must fail closed.
  return typeof v69SourceSha === 'string' && /^[a-f0-9]{64}$/.test(v69SourceSha) &&
    loadedSha === v69SourceSha && expectedSha === v69SourceSha;
}
