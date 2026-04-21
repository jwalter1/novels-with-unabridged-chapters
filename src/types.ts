export interface Character {
  id: string;
  name: string;
  color: string;
  image?: string;
  description?: string;
  gender?: 'male' | 'female';
  voiceId?: string;
}

export interface DialogueLine {
  characterId?: string; // If missing, it's narrative text
  text: string;
  style?: string;
}

export interface Scene {
  id: string;
  title: string;
  background: string;
  backgroundDescription?: string;
  precedence?: string;
  dialogue: DialogueLine[];
}

export interface Chapter {
  id: number;
  title: string;
  scenes: Scene[];
}

export type BookVersion = 'abridged' | 'unabridged';

export interface NovelMetadata {
  id: string;
  title: string;
  author: string;
  year: string;
  description: string;
  coverImage: string;
  accentColor: string;
  homepage?: string;
  stylePrompt?: string;
  abridgedEstimate?: string;
  unabridgedEstimate?: string;
  genre?: string;
  allowedVersions?: BookVersion[];
}

export interface Novel {
  metadata: NovelMetadata;
  chapters: Chapter[];
  characters: Record<string, Character>;
  version?: BookVersion;
}
