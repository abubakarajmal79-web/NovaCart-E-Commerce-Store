import { apiRequest, showToast, formatCurrency, AuthState, updateCartBadge, escapeHtml } from './api.js';

/**
 * Initializes the Checkout Page (checkout.html)
 */
export async function initCheckoutPage() {
  const form = document.getElementById('checkout-form');
  const summaryContainer = document.getElementById('checkout-summary-items');
  if (!form || !summaryContainer) return;

  // 1. Verify Cart has items
  const cartRes = await apiRequest('/cart');
  if (!cartRes.ok || !cartRes.data || !cartRes.data.cart || cartRes.data.cart.items.length === 0) {
    showToast('Your cart is empty. Please select products first.', 'error');
    window.location.href = '/cart.html';
    return;
  }

  const { items, summary } = cartRes.data.cart;

  // 2. Render Checkout Summary sidebar
  summaryContainer.innerHTML = items.map(item => `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem; font-size: 0.9rem;">
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <span style="background: #e2e8f0; width: 1.5rem; height: 1.5rem; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700;">${item.quantity}</span>
        <span style="font-weight: 500; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(item.name)}</span>
      </div>
      <span style="font-weight: 600;">${formatCurrency(item.subtotal)}</span>
    </div>
  `).join('');

  document.getElementById('checkout-subtotal').textContent = formatCurrency(summary.subtotal);
  document.getElementById('checkout-shipping').innerHTML = summary.shippingFee === 0 ? '<span style="color:#10b981; font-weight:700;">FREE</span>' : formatCurrency(summary.shippingFee);
  document.getElementById('checkout-tax').textContent = formatCurrency(summary.tax);
  document.getElementById('checkout-total').textContent = formatCurrency(summary.total);

  // 3. Pre-fill customer details if logged in
  const user = AuthState.getUser();
  if (user) {
    const nameInput = document.getElementById('customer_name');
    const emailInput = document.getElementById('customer_email');
    if (nameInput && !nameInput.value) nameInput.value = user.name || '';
    if (emailInput && !emailInput.value) emailInput.value = user.email || '';
  }

  // 4. Handle checkout submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('place-order-btn');
    const errorBox = document.getElementById('checkout-error');

    errorBox.style.display = 'none';
    errorBox.textContent = '';

    const customer_name = document.getElementById('customer_name').value.trim();
    const customer_email = document.getElementById('customer_email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const shipping_address = document.getElementById('shipping_address').value.trim();
    const city = document.getElementById('city').value.trim();
    const postal_code = document.getElementById('postal_code').value.trim();
    
    const paymentRadio = document.querySelector('input[name="payment_method"]:checked');
    const payment_method = paymentRadio ? paymentRadio.value : 'Credit / Debit Card';

    // Basic frontend validations
    if (!customer_name || !customer_email || !phone || !shipping_address || !city || !postal_code) {
      errorBox.textContent = 'Please fill out all required shipping and contact fields.';
      errorBox.style.display = 'block';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <span style="display: inline-block; width: 1rem; height: 1rem; border: 2px solid white; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; margin-right: 0.5rem;"></span>
      Processing Order...
    `;

    try {
      const orderPayload = {
        customer_name,
        customer_email,
        phone,
        shipping_address,
        city,
        postal_code,
        payment_method,
        items // pass verified items as fallback
      };

      const res = await apiRequest('/orders', {
        method: 'POST',
        body: orderPayload
      });

      if (res.ok && res.data && res.data.order) {
        showToast('Order confirmed successfully!', 'success');
        updateCartBadge();
        
        // Save order data for instant confirmation display
        sessionStorage.setItem('last_order', JSON.stringify(res.data.order));
        
        // Redirect to confirmation page
        window.location.href = `/confirmation.html?orderNumber=${res.data.order.order_number}`;
      } else {
        errorBox.textContent = res.data.message || 'Failed to place order. Please review your information.';
        errorBox.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Place Order Now';
      }
    } catch (err) {
      console.error('Checkout error:', err);
      errorBox.textContent = 'A system error occurred. Please try again.';
      errorBox.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Place Order Now';
    }
  });
}

// Auto-run if on checkout page
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('checkout-form')) {
    initCheckoutPage();
  }
});
