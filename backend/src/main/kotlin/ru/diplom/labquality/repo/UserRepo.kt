package ru.diplom.labquality.repo

import org.springframework.data.jpa.repository.JpaRepository
import ru.diplom.labquality.domain.UserEntity

interface UserRepo : JpaRepository<UserEntity, Long> {
    fun findByEmail(email: String): UserEntity?
}
