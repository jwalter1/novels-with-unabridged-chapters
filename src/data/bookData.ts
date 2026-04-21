import { gatsbyData } from './novels/gatsby';
import { pridePrejudiceData } from './novels/pride-prejudice';
import { trialData } from './novels/the-trial';
import { aesopData } from './novels/aesop';
import { animalFarmData } from './novels/animal-farm';
import { aliceData } from './novels/alice-wonderland/index';
import { romeoJulietData } from './novels/romeo-juliet';
import { BookVersion, Novel } from '../types';
import { NOVELS_METADATA as BASE_METADATA } from './novels/metadata';
import { loadImportedNovel } from '../services/novelService';

export async function getNovelData(id: string, version: BookVersion = 'abridged'): Promise<Novel | null> {
  const metadata = BASE_METADATA.find(n => n.id === id);
  
  let baseData: any = null;
  if (metadata) {
    switch (id) {
      case 'great-gatsby':
        baseData = gatsbyData;
        break;
      case 'pride-prejudice':
        baseData = pridePrejudiceData;
        break;
      case 'the-trial':
        baseData = trialData;
        break;
      case 'aesop-fables':
        baseData = aesopData;
        break;
      case 'animal-farm':
        baseData = animalFarmData;
        break;
      case 'alice-wonderland':
        baseData = aliceData;
        break;
      case 'romeo-juliet':
        baseData = romeoJulietData;
        break;
    }
  }

  // If we found static data, use it
  if (baseData) {
    let chapters = baseData.chapters;
    
    // Version specific logic - use the consistent data structure
    if (version === 'abridged' && baseData.abridgedChapters) {
      chapters = baseData.abridgedChapters;
    } else if (version === 'unabridged' && baseData.chapters) {
      chapters = baseData.chapters;
    }

    // Add chapter announcement scene to each chapter if missing
    const injectChapterIntros = (chaps: any[]) => {
      return chaps.map(chapter => {
        const introId = `chapter-${chapter.id}-intro`;
        // Check if already has an intro scene to prevent duplicates
        if (chapter.scenes.length > 0 && chapter.scenes[0].id === introId) {
          return chapter;
        }

        const firstScene = chapter.scenes[0];
        const introScene = {
          id: introId,
          title: `Chapter ${chapter.id}: ${chapter.title}`,
          // Use themed default, first scene's background, or library fallback
          background: firstScene?.background || 'library',
          dialogue: [
            {
              text: `Chapter ${chapter.id}\n\n${chapter.title}`,
              // characterId is omitted to trigger centered narrator style in App.tsx
            }
          ]
        };

        return {
          ...chapter,
          scenes: [introScene, ...chapter.scenes]
        };
      });
    };

    const finalChapters = injectChapterIntros(chapters);

    return {
      metadata,
      chapters: finalChapters,
      characters: baseData.characters as any,
      version
    };
  }

  // Otherwise, check imported novels
  try {
    const imported = await loadImportedNovel(id);
    if (imported) {
      // Also inject intros for imported novels
      const injectChapterIntros = (chaps: any[]) => {
        return chaps.map(chapter => {
          const introId = `chapter-${chapter.id}-intro`;
          if (chapter.scenes.length > 0 && chapter.scenes[0].id === introId) return chapter;
          
          return {
            ...chapter,
            scenes: [
              {
                id: introId,
                title: `Chapter ${chapter.id}: ${chapter.title}`,
                background: chapter.scenes[0]?.background || 'library',
                dialogue: [{ text: `Chapter ${chapter.id}\n\n${chapter.title}` }]
              },
              ...chapter.scenes
            ]
          };
        });
      };
      
      return {
        ...imported,
        chapters: injectChapterIntros(imported.chapters)
      };
    }
  } catch (error) {
    console.warn("Failed to load imported novel:", error);
  }

  if (!metadata) return null;

  // Placeholder for other novels (or if static data was missing)
  console.warn(`Returning placeholder for: ${id}. Ensure static data is properly linked.`);
  return {
    metadata,
    version,
    chapters: [
      {
        id: 1,
        title: 'Coming Soon',
        scenes: [
          {
            id: 'ch1-s1',
            title: 'Under Construction',
            background: 'https://picsum.photos/seed/library/1920/1080',
            dialogue: [
              { text: `This is the beginning of ${metadata.title} by ${metadata.author}.` },
              { text: `The full visual novel experience for "${metadata.title}" (ID: ${id}) is coming soon!` }
            ]
          }
        ]
      }
    ],
    characters: {}
  };
}

export { BASE_METADATA as NOVELS_METADATA };
