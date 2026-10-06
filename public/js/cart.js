import { apiRequest, showToast, formatCurrency, updateCartBadge, escapeHtml } from './api.js';

/**
 * Initializes the Cart Page (cart.html)
 */
export async function initCartPage() {
  const container = document.getElementById('cart-container');
  if (!container) return;

  await renderCart();
}

/**
 * Fetches cart from /api/cart and renders full interactive UI
 */
export async function renderCart() {
  const container = document.getElementById('cart-container');
  if (!container) return;

  container.innerHTML = `
    <div style="text-align: center; padding: 4rem;">
      <div style="display: inline-block; width: 2.5rem; height: 2.5rem; border: 3px solid #e2e8f0; border-top-color: #4f46e5; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
      <p style="color: #64748b; margin-top: 1rem;">Loading your shopping cart...</p>
    </div>
  `;

  const res = await apiRequest('/cart');

  if (!res.ok || !res.data || !res.data.cart) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h3 class="empty-title">Failed to load shopping cart</h3>
        <p class="empty-desc">${escapeHtml(res.data.message || 'Please refresh the page.')}</p>
        <button class="btn btn-primary" onclick="window.location.reload()">Refresh Page</button>
      </div>
    `;
    return;
  }

  const { items, summary } = res.data.cart;

  if (!items || items.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🛒</div>
        <h2 class="empty-title">Your Shopping Cart is Empty</h2>
        <p class="empty-desc">Looks like you haven't added any premium gear to your cart yet. Discover trending deals in our catalog!</p>
        <a href="/index.html" class="btn btn-primary btn-lg">Start Shopping Now</a>
      </div>
    `;
    updateCartBadge();
    return;
  }

  // Calculate free shipping progress
  const threshold = summary.freeShippingThreshold || 75;
  const progressPercent = Math.min(100, (summary.subtotal / threshold) * 100);
  const remaining = Math.max(0, threshold - summary.subtotal);

  let shippingMessage = '';
  if (remaining === 0) {
    shippingMessage = `<span class="free-ship-note">🎉 Congratulations! You have unlocked FREE Standard Shipping!</span>`;
  } else {
    shippingMessage = `<span style="font-size: 0.82rem; color: #4f46e5; font-weight: 600;">Add ${formatCurrency(remaining)} more to qualify for <strong>FREE Shipping</strong>!</span>`;
  }

  const fallbackSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect fill="%23f1f5f9" width="80" height="80"/><text fill="%2394a3b8" font-family="sans-serif" font-size="12" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">Product</text></svg>`;

  container.innerHTML = `
    <div class="cart-layout">
      <!-- Items Table Card -->
      <section class="cart-items-card">
        <div class="cart-header">
          <h1 style="font-size: 1.4rem; font-weight: 800;">Shopping Cart (${summary.totalItems} item${summary.totalItems === 1 ? '' : 's'})</h1>
          <button id="clear-cart-btn" class="btn btn-outline btn-sm" style="color: #ef4444; border-color: #fecaca;">Clear Cart</button>
        </div>

        <div class="cart-items-list">
          ${items.map(item => `
            <div class="cart-item" data-product-id="${item.productId}">
              <img 
                src="${escapeHtml(item.image_url)}" 
                alt="${escapeHtml(item.name)}" 
                class="cart-item-img"
                onerror="this.onerror=null; this.src='${fallbackSvg}';"
              />
              <div>
                <span class="cart-item-cat">${escapeHtml(item.category)}</span>
                <h3 class="cart-item-title">
                  <a href="/product.html?id=${item.productId}">${escapeHtml(item.name)}</a>
                </h3>
                <span class="cart-item-price">${formatCurrency(item.price)} each</span>
              </div>
              <div class="quantity-control">
                <button class="qty-btn cart-qty-minus" data-id="${item.productId}">-</button>
                <input 
                  type="number" 
                  class="qty-input cart-qty-input" 
                  data-id="${item.productId}" 
                  value="${item.quantity}" 
                  min="1" 
                  max="${item.stock}" 
                />
                <button class="qty-btn cart-qty-plus" data-id="${item.productId}">+</button>
              </div>
              <div style="text-align: right;">
                <span class="cart-item-subtotal">${formatCurrency(item.subtotal)}</span>
              </div>
              <div>
                <button class="remove-btn cart-item-remove" data-id="${item.productId}" title="Remove item">
                  🗑️
                </button>
              </div>
            </div>
          `).join('')}
        </div>

        <div style="margin-top: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
          <a href="/index.html" class="btn btn-outline">← Continue Shopping</a>
        </div>
      </section>

      <!-- Order Summary Card -->
      <aside class="summary-card">
        <h2 class="summary-title">Order Summary</h2>

        <div style="margin-bottom: 1.25rem;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.35rem;">
            ${shippingMessage}
          </div>
          <div class="shipping-progress">
            <div class="shipping-progress-bar" style="width: ${progressPercent}%;"></div>
          </div>
        </div>

        <div class="summary-row">
          <span>Subtotal (${summary.totalItems} items)</span>
          <span style="font-weight: 600; color: #0f172a;">${formatCurrency(summary.subtotal)}</span>
        </div>

        <div class="summary-row">
          <span>Estimated Shipping</span>
          <span style="font-weight: 600; color: #0f172a;">
            ${summary.shippingFee === 0 ? '<span style="color:#10b981; font-weight:700;">FREE</span>' : formatCurrency(summary.shippingFee)}
          </span>
        </div>

        <div class="summary-row">
          <span>Estimated Sales Tax (8%)</span>
          <span style="font-weight: 600; color: #0f172a;">${formatCurrency(summary.tax)}</span>
        </div>

        <div class="summary-row total">
          <span>Total</span>
          <span style="color: #4f46e5;">${formatCurrency(summary.total)}</span>
        </div>

        <div style="margin-top: 1.5rem;">
          <a href="/checkout.html" class="btn btn-primary btn-block btn-lg">
            Proceed to Checkout →
          </a>
        </div>

        <div style="margin-top: 1.25rem; font-size: 0.8rem; color: #64748b; text-align: center;">
          🔒 Guaranteed safe & secure checkout
        </div>
      </aside>
    </div>
  `;

  attachCartEvents();
  updateCartBadge();
}

/**
 * Attaches event listeners for quantity changes and item deletions
 */
function attachCartEvents() {
  // Minus button
  document.querySelectorAll('.cart-qty-minus').forEach(btn => {
    btn.addEventListener('click', async () => {
      const pId = parseInt(btn.dataset.id, 10);
      const input = document.querySelector(`.cart-qty-input[data-id="${pId}"]`);
      const currentQty = parseInt(input.value, 10) || 1;
      const newQty = currentQty - 1;

      btn.disabled = true;
      const res = await apiRequest(`/cart/${pId}`, {
        method: 'PUT',
        body: { quantity: newQty }
      });

      if (res.ok) {
        renderCart();
      } else {
        showToast(res.data.message || 'Failed to update quantity', 'error');
        btn.disabled = false;
      }
    });
  });

  // Plus button
  document.querySelectorAll('.cart-qty-plus').forEach(btn => {
    btn.addEventListener('click', async () => {
      const pId = parseInt(btn.dataset.id, 10);
      const input = document.querySelector(`.cart-qty-input[data-id="${pId}"]`);
      const currentQty = parseInt(input.value, 10) || 1;
      const newQty = currentQty + 1;

      btn.disabled = true;
      const res = await apiRequest(`/cart/${pId}`, {
        method: 'PUT',
        body: { quantity: newQty }
      });

      if (res.ok) {
        renderCart();
      } else {
        showToast(res.data.message || 'Cannot add more. Stock limit reached.', 'error');
        btn.disabled = false;
      }
    });
  });

  // Manual input change
  document.querySelectorAll('.cart-qty-input').forEach(input => {
    input.addEventListener('change', async () => {
      const pId = parseInt(input.dataset.id, 10);
      const newQty = parseInt(input.value, 10);

      const res = await apiRequest(`/cart/${pId}`, {
        method: 'PUT',
        body: { quantity: newQty }
      });

      if (res.ok) {
        renderCart();
      } else {
        showToast(res.data.message || 'Invalid quantity', 'error');
        renderCart();
      }
    });
  });

  // Remove individual item
  document.querySelectorAll('.cart-item-remove').forEach(btn => {
    btn.addEventListener('click', async () => {
      const pId = parseInt(btn.dataset.id, 10);
      btn.disabled = true;

      const res = await apiRequest(`/cart/${pId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        showToast('Item removed from cart', 'info');
        renderCart();
      } else {
        showToast(res.data.message || 'Failed to remove item', 'error');
        btn.disabled = false;
      }
    });
  });

  // Clear entire cart
  document.getElementById('clear-cart-btn')?.addEventListener('click', async () => {
    const res = await apiRequest('/cart', { method: 'DELETE' });
    if (res.ok) {
      showToast('Shopping cart cleared', 'info');
      renderCart();
    }
  });
}

// Auto-run if on cart page
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('cart-container')) {
    initCartPage();
  }
});
