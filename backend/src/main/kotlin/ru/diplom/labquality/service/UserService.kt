package ru.diplom.labquality.service

import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import ru.diplom.labquality.domain.Role
import ru.diplom.labquality.domain.UserEntity
import ru.diplom.labquality.repo.UserRepo

@Service
class UserService(
    private val userRepo: UserRepo,
    private val passwordEncoder: PasswordEncoder
) {

    fun list(): List<UserEntity> = userRepo.findAll().sortedBy { it.id }

    @Transactional
    fun create(fullName: String, email: String, password: String, role: Role): UserEntity {
        val normalized = email.trim().lowercase()
        require(userRepo.findByEmail(normalized) == null) { "Email already exists" }

        return userRepo.save(
            UserEntity(
                fullName = fullName.trim(),
                email = normalized,
                passwordHash = passwordEncoder.encode(password)!!,
                role = role
            )
        )
    }

    @Transactional
    fun update(
        id: Long,
        fullName: String,
        email: String,
        role: Role,
        password: String?
    ): UserEntity {
        val user = userRepo.findById(id).orElseThrow()
        val normalized = email.trim().lowercase()

        val conflict = userRepo.findByEmail(normalized)
        require(conflict == null || conflict.id == id) { "Email already exists" }

        if (user.role == Role.ADMIN && role != Role.ADMIN) {
            val admins = userRepo.countByRole(Role.ADMIN)
            require(admins > 1) { "Cannot demote the last admin" }
        }

        user.fullName = fullName.trim()
        user.email = normalized
        user.role = role

        if (!password.isNullOrBlank()) {
            user.passwordHash = passwordEncoder.encode(password.trim())!!
        }

        return userRepo.save(user)
    }

    @Transactional
    fun delete(id: Long) {
        val user = userRepo.findById(id).orElseThrow()

        if (user.role == Role.ADMIN) {
            val admins = userRepo.countByRole(Role.ADMIN)
            require(admins > 1) { "Cannot delete the last admin" }
        }

        userRepo.delete(user)
    }
}
