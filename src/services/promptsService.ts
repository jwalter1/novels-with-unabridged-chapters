import { db, doc, setDoc, getDoc, handleFirestoreError, OperationType } from '../firebase';

export interface NovelPromptConfig {
  novelId: string;
  stylePrompt: string;
  updatedAt: string;
}

export interface ScenePromptConfig {
  sceneId: string;
  promptOverride: string;
  updatedAt: string;
}

export async function saveNovelPromptConfig(config: NovelPromptConfig): Promise<void> {
  const path = `novelConfigs/${config.novelId}`;
  try {
    await setDoc(doc(db, path), config, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadNovelPromptConfig(novelId: string): Promise<NovelPromptConfig | null> {
  const path = `novelConfigs/${novelId}`;
  try {
    const snap = await getDoc(doc(db, path));
    if (snap.exists()) {
      return snap.data() as NovelPromptConfig;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function loadAllNovelPromptConfigs(novelIds: string[]): Promise<Record<string, string>> {
  const results: Record<string, string> = {};
  await Promise.all(novelIds.map(async (id) => {
    const config = await loadNovelPromptConfig(id);
    if (config) {
      results[id] = config.stylePrompt;
    }
  }));
  return results;
}

export async function saveScenePromptConfig(novelId: string, config: ScenePromptConfig): Promise<void> {
  const path = `novelConfigs/${novelId}/scenes/${config.sceneId}`;
  try {
    await setDoc(doc(db, path), config, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadScenePromptConfig(novelId: string, sceneId: string): Promise<ScenePromptConfig | null> {
  const path = `novelConfigs/${novelId}/scenes/${sceneId}`;
  try {
    const snap = await getDoc(doc(db, path));
    if (snap.exists()) {
      return snap.data() as ScenePromptConfig;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}
