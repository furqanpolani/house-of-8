import express from 'express';
import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import { query } from './db.js';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const app = express();
app.use(express.json());

function isAdmin(req) {
  return Boolean(ADMIN_PASSWORD) && req.headers['x-admin-token'] === ADMIN_PASSWORD;
}

// Uploaded product images, stored in Postgres. Images shipped in
// public/uploads are served as static files before reaching this route.
app.get(['/uploads/:filename', '/api/uploads/:filename'], async (req, res) => {
  const { rows: [img] } = await query(
    'SELECT mime, data FROM product_images WHERE filename = $1 AND data IS NOT NULL',
    [req.params.filename]
  );
  if (!img) return res.status(404).end();
  res.set('Content-Type', img.mime || 'application/octet-stream');
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.send(img.data);
});

// Product CRUD — reads are public, writes need the admin token
app.use('/api/products', (req, res, next) => {
  if (req.method !== 'GET' && !isAdmin(req)) return res.status(401).json({ error: 'Unauthorised' });
  next();
}, productsRouter);

// Orders — POST is public (customer), everything else needs the admin token
app.use('/api/orders', (req, res, next) => {
  if (req.method !== 'POST' && !isAdmin(req)) return res.status(401).json({ error: 'Unauthorised' });
  next();
}, ordersRouter);

// Admin login — returns the password itself as the "token" (simple, stateless)
app.post('/api/admin/login', (req, res) => {
  if (!ADMIN_PASSWORD) return res.status(503).json({ error: 'Admin is not configured' });
  if (req.body?.password === ADMIN_PASSWORD) {
    res.json({ token: ADMIN_PASSWORD });
  } else {
    res.status(401).json({ error: 'Wrong password' });
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 500;
  res.status(status).json({ error: status === 413 ? 'Image is larger than 4MB' : 'Server error' });
});

export default app;
