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
            listOf("LOW 1.38   HIGH 32.38", "MONTH AVG 5.93"),
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
    fun timelineTicksUseTheFullRightColumnWidth() {
        assertEquals(0f, electricityAxisHourX(0, 288), 0.01f)
        assertEquals(72f, electricityAxisHourX(6, 288), 0.01f)
        assertEquals(144f, electricityAxisHourX(12, 288), 0.01f)
        assertEquals(216f, electricityAxisHourX(18, 288), 0.01f)
        assertEquals(288f, electricityAxisHourX(24, 288), 0.01f)
    }

    @Test
    fun currentPriceUsesMarkerAsItsAnchorWithoutClippingAtDayEdges() {
        assertEquals(
            ElectricityPriceAlignment.START,
            electricityPriceAlignment(markerX = 0f, textWidthPx = 48f, widthPx = 288),
        )
        assertEquals(
            ElectricityPriceAlignment.CENTER,
            electricityPriceAlignment(markerX = 144f, textWidthPx = 48f, widthPx = 288),
        )
        assertEquals(
            ElectricityPriceAlignment.END,
            electricityPriceAlignment(markerX = 288f, textWidthPx = 48f, widthPx = 288),
        )
    }

    @Test
    fun chartBottomBaselineStaysFixedWhileTheSlotExpandsUpward() {
        assertEquals(7f, electricityPrimaryBottomInsetDp(), 0.01f)
        assertEquals(16f, electricityPlotBaselineInsetDp(), 0.01f)
        assertEquals(34f, electricityPlotBaselineFromTopDp(), 0.01f)
    }

    @Test
    fun currentPriceSitsFullyAboveTheBarArea() {
        assertEquals(
            true,
            electricityPriceFitsAbovePlot(
                fontTopPx = -16f,
                fontBottomPx = 4f,
                plotTopPx = 24f,
            )
        )
        assertEquals(
            18f,
            electricityPriceBaselineAbovePlotPx(
                fontBottomPx = 4f,
                plotTopPx = 24f,
            ),
            0.01f,
        )
    }

    @Test
    fun timeAxisKeepsTheSameBottomInsetInTheExpandedSlot() {
        assertEquals(94f, electricityAxisBaselinePx(), 0.01f)
    }

    @Test
    fun chartBitmapKeepsTwoPixelsPerDisplayDpVertically() {
        assertEquals(
            2f,
            ELECTRICITY_CHART_BITMAP_HEIGHT.toFloat() / ELECTRICITY_CHART_DISPLAY_HEIGHT_DP,
            0.001f,
        )
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
