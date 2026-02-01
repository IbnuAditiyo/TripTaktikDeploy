const detailPageApp = (() => {
  // Konfigurasi URL API (Ganti port 8000 sesuai backendmu)
  const API_BASE_URL = 'http://localhost:8000/api';

  const elements = {
    heroImage: document.getElementById('heroImage'),
    destinationTitle: document.getElementById('destinationTitle'),
    ratingScore: document.getElementById('ratingScore'),
    starsContainer: document.getElementById('starsContainer'),
    destinationLocation: document.getElementById('destinationLocation'),
    operatingHours: document.getElementById('operatingHours'),
    tourType: document.getElementById('tourType'),
    ticketPrice: document.getElementById('ticketPrice'),
    overviewText: document.getElementById('overviewText'),
    mapLocationName: document.getElementById('mapLocationName'),
    wishlistBtn: document.getElementById('toggleWishlistBtn'),
    wishlistIcon: document.getElementById('wishlist-icon'),
    wishlistText: document.getElementById('wishlist-text'),
  };

  let wisataData = null;
  let mapInstance = null;

  // --- HELPER FUNCTIONS ---
  
  // Fungsi Notifikasi Pintar (Cek apakah config.js sudah ada showNotification, kalau tidak pakai alert biasa)
  function notify(message, type = 'info') {
    if (typeof showNotification === 'function') {
      showNotification(message, type);
    } else {
      // Fallback ke alert jika belum setup config.js
      if (type === 'error') console.error(message);
      alert(message);
    }
  }

  function formatCurrency(amount) {
    return amount ? `Rp${amount.toLocaleString('id-ID')}` : '-';
  }

  function updateStars(rating) {
    const stars = elements.starsContainer.querySelectorAll('.star');
    const ratingValue = isNaN(rating) ? 4.5 : rating;
    stars.forEach((star, index) => {
      if (index < Math.round(ratingValue)) {
        star.classList.remove('far');
        star.classList.add('fas');
      } else {
        star.classList.remove('fas');
        star.classList.add('far');
      }
    });
  }

  function extractType(data) {
    const typeKeys = Object.keys(data).filter(key => key.startsWith('type_clean_') && data[key] === 1);
    if (typeKeys.length > 0) {
      return typeKeys[0].replace('type_clean_', '').replace(/_/g, ' ');
    }
    return '-';
  }

  function renderData(data) {
    let imageSrc = data.image && data.image.trim() !== '' ?
      data.image :
      `https://source.unsplash.com/800x400/?${encodeURIComponent(data.nama || 'tourism')}`;
    elements.heroImage.src = imageSrc;
    elements.heroImage.alt = data.nama || 'Gambar Wisata';

    elements.heroImage.onerror = () => {
      elements.heroImage.src = '../assets/images/jalan1.jpg';
    };

    elements.destinationTitle.textContent = data.nama || 'Tanpa nama';

    const ratingStr = (data.vote_average || data.rating || '4.5').toString();
    const ratingNum = parseFloat(ratingStr.replace(',', '.'));
    elements.ratingScore.textContent = ratingNum.toFixed(1);
    updateStars(ratingNum);

    const lat = parseFloat((data.latitude || '0').toString().replace(',', '.'));
    const lon = parseFloat((data.longitude || '0').toString().replace(',', '.'));
    elements.destinationLocation.textContent = `Lat: ${lat.toFixed(6)}, Lon: ${lon.toFixed(6)}`;

    if (mapInstance) {
        mapInstance.remove();
    }
    
    mapInstance = L.map('map').setView([lat, lon], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance);
    L.marker([lat, lon]).addTo(mapInstance)
      .bindPopup(data.nama || 'Lokasi Wisata')
      .openPopup();
      
    setTimeout(() => {
        mapInstance.invalidateSize();
    }, 100);

    document.getElementById('openInGoogleMaps').href = `https://www.google.com/maps?q=${lat},${lon}`;
    elements.operatingHours.textContent = '08.00 - 17.00 WIB';
    elements.tourType.textContent = extractType(data);
    elements.ticketPrice.textContent = formatCurrency(data.htm_weekday || 0);
    elements.overviewText.textContent = data.description_clean || 'Deskripsi tidak tersedia.';
    
    // Panggil update status tombol (Asynchronous)
    updateWishlistBtn();
  }

  // --- LOGIC WISHLIST BARU ---

  // 1. Cek Status Langsung ke Server (Single Source of Truth)
  async function checkServerWishlistStatus() {
    const user = JSON.parse(localStorage.getItem('tripTaktikCurrentUser'));
    if (!user || !user._id || !wisataData) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/wishlist/${user._id}`);
      if (!response.ok) return false;
      
      const wishlistItems = await response.json();
      // Pastikan property id wisata sesuai dengan response server (biasanya 'wisata_id')
      return wishlistItems.some(item => item.wisata_id === wisataData.no);
    } catch (error) {
      console.error("Gagal cek status wishlist:", error);
      return false;
    }
  }

  // 2. Update Tampilan Tombol
  async function updateWishlistBtn() {
    // Tampilkan state loading sementara (opsional)
    elements.wishlistText.textContent = 'Memuat...';

    const isSaved = await checkServerWishlistStatus();
    
    // Simpan status 'saved' di atribut dataset elemen agar bisa dibaca fungsi toggle
    elements.wishlistBtn.dataset.saved = isSaved ? 'true' : 'false';

    if (isSaved) {
      elements.wishlistIcon.classList.remove('far');
      elements.wishlistIcon.classList.add('fas'); // Love Penuh
      elements.wishlistText.textContent = 'Sudah di Wishlist';
    } else {
      elements.wishlistIcon.classList.remove('fas');
      elements.wishlistIcon.classList.add('far'); // Love Kosong
      elements.wishlistText.textContent = 'Simpan ke Wishlist';
    }
  }

  // 3. Fungsi Toggle (Simpan/Hapus Pintar)
  async function toggleWishlist() {
    if (!wisataData || !wisataData.no) {
      notify('❌ Data wisata tidak valid', 'error');
      return;
    }

    const user = JSON.parse(localStorage.getItem('tripTaktikCurrentUser'));
    if (!user || !user._id) {
      notify('❌ Anda harus login untuk menambahkan wishlist', 'warning');
      return;
    }

    // Baca status dari atribut yang kita set di updateWishlistBtn
    const isCurrentlySaved = elements.wishlistBtn.dataset.saved === 'true';

    try {
      let response;
      
      if (isCurrentlySaved) {
        // --- LOGIKA UNSAVE (DELETE) ---
        response = await fetch(`${API_BASE_URL}/wishlist/${user._id}/${wisataData.no}`, {
          method: 'DELETE',
        });
      } else {
        // --- LOGIKA SAVE (POST) ---
        response = await fetch(`${API_BASE_URL}/wishlist`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: user._id,
            wisata_id: wisataData.no
          })
        });
      }

      const result = await response.json();

      if (response.ok) {
        // Sukses
        const actionMsg = isCurrentlySaved ? 'Dihapus dari wishlist' : 'Disimpan ke wishlist';
        notify(`✅ Berhasil: ${actionMsg}`, 'success');

        // Update Local Storage (Hanya sebagai cache cadangan)
        const currentWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        if (isCurrentlySaved) {
            const newWishlist = currentWishlist.filter(item => item.no !== wisataData.no);
            localStorage.setItem('wishlist', JSON.stringify(newWishlist));
        } else {
            if (!currentWishlist.some(item => item.no === wisataData.no)) {
                currentWishlist.push(wisataData);
                localStorage.setItem('wishlist', JSON.stringify(currentWishlist));
            }
        }

        // Refresh tombol untuk memastikan status terbaru
        await updateWishlistBtn();

      } else {
        // Handle Error Spesifik
        if (result.error && result.error.includes('duplicate')) {
            // Jika server bilang duplikat, berarti sebenarnya sudah tersimpan. Update UI saja.
            notify('Info: Wisata sudah ada di wishlist', 'info');
            await updateWishlistBtn();
        } else {
            throw new Error(result.message || result.error || 'Gagal memproses request');
        }
      }

    } catch (err) {
      notify('❌ Terjadi kesalahan: ' + err.message, 'error');
    }
  }

  // --- ML & RECOMMENDATION LOGIC ---
  async function loadModelAndData() {
    const [model, response] = await Promise.all([
      tf.loadGraphModel('../ml-model/model.json'),
      fetch('../data/dataset_jogja_with_vectors_fixed_v2.json')
    ]);
    const dataset = await response.json();
    return {
      model,
      dataset
    };
  }

  function findVectorByName(name, dataset) {
    const item = dataset.find(item => item.nama.toLowerCase() === name.toLowerCase());
    return item?.vector || null;
  }

  async function calculateSimilarity(model, vectorA, vectorB) {
    const inputA = tf.tensor2d([vectorA], [1, 100]);
    const inputB = tf.tensor2d([vectorB], [1, 100]);

    const result = model.execute({
      'inputs:0': inputA,
      'inputs_1:0': inputB
    }, 'Identity:0');

    const similarity = (await result.data())[0];
    tf.dispose([inputA, inputB, result]);
    return similarity;
  }

  async function getTopSimilarPlaces(model, targetVector, dataset, excludeName, currentType, topN = 3) {
    const results = [];

    for (const item of dataset) {
      if (!item.vector || item.nama === excludeName) continue;

      const itemTypeKeys = Object.keys(item).filter(k => k.startsWith('type_clean_') && item[k] === 1);
      const hasSameType = itemTypeKeys.includes(`type_clean_${currentType.replace(/ /g, "_")}`);
      if (!hasSameType) continue;

      const sim = await calculateSimilarity(model, targetVector, item.vector);
      results.push({ ...item,
        similarity: sim
      });
    }

    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topN);
  }

  function renderRelatedRecommendations(recommendations) {
    const container = document.getElementById('relatedList');
    container.innerHTML = '';
    recommendations.forEach(item => {
      const card = document.createElement('div');
      card.className = 'recommendation-card';
      card.innerHTML = `
        <img src="${item.image || 'https://source.unsplash.com/300x200/?tourism'}" alt="${item.nama}" />
        <div class="card-content">
          <h4>${item.nama}</h4>
          <p>Rating: ${parseFloat(item.vote_average || 4.5).toFixed(1)}</p>
        </div>
      `;
      card.addEventListener('click', () => {
        localStorage.setItem('selectedWisata', JSON.stringify(item));
        window.location.reload(); 
      });
      container.appendChild(card);
    });
  }

  async function showRelatedRecommendations(currentPlaceName) {
    try {
        const { model, dataset } = await loadModelAndData();
        const currentVector = findVectorByName(currentPlaceName, dataset);
        if (!currentVector) return;

        const currentData = dataset.find(item => item.nama.toLowerCase() === currentPlaceName.toLowerCase());
        if (!currentData) return;
        
        const typeKeys = Object.keys(currentData).filter(k => k.startsWith('type_clean_') && currentData[k] === 1);
        const mainType = typeKeys.length > 0 ? typeKeys[0].replace('type_clean_', '') : null;

        if (!mainType) return;

        const topRecommendations = await getTopSimilarPlaces(
            model,
            currentVector,
            dataset,
            currentPlaceName,
            mainType,
            3
        );

        renderRelatedRecommendations(topRecommendations);
    } catch (error) {
        console.error("Gagal memuat atau memproses rekomendasi:", error);
        document.getElementById('related-recommendations').style.display = 'none';
    }
  }

  function init() {
    const stored = localStorage.getItem('selectedWisata');
    if (!stored) {
      alert('Data wisata tidak ditemukan, kembali ke halaman rekomendasi.');
      window.location.href = 'rekomendasi.html';
      return;
    }
    wisataData = JSON.parse(stored);
    document.title = `${wisataData.nama || 'Detail Wisata'} - Trip.Taktik`;
    
    renderData(wisataData);
    showRelatedRecommendations(wisataData.nama);
    
    // Pasang listener di sini, bukan di renderData agar tidak duplikat
    elements.wishlistBtn.onclick = toggleWishlist; 
  }

  return {
    init,
  };
})();

// Listener utama setelah DOM siap
document.addEventListener('DOMContentLoaded', () => {
    detailPageApp.init();

    // --- LOGIKA NAVIGASI ---
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

    // --- LOGIKA LOGOUT ---
    const logoutButtons = document.querySelectorAll('.logout');
    if (logoutButtons.length > 0) {
        logoutButtons.forEach(button => {
            button.addEventListener('click', () => {
                if(confirm('Apakah Anda yakin ingin keluar?')) {
                    localStorage.removeItem('tripTaktikCurrentUser'); 
                    alert('Anda telah berhasil logout.');
                    window.location.href = 'auth.html'; 
                }
            });
        });
    }
});