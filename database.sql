-- =============================================================
-- NP2 RBAC - Script do banco de dados (PostgreSQL)
-- Execução: psql -U postgres -d np2_rbac -f database.sql
-- (ou automaticamente via `npm run db:init` / docker compose)
-- =============================================================

-- Tabela de Usuários (participantes)
CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(120) NOT NULL,
    email       VARCHAR(160) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(10)  NOT NULL DEFAULT 'USER'
                CHECK (role IN ('ADMIN', 'EDITOR', 'USER')),
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Tabela de Eventos
CREATE TABLE IF NOT EXISTS events (
    id           SERIAL PRIMARY KEY,
    title        VARCHAR(200) NOT NULL,
    description  TEXT,
    date         TIMESTAMP    NOT NULL,
    location     VARCHAR(200),
    created_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Tabela de Inscrições
CREATE TABLE IF NOT EXISTS subscriptions (
    id             SERIAL PRIMARY KEY,
    user_id        INTEGER NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    event_id       INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    subscribed_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, event_id)
);

-- Tabela de Certificados (1 por inscrição)
CREATE TABLE IF NOT EXISTS certificates (
    id               SERIAL PRIMARY KEY,
    subscription_id  INTEGER NOT NULL UNIQUE REFERENCES subscriptions(id) ON DELETE CASCADE,
    code             VARCHAR(64) NOT NULL UNIQUE DEFAULT UPPER(REPLACE(gen_random_uuid()::text, '-', '')),
    issued_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices para filtros e buscas
CREATE INDEX IF NOT EXISTS idx_events_date          ON events (date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user   ON subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_event  ON subscriptions (event_id);
