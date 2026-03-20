package ru.diplom.labquality.repo

import org.springframework.data.jpa.repository.JpaRepository
import ru.diplom.labquality.domain.MeasurementEntity

interface MeasurementRepo : JpaRepository<MeasurementEntity, Long> {
    fun findAllByBatchId(batchId: Long): List<MeasurementEntity>
    fun findAllByBatchIdOrderByMeasuredAtDesc(batchId: Long): List<MeasurementEntity>
}
