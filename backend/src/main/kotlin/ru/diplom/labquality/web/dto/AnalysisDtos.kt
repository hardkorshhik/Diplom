package ru.diplom.labquality.web.dto

import ru.diplom.labquality.domain.BatchStatus

data class MetricStatsDto(
    val metricId: Long,
    val count: Int,
    val avg: Double,
    val min: Double,
    val max: Double,
    val outOfSpecCount: Int
)

data class BatchAnalysisDto(
    val status: BatchStatus,
    val outOfSpecPercent: Int,
    val stats: List<MetricStatsDto>
)
