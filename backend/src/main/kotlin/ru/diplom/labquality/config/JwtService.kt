package ru.diplom.labquality.config

import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.stereotype.Service
import java.time.Instant
import java.util.Date

@Service
class JwtService(private val props: JwtProps) {

    private val key = Keys.hmacShaKeyFor(props.secret.toByteArray(Charsets.UTF_8))

    fun generate(email: String, role: String): String {
        val now = Instant.now()
        val exp = now.plusSeconds(props.accessTtlMinutes * 60)

        return Jwts.builder()
            .issuer(props.issuer)
            .subject(email)
            .claim("role", role)
            .issuedAt(Date.from(now))
            .expiration(Date.from(exp))
            .signWith(key)
            .compact()
    }

    fun parse(token: String): Pair<String, String> {
        val claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).payload
        val email = claims.subject
        val role = claims["role"] as String
        return email to role
    }
}
