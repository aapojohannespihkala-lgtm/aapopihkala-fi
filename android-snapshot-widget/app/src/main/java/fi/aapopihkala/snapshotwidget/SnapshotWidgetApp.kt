package fi.aapopihkala.snapshotwidget

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
import androidx.glance.action.ActionParameters
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.action.ActionCallback
import androidx.glance.appwidget.action.actionRunCallback
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.appwidget.appWidgetBackground
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.appwidget.updateAll
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
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone
import java.util.concurrent.TimeUnit

private enum class WidgetSizeClass { COMPACT, MEDIUM, LARGE }

internal object WidgetTypography {
    const val SECTION_HEADING = 9
    const val PRIMARY_FULL = 22
    const val HEADER = PRIMARY_FULL
    const val PRIMARY_HALF = 22
    const val PRIMARY_MEDIUM = 20
    const val PRIMARY_COMPACT = 13
    const val UNIT = 13
    const val HEADER_SECONDS = UNIT
    const val STATUS_PRIMARY = 19
    const val SUPPORTING_VALUE = 9
    const val SUPPORTING = 8
    const val MICRO = 7
    const val FORECAST_VALUE = 10
}

private data class Palette(
    val background: Color,
    val panel: Color,
    val foreground: Color,
    val muted: Color,
    val line: Color,
    val accent: Color,
    val positive: Color,
    val negative: Color
)

class SnapshotUpdateWorker(
    appContext: Context,
    params: WorkerParameters
) : CoroutineWorker(appContext, params) {
    override suspend fun doWork(): Result {
        val repository = WidgetRepository(applicationContext)
        val payload = repository.fetchAndCache()
        SnapshotWidget().updateAll(applicationContext)
        return if (payload != null) Result.success() else Result.retry()
    }

    companion object {
        private const val PERIODIC_NAME = "snapshot-widget-periodic"
        private const val IMMEDIATE_NAME = "snapshot-widget-immediate"

        fun schedule(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()
            val request = PeriodicWorkRequestBuilder<SnapshotUpdateWorker>(15, TimeUnit.MINUTES)
                .setConstraints(constraints)
                .build()
            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                PERIODIC_NAME,
                ExistingPeriodicWorkPolicy.UPDATE,
                request
            )
            refreshNow(context)
        }

        fun refreshNow(context: Context) {
            WorkManager.getInstance(context).enqueueUniqueWork(
                IMMEDIATE_NAME,
                ExistingWorkPolicy.REPLACE,
                OneTimeWorkRequestBuilder<SnapshotUpdateWorker>().build()
            )
        }

        fun cancel(context: Context) {
            WorkManager.getInstance(context).cancelUniqueWork(PERIODIC_NAME)
            WorkManager.getInstance(context).cancelUniqueWork(IMMEDIATE_NAME)
        }
    }
}

class RefreshAction : ActionCallback {
    override suspend fun onAction(
        context: Context,
        glanceId: GlanceId,
        parameters: ActionParameters
    ) {
        val repository = WidgetRepository(context)
        repository.markLoading()
        SnapshotWidget().updateAll(context)
        SnapshotUpdateWorker.refreshNow(context)
    }
}

class SnapshotWidget : GlanceAppWidget() {
    override val sizeMode: SizeMode = SizeMode.Exact

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val repository = WidgetRepository(context)
        val payload = repository.loadCached()
        val status = repository.status()
        val diagnostics = repository.diagnostics()
        provideContent { SnapshotContent(payload, status, diagnostics) }
    }
}

@Composable
private fun SnapshotContent(
    payload: WidgetPayload?,
    status: String,
    diagnostics: WidgetFetchDiagnostics,
) {
    val size = LocalSize.current
    val sizeClass = when {
        size.height < 180.dp || size.width < 235.dp -> WidgetSizeClass.COMPACT
        size.height < 330.dp -> WidgetSizeClass.MEDIUM
        else -> WidgetSizeClass.LARGE
    }
    val palette = palette(payload?.theme ?: WidgetTheme.default())
    val outerPadding = if (sizeClass == WidgetSizeClass.COMPACT) 10.dp else 14.dp

    Column(
        modifier = GlanceModifier
            .fillMaxSize()
            .background(palette.background)
            .cornerRadius(22.dp)
            .appWidgetBackground()
            .padding(outerPadding)
    ) {
        Header(payload, palette)
        Spacer(GlanceModifier.height(if (sizeClass == WidgetSizeClass.COMPACT) 6.dp else 7.dp))

        if (payload == null || payload.sections.isEmpty()) {
            EmptyState(
                status = status,
                palette = palette,
                modifier = GlanceModifier.defaultWeight().fillMaxWidth()
            )
        } else {
            val sections = orderedSections(payload, sizeClass)
            when (sizeClass) {
                WidgetSizeClass.COMPACT -> CompactLayout(sections, palette)
                WidgetSizeClass.MEDIUM -> MediumLayout(sections, palette)
                WidgetSizeClass.LARGE -> LargeLayout(sections, palette)
            }
            Spacer(GlanceModifier.defaultWeight())
        }

        Footer(payload, status, diagnostics, palette)
    }
}

@Composable
private fun Header(payload: WidgetPayload?, palette: Palette) {
    val openPage = actionStartActivity(
        Intent(Intent.ACTION_VIEW, Uri.parse(payload?.pageUrl ?: SnapshotEndpoints.PAGE_URL))
    )

    Column(
        modifier = GlanceModifier
            .fillMaxWidth()
            .clickable(openPage)
    ) {
        LiveHeaderClock(color = palette.foreground)
    }
}

@Composable
private fun Footer(
    payload: WidgetPayload?,
    status: String,
    diagnostics: WidgetFetchDiagnostics,
    palette: Palette,
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
            .padding(bottom = 8.dp),
        verticalAlignment = Alignment.Vertical.CenterVertically
    ) {
        Text(
            text = statusText,
            modifier = GlanceModifier.defaultWeight(),
            style = TextStyle(
                color = ColorProvider(palette.muted),
                fontSize = WidgetTypography.SUPPORTING.sp
            ),
            maxLines = 1
        )
        if (status == WidgetRepository.STATUS_LOADING) {
            LiveRefreshSpinner(
                modifier = GlanceModifier
                    .width(24.dp)
                    .height(24.dp)
                    .padding(4.dp)
            )
        } else {
            Image(
                provider = ImageProvider(renderRefreshIconBitmap(palette.accent.toArgb())),
                contentDescription = "Refresh",
                modifier = GlanceModifier
                    .width(20.dp)
                    .height(20.dp)
                    .clickable(actionRunCallback<RefreshAction>()),
                contentScale = ContentScale.Fit,
            )
        }
    }
}

@Composable
private fun EmptyState(
    status: String,
    palette: Palette,
    modifier: GlanceModifier = GlanceModifier.fillMaxSize()
) {
    Box(
        modifier = modifier,
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.Horizontal.CenterHorizontally) {
            Text(
                text = when (status) {
                    WidgetRepository.STATUS_LOADING -> "LOADING..."
                    WidgetRepository.STATUS_ERROR -> "NO CONNECTION"
                    else -> "NO DATA"
                },
                style = TextStyle(
                    color = ColorProvider(palette.foreground),
                    fontSize = WidgetTypography.STATUS_PRIMARY.sp,
                    fontWeight = FontWeight.Bold
                )
            )
            Spacer(GlanceModifier.height(4.dp))
            Text(
                text = if (status == WidgetRepository.STATUS_ERROR) "Tap refresh to try again" else "Tap refresh to load data",
                style = TextStyle(color = ColorProvider(palette.muted), fontSize = WidgetTypography.SUPPORTING_VALUE.sp)
            )
        }
    }
}

private fun orderedSections(payload: WidgetPayload, sizeClass: WidgetSizeClass): List<WidgetSection> {
    val ids = when (sizeClass) {
        WidgetSizeClass.COMPACT -> payload.layouts.compact
        WidgetSizeClass.MEDIUM -> payload.layouts.medium
        WidgetSizeClass.LARGE -> payload.layouts.large
    }
    val byId = payload.sections.associateBy { it.id }
    return ids.mapNotNull(byId::get)
}

@Composable
private fun CompactLayout(sections: List<WidgetSection>, palette: Palette) {
    val visible = sections.take(4)
    visible.chunked(2).forEachIndexed { rowIndex, rowSections ->
        Row(modifier = GlanceModifier.fillMaxWidth()) {
            rowSections.forEachIndexed { index, section ->
                CompactMetric(section, palette, GlanceModifier.defaultWeight())
                if (index == 0 && rowSections.size > 1) Spacer(GlanceModifier.width(6.dp))
            }
            if (rowSections.size == 1) Spacer(GlanceModifier.defaultWeight())
        }
        if (rowIndex < visible.chunked(2).lastIndex) Spacer(GlanceModifier.height(6.dp))
    }
}

@Composable
private fun CompactMetric(section: WidgetSection, palette: Palette, modifier: GlanceModifier) {
    Column(
        modifier = modifier
            .background(palette.panel)
            .cornerRadius(11.dp)
            .padding(8.dp)
    ) {
        Text(
            text = section.label,
            style = TextStyle(color = ColorProvider(palette.muted), fontSize = WidgetTypography.SUPPORTING.sp),
            maxLines = 1
        )
        Text(
            text = section.primary,
            style = TextStyle(
                color = ColorProvider(toneColor(section.tone, palette)),
                fontSize = WidgetTypography.PRIMARY_COMPACT.sp,
                fontWeight = FontWeight.Bold
            ),
            maxLines = 1
        )
        section.secondary?.let {
            Text(
                text = it,
                style = TextStyle(color = ColorProvider(palette.muted), fontSize = WidgetTypography.MICRO.sp),
                maxLines = 1
            )
        }
    }
}

@Composable
private fun MediumLayout(sections: List<WidgetSection>, palette: Palette) {
    val visible = sections.take(4)
    visible.chunked(2).forEachIndexed { rowIndex, rowSections ->
        Row(modifier = GlanceModifier.fillMaxWidth()) {
            rowSections.forEachIndexed { index, section ->
                MediumMetric(section, palette, GlanceModifier.defaultWeight())
                if (index == 0 && rowSections.size > 1) VerticalDivider(palette)
            }
            if (rowSections.size == 1) Spacer(GlanceModifier.defaultWeight())
        }
        if (rowIndex < visible.chunked(2).lastIndex) {
            Spacer(GlanceModifier.height(7.dp))
            HorizontalDivider(palette)
            Spacer(GlanceModifier.height(7.dp))
        }
    }
}

@Composable
private fun MediumMetric(section: WidgetSection, palette: Palette, modifier: GlanceModifier) {
    Column(modifier = modifier.padding(horizontal = 7.dp)) {
        SectionHeading(section, palette)
        Spacer(GlanceModifier.height(3.dp))
        Text(
            text = section.primary,
            style = TextStyle(
                color = ColorProvider(toneColor(section.tone, palette)),
                fontSize = WidgetTypography.PRIMARY_MEDIUM.sp,
                fontWeight = FontWeight.Bold
            ),
            maxLines = 1
        )
        section.detail?.let {
            Spacer(GlanceModifier.height(2.dp))
            Text(
                text = it,
                style = TextStyle(color = ColorProvider(palette.muted), fontSize = WidgetTypography.SUPPORTING.sp),
                maxLines = 2
            )
        }
    }
}

@Composable
private fun LargeLayout(sections: List<WidgetSection>, palette: Palette) {
    val rows = largeRows(sections)
    Column(modifier = GlanceModifier.fillMaxWidth()) {
        rows.forEachIndexed { rowIndex, rowSections ->
            LargeRowBlock(
                sections = rowSections,
                palette = palette,
                showDivider = rowIndex < rows.lastIndex
            )
        }
    }
}

@Composable
private fun LargeRowBlock(
    sections: List<WidgetSection>,
    palette: Palette,
    showDivider: Boolean
) {
    Column(modifier = GlanceModifier.fillMaxWidth()) {
        if (sections.size == 1 && sections.first().span != "half") {
            DetailedSection(sections.first(), palette)
        } else {
            LargeHalfRow(sections, palette)
        }
        if (showDivider) {
            Spacer(GlanceModifier.height(5.dp))
            HorizontalDivider(palette)
            Spacer(GlanceModifier.height(5.dp))
        }
    }
}

@Composable
private fun LargeHalfRow(sections: List<WidgetSection>, palette: Palette) {
    Row(modifier = GlanceModifier.fillMaxWidth()) {
        LargeHalfMetric(sections[0], palette, GlanceModifier.defaultWeight())
        if (sections.size > 1) {
            Spacer(GlanceModifier.width(7.dp))
            VerticalDivider(palette)
            Spacer(GlanceModifier.width(7.dp))
            LargeHalfMetric(sections[1], palette, GlanceModifier.defaultWeight())
        } else {
            Spacer(GlanceModifier.defaultWeight())
        }
    }
}

internal fun largeHalfSupportRow(section: WidgetSection): WidgetItem? =
    section.rows.firstOrNull { row ->
        row.value != section.secondary && row.value != section.detail
    }

internal fun visibleSupportRows(section: WidgetSection): List<WidgetItem> = when (section.id) {
    "electricity" -> section.rows.filterNot { it.label == "NOW" }
    "hsl" -> section.rows.filterNot { row ->
        row.countdownTargetMs != null && row.countdownTargetMs == section.countdownTargetMs
    }
    else -> section.rows
}

@Composable
private fun LargeHalfMetric(section: WidgetSection, palette: Palette, modifier: GlanceModifier) {
    val supportColor = if (section.id == "liiga") {
        palette.foreground.copy(alpha = 0.78f)
    } else {
        palette.muted
    }

    Column(modifier = modifier) {
        SectionHeading(section, palette)
        Spacer(GlanceModifier.height(3.dp))
        PrimaryValueText(
            text = section.primary,
            color = toneColor(section.tone, palette),
            sizeSp = WidgetTypography.PRIMARY_HALF,
        )
        section.secondary?.let {
            Spacer(GlanceModifier.height(2.dp))
            Text(
                text = it,
                style = TextStyle(color = ColorProvider(supportColor), fontSize = WidgetTypography.SUPPORTING.sp),
                maxLines = 1
            )
        }
        section.detail?.let {
            Spacer(GlanceModifier.height(2.dp))
            Text(
                text = it,
                style = TextStyle(color = ColorProvider(supportColor), fontSize = WidgetTypography.SUPPORTING.sp),
                maxLines = 1
            )
        }
        largeHalfSupportRow(section)?.let {
            Spacer(GlanceModifier.height(2.dp))
            DetailRow(it, palette)
        }
    }
}

@Composable
private fun DetailedSection(section: WidgetSection, palette: Palette) {
    if (section.id == "weather") {
        WeatherSectionContent(
            section = section,
            foreground = palette.foreground,
            muted = palette.muted,
            line = palette.line,
            background = palette.background,
        )
        return
    }

    val hasSupport = section.columns.isNotEmpty() || section.bars.isNotEmpty() || section.rows.isNotEmpty()
    if (section.layout == "split" && hasSupport) {
        SplitSection(section, palette)
    } else {
        StackSection(section, palette)
    }
}

@Composable
private fun StackSection(section: WidgetSection, palette: Palette) {
    Column(modifier = GlanceModifier.fillMaxWidth()) {
        SectionHeading(section, palette)
        section.secondary?.let {
            Spacer(GlanceModifier.height(3.dp))
            Text(
                text = it,
                style = TextStyle(color = ColorProvider(palette.muted), fontSize = WidgetTypography.SUPPORTING.sp),
                maxLines = 1
            )
        }
        Spacer(GlanceModifier.height(2.dp))
        PrimaryValue(section, palette, WidgetTypography.PRIMARY_FULL)
        section.detail?.let {
            Spacer(GlanceModifier.height(3.dp))
            SolarAwareDetail(
                detail = it,
                textColor = palette.muted,
                daylightColor = palette.foreground,
                nightColor = palette.line,
                horizonColor = palette.background,
                fontSizeSp = WidgetTypography.SUPPORTING_VALUE
            )
        }
        SupportingContent(section, palette)
    }
}

@Composable
private fun SplitSection(section: WidgetSection, palette: Palette) {
    if (section.id == "electricity") {
        ElectricitySplitSection(section, palette)
        return
    }

    Column(modifier = GlanceModifier.fillMaxWidth()) {
        SectionHeading(section, palette)
        Spacer(GlanceModifier.height(4.dp))
        Row(
            modifier = GlanceModifier.fillMaxWidth(),
            verticalAlignment = Alignment.Vertical.CenterVertically
        ) {
            Column(modifier = GlanceModifier.defaultWeight()) {
                section.secondary?.let {
                    Text(
                        text = it,
                        style = TextStyle(color = ColorProvider(palette.muted), fontSize = WidgetTypography.SUPPORTING.sp),
                        maxLines = 1
                    )
                    Spacer(GlanceModifier.height(2.dp))
                }
                PrimaryValue(section, palette, WidgetTypography.PRIMARY_FULL)
                section.detail?.let {
                    Spacer(GlanceModifier.height(2.dp))
                    SolarAwareDetail(
                        detail = it,
                        textColor = palette.muted,
                        daylightColor = palette.foreground,
                        nightColor = palette.line,
                        horizonColor = palette.background,
                        fontSizeSp = WidgetTypography.SUPPORTING
                    )
                }
            }
            Spacer(GlanceModifier.width(10.dp))
            Column(modifier = GlanceModifier.defaultWeight()) {
                SupportingContent(section, palette, includeTopSpacing = false)
            }
        }
    }
}

@Composable
private fun ElectricitySplitSection(section: WidgetSection, palette: Palette) {
    val electricityNow = section.rows.firstOrNull { it.label == "NOW" }

    Column(modifier = GlanceModifier.fillMaxWidth()) {
        Row(
            modifier = GlanceModifier.fillMaxWidth(),
            verticalAlignment = Alignment.Vertical.Top
        ) {
            Column(modifier = GlanceModifier.defaultWeight()) {
                SectionHeading(section, palette)
                Spacer(GlanceModifier.height(4.dp))
                section.secondary?.let {
                    Text(
                        text = it,
                        style = TextStyle(color = ColorProvider(palette.muted), fontSize = WidgetTypography.SUPPORTING.sp),
                        maxLines = 1
                    )
                    Spacer(GlanceModifier.height(2.dp))
                }
                ElectricityPrimaryValue(section, palette)
            }
            Spacer(GlanceModifier.width(10.dp))
            Column(modifier = GlanceModifier.defaultWeight()) {
                if (section.bars.isNotEmpty()) {
                    ElectricityBarStrip(section.bars, electricityNow?.value, palette)
                }
            }
        }
        section.detail?.let {
            ElectricityDetail(detail = it, palette = palette)
        }
    }
}

internal data class PrimaryValueParts(
    val value: String,
    val unit: String?,
    val unitGapDp: Int = 0,
)

internal fun primaryValueParts(primary: String): PrimaryValueParts {
    val trimmed = primary.trim()

    Regex("^(.+?)\\s+(c/kWh|MIN|min)$").matchEntire(trimmed)?.let { match ->
        val rawUnit = match.groupValues[2]
        return PrimaryValueParts(
            value = match.groupValues[1],
            unit = if (rawUnit.equals("MIN", ignoreCase = true)) "min" else rawUnit,
            unitGapDp = 4,
        )
    }

    Regex("^(.+?)(°C|%)$").matchEntire(trimmed)?.let { match ->
        val unit = match.groupValues[2]
        return PrimaryValueParts(
            value = match.groupValues[1],
            unit = unit,
            unitGapDp = if (unit == "°C") 2 else 0,
        )
    }

    return PrimaryValueParts(value = trimmed, unit = null)
}

internal fun electricityPrimaryParts(primary: String): PrimaryValueParts = primaryValueParts(primary)

@Composable
internal fun PrimaryValueText(
    text: String,
    color: Color,
    sizeSp: Int,
    modifier: GlanceModifier = GlanceModifier,
) {
    val parts = primaryValueParts(text)
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.Vertical.Bottom,
    ) {
        Text(
            text = parts.value,
            style = TextStyle(
                color = ColorProvider(color),
                fontSize = sizeSp.sp,
                fontWeight = FontWeight.Medium,
            ),
            maxLines = 1,
        )
        parts.unit?.let { unit ->
            if (parts.unitGapDp > 0) {
                Spacer(GlanceModifier.width(parts.unitGapDp.dp))
            }
            Text(
                text = unit,
                style = TextStyle(
                    color = ColorProvider(color),
                    fontSize = WidgetTypography.UNIT.sp,
                    fontWeight = FontWeight.Medium,
                ),
                maxLines = 1,
            )
        }
    }
}

@Composable
private fun ElectricityPrimaryValue(section: WidgetSection, palette: Palette) {
    PrimaryValueText(
        text = section.primary,
        color = toneColor(section.tone, palette),
        sizeSp = WidgetTypography.PRIMARY_FULL,
    )
}

@Composable
private fun ElectricityDetail(detail: String, palette: Palette) {
    electricityDetailLines(detail).forEach { line ->
        Text(
            text = line,
            style = TextStyle(color = ColorProvider(palette.muted), fontSize = WidgetTypography.SUPPORTING.sp),
            maxLines = 1
        )
    }
}

internal fun electricityDetailLines(detail: String): List<String> {
    val normalized = detail.trim()
    val serverLines = normalized.lines().map(String::trim).filter(String::isNotEmpty)
    if (serverLines.size > 1) return serverLines.take(3)

    val match = Regex("^MONTH AVG\\s+(\\S+)\\s+LOW\\s+(\\S+)\\s+HIGH\\s+(\\S+)$")
        .matchEntire(normalized)
        ?: return listOf(normalized)
    return listOf(
        "LOW ${match.groupValues[2]}   HIGH ${match.groupValues[3]}",
        "MONTH AVG ${match.groupValues[1]}",
    )
}

@Composable
private fun PrimaryValue(section: WidgetSection, palette: Palette, sizeSp: Int) {
    LiveCountdownValue(
        targetEpochMs = section.countdownTargetMs,
        fallback = section.primary,
        color = toneColor(section.tone, palette),
        sizeSp = sizeSp,
    )
}

@Composable
private fun SupportingContent(
    section: WidgetSection,
    palette: Palette,
    includeTopSpacing: Boolean = true
) {
    var rendered = false
    val electricityNow = if (section.id == "electricity") {
        section.rows.firstOrNull { it.label == "NOW" }
    } else {
        null
    }
    val visibleRows = visibleSupportRows(section)

    if (section.columns.isNotEmpty()) {
        if (includeTopSpacing) Spacer(GlanceModifier.height(5.dp))
        ColumnStrip(section.columns, palette)
        rendered = true
    }
    if (section.bars.isNotEmpty()) {
        if (includeTopSpacing || rendered) Spacer(GlanceModifier.height(if (rendered) 4.dp else 5.dp))
        if (section.id == "electricity") {
            ElectricityBarStrip(section.bars, electricityNow?.value, palette)
        } else {
            BarStrip(section.bars, palette)
        }
        rendered = true
    }
    if (visibleRows.isNotEmpty()) {
        if (includeTopSpacing || rendered) Spacer(GlanceModifier.height(if (rendered) 4.dp else 5.dp))
        Column(modifier = GlanceModifier.fillMaxWidth()) {
            visibleRows.take(5).forEach { item -> DetailRow(item, palette) }
        }
    }
}

@Composable
private fun SectionHeading(section: WidgetSection, palette: Palette) {
    Row(modifier = GlanceModifier.fillMaxWidth()) {
        Text(
            text = section.index,
            style = TextStyle(color = ColorProvider(palette.muted), fontSize = WidgetTypography.SUPPORTING.sp)
        )
        Spacer(GlanceModifier.width(8.dp))
        Text(
            text = section.label,
            style = TextStyle(
                color = ColorProvider(palette.muted),
                fontSize = WidgetTypography.SECTION_HEADING.sp,
                fontWeight = FontWeight.Medium
            ),
            maxLines = 1
        )
    }
}

@Composable
private fun DetailRow(item: WidgetItem, palette: Palette) {
    Row(modifier = GlanceModifier.fillMaxWidth()) {
        Text(
            text = item.label,
            modifier = GlanceModifier.defaultWeight(),
            style = TextStyle(color = ColorProvider(palette.muted), fontSize = WidgetTypography.SUPPORTING.sp),
            maxLines = 1
        )
        Text(
            text = item.value,
            style = TextStyle(
                color = ColorProvider(toneColor(item.tone, palette)),
                fontSize = WidgetTypography.SUPPORTING_VALUE.sp,
                fontWeight = FontWeight.Medium
            ),
            maxLines = 1
        )
    }
}

@Composable
private fun ColumnStrip(items: List<WidgetItem>, palette: Palette) {
    Row(modifier = GlanceModifier.fillMaxWidth()) {
        items.take(4).forEach { item ->
            Column(modifier = GlanceModifier.defaultWeight()) {
                Text(
                    text = item.label,
                    style = TextStyle(color = ColorProvider(palette.muted), fontSize = WidgetTypography.MICRO.sp),
                    maxLines = 1
                )
                Text(
                    text = item.value,
                    style = TextStyle(
                        color = ColorProvider(toneColor(item.tone, palette)),
                        fontSize = WidgetTypography.FORECAST_VALUE.sp,
                        fontWeight = FontWeight.Bold
                    ),
                    maxLines = 1
                )
            }
        }
    }
}

@Composable
private fun ElectricityBarStrip(
    values: List<Double>,
    currentPrice: String?,
    palette: Palette,
) {
    val price = electricityCurrentPriceLabel(currentPrice)
    Image(
        provider = ImageProvider(
            renderElectricityChartBitmap(
                values = values,
                epochMs = System.currentTimeMillis(),
                currentPrice = price,
                barColor = palette.foreground.toArgb(),
                markerOuterColor = palette.foreground.toArgb(),
                markerInnerColor = palette.background.toArgb(),
                currentPriceColor = palette.foreground.toArgb(),
                axisLabelColor = palette.muted.toArgb(),
            )
        ),
        contentDescription = buildString {
            append("Electricity price profile with current time marker")
            price?.let { append("; current price ").append(it) }
        },
        modifier = GlanceModifier.fillMaxWidth().height(ELECTRICITY_CHART_DISPLAY_HEIGHT_DP.dp),
        contentScale = ContentScale.FillBounds,
    )
}

internal fun electricityCurrentPriceLabel(value: String?): String? =
    value?.trim()?.substringBefore(' ')?.takeIf { it.isNotBlank() }

@Composable
private fun BarStrip(values: List<Double>, palette: Palette) {
    val bars = compactBars(values)
    Row(
        modifier = GlanceModifier.fillMaxWidth().height(28.dp),
        verticalAlignment = Alignment.Vertical.Bottom
    ) {
        bars.forEach { value ->
            val normalized = value.coerceIn(0.0, 1.0)
            Box(
                modifier = GlanceModifier
                    .defaultWeight()
                    .height((4.0 + normalized * 24.0).dp)
                    .padding(horizontal = 1.dp)
                    .background(palette.foreground)
            ) {}
        }
    }
}

private fun compactBars(values: List<Double>, maxBars: Int = 8): List<Double> {
    if (values.size <= maxBars) return values
    val chunkSize = (values.size + maxBars - 1) / maxBars
    return values.chunked(chunkSize).map { bucket -> bucket.average() }.take(maxBars)
}

@Composable
private fun HorizontalDivider(palette: Palette) {
    Box(
        modifier = GlanceModifier
            .fillMaxWidth()
            .height(1.dp)
            .background(palette.line)
    ) {}
}

@Composable
private fun VerticalDivider(palette: Palette) {
    Box(
        modifier = GlanceModifier
            .width(1.dp)
            .height(68.dp)
            .background(palette.line)
    ) {}
}

private fun palette(theme: WidgetTheme) = Palette(
    background = parseColor(theme.background, Color(0xFF1D2A35)),
    panel = parseColor(theme.panel, Color(0xFF22323E)),
    foreground = parseColor(theme.foreground, Color(0xFFEEF2F4)),
    muted = parseColor(theme.muted, Color(0xFFAAB4BC)),
    line = parseColor(theme.line, Color(0xFF64717B)),
    accent = parseColor(theme.accent, Color(0xFFDCE4E8)),
    positive = parseColor(theme.positive, Color(0xFF15967F)),
    negative = parseColor(theme.negative, Color(0xFFC45F6C))
)

private fun parseColor(value: String, fallback: Color): Color =
    runCatching { Color(android.graphics.Color.parseColor(value)) }.getOrDefault(fallback)

private fun toneColor(tone: String, palette: Palette): Color = when (tone.lowercase()) {
    "positive" -> palette.positive
    "negative" -> palette.negative
    "accent" -> palette.accent
    else -> palette.foreground
}

private fun localTime(value: String): String {
    val patterns = listOf(
        "yyyy-MM-dd'T'HH:mm:ss.SSSXXX",
        "yyyy-MM-dd'T'HH:mm:ssXXX",
        "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
        "yyyy-MM-dd'T'HH:mm:ss'Z'"
    )
    val parsed = patterns.firstNotNullOfOrNull { pattern ->
        runCatching {
            SimpleDateFormat(pattern, Locale.US).apply {
                isLenient = false
                timeZone = TimeZone.getTimeZone("UTC")
            }.parse(value)
        }.getOrNull()
    } ?: return value.take(16)

    return SimpleDateFormat("HH:mm", Locale.US).apply {
        timeZone = TimeZone.getTimeZone("Europe/Helsinki")
    }.format(parsed)
}

class SnapshotWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = SnapshotWidget()

    override fun onEnabled(context: Context) {
        super.onEnabled(context)
        SnapshotUpdateWorker.schedule(context)
    }

    override fun onDisabled(context: Context) {
        SnapshotUpdateWorker.cancel(context)
        super.onDisabled(context)
    }
}
