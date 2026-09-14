package fi.aapopihkala.snapshotwidget

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

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
    fun `solar daylight fraction comes from sunrise and sunset`() {
        assertEquals(
            13.0 / 24.0,
            solarDaylightFraction("06:00", "19:00") ?: error("Missing daylight fraction"),
            1e-9
        )
    }

    @Test
    fun `sunrise is exactly on left horizon`() {
        val centre = 100f
        val radius = 80f
        val p = solarDaylightFraction("06:00", "19:00") ?: error("Missing daylight fraction")

        val sun = requireNotNull(
            sunPosition(
                sunrise = "06:00",
                sunset = "19:00",
                centre = centre,
                diskRadius = radius,
                nowMinute = 6.0 * 60.0
            )
        )

        val horizonY = centre - daylightHorizonOffset(p).toFloat() * radius

        assertEquals(horizonY, sun.y, 0.001f)
        assertTrue(sun.x < centre)
    }

    @Test
    fun `solar noon is top edge`() {
        val sun = requireNotNull(
            sunPosition(
                sunrise = "06:00",
                sunset = "19:00",
                centre = 100f,
                diskRadius = 80f,
                nowMinute = 12.5 * 60.0
            )
        )

        assertEquals(100f, sun.x, 0.001f)
        assertEquals(20f, sun.y, 0.001f)
    }

    @Test
    fun `sunset is exactly on right horizon`() {
        val centre = 100f
        val radius = 80f
        val p = solarDaylightFraction("06:00", "19:00") ?: error("Missing daylight fraction")

        val sun = requireNotNull(
            sunPosition(
                sunrise = "06:00",
                sunset = "19:00",
                centre = centre,
                diskRadius = radius,
                nowMinute = 19.0 * 60.0
            )
        )

        val horizonY = centre - daylightHorizonOffset(p).toFloat() * radius

        assertEquals(horizonY, sun.y, 0.001f)
        assertTrue(sun.x > centre)
    }

    @Test
    fun `solar midnight is bottom edge`() {
        val sun = requireNotNull(
            sunPosition(
                sunrise = "06:00",
                sunset = "19:00",
                centre = 100f,
                diskRadius = 80f,
                nowMinute = 30.0
            )
        )

        assertEquals(100f, sun.x, 0.001f)
        assertEquals(180f, sun.y, 0.001f)
    }

    @Test
    fun `six hours is exactly a quarter turn`() {
        val noon = requireNotNull(
            sunPosition(
                sunrise = "06:00",
                sunset = "19:00",
                centre = 100f,
                diskRadius = 80f,
                nowMinute = 12.5 * 60.0
            )
        )

        val sixHoursLater = requireNotNull(
            sunPosition(
                sunrise = "06:00",
                sunset = "19:00",
                centre = 100f,
                diskRadius = 80f,
                nowMinute = 18.5 * 60.0
            )
        )

        assertEquals(100f, noon.x, 0.001f)
        assertEquals(20f, noon.y, 0.001f)
        assertEquals(180f, sixHoursLater.x, 0.001f)
        assertEquals(100f, sixHoursLater.y, 0.001f)
    }
}
