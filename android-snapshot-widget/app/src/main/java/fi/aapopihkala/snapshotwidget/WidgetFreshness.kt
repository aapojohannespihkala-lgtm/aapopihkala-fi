package fi.aapopihkala.snapshotwidget

import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

private const val MINUTE_MS = 60_000L

private val realtimeCacheMaxAgeMs = mapOf(
    "hsl" to 5 * MINUTE_MS,
    "electricity" to 20 * MINUTE_MS,
    "weather" to 30 * MINUTE_MS,
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

private fun staleLabel(label: String): String =
    if (label.endsWith(" / STALE")) label else "$label / STALE"

/**
 * Prevents an old locally cached payload from presenting realtime sections as current.
 * Section-level source timestamps take precedence over the payload generation time so a
 * newly generated response cannot make old source data appear fresh. Older cached payloads
 * without section freshness metadata keep using generatedAt for backward compatibility.
 * Stale Weather and Electricity values remain visible as last-known-good data and are marked
 * STALE instead of disappearing. HSL still removes stale LIVE data and keeps only future
 * non-LIVE schedule rows, also marked STALE. Slow-moving sections remain available.
 */
internal fun WidgetPayload.withSafeCachedFreshness(nowMs: Long): WidgetPayload {
    val safeSections = sections.mapNotNull { section ->
        val maxAgeMs = realtimeCacheMaxAgeMs[section.id] ?: return@mapNotNull section
        val sourceMs = sectionFreshnessMs(section, generatedAt) ?: return@mapNotNull section
        val ageMs = (nowMs - sourceMs).coerceAtLeast(0L)
        if (ageMs <= maxAgeMs) return@mapNotNull section

        if (section.id != "hsl") {
            return@mapNotNull section.copy(
                label = staleLabel(section.label),
                tone = "neutral",
            )
        }

        val scheduledRows = section.rows.filter { item ->
            !item.tone.equals("accent", ignoreCase = true) &&
                item.countdownTargetMs?.let { it > nowMs } == true
        }
        if (scheduledRows.isEmpty()) null
        else section.copy(
            label = staleLabel(section.label),
            primary = "--",
            secondary = null,
            detail = null,
            tone = "neutral",
            countdownTargetMs = null,
            rows = scheduledRows,
        )
    }
    return copy(sections = safeSections)
}
