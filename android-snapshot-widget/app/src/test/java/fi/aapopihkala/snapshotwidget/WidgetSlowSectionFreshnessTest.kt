package fi.aapopihkala.snapshotwidget

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class WidgetSlowSectionFreshnessTest {
    private val now = 1_789_474_800_000L // 2026-09-15T12:20:00Z = 15:20 Europe/Helsinki

    @Test
    fun electricityFromEarlierHelsinkiDayIsRemoved() {
        val result = payload(
            listOf(
                section("electricity", fetchedAt = "2026-09-14T20:59:00Z"), // 23:59 Helsinki, 14 Sep
                section("markets", fetchedAt = "2026-09-15T12:10:00Z"),
            )
        ).withSafeCachedFreshness(now)

        assertEquals(listOf("markets"), result.sections.map { it.id })
    }

    @Test
    fun electricityAfterHelsinkiMidnightStaysVisibleAsStale() {
        // 00:01 Helsinki on 15 Sep while the UTC date is still 14 Sep.
        val result = payload(
            listOf(section("electricity", fetchedAt = "2026-09-14T21:01:00Z"))
        ).withSafeCachedFreshness(now)

        assertEquals("ELECTRICITY / STALE", result.sections.single().label)
    }

    @Test
    fun electricityWithoutSectionTimesUsesPayloadDate() {
        val result = payload(
            listOf(section("electricity"), section("rates")),
            generatedAt = "2026-09-14T12:00:00Z",
        ).withSafeCachedFreshness(now)

        assertEquals(listOf("rates"), result.sections.map { it.id })
    }

    @Test
    fun futureDatedElectricityIsKept() {
        val result = payload(
            listOf(section("electricity", fetchedAt = "2026-09-16T08:00:00Z"))
        ).withSafeCachedFreshness(now)

        assertEquals("ELECTRICITY", result.sections.single().label)
    }

    @Test
    fun slowSectionsAtFourDayLimitAreNotMarked() {
        val atLimit = "2026-09-11T12:20:00Z"
        val result = payload(
            listOf(
                section("markets", fetchedAt = atLimit),
                section("rates", fetchedAt = atLimit),
                section("liiga", fetchedAt = atLimit),
            )
        ).withSafeCachedFreshness(now)

        assertFalse(result.sections.any { it.label.contains("STALE") })
    }

    @Test
    fun slowSectionsOlderThanFourDaysStayVisibleButAreMarked() {
        val tooOld = "2026-09-11T12:19:00Z"
        val result = payload(
            listOf(
                section("markets", fetchedAt = tooOld, tone = "positive"),
                section("rates", fetchedAt = tooOld),
                section("liiga", fetchedAt = tooOld),
            )
        ).withSafeCachedFreshness(now)

        assertEquals(listOf("markets", "rates", "liiga"), result.sections.map { it.id })
        assertTrue(result.sections.all { it.label.endsWith(" / STALE") })
        assertTrue(result.sections.all { it.primary == "VALUE" })
        assertEquals("neutral", result.sections.first().tone)
    }

    @Test
    fun laggingMarketsSourceDateDoesNotMarkFreshCacheStale() {
        val result = payload(
            listOf(
                section(
                    "markets",
                    observedAt = "2026-09-10T00:00:00Z",
                    fetchedAt = "2026-09-15T12:10:00Z",
                ),
                section("rates", observedAt = "2026-09-10T00:00:00Z"),
            )
        ).withSafeCachedFreshness(now)

        assertFalse(result.sections.any { it.label.contains("STALE") })
    }

    @Test
    fun oldNonLiveLiigaWithoutSectionTimesUsesPayloadAge() {
        val liiga = section("liiga").copy(primary = "3/17", secondary = "HIFK - ILVES · WED 28 18:30")
        val result = payload(listOf(liiga), generatedAt = "2026-09-11T00:00:00Z")
            .withSafeCachedFreshness(now)

        assertEquals("LIIGA / STALE", result.sections.single().label)
        assertEquals("3/17", result.sections.single().primary)
    }

    @Test
    fun malformedFetchedAtFallsBackToPayloadGenerationTime() {
        val result = payload(
            listOf(section("markets", fetchedAt = "not-a-time"))
        ).withSafeCachedFreshness(now)

        assertEquals("MARKETS", result.sections.single().label)
    }

    private fun section(
        id: String,
        observedAt: String? = null,
        fetchedAt: String? = null,
        tone: String = "neutral",
    ) = WidgetSection(
        id = id,
        index = "01",
        label = id.uppercase(),
        primary = "VALUE",
        tone = tone,
        observedAt = observedAt,
        fetchedAt = fetchedAt,
    )

    private fun payload(
        sections: List<WidgetSection>,
        generatedAt: String = "2026-09-15T12:19:00Z",
    ) = WidgetPayload(
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
