package fi.aapopihkala.snapshotwidget

import android.os.Build
import android.os.SystemClock
import android.util.TypedValue
import android.widget.RemoteViews
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceModifier
import androidx.glance.LocalContext
import androidx.glance.appwidget.AndroidRemoteViews
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone

@Composable
internal fun LiveHeaderClock(
    color: Color,
    modifier: GlanceModifier = GlanceModifier,
) {
    val context = LocalContext.current
    val remoteViews = RemoteViews(context.packageName, R.layout.widget_live_clock).apply {
        setTextColor(R.id.widget_live_clock, color.toArgb())
        setTextColor(R.id.widget_live_date, color.toArgb())
        setTextViewTextSize(R.id.widget_live_clock, TypedValue.COMPLEX_UNIT_SP, 19f)
        setTextViewTextSize(R.id.widget_live_date, TypedValue.COMPLEX_UNIT_SP, 19f)
        setTextViewText(R.id.widget_live_date, currentHeaderDateLabel())
    }
    AndroidRemoteViews(remoteViews = remoteViews, modifier = modifier)
}

@Composable
internal fun LiveCountdownValue(
    targetEpochMs: Long?,
    fallback: String,
    color: Color,
    sizeSp: Int,
    modifier: GlanceModifier = GlanceModifier,
) {
    val context = LocalContext.current
    val wallNow = System.currentTimeMillis()
    val resolvedTarget = targetEpochMs ?: cachedCountdownTargetMs(context = context, fallback = fallback, wallNowMs = wallNow)
    val elapsedNow = SystemClock.elapsedRealtime()
    val base = resolvedTarget?.let {
        countdownElapsedRealtimeBase(
            targetEpochMs = it,
            wallNowMs = wallNow,
            elapsedNowMs = elapsedNow,
        )
    }

    if (base != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
        val remoteViews = RemoteViews(context.packageName, R.layout.widget_live_countdown).apply {
            setChronometer(R.id.widget_live_countdown, base, null, true)
            setChronometerCountDown(R.id.widget_live_countdown, true)
            setTextColor(R.id.widget_live_countdown, color.toArgb())
            setTextViewTextSize(
                R.id.widget_live_countdown,
                TypedValue.COMPLEX_UNIT_SP,
                sizeSp.toFloat(),
            )
        }
        AndroidRemoteViews(remoteViews = remoteViews, modifier = modifier)
    } else {
        Text(
            text = if (resolvedTarget != null && resolvedTarget <= wallNow) "NOW" else fallback,
            modifier = modifier,
            style = TextStyle(
                color = ColorProvider(color),
                fontSize = sizeSp.sp,
                fontWeight = FontWeight.Medium,
            ),
            maxLines = 1,
        )
    }
}

private fun currentHeaderDateLabel(): String {
    val helsinki = TimeZone.getTimeZone("Europe/Helsinki")
    val calendar = Calendar.getInstance(helsinki, Locale.UK).apply {
        firstDayOfWeek = Calendar.MONDAY
        minimalDaysInFirstWeek = 4
    }
    val weekdays = arrayOf("SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT")
    val months = arrayOf("JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC")
    val weekday = weekdays[calendar.get(Calendar.DAY_OF_WEEK) - 1]
    val day = calendar.get(Calendar.DAY_OF_MONTH)
    val month = months[calendar.get(Calendar.MONTH)]
    val week = calendar.get(Calendar.WEEK_OF_YEAR)
    return String.format(Locale.US, "%s %02d %s · W%02d", weekday, day, month, week)
}

private fun cachedCountdownTargetMs(
    context: android.content.Context,
    fallback: String,
    wallNowMs: Long,
): Long? {
    if (!fallback.matches(Regex("^\\d+\\s+MIN$"))) return null
    val section = WidgetRepository(context).loadCached()?.sections?.firstOrNull {
        it.primary == fallback && it.countdownTargetMs == null
    } ?: return null
    val detail = section.detail ?: return null
    return countdownTargetFromClockDetail(detail = detail, wallNowMs = wallNowMs)
}

internal fun countdownTargetFromClockDetail(detail: String, wallNowMs: Long): Long? {
    val match = Regex("^(\\d{2}):(\\d{2})\\s*/").find(detail.trim()) ?: return null
    val hour = match.groupValues[1].toIntOrNull()?.takeIf { it in 0..23 } ?: return null
    val minute = match.groupValues[2].toIntOrNull()?.takeIf { it in 0..59 } ?: return null
    val helsinki = TimeZone.getTimeZone("Europe/Helsinki")
    val now = Calendar.getInstance(helsinki, Locale.UK).apply { timeInMillis = wallNowMs }
    val target = (now.clone() as Calendar).apply {
        set(Calendar.HOUR_OF_DAY, hour)
        set(Calendar.MINUTE, minute)
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
    }

    var targetMs = target.timeInMillis
    if (targetMs < wallNowMs) {
        val crossesMidnight = now.get(Calendar.HOUR_OF_DAY) >= 20 && hour <= 4
        if (crossesMidnight) {
            target.add(Calendar.DAY_OF_MONTH, 1)
            targetMs = target.timeInMillis
        } else if (wallNowMs - targetMs > 20 * 60_000L) {
            return null
        }
    }
    return targetMs
}
