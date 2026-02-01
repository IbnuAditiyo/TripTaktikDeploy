const DEFAULT_AVATAR = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23e0e0e0"/><circle cx="50" cy="40" r="18" fill="%23b0b0b0"/><ellipse cx="50" cy="85" rx="30" ry="20" fill="%23b0b0b0"/></svg>';

class ProfilePage {
  constructor() {
    // Ambil URL dari CONFIG jika ada (untuk deploy nanti)
    this.apiUrl = typeof CONFIG !== 'undefined' ? CONFIG.BASE_URL : 'http://localhost:8000/api';
    
    this.currentUser = JSON.parse(localStorage.getItem('tripTaktikCurrentUser'));
    this.authPageUrl = '../pages/auth.html';
    this.homePageUrl = '../index.html';

    this.profileData = {
      name: 'Pengguna Baru',
      email: 'email@contoh.com',
      gender: '',
      birthdate: '',
      avatar: DEFAULT_AVATAR
    };

    this.init();
  }

  // --- HELPER NOTIFIKASI ---
  notify(message, type = 'info') {
    if (typeof showNotification === 'function') {
        showNotification(message, type);
    } else {
        alert(message);
    }
  }

  init() {
    if (!this.currentUser) {
      this.redirectToAuth();
      return;
    }
    this.loadProfileData();
    this.bindEvents();
    this.updateProfileDisplay();

    // --- LOGIKA TAB DEFAULT (DIPERBAIKI) ---
    let activeLink = document.querySelector('.profile-menu a.active');
    
    // Fallback: Jika HTML tidak punya class active, pilih menu pertama
    if (!activeLink) {
        activeLink = document.querySelector('.profile-menu a');
        if (activeLink) activeLink.classList.add('active');
    }

    if (activeLink) {
        const sectionId = activeLink.getAttribute('href').substring(1); 
        this.navigateToSection(sectionId, activeLink);
    }
  }

  bindEvents() {
    document.getElementById('profileForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveProfile();
    });
    document.getElementById('photoInput')?.addEventListener('change', (e) => {
      this.handlePhotoUpload(e);
    });
    document.querySelector('.language-selector')?.addEventListener('click', () => {
      this.notify('Pilihan bahasa akan segera hadir!', 'info');
    });
    
    // Tambahkan listener untuk navigasi menu profil
    document.querySelectorAll('.profile-menu a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('href').substring(1);
            this.navigateToSection(sectionId, link);
        });
    });
  }

  loadProfileData() {
    const storageKey = `tripTaktikUserProfile_${this.currentUser.email || this.currentUser.name}`;
    const storedData = JSON.parse(localStorage.getItem(storageKey));
    
    this.profileData.name = this.currentUser.name || "Pengguna Baru";
    this.profileData.email = this.currentUser.email || "email@contoh.com";
    
    if (storedData) {
      this.profileData = { ...this.profileData, ...storedData };
    }
    
    const nameInput = document.getElementById('name');
    if(nameInput) nameInput.value = this.profileData.name;
    
    const emailInput = document.getElementById('email');
    if(emailInput) emailInput.value = this.profileData.email;
    
    const genderInput = document.getElementById('gender');
    if(genderInput) genderInput.value = this.profileData.gender;
    
    const birthdateInput = document.getElementById('birthdate');
    if(birthdateInput) birthdateInput.value = this.profileData.birthdate;
  }

  updateProfileDisplay() {
    const sidebarName = document.getElementById('sidebarProfileName');
    if(sidebarName) sidebarName.textContent = this.profileData.name;
    
    const sidebarEmail = document.getElementById('sidebarProfileEmail');
    if(sidebarEmail) sidebarEmail.textContent = this.profileData.email;
    
    const avatarElements = [
      document.getElementById('profileAvatarDisplay'),
      document.getElementById('profileAvatarFormDisplay')
    ];
    avatarElements.forEach(el => {
      if (el) {
        el.style.backgroundImage = `url(${this.profileData.avatar})`;
      }
    });
  }

  saveProfile() {
    const nameVal = document.getElementById('name').value;
    const emailVal = document.getElementById('email').value;
    
    if (!nameVal || !emailVal) {
      this.notify('Nama dan Email wajib diisi!', 'error');
      return;
    }

    this.profileData.name = nameVal;
    this.profileData.email = emailVal;
    this.profileData.gender = document.getElementById('gender').value;
    this.profileData.birthdate = document.getElementById('birthdate').value;

    const storageKey = `tripTaktikUserProfile_${this.currentUser.email || this.currentUser.name}`;
    localStorage.setItem(storageKey, JSON.stringify(this.profileData));
    
    this.updateProfileDisplay();
    this.notify('Profil berhasil diperbarui!', 'success');
  }

  cancelEdit() {
    if (confirm('Apakah Anda yakin ingin membatalkan? Perubahan tidak akan disimpan.')) {
      this.loadProfileData(); 
      this.notify('Perubahan dibatalkan.', 'info');
    }
  }

  triggerUploadPhoto() {
    document.getElementById('photoInput').click();
  }

  handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.profileData.avatar = e.target.result; 
        this.updateProfileDisplay();
        this.notify('Foto siap. Klik "Simpan Perubahan" untuk menyimpan.', 'info');
      };
      reader.readAsDataURL(file);
    }
  }

  navigateToSection(sectionId, clickedLink) {
    document.querySelectorAll('.profile-content-section, .edit-profile-container').forEach(section => {
      section.style.display = 'none';
    });
    
    if (sectionId === 'edit-profile') {
        const container = document.querySelector('.edit-profile-container');
        if(container) container.style.display = 'block';
    } else {
        const targetSection = document.getElementById(sectionId + 'Section');
        if (targetSection) targetSection.style.display = 'block';
    }
    
    document.querySelectorAll('.profile-menu a').forEach(item => item.classList.remove('active'));
    if (clickedLink) {
      clickedLink.classList.add('active');
    }
  }

  logout() {
    // Logout Keren dengan SweetAlert2
    if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: 'Keluar dari Akun?',
          text: "Perubahan yang belum disimpan akan hilang.",
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#475d57',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Ya, Keluar'
        }).then((result) => {
          if (result.isConfirmed) {
            localStorage.removeItem('tripTaktikCurrentUser');
            Swal.fire({
              title: 'Berhasil Keluar',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false
            }).then(() => {
              this.redirectToAuth();
            });
          }
        });
    } else {
        // Fallback jika SweetAlert belum load
        if (confirm('Apakah Anda yakin ingin keluar?')) {
            localStorage.removeItem('tripTaktikCurrentUser');
            this.redirectToAuth();
        }
    }
  }

  redirectToAuth() {
    window.location.href = this.authPageUrl;
  }
}

let profileApp;
document.addEventListener('DOMContentLoaded', () => {
  profileApp = new ProfilePage();
  window.profileApp = profileApp; 

  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const mainNav = document.getElementById('mainNav');

  if (hamburgerBtn && mainNav) {
    const toggleMenu = () => {
      mainNav.classList.toggle('active');
      hamburgerBtn.classList.toggle('active');
      const isExpanded = mainNav.classList.contains('active');
      hamburgerBtn.setAttribute('aria-expanded', isExpanded);
    };
    hamburgerBtn.addEventListener('click', toggleMenu);
  }

  const logoutButtons = document.querySelectorAll('.logout');
  if (logoutButtons.length > 0) {
    logoutButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (profileApp) profileApp.logout();
        });
    });
  }
});