package ru.diplom.labquality.web.dto

import jakarta.validation.constraints.NotNull
import java.time.Instant

data class AddMeasurementRequest(
    @field:NotNull val metricId: Long,
    @field:NotNull val value: Double,
    val measuredAt: Instant? = null
)

data class MeasurementResponse(
    val id: Long,
    val batchId: Long,
    val metricId: Long,
    val value: Double,
    val measuredAt: Instant,
    val createdByUserId: Long
)

data class ImportRowErrorDto(
    val row: Int,
    val message: String
)

data class MeasurementsImportResponse(
    val totalRows: Int,
    val importedRows: Int,
    val skippedRows: Int,
    val errors: List<ImportRowErrorDto>,
    val analysis: BatchAnalysisDto
)
