package ru.diplom.labquality.web.error

import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice

@RestControllerAdvice
class ApiExceptionHandler {

    @ExceptionHandler(NoSuchElementException::class)
    fun notFound(e: NoSuchElementException, req: HttpServletRequest): ResponseEntity<ApiError> =
        ResponseEntity.status(HttpStatus.NOT_FOUND).body(
            ApiError(status = 404, error = "Not Found", message = e.message, path = req.requestURI)
        )

    @ExceptionHandler(IllegalArgumentException::class, IllegalStateException::class)
    fun badRequest(e: RuntimeException, req: HttpServletRequest): ResponseEntity<ApiError> =
        ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            ApiError(status = 400, error = "Bad Request", message = e.message, path = req.requestURI)
        )

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun validation(e: MethodArgumentNotValidException, req: HttpServletRequest): ResponseEntity<ApiError> {
        val msg = e.bindingResult.fieldErrors.joinToString("; ") { "${it.field}: ${it.defaultMessage}" }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            ApiError(status = 400, error = "Validation Error", message = msg, path = req.requestURI)
        )
    }

    @ExceptionHandler(UnauthorizedException::class)
    fun unauthorized(e: UnauthorizedException, req: HttpServletRequest)
            : ResponseEntity<ApiError> =
        ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
            ApiError(status = 401, error = "Unauthorized", message = e.message, path = req.requestURI)
        )
}
