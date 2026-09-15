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

private val SOLAR_BLOCK_WIDTH = 166.dp

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
                style = TextStyle(color = ColorProvider(muted), fontSize = 8.sp),
            )
            Spacer(GlanceModifier.width(8.dp))
            Text(
                text = section.label,
                style = TextStyle(
                    color = ColorProvider(muted),
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Medium,
                ),
                maxLines = 1,
            )
        }

        section.secondary?.let {
            Spacer(GlanceModifier.height(3.dp))
            Text(
                text = it,
                style = TextStyle(color = ColorProvider(muted), fontSize = 8.sp),
                maxLines = 1,
            )
        }

        Spacer(GlanceModifier.height(3.dp))

        if (solar != null) {
            Row(modifier = GlanceModifier.fillMaxWidth()) {
                Spacer(GlanceModifier.defaultWeight())
                Column(
                    modifier = GlanceModifier.width(SOLAR_BLOCK_WIDTH),
                    horizontalAlignment = Alignment.Horizontal.CenterHorizontally,
                ) {
                    Text(
                        text = solar.daylightLabel,
                        style = TextStyle(color = ColorProvider(muted), fontSize = 8.sp),
                        maxLines = 1,
                    )
                }
            }
            Spacer(GlanceModifier.height(1.dp))
        }

        Row(
            modifier = GlanceModifier.fillMaxWidth(),
            verticalAlignment = Alignment.Vertical.CenterVertically,
        ) {
            Text(
                text = section.primary,
                modifier = GlanceModifier.defaultWeight(),
                style = TextStyle(
                    color = ColorProvider(foreground),
                    fontSize = 25.sp,
                    fontWeight = FontWeight.Medium,
                ),
                maxLines = 1,
            )

            if (solar != null) {
                Spacer(GlanceModifier.width(8.dp))
                WeatherSolarDiskRow(
                    solar = solar,
                    foreground = foreground,
                    muted = muted,
                    line = line,
                    background = background,
                )
            }
        }

        if (now.condition.isNotBlank()) {
            Spacer(GlanceModifier.height(2.dp))
            Text(
                text = now.condition,
                style = TextStyle(color = ColorProvider(muted), fontSize = 9.sp),
                maxLines = 1,
            )
        }
        if (range.isNotBlank()) {
            Spacer(GlanceModifier.height(1.dp))
            Text(
                text = range,
                style = TextStyle(color = ColorProvider(muted), fontSize = 8.sp),
                maxLines = 1,
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
private fun WeatherSolarDiskRow(
    solar: SolarDetail,
    foreground: Color,
    muted: Color,
    line: Color,
    background: Color,
) {
    Column(
        modifier = GlanceModifier.width(SOLAR_BLOCK_WIDTH),
        horizontalAlignment = Alignment.Horizontal.CenterHorizontally,
    ) {
        Row(verticalAlignment = Alignment.Vertical.CenterVertically) {
            Column(
                modifier = GlanceModifier.width(56.dp),
                horizontalAlignment = Alignment.Horizontal.CenterHorizontally,
            ) {
                Text(
                    text = "↑${solar.sunrise}",
                    style = TextStyle(color = ColorProvider(muted), fontSize = 8.sp),
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
                        daylightColor = foreground.toArgb(),
                        nightColor = line.toArgb(),
                        horizonColor = background.toArgb(),
                    )
                ),
                contentDescription = "Daylight and current sun position",
                modifier = GlanceModifier.width(34.dp).height(34.dp),
            )
            Spacer(GlanceModifier.width(4.dp))
            Column(
                modifier = GlanceModifier.width(56.dp),
                horizontalAlignment = Alignment.Horizontal.CenterHorizontally,
            ) {
                Text(
                    text = "↓${solar.sunset}",
                    style = TextStyle(color = ColorProvider(muted), fontSize = 8.sp),
                    maxLines = 1,
                )
            }
        }
    }
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
                    style = TextStyle(color = ColorProvider(muted), fontSize = 7.sp),
                    maxLines = 1,
                )
                Text(
                    text = point.temperature,
                    style = TextStyle(
                        color = ColorProvider(foreground),
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                    ),
                    maxLines = 1,
                )
            }
        }
    }
}
