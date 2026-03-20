package ru.diplom.labquality.web.dto

import jakarta.validation.constraints.NotNull

data class NormUpsertRequest(
    @field:NotNull val productId: Long,
    @field:NotNull val metricId: Long,
    val minValue: Double? = null,
    val maxValue: Double? = null
)

data class NormResponse(
    val id: Long,
    val productId: Long,
    val metricId: Long,
    val minValue: Double?,
    val maxValue: Double?
)
