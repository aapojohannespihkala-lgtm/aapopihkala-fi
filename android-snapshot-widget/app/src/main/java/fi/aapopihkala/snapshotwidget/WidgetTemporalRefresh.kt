package fi.aapopihkala.snapshotwidget

import android.content.Context
import androidx.glance.appwidget.updateAll
import androidx.work.CoroutineWorker
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import androidx.work.workDataOf
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone
import java.util.concurrent.TimeUnit
import kotlinx.coroutines.delay

private const val INPUT_TARGET_MS = "snapshot_temporal_target_ms"
private const val WORK_PREFIX = "snapshot-widget-temporal"
private const val EARLY_START_MS = 60_000L
private const val POST_TARGET_DELAY_MS = 500L

internal fun nextHelsinkiMidnightMs(wallNowMs: Long): Long {
    val calendar = Calendar.getInstance(TimeZone.getTimeZone("Europe/Helsinki"), Locale.UK).apply {
        timeInMillis = wallNowMs
        add(Calendar.DAY_OF_MONTH, 1)
        set(Calendar.HOUR_OF_DAY, 0)
        set(Calendar.MINUTE, 0)
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
    }
    return calendar.timeInMillis
}

internal fun temporalRefreshTargets(payload: WidgetPayload?, wallNowMs: Long): List<Long> {
    val countdownTargets = payload?.sections.orEmpty().flatMap { section ->
        buildList {
            section.countdownTargetMs?.let(::add)
            section.rows.mapNotNullTo(this) { it.countdownTargetMs }
        }
    }
    return (countdownTargets + nextHelsinkiMidnightMs(wallNowMs))
        .filter { it > wallNowMs }
        .distinct()
        .sorted()
}

class SnapshotTemporalUpdateWorker(
    appContext: Context,
    params: WorkerParameters
) : CoroutineWorker(appContext, params) {
    override suspend fun doWork(): Result {
        val targetMs = inputData.getLong(INPUT_TARGET_MS, -1L)
        if (targetMs <= 0L) return Result.success()

        val waitMs = targetMs + POST_TARGET_DELAY_MS - System.currentTimeMillis()
        if (waitMs > 0L) delay(waitMs)
        SnapshotWidget().updateAll(applicationContext)
        return Result.success()
    }
}

internal object SnapshotTemporalRefreshScheduler {
    fun schedule(context: Context, payload: WidgetPayload?) {
        val now = System.currentTimeMillis()
        val workManager = WorkManager.getInstance(context)
        temporalRefreshTargets(payload, now).forEach { targetMs ->
            val startDelayMs = (targetMs - now - EARLY_START_MS).coerceAtLeast(0L)
            val request = OneTimeWorkRequestBuilder<SnapshotTemporalUpdateWorker>()
                .setInitialDelay(startDelayMs, TimeUnit.MILLISECONDS)
                .setInputData(workDataOf(INPUT_TARGET_MS to targetMs))
                .build()
            workManager.enqueueUniqueWork(
                "$WORK_PREFIX-$targetMs",
                ExistingWorkPolicy.REPLACE,
                request
            )
        }
    }
}
