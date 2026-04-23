import { NOVELS_METADATA } from '../data/novels/metadata';
import { getNovelData } from '../data/bookData';

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
  const key = `users/${uid}/progress/${novelKey}.json`;
  try {
    // If progress is empty, delete the document to ensure a true clean state across browsers
    if (Object.keys(progress.sceneProgress).length === 0) {
      await fetch('/api/s3/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      });
      return;
    }

    // Otherwise, overwrite entirely without merge so deletions/resets propagate
    const jsonStr = JSON.stringify({
      ...progress,
      uid,
      novelId,
      version: version || 'abridged',
      updatedAt: new Date().toISOString()
    });
    const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
    
    await fetch('/api/s3/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key,
        base64Data: base64,
        contentType: 'application/json'
      })
    });
  } catch (error) {
    console.error(`Failed to sync progress for ${novelKey}:`, error);
  }
}

export async function loadProgressFromCloud(uid: string, novelId: string, version?: string): Promise<ProgressData | null> {
  const novelKey = novelId + (version ? `_${version}` : '');
  const key = `users/${uid}/progress/${novelKey}.json`;
  try {
    const res = await fetch(`/api/s3/get?key=${encodeURIComponent(key)}`);
    if (res.ok) {
      const cloudProgress = await res.json() as ProgressData;
      
      // We directly overwrite the local cache with the cloud truth
      // to prevent "undeletable" progress that keeps coming back from local maxing
      localStorage.setItem(getNovelKey(novelId, version), JSON.stringify(cloudProgress));
      return cloudProgress;
    } else {
      // If the document does not exist gracefully clear the local cache 
      // this enables resetting progress from one browser to be reflected in another
      const emptyProgress: ProgressData = { sceneProgress: {} };
      localStorage.setItem(getNovelKey(novelId, version), JSON.stringify(emptyProgress));
      return emptyProgress;
    }
  } catch (error) {
    console.error(`Failed to load progress for ${novelKey}:`, error);
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

export async function syncAllProgressFromCloud(uid: string, allMetadata: any[]) {
  try {
    const promises: Promise<any>[] = [];
    allMetadata.forEach(metadata => {
      ['abridged', 'unabridged'].forEach(version => {
        promises.push(loadProgressFromCloud(uid, metadata.id, version));
      });
    });
    await Promise.all(promises);
  } catch (error) {
    console.error("Failed to batch sync progress from cloud:", error);
  }
}

export async function getTotalPagesRead(): Promise<number> {
  let total = 0;
  
  // We strictly iterate through the actual chapters/scenes to bypass orphaned progress keys
  for (const metadata of NOVELS_METADATA) {
    for (const version of ['abridged', 'unabridged']) {
      const progress = getProgress(metadata.id, version);
      if (progress && progress.sceneProgress && Object.keys(progress.sceneProgress).length > 0) {
        try {
          const novelData = await getNovelData(metadata.id, version as any);
          if (novelData) {
            novelData.chapters.forEach((chapter, chIdx) => {
              chapter.scenes.forEach((scene, scIdx) => {
                const key = `${chIdx}:${scIdx}`;
                const maxDialogue = progress.sceneProgress[key];
                if (maxDialogue !== undefined) {
                  total += (maxDialogue + 1);
                }
              });
            });
          }
        } catch (e) {
          console.error(`Failed to load novel data for pages count: ${metadata.id}`, e);
        }
      }
    }
  }
  
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
