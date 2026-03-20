package ru.diplom.labquality.domain

import jakarta.persistence.*

@Entity
@Table(
    name = "norms",
    uniqueConstraints = [UniqueConstraint(columnNames = ["product_id", "metric_id"])]
)
class NormEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    var product: ProductEntity,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "metric_id", nullable = false)
    var metric: MetricEntity,

    @Column(name = "min_value")
    var minValue: Double? = null,

    @Column(name = "max_value")
    var maxValue: Double? = null
)
