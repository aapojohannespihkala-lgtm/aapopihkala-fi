package fi.aapopihkala.snapshotwidget

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import kotlin.math.PI
import kotlin.math.acos
import kotlin.math.sqrt

class SolarDetailVisualTest {
    @Test
    fun `solar detail parser extracts daylight values and removes sun glyph from compact label`() {
        val parsed = parseSolarDetail("Overcast / 8° / 14°\n↑06:37 ↓19:39 ☀13H02M")

        requireNotNull(parsed)
        assertEquals("Overcast / 8° / 14°", parsed.conditionText)
        assertEquals("06:37", parsed.sunrise)
        assertEquals("19:39", parsed.sunset)
        assertEquals(13 * 60 + 2, parsed.daylightMinutes)
        assertEquals("↑06:37  ↓19:39  13H02M", parsed.compactLabel)
    }

    @Test
    fun `twelve hour day puts horizon through circle centre`() {
        assertEquals(0.0, daylightHorizonOffset(0.5), 1e-9)
    }

    @Test
    fun `longer day moves horizon below centre`() {
        assertTrue(daylightHorizonOffset(18.0 / 24.0) < 0.0)
    }

    @Test
    fun `solved chord area matches requested daylight fraction`() {
        val target = 13.0 / 24.0
        val offset = daylightHorizonOffset(target)
        val root = sqrt((1.0 - offset * offset).coerceAtLeast(0.0))
        val actual = (acos(offset) - offset * root) / PI

        assertEquals(target, actual, 1e-9)
    }
}
