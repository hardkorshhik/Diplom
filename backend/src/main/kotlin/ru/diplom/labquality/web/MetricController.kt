package ru.diplom.labquality.web

import jakarta.validation.Valid
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import ru.diplom.labquality.domain.MetricEntity
import ru.diplom.labquality.service.MetricService
import ru.diplom.labquality.web.dto.MetricCreateRequest
import ru.diplom.labquality.web.dto.MetricResponse

@RestController
@RequestMapping("/api/metrics")
class MetricController(private val service: MetricService) {

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    fun create(@Valid @RequestBody req: MetricCreateRequest): MetricResponse =
        service.create(req.name, req.unit).toDto()

    @GetMapping
    fun list(): List<MetricResponse> = service.list().map { it.toDto() }

    @GetMapping("/{id}")
    fun get(@PathVariable id: Long): MetricResponse = service.get(id).toDto()

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    fun update(@PathVariable id: Long, @Valid @RequestBody req: MetricCreateRequest): MetricResponse =
        service.update(id, req.name, req.unit).toDto()

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    fun delete(@PathVariable id: Long) = service.delete(id)
}

private fun MetricEntity.toDto() = MetricResponse(id = id, name = name, unit = unit)
