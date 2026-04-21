import { db, doc, setDoc, getDoc, handleFirestoreError, OperationType, collection, getDocs, query } from '../firebase';
import { Novel } from '../types';

export async function saveImportedNovel(novel: Novel): Promise<void> {
  const path = `imported_novels/${novel.metadata.id}`;
  try {
    // We might need to split chapters into separate documents if they are too large for a single Firestore doc (1MB limit)
    // However, for now, we'll try saving the whole thing.
    // Novel metadata and characters are usually small. Chapters are the big ones.
    
    // Better strategy: Save metadata separately, and chapters as a subcollection.
    await setDoc(doc(db, `imported_novels/${novel.metadata.id}`), {
      metadata: novel.metadata,
      characters: novel.characters,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // Save each chapter
    for (const chapter of novel.chapters) {
      const chapterPath = `imported_novels/${novel.metadata.id}/chapters/${chapter.id}`;
      await setDoc(doc(db, chapterPath), chapter);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadImportedNovel(novelId: string): Promise<Novel | null> {
  const path = `imported_novels/${novelId}`;
  try {
    const snap = await getDoc(doc(db, path));
    if (!snap.exists()) return null;

    const mainData = snap.data();
    
    // Load chapters
    const chaptersSnap = await getDocs(query(collection(db, `${path}/chapters`)));
    const chapters = chaptersSnap.docs.map(d => d.data() as any).sort((a, b) => a.id - b.id);

    return {
      metadata: mainData.metadata,
      characters: mainData.characters,
      chapters
    };
  } catch (error) {
    console.error("Failed to load imported novel:", error);
    return null;
  }
}

export async function listImportedNovels(): Promise<any[]> {
  try {
    const snap = await getDocs(query(collection(db, 'imported_novels')));
    return snap.docs.map(d => d.data());
  } catch (error) {
    console.error("Failed to list imported novels:", error);
    return [];
  }
}
