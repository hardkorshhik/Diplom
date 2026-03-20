package ru.diplom.labquality.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "app.db")
data class DbProps(
    val host: String,
    val port: Int,
    val name: String,
    val user: String,
    val pass: String,
    val poolSize: Int = 10
)
