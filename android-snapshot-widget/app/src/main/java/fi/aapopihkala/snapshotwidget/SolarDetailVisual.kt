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
import kotlin.math.PI
import kotlin.math.acos
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

/**
 * Returns the horizontal chord offset from the circle centre, normalized by radius.
 * -1 means the horizon is at the bottom edge, +1 at the top edge.
 * The area above the chord equals [daylightFraction] of the whole circle.
 */
internal fun daylightHorizonOffset(daylightFraction: Double): Double {
    val target = daylightFraction.coerceIn(0.0, 1.0)
    if (target <= 0.0) return 1.0
    if (target >= 1.0) return -1.0

    var low = -1.0
    var high = 1.0
    repeat(60) {
        val middle = (low + high) / 2.0
        val root = sqrt((1.0 - middle * middle).coerceAtLeast(0.0))
        val upperFraction = (acos(middle) - middle * root) / PI
        if (upperFraction > target) {
            low = middle
        } else {
            high = middle
        }
    }
    return (low + high) / 2.0
}

internal fun renderDayNightDisk(
    daylightFraction: Double,
    daylightColor: Int,
    nightColor: Int,
    horizonColor: Int,
    sizePx: Int = 96
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

    val offset = daylightHorizonOffset(daylightFraction)
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
                    daylightColor = daylightColor.toArgb(),
                    nightColor = nightColor.toArgb(),
                    horizonColor = horizonColor.toArgb()
                )
            ),
            contentDescription = "Daylight share",
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
