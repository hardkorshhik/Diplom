package ru.diplom.labquality.config

import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.core.annotation.Order
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
@Order(100)
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
        createUserIfMissing("Системный администратор", "admin@example.com", "admin123", Role.ADMIN)
        createUserIfMissing("Инженер по качеству (ОТК)", "qa@example.com", "qa123", Role.QA)
        createUserIfMissing("Лаборант смены №1", "lab1@example.com", "lab123", Role.LAB)
        createUserIfMissing("Лаборант смены №2", "lab2@example.com", "lab123", Role.LAB)
    }

    private fun createUserIfMissing(fullName: String, email: String, password: String, role: Role) {
        val normalized = email.trim().lowercase()
        val existing = userRepo.findByEmail(normalized)
        if (existing != null) {
            existing.fullName = fullName.trim()
            existing.role = role
            userRepo.save(existing)
            return
        }

        userRepo.save(
            UserEntity(
                fullName = fullName.trim(),
                email = normalized,
                passwordHash = passwordEncoder.encode(password) ?: error("Password encoding failed"),
                role = role
            )
        )
    }

    private fun seedProductsAndMetrics() {
        product("Ammophos NP 12:52", "AMMO-NP-1252")
        product("NPK 16:16:16", "NPK-161616")
        product("Diammonium phosphate 18:46", "DAP-1846")

        metric("Nitrogen (N)", "%")
        metric("Phosphates (P2O5)", "%")
        metric("Potassium (K2O)", "%")
        metric("Sulfur (S)", "%")
        metric("Moisture", "%")
        metric("Granule strength", "N/granule")
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
        val npk = productRepo.findByCodeIgnoreCase("NPK-161616") ?: return
        val dap = productRepo.findByCodeIgnoreCase("DAP-1846") ?: return

        upsertNorm(ammo, "Nitrogen (N)", 11.5, 12.5)
        upsertNorm(ammo, "Phosphates (P2O5)", 51.0, 53.0)
        upsertNorm(ammo, "Potassium (K2O)", 0.0, 0.3)
        upsertNorm(ammo, "Sulfur (S)", 0.0, 1.0)
        upsertNorm(ammo, "Moisture", 0.0, 1.2)
        upsertNorm(ammo, "Granule strength", 30.0, 60.0)

        upsertNorm(npk, "Nitrogen (N)", 15.5, 16.5)
        upsertNorm(npk, "Phosphates (P2O5)", 15.5, 16.5)
        upsertNorm(npk, "Potassium (K2O)", 15.5, 16.5)
        upsertNorm(npk, "Sulfur (S)", 0.0, 1.0)
        upsertNorm(npk, "Moisture", 0.0, 0.8)
        upsertNorm(npk, "Granule strength", 40.0, 70.0)

        upsertNorm(dap, "Nitrogen (N)", 17.5, 18.5)
        upsertNorm(dap, "Phosphates (P2O5)", 45.0, 47.0)
        upsertNorm(dap, "Potassium (K2O)", 0.0, 0.2)
        upsertNorm(dap, "Sulfur (S)", 0.0, 1.0)
        upsertNorm(dap, "Moisture", 0.0, 1.5)
        upsertNorm(dap, "Granule strength", 35.0, 65.0)
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
