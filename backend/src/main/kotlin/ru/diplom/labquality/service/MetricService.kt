package ru.diplom.labquality.service

import org.springframework.stereotype.Service
import ru.diplom.labquality.domain.MetricEntity
import ru.diplom.labquality.repo.MetricRepo

@Service
class MetricService(private val repo: MetricRepo) {

    fun create(name: String, unit: String): MetricEntity =
        repo.save(MetricEntity(name = name.trim(), unit = unit.trim()))

    fun list(): List<MetricEntity> = repo.findAll()

    fun get(id: Long): MetricEntity = repo.findById(id).orElseThrow()

    fun update(id: Long, name: String, unit: String): MetricEntity {
        val m = repo.findById(id).orElseThrow()
        m.name = name.trim()
        m.unit = unit.trim()
        return repo.save(m)
    }

    fun delete(id: Long) = repo.deleteById(id)
}
