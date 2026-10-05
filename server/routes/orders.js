import express from 'express';
import { pool, query } from '../db.js';

const router = express.Router();

// POST /api/orders — customer places an order (public)
router.post('/', async (req, res) => {
  const { customer_name, customer_email, customer_phone, customer_address, items } = req.body;

  if (!customer_name || !customer_email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order must have at least one item' });
  }

  const total_amount = items.reduce((sum, i) => sum + (i.product_price * i.quantity), 0);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: [order] } = await client.query(
      `INSERT INTO orders (customer_name, customer_email, customer_phone, customer_address, total_amount)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [customer_name, customer_email, customer_phone || null, customer_address || null, total_amount]
    );
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [order.id, item.product_id || null, item.product_name,
         item.product_price, item.quantity, item.product_price * item.quantity]
      );
    }
    await client.query('COMMIT');
    res.status(201).json(order);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Could not place order' });
  } finally {
    client.release();
  }
});

// GET /api/orders — admin: list all orders (newest first)
router.get('/', async (req, res) => {
  const { rows } = await query(`
    SELECT o.*, COUNT(oi.id)::int AS item_count
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `);
  res.json(rows);
});

// GET /api/orders/:id — admin: single order with all items
router.get('/:id', async (req, res) => {
  const { rows: [order] } = await query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
  if (!order) return res.status(404).json({ error: 'Not found' });
  const { rows: items } = await query('SELECT * FROM order_items WHERE order_id = $1', [req.params.id]);
  res.json({ ...order, items });
});

// PATCH /api/orders/:id/status — admin: update status
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  const valid = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const { rows: [order] } = await query(
    'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *', [status, req.params.id]
  );
  if (!order) return res.status(404).json({ error: 'Not found' });
  res.json(order);
});

export default router;
