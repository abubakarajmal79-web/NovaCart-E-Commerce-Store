import express from 'express';
import { getDb } from '../database/database.js';

const router = express.Router();

/**
 * Helper to ensure cart exists in session
 */
function initSessionCart(req) {
  if (!req.session.cart) {
    req.session.cart = []; // Array of { productId, quantity }
  }
  return req.session.cart;
}

/**
 * Calculates cart items and totals with fresh database values.
 * Never trusts prices or quantities stored client-side.
 */
async function buildFullCart(cartSessionItems) {
  const db = await getDb();
  const items = [];
  let subtotal = 0;
  let totalItems = 0;

  for (const item of cartSessionItems) {
    const product = await db.get('SELECT * FROM products WHERE id = ?', [item.productId]);
    if (product) {
      // Ensure quantity doesn't exceed current stock
      const cappedQuantity = Math.min(item.quantity, Math.max(0, product.stock));
      item.quantity = cappedQuantity;

      if (cappedQuantity > 0) {
        const itemSubtotal = parseFloat((product.price * cappedQuantity).toFixed(2));
        subtotal += itemSubtotal;
        totalItems += cappedQuantity;

        items.push({
          productId: product.id,
          name: product.name,
          price: product.price,
          category: product.category,
          image_url: product.image_url,
          stock: product.stock,
          quantity: cappedQuantity,
          subtotal: itemSubtotal
        });
      }
    }
  }

  // Calculate pricing summary
  subtotal = parseFloat(subtotal.toFixed(2));
  const shippingFee = subtotal === 0 || subtotal >= 75 ? 0 : 9.99;
  const tax = subtotal === 0 ? 0 : parseFloat((subtotal * 0.08).toFixed(2)); // 8% sales tax
  const total = parseFloat((subtotal + shippingFee + tax).toFixed(2));

  return {
    items,
    summary: {
      subtotal,
      shippingFee,
      tax,
      total,
      totalItems,
      freeShippingThreshold: 75,
      freeShippingQualified: subtotal >= 75
    }
  };
}

/**
 * GET /api/cart
 * Returns the current shopping cart with verified product prices and stock
 */
router.get('/', async (req, res) => {
  try {
    const sessionCart = initSessionCart(req);
    const cart = await buildFullCart(sessionCart);

    // Keep session in sync in case items were capped
    req.session.cart = sessionCart.filter(i => i.quantity > 0);

    res.json({
      success: true,
      cart
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ success: false, message: 'Failed to load shopping cart.' });
  }
});

/**
 * POST /api/cart
 * Adds a product to the shopping cart
 */
router.post('/', async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const pId = parseInt(productId, 10);
    const qty = parseInt(quantity, 10) || 1;

    if (isNaN(pId) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Valid product ID and positive quantity required.' });
    }

    const db = await getDb();
    const product = await db.get('SELECT id, name, price, stock FROM products WHERE id = ?', [pId]);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    if (product.stock <= 0) {
      return res.status(400).json({ success: false, message: `"${product.name}" is currently out of stock.` });
    }

    const sessionCart = initSessionCart(req);
    const existingIndex = sessionCart.findIndex(item => item.productId === pId);

    let newQty = qty;
    if (existingIndex > -1) {
      newQty = sessionCart[existingIndex].quantity + qty;
    }

    if (newQty > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} units of "${product.name}" are in stock.`
      });
    }

    if (existingIndex > -1) {
      sessionCart[existingIndex].quantity = newQty;
    } else {
      sessionCart.push({ productId: pId, quantity: newQty });
    }

    req.session.cart = sessionCart;
    const cart = await buildFullCart(sessionCart);

    res.json({
      success: true,
      message: `Added "${product.name}" to cart!`,
      cart
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ success: false, message: 'Failed to add item to cart.' });
  }
});

/**
 * PUT /api/cart/:productId
 * Updates quantity of a specific product in the cart
 */
router.put('/:productId', async (req, res) => {
  try {
    const pId = parseInt(req.params.productId, 10);
    const qty = parseInt(req.body.quantity, 10);

    if (isNaN(pId) || isNaN(qty)) {
      return res.status(400).json({ success: false, message: 'Valid product ID and quantity required.' });
    }

    const sessionCart = initSessionCart(req);
    const itemIndex = sessionCart.findIndex(item => item.productId === pId);

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item is not in your cart.' });
    }

    // If quantity is 0 or less, remove item
    if (qty <= 0) {
      sessionCart.splice(itemIndex, 1);
      req.session.cart = sessionCart;
      const cart = await buildFullCart(sessionCart);
      return res.json({
        success: true,
        message: 'Item removed from cart.',
        cart
      });
    }

    // Validate with product stock
    const db = await getDb();
    const product = await db.get('SELECT id, name, stock FROM products WHERE id = ?', [pId]);

    if (!product) {
      sessionCart.splice(itemIndex, 1);
      req.session.cart = sessionCart;
      const cart = await buildFullCart(sessionCart);
      return res.json({ success: true, message: 'Product no longer available.', cart });
    }

    if (qty > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Maximum available stock for "${product.name}" is ${product.stock}.`
      });
    }

    sessionCart[itemIndex].quantity = qty;
    req.session.cart = sessionCart;
    const cart = await buildFullCart(sessionCart);

    res.json({
      success: true,
      message: 'Cart updated successfully.',
      cart
    });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ success: false, message: 'Failed to update cart.' });
  }
});

/**
 * DELETE /api/cart/:productId
 * Removes a product from the shopping cart
 */
router.delete('/:productId', async (req, res) => {
  try {
    const pId = parseInt(req.params.productId, 10);
    const sessionCart = initSessionCart(req);

    req.session.cart = sessionCart.filter(item => item.productId !== pId);
    const cart = await buildFullCart(req.session.cart);

    res.json({
      success: true,
      message: 'Item removed from cart.',
      cart
    });
  } catch (error) {
    console.error('Error removing cart item:', error);
    res.status(500).json({ success: false, message: 'Failed to remove item.' });
  }
});

/**
 * DELETE /api/cart
 * Clears the entire cart
 */
router.delete('/', async (req, res) => {
  try {
    req.session.cart = [];
    const cart = await buildFullCart([]);
    res.json({
      success: true,
      message: 'Shopping cart cleared.',
      cart
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ success: false, message: 'Failed to clear cart.' });
  }
});

export default router;
