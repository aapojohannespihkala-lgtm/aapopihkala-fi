# Snapshot Widget

Native Android home-screen widget for `https://aapopihkala.fi/current/snapshot/`.

The widget is a compact, glanceable companion to the mobile Snapshot page. Snapshot is the visual and information-design reference, but the Android widget is intentionally more minimal and uses home-screen space differently rather than copying the page pixel for pixel.

## Architecture

Version 2 is a small native presentation engine. It reads a versioned presentation contract from:

```text
https://aapopihkala.fi/api/current/widget-v2?channel=prod
```

The engine caches the latest compatible payload and renders compact, medium or large layouts from server-provided sections, ordering and theme.

The legacy endpoint remains available as a compatibility fallback:

```text
https://aapopihkala.fi/api/current/widget
```

Important: `/api/current/widget?v=2` is not the v2 presentation endpoint. The rich presentation model lives at `/api/current/widget-v2`.

Most widget changes should happen in the server presentation contract and can be checked at `/current/widget-preview/` without rebuilding the APK. See `docs/WIDGET.md` for the full architecture, design goals, diagnostics, workflow, file map and current roadmap.

## Refresh and fallback

The app refreshes with WorkManager every 15 minutes and includes a manual REFRESH action. It keeps the last compatible cache and falls back to the legacy endpoint if v2 is unavailable.

## APK workflow

Android engine changes are validated with a debug APK on the pull request. After an Android-changing PR is merged, the Android release workflow on `main` builds and uploads the persistently signed release APK. Server-only widget changes do not require a new APK.

A new APK is needed only when the Android renderer, platform behavior, networking/cache engine or supported presentation primitives change.

## Current development state

Version `2.4.4` is a temporary diagnostic build used to make phone-side network and cache behavior observable. It reports the installed app version from `BuildConfig`, v2 request status, legacy fallback status and cache age directly in the widget.

A successful `2.4.4` refresh has shown the full rich v2 layout with Weather, Electricity, Markets, Rates and Liiga. The visible diagnostics are development instrumentation, not part of the intended final design.

The current large-layout direction uses:

- time, date and ISO week in the header instead of `CURRENT / SNAPSHOT`
- horizontal Weather layout with current conditions and forecast side by side
- sunrise, sunset and daylight length
- server-driven electricity bars and market detail rows
- Rates and Liiga in the lower area
- HSL reserved as a future section after the current layout grammar is stable

Development should proceed section by section rather than repeatedly redesigning the whole widget.
