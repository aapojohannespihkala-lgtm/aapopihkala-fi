# Snapshot Widget

Native Android home-screen widget for `https://aapopihkala.fi/current/snapshot/`.

The widget is a compact, glanceable companion to the mobile Snapshot page. Snapshot is the visual and information-design reference, but the Android widget is intentionally more minimal and uses home-screen space differently rather than copying the page pixel for pixel.

## Architecture

Version 2 is a small native presentation engine. It reads a versioned presentation contract from:

```text
https://aapopihkala.fi/api/current/widget-v2?channel=prod
```

The engine caches the latest compatible payload and renders compact, medium or large layouts from server-provided sections, ordering, theme and presentation metadata.

The legacy endpoint remains available as a compatibility fallback:

```text
https://aapopihkala.fi/api/current/widget
```

Important: `/api/current/widget?v=2` is not the v2 presentation endpoint. The rich presentation model lives at `/api/current/widget-v2`.

Most widget changes should happen in the server presentation contract and can be checked at `/current/widget-preview/` without rebuilding the APK. See `docs/WIDGET.md` for the full architecture, design goals, workflow, file map and roadmap.

## Presentation grammar

The Android renderer is intended to understand generic presentation primitives rather than product-specific section IDs. Section content can use primary, secondary and detail text plus rows, columns and normalized bars.

Large-layout composition additionally supports:

- `span: full` for a full-width row
- `span: half` for a compact half-width metric that can pair with the next half-width section
- `layout: stack` for normal vertical presentation
- `layout: split` for a two-column presentation with the primary metric on the left and supporting columns, bars or rows on the right

Missing presentation metadata defaults to `full` + `stack`, so older cached payloads remain compatible.

## Refresh and fallback

The app refreshes with WorkManager every 15 minutes and includes a manual REFRESH action. It keeps the last compatible cache and falls back to the legacy endpoint if v2 is unavailable.

Network, compatibility and fallback diagnostics are retained internally. Temporary phone-side diagnostic labels used during the 2.4.x debugging phase are no longer mixed into normal widget content.

Optional server-side sections are isolated from the rest of the payload. For example, an unavailable HSL upstream omits only the HSL section rather than preventing Weather, Electricity, Markets, Rates or Liiga from rendering.

## APK workflow

Android engine changes are validated with unit tests and a debug APK on the pull request. After an Android-changing PR is merged, the Android release workflow on `main` builds and uploads the persistently signed release APK. Server-only widget changes do not require a new APK.

A new APK is needed only when the Android renderer, platform behavior, networking/cache engine or supported presentation primitives change.

## Current development state

Version `2.6.0` introduced the generic large-layout grammar. Weather, Electricity and Markets use full-width split presentation. Rates and Liiga use half-width presentation metadata instead of being inferred from their section IDs or position.

The current large-layout direction uses:

- time, date and ISO week in the header instead of `CURRENT / SNAPSHOT`
- horizontal Weather layout with current conditions and forecast side by side
- sunrise, sunset and daylight length
- Electricity with day average and price context on the left plus intraday bars on the right
- Markets with the median on the left plus market rows on the right
- HSL with the next departure on the left plus upcoming departures on the right
- Rates and Liiga as half-width lower metrics

HSL is a server-side presentation addition and does not require an APK newer than 2.6.0. Its fetch is bounded and the section is omitted when usable departure data is unavailable. The Current page and widget adapter use the same HSL query configuration source.
