package ru.diplom.labquality.repo

import org.springframework.data.jpa.repository.JpaRepository
import ru.diplom.labquality.domain.BatchEntity

interface BatchRepo : JpaRepository<BatchEntity, Long>
{
    fun findAllByOrderByCreatedAtDesc(): List<BatchEntity>
}
