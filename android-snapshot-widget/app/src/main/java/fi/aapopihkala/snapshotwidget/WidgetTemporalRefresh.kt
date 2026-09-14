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
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

private const val ACTION_HSL_ROLLOVER = "fi.aapopihkala.snapshotwidget.action.HSL_ROLLOVER"
private const val EXTRA_TARGET_MS = "snapshot_hsl_target_ms"
private const val HSL_ALARM_REQUEST_CODE = 8104

internal fun nextHslRolloverTarget(payload: WidgetPayload?, wallNowMs: Long): Long? {
    val hsl = payload?.sections?.firstOrNull { it.id == "hsl" } ?: return null
    return buildList {
        hsl.countdownTargetMs?.let(::add)
        hsl.rows.mapNotNullTo(this) { it.countdownTargetMs }
    }
        .filter { it > wallNowMs }
        .minOrNull()
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
        val pendingIntent = rolloverPendingIntent(appContext)
        alarmManager.cancel(pendingIntent)

        val targetMs = nextHslRolloverTarget(payload, System.currentTimeMillis()) ?: return
        pendingIntent.intentSender

        val targetIntent = rolloverPendingIntent(appContext, targetMs)
        try {
            if (canScheduleExact(appContext)) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    targetMs,
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
        alarmManager.cancel(rolloverPendingIntent(context))
    }

    private fun rolloverPendingIntent(context: Context, targetMs: Long? = null): PendingIntent {
        val intent = Intent(context, SnapshotHslRolloverReceiver::class.java)
            .setAction(ACTION_HSL_ROLLOVER)
        targetMs?.let { intent.putExtra(EXTRA_TARGET_MS, it) }
        return PendingIntent.getBroadcast(
            context,
            HSL_ALARM_REQUEST_CODE,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
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
                SnapshotHslRolloverScheduler.schedule(appContext, payload)
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
