package ru.diplom.labquality.domain

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "measurements")
class MeasurementEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id", nullable = false)
    var batch: BatchEntity,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "metric_id", nullable = false)
    var metric: MetricEntity,

    @Column(nullable = false)
    var value: Double,

    @Column(name = "measured_at", nullable = false)
    var measuredAt: Instant = Instant.now(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    var createdBy: UserEntity
)
