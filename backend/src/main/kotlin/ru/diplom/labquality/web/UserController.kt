package ru.diplom.labquality.web

import jakarta.validation.Valid
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import ru.diplom.labquality.domain.UserEntity
import ru.diplom.labquality.service.UserService
import ru.diplom.labquality.web.dto.UserCreateRequest
import ru.diplom.labquality.web.dto.UserResponse
import ru.diplom.labquality.web.dto.UserUpdateRequest

@RestController
@RequestMapping("/api/users")
@PreAuthorize("hasRole('ADMIN')")
class UserController(private val service: UserService) {

    @GetMapping
    fun list(): List<UserResponse> = service.list().map { it.toDto() }

    @PostMapping
    fun create(@Valid @RequestBody req: UserCreateRequest): UserResponse =
        service.create(req.fullName, req.email, req.password, req.role).toDto()

    @PutMapping("/{id}")
    fun update(@PathVariable id: Long, @Valid @RequestBody req: UserUpdateRequest): UserResponse =
        service.update(id, req.fullName, req.email, req.role, req.password).toDto()

    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: Long) = service.delete(id)
}

private fun UserEntity.toDto() = UserResponse(
    id = id,
    fullName = fullName ?: email.substringBefore("@"),
    email = email,
    role = role
)
