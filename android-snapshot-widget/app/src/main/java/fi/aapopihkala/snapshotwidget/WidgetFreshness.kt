package fi.aapopihkala.snapshotwidget

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

private const val MINUTE_MS = 60_000L
private const val DAY_MS = 24 * 60 * MINUTE_MS

private val realtimeCacheMaxAgeMs = mapOf(
    "hsl" to 5 * MINUTE_MS,
    "liiga" to 5 * MINUTE_MS,
    "electricity" to 20 * MINUTE_MS,
    "weather" to 30 * MINUTE_MS,
)

// Slow sections legitimately carry source dates that lag by a trading or banking day,
// so their guard measures how old the cached copy is (fetchedAt, then generatedAt),
// not how old the upstream observation is. Four days covers weekends and short holidays.
private val slowCacheMaxAgeMs = mapOf(
    "markets" to 4 * DAY_MS,
    "rates" to 4 * DAY_MS,
    "liiga" to 4 * DAY_MS,
)

internal fun parseWidgetGeneratedAtMs(value: String): Long? {
    val formats = listOf(
        "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
        "yyyy-MM-dd'T'HH:mm:ss'Z'",
    )
    return formats.firstNotNullOfOrNull { pattern ->
        runCatching {
            SimpleDateFormat(pattern, Locale.US).apply {
                isLenient = false
                timeZone = TimeZone.getTimeZone("UTC")
            }.parse(value)?.time
        }.getOrNull()
    }
}

private fun sectionFreshnessMs(section: WidgetSection, payloadGeneratedAt: String): Long? =
    sequenceOf(section.observedAt, section.fetchedAt, payloadGeneratedAt)
        .filterNotNull()
        .mapNotNull(::parseWidgetGeneratedAtMs)
        .firstOrNull()

private fun sectionCachedAtMs(section: WidgetSection, payloadGeneratedAt: String): Long? =
    sequenceOf(section.fetchedAt, payloadGeneratedAt)
        .filterNotNull()
        .mapNotNull(::parseWidgetGeneratedAtMs)
        .firstOrNull()

private fun helsinkiDateKey(epochMs: Long): String =
    SimpleDateFormat("yyyy-MM-dd", Locale.US).apply {
        timeZone = TimeZone.getTimeZone("Europe/Helsinki")
    }.format(Date(epochMs))

private fun staleLabel(label: String): String =
    if (label.endsWith(" / STALE")) label else "$label / STALE"

private fun WidgetSection.markedStale(): WidgetSection =
    copy(label = staleLabel(label), tone = "neutral")

/**
 * Electricity values describe one Helsinki calendar day. A cached section from an earlier
 * Helsinki day must not be presented under TODAY labels, so it is removed rather than marked.
 * Unparseable or future-dated timestamps keep the section, matching the other guards.
 */
private fun isElectricityFromEarlierDay(
    section: WidgetSection,
    payloadGeneratedAt: String,
    nowMs: Long,
): Boolean {
    if (section.id != "electricity") return false
    val sourceMs = sectionFreshnessMs(section, payloadGeneratedAt) ?: return false
    return helsinkiDateKey(sourceMs) < helsinkiDateKey(nowMs)
}

private fun WidgetSection.withRealtimeGuard(payloadGeneratedAt: String, nowMs: Long): WidgetSection? {
    val maxAgeMs = realtimeCacheMaxAgeMs[id] ?: return this
    val sourceMs = sectionFreshnessMs(this, payloadGeneratedAt) ?: return this
    val ageMs = (nowMs - sourceMs).coerceAtLeast(0L)
    if (ageMs <= maxAgeMs) return this

    if (id == "liiga") {
        val isLive = secondary?.contains("· LIVE") == true ||
            primary.equals("LIVE", ignoreCase = true)
        return if (isLive) null else this
    }

    if (id != "hsl") return markedStale()

    val scheduledRows = rows.filter { item ->
        !item.tone.equals("accent", ignoreCase = true) &&
            item.countdownTargetMs?.let { it > nowMs } == true
    }
    // Never show expired LIVE departures, but keep HSL visible if refresh is delayed.
    return copy(
        label = staleLabel(label),
        primary = "--",
        secondary = null,
        detail = null,
        tone = "neutral",
        countdownTargetMs = null,
        rows = scheduledRows,
    )
}

private fun WidgetSection.withSlowCacheGuard(payloadGeneratedAt: String, nowMs: Long): WidgetSection {
    val maxAgeMs = slowCacheMaxAgeMs[id] ?: return this
    val cachedAtMs = sectionCachedAtMs(this, payloadGeneratedAt) ?: return this
    val ageMs = (nowMs - cachedAtMs).coerceAtLeast(0L)
    return if (ageMs <= maxAgeMs) this else markedStale()
}

/**
 * Prevents an old locally cached payload from presenting realtime sections as current.
 * Section-level source timestamps take precedence over the payload generation time so a
 * newly generated response cannot make old source data appear fresh. Older cached payloads
 * without section freshness metadata keep using generatedAt for backward compatibility.
 * Stale Weather and Electricity values remain visible as last-known-good data and are marked
 * STALE instead of disappearing, except Electricity from an earlier Helsinki day, which is
 * removed. HSL still removes stale LIVE data and keeps only future non-LIVE schedule rows,
 * also marked STALE. Without safe schedule rows, HSL remains an empty STALE placeholder.
 * Markets, Rates and non-live Liiga remain available and are marked STALE
 * only when the cached copy itself is more than four days old.
 */
internal fun WidgetPayload.withSafeCachedFreshness(nowMs: Long): WidgetPayload {
    val safeSections = sections.mapNotNull { section ->
        if (isElectricityFromEarlierDay(section, generatedAt, nowMs)) return@mapNotNull null
        section.withRealtimeGuard(generatedAt, nowMs)?.withSlowCacheGuard(generatedAt, nowMs)
    }
    return copy(sections = safeSections)
}
