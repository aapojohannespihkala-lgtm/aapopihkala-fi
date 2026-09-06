# Repository instructions

## Bilingual content parity

Finnish (`fi`) and English (`en`) article content are two language versions of the same article, not independent editorial content.

Whenever an article is created or edited in `src/content/posts/`:

- Update both `fi` and `en` in the same change.
- Keep the title, intro, perspective, source wording and image alt text equivalent in meaning.
- Keep the same argument, facts, examples, emphasis and conclusion in both languages.
- Translate naturally rather than word for word, but do not add, remove or soften substantive content in only one language.
- Keep source URLs and source sets aligned across both language versions.
- Do not leave one language on an older version after revising the other.

Only update a single language when the user explicitly asks for a language-specific exception.

## Animation interaction

Interactive 3D animations must allow unrestricted orbit rotation by default.

- Do not set `OrbitControls.minPolarAngle`, `maxPolarAngle`, `minAzimuthAngle` or `maxAzimuthAngle` unless the user explicitly asks for a restricted view.
- Keep rotation free in article graphics, the homepage and Animation Lab.
- Zoom and pan behavior may still be configured separately for each component.

## Animation Lab parity

Every new interactive animation or animation study must also be added to `src/pages/lab/index.astro` in the same change.

- Give each new experiment the next available lab number and a short descriptive title.
- Keep the lab version fully interactive unless the component itself has a deliberate restriction.
- Do not leave an article-only animation out of Animation Lab.

## Session continuity

Do not rely on previous chat context as the source of truth for this project. The repository must contain the durable information needed to continue work in a new session.

Before substantial work:

- read `README.md`
- read the relevant files under `docs/`
- read `ROADMAP.md` when the task may affect unfinished work or priorities
- inspect recent merged pull requests when recent implementation history or design intent matters
- inspect the current code and tests for exact implementation details

When a decision made during a chat should survive into future sessions, record it in the appropriate repository location before the task is considered complete. Do not create a running chat-history document.

For meaningful pull requests, leave a compact handoff in the PR description covering:

- what changed
- why it changed
- what was intentionally not changed when that boundary matters
- how the change was validated
- any follow-up work that remains

If unfinished work must continue in a later session, keep it visible in an open pull request or in `ROADMAP.md` rather than only in chat context.

## Change completion

When the user asks ChatGPT to make a repository change, the default is to carry that change through to completion: create or update the working branch, open or update the pull request, wait for the required pre-merge CI check, and merge the pull request when that check passes.

Do not stop only to request separate merge approval unless:

- the user explicitly asks to leave the pull request open or review before merge
- required pre-merge CI fails or reports a meaningful regression
- a merge conflict or material ambiguity appears
- the requested implementation expands beyond the agreed scope in a way that needs a user decision

A successful merge is part of completing the requested repository change, not a separate task by default.

## Efficient repository changes

Prefer one-pass repository changes. Before the first write:

- inspect the relevant files and current `main`
- inspect the existing working branch or pull request when continuing earlier work
- bring the working branch up to date with `main` before implementation when it is behind and the repository rules require an up-to-date branch
- decide the complete agreed change before pushing whenever practical

During implementation:

- batch related edits into one coherent commit or the smallest practical number of commits
- avoid no-op commits, bookkeeping-only commits and repeated rewrites that do not change the resulting tree
- do not push incremental "one more thing" commits after final validation has started unless a real issue must be fixed

For validation and merge:

- aim for one final pre-merge CI cycle after the branch is current and the implementation is complete
- verify that the required CI run started, then avoid repeatedly polling unchanged CI state
- check CI again when enough time has passed for useful progress or when a merge decision can be made
- distinguish required repository checks from optional external preview or deployment checks; investigate external failures when they indicate a real problem, but do not let irrelevant preview noise block an otherwise valid change
- merge immediately after the required pre-merge check passes when no conflict, regression or material ambiguity remains

During the active site-construction phase, optimize for fast iteration. Pull requests with executable changes are blocked by static checks and a production build, not by the full Playwright suite. Full browser regressions run on `main` after merge for executable changes. Documentation-only changes keep the minimal successful `build` check and skip Node, build and browser work entirely.

If a post-merge browser regression later exposes a real problem, fix it promptly in a follow-up change. Do not hold routine construction-phase merges open waiting for the full browser suite.

## CI safety

The CI strategy in `.github/workflows/build-check.yml` is intentionally split by phase:

- documentation-only changes: minimal required `build` check
- pull requests with executable changes: `npm ci`, `npm run check` and `npm run build`
- executable changes on `main`: the same static/build validation plus the full Playwright browser regression suite

This is the deliberate validation strategy for the active site-construction phase. Do not weaken the required pull-request static checks or production build without explicit review. When the project moves from rapid construction to a more stable release phase, reconsider whether full browser regressions should return to the pre-merge gate.

## Documentation maintenance

Update project documentation when a documented contract, workflow or architectural ownership boundary changes.

Do not update documentation only because an implementation detail changed. In particular, documentation does not need a change solely because:

- a new regression test was added inside the existing test strategy
- a new component was added inside an existing architecture
- an animation constant or visual tuning value changed
- a local CSS fix was made
- implementation code was refactored without changing ownership or public behavior

Use the appropriate source of truth:

- `README.md` for setup, commands, CI, deployment and the project overview
- `docs/ARCHITECTURE.md` for stable ownership boundaries and architecture
- `docs/CONTENT.md` for the article workflow and publishing contract
- `ROADMAP.md` for unfinished development work
- pull request descriptions for concise change history and handoff context
- code and tests for exact implementation details and regression assertions

Avoid maintaining exhaustive file inventories, test lists, chat transcripts or duplicated schema examples in prose when the repository itself is the more reliable source.
