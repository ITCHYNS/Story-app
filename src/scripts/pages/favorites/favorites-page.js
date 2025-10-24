// src/scripts/pages/favorites/favorites-page.js
import IDBService from '../../utils/idb-service.js';
import { showFormattedDate, showNotification } from '../../utils/index.js';

export default class FavoritesPage {
  constructor() {
    this.favorites = [];
    this.currentFilter = 'all';
    this.searchTerm = '';
  }

  async render() {
    return `
      <section class="container favorites-page">
        <h1 class="page-title">Favorite Stories</h1>
        
        <div class="favorites-controls">
          <div class="search-box">
            <input type="text" id="favorites-search" placeholder="Search favorites..." class="search-input">
            <button type="button" id="search-btn" class="search-btn">🔍</button>
          </div>
          
          <div class="filter-controls">
            <button id="filter-all" class="filter-btn active" data-filter="all">All</button>
            <button id="filter-recent" class="filter-btn" data-filter="recent">Recent</button>
            <button id="filter-with-location" class="filter-btn" data-filter="with-location">With Location</button>
          </div>
          
          <div class="sort-controls">
            <select id="sort-select" class="sort-select">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>
        </div>

        <div id="favorites-container" class="favorites-container">
          <div class="loading">Loading favorites...</div>
        </div>

        <div id="no-favorites" class="no-favorites" style="display: none;">
          <div class="empty-state">
            <h3>No favorites yet</h3>
            <p>Stories you mark as favorite will appear here</p>
            <a href="#/" class="browse-btn">Browse Stories</a>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    await this._loadFavorites();
    this._setupEventListeners();
  }

  async _loadFavorites() {
    try {
      this.favorites = await IDBService.getFavorites();
      this._renderFavorites();
    } catch (error) {
      console.error('Error loading favorites:', error);
      showNotification('Failed to load favorites', 'error');
    }
  }

  _renderFavorites() {
    const container = document.getElementById('favorites-container');
    const noFavorites = document.getElementById('no-favorites');

    if (!container || !noFavorites) return;

    if (this.favorites.length === 0) {
      container.style.display = 'none';
      noFavorites.style.display = 'block';
      return;
    }

    container.style.display = 'block';
    noFavorites.style.display = 'none';

    const filteredFavorites = this._getFilteredFavorites();
    const sortedFavorites = this._getSortedFavorites(filteredFavorites);

    container.innerHTML = sortedFavorites.map(story => `
      <article class="favorite-card" data-story-id="${story.id}">
        <div class="favorite-header">
          <h3 class="favorite-description">${story.description}</h3>
          <button class="favorite-remove-btn" data-story-id="${story.id}" title="Remove from favorites">
            ♥
          </button>
        </div>
        
        <img src="${story.photoUrl}" alt="${story.description}" class="favorite-image">
        
        <div class="favorite-details">
          <p class="favorite-date">${showFormattedDate(story.createdAt)}</p>
          ${story.lat && story.lon ? 
            `<p class="favorite-location">📍 ${story.lat.toFixed(4)}, ${story.lon.toFixed(4)}</p>` : 
            '<p class="favorite-location">📍 Location not specified</p>'
          }
        </div>
        
        <div class="favorite-actions">
          <button class="action-btn view-btn" data-story-id="${story.id}">View Details</button>
          ${story.lat && story.lon ? 
            `<button class="action-btn map-btn" data-lat="${story.lat}" data-lon="${story.lon}">Show on Map</button>` : 
            ''
          }
        </div>
      </article>
    `).join('');

    this._setupFavoriteCardEventListeners();
  }

  _getFilteredFavorites() {
    let filtered = this.favorites;

    // Apply search filter
    if (this.searchTerm) {
      filtered = filtered.filter(story => 
        story.description.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    switch (this.currentFilter) {
      case 'recent':
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        filtered = filtered.filter(story => new Date(story.createdAt) > oneWeekAgo);
        break;
      case 'with-location':
        filtered = filtered.filter(story => story.lat && story.lon);
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    return filtered;
  }

  _getSortedFavorites(favorites) {
    const sortBy = document.getElementById('sort-select')?.value || 'newest';

    switch (sortBy) {
      case 'newest':
        return [...favorites].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'oldest':
        return [...favorites].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'alphabetical':
        return [...favorites].sort((a, b) => a.description.localeCompare(b.description));
      default:
        return favorites;
    }
  }

  _setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('favorites-search');
    const searchBtn = document.getElementById('search-btn');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchTerm = e.target.value;
        this._renderFavorites();
      });
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        this._renderFavorites();
      });
    }

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.currentFilter = e.target.dataset.filter;
        this._renderFavorites();
      });
    });

    // Sort select
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        this._renderFavorites();
      });
    }
  }

  _setupFavoriteCardEventListeners() {
    // Remove from favorites
    document.querySelectorAll('.favorite-remove-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const storyId = btn.dataset.storyId;
        await this._removeFromFavorites(storyId);
      });
    });

    // View details
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const storyId = btn.dataset.storyId;
        this._viewStoryDetails(storyId);
      });
    });

    // Show on map
    document.querySelectorAll('.map-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const lat = parseFloat(btn.dataset.lat);
        const lon = parseFloat(btn.dataset.lon);
        this._showOnMap(lat, lon);
      });
    });

    // Card click
    document.querySelectorAll('.favorite-card').forEach(card => {
      card.addEventListener('click', () => {
        const storyId = card.dataset.storyId;
        this._viewStoryDetails(storyId);
      });
    });
  }

  async _removeFromFavorites(storyId) {
    try {
      await IDBService.removeFromFavorites(storyId);
      this.favorites = this.favorites.filter(story => story.id !== storyId);
      this._renderFavorites();
      showNotification('Removed from favorites', 'success');
    } catch (error) {
      console.error('Error removing from favorites:', error);
      showNotification('Failed to remove from favorites', 'error');
    }
  }

  _viewStoryDetails(storyId) {
    // Navigate to story details or show modal
    showNotification(`Viewing story ${storyId}`, 'info');
    // In a real app, you would navigate to a story detail page
  }

  _showOnMap(lat, lon) {
    // Navigate to home page with map centered on location
    window.location.hash = `#/?lat=${lat}&lon=${lon}&zoom=15`;
  }

  destroy() {
    // Cleanup
  }
}