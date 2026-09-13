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
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import java.net.HttpURLConnection
import java.net.URL
import java.util.Locale
import java.util.concurrent.TimeUnit
import org.json.JSONObject

data class SnapshotData(
    val updated: String?,
    val weather: Weather?,
    val electricity: Electricity?,
    val markets: Markets?,
    val rates: Rates?
) {
    data class Weather(
        val location: String?,
        val temperature: Double?,
        val min: Double?,
        val max: Double?
    )

    data class Electricity(
        val price: Double?,
        val average: Double?,
        val low: Double?,
        val high: Double?
    )

    data class Markets(
        val median: Double?,
        val world: Double?,
        val usa: Double?,
        val finland: Double?,
        val btcEur: Double?,
        val remedy: Double?
    )

    data class Rates(
        val euribor3m: Double?,
        val yearAgo: Double?
    )
}

object SnapshotConfig {
    const val DATA_URL = "https://aapopihkala.fi/api/current/widget"
    const val PAGE_URL = "https://aapopihkala.fi/current/snapshot/"
}

class SnapshotRepository(context: Context) {
    private val prefs = context.getSharedPreferences("snapshot_widget", Context.MODE_PRIVATE)

    fun fetchAndCache(): SnapshotData? {
        val connection = (URL(SnapshotConfig.DATA_URL).openConnection() as HttpURLConnection).apply {
            requestMethod = "GET"
            connectTimeout = 8_000
            readTimeout = 8_000
            setRequestProperty("Accept", "application/json")
            setRequestProperty("User-Agent", "SnapshotWidget/1.0")
        }

        return try {
            if (connection.responseCode !in 200..299) return null
            val json = connection.inputStream.bufferedReader().use { it.readText() }
            val data = parse(json)
            prefs.edit().putString(KEY_CACHE, json).apply()
            data
        } catch (_: Exception) {
            null
        } finally {
            connection.disconnect()
        }
    }

    fun loadCached(): SnapshotData? {
        val json = prefs.getString(KEY_CACHE, null) ?: return null
        return runCatching { parse(json) }.getOrNull()
    }

    private fun parse(json: String): SnapshotData {
        val root = JSONObject(json)
        val weather = root.optObject("weather")
        val electricity = root.optObject("electricity")
        val markets = root.optObject("markets")
        val rates = root.optObject("rates")

        return SnapshotData(
            updated = root.optNullableString("updated"),
            weather = weather?.let {
                SnapshotData.Weather(
                    location = it.optNullableString("location"),
                    temperature = it.optNullableDouble("temperature"),
                    min = it.optNullableDouble("min"),
                    max = it.optNullableDouble("max")
                )
            },
            electricity = electricity?.let {
                SnapshotData.Electricity(
                    price = it.optNullableDouble("price"),
                    average = it.optNullableDouble("average"),
                    low = it.optNullableDouble("low"),
                    high = it.optNullableDouble("high")
                )
            },
            markets = markets?.let {
                SnapshotData.Markets(
                    median = it.optNullableDouble("median"),
                    world = it.optNullableDouble("world"),
                    usa = it.optNullableDouble("usa"),
                    finland = it.optNullableDouble("finland"),
                    btcEur = it.optNullableDouble("btcEur"),
                    remedy = it.optNullableDouble("remedy")
                )
            },
            rates = rates?.let {
                SnapshotData.Rates(
                    euribor3m = it.optNullableDouble("euribor3m"),
                    yearAgo = it.optNullableDouble("yearAgo")
                )
            }
        )
    }

    private fun JSONObject.optObject(name: String): JSONObject? =
        if (has(name) && !isNull(name)) optJSONObject(name) else null

    private fun JSONObject.optNullableString(name: String): String? =
        if (has(name) && !isNull(name)) optString(name).takeIf { it.isNotBlank() } else null

    private fun JSONObject.optNullableDouble(name: String): Double? =
        if (has(name) && !isNull(name)) optDouble(name).takeUnless { it.isNaN() } else null

    companion object {
        private const val KEY_CACHE = "snapshot_json"
    }
}

class SnapshotUpdateWorker(
    appContext: Context,
    params: WorkerParameters
) : CoroutineWorker(appContext, params) {
    override suspend fun doWork(): Result {
        if (SnapshotRepository(applicationContext).fetchAndCache() != null) {
            SnapshotWidget().updateAll(applicationContext)
        }
        return Result.success()
    }

    companion object {
        private const val PERIODIC_NAME = "snapshot-widget-periodic"
        private const val IMMEDIATE_NAME = "snapshot-widget-immediate"

        fun schedule(context: Context) {
            val request = PeriodicWorkRequestBuilder<SnapshotUpdateWorker>(15, TimeUnit.MINUTES).build()
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
        SnapshotUpdateWorker.refreshNow(context)
    }
}

class SnapshotWidget : GlanceAppWidget() {
    override val sizeMode: SizeMode = SizeMode.Exact

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val cached = SnapshotRepository(context).loadCached()
        provideContent { SnapshotContent(cached) }
    }
}

private val Background = Color(0xFF0B0B0B)
private val Panel = Color(0xFF151514)
private val Foreground = Color(0xFFF2F2EE)
private val Muted = Color(0xFF8D8D88)
private val Line = Color(0xFF30302D)
private val Accent = Color(0xFFB7FF57)

private val labelStyle = TextStyle(
    color = ColorProvider(Muted),
    fontSize = 9.sp,
    fontWeight = FontWeight.Medium
)

private val valueStyle = TextStyle(
    color = ColorProvider(Foreground),
    fontSize = 19.sp,
    fontWeight = FontWeight.Bold
)

private val smallValueStyle = TextStyle(
    color = ColorProvider(Foreground),
    fontSize = 11.sp,
    fontWeight = FontWeight.Medium
)

@Composable
private fun SnapshotContent(data: SnapshotData?) {
    val size = LocalSize.current
    val compact = size.height < 150.dp || size.width < 235.dp

    Column(
        modifier = GlanceModifier
            .fillMaxSize()
            .background(Background)
            .cornerRadius(20.dp)
            .appWidgetBackground()
            .padding(if (compact) 10.dp else 14.dp)
    ) {
        Header(data)
        Spacer(GlanceModifier.height(8.dp))

        when {
            data == null -> EmptyState()
            compact -> CompactGrid(data)
            else -> FullGrid(data)
        }
    }
}

@Composable
private fun Header(data: SnapshotData?) {
    val openPage = actionStartActivity(
        Intent(Intent.ACTION_VIEW, Uri.parse(SnapshotConfig.PAGE_URL))
    )

    Row(
        modifier = GlanceModifier.fillMaxWidth(),
        verticalAlignment = Alignment.Vertical.CenterVertically
    ) {
        Column(modifier = GlanceModifier.defaultWeight().clickable(openPage)) {
            Text(
                text = "CURRENT / SNAPSHOT",
                style = TextStyle(
                    color = ColorProvider(Foreground),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold
                )
            )
            Text(
                text = data?.updated?.let { "UPDATED ${shortTime(it)}" } ?: "WAITING FOR DATA",
                style = labelStyle
            )
        }
        Text(
            text = "REFRESH",
            modifier = GlanceModifier
                .clickable(actionRunCallback<RefreshAction>())
                .padding(6.dp),
            style = TextStyle(
                color = ColorProvider(Accent),
                fontSize = 9.sp,
                fontWeight = FontWeight.Bold
            )
        )
    }
}

@Composable
private fun EmptyState() {
    Box(
        modifier = GlanceModifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.Horizontal.CenterHorizontally) {
            Text("NO DATA", style = valueStyle)
            Spacer(GlanceModifier.height(4.dp))
            Text("Tap REFRESH to load the latest data", style = labelStyle)
        }
    }
}

@Composable
private fun FullGrid(data: SnapshotData) {
    Row(modifier = GlanceModifier.fillMaxWidth()) {
        MetricBlock(
            modifier = GlanceModifier.defaultWeight(),
            index = "01",
            label = "WEATHER",
            value = formatTemperature(data.weather?.temperature),
            detail = listOfNotNull(
                data.weather?.location,
                minMax(data.weather?.min, data.weather?.max)
            ).joinToString(" / ")
        )
        Divider()
        MetricBlock(
            modifier = GlanceModifier.defaultWeight(),
            index = "02",
            label = "ELECTRICITY",
            value = formatPrice(data.electricity?.price),
            detail = "AVG ${formatNumber(data.electricity?.average)}  LOW ${formatNumber(data.electricity?.low)}  HIGH ${formatNumber(data.electricity?.high)}"
        )
    }

    Spacer(GlanceModifier.height(8.dp))

    Row(modifier = GlanceModifier.fillMaxWidth()) {
        MetricBlock(
            modifier = GlanceModifier.defaultWeight(),
            index = "03",
            label = "MARKETS",
            value = formatPercent(data.markets?.median),
            detail = "WORLD ${formatSigned(data.markets?.world)}  USA ${formatSigned(data.markets?.usa)}  FI ${formatSigned(data.markets?.finland)}  BTC ${formatSigned(data.markets?.btcEur)}"
        )
        Divider()
        MetricBlock(
            modifier = GlanceModifier.defaultWeight(),
            index = "04",
            label = "3M EURIBOR",
            value = formatPercent(data.rates?.euribor3m, signed = false),
            detail = data.rates?.yearAgo?.let { "1Y AGO ${formatPercent(it, signed = false)}" } ?: "1Y AGO --"
        )
    }
}

@Composable
private fun CompactGrid(data: SnapshotData) {
    Row(modifier = GlanceModifier.fillMaxWidth()) {
        CompactMetric(
            "WEATHER",
            formatTemperature(data.weather?.temperature),
            GlanceModifier.defaultWeight()
        )
        Spacer(GlanceModifier.width(6.dp))
        CompactMetric(
            "ELECTRICITY",
            formatPrice(data.electricity?.price),
            GlanceModifier.defaultWeight()
        )
    }
    Spacer(GlanceModifier.height(6.dp))
    Row(modifier = GlanceModifier.fillMaxWidth()) {
        CompactMetric(
            "MARKETS",
            formatPercent(data.markets?.median),
            GlanceModifier.defaultWeight()
        )
        Spacer(GlanceModifier.width(6.dp))
        CompactMetric(
            "3M EURIBOR",
            formatPercent(data.rates?.euribor3m, signed = false),
            GlanceModifier.defaultWeight()
        )
    }
}

@Composable
private fun MetricBlock(
    modifier: GlanceModifier,
    index: String,
    label: String,
    value: String,
    detail: String
) {
    Column(modifier = modifier.padding(horizontal = 4.dp)) {
        Text("$index / $label", style = labelStyle)
        Spacer(GlanceModifier.height(2.dp))
        Text(value, style = valueStyle)
        Spacer(GlanceModifier.height(2.dp))
        Text(detail.ifBlank { "--" }, style = labelStyle, maxLines = 2)
    }
}

@Composable
private fun CompactMetric(label: String, value: String, modifier: GlanceModifier) {
    Column(
        modifier = modifier
            .background(Panel)
            .cornerRadius(12.dp)
            .padding(8.dp)
    ) {
        Text(label, style = labelStyle)
        Text(value, style = smallValueStyle)
    }
}

@Composable
private fun Divider() {
    Box(
        modifier = GlanceModifier
            .width(1.dp)
            .height(52.dp)
            .background(Line)
    ) {}
}

private fun formatTemperature(value: Double?): String =
    value?.let { String.format(Locale.US, "%.1f°C", it) } ?: "--.-°C"

private fun formatPrice(value: Double?): String =
    value?.let { String.format(Locale.US, "%.2f c/kWh", it) } ?: "--.-- c/kWh"

private fun formatNumber(value: Double?): String =
    value?.let { String.format(Locale.US, "%.2f", it) } ?: "--"

private fun formatSigned(value: Double?): String =
    value?.let { String.format(Locale.US, "%+.1f%%", it) } ?: "--"

private fun formatPercent(value: Double?, signed: Boolean = true): String {
    if (value == null) return "--.-%"
    return if (signed) String.format(Locale.US, "%+.1f%%", value)
    else String.format(Locale.US, "%.2f%%", value)
}

private fun minMax(min: Double?, max: Double?): String =
    if (min == null && max == null) ""
    else "${formatTemperature(min)} / ${formatTemperature(max)}"

private fun shortTime(value: String): String {
    val time = Regex("T(\\d{2}:\\d{2})").find(value)?.groupValues?.getOrNull(1)
    return time ?: value.take(16)
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
