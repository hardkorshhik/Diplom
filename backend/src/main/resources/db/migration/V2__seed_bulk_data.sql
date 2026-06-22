INSERT INTO users (full_name, email, password_hash, role)
VALUES
    (
        'System administrator',
        'admin@example.com',
        '$2a$10$wFa83q8j4Yam6efGRm43Q.iRR0PVMCY/ZT1oXJPX.WuMAxfpCbQnK',
        'ADMIN'
    ),
    (
        'Quality engineer',
        'qa@example.com',
        '$2a$10$Zfa/gfyUDUljzSngSfBQWeHgPShnivqvU/5elG4VqN9.3uNe4lNtG',
        'QA'
    ),
    (
        'Laboratory assistant',
        'lab1@example.com',
        '$2a$10$ynon86vG7o7TjMNpPZi.T.NPIjtRtMkE8AmJ9mp4q2dsOLSoH2jZ.',
        'LAB'
    ),
    (
        'Laboratory assistant 2',
        'lab2@example.com',
        '$2a$10$ynon86vG7o7TjMNpPZi.T.NPIjtRtMkE8AmJ9mp4q2dsOLSoH2jZ.',
        'LAB'
    ),
    (
        'Bulk Data Generator',
        'bulk.loader@example.com',
        '$2a$10$ynon86vG7o7TjMNpPZi.T.NPIjtRtMkE8AmJ9mp4q2dsOLSoH2jZ.',
        'LAB'
    )
ON CONFLICT (email) DO NOTHING;

INSERT INTO products (name, code)
VALUES
    ('Ammophos NP 12:52', 'AMMO-NP-1252'),
    ('NPK 16:16:16', 'NPK-161616'),
    ('Diammonium phosphate 18:46', 'DAP-1846')
ON CONFLICT (code) DO NOTHING;

INSERT INTO metrics (name, unit)
VALUES
    ('Nitrogen (N)', '%'),
    ('Phosphates (P2O5)', '%'),
    ('Potassium (K2O)', '%'),
    ('Sulfur (S)', '%'),
    ('Moisture', '%'),
    ('Granule strength', 'N/granule')
ON CONFLICT (name) DO NOTHING;

WITH norm_rows(product_code, metric_name, min_value, max_value) AS (
    VALUES
        ('AMMO-NP-1252', 'Nitrogen (N)', 11.5, 12.5),
        ('AMMO-NP-1252', 'Phosphates (P2O5)', 51.0, 53.0),
        ('AMMO-NP-1252', 'Potassium (K2O)', 0.0, 0.3),
        ('AMMO-NP-1252', 'Sulfur (S)', 0.0, 1.0),
        ('AMMO-NP-1252', 'Moisture', 0.0, 1.2),
        ('AMMO-NP-1252', 'Granule strength', 30.0, 60.0),
        ('NPK-161616', 'Nitrogen (N)', 15.5, 16.5),
        ('NPK-161616', 'Phosphates (P2O5)', 15.5, 16.5),
        ('NPK-161616', 'Potassium (K2O)', 15.5, 16.5),
        ('NPK-161616', 'Sulfur (S)', 0.0, 1.0),
        ('NPK-161616', 'Moisture', 0.0, 0.8),
        ('NPK-161616', 'Granule strength', 40.0, 70.0),
        ('DAP-1846', 'Nitrogen (N)', 17.5, 18.5),
        ('DAP-1846', 'Phosphates (P2O5)', 45.0, 47.0),
        ('DAP-1846', 'Potassium (K2O)', 0.0, 0.2),
        ('DAP-1846', 'Sulfur (S)', 0.0, 1.0),
        ('DAP-1846', 'Moisture', 0.0, 1.5),
        ('DAP-1846', 'Granule strength', 35.0, 65.0)
)
INSERT INTO norms (product_id, metric_id, min_value, max_value)
SELECT p.id, m.id, n.min_value, n.max_value
FROM norm_rows n
JOIN products p ON p.code = n.product_code
JOIN metrics m ON m.name = n.metric_name
ON CONFLICT (product_id, metric_id) DO UPDATE
SET min_value = EXCLUDED.min_value,
    max_value = EXCLUDED.max_value;

WITH product_pool AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY code) AS rn
    FROM products
    WHERE code IN ('AMMO-NP-1252', 'NPK-161616', 'DAP-1846')
),
batch_rows AS (
    SELECT
        p.id AS product_id,
        FORMAT('BULK-%s-%s', p.rn, LPAD(gs::TEXT, 3, '0')) AS batch_number,
        NOW() - (gs || ' hours')::INTERVAL AS created_at
    FROM product_pool p
    CROSS JOIN GENERATE_SERIES(1, 80) gs
)
INSERT INTO batches (product_id, batch_number, created_at, comment, status)
SELECT
    b.product_id,
    b.batch_number,
    b.created_at,
    'Auto-generated load data',
    'OK'
FROM batch_rows b
WHERE NOT EXISTS (
    SELECT 1
    FROM batches existing
    WHERE existing.batch_number = b.batch_number
);

WITH bulk_batches AS (
    SELECT id, product_id
    FROM batches b
    WHERE b.batch_number LIKE 'BULK-%'
      AND NOT EXISTS (
          SELECT 1
          FROM measurements existing
          WHERE existing.batch_id = b.id
      )
),
loader_user AS (
    SELECT id
    FROM users
    WHERE email = 'bulk.loader@example.com'
    LIMIT 1
)
INSERT INTO measurements (batch_id, metric_id, value, measured_at, created_by)
SELECT
    b.id AS batch_id,
    n.metric_id,
    CASE
        WHEN RANDOM() < 0.85 THEN
            ROUND(
                (
                    n.min_value +
                    RANDOM() * GREATEST(0.0001, n.max_value - n.min_value)
                )::NUMERIC,
                3
            )::DOUBLE PRECISION
        WHEN RANDOM() < 0.5 THEN
            ROUND((n.min_value - (0.2 + RANDOM() * 2.8))::NUMERIC, 3)::DOUBLE PRECISION
        ELSE
            ROUND((n.max_value + (0.2 + RANDOM() * 2.8))::NUMERIC, 3)::DOUBLE PRECISION
    END AS value,
    NOW() - ((gs * 15) || ' minutes')::INTERVAL AS measured_at,
    u.id AS created_by
FROM bulk_batches b
JOIN norms n ON n.product_id = b.product_id
CROSS JOIN GENERATE_SERIES(1, 40) gs
CROSS JOIN loader_user u;

WITH batch_stats AS (
    SELECT
        b.id AS batch_id,
        COUNT(*)::NUMERIC AS total_cnt,
        SUM(
            CASE
                WHEN (n.min_value IS NOT NULL AND me.value < n.min_value)
                  OR (n.max_value IS NOT NULL AND me.value > n.max_value)
                THEN 1
                ELSE 0
            END
        )::NUMERIC AS out_cnt
    FROM batches b
    JOIN measurements me ON me.batch_id = b.id
    JOIN norms n
        ON n.product_id = b.product_id
       AND n.metric_id = me.metric_id
    WHERE b.batch_number LIKE 'BULK-%'
    GROUP BY b.id
),
batch_percents AS (
    SELECT
        s.batch_id,
        COALESCE(ROUND((s.out_cnt / NULLIF(s.total_cnt, 0)) * 100), 0) AS out_percent
    FROM batch_stats s
)
UPDATE batches b
SET status = CASE
    WHEN p.out_percent = 0 THEN 'OK'
    WHEN p.out_percent <= 10 THEN 'WARNING'
    ELSE 'FAIL'
END
FROM batch_percents p
WHERE b.id = p.batch_id;
