package fi.aapopihkala.snapshotwidget

import org.json.JSONArray
import org.json.JSONObject

data class WidgetTheme(
    val background: String,
    val panel: String,
    val foreground: String,
    val muted: String,
    val line: String,
    val accent: String,
    val positive: String,
    val negative: String
) {
    companion object {
        fun default() = WidgetTheme(
            background = "#1D2A35",
            panel = "#22323E",
            foreground = "#EEF2F4",
            muted = "#AAB4BC",
            line = "#64717B",
            accent = "#DCE4E8",
            positive = "#15967F",
            negative = "#C45F6C"
        )
    }
}

data class WidgetLayouts(
    val compact: List<String>,
    val medium: List<String>,
    val large: List<String>
) {
    companion object {
        fun default() = WidgetLayouts(
            compact = listOf("weather", "electricity", "markets", "rates"),
            medium = listOf("weather", "electricity", "markets", "rates"),
            large = listOf("weather", "electricity", "markets", "rates", "liiga")
        )
    }
}

data class WidgetItem(
    val label: String,
    val value: String,
    val tone: String = "neutral"
)

data class WidgetSection(
    val id: String,
    val index: String,
    val label: String,
    val primary: String,
    val secondary: String? = null,
    val detail: String? = null,
    val tone: String = "neutral",
    val span: String = "full",
    val layout: String = "stack",
    val countdownTargetMs: Long? = null,
    val rows: List<WidgetItem> = emptyList(),
    val columns: List<WidgetItem> = emptyList(),
    val bars: List<Double> = emptyList()
)

data class WidgetPayload(
    val schemaVersion: Int,
    val minEngineVersion: Int,
    val channel: String,
    val generatedAt: String,
    val refreshMinutes: Int,
    val title: String,
    val pageUrl: String,
    val theme: WidgetTheme,
    val layouts: WidgetLayouts,
    val sections: List<WidgetSection>
) {
    fun isCompatible(): Boolean =
        schemaVersion <= ENGINE_SCHEMA_VERSION && minEngineVersion <= ENGINE_VERSION

    companion object {
        const val ENGINE_VERSION = 2
        const val ENGINE_SCHEMA_VERSION = 2
    }
}

fun largeRows(sections: List<WidgetSection>): List<List<WidgetSection>> {
    val rows = mutableListOf<List<WidgetSection>>()
    var index = 0
    while (index < sections.size) {
        val section = sections[index]
        if (section.span == "half") {
            val next = sections.getOrNull(index + 1)?.takeIf { it.span == "half" }
            rows += if (next != null) listOf(section, next) else listOf(section)
            index += if (next != null) 2 else 1
        } else {
            rows += listOf(section)
            index += 1
        }
    }
    return rows
}

fun countdownElapsedRealtimeBase(
    targetEpochMs: Long,
    wallNowMs: Long,
    elapsedNowMs: Long,
): Long? {
    val remainingMs = targetEpochMs - wallNowMs
    return if (remainingMs > 0L) elapsedNowMs + remainingMs else null
}

object WidgetPayloadCodec {
    fun parse(json: String): WidgetPayload? = runCatching {
        val root = JSONObject(json)
        val themeObject = root.optJSONObject("theme")
        val defaultTheme = WidgetTheme.default()
        val theme = WidgetTheme(
            background = themeObject.stringOr("background", defaultTheme.background),
            panel = themeObject.stringOr("panel", defaultTheme.panel),
            foreground = themeObject.stringOr("foreground", defaultTheme.foreground),
            muted = themeObject.stringOr("muted", defaultTheme.muted),
            line = themeObject.stringOr("line", defaultTheme.line),
            accent = themeObject.stringOr("accent", defaultTheme.accent),
            positive = themeObject.stringOr("positive", defaultTheme.positive),
            negative = themeObject.stringOr("negative", defaultTheme.negative)
        )

        val layoutsObject = root.optJSONObject("layouts")
        val defaultLayouts = WidgetLayouts.default()
        val layouts = WidgetLayouts(
            compact = layoutsObject.stringList("compact").ifEmpty { defaultLayouts.compact },
            medium = layoutsObject.stringList("medium").ifEmpty { defaultLayouts.medium },
            large = layoutsObject.stringList("large").ifEmpty { defaultLayouts.large }
        )

        val sections = root.optJSONArray("sections").objects().mapNotNull { section ->
            val id = section.optString("id").takeIf { it.isNotBlank() } ?: return@mapNotNull null
            val primary = section.optString("primary").takeIf { it.isNotBlank() } ?: return@mapNotNull null
            WidgetSection(
                id = id,
                index = section.optString("index", "--"),
                label = section.optString("label", id.uppercase()),
                primary = primary,
                secondary = section.nullableString("secondary"),
                detail = section.nullableString("detail"),
                tone = section.optString("tone", "neutral"),
                span = section.enumOr("span", setOf("full", "half"), "full"),
                layout = section.enumOr("layout", setOf("stack", "split"), "stack"),
                countdownTargetMs = section.nullableLong("countdownTargetMs"),
                rows = section.optJSONArray("rows").items(),
                columns = section.optJSONArray("columns").items(),
                bars = section.optJSONArray("bars").numbers()
            )
        }

        WidgetPayload(
            schemaVersion = root.optInt("schemaVersion", 0),
            minEngineVersion = root.optInt("minEngineVersion", 1),
            channel = root.optString("channel", "prod"),
            generatedAt = root.optString("generatedAt"),
            refreshMinutes = root.optInt("refreshMinutes", 15).coerceAtLeast(15),
            title = root.optString("title", "CURRENT / SNAPSHOT"),
            pageUrl = root.optString("pageUrl", SnapshotEndpoints.PAGE_URL),
            theme = theme,
            layouts = layouts,
            sections = sections
        )
    }.getOrNull()

    fun encode(payload: WidgetPayload): String {
        val root = JSONObject()
            .put("schemaVersion", payload.schemaVersion)
            .put("minEngineVersion", payload.minEngineVersion)
            .put("channel", payload.channel)
            .put("generatedAt", payload.generatedAt)
            .put("refreshMinutes", payload.refreshMinutes)
            .put("title", payload.title)
            .put("pageUrl", payload.pageUrl)
            .put("theme", JSONObject()
                .put("background", payload.theme.background)
                .put("panel", payload.theme.panel)
                .put("foreground", payload.theme.foreground)
                .put("muted", payload.theme.muted)
                .put("line", payload.theme.line)
                .put("accent", payload.theme.accent)
                .put("positive", payload.theme.positive)
                .put("negative", payload.theme.negative)
            )
            .put("layouts", JSONObject()
                .put("compact", JSONArray(payload.layouts.compact))
                .put("medium", JSONArray(payload.layouts.medium))
                .put("large", JSONArray(payload.layouts.large))
            )

        val sections = JSONArray()
        payload.sections.forEach { section ->
            val objectValue = JSONObject()
                .put("id", section.id)
                .put("index", section.index)
                .put("label", section.label)
                .put("primary", section.primary)
                .put("tone", section.tone)
                .put("span", section.span)
                .put("layout", section.layout)
            section.secondary?.let { objectValue.put("secondary", it) }
            section.detail?.let { objectValue.put("detail", it) }
            section.countdownTargetMs?.let { objectValue.put("countdownTargetMs", it) }
            if (section.rows.isNotEmpty()) objectValue.put("rows", itemArray(section.rows))
            if (section.columns.isNotEmpty()) objectValue.put("columns", itemArray(section.columns))
            if (section.bars.isNotEmpty()) objectValue.put("bars", JSONArray(section.bars))
            sections.put(objectValue)
        }
        root.put("sections", sections)
        return root.toString()
    }

    private fun itemArray(items: List<WidgetItem>) = JSONArray().apply {
        items.forEach { item ->
            put(JSONObject()
                .put("label", item.label)
                .put("value", item.value)
                .put("tone", item.tone)
            )
        }
    }

    private fun JSONObject?.stringOr(name: String, fallback: String): String =
        this?.optString(name)?.takeIf { it.isNotBlank() } ?: fallback

    private fun JSONObject.enumOr(name: String, allowed: Set<String>, fallback: String): String {
        val value = optString(name).lowercase()
        return value.takeIf(allowed::contains) ?: fallback
    }

    private fun JSONObject.nullableString(name: String): String? =
        if (has(name) && !isNull(name)) optString(name).takeIf { it.isNotBlank() } else null

    private fun JSONObject.nullableLong(name: String): Long? =
        if (has(name) && !isNull(name)) optLong(name).takeIf { it > 0L } else null

    private fun JSONObject?.stringList(name: String): List<String> =
        this?.optJSONArray(name).strings()

    private fun JSONArray?.strings(): List<String> {
        if (this == null) return emptyList()
        return buildList {
            for (index in 0 until length()) {
                optString(index).takeIf { it.isNotBlank() }?.let(::add)
            }
        }
    }

    private fun JSONArray?.objects(): List<JSONObject> {
        if (this == null) return emptyList()
        return buildList {
            for (index in 0 until length()) optJSONObject(index)?.let(::add)
        }
    }

    private fun JSONArray?.items(): List<WidgetItem> = objects().mapNotNull { item ->
        val label = item.optString("label").takeIf { it.isNotBlank() } ?: return@mapNotNull null
        val value = item.optString("value").takeIf { it.isNotBlank() } ?: return@mapNotNull null
        WidgetItem(label, value, item.optString("tone", "neutral"))
    }

    private fun JSONArray?.numbers(): List<Double> {
        if (this == null) return emptyList()
        return buildList {
            for (index in 0 until length()) {
                if (isNull(index)) continue
                val value = optDouble(index)
                if (value.isFinite()) add(value)
            }
        }
    }
}
