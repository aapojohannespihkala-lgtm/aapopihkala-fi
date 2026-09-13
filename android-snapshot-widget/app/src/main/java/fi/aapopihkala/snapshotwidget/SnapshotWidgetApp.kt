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
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import java.util.concurrent.TimeUnit
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.withContext
import org.json.JSONArray
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
    const val ELECTRICITY_URL = "https://aapopihkala.fi/api/current/electricity"
    const val PORTFOLIO_URL = "https://aapopihkala.fi/api/current/markets?portfolio=1"
    const val MARKETS_URL = "https://aapopihkala.fi/api/current/markets"
    const val PAGE_URL = "https://aapopihkala.fi/current/snapshot/"
    const val WEATHER_URL = "https://api.open-meteo.com/v1/forecast?latitude=60.1719&longitude=24.7314&timezone=Europe%2FHelsinki&forecast_days=1&temperature_unit=celsius&current=temperature_2m&daily=temperature_2m_min%2Ctemperature_2m_max"
}

class SnapshotRepository(context: Context) {
    private val prefs = context.getSharedPreferences("snapshot_widget", Context.MODE_PRIVATE)

    suspend fun fetchAndCache(): SnapshotData? = withContext(Dispatchers.IO) {
        val primary = runCatching { fetchPrimary() }.getOrNull()?.takeIf { it.hasAnyData() }
        val data = primary ?: runCatching { fetchFallback() }.getOrNull()
        if (data != null && data.hasAnyData()) {
            prefs.edit()
                .putString(KEY_CACHE, toJson(data))
                .putString(KEY_STATUS, STATUS_OK)
                .apply()
            data
        } else {
            prefs.edit().putString(KEY_STATUS, STATUS_ERROR).apply()
            null
        }
    }

    fun loadCached(): SnapshotData? {
        val json = prefs.getString(KEY_CACHE, null) ?: return null
        return runCatching { parse(json) }.getOrNull()
    }

    fun status(): String = prefs.getString(KEY_STATUS, STATUS_IDLE) ?: STATUS_IDLE

    fun markLoading() {
        prefs.edit().putString(KEY_STATUS, STATUS_LOADING).apply()
    }

    private fun fetchPrimary(): SnapshotData? {
        val root = fetchJson(SnapshotConfig.DATA_URL, 5_000) ?: return null
        return parse(root.toString())
    }

    private suspend fun fetchFallback(): SnapshotData? = coroutineScope {
        val weather = async(Dispatchers.IO) { runCatching { loadWeather() }.getOrNull() }
        val electricity = async(Dispatchers.IO) { runCatching { loadElectricity() }.getOrNull() }
        val markets = async(Dispatchers.IO) { runCatching { loadMarkets() }.getOrNull() }
        val rates = async(Dispatchers.IO) { runCatching { loadRates() }.getOrNull() }
        SnapshotData(
            updated = isoNow(),
            weather = weather.await(),
            electricity = electricity.await(),
            markets = markets.await(),
            rates = rates.await()
        ).takeIf { it.hasAnyData() }
    }

    private fun loadWeather(): SnapshotData.Weather? {
        val root = fetchJson(SnapshotConfig.WEATHER_URL, 5_000) ?: return null
        val current = root.optJSONObject("current")
        val daily = root.optJSONObject("daily")
        val temperature = current?.optFiniteDouble("temperature_2m") ?: return null
        return SnapshotData.Weather(
            location = "OLARI / ESPOO",
            temperature = temperature,
            min = daily?.optJSONArray("temperature_2m_min")?.optFiniteDouble(0),
            max = daily?.optJSONArray("temperature_2m_max")?.optFiniteDouble(0)
        )
    }

    private fun loadElectricity(): SnapshotData.Electricity? {
        val root = fetchJson(SnapshotConfig.ELECTRICITY_URL, 5_000) ?: return null
        val prices = root.optJSONArray("prices") ?: return null
        val now = Date()
        val today = localDateKey(now)
        val dayPoints = mutableListOf<PricePoint>()

        for (i in 0 until prices.length()) {
            val item = prices.optJSONObject(i) ?: continue
            val price = item.optFiniteDouble("price") ?: continue
            val start = parseIsoDate(item.optString("startDate")) ?: continue
            val end = parseIsoDate(item.optString("endDate")) ?: continue
            if (localDateKey(start) == today) dayPoints += PricePoint(price, start, end)
        }
        if (dayPoints.isEmpty()) return null

        val values = dayPoints.map { it.price }
        val current = dayPoints.firstOrNull { now.time >= it.start.time && now.time < it.end.time }
            ?: dayPoints.filter { it.start.time <= now.time }.maxByOrNull { it.start.time }

        return SnapshotData.Electricity(
            price = current?.price,
            average = values.average(),
            low = values.minOrNull(),
            high = values.maxOrNull()
        )
    }

    private fun loadMarkets(): SnapshotData.Markets? {
        val root = fetchJson(SnapshotConfig.PORTFOLIO_URL, 6_000) ?: return null
        val items = root.optJSONArray("items") ?: return null
        val values = mutableListOf<Double>()
        val byId = mutableMapOf<String, Double>()

        for (i in 0 until items.length()) {
            val item = items.optJSONObject(i) ?: continue
            val id = item.optString("id").takeIf { it.isNotBlank() } ?: continue
            val today = item.optJSONObject("changes")?.optFiniteDouble("today") ?: continue
            values += today
            byId[id] = today
        }
        if (values.isEmpty()) return null

        return SnapshotData.Markets(
            median = median(values),
            world = byId["ishares-world"],
            usa = byId["handelsbanken-usa"],
            finland = byId["nordnet-finland"],
            btcEur = byId["btc"],
            remedy = byId["remedy"]
        )
    }

    private fun loadRates(): SnapshotData.Rates? {
        val root = fetchJson(SnapshotConfig.MARKETS_URL, 6_000) ?: return null
        val items = root.optJSONArray("items") ?: return null
        var current: Double? = null
        for (i in 0 until items.length()) {
            val item = items.optJSONObject(i) ?: continue
            if (item.optString("id") == "euribor-3m") {
                current = item.optFiniteDouble("value")
                break
            }
        }
        current ?: return null

        var yearAgo: Double? = null
        val series = root.optJSONArray("series")
        if (series != null) {
            for (i in 0 until series.length()) {
                val item = series.optJSONObject(i) ?: continue
                if (item.optString("id") != "euribor-3m") continue
                val change1y = item.optFiniteDouble("change1y")
                if (change1y != null) yearAgo = current - change1y
                if (yearAgo == null) {
                    val points = item.optJSONArray("points")
                    if (points != null) {
                        for (j in 0 until points.length()) {
                            yearAgo = points.optJSONObject(j)?.optFiniteDouble("value")
                            if (yearAgo != null) break
                        }
                    }
                }
                break
            }
        }
        return SnapshotData.Rates(current, yearAgo)
    }

    private fun fetchJson(url: String, timeoutMs: Int): JSONObject? {
        val connection = (URL(url).openConnection() as HttpURLConnection).apply {
            requestMethod = "GET"
            connectTimeout = timeoutMs
            readTimeout = timeoutMs
            instanceFollowRedirects = true
            setRequestProperty("Accept", "application/json")
            setRequestProperty("User-Agent", "SnapshotWidget/1.1")
            setRequestProperty("Referer", SnapshotConfig.PAGE_URL)
        }
        return try {
            if (connection.responseCode !in 200..299) return null
            val body = connection.inputStream.bufferedReader().use { it.readText() }
            JSONObject(body)
        } finally {
            connection.disconnect()
        }
    }

    private fun parse(json: String): SnapshotData {
        val root = JSONObject(json)
        val weather = root.optJSONObject("weather")
        val electricity = root.optJSONObject("electricity")
        val markets = root.optJSONObject("markets")
        val rates = root.optJSONObject("rates")
        return SnapshotData(
            updated = root.optNullableString("updated"),
            weather = weather?.let {
                SnapshotData.Weather(
                    it.optNullableString("location"),
                    it.optFiniteDouble("temperature"),
                    it.optFiniteDouble("min"),
                    it.optFiniteDouble("max")
                )
            },
            electricity = electricity?.let {
                SnapshotData.Electricity(
                    it.optFiniteDouble("price"),
                    it.optFiniteDouble("average"),
                    it.optFiniteDouble("low"),
                    it.optFiniteDouble("high")
                )
            },
            markets = markets?.let {
                SnapshotData.Markets(
                    it.optFiniteDouble("median"),
                    it.optFiniteDouble("world"),
                    it.optFiniteDouble("usa"),
                    it.optFiniteDouble("finland"),
                    it.optFiniteDouble("btcEur"),
                    it.optFiniteDouble("remedy")
                )
            },
            rates = rates?.let {
                SnapshotData.Rates(
                    it.optFiniteDouble("euribor3m"),
                    it.optFiniteDouble("yearAgo")
                )
            }
        )
    }

    private fun toJson(data: SnapshotData): String {
        val root = JSONObject().putNullable("updated", data.updated)
        root.putNullable("weather", data.weather?.let {
            JSONObject()
                .putNullable("location", it.location)
                .putNullable("temperature", it.temperature)
                .putNullable("min", it.min)
                .putNullable("max", it.max)
        })
        root.putNullable("electricity", data.electricity?.let {
            JSONObject()
                .putNullable("price", it.price)
                .putNullable("average", it.average)
                .putNullable("low", it.low)
                .putNullable("high", it.high)
        })
        root.putNullable("markets", data.markets?.let {
            JSONObject()
                .putNullable("median", it.median)
                .putNullable("world", it.world)
                .putNullable("usa", it.usa)
                .putNullable("finland", it.finland)
                .putNullable("btcEur", it.btcEur)
                .putNullable("remedy", it.remedy)
        })
        root.putNullable("rates", data.rates?.let {
            JSONObject()
                .putNullable("euribor3m", it.euribor3m)
                .putNullable("yearAgo", it.yearAgo)
        })
        return root.toString()
    }

    private fun SnapshotData.hasAnyData() =
        weather != null || electricity != null || markets != null || rates != null

    private fun JSONObject.optNullableString(name: String): String? =
        if (has(name) && !isNull(name)) optString(name).takeIf { it.isNotBlank() } else null

    private fun JSONObject.optFiniteDouble(name: String): Double? =
        if (has(name) && !isNull(name)) optDouble(name).takeUnless { it.isNaN() || it.isInfinite() } else null

    private fun JSONArray.optFiniteDouble(index: Int): Double? =
        if (index in 0 until length() && !isNull(index)) optDouble(index).takeUnless { it.isNaN() || it.isInfinite() } else null

    private fun JSONObject.putNullable(name: String, value: Any?): JSONObject =
        put(name, value ?: JSONObject.NULL)

    private fun median(values: List<Double>): Double {
        val sorted = values.sorted()
        val middle = sorted.size / 2
        return if (sorted.size % 2 == 1) sorted[middle]
        else (sorted[middle - 1] + sorted[middle]) / 2.0
    }

    private fun localDateKey(date: Date): String =
        SimpleDateFormat("yyyy-MM-dd", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("Europe/Helsinki")
        }.format(date)

    private fun parseIsoDate(value: String): Date? {
        if (value.isBlank()) return null
        val patterns = listOf(
            "yyyy-MM-dd'T'HH:mm:ss.SSSXXX",
            "yyyy-MM-dd'T'HH:mm:ssXXX",
            "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
            "yyyy-MM-dd'T'HH:mm:ss'Z'"
        )
        for (pattern in patterns) {
            val parsed = runCatching {
                SimpleDateFormat(pattern, Locale.US).apply {
                    isLenient = false
                    timeZone = TimeZone.getTimeZone("UTC")
                }.parse(value)
            }.getOrNull()
            if (parsed != null) return parsed
        }
        return null
    }

    private fun isoNow(): String =
        SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }.format(Date())

    private data class PricePoint(val price: Double, val start: Date, val end: Date)

    companion object {
        private const val KEY_CACHE = "snapshot_json"
        private const val KEY_STATUS = "snapshot_status"
        const val STATUS_IDLE = "idle"
        const val STATUS_LOADING = "loading"
        const val STATUS_OK = "ok"
        const val STATUS_ERROR = "error"
    }
}

class SnapshotUpdateWorker(
    appContext: Context,
    params: WorkerParameters
) : CoroutineWorker(appContext, params) {
    override suspend fun doWork(): Result {
        val repository = SnapshotRepository(applicationContext)
        val data = repository.fetchAndCache()
        SnapshotWidget().updateAll(applicationContext)
        return if (data != null) Result.success() else Result.retry()
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
        val repository = SnapshotRepository(context)
        repository.markLoading()
        SnapshotWidget().updateAll(context)
        repository.fetchAndCache()
        SnapshotWidget().updateAll(context)
    }
}

class SnapshotWidget : GlanceAppWidget() {
    override val sizeMode: SizeMode = SizeMode.Exact

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val repository = SnapshotRepository(context)
        val cached = repository.loadCached()
        val status = repository.status()
        provideContent { SnapshotContent(cached, status) }
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
private fun SnapshotContent(data: SnapshotData?, status: String) {
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
        Header(data, status)
        Spacer(GlanceModifier.height(8.dp))

        when {
            data == null -> EmptyState(status)
            compact -> CompactGrid(data)
            else -> FullGrid(data)
        }
    }
}

@Composable
private fun Header(data: SnapshotData?, status: String) {
    val openPage = actionStartActivity(
        Intent(Intent.ACTION_VIEW, Uri.parse(SnapshotConfig.PAGE_URL))
    )
    val statusText = when {
        status == SnapshotRepository.STATUS_LOADING -> "LOADING DATA"
        status == SnapshotRepository.STATUS_ERROR && data == null -> "CONNECTION ERROR"
        data?.updated != null -> "UPDATED ${shortTime(data.updated)}"
        else -> "WAITING FOR DATA"
    }

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
            Text(text = statusText, style = labelStyle)
        }
        Text(
            text = if (status == SnapshotRepository.STATUS_LOADING) "..." else "REFRESH",
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
private fun EmptyState(status: String) {
    Box(
        modifier = GlanceModifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.Horizontal.CenterHorizontally) {
            Text(
                if (status == SnapshotRepository.STATUS_LOADING) "LOADING..." else if (status == SnapshotRepository.STATUS_ERROR) "NO CONNECTION" else "NO DATA",
                style = valueStyle
            )
            Spacer(GlanceModifier.height(4.dp))
            Text(
                if (status == SnapshotRepository.STATUS_ERROR) "Tap REFRESH to try again" else "Tap REFRESH to load the latest data",
                style = labelStyle
            )
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
