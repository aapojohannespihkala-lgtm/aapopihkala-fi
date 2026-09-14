package fi.aapopihkala.snapshotwidget

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.glance.appwidget.updateAll
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

private const val ACTION_ROLLOVER = "fi.aapopihkala.snapshotwidget.action.ROLLOVER"
private const val ROLLOVER_REQUEST_CODE = 4107

internal fun nextCountdownTargetMs(payload: WidgetPayload?, wallNowMs: Long): Long? =
    payload?.sections.orEmpty()
        .asSequence()
        .flatMap { section ->
            sequence {
                section.countdownTargetMs?.let { yield(it) }
                section.rows.forEach { row -> row.countdownTargetMs?.let { yield(it) } }
            }
        }
        .filter { it > wallNowMs }
        .minOrNull()

internal fun exactAlarmAvailable(sdkInt: Int, canScheduleExactAlarms: Boolean): Boolean =
    sdkInt < Build.VERSION_CODES.S || canScheduleExactAlarms

internal object SnapshotRolloverAlarmScheduler {
    fun scheduleNext(context: Context, payload: WidgetPayload?): Boolean {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val pendingIntent = rolloverPendingIntent(context)
        alarmManager.cancel(pendingIntent)

        val now = System.currentTimeMillis()
        val targetMs = nextCountdownTargetMs(payload, now) ?: return false
        val canSchedule = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            alarmManager.canScheduleExactAlarms()
        } else {
            true
        }
        if (!exactAlarmAvailable(Build.VERSION.SDK_INT, canSchedule)) return false

        return runCatching {
            alarmManager.setExactAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                targetMs,
                pendingIntent,
            )
            true
        }.getOrDefault(false)
    }

    fun cancel(context: Context) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        alarmManager.cancel(rolloverPendingIntent(context))
    }

    private fun rolloverPendingIntent(context: Context): PendingIntent {
        val intent = Intent(context, SnapshotRolloverAlarmReceiver::class.java).apply {
            action = ACTION_ROLLOVER
        }
        return PendingIntent.getBroadcast(
            context,
            ROLLOVER_REQUEST_CODE,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }
}

class SnapshotRolloverAlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.action
        if (action != ACTION_ROLLOVER && action != AlarmManager.ACTION_SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED) {
            return
        }

        val applicationContext = context.applicationContext
        val pendingResult = goAsync()
        CoroutineScope(SupervisorJob() + Dispatchers.Default).launch {
            try {
                val repository = WidgetRepository(applicationContext)
                if (action == ACTION_ROLLOVER) {
                    SnapshotWidget().updateAll(applicationContext)
                }
                SnapshotRolloverAlarmScheduler.scheduleNext(
                    applicationContext,
                    repository.loadCached(),
                )
            } finally {
                pendingResult.finish()
            }
        }
    }
}
