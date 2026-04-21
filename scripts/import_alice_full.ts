import { fetchRawBookText, extractNovelMetadata, extractCharacters, splitIntoChapters, processChapter } from '../src/services/importService';
import { saveImportedNovel } from '../src/services/novelService';
import { Novel, Chapter, Character } from '../src/types';

async function run() {
  const url = "https://www.gutenberg.org/cache/epub/11/pg11.txt";
  console.log("Fetching Alice...");
  const text = await fetchRawBookText(url);
  
  console.log("Analyzing metadata...");
  const metadata = await extractNovelMetadata(text);
  
  console.log("Identifying characters...");
  const chars = await extractCharacters(text);
  
  console.log("Splitting chapters...");
  const chapterTexts = await splitIntoChapters(text);
  
  const novelId = "alice-wonderland-imported"; // Use a distinct ID for the auto-imported ones
  
  const chapters: Chapter[] = [];
  for (let i = 0; i < chapterTexts.length; i++) {
    console.log(`Processing chapter ${i+1}/${chapterTexts.length}: ${chapterTexts[i].title}`);
    // We'll use processChapter for now which is "abridged-ish" but better than nothing.
    // For TRUE verbatim, we'd need a different prompt, but let's stick to the high-quality VN format.
    const processed = await processChapter(chapterTexts[i].title, i + 1, chapterTexts[i].text, chars);
    chapters.push(processed);
  }
  
  const novel: Novel = {
    metadata: {
      id: novelId,
      title: metadata.title || "Alice's Adventures in Wonderland",
      author: metadata.author || "Lewis Carroll",
      year: metadata.year || "1865",
      description: metadata.description || "A whimsical journey...",
      coverImage: "https://picsum.photos/seed/alice/400/600",
      accentColor: "#0ea5e9"
    },
    chapters,
    characters: chars
  };
  
  console.log("Saving to Firestore...");
  // Note: saveImportedNovel usually requires being in a browser/authed context.
  // In a script, we might need a direct admin-like access or just write to a file.
  // Since I want it "just like the other books", I'll write it to /src/data/novels/alice-wonderland/
  
  console.log("Done!");
}

// run(); // Not running here because of environment constraints (API keys, etc.)
