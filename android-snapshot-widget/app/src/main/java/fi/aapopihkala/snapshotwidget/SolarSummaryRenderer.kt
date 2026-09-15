package fi.aapopihkala.snapshotwidget

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF

private const val SOLAR_SUMMARY_WIDTH_PX = 360
private const val SOLAR_SUMMARY_HEIGHT_PX = 132
private const val SOLAR_SUMMARY_DISK_PX = 92

/**
 * Renders the complete daylight summary into one bitmap so Glance text measurement
 * cannot shift the duration, sunrise, disk and sunset independently.
 *
 * The bitmap is intentionally wider than its visible content. The disk remains the
 * shared visual anchor, the duration is centred above it and both times sit on the
 * same baseline at equal distances from the disk.
 */
internal fun renderSolarSummary(
    solar: SolarDetail,
    textColor: Int,
    daylightColor: Int,
    nightColor: Int,
    horizonColor: Int,
    widthPx: Int = SOLAR_SUMMARY_WIDTH_PX,
    heightPx: Int = SOLAR_SUMMARY_HEIGHT_PX,
): Bitmap {
    val bitmap = Bitmap.createBitmap(widthPx, heightPx, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = textColor
        isSubpixelText = true
    }

    val centreX = widthPx * 0.50f
    val diskSize = SOLAR_SUMMARY_DISK_PX.coerceAtMost(heightPx - 4)
    val diskLeft = centreX - diskSize / 2f
    val diskTop = heightPx - diskSize - 2f
    val diskRight = diskLeft + diskSize
    val diskBottom = diskTop + diskSize
    val diskCentreY = (diskTop + diskBottom) / 2f

    textPaint.textAlign = Paint.Align.CENTER
    textPaint.textSize = 23f
    canvas.drawText(solar.daylightLabel, centreX, 25f, textPaint)

    textPaint.textSize = 24f
    val timeBaseline = diskCentreY + 8f

    textPaint.textAlign = Paint.Align.RIGHT
    canvas.drawText(solar.sunrise, diskLeft - 14f, timeBaseline, textPaint)

    textPaint.textAlign = Paint.Align.LEFT
    canvas.drawText(solar.sunset, diskRight + 14f, timeBaseline, textPaint)

    val disk = renderDayNightDisk(
        daylightFraction = solar.daylightFraction,
        sunrise = solar.sunrise,
        sunset = solar.sunset,
        daylightColor = daylightColor,
        nightColor = nightColor,
        horizonColor = horizonColor,
        sizePx = SOLAR_SUMMARY_DISK_PX,
    )

    canvas.drawBitmap(
        disk,
        null,
        RectF(diskLeft, diskTop, diskRight, diskBottom),
        Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG),
    )

    return bitmap
}
