package fi.aapopihkala.snapshotwidget

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test

class WidgetFreshnessTest {
    private val now = 1_789_436_400_000L // 2026-09-15T12:20:00Z

    @Test
    fun freshRealtimeSectionsRemainAvailable() {
        val payload = payload("2026-09-15T12:10:00Z", listOf(section("electricity"), section("weather")))
        val result = payload.withSafeCachedFreshness(now)
        assertEquals(listOf("electricity", "weather"), result.sections.map { it.id })
    }

    @Test
    fun oldElectricityAndWeatherCacheIsNotPresentedAsCurrent() {
        val payload = payload("2026-09-15T10:00:00Z", listOf(section("electricity"), section("weather"), section("markets")))
        val result = payload.withSafeCachedFreshness(now)
        assertEquals(listOf("markets"), result.sections.map { it.id })
    }

    @Test
    fun staleHslDropsLiveRowsButKeepsFutureStaticScheduleFallback() {
        val future = now + 20 * 60_000L
        val hsl = section("hsl").copy(rows = listOf(
            WidgetItem("LIVE", "550", tone = "accent", countdownTargetMs = future),
            WidgetItem("SCHEDULE", "550", tone = "neutral", countdownTargetMs = future + 60_000L),
        ))
        val result = payload("2026-09-15T12:00:00Z", listOf(hsl)).withSafeCachedFreshness(now)
        val safeHsl = result.sections.single()
        assertEquals(1, safeHsl.rows.size)
        assertEquals("SCHEDULE", safeHsl.rows.single().label)
        assertEquals("neutral", safeHsl.rows.single().tone)
    }

    @Test
    fun staleHslWithoutStaticFallbackIsRemoved() {
        val hsl = section("hsl").copy(rows = listOf(
            WidgetItem("LIVE", "550", tone = "accent", countdownTargetMs = now + 60_000L),
        ))
        assertNull(payload("2026-09-15T12:00:00Z", listOf(hsl)).withSafeCachedFreshness(now).sections.firstOrNull())
    }

    @Test
    fun malformedTimestampDoesNotDestroyCachedPayload() {
        val result = payload("not-a-time", listOf(section("weather"))).withSafeCachedFreshness(now)
        assertNotNull(result.sections.singleOrNull())
    }

    private fun section(id: String) = WidgetSection(id, "01", id.uppercase(), "VALUE")

    private fun payload(generatedAt: String, sections: List<WidgetSection>) = WidgetPayload(
        schemaVersion = 2,
        minEngineVersion = 2,
        channel = "prod",
        generatedAt = generatedAt,
        refreshMinutes = 15,
        title = "Snapshot",
        pageUrl = SnapshotEndpoints.PAGE_URL,
        theme = WidgetTheme.default(),
        layouts = WidgetLayouts.default(),
        sections = sections,
    )
}
