# P186F-X2 review autoload map

## Purpose

This note pins the post-publish review/autoload guard for the P186F-X2 D Themo WORK_TEST successor. It exists to keep the next step narrow: prove one-link private-model autoload and authenticated render visibility before asking for a human content review.

## Exact candidate

- Candidate id: `p186f-x2-d-themo-room-adjacent-work-assumption`
- Drive file ID: `1fGoU6I_hiFy9A9i4y-lr4YuJ9n0-6ach`
- Object key: `work-test/p186f-x2-d-themo-room-adjacent-work-assumption.glb`
- Expected size: `3_201_932`
- Expected SHA-256: `59fad8cfab19ad6981f53c7969b2d9bd6f33161fe33de0fc23152e6ec38c029f`

## User context preserved for the review question

The P186F-X2 placement assumption is based on the user clarification that the three Themos are downstairs and close to each other:

- one Themo is in the bathroom;
- one Themo is in the lobby;
- one Themo is on the other side of the wall in the corridor-like area leading to the bedroom;
- the bedroom Themo is technically in the same room volume as the bedroom, but the walk-in closet creates a corridor-like structure.

This note does not decide that the content is correct. It only preserves the review framing that must be visible before the content question is asked.

## Current expected technical state

The runtime allowlist and WORK_TEST machine publish/readback have already been handled before this guard. The next constructive gate is not another source-map or runtime patch; it is a one-link review/autoload proof.

Conventional review id to test first:

```text
p186f-x2-d-themo-room-adjacent-work-assumption-review
```

If the conventional review id does not provide the required one-link autoload/render behavior, add the smallest review alias/autoload wiring needed for this exact candidate and then verify it on the authenticated private-model path.

## Required proof before human review

Before releasing a content question to the user, prove all of the following for this exact candidate:

1. the review link resolves to `p186f-x2-d-themo-room-adjacent-work-assumption`;
2. the autoload path fetches the exact published WORK_TEST GLB for the candidate;
3. the authenticated private-model render opens without the user doing file-selection work;
4. the view is suitable for the specific Themo room-adjacency question;
5. the visible question asks only whether Bathroom, Lobby, and Bedroom / walk-in-closet-corridor Themos are in the right room relationship.

## Boundaries

This mapping note does not change GLB bytes, G1/G2/G3, datacube fact layer, source-map contents, runtime allowlist, production bytes, CURRENT/canonical/as-built state, publishToCURRENT, or HUMAN_REVIEW.

Do not mark HUMAN_REVIEW PASS from this note. Do not ask the user to review the Themo content until exact identity, one-link autoload, and authenticated render visibility are proven.

## Follow-up

Continue with one-link private-model autoload/render verification for `p186f-x2-d-themo-room-adjacent-work-assumption-review`, or with the smallest review alias/autoload wiring PR if the conventional review id is insufficient.
