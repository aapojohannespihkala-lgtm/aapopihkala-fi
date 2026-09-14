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

## Live time behavior

Network data still refreshes on the WorkManager cadence, but time-sensitive UI is local/native:

- header clock: Android `TextClock`, `HH:mm:ss`
- HSL next departure: Android `Chronometer`
- cached HSL departure rollover: lightweight local WorkManager updates at known departure times
- header date rollover: a local update at Helsinki midnight

The server attaches absolute targets to the visible HSL departure rows. Android always selects the first still-future target. When its countdown reaches zero, the passed departure is dropped and the widget rebuilds locally onto the next known departure instead of displaying `NOW` or a negative countdown. No HSL network request is required for that rollover.

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

Current engine version: **2.9.0**.
