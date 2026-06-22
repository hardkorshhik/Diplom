package ru.diplom.labquality.web.dto

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import ru.diplom.labquality.domain.Role

data class UserCreateRequest(
    @field:NotBlank val fullName: String,
    @field:Email val email: String,
    @field:NotBlank val password: String,
    @field:NotNull val role: Role
)

data class UserUpdateRequest(
    @field:NotBlank val fullName: String,
    @field:Email val email: String,
    @field:NotNull val role: Role,
    val password: String? = null
)

data class UserResponse(
    val id: Long,
    val fullName: String,
    val email: String,
    val role: Role
)
