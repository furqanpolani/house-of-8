import express from 'express';
import multer from 'multer';
import path from 'path';
import { query } from '../db.js';

const router = express.Router();

// Files are held in memory and stored in Postgres. 4MB per file keeps each
// request under Vercel's 4.5MB body limit (the admin uploads one at a time).
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 4 * 1024 * 1024 } });

const SELECT_PRODUCTS = `
  SELECT p.id, p.name, p.category, p.material, p.price, p.rating, p.image,
         p.finish, p.dimensions, p.weight, p.description,
         p.short_description AS "shortDescription", p.created_at,
         COALESCE(
           json_agg(json_build_object('id', i.id, 'filename', i.filename, 'is_primary', i.is_primary)
                    ORDER BY i.is_primary DESC, i.id ASC)
             FILTER (WHERE i.id IS NOT NULL),
           '[]'
         ) AS images
  FROM products p
  LEFT JOIN product_images i ON i.product_id = p.id`;

async function findProduct(id) {
  const { rows } = await query(`${SELECT_PRODUCTS} WHERE p.id = $1 GROUP BY p.id`, [id]);
  return rows[0] || null;
}

// Keep products.image in step with the primary image.
async function syncPrimary(productId) {
  await query(
    `UPDATE products SET image = (
       SELECT filename FROM product_images
       WHERE product_id = $1 AND is_primary = 1 LIMIT 1
     ) WHERE id = $1`,
    [productId]
  );
}

// Text fields the admin can set; maps request body keys to columns.
const TEXT_FIELDS = {
  material: 'material', finish: 'finish', dimensions: 'dimensions', weight: 'weight',
  description: 'description', shortDescription: 'short_description',
};

// GET /api/products — optionally filter by category
router.get('/', async (req, res) => {
  const { category } = req.query;
  const filter = category && category !== 'See All';
  const { rows } = await query(
    `${SELECT_PRODUCTS} ${filter ? 'WHERE p.category = $1' : ''}
     GROUP BY p.id ORDER BY p.created_at DESC, p.id DESC`,
    filter ? [category] : []
  );
  res.json(rows);
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  const product = await findProduct(req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json(product);
});

// POST /api/products — create
router.post('/', upload.none(), async (req, res) => {
  const { name, category, price, rating } = req.body;
  if (!name || !category || !price) return res.status(400).json({ error: 'name, category, price required' });
  const cols = Object.keys(TEXT_FIELDS);
  const { rows } = await query(
    `INSERT INTO products (name, category, price, rating, ${cols.map(k => TEXT_FIELDS[k]).join(', ')})
     VALUES ($1, $2, $3, $4, ${cols.map((_, i) => `$${i + 5}`).join(', ')}) RETURNING id`,
    [name, category, Number(price), Number(rating) || 5, ...cols.map(k => req.body[k] || null)]
  );
  res.status(201).json(await findProduct(rows[0].id));
});

// PUT /api/products/:id — update fields
router.put('/:id', upload.none(), async (req, res) => {
  const existing = await findProduct(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const { name, category, price, rating } = req.body;
  const cols = Object.keys(TEXT_FIELDS);
  await query(
    `UPDATE products SET name = $1, category = $2, price = $3, rating = $4,
       ${cols.map((k, i) => `${TEXT_FIELDS[k]} = $${i + 5}`).join(', ')}
     WHERE id = $${cols.length + 5}`,
    [
      name || existing.name,
      category || existing.category,
      Number(price) || existing.price,
      Number(rating) || existing.rating,
      ...cols.map(k => (k in req.body ? req.body[k] || null : existing[k])),
      req.params.id,
    ]
  );
  res.json(await findProduct(req.params.id));
});

// DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
  const { rowCount } = await query('DELETE FROM products WHERE id = $1', [req.params.id]);
  if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

// ── Image management ─────────────────────────────────────────────────────────

// POST /api/products/:id/images — upload one or more images
router.post('/:id/images', upload.array('images', 20), async (req, res) => {
  const product = await findProduct(req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  if (!req.files?.length) return res.status(400).json({ error: 'No files uploaded' });

  let hasPrimary = product.images.some(i => i.is_primary);
  for (const file of req.files) {
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname).toLowerCase()}`;
    await query(
      'INSERT INTO product_images (product_id, filename, is_primary, mime, data) VALUES ($1, $2, $3, $4, $5)',
      [req.params.id, filename, hasPrimary ? 0 : 1, file.mimetype, file.buffer]
    );
    hasPrimary = true;
  }
  await syncPrimary(req.params.id);

  res.status(201).json(await findProduct(req.params.id));
});

// PUT /api/products/:id/images/:imageId/primary — set primary
router.put('/:id/images/:imageId/primary', async (req, res) => {
  const { rows } = await query(
    'SELECT id FROM product_images WHERE id = $1 AND product_id = $2',
    [req.params.imageId, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Image not found' });

  await query(
    'UPDATE product_images SET is_primary = CASE WHEN id = $1 THEN 1 ELSE 0 END WHERE product_id = $2',
    [req.params.imageId, req.params.id]
  );
  await syncPrimary(req.params.id);

  res.json(await findProduct(req.params.id));
});

// DELETE /api/products/:id/images/:imageId — remove one image
router.delete('/:id/images/:imageId', async (req, res) => {
  const { rows } = await query(
    'DELETE FROM product_images WHERE id = $1 AND product_id = $2 RETURNING is_primary',
    [req.params.imageId, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Image not found' });

  // If the deleted image was primary, promote the next one
  if (rows[0].is_primary) {
    await query(
      `UPDATE product_images SET is_primary = 1 WHERE id = (
         SELECT id FROM product_images WHERE product_id = $1 ORDER BY id ASC LIMIT 1
       )`,
      [req.params.id]
    );
  }
  await syncPrimary(req.params.id);

  res.json(await findProduct(req.params.id));
});

export default router;
