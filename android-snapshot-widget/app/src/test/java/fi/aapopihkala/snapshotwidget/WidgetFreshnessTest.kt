package fi.aapopihkala.snapshotwidget

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class WidgetFreshnessTest {
    private val now = 1_789_474_800_000L // 2026-09-15T12:20:00Z

    @Test
    fun freshRealtimeSectionsRemainAvailable() {
        val payload = payload("2026-09-15T12:10:00Z", listOf(section("electricity"), section("weather")))
        val result = payload.withSafeCachedFreshness(now)
        assertEquals(listOf("electricity", "weather"), result.sections.map { it.id })
    }

    @Test
    fun oldElectricityAndWeatherCacheRemainsVisibleButIsMarkedStale() {
        val payload = payload("2026-09-15T10:00:00Z", listOf(section("electricity"), section("weather"), section("markets")))
        val result = payload.withSafeCachedFreshness(now)
        assertEquals(listOf("electricity", "weather", "markets"), result.sections.map { it.id })
        assertEquals("ELECTRICITY / STALE", result.sections[0].label)
        assertEquals("WEATHER / STALE", result.sections[1].label)
        assertEquals("MARKETS", result.sections[2].label)
    }

    @Test
    fun sectionSourceTimeOverridesFreshPayloadGenerationTime() {
        val payload = payload(
            "2026-09-15T12:19:00Z",
            listOf(
                section("electricity", observedAt = "2026-09-15T11:00:00Z", fetchedAt = "2026-09-15T12:19:00Z"),
                section("weather", fetchedAt = "2026-09-15T12:10:00Z"),
            ),
        )
        val result = payload.withSafeCachedFreshness(now)
        assertEquals(listOf("electricity", "weather"), result.sections.map { it.id })
        assertEquals("ELECTRICITY / STALE", result.sections[0].label)
        assertEquals("WEATHER", result.sections[1].label)
    }

    @Test
    fun invalidObservedAtFallsBackToFetchedAt() {
        val payload = payload(
            "2026-09-15T12:19:00Z",
            listOf(section("electricity", observedAt = "not-a-time", fetchedAt = "2026-09-15T11:00:00Z")),
        )
        assertEquals("ELECTRICITY / STALE", payload.withSafeCachedFreshness(now).sections.single().label)
    }

    @Test
    fun fetchedAtIsUsedWhenObservedAtIsMissing() {
        val payload = payload(
            "2026-09-15T12:19:00Z",
            listOf(section("hsl", fetchedAt = "2026-09-15T12:00:00Z")),
        )
        assertNull(payload.withSafeCachedFreshness(now).sections.firstOrNull())
    }

    @Test
    fun staleRealtimeSectionDoesNotRemoveIndependentSections() {
        val payload = payload(
            "2026-09-15T12:19:00Z",
            listOf(
                section("weather", observedAt = "2026-09-15T10:00:00Z"),
                section("electricity", observedAt = "2026-09-15T12:10:00Z"),
                section("markets", observedAt = "2026-09-12T00:00:00Z"),
                section("rates", observedAt = "2026-09-12T00:00:00Z"),
            ),
        )
        val result = payload.withSafeCachedFreshness(now)
        assertEquals(listOf("weather", "electricity", "markets", "rates"), result.sections.map { it.id })
        assertEquals("WEATHER / STALE", result.sections[0].label)
        assertEquals("ELECTRICITY", result.sections[1].label)
    }

    @Test
    fun marketsAndRatesRemainAvailableAcrossSlowSourceCadence() {
        val payload = payload(
            "2026-09-15T12:19:00Z",
            listOf(
                section("markets", observedAt = "2026-09-12T00:00:00Z"),
                section("rates", observedAt = "2026-09-12T00:00:00Z"),
            ),
        )
        val result = payload.withSafeCachedFreshness(now)
        assertEquals(listOf("markets", "rates"), result.sections.map { it.id })
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
        assertEquals("HSL / STALE", safeHsl.label)
    }

    @Test
    fun staleHslWithoutStaticFallbackIsRemoved() {
        val hsl = section("hsl").copy(rows = listOf(
            WidgetItem("LIVE", "550", tone = "accent", countdownTargetMs = now + 60_000L),
        ))
        assertNull(payload("2026-09-15T12:00:00Z", listOf(hsl)).withSafeCachedFreshness(now).sections.firstOrNull())
    }

    @Test
    fun staleLiigaLiveSectionIsRemoved() {
        val liiga = section("liiga", observedAt = "2026-09-15T12:00:00Z").copy(
            primary = "1-2",
            secondary = "KALPA - ILVES · LIVE 45:32",
            tone = "accent",
        )
        assertNull(payload("2026-09-15T12:19:00Z", listOf(liiga)).withSafeCachedFreshness(now).sections.firstOrNull())
    }

    @Test
    fun oldNonLiveLiigaSectionRemainsAvailable() {
        val liiga = section("liiga", observedAt = "2026-09-15T10:00:00Z").copy(
            primary = "4/16",
            secondary = "ILVES - TPS · SAT 19 17:00",
        )
        assertEquals("LIIGA", payload("2026-09-15T12:19:00Z", listOf(liiga)).withSafeCachedFreshness(now).sections.single().label)
    }

    @Test
    fun malformedTimestampDoesNotDestroyCachedPayload() {
        val result = payload("not-a-time", listOf(section("weather"))).withSafeCachedFreshness(now)
        assertNotNull(result.sections.singleOrNull())
        assertTrue(result.sections.single().label == "WEATHER")
    }

    private fun section(
        id: String,
        observedAt: String? = null,
        fetchedAt: String? = null,
    ) = WidgetSection(
        id = id,
        index = "01",
        label = id.uppercase(),
        primary = "VALUE",
        observedAt = observedAt,
        fetchedAt = fetchedAt,
    )

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
