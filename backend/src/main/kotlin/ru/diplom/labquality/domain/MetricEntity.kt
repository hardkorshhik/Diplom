package ru.diplom.labquality.domain

import jakarta.persistence.*

@Entity
@Table(name = "metrics")
class MetricEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long = 0,

    @Column(nullable = false, unique = true)
    var name: String,

    @Column(nullable = false)
    var unit: String
)
