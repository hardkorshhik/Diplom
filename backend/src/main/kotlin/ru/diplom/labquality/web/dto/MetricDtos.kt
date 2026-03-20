package ru.diplom.labquality.web.dto

import jakarta.validation.constraints.NotBlank

data class MetricCreateRequest(
    @field:NotBlank val name: String,
    @field:NotBlank val unit: String
)

data class MetricResponse(
    val id: Long,
    val name: String,
    val unit: String
)
