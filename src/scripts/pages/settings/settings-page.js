// src/scripts/pages/settings/settings-page.js
import { showNotification } from '../../utils/index.js';
// <-- 1. IMPOR PUSH NOTIFICATION MANAGER
import PushNotificationManager from '../../utils/push-notification.js';

export default class SettingsPage {
  async render() {
    return `
      <section class="container settings-page">
        <h1 class="page-title">Settings</h1>
        
        <div class="settings-content">
          <div class="setting-card">
            <h2>🔔 Notifications</h2>
            <p>Manage your notification preferences</p>
            
            <div class="setting-control">
              <button id="push-toggle-btn" class="toggle-btn">
                Enable Notifications
              </button>
              <span id="push-status" class="push-status disabled">
                Disabled
              </span>
            </div>
          </div>

          <div class="setting-card">
            <h2>🌐 Network Status</h2>
            <p>Current connection information</p>
            
            <div class="setting-control">
              <span class="offline-status" id="network-status">Checking...</span>
            </div>
            
            <div class="setting-info">
              <small id="network-info">Checking network status...</small>
            </div>
          </div>

          <div class="setting-card">
            <h2>💾 Data Management</h2>
            <p>Manage your local data and storage</p>
            
            <div class="setting-control">
              <button id="clear-cache-btn" class="danger-btn">Clear Cache</button>
              <button id="clear-data-btn" class="danger-btn">Clear All Data</button>
            </div>
            
            <div class="storage-info">
              <p><strong>Local Storage:</strong> <span id="local-storage-size">Calculating...</span></p>
              <p><strong>Service Worker:</strong> <span id="sw-status">Checking...</span></p>
            </div>
          </div>

          <div class="setting-card">
            <h2>ℹ️ App Information</h2>
            <div class="app-info">
              <p><strong>Version:</strong> 2.0.0</p>
              <p><strong>Browser:</strong> <span id="browser-info">Checking...</span></p>
              <p><strong>PWA Support:</strong> <span id="pwa-support">Checking...</span></p>
              <p><strong>Last Updated:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div class="setting-card">
            <h2>🛠️ Developer Tools</h2>
            <p>Tools for development and debugging</p>
            
            <div class="setting-control">
              <button id="reload-sw-btn" class="secondary-btn">Reload Service Worker</button>
              <button id="test-notification-btn" class="secondary-btn">Test Notification</button>
            </div>
            
            <div class="setting-control">
              <button id="export-logs-btn" class="secondary-btn">Export Logs</button>
              <button id="clear-logs-btn" class="danger-btn">Clear Console</button>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    console.log('--- SETTINGS DEBUG: afterRender() DIPANGGIL ---');

    setTimeout(async () => {
      console.log('--- SETTINGS DEBUG: setTimeout(0) BERJALAN ---');
      
      try {
        console.log('DEBUG: Memanggil PushNotificationManager.init()...');
        await PushNotificationManager.init();
        console.log('DEBUG: PushNotificationManager.init() SELESAI.');
      } catch (error) {
        console.error('*** ERROR di PushNotificationManager.init() ***', error);
      }
      
      try {
        console.log('DEBUG: Memanggil _initializeSettings()...');
        this._initializeSettings();
        console.log('DEBUG: _initializeSettings() SELESAI.');
      } catch (error) {
        console.error('*** ERROR di _initializeSettings() ***', error);
      }

      try {
        console.log('DEBUG: Memanggil _setupEventListeners()...');
        this._setupEventListeners();
        console.log('DEBUG: _setupEventListeners() SELESAI.');
      } catch (error) {
        console.error('*** ERROR di _setupEventListeners() ***', error);
      }

      try {
        console.log('DEBUG: Memanggil _updateAppInfo()...');
        this._updateAppInfo();
        console.log('DEBUG: _updateAppInfo() SELESAI.');
      } catch (error) {
        console.error('*** ERROR di _updateAppInfo() ***', error);
      }

      console.log('--- SETTINGS DEBUG: afterRender() SELESAI TOTAL ---');
    }, 0);
  }

  _initializeSettings() {
    this._updateNetworkStatus();
    // <-- 5. PANGGILAN INI TIDAK DIPERLUKAN LAGI, MANAGER SUDAH MENANGANINYA
    // this._updateNotificationStatus(); 
    this._updateStorageInfo();
  }

  _updateNetworkStatus() {
    const statusElement = document.getElementById('network-status');
    const infoElement = document.getElementById('network-info');
    
    if (!statusElement || !infoElement) return;

    const isOnline = navigator.onLine;
    statusElement.textContent = isOnline ? 'Online' : 'Offline';
    statusElement.className = `offline-status ${isOnline ? 'online' : 'offline'}`;
    
    infoElement.textContent = isOnline 
      ? 'You are connected to the internet'
      : 'You are currently offline. Some features may be limited.';

    // Update on network changes
    const updateStatus = () => {
      this._updateNetworkStatus();
    };

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
  }

  // <-- 6. METODE INI (_updateNotificationStatus) SEKARANG TIDAK DIPERLUKAN
  // Logika di dalamnya sudah ditangani oleh PushNotificationManager.init()
  /*
  _updateNotificationStatus() {
    // ... (SELURUH METODE INI BISA DIHAPUS) ...
  }
  */

  _updateStorageInfo() {
    // ... (kode ini tidak berubah) ...
    try {
      let localStorageSize = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          localStorageSize += localStorage[key].length * 2; // UTF-16 characters
        }
      }
      
      const sizeElement = document.getElementById('local-storage-size');
      if (sizeElement) {
        sizeElement.textContent = this._formatBytes(localStorageSize);
      }
    } catch (error) {
      console.error('Error calculating storage size:', error);
    }

    const swStatusElement = document.getElementById('sw-status');
    if (swStatusElement) {
      swStatusElement.textContent = 'serviceWorker' in navigator ? 'Active' : 'Not Supported';
    }
  }

  _formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  _setupEventListeners() {
    setTimeout(() => {
      this._setupNotificationToggle();
      this._setupDataButtons();
      this._setupDeveloperTools();
    }, 200);
  }

  _setupNotificationToggle() {
    // <-- 7. METODE INI SEKARANG HANYA MEMANGGIL MANAGER
    const toggleBtn = document.getElementById('push-toggle-btn');
    if (!toggleBtn) return;

    toggleBtn.addEventListener('click', () => {
      // Kita hanya perlu memanggil toggle, manager akan menangani sisanya
      PushNotificationManager.toggleSubscription();
    });
  }

  _setupDataButtons() {
    // ... (kode ini tidak berubah) ...
    const clearCacheBtn = document.getElementById('clear-cache-btn');
    const clearDataBtn = document.getElementById('clear-data-btn');

    if (clearCacheBtn) {
      clearCacheBtn.addEventListener('click', () => {
        this._clearCache();
      });
    }

    if (clearDataBtn) {
      clearDataBtn.addEventListener('click', () => {
        this._clearAllData();
      });
    }
  }

  _setupDeveloperTools() {
    // ... (kode ini tidak berubah, tapi perhatikan _testNotification) ...
    const reloadSWBtn = document.getElementById('reload-sw-btn');
    const testNotificationBtn = document.getElementById('test-notification-btn');
    const exportLogsBtn = document.getElementById('export-logs-btn');
    const clearLogsBtn = document.getElementById('clear-logs-btn');

    if (reloadSWBtn) {
      reloadSWBtn.addEventListener('click', () => {
        this._reloadServiceWorker();
      });
    }

    if (testNotificationBtn) {
      testNotificationBtn.addEventListener('click', () => {
        this._testNotification();
      });
    }

    if (exportLogsBtn) {
      exportLogsBtn.addEventListener('click', () => {
        this._exportLogs();
      });
    }

    if (clearLogsBtn) {
      clearLogsBtn.addEventListener('click', () => {
        console.clear();
        showNotification('Console cleared', 'info');
      });
    }
  }

  // ... (Sisa metode Anda: _clearCache, _clearAllData, _reloadServiceWorker, dll. tidak berubah) ...
  // ... (Saya akan menyertakan semuanya di bawah agar lengkap) ...
  
  async _clearCache() {
    if (!confirm('Clear browser cache? This will remove temporary files but keep your data.')) {
      return;
    }

    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      showNotification('Cache cleared successfully', 'success');
      this._updateStorageInfo();
    } catch (error) {
      console.error('Error clearing cache:', error);
      showNotification('Failed to clear cache', 'error');
    }
  }

  async _clearAllData() {
    if (!confirm('⚠️ WARNING: This will clear ALL local data including stories and settings. This action cannot be undone.')) {
      return;
    }

    try {
      localStorage.clear();
      if ('indexedDB' in window) {
        const databases = await indexedDB.databases();
        for (const db of databases) {
          indexedDB.deleteDatabase(db.name);
        }
      }
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      showNotification('All data cleared successfully', 'success');
      setTimeout(() => {
        location.reload();
      }, 1500);
      
    } catch (error) {
      console.error('Error clearing all data:', error);
      showNotification('Failed to clear all data', 'error');
    }
  }

  async _reloadServiceWorker() {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
        await navigator.serviceWorker.register('sw.bundle.js');
        showNotification('Service Worker reloaded', 'success');
      } else {
        showNotification('Service Worker not supported', 'error');
      }
    } catch (error) {
      console.error('Error reloading Service Worker:', error);
      showNotification('Failed to reload Service Worker', 'error');
    }
  }

  _testNotification() {
    if (!('Notification' in window)) {
      showNotification('Notifications not supported', 'error');
      return;
    }
    // <-- 8. Perbarui ini untuk memeriksa status dari Manager jika perlu
    // Tapi untuk sekarang, cek Notification.permission sudah cukup
    if (Notification.permission !== 'granted') {
      showNotification('Please enable notifications first', 'error');
      return;
    }
    try {
      new Notification('Story Map Test', {
        body: 'This is a test notification from Story Map!',
        icon: '/favicon.png',
        tag: 'test-notification'
      });
      showNotification('Test notification sent', 'success');
    } catch (error) {
      console.error('Error showing test notification:', error);
      showNotification('Failed to show test notification', 'error');
    }
  }

  _exportLogs() {
    // ... (kode ini tidak berubah) ...
    try {
      const logs = {
        exportedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        localStorage: { ...localStorage },
        settings: {
          online: navigator.onLine,
          notificationPermission: Notification.permission,
          serviceWorker: 'serviceWorker' in navigator
        }
      };
      
      const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `story-map-logs-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showNotification('Logs exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting logs:', error);
      showNotification('Failed to export logs', 'error');
    }
  }

  _updateAppInfo() {
    // ... (kode ini tidak berubah) ...
    const browserInfoElement = document.getElementById('browser-info');
    if (browserInfoElement) {
      browserInfoElement.textContent = navigator.userAgent.split(' ').slice(-2).join(' ');
    }
    const pwaSupportElement = document.getElementById('pwa-support');
    if (pwaSupportElement) {
      const supportsPWA = 'serviceWorker' in navigator && 'caches' in window;
      pwaSupportElement.textContent = supportsPWA ? 'Supported' : 'Not Supported';
    }
  }

  destroy() {
    // Cleanup
    console.log('Settings page destroyed');
  }
}