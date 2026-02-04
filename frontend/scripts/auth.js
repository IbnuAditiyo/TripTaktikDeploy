class AuthSystem {
  constructor() {
    // 1. GUNAKAN CONFIG.BASE_URL
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

    // Validasi Input Kosong
    if (!email || !password) {
      Swal.fire({
        icon: 'warning',
        title: 'Oops...',
        text: 'Harap isi email dan password!',
        confirmButtonColor: '#475d57'
      });
      return;
    }

    // UI Loading State
    const originalText = loginBtn.textContent;
    loginBtn.classList.add('btn-loading');
    loginBtn.textContent = 'Signing In...';
    loginBtn.disabled = true;

    try {
      const response = await fetch(`${this.apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (response.ok && result.token) {
        // Sukses Login
        this.currentUser = {
          _id: result.user.id || result.user._id, 
          email: result.user.email,
          name: result.user.name,
          token: result.token,
          loginTime: new Date().toISOString()
        };
        
        localStorage.setItem('tripTaktikCurrentUser', JSON.stringify(this.currentUser));
        
        // Notifikasi Sukses di Tengah
        Swal.fire({
          icon: 'success',
          title: 'Login Berhasil!',
          text: 'Mengalihkan ke halaman utama...',
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
           this.redirectToHome();
        });

      } else {
        // Gagal Login (Password/Email Salah)
        Swal.fire({
          icon: 'error',
          title: 'Login Gagal',
          text: result.message || 'Email atau password salah.',
          confirmButtonColor: '#d33'
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Terjadi Kesalahan',
        text: 'Gagal menghubungi server. Pastikan backend menyala.',
        confirmButtonColor: '#d33'
      });
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
      Swal.fire({
        icon: 'warning',
        title: 'Data Belum Lengkap',
        text: 'Harap isi semua kolom pendaftaran.',
        confirmButtonColor: '#475d57'
      });
      return;
    }
    if (!this.isValidEmail(email)) {
      Swal.fire({
        icon: 'warning',
        title: 'Email Tidak Valid',
        text: 'Mohon masukkan format email yang benar.',
        confirmButtonColor: '#475d57'
      });
      return;
    }
    if (password.length < 6) {
      Swal.fire({
        icon: 'warning',
        title: 'Password Lemah',
        text: 'Password minimal harus 6 karakter.',
        confirmButtonColor: '#475d57'
      });
      return;
    }

    const originalText = registerBtn.textContent;
    registerBtn.classList.add('btn-loading');
    registerBtn.textContent = 'Creating Account...';
    registerBtn.disabled = true;

    try {
      const response = await fetch(`${this.apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: username, email, password })
      });

      const result = await response.json();

      if (response.ok) {
        // Sukses Register
        Swal.fire({
          icon: 'success',
          title: 'Akun Dibuat!',
          text: 'Silakan login dengan akun baru Anda.',
          confirmButtonColor: '#475d57'
        }).then(() => {
           document.getElementById('registerForm').reset();
           this.showLogin();
        });

      } else {
        // Gagal Register
        Swal.fire({
          icon: 'error',
          title: 'Registrasi Gagal',
          text: result.message || 'Terjadi kesalahan saat mendaftar.',
          confirmButtonColor: '#d33'
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Koneksi Bermasalah',
        text: 'Tidak dapat terhubung ke server.',
        confirmButtonColor: '#d33'
      });
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
    this.clearAlerts(); 
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

  clearAlerts() {
    // Fungsi ini dikosongkan karena alert lama sudah diganti SweetAlert
    // Dibiarkan kosong agar tidak error jika dipanggil
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