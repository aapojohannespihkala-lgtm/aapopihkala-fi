# Snapshot Android widget

## Purpose

The Android home-screen widget is a compact, glanceable companion to `/current/snapshot/`.

The mobile Snapshot page is the visual and information-design reference, but the widget is not intended to be a pixel-for-pixel copy. It should preserve the same hierarchy, terminology and data priorities while using Android home-screen space more efficiently.

The long-term goal is that normal content, ordering and presentation changes can be shipped from the website repository without requiring the user to install a new APK. The APK should change only when the Android rendering engine itself needs a new capability.

## Product and design principles

- Keep the widget calm, minimal and readable at a glance.
- Prefer useful information over decorative headings. The generic `CURRENT / SNAPSHOT` heading was removed in favor of time, date and ISO week number.
- Use horizontal space before adding vertical height. Large-layout sections may place the main metric on the left and supporting detail on the right.
- Preserve a clear hierarchy: one primary value, supporting context, then small technical/detail text.
- Treat the mobile Snapshot page as a reference, not a layout template.
- Evolve the widget one section at a time. Avoid redesigning all sections in one iteration unless the underlying layout model genuinely changes.
- Keep server-driven design changes separate from Android engine changes.
- Temporary diagnostics may be shown during development, but they are not part of the intended final visual design.

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

HSL is a planned future section. It is intentionally not part of the widget yet. The layout should leave room for adding HSL later without forcing a full redesign.

## Header

The large widget currently uses a practical header instead of a product title:

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
- prod/dev presentation variants

The authoritative v2 presentation endpoint is:

```text
/api/current/widget-v2?channel=prod
```

The development channel is:

```text
/api/current/widget-v2?channel=dev
```

Important: `/api/current/widget?v=2` is not the v2 presentation endpoint. `functions/api/current/widget.ts` is the legacy/raw compatibility endpoint and currently ignores that query parameter. Do not switch the Android engine back to that URL expecting a v2 payload.

The legacy compatibility endpoint is:

```text
/api/current/widget
```

The presentation builder is implemented in `functions/api/current/widget-v2.ts`. It builds on the legacy/current data sources and adds the versioned presentation model used by the Android renderer.

### Android rendering layer

The Android app owns:

- Glance rendering
- size-class selection
- generic primitives such as primary values, rows, columns and bars
- cache persistence
- refresh actions
- WorkManager background scheduling
- compatibility checks
- fallback behavior
- temporary phone-side diagnostics

The Android renderer should not contain product-specific section ordering beyond safe fallback defaults.

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

Server-side changes may safely add, remove, reorder or restyle sections when they use rendering primitives already understood by the installed Android engine. A new rendering primitive or Android/platform capability requires a new APK.

Generic section primitives currently include:

- `primary`
- `secondary`
- `detail`
- `tone`
- `rows`
- `columns`
- normalized `bars`

## Size classes

The widget has compact, medium and large size classes. The v2 payload supplies section order/visibility for each class.

The current design work is primarily focused on the large phone widget shown in development screenshots. Changes should still avoid breaking compact and medium rendering.

## Browser preview

Use:

```text
/current/widget-preview/
```

The preview reads the same v2 presentation model and can be used to inspect compact, medium and large layouts plus prod/dev variants.

It is a design approximation, not a pixel-identical Android emulator. Final spacing and Glance behavior must still be verified on a real Android launcher when the engine or layout primitive changes.

## Preferred development workflow

For a normal presentation change:

1. change the server presentation, preferably in the dev channel first
2. inspect `/current/widget-preview/`
3. check compact, medium and large behavior
4. promote the presentation to prod
5. refresh the installed widget

No APK should be required for this loop.

For an Android engine change:

1. make the smallest engine change needed
2. bump `versionName` and `versionCode`
3. build/test through the Android GitHub Actions workflow
4. merge only after the debug build compiles
5. let the `main` release workflow create the persistently signed APK
6. install over the existing app and verify on-device

Do not use APK rebuilds for changes that can be expressed by the existing presentation primitives.

## APK and signing workflow

Android source lives under `android-snapshot-widget/`.

The Android workflow is path-filtered so ordinary Current/site/presentation changes do not build an APK. Android-changing pull requests compile a debug APK. After merge to `main`, the release workflow restores the persistent signing key, builds the signed release APK, verifies its signature and uploads the artifact.

Keeping the signing identity stable is essential so new versions install over the existing app instead of conflicting with it.

## Current development state

As of version `2.4.4`, the rich v2 payload is working on the test phone. A successful refresh has been observed with the full Weather, Electricity, Markets, Rates and Liiga content visible.

Version `2.4.4` is intentionally a diagnostic build. It adds phone-side status text so networking/cache failures can be identified without guessing or changing endpoints repeatedly. The diagnostics should be removed or reduced once the refresh path is considered stable.

The current visible diagnostic pattern is similar to:

```text
WEATHER · 2.4.4 · V2 OK
OLARI / ESPOO · L SKIP · C0M
```

Interpretation:

- `V2 OK` - the v2 endpoint returned a compatible non-empty payload
- `V2 TIMEOUT` - socket/connect read timed out
- `V2 DNS` - hostname resolution failed
- `V2 SSL` - TLS/SSL failure
- `V2 CONNECT` - connection could not be established
- `V2 HTTP###` - endpoint returned a non-2xx status
- `V2 IO` - other I/O failure
- `V2 PARSE` - HTTP body arrived but the payload could not be parsed
- `V2 COMPAT` - parsed payload requires an unsupported engine/schema
- `V2 EMPTY` - compatible payload contained no sections
- `L OK` - v2 failed and the legacy fallback succeeded
- `L SKIP` - v2 succeeded, so legacy fallback was not requested
- `L <error>` - legacy fallback also failed with the shown reason
- `C0M`, `C47M`, `C2H`, etc. - approximate age of the cached payload

The installed APK version is rendered from `BuildConfig.VERSION_NAME`, not from cached server data. This prevents screenshots from showing a stale app version after a failed refresh.

## Cache and failure behavior

The widget keeps the latest compatible payload in SharedPreferences. A failed refresh must not destroy good cached content.

When v2 succeeds, the cache is replaced with the new v2 payload. When v2 fails but legacy succeeds, the legacy payload can be cached as fallback content. If both fail, the previous cache is retained and status/diagnostics should make the failure visible.

The `UPDATED` timestamp describes the payload generation time, not necessarily the time when the widget was last redrawn. The header clock can therefore be newer than `UPDATED` when cached data is being displayed.

## File map

Key server-side files:

- `functions/api/current/widget.ts` - legacy/raw widget data endpoint
- `functions/api/current/widget-v2.ts` - v2 presentation builder and layout/theme contract
- `functions/api/current/liiga.ts` and related Current APIs - upstream domain data used by the presentation
- `docs/WIDGET.md` - this handover/design document

Key Android files:

- `android-snapshot-widget/app/src/main/java/fi/aapopihkala/snapshotwidget/SnapshotWidgetApp.kt` - Glance layouts, header, refresh action and WorkManager worker
- `android-snapshot-widget/app/src/main/java/fi/aapopihkala/snapshotwidget/WidgetModels.kt` - v2 model, parsing and compatibility
- `android-snapshot-widget/app/src/main/java/fi/aapopihkala/snapshotwidget/WidgetRepository.kt` - endpoint access, cache, fallback and diagnostics
- `android-snapshot-widget/app/build.gradle.kts` - Android version and release configuration
- `.github/workflows/android-snapshot-widget.yml` - Android CI/release build

## Decision log

The main decisions behind the current implementation are:

- Native Glance widget, not WebView or screenshot rendering.
- Server-driven presentation contract so most design work does not require reinstalling the APK.
- The mobile Snapshot page is the reference, while the widget remains intentionally more minimal.
- Header uses time/date/week instead of the redundant `CURRENT / SNAPSHOT` title.
- Weather was the first large-layout horizontal experiment: current conditions on the left, forecast on the right.
- Sunrise, sunset and daylight length were brought over from the Snapshot weather concept.
- Development proceeds section by section while keeping the whole dashboard composition in mind.
- HSL is planned but deferred until the existing sections and layout grammar are stable.
- Do not diagnose phone networking by changing endpoints blindly. Keep the endpoint fixed and expose the actual HTTP/network/cache state instead.

## Next steps

Once the 2.4.4 diagnostics have demonstrated stable refresh behavior, remove or greatly reduce the visible debug text while retaining useful internal failure reporting.

After that, continue design work incrementally. Weather is currently the most developed horizontal section. Electricity and Markets are the next candidates for better use of horizontal space. The bottom area should be designed with a future HSL section in mind rather than filled ad hoc.
