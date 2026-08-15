import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:4173'],
}));
app.use(express.json());

// Serve uploaded product images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Product CRUD (admin auth checked per-route via middleware on mutating methods)
app.use('/api/products', (req, res, next) => {
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    const token = req.headers['x-admin-token'];
    if (token !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorised' });
  }
  next();
}, productsRouter);

// Orders — POST is public (customer), GET/PATCH require admin token
app.use('/api/orders', (req, res, next) => {
  if (req.method !== 'POST') {
    const token = req.headers['x-admin-token'];
    if (token !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorised' });
  }
  next();
}, ordersRouter);

// Admin login — returns the password itself as the "token" (simple, stateless)
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ token: ADMIN_PASSWORD });
  } else {
    res.status(401).json({ error: 'Wrong password' });
  }
});

app.listen(PORT, () => {
  console.log(`House of 8 backend → http://localhost:${PORT}`);
  console.log(`Admin password: ${ADMIN_PASSWORD}`);
});
