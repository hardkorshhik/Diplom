package ru.diplom.labquality.domain

import jakarta.persistence.*

@Entity
@Table(name = "products")
class ProductEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long = 0,

    @Column(nullable = false)
    var name: String,

    @Column(nullable = false, unique = true)
    var code: String
)
