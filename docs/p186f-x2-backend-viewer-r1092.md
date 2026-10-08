# P186F-X2 backend/viewer registration r1092

This branch intentionally performs only the first safe registration precondition for the P186F-X2 Themo candidate:

- registers the exact P186F-X2 raw Drive file in `.github/work-test-candidates.json`
- proves the source-map entry by test
- leaves the worker runtime allowlist and private-model viewer autoload/review presentation wiring as the next separate gate

Exact candidate:

- candidate id: `p186f-x2-d-themo-room-adjacent-work-assumption`
- Drive file id: `1fGoU6I_hiFy9A9i4y-lr4YuJ9n0-6ach`
- size: `3 201 932 B`
- SHA-256: `59fad8cfab19ad6981f53c7969b2d9bd6f33161fe33de0fc23152e6ec38c029f`

## r1102 next-code-gate patch map

The next runtime/viewer gate is deliberately separate from the source-map precondition above. It should be implemented as a code PR that changes only the runtime/review wiring needed to make the exact X2 WORK_TEST candidate addressable by one review link.

Required code targets:

1. `worker/privateWorkTest.ts`
   - add candidate id `p186f-x2-d-themo-room-adjacent-work-assumption` to `PRIVATE_WORK_TEST_CANDIDATES`
   - use `path: ${PRIVATE_WORK_TEST_PREFIX}/p186f-x2-d-themo-room-adjacent-work-assumption.glb`
   - use `objectKey: 'work-test/p186f-x2-d-themo-room-adjacent-work-assumption.glb'`
   - use `expectedSize: 3_201_932`
   - use `expectedSha256: '59fad8cfab19ad6981f53c7969b2d9bd6f33161fe33de0fc23152e6ec38c029f'`

2. `tests/e2e/private-model-p186f-x2-work-test-backend.spec.ts`
   - change the current boundary assertion from intentionally-null to the exact registered candidate tuple above
   - keep the test scoped to backend/runtime allowlist only

3. `src/scripts/privateModelP186FReviewPresentation.ts` and `tests/e2e/private-model-p186f-x2-presentation.spec.ts`
   - already accept P186F-X2 presentation semantics from PR #998; do not reopen the room-placement semantics unless a new failing test proves a regression

4. Private-model review alias/autoload wiring
   - add a short review alias for the X2 candidate only if the existing viewer review-contract requires it
   - the expected review target is still `p186f-x2-d-themo-room-adjacent-work-assumption`
   - no default CURRENT, canonical, as-built, publishToCURRENT or HUMAN_REVIEW promotion is allowed in this gate

Completion criteria for the next code PR:

- backend runtime lookup returns the X2 candidate tuple with the exact size and SHA above
- existing P186F-X2 presentation regression remains green
- review/autoload wiring points to the X2 candidate id, not to P186F-X1
- no GLB bytes, G2, datacube fact layer, production, CURRENT/canonical/as-built, publishToCURRENT, or HUMAN_REVIEW state changes

No GLB bytes, G2, datacube fact layer, production, CURRENT/canonical/as-built, publishToCURRENT, or HUMAN_REVIEW state is changed by this branch.
