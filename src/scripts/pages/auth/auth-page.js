// src/scripts/pages/auth/auth-page.js
import ApiService from '../../api.js';
import { showNotification } from '../../utils/index.js';

export default class AuthPage {
  constructor() {
    this.isLogin = true;
  }

  async render() {
    return `
      <section class="container auth-page">
        <div class="auth-container">
          <h1 class="page-title">${this.isLogin ? 'Login' : 'Register'}</h1>
          
          <!-- Demo Credentials Info -->
          <div class="demo-info">
            <h3>Demo Credentials:</h3>
            <p><strong>Email:</strong> dicoding@dicoding.com</p>
            <p><strong>Password:</strong> dicoding</p>
            <p><small>Or register with new email (password min. 8 characters)</small></p>
          </div>
          
          <form id="auth-form" class="auth-form">
            ${!this.isLogin ? `
              <div class="form-group">
                <label for="name">Name</label>
                <input type="text" id="name" name="name" required>
              </div>
            ` : ''}
            
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" name="email" required 
                     value="${this.isLogin ? 'dicoding@dicoding.com' : ''}">
            </div>
            
            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" id="password" name="password" required 
                     value="${this.isLogin ? 'dicoding' : ''}">
              ${!this.isLogin ? `
                <small class="help-text">Minimum 8 characters</small>
              ` : ''}
            </div>
            
            <div class="form-actions">
              <button type="submit" class="submit-btn">
                ${this.isLogin ? 'Login' : 'Register'}
              </button>
              ${this.isLogin ? `
                <button type="button" id="demo-login-btn" class="demo-btn">
                  Quick Demo Login
                </button>
              ` : ''}
            </div>
            
            <p class="auth-switch">
              ${this.isLogin ? "Don't have an account? " : "Already have an account? "}
              <button type="button" id="switch-auth" class="link-btn">
                ${this.isLogin ? 'Register' : 'Login'}
              </button>
            </p>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Wait for DOM to be ready
    await new Promise(resolve => setTimeout(resolve, 100));
    this._setupEventListeners();
    
    // Check if already logged in
    if (localStorage.getItem('token')) {
      showNotification('Already logged in!', 'success');
      window.location.hash = '#/';
    }
  }

  _setupEventListeners() {
    // Wait a bit more for all elements
    setTimeout(() => {
      this._setupFormEvents();
      this._setupButtonEvents();
    }, 150);
  }

  _setupFormEvents() {
    const form = document.getElementById('auth-form');
    if (!form) {
      console.warn('Auth form not found');
      return;
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this._handleAuth();
    });
  }

  _setupButtonEvents() {
    const switchBtn = document.getElementById('switch-auth');
    const demoBtn = document.getElementById('demo-login-btn');

    if (switchBtn) {
      switchBtn.addEventListener('click', () => {
        this.isLogin = !this.isLogin;
        this._rerender();
      });
    }

    if (demoBtn) {
      demoBtn.addEventListener('click', () => {
        this._handleDemoLogin();
      });
    }
  }

  async _handleDemoLogin() {
    try {
      const response = await ApiService.login({
        email: 'dicoding@dicoding.com',
        password: 'dicoding'
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      showNotification('Demo login successful!', 'success');
      
      setTimeout(() => {
        window.location.hash = '#/';
      }, 1000);

    } catch (error) {
      showNotification('Demo login failed: ' + error.message, 'error');
    }
  }

  async _handleAuth() {
    const form = document.getElementById('auth-form');
    if (!form) return;

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    try {
      const submitBtn = form.querySelector('.submit-btn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = this.isLogin ? 'Logging in...' : 'Registering...';
      }

      let response;
      
      if (this.isLogin) {
        response = await ApiService.login({
          email: data.email,
          password: data.password
        });
      } else {
        response = await ApiService.register({
          name: data.name,
          email: data.email,
          password: data.password
        });
      }

      // Handle response structure
      const token = response.data?.token || response.loginResult?.token;
      const user = response.data?.user || response.loginResult;

      if (!token) {
        throw new Error('No token received from server');
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      showNotification(
        this.isLogin ? 'Login successful!' : 'Registration successful!',
        'success'
      );

      setTimeout(() => {
        window.location.hash = '#/';
      }, 1000);

    } catch (error) {
      console.error('Auth Error:', error);
      showNotification('Error: ' + error.message, 'error');
      
      const submitBtn = document.querySelector('.submit-btn');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = this.isLogin ? 'Login' : 'Register';
      }
    }
  }

  async _rerender() {
    const content = document.querySelector('#main-content');
    if (!content) return;
    
    content.innerHTML = await this.render();
    await this.afterRender();
  }

  destroy() {
    // Cleanup if needed
    console.log('Auth page destroyed');
  }
}