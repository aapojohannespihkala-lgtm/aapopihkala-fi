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
