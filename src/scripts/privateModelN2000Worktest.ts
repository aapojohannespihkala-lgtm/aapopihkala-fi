/**
 * DRAFT ONLY. The drawing C-D finished-floor elevation (+21.750 m) is a
 * historical *drawing* reference. Its N60 datum has NOT been proved.
 *
 * The Espoo municipal +0.247 m N60->N2000 value is a sanity-check proxy.
 * A canonical conversion must use the official N60->N2000 MML TINshift
 * at the source XY after archival datum provenance is established.
 *
 * This module MUST NOT be used as a published/verified N2000 transform.
 *
 * Sources:
 * Ylisrinne 1974-204-A-P-2.tif (1974 C-D first-floor drawing reference).
 * Espoo/PKS coordinated N60->N2000 change 1.12.2012, 0.247 m local proxy.
 * MML N60/N2000 TINshift guidance:
 * https://www.maanmittauslaitos.fi/kartat-ja-paikkatieto/koordinaatit-ja-paikannus/koordinaattimuunnokset/korkeusjarjestelmat
 */
export const HISTORICAL_DRAWING_C_D_FIRST_FLOOR_M = 21.750;
export const ESPOO_MUNICIPAL_N60_TO_N2000_PROXY_M = 0.247;
export const CONDITIONAL_N2000_ZERO_ESTIMATE_M =
  HISTORICAL_DRAWING_C_D_FIRST_FLOOR_M + ESPOO_MUNICIPAL_N60_TO_N2000_PROXY_M;
export const CONDITIONAL_DATUM_STATUS = 'WORK_TEST_HISTORICAL_N60_UNVERIFIED' as const;
export type VerticalDisplayMode = 'local' | 'n2000-worktest';

export function worktestDisplayedZ(localZ: number, mode: VerticalDisplayMode): number {
  if (!Number.isFinite(localZ)) throw new Error('Finite local Z required');
  return mode === 'local' ? localZ : localZ + CONDITIONAL_N2000_ZERO_ESTIMATE_M;
}
