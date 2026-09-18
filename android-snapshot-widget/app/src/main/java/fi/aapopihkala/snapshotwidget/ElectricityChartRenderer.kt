package fi.aapopihkala.snapshotwidget

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Typeface
import java.util.Calendar
import java.util.TimeZone

internal const val ELECTRICITY_CHART_BITMAP_WIDTH = 288
internal const val ELECTRICITY_CHART_BITMAP_HEIGHT = 100
internal const val ELECTRICITY_CHART_DISPLAY_HEIGHT_DP = 50
internal const val ELECTRICITY_CHART_HORIZONTAL_PADDING_PX = 0f
internal const val ELECTRICITY_MARKER_OUTER_STROKE_PX = 4f
internal const val ELECTRICITY_MARKER_INNER_STROKE_PX = 1.5f

private const val MILLIS_PER_DAY = 24f * 60f * 60f * 1000f
private const val MIN_BAR_HEIGHT_FRACTION = 4f / 28f
private const val BASE_PLOT_TOP_PX = 4f
private const val PLOT_BOTTOM_PX = 68f
private const val CURRENT_PRICE_TEXT_SIZE_PX = 17f
private const val CURRENT_PRICE_MIN_TEXT_SIZE_PX = 10f
private const val CURRENT_PRICE_SAFE_TOP_PX = 2f
private const val CURRENT_PRICE_PLOT_GAP_PX = 2f
private const val AXIS_TEXT_SIZE_PX = 16f
private const val AXIS_BASELINE_PX = 94f
private const val PRIMARY_BOTTOM_INSET_DP = 7f

internal fun electricityPrimaryBottomInsetDp(): Float = PRIMARY_BOTTOM_INSET_DP

internal fun electricityPlotBaselineInsetDp(): Float =
    ELECTRICITY_CHART_DISPLAY_HEIGHT_DP.toFloat() *
        (ELECTRICITY_CHART_BITMAP_HEIGHT.toFloat() - PLOT_BOTTOM_PX) /
        ELECTRICITY_CHART_BITMAP_HEIGHT.toFloat()

internal fun electricityPlotBaselineFromTopDp(): Float =
    ELECTRICITY_CHART_DISPLAY_HEIGHT_DP.toFloat() *
        PLOT_BOTTOM_PX /
        ELECTRICITY_CHART_BITMAP_HEIGHT.toFloat()

internal fun electricityCurrentBarIndex(
    dayFraction: Float,
    barCount: Int,
): Int? {
    if (barCount <= 0) return null
    return (dayFraction.coerceIn(0f, 0.999999f) * barCount)
        .toInt()
        .coerceIn(0, barCount - 1)
}

internal fun electricityHighestBarIndex(values: List<Float>): Int? {
    if (values.isEmpty()) return null
    val maxValue = values.maxOrNull() ?: return null
    return values.indexOfFirst { it == maxValue }.takeIf { it >= 0 }
}

internal fun electricityBarCenterX(
    index: Int,
    barCount: Int,
    plotLeftPx: Float,
    plotRightPx: Float,
): Float {
    if (barCount <= 0 || plotRightPx <= plotLeftPx) return plotLeftPx
    val safeIndex = index.coerceIn(0, barCount - 1)
    val slotWidth = (plotRightPx - plotLeftPx) / barCount.toFloat()
    return plotLeftPx + (safeIndex + 0.5f) * slotWidth
}

internal fun electricityPriceReservedPlotTopPx(
    fontTopPx: Float,
    fontBottomPx: Float,
    basePlotTopPx: Float = BASE_PLOT_TOP_PX,
    safeTopPx: Float = CURRENT_PRICE_SAFE_TOP_PX,
    plotGapPx: Float = CURRENT_PRICE_PLOT_GAP_PX,
): Float = maxOf(
    basePlotTopPx,
    safeTopPx + plotGapPx + (fontBottomPx - fontTopPx),
)

internal fun electricityNaturalBarTopPx(
    normalized: Float,
    plotTopPx: Float,
    plotBottomPx: Float = PLOT_BOTTOM_PX,
): Float {
    val plotHeight = (plotBottomPx - plotTopPx).coerceAtLeast(1f)
    val minimumHeight = plotHeight * MIN_BAR_HEIGHT_FRACTION
    val barHeight = minimumHeight +
        normalized.coerceIn(0f, 1f) * (plotHeight - minimumHeight)
    return plotBottomPx - barHeight
}

internal fun electricityPriceBaselineAboveBarPx(
    barTopPx: Float,
    fontBottomPx: Float,
    plotGapPx: Float = CURRENT_PRICE_PLOT_GAP_PX,
): Float = barTopPx - plotGapPx - fontBottomPx

internal fun electricityAxisBaselinePx(): Float = AXIS_BASELINE_PX

internal enum class ElectricityPriceAlignment { START, CENTER, END }

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
    horizontalPaddingPx: Float = ELECTRICITY_CHART_HORIZONTAL_PADDING_PX,
): Float {
    if (widthPx <= 0) return 0f
    val safePadding = horizontalPaddingPx.coerceIn(0f, widthPx / 2f)
    val left = safePadding
    val right = widthPx.toFloat() - safePadding
    return left + dayFraction.coerceIn(0f, 1f) * (right - left)
}

internal fun electricityAxisHourX(
    hour: Int,
    widthPx: Int,
    horizontalPaddingPx: Float = ELECTRICITY_CHART_HORIZONTAL_PADDING_PX,
): Float = electricityMarkerX(
    dayFraction = hour.coerceIn(0, 24) / 24f,
    widthPx = widthPx,
    horizontalPaddingPx = horizontalPaddingPx,
)

internal fun electricityPriceAlignment(
    markerX: Float,
    textWidthPx: Float,
    widthPx: Int,
): ElectricityPriceAlignment {
    if (widthPx <= 0) return ElectricityPriceAlignment.CENTER
    val halfText = (textWidthPx / 2f).coerceAtLeast(0f)
    return when {
        markerX - halfText < 0f -> ElectricityPriceAlignment.START
        markerX + halfText > widthPx.toFloat() -> ElectricityPriceAlignment.END
        else -> ElectricityPriceAlignment.CENTER
    }
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
    currentPrice: String?,
    barColor: Int,
    markerOuterColor: Int,
    markerInnerColor: Int,
    currentPriceColor: Int,
    axisLabelColor: Int,
    widthPx: Int = ELECTRICITY_CHART_BITMAP_WIDTH,
    heightPx: Int = ELECTRICITY_CHART_BITMAP_HEIGHT,
): Bitmap {
    val safeWidth = widthPx.coerceAtLeast(1)
    val safeHeight = heightPx.coerceAtLeast(1)
    val bitmap = Bitmap.createBitmap(safeWidth, safeHeight, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    val bars = normalizedElectricityBars(values)
    val plotLeft = ELECTRICITY_CHART_HORIZONTAL_PADDING_PX.coerceAtMost(safeWidth / 2f)
    val plotRight = (safeWidth - ELECTRICITY_CHART_HORIZONTAL_PADDING_PX).coerceAtLeast(plotLeft)
    val plotBottom = PLOT_BOTTOM_PX.coerceAtMost(safeHeight.toFloat())

    val price = currentPrice?.takeIf { it.isNotBlank() }
    val pricePaint = price?.let {
        Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = currentPriceColor
            textSize = CURRENT_PRICE_TEXT_SIZE_PX
            typeface = Typeface.create("sans-serif-medium", Typeface.NORMAL)
        }
    }

    var plotTop = BASE_PLOT_TOP_PX.coerceAtMost(plotBottom)
    if (pricePaint != null) {
        while (pricePaint.textSize > CURRENT_PRICE_MIN_TEXT_SIZE_PX) {
            val reservedTop = electricityPriceReservedPlotTopPx(
                fontTopPx = pricePaint.fontMetrics.top,
                fontBottomPx = pricePaint.fontMetrics.bottom,
            )
            if (reservedTop < plotBottom) {
                plotTop = reservedTop
                break
            }
            pricePaint.textSize -= 1f
        }
        plotTop = electricityPriceReservedPlotTopPx(
            fontTopPx = pricePaint.fontMetrics.top,
            fontBottomPx = pricePaint.fontMetrics.bottom,
        ).coerceAtMost(plotBottom - 1f)
    }

    val barTops = bars.map { normalized ->
        electricityNaturalBarTopPx(
            normalized = normalized,
            plotTopPx = plotTop,
            plotBottomPx = plotBottom,
        )
    }

    if (bars.isNotEmpty()) {
        val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = barColor
            style = Paint.Style.FILL
        }
        val slotWidth = (plotRight - plotLeft) / bars.size.toFloat()
        bars.forEachIndexed { index, _ ->
            val left = plotLeft + index * slotWidth
            val right = if (index == bars.lastIndex) {
                plotRight
            } else {
                plotLeft + (index + 1) * slotWidth + 0.5f
            }
            canvas.drawRect(left, barTops[index], right, plotBottom, paint)
        }
    }

    val dayFraction = electricityDayFraction(epochMs)
    val markerX = electricityMarkerX(
        dayFraction = dayFraction,
        widthPx = safeWidth,
    )
    val currentBarIndex = electricityCurrentBarIndex(dayFraction, bars.size)
    val markerTop = currentBarIndex?.let { barTops.getOrNull(it) } ?: plotTop

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
    canvas.drawLine(markerX, markerTop, markerX, plotBottom, outerPaint)
    canvas.drawLine(markerX, markerTop, markerX, plotBottom, innerPaint)

    if (price != null && pricePaint != null) {
        val peakIndex = electricityHighestBarIndex(bars)
        val peakTop = peakIndex?.let { barTops.getOrNull(it) }
        if (peakIndex != null && peakTop != null) {
            val peakX = electricityBarCenterX(
                index = peakIndex,
                barCount = bars.size,
                plotLeftPx = plotLeft,
                plotRightPx = plotRight,
            )
            pricePaint.textAlign = when (
                electricityPriceAlignment(
                    markerX = peakX,
                    textWidthPx = pricePaint.measureText(price),
                    widthPx = safeWidth,
                )
            ) {
                ElectricityPriceAlignment.START -> Paint.Align.LEFT
                ElectricityPriceAlignment.CENTER -> Paint.Align.CENTER
                ElectricityPriceAlignment.END -> Paint.Align.RIGHT
            }
            val priceBaseline = electricityPriceBaselineAboveBarPx(
                barTopPx = peakTop,
                fontBottomPx = pricePaint.fontMetrics.bottom,
            )
            canvas.drawText(price, peakX, priceBaseline, pricePaint)
        }
    }

    val axisPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = axisLabelColor
        textSize = AXIS_TEXT_SIZE_PX
        typeface = Typeface.create("sans-serif", Typeface.NORMAL)
    }
    listOf(0 to "00", 6 to "06", 12 to "12", 18 to "18", 24 to "24").forEach { (hour, label) ->
        axisPaint.textAlign = when (hour) {
            0 -> Paint.Align.LEFT
            24 -> Paint.Align.RIGHT
            else -> Paint.Align.CENTER
        }
        canvas.drawText(
            label,
            electricityAxisHourX(hour, safeWidth),
            AXIS_BASELINE_PX.coerceAtMost(safeHeight.toFloat()),
            axisPaint,
        )
    }

    return bitmap
}
