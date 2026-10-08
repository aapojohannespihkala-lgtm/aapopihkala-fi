# M5A-Z2D R1090 runtime wiring map

## Purpose

This note pins the current post-runtime, post-publish, and one-link contract state for the M5A-Z2D R1090 well-top ground-surface WORK_TEST successor. PR #1008 superseded the earlier runtime-patch plan by adding the exact runtime allowlist candidate and focused regression on `main`.

This R1128 refresh recorded the later release-pipeline state on `main`: PR #1022 re-opened and merged the route/source-map parity regression from current `main`, and PR #1023 updated `Publish WORK_TEST` so the selected WORK_TEST candidate is visible in the Actions run name.

This R1130 refresh records that the V5 machine publish/readback gate has now passed for the exact R1090 candidate. The next gate is no longer workflow dispatch or production byte readback; it is one-link review/autoload and authenticated render visibility for the review URL.

This R1131 refresh records that the one-link review URL contract guard has now landed on `main` in PR #1027. The next gate is no longer one-link URL shape or review-id resolution; it is authenticated one-link autoload and question-specific render visibility for the exact R1090 candidate.

## Exact candidate

- Candidate id: `m5a-z2d-r1090-well-top-ground-surface`
- Drive file ID: `1GhIyPFE2dqfrZpH257U-2Wp8c_d2wfD_`
- Object key: `work-test/m5a-z2d-r1090-well-top-ground-surface.glb`
- Production path: `/private-model/work-test/m5a-z2d-r1090-well-top-ground-surface.glb`
- Expected size: `3_089_152`
- Expected SHA-256: `e8934e546f2a89a2cc070c44ef9f4d6f6df8f5dd2bb30c1c7379b7f821d85605`

## Current main runtime state

`worker/privateWorkTest.ts` on `main` exposes `M5A_Z2D_R1090_WELL_TOP_GROUND_SURFACE_CANDIDATE` with the exact id, label, path, object key, size, and SHA-256 above. `PRIVATE_WORK_TEST_RUNTIME_CANDIDATES` includes it after the legacy `M5A_Z2D_D100_D300_DIAMETER_CANDIDATE`, so the older D100/D300 candidate remains available.

The focused regression `tests/e2e/private-model-m5a-z2d-r1090-runtime-allowlist.spec.ts` proves that the R1090 candidate resolves by id, by private-model path, by upload path, by publish path, and by verify GLB path.

The focused route/source-map regression `tests/e2e/private-model-m5a-z2d-r1090-routing-source-map-parity.spec.ts` proves that the conventional review query `m5a-z2d-r1090-well-top-ground-surface-review` resolves to `m5a-z2d-r1090-well-top-ground-surface` and that `.github/work-test-candidates.json` maps the candidate to Drive file `1GhIyPFE2dqfrZpH257U-2Wp8c_d2wfD_`.

The focused one-link contract regression `tests/e2e/private-model-m5a-z2d-r1090-one-link-review-contract.spec.ts` pins the canonical production review URL to `https://aapopihkala.fi/private-model/?review=m5a-z2d-r1090-well-top-ground-surface-review`, proves that it uses only the `review` query parameter, proves that it does not depend on GLB/file/source/upload/path transport parameters, and proves that the review query resolves to `m5a-z2d-r1090-well-top-ground-surface`.

## V5 publish/readback status

The WORK_TEST machine publish/readback gate passed with GitHub Actions run:

```text
Publish WORK_TEST - m5a-z2d-r1090-well-top-ground-surface
```

Run `37835730136` completed successfully from `main`. The `publish` job completed successfully and its logs verified all required publish/readback steps:

- trusted `workflow_dispatch` from `main`
- exact allowlisted candidate resolution
- raw Drive GLB download and byte identity derivation
- machine-only publish endpoint response
- production catalog readback
- full production GLB byte-for-byte readback

The derived and production-readback exact identity was:

```text
candidate: m5a-z2d-r1090-well-top-ground-surface
Drive file: 1GhIyPFE2dqfrZpH257U-2Wp8c_d2wfD_
path: /private-model/work-test/m5a-z2d-r1090-well-top-ground-surface.glb
size: 3089152
sha256: e8934e546f2a89a2cc070c44ef9f4d6f6df8f5dd2bb30c1c7379b7f821d85605
```

Do not repeat the machine publish/readback gate for this same candidate unless the raw Drive source, runtime/source-map contract, production catalog, GLB object, workflow, Worker, or Access/readback contract changes.

## Review/autoload gate

The review route uses this one-link URL:

```text
https://aapopihkala.fi/private-model/?review=m5a-z2d-r1090-well-top-ground-surface-review
```

Do not repeat the static one-link URL contract guard for this same candidate unless the URL, query parameter, review resolver, or route/source-map contract changes.

Before any HUMAN_REVIEW content question, the next pass must verify authenticated one-link live behavior: the URL must autoload the exact `m5a-z2d-r1090-well-top-ground-surface` WORK_TEST candidate without user file transfer and render the relevant R1090 well-top ground-surface correction in a question-specific viewable presentation state.

If no authenticated live render probe is available, the state is `VISIBILITY_PROBE_REQUIRED`, not `READY_FOR_HUMAN_REVIEW`. In that case the next user-facing step may only be a technical visibility probe, not a content approval question.

## Boundaries

This mapping note does not change GLB bytes, G1/G2/G3, datacube fact layer, source-map contents, runtime allowlist, review alias/autoload wiring, production bytes, CURRENT/canonical/as-built state, publishToCURRENT, or HUMAN_REVIEW.

## Follow-up

Continue at authenticated one-link autoload and render visibility. Only after exact candidate autoload and render visibility pass may the work proceed to a narrowly scoped human content review question. Do not promote this WORK_TEST successor to CURRENT, canonical, as-built, or publishToCURRENT from this note.
