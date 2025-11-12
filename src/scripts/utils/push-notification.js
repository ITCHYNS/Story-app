// src/scripts/utils/push-notification.js - DIPERBARUI
import { showNotification } from './index.js';
// <-- 1. Impor ApiService Anda
import ApiService from '../api.js';

class PushNotificationManager {
  constructor() {
    this.registration = null;
    this.subscription = null;
    this.isSubscribed = false;
    
    // <-- 2. Pastikan VAPID key ini BENAR (sesuai reviewer)
    this.VAPID_PUBLIC_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';
  }

  async init() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.ready;
      await this._checkSubscription();
      this._updateSubscriptionUI();
      return true;
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return false;
    }
  }

  async _checkSubscription() {
    try {
      this.subscription = await this.registration.pushManager.getSubscription();
      this.isSubscribed = !(this.subscription === null);
    } catch (error) {
      console.error('Error checking subscription:', error);
      this.isSubscribed = false;
    }
  }

  async subscribe() {
    if (!this.registration) {
      throw new Error('Service Worker not ready');
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // 1. Berlangganan ke browser
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this._urlBase64ToUint8Array(this.VAPID_PUBLIC_KEY)
      });
      
      console.log('Browser subscription successful:', this.subscription.toJSON());

      // <-- 3. KIRIM SUBSCRIPTION KE SERVER API (INI BAGIAN BARU) -->
      try {
        const response = await ApiService.subscribePush(this.subscription);
        if (response.error) {
          throw new Error(`API Error: ${response.message}`);
        }
        console.log('Server subscription successful:', response);
      } catch (apiError) {
        console.error('Failed to send subscription to server:', apiError);
        // Jika gagal kirim ke server, batalkan langganan di browser
        await this.subscription.unsubscribe();
        this.subscription = null;
        throw apiError; // Lempar error agar ditangkap oleh catch di bawah
      }
      
      this.isSubscribed = true;
      this._updateSubscriptionUI();
      showNotification('Push notifications enabled!', 'success');
      
      return this.subscription;

    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      this.isSubscribed = false;
      this._updateSubscriptionUI();
      showNotification(`Failed to enable push: ${error.message}`, 'error');
      return null;
    }
  }

  async unsubscribe() {
    if (!this.subscription) {
      return;
    }

    try {
      // <-- 4. BERITAHU SERVER API DULU (INI BAGIAN BARU) -->
      try {
        const response = await ApiService.unsubscribePush(this.subscription);
        if (response.error) {
          throw new Error(`API Error: ${response.message}`);
        }
        console.log('Server unsubscription successful:', response);
      } catch (apiError) {
        console.error('Failed to send unsubscription to server:', apiError);
        // Jangan hentikan proses, biarkan user tetap bisa unsubscribe dari browser
        // Tapi beri tahu user bahwa mungkin ada masalah
        showNotification('Failed to update server, but unsubscribed from browser.', 'warn');
      }

      // 2. Berhenti berlangganan dari browser
      const success = await this.subscription.unsubscribe();
      
      if (success) {
        this.isSubscribed = false;
        this.subscription = null;
        this._updateSubscriptionUI();
        showNotification('Push notifications disabled', 'info');
        console.log('User is unsubscribed.');
      }
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      showNotification('Failed to disable push notifications', 'error');
    }
  }

  async toggleSubscription() {
    if (this.isSubscribed) {
      await this.unsubscribe();
    } else {
      await this.subscribe();
    }
  }

  _updateSubscriptionUI() {
    // ... (metode ini tidak berubah)
    const toggleBtn = document.getElementById('push-toggle-btn');
    const statusElement = document.getElementById('push-status');
    
    if (toggleBtn) {
      toggleBtn.textContent = this.isSubscribed ? 'Disable Push' : 'Enable Push';
      toggleBtn.classList.toggle('active', this.isSubscribed);
    }
    
    if (statusElement) {
      statusElement.textContent = this.isSubscribed ? 'Enabled' : 'Disabled';
      statusElement.className = `push-status ${this.isSubscribed ? 'enabled' : 'disabled'}`;
    }
  }

  _urlBase64ToUint8Array(base64String) {
    // ... (metode ini tidak berubah)
    if (!base64String) {
      throw new Error('VAPID public key is not set.');
    }
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

export default new PushNotificationManager();