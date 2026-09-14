# Android Snapshot Widget

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
   - current temperature
   - daily low/high
   - four forecast points
   - sunrise, sunset and daylight length
   - an area-proportional day/night horizon disk
2. Electricity
   - day average as the main value
   - current, low and high price
   - intraday price silhouette
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
   - Ilves position / total teams
   - live or next Ilves game

Compact and medium remain intentionally denser than the large composition. HSL is large-only.

### Markets data contract

The widget Markets section must use the same portfolio feed as `/current/markets/`, not a parallel snapshot-specific portfolio calculation. The main value is the **1D median** across the available holdings in that shared feed. The widget also shows the shared **1M** and **1Y** medians as small supporting values.

The right-side WORLD, USA, FINLAND, BTC / EUR and REMEDY rows are the corresponding 1D values from that same portfolio response. This keeps the widget and Markets page numerically aligned whenever they are rendering the same response generation.

## Live time behavior

Network data still refreshes on the WorkManager cadence, but time-sensitive UI is local/native:

- header clock: Android `TextClock`, `HH:mm:ss`
- HSL next departure: Android `Chronometer` while outside the final one-minute due guard when exact rollover alarms are available
- cached HSL departure rollover: exact local `AlarmManager` rebuild at the due-guard boundary and again at the absolute departure target
- header date: refreshed by ordinary widget rebuilds

The server attaches absolute targets to the visible HSL departure rows. Android always selects the first still-future target. LIVE vs SCHED only describes the source/status of the departure; both use the same rollover rule. One minute before the selected target, an exact local alarm rebuilds the widget and replaces the ticking Chronometer with the static `DUE` label. At the target, the next exact alarm rebuilds from cache, drops the passed departure, promotes the next one and immediately schedules that departure's guard and rollover. This prevents ordinary target-alarm or launcher rebuild latency from exposing a negative Chronometer. No HSL network request is required for this cached rollover.

On Android 12+ exact rollover uses the `SCHEDULE_EXACT_ALARM` special access when granted. If exact alarms are not available, the widget deliberately shows the absolute departure clock instead of a ticking Chronometer that could roll below zero; an inexact alarm/network refresh can still advance the row later.

The header currently reads approximately:

```text
08:06:26  MON 14 SEP · W38
```

The bottom footer owns refresh/status:

```text
UPDATED 08:04                                      ↻
```

Tapping `↻` starts a manual refresh and swaps the symbol to a native indeterminate `ProgressBar` until the attempt finishes.

## Refresh, retry and fallback

`WidgetRepository` keeps the last compatible cache and always preserves it if a refresh fails.

Starting in 2.8.4, the rich v2 request gets one bounded retry for transient errors such as timeout, DNS/connectivity/SSL/IO failures, HTTP 408/425/429 and HTTP 5xx. Semantic/permanent failures such as `PARSE`, `COMPAT`, `EMPTY`, `SECURITY` and ordinary 4xx are not blindly retried.

If v2 still fails, Android tries the legacy endpoint. If both fail, the old compatible cache remains visible.

The footer exposes compact diagnostics only when useful, for example:

```text
V2 TIMEOUT/R · L DNS · LAST 08:04
```

`/R` means the v2 request used its one retry. When legacy succeeds after v2 failure, the footer identifies the fallback instead of pretending the rich presentation succeeded.

## Presentation grammar

Generic content primitives include:

- `primary`
- `secondary`
- `detail`
- `tone`
- `rows`
- `columns`
- normalized `bars`
- optional countdown target data

Rows may carry optional temporal metadata used by the Android runtime to advance a countdown section locally while keeping the visible row layout unchanged.

Large layout supports:

- `span: full`
- `span: half`
- `layout: stack`
- `layout: split`

Missing layout metadata defaults to `full + stack` for backward-compatible cached payloads. Payload compatibility rejects missing/zero schema or engine versions rather than treating them as implicitly supported.

## Android / RemoteViews constraints

Glance widgets are ultimately rendered through RemoteViews, so launcher compatibility matters beyond compilation.

Do not:

- flatten logical large rows into many direct root `Column` children
- introduce arbitrary Android view classes into `AndroidRemoteViews`
- use `Space` inside RemoteViews XML

Keep large rows wrapped in `LargeRowBlock`. Use only RemoteViews-safe native views such as TextView/TextClock/Chronometer/ProgressBar where needed.

## APK workflow

Android-changing PRs run unit tests and compile a debug APK. After merge to `main`, the Android release workflow runs the Android unit tests again, restores the persistent signing identity, builds the signed release APK, verifies the signature and uploads the artifact.

Server-only presentation changes do not require an APK.

Current app version: **2.10.1**.
