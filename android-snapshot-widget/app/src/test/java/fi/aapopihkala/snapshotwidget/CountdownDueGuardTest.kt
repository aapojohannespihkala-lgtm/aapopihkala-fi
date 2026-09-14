package fi.aapopihkala.snapshotwidget

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class CountdownDueGuardTest {
    @Test
    fun finalMinuteUsesStaticDueLabel() {
        assertEquals(
            "DUE",
            countdownStaticOverride(
                resolvedTargetMs = 1_060_000L,
                wallNowMs = 1_000_000L,
            )
        )
    }

    @Test
    fun countdownKeepsTickingBeforeDueWindow() {
        assertNull(
            countdownStaticOverride(
                resolvedTargetMs = 1_060_001L,
                wallNowMs = 1_000_000L,
            )
        )
    }

    @Test
    fun expiredTargetDoesNotUseDueLabel() {
        assertNull(
            countdownStaticOverride(
                resolvedTargetMs = 999_999L,
                wallNowMs = 1_000_000L,
            )
        )
    }
}
