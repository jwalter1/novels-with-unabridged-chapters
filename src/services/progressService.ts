import { db, doc, setDoc, getDoc, handleFirestoreError, OperationType } from '../firebase';
import { NOVELS_METADATA } from '../data/novels/metadata';

export interface ProgressData {
  sceneProgress: Record<string, number>; // key: "chapterIndex:sceneIndex", value: maxDialogueIndexReached
  lastPosition?: {
    chapterIndex: number;
    sceneIndex: number;
    dialogueIndex: number;
  };
  updatedAt?: string;
}

const PROGRESS_PREFIX = 'novel_progress_v3_';

function getNovelKey(novelId: string, version?: string) {
  return `${PROGRESS_PREFIX}${novelId}${version ? `_${version}` : ''}`;
}

export function getProgress(novelId: string, version?: string): ProgressData {
  const saved = localStorage.getItem(getNovelKey(novelId, version));
  if (!saved) return { sceneProgress: {} };
  try {
    return JSON.parse(saved);
  } catch (e) {
    return { sceneProgress: {} };
  }
}

export function updateProgress(novelId: string, chapterIndex: number, sceneIndex: number, dialogueIndex: number, uid?: string, version?: string) {
  const progress = getProgress(novelId, version);
  const key = `${chapterIndex}:${sceneIndex}`;
  const currentMax = progress.sceneProgress[key] ?? -1;
  
  let changed = false;
  if (dialogueIndex > currentMax) {
    progress.sceneProgress[key] = dialogueIndex;
    changed = true;
  }
  
  // Always update last position and timestamp
  progress.lastPosition = { chapterIndex, sceneIndex, dialogueIndex };
  progress.updatedAt = new Date().toISOString();
  changed = true;

  if (changed) {
    localStorage.setItem(getNovelKey(novelId, version), JSON.stringify(progress));
    if (uid) {
      syncProgressToCloud(uid, novelId, progress, version);
    }
  }
}

export async function syncProgressToCloud(uid: string, novelId: string, progress: ProgressData, version?: string) {
  const novelKey = novelId + (version ? `_${version}` : '');
  const path = `users/${uid}/progress/${novelKey}`;
  try {
    await setDoc(doc(db, path), {
      ...progress,
      uid,
      novelId,
      version: version || 'abridged',
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadProgressFromCloud(uid: string, novelId: string, version?: string): Promise<ProgressData | null> {
  const novelKey = novelId + (version ? `_${version}` : '');
  const path = `users/${uid}/progress/${novelKey}`;
  try {
    const docRef = doc(db, path);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const cloudProgress = docSnap.data() as ProgressData;
      // Merge with local progress (take max dialogue index for each scene)
      const localProgress = getProgress(novelId, version);
      const mergedProgress: ProgressData = {
        sceneProgress: { ...localProgress.sceneProgress },
        lastPosition: cloudProgress.lastPosition || localProgress.lastPosition,
        updatedAt: cloudProgress.updatedAt || localProgress.updatedAt
      };
      
      Object.entries(cloudProgress.sceneProgress).forEach(([key, val]) => {
        mergedProgress.sceneProgress[key] = Math.max(mergedProgress.sceneProgress[key] || 0, val);
      });
      
      localStorage.setItem(getNovelKey(novelId, version), JSON.stringify(mergedProgress));
      return mergedProgress;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
  return null;
}

export function getSceneCompletion(novelId: string, chapterIndex: number, sceneIndex: number, totalDialogue: number, version?: string): number {
  const progress = getProgress(novelId, version);
  const key = `${chapterIndex}:${sceneIndex}`;
  const maxReached = progress.sceneProgress[key];
  if (maxReached === undefined) return 0;
  // If they reached the last index, it's 100%
  if (maxReached >= totalDialogue - 1) return 100;
  return Math.round(((maxReached + 1) / totalDialogue) * 100);
}

export function getChapterCompletion(novelId: string, chapterIndex: number, chapters: any[], version?: string): number {
  const chapter = chapters[chapterIndex];
  if (!chapter) return 0;
  
  let totalScenes = chapter.scenes.length;
  let totalCompletion = 0;
  
  chapter.scenes.forEach((scene: any, idx: number) => {
    totalCompletion += getSceneCompletion(novelId, chapterIndex, idx, scene.dialogue.length, version);
  });
  
  return Math.round(totalCompletion / totalScenes);
}

export function getBookCompletion(novelId: string, chapters: any[], version?: string): number {
  let totalChapters = chapters.length;
  let totalCompletion = 0;
  
  chapters.forEach((_, idx) => {
    totalCompletion += getChapterCompletion(novelId, idx, chapters, version);
  });
  
  return Math.round(totalCompletion / totalChapters);
}

export function resetProgress(novelId: string, uid?: string, version?: string) {
  const emptyProgress: ProgressData = { sceneProgress: {} };
  localStorage.setItem(getNovelKey(novelId, version), JSON.stringify(emptyProgress));
  if (uid) {
    syncProgressToCloud(uid, novelId, emptyProgress, version);
  }
}

export function getTotalPagesRead(): number {
  let total = 0;
  
  // We should only count progress for books that actually exist in our metadata
  // to stay in sync with the Reading Odyssey archive
  NOVELS_METADATA.forEach(metadata => {
    ['abridged', 'unabridged'].forEach(version => {
      const progress = getProgress(metadata.id, version);
      if (progress && progress.sceneProgress) {
        Object.values(progress.sceneProgress).forEach(maxIndex => {
          total += (maxIndex + 1);
        });
      }
    });
  });
  
  return total;
}

export function resetAllProgress(uid?: string) {
  // Clear all known metadata progress
  NOVELS_METADATA.forEach(metadata => {
    ['abridged', 'unabridged'].forEach(version => {
      resetProgress(metadata.id, uid, version);
    });
  });
  
  // Also scan for any orphan keys with our prefix and clear them
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(PROGRESS_PREFIX)) {
      localStorage.removeItem(key);
      i--; // Adjust index after removal
    }
  }
}
