package ru.diplom.labquality.config

import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import ru.diplom.labquality.domain.MetricEntity
import ru.diplom.labquality.domain.NormEntity
import ru.diplom.labquality.domain.ProductEntity
import ru.diplom.labquality.domain.Role
import ru.diplom.labquality.domain.UserEntity
import ru.diplom.labquality.repo.MetricRepo
import ru.diplom.labquality.repo.NormRepo
import ru.diplom.labquality.repo.ProductRepo
import ru.diplom.labquality.repo.UserRepo

@Component
class DemoDataInitializer(
    private val userRepo: UserRepo,
    private val productRepo: ProductRepo,
    private val metricRepo: MetricRepo,
    private val normRepo: NormRepo,
    private val passwordEncoder: PasswordEncoder
) : ApplicationRunner {

    @Transactional
    override fun run(args: ApplicationArguments) {
        seedUsers()
        seedProductsAndMetrics()
        seedNorms()
    }

    private fun seedUsers() {
        createUserIfMissing("admin@ammophos.ru", "admin123", Role.ADMIN)
        createUserIfMissing("qa@ammophos.ru", "qa123", Role.LAB)
        createUserIfMissing("lab1@ammophos.ru", "lab123", Role.LAB)
        createUserIfMissing("lab2@ammophos.ru", "lab123", Role.LAB)
    }

    private fun createUserIfMissing(email: String, password: String, role: Role) {
        val normalized = email.trim().lowercase()
        if (userRepo.findByEmail(normalized) != null) return

        userRepo.save(
            UserEntity(
                email = normalized,
                passwordHash = passwordEncoder.encode(password) ?: error("Password encoding failed"),
                role = role
            )
        )
    }

    private fun seedProductsAndMetrics() {
        product("Ammophos NP 12:52", "AMMO-NP-1252")
        product("Carbamide", "CARBAMIDE")
        product("Ammonium Nitrate", "NITRATE")

        metric("Влажность", "%")
        metric("pH", "ед.")
        metric("Плотность", "г/см³")
        metric("Массовая доля", "%")
        metric("Содержание N", "%")
    }

    private fun product(name: String, code: String): ProductEntity {
        val existing = productRepo.findByCodeIgnoreCase(code)
        if (existing != null) return existing
        return productRepo.save(ProductEntity(name = name, code = code))
    }

    private fun metric(name: String, unit: String): MetricEntity {
        val existing = metricRepo.findByNameIgnoreCase(name)
        if (existing != null) return existing
        return metricRepo.save(MetricEntity(name = name, unit = unit))
    }

    private fun seedNorms() {
        val ammo = productRepo.findByCodeIgnoreCase("AMMO-NP-1252") ?: return
        val carbamide = productRepo.findByCodeIgnoreCase("CARBAMIDE") ?: return
        val nitrate = productRepo.findByCodeIgnoreCase("NITRATE") ?: return

        upsertNorm(ammo, "Влажность", 0.0, 1.2)
        upsertNorm(ammo, "pH", 5.5, 7.5)
        upsertNorm(ammo, "Плотность", 1.0, 1.3)
        upsertNorm(ammo, "Массовая доля", 11.0, 13.5)
        upsertNorm(ammo, "Содержание N", 11.0, 13.0)

        upsertNorm(carbamide, "Влажность", 0.0, 0.5)
        upsertNorm(carbamide, "pH", 6.0, 7.8)
        upsertNorm(carbamide, "Плотность", 1.1, 1.4)
        upsertNorm(carbamide, "Массовая доля", 45.0, 47.0)
        upsertNorm(carbamide, "Содержание N", 45.0, 47.0)

        upsertNorm(nitrate, "Влажность", 0.0, 0.4)
        upsertNorm(nitrate, "pH", 5.0, 7.0)
        upsertNorm(nitrate, "Плотность", 1.1, 1.6)
        upsertNorm(nitrate, "Массовая доля", 33.0, 35.5)
        upsertNorm(nitrate, "Содержание N", 33.0, 35.5)
    }

    private fun upsertNorm(product: ProductEntity, metricName: String, min: Double?, max: Double?) {
        val metric = metricRepo.findByNameIgnoreCase(metricName) ?: return
        val existing = normRepo.findByProductIdAndMetricId(product.id, metric.id)
        if (existing != null) {
            existing.minValue = min
            existing.maxValue = max
            normRepo.save(existing)
            return
        }

        normRepo.save(
            NormEntity(
                product = product,
                metric = metric,
                minValue = min,
                maxValue = max
            )
        )
    }
}
