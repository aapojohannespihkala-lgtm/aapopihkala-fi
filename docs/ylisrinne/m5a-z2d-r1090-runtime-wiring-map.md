# M5A-Z2D R1090/R1091 runtime wiring map

## Purpose

This note pins the current post-runtime, post-publish, and one-link contract state for the M5A-Z2D R1090 well-top ground-surface WORK_TEST successor. PR #1008 superseded the earlier runtime-patch plan by adding the exact runtime allowlist candidate and focused regression on `main`.

This R1128 refresh recorded the later release-pipeline state on `main`: PR #1022 re-opened and merged the route/source-map parity regression from current `main`, and PR #1023 updated `Publish WORK_TEST` so the selected WORK_TEST candidate is visible in the Actions run name.

This R1130 refresh records that the V5 machine publish/readback gate has now passed for the exact R1090 candidate. The next gate is no longer workflow dispatch or production byte readback; it is one-link review/autoload and authenticated render visibility for the review URL.

This R1131 refresh records that the one-link review URL contract guard has now landed on `main` in PR #1027. The next gate is no longer one-link URL shape or review-id resolution; it is authenticated one-link autoload and question-specific render visibility for the exact R1090 candidate.

This R1132 refresh records the post-#1052 authenticated user retry failure: after PR #1052 was merged, production-built, and verify-closed, the same one-link review URL still showed `WORK_TEST-kandidaattia ei voitu avata`. The R1090 user review loop is therefore retired until a machine-observable technical change proves a different autoload/render result.

The 9.10.2026 R1091 refresh keeps the stable candidate/review id and production object path, while the raw Drive source is now the R1091 PVK-snap successor. Publish run `37965098816` derived that new raw identity successfully and then failed with HTTP 422 because the Worker runtime still validated the old R1090 size/SHA. The active gate is therefore runtime identity parity.

## Exact candidate

- Candidate id: `m5a-z2d-r1090-well-top-ground-surface`
- Drive file ID: `13eciLeS58jwGLzy-TUhePIF7h7177zHj`
- Object key: `work-test/m5a-z2d-r1090-well-top-ground-surface.glb`
- Production path: `/private-model/work-test/m5a-z2d-r1090-well-top-ground-surface.glb`
- Expected size: `3_103_036`
- Expected SHA-256: `3adf908ae64ff75a235823223f32b1cf36de16fb03321e75c8816dd16212739a`

## Current main runtime state

`worker/privateWorkTest.ts` on `main` exposes `M5A_Z2D_R1090_WELL_TOP_GROUND_SURFACE_CANDIDATE` with the exact id, label, path, object key, size, and SHA-256 above. `PRIVATE_WORK_TEST_RUNTIME_CANDIDATES` includes it after the legacy `M5A_Z2D_D100_D300_DIAMETER_CANDIDATE`, so the older D100/D300 candidate remains available.

The focused regression `tests/e2e/private-model-m5a-z2d-r1090-runtime-allowlist.spec.ts` proves that the R1090 candidate resolves by id, by private-model path, by upload path, by publish path, and by verify GLB path.

The focused route/source-map regression `tests/e2e/private-model-m5a-z2d-r1090-routing-source-map-parity.spec.ts` proves that the conventional review query `m5a-z2d-r1090-well-top-ground-surface-review` resolves to `m5a-z2d-r1090-well-top-ground-surface` and that `.github/work-test-candidates.json` maps the stable candidate id to the R1091 Drive file `13eciLeS58jwGLzy-TUhePIF7h7177zHj`.

The focused one-link contract regression `tests/e2e/private-model-m5a-z2d-r1090-one-link-review-contract.spec.ts` pins the canonical production review URL to `https://aapopihkala.fi/private-model/?review=m5a-z2d-r1090-well-top-ground-surface-review`, proves that it uses only the `review` query parameter, proves that it does not depend on GLB/file/source/upload/path transport parameters, and proves that the review query resolves to `m5a-z2d-r1090-well-top-ground-surface`.

PR #1052 landed the first post-auth-failure code fix on `main`: it accepts the R1090/R1036 successor pass tokens and `pipeDiameterPresentationWork` route targets in the M5A-Z2 presentation/runtime guards. Because the authenticated retry still failed after that merge, the remaining active blocker is no longer the known successor-token / route-kind guard gap fixed by #1052.

## Historical R1090 V5 publish/readback status

Run `37835730136` successfully published and read back the earlier R1090 raw artifact. That PASS is historical evidence for the old raw identity only and is not proof for the R1091 successor now mapped to the stable candidate id.

## R1091 V5 publish/readback status

The current raw identity is:

```text
candidate: m5a-z2d-r1090-well-top-ground-surface
Drive file: 13eciLeS58jwGLzy-TUhePIF7h7177zHj
path: /private-model/work-test/m5a-z2d-r1090-well-top-ground-surface.glb
size: 3103036
sha256: 3adf908ae64ff75a235823223f32b1cf36de16fb03321e75c8816dd16212739a
```

Publish WORK_TEST - m5a-z2d-r1090-well-top-ground-surface

Run `37965098816` failed at the machine publish PUT with HTTP 422 after trusted dispatch, candidate resolution, machine authentication, Drive authentication, raw GLB download, and raw byte identity derivation had passed. The failure is a runtime identity mismatch: the source map already points to the R1091 Drive artifact, while the Worker runtime still expected the previous R1090 size and SHA.

This patch aligns the Worker runtime allowlist, regression tests, and this wiring note to the R1091 raw identity. Do not claim machine publish/readback PASS yet. The safe release gate is to retry only after this runtime identity patch is merged and deployed. That retry must then prove machine publish, production catalog readback, and full production GLB size/SHA parity.

## Review/autoload gate

The review route uses this one-link URL:

```text
https://aapopihkala.fi/private-model/?review=m5a-z2d-r1090-well-top-ground-surface-review
```

Do not repeat the static one-link URL contract guard for this same candidate unless the URL, query parameter, review resolver, or route/source-map contract changes. The current blocker is upstream at the R1091 machine-publish identity gate.

Do not ask the user to retry this same R1090 review link again while the only visible outcome remains `WORK_TEST-kandidaattia ei voitu avata`. The next work is AI-owned code/runtime diagnostics.

Before any HUMAN_REVIEW content question, the next pass must verify authenticated one-link live behavior: the URL must autoload the exact `m5a-z2d-r1090-well-top-ground-surface` WORK_TEST candidate without user file transfer and render the relevant R1090 well-top ground-surface correction in a question-specific viewable presentation state.

If no authenticated live render probe is available, the state is `VISIBILITY_PROBE_REQUIRED`, not `READY_FOR_HUMAN_REVIEW`. In that case the next user-facing step may only be a technical visibility probe, not a content approval question.

## Post-#1052 failure boundary

The production-visible error string is currently not specific enough to distinguish these cases:

- catalog/autoload failed before a candidate object was selected
- the GLB path failed to load
- the GLB loaded, but `applyM5aDrainageReviewState('Z2_ABSOLUTE_Z_SYSTEM')` threw inside the presentation guard
- the GLB loaded, but a later viewer/runtime step threw before the review dataset reached the canvas

The next useful code pass should not re-run publish/readback or ask for another human retry. It should make the R1090 autoload failure machine-observable by splitting `loadWorkTestCandidate` failure reporting into phase-specific state such as `catalog-missing`, `gltf-load-failed`, `m5a-z2-presentation-guard-failed`, and `review-runtime-failed`, while preserving the existing no-promotion boundaries. After that, a machine probe can identify the remaining root cause without another user-facing faulty review loop.

## Boundaries

This mapping note does not change GLB bytes, G1/G2/G3, datacube fact layer, source-map contents, runtime allowlist, review alias/autoload wiring, production bytes, CURRENT/canonical/as-built state, publishToCURRENT, or HUMAN_REVIEW.

## Follow-up

Continue by merging and deploying the R1091 runtime identity parity patch, then retry the exact machine publish once. Only after publish/catalog/full-GLB identity and exact candidate autoload/render visibility pass may the work proceed to a narrowly scoped human content review question. Do not promote this WORK_TEST successor to CURRENT, canonical, as-built, or publishToCURRENT from this note.
