import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, 'house-of-8.db'));
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS product_images (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    filename   TEXT    NOT NULL,
    is_primary INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS products (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    category    TEXT    NOT NULL,
    material    TEXT,
    price       INTEGER NOT NULL,
    rating      REAL    DEFAULT 5.0,
    image       TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name    TEXT    NOT NULL,
    customer_email   TEXT    NOT NULL,
    customer_phone   TEXT,
    customer_address TEXT,
    total_amount     REAL    NOT NULL,
    status           TEXT    DEFAULT 'pending',
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id      INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id    INTEGER,
    product_name  TEXT    NOT NULL,
    product_price REAL    NOT NULL,
    quantity      INTEGER NOT NULL DEFAULT 1,
    subtotal      REAL    NOT NULL
  );
`);

// Seed default products if table is empty
const count = db.prepare('SELECT COUNT(*) as c FROM products').get();
if (count.c === 0) {
  const insert = db.prepare(
    'INSERT INTO products (name, category, material, price, rating, image) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const seed = [
    ['Arm Chair',     'Arm Chair',    'Fabric · Olive Print', 45000, 5, 'default-chair.png'],
    ['Side Table',    'Coffee Table', 'Travertine Stone',     38000, 5, 'default-table1.png'],
    ['Coffee Table',  'Coffee Table', 'Natural Stone',        55000, 5, 'default-table2.png'],
    ['Luxury Bed',    'Bed',          'Walnut & Linen',       120000, 5, null],
    ['Sette Sofa',    'Sette',        'Velvet · Sage Green',  85000, 5, null],
    ['Vase Set',      'Accessories',  'Ceramic',              12000, 5, null],
  ];
  seed.forEach(row => insert.run(...row));
}

export default db;
