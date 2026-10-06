import { apiRequest, showToast, formatCurrency, AuthState, escapeHtml } from './api.js';

/**
 * Initializes My Orders page (orders.html)
 */
export async function initOrdersPage() {
  const container = document.getElementById('orders-container');
  if (!container) return;

  // Verify authentication
  const user = AuthState.getUser();
  if (!user) {
    showToast('Please sign in to view your order history.', 'info');
    window.location.href = '/login.html?redirect=/orders.html';
    return;
  }

  container.innerHTML = `
    <div style="text-align: center; padding: 4rem;">
      <div style="display: inline-block; width: 2.5rem; height: 2.5rem; border: 3px solid #e2e8f0; border-top-color: #4f46e5; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
      <p style="color: #64748b; margin-top: 1rem;">Loading your orders...</p>
    </div>
  `;

  const res = await apiRequest('/orders');

  if (!res.ok || !res.data || !res.data.orders) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h3 class="empty-title">Failed to load orders</h3>
        <p class="empty-desc">${escapeHtml(res.data.message || 'Please verify your session and try again.')}</p>
        <a href="/login.html" class="btn btn-primary">Sign In</a>
      </div>
    `;
    return;
  }

  const orders = res.data.orders;

  if (orders.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📦</div>
        <h2 class="empty-title">No Orders Yet</h2>
        <p class="empty-desc">You haven't placed any orders with NovaCart yet. Once you make a purchase, tracking and history will appear here!</p>
        <a href="/index.html" class="btn btn-primary btn-lg">Explore Products</a>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="orders-list">
      ${orders.map(order => {
        const orderDate = new Date(order.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        const statusClass = (order.status || 'processing').toLowerCase();

        return `
          <article class="order-history-card">
            <header class="order-card-header">
              <div class="order-meta-group">
                <div class="order-meta-item">
                  <span class="order-meta-label">Order Number</span>
                  <span class="order-meta-value" style="font-family: monospace; color: #4f46e5;">${escapeHtml(order.order_number)}</span>
                </div>
                <div class="order-meta-item">
                  <span class="order-meta-label">Date Placed</span>
                  <span class="order-meta-value">${orderDate}</span>
                </div>
                <div class="order-meta-item">
                  <span class="order-meta-label">Total Amount</span>
                  <span class="order-meta-value">${formatCurrency(order.total)}</span>
                </div>
              </div>
              <div>
                <span class="status-badge ${statusClass}">● ${escapeHtml(order.status)}</span>
              </div>
            </header>

            <div class="order-card-body">
              <div style="font-size: 0.85rem; color: #64748b; margin-bottom: 1rem;">
                <strong>Shipped to:</strong> ${escapeHtml(order.customer_name)} — ${escapeHtml(order.shipping_address)}, ${escapeHtml(order.city)} (${escapeHtml(order.postal_code)}) | <strong>Method:</strong> ${escapeHtml(order.payment_method)}
              </div>

              <div style="background: #f8fafc; border-radius: 8px; padding: 1rem;">
                <h4 style="font-size: 0.82rem; text-transform: uppercase; color: #64748b; margin-bottom: 0.5rem; letter-spacing: 0.05em;">Items in this order</h4>
                ${(order.items || []).map(item => `
                  <div class="order-item-row">
                    <div>
                      <strong style="font-size: 0.92rem;">${escapeHtml(item.product_name)}</strong>
                      <span style="font-size: 0.8rem; color: #64748b; margin-left: 0.5rem;">Qty: ${item.quantity} × ${formatCurrency(item.price)}</span>
                    </div>
                    <span style="font-weight: 700; font-size: 0.92rem;">${formatCurrency(item.subtotal)}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </article>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Initializes Order Confirmation page (confirmation.html)
 */
export async function initConfirmationPage() {
  const container = document.getElementById('confirmation-container');
  if (!container) return;

  const urlParams = new URLSearchParams(window.location.search);
  const orderNumber = urlParams.get('orderNumber');

  let orderData = null;

  // Try reading from sessionStorage first
  const storedOrder = sessionStorage.getItem('last_order');
  if (storedOrder) {
    try {
      const parsed = JSON.parse(storedOrder);
      if (!orderNumber || parsed.order_number === orderNumber) {
        orderData = parsed;
      }
    } catch {
      // Ignore JSON error
    }
  }

  // If not in sessionStorage, fetch from API
  if (!orderData && orderNumber) {
    const res = await apiRequest(`/orders/${orderNumber}`);
    if (res.ok && res.data && res.data.order) {
      orderData = res.data.order;
    }
  }

  if (!orderData) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">❓</div>
        <h3 class="empty-title">Order Not Found</h3>
        <p class="empty-desc">We couldn't retrieve details for this order. Check your order history in your account.</p>
        <a href="/index.html" class="btn btn-primary">Return to Home</a>
      </div>
    `;
    return;
  }

  const orderDate = new Date(orderData.created_at || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  container.innerHTML = `
    <div class="confirmation-card">
      <div class="confirm-badge">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <h1 style="font-size: 2rem; font-weight: 800; margin-bottom: 0.5rem;">Thank You For Your Order!</h1>
      <p style="color: #64748b; font-size: 1rem;">We've received your order and are preparing it for shipment.</p>
      
      <div>
        <span class="order-num-pill">Order #${escapeHtml(orderData.order_number)}</span>
      </div>

      <div class="order-details-box">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem; font-size: 0.9rem;">
          <div>
            <span style="color: #64748b; font-size: 0.8rem; text-transform: uppercase; font-weight: 600;">Customer Details</span>
            <p style="font-weight: 600; margin-top: 0.2rem;">${escapeHtml(orderData.customer_name)}</p>
            <p style="color: #64748b;">${escapeHtml(orderData.customer_email)}</p>
            <p style="color: #64748b;">${escapeHtml(orderData.phone)}</p>
          </div>
          <div>
            <span style="color: #64748b; font-size: 0.8rem; text-transform: uppercase; font-weight: 600;">Shipping Address</span>
            <p style="font-weight: 600; margin-top: 0.2rem;">${escapeHtml(orderData.shipping_address)}</p>
            <p style="color: #64748b;">${escapeHtml(orderData.city)}, ${escapeHtml(orderData.postal_code)}</p>
            <p style="color: #64748b;">Method: ${escapeHtml(orderData.payment_method)}</p>
          </div>
        </div>

        <div style="border-top: 1px solid #cbd5e1; padding-top: 1rem;">
          <h4 style="font-size: 0.85rem; text-transform: uppercase; color: #64748b; margin-bottom: 0.75rem; letter-spacing: 0.05em;">Purchased Items</h4>
          ${(orderData.items || []).map(item => `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; font-size: 0.92rem;">
              <span>${escapeHtml(item.name || item.product_name)} <strong style="color: #64748b; font-size: 0.85rem;">× ${item.quantity}</strong></span>
              <span style="font-weight: 600;">${formatCurrency(item.subtotal)}</span>
            </div>
          `).join('')}

          <div style="border-top: 1px dashed #cbd5e1; margin-top: 0.75rem; padding-top: 0.75rem;">
            <div style="display: flex; justify-content: space-between; font-size: 0.9rem; color: #64748b; margin-bottom: 0.25rem;">
              <span>Subtotal:</span>
              <span>${formatCurrency(orderData.subtotal)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.9rem; color: #64748b; margin-bottom: 0.25rem;">
              <span>Shipping:</span>
              <span>${orderData.shipping_fee === 0 ? '<strong style="color:#10b981;">FREE</strong>' : formatCurrency(orderData.shipping_fee)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.9rem; color: #64748b; margin-bottom: 0.25rem;">
              <span>Tax:</span>
              <span>${formatCurrency(orderData.tax)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 1.15rem; font-weight: 800; color: #0f172a; margin-top: 0.5rem;">
              <span>Total Paid:</span>
              <span style="color: #4f46e5;">${formatCurrency(orderData.total)}</span>
            </div>
          </div>
        </div>
      </div>

      <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
        <a href="/orders.html" class="btn btn-outline btn-lg">View My Orders</a>
        <a href="/index.html" class="btn btn-primary btn-lg">Continue Shopping</a>
      </div>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('orders-container')) {
    initOrdersPage();
  }
  if (document.getElementById('confirmation-container')) {
    initConfirmationPage();
  }
});
