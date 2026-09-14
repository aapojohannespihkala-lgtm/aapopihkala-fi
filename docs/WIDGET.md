# Snapshot Android widget

## Purpose

The Android home-screen widget is a compact companion to `/current/snapshot/`.

The mobile Snapshot page is the visual and information-design reference, but the widget is not a pixel-for-pixel copy. It should preserve the same hierarchy, terminology and data priorities while using Android home-screen space efficiently.

The architecture is intentionally server-driven: ordinary content, ordering, data and presentation changes should ship from the website repository without requiring a new APK. A new APK is appropriate only when the Android rendering, networking, cache or platform engine itself gains or changes a capability.

## Product principles

- Keep the widget calm, minimal and readable at a glance.
- Use horizontal space before adding vertical height.
- Prefer one strong primary value per section with supporting context around it.
- Evolve one section at a time unless the generic layout grammar genuinely changes.
- Preserve the last good compatible payload through temporary network failures.
- Optional upstream sections must fail independently rather than taking down the whole payload.
- Retain compact diagnostics for Android/network failures instead of collapsing everything to `null`.
- Avoid unnecessary APK installs: validate server-driven work in the browser preview first.

## Current large-widget information architecture

The production large widget currently contains:

1. Weather
   - current temperature and condition
   - daily low/high
   - four forecast points
   - sunrise, sunset and daylight length
   - area-proportional day/night horizon disk
2. Electricity
   - day average as the main value
   - current, low and high price
   - normalized intraday price bars
3. Markets
   - 1-day portfolio median as the main value
   - small 1-month and 1-year portfolio medians
   - World, USA, Finland, BTC/EUR and Remedy 1-day rows
   - the same portfolio response as `/current/markets/`; do not maintain a parallel widget-only median feed
4. HSL
   - next departure as a locally advancing countdown when exact rollover is available
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

The header is native/live Android time rather than a server timestamp:

```text
08:06:26  MON 14 SEP · W38
```

- Time uses Android `TextClock` and advances locally with seconds.
- Date and ISO week share the same row.
- A local AlarmManager rebuild is scheduled around Helsinki midnight so the date can roll without a successful network refresh.

Refresh/status lives in the footer:

```text
UPDATED 08:04                                      ↻
```

A manual `↻` tap immediately switches to a native indeterminate `ProgressBar`. The network refresh itself runs through WorkManager so a slow retry/fallback sequence does not keep the Glance action callback alive.

On failures the footer exposes compact diagnostics only when useful, for example:

```text
V2 TIMEOUT/R · L DNS · LAST 08:04
```

`/R` means the rich-v2 request used its one retry. `L` is the legacy fallback result.

## Server presentation layer

The website/Workers side owns:

- section content
- labels and supporting text
- section order by size class
- theme/colors
- rows, columns and normalized bar data
- large-layout `span` and `layout` metadata
- prod/dev presentation variants
- bounded optional upstream adapters such as HSL

Authoritative rich production endpoint:

```text
/api/current/widget-v2?channel=prod
```

Development/staging presentation:

```text
/api/current/widget-v2?channel=dev
```

Legacy compatibility endpoint:

```text
/api/current/widget
```

Important: `/api/current/widget?v=2` is not the canonical rich Android presentation endpoint. The rich model lives at `/api/current/widget-v2`.

The presentation builder is `functions/api/current/widget-v2.ts`.

HSL uses a dedicated bounded widget adapter. HSL upstream failure should omit only HSL; it must not invalidate an otherwise usable v2 payload.

Weather and solar data share the same server-side source configuration so coordinates/timezone cannot drift independently.

Markets deliberately shares the portfolio feed used by `/current/markets/`: `/api/current/markets?portfolio=1&v=6` resolves to the same `functions/api/current/portfolio.ts` response used by the widget's legacy data builder. The widget computes 1D, 1M and 1Y medians from the available holdings in that shared response using the same median rule as the Markets page. The selected WORLD, USA, FINLAND, BTC/EUR and REMEDY rows are also read from that response. If the Markets data contract changes, update both consumers rather than introducing a widget-only portfolio fork.

## Android runtime layer

The Android app owns:

- Glance rendering
- size-class selection
- generic presentation primitives
- RemoteViews-safe native live views (`TextClock`, `Chronometer`, `ProgressBar`)
- compatible cache persistence
- local HSL temporal rollover
- local Helsinki-midnight rebuild
- manual refresh action
- WorkManager network scheduling
- AlarmManager local temporal scheduling
- endpoint/fallback logic
- retry policy
- compact network diagnostics
- presentation compatibility checks

The renderer should not accumulate section-ID-specific layout branches when the same result can be expressed through the generic presentation grammar.

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
   +--> temporal resolver
   +--> AlarmManager next-departure rollover
   |
   v
Glance renderer + native live temporal views
```

## Presentation model and compatibility

The v2 payload includes `schemaVersion` and `minEngineVersion`.

Android rejects missing/zero versions and payloads requiring a newer schema/engine than the installed APK understands. The latest compatible cache remains available when a new payload cannot be rendered.

Generic section primitives include:

- `primary`
- `secondary`
- `detail`
- `tone`
- `rows`
- `columns`
- normalized `bars`
- optional absolute countdown targets

Rows can additionally carry `secondary` and `countdownTargetMs`. Android uses this metadata generically to advance a cached countdown section to the first still-future row.

Large layout supports:

- `span: full`
- `span: half`
- `layout: stack`
- `layout: split`

Missing layout metadata defaults to `full + stack` for backward-compatible caches.

Current production large composition:

- Weather: `full + split`
- Electricity: `full + split`
- Markets: `full + split`
- HSL: `full + split`
- Rates: `half + stack`
- Liiga: `half + stack`

## HSL live countdown

The 15-minute network cadence is not appropriate for a departure countdown. HSL therefore separates data freshness from local time progression.

The server supplies absolute timestamps for the current departure and visible upcoming departures. Android converts the selected wall-clock target to a `Chronometer` base using `SystemClock.elapsedRealtime()` and lets the native view advance locally between network refreshes.

LIVE vs SCHED does **not** change rollover behavior. It only tells the user whether the current departure time came from realtime or scheduled data. Both are represented by the same absolute `countdownTargetMs` and use the same local rollover path.

### Rollover behavior from 2.10.0

The 2.9.x WorkManager-based temporal rollover was not reliable enough on-device. A native Chronometer keeps counting below zero if no widget rebuild occurs, while WorkManager intentionally does not guarantee execution at an exact wall-clock second. On-device evidence showed departures remaining active many minutes after their target.

Starting in **2.10.0**, HSL rollover uses `AlarmManager` instead:

1. After every successful/cache-preserving widget refresh, Android resolves the first still-future HSL departure.
2. Only that next absolute departure target is scheduled as the active HSL alarm.
3. When the target is reached, the broadcast receiver rebuilds the widget from the existing cache.
4. The temporal resolver drops the passed departure and promotes the first still-future row.
5. The receiver immediately schedules the promoted departure as the next alarm.

No HSL network request is required for this cached rollover. Route, destination, realtime/scheduled tone and the visible departure list advance together.

On Android versions before API 31, exact alarms are available without special app access. On Android 12+ the app declares `SCHEDULE_EXACT_ALARM` and checks `AlarmManager.canScheduleExactAlarms()` before using `setExactAndAllowWhileIdle()`.

If exact-alarm access is unavailable, Android deliberately does **not** start a ticking Chronometer. It shows the absolute Helsinki departure time instead and uses an inexact alarm/network refresh as a safe fallback. This avoids ever presenting a stale negative countdown. On newer Android versions exact alarm access may need to be granted under the system's **Alarms & reminders** special app access.

The alarm receiver also reschedules after boot/package replacement/permission-state broadcasts when a widget is present. A compatibility `SnapshotTemporalUpdateWorker` remains only so one-time temporal WorkManager jobs already queued by 2.9.x can finish harmlessly after an APK upgrade; new versions do not enqueue temporal WorkManager jobs.

Older cached HSL payloads without row-level absolute targets can still derive a current target from the section clock detail when that inference is safe. A normal network refresh upgrades the cache to the richer row metadata.

## Weather day/night disk

Weather uses a native bitmap disk split by a horizontal horizon.

The entire circle represents 24 hours. The light upper segment represents daylight and the dark lower segment represents night. The horizon height is solved so the circular-segment **area** equals the daylight fraction of 24 hours; the vertical position is not mapped linearly from hours.

Examples:

- 12 h daylight -> horizon through the center
- short winter day -> small light cap
- long summer day -> large light upper region

Sunrise, sunset and daylight duration remain visible as text beside the disk.

## RemoteViews / Glance constraints

Home-screen widgets are ultimately constrained by `RemoteViews`; successful compilation is not enough to guarantee launcher compatibility.

Important rules learned on-device:

- use only RemoteViews-safe native Android view classes in `AndroidRemoteViews`
- do not use arbitrary views such as `Space` inside a RemoteViews XML layout
- keep logical large rows grouped under `LargeRowBlock`
- do not flatten section/divider/spacer children directly into the root large `Column`

The large-row grouping is a platform constraint, not cosmetic structure. Flattening it can silently truncate later sections on some launchers.

## Refresh cadence and network behavior

The periodic network refresh uses WorkManager at Android's minimum practical 15-minute interval and requires `NetworkType.CONNECTED`. WorkManager timing is opportunistic; 15 minutes is not an exact wall-clock guarantee.

A user-triggered manual refresh remains an immediate one-time work request so it gives direct feedback and uses the existing retry/fallback diagnostics.

Live/local time behavior is deliberately independent from normal network cadence:

- header seconds: native `TextClock`
- HSL countdown: native `Chronometer` only when exact rollover is available
- HSL rollover: one `AlarmManager` target for the next absolute departure
- exact-alarm unavailable fallback: absolute departure clock, never a negative Chronometer
- header date rollover: local inexact AlarmManager rebuild near Helsinki midnight
- network data: periodic/manual WorkManager fetches

### v2 retry policy

The rich v2 request gets one controlled retry only for reasonably transient failures:

- `TIMEOUT`
- `DNS`
- `SSL`
- `CONNECT`
- `IO`
- HTTP 408, 425, 429
- HTTP 5xx

The retry uses a shorter timeout. Semantic/permanent failures such as `PARSE`, `COMPAT`, `EMPTY`, `SECURITY` and ordinary 4xx are not blindly retried.

If v2 still fails, Android tries the legacy endpoint. If both fail, the previous compatible cache remains visible.

## Cache and diagnostics

The widget keeps the latest compatible payload in SharedPreferences.

- v2 success -> cache rich payload and schedule the next local HSL alarm target
- v2 transient failure -> retry once
- v2 still fails -> try legacy
- legacy success -> cache legacy payload and identify fallback in footer
- v2 + legacy failure -> preserve previous cache and keep/reschedule its usable local HSL target
- optional section failure inside valid v2 -> omit only that section

Diagnostic codes include:

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

`UPDATED`/`LAST` refer to payload generation time, not the continuously ticking header clock.

## Browser preview

Use:

```text
/current/widget-preview/
```

The preview reads `/api/current/widget-v2` and uses the same server presentation metadata as Android. It can inspect compact, medium and large layouts plus prod/dev variants.

The preview is a design approximation, not an Android launcher emulator. It cannot prove RemoteViews compatibility, native TextClock/Chronometer behavior, exact-alarm special access, OEM alarm/background behavior or phone-side networking.

## Preferred development workflow

### Server presentation change

1. change presentation, preferably in `channel=dev`
2. inspect `/current/widget-preview/`
3. check compact, medium and large
4. promote in a small reversible change
5. press `↻` on the installed widget and verify the real launcher

No APK is required when existing Android primitives are sufficient.

### Android engine/platform change

1. start from current `main`
2. make the smallest engine change needed
3. bump `versionCode` and `versionName`
4. add/update pure unit tests where practical
5. run Android PR CI (tests + debug compile)
6. merge only when Android CI is green
7. let the `main` release workflow run Android tests again, restore the persistent signing key, build the signed release and verify its signature
8. install over the existing app and verify on a real launcher
9. update this document when behavior/architecture changes

Do not merge stale `chatgpt/*` branches over a newer `main`; recreate/rebase from current `main` so previous fixes are not lost.

## APK signing

Android source lives under `android-snapshot-widget/`.

The GitHub Android workflow uses a persistent signing identity stored in Actions secrets. New signed releases must install over previous signed releases without uninstalling the app.

Signing credentials must not be committed to repository source. Keystore file extensions are ignored by the Android subproject. Any remaining signing-password cleanup should be handled as a separate credential migration so source and Actions secrets change together.

## Version history relevant to the current architecture

- **2.1**: restored large-layout child grouping/truncation behavior.
- **2.2**: Weather became horizontal with current conditions + forecast.
- **2.3**: live-style time/date/week header direction introduced.
- **2.4.x**: phone-side networking diagnostics and cache/fallback investigation.
- **2.5.0**: removed temporary Weather-embedded diagnostics while retaining internal diagnostics.
- **2.6.0**: generic `span`/`layout` presentation grammar.
- **2.7.0**: area-proportional Weather day/night disk.
- **2.7.1**: restored safe logical-row grouping for launcher child-budget compatibility.
- **2.8.0**: native `TextClock`, HSL `Chronometer`, absolute HSL target support.
- **2.8.2**: replaced unsupported `Space` in RemoteViews clock layout after Huawei/EMUI runtime rejection.
- **2.8.3**: footer refresh/status + native spinner.
- **2.8.4**: bounded v2 retry, legacy fallback diagnostics and cache preservation hardening.
- **2.9.0**: cached HSL row targets + local temporal rollover.
- **2.9.1**: manual network refresh moved to WorkManager.
- **2.9.3**: expanded network fallback orchestration tests.
- **2.9.4**: `pageUrl` validation hardening.
- **2.9.5**: removed stale `NOW` compatibility fallback.
- **2.9.6**: periodic network worker requires connectivity.
- **2.9.7**: attempted prewarmed WorkManager HSL rollover + final-minute `DUE` guard; superseded after on-device delay evidence.
- **2.10.0**: HSL rollover moved to one next-departure AlarmManager target; LIVE/SCHED share identical rollover; exact-alarm-unavailable mode shows the absolute departure clock instead of allowing a negative Chronometer.

## Key files

- `functions/api/current/widget-v2.ts` — rich server presentation builder
- `functions/api/current/widget.ts` — legacy/widget base data builder; Markets must share the main portfolio feed
- `functions/api/current/portfolio.ts` — portfolio performance response shared by Markets page and widget medians
- `functions/api/current/widget-hsl.ts` — bounded HSL widget adapter
- `android-snapshot-widget/app/src/main/java/fi/aapopihkala/snapshotwidget/WidgetModels.kt` — presentation model, codec and temporal row resolver
- `android-snapshot-widget/app/src/main/java/fi/aapopihkala/snapshotwidget/WidgetRepository.kt` — network/cache/retry/fallback behavior and local schedule handoff
- `android-snapshot-widget/app/src/main/java/fi/aapopihkala/snapshotwidget/SnapshotWidgetApp.kt` — Glance composition and WorkManager network refresh
- `android-snapshot-widget/app/src/main/java/fi/aapopihkala/snapshotwidget/LiveTemporalViews.kt` — live clock/countdown rendering and exact-alarm-aware safe fallback
- `android-snapshot-widget/app/src/main/java/fi/aapopihkala/snapshotwidget/WidgetTemporalRefresh.kt` — AlarmManager HSL rollover, midnight rebuild and 2.9.x worker compatibility shim
- `android-snapshot-widget/app/src/main/java/fi/aapopihkala/snapshotwidget/SolarDetailVisual.kt` — Weather day/night disk
- `.github/workflows/android-snapshot-widget.yml` — Android PR/release build and signature verification
