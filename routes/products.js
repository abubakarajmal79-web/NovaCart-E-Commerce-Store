import express from 'express';
import { getDb } from '../database/database.js';

const router = express.Router();

/**
 * GET /api/products/categories
 * Returns distinct category list
 */
router.get('/categories', async (req, res) => {
  try {
    const db = await getDb();
    const rows = await db.all('SELECT DISTINCT category FROM products ORDER BY category ASC');
    const categories = rows.map(r => r.category);
    res.json({ success: true, categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
  }
});

/**
 * GET /api/products
 * Search, filter by category, sort by price/rating/name
 */
router.get('/', async (req, res) => {
  try {
    const { search, category, sort } = req.query;
    const db = await getDb();

    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    // Filter by category
    if (category && category.trim() && category.toLowerCase() !== 'all') {
      query += ' AND LOWER(category) = LOWER(?)';
      params.push(category.trim());
    }

    // Search keyword in name or description
    if (search && search.trim()) {
      query += ' AND (LOWER(name) LIKE ? OR LOWER(description) LIKE ?)';
      const term = `%${search.trim().toLowerCase()}%`;
      params.push(term, term);
    }

    // Sort order
    if (sort === 'price_asc') {
      query += ' ORDER BY price ASC';
    } else if (sort === 'price_desc') {
      query += ' ORDER BY price DESC';
    } else if (sort === 'rating_desc') {
      query += ' ORDER BY rating DESC';
    } else if (sort === 'name_asc') {
      query += ' ORDER BY name ASC';
    } else {
      // Default newest / id asc
      query += ' ORDER BY id ASC';
    }

    const products = await db.all(query, params);

    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve products.' });
  }
});

/**
 * GET /api/products/:id
 * Retrieve single product details and related products
 */
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID.' });
    }

    const db = await getDb();
    const product = await db.get('SELECT * FROM products WHERE id = ?', [id]);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Fetch up to 3 related products in same category
    const related = await db.all(
      'SELECT id, name, price, image_url, category, rating FROM products WHERE category = ? AND id != ? LIMIT 3',
      [product.category, product.id]
    );

    res.json({
      success: true,
      product,
      related
    });
  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve product details.' });
  }
});

export default router;
