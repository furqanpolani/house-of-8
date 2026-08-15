import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Attach images array to a product row
function withImages(product) {
  if (!product) return null;
  const images = db
    .prepare('SELECT id, filename, is_primary FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, id ASC')
    .all(product.id);
  return { ...product, images };
}

// GET /api/products — optionally filter by category
router.get('/', (req, res) => {
  const { category } = req.query;
  const rows = category && category !== 'See All'
    ? db.prepare('SELECT * FROM products WHERE category = ? ORDER BY created_at DESC').all(category)
    : db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
  res.json(rows.map(withImages));
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json(withImages(product));
});

// POST /api/products — create (single optional image via legacy field)
router.post('/', upload.single('image'), (req, res) => {
  const { name, category, material, price, rating } = req.body;
  if (!name || !category || !price) return res.status(400).json({ error: 'name, category, price required' });
  const image = req.file ? req.file.filename : null;
  const result = db.prepare(
    'INSERT INTO products (name, category, material, price, rating, image) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(name, category, material || null, Number(price), Number(rating) || 5, image);
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(withImages(product));
});

// PUT /api/products/:id — update text fields
router.put('/:id', upload.single('image'), (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const { name, category, material, price, rating } = req.body;
  const image = req.file ? req.file.filename : existing.image;
  db.prepare(
    'UPDATE products SET name=?, category=?, material=?, price=?, rating=?, image=? WHERE id=?'
  ).run(
    name || existing.name,
    category || existing.category,
    material ?? existing.material,
    Number(price) || existing.price,
    Number(rating) || existing.rating,
    image,
    req.params.id
  );
  res.json(withImages(db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id)));
});

// DELETE /api/products/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

// ── Image management ─────────────────────────────────────────────────────────

// POST /api/products/:id/images — bulk upload
router.post('/:id/images', upload.array('images', 20), (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  if (!req.files?.length) return res.status(400).json({ error: 'No files uploaded' });

  const existingCount = db.prepare('SELECT COUNT(*) as c FROM product_images WHERE product_id = ?').get(req.params.id).c;

  const insert = db.prepare('INSERT INTO product_images (product_id, filename, is_primary) VALUES (?, ?, ?)');
  req.files.forEach((file, i) => {
    // First file of the first-ever upload is auto-primary
    const isPrimary = existingCount === 0 && i === 0 ? 1 : 0;
    insert.run(req.params.id, file.filename, isPrimary);
  });

  // Sync products.image with primary
  const primary = db.prepare('SELECT filename FROM product_images WHERE product_id = ? AND is_primary = 1').get(req.params.id);
  if (primary) {
    db.prepare('UPDATE products SET image = ? WHERE id = ?').run(primary.filename, req.params.id);
  }

  res.status(201).json(withImages(db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id)));
});

// PUT /api/products/:id/images/:imageId/primary — set primary
router.put('/:id/images/:imageId/primary', (req, res) => {
  const img = db.prepare('SELECT * FROM product_images WHERE id = ? AND product_id = ?').get(req.params.imageId, req.params.id);
  if (!img) return res.status(404).json({ error: 'Image not found' });

  db.prepare('UPDATE product_images SET is_primary = 0 WHERE product_id = ?').run(req.params.id);
  db.prepare('UPDATE product_images SET is_primary = 1 WHERE id = ?').run(req.params.imageId);
  db.prepare('UPDATE products SET image = ? WHERE id = ?').run(img.filename, req.params.id);

  res.json(withImages(db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id)));
});

// DELETE /api/products/:id/images/:imageId — remove one image
router.delete('/:id/images/:imageId', (req, res) => {
  const img = db.prepare('SELECT * FROM product_images WHERE id = ? AND product_id = ?').get(req.params.imageId, req.params.id);
  if (!img) return res.status(404).json({ error: 'Image not found' });

  db.prepare('DELETE FROM product_images WHERE id = ?').run(req.params.imageId);

  // If deleted image was primary, promote the next one
  if (img.is_primary) {
    const next = db.prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY id ASC LIMIT 1').get(req.params.id);
    if (next) {
      db.prepare('UPDATE product_images SET is_primary = 1 WHERE id = ?').run(next.id);
      db.prepare('UPDATE products SET image = ? WHERE id = ?').run(next.filename, req.params.id);
    } else {
      db.prepare('UPDATE products SET image = NULL WHERE id = ?').run(req.params.id);
    }
  }

  res.json(withImages(db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id)));
});

export default router;
