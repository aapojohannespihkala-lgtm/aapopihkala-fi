package fi.aapopihkala.snapshotwidget

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class WidgetTemporalRefreshTest {
    @Test
    fun refreshTargetsIncludeFutureDeparturesAndMidnightOnly() {
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
                        WidgetItem("125", "08:16", countdownTargetMs = 900_000L),
                        WidgetItem("121", "08:17", countdownTargetMs = 1_060_000L),
                        WidgetItem("125", "08:32", countdownTargetMs = 1_960_000L),
                    )
                )
            )
        )

        val targets = temporalRefreshTargets(payload, now)

        assertFalse(targets.contains(900_000L))
        assertTrue(targets.contains(1_060_000L))
        assertTrue(targets.contains(1_960_000L))
        assertTrue(targets.contains(nextHelsinkiMidnightMs(now)))
    }
}
