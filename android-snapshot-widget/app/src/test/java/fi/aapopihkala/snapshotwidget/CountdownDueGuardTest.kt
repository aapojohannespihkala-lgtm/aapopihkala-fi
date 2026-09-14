package fi.aapopihkala.snapshotwidget

import java.time.Instant
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class CountdownDueGuardTest {
    @Test
    fun fallbackClockUsesHelsinkiDepartureTime() {
        val departure = Instant.parse("2026-09-14T08:05:00Z").toEpochMilli()
        assertEquals("11:05", countdownClockLabel(departure))
    }

    @Test
    fun countdownUsesMinutesBeforeFinalTwoMinutes() {
        assertFalse(
            countdownUsesLiveSeconds(
                resolvedTargetMs = 1_120_001L,
                wallNowMs = 1_000_000L,
            )
        )
        assertEquals(
            "3 MIN",
            countdownLabel(
                targetEpochMs = 1_120_001L,
                wallNowMs = 1_000_000L,
            )
        )
    }

    @Test
    fun finalTwoMinutesUseLiveSeconds() {
        assertTrue(
            countdownUsesLiveSeconds(
                resolvedTargetMs = 1_120_000L,
                wallNowMs = 1_000_000L,
            )
        )
        assertTrue(
            countdownUsesLiveSeconds(
                resolvedTargetMs = 1_000_001L,
                wallNowMs = 1_000_000L,
            )
        )
    }

    @Test
    fun expiredTargetDoesNotUseLiveSeconds() {
        assertFalse(
            countdownUsesLiveSeconds(
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
