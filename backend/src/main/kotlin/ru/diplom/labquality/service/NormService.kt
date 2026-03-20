package ru.diplom.labquality.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import ru.diplom.labquality.domain.NormEntity
import ru.diplom.labquality.repo.MetricRepo
import ru.diplom.labquality.repo.NormRepo
import ru.diplom.labquality.repo.ProductRepo

@Service
class NormService(
    private val normRepo: NormRepo,
    private val productRepo: ProductRepo,
    private val metricRepo: MetricRepo
) {

    @Transactional
    fun upsert(productId: Long, metricId: Long, minValue: Double?, maxValue: Double?): NormEntity {
        require(!(minValue != null && maxValue != null && minValue > maxValue)) { "minValue cannot be greater than maxValue" }

        val existing = normRepo.findByProductIdAndMetricId(productId, metricId)
        if (existing != null) {
            existing.minValue = minValue
            existing.maxValue = maxValue
            return normRepo.save(existing)
        }

        val product = productRepo.findById(productId).orElseThrow()
        val metric = metricRepo.findById(metricId).orElseThrow()

        return normRepo.save(
            NormEntity(
                product = product,
                metric = metric,
                minValue = minValue,
                maxValue = maxValue
            )
        )
    }

    fun list(): List<NormEntity> = normRepo.findAll()

    fun byProduct(productId: Long): List<NormEntity> = normRepo.findAllByProductId(productId)

    fun delete(id: Long) = normRepo.deleteById(id)
}
