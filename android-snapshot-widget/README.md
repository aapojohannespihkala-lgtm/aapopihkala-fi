# Snapshot Widget

Native Android home-screen widget for https://aapopihkala.fi/current/snapshot/.

The widget reads live data from https://aapopihkala.fi/api/current/widget, caches the latest successful response, refreshes with WorkManager every 15 minutes, and includes a manual REFRESH action.

GitHub Actions builds an installable debug APK automatically. The APK is intended for direct personal installation, not Play Store distribution.
