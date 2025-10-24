// CSS imports
import '../styles/styles.css';

import App from './pages/app.js';

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
