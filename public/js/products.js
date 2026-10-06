import { apiRequest, showToast, formatCurrency, updateCartBadge, escapeHtml } from './api.js';

let allCategories = [];
let currentCategory = 'all';
let currentSearch = '';
let currentSort = '';

/**
 * Initializes the products catalog page (index.html)
 */
export async function initProductsPage() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  await loadCategories();
  await loadProducts();
  setupFilterListeners();
}

/**
 * Loads distinct categories from API and renders filter pills
 */
async function loadCategories() {
  const container = document.getElementById('category-pills');
  if (!container) return;

  const res = await apiRequest('/products/categories');
  if (res.ok && res.data && res.data.categories) {
    allCategories = res.data.categories;
    
    let html = `<button class="category-pill active" data-category="all">All Products</button>`;
    allCategories.forEach(cat => {
      html += `<button class="category-pill" data-category="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`;
    });
    container.innerHTML = html;

    // Attach click events
    container.querySelectorAll('.category-pill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        container.querySelectorAll('.category-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.category;
        loadProducts();
      });
    });
  }
}

/**
 * Fetches products from /api/products with search, category & sort params
 */
export async function loadProducts() {
  const grid = document.getElementById('products-grid');
  const countSpan = document.getElementById('product-count');
  if (!grid) return;

  grid.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
      <div style="display: inline-block; width: 2rem; height: 2rem; border: 3px solid #e2e8f0; border-top-color: #4f46e5; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
      <p style="color: #64748b; margin-top: 0.75rem; font-size: 0.9rem;">Loading products...</p>
    </div>
  `;

  const queryParams = new URLSearchParams();
  if (currentCategory && currentCategory !== 'all') {
    queryParams.append('category', currentCategory);
  }
  if (currentSearch) {
    queryParams.append('search', currentSearch);
  }
  if (currentSort) {
    queryParams.append('sort', currentSort);
  }

  const endpoint = `/products?${queryParams.toString()}`;
  const res = await apiRequest(endpoint);

  if (!res.ok || !res.data || !res.data.products) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon">⚠️</div>
        <h3 class="empty-title">Failed to load catalog</h3>
        <p class="empty-desc">${escapeHtml(res.data.message || 'Please check your connection and try again.')}</p>
        <button class="btn btn-primary" onclick="window.location.reload()">Retry</button>
      </div>
    `;
    return;
  }

  const products = res.data.products;
  if (countSpan) {
    countSpan.textContent = `Showing ${products.length} product${products.length === 1 ? '' : 's'}`;
  }

  if (products.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon">🔍</div>
        <h3 class="empty-title">No matching products found</h3>
        <p class="empty-desc">Try clearing your search query or choosing a different category filter.</p>
        <button id="reset-filters-btn" class="btn btn-outline">Clear Filters</button>
      </div>
    `;
    document.getElementById('reset-filters-btn')?.addEventListener('click', () => {
      currentSearch = '';
      currentCategory = 'all';
      currentSort = '';
      const searchInput = document.getElementById('search-input');
      const sortSelect = document.getElementById('sort-select');
      if (searchInput) searchInput.value = '';
      if (sortSelect) sortSelect.value = '';
      document.querySelectorAll('.category-pill').forEach(b => {
        b.classList.toggle('active', b.dataset.category === 'all');
      });
      loadProducts();
    });
    return;
  }

  grid.innerHTML = products.map(prod => renderProductCard(prod)).join('');
  attachProductCardEvents(grid);
}

/**
 * Generates HTML string for an individual product card
 */
function renderProductCard(prod) {
  let stockBadge = '<span class="stock-status stock-in">● In Stock</span>';
  let isOutOfStock = false;
  if (prod.stock <= 0) {
    stockBadge = '<span class="stock-status stock-out">● Out of Stock</span>';
    isOutOfStock = true;
  } else if (prod.stock < 10) {
    stockBadge = `<span class="stock-status stock-low">● Only ${prod.stock} left</span>`;
  }

  // Fallback image using placeholder SVG if external image fails
  const fallbackSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect fill="%23f1f5f9" width="400" height="300"/><text fill="%2364748b" font-family="sans-serif" font-size="20" font-weight="600" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">${encodeURIComponent(prod.name.slice(0, 20))}</text></svg>`;

  return `
    <article class="product-card" data-product-id="${prod.id}">
      <div class="product-image-wrap">
        <span class="product-category-tag">${escapeHtml(prod.category)}</span>
        <a href="/product.html?id=${prod.id}">
          <img
            src="${escapeHtml(prod.image_url)}"
            alt="${escapeHtml(prod.name)}"
            loading="lazy"
            onerror="this.onerror=null; this.src='${fallbackSvg}';"
          />
        </a>
      </div>
      <div class="product-body">
        <div class="product-rating">
          <span>★</span>
          <strong>${prod.rating.toFixed(1)}</strong>
          <span class="product-reviews">(${prod.reviews_count})</span>
        </div>
        <h3 class="product-name">
          <a href="/product.html?id=${prod.id}">${escapeHtml(prod.name)}</a>
        </h3>
        <p class="product-desc">${escapeHtml(prod.description)}</p>
        <div class="product-footer">
          <div class="price-stock-wrap">
            <span class="product-price">${formatCurrency(prod.price)}</span>
            ${stockBadge}
          </div>
          <button 
            class="btn btn-primary btn-sm add-to-cart-btn" 
            data-id="${prod.id}"
            ${isOutOfStock ? 'disabled' : ''}
          >
            ${isOutOfStock ? 'Out of Stock' : '+ Add'}
          </button>
        </div>
      </div>
    </article>
  `;
}

/**
 * Attaches click handlers to product cards for cart additions
 */
function attachProductCardEvents(grid) {
  grid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const productId = parseInt(btn.dataset.id, 10);
      const originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = 'Adding...';

      const res = await apiRequest('/cart', {
        method: 'POST',
        body: { productId, quantity: 1 }
      });

      if (res.ok) {
        showToast(res.data.message || 'Product added to cart!', 'success');
        updateCartBadge();
        btn.innerHTML = '✓ Added';
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.disabled = false;
        }, 1200);
      } else {
        showToast(res.data.message || 'Could not add to cart', 'error');
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    });
  });
}

/**
 * Configures search input debounce and sort dropdown change handlers
 */
function setupFilterListeners() {
  const searchInput = document.getElementById('search-input');
  const sortSelect = document.getElementById('sort-select');

  let debounceTimer;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        currentSearch = e.target.value.trim();
        loadProducts();
      }, 300);
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      loadProducts();
    });
  }
}

/**
 * Loads product details for product.html?id=X
 */
export async function initProductDetailsPage() {
  const container = document.getElementById('product-detail-container');
  if (!container) return;

  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  if (!productId) {
    container.innerHTML = `
      <div class="empty-state">
        <h3 class="empty-title">No Product Specified</h3>
        <p class="empty-desc">Please select a product from our catalog.</p>
        <a href="/index.html" class="btn btn-primary">Browse Catalog</a>
      </div>
    `;
    return;
  }

  const res = await apiRequest(`/products/${productId}`);
  if (!res.ok || !res.data || !res.data.product) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h3 class="empty-title">Product Not Found</h3>
        <p class="empty-desc">${escapeHtml(res.data.message || 'The product you are looking for does not exist.')}</p>
        <a href="/index.html" class="btn btn-primary">Back to Catalog</a>
      </div>
    `;
    return;
  }

  const product = res.data.product;
  const related = res.data.related || [];

  document.title = `${product.name} | NovaCart`;

  let stockBadge = '<span class="stock-status stock-in" style="font-size:0.95rem">● In Stock</span>';
  let isOutOfStock = false;
  if (product.stock <= 0) {
    stockBadge = '<span class="stock-status stock-out" style="font-size:0.95rem">● Out of Stock</span>';
    isOutOfStock = true;
  } else if (product.stock < 10) {
    stockBadge = `<span class="stock-status stock-low" style="font-size:0.95rem">● Only ${product.stock} items remaining in stock</span>`;
  }

  const fallbackSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450"><rect fill="%23f1f5f9" width="600" height="450"/><text fill="%2364748b" font-family="sans-serif" font-size="28" font-weight="600" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">${encodeURIComponent(product.name)}</text></svg>`;

  container.innerHTML = `
    <nav style="margin-bottom: 1.5rem; font-size: 0.88rem; color: #64748b;">
      <a href="/index.html" style="color: #4f46e5;">Home</a> / 
      <a href="/index.html" style="color: #4f46e5;">${escapeHtml(product.category)}</a> / 
      <span>${escapeHtml(product.name)}</span>
    </nav>
    <div class="product-detail-layout">
      <div class="detail-gallery">
        <img 
          src="${escapeHtml(product.image_url)}" 
          alt="${escapeHtml(product.name)}"
          onerror="this.onerror=null; this.src='${fallbackSvg}';"
        />
      </div>
      <div class="detail-info">
        <span class="detail-category">${escapeHtml(product.category)}</span>
        <h1 class="detail-title">${escapeHtml(product.name)}</h1>
        <div class="product-rating" style="font-size: 1rem; margin-bottom: 0.75rem;">
          <span>★</span>
          <strong>${product.rating.toFixed(1)}</strong>
          <span class="product-reviews" style="font-size: 0.9rem;">(${product.reviews_count} verified customer reviews)</span>
        </div>
        <div class="detail-price-box">
          <span class="detail-price">${formatCurrency(product.price)}</span>
          <div>${stockBadge}</div>
        </div>
        <p class="detail-desc">${escapeHtml(product.description)}</p>

        <div style="margin-top: auto;">
          <div style="display: flex; align-items: center; gap: 1.5rem; margin-bottom: 1.25rem;">
            <label style="font-weight: 600; font-size: 0.95rem;">Quantity:</label>
            <div class="quantity-control">
              <button class="qty-btn" id="qty-minus" ${isOutOfStock ? 'disabled' : ''}>-</button>
              <input type="number" id="detail-qty-input" class="qty-input" value="1" min="1" max="${product.stock}" ${isOutOfStock ? 'disabled' : ''} />
              <button class="qty-btn" id="qty-plus" ${isOutOfStock ? 'disabled' : ''}>+</button>
            </div>
            <span style="font-size: 0.85rem; color: #64748b;">Max available: ${product.stock}</span>
          </div>

          <div class="detail-actions">
            <button id="detail-add-cart-btn" class="btn btn-primary btn-lg" style="flex: 1;" ${isOutOfStock ? 'disabled' : ''}>
              ${isOutOfStock ? 'Out of Stock' : 'Add to Shopping Cart'}
            </button>
            <a href="/cart.html" class="btn btn-outline btn-lg">View Cart</a>
          </div>

          <div class="guarantee-grid">
            <div class="guarantee-item">
              <span>🚚</span>
              <span><strong>Free Shipping</strong> on orders over $75</span>
            </div>
            <div class="guarantee-item">
              <span>🛡️</span>
              <span><strong>1-Year Warranty</strong> guaranteed</span>
            </div>
            <div class="guarantee-item">
              <span>🔄</span>
              <span><strong>30-Day Returns</strong> money-back promise</span>
            </div>
            <div class="guarantee-item">
              <span>🔒</span>
              <span><strong>Secure Checkout</strong> encrypted data</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    ${renderRelatedProductsSection(related)}
  `;

  // Attach quantity selector events
  const qtyInput = document.getElementById('detail-qty-input');
  const minusBtn = document.getElementById('qty-minus');
  const plusBtn = document.getElementById('qty-plus');
  const addBtn = document.getElementById('detail-add-cart-btn');

  if (minusBtn && plusBtn && qtyInput) {
    minusBtn.addEventListener('click', () => {
      let val = parseInt(qtyInput.value, 10) || 1;
      if (val > 1) qtyInput.value = val - 1;
    });

    plusBtn.addEventListener('click', () => {
      let val = parseInt(qtyInput.value, 10) || 1;
      if (val < product.stock) qtyInput.value = val + 1;
    });

    qtyInput.addEventListener('change', () => {
      let val = parseInt(qtyInput.value, 10) || 1;
      if (val < 1) val = 1;
      if (val > product.stock) val = product.stock;
      qtyInput.value = val;
    });
  }

  if (addBtn) {
    addBtn.addEventListener('click', async () => {
      const quantity = parseInt(qtyInput.value, 10) || 1;
      addBtn.disabled = true;
      addBtn.textContent = 'Adding to cart...';

      const res = await apiRequest('/cart', {
        method: 'POST',
        body: { productId: product.id, quantity }
      });

      if (res.ok) {
        showToast(`Added ${quantity} × ${product.name} to cart!`, 'success');
        updateCartBadge();
        addBtn.textContent = '✓ Added to Cart!';
        setTimeout(() => {
          addBtn.textContent = 'Add to Shopping Cart';
          addBtn.disabled = false;
        }, 1500);
      } else {
        showToast(res.data.message || 'Could not add to cart', 'error');
        addBtn.textContent = 'Add to Shopping Cart';
        addBtn.disabled = false;
      }
    });
  }

  // Attach events for related product cards if any
  const relatedGrid = document.getElementById('related-grid');
  if (relatedGrid) {
    attachProductCardEvents(relatedGrid);
  }
}

function renderRelatedProductsSection(related) {
  if (!related || related.length === 0) return '';
  return `
    <div style="margin-top: 3.5rem;">
      <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem;">You Might Also Like</h2>
      <div class="product-grid" id="related-grid">
        ${related.map(prod => renderProductCard(prod)).join('')}
      </div>
    </div>
  `;
}

// Auto-run if on catalog or detail page
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('products-grid')) {
    initProductsPage();
  }
  if (document.getElementById('product-detail-container')) {
    initProductDetailsPage();
  }
});
