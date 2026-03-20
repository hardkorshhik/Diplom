package ru.diplom.labquality.service

import org.springframework.stereotype.Service
import ru.diplom.labquality.domain.ProductEntity
import ru.diplom.labquality.repo.ProductRepo

@Service
class ProductService(private val repo: ProductRepo) {

    fun create(name: String, code: String): ProductEntity =
        repo.save(ProductEntity(name = name.trim(), code = code.trim()))

    fun list(): List<ProductEntity> = repo.findAll()

    fun get(id: Long): ProductEntity = repo.findById(id).orElseThrow()

    fun update(id: Long, name: String, code: String): ProductEntity {
        val p = repo.findById(id).orElseThrow()
        p.name = name.trim()
        p.code = code.trim()
        return repo.save(p)
    }

    fun delete(id: Long) = repo.deleteById(id)
}
