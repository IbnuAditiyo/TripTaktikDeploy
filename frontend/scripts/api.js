const BASE_URL = 'triptaktikdeploy-production.up.railway.app/api';

export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return res.json();
}

export async function register(name, email, password) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  return res.json();
}

export async function getWisataById(id) {
  const res = await fetch(`${BASE_URL}/wisata/${id}`);
  return res.json();
}

export async function addWishlist(userId, wisata_id, token) {
  const res = await fetch(`${BASE_URL}/wishlist`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ userId, wisata_id })
  });
  return res.json();
}


export async function getWishlist(userId, token) {
  const res = await fetch(`${BASE_URL}/wishlist/${userId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return res.json();
}


export async function deleteWishlist(userId, wisataId, token) {
  const res = await fetch(`${BASE_URL}/wishlist/${userId}/${wisataId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return res.json();
}

export async function getUser(token) {
  const res = await fetch(`${BASE_URL}/users`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return res.json();
}

export async function addFeedback({ title, description, location, image }) {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('description', description);
  formData.append('location', location);
  formData.append('image', image);

  const res = await fetch(`${BASE_URL}/feedback`, {
    method: 'POST',
    body: formData
  });

  return res.json();
}


export async function getAllFeedback() {
  const res = await fetch(`${BASE_URL}/feedback`, {
    method: 'GET'
  });
  return res.json();
}


