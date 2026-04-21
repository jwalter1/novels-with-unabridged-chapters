import { db, doc, setDoc, getDoc, handleFirestoreError, OperationType } from '../firebase';

export interface NovelVoiceConfig {
  novelId: string;
  voiceMappings: Record<string, string>; // characterId -> elevenLabsVoiceId
  updatedAt: string;
}

export async function saveNovelVoiceConfig(config: NovelVoiceConfig): Promise<void> {
  const path = `novelVoiceConfigs/${config.novelId}`;
  try {
    await setDoc(doc(db, path), config, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadNovelVoiceConfig(novelId: string): Promise<NovelVoiceConfig | null> {
  const path = `novelVoiceConfigs/${novelId}`;
  try {
    const snap = await getDoc(doc(db, path));
    if (snap.exists()) {
      return snap.data() as NovelVoiceConfig;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}
