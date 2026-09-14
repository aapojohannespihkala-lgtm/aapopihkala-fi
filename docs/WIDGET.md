# Snapshot Android widget

## Purpose

The Android home-screen widget is a compact, glanceable companion to `/current/snapshot/`.

The mobile Snapshot page is the visual and information-design reference, but the widget is not intended to be a pixel-for-pixel copy. It should preserve the same hierarchy, terminology and data priorities while using Android home-screen space efficiently.

The long-term architecture is server-driven: ordinary content, ordering, data and presentation changes should ship from the website repository without requiring a new APK. A new APK is appropriate only when the Android rendering/network/platform engine itself gains or changes a capability.

## Product and design principles

- Keep the widget calm, minimal and readable at a glance.
- Use horizontal space before adding vertical height.
- Prefer one strong primary value per section with supporting context around it.
- Treat the Snapshot page as a reference, not a layout template.
- Evolve one section at a time unless the generic layout grammar genuinely changes.
- Keep server presentation changes separate from Android engine changes.
- Preserve the last good compatible payload through temporary network failures.
- Optional upstream sections must fail independently rather than taking down the whole presentation payload.
- Do not hide important Android/network failure modes behind a generic `null`; retain compact diagnostics.
- Avoid unnecessary APK installs: validate server-driven work in the browser preview first.

## Current large-widget information architecture

The production large widget currently contains:

1. Weather
   - current temperature and condition
   - daily low/high
   - four forecast points
   - sunrise, sunset and daylight length
   - an area-proportional day/night horizon disk
2. Electricity
   - day average as the main value
   - current, low and high price
   - normalized intraday price bars
3. Markets
   - selected 1-day median as the main value
   - World, USA, Finland, BTC/EUR and Remedy rows
4. HSL
   - next departure as a live local countdown
   - route/destination context
   - upcoming departures as clock times
5. Rates
   - 3M Euribor
   - one-year-ago comparison
6. Liiga
   - Ilves standing
   - next match and start time when available

Compact and medium remain intentionally denser than the large composition. HSL is currently large-only.

## Header and footer

The large widget no longer uses the redundant `CURRENT / SNAPSHOT` title.

Current header direction:

```text
08:06:26  MON 14 SEP · W38
```

- Time is a native Android `TextClock` with seconds (`HH:mm:ss`). It advances locally without a widget/network refresh.
- Date and ISO week use the same visual size as the clock and share the same row.
- The date/week text is written when the widget RemoteViews is rebuilt. A lightweight local WorkManager update is scheduled for Helsinki midnight so the date can roll over without waiting for a successful network refresh.

Refresh/status lives in the bottom footer:

```text
UPDATED 08:04                                      ↻
```

A manual tap on `↻` changes the control to a native indeterminate `ProgressBar` while the network refresh is running. App Widget hosts do not reliably support arbitrary rotation animation, so the native progress indicator is preferred to animating a text glyph.

On a failed refresh with a preserved cache, the footer shows compact diagnostics, for example:

```text
V2 TIMEOUT/R · L DNS · LAST 08:04                  ↻
```

`/R` means the v2 request used its one controlled retry. `L` is the legacy fallback result.

If v2 fails but legacy succeeds, the footer identifies the fallback, for example:

```text
LEGACY · V2 TIMEOUT/R · UPDATED 08:04              ↻
```

This makes it clear when the widget is displaying reduced legacy content rather than the full rich v2 presentation.

## Architecture

The widget is split into a server presentation layer and a small Android rendering/runtime layer.

### Server presentation layer

The website/Workers side owns:

- section content
- labels and supporting text
- section order by size class
- theme/colors
- rows, columns and normalized bar data
- large-layout `span` and `layout` metadata
- prod/dev presentation variants
- bounded optional upstream adapters such as HSL

The authoritative rich production endpoint is:

```text
/api/current/widget-v2?channel=prod
```

Development/staging presentation:

```text
/api/current/widget-v2?channel=dev
```

The legacy/raw compatibility endpoint is:

```text
/api/current/widget
```

Important: `/api/current/widget?v=2` is not the canonical rich Android presentation endpoint. The rich model lives at `/api/current/widget-v2`.

The presentation builder is `functions/api/current/widget-v2.ts`. It builds on Current/legacy data and emits the versioned generic presentation model understood by Android.

HSL uses a dedicated bounded widget adapter. Failure of the HSL upstream omits only HSL; it must not invalidate an otherwise usable v2 payload.

Widget Weather and solar data share one server-side weather source configuration so coordinates/timezone cannot drift independently.

### Android rendering/runtime layer

The Android app owns:

- Glance rendering
- size-class selection
- generic presentation primitives
- RemoteViews-compatible native live views (`TextClock`, `Chronometer`, `ProgressBar`)
- local temporal rollover updates for cached HSL departures and header midnight
- large-row grouping
- compatible cache persistence
- manual refresh action
- WorkManager scheduling
- endpoint/fallback logic
- retry policy
- compact network diagnostics
- presentation compatibility checks

The renderer should not accumulate section-ID-specific layout branches when the same result can be expressed through the generic presentation grammar.

The installed production app reads `channel=prod` directly. `channel=dev` remains a browser-preview staging path rather than an on-device runtime switch.

## Data flow

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
/api/current/widget-v2?channel=prod
        |
        v
WidgetRepository
   |    |
   |    +--> one controlled retry for transient v2 failures
   |    +--> legacy fallback if rich v2 still fails
   |
   v
compatible cache
   |
   +--> local temporal resolver + scheduled rollover updates
   |
   v
Glance renderer + native live temporal views
```

## Presentation model and compatibility

The v2 payload includes `schemaVersion` and `minEngineVersion`.

Android rejects payloads with a missing/zero schema or engine version and payloads requiring a newer schema/engine than the installed APK understands. In that case it retains the latest compatible cache and/or uses compatibility fallback behavior.

Generic section primitives include:

- `primary`
- `secondary`
- `detail`
- `tone`
- `rows`
- `columns`
- normalized `bars`
- optional absolute countdown target data for locally ticking values

Rows can additionally carry optional `secondary` and `countdownTargetMs` metadata. Android uses that metadata generically to advance a cached countdown section to the first still-future row while leaving ordinary row rendering unchanged.

Large-layout composition supports:

- `span: full` - full width
- `span: half` - compact half-width metric, pairable with the next adjacent half section
- `layout: stack` - normal vertical presentation
- `layout: split` - main metric left, supporting content right

Missing `span`/`layout` values default to `full` + `stack` for cache/backward compatibility.

The current production large composition is:

- Weather: `full + split`
- Electricity: `full + split`
- Markets: `full + split`
- HSL: `full + split`
- Rates: `half + stack`
- Liiga: `half + stack`

## RemoteViews / Glance constraints

Home-screen widgets are ultimately constrained by `RemoteViews`; successful compilation is not enough to guarantee a launcher can inflate every view class or a deeply flattened tree.

Important rules already learned on-device:

- use only RemoteViews-safe native Android view classes in `AndroidRemoteViews`
- do not use arbitrary views such as `Space` inside a RemoteViews XML layout
- keep logical large rows grouped under `LargeRowBlock`
- do not flatten section, divider and spacer children directly into the root large `Column`

The large-row grouping is a platform constraint, not cosmetic structure. Flattening it can silently truncate later sections on some launchers. This was first addressed in 2.1, accidentally reintroduced by the generic 2.6 refactor, and restored in 2.7.1.

## Weather day/night disk

Weather uses a native bitmap disk split by a horizontal horizon.

The entire circle represents 24 hours. The light upper segment represents daylight and the dark lower segment represents night. The horizon height is not mapped linearly from hours; it is solved so the circular-segment **area** equals the daylight fraction of 24 hours.

Examples:

- 12 h daylight -> horizon through the center
- short winter day -> small light cap
- long summer day -> large light upper region

Sunrise, sunset and daylight duration remain visible as text beside the disk.

## HSL live countdown

The 15-minute network cadence is not appropriate for a countdown. HSL therefore separates data freshness from local time progression.

The server supplies an absolute target for the current departure and absolute targets plus route/destination metadata for the visible upcoming rows. Android converts the selected wall-clock target to a `Chronometer` base using `SystemClock.elapsedRealtime()` and lets the native view count down locally between network refreshes.

Android also schedules lightweight local widget rebuilds for the known departure targets. When a countdown reaches zero, the passed departure is removed from the resolved cached section and the first still-future row becomes the new countdown target. The main route/destination, clock detail, realtime/scheduled tone and right-side rows advance together. The widget therefore does not intentionally show `NOW` or a negative countdown for a departure that has already reached its stop time, and this rollover does not require another HSL network request.

Older cached HSL payloads without the row-level targets can temporarily derive the current target from the clock time in the section detail when safe. This compatibility bridge prevents a cached minute label from remaining frozen after an APK upgrade. A normal network refresh upgrades the cache to the richer row metadata.

Upcoming departures on the right remain absolute clock times; they do not need per-minute network polling.

## Refresh cadence and network behavior

WorkManager owns the normal periodic network cadence and currently uses Android's minimum practical 15-minute periodic interval. WorkManager timing is opportunistic: 15 minutes is not a guarantee that execution happens at an exact wall-clock boundary.

Live time-based UI is therefore deliberately independent of the network cadence:

- header seconds: native `TextClock`
- HSL next-departure countdown: native `Chronometer`
- HSL target rollover: lightweight one-time WorkManager updates scheduled from cached absolute targets
- header date rollover: lightweight one-time WorkManager update at Helsinki midnight
- network data: periodic WorkManager/manual refresh

The temporal workers start shortly before their target and wait locally until the target when Android starts them on time. If Android delays a worker, it rebuilds the widget as soon as it is allowed to run and resolves directly to the then-current future target.

### v2 retry policy (2.8.4)

The rich v2 request gets **one** controlled retry only for failures that can reasonably be transient:

- `TIMEOUT`
- `DNS`
- `SSL`
- `CONNECT`
- `IO`
- HTTP 408, 425, 429
- HTTP 5xx

The retry happens after a short delay and uses a shorter bounded timeout. Semantic/permanent failures are not blindly retried, including:

- `PARSE`
- `COMPAT`
- `EMPTY`
- `SECURITY`
- ordinary 4xx such as 403/404

If the retry still fails, Android tries the legacy endpoint. If both fail, the previous compatible cache remains visible.

This avoids endpoint switching based on guesswork and keeps the production rich endpoint authoritative.

## Failure diagnostics

`WidgetRepository` maps request outcomes to compact codes:

- `OK`
- `TIMEOUT`
- `DNS`
- `SSL`
- `CONNECT`
- `IO`
- `SECURITY`
- `HTTP###`
- `PARSE`
- `COMPAT`
- `EMPTY`

The latest v2 status, legacy status and whether a v2 retry occurred are kept in SharedPreferences.

Normal successful rich-v2 operation shows only `UPDATED HH:mm`. Failure/fallback diagnostics appear in the footer only when they matter, rather than being mixed into Weather content as they were during the 2.4.x debugging phase.

## Cache and fallback behavior

The widget keeps the latest compatible payload in SharedPreferences.

- v2 success -> cache the rich v2 payload and schedule its known local temporal updates
- v2 transient failure -> retry once
- v2 still fails -> try legacy
- legacy success -> cache legacy payload and identify fallback in the footer
- v2 + legacy failure -> preserve the previous cache, keep its useful local temporal behavior and show failure diagnostics
- optional section failure inside a valid v2 response -> omit only that section

`UPDATED`/`LAST` refer to the payload generation time. They are not the same thing as the continuously ticking header clock.

## Size classes

The widget has compact, medium and large size classes. The v2 payload supplies section visibility/order for each class.

`span` and `layout` guide large presentation. Compact and medium intentionally remain denser and should still be checked whenever the server contract changes.

## Browser preview

Use:

```text
/current/widget-preview/
```

The preview reads `/api/current/widget-v2` and uses the same `span`/`layout` metadata as Android. It can inspect compact, medium and large layouts and prod/dev variants.

The browser preview is a design approximation, not an Android launcher emulator. It cannot prove RemoteViews compatibility, launcher child-budget behavior, native TextClock/Chronometer behavior or OEM-specific background scheduling/networking.

## Preferred development workflow

### Server presentation change

1. change presentation, preferably in `channel=dev`
2. inspect `/current/widget-preview/`
3. check compact, medium and large
4. promote in a small reversible change
5. press `↻` on the installed widget and verify the real launcher
6. tune/rollback server-side as needed

No APK should be required when existing Android primitives are sufficient.

### Android engine/platform change

1. start from current `main`
2. make the smallest engine change needed
3. bump `versionCode` and `versionName`
4. add/update pure unit tests where practical
5. run Android PR CI (tests + debug compile)
6. merge only when Android CI is green
7. let the `main` release workflow run Android tests again, restore the permanent signing key, build the signed release and verify its signature
8. install over the existing app and verify on a real launcher
9. update this document and `android-snapshot-widget/README.md` when behavior/architecture changed

Do not merge stale `chatgpt/*` branches over a newer `main`; rebase/recreate work from current `main` so previous engine fixes are not lost.

## APK signing

Android source lives under `android-snapshot-widget/`.

The GitHub Android workflow uses the persistent signing identity stored in Actions secrets. New signed releases must install over previous signed releases without uninstalling the app.

Signing credentials must not be committed to repository source. Keystore file extensions are ignored by the Android subproject. The remaining hard-coded keystore password in the workflow should be rotated into an Actions secret as a separate credential migration so the release workflow is not broken by changing only one side.

## Version history relevant to current architecture

### 2.5.0

Removed temporary Weather-embedded 2.4.x diagnostic labels while retaining internal network/fallback diagnostics.

### 2.6.0

Introduced generic large-layout `span`/`layout` grammar and removed several section-ID-specific Android layout rules.

### 2.7.0

Added the Weather area-proportional day/night horizon disk.

### 2.7.1

Restored safe logical-row grouping after Rates/Liiga truncation exposed the Glance/RemoteViews direct-child limit regression.

### 2.8.0

Added native live temporal rendering:

- header `TextClock`
- HSL `Chronometer` countdown
- absolute HSL countdown target in the presentation/cache model

### 2.8.1 / 2.8.2

Moved date/week beside the clock at the same 19sp size and added seconds. 2.8.1 used a `Space` view in the clock RemoteViews XML; Huawei/EMUI rejected the widget at runtime with `Cannot add widget.` 2.8.2 replaced it with a safe TextView margin.

### 2.8.3

Moved refresh/status to the bottom footer. Idle state shows `↻`; a manual refresh shows a native spinning `ProgressBar`. Header space is reserved for time/date/week.

### 2.8.4

Hardens phone-side networking without changing endpoints:

- one bounded retry for transient rich-v2 failures
- shorter timeout on the retry attempt
- legacy fallback remains after the retry
- last good cache still survives total failure
- footer exposes v2/legacy diagnostic codes only on failure/fallback
- retry policy and diagnostic formatting have unit coverage

### 2.9.0

Hardens local temporal behavior and payload validation:

- HSL presentation rows carry absolute targets and route/destination context
- cached HSL countdown rolls directly to the next future departure instead of `NOW` or negative time
- local one-time WorkManager updates rebuild the widget at known HSL departure targets without fetching the network
- a local midnight rebuild keeps the static date/week header from waiting on network success
- missing/zero schema and engine versions are rejected as incompatible
- release APK builds run Android unit tests before assembly

## Key file map

Server/presentation:

- `functions/api/current/widget.ts` - legacy/raw widget data endpoint
- `functions/api/current/widget-v2.ts` - rich v2 presentation builder
- `functions/api/current/widget-hsl.ts` - bounded widget HSL adapter
- `functions/api/current/hsl.ts` - Current HSL upstream endpoint
- `src/features/current/hsl-query.ts` - shared Current/widget HSL query configuration
- `src/pages/current/widget-preview/index.astro` - browser preview
- `tests/e2e/current-widget-v2-regression.spec.ts` - presentation contract regression
- `tests/e2e/current-widget-preview.spec.ts` - preview regression
- `tests/e2e/current-widget-weather-source.spec.ts` - Weather/solar source consistency

Android:

- `android-snapshot-widget/app/src/main/java/fi/aapopihkala/snapshotwidget/SnapshotWidgetApp.kt` - Glance composition, refresh action, worker and footer
- `android-snapshot-widget/app/src/main/java/fi/aapopihkala/snapshotwidget/WidgetRepository.kt` - v2 access, controlled retry, legacy fallback, cache and diagnostics
- `android-snapshot-widget/app/src/main/java/fi/aapopihkala/snapshotwidget/LiveTemporalViews.kt` - native TextClock and HSL Chronometer
- `android-snapshot-widget/app/src/main/java/fi/aapopihkala/snapshotwidget/WidgetTemporalRefresh.kt` - local HSL/midnight temporal rebuild scheduling
- `android-snapshot-widget/app/src/main/java/fi/aapopihkala/snapshotwidget/RefreshSpinner.kt` - native manual-refresh spinner
- `android-snapshot-widget/app/src/main/java/fi/aapopihkala/snapshotwidget/SolarDetailVisual.kt` - day/night disk geometry and bitmap rendering
- `android-snapshot-widget/app/src/main/java/fi/aapopihkala/snapshotwidget/WidgetModels.kt` - presentation model, codec, temporal resolver and compatibility
- `android-snapshot-widget/app/src/test/java/fi/aapopihkala/snapshotwidget/WidgetNetworkingTest.kt` - retry/diagnostic policy tests
- `android-snapshot-widget/app/src/test/java/fi/aapopihkala/snapshotwidget/WidgetTemporalTest.kt` - countdown/cache temporal tests
- `android-snapshot-widget/app/src/test/java/fi/aapopihkala/snapshotwidget/WidgetTemporalRefreshTest.kt` - scheduled temporal-target tests
- `android-snapshot-widget/app/src/test/java/fi/aapopihkala/snapshotwidget/WidgetModelCompatibilityTest.kt` - schema/engine compatibility tests
- `android-snapshot-widget/app/src/test/java/fi/aapopihkala/snapshotwidget/WidgetLayoutTest.kt` - layout grammar tests
- `android-snapshot-widget/app/src/test/java/fi/aapopihkala/snapshotwidget/SolarDetailVisualTest.kt` - solar geometry tests
- `android-snapshot-widget/app/build.gradle.kts` - app version/release config
- `.github/workflows/android-snapshot-widget.yml` - Android CI/release workflow

## Decision log

- Native Glance widget, not WebView/screenshot rendering.
- Server-driven presentation for normal design/data iteration.
- Production rich endpoint remains `/api/current/widget-v2?channel=prod`; do not switch endpoints based on speculative phone-side failures.
- Header time is local/native because a network refresh cadence cannot act as a clock.
- HSL next-departure countdown is local/native for the same reason.
- A passed HSL departure has no useful `NOW` state for this widget; rollover should select the next still-future departure.
- Known cached departure targets may trigger local widget rebuilds without triggering HSL network requests.
- Manual refresh feedback uses a native ProgressBar because widget hosts do not reliably animate arbitrary glyph transforms.
- A transient v2 failure gets one bounded retry; semantic/permanent failures go directly to legacy fallback.
- Last good compatible cache is more valuable than clearing sections on a temporary network failure.
- Failure diagnostics belong in the footer only when relevant.
- Large logical rows remain grouped to protect against RemoteViews child limits.
- Weather daylight visualization uses correct circular-segment area, not a linear horizon-height approximation.
- HSL remains optional server-side and must not take down unrelated sections.
- APK installations are reserved for Android engine/platform changes.

## Next priorities

1. Verify 2.9.0 HSL rollover on the real Huawei/EMUI launcher, including a route change between adjacent departures and a network failure while cached targets remain.
2. Move the release keystore password from the public workflow into a rotated Actions secret without changing the persistent signing identity.
3. Move manual refresh networking out of the Glance action callback and onto the existing immediate WorkManager path.
4. Fix the Electricity primary-value truncation (`15.20 c/k...`) using the existing server presentation grammar if possible, avoiding another APK.
5. Keep six-section density under observation before adding more dashboard sections.
