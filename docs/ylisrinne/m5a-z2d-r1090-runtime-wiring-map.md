# M5A-Z2D R1090 runtime wiring map

## Purpose

This note pins the next code-gate patch for the M5A-Z2D R1090 well-top ground-surface WORK_TEST successor after PR #1003 registered the machine-publish source map.

## Exact candidate

- Candidate id: `m5a-z2d-r1090-well-top-ground-surface`
- Drive file ID: `1GhIyPFE2dqfrZpH257U-2Wp8c_d2wfD_`
- Object key: `work-test/m5a-z2d-r1090-well-top-ground-surface.glb`
- Expected size: `3_089_152`
- Expected SHA-256: `e8934e546f2a89a2cc070c44ef9f4d6f6df8f5dd2bb30c1c7379b7f821d85605`

## Required next code patch

The next implementation PR should update `worker/privateWorkTest.ts` by adding a `PrivateWorkTestCandidate` for `m5a-z2d-r1090-well-top-ground-surface` and include that candidate in `PRIVATE_WORK_TEST_RUNTIME_CANDIDATES`.

A focused backend regression should prove that:

1. `getPrivateWorkTestCandidateById('m5a-z2d-r1090-well-top-ground-surface')` resolves the candidate.
2. The candidate path is `${PRIVATE_MODEL_PREFIX}/work-test/m5a-z2d-r1090-well-top-ground-surface.glb`.
3. The object key, expected size, and SHA-256 match the exact candidate above.
4. The older `m5a-z2d-d100-d300-diameter` runtime candidate remains available.

## Boundaries

This mapping note does not change GLB bytes, G1/G2/G3, datacube fact layer, source-map contents, runtime allowlist, review alias/autoload wiring, production, CURRENT/canonical/as-built state, publishToCURRENT, or HUMAN_REVIEW.

## Follow-up

After this map is merged or superseded by an implementation PR, continue with the actual runtime allowlist patch, review-route/autoload wiring if needed, then machine publish/readback and authenticated render before any human content review question.
