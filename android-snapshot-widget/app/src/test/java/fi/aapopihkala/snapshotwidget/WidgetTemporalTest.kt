package fi.aapopihkala.snapshotwidget

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
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
    fun codecPreservesCountdownTarget() {
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
                  "countdownTargetMs":1789305000000
                }
              ]
            }
        """.trimIndent()

        val parsed = WidgetPayloadCodec.parse(json)
        assertEquals(1_789_305_000_000L, parsed?.sections?.single()?.countdownTargetMs)

        val encoded = WidgetPayloadCodec.encode(parsed!!)
        assertTrue(encoded.contains("\"countdownTargetMs\":1789305000000"))
    }
}
