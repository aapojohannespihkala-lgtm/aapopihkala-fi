package fi.aapopihkala.snapshotwidget

import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

private const val MINUTE_MS = 60_000L

private val sectionMaxCacheAgeMs = mapOf(
    "hsl" to 5 * MINUTE_MS,
    "electricity" to 45 * MINUTE_MS,
    "weather" to 90 * MINUTE_MS,
    "liiga" to 6 * 60 * MINUTE_MS,
    "markets" to 6 * 60 * MINUTE_MS,
    "rates" to 36 * 60 * MINUTE_MS,
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

internal fun WidgetPayload.withSafeCachedFreshness(nowMs: Long): WidgetPayload {
    val generatedMs = parseWidgetGeneratedAtMs(generatedAt) ?: return copy(sections = emptyList())
    val ageMs = (nowMs - generatedMs).coerceAtLeast(0L)
    val safeSections = sections.mapNotNull { section ->
        val maxAgeMs = sectionMaxCacheAgeMs[section.id] ?: 90 * MINUTE_MS
        when {
            ageMs <= maxAgeMs -> section
            section.id == "hsl" -> {
                val scheduledRows = section.rows
                    .filter { it.countdownTargetMs?.let { target -> target > nowMs } == true }
                    .map { it.copy(tone = "neutral") }
                if (scheduledRows.isEmpty()) null
                else section.copy(
                    tone = "neutral",
                    rows = scheduledRows,
                    countdownTargetMs = scheduledRows.first().countdownTargetMs,
                )
            }
            else -> null
        }
    }
    return copy(sections = safeSections).resolveTemporalSections(nowMs)
}
