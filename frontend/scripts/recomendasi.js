let wisataData = [];

/**
 * @param {object} w
 * @returns {string}
 */
function getType(w) {
  const typeMap = {
    "Agrowisata": w.type_clean_Agrowisata,
    "Alam": w.type_clean_Alam,
    "Buatan": w.type_clean_Buatan,
    "Budaya Dan Sejarah": w.type_clean_BudayaDanSejarah || w.type_clean_Budaya_Dan_Sejarah,
    "Kuliner": w.type_clean_Kuliner,
    "Museum": w.type_clean_Museum,
    "Pantai": w.type_clean_Pantai,
    "Pendidikan": w.type_clean_Pendidikan,
    "Religi": w.type_clean_Religi,
    "Seni": w.type_clean_Seni,
  };

  for (const [key, val] of Object.entries(typeMap)) {
    if (val === 1) {
      return key;
    }
  }

  return "Lainnya";
}

/**
 * @param {Array<object>} data
 */
function renderWisata(data) {
  const list = document.getElementById('recommendationList');
  if (!list) return;

  list.innerHTML = '';

  data.forEach(w => {
    const rating = parseFloat(w.vote_average).toFixed(1);
    const type = getType(w);
    const item = document.createElement('div');
    item.className = "card-wisata";

    item.innerHTML = `
      <img src="${w.image}" alt="${w.nama}" onerror="this.src='https://placehold.co/250x200/475d57/FFFFFF?text=Trip.Taktik';">
      <div class="info-wisata">
        <div>
          <div class="info-header">
            <h3>${w.nama}</h3>
          </div>
          <p class="rating">
            <span class="star">⭐</span> ${rating}
            <span class="kategori">${type}</span>
          </p>
          <p class="deskripsi">${w.description_clean || '-'}</p>
        </div>
        <button class="btn-detail">View More</button>
      </div>
    `;

    const btn = item.querySelector('.btn-detail');
    btn.addEventListener('click', () => {
      localStorage.setItem('selectedWisata', JSON.stringify(w));
      window.location.href = '../pages/detail-page.html';
    });

    list.appendChild(item);
  });
}


function filterWisata() {
  const filterType = document.getElementById('filterType').value;
  const filterRating = document.getElementById('filterRating').value;

  let filtered = wisataData;

  if (filterType) {
    filtered = filtered.filter(w => getType(w) === filterType);
  }

  if (filterRating) {
    const minRating = parseFloat(filterRating);
    filtered = filtered.filter(w => parseFloat(w.vote_average) >= minRating);
  }

  renderWisata(filtered);
}


document.addEventListener('DOMContentLoaded', () => {

  const list = document.getElementById('recommendationList');
  fetch('../data/dataset_jogja_with_vectors_fixed_v2.json')
    .then(res => res.json())
    .then(data => {
      wisataData = data;
      renderWisata(wisataData);
    })
    .catch(err => {
      console.error('Gagal memuat data wisata:', err);
      if (list) {
        list.innerHTML = '<p>Gagal memuat data. Silakan coba lagi nanti.</p>';
      }
    });

  const logoutButtons = document.querySelectorAll('.logout');
    logoutButtons.forEach(button => {
        button.addEventListener('click', () => {
            Swal.fire({
                title: 'Akhiri Sesi?',
                text: "Rekomendasi terbaik selalu ada untuk Anda.",
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#475d57',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Ya, Keluar'
            }).then((result) => {
                if (result.isConfirmed) {
                    localStorage.removeItem('tripTaktikCurrentUser');
                    Swal.fire({
                        title: 'Berhasil Logout',
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false
                    }).then(() => {
                        window.location.href = 'auth.html';
                    });
                }
            });
        });
    });

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
});