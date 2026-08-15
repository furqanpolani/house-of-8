import express from 'express';
import db from '../db.js';

const router = express.Router();

// POST /api/orders — customer places an order (public)
router.post('/', (req, res) => {
  const { customer_name, customer_email, customer_phone, customer_address, items } = req.body;

  if (!customer_name || !customer_email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order must have at least one item' });
  }

  const total_amount = items.reduce((sum, i) => sum + (i.product_price * i.quantity), 0);

  const insertOrder = db.prepare(`
    INSERT INTO orders (customer_name, customer_email, customer_phone, customer_address, total_amount)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const placeOrder = db.transaction(() => {
    const { lastInsertRowid: orderId } = insertOrder.run(
      customer_name, customer_email, customer_phone || null,
      customer_address || null, total_amount
    );
    for (const item of items) {
      insertItem.run(
        orderId, item.product_id || null, item.product_name,
        item.product_price, item.quantity, item.product_price * item.quantity
      );
    }
    return db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  });

  try {
    const order = placeOrder();
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: 'Could not place order' });
  }
});

// GET /api/orders — admin: list all orders (newest first)
router.get('/', (req, res) => {
  const orders = db.prepare(`
    SELECT o.*,
           COUNT(oi.id) as item_count
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `).all();
  res.json(orders);
});

// GET /api/orders/:id — admin: single order with all items
router.get('/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Not found' });
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(req.params.id);
  res.json({ ...order, items });
});

// PATCH /api/orders/:id/status — admin: update status
router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  const valid = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const result = db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json(db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id));
});

export default router;
