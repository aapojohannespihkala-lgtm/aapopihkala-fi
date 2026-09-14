package fi.aapopihkala.snapshotwidget

import java.time.Instant
import org.junit.Assert.assertEquals
import org.junit.Test

class CountdownDueGuardTest {
    @Test
    fun fallbackClockUsesHelsinkiDepartureTime() {
        val departure = Instant.parse("2026-09-14T08:05:00Z").toEpochMilli()
        assertEquals("11:05", countdownClockLabel(departure))
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
