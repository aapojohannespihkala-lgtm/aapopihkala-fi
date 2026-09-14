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

@Composable
internal fun LiveHeaderClock(
    color: Color,
    modifier: GlanceModifier = GlanceModifier,
) {
    val context = LocalContext.current
    val remoteViews = RemoteViews(context.packageName, R.layout.widget_live_clock).apply {
        setTextColor(R.id.widget_live_clock, color.toArgb())
        setTextViewTextSize(R.id.widget_live_clock, TypedValue.COMPLEX_UNIT_SP, 19f)
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
    val elapsedNow = SystemClock.elapsedRealtime()
    val base = targetEpochMs?.let {
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
            text = if (targetEpochMs != null && targetEpochMs <= wallNow) "NOW" else fallback,
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
