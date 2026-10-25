package fi.aapopihkala.snapshotwidget

import org.junit.Assert.assertEquals
import org.junit.Test

class WidgetFooterLabelsTest {
    @Test
    fun updatedLabelAppendsInstalledVersion() {
        assertEquals("UPDATED 13:15 · 2.10.63", updatedFooterLabel("13:15", "2.10.63"))
    }

    @Test
    fun missingOrBlankVersionKeepsPlainUpdatedLabel() {
        assertEquals("UPDATED 13:15", updatedFooterLabel("13:15", null))
        assertEquals("UPDATED 13:15", updatedFooterLabel("13:15", "  "))
    }

    @Test
    fun buildVersionIsAvailableForTheFooter() {
        assertEquals(BuildConfig.VERSION_NAME, updatedFooterLabel("00:00", BuildConfig.VERSION_NAME).substringAfter(" · "))
    }
}
