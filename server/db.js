import pg from 'pg';
import AIVEN_CA from './aiven-ca.js';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

// TLS is configured below; drop sslmode so pg doesn't override it.
const url = new URL(process.env.DATABASE_URL);
url.searchParams.delete('sslmode');
const ssl = { rejectUnauthorized: true, ca: AIVEN_CA };

// Kept small: every serverless instance opens its own pool and the
// Aiven plan allows 20 connections in total.
export const pool = new pg.Pool({
  connectionString: url.toString(),
  ssl,
  max: 3,
  idleTimeoutMillis: 10_000,
});

export function query(text, params) {
  return pool.query(text, params);
}

export const SCHEMA = `
  CREATE TABLE IF NOT EXISTS products (
    id                SERIAL PRIMARY KEY,
    name              TEXT NOT NULL,
    category          TEXT NOT NULL,
    material          TEXT,
    price             INTEGER NOT NULL,
    rating            REAL DEFAULT 5,
    image             TEXT,
    finish            TEXT,
    dimensions        TEXT,
    weight            TEXT,
    description       TEXT,
    short_description TEXT,
    created_at        TIMESTAMPTZ DEFAULT now()
  );

  -- Uploaded images live in the database (data/mime) because Vercel
  -- functions cannot write to disk. Rows without data point at files
  -- shipped in public/uploads.
  CREATE TABLE IF NOT EXISTS product_images (
    id         SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    filename   TEXT NOT NULL,
    is_primary SMALLINT DEFAULT 0,
    mime       TEXT,
    data       BYTEA,
    UNIQUE (product_id, filename)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id               SERIAL PRIMARY KEY,
    customer_name    TEXT NOT NULL,
    customer_email   TEXT NOT NULL,
    customer_phone   TEXT,
    customer_address TEXT,
    total_amount     DOUBLE PRECISION NOT NULL,
    status           TEXT DEFAULT 'pending',
    created_at       TIMESTAMPTZ DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id            SERIAL PRIMARY KEY,
    order_id      INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id    INTEGER,
    product_name  TEXT NOT NULL,
    product_price DOUBLE PRECISION NOT NULL,
    quantity      INTEGER NOT NULL DEFAULT 1,
    subtotal      DOUBLE PRECISION NOT NULL
  );
`;
