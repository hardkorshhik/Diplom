package ru.diplom.labquality.domain

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "batches")
class BatchEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    var product: ProductEntity,

    @Column(name = "batch_number", nullable = false)
    var batchNumber: String,

    @Column(name = "created_at", nullable = false)
    var createdAt: Instant = Instant.now(),

    @Column
    var comment: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: BatchStatus = BatchStatus.OK
)
