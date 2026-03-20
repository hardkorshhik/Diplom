package ru.diplom.labquality.web.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import ru.diplom.labquality.domain.BatchStatus
import java.time.Instant

data class CreateBatchRequest(
    @field:NotNull val productId: Long,
    @field:NotBlank val batchNumber: String,
    val comment: String? = null
)

data class BatchResponse(
    val id: Long,
    val productId: Long,
    val batchNumber: String,
    val createdAt: Instant,
    val comment: String?,
    val status: BatchStatus
)
