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
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.width
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import java.util.Calendar
import java.util.TimeZone
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.roundToInt
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

    val daylightLabel: String
        get() {
            val hours = daylightMinutes / 60
            val minutes = daylightMinutes % 60
            return "${hours}H${minutes.toString().padStart(2, '0')}M"
        }

    val compactLabel: String
        get() = "↑$sunrise  ↓$sunset  $daylightLabel"
}

internal data class WeatherForecastPoint(
    val time: String,
    val temperature: String,
)

private val solarDetailPattern = Regex(
    """↑\s*(\d{1,2}:\d{2})\s+↓\s*(\d{1,2}:\d{2})\s+☀?\s*(\d{1,2})H(\d{2})M""",
    RegexOption.IGNORE_CASE
)
private const val WEATHER_FORECAST_PREFIX = "FORECAST "

internal fun parseWeatherForecast(detail: String): List<WeatherForecastPoint> {
    val line = detail.lines()
        .map(String::trim)
        .firstOrNull { it.startsWith(WEATHER_FORECAST_PREFIX) }
        ?: return emptyList()

    return line.removePrefix(WEATHER_FORECAST_PREFIX)
        .split('|')
        .mapNotNull { raw ->
            val separator = raw.indexOf('=')
            if (separator <= 0 || separator >= raw.lastIndex) return@mapNotNull null
            val time = raw.substring(0, separator).trim()
            val temperature = raw.substring(separator + 1).trim()
            if (time.isBlank() || temperature.isBlank()) null
            else WeatherForecastPoint(time = time, temperature = temperature)
        }
        .take(6)
}

internal fun weatherConditionText(detail: String): String =
    detail.lines()
        .map(String::trim)
        .filter(String::isNotEmpty)
        .filterNot { solarDetailPattern.containsMatchIn(it) }
        .filterNot { it.startsWith(WEATHER_FORECAST_PREFIX) }
        .joinToString("\n")

internal fun parseSolarDetail(detail: String): SolarDetail? {
    val lines = detail.lines().map(String::trim).filter(String::isNotEmpty)
    val solarLine = lines.firstOrNull { solarDetailPattern.containsMatchIn(it) } ?: return null
    val match = solarDetailPattern.find(solarLine) ?: return null
    val hours = match.groupValues[3].toIntOrNull() ?: return null
    val minutes = match.groupValues[4].toIntOrNull() ?: return null
    val daylightMinutes = hours * 60 + minutes
    if (daylightMinutes !in 0..24 * 60) return null

    return SolarDetail(
        conditionText = weatherConditionText(detail),
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

private fun blendArgb(
    foreground: Int,
    background: Int,
    foregroundWeight: Float,
): Int {
    val weight = foregroundWeight.coerceIn(0f, 1f)

    fun blendChannel(foregroundChannel: Int, backgroundChannel: Int): Int =
        (backgroundChannel + (foregroundChannel - backgroundChannel) * weight)
            .roundToInt()
            .coerceIn(0, 255)

    return android.graphics.Color.argb(
        blendChannel(android.graphics.Color.alpha(foreground), android.graphics.Color.alpha(background)),
        blendChannel(android.graphics.Color.red(foreground), android.graphics.Color.red(background)),
        blendChannel(android.graphics.Color.green(foreground), android.graphics.Color.green(background)),
        blendChannel(android.graphics.Color.blue(foreground), android.graphics.Color.blue(background)),
    )
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

internal fun sunIsAboveHorizon(sunY: Float, horizonY: Float): Boolean = sunY <= horizonY

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
    val diskDaylightColor = blendArgb(daylightColor, horizonColor, 0.88f)
    val diskNightColor = blendArgb(nightColor, horizonColor, 0.52f)

    paint.style = Paint.Style.FILL
    paint.color = diskNightColor
    canvas.drawCircle(centre, centre, radius, paint)

    val geometryDaylightFraction =
        solarDaylightFraction(sunrise, sunset) ?: daylightFraction.coerceIn(0.0, 1.0)
    val offset = daylightHorizonOffset(geometryDaylightFraction)
    val horizonY = centre - (offset * radius).toFloat()

    canvas.save()
    canvas.clipPath(circle)
    paint.color = diskDaylightColor
    canvas.drawRect(0f, 0f, sizePx.toFloat(), horizonY, paint)
    canvas.restore()

    val halfChord = (radius * sqrt((1.0 - offset * offset).coerceAtLeast(0.0))).toFloat()
    val outlineStrokeWidth = (sizePx * 0.016f).coerceAtLeast(1f)
    val horizonStrokeWidth = (sizePx * 0.010f).coerceAtLeast(1f)

    paint.style = Paint.Style.STROKE
    paint.strokeWidth = outlineStrokeWidth
    paint.color = horizonColor
    canvas.drawCircle(centre, centre, radius, paint)

    val sun = sunPosition(
        sunrise = sunrise,
        sunset = sunset,
        centre = centre,
        diskRadius = radius,
        nowMinute = nowMinute
    )

    if (sun != null) {
        val sunRadius = sizePx * 0.042f
        val sunStrokeWidth = (sizePx * 0.012f).coerceAtLeast(1f)

        if (sunIsAboveHorizon(sun.y, horizonY)) {
            paint.style = Paint.Style.STROKE
            paint.strokeWidth = sunStrokeWidth
            paint.color = blendArgb(nightColor, horizonColor, 0.85f)
            canvas.drawCircle(sun.x, sun.y, sunRadius * 1.16f, paint)

            paint.style = Paint.Style.FILL
            paint.color = sunColor
            canvas.drawCircle(sun.x, sun.y, sunRadius, paint)
        } else {
            paint.style = Paint.Style.STROKE
            paint.strokeWidth = sunStrokeWidth
            paint.color = blendArgb(sunColor, horizonColor, 0.58f)
            canvas.drawCircle(sun.x, sun.y, sunRadius, paint)
        }
    }

    paint.style = Paint.Style.STROKE
    paint.strokeWidth = horizonStrokeWidth
    paint.color = horizonColor
    canvas.drawLine(centre - halfChord, horizonY, centre + halfChord, horizonY, paint)

    return bitmap
}

@Composable
private fun WeatherForecastStrip(
    points: List<WeatherForecastPoint>,
    textColor: Color,
    valueColor: Color,
) {
    Column(
        modifier = GlanceModifier.fillMaxWidth(),
        horizontalAlignment = Alignment.Horizontal.CenterHorizontally,
    ) {
        Row {
            points.take(6).forEach { point ->
                Column(
                    modifier = GlanceModifier.width(40.dp),
                    horizontalAlignment = Alignment.Horizontal.CenterHorizontally,
                ) {
                    Text(
                        text = point.time,
                        style = TextStyle(color = ColorProvider(textColor), fontSize = 7.sp),
                        maxLines = 1,
                    )
                    Text(
                        text = point.temperature,
                        style = TextStyle(
                            color = ColorProvider(valueColor),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                        ),
                        maxLines = 1,
                    )
                }
            }
        }
    }
}

@Composable
private fun SolarTimeline(
    solar: SolarDetail,
    textColor: Color,
    daylightColor: Color,
    nightColor: Color,
    horizonColor: Color,
) {
    Column(
        modifier = GlanceModifier.width(148.dp),
        horizontalAlignment = Alignment.Horizontal.CenterHorizontally,
    ) {
        Text(
            text = solar.daylightLabel,
            style = TextStyle(color = ColorProvider(textColor), fontSize = 8.sp),
            maxLines = 1,
        )
        Spacer(GlanceModifier.height(1.dp))
        Row(verticalAlignment = Alignment.Vertical.CenterVertically) {
            Column(
                modifier = GlanceModifier.width(48.dp),
                horizontalAlignment = Alignment.Horizontal.CenterHorizontally,
            ) {
                Text(
                    text = "↑${solar.sunrise}",
                    style = TextStyle(color = ColorProvider(textColor), fontSize = 8.sp),
                    maxLines = 1,
                )
            }
            Spacer(GlanceModifier.width(4.dp))
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
                modifier = GlanceModifier.width(32.dp).height(32.dp)
            )
            Spacer(GlanceModifier.width(4.dp))
            Column(
                modifier = GlanceModifier.width(48.dp),
                horizontalAlignment = Alignment.Horizontal.CenterHorizontally,
            ) {
                Text(
                    text = "↓${solar.sunset}",
                    style = TextStyle(color = ColorProvider(textColor), fontSize = 8.sp),
                    maxLines = 1,
                )
            }
        }
    }
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
    val forecast = parseWeatherForecast(detail)
    val conditionText = solar?.conditionText ?: weatherConditionText(detail)

    if (solar == null && forecast.isEmpty()) {
        Text(
            text = detail,
            style = TextStyle(color = ColorProvider(textColor), fontSize = fontSizeSp.sp),
            maxLines = 2
        )
        return
    }

    if (forecast.isNotEmpty()) {
        WeatherForecastStrip(
            points = forecast,
            textColor = textColor,
            valueColor = daylightColor,
        )
        Spacer(GlanceModifier.height(3.dp))
    }

    if (solar != null) {
        Row(
            modifier = GlanceModifier.fillMaxWidth(),
            verticalAlignment = Alignment.Vertical.CenterVertically,
        ) {
            if (conditionText.isNotBlank()) {
                Text(
                    text = conditionText,
                    modifier = GlanceModifier.defaultWeight(),
                    style = TextStyle(color = ColorProvider(textColor), fontSize = fontSizeSp.sp),
                    maxLines = 2,
                )
                Spacer(GlanceModifier.width(6.dp))
            }
            SolarTimeline(
                solar = solar,
                textColor = textColor,
                daylightColor = daylightColor,
                nightColor = nightColor,
                horizonColor = horizonColor,
            )
        }
    } else if (conditionText.isNotBlank()) {
        Text(
            text = conditionText,
            style = TextStyle(color = ColorProvider(textColor), fontSize = fontSizeSp.sp),
            maxLines = 2,
        )
    }
}
