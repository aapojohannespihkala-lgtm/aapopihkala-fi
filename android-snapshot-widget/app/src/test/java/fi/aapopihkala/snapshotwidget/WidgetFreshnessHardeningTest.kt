package fi.aapopihkala.snapshotwidget

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class WidgetFreshnessHardeningTest {
    private val now = 1_789_474_800_000L // 2026-09-15T12:20:00Z

    @Test
    fun staleWeatherAndElectricityRemainVisibleButClearlyMarked() {
        val weather = section(
            id = "weather",
            primary = "10.0°C",
            observedAt = "2026-09-15T10:00:00Z",
        )
        val electricity = section(
            id = "electricity",
            primary = "4.20 c/kWh",
            fetchedAt = "2026-09-15T11:00:00Z",
        )

        val result = payload(listOf(weather, electricity)).withSafeCachedFreshness(now)

        assertEquals(listOf("weather", "electricity"), result.sections.map { it.id })
        assertEquals("10.0°C", result.sections[0].primary)
        assertEquals("4.20 c/kWh", result.sections[1].primary)
        assertTrue(result.sections.all { it.label.endsWith(" / STALE") })
    }

    @Test
    fun electricityAndWeatherUseTighterFreshnessWindows() {
        val result = payload(
            listOf(
                section("electricity", "3.10 c/kWh", fetchedAt = "2026-09-15T12:00:00Z"),
                section("electricity-old", "ignored"),
                section("weather", "12.0°C", observedAt = "2026-09-15T11:50:00Z"),
            )
        ).withSafeCachedFreshness(now)

        assertFalse(result.sections.single { it.id == "electricity" }.label.contains("STALE"))
        assertFalse(result.sections.single { it.id == "weather" }.label.contains("STALE"))

        val justTooOld = payload(
            listOf(
                section("electricity", "3.10 c/kWh", fetchedAt = "2026-09-15T11:59:00Z"),
                section("weather", "12.0°C", observedAt = "2026-09-15T11:49:00Z"),
            )
        ).withSafeCachedFreshness(now)

        assertTrue(justTooOld.sections.single { it.id == "electricity" }.label.endsWith(" / STALE"))
        assertTrue(justTooOld.sections.single { it.id == "weather" }.label.endsWith(" / STALE"))
    }

    @Test
    fun freshSectionsAreNotMarkedStale() {
        val result = payload(
            listOf(
                section("weather", "12.0°C", observedAt = "2026-09-15T12:10:00Z"),
                section("electricity", "3.10 c/kWh", fetchedAt = "2026-09-15T12:10:00Z"),
            )
        ).withSafeCachedFreshness(now)

        assertFalse(result.sections.any { it.label.contains("STALE") })
    }

    @Test
    fun staleHslScheduleFallbackIsMarkedAndLiveRowsStayRemoved() {
        val hsl = section("hsl", "2 MIN", fetchedAt = "2026-09-15T12:00:00Z").copy(
            rows = listOf(
                WidgetItem("550", "15:00", tone = "accent", countdownTargetMs = now + 60_000L),
                WidgetItem("550", "15:05", tone = "neutral", countdownTargetMs = now + 6 * 60_000L),
            )
        )

        val safe = payload(listOf(hsl)).withSafeCachedFreshness(now).sections.single()

        assertTrue(safe.label.endsWith(" / STALE"))
        assertEquals(listOf("neutral"), safe.rows.map { it.tone })
        assertEquals("--", safe.primary)
    }

    @Test
    fun carriedOldCompatibleSectionKeepsItsPreviousPayloadAge() {
        val previous = payload(
            listOf(section("weather", "8.0°C"))
        ).copy(generatedAt = "2026-09-15T10:00:00Z")
        val presentation = payload(
            listOf(section("electricity", "3.10 c/kWh", fetchedAt = "2026-09-15T12:10:00Z"))
        ).copy(
            generatedAt = "2026-09-15T12:19:00Z",
            layouts = WidgetLayouts(
                compact = listOf("weather", "electricity"),
                medium = listOf("weather", "electricity"),
                large = listOf("weather", "electricity"),
            ),
        )

        val merged = mergeMissingExpectedSections(presentation, previous)
        val carriedWeather = merged.sections.single { it.id == "weather" }

        assertEquals(previous.generatedAt, carriedWeather.fetchedAt)
        assertEquals("WEATHER / STALE", merged.withSafeCachedFreshness(now)
            .sections.single { it.id == "weather" }.label)
    }

    private fun section(
        id: String,
        primary: String,
        observedAt: String? = null,
        fetchedAt: String? = null,
    ) = WidgetSection(
        id = id,
        index = "01",
        label = id.uppercase(),
        primary = primary,
        observedAt = observedAt,
        fetchedAt = fetchedAt,
    )

    private fun payload(sections: List<WidgetSection>) = WidgetPayload(
        schemaVersion = 2,
        minEngineVersion = 2,
        channel = "prod",
        generatedAt = "2026-09-15T12:19:00Z",
        refreshMinutes = 15,
        title = "Snapshot",
        pageUrl = SnapshotEndpoints.PAGE_URL,
        theme = WidgetTheme.default(),
        layouts = WidgetLayouts.default(),
        sections = sections,
    )
}
