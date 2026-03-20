package ru.diplom.labquality.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "app.jwt")
data class JwtProps(
    val secret: String,
    val issuer: String,
    val accessTtlMinutes: Long
)
