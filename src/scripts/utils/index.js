// src/scripts/utils/index.js
export function showFormattedDate(date, locale = 'en-US', options = {}) {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  });
}

export function sleep(time = 1000) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

export function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : '#2196F3'};
    color: white;
    border-radius: 4px;
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

export function validateForm(formData) {
  const errors = {};

  if (!formData.description?.trim()) {
    errors.description = 'Description is required';
  }

  if (!formData.photo) {
    errors.photo = 'Photo is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// Skip to content functionality
export function initSkipToContent() {
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.className = 'skip-link';
  skipLink.textContent = 'Skip to content';
  skipLink.style.cssText = `
    position: absolute;
    top: -40px;
    left: 6px;
    background: #000;
    color: white;
    padding: 8px;
    text-decoration: none;
    z-index: 10000;
    transition: top 0.3s;
  `;

  skipLink.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(e.target.getAttribute('href'));
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus();
      setTimeout(() => target.removeAttribute('tabindex'), 1000);
    }
  });

  skipLink.addEventListener('focus', () => {
    skipLink.style.top = '6px';
  });

  skipLink.addEventListener('blur', () => {
    skipLink.style.top = '-40px';
  });

  document.body.insertBefore(skipLink, document.body.firstChild);
}