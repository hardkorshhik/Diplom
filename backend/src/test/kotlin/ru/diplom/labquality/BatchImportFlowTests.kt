package ru.diplom.labquality

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.transaction.annotation.Transactional
import ru.diplom.labquality.domain.BatchStatus
import ru.diplom.labquality.repo.NormRepo
import ru.diplom.labquality.repo.ProductRepo
import ru.diplom.labquality.service.BatchService

@SpringBootTest
@Transactional
class BatchImportFlowTests {

    @Autowired
    private lateinit var batchService: BatchService

    @Autowired
    private lateinit var productRepo: ProductRepo

    @Autowired
    private lateinit var normRepo: NormRepo

    @Test
    fun `imports csv and marks batch as fail when half values are out of spec`() {
        val product = productRepo.findAll().firstOrNull()
            ?: error("No products found for test")
        val norm = normRepo.findAllByProductId(product.id).firstOrNull()
            ?: error("No norms found for test product")

        val metricId = norm.metric.id
        val inValue = safeInsideValue(norm.minValue, norm.maxValue)
        val outValue = safeOutsideValue(norm.minValue, norm.maxValue)

        val batch = batchService.create(
            productId = product.id,
            batchNumber = "TEST-IMPORT-${System.currentTimeMillis()}",
            comment = "auto-test"
        )

        val csv = buildString {
            appendLine("metricId,value,measuredAt")
            appendLine("$metricId,$inValue,2026-03-20T10:00:00Z")
            appendLine("$metricId,$outValue,2026-03-20T11:00:00Z")
        }

        val result = batchService.importMeasurementsFromCsv(
            batchId = batch.id,
            csvRaw = csv,
            currentEmail = "lab1@example.com"
        )

        assertThat(result.totalRows).isEqualTo(2)
        assertThat(result.importedRows).isEqualTo(2)
        assertThat(result.skippedRows).isEqualTo(0)
        assertThat(result.errors).isEmpty()
        assertThat(result.analysis.outOfSpecPercent).isEqualTo(50)
        assertThat(result.analysis.status).isEqualTo(BatchStatus.FAIL)

        val updated = batchService.get(batch.id)
        assertThat(updated.status).isEqualTo(BatchStatus.FAIL)
    }

    @Test
    fun `imports csv by metric name and marks batch as warning for one out of spec value`() {
        val product = productRepo.findByCodeIgnoreCase("AMMO-NP-1252")
            ?: error("Ammophos product not found for test")

        val batch = batchService.create(
            productId = product.id,
            batchNumber = "TEST-NAME-IMPORT-${System.currentTimeMillis()}",
            comment = "metric-name-import"
        )

        val csv = """
            metricName,value,measuredAt
            Nitrogen (N),12.0,2026-04-09T09:00:00Z
            Phosphates (P2O5),53.8,2026-04-09T09:05:00Z
            Potassium (K2O),0.2,2026-04-09T09:10:00Z
            Sulfur (S),0.5,2026-04-09T09:15:00Z
            Moisture,0.8,2026-04-09T09:20:00Z
            Granule strength,40,2026-04-09T09:25:00Z
            Nitrogen (N),11.7,2026-04-09T09:30:00Z
            Phosphates (P2O5),51.4,2026-04-09T09:35:00Z
            Moisture,1.0,2026-04-09T09:40:00Z
            Granule strength,35,2026-04-09T09:45:00Z
        """.trimIndent()

        val result = batchService.importMeasurementsFromCsv(
            batchId = batch.id,
            csvRaw = csv,
            currentEmail = "lab1@example.com"
        )

        assertThat(result.totalRows).isEqualTo(10)
        assertThat(result.importedRows).isEqualTo(10)
        assertThat(result.skippedRows).isEqualTo(0)
        assertThat(result.errors).isEmpty()
        assertThat(result.analysis.outOfSpecPercent).isEqualTo(10)
        assertThat(result.analysis.status).isEqualTo(BatchStatus.WARNING)
    }

    private fun safeInsideValue(min: Double?, max: Double?): Double = when {
        min != null && max != null -> (min + max) / 2.0
        min != null -> min + 1.0
        max != null -> max - 1.0
        else -> 1.0
    }

    private fun safeOutsideValue(min: Double?, max: Double?): Double = when {
        max != null -> max + 1.0
        min != null -> min - 1.0
        else -> 1000.0
    }
}
