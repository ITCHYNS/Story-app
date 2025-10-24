// src/scripts/utils/idb-service.js
import { openDB } from 'idb';

class IDBService {
  constructor() {
    this.dbName = 'StoryMapDB';
    this.version = 3;
    this.db = null;
  }

  async init() {
    this.db = await openDB(this.dbName, this.version, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(`Upgrading IDB from version ${oldVersion} to ${newVersion}`);

        // Create object stores
        if (!db.objectStoreNames.contains('offlineStories')) {
          const storyStore = db.createObjectStore('offlineStories', { 
            keyPath: 'id',
            autoIncrement: true 
          });
          storyStore.createIndex('timestamp', 'timestamp');
          storyStore.createIndex('synced', 'synced');
        }

        if (!db.objectStoreNames.contains('favorites')) {
          const favoriteStore = db.createObjectStore('favorites', { 
            keyPath: 'storyId' 
          });
          favoriteStore.createIndex('timestamp', 'timestamp');
        }

        if (!db.objectStoreNames.contains('settings')) {
          const settingsStore = db.createObjectStore('settings', { 
            keyPath: 'key' 
          });
        }

        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { 
            keyPath: 'key' 
          });
          cacheStore.createIndex('timestamp', 'timestamp');
        }
      },
    });
    return this.db;
  }

  // Offline Stories Management
  async saveOfflineStory(story) {
    const db = await this.init();
    const tx = db.transaction('offlineStories', 'readwrite');
    const store = tx.objectStore('offlineStories');
    
    const offlineStory = {
      ...story,
      timestamp: new Date().getTime(),
      synced: false,
      id: story.id || `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    await store.add(offlineStory);
    return offlineStory.id;
  }

  async getOfflineStories() {
    const db = await this.init();
    const tx = db.transaction('offlineStories', 'readonly');
    const store = tx.objectStore('offlineStories');
    return store.getAll();
  }

  async getUnsyncedStories() {
    const db = await this.init();
    const tx = db.transaction('offlineStories', 'readonly');
    const store = tx.objectStore('offlineStories');
    const index = store.index('synced');
    return index.getAll(IDBKeyRange.only(false));
  }

  async markStoryAsSynced(storyId) {
    const db = await this.init();
    const tx = db.transaction('offlineStories', 'readwrite');
    const store = tx.objectStore('offlineStories');
    
    const story = await store.get(storyId);
    if (story) {
      story.synced = true;
      story.syncedAt = new Date().getTime();
      await store.put(story);
    }
  }

  async deleteOfflineStory(storyId) {
    const db = await this.init();
    const tx = db.transaction('offlineStories', 'readwrite');
    const store = tx.objectStore('offlineStories');
    await store.delete(storyId);
  }

  // Favorites Management
  async addToFavorites(story) {
    const db = await this.init();
    const tx = db.transaction('favorites', 'readwrite');
    const store = tx.objectStore('favorites');
    
    const favorite = {
      storyId: story.id,
      story: story,
      timestamp: new Date().getTime()
    };
    
    await store.put(favorite);
  }

  async removeFromFavorites(storyId) {
    const db = await this.init();
    const tx = db.transaction('favorites', 'readwrite');
    const store = tx.objectStore('favorites');
    await store.delete(storyId);
  }

  async getFavorites() {
    const db = await this.init();
    const tx = db.transaction('favorites', 'readonly');
    const store = tx.objectStore('favorites');
    const favorites = await store.getAll();
    return favorites.map(fav => fav.story);
  }

  async isFavorite(storyId) {
    const db = await this.init();
    const tx = db.transaction('favorites', 'readonly');
    const store = tx.objectStore('favorites');
    const favorite = await store.get(storyId);
    return !!favorite;
  }

  // Cache Management
  async setCache(key, data, ttl = 5 * 60 * 1000) { // 5 minutes default
    const db = await this.init();
    const tx = db.transaction('cache', 'readwrite');
    const store = tx.objectStore('cache');
    
    const cacheItem = {
      key,
      data,
      timestamp: new Date().getTime(),
      expires: new Date().getTime() + ttl
    };
    
    await store.put(cacheItem);
  }

  async getCache(key) {
    const db = await this.init();
    const tx = db.transaction('cache', 'readonly');
    const store = tx.objectStore('cache');
    const cacheItem = await store.get(key);
    
    if (cacheItem && cacheItem.expires > new Date().getTime()) {
      return cacheItem.data;
    }
    
    // Remove expired cache
    if (cacheItem) {
      await this.deleteCache(key);
    }
    
    return null;
  }

  async deleteCache(key) {
    const db = await this.init();
    const tx = db.transaction('cache', 'readwrite');
    const store = tx.objectStore('cache');
    await store.delete(key);
  }

  async clearExpiredCache() {
    const db = await this.init();
    const tx = db.transaction('cache', 'readwrite');
    const store = tx.objectStore('cache');
    const index = store.index('timestamp');
    const now = new Date().getTime();
    
    let cursor = await index.openCursor();
    while (cursor) {
      if (cursor.value.expires < now) {
        await cursor.delete();
      }
      cursor = await cursor.continue();
    }
  }

  // Settings Management
  async setSetting(key, value) {
    const db = await this.init();
    const tx = db.transaction('settings', 'readwrite');
    const store = tx.objectStore('settings');
    
    const setting = {
      key,
      value,
      updatedAt: new Date().getTime()
    };
    
    await store.put(setting);
  }

  async getSetting(key, defaultValue = null) {
    const db = await this.init();
    const tx = db.transaction('settings', 'readonly');
    const store = tx.objectStore('settings');
    const setting = await store.get(key);
    return setting ? setting.value : defaultValue;
  }

  // Data Export/Import
  async exportData() {
    const db = await this.init();
    const data = {
      exportedAt: new Date().toISOString(),
      version: this.version,
      offlineStories: await this.getOfflineStories(),
      favorites: await this.getFavorites(),
      settings: {}
    };

    // Get all settings
    const tx = db.transaction('settings', 'readonly');
    const store = tx.objectStore('settings');
    const settings = await store.getAll();
    
    settings.forEach(setting => {
      data.settings[setting.key] = setting.value;
    });

    return data;
  }

  async importData(data) {
    if (!data || data.version !== this.version) {
      throw new Error('Invalid data format or version mismatch');
    }

    const db = await this.init();

    // Import offline stories
    if (data.offlineStories) {
      const tx = db.transaction('offlineStories', 'readwrite');
      const store = tx.objectStore('offlineStories');
      
      for (const story of data.offlineStories) {
        await store.put(story);
      }
    }

    // Import favorites
    if (data.favorites) {
      const tx = db.transaction('favorites', 'readwrite');
      const store = tx.objectStore('favorites');
      
      for (const story of data.favorites) {
        await store.put({
          storyId: story.id,
          story: story,
          timestamp: new Date().getTime()
        });
      }
    }

    // Import settings
    if (data.settings) {
      const tx = db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      
      for (const [key, value] of Object.entries(data.settings)) {
        await store.put({
          key,
          value,
          updatedAt: new Date().getTime()
        });
      }
    }
  }

  // Clear all data
  async clearAllData() {
    const db = await this.init();
    const storeNames = ['offlineStories', 'favorites', 'settings', 'cache'];
    
    for (const storeName of storeNames) {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      await store.clear();
    }
  }
}

export default new IDBService();