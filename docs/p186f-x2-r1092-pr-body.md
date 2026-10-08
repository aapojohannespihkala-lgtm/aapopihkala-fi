## Summary
- register the P186F-X2 Themo exact Drive artifact in the machine publish WORK_TEST source map
- add tests documenting the source-map registration and the intentional runtime/viewer boundary
- document that worker runtime allowlist and private-model viewer autoload/review wiring remain the next separate gate

## Scope / no-promotion
- exact candidate: `p186f-x2-d-themo-room-adjacent-work-assumption`
- Drive file id: `1fGoU6I_hiFy9A9i4y-lr4YuJ9n0-6ach`
- size: `3 201 932 B`
- SHA-256: `59fad8cfab19ad6981f53c7969b2d9bd6f33161fe33de0fc23152e6ec38c029f`
- Does not change GLB bytes, G2, datacube fact layer, worker runtime allowlist, private-model viewer autoload path, production, CURRENT/canonical/as-built, publishToCURRENT, or HUMAN_REVIEW.
- Does not publish P186F-X2 and does not ask the user for review.

## Follow-up
Next gate: patch the worker runtime allowlist + private-model viewer autoload/review wiring with a tool path that can safely patch the large files, then CI/merge and only after that publish/readback/authenticated render.
