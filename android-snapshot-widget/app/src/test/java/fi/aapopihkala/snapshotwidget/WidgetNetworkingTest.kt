package fi.aapopihkala.snapshotwidget

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class WidgetNetworkingTest {
    @Test
    fun retriesTransientTransportAndServerFailures() {
        assertTrue(shouldRetryV2Status("TIMEOUT"))
        assertTrue(shouldRetryV2Status("DNS"))
        assertTrue(shouldRetryV2Status("CONNECT"))
        assertTrue(shouldRetryV2Status("SSL"))
        assertTrue(shouldRetryV2Status("IO"))
        assertTrue(shouldRetryV2Status("HTTP408"))
        assertTrue(shouldRetryV2Status("HTTP429"))
        assertTrue(shouldRetryV2Status("HTTP503"))
    }

    @Test
    fun doesNotRetrySemanticOrPermanentFailures() {
        assertFalse(shouldRetryV2Status("PARSE"))
        assertFalse(shouldRetryV2Status("COMPAT"))
        assertFalse(shouldRetryV2Status("EMPTY"))
        assertFalse(shouldRetryV2Status("SECURITY"))
        assertFalse(shouldRetryV2Status("HTTP403"))
        assertFalse(shouldRetryV2Status("HTTP404"))
    }

    @Test
    fun diagnosticsKeepTheFinalFailureAndRetryMarker() {
        val diagnostics = WidgetFetchDiagnostics(
            v2Status = "TIMEOUT",
            legacyStatus = "DNS",
            v2Retried = true,
        )

        assertEquals("V2 TIMEOUT/R · L DNS", diagnostics.failureLabel())
        assertEquals("LEGACY · V2 TIMEOUT/R", diagnostics.legacyFallbackLabel())
    }
}
