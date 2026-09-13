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

## APK workflow

Android engine changes are validated with unit tests and a debug APK on the pull request. After an Android-changing PR is merged, the Android release workflow on `main` builds and uploads the persistently signed release APK. Server-only widget changes do not require a new APK.

A new APK is needed only when the Android renderer, platform behavior, networking/cache engine or supported presentation primitives change.

## Current development state

Version `2.6.0` introduces the generic large-layout grammar. Weather is now expressed as a full-width split section instead of being recognized by its section ID. Rates and Liiga use half-width presentation metadata instead of being inferred from their position at the end of the section list.

The current large-layout direction uses:

- time, date and ISO week in the header instead of `CURRENT / SNAPSHOT`
- horizontal Weather layout with current conditions and forecast side by side
- sunrise, sunset and daylight length
- server-driven electricity bars and market detail rows
- Rates and Liiga as half-width lower metrics
- HSL reserved as a future section after the current layout grammar is stable

Electricity and Markets are the next candidates for `layout: split`, once their horizontal compositions have been tuned in the dev presentation channel and browser preview.
