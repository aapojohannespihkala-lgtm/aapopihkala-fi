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
- Optional upstream sections must fail independently rather than taking down the whole presentation payload.

## Current information architecture

The current production large widget contains these sections:

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
4. HSL
   - next departure countdown as the main value
   - route, destination, clock time and live/scheduled state
   - a short list of upcoming departures
5. Rates
   - 3M Euribor
   - one-year-ago comparison
6. Liiga
   - Ilves standing
   - next match and start time when available

Compact and medium retain the denser Weather, Electricity, Markets and Rates composition. HSL is large-only.

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
- bounded optional upstream adapters such as HSL

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

HSL is fetched through a dedicated widget adapter in both prod and dev. The adapter reuses the same Current HSL query configuration as the web page, applies a short timeout and returns `null` when usable departure data is unavailable. The v2 builder then omits HSL while retaining all other sections.

Widget Weather and the v2 solar request share one server-side weather source configuration so their endpoint, location and timezone cannot drift independently. The standalone Current Weather feature remains a separate client-side flow.

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

The installed 2.6.0 app reads the production presentation URL directly. It does not expose a runtime switch for `channel=dev`; dev remains a browser-preview staging channel for future presentation experiments.

The data flow is conceptually:

```text
Current data sources
        |
        +--> HSL adapter (optional, bounded)
        |
        v
legacy /api/current/widget
        |
        v
widget-v2 presentation builder
        |
        v
/api/current/widget-v2?channel=prod|dev
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

Refresh cadence is platform behavior rather than presentation metadata. The server v2 payload therefore does not advertise a refresh interval. Android owns the periodic WorkManager schedule and currently uses the platform-compatible 15-minute period. The Android parser still accepts the historical `refreshMinutes` field and defaults it to 15 for cache/backward compatibility, but the value does not control scheduling.

The current large production presentation uses:

- Weather: `full + split`
- Electricity: `full + split`
- Markets: `full + split`
- HSL: `full + split`
- Rates: `half + stack`
- Liiga: `half + stack`

Prod and dev currently use the same large section composition. No section-specific Android renderer branch is required.

## HSL behavior

The HSL section is intentionally glanceable rather than a copy of the full Current HSL panel.

The large widget shows the next usable departure as the primary countdown. Route and destination are supporting context, while the right side lists several upcoming departures with their clock time and countdown. Realtime departures use the existing accent tone.

The widget presentation does not include the configured stop name or stop code. The Current page and the widget adapter share one query configuration module so location-related configuration is not duplicated across implementations.

HSL fetching is bounded to four seconds in the widget path. Missing configuration, upstream errors, timeouts or an empty departure list omit only the HSL section. They do not make the v2 payload fail when other sections remain available.

HSL is now served to the production channel using presentation primitives already supported by Android 2.6.0, so no APK update is required. The on-device launcher check is the final spacing/density validation. If the six-section composition needs tuning, the server presentation can be adjusted or rolled back independently of the app.

## Size classes

The widget has compact, medium and large size classes. The v2 payload supplies section order/visibility for each class.

`span` and `layout` guide the large presentation. Compact and medium remain intentionally denser and should continue to be checked whenever the server contract changes.

## Browser preview

Use:

```text
/current/widget-preview/
```

The preview reads `/api/current/widget-v2` directly and uses the same `span` and `layout` metadata as the Android engine. It can inspect compact, medium and large layouts plus prod/dev variants.

The preview styles are global within the standalone preview page because widget markup is generated dynamically. Scoped Astro styles do not automatically attach to elements created later with `innerHTML`.

The preview is a design approximation, not a pixel-identical Android emulator. Final spacing and Glance behavior must still be verified on a real Android launcher for production presentation changes.

## Preferred development workflow

For a normal presentation change:

1. change the server presentation, preferably in the dev channel first
2. inspect `/current/widget-preview/`
3. check compact, medium and large browser behavior
4. promote the presentation to prod in a small reversible change
5. refresh the installed widget and verify the real launcher
6. roll back or tune server-side if the on-device composition needs adjustment

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

This engine version is sufficient for subsequent Electricity, Markets and HSL presentation changes, so those changes do not require another APK.

### Server presentation after 2.6.0

Electricity and Markets were promoted to `layout: split` using the existing engine. HSL was implemented as another full-width split section, staged in dev, and then promoted to the production large layout for real-launcher validation. Rates and Liiga remain the bottom half-width pair.

The browser preview regression also exposed and fixed a latent Astro style-scoping issue for dynamically generated widget markup.

Widget Weather and solar data now use the same source configuration. The server presentation contract also stopped advertising `refreshMinutes` because periodic scheduling belongs to Android/WorkManager rather than the presentation layer.

## Cache and failure behavior

The widget keeps the latest compatible payload in SharedPreferences. A failed refresh must not destroy good cached content.

When v2 succeeds, the cache is replaced with the new v2 payload. When v2 fails but legacy succeeds, the legacy payload can be cached as fallback content. If both fail, the previous cache is retained.

An optional section failure inside a successful v2 build should omit that section rather than turn the whole response into a failure.

The `UPDATED` timestamp describes the payload generation time, not necessarily the time when the widget was last redrawn. The header clock can therefore be newer than `UPDATED` when cached data is being displayed.

## File map

Key server-side files:

- `functions/api/current/widget.ts` - legacy/raw widget data endpoint and shared widget weather source configuration
- `functions/api/current/widget-v2.ts` - v2 presentation builder and layout/theme contract
- `functions/api/current/widget-hsl.ts` - bounded HSL adapter for the widget presentation
- `functions/api/current/hsl.ts` - Current HSL upstream data endpoint
- `functions/api/current/liiga.ts` and related Current APIs - upstream domain data used by the presentation
- `src/features/current/hsl-query.ts` - shared Current/widget HSL query configuration
- `src/pages/current/widget-preview/index.astro` - browser presentation preview
- `tests/e2e/current-widget-v2-regression.spec.ts` - server presentation contract regression
- `tests/e2e/current-widget-preview.spec.ts` - browser preview regression
- `tests/e2e/current-widget-weather-source.spec.ts` - widget Weather/Solar source consistency regression
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
- Weather established the `split` grammar, followed by Electricity, Markets and HSL.
- Half-width sections are explicitly declared by the server rather than inferred from list position.
- Sunrise, sunset and daylight length remain part of the Weather presentation.
- Widget Weather and solar data share one server-side source configuration.
- Periodic refresh scheduling belongs to Android/WorkManager, not to the server presentation contract.
- Installed Android 2.6.0 consumes the prod channel directly; dev variants remain browser-preview staging for future experiments.
- HSL is large-only, optional on upstream failure and production-enabled without a new APK.
- Development proceeds section by section while keeping the whole dashboard composition in mind.
- Phone networking should be diagnosed from actual request/cache state rather than by changing endpoints blindly.

## Next steps

1. Refresh the installed large widget and verify the six-section HSL composition on the real launcher.
2. Tune or roll back HSL spacing/text density server-side if the on-device composition needs adjustment.
3. Finish the signing credential rotation tracked separately so no signing password remains in workflow source.
