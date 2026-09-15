package fi.aapopihkala.snapshotwidget

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF

private const val SOLAR_SUMMARY_WIDTH_PX = 360
private const val SOLAR_SUMMARY_HEIGHT_PX = 132
private const val SOLAR_SUMMARY_DISK_PX = 68
private const val SOLAR_SUMMARY_TEXT_PX = 21f

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
        textSize = SOLAR_SUMMARY_TEXT_PX
    }

    val centreX = widthPx * 0.50f
    val diskSize = SOLAR_SUMMARY_DISK_PX.coerceAtMost(heightPx - 4)
    val diskCentreY = (heightPx * 2f / 3f).coerceIn(
        diskSize / 2f,
        heightPx - diskSize / 2f,
    )
    val diskLeft = centreX - diskSize / 2f
    val diskTop = diskCentreY - diskSize / 2f
    val diskRight = diskLeft + diskSize
    val diskBottom = diskTop + diskSize

    textPaint.textAlign = Paint.Align.CENTER
    canvas.drawText(solar.daylightLabel, centreX, 25f, textPaint)

    val timeBaseline = diskCentreY + 7f

    textPaint.textAlign = Paint.Align.RIGHT
    canvas.drawText(solar.sunrise, diskLeft - 12f, timeBaseline, textPaint)

    textPaint.textAlign = Paint.Align.LEFT
    canvas.drawText(solar.sunset, diskRight + 12f, timeBaseline, textPaint)

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
