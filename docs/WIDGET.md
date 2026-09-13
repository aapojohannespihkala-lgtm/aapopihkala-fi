# Snapshot Android widget

The mobile `/current/snapshot/` page is the visual reference for the Android home-screen widget. The Android surface is native and adaptive, not a screenshot or embedded WebView.

## Ownership boundary

The widget is split into two layers:

- the website/Worker owns presentation data, labels, section order, colors and size-specific visibility
- the Android app owns a small generic renderer, caching, refresh actions, background scheduling and compatibility fallback

The stable presentation endpoint is:

```text
/api/current/widget?v=2
```

It returns a versioned presentation model rather than raw domain data. Sections use generic primitives such as a primary value, detail text, rows, columns and normalized bars. This lets normal widget design work happen on the server without rebuilding the APK.

The older `/api/current/widget` endpoint remains available as a compatibility fallback for the Android engine.

## Schema compatibility

The payload includes both `schemaVersion` and `minEngineVersion`.

The Android engine must reject a payload that requires a newer engine than the installed APK understands and keep using its last compatible cached payload. A server change may add or reorder sections only with primitives already supported by the installed engine. A genuinely new Android rendering primitive or platform capability requires a new APK.

## Prod and dev channels

`/api/current/widget?v=2&channel=prod` is the installed widget's stable channel.

`/api/current/widget?v=2&channel=dev` is for staging presentation changes. The two channels share the schema but may differ in theme, layout and visible sections. Promote a design to prod only after it looks correct in the preview.

## Browser preview

Use:

```text
/current/widget-preview/
```

The preview reads the same v2 payload and can switch between compact, medium and large size classes plus prod/dev channels. It is a design approximation of the native Glance widget, not a pixel-identical Android emulator.

The expected design loop is:

1. change only the dev presentation on the server
2. inspect compact, medium and large browser previews
3. promote the same presentation to prod
4. let installed widgets pick it up on refresh

No APK is required for this loop.

## Android engine

The engine lives under `android-snapshot-widget/` and intentionally contains no Snapshot-specific layout ordering beyond safe fallback defaults. It renders the server's generic sections and chooses a layout by the current widget dimensions.

The engine also:

- caches the latest compatible payload
- falls back to the legacy widget data endpoint if v2 is temporarily unavailable
- shows loading and connection states
- converts update timestamps to Europe/Helsinki before displaying them
- refreshes in the background with WorkManager and supports manual refresh

## APK workflow

The Android GitHub Actions workflow is path-filtered to `android-snapshot-widget/**` and its workflow file. Normal Current, Worker, presentation or preview changes therefore do not build an APK.

A new APK is needed only when the Android engine itself changes. Presentation tuning should stay in the server contract whenever the existing primitives can express it.
