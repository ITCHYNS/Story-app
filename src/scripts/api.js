// src/scripts/api.js
import CONFIG from './config.js';

class ApiService {
  constructor(baseUrl) {
    this._baseUrl = baseUrl;
  }

  async _fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    console.log('API Request:', `${this._baseUrl}${url}`, { headers, ...options });

    const response = await fetch(`${this._baseUrl}${url}`, {
      ...options,
      headers,
    });

    const responseJson = await response.json();
    console.log('API Response:', response.status, responseJson);

    if (!response.ok) {
      throw new Error(responseJson.message || `HTTP ${response.status}: Something went wrong`);
    }

    return responseJson;
  }

  async register({ name, email, password }) {
    const response = await this._fetchWithAuth('/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    
    // Handle different response structure
    return {
      data: {
        token: response.user?.token || response.loginResult?.token,
        user: response.user || response.loginResult
      }
    };
  }

  async login({ email, password }) {
    const response = await this._fetchWithAuth('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    // Handle different response structure
    return {
      data: {
        token: response.loginResult.token,
        user: response.loginResult
      }
    };
  }

  async getStories() {
    const response = await this._fetchWithAuth('/stories');
    
    // Handle different response structure
    return {
      listStories: response.listStory || response.stories || []
    };
  }

  async getStoryDetail(id) {
    const response = await this._fetchWithAuth(`/stories/${id}`);
    return {
      story: response.story
    };
  }


  // Tambahkan metode ini:
async subscribePush(subscription) {
  const API_BASE_URL = 'https://story-api.dicoding.dev/v1';
  
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('User not logged in');
  }

  // 1. Ambil objek JSON lengkap dari subscription
  const subJson = subscription.toJSON();

  // 2. BUAT OBJEK BARU yang hanya berisi data yang diizinkan API
  //    Kita membuang "expirationTime"
  const requestBody = {
    endpoint: subJson.endpoint,
    keys: subJson.keys, // Objek 'keys' berisi 'p256dh' dan 'auth'
  };

  // 3. Kirim objek yang sudah bersih ke server
  return fetch(`${API_BASE_URL}/notifications/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(requestBody), // Mengirim body yang sudah diperbaiki
  }).then(response => {
    // Tambahkan pemeriksaan error yang lebih baik
    if (!response.ok) {
      return response.json().then(err => {
        // Lemparkan error dengan pesan dari API
        throw new Error(`API Error: ${err.message || 'Bad Request'}`);
      });
    }
    return response.json();
  });
}

// GANTI FUNGSI LAMA ANDA DENGAN INI JUGA:
async unsubscribePush(subscription) {
  // 1. Tentukan Base URL yang benar di sini
  const API_BASE_URL = 'https://story-api.dicoding.dev/v1';

  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('User not logged in');
  }

  const endpoint = subscription.endpoint;

  // 2. Pastikan URL-nya benar
  return fetch(`${API_BASE_URL}/notifications/subscribe`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ endpoint }),
  }).then(response => response.json());
}

  async addStory({ description, photo, lat, lon }) {
    const formData = new FormData();
    formData.append('description', description);
    formData.append('photo', photo);
    if (lat) formData.append('lat', lat);
    if (lon) formData.append('lon', lon);

    const token = localStorage.getItem('token');
    console.log('Add Story - Token:', token);

    const response = await fetch(`${this._baseUrl}/stories`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const responseJson = await response.json();
    console.log('Add Story Response:', response.status, responseJson);

    if (!response.ok) {
      throw new Error(responseJson.message || 'Failed to add story');
    }

    return responseJson;
  }
}

export default new ApiService(CONFIG.BASE_URL);