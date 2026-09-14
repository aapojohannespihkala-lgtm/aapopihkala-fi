package fi.aapopihkala.snapshotwidget

import java.util.TimeZone
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class ElectricityChartDisplayTest {
    @Test
    fun currentPriceLabelDropsUnitAndNowPrefixIsNotNeeded() {
        assertEquals("18.82", electricityCurrentPriceLabel("18.82 c/kWh"))
        assertEquals("18.82", electricityCurrentPriceLabel("18.82"))
        assertNull(electricityCurrentPriceLabel(null))
        assertNull(electricityCurrentPriceLabel("   "))
    }

    @Test
    fun electricityDetailSplitsMonthAverageFromLowAndHigh() {
        assertEquals(
            listOf("MONTH AVG 5.93", "LOW 1.38   HIGH 32.38"),
            electricityDetailLines("MONTH AVG 5.93 LOW 1.38 HIGH 32.38"),
        )
    }

    @Test
    fun electricityDetailKeepsUnknownFormatIntact() {
        assertEquals(
            listOf("CUSTOM DETAIL"),
            electricityDetailLines("CUSTOM DETAIL"),
        )
    }

    @Test
    fun currentTimeFractionUsesMinutesAcrossTheWholeDay() {
        val utc = TimeZone.getTimeZone("UTC")

        assertEquals(0f, electricityDayFraction(0L, utc), 0.0001f)
        assertEquals(0.25f, electricityDayFraction(6L * 60L * 60L * 1000L, utc), 0.0001f)
        assertEquals(0.5f, electricityDayFraction(12L * 60L * 60L * 1000L, utc), 0.0001f)

        val eighteenThirtyNineMs = (18L * 60L + 39L) * 60L * 1000L
        assertEquals(373f / 480f, electricityDayFraction(eighteenThirtyNineMs, utc), 0.0001f)

        val twentyThreeFiftyNineMs = (23L * 60L + 59L) * 60L * 1000L
        assertEquals(1439f / 1440f, electricityDayFraction(twentyThreeFiftyNineMs, utc), 0.0001f)
    }

    @Test
    fun timelineTicksIncludeTwentyFourAtTheRightEdge() {
        assertEquals(8f, electricityAxisHourX(0, 480), 0.01f)
        assertEquals(124f, electricityAxisHourX(6, 480), 0.01f)
        assertEquals(240f, electricityAxisHourX(12, 480), 0.01f)
        assertEquals(356f, electricityAxisHourX(18, 480), 0.01f)
        assertEquals(472f, electricityAxisHourX(24, 480), 0.01f)
    }

    @Test
    fun currentPriceStaysCenteredOnMarkerWhenThereIsRoom() {
        val dayFraction = (20f + 26f / 60f) / 24f
        val markerX = electricityMarkerX(dayFraction, 480)

        assertEquals(markerX, electricityPriceCenterX(markerX, 45f, 480), 0.01f)
        assertEquals(22.5f, electricityPriceCenterX(8f, 45f, 480), 0.01f)
        assertEquals(457.5f, electricityPriceCenterX(472f, 45f, 480), 0.01f)
    }

    @Test
    fun chartKeepsHourlyResolutionAndClampsInvalidValues() {
        assertEquals(
            listOf(0f, 0.5f, 1f, 0f, 1f, 0f),
            normalizedElectricityBars(listOf(0.0, 0.5, 1.0, -1.0, 2.0, Double.NaN)),
        )
        assertEquals(24, normalizedElectricityBars(List(30) { 0.5 }).size)
        assertEquals(emptyList<Float>(), normalizedElectricityBars(listOf(0.5), maxBars = 0))
    }
}
