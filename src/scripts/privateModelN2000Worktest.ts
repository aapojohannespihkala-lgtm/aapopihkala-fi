/**
 * Unpublished / conditional vertical worktest.
 *
 * YLIS-G1-LOCAL Z=0 corresponds to the C-D first-floor *drawing* elevation
 * +21.750 m on 1974-204-A-P-2.tif. The 1974 vertical datum is UNRESOLVED.
 * Only if it is N60 may the N60->N2000 correction below be applied.
 *
 * The correction IS the exact MML TINshift interpolation (not Espoo's +0.247m
 * generic sanity value). Calculation point: G1 LOCAL origin projected
 * from EPSG:3879 E25485619.391/N6673676.113 into YKJ EPSG:2393
 * E3374797.294442842/N6675924.719226898 (PROJ transformer).
 *
 * MML official 2020-10-10 triangulation file, PROJ-data:
 * OSGeo/PROJ-data: fi_nls/fi_nls_n60_n2000.json
 * Git blob SHA: 0393ea2d7345dd7d8c5aeb1d4b3a92d9118c2976
 * Triangle index 38, vertex indices [12,37,33], E/N and N60/N2000 heights.
 * https://www.maanmittauslaitos.fi/kartat-ja-paikkatieto/koordinaatit-ja-paikannus/koordinaattimuunnokset/korkeusjarjestelmat
 *
 * Triangles and heights CC-BY-4.0, National Land Survey of Finland (MML).
 * NEVER treat the conditional result as a verified N2000/as-built elevation.
 */
export const HISTORICAL_DRAWING_C_D_FIRST_FLOOR_M = 21.750;
export const ESPOO_MUNICIPAL_N60_N2000_SANITY_M = 0.247;
export const CONDITIONAL_DATUM_STATUS = 'WORK_TEST_HISTORICAL_N60_UNVERIFIED' as const;
export type VerticalDisplayMode = 'local' | 'n2000-worktest';

const siteYKJ = { e: 3374797.294442842, n: 6675924.719226898 };
const tinTriangle38 = [
  { e: 3366264, n: 6677298, n60: 9.410, n2000: 9.66317 }, // MML vertex 12
  { e: 3385545, n: 6673315, n60: 2.955, n2000: 3.20809 }, // MML vertex 37
  { e: 3395565, n: 6707692, n60: 48.854, n2000: 49.11079 }, // MML vertex 33
] as const;

function interpolateOfficialTinshift(e: number, n: number): number {
  const [a, b, c] = tinTriangle38;
  const determinant = (b.n - c.n) * (a.e - c.e) + (c.e - b.e) * (a.n - c.n);
  const wa = ((b.n - c.n) * (e - c.e) + (c.e - b.e) * (n - c.n)) / determinant;
  const wb = ((c.n - a.n) * (e - c.e) + (a.e - c.e) * (n - c.n)) / determinant;
  const wc = 1 - wa - wb;
  if (![wa, wb, wc].every((w) => Number.isFinite(w) && w >= -1e-9)) {
    throw new Error('MML TINshift point is outside source triangle 38');
  }
  return wa * (a.n2000 - a.n60) +
    wb * (b.n2000 - b.n60) +
    wc * (c.n2000 - c.n60);
}

export const MML_N60_TO_N2000_YLIS_SITE_M = interpolateOfficialTinshift(
  siteYKJ.e,
  siteYKJ.n,
);
// Conditional floor N2000 = +22.003174579... m, ONLY if 1974 source was N60.
export const CONDITIONAL_N2000_ZERO_ESTIMATE_M =
  HISTORICAL_DRAWING_C_D_FIRST_FLOOR_M + MML_N60_TO_N2000_YLIS_SITE_M;

export function worktestDisplayedZ(localZ: number, mode: VerticalDisplayMode): number {
  if (!Number.isFinite(localZ)) throw new Error('Finite local Z required');
  return mode === 'local' ? localZ : localZ + CONDITIONAL_N2000_ZERO_ESTIMATE_M;
}
