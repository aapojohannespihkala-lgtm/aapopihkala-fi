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
