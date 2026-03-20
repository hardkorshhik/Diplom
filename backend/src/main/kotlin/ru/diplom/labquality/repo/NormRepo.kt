package ru.diplom.labquality.repo

import org.springframework.data.jpa.repository.JpaRepository
import ru.diplom.labquality.domain.NormEntity

interface NormRepo : JpaRepository<NormEntity, Long> {
    fun findByProductIdAndMetricId(productId: Long, metricId: Long): NormEntity?
    fun findAllByProductId(productId: Long): List<NormEntity>
}
