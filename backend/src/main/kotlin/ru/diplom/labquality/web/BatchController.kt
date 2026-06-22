package ru.diplom.labquality.web

import jakarta.validation.Valid
import org.springframework.http.MediaType
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import ru.diplom.labquality.domain.BatchEntity
import ru.diplom.labquality.domain.MeasurementEntity
import ru.diplom.labquality.service.BatchService
import ru.diplom.labquality.web.dto.*
import java.time.Instant

@RestController
@RequestMapping("/api/batches")
class BatchController(private val service: BatchService) {

    @PostMapping
    fun create(@Valid @RequestBody req: CreateBatchRequest): BatchResponse =
        service.create(req.productId, req.batchNumber, req.comment).toDto()

    @GetMapping
    fun list(): List<BatchResponse> = service.list().map { it.toDto() }

    @GetMapping("/{id}")
    fun get(@PathVariable id: Long): BatchResponse = service.get(id).toDto()

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    fun delete(@PathVariable id: Long) = service.delete(id)

    @PostMapping("/{batchId}/measurements")
    fun addMeasurement(
        @PathVariable batchId: Long,
        @Valid @RequestBody req: AddMeasurementRequest,
        auth: Authentication
    ): MeasurementResponse {
        val email = auth.name
        val m = service.addMeasurement(
            batchId = batchId,
            metricId = req.metricId,
            value = req.value,
            measuredAt = req.measuredAt ?: Instant.now(),
            currentEmail = email
        )
        return m.toDto()
    }

    @GetMapping("/{batchId}/measurements")
    fun listMeasurements(@PathVariable batchId: Long): List<MeasurementResponse> =
        service.listMeasurements(batchId).map { it.toDto() }

    @GetMapping("/{batchId}/analysis")
    fun analysis(@PathVariable batchId: Long): BatchAnalysisDto =
        service.analyze(batchId).toDto()

    @PostMapping(
        path = ["/{batchId}/measurements/import"],
        consumes = [MediaType.MULTIPART_FORM_DATA_VALUE]
    )
    fun importMeasurements(
        @PathVariable batchId: Long,
        @RequestPart("file") file: MultipartFile,
        auth: Authentication
    ): MeasurementsImportResponse {
        require(!file.isEmpty) { "File is empty" }
        val csv = file.bytes.toString(Charsets.UTF_8)
        return service.importMeasurementsFromCsv(batchId, csv, auth.name).toDto()
    }
}

private fun BatchEntity.toDto() = BatchResponse(
    id = id,
    productId = product.id,
    batchNumber = batchNumber,
    createdAt = createdAt,
    comment = comment,
    status = status
)

private fun MeasurementEntity.toDto() = MeasurementResponse(
    id = id,
    batchId = batch.id,
    metricId = metric.id,
    value = value,
    measuredAt = measuredAt,
    createdByUserId = createdBy.id
)

private fun ru.diplom.labquality.service.BatchAnalysisResult.toDto() = BatchAnalysisDto(
    status = status,
    outOfSpecPercent = outOfSpecPercent,
    stats = stats.map {
        MetricStatsDto(
            metricId = it.metricId,
            count = it.count,
            avg = it.avg,
            min = it.min,
            max = it.max,
            outOfSpecCount = it.outOfSpecCount
        )
    }
)

private fun ru.diplom.labquality.service.MeasurementsImportResult.toDto() = MeasurementsImportResponse(
    totalRows = totalRows,
    importedRows = importedRows,
    skippedRows = skippedRows,
    errors = errors.map { ImportRowErrorDto(row = it.row, message = it.message) },
    analysis = analysis.toDto()
)
