package fi.aapopihkala.snapshotwidget

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class WidgetModelCompatibilityTest {
    @Test
    fun missingSchemaVersionIsNotCompatible() {
        val parsed = WidgetPayloadCodec.parse(
            """
                {
                  "minEngineVersion": 1,
                  "sections": [{"id":"weather","primary":"8.1°C"}]
                }
            """.trimIndent()
        )

        assertFalse(parsed!!.isCompatible())
    }

    @Test
    fun supportedSchemaAndEngineRemainCompatible() {
        val parsed = WidgetPayloadCodec.parse(
            """
                {
                  "schemaVersion": 2,
                  "minEngineVersion": 2,
                  "sections": [{"id":"weather","primary":"8.1°C"}]
                }
            """.trimIndent()
        )

        assertTrue(parsed!!.isCompatible())
    }

    @Test
    fun zeroMinimumEngineVersionIsNotCompatible() {
        val parsed = WidgetPayloadCodec.parse(
            """
                {
                  "schemaVersion": 2,
                  "minEngineVersion": 0,
                  "sections": [{"id":"weather","primary":"8.1°C"}]
                }
            """.trimIndent()
        )

        assertFalse(parsed!!.isCompatible())
    }

    @Test
    fun sectionFreshnessMetadataSurvivesCacheRoundTrip() {
        val parsed = WidgetPayloadCodec.parse(
            """
                {
                  "schemaVersion": 2,
                  "minEngineVersion": 2,
                  "generatedAt": "2026-09-16T09:00:00Z",
                  "sections": [{
                    "id": "electricity",
                    "primary": "2.10 c/kWh",
                    "observedAt": "2026-09-16T08:45:00Z",
                    "fetchedAt": "2026-09-16T08:46:00Z"
                  }]
                }
            """.trimIndent()
        )!!

        val roundTrip = WidgetPayloadCodec.parse(WidgetPayloadCodec.encode(parsed))!!
        val section = roundTrip.sections.single()
        assertEquals("2026-09-16T08:45:00Z", section.observedAt)
        assertEquals("2026-09-16T08:46:00Z", section.fetchedAt)
    }
}
