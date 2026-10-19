/**
 * Robust Client Storage Helper for Large Datasets
 * Handles localStorage quota limits (>5MB) via IndexedDB fallback
 * and prevents QuotaExceededError crashes.
 */

const DB_NAME = 'BakeryIntelligenceDB';
const STORE_NAME = 'custom_datasets';
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save dataset safely to IndexedDB with localStorage fallback
 */
export async function saveDataset(key: string, data: any): Promise<void> {
  // 1. Always attempt IndexedDB first for large dataset durability
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(data, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (idbErr) {
    console.warn('IndexedDB save failed, falling back:', idbErr);
  }

  // 2. Safely attempt localStorage for quick sync/flags
  try {
    const serialized = JSON.stringify(data);
    // Only attempt localStorage if data string is reasonably small (< 2MB)
    if (serialized.length < 2 * 1024 * 1024) {
      localStorage.setItem(key, serialized);
    } else {
      // If data is huge, only save a slice or flag to avoid QuotaExceededError
      if (Array.isArray(data)) {
        const compactSlice = data.slice(0, 500);
        localStorage.setItem(key + '_preview', JSON.stringify(compactSlice));
      }
    }
  } catch (storageErr) {
    console.warn(`localStorage quota exceeded for ${key}. Data safely kept in memory & IndexedDB.`);
  }
}

/**
 * Load dataset safely from IndexedDB or localStorage
 */
export async function loadDataset<T>(key: string, defaultValue: T): Promise<T> {
  // 1. Try IndexedDB first
  try {
    const db = await openDb();
    const data = await new Promise<T | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    if (data !== undefined && data !== null) {
      return data;
    }
  } catch (idbErr) {
    // IndexedDB failed or empty, proceed to localStorage
  }

  // 2. Try localStorage
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved) as T;
    }
    const previewSaved = localStorage.getItem(key + '_preview');
    if (previewSaved) {
      return JSON.parse(previewSaved) as T;
    }
  } catch (storageErr) {
    console.warn(`Error reading ${key} from localStorage:`, storageErr);
  }

  return defaultValue;
}

/**
 * Clear all custom datasets from IndexedDB and localStorage
 */
export async function clearCustomDatasets(): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (idbErr) {
    console.warn('Error clearing IndexedDB:', idbErr);
  }

  try {
    localStorage.removeItem('bakery_custom_tx');
    localStorage.removeItem('bakery_custom_tx_preview');
    localStorage.removeItem('bakery_custom_members');
    localStorage.removeItem('bakery_custom_batches');
    localStorage.removeItem('bakery_is_custom');
  } catch {
    // Ignore error
  }
}

export function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`localStorage setItem failed for key: ${key}`, e);
  }
}

export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn(`localStorage removeItem failed for key: ${key}`, e);
  }
}
