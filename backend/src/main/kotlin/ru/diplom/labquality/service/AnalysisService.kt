package ru.diplom.labquality.service

import org.springframework.stereotype.Service
import ru.diplom.labquality.domain.BatchStatus
import ru.diplom.labquality.repo.MeasurementRepo
import ru.diplom.labquality.repo.NormRepo
import kotlin.math.roundToInt

data class MetricStats(
    val metricId: Long,
    val count: Int,
    val avg: Double,
    val min: Double,
    val max: Double,
    val outOfSpecCount: Int
)

data class BatchAnalysisResult(
    val status: BatchStatus,
    val outOfSpecPercent: Int,
    val stats: List<MetricStats>
)

@Service
class AnalysisService(
    private val measurementRepo: MeasurementRepo,
    private val normRepo: NormRepo
) {
    fun analyzeBatch(batchId: Long, productId: Long): BatchAnalysisResult {
        val ms = measurementRepo.findAllByBatchId(batchId)
        if (ms.isEmpty()) return BatchAnalysisResult(BatchStatus.OK, 0, emptyList())

        val grouped = ms.groupBy { it.metric.id }

        var total = 0
        var totalOut = 0

        val stats = grouped.map { (metricId, list) ->
            val values = list.map { it.value }
            val count = values.size
            val avg = values.average()
            val min = values.min()
            val max = values.max()

            val norm = normRepo.findByProductIdAndMetricId(productId, metricId)
            val out = values.count { v ->
                val below = norm?.minValue?.let { v < it } ?: false
                val above = norm?.maxValue?.let { v > it } ?: false
                below || above
            }

            total += count
            totalOut += out

            MetricStats(
                metricId = metricId,
                count = count,
                avg = avg,
                min = min,
                max = max,
                outOfSpecCount = out
            )
        }

        val percent = if (total == 0) 0 else ((totalOut.toDouble() / total) * 100).roundToInt()
        val status = when {
            percent == 0 -> BatchStatus.OK
            percent <= 10 -> BatchStatus.WARNING
            else -> BatchStatus.FAIL
        }

        return BatchAnalysisResult(status, percent, stats)
    }
}
