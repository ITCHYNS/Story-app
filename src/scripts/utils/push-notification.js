// src/scripts/utils/push-notification.js - MODIFIED
// Kita tidak perlu CONFIG di sini karena kita akan hardcode VAPID key
// import CONFIG from '../config.js'; 
import { showNotification } from './index.js'; // Asumsi 'showNotification' ada di file index.js

class PushNotificationManager {
  constructor() {
    this.registration = null;
    this.subscription = null;
    this.isSubscribed = false;
    // <-- INI ADALAH VAPID PUBLIC KEY YANG ANDA BERIKAN
    this.VAPID_PUBLIC_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';
  }

  async init() {
    // Check browser support
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return false;
    }

    if (!('PushManager' in window)) {
      console.log('Push notifications not supported');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.ready;
      await this._checkSubscription();
      this._updateSubscriptionUI(); // <-- Memperbarui UI saat inisialisasi
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
      // Request notification permission first
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // <-- MENGGUNAKAN VAPID KEY YANG BENAR
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this._urlBase64ToUint8Array(this.VAPID_PUBLIC_KEY)
      });

      this.isSubscribed = true;
      this._updateSubscriptionUI();
      showNotification('Push notifications enabled!', 'success');
      
      console.log('User is subscribed:', this.subscription);
      // TODO: Kirim 'this.subscription' ke server Anda untuk disimpan
      
      return this.subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      this.isSubscribed = false; // <-- Pastikan status update jika gagal
      this._updateSubscriptionUI();
      showNotification('Failed to enable push notifications', 'error');
      return null;
    }
  }

  async unsubscribe() {
    if (!this.subscription) {
      return;
    }

    try {
      const success = await this.subscription.unsubscribe();
      
      if (success) {
        this.isSubscribed = false;
        this.subscription = null;
        this._updateSubscriptionUI();
        showNotification('Push notifications disabled', 'info');
        console.log('User is unsubscribed.');
        // TODO: Kirim notifikasi ke server untuk menghapus subscription
      }
    } catch (error)
    {
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