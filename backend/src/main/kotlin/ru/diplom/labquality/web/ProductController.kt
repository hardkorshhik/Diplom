package ru.diplom.labquality.web

import jakarta.validation.Valid
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import ru.diplom.labquality.domain.ProductEntity
import ru.diplom.labquality.service.ProductService
import ru.diplom.labquality.web.dto.ProductCreateRequest
import ru.diplom.labquality.web.dto.ProductResponse

@RestController
@RequestMapping("/api/products")
class ProductController(private val service: ProductService) {

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    fun create(@Valid @RequestBody req: ProductCreateRequest): ProductResponse =
        service.create(req.name, req.code).toDto()

    @GetMapping
    fun list(): List<ProductResponse> = service.list().map { it.toDto() }

    @GetMapping("/{id}")
    fun get(@PathVariable id: Long): ProductResponse = service.get(id).toDto()

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    fun update(@PathVariable id: Long, @Valid @RequestBody req: ProductCreateRequest): ProductResponse =
        service.update(id, req.name, req.code).toDto()

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    fun delete(@PathVariable id: Long) = service.delete(id)
}

private fun ProductEntity.toDto() = ProductResponse(id = id, name = name, code = code)
