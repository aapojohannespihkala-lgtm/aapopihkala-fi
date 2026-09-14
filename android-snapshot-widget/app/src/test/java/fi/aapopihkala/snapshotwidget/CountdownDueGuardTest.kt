package fi.aapopihkala.snapshotwidget

import java.time.Instant
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class CountdownDueGuardTest {
    @Test
    fun fallbackClockUsesHelsinkiDepartureTime() {
        val departure = Instant.parse("2026-09-14T08:05:00Z").toEpochMilli()
        assertEquals("11:05", countdownClockLabel(departure))
    }

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

    @Test
    fun expiredTargetNeverFallsBackToNegativeCountdown() {
        assertEquals(
            "--",
            countdownFallbackText(
                fallback = "1 MIN",
                resolvedTargetMs = 999_999L,
                wallNowMs = 1_000_000L,
            )
        )
    }
}
