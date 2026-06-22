package ru.diplom.labquality.service

import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import ru.diplom.labquality.config.JwtService
import ru.diplom.labquality.domain.Role
import ru.diplom.labquality.domain.UserEntity
import ru.diplom.labquality.repo.UserRepo
import ru.diplom.labquality.web.error.UnauthorizedException

@Service
class AuthService(
    private val userRepo: UserRepo,
    private val encoder: PasswordEncoder,
    private val jwt: JwtService
) {
    fun register(email: String, password: String): String {
        val normalized = email.trim().lowercase()
        require(userRepo.findByEmail(normalized) == null) { "Email already exists" }

        val user = userRepo.save(
            UserEntity(
                fullName = normalized.substringBefore("@"),
                email = normalized,
                passwordHash = encoder.encode(password)!!,
                role = Role.LAB
            )
        )

        return jwt.generate(user.email, user.role.name)
    }

    fun login(email: String, password: String): String {
        val normalized = email.trim().lowercase()
        val user = userRepo.findByEmail(normalized) ?: throw UnauthorizedException()

        val ok = encoder.matches(password, user.passwordHash)
        if (!ok) throw UnauthorizedException()

        return jwt.generate(user.email, user.role.name)
    }
}
