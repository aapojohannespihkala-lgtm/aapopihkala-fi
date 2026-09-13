# Snapshot Widget

Native Android home-screen widget for https://aapopihkala.fi/current/snapshot/.

Version 2 is a small presentation engine. It reads the versioned presentation contract from `https://aapopihkala.fi/api/current/widget?v=2&channel=prod`, caches the latest compatible payload and renders compact, medium or large layouts from the server-provided section order and theme.

Most widget changes should now happen in the server presentation contract and can be checked at `/current/widget-preview/` without rebuilding the APK. See `docs/WIDGET.md` for the workflow and compatibility rules.

The app keeps the old `/api/current/widget` data response as a fallback, refreshes with WorkManager every 15 minutes and includes a manual REFRESH action.

GitHub Actions builds an installable debug APK only when files under `android-snapshot-widget/` or the Android workflow itself change. The APK is intended for direct personal installation, not Play Store distribution.
