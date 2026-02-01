// Hapus import api.js karena kita akan pakai CONFIG langsung
// import { login, register } from './api.js'; 

class AuthSystem {
  constructor() {
    // 1. GUNAKAN CONFIG.BASE_URL
    // Jika config.js belum termuat, fallback ke localhost
    this.apiUrl = typeof CONFIG !== 'undefined' ? CONFIG.BASE_URL : 'http://localhost:8000/api';
    
    this.currentUser = JSON.parse(localStorage.getItem('tripTaktikCurrentUser')) || null;
    this.homePageUrl = '../index.html';
    this.init();
  }

  init() {
    // Cek apakah user sudah login, jika ya lempar ke home
    if (this.currentUser && this.currentUser.token) {
      this.redirectToHome();
    } else {
      this.showLogin();
    }
    this.bindEvents();
  }

  // Helper Wrapper Notifikasi (Sambungkan ke config.js)
  notify(message, type = 'info') {
    if (typeof showNotification === 'function') {
        // Mapping: 'error' tetap 'error', selain itu dianggap 'success'/'info'
        showNotification(message, type);
    } else {
        alert(message); // Fallback jika config.js lupa dipasang
    }
  }

  bindEvents() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleRegister();
      });
    }
  }

  async handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const loginBtn = document.getElementById('loginBtn');

    if (!email || !password) {
      this.notify('Harap isi semua field.', 'error');
      return;
    }

    // UI Loading State
    const originalText = loginBtn.textContent;
    loginBtn.classList.add('btn-loading');
    loginBtn.textContent = 'Signing In...';
    loginBtn.disabled = true;

    try {
      // 2. FETCH LANGSUNG MENGGUNAKAN CONFIG
      const response = await fetch(`${this.apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (response.ok && result.token) {
        // Sukses Login
        this.currentUser = {
          _id: result.user.id || result.user._id, // Handle kemungkinan beda nama field
          email: result.user.email,
          name: result.user.name,
          token: result.token,
          loginTime: new Date().toISOString()
        };
        
        localStorage.setItem('tripTaktikCurrentUser', JSON.stringify(this.currentUser));
        
        this.notify('Login berhasil! Mengalihkan...', 'success');
        setTimeout(() => this.redirectToHome(), 1000);

      } else {
        // Gagal Login
        this.notify(result.message || 'Email atau password salah.', 'error');
      }
    } catch (error) {
      console.error(error);
      this.notify('Gagal menghubungi server. Pastikan backend nyala.', 'error');
    } finally {
      // Reset UI Button
      loginBtn.classList.remove('btn-loading');
      loginBtn.textContent = originalText;
      loginBtn.disabled = false;
    }
  }

  async handleRegister() {
    const email = document.getElementById('registerEmail').value.trim();
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    const registerBtn = document.getElementById('registerBtn');

    // Validasi input
    if (!email || !username || !password) {
      this.notify('Harap isi semua field.', 'error');
      return;
    }
    if (!this.isValidEmail(email)) {
      this.notify('Format email tidak valid.', 'error');
      return;
    }
    if (password.length < 6) {
      this.notify('Password minimal harus 6 karakter.', 'error');
      return;
    }

    const originalText = registerBtn.textContent;
    registerBtn.classList.add('btn-loading');
    registerBtn.textContent = 'Creating Account...';
    registerBtn.disabled = true;

    try {
      // 3. FETCH REGISTER PAKAI CONFIG
      const response = await fetch(`${this.apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: username, email, password })
      });

      const result = await response.json();

      if (response.ok) {
        this.notify('Akun berhasil dibuat! Silakan login.', 'success');
        document.getElementById('registerForm').reset();
        setTimeout(() => this.showLogin(), 1500);
      } else {
        this.notify(result.message || 'Registrasi gagal.', 'error');
      }
    } catch (error) {
      console.error(error);
      this.notify('Terjadi kesalahan koneksi.', 'error');
    } finally {
      registerBtn.classList.remove('btn-loading');
      registerBtn.textContent = originalText;
      registerBtn.disabled = false;
    }
  }

  redirectToHome() {
    window.location.href = this.homePageUrl;
  }

  showLogin() {
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('registerPage').style.display = 'none';
    this.clearAlerts(); // Membersihkan sisa alert lama (opsional)
  }

  showRegister() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('registerPage').style.display = 'flex';
    this.clearAlerts();
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('tripTaktikCurrentUser');
    window.location.href = 'auth.html';
  }

  // Fungsi ini dikosongkan/disederhanakan karena kita sudah pakai Notifikasi Toast
  // Tapi dibiarkan agar tidak error jika ada kode legacy yang memanggilnya
  clearAlerts() {
    const alerts = document.querySelectorAll('.alert');
    if(alerts) alerts.forEach(el => el.style.display = 'none');
  }

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}

// Inisialisasi AuthSystem saat dokumen dimuat
const authSystem = new AuthSystem();
window.authSystem = authSystem;

// Event listener untuk navigasi antara halaman login dan registrasi
document.addEventListener('DOMContentLoaded', () => {
  const toRegisterLink = document.getElementById('linkToRegister');
  const toLoginLink = document.getElementById('linkToLogin');

  if (toRegisterLink) {
    toRegisterLink.addEventListener('click', (e) => {
      e.preventDefault();
      authSystem.showRegister();
    });
  }

  if (toLoginLink) {
    toLoginLink.addEventListener('click', (e) => {
      e.preventDefault();
      authSystem.showLogin();
    });
  }
});