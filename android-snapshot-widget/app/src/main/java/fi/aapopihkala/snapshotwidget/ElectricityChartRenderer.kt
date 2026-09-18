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
private const val PLOT_TOP_PX = 4f
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

internal fun electricityNaturalBarTopPx(
    normalized: Float,
    plotTopPx: Float = PLOT_TOP_PX,
    plotBottomPx: Float = PLOT_BOTTOM_PX,
): Float {
    val plotHeight = (plotBottomPx - plotTopPx).coerceAtLeast(1f)
    val minimumHeight = plotHeight * MIN_BAR_HEIGHT_FRACTION
    val barHeight = minimumHeight +
        normalized.coerceIn(0f, 1f) * (plotHeight - minimumHeight)
    return plotBottomPx - barHeight
}

internal fun electricityPriceSafeBarTopPx(
    fontTopPx: Float,
    fontBottomPx: Float,
    safeTopPx: Float = CURRENT_PRICE_SAFE_TOP_PX,
    plotGapPx: Float = CURRENT_PRICE_PLOT_GAP_PX,
): Float = safeTopPx + plotGapPx + (fontBottomPx - fontTopPx)

internal fun electricityPriceBaselineAboveBarPx(
    barTopPx: Float,
    fontBottomPx: Float,
    plotGapPx: Float = CURRENT_PRICE_PLOT_GAP_PX,
): Float = barTopPx - plotGapPx - fontBottomPx

internal fun electricityPriceHorizontalBounds(
    markerX: Float,
    textWidthPx: Float,
    widthPx: Int,
    alignment: ElectricityPriceAlignment,
): Pair<Float, Float> {
    val safeWidth = widthPx.coerceAtLeast(1).toFloat()
    val width = textWidthPx.coerceAtLeast(0f)
    val left = when (alignment) {
        ElectricityPriceAlignment.START -> markerX
        ElectricityPriceAlignment.CENTER -> markerX - width / 2f
        ElectricityPriceAlignment.END -> markerX - width
    }
    val right = when (alignment) {
        ElectricityPriceAlignment.START -> markerX + width
        ElectricityPriceAlignment.CENTER -> markerX + width / 2f
        ElectricityPriceAlignment.END -> markerX
    }
    return left.coerceIn(0f, safeWidth) to right.coerceIn(0f, safeWidth)
}

internal fun electricityBarsOverlappingHorizontalRange(
    leftPx: Float,
    rightPx: Float,
    barCount: Int,
    plotLeftPx: Float,
    plotRightPx: Float,
): List<Int> {
    if (barCount <= 0 || plotRightPx <= plotLeftPx) return emptyList()
    val rangeLeft = minOf(leftPx, rightPx)
    val rangeRight = maxOf(leftPx, rightPx)
    val slotWidth = (plotRightPx - plotLeftPx) / barCount.toFloat()
    return (0 until barCount).filter { index ->
        val barLeft = plotLeftPx + index * slotWidth
        val barRight = plotLeftPx + (index + 1) * slotWidth
        barRight > rangeLeft && barLeft < rangeRight
    }
}

internal fun electricityHighestBarTopPx(
    barTops: List<Float>,
    indices: List<Int>,
): Float? = indices.mapNotNull { index -> barTops.getOrNull(index) }.minOrNull()

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
    val plotTop = PLOT_TOP_PX.coerceAtMost(safeHeight.toFloat())
    val plotBottom = PLOT_BOTTOM_PX.coerceIn(plotTop, safeHeight.toFloat())
    val plotHeight = (plotBottom - plotTop).coerceAtLeast(1f)

    val dayFraction = electricityDayFraction(epochMs)
    val markerX = electricityMarkerX(
        dayFraction = dayFraction,
        widthPx = safeWidth,
    )
    val currentBarIndex = electricityCurrentBarIndex(dayFraction, bars.size)
    val price = currentPrice?.takeIf { it.isNotBlank() }
    val pricePaint = price?.let {
        Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = currentPriceColor
            textSize = CURRENT_PRICE_TEXT_SIZE_PX
            typeface = Typeface.create("sans-serif-medium", Typeface.NORMAL)
        }
    }

    val minimumHeight = plotHeight * MIN_BAR_HEIGHT_FRACTION
    val maximumSafeBarTop = plotBottom - minimumHeight
    val naturalBarTops = bars.map { normalized ->
        electricityNaturalBarTopPx(
            normalized = normalized,
            plotTopPx = plotTop,
            plotBottomPx = plotBottom,
        )
    }

    var priceAlignment: ElectricityPriceAlignment? = null
    var priceOverlapIndices: List<Int> = emptyList()
    var priceReferenceTop: Float? = null
    if (price != null && pricePaint != null && bars.isNotEmpty()) {
        while (true) {
            val measuredWidth = pricePaint.measureText(price)
            val alignment = electricityPriceAlignment(
                markerX = markerX,
                textWidthPx = measuredWidth,
                widthPx = safeWidth,
            )
            val (labelLeft, labelRight) = electricityPriceHorizontalBounds(
                markerX = markerX,
                textWidthPx = measuredWidth,
                widthPx = safeWidth,
                alignment = alignment,
            )
            val overlapIndices = electricityBarsOverlappingHorizontalRange(
                leftPx = labelLeft,
                rightPx = labelRight,
                barCount = bars.size,
                plotLeftPx = plotLeft,
                plotRightPx = plotRight,
            )
            val highestNaturalTop = electricityHighestBarTopPx(
                barTops = naturalBarTops,
                indices = overlapIndices,
            ) ?: naturalBarTops.getOrNull(currentBarIndex ?: -1)

            val fontMetrics = pricePaint.fontMetrics
            val baseline = highestNaturalTop?.let { barTop ->
                electricityPriceBaselineAboveBarPx(
                    barTopPx = barTop,
                    fontBottomPx = fontMetrics.bottom,
                )
            } ?: (CURRENT_PRICE_SAFE_TOP_PX - fontMetrics.top)
            val glyphTop = baseline + fontMetrics.top
            priceAlignment = alignment
            priceOverlapIndices = overlapIndices
            priceReferenceTop = highestNaturalTop
            if (
                glyphTop >= CURRENT_PRICE_SAFE_TOP_PX ||
                pricePaint.textSize <= CURRENT_PRICE_MIN_TEXT_SIZE_PX
            ) {
                break
            }
            pricePaint.textSize -= 1f
        }
    }

    val forcedSafeTop = pricePaint?.let {
        electricityPriceSafeBarTopPx(
            fontTopPx = it.fontMetrics.top,
            fontBottomPx = it.fontMetrics.bottom,
        ).coerceAtMost(maximumSafeBarTop)
    }
    val overlapSet = priceOverlapIndices.toSet()
    val needsLocalBarCap = if (pricePaint != null && priceReferenceTop != null) {
        electricityPriceBaselineAboveBarPx(
            barTopPx = priceReferenceTop,
            fontBottomPx = pricePaint.fontMetrics.bottom,
        ) + pricePaint.fontMetrics.top < CURRENT_PRICE_SAFE_TOP_PX
    } else {
        false
    }
    if (needsLocalBarCap) {
        priceReferenceTop = forcedSafeTop
    }

    var currentBarTop: Float? = null
    if (bars.isNotEmpty()) {
        val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = barColor
            style = Paint.Style.FILL
        }
        val slotWidth = (plotRight - plotLeft) / bars.size.toFloat()
        val renderedBarTops = naturalBarTops.mapIndexed { index, naturalTop ->
            if (needsLocalBarCap && forcedSafeTop != null && index in overlapSet) {
                maxOf(naturalTop, forcedSafeTop)
            } else {
                naturalTop
            }
        }

        bars.forEachIndexed { index, _ ->
            val top = renderedBarTops[index]
            val left = plotLeft + index * slotWidth
            val right = if (index == bars.lastIndex) {
                plotRight
            } else {
                plotLeft + (index + 1) * slotWidth + 0.5f
            }
            canvas.drawRect(left, top, right, plotBottom, paint)
            if (index == currentBarIndex) currentBarTop = top
        }
        if (priceOverlapIndices.isNotEmpty()) {
            priceReferenceTop = electricityHighestBarTopPx(
                barTops = renderedBarTops,
                indices = priceOverlapIndices,
            )
        }
    }
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

    val markerTop = currentBarTop ?: plotTop
    canvas.drawLine(markerX, markerTop, markerX, plotBottom, outerPaint)
    canvas.drawLine(markerX, markerTop, markerX, plotBottom, innerPaint)

    if (price != null && pricePaint != null) {
        pricePaint.textAlign = when (priceAlignment ?: ElectricityPriceAlignment.CENTER) {
            ElectricityPriceAlignment.START -> Paint.Align.LEFT
            ElectricityPriceAlignment.CENTER -> Paint.Align.CENTER
            ElectricityPriceAlignment.END -> Paint.Align.RIGHT
        }
        val fontMetrics = pricePaint.fontMetrics
        val priceBaseline = priceReferenceTop?.let { barTop ->
            electricityPriceBaselineAboveBarPx(
                barTopPx = barTop,
                fontBottomPx = fontMetrics.bottom,
            )
        } ?: (CURRENT_PRICE_SAFE_TOP_PX - fontMetrics.top)
        canvas.drawText(price, markerX, priceBaseline, pricePaint)
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
