import express from 'express';
import { getDb } from '../database/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * Generate human-friendly order number (e.g., NC-K8Z2-4912)
 */
function generateOrderNumber() {
  const dateSegment = Date.now().toString(36).toUpperCase().slice(-4);
  const randomSegment = Math.floor(1000 + Math.random() * 9000);
  return `NC-${dateSegment}-${randomSegment}`;
}

/**
 * POST /api/orders
 * Creates an order, verifies prices and stock, writes to database, and clears cart
 */
router.post('/', async (req, res) => {
  try {
    const {
      customer_name,
      customer_email,
      shipping_address,
      city,
      postal_code,
      phone,
      payment_method,
      items: clientItems // Optional fallback if session was lost
    } = req.body;

    // Validate customer details
    if (!customer_name || !customer_name.trim()) {
      return res.status(400).json({ success: false, message: 'Recipient name is required.' });
    }
    if (!customer_email || !customer_email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }
    if (!shipping_address || !shipping_address.trim()) {
      return res.status(400).json({ success: false, message: 'Street address is required.' });
    }
    if (!city || !city.trim()) {
      return res.status(400).json({ success: false, message: 'City is required.' });
    }
    if (!postal_code || !postal_code.trim()) {
      return res.status(400).json({ success: false, message: 'Postal / ZIP code is required.' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }

    // Determine cart items
    let cartSource = (req.session && req.session.cart && req.session.cart.length > 0)
      ? req.session.cart
      : (Array.isArray(clientItems) ? clientItems : []);

    if (!cartSource || cartSource.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Your cart is empty. Please add products before checking out.'
      });
    }

    const db = await getDb();

    // Verify stock and compute verified server-side totals
    const verifiedItems = [];
    let subtotal = 0;

    for (const item of cartSource) {
      const pId = parseInt(item.productId || item.id, 10);
      const qty = parseInt(item.quantity, 10);

      if (isNaN(pId) || isNaN(qty) || qty <= 0) {
        continue;
      }

      const product = await db.get('SELECT id, name, price, stock FROM products WHERE id = ?', [pId]);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product ID #${pId} is no longer available.`
        });
      }

      if (product.stock < qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Only ${product.stock} left in stock.`
        });
      }

      const itemSubtotal = parseFloat((product.price * qty).toFixed(2));
      subtotal += itemSubtotal;

      verifiedItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: qty,
        subtotal: itemSubtotal
      });
    }

    if (verifiedItems.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid items found in order.' });
    }

    subtotal = parseFloat(subtotal.toFixed(2));
    const shippingFee = subtotal >= 75 ? 0 : 9.99;
    const tax = parseFloat((subtotal * 0.08).toFixed(2));
    const total = parseFloat((subtotal + shippingFee + tax).toFixed(2));
    const orderNumber = generateOrderNumber();
    const userId = req.user ? req.user.id : null;
    const paymentMethodClean = payment_method && payment_method.trim() ? payment_method.trim() : 'Credit / Debit Card';

    // Begin database transaction for atomicity
    await db.run('BEGIN TRANSACTION');

    try {
      // 1. Insert order
      const orderResult = await db.run(`
        INSERT INTO orders (
          order_number, user_id, customer_name, customer_email,
          shipping_address, city, postal_code, phone, payment_method,
          subtotal, tax, shipping_fee, total, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        orderNumber,
        userId,
        customer_name.trim(),
        customer_email.trim(),
        shipping_address.trim(),
        city.trim(),
        postal_code.trim(),
        phone.trim(),
        paymentMethodClean,
        subtotal,
        tax,
        shippingFee,
        total,
        'Processing'
      ]);

      const orderId = orderResult.lastID;

      // 2. Insert order items & reduce stock
      for (const item of verifiedItems) {
        await db.run(`
          INSERT INTO order_items (order_id, product_id, product_name, price, quantity, subtotal)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          orderId,
          item.productId,
          item.name,
          item.price,
          item.quantity,
          item.subtotal
        ]);

        await db.run(`
          UPDATE products
          SET stock = stock - ?
          WHERE id = ?
        `, [item.quantity, item.productId]);
      }

      await db.run('COMMIT');

      // Clear session cart
      if (req.session) {
        req.session.cart = [];
      }

      // Return complete created order
      res.status(201).json({
        success: true,
        message: 'Order placed successfully!',
        order: {
          id: orderId,
          order_number: orderNumber,
          customer_name: customer_name.trim(),
          customer_email: customer_email.trim(),
          shipping_address: shipping_address.trim(),
          city: city.trim(),
          postal_code: postal_code.trim(),
          phone: phone.trim(),
          payment_method: paymentMethodClean,
          subtotal,
          tax,
          shipping_fee: shippingFee,
          total,
          status: 'Processing',
          items: verifiedItems,
          created_at: new Date().toISOString()
        }
      });
    } catch (txError) {
      await db.run('ROLLBACK');
      throw txError;
    }
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to process order. Please try again.' });
  }
});

/**
 * GET /api/orders
 * Returns all past orders for the authenticated user
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const orders = await db.all(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC',
      [req.user.id]
    );

    // Fetch items for each order
    const populatedOrders = [];
    for (const order of orders) {
      const items = await db.all(
        'SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC',
        [order.id]
      );
      populatedOrders.push({
        ...order,
        items
      });
    }

    res.json({
      success: true,
      orders: populatedOrders
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ success: false, message: 'Failed to load order history.' });
  }
});

/**
 * GET /api/orders/:id
 * Retrieve order details by ID or order_number
 */
router.get('/:id', async (req, res) => {
  try {
    const param = req.params.id;
    const db = await getDb();

    let order = null;
    if (/^\d+$/.test(param)) {
      order = await db.get('SELECT * FROM orders WHERE id = ?', [parseInt(param, 10)]);
    }

    if (!order) {
      order = await db.get('SELECT * FROM orders WHERE order_number = ?', [param]);
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Security check: If order has an assigned user_id, ensure requester is that user
    if (order.user_id) {
      if (!req.user || req.user.id !== order.user_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not have permission to view this order.'
        });
      }
    }

    const items = await db.all(
      'SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC',
      [order.id]
    );

    res.json({
      success: true,
      order: {
        ...order,
        items
      }
    });
  } catch (error) {
    console.error('Error fetching single order:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve order details.' });
  }
});

export default router;
