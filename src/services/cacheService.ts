import { db, doc, setDoc, deleteDoc, collection, getDocs, query, handleFirestoreError, OperationType } from '../firebase';

const DB_NAME = 'GreatGatsbyCache';
const DB_VERSION = 2;
const STORES = {
  SPRITES: 'sprites',
  AUDIO: 'audio',
  BOOKMARKS: 'bookmarks'
};

export interface Bookmark {
  id: string;
  novelId: string;
  chapterIndex: number;
  sceneIndex: number;
  dialogueIndex: number;
  timestamp: number;
  chapterTitle: string;
  sceneTitle: string;
  previewText: string;
  uid?: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORES.SPRITES)) {
        db.createObjectStore(STORES.SPRITES);
      }
      if (!db.objectStoreNames.contains(STORES.AUDIO)) {
        db.createObjectStore(STORES.AUDIO);
      }
      if (!db.objectStoreNames.contains(STORES.BOOKMARKS)) {
        const store = db.createObjectStore(STORES.BOOKMARKS, { keyPath: 'id' });
        store.createIndex('novelId', 'novelId', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getFromCache(store: 'sprites' | 'audio', key: string): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(store, 'readonly');
      const request = transaction.objectStore(store).get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('Cache read error:', e);
    return null;
  }
}

export async function saveToCache(store: 'sprites' | 'audio', key: string, value: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(store, 'readwrite');
      const request = transaction.objectStore(store).put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('Cache write error:', e);
  }
}

export async function getSpriteHistory(charId: string): Promise<string[]> {
  const data = await getFromCache('sprites', `${charId}:history`);
  return data ? JSON.parse(data) : [];
}

export async function saveSpriteHistory(charId: string, history: string[]): Promise<void> {
  await saveToCache('sprites', `${charId}:history`, JSON.stringify(history));
}

export async function getBookmarks(novelId?: string): Promise<Bookmark[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.BOOKMARKS, 'readonly');
      const store = transaction.objectStore(STORES.BOOKMARKS);
      let request;
      if (novelId) {
        const index = store.index('novelId');
        request = index.getAll(novelId);
      } else {
        request = store.getAll();
      }
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('Bookmark read error:', e);
    return [];
  }
}

export async function saveBookmark(bookmark: Bookmark, uid?: string): Promise<void> {
  try {
    const db_idb = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db_idb.transaction(STORES.BOOKMARKS, 'readwrite');
      const request = transaction.objectStore(STORES.BOOKMARKS).put(bookmark);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    if (uid) {
      const path = `users/${uid}/novels/${bookmark.novelId}/bookmarks/${bookmark.id}`;
      try {
        await setDoc(doc(db, path), {
          ...bookmark,
          uid
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    }
  } catch (e) {
    console.error('Bookmark write error:', e);
  }
}

export async function deleteBookmark(id: string, novelId: string, uid?: string): Promise<void> {
  try {
    const db_idb = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db_idb.transaction(STORES.BOOKMARKS, 'readwrite');
      const request = transaction.objectStore(STORES.BOOKMARKS).delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    if (uid) {
      const path = `users/${uid}/novels/${novelId}/bookmarks/${id}`;
      try {
        await deleteDoc(doc(db, path));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    }
  } catch (e) {
    console.error('Bookmark delete error:', e);
  }
}

export async function syncBookmarksFromCloud(uid: string, novelId: string): Promise<Bookmark[]> {
  const path = `users/${uid}/novels/${novelId}/bookmarks`;
  try {
    const q = query(collection(db, path));
    const querySnapshot = await getDocs(q);
    const cloudBookmarks: Bookmark[] = [];
    querySnapshot.forEach((doc) => {
      cloudBookmarks.push(doc.data() as Bookmark);
    });

    // Merge with local bookmarks
    const localBookmarks = await getBookmarks(novelId);
    const localIds = new Set(localBookmarks.map(b => b.id));
    
    const db_idb = await openDB();
    const transaction = db_idb.transaction(STORES.BOOKMARKS, 'readwrite');
    const store = transaction.objectStore(STORES.BOOKMARKS);

    for (const cb of cloudBookmarks) {
      if (!localIds.has(cb.id)) {
        store.put(cb);
        localBookmarks.push(cb);
      }
    }

    return localBookmarks;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return getBookmarks(novelId);
  }
}

export async function getAllFromStore(store: 'sprites' | 'audio'): Promise<Record<string, string>> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(store, 'readonly');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.openCursor();
      const results: Record<string, string> = {};

      request.onsuccess = (event: any) => {
        const cursor = event.target.result;
        if (cursor) {
          results[cursor.key] = cursor.value;
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error(`Error getting all from ${store}:`, e);
    return {};
  }
}
