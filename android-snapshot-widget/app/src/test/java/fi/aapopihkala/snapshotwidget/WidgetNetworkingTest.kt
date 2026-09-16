package fi.aapopihkala.snapshotwidget

import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Test

class WidgetNetworkingTest {
    @Test
    fun retriesTransientTransportAndServerFailures() {
        assertTrue(shouldRetryV2Status("TIMEOUT"))
        assertTrue(shouldRetryV2Status("DNS"))
        assertTrue(shouldRetryV2Status("CONNECT"))
        assertTrue(shouldRetryV2Status("SSL"))
        assertTrue(shouldRetryV2Status("IO"))
        assertTrue(shouldRetryV2Status("HTTP408"))
        assertTrue(shouldRetryV2Status("HTTP429"))
        assertTrue(shouldRetryV2Status("HTTP503"))
    }

    @Test
    fun doesNotRetrySemanticOrPermanentFailures() {
        assertFalse(shouldRetryV2Status("PARSE"))
        assertFalse(shouldRetryV2Status("COMPAT"))
        assertFalse(shouldRetryV2Status("EMPTY"))
        assertFalse(shouldRetryV2Status("SECURITY"))
        assertFalse(shouldRetryV2Status("HTTP403"))
        assertFalse(shouldRetryV2Status("HTTP404"))
    }

    @Test
    fun diagnosticsKeepTheFinalFailureAndRetryMarker() {
        val diagnostics = WidgetFetchDiagnostics(
            v2Status = "TIMEOUT",
            legacyStatus = "DNS",
            v2Retried = true,
        )

        assertEquals("V2 TIMEOUT/R · L DNS", diagnostics.failureLabel())
        assertEquals("LEGACY · V2 TIMEOUT/R", diagnostics.legacyFallbackLabel())
    }

    @Test
    fun v2SuccessSkipsRetryAndLegacy() = runBlocking {
        val calls = mutableListOf<String>()
        val v2Payload = payload("prod")

        val outcome = fetchWidgetPayloadWithFallback(
            primaryTimeoutMs = 12_000,
            retryTimeoutMs = 6_500,
            retryDelay = { calls += "delay" },
            fetchV2 = { timeoutMs ->
                calls += "v2:$timeoutMs"
                WidgetFetchResult(v2Payload, "OK")
            },
            fetchLegacy = {
                calls += "legacy"
                WidgetFetchResult(payload("legacy"), "OK")
            },
        )

        assertSame(v2Payload, outcome.payload)
        assertEquals(listOf("v2:12000"), calls)
        assertEquals("OK", outcome.v2Status)
        assertEquals("SKIP", outcome.legacyStatus)
        assertFalse(outcome.v2Retried)
    }

    @Test
    fun transientV2FailureRetriesOnceAndUsesRetrySuccess() = runBlocking {
        val calls = mutableListOf<String>()
        val v2Payload = payload("prod")
        var attempt = 0

        val outcome = fetchWidgetPayloadWithFallback(
            primaryTimeoutMs = 12_000,
            retryTimeoutMs = 6_500,
            retryDelay = { calls += "delay" },
            fetchV2 = { timeoutMs ->
                calls += "v2:$timeoutMs"
                attempt += 1
                if (attempt == 1) WidgetFetchResult(null, "TIMEOUT")
                else WidgetFetchResult(v2Payload, "OK")
            },
            fetchLegacy = {
                calls += "legacy"
                WidgetFetchResult(payload("legacy"), "OK")
            },
        )

        assertSame(v2Payload, outcome.payload)
        assertEquals(listOf("v2:12000", "delay", "v2:6500"), calls)
        assertEquals("OK", outcome.v2Status)
        assertEquals("SKIP", outcome.legacyStatus)
        assertTrue(outcome.v2Retried)
    }

    @Test
    fun permanentV2FailureSkipsRetryAndUsesLegacy() = runBlocking {
        val calls = mutableListOf<String>()
        val legacyPayload = payload("legacy")

        val outcome = fetchWidgetPayloadWithFallback(
            primaryTimeoutMs = 12_000,
            retryTimeoutMs = 6_500,
            retryDelay = { calls += "delay" },
            fetchV2 = { timeoutMs ->
                calls += "v2:$timeoutMs"
                WidgetFetchResult(null, "PARSE")
            },
            fetchLegacy = {
                calls += "legacy"
                WidgetFetchResult(legacyPayload, "OK")
            },
        )

        assertSame(legacyPayload, outcome.payload)
        assertEquals("legacy", outcome.payload?.channel)
        assertEquals(listOf("v2:12000", "legacy"), calls)
        assertEquals("PARSE", outcome.v2Status)
        assertEquals("OK", outcome.legacyStatus)
        assertFalse(outcome.v2Retried)
    }

    @Test
    fun exhaustedTransientV2FailureFallsBackToLegacy() = runBlocking {
        val calls = mutableListOf<String>()
        val legacyPayload = payload("legacy")
        var attempt = 0

        val outcome = fetchWidgetPayloadWithFallback(
            primaryTimeoutMs = 12_000,
            retryTimeoutMs = 6_500,
            retryDelay = { calls += "delay" },
            fetchV2 = { timeoutMs ->
                calls += "v2:$timeoutMs"
                attempt += 1
                if (attempt == 1) WidgetFetchResult(null, "TIMEOUT")
                else WidgetFetchResult(null, "HTTP503")
            },
            fetchLegacy = {
                calls += "legacy"
                WidgetFetchResult(legacyPayload, "OK")
            },
        )

        assertSame(legacyPayload, outcome.payload)
        assertEquals(listOf("v2:12000", "delay", "v2:6500", "legacy"), calls)
        assertEquals("HTTP503", outcome.v2Status)
        assertEquals("OK", outcome.legacyStatus)
        assertTrue(outcome.v2Retried)
    }

    @Test
    fun totalFailureKeepsPreviousCacheValue() = runBlocking {
        var attempt = 0
        val outcome = fetchWidgetPayloadWithFallback(
            primaryTimeoutMs = 12_000,
            retryTimeoutMs = 6_500,
            retryDelay = {},
            fetchV2 = {
                attempt += 1
                if (attempt == 1) WidgetFetchResult(null, "HTTP500")
                else WidgetFetchResult(null, "DNS")
            },
            fetchLegacy = { WidgetFetchResult(null, "CONNECT") },
        )

        assertNull(outcome.payload)
        assertEquals("DNS", outcome.v2Status)
        assertEquals("CONNECT", outcome.legacyStatus)
        assertTrue(outcome.v2Retried)
        assertEquals("previous-cache", widgetCacheJsonAfterFetch("previous-cache", outcome.payload))
    }

    @Test
    fun successfulPartialV2KeepsExpectedLastKnownGoodSection() {
        val layouts = WidgetLayouts(
            compact = listOf("weather", "electricity"),
            medium = listOf("weather", "electricity"),
            large = listOf("weather", "electricity"),
        )
        val oldWeather = WidgetSection(
            id = "weather",
            index = "01",
            label = "WEATHER",
            primary = "8.0°C",
            observedAt = "2026-09-14T06:00:00Z",
        )
        val freshElectricity = WidgetSection(
            id = "electricity",
            index = "02",
            label = "ELECTRICITY",
            primary = "3.00 c/kWh",
            fetchedAt = "2026-09-15T06:00:00Z",
        )
        val previous = payload("prod").copy(layouts = layouts, sections = listOf(oldWeather))
        val presentation = payload("prod").copy(layouts = layouts, sections = listOf(freshElectricity))

        val merged = mergeMissingExpectedSections(presentation, previous)

        assertEquals(listOf("electricity", "weather"), merged.sections.map { it.id })
        assertEquals("2026-09-14T06:00:00Z", merged.sections.last().observedAt)
    }

    @Test
    fun sectionRemovedFromNewLayoutIsNotCarriedForward() {
        val previous = payload("prod")
        val electricity = WidgetSection(
            id = "electricity",
            index = "02",
            label = "ELECTRICITY",
            primary = "3.00 c/kWh",
        )
        val electricityOnly = WidgetLayouts(
            compact = listOf("electricity"),
            medium = listOf("electricity"),
            large = listOf("electricity"),
        )
        val presentation = payload("prod").copy(
            layouts = electricityOnly,
            sections = listOf(electricity),
        )

        val merged = mergeMissingExpectedSections(presentation, previous)

        assertEquals(listOf("electricity"), merged.sections.map { it.id })
    }

    @Test
    fun untrackedSectionWithoutFreshnessPolicyIsNotCarriedForward() {
        val layouts = WidgetLayouts(
            compact = listOf("weather"),
            medium = listOf("weather"),
            large = listOf("weather", "liiga"),
        )
        val liiga = WidgetSection(
            id = "liiga",
            index = "06",
            label = "LIIGA",
            primary = "1/16",
        )
        val previous = payload("prod").copy(layouts = layouts, sections = listOf(liiga))
        val presentation = payload("prod").copy(layouts = layouts)

        val merged = mergeMissingExpectedSections(presentation, previous)

        assertEquals(listOf("weather"), merged.sections.map { it.id })
    }

    @Test
    fun legacyPayloadDoesNotMergeRichCachedSections() {
        val presentation = payload("legacy")
        val previous = payload("prod").copy(
            sections = listOf(
                WidgetSection("hsl", "04", "HSL", "5 MIN", fetchedAt = "2026-09-14T06:00:00Z")
            )
        )

        assertSame(presentation, mergeMissingExpectedSections(presentation, previous))
    }

    @Test
    fun missingStructuredWeatherUsesLegacyRowsAndForecastWithoutReplacingSolarDetail() {
        val presentationWeather = WidgetSection(
            id = "weather",
            index = "01",
            label = "WEATHER",
            primary = "16.3°C",
            detail = "Clear sky\n↑06:48 ↓19:42 ☀12H54M",
        )
        val legacyWeather = WidgetSection(
            id = "weather",
            index = "01",
            label = "WEATHER",
            primary = "16.3°C",
            detail = "Clear sky / 6° / 17°",
            rows = listOf(
                WidgetItem("LOW", "6°"),
                WidgetItem("HIGH", "17°"),
            ),
            columns = listOf(
                WidgetItem("18:00", "15°"),
                WidgetItem("20:00", "13°"),
                WidgetItem("22:00", "12°"),
                WidgetItem("00:00", "11°"),
                WidgetItem("02:00", "10°"),
                WidgetItem("04:00", "9°"),
            ),
        )
        val presentation = payload("prod").copy(sections = listOf(presentationWeather))
        val legacy = payload("legacy").copy(sections = listOf(legacyWeather))

        assertTrue(weatherNeedsLegacyEnrichment(presentation))
        val merged = mergeLegacyWeather(presentation, legacy)
        val weather = merged.sections.single()

        assertEquals(presentationWeather.detail, weather.detail)
        assertEquals(listOf("6°", "17°"), weather.rows.map { it.value })
        assertEquals(6, weather.columns.size)
        assertEquals("18:00", weather.columns.first().label)
        assertEquals("04:00", weather.columns.last().label)
        assertFalse(weatherNeedsLegacyEnrichment(merged))
    }

    private fun payload(channel: String) = WidgetPayload(
        schemaVersion = 2,
        minEngineVersion = 2,
        channel = channel,
        generatedAt = "2026-09-14T06:00:00Z",
        refreshMinutes = 15,
        title = "Snapshot",
        pageUrl = SnapshotEndpoints.PAGE_URL,
        theme = WidgetTheme.default(),
        layouts = WidgetLayouts.default(),
        sections = listOf(
            WidgetSection(
                id = "weather",
                index = "01",
                label = "WEATHER",
                primary = "10.0°C",
            )
        ),
    )
}
