import pg from 'pg';
import AIVEN_CA from './aiven-ca.js';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

// TLS is configured below; drop sslmode so pg doesn't override it.
const url = new URL(process.env.DATABASE_URL);
url.searchParams.delete('sslmode');
const ssl = { rejectUnauthorized: true, ca: AIVEN_CA };

// The Aiven plan allows 20 connections in total and every Vercel instance
// opens its own pool. A frozen instance never runs the client-side idle
// timer, so its sockets stayed open until the database ran out of slots.
// Guards: one connection per serverless instance (3 locally), and the
// database itself closes sessions idle for 60s (idle_session_timeout is
// also set on the avnadmin role so every client gets it).
export const pool = new pg.Pool({
  connectionString: url.toString(),
  ssl,
  max: process.env.VERCEL ? 1 : 3,
  idleTimeoutMillis: 10_000,
  options: '-c idle_session_timeout=60000 -c idle_in_transaction_session_timeout=60000',
});

// An idle connection the server closed is reported here; the pool drops it
// and opens a fresh one on the next query. Without a listener this event
// would crash the process.
pool.on('error', (err) => {
  console.warn('Idle database connection closed:', err.code || err.message);
});

// A thawed instance can still hand out a connection the server already
// closed. Retry once on those errors.
const STALE = new Set(['57P01', '57P05', 'ECONNRESET', 'EPIPE']);
function isStale(err) {
  return STALE.has(err.code) || /Connection terminated|not queryable/i.test(err.message);
}

export async function query(text, params) {
  try {
    return await pool.query(text, params);
  } catch (err) {
    if (!isStale(err)) throw err;
    return pool.query(text, params);
  }
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
    active            BOOLEAN NOT NULL DEFAULT true,
    created_at        TIMESTAMPTZ DEFAULT now()
  );

  -- Inactive products are hidden from the public site but kept for admin.
  ALTER TABLE products ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

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
