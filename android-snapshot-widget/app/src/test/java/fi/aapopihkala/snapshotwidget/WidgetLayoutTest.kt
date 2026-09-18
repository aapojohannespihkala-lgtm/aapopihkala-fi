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
                WidgetRow(label = "NEXT", value = "KALPA - ILVES"),
                WidgetRow(label = "START", value = "FRI 18 18:30"),
                WidgetRow(label = "LAST", value = "ILVES 3-2 HIFK")
            )
        )

        assertEquals("LAST", largeHalfSupportRow(section)?.label)
        assertEquals("ILVES 3-2 HIFK", largeHalfSupportRow(section)?.value)
    }

    @Test
    fun `electricity primary separates value and unit`() {
        val parts = electricityPrimaryParts("16.35 c/kWh")

        assertEquals("16.35", parts.value)
        assertEquals("c/kWh", parts.unit)
        assertEquals(null, electricityPrimaryParts("16.35").unit)
    }
}
