// src/scripts/index.js - MODIFIED
// CSS imports
import '../styles/styles.css';

import App from './pages/app.js';

// <-- TAMBAHKAN BLOK INI UNTUK MENDAFTARKAN SERVICE WORKER
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.bundle.js')
      .then(registration => {
        console.log('Service Worker registered:', registration);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}
// --> BLOK PENDAFTARAN SELESAI

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
  });
  await app.renderPage();

  window.addEventListener('hashchange', async () => {
    await app.renderPage();
  });
});

// src/scripts/utils/index.js
// ... (Kode utilitas Anda yang lain tetap di sini)
export function isViewTransitionSupported() {
  return Boolean(document.startViewTransition);
}

export function getTransitionFallback() {
  if (!isViewTransitionSupported()) {
    console.log('View Transition API not supported, using CSS fallback');
    return 'css-fallback';
  }
  return 'view-transition';
}