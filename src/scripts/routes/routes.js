// src/scripts/routes/routes.js
import HomePage from '../pages/home/home-page.js';
import AboutPage from '../pages/about/about-page.js';
import AddStoryPage from '../pages/add-story/add-story-page.js';
import AuthPage from '../pages/auth/auth-page.js';
import SettingsPage from '../pages/settings/settings-page.js';
import FavoritesPage from '../pages/favorites/favorites-page.js';

const routes = {
  '/': new HomePage(),
  '/about': new AboutPage(),
  '/add-story': new AddStoryPage(),
  '/auth': new AuthPage(),
  '/settings': new SettingsPage(),
  '/favorites': new FavoritesPage(),
};

export default routes;