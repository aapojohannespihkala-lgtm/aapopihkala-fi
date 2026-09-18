package fi.aapopihkala.snapshotwidget

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

private val WEATHER_NOW_WIDTH = 96.dp
private val WEATHER_SOLAR_GAP = 4.dp
private val SOLAR_SUMMARY_WIDTH = 142.dp
private val SOLAR_SUMMARY_HEIGHT = 52.dp

internal data class WeatherNowDetail(
    val condition: String,
    val range: String,
)

internal fun parseWeatherNowDetail(detail: String): WeatherNowDetail {
    val text = weatherConditionText(detail).trim()
    if (text.isBlank()) return WeatherNowDetail(condition = "", range = "")

    val firstLine = text.lineSequence().firstOrNull().orEmpty()
    val parts = firstLine.split(" / ").map(String::trim).filter(String::isNotEmpty)
    return WeatherNowDetail(
        condition = parts.firstOrNull().orEmpty(),
        range = parts.drop(1).joinToString(" / "),
    )
}

internal fun weatherRangeFromRows(rows: List<WidgetItem>): String {
    val low = rows.firstOrNull { it.label.equals("LOW", ignoreCase = true) }?.value
        ?.takeIf(String::isNotBlank)
    val high = rows.firstOrNull { it.label.equals("HIGH", ignoreCase = true) }?.value
        ?.takeIf(String::isNotBlank)
    return listOfNotNull(low, high).joinToString(" / ")
}

internal fun weatherForecastFromColumns(columns: List<WidgetItem>): List<WeatherForecastPoint> =
    columns.mapNotNull { item ->
        val time = item.label.trim()
        val temperature = item.value.trim()
        if (time.isBlank() || temperature.isBlank()) null
        else WeatherForecastPoint(time = time, temperature = temperature)
    }.take(6)

@Composable
internal fun WeatherSectionContent(
    section: WidgetSection,
    foreground: Color,
    muted: Color,
    line: Color,
    background: Color,
) {
    val detail = section.detail.orEmpty()
    val now = parseWeatherNowDetail(detail)
    val solar = parseSolarDetail(detail)
    val range = now.range.ifBlank { weatherRangeFromRows(section.rows) }
    val forecast = parseWeatherForecast(detail).ifEmpty {
        weatherForecastFromColumns(section.columns)
    }

    Column(modifier = GlanceModifier.fillMaxWidth()) {
        Row(modifier = GlanceModifier.fillMaxWidth()) {
            Text(
                text = section.index,
                style = TextStyle(color = ColorProvider(muted), fontSize = WidgetTypography.SUPPORTING.sp),
            )
            Spacer(GlanceModifier.width(8.dp))
            Text(
                text = section.label,
                style = TextStyle(
                    color = ColorProvider(muted),
                    fontSize = WidgetTypography.SECTION_HEADING.sp,
                    fontWeight = FontWeight.Medium,
                ),
                maxLines = 1,
            )
        }

        Spacer(GlanceModifier.height(3.dp))

        if (solar != null) {
            Row(
                modifier = GlanceModifier.fillMaxWidth(),
                verticalAlignment = Alignment.Vertical.Top,
            ) {
                WeatherNowBlock(
                    secondary = section.secondary,
                    primary = section.primary,
                    condition = now.condition,
                    range = range,
                    foreground = foreground,
                    muted = muted,
                    modifier = GlanceModifier.width(WEATHER_NOW_WIDTH),
                )
                Spacer(GlanceModifier.width(WEATHER_SOLAR_GAP))
                WeatherSolarGraphic(
                    solar = solar,
                    foreground = foreground,
                    muted = muted,
                    line = line,
                    background = background,
                )
                Spacer(GlanceModifier.defaultWeight())
            }
        } else {
            WeatherNowBlock(
                secondary = section.secondary,
                primary = section.primary,
                condition = now.condition,
                range = range,
                foreground = foreground,
                muted = muted,
                modifier = GlanceModifier.fillMaxWidth(),
            )
        }

        if (forecast.isNotEmpty()) {
            Spacer(GlanceModifier.height(5.dp))
            WeatherForecastRow(
                points = forecast,
                foreground = foreground,
                muted = muted,
            )
        }
    }
}

@Composable
private fun WeatherNowBlock(
    secondary: String?,
    primary: String,
    condition: String,
    range: String,
    foreground: Color,
    muted: Color,
    modifier: GlanceModifier,
) {
    Column(modifier = modifier) {
        secondary?.takeIf(String::isNotBlank)?.let {
            Text(
                text = it,
                style = TextStyle(color = ColorProvider(muted), fontSize = WidgetTypography.SUPPORTING.sp),
                maxLines = 1,
            )
            Spacer(GlanceModifier.height(4.dp))
        }

        Text(
            text = primary,
            style = TextStyle(
                color = ColorProvider(foreground),
                fontSize = WidgetTypography.PRIMARY_FULL.sp,
                fontWeight = FontWeight.Medium,
            ),
            maxLines = 1,
        )

        if (condition.isNotBlank() || range.isNotBlank()) {
            Spacer(GlanceModifier.height(2.dp))
            Row(verticalAlignment = Alignment.Vertical.CenterVertically) {
                if (condition.isNotBlank()) {
                    Text(
                        text = condition,
                        style = TextStyle(color = ColorProvider(muted), fontSize = WidgetTypography.SUPPORTING_VALUE.sp),
                        maxLines = 1,
                    )
                }
                if (condition.isNotBlank() && range.isNotBlank()) {
                    Spacer(GlanceModifier.width(4.dp))
                }
                if (range.isNotBlank()) {
                    Text(
                        text = range,
                        style = TextStyle(color = ColorProvider(muted), fontSize = WidgetTypography.SUPPORTING.sp),
                        maxLines = 1,
                    )
                }
            }
        }
    }
}

@Composable
private fun WeatherSolarGraphic(
    solar: SolarDetail,
    foreground: Color,
    muted: Color,
    line: Color,
    background: Color,
) {
    Image(
        provider = ImageProvider(
            renderSolarSummary(
                solar = solar,
                textColor = muted.toArgb(),
                daylightColor = foreground.toArgb(),
                nightColor = line.toArgb(),
                horizonColor = background.toArgb(),
            )
        ),
        contentDescription = "Daylight duration, sunrise, sunset and current sun position",
        modifier = GlanceModifier
            .width(SOLAR_SUMMARY_WIDTH)
            .height(SOLAR_SUMMARY_HEIGHT),
    )
}

@Composable
private fun WeatherForecastRow(
    points: List<WeatherForecastPoint>,
    foreground: Color,
    muted: Color,
) {
    Row(modifier = GlanceModifier.fillMaxWidth()) {
        points.take(6).forEach { point ->
            Column(
                modifier = GlanceModifier.defaultWeight(),
                horizontalAlignment = Alignment.Horizontal.CenterHorizontally,
            ) {
                Text(
                    text = point.time,
                    style = TextStyle(color = ColorProvider(muted), fontSize = WidgetTypography.MICRO.sp),
                    maxLines = 1,
                )
                Text(
                    text = point.temperature,
                    style = TextStyle(
                        color = ColorProvider(foreground),
                        fontSize = WidgetTypography.FORECAST_VALUE.sp,
                        fontWeight = FontWeight.Bold,
                    ),
                    maxLines = 1,
                )
            }
        }
    }
}
