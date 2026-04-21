import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Loader2, Sparkles, CheckCircle, AlertCircle, Trash2, Image as ImageIcon, Plus, RefreshCw, Upload, Terminal, Save, X, Users, Mic, BookOpen, Download } from 'lucide-react';
import { generateImage, uploadToS3, uploadMetadata, getS3Metadata, checkS3Exists, listS3Objects, deleteS3Object } from '../services/imageService';
import { saveNovelPromptConfig, loadNovelPromptConfig, saveScenePromptConfig, loadScenePromptConfig } from '../services/promptsService';
import { saveNovelVoiceConfig, loadNovelVoiceConfig } from '../services/voiceService';
import { clearVoiceConfigCache, generateSpeech, playAudio, ELEVENLABS_VOICES } from '../services/ttsService';
import { fetchRawBookText, extractNovelMetadata, extractCharacters, splitIntoChapters, processChapter } from '../services/importService';
import { saveImportedNovel } from '../services/novelService';
import { NOVEL_THEMES } from '../data/thematicBackgrounds';
import { NOVELS_METADATA } from '../data/bookData';
import { getNovelData } from '../data/bookData';
import { auth, User } from '../firebase';
import { Novel, Scene, NovelMetadata, Chapter } from '../types';

type Tab = 'generate' | 'browse' | 'prompts' | 'sprites' | 'voices' | 'import';

interface AdminPanelProps {
  novels?: NovelMetadata[];
  user: User | null;
}

export function AdminPanel({ novels = NOVELS_METADATA, user }: AdminPanelProps) {
  const isAdmin = user?.email === 'jwalter1@gmail.com';

  const [activeTab, setActiveTab] = useState<Tab>('generate');
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<{key: string, status: 'pending' | 'success' | 'error' | 'skipped', message?: string}[]>([]);
  const [novelId, setNovelId] = useState('animal-farm');
  
  const [assets, setAssets] = useState<{key: string, url: string}[]>([]);
  const [sprites, setSprites] = useState<{key: string, url: string}[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isFetchingSprites, setIsFetchingSprites] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [regeneratingKeys, setRegeneratingKeys] = useState<Record<string, boolean>>({});
  const [isGeneratingSprites, setIsGeneratingSprites] = useState(false);
  const [spriteResults, setSpriteResults] = useState<{key: string, status: 'pending' | 'success' | 'error' | 'skipped', message?: string}[]>([]);
  const [assetVersion, setAssetVersion] = useState(Date.now());

  // Prompt Management
  const [promptScope, setPromptScope] = useState<'global' | 'scene'>('global');
  const [selectedSceneId, setSelectedSceneId] = useState("");
  const [novelData, setNovelData] = useState<Novel | null>(null);

  // Voice Management
  const [voiceMappings, setVoiceMappings] = useState<Record<string, string>>({});
  const [isSavingVoices, setIsSavingVoices] = useState(false);
  const [isFetchingVoices, setIsFetchingVoices] = useState(false);
  const [isTestingVoice, setIsTestingVoice] = useState<Record<string, boolean>>({});

  // Import State
  const [importUrl, setImportUrl] = useState('');
  const [importStatus, setImportStatus] = useState<'idle' | 'fetching' | 'analyzing' | 'splitting' | 'processing' | 'finished' | 'error'>('idle');
  const [importLog, setImportLog] = useState<string[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importedNovel, setImportedNovel] = useState<Novel | null>(null);
  
  // Metadata view
  const [selectedAssetMetadata, setSelectedAssetMetadata] = useState<any | null>(null);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [metadataViewKey, setMetadataViewKey] = useState<string | null>(null);

  const addImportLog = (msg: string) => setImportLog(prev => [...prev.slice(-100), `${new Date().toLocaleTimeString()} - ${msg}`]);

  const [currentPrompt, setCurrentPrompt] = useState("");
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [isFetchingPrompt, setIsFetchingPrompt] = useState(false);

  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const selectedSceneData = useMemo(() => {
    if (promptScope !== 'scene' || !novelData) return null;
    for (const chapter of novelData.chapters) {
      const scene = chapter.scenes.find(s => s.id === selectedSceneId);
      if (scene) return { ...scene, chapterTitle: chapter.title };
    }
    return null;
  }, [novelData, selectedSceneId, promptScope]);

  const activeBackgroundUrl = useMemo(() => {
    if (!selectedSceneData) return null;
    
    // Check for scene-specific overrides in S3 first
    const override = assets.find(a => a.key.includes(`/scenes/${selectedSceneData.id}_`));
    if (override) return override.url;

    // If the background already looks like a processed S3 URL or external URL, use it
    if (selectedSceneData.background.includes('/api/s3/') || selectedSceneData.background.startsWith('http')) {
      return selectedSceneData.background;
    }

    // Otherwise, handle it as a category key and look for fallbacks
    const category = selectedSceneData.background.split('/').pop()?.replace('.png', '') || selectedSceneData.background;
    
    // Check manual S3 fallbacks
    const fallback = assets.find(a => a.key === `backgrounds/fallbacks/${novelId}/${category}.png`);
    if (fallback) return fallback.url;

    // Check static theme mapping
    const theme = NOVEL_THEMES[novelId];
    if (theme && theme[category]) return theme[category];

    return null;
  }, [selectedSceneData, assets, novelId]);

  const getAssetLabel = useCallback((key: string) => {
    if (key.includes('/scenes/')) {
      const sceneId = key.split('/').pop()?.split('_')[0];
      if (sceneId && novelData) {
        for (const chapter of novelData.chapters) {
          const scene = chapter.scenes.find(s => s.id === sceneId);
          if (scene) return scene.title;
        }
      }
    }
    
    if (key.includes('/fallbacks/')) {
      const filename = key.split('/').pop()?.replace('.png', '') || "";
      return filename.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    if (key.includes('/manual/')) {
       return "Manual Upload";
    }

    return key.split('/').pop() || "Asset";
  }, [novelData]);

  const fetchSprites = useCallback(async () => {
    setIsFetchingSprites(true);
    try {
      const items = await listS3Objects(`novels/${novelId}/sprites/`);
      // Filter only PNG images and exclude history JSONs
      const filteredItems = items.filter(item => 
        item.key.toLowerCase().endsWith('.png') && !item.key.includes('_history')
      );
      setSprites(filteredItems);
    } catch (error) {
      console.error("Failed to fetch sprites:", error);
    } finally {
      setIsFetchingSprites(false);
    }
  }, [novelId]);

  const fetchAssets = useCallback(async () => {
    setIsFetching(true);
    try {
      const items = await listS3Objects(`novels/${novelId}/`);
      const fallbackItems = await listS3Objects(`backgrounds/fallbacks/${novelId}/`);
      
      // Filter out non-image assets and exclude sprites (which have their own tab)
      const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
      const filteredItems = [...items, ...fallbackItems].filter(item => 
        imageExtensions.some(ext => item.key.toLowerCase().endsWith(ext)) && 
        !item.key.includes('/sprites/')
      );
      
      setAssets(filteredItems);
      setAssetVersion(Date.now());
    } catch (error) {
      console.error("Failed to fetch assets:", error);
    } finally {
      setIsFetching(false);
    }
  }, [novelId]);

  useEffect(() => {
    if (activeTab === 'browse') {
      fetchAssets();
    }
    if (activeTab === 'sprites') {
      fetchSprites();
    }
    if (activeTab === 'prompts') {
      fetchPrompt();
    }
    if (activeTab === 'voices') {
      fetchVoices();
    }
  }, [activeTab, fetchAssets, novelId, promptScope, selectedSceneId]);

  useEffect(() => {
    const loadData = async () => {
      const data = await getNovelData(novelId);
      setNovelData(data);
      if (data?.chapters?.[0]?.scenes?.[0]) {
        setSelectedSceneId(data.chapters[0].scenes[0].id);
      }
    };
    loadData();
  }, [novelId]);

  const fetchPrompt = async () => {
    setIsFetchingPrompt(true);
    try {
      if (promptScope === 'global') {
        const config = await loadNovelPromptConfig(novelId);
        if (config) {
          setCurrentPrompt(config.stylePrompt);
        } else {
          const metadata = novels.find(n => n.id === novelId);
          setCurrentPrompt(metadata?.stylePrompt || "");
        }
      } else {
        if (selectedSceneId) {
          const config = await loadScenePromptConfig(novelId, selectedSceneId);
          setCurrentPrompt(config?.promptOverride || "");
        }
      }
    } catch (error) {
      console.error("Failed to fetch prompt:", error);
    } finally {
      setIsFetchingPrompt(false);
    }
  };

  const fetchVoices = async () => {
    setIsFetchingVoices(true);
    try {
      const config = await loadNovelVoiceConfig(novelId);
      const savedMappings = config?.voiceMappings || {};
      
      // Seed with hardcoded defaults if nothing is saved yet
      const mergedMappings = { ...savedMappings };
      
      if (novelData) {
        Object.keys(novelData.characters).forEach(charId => {
          if (!mergedMappings[charId] && ELEVENLABS_VOICES[charId]) {
            mergedMappings[charId] = ELEVENLABS_VOICES[charId];
          }
        });
        if (!mergedMappings["narrator"] && ELEVENLABS_VOICES["narrator"]) {
          mergedMappings["narrator"] = ELEVENLABS_VOICES["narrator"];
        }
      }

      setVoiceMappings(mergedMappings);
    } catch (error) {
      console.error("Failed to fetch voices:", error);
    } finally {
      setIsFetchingVoices(false);
    }
  };

  const handleSaveVoices = async () => {
    setIsSavingVoices(true);
    try {
      await saveNovelVoiceConfig({
        novelId,
        voiceMappings,
        updatedAt: new Date().toISOString()
      });
      clearVoiceConfigCache(novelId);
      alert("Voice mappings saved successfully");
    } catch (error) {
      alert("Failed to save voice mappings");
    } finally {
      setIsSavingVoices(false);
    }
  };

  const handleTestVoice = async (charId: string, charName: string, gender?: 'male' | 'female') => {
    const voiceId = voiceMappings[charId] || ELEVENLABS_VOICES[charId];
    if (!voiceId) {
       alert("No voice ID assigned yet. Please assign one first.");
       return;
    }

    setIsTestingVoice(prev => ({ ...prev, [charId]: true }));
    try {
      const sampleText = `Hello, I am ${charName}. This is a test of my assigned voice ID.`;
      
      // We need to bypass the cache to ensure we're testing the NEW voice ID if it changed
      // But generateSpeech uses the cache. 
      // Actually, we can use the voiceOverride to bypass the character mapping if we want
      // But here we WANT to test the character mapping.
      // So we clear the cache for this novel first if we're feeling aggressive
      clearVoiceConfigCache(novelId);
      
      const base64 = await generateSpeech(sampleText, charId, 'ElevenLabs', true, novelId, gender, voiceId);
      if (base64) {
        await playAudio(base64);
      } else {
        alert("Failed to generate test audio. Check console for errors.");
      }
    } catch (error: any) {
       console.error("Voice test failed:", error);
       if (error.message?.includes('ELEVENLABS_AUTH_ERROR')) {
         alert(`ElevenLabs Authentication Failed:\n\n${error.message.split(': ')[1]}\n\nPlease update your API key in the Secrets panel.`);
       } else if (error.message?.includes('ELEVENLABS_QUOTA_ERROR')) {
         alert(`ElevenLabs Quota Exceeded:\n\n${error.message.split(': ')[1]}\n\nPlease check your ElevenLabs subscription or try again later.`);
       } else {
         alert("Voice test failed. Check console for details.");
       }
    } finally {
      setIsTestingVoice(prev => ({ ...prev, [charId]: false }));
    }
  };

  const handleSavePrompt = async () => {
    setIsSavingPrompt(true);
    try {
      if (promptScope === 'global') {
        await saveNovelPromptConfig({
          novelId,
          stylePrompt: currentPrompt,
          updatedAt: new Date().toISOString()
        });
      } else {
        await saveScenePromptConfig(novelId, {
          sceneId: selectedSceneId,
          promptOverride: currentPrompt,
          updatedAt: new Date().toISOString()
        });
      }
      alert("Prompt saved successfully");
    } catch (error) {
      alert("Failed to save prompt");
    } finally {
      setIsSavingPrompt(false);
    }
  };

  const handleRegenerateAsset = async (assetKey: string) => {
    setRegeneratingKeys(prev => ({ ...prev, [assetKey]: true }));
    try {
      const metadata = novels.find(n => n.id === novelId);
      
      // Attempt to identify scene ID from key if it's a scene override
      let stylePrompt = "";
      let identifiedSceneId = "";
      
      if (assetKey.includes('/scenes/')) {
        identifiedSceneId = assetKey.split('/').pop()?.split('_')[0] || "";
      }

      const sceneConfig = identifiedSceneId ? await loadScenePromptConfig(novelId, identifiedSceneId) : null;
      const novelConfig = await loadNovelPromptConfig(novelId);
      
      stylePrompt = sceneConfig?.promptOverride || novelConfig?.stylePrompt || metadata?.stylePrompt || "High quality, detailed, cinematic lighting.";
      
      const novelTitle = metadata?.title || "Novel";

      let prompt = "";
      
      // Attempt to derive prompt from key
      if (assetKey.includes('/fallbacks/')) {
        const parts = assetKey.split('/');
        const filename = parts[parts.length - 1].replace('.png', '').replace(/_/g, ' ');
        prompt = `A cinematic empty background scene (no characters) from ${novelTitle}: ${filename}. ${stylePrompt}`;
      } else {
        // For custom/manual ones, use filename as hint
        const filename = assetKey.split('/').pop()?.split('_').pop()?.replace('.png', '').replace(/_/g, ' ') || "a background scene";
        prompt = `A cinematic empty background scene (no characters) from ${novelTitle}: ${filename}. ${stylePrompt}`;
      }

      console.log(`Regenerating ${assetKey} with prompt:`, prompt);
      const base64 = await generateImage(prompt);
      await uploadToS3(assetKey, base64);
      
      // Save prompt metadata
      try {
        const metaKey = assetKey.replace('.png', '.json');
        await uploadMetadata(metaKey, { prompt, generatedAt: new Date().toISOString(), novelId });
      } catch (e) {
        console.warn("Failed to save prompt metadata:", e);
      }
      
      // Force refresh the image in the UI by appending a cache buster or re-fetching
      await fetchAssets();
    } catch (error) {
      console.error("Regeneration failed:", error);
      alert("Failed to regenerate asset");
    } finally {
      setRegeneratingKeys(prev => ({ ...prev, [assetKey]: false }));
    }
  };

  const handleGenerateFallbacks = async () => {
    const theme = NOVEL_THEMES[novelId];
    if (!theme) return;

    const keys = Object.keys(theme);
    const metadata = novels.find(n => n.id === novelId);
    
    // Fallbacks use the Novel Global prompt
    const config = await loadNovelPromptConfig(novelId);
    const stylePrompt = config?.stylePrompt || metadata?.stylePrompt || "High quality, detailed, cinematic lighting.";
    
    const novelTitle = metadata?.title || "Animal Farm";

    setIsGenerating(true);
    const initialResults = keys.map(k => ({ key: k, status: 'pending' as const }));
    setResults(initialResults);

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const s3Path = `backgrounds/fallbacks/${novelId}/${key}.png`;

      try {
        const { exists } = await checkS3Exists(s3Path);
        if (exists) {
          setResults(prev => prev.map(r => r.key === key ? { ...r, status: 'skipped' } : r));
          continue;
        }
      } catch (error) {
        console.warn(`Existence check failed for ${key}`);
      }

      let retries = 3;
      let delay = 2000;
      let success = false;

      while (retries > 0 && !success) {
        try {
          const prompt = `A cinematic empty background scene (no characters) from ${novelTitle}: ${key.replace(/_/g, ' ')}. ${stylePrompt}`;
          const base64 = await generateImage(prompt);
          await uploadToS3(s3Path, base64);
          
          // Save prompt metadata
          try {
            const metaKey = s3Path.replace('.png', '.json');
            await uploadMetadata(metaKey, { prompt, generatedAt: new Date().toISOString(), novelId });
          } catch (e) {
            console.warn("Failed to save fallback prompt metadata:", e);
          }

          setResults(prev => prev.map(r => r.key === key ? { ...r, status: 'success' } : r));
          success = true;
        } catch (error: any) {
          if (error.status === 429 || error.message?.includes('quota')) {
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
            retries--;
          } else {
            setResults(prev => prev.map(r => r.key === key ? { ...r, status: 'error', message: error.message } : r));
            break;
          }
        }
      }

      if (!success && retries === 0) {
        setResults(prev => prev.map(r => r.key === key ? { ...r, status: 'error', message: 'Maximum retries exceeded (Quota)' } : r));
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    setIsGenerating(false);
    if (activeTab === 'browse') fetchAssets();
  };

  const handleDeleteAsset = async (key: string) => {
    if (!confirm(`Are you sure you want to delete this asset?`)) return;
    try {
      console.log(`Deleting asset and associated metadata: ${key}`);
      await deleteS3Object(key);
      
      // Also attempt to delete metadata if it's a PNG
      if (key.endsWith('.png')) {
        const metaKey = key.replace('.png', '.json');
        try {
          await deleteS3Object(metaKey);
        } catch (e) {
          // Metadata might not exist, ignore
        }
      }

      setAssets(prev => prev.filter(a => a.key !== key));
      setSprites(prev => prev.filter(a => a.key !== key));
      
      // Refresh version to clear caches
      setAssetVersion(prev => prev + 1);
    } catch (error: any) {
      console.error("Failed to delete asset:", error);
      alert(`Failed to delete asset: ${error.message || 'Unknown error'}`);
    }
  };

  const handleViewMetadata = async (assetKey: string) => {
    const metaKey = assetKey.replace('.png', '.json');
    setIsFetchingMetadata(true);
    setMetadataViewKey(assetKey);
    try {
      const data = await getS3Metadata(metaKey);
      setSelectedAssetMetadata(data);
    } catch (error) {
      console.warn("No metadata found for this asset");
      setSelectedAssetMetadata(null);
    } finally {
      setIsFetchingMetadata(false);
    }
  };

  const handleGenerateAllSprites = async () => {
    if (!novelData) return;
    
    const metadata = novels.find(n => n.id === novelId);
    if (!metadata) return;
    const config = await loadNovelPromptConfig(novelId);
    const bookStyle = config?.stylePrompt || metadata?.stylePrompt || 'Detailed line art style, period-accurate clothing, neutral background.';
    
    const characters = Object.entries(novelData.characters);
    setIsGeneratingSprites(true);
    const initialResults = characters.map(([id, char]) => ({ key: id, status: 'pending' as const }));
    setSpriteResults(initialResults);

    for (let i = 0; i < characters.length; i++) {
      const [charId, char]: [string, any] = characters[i];
      const s3Path = `novels/${novelId}/sprites/${charId}.png`;

      try {
        const { exists } = await checkS3Exists(s3Path);
        if (exists) {
          setSpriteResults(prev => prev.map(r => r.key === charId ? { ...r, status: 'skipped' } : r));
          continue;
        }
      } catch (error) {
        console.warn(`Existence check failed for ${charId}`);
      }

      let prompt = `A high-quality illustration of ${char.name} from the novel "${novelData.metadata.title}", ${char.description || ''} ${bookStyle} Neutral background.`;
      
      // Special cases from App.tsx
      if (charId === "gatsby") {
        prompt = `A high-quality 1920s Jazz Age illustration of Jay Gatsby, a fabulously wealthy young man with a charismatic smile, wearing an elegant suit, Roaring Twenties style, ${bookStyle} Neutral background.`;
      } else if (charId === "nick") {
        prompt = `A high-quality 1920s Jazz Age illustration of Nick Carraway, a young man with a reserved and observant expression, wearing a modest brown suit, Roaring Twenties style, ${bookStyle} Neutral background.`;
      } else if (charId === "daisy") {
        prompt = `A high-quality 1920s Jazz Age illustration of Daisy Buchanan, a beautiful socialite with a delicate face, wearing a white flapper dress and pearls, Roaring Twenties style, ${bookStyle} Neutral background.`;
      }

      let retries = 3;
      let delay = 2000;
      let success = false;

      while (retries > 0 && !success) {
        try {
          const base64 = await generateImage(prompt, { aspectRatio: "3:4" });
          await uploadToS3(s3Path, base64);

          // Save prompt metadata
          try {
            const metaKey = s3Path.replace('.png', '.json');
            await uploadMetadata(metaKey, { prompt, generatedAt: new Date().toISOString(), novelId, charId });
          } catch (e) {
            console.warn("Failed to save sprite prompt metadata:", e);
          }

          setSpriteResults(prev => prev.map(r => r.key === charId ? { ...r, status: 'success' } : r));
          success = true;
        } catch (error: any) {
          if (error.status === 429 || error.message?.includes('quota')) {
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
            retries--;
          } else {
            setSpriteResults(prev => prev.map(r => r.key === charId ? { ...r, status: 'error', message: error.message } : r));
            break;
          }
        }
      }

      if (!success && retries === 0) {
        setSpriteResults(prev => prev.map(r => r.key === charId ? { ...r, status: 'error', message: 'Maximum retries exceeded (Quota)' } : r));
      }
      // Small delay between generations to avoid hitting rate limits too fast
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    setIsGeneratingSprites(false);
    fetchSprites();
  };

  const handleImportBook = async () => {
    if (!importUrl) return;
    setImportStatus('fetching');
    setImportLog([]);
    setImportProgress(0);
    addImportLog(`Starting import from: ${importUrl}`);

    try {
      // 1. Fetch
      addImportLog("Fetching raw text from Project Gutenberg...");
      const text = await fetchRawBookText(importUrl);
      addImportLog(`Successfully fetched ${text.length.toLocaleString()} characters.`);
      setImportProgress(10);

      // 2. Analyze Metadata
      setImportStatus('analyzing');
      addImportLog("Extracting metadata (Title, Author, etc.)...");
      const meta = await extractNovelMetadata(text);
      const novelId = (meta.title || 'imported').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      addImportLog(`Identified: "${meta.title}" by ${meta.author}`);
      setImportProgress(20);

      // 3. Extract Characters
      addImportLog("Identifying characters and descriptions...");
      const characters = await extractCharacters(text);
      addImportLog(`Found ${Object.keys(characters).length} characters.`);
      setImportProgress(30);

      // 4. Split Chapters
      setImportStatus('splitting');
      addImportLog("Dividing text into chapters...");
      const chapterTexts = await splitIntoChapters(text);
      addImportLog(`Found ${chapterTexts.length} chapters.`);
      setImportProgress(40);

      // 5. Process Chapters
      setImportStatus('processing');
      const processedChapters: Chapter[] = [];
      for (let i = 0; i < chapterTexts.length; i++) {
        const c = chapterTexts[i];
        addImportLog(`Processing ${c.title} (${i + 1}/${chapterTexts.length})...`);
        const processed = await processChapter(c.title, i + 1, c.text, characters);
        processedChapters.push(processed);
        setImportProgress(40 + Math.floor(((i + 1) / chapterTexts.length) * 50));
      }

      // 6. Build and Save
      addImportLog("Finalizing novel structure and saving to database...");
      const finalNovel: Novel = {
        metadata: {
          id: novelId,
          title: meta.title || "Untitled",
          author: meta.author || "Unknown",
          year: meta.year || "Unknown",
          description: meta.description || "",
          coverImage: `https://picsum.photos/seed/${novelId}/400/600`,
          accentColor: `#${Math.floor(Math.random()*16777215).toString(16)}`,
          homepage: importUrl
        },
        characters,
        chapters: processedChapters
      };

      await saveImportedNovel(finalNovel);
      setImportedNovel(finalNovel);
      setImportStatus('finished');
      setImportProgress(100);
      addImportLog("Import complete! You can now view this book in the library.");
    } catch (error: any) {
      console.error(error);
      setImportStatus('error');
      addImportLog(`ERROR: ${error.message}`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'background' | 'sprite' = 'background') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        let s3Path = "";
        if (type === 'background') {
          s3Path = `novels/${novelId}/manual/${Date.now()}_${file.name}`;
        } else {
          // For sprites, try to identify character name from filename if possible, or use a manual prefix
          const charName = file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
          s3Path = `novels/${novelId}/sprites/${charName}.png`;
        }
        await uploadToS3(s3Path, base64);
        if (type === 'background') fetchAssets();
        else fetchSprites();
      };
      reader.readAsDataURL(file);
    } catch (error) {
      alert("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  if (!isAdmin) {
    return (
      <Card className="bg-white border-[#d4c5b0] shadow-2xl max-w-4xl mx-auto my-10 min-h-[400px] flex flex-col items-center justify-center p-12 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-serif font-bold mb-4">Unauthorized Access</h2>
        <p className="text-gray-600 mb-8 max-w-md">
          You do not have permission to access the Asset Generation Admin panel. 
          Please log in as an administrator to manage novel assets, characters, and settings.
        </p>
        <Button 
          variant="outline" 
          className="rounded-full px-8 h-10 border-[#8b7355] text-[#8b7355] hover:bg-[#8b7355] hover:text-white"
          onClick={() => window.location.reload()}
        >
          Return to Library
        </Button>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-[#d4c5b0] shadow-2xl max-w-4xl mx-auto my-10 min-h-[600px] flex flex-col overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex border-b border-[#d4c5b0] bg-[#f5f0e5] overflow-x-auto custom-scrollbar">
        {[
          { id: 'generate', label: 'Assets', icon: Sparkles },
          { id: 'browse', label: 'Backgrounds', icon: ImageIcon },
          { id: 'sprites', label: 'Sprites', icon: Users },
          { id: 'voices', label: 'Voices', icon: Mic },
          { id: 'import', label: 'Import', icon: BookOpen },
          { id: 'prompts', label: 'Prompts', icon: Terminal },
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id as Tab)}
            className={cn(
              "flex-1 min-w-[100px] p-4 font-serif text-[10px] font-bold tracking-widest uppercase transition-colors flex flex-col items-center gap-1",
              activeTab === item.id ? 'bg-white border-b-2 border-[#8b7355] text-[#2c241a]' : 'text-[#8b7355] hover:bg-[#ebe5d9]'
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </div>

      <div className="p-8 flex-1 flex flex-col">
        {/* novel selector shared */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold font-serif text-[#2c241a] flex items-center gap-2">
              {activeTab === 'generate' ? <Sparkles className="w-6 h-6 text-amber-500" /> : activeTab === 'browse' ? <ImageIcon className="w-6 h-6 text-blue-500" /> : activeTab === 'sprites' ? <Users className="w-6 h-6 text-green-600" /> : activeTab === 'voices' ? <Mic className="w-6 h-6 text-red-500" /> : activeTab === 'import' ? <BookOpen className="w-6 h-6 text-[#8b7355]" /> : <Terminal className="w-6 h-6 text-purple-500" />}
              {activeTab === 'generate' ? 'Asset Generation' : activeTab === 'browse' ? 'Background Management' : activeTab === 'sprites' ? 'Character Sprites' : activeTab === 'voices' ? 'Voice assignments' : activeTab === 'import' ? 'Import New Book' : 'AI Prompt Settings'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {activeTab === 'import' ? 'Extract book from Project Gutenberg' : `Configuring assets for novel`}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <select 
              value={novelId} 
              onChange={(e) => setNovelId(e.target.value)}
              className="p-2 border border-[#d4c5b0] rounded bg-white text-sm font-bold outline-none ring-[#8b7355] focus:ring-1"
            >
              {novels.map(n => (
                <option key={n.id} value={n.id}>{n.title}</option>
              ))}
            </select>
            {(activeTab === 'browse' || activeTab === 'sprites') && (
              <Button onClick={activeTab === 'browse' ? fetchAssets : fetchSprites} variant="outline" size="icon" className="h-9 w-9 border-[#d4c5b0]">
                <RefreshCw className={`w-4 h-4 ${(isFetching || isFetchingSprites) ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </div>

        {activeTab === 'generate' ? (
          <div className="space-y-6">
            <div className="bg-[#fdfbf7] border border-[#f5e8d3] p-6 rounded-lg">
              <h3 className="text-lg font-serif font-bold mb-2">Populate Fallback Assets</h3>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                This process will generate AI-driven thematic background fallbacks for every scene key defined in the novel's theme. 
                Existing assets will be skipped to conserve quota.
              </p>
              <Button 
                onClick={handleGenerateFallbacks}
                disabled={isGenerating}
                className="w-full h-12 bg-[#8b7355] hover:bg-[#7a654a] text-white font-bold tracking-widest uppercase text-xs"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Run Batch Generation
              </Button>
            </div>

            {results.length > 0 && (
              <div className="flex-1 overflow-hidden flex flex-col bg-white border border-[#d4c5b0] rounded-none">
                <div className="px-4 py-2 bg-[#f5f0e5] border-b border-[#d4c5b0] text-[10px] font-bold uppercase tracking-widest text-[#8b7355]">
                  Generation Status Log
                </div>
                <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar font-mono text-[11px]">
                  {results.map((res) => (
                    <div key={res.key} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                      <span className="text-gray-600 truncate mr-4">{res.key}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        {res.status === 'pending' && <span className="text-blue-500 animate-pulse">GENERATING...</span>}
                        {res.status === 'success' && <span className="text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> UPLOADED</span>}
                        {res.status === 'skipped' && <span className="text-[#8b7355] flex items-center gap-1 opacity-60"><ImageIcon className="w-3 h-3" /> SKIPPED (EXISTS)</span>}
                        {res.status === 'error' && <span className="text-red-500" title={res.message}>ERROR: {res.message?.substring(0, 20)}...</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'browse' ? (
          <div className="flex-1 flex flex-col space-y-6 overflow-hidden">
            <div className="flex items-center justify-between bg-white border border-[#d4c5b0] p-4">
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-widest text-[#8b7355]">Upload Asset</span>
                <span className="text-sm text-gray-500 italic">Manually add specific backgrounds</span>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="file" 
                  id="asset-upload" 
                  className="hidden" 
                  onChange={handleFileUpload}
                  accept="image/png,image/jpeg"
                />
                <label 
                  htmlFor="asset-upload"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "border-[#8b7355] text-[#8b7355] hover:bg-[#8b7355] hover:text-white rounded-none cursor-pointer h-10 px-6",
                    isUploading && "opacity-50 pointer-events-none"
                  )}
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                  Upload Image
                </label>
              </div>
            </div>

            <div className="flex-1 bg-[#fdfbf7] border border-[#d4c5b0] overflow-hidden flex flex-col min-h-0">
              <div className="px-4 py-3 bg-[#f5f0e5] border-b border-[#d4c5b0] flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#8b7355]">
                  Stored Assets ({assets.length})
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {isFetching ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p className="text-sm italic">Loading cloud assets...</p>
                  </div>
                ) : assets.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                    <ImageIcon className="w-12 h-12 mb-2" />
                    <p className="text-sm italic">No custom assets found for this novel.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {assets.map((asset) => (
                      <div key={asset.key} className="group relative aspect-video bg-gray-100 border border-[#d4c5b0] overflow-hidden cursor-pointer" onClick={() => setLightboxImage(`${asset.url}&t=${assetVersion}`)}>
                        <img 
                          src={`${asset.url}&t=${assetVersion}`} 
                          alt={asset.key} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center pointer-events-none">
                          <p className="text-[10px] text-white font-mono break-all mb-2">{asset.key.split('/').pop()}</p>
                        </div>
                        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                          {asset.key.includes('fallbacks') && (
                            <div className="px-1.5 py-0.5 bg-[#8b7355] text-white text-[8px] font-bold uppercase tracking-tighter">
                              Fallback
                            </div>
                          ) || (
                            <div className="px-1.5 py-0.5 bg-blue-600 text-white text-[8px] font-bold uppercase tracking-tighter">
                              Custom
                            </div>
                          )}
                          <div className="px-1.5 py-0.5 bg-black/60 text-white text-[8px] font-bold uppercase tracking-widest max-w-[120px] truncate">
                            {getAssetLabel(asset.key)}
                          </div>
                        </div>
                        <div className="absolute bottom-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleViewMetadata(asset.key); }}
                            className="bg-blue-500 text-white p-1.5 hover:bg-blue-600 shadow-lg"
                            title="View AI Prompt"
                          >
                            <Terminal className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleRegenerateAsset(asset.key)}
                            disabled={regeneratingKeys[asset.key]}
                            className="bg-[#8b7355] text-white p-1.5 hover:bg-[#7a654a] shadow-lg disabled:opacity-50"
                            title="Regenerate"
                          >
                            <RefreshCw className={cn("w-3.5 h-3.5", regeneratingKeys[asset.key] && "animate-spin")} />
                          </button>
                          <button 
                            onClick={() => handleDeleteAsset(asset.key)}
                            className="bg-red-600 text-white p-1.5 hover:bg-red-700 shadow-lg"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === 'voices' ? (
          <div className="flex-1 flex flex-col space-y-6 overflow-hidden">
            <div className={`bg-[#fdfbf7] border border-[#d4c5b0] p-6 rounded-lg flex-1 flex flex-col min-h-0`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-serif font-bold">Character Voice Assignments</h3>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-gray-500 uppercase font-mono bg-gray-100 px-2 py-1 rounded">
                    Novel ID: {novelId}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {isFetchingVoices ? (
                  <div className="flex items-center justify-center p-12">
                     <Loader2 className="w-8 h-8 animate-spin text-[#8b7355]" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-4">
                      {/* Narrator is special */}
                      <div className="p-4 bg-white border border-[#d4c5b0] rounded flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-bold uppercase tracking-widest text-[#8b7355] block mb-1">Narrator</label>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 text-[10px] text-blue-600 hover:text-blue-700"
                              onClick={() => handleTestVoice("narrator", "the Narrator")}
                              disabled={isTestingVoice["narrator"]}
                            >
                              {isTestingVoice["narrator"] ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Mic className="w-3 h-3 mr-1" />}
                              Test Voice
                            </Button>
                          </div>
                          <p className="text-[10px] text-gray-500 mb-2">The default voice for non-dialogue text</p>
                          <input 
                            type="text"
                            value={voiceMappings["narrator"] || ""}
                            onChange={(e) => setVoiceMappings(prev => ({ ...prev, "narrator": e.target.value }))}
                            placeholder="ElevenLabs Voice ID (e.g. VzzQxirNxoUBjt9JX9x1)"
                            className="w-full p-2 border border-[#d4c5b0] rounded bg-white font-mono text-sm outline-none focus:ring-1 focus:ring-[#8b7355]"
                          />
                        </div>
                      </div>

                      {/* Character List */}
                      {novelData && Object.entries(novelData.characters).map(([id, char]: [string, any]) => (
                        <div key={id} className="p-4 bg-white border border-[#d4c5b0] rounded flex flex-col md:flex-row md:items-center gap-4">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border border-[#d4c5b0]">
                             {sprites.find(s => s.key.includes(id)) ? (
                               <img src={sprites.find(s => s.key.includes(id))?.url} alt={char.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                             ) : (
                               <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400 capitalize bg-[#f5f0e5]">
                                 {char.name.charAt(0)}
                               </div>
                             )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-bold uppercase tracking-widest text-[#8b7355]">{char.name}</label>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 text-[10px] text-blue-600 hover:text-blue-700"
                                  onClick={() => handleTestVoice(id, char.name, char.gender)}
                                  disabled={isTestingVoice[id]}
                                >
                                  {isTestingVoice[id] ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Mic className="w-3 h-3 mr-1" />}
                                  Test Voice
                                </Button>
                                <span className="text-[9px] font-mono text-gray-400 uppercase">{id}</span>
                              </div>
                            </div>
                            <input 
                              type="text"
                              value={voiceMappings[id] || ""}
                              onChange={(e) => setVoiceMappings(prev => ({ ...prev, [id]: e.target.value }))}
                              placeholder="ElevenLabs Voice ID"
                              className="w-full p-2 border border-[#d4c5b0] rounded bg-white font-mono text-sm outline-none focus:ring-1 focus:ring-[#8b7355]"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="pt-6 mt-6 border-t border-gray-100">
                <Button 
                  onClick={handleSaveVoices}
                  disabled={isSavingVoices || isFetchingVoices}
                  className="w-full h-12 bg-[#8b7355] hover:bg-[#7a654a] text-white font-bold tracking-widest uppercase text-xs"
                >
                  {isSavingVoices ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Voice Assignments
                </Button>
              </div>
            </div>
          </div>
        ) : activeTab === 'sprites' ? (
          <div className="flex-1 flex flex-col space-y-6 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#fdfbf7] border border-[#d4c5b0] p-6 rounded-lg">
                <h3 className="text-lg font-serif font-bold mb-2">Automated Generation</h3>
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                  Generate missing character portraits using AI. This uses the book's global style prompt and character descriptions.
                </p>
                <Button 
                  onClick={handleGenerateAllSprites}
                  disabled={isGeneratingSprites}
                  className="w-full h-10 bg-[#8b7355] hover:bg-[#7a654a] text-white font-bold tracking-widest uppercase text-xs"
                >
                  {isGeneratingSprites ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Generate All Missing
                </Button>
              </div>

              <div className="bg-white border border-[#d4c5b0] p-6 rounded-lg">
                <h3 className="text-lg font-serif font-bold mb-2">Manual Upload</h3>
                <p className="text-sm text-gray-500 mb-6 italic">Add manual character portraits from files</p>
                <input 
                  type="file" 
                  id="sprite-upload" 
                  className="hidden" 
                  onChange={(e) => handleFileUpload(e, 'sprite')}
                  accept="image/png"
                />
                <label 
                  htmlFor="sprite-upload"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "w-full border-[#8b7355] text-[#8b7355] hover:bg-[#8b7355] hover:text-white rounded-none cursor-pointer h-10 px-6",
                    isUploading && "opacity-50 pointer-events-none"
                  )}
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                  Upload Sprite
                </label>
              </div>
            </div>

            {spriteResults.length > 0 && (
              <div className="bg-white border border-[#d4c5b0]">
                <div className="px-4 py-2 bg-[#f5f0e5] border-b border-[#d4c5b0] text-[10px] font-bold uppercase tracking-widest text-[#8b7355]">
                  Sprite Generation Logs
                </div>
                <div className="p-4 space-y-1 max-h-[200px] overflow-y-auto font-mono text-[10px]">
                  {spriteResults.map((res) => (
                    <div key={res.key} className="flex items-center justify-between py-0.5 border-b border-gray-50 last:border-0">
                      <span className="text-gray-600 truncate mr-4">{res.key}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        {res.status === 'pending' && <span className="text-blue-500 animate-pulse">GENERATING...</span>}
                        {res.status === 'success' && <span className="text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> SUCCESS</span>}
                        {res.status === 'skipped' && <span className="text-[#8b7355] flex items-center gap-1 opacity-60">EXISTS</span>}
                        {res.status === 'error' && <span className="text-red-500">ERROR</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1 bg-[#fdfbf7] border border-[#d4c5b0] overflow-hidden flex flex-col min-h-0">
              <div className="px-4 py-3 bg-[#f5f0e5] border-b border-[#d4c5b0]">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#8b7355]">
                  Character Portfolios ({sprites.length})
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {isFetchingSprites ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p className="text-sm italic">Scanning character vault...</p>
                  </div>
                ) : sprites.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                    <Users className="w-12 h-12 mb-2" />
                    <p className="text-sm italic">No character sprites found.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {sprites.map((sprite) => {
                      const charId = sprite.key.split('/').pop()?.replace('.png', '') || "";
                      const charName = novelData?.characters[charId]?.name || charId.charAt(0).toUpperCase() + charId.slice(1);
                      
                      return (
                        <div key={sprite.key} className="group relative aspect-[3/4] bg-gray-100 border border-[#d4c5b0] overflow-hidden cursor-pointer" onClick={() => setLightboxImage(`${sprite.url}&t=${assetVersion}`)}>
                          <img 
                            src={`${sprite.url}&t=${assetVersion}`} 
                            alt={charName} 
                            className="w-full h-full object-contain p-2 hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-end justify-start p-2 gap-2">
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleViewMetadata(sprite.key);
                               }}
                               className="bg-blue-500 text-white p-1.5 hover:bg-blue-600 shadow-lg"
                               title="View AI Prompt"
                             >
                               <Terminal className="w-3.5 h-3.5" />
                             </button>
                             <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAsset(sprite.key);
                              }}
                              className="bg-red-600 text-white p-1.5 hover:bg-red-700 shadow-lg"
                              title="Delete Sprite"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest truncate">{charName}</p>
                            <p className="text-[8px] opacity-60 font-mono truncate">{charId}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === 'import' ? (
          <div className="flex-1 flex flex-col space-y-6 overflow-hidden">
            <div className="bg-white border border-[#d4c5b0] p-6 rounded-lg space-y-4">
              <h2 className="text-xl font-serif font-bold text-[#4a3f35] flex items-center gap-2">
                <Download className="w-5 h-5" />
                Import from Project Gutenberg
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Provide a link to the plain text version of a book on Project Gutenberg. 
                Gemini will analyze the text, identify characters, structure chapters, and convert it into a visual novel script.
              </p>
              
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  placeholder="https://www.gutenberg.org/cache/epub/11/pg11.txt"
                  className="flex-1 bg-[#fdfbf7] border border-[#d4c5b0] px-4 py-2 text-sm rounded focus:ring-1 focus:ring-[#8b7355] outline-none"
                  disabled={importStatus !== 'idle' && importStatus !== 'finished' && importStatus !== 'error'}
                />
                <Button 
                  onClick={handleImportBook}
                  disabled={!importUrl || (importStatus !== 'idle' && importStatus !== 'finished' && importStatus !== 'error')}
                  className="bg-[#8b7355] hover:bg-[#7a654a] text-white rounded-none h-10 px-8 font-bold tracking-widest uppercase text-xs"
                >
                  {importStatus === 'fetching' || importStatus === 'analyzing' || importStatus === 'splitting' || importStatus === 'processing' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Importing...
                    </>
                  ) : (
                    "Import Book"
                  )}
                </Button>
              </div>

              {importStatus !== 'idle' && (
                <div className="space-y-4 pt-4 border-t border-[#d4c5b0]">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-tighter text-[#8b7355]">
                    <span>Current Phase: {importStatus.toUpperCase()}</span>
                    <span>{importProgress}%</span>
                  </div>
                  <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-[#8b7355]"
                      initial={{ width: 0 }}
                      animate={{ width: `${importProgress}%` }}
                    />
                  </div>

                  <div className="bg-black/90 rounded p-4 h-[300px] overflow-y-auto font-mono text-[10px] text-green-400 space-y-1 custom-scrollbar">
                    {importLog.map((log, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="opacity-50 shrink-0">[{i}]</span>
                        <span className={cn(log.includes("ERROR") && "text-red-400 font-bold")}>{log}</span>
                      </div>
                    ))}
                    {importStatus !== 'finished' && importStatus !== 'error' && (
                      <div className="animate-pulse">_</div>
                    )}
                  </div>
                </div>
              )}

              {importStatus === 'finished' && importedNovel && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-green-50 border border-green-200 rounded flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded flex items-center justify-center text-green-600">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-green-800">Success!</h4>
                      <p className="text-sm text-green-600">"{importedNovel.metadata.title}" has been imported and saved.</p>
                    </div>
                  </div>
                  <Button 
                     variant="outline"
                     className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                     onClick={() => window.location.reload()} 
                  >
                    Load New Library
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col space-y-6 overflow-hidden">
            {/* Prompt Scope Switch */}
            <div className="flex border-b border-gray-100">
              <button 
                onClick={() => setPromptScope('global')}
                className={cn(
                  "px-6 py-3 text-xs font-bold uppercase tracking-widest transition-colors",
                  promptScope === 'global' ? "bg-amber-50 text-amber-800 border-b-2 border-amber-800" : "text-gray-400 hover:text-gray-600"
                )}
              >
                Global Style (Novel-Wide)
              </button>
              <button 
                onClick={() => setPromptScope('scene')}
                className={cn(
                  "px-6 py-3 text-xs font-bold uppercase tracking-widest transition-colors",
                  promptScope === 'scene' ? "bg-amber-50 text-amber-800 border-b-2 border-amber-800" : "text-gray-400 hover:text-gray-600"
                )}
              >
                Scene Specific Overrides
              </button>
            </div>

            <div className="bg-[#fdfbf7] border border-[#d4c5b0] p-6 rounded-lg flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-serif font-bold">
                  {promptScope === 'global' ? 'Style Prompt Override' : 'Scene Prompt Override'}
                </h3>
                {promptScope === 'scene' && novelData && (
                  <select 
                    value={selectedSceneId}
                    onChange={(e) => setSelectedSceneId(e.target.value)}
                    className="p-1.5 border border-[#d4c5b0] rounded bg-white text-xs font-bold outline-none ring-[#8b7355] focus:ring-1 max-w-[200px]"
                  >
                    {novelData.chapters.map(ch => (
                      <optgroup key={ch.id} label={ch.title}>
                        {ch.scenes.map(s => (
                          <option key={s.id} value={s.id}>{s.title}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                )}
              </div>
              
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                {promptScope === 'global' 
                  ? "Define the global visual style for this novel. This prompt will be appended to every scene generation to maintain aesthetic consistency."
                  : "Define a specific prompt override for this scene. If set, this will be used INSTEAD of the global style prompt for this specific scene."}
              </p>

              {promptScope === 'scene' && selectedSceneData && (
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-white border border-[#d4c5b0] rounded">
                  <div className="space-y-4">
                    <div className="aspect-video bg-gray-100 border border-[#d4c5b0] overflow-hidden relative cursor-pointer group" onClick={() => activeBackgroundUrl && setLightboxImage(`${activeBackgroundUrl}&t=${assetVersion}`)}>
                      {activeBackgroundUrl ? (
                        <img 
                          src={`${activeBackgroundUrl}&t=${assetVersion}`} 
                          alt="Current Background" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <ImageIcon className="w-8 h-8" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <Plus className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 text-white text-[10px] font-bold uppercase tracking-widest">
                        Current Background
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-[#8b7355]">Scene Context</h4>
                      <p className="text-xs text-gray-600 italic line-clamp-3">
                        "{selectedSceneData.dialogue[0]?.text || 'No dialogue description available.'}"
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-[#8b7355] flex items-center gap-2">
                        <AlertCircle className="w-3 h-3" />
                        Prompt Precedence
                      </h4>
                      <div className="space-y-2 text-[11px] font-mono">
                        <div className={cn("flex items-center gap-2 p-1.5 rounded", currentPrompt ? "bg-green-50 text-green-800 border border-green-100" : "bg-gray-50 text-gray-400")}>
                          <div className={cn("w-2 h-2 rounded-full", currentPrompt ? "bg-green-500" : "bg-gray-300")} />
                          <span>Scene Specific Override {currentPrompt ? '(ACTIVE)' : '(EMPTY)'}</span>
                        </div>
                        <div className="flex items-center gap-2 p-1.5 bg-blue-50 text-blue-800 border border-blue-100 rounded">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span>Global Style Prompt (FALLBACK)</span>
                        </div>
                        <div className="flex items-center gap-2 p-1.5 bg-gray-50 text-gray-600 border border-gray-100 rounded">
                          <div className="w-2 h-2 rounded-full bg-gray-400" />
                          <span>Novel Default Metadata (LAST RESORT)</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-50">
                      <p className="text-[10px] text-gray-500 leading-relaxed uppercase font-bold tracking-tighter">
                        Location: {(selectedSceneData.background.includes('/api/s3/') ? selectedSceneData.background.split('%2F').pop()?.replace('.png', '') : selectedSceneData.background)?.replace(/_/g, ' ')}
                      </p>
                      <p className="text-[10px] text-gray-500 leading-relaxed uppercase font-bold tracking-tighter">
                        Chapter: {selectedSceneData.chapterTitle}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex-1 flex flex-col gap-4">
                <div className="relative flex-1">
                  {isFetchingPrompt && (
                    <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-[#8b7355]" />
                    </div>
                  )}
                  <textarea 
                    value={currentPrompt}
                    onChange={(e) => setCurrentPrompt(e.target.value)}
                    placeholder="Enter style instructions (e.g. realistic, watercolor, cinematic lighting...)"
                    className="w-full h-full p-4 border border-[#d4c5b0] rounded bg-white font-mono text-sm resize-none focus:ring-1 focus:ring-[#8b7355] outline-none transition-all"
                  />
                </div>
                
                <Button 
                  onClick={handleSavePrompt}
                  disabled={isSavingPrompt || isFetchingPrompt || (promptScope === 'scene' && !selectedSceneId)}
                  className="bg-[#8b7355] hover:bg-[#7a654a] text-white font-bold tracking-widest uppercase text-xs h-12"
                >
                  {isSavingPrompt ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save {promptScope === 'global' ? 'Global' : 'Scene'} Prompt
                </Button>
              </div>
              
              <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded text-xs text-amber-800 leading-relaxed italic">
                <strong>Note:</strong> {promptScope === 'global' 
                  ? "Changes to the style prompt will affect all future 'Regenerate' and 'Batch Generation' actions for this novel."
                  : "Scene overrides take high precedence. They are useful for scenes that require a drastically different visual mood than the rest of the book."}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Metadata Detail Overlay */}
      <AnimatePresence>
        {metadataViewKey && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-[200] bg-white border-t border-[#d4c5b0] shadow-[0_-10px_30px_rgba(0,0,0,0.1)] p-6"
          >
            <div className="max-w-4xl mx-auto flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded flex items-center justify-center">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-widest text-[#8b7355]">AI Generation Metadata</h4>
                    <p className="text-[10px] text-gray-500 font-mono truncate max-w-[400px]">{metadataViewKey}</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setMetadataViewKey(null); setSelectedAssetMetadata(null); }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-[#fdfbf7] border border-[#d4c5b0] p-4 rounded min-h-[100px] relative">
                {isFetchingMetadata ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                    <Loader2 className="w-6 h-6 animate-spin text-[#8b7355]" />
                  </div>
                ) : selectedAssetMetadata ? (
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">AI Prompt</span>
                      <p className="text-sm font-serif leading-relaxed text-[#4a3f35] italic">
                        "{selectedAssetMetadata.prompt}"
                      </p>
                    </div>
                    <div className="flex gap-10">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Generated At</span>
                        <span className="text-xs font-mono">{new Date(selectedAssetMetadata.generatedAt).toLocaleString()}</span>
                      </div>
                      {selectedAssetMetadata.charId && (
                        <div>
                          <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Character ID</span>
                          <span className="text-xs font-mono">{selectedAssetMetadata.charId}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 text-gray-400 italic">
                    <AlertCircle className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-sm">No recorded metadata found for this asset.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-4 md:p-10 cursor-zoom-out"
            onClick={() => setLightboxImage(null)}
          >
            <motion.button 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute top-6 right-6 text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
              onClick={() => setLightboxImage(null)}
            >
              <X className="w-6 h-6" />
            </motion.button>
            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={lightboxImage}
              alt="Full Preview"
              className="max-w-full max-h-full object-contain shadow-2xl"
              referrerPolicy="no-referrer"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
