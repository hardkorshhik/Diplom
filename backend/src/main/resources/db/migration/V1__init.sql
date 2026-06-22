CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(255),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(16) NOT NULL,
    CONSTRAINT users_role_check CHECK (role IN ('ADMIN', 'QA', 'LAB'))
);

CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE metrics (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    unit VARCHAR(255) NOT NULL
);

CREATE TABLE batches (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    batch_number VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    comment VARCHAR(255),
    status VARCHAR(16) NOT NULL DEFAULT 'OK',
    CONSTRAINT batches_product_fk FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT batches_status_check CHECK (status IN ('OK', 'WARNING', 'FAIL'))
);

CREATE TABLE norms (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    metric_id BIGINT NOT NULL,
    min_value DOUBLE PRECISION,
    max_value DOUBLE PRECISION,
    CONSTRAINT norms_product_fk FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT norms_metric_fk FOREIGN KEY (metric_id) REFERENCES metrics(id),
    CONSTRAINT uk_norms_product_metric UNIQUE (product_id, metric_id)
);

CREATE TABLE measurements (
    id BIGSERIAL PRIMARY KEY,
    batch_id BIGINT NOT NULL,
    metric_id BIGINT NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by BIGINT NOT NULL,
    CONSTRAINT measurements_batch_fk FOREIGN KEY (batch_id) REFERENCES batches(id),
    CONSTRAINT measurements_metric_fk FOREIGN KEY (metric_id) REFERENCES metrics(id),
    CONSTRAINT measurements_created_by_fk FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_batches_product_id ON batches(product_id);
CREATE INDEX idx_norms_product_id ON norms(product_id);
CREATE INDEX idx_norms_metric_id ON norms(metric_id);
CREATE INDEX idx_measurements_batch_id ON measurements(batch_id);
CREATE INDEX idx_measurements_metric_id ON measurements(metric_id);
CREATE INDEX idx_measurements_created_by ON measurements(created_by);
