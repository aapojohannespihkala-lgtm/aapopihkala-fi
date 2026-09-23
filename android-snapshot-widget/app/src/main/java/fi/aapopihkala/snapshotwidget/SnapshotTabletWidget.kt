package fi.aapopihkala.snapshotwidget

import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.LocalSize
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.action.actionRunCallback
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.appwidget.appWidgetBackground
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.ContentScale
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.width
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider

private object TabletTypography {
    const val SECTION_HEADING = 13
    const val PRIMARY = 34
    const val UNIT = 18
    const val HEADER = 34
    const val HEADER_SECONDS = 18
    const val HEADER_META = 28
    const val SUPPORTING_VALUE = 14
    const val SUPPORTING = 12
    const val MICRO = 10
    const val FORECAST_VALUE = 15
    const val STATUS_PRIMARY = 25
}

class SnapshotTabletWidget : GlanceAppWidget() {
    override val sizeMode: SizeMode = SizeMode.Exact

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val repository = WidgetRepository(context)
        val payload = repository.loadCached()
        val status = repository.status()
        val diagnostics = repository.diagnostics()
        provideContent { TabletSnapshotContent(payload, status, diagnostics) }
    }
}

@Composable
private fun TabletSnapshotContent(
    payload: WidgetPayload?,
    status: String,
    diagnostics: WidgetFetchDiagnostics,
) {
    val size = LocalSize.current
    val colors = palette(payload?.theme ?: WidgetTheme.default())
    val outerPadding = if (size.width >= 500.dp) 22.dp else 18.dp

    Column(
        modifier = GlanceModifier
            .fillMaxSize()
            .background(colors.background)
            .cornerRadius(22.dp)
            .appWidgetBackground()
            .padding(outerPadding)
    ) {
        TabletHeader(payload, colors)
        Spacer(GlanceModifier.height(12.dp))

        if (payload == null || payload.sections.isEmpty()) {
            TabletEmptyState(
                status = status,
                colors = colors,
                modifier = GlanceModifier.defaultWeight().fillMaxWidth(),
            )
        } else {
            val byId = payload.sections.associateBy { it.id }
            val sections = payload.layouts.large.mapNotNull(byId::get)
            TabletLargeLayout(
                sections = sections,
                colors = colors,
                modifier = GlanceModifier.fillMaxWidth().defaultWeight(),
            )
        }

        Spacer(GlanceModifier.height(10.dp))
        TabletFooter(payload, status, diagnostics, colors)
    }
}

@Composable
private fun TabletHeader(payload: WidgetPayload?, colors: Palette) {
    val openPage = actionStartActivity(
        Intent(Intent.ACTION_VIEW, Uri.parse(payload?.pageUrl ?: SnapshotEndpoints.PAGE_URL))
    )
    Column(
        modifier = GlanceModifier
            .fillMaxWidth()
            .clickable(openPage)
    ) {
        LiveHeaderClock(
            color = colors.foreground,
            clockSizeSp = TabletTypography.HEADER,
            secondsSizeSp = TabletTypography.HEADER_SECONDS,
            dateSizeSp = TabletTypography.HEADER_META,
            weekSizeSp = TabletTypography.HEADER_META,
        )
    }
}

@Composable
private fun TabletLargeLayout(
    sections: List<WidgetSection>,
    colors: Palette,
    modifier: GlanceModifier,
) {
    val rows = largeRows(sections)
    Column(modifier = modifier) {
        rows.forEachIndexed { index, rowSections ->
            TabletLargeRowBlock(
                sections = rowSections,
                colors = colors,
                showDivider = index < rows.lastIndex,
                modifier = GlanceModifier.fillMaxWidth().defaultWeight(),
            )
        }
    }
}

@Composable
private fun TabletLargeRowBlock(
    sections: List<WidgetSection>,
    colors: Palette,
    showDivider: Boolean,
    modifier: GlanceModifier,
) {
    Column(modifier = modifier) {
        if (sections.size == 1 && sections.first().span != "half") {
            TabletDetailedSection(sections.first(), colors)
        } else {
            TabletHalfRow(sections, colors)
        }
        Spacer(GlanceModifier.defaultWeight())
        if (showDivider) {
            TabletHorizontalDivider(colors)
        }
    }
}

@Composable
private fun TabletDetailedSection(section: WidgetSection, colors: Palette) {
    when (section.id) {
        "weather" -> TabletWeatherSection(section, colors)
        "electricity" -> TabletElectricitySection(section, colors)
        else -> if (section.layout == "split" && visibleSupportRows(section).isNotEmpty()) {
            TabletSplitSection(section, colors)
        } else {
            TabletStackSection(section, colors)
        }
    }
}

@Composable
private fun TabletSectionHeading(section: WidgetSection, colors: Palette) {
    Row(modifier = GlanceModifier.fillMaxWidth()) {
        Text(
            text = section.index,
            style = TextStyle(
                color = ColorProvider(colors.muted),
                fontSize = TabletTypography.SUPPORTING.sp,
            ),
        )
        Spacer(GlanceModifier.width(12.dp))
        Text(
            text = section.label,
            style = TextStyle(
                color = ColorProvider(colors.muted),
                fontSize = TabletTypography.SECTION_HEADING.sp,
                fontWeight = FontWeight.Medium,
            ),
            maxLines = 1,
        )
    }
}

@Composable
private fun TabletPrimaryValue(
    section: WidgetSection,
    colors: Palette,
    modifier: GlanceModifier = GlanceModifier,
) {
    LiveCountdownValue(
        targetEpochMs = section.countdownTargetMs,
        fallback = section.primary,
        color = toneColor(section.tone, colors),
        sizeSp = TabletTypography.PRIMARY,
        modifier = modifier,
        unitSizeSp = TabletTypography.UNIT,
    )
}

@Composable
private fun TabletWeatherSection(section: WidgetSection, colors: Palette) {
    val detail = section.detail.orEmpty()
    val now = parseWeatherNowDetail(detail)
    val range = now.range.ifBlank { weatherRangeFromRows(section.rows) }
    val solar = parseSolarDetail(detail)
    val forecast = parseWeatherForecast(detail).ifEmpty {
        weatherForecastFromColumns(section.columns)
    }

    Column(modifier = GlanceModifier.fillMaxWidth()) {
        TabletSectionHeading(section, colors)
        Spacer(GlanceModifier.height(6.dp))
        Row(
            modifier = GlanceModifier.fillMaxWidth(),
            verticalAlignment = Alignment.Vertical.CenterVertically,
        ) {
            Column(modifier = GlanceModifier.defaultWeight()) {
                section.secondary?.takeIf(String::isNotBlank)?.let {
                    Text(
                        text = it,
                        style = TextStyle(
                            color = ColorProvider(colors.muted),
                            fontSize = TabletTypography.SUPPORTING.sp,
                        ),
                        maxLines = 1,
                    )
                    Spacer(GlanceModifier.height(4.dp))
                }
                PrimaryValueText(
                    text = section.primary,
                    color = colors.foreground,
                    sizeSp = TabletTypography.PRIMARY,
                    unitSizeSp = TabletTypography.UNIT,
                )
                val detailLine = listOf(now.condition, range)
                    .filter(String::isNotBlank)
                    .joinToString("  /  ")
                if (detailLine.isNotBlank()) {
                    Spacer(GlanceModifier.height(4.dp))
                    Text(
                        text = detailLine,
                        style = TextStyle(
                            color = ColorProvider(colors.muted),
                            fontSize = TabletTypography.SUPPORTING.sp,
                        ),
                        maxLines = 1,
                    )
                }
            }

            if (solar != null) {
                Spacer(GlanceModifier.width(18.dp))
                Image(
                    provider = ImageProvider(
                        renderSolarSummary(
                            solar = solar,
                            textColor = colors.muted.toArgb(),
                            daylightColor = colors.foreground.toArgb(),
                            nightColor = colors.line.toArgb(),
                            horizonColor = colors.background.toArgb(),
                            widthPx = 540,
                            heightPx = 180,
                        )
                    ),
                    contentDescription = "Daylight duration, sunrise, sunset and current sun position",
                    modifier = GlanceModifier.width(270.dp).height(90.dp),
                    contentScale = ContentScale.FillBounds,
                )
            }
        }

        if (forecast.isNotEmpty()) {
            Spacer(GlanceModifier.height(8.dp))
            Row(modifier = GlanceModifier.fillMaxWidth()) {
                forecast.take(6).forEach { point ->
                    Column(
                        modifier = GlanceModifier.defaultWeight(),
                        horizontalAlignment = Alignment.Horizontal.CenterHorizontally,
                    ) {
                        Text(
                            text = point.time,
                            style = TextStyle(
                                color = ColorProvider(colors.muted),
                                fontSize = TabletTypography.MICRO.sp,
                            ),
                            maxLines = 1,
                        )
                        Text(
                            text = point.temperature,
                            style = TextStyle(
                                color = ColorProvider(colors.foreground),
                                fontSize = TabletTypography.FORECAST_VALUE.sp,
                                fontWeight = FontWeight.Bold,
                            ),
                            maxLines = 1,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun TabletElectricitySection(section: WidgetSection, colors: Palette) {
    val electricityNow = section.rows.firstOrNull { it.label == "NOW" }

    Column(modifier = GlanceModifier.fillMaxWidth()) {
        Row(
            modifier = GlanceModifier.fillMaxWidth(),
            verticalAlignment = Alignment.Vertical.Top,
        ) {
            Column(modifier = GlanceModifier.defaultWeight()) {
                TabletSectionHeading(section, colors)
                Spacer(GlanceModifier.height(7.dp))
                section.secondary?.let {
                    Text(
                        text = it,
                        style = TextStyle(
                            color = ColorProvider(colors.muted),
                            fontSize = TabletTypography.SUPPORTING.sp,
                        ),
                        maxLines = 1,
                    )
                    Spacer(GlanceModifier.height(3.dp))
                }
                PrimaryValueText(
                    text = section.primary,
                    color = toneColor(section.tone, colors),
                    sizeSp = TabletTypography.PRIMARY,
                    unitSizeSp = TabletTypography.UNIT,
                )
            }

            Spacer(GlanceModifier.width(24.dp))
            Column(modifier = GlanceModifier.defaultWeight()) {
                if (section.bars.isNotEmpty()) {
                    TabletElectricityBarStrip(
                        values = section.bars,
                        currentPrice = electricityNow?.value,
                        colors = colors,
                    )
                }
            }
        }

        section.detail?.let {
            Spacer(GlanceModifier.height(4.dp))
            electricityDetailLines(it).forEach { line ->
                Text(
                    text = line,
                    style = TextStyle(
                        color = ColorProvider(colors.muted),
                        fontSize = TabletTypography.SUPPORTING.sp,
                    ),
                    maxLines = 1,
                )
            }
        }
    }
}

@Composable
private fun TabletElectricityBarStrip(
    values: List<Double>,
    currentPrice: String?,
    colors: Palette,
) {
    val price = electricityCurrentPriceLabel(currentPrice)
    Image(
        provider = ImageProvider(
            renderElectricityChartBitmap(
                values = values,
                epochMs = System.currentTimeMillis(),
                currentPrice = price,
                barColor = colors.foreground.toArgb(),
                markerOuterColor = colors.foreground.toArgb(),
                markerInnerColor = colors.background.toArgb(),
                currentPriceColor = colors.foreground.toArgb(),
                axisLabelColor = colors.muted.toArgb(),
            )
        ),
        contentDescription = "Electricity price profile",
        modifier = GlanceModifier.fillMaxWidth().height(108.dp),
        contentScale = ContentScale.FillBounds,
    )
}

@Composable
private fun TabletSplitSection(section: WidgetSection, colors: Palette) {
    Column(modifier = GlanceModifier.fillMaxWidth()) {
        TabletSectionHeading(section, colors)
        Spacer(GlanceModifier.height(7.dp))
        Row(
            modifier = GlanceModifier.fillMaxWidth(),
            verticalAlignment = Alignment.Vertical.Top,
        ) {
            Column(modifier = GlanceModifier.defaultWeight()) {
                section.secondary?.let {
                    Text(
                        text = it,
                        style = TextStyle(
                            color = ColorProvider(colors.muted),
                            fontSize = TabletTypography.SUPPORTING.sp,
                        ),
                        maxLines = 1,
                    )
                    Spacer(GlanceModifier.height(3.dp))
                }
                TabletPrimaryValue(section, colors)
                section.detail?.let {
                    Spacer(GlanceModifier.height(4.dp))
                    Text(
                        text = it,
                        style = TextStyle(
                            color = ColorProvider(colors.muted),
                            fontSize = TabletTypography.SUPPORTING.sp,
                        ),
                        maxLines = 2,
                    )
                }
            }

            Spacer(GlanceModifier.width(24.dp))
            Column(modifier = GlanceModifier.defaultWeight()) {
                visibleSupportRows(section).take(5).forEach { item ->
                    TabletDetailRow(item, colors)
                }
            }
        }
    }
}

@Composable
private fun TabletStackSection(section: WidgetSection, colors: Palette) {
    Column(modifier = GlanceModifier.fillMaxWidth()) {
        TabletSectionHeading(section, colors)
        Spacer(GlanceModifier.height(7.dp))
        section.secondary?.let {
            Text(
                text = it,
                style = TextStyle(
                    color = ColorProvider(colors.muted),
                    fontSize = TabletTypography.SUPPORTING.sp,
                ),
                maxLines = 1,
            )
            Spacer(GlanceModifier.height(3.dp))
        }
        TabletPrimaryValue(section, colors)
        section.detail?.let {
            Spacer(GlanceModifier.height(4.dp))
            Text(
                text = it,
                style = TextStyle(
                    color = ColorProvider(colors.muted),
                    fontSize = TabletTypography.SUPPORTING.sp,
                ),
                maxLines = 2,
            )
        }
    }
}

@Composable
private fun TabletHalfRow(sections: List<WidgetSection>, colors: Palette) {
    Row(modifier = GlanceModifier.fillMaxWidth()) {
        TabletHalfMetric(
            section = sections[0],
            colors = colors,
            modifier = GlanceModifier.defaultWeight(),
        )
        if (sections.size > 1) {
            Spacer(GlanceModifier.width(14.dp))
            TabletVerticalDivider(colors)
            Spacer(GlanceModifier.width(14.dp))
            TabletHalfMetric(
                section = sections[1],
                colors = colors,
                modifier = GlanceModifier.defaultWeight(),
            )
        } else {
            Spacer(GlanceModifier.defaultWeight())
        }
    }
}

@Composable
private fun TabletHalfMetric(
    section: WidgetSection,
    colors: Palette,
    modifier: GlanceModifier,
) {
    val supportColor = if (section.id == "liiga") {
        colors.foreground.copy(alpha = 0.78f)
    } else {
        colors.muted
    }
    Column(modifier = modifier) {
        TabletSectionHeading(section, colors)
        Spacer(GlanceModifier.height(7.dp))
        PrimaryValueText(
            text = section.primary,
            color = toneColor(section.tone, colors),
            sizeSp = TabletTypography.PRIMARY,
            unitSizeSp = TabletTypography.UNIT,
        )
        section.secondary?.let {
            Spacer(GlanceModifier.height(4.dp))
            Text(
                text = it,
                style = TextStyle(
                    color = ColorProvider(supportColor),
                    fontSize = TabletTypography.SUPPORTING.sp,
                ),
                maxLines = 1,
            )
        }
        section.detail?.let {
            Spacer(GlanceModifier.height(3.dp))
            Text(
                text = it,
                style = TextStyle(
                    color = ColorProvider(supportColor),
                    fontSize = TabletTypography.SUPPORTING.sp,
                ),
                maxLines = 1,
            )
        }
        largeHalfSupportRow(section)?.let {
            Spacer(GlanceModifier.height(3.dp))
            TabletDetailRow(it, colors)
        }
    }
}

@Composable
private fun TabletDetailRow(item: WidgetItem, colors: Palette) {
    Row(modifier = GlanceModifier.fillMaxWidth()) {
        Text(
            text = item.label,
            modifier = GlanceModifier.defaultWeight(),
            style = TextStyle(
                color = ColorProvider(colors.muted),
                fontSize = TabletTypography.SUPPORTING.sp,
            ),
            maxLines = 1,
        )
        Text(
            text = item.value,
            style = TextStyle(
                color = ColorProvider(toneColor(item.tone, colors)),
                fontSize = TabletTypography.SUPPORTING_VALUE.sp,
                fontWeight = FontWeight.Medium,
            ),
            maxLines = 1,
        )
    }
}

@Composable
private fun TabletHorizontalDivider(colors: Palette) {
    Box(
        modifier = GlanceModifier
            .fillMaxWidth()
            .height(1.dp)
            .background(colors.line)
    ) {}
}

@Composable
private fun TabletVerticalDivider(colors: Palette) {
    Box(
        modifier = GlanceModifier
            .width(1.dp)
            .height(112.dp)
            .background(colors.line)
    ) {}
}

@Composable
private fun TabletFooter(
    payload: WidgetPayload?,
    status: String,
    diagnostics: WidgetFetchDiagnostics,
    colors: Palette,
) {
    val payloadTime = payload?.generatedAt?.takeIf { it.isNotBlank() }?.let(::localTime)
    val statusText = when {
        status == WidgetRepository.STATUS_LOADING -> "UPDATING"
        status == WidgetRepository.STATUS_ERROR && payloadTime != null ->
            "${diagnostics.failureLabel()} · LAST $payloadTime"
        status == WidgetRepository.STATUS_ERROR -> diagnostics.failureLabel()
        payload?.channel == "legacy" && payloadTime != null ->
            "${diagnostics.legacyFallbackLabel()} · UPDATED $payloadTime"
        payloadTime != null -> "UPDATED $payloadTime"
        else -> "WAITING FOR DATA"
    }

    Row(
        modifier = GlanceModifier
            .fillMaxWidth()
            .padding(bottom = 6.dp),
        verticalAlignment = Alignment.Vertical.CenterVertically,
    ) {
        Text(
            text = statusText,
            modifier = GlanceModifier.defaultWeight(),
            style = TextStyle(
                color = ColorProvider(colors.muted),
                fontSize = TabletTypography.SUPPORTING.sp,
            ),
            maxLines = 1,
        )
        if (status == WidgetRepository.STATUS_LOADING) {
            LiveRefreshSpinner(
                modifier = GlanceModifier
                    .width(32.dp)
                    .height(32.dp)
                    .padding(5.dp),
            )
        } else {
            Image(
                provider = ImageProvider(renderRefreshIconBitmap(colors.accent.toArgb())),
                contentDescription = "Refresh",
                modifier = GlanceModifier
                    .width(28.dp)
                    .height(28.dp)
                    .clickable(actionRunCallback<RefreshAction>()),
                contentScale = ContentScale.Fit,
            )
        }
    }
}

@Composable
private fun TabletEmptyState(
    status: String,
    colors: Palette,
    modifier: GlanceModifier,
) {
    Box(
        modifier = modifier,
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.Horizontal.CenterHorizontally) {
            Text(
                text = when (status) {
                    WidgetRepository.STATUS_LOADING -> "LOADING..."
                    WidgetRepository.STATUS_ERROR -> "NO CONNECTION"
                    else -> "NO DATA"
                },
                style = TextStyle(
                    color = ColorProvider(colors.foreground),
                    fontSize = TabletTypography.STATUS_PRIMARY.sp,
                    fontWeight = FontWeight.Bold,
                ),
            )
            Spacer(GlanceModifier.height(8.dp))
            Text(
                text = if (status == WidgetRepository.STATUS_ERROR) {
                    "Tap refresh to try again"
                } else {
                    "Tap refresh to load data"
                },
                style = TextStyle(
                    color = ColorProvider(colors.muted),
                    fontSize = TabletTypography.SUPPORTING.sp,
                ),
            )
        }
    }
}

class SnapshotTabletWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = SnapshotTabletWidget()

    override fun onEnabled(context: Context) {
        super.onEnabled(context)
        SnapshotUpdateWorker.schedule(context)
    }

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray,
    ) {
        super.onUpdate(context, appWidgetManager, appWidgetIds)
        if (appWidgetIds.isNotEmpty()) {
            SnapshotUpdateWorker.schedule(context)
        }
    }

    override fun onDisabled(context: Context) {
        super.onDisabled(context)
        if (!hasAnySnapshotWidgets(context)) {
            SnapshotUpdateWorker.cancel(context)
        }
    }
}
