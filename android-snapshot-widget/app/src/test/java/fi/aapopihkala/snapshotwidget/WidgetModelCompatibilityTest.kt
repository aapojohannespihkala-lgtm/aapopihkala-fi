package fi.aapopihkala.snapshotwidget

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
}
