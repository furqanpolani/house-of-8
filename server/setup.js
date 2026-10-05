// Creates the tables and seeds them from public/data/products.json.
// Safe to re-run: existing rows are left alone.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, SCHEMA } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const products = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../public/data/products.json'), 'utf8')
);

await pool.query(SCHEMA);

// Same ids as the static JSON so links from the home page keep working.
for (const p of products) {
  await pool.query(
    `INSERT INTO products (id, name, category, material, price, rating, image, finish, dimensions,
                           weight, description, short_description, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     ON CONFLICT (id) DO NOTHING`,
    [p.id, p.name, p.category, p.material, p.price, p.rating, p.image, p.finish, p.dimensions,
     p.weight, p.description, p.shortDescription, p.created_at]
  );
  for (const img of p.images || []) {
    await pool.query(
      `INSERT INTO product_images (product_id, filename, is_primary)
       VALUES ($1, $2, $3) ON CONFLICT (filename) DO NOTHING`,
      [p.id, img.filename, img.is_primary]
    );
  }
}

// Explicit ids above don't advance the sequence; move it past them.
await pool.query(`SELECT setval('products_id_seq', (SELECT COALESCE(MAX(id), 1) FROM products))`);

const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM products');
console.log(`Database ready — ${rows[0].n} products`);
await pool.end();
