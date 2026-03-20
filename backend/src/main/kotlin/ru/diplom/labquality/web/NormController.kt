package ru.diplom.labquality.web

import jakarta.validation.Valid
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import ru.diplom.labquality.domain.NormEntity
import ru.diplom.labquality.service.NormService
import ru.diplom.labquality.web.dto.NormResponse
import ru.diplom.labquality.web.dto.NormUpsertRequest

@RestController
@RequestMapping("/api/norms")
class NormController(private val service: NormService) {

    @PostMapping("/upsert")
    @PreAuthorize("hasRole('ADMIN')")
    fun upsert(@Valid @RequestBody req: NormUpsertRequest): NormResponse =
        service.upsert(req.productId, req.metricId, req.minValue, req.maxValue).toDto()

    @GetMapping
    fun list(): List<NormResponse> = service.list().map { it.toDto() }

    @GetMapping("/by-product/{productId}")
    fun byProduct(@PathVariable productId: Long): List<NormResponse> =
        service.byProduct(productId).map { it.toDto() }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    fun delete(@PathVariable id: Long) = service.delete(id)
}

private fun NormEntity.toDto() = NormResponse(
    id = id,
    productId = product.id,
    metricId = metric.id,
    minValue = minValue,
    maxValue = maxValue
)
