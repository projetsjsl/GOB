
/**
 * Storage Utility for 3p1 Dashboard
 * Handles persistence of large datasets using IndexedDB with fallback to localStorage.
 * 
 * Why IndexedDB? 
 * localStorage is synchronous and limited to ~5MB.
 * IndexedDB is asynchronous and allows GBs of storage, essential for 800+ tickers.
 */

const DB_NAME = '3p1_FinanceDB';
const STORE_NAME = 'profiles';
const DB_VERSION = 1;

interface StorageAdapter {
  getItem: (key: string) => Promise<any | null>;
  setItem: (key: string, value: any) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  clear: () => Promise<void>;
  keys: () => Promise<string[]>;
}

// Low-level IndexedDB wrapper
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB error:', request.error);
      reject(request.error);
    };

    request.onsuccess = (event) => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

export const indexedDBAdapter: StorageAdapter = {
  getItem: async (key: string) => {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.warn('IDB Read Error, falling back to null', e);
      return null;
    }
  },

  setItem: async (key: string, value: any) => {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(value, key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error('IDB Write Error', e);
      throw e;
    }
  },

  removeItem: async (key: string) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  clear: async () => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  
  keys: async () => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAllKeys();

        request.onsuccess = () => resolve(request.result as string[]);
        request.onerror = () => reject(request.error);
    });
  }
};

// LocalStorage Fallback (Sync turned into Async for compatibility)
export const localStorageAdapter: StorageAdapter = {
  getItem: async (key: string) => {
    const val = localStorage.getItem(key);
    try {
        return val ? JSON.parse(val) : null;
    } catch {
        return val;
    }
  },
  setItem: async (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e: any) {
      // Si QuotaExceededError, essayer de nettoyer et réessayer une fois
      if (e?.name === 'QuotaExceededError' || e?.message?.includes('quota')) {
        console.warn(`⚠️ LocalStorage quota exceeded for ${key}, attempting cleanup...`);
        // Nettoyer les anciennes clés de cache si possible
        try {
          const keys = Object.keys(localStorage);
          const oldCacheKeys = keys.filter(k => k.startsWith('cache_') || k.includes('_cache'));
          oldCacheKeys.forEach(k => localStorage.removeItem(k));
          // Réessayer
          localStorage.setItem(key, JSON.stringify(value));
        } catch (retryError) {
          console.error('❌ Failed to save even after cleanup, data too large for localStorage', retryError);
          throw e; // Re-throw original error
        }
      } else {
        throw e;
      }
    }
  },
  removeItem: async (key: string) => {
    localStorage.removeItem(key);
  },
  clear: async () => {
    localStorage.clear();
  },
  keys: async () => {
      return Object.keys(localStorage);
  }
};

// Automatic switch: Use IndexedDB if available, else LocalStorage
export const storage = typeof window !== 'undefined' && window.indexedDB 
  ? indexedDBAdapter 
  : localStorageAdapter;
