# M5A-Z2D R1090 runtime wiring map

## Purpose

This note pins the current post-runtime state for the M5A-Z2D R1090 well-top ground-surface WORK_TEST successor. PR #1008 superseded the earlier runtime-patch plan by adding the exact runtime allowlist candidate and focused regression on `main`.

This R1128 refresh records the later release-pipeline state on `main`: PR #1022 re-opened and merged the route/source-map parity regression from current `main`, and PR #1023 updated `Publish WORK_TEST` so the selected WORK_TEST candidate is visible in the Actions run name.

## Exact candidate

- Candidate id: `m5a-z2d-r1090-well-top-ground-surface`
- Drive file ID: `1GhIyPFE2dqfrZpH257U-2Wp8c_d2wfD_`
- Object key: `work-test/m5a-z2d-r1090-well-top-ground-surface.glb`
- Expected size: `3_089_152`
- Expected SHA-256: `e8934e546f2a89a2cc070c44ef9f4d6f6df8f5dd2bb30c1c7379b7f821d85605`

## Current main runtime state

`worker/privateWorkTest.ts` on `main` now exposes `M5A_Z2D_R1090_WELL_TOP_GROUND_SURFACE_CANDIDATE` with the exact id, label, path, object key, size, and SHA-256 above. `PRIVATE_WORK_TEST_RUNTIME_CANDIDATES` includes it after the legacy `M5A_Z2D_D100_D300_DIAMETER_CANDIDATE`, so the older D100/D300 candidate remains available.

The focused regression `tests/e2e/private-model-m5a-z2d-r1090-runtime-allowlist.spec.ts` proves that the R1090 candidate resolves by id, by private-model path, by upload path, by publish path, and by verify GLB path.

The focused route/source-map regression `tests/e2e/private-model-m5a-z2d-r1090-routing-source-map-parity.spec.ts` proves that the conventional review query `m5a-z2d-r1090-well-top-ground-surface-review` resolves to `m5a-z2d-r1090-well-top-ground-surface` and that `.github/work-test-candidates.json` maps the candidate to Drive file `1GhIyPFE2dqfrZpH257U-2Wp8c_d2wfD_`.

## V5 publish gate

The next constructive gate is a WORK_TEST machine publish/readback from `main` using workflow `Publish WORK_TEST` with this exact input:

```text
m5a-z2d-r1090-well-top-ground-surface
```

That workflow should read the candidate from `.github/work-test-candidates.json`, download the raw Drive GLB, derive exact byte identity, publish to the machine-only endpoint, and read the production catalog plus full production GLB back byte-for-byte.

`Publish WORK_TEST` now has a candidate-specific run name:

```text
Publish WORK_TEST - m5a-z2d-r1090-well-top-ground-surface
```

Use that run-name string to distinguish the R1090 publish/readback attempt from older WORK_TEST publish runs before interpreting the catalog or GLB readback evidence.

## Dispatch tool boundary

The current ChatGPT GitHub connector tool set can read workflow runs and re-run existing jobs, but it does not expose a new `workflow_dispatch` start action for `Publish WORK_TEST`. Do not repeat a capability check for this same gate unless the available GitHub connector tool set changes or a workflow run already exists to read back.

This R1128 handoff is intentionally dispatch-handoff only: it records the exact dispatch, the candidate-visible run naming, and the required readback evidence so later work can continue directly at the publish gate instead of repeating the same connector-capability check or using the superseded PR #1021 branch.

The exact dispatch, when a dispatch-capable route exists, is:

```text
workflow: Publish WORK_TEST
ref: main
candidate: m5a-z2d-r1090-well-top-ground-surface
expected run-name: Publish WORK_TEST - m5a-z2d-r1090-well-top-ground-surface
```

A successful pass must verify both the production catalog entry and the full production GLB byte identity before any review-route/autoload, authenticated render, HUMAN_REVIEW, CURRENT, canonical, as-built, or publishToCURRENT claim is made.

## Boundaries

This mapping note does not change GLB bytes, G1/G2/G3, datacube fact layer, source-map contents, runtime allowlist, review alias/autoload wiring, production, CURRENT/canonical/as-built state, publishToCURRENT, or HUMAN_REVIEW.

## Follow-up

After V5 machine publish/readback passes, continue with review-route/autoload wiring if needed, authenticated render visibility, and only then a narrowly scoped human content review question. Do not promote this WORK_TEST successor to CURRENT, canonical, as-built, or publishToCURRENT from this note.
