# Snapshot Widget

Native Android home-screen widget for https://aapopihkala.fi/current/snapshot/.

Version 2 is a small presentation engine. It reads the versioned presentation contract from `https://aapopihkala.fi/api/current/widget?v=2&channel=prod`, caches the latest compatible payload and renders compact, medium or large layouts from the server-provided section order and theme.

Most widget changes should now happen in the server presentation contract and can be checked at `/current/widget-preview/` without rebuilding the APK. See `docs/WIDGET.md` for the workflow and compatibility rules.

The app keeps the old `/api/current/widget` data response as a fallback, refreshes with WorkManager every 15 minutes and includes a manual REFRESH action.

Android engine changes are validated with a debug APK on the pull request. After an Android-changing PR is merged, the merge workflow explicitly dispatches the Android release workflow on `main`, which builds and uploads the persistently signed `SnapshotWidget.apk`. Server-only widget changes do not trigger an APK build.

Version 2.2 introduces the first horizontal large-layout experiment: Weather keeps current conditions on the left and places the four forecast points beside them on the right. Other sections remain unchanged so the direction can be evaluated incrementally.

Version 2.3 replaces the generic `CURRENT / SNAPSHOT` header with local Helsinki time plus weekday, date, month, year and ISO week number. The existing UPDATED status and REFRESH action remain visible.