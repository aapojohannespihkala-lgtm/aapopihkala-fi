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

Large composition is server-driven through generic `span`/`layout` metadata. Weather uses a full-width stack so its six-point forecast can sit directly below the current temperature. Electricity, Markets and HSL use full-width split rows, followed by half-width Rates + Liiga.

### Weather layout

The large Weather section keeps location and current temperature first, then renders six upcoming forecast readings in one centered row. The condition/day-range text stays compact beside the solar visual. The day-night disk has the daylight duration centered above it, with sunrise aligned to the left of the disk centreline and sunset aligned to the right. Daylight duration, sunrise and sunset use one shared text scale. The daylight portion of the disk is filled, while the below-horizon portion stays unfilled and is defined by the same line tone used by section dividers. The current-sun marker follows the disk circumference, stays filled while above the horizon and becomes a hollow ring while behind it; the horizon line passes over the marker at sunrise and sunset.

### Liiga layout

The large half-width Liiga section shows the Ilves standing, next match and start time, plus one compact `LAST` row for the previous result. During a live match, the score becomes the primary value and the supporting lines show the teams plus `LIVE`, period and total elapsed game time. Half-width sections render at most one non-duplicate support row below their normal detail line so the shared Rates + Liiga row keeps its existing height and alignment.

### Markets data contract

The widget Markets section must use the same portfolio feed as `/current/markets/`, not a parallel snapshot-specific portfolio calculation. The main value is the **1D median** across the available holdings in that shared feed. The widget also shows the shared **1M** and **1Y** medians as small supporting values.

The right-side WORLD, USA, FINLAND, BTC / EUR and REMEDY rows are the corresponding 1D values from that same portfolio response. This keeps the widget and Markets page numerically aligned whenever they are rendering the same response generation.

### Electricity chart

Electricity keeps the day average as the primary value. Its compact detail rows use three full-width lines below the main value/chart row: today's LOW/HIGH first, TOMORROW AVG second, and MONTH AVG third. Tomorrow uses `--.--` before the complete day-ahead price set is available. These compact rows omit the `c/kWh` unit. In the large split layout, the numeric day average uses the same primary-value scale as the other main metrics while `c/kWh` is rendered as a smaller unit beside it. The chart occupies the same right-side grid column as Markets and HSL support content, with its visual left and right edges aligned to that column and the widget content edge. The electricity chart now starts at the same vertical origin as the `02 ELECTRICITY` heading instead of below it. The current-price number shares the live current-time x-position and is locked to a fixed 9 dp baseline from that top edge, visually matching the section heading level. The bar baseline stays at the previously approved absolute position: 54 dp from the shared top edge and 16 dp above the chart bottom. The extra 6 dp is added below the 2.10.45 chart geometry, restoring the lower edge seen in 2.10.44 while keeping the heading-level price fixed. The bars scale through the enlarged space rather than shifting upward. The current-time marker uses a light outer stroke and dark inner stroke from immediately below the price glyph all the way to the bar baseline, restoring the white marker edges up to the number. The time-axis labels remain below the fixed bar baseline.

The chart is rendered into one Android bitmap before Glance hands it to the launcher. The bitmap is 288 x 140 px for a 70 dp display slot, preserving two vertical pixels per display dp while keeping the heading-level price and restoring the approved lower chart position. It keeps the hourly server bars and draws the current-time marker at minute-level precision. Its time axis is labeled `00`, `06`, `12`, `18`, `24`; the edge labels use inward alignment so they remain fully visible. The current-price label uses the marker itself as its anchor, switching to left/right alignment near midnight and the end of the day instead of drifting away from the marker. The marker uses a light outer stroke and dark inner stroke so it remains visible both over the pale price bars and over the dark widget background.

Because the `NOW` electricity price changes on 15-minute market intervals, Android schedules the next quarter-hour boundary locally. That alarm is also the background freshness watchdog for the full widget: it rebuilds the cached presentation first, then enqueues a connected expedited WorkManager refresh. The regular 15-minute periodic WorkManager job remains an additional fallback rather than being replaced.

## Live time behavior

Normal network data still refreshes on the WorkManager cadence, while selected time-sensitive behavior is driven by local/native scheduling:

- header clock: Android `TextClock`, `HH:mm:ss`
- Electricity `NOW`: quarter-hour wakeup AlarmManager trigger that rebuilds cached freshness and enqueues a connected expedited WorkManager refresh
- HSL network freshness: source `fetchedAt` drives a non-wakeup refresh before the 5-minute LIVE stale limit
- HSL next departure: Android `Chronometer` outside the final one-minute due guard when exact rollover alarms are available
- cached HSL departure rollover: exact local `AlarmManager` rebuild at the due-guard boundary and again at the absolute departure target
- header date/week: refreshed by ordinary widget rebuilds

The Electricity quarter-hour alarm uses `RTC_WAKEUP`. If exact-alarm access is available it uses `setExactAndAllowWhileIdle`; otherwise it uses `setAndAllowWhileIdle`. This intentionally trades a small amount of battery for reliable visible freshness across Doze: the alarm can wake the app, refresh the cached STALE presentation immediately and hand the bounded network work to WorkManager. The scheduled worker is expedited when quota permits and automatically falls back to ordinary one-time work if expedited quota is unavailable.

HSL data freshness is separate from countdown progression. A successful HSL payload schedules a non-wakeup network trigger four minutes after its source `fetchedAt`. If HSL is missing or already stale, Android schedules a five-minute recovery attempt instead of entering a tight retry loop. The trigger rebuilds the cached widget before enqueueing the same connected `SnapshotUpdateWorker` path as other scheduled refreshes, so stale LIVE content cannot remain visually fresh just because WorkManager is delayed. Sleeping devices are not woken solely for the 4-minute HSL trigger; the quarter-hour Electricity watchdog provides the bounded sleeping-device fallback.

The server attaches absolute targets to the visible HSL departure rows. Android always selects the first still-future target. LIVE vs SCHED only describes the source/status of the departure; both use the same rollover rule. One minute before the selected target, an exact local alarm rebuilds the widget and replaces the ticking Chronometer with the static `DUE` label. At the target, the next exact alarm rebuilds from cache, drops the passed departure, promotes the next one and immediately schedules that departure's guard and rollover. This prevents ordinary target-alarm or launcher rebuild latency from exposing a negative Chronometer. No HSL network request is required for this cached rollover.

On Android 12+ exact rollover uses the `SCHEDULE_EXACT_ALARM` special access when granted. If exact alarms are not available, the widget deliberately shows the absolute departure clock instead of a ticking Chronometer that could roll below zero; an inexact alarm/network refresh can still advance the row later.

The header uses the full row as three aligned zones:

```text
08:06:26              MON 14 SEP               W38
```

The bottom footer owns refresh/status:

```text
UPDATED 08:04                                REFRESH
```

Tapping the bitmap refresh icon starts a manual refresh and swaps the icon to a native indeterminate `ProgressBar` until the attempt finishes. The visible refresh control is 20 dp, uses a compact internal drawing with transparent padding, and the footer reserves 8 dp below the row. The loading spinner is also reduced to 24 dp so both footer states stay clear of launcher clipping.

## Refresh, retry and fallback

`WidgetRepository` keeps the last compatible cache and always preserves it if a refresh fails.

A successful rich v2 response may also be partial when one optional upstream source fails. If the new server layout still expects Weather, Electricity, Markets, Rates or HSL but that section is missing from the response, Android carries the previous compatible section forward instead of replacing it with a blank gap. The new layout remains authoritative: a section intentionally removed from all size layouts is not restored. Liiga is not carried this way because it does not yet have a section-level freshness timestamp that makes stale live or standing data safe to preserve.

Carried sections keep their own `observedAt` or `fetchedAt`. Older compatible caches that predate section-level timestamps are anchored to their previous payload `generatedAt`, so a newly generated partial response cannot make old cached values look fresh.

Weather and Electricity remain visible after their freshness limit as last-known-good values, with `/ STALE` appended to the section label. HSL remains stricter: stale LIVE rows are removed; only still-future static schedule rows may remain, and that fallback is also labeled `/ STALE`. Markets and Rates retain their slower source cadence and are not hidden merely because of weekends or market holidays.

Starting in 2.8.4, the rich v2 request gets one bounded retry for transient errors such as timeout, DNS/connectivity/SSL/IO failures, HTTP 408/425/429 and HTTP 5xx. Semantic/permanent failures such as `PARSE`, `COMPAT`, `EMPTY`, `SECURITY` and ordinary 4xx are not blindly retried.

If v2 still fails, Android tries the legacy endpoint. If both fail, the old compatible cache remains visible.

The scheduled Electricity and HSL freshness triggers rebuild the cached widget before enqueueing the same `SnapshotUpdateWorker`, endpoint/fallback path and cache preservation as periodic/manual refreshes. The AlarmManager receiver itself does not perform networking.

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
- optional section-level `observedAt` and `fetchedAt` freshness timestamps

Rows may carry optional temporal metadata used by the Android runtime to advance a countdown section locally while keeping the visible row layout unchanged.

For realtime cache freshness, Android prefers a section's `observedAt`, then `fetchedAt`, and falls back to the payload `generatedAt` for older compatible payloads. This prevents a newly generated presentation response from making older source data appear fresh while preserving backward compatibility and the last-known-good cache model.

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

Android-changing PRs run the version-bump guard, unit tests and a debug APK compile. Production Android changes must increase `versionCode` and advance the numeric `versionName`. After merge to `main`, the Android release workflow runs the Android unit tests again, restores the persistent signing identity, builds the signed release APK, verifies the signature and uploads the artifact.

Server-only presentation changes do not require an APK.

Typography uses a shared semantic scale for the header, primary values, compact units, supporting text, row values and micro labels. In the large widget, full-width and half-width section primary values intentionally share the same 22 sp scale, while the clock, date and ISO week share the same 16 sp header scale. Compound units such as `c/kWh` intentionally use the smaller unit role while short numeric suffixes remain part of their primary value.

Current app version: **2.10.49**.
