// src/scripts/pages/add-story/add-story-page.js
import ApiService from '../../api.js';
import { showNotification, validateForm } from '../../utils/index.js';
import CONFIG from '../../config.js';

export default class AddStoryPage {
  constructor() {
    this.map = null;
    this.selectedLocation = null;
    this.photoFile = null;
    this.cameraStream = null;
    this.locationMarker = null;
  }

  async render() {
    return `
      <section class="container add-story-page">
        <h1 class="page-title">Share Your Story</h1>
        
        <form id="add-story-form" class="story-form">
          <div class="form-group">
            <label for="story-description">Story Description *</label>
            <textarea 
              id="story-description" 
              name="description" 
              rows="4" 
              placeholder="Tell us your story..." 
              required
            ></textarea>
            <div id="description-error" class="error-message"></div>
          </div>

          <div class="form-group">
            <label for="story-photo">Photo *</label>
            <div class="photo-options">
              <button type="button" id="upload-photo-btn" class="photo-btn">
                📁 Upload Photo
              </button>
              <button type="button" id="camera-photo-btn" class="photo-btn">
                📷 Take Photo
              </button>
            </div>
            <input 
              type="file" 
              id="story-photo" 
              name="photo" 
              accept="image/*" 
              style="display: none;"
            />
            <div id="camera-preview" class="camera-preview" style="display: none;">
              <video id="camera-video" autoplay playsinline></video>
              <button type="button" id="capture-btn" class="photo-btn">Capture</button>
              <canvas id="camera-canvas" style="display: none;"></canvas>
            </div>
            <div id="photo-preview" class="photo-preview"></div>
            <div id="photo-error" class="error-message"></div>
          </div>

          <div class="form-group">
            <label>Select Location (Optional)</label>
            <p class="help-text">Click on the map below to set your story location</p>
            <div id="location-map" class="location-map"></div>
            <div id="selected-location" class="selected-location">
              No location selected
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="submit-btn">Share Story</button>
            <button type="button" id="cancel-btn" class="cancel-btn">Cancel</button>
          </div>
        </form>
      </section>
    `;
  }

  async afterRender() {
    // Wait for DOM to be fully rendered
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      this._showAuthRequired();
      return;
    }

    await this._initializeMap();
    this._setupEventListeners();
  }

  _showAuthRequired() {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.innerHTML = `
        <section class="container">
          <div class="no-stories">
            <h2>Authentication Required</h2>
            <p>Please login to share your story</p>
            <a href="#/auth" class="auth-prompt-btn">Login / Register</a>
          </div>
        </section>
      `;
    }
  }

  async _initializeMap() {
    // Load Leaflet CSS dynamically
    if (!document.querySelector('link[href*="leaflet"]')) {
      const leafletCSS = document.createElement('link');
      leafletCSS.rel = 'stylesheet';
      leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(leafletCSS);
    }

    // Load Leaflet JS dynamically
    return new Promise((resolve) => {
      if (typeof L !== 'undefined') {
        this._setupMap();
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        this._setupMap();
        resolve();
      };
      script.onerror = (error) => {
        console.error('Failed to load Leaflet:', error);
        resolve();
      };
      document.head.appendChild(script);
    });
  }

  _setupMap() {
    const mapElement = document.getElementById('location-map');
    if (!mapElement) {
      console.warn('Map element not found');
      return;
    }

    // Fix Leaflet default icon
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });

    this.map = L.map('location-map').setView(CONFIG.DEFAULT_MAP_CENTER, CONFIG.DEFAULT_MAP_ZOOM);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Add click event to map
    this.map.on('click', (e) => {
      this._selectLocation(e.latlng);
    });
  }

  _selectLocation(latlng) {
    // Remove existing marker
    if (this.locationMarker) {
      this.map.removeLayer(this.locationMarker);
    }

    // Add new marker
    this.locationMarker = L.marker(latlng)
      .addTo(this.map)
      .bindPopup('Story Location')
      .openPopup();

    this.selectedLocation = latlng;
    
    // Update display
    const locationDisplay = document.getElementById('selected-location');
    if (locationDisplay) {
      locationDisplay.textContent = `Selected: ${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`;
      locationDisplay.classList.add('has-location');
    }
  }

  _setupEventListeners() {
    // Wait a bit more for all elements to be available
    setTimeout(() => {
      this._setupFormEventListeners();
      this._setupPhotoEventListeners();
      this._setupButtonEventListeners();
    }, 150);
  }

  _setupFormEventListeners() {
    const form = document.getElementById('add-story-form');
    if (!form) {
      console.warn('Form element not found');
      return;
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this._submitForm();
    });
  }

  _setupPhotoEventListeners() {
    const uploadBtn = document.getElementById('upload-photo-btn');
    const cameraBtn = document.getElementById('camera-photo-btn');
    const fileInput = document.getElementById('story-photo');
    const captureBtn = document.getElementById('capture-btn');

    if (uploadBtn) {
      uploadBtn.addEventListener('click', () => {
        if (fileInput) fileInput.click();
      });
    }

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        this._handleFileSelect(e.target.files[0]);
      });
    }

    if (cameraBtn) {
      cameraBtn.addEventListener('click', () => {
        this._startCamera();
      });
    }

    if (captureBtn) {
      captureBtn.addEventListener('click', () => {
        this._capturePhoto();
      });
    }
  }

  _setupButtonEventListeners() {
    const cancelBtn = document.getElementById('cancel-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        window.location.hash = '#/';
      });
    }
  }

  _handleFileSelect(file) {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('Please select an image file', 'error');
      return;
    }

    this.photoFile = file;
    this._displayPhotoPreview(file);
    this._stopCamera(); // Stop camera if running
  }

  _displayPhotoPreview(file) {
    const preview = document.getElementById('photo-preview');
    if (!preview) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      preview.innerHTML = `
        <img src="${e.target.result}" alt="Preview" class="photo-preview-image">
        <button type="button" class="remove-photo-btn">&times;</button>
      `;
      
      // Add event listener to remove button
      const removeBtn = preview.querySelector('.remove-photo-btn');
      if (removeBtn) {
        removeBtn.addEventListener('click', () => {
          this._removePhoto();
        });
      }
    };

    reader.readAsDataURL(file);
  }

  async _startCamera() {
    try {
      this.cameraStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      const video = document.getElementById('camera-video');
      const cameraPreview = document.getElementById('camera-preview');
      
      if (video && cameraPreview) {
        video.srcObject = this.cameraStream;
        cameraPreview.style.display = 'block';

        // Hide other photo options
        const photoOptions = document.querySelector('.photo-options');
        if (photoOptions) {
          photoOptions.style.display = 'none';
        }
      }

    } catch (error) {
      showNotification('Cannot access camera: ' + error.message, 'error');
    }
  }

  _capturePhoto() {
    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('camera-canvas');
    if (!video || !canvas) return;

    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      this.photoFile = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
      this._displayPhotoPreviewFromCanvas(canvas);
      this._stopCamera();
    }, 'image/jpeg');
  }

  _displayPhotoPreviewFromCanvas(canvas) {
    const preview = document.getElementById('photo-preview');
    if (!preview) return;

    preview.innerHTML = `
      <img src="${canvas.toDataURL()}" alt="Camera capture" class="photo-preview-image">
      <button type="button" class="remove-photo-btn">&times;</button>
    `;
    
    // Add event listener to remove button
    const removeBtn = preview.querySelector('.remove-photo-btn');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        this._removePhoto();
      });
    }
  }

  _stopCamera() {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(track => track.stop());
      this.cameraStream = null;
    }
    
    const cameraPreview = document.getElementById('camera-preview');
    if (cameraPreview) {
      cameraPreview.style.display = 'none';
    }
    
    const photoOptions = document.querySelector('.photo-options');
    if (photoOptions) {
      photoOptions.style.display = 'flex';
    }
  }

  _removePhoto() {
    this.photoFile = null;
    const preview = document.getElementById('photo-preview');
    if (preview) {
      preview.innerHTML = '';
    }
    const fileInput = document.getElementById('story-photo');
    if (fileInput) {
      fileInput.value = '';
    }
  }

  async _submitForm() {
    const descriptionInput = document.getElementById('story-description');
    if (!descriptionInput) return;

    const description = descriptionInput.value;
    const formData = {
      description: description,
      photo: this.photoFile,
      lat: this.selectedLocation ? this.selectedLocation.lat : null,
      lon: this.selectedLocation ? this.selectedLocation.lng : null,
    };

    // Validate form
    const validation = validateForm(formData);
    if (!validation.isValid) {
      Object.entries(validation.errors).forEach(([field, message]) => {
        const errorElement = document.getElementById(`${field}-error`);
        if (errorElement) {
          errorElement.textContent = message;
        }
      });
      return;
    }

    // Clear errors
    document.querySelectorAll('.error-message').forEach(el => {
      el.textContent = '';
    });

    try {
      const submitBtn = document.querySelector('.submit-btn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sharing...';
      }

      await ApiService.addStory(formData);
      
      showNotification('Story shared successfully!', 'success');
      
      // Redirect to home page after delay
      setTimeout(() => {
        window.location.hash = '#/';
      }, 2000);

    } catch (error) {
      showNotification('Failed to share story: ' + error.message, 'error');
      
      const submitBtn = document.querySelector('.submit-btn');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Share Story';
      }
    }
  }

  destroy() {
    this._stopCamera();
    
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}