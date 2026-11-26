/** Optional WORK_TEST display for the Ylisrinne drawing frame.
 * G1c Z01 and Z05 bind model Z=0 to the 1974 C-D first-floor drawing
 * elevation +21.750 m, with N60 as the owner's working assumption.
 *
 * G1c Z05 records the site offset from MML's N60 to N2000 TINshift.
 * Source: National Land Survey of Finland (MML), CC BY 4.0, triangle 38.
 * https://github.com/OSGeo/PROJ-data/blob/master/fi_nls/fi_nls_n60_n2000.json
 * Source blob: 0393ea2d7345dd7d8c5aeb1d4b3a92d9118c2976.
 */
const drawingZeroN60M = 21.750;
const mmlSiteShiftToN2000M = 0.253174579;
const worktestZeroN2000M = drawingZeroN60M + mmlSiteShiftToN2000M;

export const CONDITIONAL_DATUM_STATUS = 'WORK_TEST_HISTORICAL_N60_UNVERIFIED' as const;
export type VerticalDisplayMode = 'local' | 'n2000-worktest';

export function worktestDisplayedZ(localZ: number, mode: VerticalDisplayMode): number {
  if (!Number.isFinite(localZ)) throw new Error('Finite local Z required');
  return mode === 'local' ? localZ : localZ + worktestZeroN2000M;
}
