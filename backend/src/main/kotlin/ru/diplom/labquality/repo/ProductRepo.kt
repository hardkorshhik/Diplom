package ru.diplom.labquality.repo

import org.springframework.data.jpa.repository.JpaRepository
import ru.diplom.labquality.domain.ProductEntity

interface ProductRepo : JpaRepository<ProductEntity, Long>
{
    fun findByCodeIgnoreCase(code: String): ProductEntity?
}
