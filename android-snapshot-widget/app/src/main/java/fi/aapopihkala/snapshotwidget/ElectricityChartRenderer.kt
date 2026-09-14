package fi.aapopihkala.snapshotwidget

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import java.util.Calendar
import java.util.TimeZone

internal const val ELECTRICITY_CHART_BITMAP_WIDTH = 480
internal const val ELECTRICITY_CHART_BITMAP_HEIGHT = 56
internal const val ELECTRICITY_MARKER_OUTER_STROKE_PX = 6f
internal const val ELECTRICITY_MARKER_INNER_STROKE_PX = 2f

private const val MILLIS_PER_DAY = 24f * 60f * 60f * 1000f
private const val MIN_BAR_HEIGHT_FRACTION = 4f / 28f

internal fun electricityDayFraction(
    epochMs: Long,
    timeZone: TimeZone = TimeZone.getTimeZone("Europe/Helsinki"),
): Float {
    val calendar = Calendar.getInstance(timeZone)
    calendar.timeInMillis = epochMs
    val millisSinceMidnight =
        calendar.get(Calendar.HOUR_OF_DAY) * 60L * 60L * 1000L +
            calendar.get(Calendar.MINUTE) * 60L * 1000L +
            calendar.get(Calendar.SECOND) * 1000L +
            calendar.get(Calendar.MILLISECOND)
    return (millisSinceMidnight / MILLIS_PER_DAY).coerceIn(0f, 0.999999f)
}

internal fun electricityMarkerX(
    dayFraction: Float,
    widthPx: Int,
    outerStrokePx: Float = ELECTRICITY_MARKER_OUTER_STROKE_PX,
): Float {
    if (widthPx <= 0) return 0f
    val halfStroke = (outerStrokePx / 2f).coerceAtLeast(0f)
    val rightLimit = (widthPx.toFloat() - halfStroke).coerceAtLeast(halfStroke)
    val raw = dayFraction.coerceIn(0f, 1f) * widthPx.toFloat()
    return raw.coerceIn(halfStroke, rightLimit)
}

internal fun normalizedElectricityBars(
    values: List<Double>,
    maxBars: Int = 24,
): List<Float> {
    if (maxBars <= 0) return emptyList()
    return values.take(maxBars).map { value ->
        if (value.isFinite()) value.coerceIn(0.0, 1.0).toFloat() else 0f
    }
}

internal fun renderElectricityChartBitmap(
    values: List<Double>,
    epochMs: Long,
    barColor: Int,
    markerOuterColor: Int,
    markerInnerColor: Int,
    widthPx: Int = ELECTRICITY_CHART_BITMAP_WIDTH,
    heightPx: Int = ELECTRICITY_CHART_BITMAP_HEIGHT,
): Bitmap {
    val safeWidth = widthPx.coerceAtLeast(1)
    val safeHeight = heightPx.coerceAtLeast(1)
    val bitmap = Bitmap.createBitmap(safeWidth, safeHeight, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    val bars = normalizedElectricityBars(values)

    if (bars.isNotEmpty()) {
        val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = barColor
            style = Paint.Style.FILL
        }
        val slotWidth = safeWidth.toFloat() / bars.size.toFloat()
        val minimumHeight = safeHeight * MIN_BAR_HEIGHT_FRACTION

        bars.forEachIndexed { index, normalized ->
            val barHeight = minimumHeight + normalized * (safeHeight - minimumHeight)
            val left = index * slotWidth
            val right = if (index == bars.lastIndex) {
                safeWidth.toFloat()
            } else {
                (index + 1) * slotWidth + 0.5f
            }
            canvas.drawRect(left, safeHeight - barHeight, right, safeHeight.toFloat(), paint)
        }
    }

    val markerX = electricityMarkerX(
        dayFraction = electricityDayFraction(epochMs),
        widthPx = safeWidth,
    )
    val outerPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = markerOuterColor
        strokeWidth = ELECTRICITY_MARKER_OUTER_STROKE_PX
        strokeCap = Paint.Cap.BUTT
    }
    val innerPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = markerInnerColor
        strokeWidth = ELECTRICITY_MARKER_INNER_STROKE_PX
        strokeCap = Paint.Cap.BUTT
    }

    canvas.drawLine(markerX, 0f, markerX, safeHeight.toFloat(), outerPaint)
    canvas.drawLine(markerX, 0f, markerX, safeHeight.toFloat(), innerPaint)

    return bitmap
}
