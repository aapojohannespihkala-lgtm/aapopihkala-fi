package fi.aapopihkala.snapshotwidget

import android.content.Context
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject

object SnapshotEndpoints {
    const val PRESENTATION_URL = "https://aapopihkala.fi/api/current/widget-v2?channel=prod"
    const val LEGACY_URL = "https://aapopihkala.fi/api/current/widget"
    const val PAGE_URL = "https://aapopihkala.fi/current/snapshot/"
}

class WidgetRepository(context: Context) {
    private val prefs = context.getSharedPreferences("snapshot_widget", Context.MODE_PRIVATE)

    suspend fun fetchAndCache(): WidgetPayload? = withContext(Dispatchers.IO) {
        val remote = fetchText(SnapshotEndpoints.PRESENTATION_URL, 7_000)
            ?.let(WidgetPayloadCodec::parse)
            ?.takeIf { it.isCompatible() && it.sections.isNotEmpty() }

        val payload = (remote ?: fetchLegacyPayload())?.let(::tagBuildVersion)
        if (payload != null) {
            prefs.edit()
                .putString(KEY_CACHE, WidgetPayloadCodec.encode(payload))
                .putString(KEY_STATUS, STATUS_OK)
                .apply()
        } else {
            prefs.edit().putString(KEY_STATUS, STATUS_ERROR).apply()
        }
        payload
    }

    fun loadCached(): WidgetPayload? {
        val json = prefs.getString(KEY_CACHE, null) ?: return null
        return WidgetPayloadCodec.parse(json)?.takeIf { it.isCompatible() }
    }

    fun status(): String = prefs.getString(KEY_STATUS, STATUS_IDLE) ?: STATUS_IDLE

    fun markLoading() {
        prefs.edit().putString(KEY_STATUS, STATUS_LOADING).apply()
    }

    private fun tagBuildVersion(payload: WidgetPayload): WidgetPayload {
        val marker = "v${BuildConfig.VERSION_NAME}"
        return payload.copy(
            sections = payload.sections.map { section ->
                if (section.id == "weather") {
                    section.copy(label = "${section.label} · $marker")
                } else {
                    section
                }
            }
        )
    }

    private fun fetchLegacyPayload(): WidgetPayload? {
        val body = fetchText(SnapshotEndpoints.LEGACY_URL, 7_000) ?: return null
        val root = runCatching { JSONObject(body) }.getOrNull() ?: return null
        val sections = buildList {
            root.optJSONObject("weather")?.let(::legacyWeather)?.let(::add)
            root.optJSONObject("electricity")?.let(::legacyElectricity)?.let(::add)
            root.optJSONObject("markets")?.let(::legacyMarkets)?.let(::add)
            root.optJSONObject("rates")?.let(::legacyRates)?.let(::add)
        }
        if (sections.isEmpty()) return null

        return WidgetPayload(
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
        )
    }

    private fun legacyWeather(value: JSONObject): WidgetSection? {
        val temperature = value.finite("temperature")
        val low = value.finite("min")
        val high = value.finite("max")
        if (temperature == null && low == null && high == null) return null
        val detail = if (low == null && high == null) null else "${temperature(low)} / ${temperature(high)}"
        return WidgetSection(
            id = "weather",
            index = "01",
            label = "WEATHER",
            primary = temperature(temperature),
            secondary = value.optString("location").takeIf { it.isNotBlank() },
            detail = detail
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

    private fun fetchText(url: String, timeoutMs: Int): String? {
        val connection = (URL(url).openConnection() as HttpURLConnection).apply {
            requestMethod = "GET"
            connectTimeout = timeoutMs
            readTimeout = timeoutMs
            instanceFollowRedirects = true
            setRequestProperty("Accept", "application/json")
            setRequestProperty("User-Agent", "SnapshotWidget/${BuildConfig.VERSION_NAME}")
            setRequestProperty("Referer", SnapshotEndpoints.PAGE_URL)
        }
        return try {
            if (connection.responseCode !in 200..299) return null
            connection.inputStream.bufferedReader().use { it.readText() }
        } catch (_: Exception) {
            null
        } finally {
            connection.disconnect()
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
        private const val KEY_CACHE = "snapshot_payload_v2"
        private const val KEY_STATUS = "snapshot_status"
        const val STATUS_IDLE = "idle"
        const val STATUS_LOADING = "loading"
        const val STATUS_OK = "ok"
        const val STATUS_ERROR = "error"
    }
}
