package ru.diplom.labquality.repo

import org.springframework.data.jpa.repository.JpaRepository
import ru.diplom.labquality.domain.MetricEntity

interface MetricRepo : JpaRepository<MetricEntity, Long>
{
    fun findByNameIgnoreCase(name: String): MetricEntity?
}
