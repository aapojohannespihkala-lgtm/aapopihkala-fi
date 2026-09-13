# Snapshot Android widget

## Purpose

The Android home-screen widget is a compact, glanceable companion to `/current/snapshot/`.

The mobile Snapshot page is the visual and information-design reference, but the widget is not intended to be a pixel-for-pixel copy. It should preserve the same hierarchy, terminology and data priorities while using Android home-screen space more efficiently.

The long-term goal is that normal content, ordering and presentation changes can be shipped from the website repository without requiring the user to install a new APK. The APK should change only when the Android rendering engine itself needs a new capability.

## Product and design principles

- Keep the widget calm, minimal and readable at a glance.
- Prefer useful information over decorative headings. The generic `CURRENT / SNAPSHOT` heading was removed in favor of time, date and ISO week number.
- Use horizontal space before adding vertical height.
- Preserve a clear hierarchy: one primary value, supporting context, then small technical/detail text.
- Treat the mobile Snapshot page as a reference, not a layout template.
- Evolve the widget one section at a time unless the underlying layout grammar genuinely changes.
- Keep server-driven design changes separate from Android engine changes.
- Keep diagnostics available for debugging without mixing them into normal content.

## Current information architecture

The current large widget contains these sections:

1. Weather
   - current temperature and condition
   - daily low/high
   - four forecast points
   - sunrise, sunset and daylight length
2. Electricity
   - day average as the main value
   - current, low and high price
   - normalized intraday price bars
3. Markets
   - selected 1-day median as the main value
   - World, USA, Finland, BTC/EUR and Remedy rows
4. Rates
   - 3M Euribor
   - one-year-ago comparison
5. Liiga
   - Ilves standing
   - next match and start time when available

HSL is a planned future section. It is intentionally not part of the widget yet. The layout grammar should allow HSL to be added without another whole-widget redesign.

## Header

The large widget uses a practical header instead of a product title:

```text
23:57                         REFRESH
SUN 13 SEP 2026 / W37
UPDATED 23:57
```

The clock is rendered by the widget and updates when the widget is redrawn. It is not a continuously ticking clock.

## Architecture

The widget is split into two layers.

### Server presentation layer

The website/Pages Functions side owns:

- section content
- labels and supporting text
- section order by size class
- colors/theme
- rows, columns and normalized bar data
- large-layout `span` and `layout` metadata
- prod/dev presentation variants

The authoritative v2 presentation endpoint is:

```text
/api/current/widget-v2?channel=prod
```

The development channel is:

```text
/api/current/widget-v2?channel=dev
```

Important: `/api/current/widget?v=2` is not the v2 presentation endpoint. `functions/api/current/widget.ts` is the legacy/raw compatibility endpoint and does not provide the rich presentation contract.

The legacy compatibility endpoint is:

```text
/api/current/widget
```

The presentation builder is implemented in `functions/api/current/widget-v2.ts`. It builds on the legacy/current data sources and adds the versioned presentation model used by the Android renderer.

### Android rendering layer

The Android app owns:

- Glance rendering
- size-class selection
- generic presentation primitives
- large-row grouping from server metadata
- cache persistence
- refresh actions
- WorkManager background scheduling
- compatibility checks
- fallback behavior
- internal network/fallback status tracking

The Android renderer should not contain product-specific section IDs or ordering rules beyond safe fallback defaults.

The data flow is conceptually:

```text
Current data sources
        |
        v
legacy /api/current/widget
        |
        v
widget-v2 presentation builder
        |
        v
/api/current/widget-v2?channel=prod
        |
        v
WidgetRepository -> compatible cache -> Glance renderer
        |
        +-> legacy fallback if v2 fails
```

## Presentation model and compatibility

The v2 payload includes `schemaVersion` and `minEngineVersion`.

The Android engine must reject a payload that requires a newer engine than the installed APK understands. In that case it should retain the last compatible cached payload and/or use the compatibility fallback.

Server-side changes may safely add, remove, reorder or restyle sections when they use rendering primitives already understood by the installed Android engine. A genuinely new rendering capability or Android/platform capability requires a new APK.

Generic section content primitives include:

- `primary`
- `secondary`
- `detail`
- `tone`
- `rows`
- `columns`
- normalized `bars`

Large-layout composition also supports:

- `span: full` - one section occupies the full widget width
- `span: half` - compact metric that can pair with the next adjacent half-width section
- `layout: stack` - normal vertical metric presentation
- `layout: split` - main metric on the left and supporting columns, bars and/or rows on the right

Missing `span` or `layout` values default to `full` and `stack`. This keeps older cached payloads compatible. Older v2 APKs can also safely ignore the added fields while the existing section order remains compatible.

The current production presentation uses:

- Weather: `full + split`
- Electricity: `full + stack`
- Markets: `full + stack`
- Rates: `half + stack`
- Liiga: `half + stack`

The next presentation experiments can therefore move Electricity or Markets to `split` without adding another section-specific branch to the Android renderer.

## Size classes

The widget has compact, medium and large size classes. The v2 payload supplies section order/visibility for each class.

`span` and `layout` currently guide the large presentation. Compact and medium remain intentionally denser and should continue to be checked whenever the server contract changes.

## Browser preview

Use:

```text
/current/widget-preview/
```

The preview reads `/api/current/widget-v2` directly and uses the same `span` and `layout` metadata as the Android engine. It can inspect compact, medium and large layouts plus prod/dev variants.

The preview is a design approximation, not a pixel-identical Android emulator. Final spacing and Glance behavior must still be verified on a real Android launcher when the engine or layout primitive changes.

## Preferred development workflow

For a normal presentation change:

1. change the server presentation, preferably in the dev channel first
2. inspect `/current/widget-preview/`
3. check compact, medium and large behavior
4. promote the presentation to prod
5. refresh the installed widget

No APK should be required for this loop when the presentation uses primitives already understood by the installed engine.

For an Android engine change:

1. make the smallest engine change needed
2. bump `versionName` and `versionCode`
3. add or update unit/regression tests for the primitive
4. build/test through the Android GitHub Actions workflow
5. merge only after the tests and debug APK compile succeed
6. let the `main` release workflow create the persistently signed APK
7. install over the existing app and verify on-device

Do not use APK rebuilds for changes that can be expressed by the existing presentation grammar.

## APK and signing workflow

Android source lives under `android-snapshot-widget/`.

The Android workflow is path-filtered so ordinary Current/site/presentation changes do not build an APK. Android-changing pull requests run unit tests and compile a debug APK. After merge to `main`, the release workflow restores the persistent signing key, builds the signed release APK, verifies its signature and uploads the artifact.

Keeping the signing identity stable is essential so new versions install over the existing app instead of conflicting with it.

Signing credentials must be stored in GitHub Actions secrets rather than committed to workflow source. Credential rotation and secret cleanup are tracked separately from presentation work.

## Current development state

### 2.5.0

The temporary visible diagnostics from the 2.4.x debugging phase were removed. V2 request status, legacy fallback status and last-attempt state remain available internally, while normal Weather content is no longer decorated with debugging labels.

The browser preview was also corrected to use the authoritative `/api/current/widget-v2` endpoint and to mirror the Android time/date/week header.

### 2.6.0

The large renderer moved from product-specific rules to generic presentation metadata:

- Weather no longer gets a special `section.id == "weather"` branch
- Markets no longer gets a section-ID-specific primary font size
- the last two sections are no longer implicitly treated as the bottom pair
- adjacent `span: half` sections form a row through the generic `largeRows` grouping function
- `layout: split` works with generic columns, bars or rows
- Android PR CI runs unit tests before the debug APK build

This is the intended foundation for the next Electricity and Markets iterations and for adding HSL later.

## Cache and failure behavior

The widget keeps the latest compatible payload in SharedPreferences. A failed refresh must not destroy good cached content.

When v2 succeeds, the cache is replaced with the new v2 payload. When v2 fails but legacy succeeds, the legacy payload can be cached as fallback content. If both fail, the previous cache is retained.

The `UPDATED` timestamp describes the payload generation time, not necessarily the time when the widget was last redrawn. The header clock can therefore be newer than `UPDATED` when cached data is being displayed.

## File map

Key server-side files:

- `functions/api/current/widget.ts` - legacy/raw widget data endpoint
- `functions/api/current/widget-v2.ts` - v2 presentation builder and layout/theme contract
- `functions/api/current/liiga.ts` and related Current APIs - upstream domain data used by the presentation
- `src/pages/current/widget-preview/index.astro` - browser presentation preview
- `tests/e2e/current-widget-v2-regression.spec.ts` - server presentation contract regression
- `tests/e2e/current-widget-preview.spec.ts` - browser preview regression
- `docs/WIDGET.md` - this handover/design document

Key Android files:

- `android-snapshot-widget/app/src/main/java/fi/aapopihkala/snapshotwidget/SnapshotWidgetApp.kt` - Glance layouts, header, refresh action and WorkManager worker
- `android-snapshot-widget/app/src/main/java/fi/aapopihkala/snapshotwidget/WidgetModels.kt` - v2 model, parsing, compatibility and pure layout grouping
- `android-snapshot-widget/app/src/main/java/fi/aapopihkala/snapshotwidget/WidgetRepository.kt` - endpoint access, cache, fallback and internal diagnostics
- `android-snapshot-widget/app/src/test/java/fi/aapopihkala/snapshotwidget/WidgetLayoutTest.kt` - pure layout grammar unit tests
- `android-snapshot-widget/app/build.gradle.kts` - Android version and release configuration
- `.github/workflows/android-snapshot-widget.yml` - Android CI/release build

## Decision log

The main decisions behind the current implementation are:

- Native Glance widget, not WebView or screenshot rendering.
- Server-driven presentation contract so most design work does not require reinstalling the APK.
- The mobile Snapshot page is the reference, while the widget remains intentionally more minimal.
- Header uses time/date/week instead of the redundant `CURRENT / SNAPSHOT` title.
- Presentation semantics belong to generic primitives, not section IDs.
- Weather was the first `split` section and established the horizontal grammar.
- Half-width sections are explicitly declared by the server rather than inferred from list position.
- Sunrise, sunset and daylight length remain part of the Weather presentation.
- Development proceeds section by section while keeping the whole dashboard composition in mind.
- HSL is planned but deferred until Electricity and Markets have been tuned with the generic grammar.
- Phone networking should be diagnosed from actual request/cache state rather than by changing endpoints blindly.

## Next steps

1. Prototype Electricity as `layout: split` in the dev presentation channel, with the day average and current context on the left and the normalized price bars on the right.
2. Prototype Markets as `layout: split`, with the 1-day median on the left and the market rows on the right.
3. Compare both variants in `/current/widget-preview/` and on a real launcher before promoting them to prod.
4. Add HSL only after the lower-area composition is stable.
5. Finish the signing credential rotation tracked separately so no signing password remains in workflow source.
