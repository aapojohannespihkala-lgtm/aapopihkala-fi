package fi.aapopihkala.snapshotwidget

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
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
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone
import java.util.concurrent.TimeUnit

private enum class WidgetSizeClass { COMPACT, MEDIUM, LARGE }

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
        modifier = GlanceModifier.fillMaxWidth(),
        verticalAlignment = Alignment.Vertical.CenterVertically
    ) {
        Text(
            text = statusText,
            modifier = GlanceModifier.defaultWeight(),
            style = TextStyle(
                color = ColorProvider(palette.muted),
                fontSize = 8.sp
            ),
            maxLines = 1
        )
        if (status == WidgetRepository.STATUS_LOADING) {
            LiveRefreshSpinner(
                modifier = GlanceModifier
                    .width(32.dp)
                    .height(32.dp)
                    .padding(6.dp)
            )
        } else {
            Text(
                text = "↻",
                modifier = GlanceModifier
                    .clickable(actionRunCallback<RefreshAction>())
                    .padding(7.dp),
                style = TextStyle(
                    color = ColorProvider(palette.accent),
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Medium
                ),
                maxLines = 1
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
                    fontSize = 19.sp,
                    fontWeight = FontWeight.Bold
                )
            )
            Spacer(GlanceModifier.height(4.dp))
            Text(
                text = if (status == WidgetRepository.STATUS_ERROR) "Tap ↻ to try again" else "Tap ↻ to load data",
                style = TextStyle(color = ColorProvider(palette.muted), fontSize = 9.sp)
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
            style = TextStyle(color = ColorProvider(palette.muted), fontSize = 8.sp),
            maxLines = 1
        )
        Text(
            text = section.primary,
            style = TextStyle(
                color = ColorProvider(toneColor(section.tone, palette)),
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold
            ),
            maxLines = 1
        )
        section.secondary?.let {
            Text(
                text = it,
                style = TextStyle(color = ColorProvider(palette.muted), fontSize = 7.sp),
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
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold
            ),
            maxLines = 1
        )
        section.detail?.let {
            Spacer(GlanceModifier.height(2.dp))
            Text(
                text = it,
                style = TextStyle(color = ColorProvider(palette.muted), fontSize = 8.sp),
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
            VerticalDivider(palette)
            LargeHalfMetric(sections[1], palette, GlanceModifier.defaultWeight())
        } else {
            Spacer(GlanceModifier.defaultWeight())
        }
    }
}

@Composable
private fun LargeHalfMetric(section: WidgetSection, palette: Palette, modifier: GlanceModifier) {
    Column(modifier = modifier.padding(horizontal = 7.dp)) {
        SectionHeading(section, palette)
        Spacer(GlanceModifier.height(3.dp))
        Text(
            text = section.primary,
            style = TextStyle(
                color = ColorProvider(toneColor(section.tone, palette)),
                fontSize = 22.sp,
                fontWeight = FontWeight.Medium
            ),
            maxLines = 1
        )
        section.secondary?.let {
            Spacer(GlanceModifier.height(2.dp))
            Text(
                text = it,
                style = TextStyle(color = ColorProvider(palette.muted), fontSize = 8.sp),
                maxLines = 1
            )
        }
        section.detail?.let {
            Spacer(GlanceModifier.height(2.dp))
            Text(
                text = it,
                style = TextStyle(color = ColorProvider(palette.muted), fontSize = 8.sp),
                maxLines = 1
            )
        }
    }
}

@Composable
private fun DetailedSection(section: WidgetSection, palette: Palette) {
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
                style = TextStyle(color = ColorProvider(palette.muted), fontSize = 8.sp),
                maxLines = 1
            )
        }
        Spacer(GlanceModifier.height(2.dp))
        PrimaryValue(section, palette, 25)
        section.detail?.let {
            Spacer(GlanceModifier.height(3.dp))
            SolarAwareDetail(
                detail = it,
                textColor = palette.muted,
                daylightColor = palette.foreground,
                nightColor = palette.line,
                horizonColor = palette.background,
                fontSizeSp = 9
            )
        }
        SupportingContent(section, palette)
    }
}

@Composable
private fun SplitSection(section: WidgetSection, palette: Palette) {
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
                        style = TextStyle(color = ColorProvider(palette.muted), fontSize = 8.sp),
                        maxLines = 1
                    )
                    Spacer(GlanceModifier.height(2.dp))
                }
                PrimaryValue(section, palette, 25)
                section.detail?.let {
                    Spacer(GlanceModifier.height(2.dp))
                    if (section.id == "electricity") {
                        ElectricityDetail(detail = it, palette = palette)
                    } else {
                        SolarAwareDetail(
                            detail = it,
                            textColor = palette.muted,
                            daylightColor = palette.foreground,
                            nightColor = palette.line,
                            horizonColor = palette.background,
                            fontSizeSp = 8
                        )
                    }
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
private fun ElectricityDetail(detail: String, palette: Palette) {
    electricityDetailLines(detail).forEachIndexed { index, line ->
        if (index > 0) Spacer(GlanceModifier.height(1.dp))
        Text(
            text = line,
            style = TextStyle(color = ColorProvider(palette.muted), fontSize = 8.sp),
            maxLines = 1
        )
    }
}

internal fun electricityDetailLines(detail: String): List<String> {
    val match = Regex("^MONTH AVG\\s+(\\S+)\\s+LOW\\s+(\\S+)\\s+HIGH\\s+(\\S+)$")
        .matchEntire(detail.trim())
        ?: return listOf(detail.trim())
    return listOf(
        "MONTH AVG ${match.groupValues[1]}",
        "LOW ${match.groupValues[2]}   HIGH ${match.groupValues[3]}",
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
    val visibleRows = if (section.id == "electricity") {
        section.rows.filterNot { it.label == "NOW" }
    } else {
        section.rows
    }

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
            style = TextStyle(color = ColorProvider(palette.muted), fontSize = 8.sp)
        )
        Spacer(GlanceModifier.width(8.dp))
        Text(
            text = section.label,
            style = TextStyle(
                color = ColorProvider(palette.muted),
                fontSize = 9.sp,
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
            style = TextStyle(color = ColorProvider(palette.muted), fontSize = 8.sp),
            maxLines = 1
        )
        Text(
            text = item.value,
            style = TextStyle(
                color = ColorProvider(toneColor(item.tone, palette)),
                fontSize = 9.sp,
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
                    style = TextStyle(color = ColorProvider(palette.muted), fontSize = 7.sp),
                    maxLines = 1
                )
                Text(
                    text = item.value,
                    style = TextStyle(
                        color = ColorProvider(toneColor(item.tone, palette)),
                        fontSize = 10.sp,
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
    Column(modifier = GlanceModifier.fillMaxWidth()) {
        electricityCurrentPriceLabel(currentPrice)?.let { price ->
            Row(modifier = GlanceModifier.fillMaxWidth()) {
                Spacer(GlanceModifier.defaultWeight())
                Text(
                    text = price,
                    style = TextStyle(
                        color = ColorProvider(palette.foreground),
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Medium
                    ),
                    maxLines = 1
                )
            }
            Spacer(GlanceModifier.height(2.dp))
        }
        Box(modifier = GlanceModifier.fillMaxWidth().height(28.dp)) {
            BarStrip(values, palette)
            ElectricityTimeMarker(
                currentHour = electricityCurrentHour(System.currentTimeMillis()),
                palette = palette,
            )
        }
        Spacer(GlanceModifier.height(1.dp))
        Row(modifier = GlanceModifier.fillMaxWidth()) {
            listOf("00", "06", "12", "18").forEach { label ->
                Text(
                    text = label,
                    modifier = GlanceModifier.defaultWeight(),
                    style = TextStyle(color = ColorProvider(palette.muted), fontSize = 6.sp),
                    maxLines = 1
                )
            }
        }
    }
}

@Composable
private fun ElectricityTimeMarker(currentHour: Int, palette: Palette) {
    val activeHour = currentHour.coerceIn(0, 23)
    Row(
        modifier = GlanceModifier.fillMaxSize(),
        verticalAlignment = Alignment.Vertical.CenterVertically
    ) {
        repeat(24) { hour ->
            Box(
                modifier = GlanceModifier.defaultWeight().height(28.dp),
                contentAlignment = Alignment.Center
            ) {
                if (hour == activeHour) {
                    Box(
                        modifier = GlanceModifier
                            .width(2.dp)
                            .height(28.dp)
                            .background(palette.line)
                    ) {}
                }
            }
        }
    }
}

internal fun electricityCurrentPriceLabel(value: String?): String? =
    value?.trim()?.substringBefore(' ')?.takeIf { it.isNotBlank() }

internal fun electricityCurrentHour(
    epochMs: Long,
    timeZone: TimeZone = TimeZone.getTimeZone("Europe/Helsinki"),
): Int {
    val calendar = Calendar.getInstance(timeZone)
    calendar.timeInMillis = epochMs
    return calendar.get(Calendar.HOUR_OF_DAY).coerceIn(0, 23)
}

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
            .height(58.dp)
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
