package fi.aapopihkala.snapshotwidget

import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

private const val MINUTE_MS = 60_000L

private val realtimeCacheMaxAgeMs = mapOf(
    "hsl" to 5 * MINUTE_MS,
    "electricity" to 45 * MINUTE_MS,
    "weather" to 90 * MINUTE_MS,
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

/**
 * Prevents an old locally cached payload from presenting realtime sections as current.
 * Slow-moving sections (markets/rates/schedules) remain available; their upstream
 * freshness is a server-side concern. HSL keeps only future non-LIVE schedule rows.
 */
internal fun WidgetPayload.withSafeCachedFreshness(nowMs: Long): WidgetPayload {
    val generatedMs = parseWidgetGeneratedAtMs(generatedAt) ?: return this
    val ageMs = (nowMs - generatedMs).coerceAtLeast(0L)
    val safeSections = sections.mapNotNull { section ->
        val maxAgeMs = realtimeCacheMaxAgeMs[section.id] ?: return@mapNotNull section
        if (ageMs <= maxAgeMs) return@mapNotNull section

        if (section.id != "hsl") return@mapNotNull null
        val scheduledRows = section.rows.filter { item ->
            !item.tone.equals("accent", ignoreCase = true) &&
                item.countdownTargetMs?.let { it > nowMs } == true
        }
        if (scheduledRows.isEmpty()) null
        else section.copy(
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
