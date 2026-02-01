class HomeSystem {
  constructor() {
    this.currentUser = JSON.parse(localStorage.getItem('tripTaktikCurrentUser')) || null;
    this.authPageUrl = '../pages/auth.html';
    // Sebaiknya gunakan CONFIG.BASE_URL jika sudah ada config.js
    this.apiUrl = 'http://localhost:8000/api'; 
    this.allWisataData = [];
    this.init();
  }

  init() {
    if (!this.currentUser || !this.currentUser.token) {
      this.redirectToAuth();
      return;
    }

    this.initializeUserProfile();
    this.setupForYouFilter();
    this.fetchAllWisata();
    this.loadStats();
    this.initializeFeedbackForm();
    this.loadTestimonials();
    this.initializeTestimonialSlider();
  }

  async fetchAllWisata() {
    try {
      const response = await fetch('../data/dataset_jogja_with_vectors_fixed_v2.json');
      this.allWisataData = await response.json();
      if (!Array.isArray(this.allWisataData)) throw new Error("Data format invalid");

      // Load Default: 3 Random Terbaik
      // Filter yang rating > 4.5
      const highRated = this.allWisataData.filter(item => {
          const rating = parseFloat(item.vote_average || item.rating || 0);
          return rating >= 4.5;
      });
      // Acak Urutannya
      const shuffled = highRated.sort(() => 0.5 - Math.random());
      const topThreeRandom = shuffled.slice(0, 3);
      
      this.renderWisataForYou(topThreeRandom);
    } catch (err) {
      console.error('Gagal memuat rekomendasi awal:', err);
    }
  }

  setupForYouFilter() {
    const form = document.getElementById('foryou-filter-form');
    
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const typeSelect = document.getElementById('foryou-type');
      const selectedType = typeSelect ? typeSelect.value : 'all';

      // Tampilkan Loading (Opsional UI improvement)
      const container = document.getElementById('foryou-container');
      if(container) container.innerHTML = '<p style="color:white; text-align:center;">Mencari wisata terbaik...</p>';

      let filtered = this.allWisataData;

      // 1. FILTER BERDASARKAN TIPE
      if (selectedType !== 'all') {
         // Mapping dari value HTML ke Key JSON
         // nature -> type_clean_nature
         const keyMap = `type_clean_${selectedType}`; 
         filtered = this.allWisataData.filter(item => item[keyMap] === 1);
      }

      // 2. SORTING BERDASARKAN RATING TERTINGGI (Descending)
      const sorted = filtered.sort((a, b) => {
          const ratingA = parseFloat(a.vote_average || 0);
          const ratingB = parseFloat(b.vote_average || 0);
          return ratingB - ratingA;
      });

      // 3. AMBIL 3 TERATAS
      const topThree = sorted.slice(0, 3);

      // 4. RENDER
      setTimeout(() => {
          this.renderWisataForYou(topThree);
      }, 300); // Sedikit delay biar kerasa loadingnya

      document.querySelector('.recommendations')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  renderWisataForYou(wisataList) {
    const container = document.getElementById('foryou-container');
    if (!container) return;

    container.innerHTML = '';
    if (wisataList.length === 0) {
      container.innerHTML = '<p class="no-results" style="color:white; text-align:center; padding: 20px;">Tidak ada rekomendasi yang cocok.</p>';
      return;
    }

    wisataList.forEach((wisata, index) => {
      const vote_average = parseFloat(wisata.vote_average || 0).toFixed(1);
      const filledStars = Math.round(wisata.vote_average || 0);
      const emptyStars = 5 - filledStars;
      const imageSrc = wisata.image || `https://source.unsplash.com/240x140/?${encodeURIComponent(wisata.nama)}`;
      const fallbackImage = `../assets/images/jalan${index % 5 + 1}.jpg`;

      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
                <div class="card-image">
                    <img src="${imageSrc}" alt="${wisata.nama}" onerror="this.onerror=null; this.src='${fallbackImage}';">
                </div>
                <div class="card-content">
                    <h3>${wisata.nama}</h3>
                    <div class="vote_average">
                        <span class="vote_average-number">${vote_average}</span>
                        <div class="stars">
                            ${'<i class="fas fa-star"></i>'.repeat(filledStars)}
                            ${'<i class="far fa-star"></i>'.repeat(emptyStars < 0 ? 0 : emptyStars)}
                        </div>
                    </div>
                    <div class="location">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${this.getTypeName(wisata)}</span>
                    </div>
                    <button class="view-more">View More</button>
                </div>`;
      container.appendChild(card);
    });

    this.initializeViewMoreButtons();
  }

  // Helper untuk menampilkan nama tipe yang bagus di Card
  getTypeName(wisata) {
      // Cek kolom sesuai nama di database JSON kamu
      if(wisata.type_clean_Alam === 1) return 'Wisata Alam';
      if(wisata.type_clean_Budaya_Dan_Sejarah === 1) return 'Wisata Budaya & Sejarah';
      if(wisata.type_clean_Buatan === 1) return 'Wisata Buatan';
      if(wisata.type_clean_Pantai === 1) return 'Wisata Pantai';
      
      return 'Yogyakarta'; // Default
  }

  initializeFeedbackForm() {
    const toggleBtn = document.getElementById('toggle-btn');
    const form = document.getElementById('feedback-form');
    const fileInput = document.getElementById('file-upload');
    const previewContainer = document.querySelector('.image-preview-container');
    const imagePreview = document.getElementById('image-preview');

    if (!toggleBtn || !form || !fileInput || !previewContainer || !imagePreview) return;

    toggleBtn.addEventListener('click', () => form.classList.toggle('hidden'));

    fileInput.addEventListener('change', function () {
      const file = this.files[0];
      if (file) {
        const reader = new FileReader();
        previewContainer.style.display = 'block';
        reader.onload = (e) => imagePreview.src = e.target.result;
        reader.readAsDataURL(file);
      } else {
        previewContainer.style.display = 'none';
        imagePreview.src = "#";
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const file = form.image.files[0];
      if (!file) {
        this.showNotification("Pilih gambar terlebih dahulu!", 'warning');
        return;
      }
      this.showNotification("Mengirim feedback...", "info");

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'feedback');

      try {
        const cloudinaryRes = await fetch('https://api.cloudinary.com/v1_1/dfciqrwpe/image/upload', {
          method: 'POST', body: formData
        });
        if (!cloudinaryRes.ok) throw new Error('Upload to Cloudinary failed');
        const cloudinaryData = await cloudinaryRes.json();

        const apiRes = await fetch(`${this.apiUrl}/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.currentUser.token}` },
          body: JSON.stringify({
            title: form.title.value,
            description: form.description.value,
            location: form.location.value,
            imageUrl: cloudinaryData.secure_url,
          }),
        });
        if (!apiRes.ok) throw new Error('API submission failed');

        this.showNotification("Feedback berhasil dikirim!", "success");
        form.reset();
        form.classList.add('hidden');
        previewContainer.style.display = 'none';
        this.loadTestimonials();
      } catch (error) {
        console.error('Gagal mengirim feedback:', error);
        this.showNotification("Gagal mengirim feedback.", "error");
      }
    });
  }

  async loadTestimonials() {
    const track = document.querySelector('.testimonial-track');
    if (!track) return;
    try {
      const res = await fetch(`${this.apiUrl}/feedback`);
      if (!res.ok) throw new Error('Failed to fetch testimonials');
      const feedbacks = await res.json();
      track.innerHTML = '';
      if (feedbacks.length === 0) {
        track.innerHTML = '<p class="no-results">Belum ada testimoni.</p>';
        return;
      }
      feedbacks.forEach(feedback => {
        const card = document.createElement('div');
        card.className = 'testimonial-card';
        const feedbackDate = new Date(feedback.createdAt).toLocaleDateString('id-ID', {
          day: 'numeric', month: 'long', year: 'numeric'
        });
        card.innerHTML = `
                    <div class="card-image"><img src="${feedback.imageUrl}" alt="${feedback.title}"></div>
                    <div class="card-content">
                        <h4>${feedback.title}</h4>
                        <p class="card-description">${feedback.description}</p>
                        <div class="card-footer">
                            <span class="card-date">${feedbackDate}</span>
                            <span class="card-location">📍 ${feedback.location}</span>
                        </div>
                    </div>`;
        track.appendChild(card);
      });
    } catch (error) {
      console.error("Gagal memuat feedback:", error);
      track.innerHTML = '<p class="error-message">Gagal memuat testimoni.</p>';
    }
  }

  initializeTestimonialSlider() {
    const track = document.querySelector('.testimonial-track');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    if (!track || !prevBtn || !nextBtn) return;
    const scrollAmount = () => track.querySelector('.testimonial-card')?.offsetWidth + 20 || 320;
    nextBtn.addEventListener('click', () => track.scrollBy({ left: scrollAmount(), behavior: 'smooth' }));
    prevBtn.addEventListener('click', () => track.scrollBy({ left: -scrollAmount(), behavior: 'smooth' }));
  }

  logout() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
      localStorage.removeItem('tripTaktikCurrentUser');
      this.showNotification('Berhasil logout. Sampai jumpa!', 'success');
      setTimeout(() => this.redirectToAuth(), 1500);
    }
  }

  redirectToAuth() {
    window.location.href = this.authPageUrl;
  }

  initializeUserProfile() {
    const userProfile = document.querySelector('.user-profile');
    if (this.currentUser && userProfile) {
      userProfile.setAttribute('title', `Masuk sebagai: ${this.currentUser.name || this.currentUser.email}`);
    }
  }

  async loadStats() {
    try {
      const response = await fetch('../data/data_wisata.json');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      document.getElementById('total-wisata').textContent = `${data.length}+`;
      document.getElementById('jenis-wisata').textContent = [...new Set(data.map(d => d.type))].length;
      document.getElementById('wisata-alam').textContent = data.filter(d => d.type.toLowerCase().includes('alam')).length;
      document.getElementById('wisata-sejarah').textContent = data.filter(d => d.type.toLowerCase().includes('sejarah')).length;
    } catch (error) {
      console.error("Gagal memuat statistik:", error);
    }
  }

  initializeViewMoreButtons() {
    document.querySelectorAll('.view-more').forEach(btn => {
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      newBtn.addEventListener('click', (e) => {
        const cardElement = e.target.closest('.card');
        if (!cardElement) return;
        const title = cardElement.querySelector('h3').textContent;
        const selected = this.allWisataData.find(item => item.nama === title);
        if (selected) {
          localStorage.setItem('selectedWisata', JSON.stringify(selected));
          window.location.href = `../pages/detail-page.html`;
        } else {
          this.showNotification('Data detail tidak ditemukan!', 'error');
        }
      });
    });
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    setTimeout(() => {
      notification.classList.remove('show');
      notification.addEventListener('transitionend', () => notification.remove(), { once: true });
    }, 3000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const homeSystem = new HomeSystem();

  // 1. Logika Header Hilang Saat Scroll
  const header = document.querySelector('.header');
  if (header) {
    let lastScrollTop = 0;
    window.addEventListener('scroll', () => {
      let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      if (scrollTop > lastScrollTop && scrollTop > 70) {
        header.classList.add('hidden');
      } else {
        header.classList.remove('hidden');
      }
      lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    }, { passive: true });
  }

  // 2. Logika Hamburger Menu
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

  // 3. Logika Notifikasi Bahasa
  const languageSelectors = document.querySelectorAll('.language-selector');
  languageSelectors.forEach(selector => {
    selector.addEventListener('click', () => {
      if (homeSystem) {
        homeSystem.showNotification('Pilihan bahasa akan segera hadir!', 'info');
      }
    });
  });

  // 4. Logika Tombol Logout
  const logoutButtons = document.querySelectorAll('.logout');
  logoutButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (homeSystem) {
        homeSystem.logout();
      }
    });
  });
});