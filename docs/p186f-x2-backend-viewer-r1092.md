# P186F-X2 backend/viewer registration r1092

Current main now satisfies the safe backend registration and one-link candidate mapping preconditions for the P186F-X2 Themo candidate:

- registers the exact P186F-X2 raw Drive file in `.github/work-test-candidates.json`
- proves the source-map entry by test
- exposes the exact successor through the worker runtime allowlist
- maps the one-link review id to the published WORK_TEST candidate through `getRequestedReviewCandidateId`
- leaves private-model viewer presentation activation and authenticated live render evidence as the next separate gate

Exact candidate:

- candidate id: `p186f-x2-d-themo-room-adjacent-work-assumption`
- review id: `p186f-x2-d-themo-room-adjacent-work-assumption-review`
- Drive file id: `1fGoU6I_hiFy9A9i4y-lr4YuJ9n0-6ach`
- size: `3 201 932 B`
- SHA-256: `59fad8cfab19ad6981f53c7969b2d9bd6f33161fe33de0fc23152e6ec38c029f`

No GLB bytes, G2, datacube fact layer, production, CURRENT/canonical/as-built, publishToCURRENT, or HUMAN_REVIEW state is changed by this branch.
