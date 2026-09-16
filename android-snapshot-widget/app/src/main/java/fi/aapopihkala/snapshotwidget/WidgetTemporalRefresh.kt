package fi.aapopihkala.snapshotwidget

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.glance.appwidget.updateAll
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

private const val ACTION_HSL_ROLLOVER = "fi.aapopihkala.snapshotwidget.action.HSL_ROLLOVER"
private const val ACTION_HSL_NETWORK_REFRESH = "fi.aapopihkala.snapshotwidget.action.HSL_NETWORK_REFRESH"
private const val ACTION_MIDNIGHT_REFRESH = "fi.aapopihkala.snapshotwidget.action.MIDNIGHT_REFRESH"
private const val ACTION_ELECTRICITY_QUARTER_REFRESH = "fi.aapopihkala.snapshotwidget.action.ELECTRICITY_QUARTER_REFRESH"
private const val HSL_ALARM_REQUEST_CODE = 8104
private const val MIDNIGHT_ALARM_REQUEST_CODE = 8105
private const val ELECTRICITY_ALARM_REQUEST_CODE = 8106
private const val HSL_NETWORK_ALARM_REQUEST_CODE = 8107
private const val IMMEDIATE_NETWORK_WORK_NAME = "snapshot-widget-immediate"
private const val ELECTRICITY_QUARTER_MS = 15 * 60_000L
private const val HSL_NETWORK_REFRESH_MS = 4 * 60_000L
private const val HSL_NETWORK_RETRY_MS = 5 * 60_000L

internal fun nextHslRolloverTarget(payload: WidgetPayload?, wallNowMs: Long): Long? {
    val hsl = payload?.sections?.firstOrNull { it.id == "hsl" } ?: return null
    return buildList {
        hsl.countdownTargetMs?.let(::add)
        hsl.rows.mapNotNullTo(this) { it.countdownTargetMs }
    }
        .filter { it > wallNowMs }
        .minOrNull()
}

internal fun nextHslDisplayAlarmTime(targetMs: Long, wallNowMs: Long): Long {
    val remainingMs = targetMs - wallNowMs
    if (remainingMs <= 0L || remainingMs <= COUNTDOWN_SECONDS_WINDOW_MS) return targetMs

    val displayedMinutes = (remainingMs + 59_999L) / 60_000L
    val nextBoundaryMs = targetMs - (displayedMinutes - 1L) * 60_000L
    return nextBoundaryMs.coerceAtLeast(wallNowMs + 1L)
}

internal fun nextHslNetworkRefreshMs(payload: WidgetPayload?, wallNowMs: Long): Long {
    val hsl = payload?.sections?.firstOrNull { it.id == "hsl" }
    val sourceMs = if (hsl == null) {
        null
    } else {
        sequenceOf(hsl.observedAt, hsl.fetchedAt, payload.generatedAt)
            .filterNotNull()
            .mapNotNull(::parseWidgetGeneratedAtMs)
            .firstOrNull()
    }
    val targetMs = sourceMs?.plus(HSL_NETWORK_REFRESH_MS)
    return targetMs?.takeIf { it > wallNowMs } ?: (wallNowMs + HSL_NETWORK_RETRY_MS)
}

internal fun nextElectricityQuarterRefreshMs(wallNowMs: Long): Long =
    (Math.floorDiv(wallNowMs, ELECTRICITY_QUARTER_MS) + 1L) * ELECTRICITY_QUARTER_MS

internal fun nextHelsinkiMidnightMs(wallNowMs: Long): Long {
    val calendar = Calendar.getInstance(TimeZone.getTimeZone("Europe/Helsinki"), Locale.UK).apply {
        timeInMillis = wallNowMs
        add(Calendar.DAY_OF_MONTH, 1)
        set(Calendar.HOUR_OF_DAY, 0)
        set(Calendar.MINUTE, 0)
        set(Calendar.SECOND, 1)
        set(Calendar.MILLISECOND, 0)
    }
    return calendar.timeInMillis
}

internal object SnapshotHslRolloverScheduler {
    fun canScheduleExact(context: Context): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true
        val alarmManager = context.getSystemService(AlarmManager::class.java) ?: return false
        return alarmManager.canScheduleExactAlarms()
    }

    fun schedule(context: Context, payload: WidgetPayload?) {
        val appContext = context.applicationContext
        val alarmManager = appContext.getSystemService(AlarmManager::class.java) ?: return
        alarmManager.cancel(hslPendingIntent(appContext))

        val wallNowMs = System.currentTimeMillis()
        val targetMs = nextHslRolloverTarget(payload, wallNowMs) ?: return
        val targetIntent = hslPendingIntent(appContext)
        val exactRolloverAvailable = canScheduleExact(appContext)
        val alarmAtMs = if (exactRolloverAvailable) {
            nextHslDisplayAlarmTime(targetMs, wallNowMs)
        } else {
            targetMs
        }

        try {
            if (exactRolloverAvailable) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    alarmAtMs,
                    targetIntent,
                )
            } else {
                alarmManager.setAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    targetMs,
                    targetIntent,
                )
            }
        } catch (_: SecurityException) {
            alarmManager.setAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                targetMs,
                targetIntent,
            )
        }
    }

    fun cancel(context: Context) {
        val alarmManager = context.getSystemService(AlarmManager::class.java) ?: return
        alarmManager.cancel(hslPendingIntent(context))
    }

    private fun hslPendingIntent(context: Context): PendingIntent = PendingIntent.getBroadcast(
        context,
        HSL_ALARM_REQUEST_CODE,
        Intent(context, SnapshotHslRolloverReceiver::class.java).setAction(ACTION_HSL_ROLLOVER),
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
}

internal object SnapshotHslNetworkRefreshScheduler {
    fun schedule(context: Context, payload: WidgetPayload?) {
        val appContext = context.applicationContext
        val alarmManager = appContext.getSystemService(AlarmManager::class.java) ?: return
        val pendingIntent = hslNetworkPendingIntent(appContext)
        alarmManager.cancel(pendingIntent)
        val targetMs = nextHslNetworkRefreshMs(payload, System.currentTimeMillis())

        try {
            if (SnapshotHslRolloverScheduler.canScheduleExact(appContext)) {
                alarmManager.setExact(
                    AlarmManager.RTC,
                    targetMs,
                    pendingIntent,
                )
            } else {
                alarmManager.set(
                    AlarmManager.RTC,
                    targetMs,
                    pendingIntent,
                )
            }
        } catch (_: SecurityException) {
            alarmManager.set(
                AlarmManager.RTC,
                targetMs,
                pendingIntent,
            )
        }
    }

    fun cancel(context: Context) {
        val alarmManager = context.getSystemService(AlarmManager::class.java) ?: return
        alarmManager.cancel(hslNetworkPendingIntent(context))
    }

    private fun hslNetworkPendingIntent(context: Context): PendingIntent = PendingIntent.getBroadcast(
        context,
        HSL_NETWORK_ALARM_REQUEST_CODE,
        Intent(context, SnapshotHslRolloverReceiver::class.java).setAction(ACTION_HSL_NETWORK_REFRESH),
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
}

internal object SnapshotElectricityRefreshScheduler {
    fun schedule(context: Context) {
        val appContext = context.applicationContext
        val alarmManager = appContext.getSystemService(AlarmManager::class.java) ?: return
        val pendingIntent = electricityPendingIntent(appContext)
        alarmManager.cancel(pendingIntent)
        val targetMs = nextElectricityQuarterRefreshMs(System.currentTimeMillis())

        try {
            if (SnapshotHslRolloverScheduler.canScheduleExact(appContext)) {
                alarmManager.setExact(
                    AlarmManager.RTC,
                    targetMs,
                    pendingIntent,
                )
            } else {
                alarmManager.set(
                    AlarmManager.RTC,
                    targetMs,
                    pendingIntent,
                )
            }
        } catch (_: SecurityException) {
            alarmManager.set(
                AlarmManager.RTC,
                targetMs,
                pendingIntent,
            )
        }
    }

    fun cancel(context: Context) {
        val alarmManager = context.getSystemService(AlarmManager::class.java) ?: return
        alarmManager.cancel(electricityPendingIntent(context))
    }

    private fun electricityPendingIntent(context: Context): PendingIntent = PendingIntent.getBroadcast(
        context,
        ELECTRICITY_ALARM_REQUEST_CODE,
        Intent(context, SnapshotHslRolloverReceiver::class.java).setAction(ACTION_ELECTRICITY_QUARTER_REFRESH),
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
}

private object SnapshotMidnightRefreshScheduler {
    fun schedule(context: Context) {
        val appContext = context.applicationContext
        val alarmManager = appContext.getSystemService(AlarmManager::class.java) ?: return
        val pendingIntent = PendingIntent.getBroadcast(
            appContext,
            MIDNIGHT_ALARM_REQUEST_CODE,
            Intent(appContext, SnapshotHslRolloverReceiver::class.java).setAction(ACTION_MIDNIGHT_REFRESH),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        alarmManager.cancel(pendingIntent)
        alarmManager.setAndAllowWhileIdle(
            AlarmManager.RTC_WAKEUP,
            nextHelsinkiMidnightMs(System.currentTimeMillis()),
            pendingIntent,
        )
    }
}

private fun enqueueScheduledNetworkRefresh(context: Context) {
    val constraints = Constraints.Builder()
        .setRequiredNetworkType(NetworkType.CONNECTED)
        .build()
    val request = OneTimeWorkRequestBuilder<SnapshotUpdateWorker>()
        .setConstraints(constraints)
        .build()
    WorkManager.getInstance(context).enqueueUniqueWork(
        IMMEDIATE_NETWORK_WORK_NAME,
        ExistingWorkPolicy.KEEP,
        request,
    )
}

// Keep the repository call-site stable while local temporal updates move away
// from WorkManager. WorkManager remains responsible for network refreshes only.
internal object SnapshotTemporalRefreshScheduler {
    fun schedule(context: Context, payload: WidgetPayload?) {
        SnapshotHslRolloverScheduler.schedule(context, payload)
        SnapshotHslNetworkRefreshScheduler.schedule(context, payload)
        SnapshotElectricityRefreshScheduler.schedule(context)
        SnapshotMidnightRefreshScheduler.schedule(context)
    }
}

// Compatibility shim for one-time temporal WorkManager jobs that may still be
// queued from 2.9.x when the APK is upgraded. New code never enqueues this worker.
class SnapshotTemporalUpdateWorker(
    appContext: Context,
    params: WorkerParameters,
) : CoroutineWorker(appContext, params) {
    override suspend fun doWork(): Result {
        val payload = WidgetRepository(applicationContext).loadCached()
        SnapshotWidget().updateAll(applicationContext)
        SnapshotTemporalRefreshScheduler.schedule(applicationContext, payload)
        return Result.success()
    }
}

class SnapshotHslRolloverReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val pendingResult = goAsync()
        val appContext = context.applicationContext
        CoroutineScope(SupervisorJob() + Dispatchers.Default).launch {
            try {
                if (!hasSnapshotWidgets(appContext)) {
                    SnapshotHslRolloverScheduler.cancel(appContext)
                    SnapshotHslNetworkRefreshScheduler.cancel(appContext)
                    SnapshotElectricityRefreshScheduler.cancel(appContext)
                    return@launch
                }

                if (intent.action == ACTION_ELECTRICITY_QUARTER_REFRESH) {
                    SnapshotElectricityRefreshScheduler.schedule(appContext)
                    enqueueScheduledNetworkRefresh(appContext)
                    return@launch
                }

                if (intent.action == ACTION_HSL_NETWORK_REFRESH) {
                    val payload = WidgetRepository(appContext).loadCached()
                    SnapshotHslNetworkRefreshScheduler.schedule(appContext, payload)
                    enqueueScheduledNetworkRefresh(appContext)
                    return@launch
                }

                val payload = WidgetRepository(appContext).loadCached()
                SnapshotWidget().updateAll(appContext)
                SnapshotTemporalRefreshScheduler.schedule(appContext, payload)
            } finally {
                pendingResult.finish()
            }
        }
    }
}

private fun hasSnapshotWidgets(context: Context): Boolean {
    val manager = AppWidgetManager.getInstance(context)
    val component = ComponentName(context, SnapshotWidgetReceiver::class.java)
    return manager.getAppWidgetIds(component).isNotEmpty()
}
