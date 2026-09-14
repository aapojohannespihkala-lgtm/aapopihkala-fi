package fi.aapopihkala.snapshotwidget

import org.junit.Assert.assertEquals
import org.junit.Test

class WidgetNavigationTest {
    @Test
    fun acceptsTrustedHttpsPageUrls() {
        val trusted = "https://aapopihkala.fi/current/snapshot/?source=widget"
        val explicitHttpsPort = "https://aapopihkala.fi:443/current/snapshot/"

        assertEquals(trusted, safeSnapshotPageUrl(trusted))
        assertEquals(explicitHttpsPort, safeSnapshotPageUrl(explicitHttpsPort))
    }

    @Test
    fun rejectsUntrustedOrMalformedPageUrls() {
        val rejected = listOf(
            "http://aapopihkala.fi/current/snapshot/",
            "https://aapopihkala.fi.evil.example/current/snapshot/",
            "https://evil.example/current/snapshot/",
            "https://user@aapopihkala.fi/current/snapshot/",
            "https://aapopihkala.fi:8443/current/snapshot/",
            "/current/snapshot/",
            "not a url",
            "",
        )

        rejected.forEach { value ->
            assertEquals(SnapshotEndpoints.PAGE_URL, safeSnapshotPageUrl(value))
        }
        assertEquals(SnapshotEndpoints.PAGE_URL, safeSnapshotPageUrl(null))
    }

    @Test
    fun payloadCodecSanitizesCachedPageUrl() {
        val payload = WidgetPayload(
            schemaVersion = 2,
            minEngineVersion = 2,
            channel = "prod",
            generatedAt = "2026-09-14T06:00:00Z",
            refreshMinutes = 15,
            title = "CURRENT / SNAPSHOT",
            pageUrl = "https://evil.example/phishing",
            theme = WidgetTheme.default(),
            layouts = WidgetLayouts.default(),
            sections = emptyList(),
        )

        val decoded = WidgetPayloadCodec.parse(WidgetPayloadCodec.encode(payload))

        assertEquals(SnapshotEndpoints.PAGE_URL, decoded?.pageUrl)
    }
}
