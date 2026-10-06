import { apiRequest, showToast, AuthState } from './api.js';

/**
 * Initializes Authentication pages (login.html and register.html)
 */
export function initAuthPages() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const demoBtn = document.getElementById('fill-demo-btn');

  // Fill demo account credentials for one-click testing
  if (demoBtn) {
    demoBtn.addEventListener('click', () => {
      const emailInput = document.getElementById('email');
      const passInput = document.getElementById('password');
      if (emailInput) emailInput.value = 'test@example.com';
      if (passInput) passInput.value = 'Password123!';
      showToast('Demo credentials filled!', 'info');
    });
  }

  // Handle Login form
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const errorBox = document.getElementById('auth-error');
      const submitBtn = loginForm.querySelector('button[type="submit"]');

      errorBox.style.display = 'none';

      if (!email || !password) {
        errorBox.textContent = 'Please enter both your email address and password.';
        errorBox.style.display = 'block';
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Logging in...';

      const res = await apiRequest('/auth/login', {
        method: 'POST',
        body: { email, password }
      });

      if (res.ok && res.data && res.data.user) {
        AuthState.setToken(res.data.token);
        AuthState.setUser(res.data.user);
        showToast('Login successful! Welcome back.', 'success');

        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect') || '/index.html';
        setTimeout(() => {
          window.location.href = redirect;
        }, 600);
      } else {
        errorBox.textContent = res.data.message || 'Invalid email or password.';
        errorBox.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
      }
    });
  }

  // Handle Registration form
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirm_password').value;
      const errorBox = document.getElementById('auth-error');
      const submitBtn = registerForm.querySelector('button[type="submit"]');

      errorBox.style.display = 'none';

      if (!name || !email || !password) {
        errorBox.textContent = 'All fields are required.';
        errorBox.style.display = 'block';
        return;
      }

      if (password.length < 6) {
        errorBox.textContent = 'Password must be at least 6 characters long.';
        errorBox.style.display = 'block';
        return;
      }

      if (password !== confirmPassword) {
        errorBox.textContent = 'Passwords do not match. Please verify.';
        errorBox.style.display = 'block';
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating account...';

      const res = await apiRequest('/auth/register', {
        method: 'POST',
        body: { name, email, password }
      });

      if (res.ok && res.data && res.data.user) {
        AuthState.setToken(res.data.token);
        AuthState.setUser(res.data.user);
        showToast('Registration successful! Welcome to NovaCart.', 'success');

        setTimeout(() => {
          window.location.href = '/index.html';
        }, 700);
      } else {
        errorBox.textContent = res.data.message || 'Registration failed. Please try again.';
        errorBox.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initAuthPages();
});
