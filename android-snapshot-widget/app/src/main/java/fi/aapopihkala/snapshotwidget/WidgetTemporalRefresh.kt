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
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

private const val ACTION_HSL_ROLLOVER = "fi.aapopihkala.snapshotwidget.action.HSL_ROLLOVER"
private const val ACTION_MIDNIGHT_REFRESH = "fi.aapopihkala.snapshotwidget.action.MIDNIGHT_REFRESH"
private const val HSL_ALARM_REQUEST_CODE = 8104
private const val MIDNIGHT_ALARM_REQUEST_CODE = 8105

internal fun nextHslRolloverTarget(payload: WidgetPayload?, wallNowMs: Long): Long? {
    val hsl = payload?.sections?.firstOrNull { it.id == "hsl" } ?: return null
    return buildList {
        hsl.countdownTargetMs?.let(::add)
        hsl.rows.mapNotNullTo(this) { it.countdownTargetMs }
    }
        .filter { it > wallNowMs }
        .minOrNull()
}

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

        val targetMs = nextHslRolloverTarget(payload, System.currentTimeMillis()) ?: return
        val targetIntent = hslPendingIntent(appContext)
        try {
            if (canScheduleExact(appContext)) {
                // This is display-state UI: do not wake a sleeping device merely to redraw
                // a home-screen widget. While the device is awake, setExact rolls the cached
                // HSL section at the departure boundary. If the device sleeps across the
                // target, Android delivers the overdue alarm after wake and the resolver
                // jumps straight to the first still-future departure.
                alarmManager.setExact(
                    AlarmManager.RTC,
                    targetMs,
                    targetIntent,
                )
            } else {
                alarmManager.set(
                    AlarmManager.RTC,
                    targetMs,
                    targetIntent,
                )
            }
        } catch (_: SecurityException) {
            alarmManager.set(
                AlarmManager.RTC,
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

// Keep the repository call-site stable while local temporal updates move away
// from WorkManager. WorkManager remains responsible for network refreshes only.
internal object SnapshotTemporalRefreshScheduler {
    fun schedule(context: Context, payload: WidgetPayload?) {
        SnapshotHslRolloverScheduler.schedule(context, payload)
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
