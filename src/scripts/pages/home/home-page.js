// src/scripts/pages/home/home-page.js
import ApiService from '../../api.js';
import { showFormattedDate, showNotification } from '../../utils/index.js';
import CONFIG from '../../config.js';
// <-- 1. IMPOR IDBService -->
import IDBService from '../../utils/idb-service.js';

export default class HomePage {
  constructor() {
    this.stories = [];
    this.map = null;
    this.markers = [];
    this.currentFilter = 'all';
    // <-- 2. TAMBAHKAN UNTUK MENYIMPAN ID FAVORIT -->
    this.favoriteIds = [];
  }

  async render() {
    return `
      <section class="container home-page">
        <h1 class="page-title">Story Map</h1>
        
        <div class="controls">
          <button id="filter-all" class="filter-btn active" data-filter="all">All Stories</button>
          <button id="filter-recent" class="filter-btn" data-filter="recent">Recent</button>
        </div>

        <div class="content-layout">
          <div class="stories-list">
            <h2>Stories</h2>
            <div id="stories-container" class="stories-container">
              <div class="loading">Loading stories...</div>
            </div>
          </div>

          <div class="map-container">
            <h2>Story Locations</h2>
            <div id="map" class="map"></div>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Wait a bit for DOM to be fully rendered
    await new Promise(resolve => setTimeout(resolve, 100));
    await this._loadStories();
    await this._initMap();
    this._setupEventListeners();
  }

  async _loadStories() {
    const container = document.getElementById('stories-container');
    
    // Check if container exists
    if (!container) {
      console.error('Stories container not found');
      return;
    }

    try {
      container.innerHTML = '<div class="loading">Loading stories...</div>';

      // Check if user is logged in
      const token = localStorage.getItem('token');
      if (!token) {
        // ... (kode 'Please login' Anda tidak berubah)
        container.innerHTML = `
          <div class="no-stories">
            <p>Please login to view stories</p>
            <a href="#/auth" class="auth-prompt-btn">Login / Register</a>
          </div>
        `;
        return;
      }

      const response = await ApiService.getStories();
      console.log('Stories Response:', response);
      
      this.stories = response.listStories || response.listStory || response.stories || [];

      // <-- 3. AMBIL DAFTAR ID FAVORIT DARI INDEXEDDB -->
      try {
        this.favoriteIds = (await IDBService.getFavorites()).map(s => s.id);
      } catch (e) {
        console.warn('Could not load favorites list for comparison', e);
      }
      // <-- AKHIR BLOK TAMBAHAN -->

      if (this.stories.length === 0) {
        container.innerHTML = '<div class="no-stories">No stories found. Be the first to share your story!</div>';
        return;
      }

      this._renderStoriesList();
      this._updateMapMarkers();
      this._updateAuthNavigation();

    } catch (error) {
      // ... (kode error handling Anda tidak berubah)
      console.error('Load Stories Error:', error);
      
      if (container) {
        if (error.message.includes('401')) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          container.innerHTML = `
            <div class="no-stories">
              <p>Session expired. Please login again.</p>
              <a href="#/auth" class="auth-prompt-btn">Login</a>
            </div>
          `;
        } else {
          showNotification('Error loading stories: ' + error.message, 'error');
          container.innerHTML = 
            '<div class="error">Failed to load stories. Please try again later.</div>';
        }
      }
    }
  }

  _renderStoriesList() {
    const container = document.getElementById('stories-container');
    if (!container) return;

    const filteredStories = this._getFilteredStories();

    // <-- 4. MODIFIKASI HTML STORY CARD UNTUK MENAMBAHKAN TOMBOL FAVORIT -->
    container.innerHTML = filteredStories.map(story => {
      // Periksa apakah story ini sudah ada di favorit
      const isFav = this.favoriteIds.includes(story.id);

      return `
        <article class="story-card" data-story-id="${story.id}">
          <img src="${story.photoUrl}" alt="${story.description}" class="story-image">
          <div class="story-content">
            <h3 class="story-description">${story.description}</h3>
            <p class="story-date">${showFormattedDate(story.createdAt)}</p>
            ${story.lat && story.lon ? 
              `<p class="story-location">📍 ${story.lat.toFixed(4)}, ${story.lon.toFixed(4)}</p>` : 
              '<p class="story-location">📍 Location not specified</p>'
            }
          </div>
          <button 
            class="favorite-btn" 
            title="${isFav ? 'Already in favorites' : 'Add to favorites'}" 
            data-story-id="${story.id}"
            ${isFav ? 'disabled' : ''}
          >
            ${isFav ? '❤️' : '♡'}
          </button>
        </article>
      `;
    }).join('');

    // Add click event to story cards
    container.querySelectorAll('.story-card').forEach(card => {
      card.addEventListener('click', () => {
        const storyId = card.dataset.storyId;
        this._highlightStoryOnMap(storyId);
      });
    });

    // <-- 5. TAMBAHKAN EVENT LISTENER UNTUK TOMBOL FAVORIT -->
    container.querySelectorAll('.favorite-btn:not([disabled])').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation(); // Mencegah card click event
        const storyId = e.target.dataset.storyId;
        
        try {
          const story = this.stories.find(s => s.id === storyId);
          if (story) {
            // Panggil IDBService untuk menyimpan
            await IDBService.addToFavorites(story);
            showNotification('Story added to favorites!', 'success');
            
            // Perbarui UI tombol
            e.target.innerHTML = '❤️';
            e.target.disabled = true;
            e.target.title = 'Already in favorites';
            this.favoriteIds.push(storyId); // Perbarui daftar internal
          }
        } catch (error) {
          console.error('Failed to add to favorites:', error);
          showNotification('Failed to add to favorites', 'error');
        }
      });
    });
    // <-- AKHIR BLOK TAMBAHAN -->
  }

  _getFilteredStories() {
    // ... (kode ini tidak berubah) ...
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    switch (this.currentFilter) {
      case 'recent':
        return this.stories.filter(story => new Date(story.createdAt) > oneWeekAgo);
      default:
        return this.stories;
    }
  }

  async _initMap() {
    // ... (kode ini tidak berubah) ...
    const mapElement = document.getElementById('map');
    if (!mapElement) {
      console.error('Map element not found');
      return;
    }

    if (!document.querySelector('link[href*="leaflet"]')) {
      const leafletCSS = document.createElement('link');
      leafletCSS.rel = 'stylesheet';
      leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(leafletCSS);
    }

    return new Promise((resolve) => {
      if (typeof L !== 'undefined') {
        this._initializeLeafletMap();
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        this._initializeLeafletMap();
        resolve();
      };
      script.onerror = () => {
        console.error('Failed to load Leaflet');
        resolve();
      };
      document.head.appendChild(script);
    });
  }

  _initializeLeafletMap() {
    // ... (kode ini tidak berubah) ...
    const mapElement = document.getElementById('map');
    if (!mapElement || typeof L === 'undefined') return;

    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });

    this.map = L.map('map').setView(CONFIG.DEFAULT_MAP_CENTER, CONFIG.DEFAULT_MAP_ZOOM);

    const baseLayers = {
      "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }),
      "Satellite": L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        attribution: '© Google Satellite',
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        maxZoom: 20
      })
    };

    baseLayers.OpenStreetMap.addTo(this.map);
    L.control.layers(baseLayers).addTo(this.map);

    this._updateMapMarkers();
  }

  _updateMapMarkers() {
    // ... (kode ini tidak berubah) ...
    if (!this.map || typeof L === 'undefined') return;

    this.markers.forEach(marker => this.map.removeLayer(marker));
    this.markers = [];

    this.stories.filter(story => story.lat && story.lon).forEach(story => {
      const marker = L.marker([story.lat, story.lon])
        .addTo(this.map)
        .bindPopup(`
          <div class="map-popup">
            <img src="${story.photoUrl}" alt="${story.description}" style="width: 100px; height: 100px; object-fit: cover;">
            <h4>${story.description}</h4>
            <p>${showFormattedDate(story.createdAt)}</p>
          </div>
        `);

      marker.storyId = story.id;
      this.markers.push(marker);

      marker.on('click', () => {
        this._highlightStoryInList(story.id);
      });
    });
  }

  _highlightStoryOnMap(storyId) {
    // ... (kode ini tidak berubah) ...
    if (!this.map) return;
    
    this.markers.forEach(marker => {
      if (marker.storyId === storyId) {
        marker.openPopup();
        this.map.setView(marker.getLatLng(), this.map.getZoom());
        marker.setIcon(L.divIcon({
          className: 'highlighted-marker',
          html: '<div style="background: red; width: 20px; height: 20px; border-radius: 50%;"></div>',
          iconSize: [20, 20]
        }));
      } else {
        marker.setIcon(L.divIcon({
          className: 'normal-marker',
          html: '<div style="background: blue; width: 15px; height: 15px; border-radius: 50%;"></div>',
          iconSize: [15, 15]
        }));
      }
    });
  }

  _highlightStoryInList(storyId) {
    // ... (kode ini tidak berubah) ...
    const container = document.getElementById('stories-container');
    if (!container) return;
    
    container.querySelectorAll('.story-card').forEach(card => {
      if (card.dataset.storyId === storyId) {
        card.classList.add('highlighted');
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        card.classList.remove('highlighted');
      }
    });
  }

  _setupEventListeners() {
    // ... (kode ini tidak berubah) ...
    setTimeout(() => {
      const filterButtons = document.querySelectorAll('.filter-btn');
      if (filterButtons.length === 0) return;

      filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
          e.target.classList.add('active');
          this.currentFilter = e.target.dataset.filter;
          this._renderStoriesList();
        });
      });
    }, 200);
  }

  _updateAuthNavigation() {
    // ... (kode ini tidak berubah) ...
    const authLink = document.getElementById('auth-link');
    if (!authLink) return;
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (localStorage.getItem('token')) {
      authLink.textContent = `Logout (${user.name || 'User'})`;
      authLink.href = '#/';
      authLink.onclick = (e) => {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        showNotification('Logged out successfully', 'success');
        window.location.hash = '#/';
      };
    } else {
      authLink.textContent = 'Login';
      authLink.href = '#/auth';
      authLink.onclick = null;
    }
  }

  destroy() {
    // ... (kode ini tidak berubah) ...
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.markers = [];
  }
}