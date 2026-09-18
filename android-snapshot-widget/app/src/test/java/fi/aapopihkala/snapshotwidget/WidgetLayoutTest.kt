package fi.aapopihkala.snapshotwidget

import org.junit.Assert.assertEquals
import org.junit.Test

class WidgetLayoutTest {
    private fun section(id: String, span: String = "full") = WidgetSection(
        id = id,
        index = "01",
        label = id.uppercase(),
        primary = id,
        span = span
    )

    @Test
    fun `large rows keep full sections on their own rows`() {
        val rows = largeRows(
            listOf(
                section("weather"),
                section("electricity"),
                section("rates", span = "half"),
                section("liiga", span = "half")
            )
        )

        assertEquals(listOf("weather"), rows[0].map { it.id })
        assertEquals(listOf("electricity"), rows[1].map { it.id })
        assertEquals(listOf("rates", "liiga"), rows[2].map { it.id })
    }

    @Test
    fun `large rows do not pair a half section across a full section`() {
        val rows = largeRows(
            listOf(
                section("rates", span = "half"),
                section("markets"),
                section("liiga", span = "half")
            )
        )

        assertEquals(listOf("rates"), rows[0].map { it.id })
        assertEquals(listOf("markets"), rows[1].map { it.id })
        assertEquals(listOf("liiga"), rows[2].map { it.id })
    }

    @Test
    fun `section presentation defaults remain backwards compatible`() {
        val section = section("legacy")

        assertEquals("full", section.span)
        assertEquals("stack", section.layout)
    }

    @Test
    fun `large half support row skips duplicated summary rows`() {
        val section = WidgetSection(
            id = "liiga",
            index = "06",
            label = "LIIGA",
            primary = "6/17",
            secondary = "KALPA - ILVES",
            detail = "FRI 18 18:30",
            span = "half",
            rows = listOf(
                WidgetItem(label = "NEXT", value = "KALPA - ILVES"),
                WidgetItem(label = "START", value = "FRI 18 18:30"),
                WidgetItem(label = "LAST", value = "ILVES 3-2 HIFK")
            )
        )

        assertEquals("LAST", largeHalfSupportRow(section)?.label)
        assertEquals("ILVES 3-2 HIFK", largeHalfSupportRow(section)?.value)
    }

    @Test
    fun `HSL support rows exclude current departure and keep five following`() {
        val section = WidgetSection(
            id = "hsl",
            index = "04",
            label = "HSL",
            primary = "5 MIN",
            countdownTargetMs = 1_000L,
            rows = listOf(
                WidgetItem(label = "121", value = "16:10", countdownTargetMs = 1_000L),
                WidgetItem(label = "125", value = "16:17", countdownTargetMs = 2_000L),
                WidgetItem(label = "121", value = "16:25", countdownTargetMs = 3_000L),
                WidgetItem(label = "125", value = "16:35", countdownTargetMs = 4_000L),
                WidgetItem(label = "121", value = "16:45", countdownTargetMs = 5_000L),
                WidgetItem(label = "125", value = "16:55", countdownTargetMs = 6_000L),
            )
        )

        assertEquals(
            listOf("16:17", "16:25", "16:35", "16:45", "16:55"),
            visibleSupportRows(section).take(5).map { it.value }
        )
    }

    @Test
    fun `electricity detail keeps low high tomorrow and month on three compact rows`() {
        assertEquals(
            listOf(
                "LOW 1.56  HIGH 12.53",
                "TOMORROW AVG 2.22",
                "MONTH AVG 6.62"
            ),
            electricityDetailLines(
                "LOW 1.56  HIGH 12.53\nTOMORROW AVG 2.22\nMONTH AVG 6.62"
            )
        )
        assertEquals(
            listOf("LOW 1.56   HIGH 12.53", "MONTH AVG 6.62"),
            electricityDetailLines("MONTH AVG 6.62  LOW 1.56  HIGH 12.53")
        )
    }

    @Test
    fun `electricity primary separates value and unit`() {
        val parts = electricityPrimaryParts("16.35 c/kWh")

        assertEquals("16.35", parts.value)
        assertEquals("c/kWh", parts.unit)
        assertEquals(null, electricityPrimaryParts("16.35").unit)
    }

    @Test
    fun `large widget typography keeps primary values and header internally consistent`() {
        assertEquals(WidgetTypography.PRIMARY_HALF, WidgetTypography.PRIMARY_FULL)
        assertEquals(22, WidgetTypography.PRIMARY_FULL)
        assertEquals(16, WidgetTypography.HEADER)
    }

}
