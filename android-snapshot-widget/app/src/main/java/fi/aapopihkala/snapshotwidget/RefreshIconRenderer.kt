package fi.aapopihkala.snapshotwidget

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import kotlin.math.cos
import kotlin.math.sin

internal const val REFRESH_ICON_BITMAP_SIZE_PX = 64
internal const val REFRESH_ICON_SAFE_INSET_PX = 9f

internal fun renderRefreshIconBitmap(
    color: Int,
    sizePx: Int = REFRESH_ICON_BITMAP_SIZE_PX,
): Bitmap {
    val safeSize = sizePx.coerceAtLeast(24)
    val bitmap = Bitmap.createBitmap(safeSize, safeSize, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    val scale = safeSize / REFRESH_ICON_BITMAP_SIZE_PX.toFloat()
    val center = safeSize / 2f
    val radius = 18f * scale
    val strokeWidth = 5f * scale

    val stroke = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        this.color = color
        style = Paint.Style.STROKE
        this.strokeWidth = strokeWidth
        strokeCap = Paint.Cap.ROUND
        strokeJoin = Paint.Join.ROUND
    }

    val bounds = RectF(
        center - radius,
        center - radius,
        center + radius,
        center + radius,
    )
    val startDegrees = 35f
    val sweepDegrees = 285f
    canvas.drawArc(bounds, startDegrees, sweepDegrees, false, stroke)

    val endDegrees = startDegrees + sweepDegrees
    val radians = Math.toRadians(endDegrees.toDouble())
    val tangentX = (-sin(radians)).toFloat()
    val tangentY = cos(radians).toFloat()
    val normalX = -tangentY
    val normalY = tangentX
    val tipX = center + radius * cos(radians).toFloat()
    val tipY = center + radius * sin(radians).toFloat()
    val arrowLength = 9f * scale
    val arrowHalfWidth = 5.5f * scale
    val backX = tipX - tangentX * arrowLength
    val backY = tipY - tangentY * arrowLength

    val arrow = Path().apply {
        moveTo(tipX, tipY)
        lineTo(backX + normalX * arrowHalfWidth, backY + normalY * arrowHalfWidth)
        lineTo(backX - normalX * arrowHalfWidth, backY - normalY * arrowHalfWidth)
        close()
    }
    val fill = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        this.color = color
        style = Paint.Style.FILL
    }
    canvas.drawPath(arrow, fill)

    return bitmap
}
