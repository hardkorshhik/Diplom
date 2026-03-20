package ru.diplom.labquality.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import ru.diplom.labquality.domain.BatchEntity
import ru.diplom.labquality.domain.MeasurementEntity
import ru.diplom.labquality.domain.MetricEntity
import ru.diplom.labquality.domain.UserEntity
import ru.diplom.labquality.repo.BatchRepo
import ru.diplom.labquality.repo.MeasurementRepo
import ru.diplom.labquality.repo.MetricRepo
import ru.diplom.labquality.repo.ProductRepo
import ru.diplom.labquality.repo.UserRepo
import java.time.Instant

data class ImportRowError(
    val row: Int,
    val message: String
)

data class MeasurementsImportResult(
    val totalRows: Int,
    val importedRows: Int,
    val skippedRows: Int,
    val errors: List<ImportRowError>,
    val analysis: BatchAnalysisResult
)

@Service
class BatchService(
    private val batchRepo: BatchRepo,
    private val productRepo: ProductRepo,
    private val metricRepo: MetricRepo,
    private val measurementRepo: MeasurementRepo,
    private val userRepo: UserRepo,
    private val analysisService: AnalysisService
) {

    fun create(productId: Long, batchNumber: String, comment: String?): BatchEntity {
        val product = productRepo.findById(productId).orElseThrow()
        return batchRepo.save(
            BatchEntity(
                product = product,
                batchNumber = batchNumber.trim(),
                comment = comment?.trim()
            )
        )
    }

    fun list(): List<BatchEntity> = batchRepo.findAllByOrderByCreatedAtDesc()

    fun get(id: Long): BatchEntity = batchRepo.findById(id).orElseThrow()

    fun listMeasurements(batchId: Long): List<MeasurementEntity> =
        measurementRepo.findAllByBatchIdOrderByMeasuredAtDesc(batchId)

    @Transactional
    fun addMeasurement(
        batchId: Long,
        metricId: Long,
        value: Double,
        measuredAt: Instant?,
        currentEmail: String
    ): MeasurementEntity {
        val batch = batchRepo.findById(batchId).orElseThrow()
        val metric = metricRepo.findById(metricId).orElseThrow()
        val user = userRepo.findByEmail(currentEmail) ?: error("User not found")

        val measurement = persistMeasurement(
            batch = batch,
            metric = metric,
            value = value,
            measuredAt = measuredAt ?: Instant.now(),
            user = user
        )

        recalcBatchStatus(batch)
        return measurement
    }

    @Transactional
    fun importMeasurementsFromCsv(
        batchId: Long,
        csvRaw: String,
        currentEmail: String
    ): MeasurementsImportResult {
        val batch = batchRepo.findById(batchId).orElseThrow()
        val user = userRepo.findByEmail(currentEmail) ?: error("User not found")

        val csv = csvRaw.removePrefix("\uFEFF")
        val indexedLines = csv
            .lineSequence()
            .mapIndexed { idx, line -> (idx + 1) to line.trim() }
            .filter { it.second.isNotBlank() }
            .toList()

        require(indexedLines.isNotEmpty()) { "File is empty" }

        val headerLine = indexedLines.first().second
        val delimiter = detectDelimiter(headerLine)
        val headers = parseCsvLine(headerLine, delimiter).map { normalizeHeader(it) }

        val metricIdIdx = headers.indexOf("metricid")
        val metricNameIdx = headers.indexOf("metricname")
        val valueIdx = headers.indexOf("value")
        val measuredAtIdx = headers.indexOf("measuredat")

        require(valueIdx >= 0) { "Column 'value' is required" }
        require(metricIdIdx >= 0 || metricNameIdx >= 0) {
            "Column 'metricId' or 'metricName' is required"
        }

        val dataLines = indexedLines.drop(1)
        val errors = mutableListOf<ImportRowError>()
        var imported = 0

        dataLines.forEach { (lineNo, line) ->
            try {
                val cells = parseCsvLine(line, delimiter)
                val metric = resolveMetric(cells, metricIdIdx, metricNameIdx)
                val value = readValue(cells, valueIdx)
                val measuredAt = readMeasuredAt(cells, measuredAtIdx) ?: Instant.now()

                persistMeasurement(
                    batch = batch,
                    metric = metric,
                    value = value,
                    measuredAt = measuredAt,
                    user = user
                )
                imported++
            } catch (e: Exception) {
                if (errors.size < 200) {
                    errors += ImportRowError(
                        row = lineNo,
                        message = e.message ?: "Unknown parsing error"
                    )
                }
            }
        }

        val analysis = recalcBatchStatus(batch)
        return MeasurementsImportResult(
            totalRows = dataLines.size,
            importedRows = imported,
            skippedRows = dataLines.size - imported,
            errors = errors,
            analysis = analysis
        )
    }

    fun analyze(batchId: Long): BatchAnalysisResult {
        val batch = batchRepo.findById(batchId).orElseThrow()
        return analysisService.analyzeBatch(batch.id, batch.product.id)
    }

    private fun recalcBatchStatus(batch: BatchEntity): BatchAnalysisResult {
        val result = analysisService.analyzeBatch(batch.id, batch.product.id)
        batch.status = result.status
        batchRepo.save(batch)
        return result
    }

    private fun persistMeasurement(
        batch: BatchEntity,
        metric: MetricEntity,
        value: Double,
        measuredAt: Instant,
        user: UserEntity
    ): MeasurementEntity =
        measurementRepo.save(
            MeasurementEntity(
                batch = batch,
                metric = metric,
                value = value,
                measuredAt = measuredAt,
                createdBy = user
            )
        )

    private fun resolveMetric(
        cells: List<String>,
        metricIdIdx: Int,
        metricNameIdx: Int
    ): MetricEntity {
        val metricIdRaw = cell(cells, metricIdIdx)
        val metricNameRaw = cell(cells, metricNameIdx)

        if (metricIdRaw.isNotBlank()) {
            val metricId = metricIdRaw.toLongOrNull()
                ?: throw IllegalArgumentException("Invalid metricId: '$metricIdRaw'")
            return metricRepo.findById(metricId).orElseThrow {
                IllegalArgumentException("Metric not found by id: $metricId")
            }
        }

        if (metricNameRaw.isNotBlank()) {
            return metricRepo.findByNameIgnoreCase(metricNameRaw.trim())
                ?: throw IllegalArgumentException("Metric not found by name: '$metricNameRaw'")
        }

        throw IllegalArgumentException("Metric is not set (metricId/metricName)")
    }

    private fun readValue(cells: List<String>, valueIdx: Int): Double {
        val raw = cell(cells, valueIdx)
        val value = parseDouble(raw)
        return value ?: throw IllegalArgumentException("Invalid value: '$raw'")
    }

    private fun readMeasuredAt(cells: List<String>, measuredAtIdx: Int): Instant? {
        if (measuredAtIdx < 0) return null
        val raw = cell(cells, measuredAtIdx)
        if (raw.isBlank()) return null
        return try {
            Instant.parse(raw.trim())
        } catch (_: Exception) {
            throw IllegalArgumentException("Invalid measuredAt: '$raw' (expected ISO-8601)")
        }
    }

    private fun parseDouble(raw: String): Double? {
        val trimmed = raw.trim().replace(" ", "")
        if (trimmed.isBlank()) return null
        val normalized = if (trimmed.contains(",") && !trimmed.contains(".")) {
            trimmed.replace(",", ".")
        } else {
            trimmed
        }
        return normalized.toDoubleOrNull()
    }

    private fun cell(cells: List<String>, idx: Int): String =
        if (idx < 0 || idx >= cells.size) "" else cells[idx].trim()

    private fun detectDelimiter(headerLine: String): Char {
        val semicolons = headerLine.count { it == ';' }
        val commas = headerLine.count { it == ',' }
        return if (semicolons > commas) ';' else ','
    }

    private fun normalizeHeader(raw: String): String =
        raw.trim()
            .lowercase()
            .replace(" ", "")
            .replace("_", "")

    private fun parseCsvLine(line: String, delimiter: Char): List<String> {
        val out = mutableListOf<String>()
        val cur = StringBuilder()
        var inQuotes = false
        var i = 0

        while (i < line.length) {
            val ch = line[i]
            if (ch == '"') {
                if (inQuotes && i + 1 < line.length && line[i + 1] == '"') {
                    cur.append('"')
                    i += 2
                    continue
                }
                inQuotes = !inQuotes
                i++
                continue
            }

            if (ch == delimiter && !inQuotes) {
                out += cur.toString()
                cur.clear()
            } else {
                cur.append(ch)
            }
            i++
        }

        out += cur.toString()
        return out
    }
}
