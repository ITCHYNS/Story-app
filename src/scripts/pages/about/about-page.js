// src/scripts/pages/about/about-page.js
export default class AboutPage {
  async render() {
    return `
      <section class="container about-page">
        <h1 class="page-title">About Story Map</h1>
        
        <div class="about-content">
          <div class="about-section">
            <h2>What is Story Map?</h2>
            <p>
              Story Map is a web application that allows you to share your stories 
              and experiences with specific locations on the map. Connect your memories 
              with places and explore stories from around the world.
            </p>
          </div>

          <div class="about-section">
            <h2>Features</h2>
            <ul class="features-list">
              <li>📖 Share your stories with photos</li>
              <li>📍 Mark locations on interactive maps</li>
              <li>🔍 Explore stories from other users</li>
              <li>📱 Responsive design for all devices</li>
              <li>🎯 Accessible to everyone</li>
            </ul>
          </div>

          <div class="about-section">
            <h2>Technology</h2>
            <p>
              Built with modern web technologies including:
            </p>
            <ul class="tech-list">
              <li>Single Page Application (SPA) Architecture</li>
              <li>Leaflet for interactive maps</li>
              <li>Story API for data management</li>
              <li>Webpack for module bundling</li>
              <li>Progressive Web App capabilities</li>
            </ul>
          </div>

          <div class="about-section">
            <h2>How to Use</h2>
            <ol class="usage-steps">
              <li>Register or login to your account</li>
              <li>View stories from other users on the home page</li>
              <li>Click "Share Story" to add your own story</li>
              <li>Add a photo and description</li>
              <li>Click on the map to set your story location</li>
              <li>Share your story with the community!</li>
            </ol>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Wait for DOM to be fully ready
    await new Promise(resolve => setTimeout(resolve, 50));
    console.log('About page loaded successfully');
  }

  destroy() {
    // Cleanup if needed
    console.log('About page destroyed');
  }
}