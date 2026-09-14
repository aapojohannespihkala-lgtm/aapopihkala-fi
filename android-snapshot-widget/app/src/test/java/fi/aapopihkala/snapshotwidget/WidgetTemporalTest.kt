package fi.aapopihkala.snapshotwidget

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class WidgetTemporalTest {
    @Test
    fun countdownBaseUsesElapsedRealtimeTimebase() {
        val base = countdownElapsedRealtimeBase(
            targetEpochMs = 1_000_600L,
            wallNowMs = 1_000_000L,
            elapsedNowMs = 42_000L,
        )

        assertEquals(42_600L, base)
    }

    @Test
    fun countdownBaseRejectsExpiredTargets() {
        assertNull(
            countdownElapsedRealtimeBase(
                targetEpochMs = 999_999L,
                wallNowMs = 1_000_000L,
                elapsedNowMs = 42_000L,
            )
        )
    }

    @Test
    fun temporalSectionRollsToNextFutureDeparture() {
        val section = WidgetSection(
            id = "hsl",
            index = "04",
            label = "HSL",
            primary = "1 MIN",
            secondary = "125 / TAPiOLA",
            detail = "08:16 / LIVE",
            tone = "accent",
            countdownTargetMs = 1_000L,
            rows = listOf(
                WidgetItem("125", "08:16", "accent", "125 / TAPIOLA", 1_000L),
                WidgetItem("121", "08:17", "neutral", "121 / TAPIOLA", 61_500L),
                WidgetItem("125", "08:32", "accent", "125 / TAPIOLA", 961_500L),
            )
        )

        val resolved = resolveTemporalSection(section, wallNowMs = 1_500L)

        assertEquals(61_500L, resolved.countdownTargetMs)
        assertEquals("1 MIN", resolved.primary)
        assertEquals("121 / TAPIOLA", resolved.secondary)
        assertEquals("08:17 / SCHED", resolved.detail)
        assertEquals("neutral", resolved.tone)
        assertEquals(listOf("121", "125"), resolved.rows.map { it.label })
    }

    @Test
    fun temporalSectionClearsAfterTheLastKnownDeparture() {
        val section = WidgetSection(
            id = "hsl",
            index = "04",
            label = "HSL",
            primary = "1 MIN",
            countdownTargetMs = 1_000L,
            rows = listOf(
                WidgetItem("125", "08:16", "accent", "125 / TAPIOLA", 1_000L)
            )
        )

        val resolved = resolveTemporalSection(section, wallNowMs = 1_500L)

        assertEquals("--", resolved.primary)
        assertNull(resolved.countdownTargetMs)
        assertNull(resolved.secondary)
        assertNull(resolved.detail)
        assertEquals(emptyList<WidgetItem>(), resolved.rows)
    }

    @Test
    fun cachedClockDetailRecoversUpcomingDeparture() {
        assertEquals(
            1_789_360_080_000L,
            countdownTargetFromClockDetail(
                detail = "07:28 / LIVE",
                wallNowMs = 1_789_359_900_000L,
            )
        )
    }

    @Test
    fun cachedClockDetailHandlesMidnightRollover() {
        assertEquals(
            1_789_419_900_000L,
            countdownTargetFromClockDetail(
                detail = "00:05 / LIVE",
                wallNowMs = 1_789_419_480_000L,
            )
        )
    }

    @Test
    fun cachedClockDetailRejectsClearlyStaleDeparture() {
        assertNull(
            countdownTargetFromClockDetail(
                detail = "06:00 / LIVE",
                wallNowMs = 1_789_359_900_000L,
            )
        )
    }

    @Test
    fun codecPreservesCountdownTargetsAndRowMetadata() {
        val json = """
            {
              "schemaVersion": 2,
              "minEngineVersion": 2,
              "channel": "prod",
              "generatedAt": "2026-09-14T03:45:00.000Z",
              "title": "CURRENT / SNAPSHOT",
              "pageUrl": "https://aapopihkala.fi/current/snapshot/",
              "theme": {},
              "layouts": {"large":["hsl"]},
              "sections": [
                {
                  "id":"hsl",
                  "index":"04",
                  "label":"HSL",
                  "primary":"9 MIN",
                  "countdownTargetMs":1789305000000,
                  "rows":[
                    {
                      "label":"125",
                      "value":"08:16",
                      "tone":"accent",
                      "secondary":"125 / TAPIOLA",
                      "countdownTargetMs":1789305000000
                    },
                    {
                      "label":"121",
                      "value":"08:17",
                      "tone":"neutral",
                      "secondary":"121 / TAPIOLA",
                      "countdownTargetMs":1789305060000
                    }
                  ]
                }
              ]
            }
        """.trimIndent()

        val parsed = WidgetPayloadCodec.parse(json)
        val section = parsed?.sections?.single()
        assertEquals(1_789_305_000_000L, section?.countdownTargetMs)
        assertEquals(1_789_305_060_000L, section?.rows?.get(1)?.countdownTargetMs)
        assertEquals("121 / TAPIOLA", section?.rows?.get(1)?.secondary)

        val encoded = WidgetPayloadCodec.encode(parsed!!)
        val reparsed = WidgetPayloadCodec.parse(encoded)
        val reparsedSection = reparsed?.sections?.single()
        assertEquals(1_789_305_000_000L, reparsedSection?.countdownTargetMs)
        assertEquals(1_789_305_060_000L, reparsedSection?.rows?.get(1)?.countdownTargetMs)
        assertEquals("121 / TAPIOLA", reparsedSection?.rows?.get(1)?.secondary)
    }
}
