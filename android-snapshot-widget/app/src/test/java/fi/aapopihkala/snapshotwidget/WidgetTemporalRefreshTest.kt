package fi.aapopihkala.snapshotwidget

import org.junit.Assert.assertEquals
import org.junit.Test

class WidgetTemporalRefreshTest {
    @Test
    fun rolloverChoosesFirstFutureDepartureRegardlessOfLiveTone() {
        val now = 1_000_000L
        val payload = WidgetPayload(
            schemaVersion = 2,
            minEngineVersion = 2,
            channel = "prod",
            generatedAt = "",
            refreshMinutes = 15,
            title = "CURRENT / SNAPSHOT",
            pageUrl = SnapshotEndpoints.PAGE_URL,
            theme = WidgetTheme.default(),
            layouts = WidgetLayouts.default(),
            sections = listOf(
                WidgetSection(
                    id = "hsl",
                    index = "04",
                    label = "HSL",
                    primary = "1 MIN",
                    countdownTargetMs = 900_000L,
                    rows = listOf(
                        WidgetItem("125", "08:16", tone = "accent", countdownTargetMs = 900_000L),
                        WidgetItem("121", "08:17", tone = "neutral", countdownTargetMs = 1_060_000L),
                        WidgetItem("125", "08:32", tone = "accent", countdownTargetMs = 1_960_000L),
                    )
                )
            )
        )

        assertEquals(1_060_000L, nextHslRolloverTarget(payload, now))
    }

    @Test
    fun exactRefreshSchedulesNextDisplayedMinuteBoundary() {
        assertEquals(
            1_060_000L,
            nextHslDisplayAlarmTime(
                targetMs = 1_360_000L,
                wallNowMs = 1_000_000L,
            )
        )
    }

    @Test
    fun exactRefreshSwitchesToSecondsAtTwoMinutes() {
        assertEquals(
            1_000_001L,
            nextHslDisplayAlarmTime(
                targetMs = 1_120_001L,
                wallNowMs = 1_000_000L,
            )
        )
    }

    @Test
    fun secondsWindowSchedulesDepartureRollover() {
        assertEquals(
            1_120_000L,
            nextHslDisplayAlarmTime(
                targetMs = 1_120_000L,
                wallNowMs = 1_000_000L,
            )
        )
    }

    @Test
    fun electricityRefreshTargetsNextQuarterBoundary() {
        val quarter = 15 * 60_000L
        val now = 10 * quarter + 7 * 60_000L

        assertEquals(11 * quarter, nextElectricityQuarterRefreshMs(now))
    }

    @Test
    fun electricityRefreshDoesNotRepeatCurrentQuarterBoundary() {
        val quarter = 15 * 60_000L
        val now = 10 * quarter

        assertEquals(11 * quarter, nextElectricityQuarterRefreshMs(now))
    }

    @Test
    fun rolloverReturnsNullWhenNoFutureDepartureRemains() {
        val now = 2_000_000L
        val payload = WidgetPayload(
            schemaVersion = 2,
            minEngineVersion = 2,
            channel = "prod",
            generatedAt = "",
            refreshMinutes = 15,
            title = "CURRENT / SNAPSHOT",
            pageUrl = SnapshotEndpoints.PAGE_URL,
            theme = WidgetTheme.default(),
            layouts = WidgetLayouts.default(),
            sections = listOf(
                WidgetSection(
                    id = "hsl",
                    index = "04",
                    label = "HSL",
                    primary = "--",
                    rows = listOf(
                        WidgetItem("125", "08:16", countdownTargetMs = 900_000L),
                        WidgetItem("121", "08:17", countdownTargetMs = 1_060_000L),
                    )
                )
            )
        )

        assertEquals(null, nextHslRolloverTarget(payload, now))
    }
}
