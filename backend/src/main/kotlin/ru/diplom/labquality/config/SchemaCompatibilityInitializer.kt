package ru.diplom.labquality.config

import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class SchemaCompatibilityInitializer(
    private val jdbcTemplate: JdbcTemplate
) : ApplicationRunner {

    override fun run(args: ApplicationArguments) {
        jdbcTemplate.execute(
            """
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM information_schema.tables
                    WHERE table_schema = current_schema()
                      AND table_name = 'users'
                ) THEN
                    IF NOT EXISTS (
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_schema = current_schema()
                          AND table_name = 'users'
                          AND column_name = 'full_name'
                    ) THEN
                        ALTER TABLE users ADD COLUMN full_name varchar(255);
                    END IF;

                    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

                    ALTER TABLE users
                        ADD CONSTRAINT users_role_check
                        CHECK (role IN ('ADMIN', 'LAB', 'QA'));

                    UPDATE users
                    SET full_name = split_part(email, '@', 1)
                    WHERE full_name IS NULL OR btrim(full_name) = '';

                    IF EXISTS (SELECT 1 FROM users WHERE email = 'admin@ammophos.ru')
                       AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@example.com') THEN
                        UPDATE users SET email = 'admin@example.com' WHERE email = 'admin@ammophos.ru';
                    END IF;

                    IF EXISTS (SELECT 1 FROM users WHERE email = 'qa@ammophos.ru')
                       AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'qa@example.com') THEN
                        UPDATE users SET email = 'qa@example.com' WHERE email = 'qa@ammophos.ru';
                    END IF;

                    IF EXISTS (SELECT 1 FROM users WHERE email = 'lab1@ammophos.ru')
                       AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'lab1@example.com') THEN
                        UPDATE users SET email = 'lab1@example.com' WHERE email = 'lab1@ammophos.ru';
                    END IF;

                    IF EXISTS (SELECT 1 FROM users WHERE email = 'lab2@ammophos.ru')
                       AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'lab2@example.com') THEN
                        UPDATE users SET email = 'lab2@example.com' WHERE email = 'lab2@ammophos.ru';
                    END IF;

                    IF EXISTS (SELECT 1 FROM users WHERE email = 'bulk.loader@ammophos.local')
                       AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'bulk.loader@example.com') THEN
                        UPDATE users SET email = 'bulk.loader@example.com' WHERE email = 'bulk.loader@ammophos.local';
                    END IF;
                END IF;
            END $$;
            """.trimIndent()
        )
    }
}
