// src/scripts/pages/app.js
import routes from '../routes/routes.js';
import { getActiveRoute } from '../routes/url-parser.js';
import { initSkipToContent } from '../utils/index.js';

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;
  #currentPage = null;
  #previousRoute = null;
  #currentRoute = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    this._setupDrawer();
    initSkipToContent();
  }

  _setupDrawer() {
    this.#drawerButton.addEventListener('click', () => {
      const isOpen = this.#navigationDrawer.classList.contains('open');
      this.#navigationDrawer.classList.toggle('open');
      this.#drawerButton.setAttribute('aria-expanded', !isOpen);
    });

    document.body.addEventListener('click', (event) => {
      if (!this.#navigationDrawer.contains(event.target) && !this.#drawerButton.contains(event.target)) {
        this.#navigationDrawer.classList.remove('open');
        this.#drawerButton.setAttribute('aria-expanded', 'false');
      }

      this.#navigationDrawer.querySelectorAll('a').forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove('open');
          this.#drawerButton.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  _getTransitionDirection(previousRoute, currentRoute) {
    const routesOrder = ['/', '/auth', '/add-story', '/about'];
    const prevIndex = routesOrder.indexOf(previousRoute);
    const currIndex = routesOrder.indexOf(currentRoute);
    
    if (prevIndex < currIndex) {
      return 'slide-left'; // Forward navigation
    } else if (prevIndex > currIndex) {
      return 'slide-right'; // Backward navigation
    }
    return 'fade'; // Same page or unknown
  }

  async _performViewTransition(updateCallback, transitionType = 'fade') {
    // Check if View Transition API is supported
    if (!document.startViewTransition) {
      await updateCallback();
      return;
    }

    // Add transition class to document
    document.documentElement.classList.add(transitionType);

    // Start view transition
    const transition = document.startViewTransition(async () => {
      await updateCallback();
    });

    await transition.finished;
    
    // Remove transition class
    document.documentElement.classList.remove(transitionType);
  }

  async renderPage() {
  try {
    const url = getActiveRoute();
    const page = routes[url];

    if (!page) {
      await this._performViewTransition(() => {
        this.#content.innerHTML = '<h1>Page Not Found</h1>';
      }, 'fade');
      return;
    }

    // Determine transition direction
    const transitionType = this._getTransitionDirection(this.#previousRoute, url);
    this.#previousRoute = this.#currentRoute;
    this.#currentRoute = url;

    await this._performViewTransition(async () => {
      // Add loading state
      this.#content.classList.add('loading');

      // Clear current page safely
      if (this.#currentPage && this.#currentPage.destroy) {
        try {
          await this.#currentPage.destroy();
        } catch (error) {
          console.warn('Error during page destroy:', error);
        }
      }

      // Render new page
      try {
        this.#content.innerHTML = await page.render();
        this.#currentPage = page;
        
        // Wait for DOM to be fully settled before afterRender
        await new Promise(resolve => setTimeout(resolve, 100));
        await page.afterRender();
      } catch (renderError) {
        console.error('Error during page render:', renderError);
        throw renderError;
      }

      // Remove loading state
      this.#content.classList.remove('loading');
    }, transitionType);

  } catch (error) {
    console.error('Error rendering page:', error);
    await this._performViewTransition(() => {
      this.#content.innerHTML = `
        <section class="container">
          <h1>Error Loading Page</h1>
          <p>There was an error loading the page. Please try again.</p>
          <button onclick="window.location.hash = '#/'">Go to Home</button>
        </section>
      `;
    }, 'fade');
  }
}
}

export default App;