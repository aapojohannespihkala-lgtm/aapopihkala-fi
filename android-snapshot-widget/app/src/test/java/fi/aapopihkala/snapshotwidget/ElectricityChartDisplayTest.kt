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
    fun currentHourUsesRequestedTimeZone() {
        val seventeenHoursAfterEpoch = 17L * 60L * 60L * 1000L

        assertEquals(
            17,
            electricityCurrentHour(
                epochMs = seventeenHoursAfterEpoch,
                timeZone = TimeZone.getTimeZone("UTC"),
            ),
        )
        assertEquals(
            19,
            electricityCurrentHour(
                epochMs = seventeenHoursAfterEpoch,
                timeZone = TimeZone.getTimeZone("GMT+02:00"),
            ),
        )
    }
}
