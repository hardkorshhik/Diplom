package ru.diplom.labquality.web

import jakarta.validation.Valid
import org.springframework.web.bind.annotation.*
import ru.diplom.labquality.service.AuthService
import ru.diplom.labquality.web.dto.AuthResponse
import ru.diplom.labquality.web.dto.LoginRequest
import ru.diplom.labquality.web.dto.RegisterRequest

@RestController
@RequestMapping("/api/auth")
class AuthController(private val authService: AuthService) {

    @PostMapping("/register")
    fun register(@Valid @RequestBody req: RegisterRequest): AuthResponse =
        AuthResponse(authService.register(req.email, req.password))

    @PostMapping("/login")
    fun login(@Valid @RequestBody req: LoginRequest): AuthResponse =
        AuthResponse(authService.login(req.email, req.password))
}
