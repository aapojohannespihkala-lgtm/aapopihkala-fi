# Snapshot Widget

Native Android home-screen widget for `https://aapopihkala.fi/current/snapshot/`.

The widget is a compact companion to the mobile Snapshot page. The website is the visual/information-design reference, but the Android widget is intentionally more minimal and uses home-screen space differently rather than copying the page pixel for pixel.

For the full architecture, handover notes, version history, constraints and workflow, see `docs/WIDGET.md`.

## Architecture

The Android app is a small native presentation/runtime engine. It reads the rich production presentation contract from:

```text
https://aapopihkala.fi/api/current/widget-v2?channel=prod
```

The compatibility fallback is:

```text
https://aapopihkala.fi/api/current/widget
```

Important: `/api/current/widget?v=2` is not the canonical rich v2 endpoint.

Most widget content/layout changes should happen in the server presentation and be checked at `/current/widget-preview/`. A new APK is needed only when Android rendering, networking/cache behavior or platform capabilities change.

## Current large layout

The production large widget contains:

- Weather
- Electricity
- Markets
- HSL
- Rates
- Liiga

Large composition is server-driven through generic `span`/`layout` metadata. Current production uses full-width split rows for Weather, Electricity, Markets and HSL, followed by half-width Rates + Liiga.

### Markets data contract

The widget Markets section must use the same portfolio feed as `/current/markets/`, not a parallel snapshot-specific portfolio calculation. The main value is the **1D median** across the available holdings in that shared feed. The widget also shows the shared **1M** and **1Y** medians as small supporting values.

The right-side WORLD, USA, FINLAND, BTC / EUR and REMEDY rows are the corresponding 1D values from that same portfolio response. This keeps the widget and Markets page numerically aligned whenever they are rendering the same response generation.

### Electricity chart

Electricity keeps the day average as the primary value, shows the month average on its own detail line and LOW/HIGH on the next line. The current price is shown as a bare number centered over the current-time marker.

The chart is rendered into one Android bitmap before Glance hands it to the launcher. The bitmap keeps the hourly server bars and draws the current-time marker at minute-level precision. Its time axis is labeled `00`, `06`, `12`, `18`, `24`. The marker uses a light outer stroke and dark inner stroke so it remains visible both over the pale price bars and over the dark widget background. This avoids relying on launcher-specific RemoteViews overlay or very narrow weighted-layout behavior.

## Live time behavior

Network data still refreshes on the WorkManager cadence, but time-sensitive UI is local/native:

- header clock: Android `TextClock`, `HH:mm:ss`
- HSL next departure: Android `Chronometer` outside the final one-minute due guard when exact rollover alarms are available
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

Keep large rows wrapped in `LargeRowBlock`. Use only RemoteViews-safe native views such as TextView/TextClock/Chronometer/ProgressBar where needed. For small custom graphics whose exact layering matters, prefer one pre-rendered bitmap over stacked Glance children whose z-order or narrow weighted sizing can vary by launcher.

## APK workflow

Android-changing PRs run unit tests and compile a debug APK. After merge to `main`, the Android release workflow runs the Android unit tests again, restores the persistent signing identity, builds the signed release APK, verifies the signature and uploads the artifact.

Server-only presentation changes do not require an APK.

Current app version: **2.10.8**.
