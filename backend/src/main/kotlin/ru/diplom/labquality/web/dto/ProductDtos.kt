package ru.diplom.labquality.web.dto

import jakarta.validation.constraints.NotBlank

data class ProductCreateRequest(
    @field:NotBlank val name: String,
    @field:NotBlank val code: String
)

data class ProductResponse(
    val id: Long,
    val name: String,
    val code: String
)
