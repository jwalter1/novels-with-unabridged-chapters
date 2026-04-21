import { db, doc, setDoc, getDoc, collection, getDocs, handleFirestoreError, OperationType, deleteDoc } from '../firebase';

export interface UserSettings {
  novelId: string;
  readingSpeed: number;
  isAudioEnabled: boolean;
  isAutoAdvance: boolean;
  autoAdvanceDelay: number;
  voiceOverrides: Record<string, string>;
  voiceIdOverrides?: Record<string, string>;
  sceneBackgroundOverrides?: Record<string, string>;
  sceneImageOverrides?: Record<string, string>;
  pageImageOverrides?: Record<string, string>;
  backgroundOverrides?: Record<string, string>;
  spriteOverrides?: Record<string, string>;
  uid?: string;
  updatedAt?: string;
}

export interface GlobalSettings {
  pinnedNovelIds: string[];
  updatedAt?: string;
}

export async function syncSettingsToCloud(uid: string, novelId: string, settings: UserSettings) {
  const basePath = `users/${uid}/settings/${novelId}`;
  
  // 1. Separate large override maps from basic settings
  const { 
    voiceOverrides, 
    voiceIdOverrides, 
    sceneBackgroundOverrides, 
    sceneImageOverrides, 
    pageImageOverrides, 
    backgroundOverrides, 
    spriteOverrides,
    ...basicSettings 
  } = settings;

  const overrides: Record<string, Record<string, string> | undefined> = {
    voiceOverrides,
    voiceIdOverrides,
    sceneBackgroundOverrides,
    sceneImageOverrides,
    pageImageOverrides,
    backgroundOverrides,
    spriteOverrides
  };

  // 2. Save basic settings to the main document (without overrides to keep it small)
  // We use merge: false to ensure any legacy large fields are removed from the root document
  try {
    await setDoc(doc(db, basePath), {
      ...basicSettings,
      uid,
      novelId,
      updatedAt: new Date().toISOString()
    });

    // Helper to sanitize data - strictly forbid base64 in Firestore
    const sanitize = (data: Record<string, string> | undefined) => {
      if (!data) return undefined;
      const sanitized: Record<string, string> = {};
      Object.entries(data).forEach(([key, value]) => {
        // Only keep small strings (URLs). Discard anything that looks like base64 or is too large.
        if (value && !value.startsWith('data:') && value.length < 2000) {
          sanitized[key] = value;
        }
      });
      return Object.keys(sanitized).length > 0 ? sanitized : undefined;
    };

    // 3. Save each override map entry to its own document in a sub-collection
    const sanitizedOverrides: Record<string, Record<string, string> | undefined> = {
      voiceOverrides: sanitize(voiceOverrides),
      voiceIdOverrides: sanitize(voiceIdOverrides),
      sceneBackgroundOverrides: sanitize(sceneBackgroundOverrides),
      sceneImageOverrides: sanitize(sceneImageOverrides),
      pageImageOverrides: sanitize(pageImageOverrides),
      backgroundOverrides: sanitize(backgroundOverrides),
      spriteOverrides: sanitize(spriteOverrides)
    };

    const overridePromises = Object.entries(sanitizedOverrides).map(async ([type, data]) => {
      if (data && Object.keys(data).length > 0) {
        // We delete the old aggregate document if it exists to avoid confusion and size issues
        try {
          await deleteDoc(doc(db, `${basePath}/overrides/${type}`));
        } catch (e) {
          // Ignore deletion errors
        }

        const entriesPath = `${basePath}/overrides/${type}/entries`;
        
        // Save entries in chunks or individually
        // For performance, we only update what's changed if we had a better way, 
        // but here we ensure they are saved.
        // NOTE: In a high-frequency scenario, we'd use hashing or only sync diffs.
        // Given current App.tsx behavior, we sync the whole state.
        const entries = Object.entries(data);
        const entryChunks = [];
        const chunkSize = 20; // Parallel batch size
        
        for (let i = 0; i < entries.length; i += chunkSize) {
          entryChunks.push(entries.slice(i, i + chunkSize));
        }

        for (const chunk of entryChunks) {
          await Promise.all(chunk.map(async ([itemId, value]) => {
            // Document IDs must be valid (no slashes)
            const safeId = itemId.replace(/\//g, '_');
            await setDoc(doc(db, `${entriesPath}/${safeId}`), {
              id: itemId,
              value,
              updatedAt: new Date().toISOString()
            });
          }));
        }
      }
    });

    await Promise.all(overridePromises);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, basePath);
  }
}

export async function loadSettingsFromCloud(uid: string, novelId: string): Promise<UserSettings | null> {
  const basePath = `users/${uid}/settings/${novelId}`;
  try {
    const mainDocSnap = await getDoc(doc(db, basePath));
    if (!mainDocSnap.exists()) return null;

    const data = mainDocSnap.data() as any;
    const settings: UserSettings = { ...data };

    // Load overrides from sub-documents/collections
    const overrideTypes = [
      'voiceOverrides', 
      'voiceIdOverrides', 
      'sceneBackgroundOverrides', 
      'sceneImageOverrides', 
      'pageImageOverrides', 
      'backgroundOverrides', 
      'spriteOverrides'
    ];

    const overrideResults = await Promise.all(
      overrideTypes.map(async (type) => {
        // 1. Try new collection structure first
        const entriesRef = collection(db, `${basePath}/overrides/${type}/entries`);
        const entriesSnap = await getDocs(entriesRef);
        
        if (!entriesSnap.empty) {
          const map: Record<string, string> = {};
          entriesSnap.forEach(d => {
            const entry = d.data();
            map[entry.id || d.id] = entry.value;
          });
          return { type, data: map };
        }

        // 2. Fallback to old aggregate document structure
        const snap = await getDoc(doc(db, `${basePath}/overrides/${type}`));
        return { type, data: snap.exists() ? snap.data().data : null };
      })
    );

    overrideResults.forEach(({ type, data }) => {
      if (data) {
        (settings as any)[type] = data;
      }
    });

    return settings;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, basePath);
  }
  return null;
}

export async function syncGlobalSettingsToCloud(uid: string, settings: GlobalSettings) {
  const path = `users/${uid}/settings/global`;
  try {
    await setDoc(doc(db, path), {
      ...settings,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadGlobalSettingsFromCloud(uid: string): Promise<GlobalSettings | null> {
  const path = `users/${uid}/settings/global`;
  try {
    const docRef = doc(db, path);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as GlobalSettings;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
  return null;
}
