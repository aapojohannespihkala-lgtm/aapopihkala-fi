package fi.aapopihkala.snapshotwidget

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Path
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceModifier
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.layout.Alignment
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.height
import androidx.glance.layout.width
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import java.util.Calendar
import java.util.TimeZone
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt

internal data class SolarDetail(
    val conditionText: String,
    val sunrise: String,
    val sunset: String,
    val daylightMinutes: Int
) {
    val daylightFraction: Double
        get() = (daylightMinutes / (24.0 * 60.0)).coerceIn(0.0, 1.0)

    val compactLabel: String
        get() {
            val hours = daylightMinutes / 60
            val minutes = daylightMinutes % 60
            return "↑$sunrise  ↓$sunset  ${hours}H${minutes.toString().padStart(2, '0')}M"
        }
}

private val solarDetailPattern = Regex(
    """↑\s*(\d{1,2}:\d{2})\s+↓\s*(\d{1,2}:\d{2})\s+☀?\s*(\d{1,2})H(\d{2})M""",
    RegexOption.IGNORE_CASE
)

internal fun parseSolarDetail(detail: String): SolarDetail? {
    val lines = detail.lines().map(String::trim).filter(String::isNotEmpty)
    val solarLine = lines.firstOrNull { solarDetailPattern.containsMatchIn(it) } ?: return null
    val match = solarDetailPattern.find(solarLine) ?: return null
    val hours = match.groupValues[3].toIntOrNull() ?: return null
    val minutes = match.groupValues[4].toIntOrNull() ?: return null
    val daylightMinutes = hours * 60 + minutes
    if (daylightMinutes !in 0..24 * 60) return null

    return SolarDetail(
        conditionText = lines.filterNot { it == solarLine }.joinToString("\n"),
        sunrise = match.groupValues[1],
        sunset = match.groupValues[2],
        daylightMinutes = daylightMinutes
    )
}

private fun clockMinutes(value: String): Double? {
    val parts = value.split(':')
    if (parts.size != 2) return null

    val hour = parts[0].toIntOrNull() ?: return null
    val minute = parts[1].toIntOrNull() ?: return null
    if (hour !in 0..23 || minute !in 0..59) return null

    return hour * 60.0 + minute
}

private fun forwardMinutes(from: Double, to: Double): Double {
    var delta = to - from
    while (delta < 0.0) delta += 24.0 * 60.0
    while (delta >= 24.0 * 60.0) delta -= 24.0 * 60.0
    return delta
}

private fun currentHelsinkiMinute(): Double {
    val calendar = Calendar.getInstance(TimeZone.getTimeZone("Europe/Helsinki"))
    return calendar.get(Calendar.HOUR_OF_DAY) * 60.0 +
        calendar.get(Calendar.MINUTE) +
        calendar.get(Calendar.SECOND) / 60.0
}

internal fun solarDaylightFraction(
    sunrise: String,
    sunset: String
): Double? {
    val rise = clockMinutes(sunrise) ?: return null
    val set = clockMinutes(sunset) ?: return null
    return (forwardMinutes(rise, set) / (24.0 * 60.0)).coerceIn(0.0, 1.0)
}

internal fun solarNoonMinute(
    sunrise: String,
    sunset: String
): Double? {
    val rise = clockMinutes(sunrise) ?: return null
    val set = clockMinutes(sunset) ?: return null
    val daylight = forwardMinutes(rise, set)
    return (rise + daylight / 2.0) % (24.0 * 60.0)
}

/**
 * Horizontal horizon offset from the circle centre, normalized by radius.
 *
 * +1 = top edge
 *  0 = centre
 * -1 = bottom edge
 *
 * The horizon is chosen so that a sun moving uniformly on the outer
 * circumference crosses it exactly at sunrise and sunset.
 */
internal fun daylightHorizonOffset(daylightFraction: Double): Double {
    val p = daylightFraction.coerceIn(0.0, 1.0)
    return cos(PI * p)
}

internal data class SunPosition(
    val x: Float,
    val y: Float
)

/**
 * Uniform 24-hour circular sun path on the disk circumference.
 *
 * Solar noon     = top
 * + 6 hours      = right
 * + 12 hours     = bottom
 * + 18 hours     = left
 */
internal fun sunPosition(
    sunrise: String,
    sunset: String,
    centre: Float,
    diskRadius: Float,
    nowMinute: Double = currentHelsinkiMinute()
): SunPosition? {
    val noon = solarNoonMinute(sunrise, sunset) ?: return null
    val elapsed = forwardMinutes(noon, nowMinute)
    val angle = 2.0 * PI * elapsed / (24.0 * 60.0)

    return SunPosition(
        x = centre + diskRadius * sin(angle).toFloat(),
        y = centre - diskRadius * cos(angle).toFloat()
    )
}

internal fun renderDayNightDisk(
    daylightFraction: Double,
    sunrise: String,
    sunset: String,
    daylightColor: Int,
    nightColor: Int,
    horizonColor: Int,
    sunColor: Int = daylightColor,
    sizePx: Int = 96,
    nowMinute: Double = currentHelsinkiMinute()
): Bitmap {
    val bitmap = Bitmap.createBitmap(sizePx, sizePx, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    val centre = sizePx / 2f
    val radius = sizePx * 0.42f
    val circle = Path().apply { addCircle(centre, centre, radius, Path.Direction.CW) }

    paint.style = Paint.Style.FILL
    paint.color = nightColor
    canvas.drawCircle(centre, centre, radius, paint)

    // Use the same sunrise/sunset pair for both the horizon and the moving sun.
    // This guarantees that the marker is exactly on the horizon at those times.
    val geometryDaylightFraction =
        solarDaylightFraction(sunrise, sunset) ?: daylightFraction.coerceIn(0.0, 1.0)
    val offset = daylightHorizonOffset(geometryDaylightFraction)
    val horizonY = centre - (offset * radius).toFloat()

    canvas.save()
    canvas.clipPath(circle)
    paint.color = daylightColor
    canvas.drawRect(0f, 0f, sizePx.toFloat(), horizonY, paint)
    canvas.restore()

    val halfChord = (radius * sqrt((1.0 - offset * offset).coerceAtLeast(0.0))).toFloat()
    paint.style = Paint.Style.STROKE
    paint.strokeWidth = sizePx * 0.025f
    paint.color = horizonColor
    canvas.drawLine(centre - halfChord, horizonY, centre + halfChord, horizonY, paint)
    canvas.drawCircle(centre, centre, radius, paint)

    val sun = sunPosition(
        sunrise = sunrise,
        sunset = sunset,
        centre = centre,
        diskRadius = radius,
        nowMinute = nowMinute
    )

    if (sun != null) {
        val sunRadius = sizePx * 0.045f

        // Dark ring keeps the marker readable on both the day and night fills.
        paint.style = Paint.Style.FILL
        paint.color = horizonColor
        canvas.drawCircle(sun.x, sun.y, sunRadius * 1.35f, paint)

        paint.color = sunColor
        canvas.drawCircle(sun.x, sun.y, sunRadius, paint)
    }

    return bitmap
}

@Composable
internal fun SolarAwareDetail(
    detail: String,
    textColor: Color,
    daylightColor: Color,
    nightColor: Color,
    horizonColor: Color,
    fontSizeSp: Int
) {
    val solar = parseSolarDetail(detail)
    if (solar == null) {
        Text(
            text = detail,
            style = TextStyle(color = ColorProvider(textColor), fontSize = fontSizeSp.sp),
            maxLines = 2
        )
        return
    }

    if (solar.conditionText.isNotBlank()) {
        Text(
            text = solar.conditionText,
            style = TextStyle(color = ColorProvider(textColor), fontSize = fontSizeSp.sp),
            maxLines = 1
        )
        Spacer(GlanceModifier.height(3.dp))
    }

    Row(verticalAlignment = Alignment.Vertical.CenterVertically) {
        Image(
            provider = ImageProvider(
                renderDayNightDisk(
                    daylightFraction = solar.daylightFraction,
                    sunrise = solar.sunrise,
                    sunset = solar.sunset,
                    daylightColor = daylightColor.toArgb(),
                    nightColor = nightColor.toArgb(),
                    horizonColor = horizonColor.toArgb()
                )
            ),
            contentDescription = "Daylight and current sun position",
            modifier = GlanceModifier.width(28.dp).height(28.dp)
        )
        Spacer(GlanceModifier.width(6.dp))
        Text(
            text = solar.compactLabel,
            style = TextStyle(color = ColorProvider(textColor), fontSize = fontSizeSp.sp),
            maxLines = 1
        )
    }
}
