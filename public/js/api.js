/**
 * NovaCart API Client & Core UI Utilities
 * Handles REST API communication, session persistence, toast alerts, and navigation state.
 */

const API_BASE = '/api';

// Token and User state management in localStorage for reliable iframe execution
const TOKEN_KEY = 'novacart_token';
const USER_KEY = 'novacart_user';

export const AuthState = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  },
  getUser() {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setUser(user) {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  isLoggedIn() {
    return !!this.getUser();
  }
};

/**
 * Universal fetch wrapper for REST APIs
 */
export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = AuthState.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['x-session-token'] = token;
  }

  const fetchOptions = {
    ...options,
    headers,
    credentials: 'include' // Send cookies for express-session
  };

  if (options.body && typeof options.body === 'object') {
    fetchOptions.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, fetchOptions);
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error(`API request error on ${url}:`, error);
    return {
      ok: false,
      status: 0,
      data: { success: false, message: 'Network error. Please verify the server is running.' }
    };
  }
}

/**
 * Modern floating toast alerts (No window.alert)
 */
export function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✓';
  if (type === 'error') icon = '✕';

  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Formats numbers as USD currency ($129.99)
 */
export function formatCurrency(amount) {
  const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(num);
}

/**
 * Updates the shopping cart badge count in the header
 */
export async function updateCartBadge() {
  const badge = document.getElementById('nav-cart-badge');
  if (!badge) return;

  try {
    const res = await apiRequest('/cart');
    if (res.ok && res.data && res.data.cart) {
      const count = res.data.cart.summary.totalItems || 0;
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-flex' : 'none';
      
      // Gentle bounce animation
      badge.classList.remove('bounce');
      void badge.offsetWidth; // trigger reflow
      badge.classList.add('bounce');
    }
  } catch (err) {
    console.warn('Could not update cart count:', err);
  }
}

/**
 * Synchronizes navbar with authentication status
 */
export async function updateNavAuth() {
  const authContainer = document.getElementById('nav-auth-container');
  if (!authContainer) return;

  // Verify auth with backend
  const res = await apiRequest('/auth/me');
  let user = null;
  if (res.ok && res.data && res.data.user) {
    user = res.data.user;
    AuthState.setUser(user);
  } else {
    // If backend returns null, check if we have local user or clear
    AuthState.clear();
  }

  if (user) {
    authContainer.innerHTML = `
      <div class="user-pill">
        <span class="user-avatar">${user.name.charAt(0).toUpperCase()}</span>
        <span>${escapeHtml(user.name.split(' ')[0])}</span>
      </div>
      <a href="/orders.html" class="nav-link" title="My Orders">Orders</a>
      <button id="logout-btn" class="btn btn-secondary btn-sm" title="Log Out">Logout</button>
    `;

    document.getElementById('logout-btn')?.addEventListener('click', async () => {
      await apiRequest('/auth/logout', { method: 'POST' });
      AuthState.clear();
      showToast('Logged out successfully', 'info');
      setTimeout(() => {
        window.location.href = '/login.html';
      }, 500);
    });
  } else {
    authContainer.innerHTML = `
      <a href="/login.html" class="btn btn-outline btn-sm">Login</a>
      <a href="/register.html" class="btn btn-primary btn-sm">Register</a>
    `;
  }
}

/**
 * Sanitizes strings for safe DOM injection
 */
export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Auto-run on DOM ready for all pages
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  updateNavAuth();
});
