package fi.aapopihkala.snapshotwidget

import android.content.Context
import java.io.IOException
import java.net.ConnectException
import java.net.HttpURLConnection
import java.net.SocketTimeoutException
import java.net.URL
import java.net.InetAddress
import java.net.UnknownHostException
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import javax.net.ssl.SSLException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import org.json.JSONObject

object SnapshotEndpoints {
    const val PRESENTATION_URL = "https://aapopihkala.fi/api/current/widget-v2?channel=prod"
    const val LEGACY_URL = "https://aapopihkala.fi/api/current/widget"
    const val PAGE_URL = "https://aapopihkala.fi/current/snapshot/"
}

private data class FetchTextResult(
    val body: String?,
    val status: String
)

internal data class WidgetFetchResult(
    val payload: WidgetPayload?,
    val status: String
)

internal data class WidgetFetchOutcome(
    val payload: WidgetPayload?,
    val v2Status: String,
    val legacyStatus: String,
    val v2Retried: Boolean,
)

internal data class WidgetFetchDiagnostics(
    val v2Status: String,
    val legacyStatus: String,
    val v2Retried: Boolean,
) {
    private fun v2Label(): String = "V2 $v2Status${if (v2Retried) "/R" else ""}"

    fun failureLabel(): String = "${v2Label()} · L $legacyStatus"

    fun legacyFallbackLabel(): String = "LEGACY · ${v2Label()}"
}

private val preservableSectionIds = setOf(
    "weather",
    "electricity",
    "markets",
    "rates",
    "hsl",
)

internal fun shouldRetryV2Status(status: String): Boolean {
    if (status in setOf("TIMEOUT", "DNS", "SSL", "CONNECT", "IO")) return true
    if (!status.startsWith("HTTP")) return false
    val code = status.removePrefix("HTTP").toIntOrNull() ?: return false
    return code == 408 || code == 425 || code == 429 || code in 500..599
}

internal suspend fun fetchWidgetPayloadWithFallback(
    primaryTimeoutMs: Int,
    retryTimeoutMs: Int,
    retryDelay: suspend () -> Unit,
    fetchV2: suspend (Int) -> WidgetFetchResult,
    fetchLegacy: suspend () -> WidgetFetchResult,
): WidgetFetchOutcome {
    var presentation = fetchV2(primaryTimeoutMs)
    var retried = false

    if (presentation.payload == null && shouldRetryV2Status(presentation.status)) {
        retried = true
        retryDelay()
        presentation = fetchV2(retryTimeoutMs)
    }

    val legacy = if (presentation.payload == null) {
        fetchLegacy()
    } else {
        WidgetFetchResult(null, "SKIP")
    }

    return WidgetFetchOutcome(
        payload = presentation.payload ?: legacy.payload,
        v2Status = presentation.status,
        legacyStatus = legacy.status,
        v2Retried = retried,
    )
}

internal fun widgetCacheJsonAfterFetch(
    previousCacheJson: String?,
    payload: WidgetPayload?,
): String? = payload?.let(WidgetPayloadCodec::encode) ?: previousCacheJson

internal fun mergeMissingExpectedSections(
    presentation: WidgetPayload,
    previous: WidgetPayload?,
): WidgetPayload {
    if (presentation.channel == "legacy" || previous == null || !previous.isCompatible()) {
        return presentation
    }

    val expectedIds = (
        presentation.layouts.compact +
            presentation.layouts.medium +
            presentation.layouts.large
        ).toSet()
    val currentIds = presentation.sections.mapTo(mutableSetOf()) { it.id }
    val carried = previous.sections
        .filter { section ->
            section.id in preservableSectionIds &&
                section.id in expectedIds &&
                section.id !in currentIds
        }
        .map { section ->
            if (section.observedAt != null || section.fetchedAt != null) section
            else section.copy(fetchedAt = previous.generatedAt)
        }

    return if (carried.isEmpty()) presentation
    else presentation.copy(sections = presentation.sections + carried)
}

internal fun weatherNeedsLegacyEnrichment(payload: WidgetPayload): Boolean {
    val weather = payload.sections.firstOrNull { it.id == "weather" } ?: return false
    return weather.rows.isEmpty() || weather.columns.isEmpty()
}

internal fun mergeLegacyWeather(
    presentation: WidgetPayload,
    legacy: WidgetPayload?,
): WidgetPayload {
    val legacyWeather = legacy?.sections?.firstOrNull { it.id == "weather" } ?: return presentation
    val presentationWeather = presentation.sections.firstOrNull { it.id == "weather" } ?: return presentation
    val mergedWeather = presentationWeather.copy(
        detail = presentationWeather.detail ?: legacyWeather.detail,
        rows = presentationWeather.rows.ifEmpty { legacyWeather.rows },
        columns = presentationWeather.columns.ifEmpty { legacyWeather.columns },
    )
    return presentation.copy(
        sections = presentation.sections.map { section ->
            if (section.id == "weather") mergedWeather else section
        }
    )
}

class WidgetRepository(context: Context) {
    private val appContext = context.applicationContext
    private val prefs = appContext.getSharedPreferences("snapshot_widget", Context.MODE_PRIVATE)

    suspend fun fetchAndCache(): WidgetPayload? = withContext(Dispatchers.IO) {
        val previousCacheJson = prefs.getString(KEY_CACHE, null)
        val outcome = fetchWidgetPayloadWithFallback(
            primaryTimeoutMs = PRESENTATION_TIMEOUT_MS,
            retryTimeoutMs = PRESENTATION_RETRY_TIMEOUT_MS,
            retryDelay = { delay(PRESENTATION_RETRY_DELAY_MS) },
            fetchV2 = { timeoutMs -> fetchPresentation(timeoutMs) },
            fetchLegacy = { fetchLegacyPayload() },
        )
        var payload = outcome.payload
        if (
            payload != null &&
            payload.channel != "legacy" &&
            weatherNeedsLegacyEnrichment(payload)
        ) {
            payload = mergeLegacyWeather(payload, fetchLegacyPayload().payload)
        }
        if (payload != null && payload.channel != "legacy") {
            val previousPayload = previousCacheJson
                ?.let(WidgetPayloadCodec::parse)
                ?.takeIf { it.isCompatible() }
            payload = mergeMissingExpectedSections(payload, previousPayload)
        }
        val cacheJson = widgetCacheJsonAfterFetch(previousCacheJson, payload)

        val editor = prefs.edit()
            .putString(KEY_V2_STATUS, outcome.v2Status)
            .putString(KEY_LEGACY_STATUS, outcome.legacyStatus)
            .putBoolean(KEY_V2_RETRIED, outcome.v2Retried)
            .putLong(KEY_LAST_ATTEMPT_MS, System.currentTimeMillis())

        cacheJson?.let { editor.putString(KEY_CACHE, it) }
        editor.putString(KEY_STATUS, if (payload != null) STATUS_OK else STATUS_ERROR)
        editor.apply()
        SnapshotTemporalRefreshScheduler.schedule(appContext, payload ?: loadCached())
        payload
    }

    fun loadCached(): WidgetPayload? {
        val json = prefs.getString(KEY_CACHE, null) ?: return null
        return WidgetPayloadCodec.parse(json)
            ?.takeIf { it.isCompatible() }
            ?.resolveTemporalSections(System.currentTimeMillis())
    }

    fun status(): String = prefs.getString(KEY_STATUS, STATUS_IDLE) ?: STATUS_IDLE

    internal fun diagnostics(): WidgetFetchDiagnostics = WidgetFetchDiagnostics(
        v2Status = prefs.getString(KEY_V2_STATUS, "IDLE") ?: "IDLE",
        legacyStatus = prefs.getString(KEY_LEGACY_STATUS, "IDLE") ?: "IDLE",
        v2Retried = prefs.getBoolean(KEY_V2_RETRIED, false),
    )

    fun markLoading() {
        prefs.edit().putString(KEY_STATUS, STATUS_LOADING).apply()
    }

    private fun fetchPresentation(timeoutMs: Int): WidgetFetchResult {
        val fetched = fetchText(SnapshotEndpoints.PRESENTATION_URL, timeoutMs)
        val parsed = fetched.body?.let(WidgetPayloadCodec::parse)
        val status = when {
            fetched.body == null -> fetched.status
            parsed == null -> "PARSE"
            !parsed.isCompatible() -> "COMPAT"
            parsed.sections.isEmpty() -> "EMPTY"
            else -> "OK"
        }
        return WidgetFetchResult(
            payload = parsed?.takeIf { it.isCompatible() && it.sections.isNotEmpty() },
            status = status,
        )
    }

    private fun fetchLegacyPayload(): WidgetFetchResult {
        val fetched = fetchText(SnapshotEndpoints.LEGACY_URL, LEGACY_TIMEOUT_MS)
        val body = fetched.body ?: return WidgetFetchResult(null, fetched.status)
        val root = runCatching { JSONObject(body) }.getOrNull()
            ?: return WidgetFetchResult(null, "PARSE")
        val sections = buildList {
            root.optJSONObject("weather")?.let(::legacyWeather)?.let(::add)
            root.optJSONObject("electricity")?.let(::legacyElectricity)?.let(::add)
            root.optJSONObject("markets")?.let(::legacyMarkets)?.let(::add)
            root.optJSONObject("rates")?.let(::legacyRates)?.let(::add)
        }
        if (sections.isEmpty()) return WidgetFetchResult(null, "EMPTY")

        return WidgetFetchResult(
            WidgetPayload(
                schemaVersion = 2,
                minEngineVersion = 2,
                channel = "legacy",
                generatedAt = root.optString("updated").takeIf { it.isNotBlank() } ?: isoNow(),
                refreshMinutes = 15,
                title = "CURRENT / SNAPSHOT",
                pageUrl = SnapshotEndpoints.PAGE_URL,
                theme = WidgetTheme.default(),
                layouts = WidgetLayouts.default(),
                sections = sections
            ),
            "OK"
        )
    }

    private fun legacyWeather(value: JSONObject): WidgetSection? {
        val temperature = value.finite("temperature")
        val low = value.finite("min")
        val high = value.finite("max")
        if (temperature == null && low == null && high == null) return null

        val condition = value.optString("condition").takeIf { it.isNotBlank() }
        val range = if (low == null && high == null) {
            null
        } else {
            listOfNotNull(low?.let(::degree), high?.let(::degree)).joinToString(" / ")
        }
        val detail = listOfNotNull(condition, range).joinToString(" / ").takeIf { it.isNotBlank() }
        val rows = buildList {
            low?.let { add(WidgetItem("LOW", degree(it))) }
            high?.let { add(WidgetItem("HIGH", degree(it))) }
        }
        val columns = buildList {
            val forecast = value.optJSONArray("forecast")
            if (forecast != null) {
                for (index in 0 until forecast.length()) {
                    val item = forecast.optJSONObject(index) ?: continue
                    val time = item.optString("time").takeIf { it.isNotBlank() } ?: continue
                    val forecastTemperature = item.finite("temperature") ?: continue
                    add(WidgetItem(time, degree(forecastTemperature)))
                    if (size >= 6) break
                }
            }
        }

        return WidgetSection(
            id = "weather",
            index = "01",
            label = "WEATHER",
            primary = temperature(temperature),
            secondary = value.optString("location").takeIf { it.isNotBlank() },
            detail = detail,
            rows = rows,
            columns = columns,
        )
    }

    private fun legacyElectricity(value: JSONObject): WidgetSection? {
        val current = value.finite("price")
        val average = value.finite("average")
        val low = value.finite("low")
        val high = value.finite("high")
        if (listOf(current, average, low, high).all { it == null }) return null
        return WidgetSection(
            id = "electricity",
            index = "02",
            label = "ELECTRICITY",
            primary = price(average),
            secondary = "DAY AVG / TODAY",
            detail = "NOW ${number(current)}  LOW ${number(low)}  HIGH ${number(high)}"
        )
    }

    private fun legacyMarkets(value: JSONObject): WidgetSection? {
        val median = value.finite("median")
        val rows = listOf(
            marketRow("WORLD", value.finite("world")),
            marketRow("USA", value.finite("usa")),
            marketRow("FINLAND", value.finite("finland")),
            marketRow("BTC / EUR", value.finite("btcEur")),
            marketRow("REMEDY", value.finite("remedy"))
        )
        if (median == null && rows.all { it.value == "--" }) return null
        return WidgetSection(
            id = "markets",
            index = "03",
            label = "MARKETS",
            primary = percent(median, signed = true),
            secondary = "1D / MEDIAN",
            tone = tone(median),
            rows = rows
        )
    }

    private fun legacyRates(value: JSONObject): WidgetSection? {
        val current = value.finite("euribor3m")
        val yearAgo = value.finite("yearAgo")
        if (current == null && yearAgo == null) return null
        return WidgetSection(
            id = "rates",
            index = "04",
            label = "RATES",
            primary = percent(current, signed = false),
            secondary = "3M EURIBOR",
            detail = "1Y AGO ${percent(yearAgo, signed = false)}"
        )
    }

    private fun fetchText(url: String, timeoutMs: Int): FetchTextResult {
        var connection: HttpURLConnection? = null
        return try {
            connection = (URL(url).openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                connectTimeout = timeoutMs
                readTimeout = timeoutMs
                instanceFollowRedirects = true
                setRequestProperty("Accept", "application/json")
                setRequestProperty("User-Agent", "SnapshotWidget/${BuildConfig.VERSION_NAME}")
                setRequestProperty("Referer", SnapshotEndpoints.PAGE_URL)
                setRequestProperty("Cache-Control", "no-cache")
            }
            val code = connection.responseCode
            if (code !in 200..299) {
                FetchTextResult(null, "HTTP$code")
            } else {
                FetchTextResult(
                    connection.inputStream.bufferedReader().use { it.readText() },
                    "OK"
                )
            }
        } catch (_: SocketTimeoutException) {
            FetchTextResult(null, "TIMEOUT")
        } catch (_: UnknownHostException) {
            // Android can retain a transient negative DNS result for the process even after
            // connectivity has recovered. A fresh resolver lookup gives the retry path a
            // chance to recover instead of leaving the widget on its stale device cache.
            runCatching { InetAddress.getAllByName(URL(url).host) }
            FetchTextResult(null, "DNS")
        } catch (_: SSLException) {
            FetchTextResult(null, "SSL")
        } catch (_: ConnectException) {
            FetchTextResult(null, "CONNECT")
        } catch (_: SecurityException) {
            FetchTextResult(null, "SECURITY")
        } catch (_: IOException) {
            FetchTextResult(null, "IO")
        } catch (error: Exception) {
            val name = error.javaClass.simpleName
                .removeSuffix("Exception")
                .uppercase(Locale.US)
                .take(12)
            FetchTextResult(null, if (name.isBlank()) "ERROR" else name)
        } finally {
            connection?.disconnect()
        }
    }

    private fun JSONObject.finite(name: String): Double? {
        if (!has(name) || isNull(name)) return null
        val value = optDouble(name)
        return value.takeIf { it.isFinite() }
    }

    private fun marketRow(label: String, value: Double?) =
        WidgetItem(label, percent(value, signed = true), tone(value))

    private fun tone(value: Double?): String = when {
        value == null || value == 0.0 -> "neutral"
        value > 0.0 -> "positive"
        else -> "negative"
    }

    private fun temperature(value: Double?): String =
        value?.let { String.format(Locale.US, "%.1f°C", it) } ?: "--.-°C"

    private fun degree(value: Double): String =
        String.format(Locale.US, "%.0f°", value)

    private fun price(value: Double?): String =
        value?.let { String.format(Locale.US, "%.2f c/kWh", it) } ?: "--.-- c/kWh"

    private fun number(value: Double?): String =
        value?.let { String.format(Locale.US, "%.2f", it) } ?: "--"

    private fun percent(value: Double?, signed: Boolean): String {
        if (value == null) return "--"
        return if (signed) String.format(Locale.US, "%+.2f%%", value)
        else String.format(Locale.US, "%.2f%%", value)
    }

    private fun isoNow(): String =
        SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }.format(Date())

    companion object {
        private const val PRESENTATION_TIMEOUT_MS = 12_000
        private const val PRESENTATION_RETRY_TIMEOUT_MS = 6_500
        private const val PRESENTATION_RETRY_DELAY_MS = 750L
        private const val LEGACY_TIMEOUT_MS = 7_000
        private const val KEY_CACHE = "snapshot_payload_v2"
        private const val KEY_STATUS = "snapshot_status"
        private const val KEY_V2_STATUS = "snapshot_v2_status"
        private const val KEY_LEGACY_STATUS = "snapshot_legacy_status"
        private const val KEY_V2_RETRIED = "snapshot_v2_retried"
        private const val KEY_LAST_ATTEMPT_MS = "snapshot_last_attempt_ms"
        const val STATUS_IDLE = "idle"
        const val STATUS_LOADING = "loading"
        const val STATUS_OK = "ok"
        const val STATUS_ERROR = "error"
    }
}
