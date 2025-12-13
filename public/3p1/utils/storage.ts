
/**
 * Storage Utility for 3p1 Dashboard
 *
 * ⚠️ IMPORTANT (historique bug):
 * - Une partie du code 3p1 écrivait encore dans `localStorage` directement,
 *   tandis que la lecture était faite via IndexedDB (si disponible).
 * - Résultat: la liste de tickers pouvait sembler "disparue" (lecture IDB vide
 *   alors que les données existaient en localStorage).
 *
 * ✅ Solution:
 * - Adapter hybride: lecture IDB → fallback localStorage → migration vers IDB.
 * - Écriture best-effort dans IDB + localStorage (localStorage peut échouer
 *   par quota, mais sert de compatibilité).
 *
 * Why IndexedDB?
 * - localStorage est synchrone et limité (~5MB)
 * - IndexedDB est asynchrone et peut stocker beaucoup plus (utile 800+ tickers)
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
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      const val = window.localStorage.getItem(key);
      try {
        return val ? JSON.parse(val) : null;
      } catch {
        return val;
      }
    } catch (e) {
      // Certains contextes (mode privé / politiques) peuvent bloquer localStorage
      console.warn('localStorage Read Error, returning null', e);
      return null;
    }
  },
  setItem: async (key: string, value: any) => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('localStorage Write Error (quota/blocked)', e);
    }
  },
  removeItem: async (key: string) => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      window.localStorage.removeItem(key);
    } catch (e) {
      console.warn('localStorage Remove Error', e);
    }
  },
  clear: async () => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      window.localStorage.clear();
    } catch (e) {
      console.warn('localStorage Clear Error', e);
    }
  },
  keys: async () => {
      try {
        if (typeof window === 'undefined' || !window.localStorage) return [];
        return Object.keys(window.localStorage);
      } catch (e) {
        console.warn('localStorage Keys Error', e);
        return [];
      }
  }
};

// ============================================
// ADAPTER HYBRIDE: IDB → localStorage → migration
// ============================================
const hasIndexedDB = () => typeof window !== 'undefined' && !!window.indexedDB;

export const storage: StorageAdapter = {
  getItem: async (key: string) => {
    // 1) Essayer IndexedDB si disponible
    if (hasIndexedDB()) {
      const idbVal = await indexedDBAdapter.getItem(key);
      if (idbVal !== null && typeof idbVal !== 'undefined') return idbVal;

      // 2) Fallback sur localStorage (compat/migration)
      const lsVal = await localStorageAdapter.getItem(key);
      if (lsVal !== null && typeof lsVal !== 'undefined') {
        // 3) Migrer best-effort vers IDB pour les prochains chargements
        try {
          await indexedDBAdapter.setItem(key, lsVal);
        } catch (e) {
          console.warn('IDB migration failed (continuing with localStorage value)', e);
        }
        return lsVal;
      }
      return null;
    }

    // Pas d'IndexedDB: utiliser localStorage
    return localStorageAdapter.getItem(key);
  },

  setItem: async (key: string, value: any) => {
    // Best-effort: écrire dans IDB (si dispo) + localStorage (compat)
    if (hasIndexedDB()) {
      try {
        await indexedDBAdapter.setItem(key, value);
      } catch (e) {
        console.warn('IDB Write Error (continuing with localStorage fallback)', e);
      }
    }
    await localStorageAdapter.setItem(key, value);
  },

  removeItem: async (key: string) => {
    if (hasIndexedDB()) {
      try {
        await indexedDBAdapter.removeItem(key);
      } catch (e) {
        console.warn('IDB Remove Error', e);
      }
    }
    await localStorageAdapter.removeItem(key);
  },

  clear: async () => {
    if (hasIndexedDB()) {
      try {
        await indexedDBAdapter.clear();
      } catch (e) {
        console.warn('IDB Clear Error', e);
      }
    }
    await localStorageAdapter.clear();
  },

  keys: async () => {
    const out = new Set<string>();
    if (hasIndexedDB()) {
      try {
        (await indexedDBAdapter.keys()).forEach(k => out.add(k));
      } catch (e) {
        console.warn('IDB Keys Error', e);
      }
    }
    try {
      (await localStorageAdapter.keys()).forEach(k => out.add(k));
    } catch (e) {
      console.warn('localStorage Keys Error', e);
    }
    return Array.from(out);
  }
};
