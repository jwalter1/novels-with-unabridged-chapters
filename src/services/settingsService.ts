import { db, doc, setDoc, getDoc, handleFirestoreError, OperationType } from '../firebase';

export interface UserSettings {
  novelId: string;
  readingSpeed: number;
  isAudioEnabled: boolean;
  isAutoAdvance: boolean;
  autoAdvanceDelay: number;
  voiceOverrides: Record<string, string>;
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
  const path = `users/${uid}/settings/${novelId}`;
  try {
    await setDoc(doc(db, path), {
      ...settings,
      uid,
      novelId,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadSettingsFromCloud(uid: string, novelId: string): Promise<UserSettings | null> {
  const path = `users/${uid}/settings/${novelId}`;
  try {
    const docRef = doc(db, path);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserSettings;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
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
