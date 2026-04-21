import { GoogleGenAI, Type } from "@google/genai";
import { Novel, Chapter, Character, Scene, NovelMetadata } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function fetchRawBookText(url: string): Promise<string> {
  const res = await fetch(`/api/import/fetch?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error("Failed to fetch book text from server");
  const data = await res.json();
  return data.text;
}

export async function extractNovelMetadata(text: string): Promise<Partial<NovelMetadata>> {
  // Use first 5000 chars for metadata
  const sample = text.substring(0, 5000);
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Extract book info from this Project Gutenberg text summary. Return as JSON.
    Text: ${sample}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          author: { type: Type.STRING },
          year: { type: Type.STRING },
          description: { type: Type.STRING }
        },
        required: ["title", "author"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function extractCharacters(text: string): Promise<Record<string, Character>> {
  // Use first 20000 chars to find characters
  const sample = text.substring(0, 20000);
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Identify the main characters in this book text. 
    For each character, provide a short description and their gender (male/female).
    Provide an ID (slugified name, e.g. "alice").
    Return as an object where keys are IDs.
    
    Text snippet: ${sample}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        additionalProperties: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            gender: { type: Type.STRING, enum: ["male", "female"] }
          },
          required: ["id", "name", "description"]
        }
      }
    }
  });

  const parsed = JSON.parse(response.text || "{}");
  const characters: Record<string, Character> = {};
  
  Object.entries(parsed).forEach(([id, char]: [string, any]) => {
    characters[id] = {
      ...char,
      id,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`
    };
  });

  return characters;
}

export async function splitIntoChapters(text: string): Promise<{ title: string, text: string }[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Look at this book text (start and end snippets) and determine the chapter structure.
    Provide a list of chapter titles and their starting 10 words.
    
    Start: ${text.substring(0, 10000)}
    End: ${text.substring(text.length - 5000)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            startingSnippet: { type: Type.STRING }
          },
          required: ["title", "startingSnippet"]
        }
      }
    }
  });

  const structure = JSON.parse(response.text || "[]");
  const chapters: { title: string, text: string }[] = [];

  for (let i = 0; i < structure.length; i++) {
    const current = structure[i];
    const next = structure[i + 1];
    
    const startIndex = text.indexOf(current.startingSnippet);
    const endIndex = next ? text.indexOf(next.startingSnippet) : text.length;
    
    if (startIndex !== -1) {
      chapters.push({
        title: current.title,
        text: text.substring(startIndex, endIndex).trim()
      });
    }
  }

  return chapters;
}

export async function processChapter(
  chapterTitle: string, 
  chapterId: number, 
  text: string, 
  characters: Record<string, Character>
): Promise<Chapter> {
  const charContext = Object.values(characters).map(c => `${c.id}: ${c.name}`).join(", ");
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Turn this book chapter into a visual novel script.
    Identify scenes (break by location or time jump).
    For each scene, give it a title and a suggested background description.
    Break the text into dialogue lines. Use specific character IDs when someone is speaking. 
    Use "narrator" for narrative text.
    
    Characters available: ${charContext}
    
    Chapter Title: ${chapterTitle}
    Text: ${text.substring(0, 30000)} // Chunk if too large
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                backgroundDescription: { type: Type.STRING },
                dialogue: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      characterId: { type: Type.STRING },
                      text: { type: Type.STRING }
                    },
                    required: ["text"]
                  }
                }
              },
              required: ["title", "backgroundDescription", "dialogue"]
            }
          }
        },
        required: ["scenes"]
      }
    }
  });

  const data = JSON.parse(response.text || "{}");
  
  return {
    id: chapterId,
    title: chapterTitle,
    scenes: data.scenes.map((s: any, idx: number) => ({
      ...s,
      id: `ch${chapterId}-s${idx + 1}`,
      background: "default" // Will be generated or selected later
    }))
  };
}
