import React, { useState, useEffect, useCallback, useRef, Component, ReactNode, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, BookOpen, Clock, User as UserIcon, Settings, Volume2, Sparkles, Loader2, Home, VolumeX, Hash, ChevronDown, Bookmark as BookmarkIcon, Trash2, History, Image as ImageIcon, RefreshCw, Pause, Play, Menu, Pin, X, Eye, EyeOff, Check, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { GoogleGenAI } from "@google/genai";
import { generateSpeech, playAudio, stopAudio, unlockAudio, hashString, pauseAudio, resumeAudio, ELEVENLABS_VOICES } from './services/ttsService';
import { ImageGenerator, BACKGROUND_CATEGORIES } from './components/ImageGenerator';
import { getFromCache, saveToCache, getBookmarks, saveBookmark, deleteBookmark, Bookmark, getSpriteHistory, saveSpriteHistory, getAllFromStore, syncBookmarksFromCloud } from './services/cacheService';
import { NovelLanding } from './components/NovelLanding';
import { ProgressView } from './components/ProgressView';
import { BackgroundSelector } from './components/BackgroundSelector';
import { AdminPanel } from './components/AdminPanel';
import { getNovelData, NOVELS_METADATA } from './data/bookData';
import { Novel, BookVersion } from './types';
import { updateProgress, loadProgressFromCloud, resetProgress, getProgress, syncAllProgressFromCloud } from './services/progressService';
import { AVAILABLE_VOICES, VoiceName, CHARACTER_VOICES } from './services/ttsService';
import { auth, signInWithPopup, signOut, onAuthStateChanged, googleProvider, User, db, doc, setDoc, handleFirestoreError, OperationType } from './firebase';
import { LogIn, LogOut } from 'lucide-react';
import { syncSettingsToCloud, loadSettingsFromCloud, UserSettings, syncGlobalSettingsToCloud, loadGlobalSettingsFromCloud } from './services/settingsService';
import { uploadMetadata } from './services/imageService';
import { saveNovelPromptConfig, loadNovelPromptConfig, loadAllNovelPromptConfigs } from './services/promptsService';
import { saveNovelVoiceConfig, loadNovelVoiceConfig } from './services/voiceService';
import { clearVoiceConfigCache } from './services/ttsService';

import { listImportedNovels } from './services/novelService';

import { NOVEL_THEMES } from './data/thematicBackgrounds';
import { resolveSceneBackground, sanitizeS3Url } from './lib/resolutionUtils';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function App() {
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [isDialogueHidden, setIsDialogueHidden] = useState(false);
  const [progressRefreshKey, setProgressRefreshKey] = useState(0);
  const [isChapterMenuOpen, setIsChapterMenuOpen] = useState(false);
  const [isTopChapterMenuOpen, setIsTopChapterMenuOpen] = useState(false);
  const [isTopSceneMenuOpen, setIsTopSceneMenuOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState(false);
  const [isCharVoiceSelectorOpen, setIsCharVoiceSelectorOpen] = useState(false);
  const [selectedCharForVoice, setSelectedCharForVoice] = useState<{ id: string, name: string } | null>(null);
  const [voiceIdOverrides, setVoiceIdOverrides] = useState<Record<string, string>>({});
  const [voiceOverrides, setVoiceOverrides] = useState<Record<string, VoiceName>>({});
  const [elevenLabsVoices, setElevenLabsVoices] = useState<any[]>([]);
  const [isFetchingVoices, setIsFetchingVoices] = useState(false);
  const [isProgressOpen, setIsProgressOpen] = useState(false);
  const [isBackgroundSelectorOpen, setIsBackgroundSelectorOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [globalSceneBackgrounds, setGlobalSceneBackgrounds] = useState<Record<string, string>>({});
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isNovelLoading, setIsNovelLoading] = useState(false);
  const [isGlobalSettingsLoaded, setIsGlobalSettingsLoaded] = useState(false);
  const [selectedNovelId, setSelectedNovelId] = useState<string | null>(null);
  const [assetVersion, setAssetVersion] = useState(Date.now());
  const [mainImageRefreshKey, setMainImageRefreshKey] = useState(Date.now());
  const [bookVersions, setBookVersions] = useState<Record<string, BookVersion>>(() => {
    const saved = localStorage.getItem('bookVersions');
    return saved ? JSON.parse(saved) : {};
  });
  const [novel, setNovel] = useState<Novel | null>(null);
  const [pinnedNovelIds, setPinnedNovelIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('pinnedNovelIds');
    return saved ? JSON.parse(saved) : [];
  });

  const [allMetadata, setAllMetadata] = useState(NOVELS_METADATA);

  const chapters = novel?.chapters || [];
  const characters = novel?.characters || {};

  const handleRefreshLibrary = useCallback(async () => {
    try {
      const importedList = await listImportedNovels();
      // Merge with NOVELS_METADATA, avoiding duplicates
      const combined = [...NOVELS_METADATA];
      importedList.forEach(item => {
        if (item?.metadata?.id && !combined.some(c => c.id === item.metadata.id)) {
          combined.push(item.metadata);
        }
      });
      setAllMetadata(combined);

      if (user) {
        // Load global settings
        try {
          const globalSettings = await loadGlobalSettingsFromCloud(user.uid);
          if (globalSettings?.pinnedNovelIds) setPinnedNovelIds(globalSettings.pinnedNovelIds);
          
          // Also sync all reading progress to ensure Library pages so far is accurate
          await syncAllProgressFromCloud(user.uid, combined);
        } catch (e) {
          console.error("Failed to load global settings during refresh:", e);
        }
      }
    } catch (error) {
      console.error("Failed to refresh library:", error);
    }
  }, [user]);

  // Fetch imported novels
  useEffect(() => {
    handleRefreshLibrary();
  }, [handleRefreshLibrary]);

  const handleRefreshProgress = useCallback(async () => {
    if (!user || !selectedNovelId) return;
    try {
      // Load progress
      const currentVersion = novel?.version || bookVersions[selectedNovelId] || 'abridged';
      const cloudProgress = await loadProgressFromCloud(user.uid, selectedNovelId, currentVersion);
      if (cloudProgress?.lastPosition) {
        setCurrentChapterIndex(cloudProgress.lastPosition.chapterIndex);
        setCurrentSceneIndex(cloudProgress.lastPosition.sceneIndex);
        setCurrentDialogueIndex(cloudProgress.lastPosition.dialogueIndex);
      }
      
      // Sync bookmarks
      const syncedBookmarks = await syncBookmarksFromCloud(user.uid, selectedNovelId);
      setBookmarks(syncedBookmarks);
    } catch (e) {
      console.error("Failed to refresh progress:", e);
    }
  }, [user, selectedNovelId, novel, bookVersions]);

  const handleRefreshAssets = useCallback(async () => {
    if (!selectedNovelId) return;
    setAssetVersion(Date.now());
  }, [selectedNovelId]);

  useEffect(() => {
    const loadNovel = async () => {
      if (selectedNovelId) {
        setIsNovelLoading(true);
        localStorage.setItem('selectedNovelId', selectedNovelId);
        const metadata = allMetadata.find(m => m.id === selectedNovelId);
        let version = bookVersions[selectedNovelId] || 'abridged';
        
        // Respect allowedVersions if defined
        if (metadata?.allowedVersions && !metadata.allowedVersions.includes(version as BookVersion)) {
          const newVersion = metadata.allowedVersions[0];
          setBookVersions(prev => ({ ...prev, [selectedNovelId]: newVersion }));
          return; // Let the effect re-run with the new version
        }
        
        try {
          const data = await getNovelData(selectedNovelId, version as BookVersion);
          
          // Set indices from progress if available, otherwise start at beginning
          const localProgress = getProgress(selectedNovelId, version);
          if (localProgress?.lastPosition) {
            setCurrentChapterIndex(localProgress.lastPosition.chapterIndex);
            setCurrentSceneIndex(localProgress.lastPosition.sceneIndex);
            setCurrentDialogueIndex(localProgress.lastPosition.dialogueIndex);
          } else {
            setCurrentChapterIndex(0);
            setCurrentSceneIndex(0);
            setCurrentDialogueIndex(0);
          }
          
          // Clear novel-specific states to prevent asset contamination
          setSceneBackgroundOverrides({});
          setSceneImageOverrides({});
          setPageImageOverrides({});
          setPageBackgroundHistory({});
          setBackgroundOverrides({});
          setSpriteOverrides({});
          // Only clear if we don't have voice config yet (it will be loaded below)
          setGeneratedSprites({});
          setSpriteHistory({});
          setGlobalSceneBackgrounds({});
          
          setNovel(data);
          
          // Load novel-wide voice mappings
          const voiceConfig = await loadNovelVoiceConfig(selectedNovelId);
          if (voiceConfig?.voiceMappings) {
            setVoiceIdOverrides(prev => ({ ...voiceConfig.voiceMappings }));
          } else {
            setVoiceIdOverrides({});
          }

          setIsMenuOpen(true); // Ensure menu is open for the new novel
        } catch (error) {
          console.error("Failed to load novel:", error);
        } finally {
          setIsNovelLoading(false);
        }
      } else {
        localStorage.removeItem('selectedNovelId');
        setNovel(null);
      }
    }
    loadNovel();
  }, [selectedNovelId, bookVersions]);

  useEffect(() => {
    localStorage.setItem('bookVersions', JSON.stringify(bookVersions));
  }, [bookVersions]);

  useEffect(() => {
    localStorage.setItem('pinnedNovelIds', JSON.stringify(pinnedNovelIds));
  }, [pinnedNovelIds]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
      if (currentUser) {
        if (selectedNovelId) {
          // Sync profile
          const userPath = `users/${currentUser.uid}`;
          try {
            await setDoc(doc(db, userPath), {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              updatedAt: new Date().toISOString()
            }, { merge: true });
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, userPath);
          }

          // Load progress
          const currentVersion = novel?.version || bookVersions[selectedNovelId] || 'abridged';
          const cloudProgress = await loadProgressFromCloud(currentUser.uid, selectedNovelId, currentVersion);
          if (cloudProgress?.lastPosition) {
            setCurrentChapterIndex(cloudProgress.lastPosition.chapterIndex);
            setCurrentSceneIndex(cloudProgress.lastPosition.sceneIndex);
            setCurrentDialogueIndex(cloudProgress.lastPosition.dialogueIndex);
          } else {
            // Check local progress if cloud failed or is empty
            const localProgress = getProgress(selectedNovelId, currentVersion);
            if (localProgress?.lastPosition) {
              setCurrentChapterIndex(localProgress.lastPosition.chapterIndex);
              setCurrentSceneIndex(localProgress.lastPosition.sceneIndex);
              setCurrentDialogueIndex(localProgress.lastPosition.dialogueIndex);
            } else {
              // No progress at all, start at the beginning
              setCurrentChapterIndex(0);
              setCurrentSceneIndex(0);
              setCurrentDialogueIndex(0);
            }
          }

          // Sync bookmarks
          const syncedBookmarks = await syncBookmarksFromCloud(currentUser.uid, selectedNovelId);
          setBookmarks(syncedBookmarks);

          // Load global settings
          try {
            const globalSettings = await loadGlobalSettingsFromCloud(currentUser.uid);
            if (globalSettings) {
              if (globalSettings.pinnedNovelIds) setPinnedNovelIds(globalSettings.pinnedNovelIds);
            }
          } catch (e) {
            console.error("Failed to load global settings:", e);
          } finally {
            setIsGlobalSettingsLoaded(true);
          }

          // Load settings
          const cloudSettings = await loadSettingsFromCloud(currentUser.uid, selectedNovelId);
          if (cloudSettings) {
            if (cloudSettings.readingSpeed !== undefined) setReadingSpeed(cloudSettings.readingSpeed);
            if (cloudSettings.isAudioEnabled !== undefined) setIsAudioEnabled(cloudSettings.isAudioEnabled);
            if (cloudSettings.isAutoAdvance !== undefined) setIsAutoAdvance(cloudSettings.isAutoAdvance);
            if (cloudSettings.autoAdvanceDelay !== undefined) setAutoAdvanceDelay(cloudSettings.autoAdvanceDelay);
            if (cloudSettings.voiceOverrides !== undefined) setVoiceOverrides(cloudSettings.voiceOverrides as Record<string, VoiceName>);
            if (cloudSettings.voiceIdOverrides !== undefined) setVoiceIdOverrides(cloudSettings.voiceIdOverrides);
            if (cloudSettings.sceneBackgroundOverrides !== undefined) setSceneBackgroundOverrides(cloudSettings.sceneBackgroundOverrides);
            if (cloudSettings.sceneImageOverrides !== undefined) setSceneImageOverrides(cloudSettings.sceneImageOverrides);
            if (cloudSettings.pageImageOverrides !== undefined) setPageImageOverrides(cloudSettings.pageImageOverrides);
            if (cloudSettings.spriteOverrides !== undefined) setSpriteOverrides(cloudSettings.spriteOverrides);
          }
        } else {
          // No novel selected, but still logged in - still load global settings
          try {
            const globalSettings = await loadGlobalSettingsFromCloud(currentUser.uid);
            if (globalSettings) {
              if (globalSettings.pinnedNovelIds) setPinnedNovelIds(globalSettings.pinnedNovelIds);
            }
          } catch (e) {
            console.error("Failed to load global settings:", e);
          } finally {
            setIsGlobalSettingsLoaded(true);
          }
        }
      } else {
        setIsGlobalSettingsLoaded(false);
      }
    });
    return () => unsubscribe();
  }, [selectedNovelId, novel?.version]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  useEffect(() => {
    if (novel) {
      document.title = `${novel.metadata.title} - A visual novel experience`;
    } else {
      document.title = "Visual Library - Classic Literature Reimagined";
    }
  }, [novel]);

  useEffect(() => {
    if (selectedNovelId) {
      const currentVersion = novel?.version || bookVersions[selectedNovelId] || 'abridged';
      updateProgress(selectedNovelId, currentChapterIndex, currentSceneIndex, currentDialogueIndex, user?.uid || undefined, currentVersion);
    }
  }, [selectedNovelId, currentChapterIndex, currentSceneIndex, currentDialogueIndex, user, novel?.version]);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState(() => {
    const saved = localStorage.getItem('isAudioEnabled');
    return saved !== null ? saved === 'true' : true;
  });
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  const [readingSpeed, setReadingSpeed] = useState(() => {
    const saved = localStorage.getItem('readingSpeed');
    return saved ? parseFloat(saved) : 1.0;
  });

  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [migrationStatus, setMigrationStatus] = useState('');
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
  const [spritePromptAddition, setSpritePromptAddition] = useState('');

  const migrateAssetsToS3 = async () => {
    if (!confirm('This will upload all locally cached sprites and audio to S3. Continue?')) return;
    
    setIsMigrating(true);
    setMigrationProgress(0);
    setMigrationStatus('Starting migration...');
    
    try {
      // 1. Migrate Sprites
      setMigrationStatus('Fetching cached sprites...');
      const sprites = await getAllFromStore('sprites');
      const spriteKeys = Object.keys(sprites).filter(k => !k.endsWith(':history'));
      const historyKeys = Object.keys(sprites).filter(k => k.endsWith(':history'));
      
      // 2. Migrate Audio
      setMigrationStatus('Fetching cached audio...');
      const audio = await getAllFromStore('audio');
      const audioKeys = Object.keys(audio);

      const total = spriteKeys.length + audioKeys.length + historyKeys.length;
      let completed = 0;

      if (total === 0) {
        setMigrationStatus('No assets found in cache to migrate.');
        setTimeout(() => setIsMigrating(false), 2000);
        return;
      }

      // Migrate Sprites
      for (const key of spriteKeys) {
        setMigrationStatus(`Migrating sprite: ${key}...`);
        let base64Data = sprites[key];
        
        // Skip if it's already an S3 URL
        if (base64Data.startsWith('http')) {
          completed++;
          setMigrationProgress(Math.round((completed / total) * 100));
          continue;
        }
        
        // Strip data URL prefix if present
        if (base64Data.startsWith('data:')) {
          base64Data = base64Data.split(',')[1];
        }
        
        const charId = key;
        
        const res = await fetch('/api/s3/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: `novels/${selectedNovelId}/sprites/${charId}.png`,
            base64Data,
            contentType: 'image/png'
          })
        });
        
        if (!res.ok) {
          console.error(`Failed to migrate sprite ${key}`);
        }
        
        completed++;
        setMigrationProgress(Math.round((completed / total) * 100));
      }

      // Migrate Sprite History
      for (const key of historyKeys) {
        setMigrationStatus(`Migrating history: ${key}...`);
        const historyData = sprites[key];
        const charId = key.split(':')[0];
        
        // Convert JSON string to base64
        const base64Data = btoa(unescape(encodeURIComponent(historyData)));
        
        const res = await fetch('/api/s3/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: `novels/${selectedNovelId}/sprites/${charId}_history.json`,
            base64Data,
            contentType: 'application/json'
          })
        });
        
        if (!res.ok) {
          console.error(`Failed to migrate history ${key}`);
        }
        
        completed++;
        setMigrationProgress(Math.round((completed / total) * 100));
      }

      // Migrate Audio
      for (const key of audioKeys) {
        // key format: charId:voiceName:text
        const [charId, voiceName, ...textParts] = key.split(':');
        const text = textParts.join(':');
        const docId = `${charId}_${voiceName}_${hashString(text)}`;
        
        setMigrationStatus(`Migrating audio: ${charId}...`);
        const base64Data = audio[key];
        
        const res = await fetch('/api/s3/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: `novels/${selectedNovelId}/audio/${docId}.pcm`,
            base64Data,
            contentType: 'application/octet-stream'
          })
        });

        if (!res.ok) {
          console.error(`Failed to migrate audio ${key}`);
        }
        
        completed++;
        setMigrationProgress(Math.round((completed / total) * 100));
      }

      setMigrationStatus('Migration completed successfully!');
      
      // 3. Migrate Local Backgrounds (Server-side)
      setMigrationStatus('Migrating local background files...');
      const localRes = await fetch('/api/s3/migrate-local', { method: 'POST' });
      const localData = await localRes.json();
      if (localData.success) {
        setMigrationStatus(`Migrated ${localData.count} local backgrounds. All done!`);
      } else {
        console.error('Local background migration failed:', localData.error);
      }

      setTimeout(() => setIsMigrating(false), 3000);
    } catch (error) {
      console.error('Migration failed:', error);
      setMigrationStatus('Migration failed. Check console.');
      setTimeout(() => setIsMigrating(false), 5000);
    }
  };

  useEffect(() => {
    localStorage.setItem('readingSpeed', readingSpeed.toString());
  }, [readingSpeed]);

  useEffect(() => {
    localStorage.setItem('isAudioEnabled', isAudioEnabled.toString());
  }, [isAudioEnabled]);

  const cycleReadingSpeed = () => {
    const speeds = [0.8, 1.0, 1.2, 1.5, 2.0];
    const currentIndex = speeds.indexOf(readingSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    setReadingSpeed(speeds[nextIndex]);
  };
  const [isAutoAdvance, setIsAutoAdvance] = useState(() => {
    const saved = localStorage.getItem('isAutoAdvance');
    return saved !== null ? saved === 'true' : false;
  });
  const [autoAdvanceDelay, setAutoAdvanceDelay] = useState(() => {
    const saved = localStorage.getItem('autoAdvanceDelay');
    return saved ? parseFloat(saved) : 1.5;
  });

  useEffect(() => {
    localStorage.setItem('isAutoAdvance', isAutoAdvance.toString());
    if (!isAutoAdvance) {
      setIsManualPaused(false);
    }
  }, [isAutoAdvance]);

  useEffect(() => {
    localStorage.setItem('autoAdvanceDelay', autoAdvanceDelay.toString());
  }, [autoAdvanceDelay]);
  const [isScenePaused, setIsScenePaused] = useState(false);
  const [isManualPaused, setIsManualPaused] = useState(false);
  const [isTextOverflowing, setIsTextOverflowing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<{ chapter: number; scene: number; dialogue: number }[]>([]);
  const [sceneBackgroundOverrides, setSceneBackgroundOverrides] = useState<Record<string, string>>({});
  const [sceneImageOverrides, setSceneImageOverrides] = useState<Record<string, string>>({});
  const [pageImageOverrides, setPageImageOverrides] = useState<Record<string, string>>({});
  const [pageBackgroundHistory, setPageBackgroundHistory] = useState<Record<string, string[]>>({});
  const [backgroundOverrides, setBackgroundOverrides] = useState<Record<string, string>>({});
  const [spriteOverrides, setSpriteOverrides] = useState<Record<string, string>>({});

  // Sync settings when novel or user changes
  useEffect(() => {
    const loadLocalSettings = () => {
      if (!selectedNovelId) return;
      
      const sbg = localStorage.getItem(`sceneBackgroundOverrides_${selectedNovelId}`);
      if (sbg) setSceneBackgroundOverrides(JSON.parse(sbg));
      else setSceneBackgroundOverrides({});

      const simg = localStorage.getItem(`sceneImageOverrides_${selectedNovelId}`);
      if (simg) setSceneImageOverrides(JSON.parse(simg));
      else setSceneImageOverrides({});
      
      const pimg = localStorage.getItem(`pageImageOverrides_${selectedNovelId}`);
      if (pimg) setPageImageOverrides(JSON.parse(pimg));
      else setPageImageOverrides({});
      
      const bg = localStorage.getItem(`backgroundOverrides_${selectedNovelId}`);
      if (bg) setBackgroundOverrides(JSON.parse(bg));
      else setBackgroundOverrides({});
      
      const so = localStorage.getItem(`spriteOverrides_${selectedNovelId}`);
      if (so) setSpriteOverrides(JSON.parse(so));
      else setSpriteOverrides({});

      const vo = localStorage.getItem(`voiceOverrides_${selectedNovelId}`);
      if (vo) setVoiceOverrides(JSON.parse(vo));
      else setVoiceOverrides({});

      const vio = localStorage.getItem(`voiceIdOverrides_${selectedNovelId}`);
      if (vio) setVoiceIdOverrides(JSON.parse(vio));
      else setVoiceIdOverrides({});
    };
    
    loadLocalSettings();
  }, [selectedNovelId]);

  useEffect(() => {
    if (selectedNovelId) {
      localStorage.setItem(`sceneBackgroundOverrides_${selectedNovelId}`, JSON.stringify(sceneBackgroundOverrides));
    }
  }, [sceneBackgroundOverrides, selectedNovelId]);

  useEffect(() => {
    if (selectedNovelId) {
      localStorage.setItem(`sceneImageOverrides_${selectedNovelId}`, JSON.stringify(sceneImageOverrides));
    }
  }, [sceneImageOverrides, selectedNovelId]);

  useEffect(() => {
    if (selectedNovelId) {
      localStorage.setItem(`pageImageOverrides_${selectedNovelId}`, JSON.stringify(pageImageOverrides));
    }
  }, [pageImageOverrides, selectedNovelId]);

  useEffect(() => {
    if (selectedNovelId) {
      localStorage.setItem(`backgroundOverrides_${selectedNovelId}`, JSON.stringify(backgroundOverrides));
    }
  }, [backgroundOverrides, selectedNovelId]);

  useEffect(() => {
    if (selectedNovelId) {
      localStorage.setItem(`spriteOverrides_${selectedNovelId}`, JSON.stringify(spriteOverrides));
    }
  }, [spriteOverrides, selectedNovelId]);

  // Auto-migrate base64 sprites to S3 to keep settings small and stay under Firestore 1MB limit
  useEffect(() => {
    if (!selectedNovelId) return;
    
    const migrateBase64 = async () => {
      let hasChanged = false;
      const newOverrides = { ...spriteOverrides };
      
      for (const [charId, img] of Object.entries(spriteOverrides)) {
        if (img && typeof img === 'string' && img.startsWith('data:')) {
          const base64Data = img.split(',')[1];
          // Basic validation check - if it's too small it's probably not a real image or already handled
          if (base64Data.length < 100) continue; 

          try {
            const res = await fetch('/api/s3/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                key: `novels/${selectedNovelId}/sprites/${charId}.png`,
                base64Data,
                contentType: 'image/png'
              })
            });
            if (res.ok) {
              const data = await res.json();
              newOverrides[charId] = data.url;
              hasChanged = true;
            }
          } catch (e) {
            console.error(`Failed to auto-migrate sprite for ${charId}:`, e);
          }
        }
      }
      
      if (hasChanged) {
        setSpriteOverrides(newOverrides);
      }
    };
    
    migrateBase64();
  }, [spriteOverrides, selectedNovelId]);

  useEffect(() => {
    if (selectedNovelId) {
      localStorage.setItem(`voiceOverrides_${selectedNovelId}`, JSON.stringify(voiceOverrides));
    }
  }, [voiceOverrides, selectedNovelId]);

  useEffect(() => {
    if (selectedNovelId) {
      localStorage.setItem(`voiceIdOverrides_${selectedNovelId}`, JSON.stringify(voiceIdOverrides));
    }
  }, [voiceIdOverrides, selectedNovelId]);

  useEffect(() => {
    if (user && isGlobalSettingsLoaded) {
      syncGlobalSettingsToCloud(user.uid, { pinnedNovelIds });
    }
  }, [user, pinnedNovelIds, isGlobalSettingsLoaded]);

  useEffect(() => {
    if (user && selectedNovelId) {
      const settings: UserSettings = {
        novelId: selectedNovelId,
        readingSpeed,
        isAudioEnabled,
        isAutoAdvance,
        autoAdvanceDelay,
        voiceOverrides,
        voiceIdOverrides,
        sceneBackgroundOverrides,
        sceneImageOverrides,
        pageImageOverrides,
        backgroundOverrides,
        spriteOverrides
      };
      syncSettingsToCloud(user.uid, selectedNovelId, settings);
      
      // Save S3 settings file for background scene mappings
      uploadMetadata(`settings/${user.uid}/${selectedNovelId}_backgrounds.json`, {
        sceneBackgroundOverrides,
        sceneImageOverrides,
        pageImageOverrides,
        backgroundOverrides
      }).catch(e => console.error("Failed to upload background mappings to S3:", e));

    }
  }, [user, readingSpeed, isAudioEnabled, isAutoAdvance, autoAdvanceDelay, voiceOverrides, voiceIdOverrides, sceneBackgroundOverrides, sceneImageOverrides, pageImageOverrides, backgroundOverrides, spriteOverrides]);

  useEffect(() => {
    if (user?.email === 'jwalter1@gmail.com' && selectedNovelId && Object.keys(voiceIdOverrides).length > 0) {
      const saveToNovel = async () => {
        await saveNovelVoiceConfig({
          novelId: selectedNovelId,
          voiceMappings: voiceIdOverrides,
          updatedAt: new Date().toISOString()
        });
        clearVoiceConfigCache(selectedNovelId);
      };
      saveToNovel();
    }
  }, [user, voiceIdOverrides, selectedNovelId]);
  
  // State for AI generated sprites
  const [generatedSprites, setGeneratedSprites] = useState<Record<string, string>>({});
  const [spriteHistory, setSpriteHistory] = useState<Record<string, string[]>>({});
  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({});
  const [isSpriteHistoryOpen, setIsSpriteHistoryOpen] = useState(false);
  const [isImageGeneratorOpen, setIsImageGeneratorOpen] = useState(false);

  const loadS3Backgrounds = async (novelId?: string) => {
    const id = novelId || selectedNovelId;
    if (!id) return;

    try {
      // 1. Load Category Backgrounds (check both novel-specific and general fallbacks)
      const overrides: Record<string, string> = {};
      
      const prefixes = [
        `novels/${id}/backgrounds/`,
        `backgrounds/fallbacks/${id}/`,
        `novels/${id}/manual/`
      ];

      for (const prefix of prefixes) {
        const bgResponse = await fetch(`/api/s3/list?prefix=${encodeURIComponent(prefix)}&t=${assetVersion || Date.now()}`);
        if (bgResponse.ok) {
          const contentType = bgResponse.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await bgResponse.json();
            if (data.success) {
              data.items.forEach((item: any) => {
                const category = item.key.split('/').pop().replace('.png', '');
                // Overwrite with most recent if duplicates (fallbacks might be older or newer)
                overrides[category] = item.url;
              });
            }
          }
        }
      }
      
      if (Object.keys(overrides).length > 0 || id === selectedNovelId) {
        if (id === selectedNovelId) {
          setBackgroundOverrides(overrides);
        }
      }

      // 2. Load Scene-specific Backgrounds
      const scenePrefixes = [
        `novels/${id}/scenes/`,
        `scenes/${id}/` // Handle alternative structure if any
      ];

      const sceneOverrides: Record<string, string> = {};
      for (const prefix of scenePrefixes) {
        const sceneResponse = await fetch(`/api/s3/list?prefix=${encodeURIComponent(prefix)}&t=${assetVersion || Date.now()}`);
        if (sceneResponse.ok) {
          const contentType = sceneResponse.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await sceneResponse.json();
            if (data.success) {
              const sortedItems = [...data.items].sort((a, b) => a.key.localeCompare(b.key));
              sortedItems.forEach((item: any) => {
                const filename = item.key.split('/').pop();
                if (filename && filename.includes('_')) {
                  const sceneId = filename.split('_')[0];
                  sceneOverrides[sceneId] = item.url;
                }
              });
            }
          }
        }
      }

      if (id === selectedNovelId) {
        setSceneImageOverrides(prev => ({ ...sceneOverrides, ...prev }));
      }

      // 3. Load Page-specific Backgrounds
      const pagePrefix = `novels/${id}/pages/`;
      const pageResponse = await fetch(`/api/s3/list?prefix=${encodeURIComponent(pagePrefix)}&t=${assetVersion || Date.now()}`);
      if (pageResponse.ok) {
        const contentType = pageResponse.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await pageResponse.json();
          if (data.success) {
            const pageOverrides: Record<string, string> = {};
            const historyMap: Record<string, string[]> = {};
            const sortedItems = [...data.items].sort((a, b) => a.key.localeCompare(b.key));
            sortedItems.forEach((item: any) => {
              const filename = item.key.split('/').pop();
              if (filename && filename.includes('_')) {
                const parts = filename.split('_');
                if (parts.length >= 2) {
                  const sceneId = parts[0];
                  const pageIndex = parts[1].replace('.png', '');
                  const key = `${sceneId}_${pageIndex}`;
                  if (!historyMap[sceneId]) historyMap[sceneId] = [];
                  historyMap[sceneId].push(item.url);
                  if (!pageOverrides[key]) pageOverrides[key] = item.url;
                }
              }
            });
            if (id === selectedNovelId) {
              setPageImageOverrides(prev => ({ ...pageOverrides, ...prev }));
              setPageBackgroundHistory(historyMap);
            }
          } else if (id === selectedNovelId) {
            // Success but no items returned (prefix might be empty)
            // Do NOT wipe manual overrides. Let the existing manual overrides remain.
            setPageBackgroundHistory({});
          }
        }
      } else if (id === selectedNovelId) {
        // Fetch failed, but do NOT wipe manual assignments on network error.
        setPageBackgroundHistory({});
      }
    } catch (e) {
      console.error("Error loading S3 backgrounds:", e);
    }
  };

  const loadS3Sprites = async (novelId?: string) => {
    const id = novelId || selectedNovelId;
    if (!id) return;

    try {
      console.log(`Syncing character sprites from S3 for ${id}...`);
      const prefix = `novels/${id}/sprites/`;
      const spriteResponse = await fetch(`/api/s3/list?prefix=${encodeURIComponent(prefix)}&t=${assetVersion || Date.now()}`);
      if (spriteResponse.ok) {
        const contentType = spriteResponse.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await spriteResponse.text();
          console.error("Non-JSON response from S3 list (sprites):", text.slice(0, 200));
          return;
        }
        const data = await spriteResponse.json();
        if (data.success) {
          const s3Sprites: Record<string, string> = {};
          const s3Histories: Record<string, string[]> = {};
          
          for (const item of data.items) {
            const filename = item.key.split('/').pop();
            if (!filename) continue;
            
            if (filename.endsWith('.png')) {
              const charId = filename.replace('.png', '');
              s3Sprites[charId] = item.url;
              // Also cache locally if not already there
              const local = await getFromCache('sprites', charId);
              if (!local) {
                await saveToCache('sprites', charId, item.url);
              }
            } else if (filename.endsWith('_history.json')) {
              const charId = filename.replace('_history.json', '');
              try {
                const res = await fetch(item.url);
                if (res.ok) {
                  const history = await res.json();
                  if (Array.isArray(history)) {
                    s3Histories[charId] = history;
                    // Cache locally
                    await saveSpriteHistory(charId, history);
                  }
                }
              } catch (e) {
                console.error(`Failed to load history for ${charId} from S3 list:`, e);
              }
            }
          }
          
          if (id === selectedNovelId) {
            setGeneratedSprites(s3Sprites);
            setSpriteHistory(s3Histories);
          }
        } else if (id === selectedNovelId) {
          setGeneratedSprites({});
          setSpriteHistory({});
        }
      } else if (id === selectedNovelId) {
        setGeneratedSprites({});
        setSpriteHistory({});
      }
    } catch (e) {
      console.error("Error loading S3 sprites:", e);
    }
  };

  const handleDeleteBackground = async (type: 'category' | 'scene' | 'page' | 'all' | 'history', id: string, pageIndex?: number, targetUrl?: string) => {
    console.log(`handleDeleteBackground called with type: ${type}, id: ${id}`);
    const novelId = selectedNovelId || novel?.metadata.id;
    if (!novelId) {
      console.error('Cannot delete background: selectedNovelId is missing');
      return;
    }

    if (type === 'all') {
      console.log(`Clearing background overrides for ${novelId}...`);
      
      const novelSceneIds = new Set(novel?.chapters.flatMap(ch => ch.scenes.map(s => s.id)) || []);
      
      setSceneBackgroundOverrides(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          if (novelSceneIds.has(key)) delete next[key];
        });
        return next;
      });
      
      setSceneImageOverrides(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          if (novelSceneIds.has(key)) delete next[key];
        });
        return next;
      });

      setPageImageOverrides(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          const sceneId = key.split('_')[0];
          if (novelSceneIds.has(sceneId)) delete next[key];
        });
        return next;
      });

      setBackgroundOverrides(prev => {
        const next = { ...prev };
        const novelCategories = BACKGROUND_CATEGORIES[novelId as string] || {};
        Object.keys(novelCategories).forEach((catId) => {
          delete next[catId];
        });
        return next;
      });

      try {
        const response = await fetch(`/api/s3/clear-novel?novelId=${novelId}`, { method: 'POST' });
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }
        const data = await response.json();
        console.log('S3 clear-novel response:', data);
        setErrorMessage(`Custom backgrounds for ${novelId} cleared!`);
        setTimeout(() => setErrorMessage(null), 3000);
      } catch (e) {
        console.error("Failed to clear S3 backgrounds:", e);
        setErrorMessage("Cloud cleanup failed, but local settings were reset.");
        setTimeout(() => setErrorMessage(null), 3000);
      }
      return;
    }

    let urlToDelete = '';
    if (type === 'scene') {
      urlToDelete = sceneImageOverrides[id];
      setSceneImageOverrides(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } else if (type === 'page' && pageIndex !== undefined) {
      const key = `${id}_${pageIndex}`;
      urlToDelete = pageImageOverrides[key];
      setPageImageOverrides(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } else if (type === 'history' && targetUrl) {
      urlToDelete = targetUrl;
      setPageBackgroundHistory(prev => {
        const next = { ...prev };
        if (next[id]) {
          next[id] = next[id].filter(url => url !== targetUrl);
          if (next[id].length === 0) delete next[id];
        }
        return next;
      });
      // We should ALSO scrub this url from being an active page override just in case!
      setPageImageOverrides(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          if (next[key] === targetUrl) {
             delete next[key];
          }
        });
        return next;
      });
    } else {
      urlToDelete = backgroundOverrides[id];
      setBackgroundOverrides(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      // Also clear any scene overrides that use this category
      setSceneBackgroundOverrides(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          if (next[key] === id) delete next[key];
        });
        return next;
      });
    }

    if (urlToDelete && urlToDelete.includes('/api/s3/get?key=')) {
      // Correctly extract the key and strip any trailing query parameters like &t=...
      const rawKey = urlToDelete.split('key=')[1];
      const key = decodeURIComponent(rawKey.split('&')[0]);
      
      try {
        await fetch('/api/s3/delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key })
        });
      } catch (e) {
        console.error("Failed to delete from S3:", e);
      }
    }
  };

  useEffect(() => {
    if (selectedNovelId) {
      loadS3Backgrounds(selectedNovelId);
      loadS3Sprites(selectedNovelId);
    }
  }, [selectedNovelId, assetVersion]);

  const dialogueTextRef = useRef<HTMLParagraphElement>(null);
  const currentDialogueRef = useRef({ chapter: 0, scene: 0, dialogue: 0 });
  const pointerStart = useRef({ x: 0, y: 0 });
  const lastActionTime = useRef(0);
  const DEBOUNCE_DELAY = 300; // ms

  // Update the ref whenever the dialogue changes
  useEffect(() => {
    currentDialogueRef.current = { 
      chapter: currentChapterIndex, 
      scene: currentSceneIndex, 
      dialogue: currentDialogueIndex 
    };
  }, [currentChapterIndex, currentSceneIndex, currentDialogueIndex]);

  // Detect text overflow for dynamic positioning
  useEffect(() => {
    const timer = setTimeout(() => {
      if (dialogueTextRef.current) {
        // We check if the text height exceeds the standard dialogue box height (~550px content area)
        // even if the box is currently expanded. This prevents layout loops.
        const isOverflowing = dialogueTextRef.current.scrollHeight > 550;
        setIsTextOverflowing(isOverflowing);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [novel]); // Changed dependency to something stable if novel is null

  // Load bookmarks on mount
  useEffect(() => {
    const loadBookmarks = async () => {
      const saved = await getBookmarks();
      setBookmarks(saved.sort((a, b) => b.timestamp - a.timestamp));
    };
    loadBookmarks();
  }, []);

  const currentChapter = novel ? (chapters[currentChapterIndex] || chapters[0]) : null;
  const currentScene = currentChapter ? (currentChapter.scenes[currentSceneIndex] || currentChapter.scenes[0]) : null;
  const currentDialogue = currentScene ? (currentScene.dialogue[currentDialogueIndex] || currentScene.dialogue[0]) : null;
  const currentCharacter = currentDialogue?.characterId ? (characters as any)[currentDialogue.characterId] : null;

  const resolveBackground = useCallback((chapterIdx: number, sceneIdx: number, dialogueIdx: number) => {
    if (!novel || !selectedNovelId) return '';
    const chapter = chapters[chapterIdx];
    if (!chapter) return '';
    const scene = chapter.scenes[sceneIdx];
    if (!scene) return '';

    const result = resolveSceneBackground(scene, dialogueIdx, {
      novelId: selectedNovelId,
      assetVersion,
      overrides: {
        pageImageOverrides,
        sceneImageOverrides,
        globalSceneBackgrounds,
        sceneBackgroundOverrides,
        backgroundOverrides
      }
    });

    return result.url || '';
  }, [novel, selectedNovelId, pageImageOverrides, sceneImageOverrides, globalSceneBackgrounds, sceneBackgroundOverrides, backgroundOverrides, assetVersion]);

  const resolveCharacterSprite = useCallback((charId: string) => {
    if (!charId || charId === 'narrator') return '';
    const char = (characters as any)[charId];
    if (!char) return '';
    const rawUrl = spriteOverrides[charId] || generatedSprites[charId] || char.image || '';
    if (!rawUrl) return '';
    const sanitized = sanitizeS3Url(rawUrl);
    const separator = sanitized.includes('?') ? '&' : '?';
    return `${sanitized}${separator}v=${assetVersion}`;
  }, [characters, spriteOverrides, generatedSprites, assetVersion]);

  const getSceneBackground = () => {
    return resolveBackground(currentChapterIndex, currentSceneIndex, currentDialogueIndex);
  };

  const preloadImage = (url: string) => {
    if (!url || url.startsWith('blob:')) return;
    const img = new Image();
    img.src = url;
  };

  const handleStopAudio = () => {
    stopAudio();
    setIsAudioPlaying(false);
    setIsAudioPaused(false);
  };

  const handleSaveBookmark = async () => {
    if (!novel || !currentChapter || !currentScene || !currentDialogue) return;
    const now = Date.now();
    if (now - lastActionTime.current < DEBOUNCE_DELAY) return;
    lastActionTime.current = now;

    // Check if a bookmark already exists at this exact position
    const isDuplicate = bookmarks.some(b => 
      b.novelId === selectedNovelId && 
      b.chapterIndex === currentChapterIndex && 
      b.sceneIndex === currentSceneIndex && 
      b.dialogueIndex === currentDialogueIndex
    );

    if (isDuplicate) {
      setErrorMessage("Already bookmarked!");
      setTimeout(() => setErrorMessage(null), 2000);
      return;
    }

    const newBookmark: Bookmark = {
      id: crypto.randomUUID(),
      novelId: selectedNovelId!,
      chapterIndex: currentChapterIndex,
      sceneIndex: currentSceneIndex,
      dialogueIndex: currentDialogueIndex,
      timestamp: Date.now(),
      chapterTitle: currentChapter.title,
      sceneTitle: currentScene.title,
      previewText: currentDialogue.text.substring(0, 60) + "...",
      uid: user?.uid
    };
    await saveBookmark(newBookmark, user?.uid);
    setBookmarks(prev => [newBookmark, ...prev]);
    setErrorMessage("Bookmark saved!");
    setTimeout(() => setErrorMessage(null), 2000);
  };

  const handleDeleteBookmark = async (id: string) => {
    if (!selectedNovelId) return;
    await deleteBookmark(id, selectedNovelId, user?.uid);
    setBookmarks(prev => prev.filter(b => b.id !== id));
  };

  const handleLoadBookmark = (bookmark: Bookmark) => {
    const now = Date.now();
    if (now - lastActionTime.current < DEBOUNCE_DELAY) return;
    lastActionTime.current = now;

    handleStopAudio();
    setCurrentChapterIndex(bookmark.chapterIndex);
    setCurrentSceneIndex(bookmark.sceneIndex);
    setCurrentDialogueIndex(bookmark.dialogueIndex);
    setHistory([]);
    setIsBookmarksOpen(false);
    setIsMenuOpen(false);
  };

  const handlePointerDown = (e: React.PointerEvent | React.TouchEvent) => {
    unlockAudio();
    if ('touches' in e) {
      pointerStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else {
      pointerStart.current = { x: (e as React.PointerEvent).clientX, y: (e as React.PointerEvent).clientY };
    }
  };

  const handlePointerUp = (e: React.PointerEvent | React.TouchEvent | React.MouseEvent) => {
    // Prevent advancing if text is selected
    if (window.getSelection()?.toString()) return;
    
    // If the click happened on an interactive element (buttons, etc), ignore it
    // but still allow the pointer gesture to unlock audio
    unlockAudio();
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('[role="button"]')) return;

    let endX, endY;
    if ('changedTouches' in e) {
      endX = (e as React.TouchEvent).changedTouches[0].clientX;
      endY = (e as React.TouchEvent).changedTouches[0].clientY;
    } else {
      endX = (e as React.MouseEvent).clientX;
      endY = (e as React.MouseEvent).clientY;
    }

    const deltaX = endX - pointerStart.current.x;
    const deltaY = endY - pointerStart.current.y;
    const dist = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));

    if (isDialogueHidden) {
      if (dist < 10) {
        setIsDialogueHidden(false);
      }
      return;
    }

    // If the pointer moved more than 10px, it's likely a scroll/swipe, not a click
    if (dist < 10 && e.type !== 'touchend') {
      // Only process clicks on non-touch events here to avoid double firing
      nextDialogue();
    } else if (Math.abs(deltaX) > 60 && Math.abs(deltaY) < 40) {
      // Horizontal swipe detected
      if (deltaX < 0) {
        nextDialogue(); // Swipe left (finger moves left) -> forward
      } else if (currentDialogueIndex > 0 || currentSceneIndex > 0 || currentChapterIndex > 0) {
        prevDialogue(); // Swipe right (finger moves right) -> back
      }
    }
  };

  const generateSprite = async (charId: string, force = false, additionalPrompt = "") => {
    if (!novel || isGenerating[charId] || (generatedSprites[charId] && !force)) return;

    setIsGenerating(prev => ({ ...prev, [charId]: true }));
    try {
      if (!force) {
        // Check cache first
        const cachedSprite = await getFromCache('sprites', charId);
        const history = await getSpriteHistory(charId);
        if (cachedSprite) {
          setGeneratedSprites(prev => ({ ...prev, [charId]: cachedSprite }));
          setSpriteHistory(prev => ({ ...prev, [charId]: history }));
          setIsGenerating(prev => ({ ...prev, [charId]: false }));
          return;
        }
      }

      const char = (characters as any)[charId];
      const bookStyle = novel?.metadata?.stylePrompt || 'Detailed line art style, period-accurate clothing, neutral background.';
      
      let prompt = `A high-quality illustration of ${char.name} from the novel "${novel.metadata.title}", ${char.description || ''} ${bookStyle} Neutral background.`;
      
      if (charId === "gatsby") {
        prompt = `A high-quality 1920s Jazz Age illustration of Jay Gatsby, a fabulously wealthy young man with a charismatic smile, wearing an elegant suit, Roaring Twenties style, ${bookStyle} Neutral background.`;
      } else if (charId === "nick") {
        prompt = `A high-quality 1920s Jazz Age illustration of Nick Carraway, a young man with a reserved and observant expression, wearing a modest brown suit, Roaring Twenties style, ${bookStyle} Neutral background.`;
      } else if (charId === "daisy") {
        prompt = `A high-quality 1920s Jazz Age illustration of Daisy Buchanan, a beautiful socialite with a delicate face, wearing a white flapper dress and pearls, Roaring Twenties style, ${bookStyle} Neutral background.`;
      }

      if (additionalPrompt) {
        prompt += ` Character details: ${additionalPrompt}`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: "3:4",
          },
        },
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString: string = part.inlineData.data;
          const localImageUrl = `data:image/png;base64,${base64EncodeString}`;
          
          // Fast feedback with local URL
          setGeneratedSprites(prev => ({ ...prev, [charId]: localImageUrl }));
          
          let finalUrl = localImageUrl;
          // Save to S3
          try {
            const s3Res = await fetch('/api/s3/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                key: `novels/${selectedNovelId}/sprites/${charId}.png`,
                base64Data: base64EncodeString,
                contentType: 'image/png'
              })
            });
            if (s3Res.ok) {
              const s3Data = await s3Res.json();
              finalUrl = s3Data.url;
            }
          } catch (s3Error) {
            console.error("Failed to save sprite to S3:", s3Error);
          }

          // Use the final URL (S3) for overrides and generated state
          setSpriteOverrides(prev => ({ ...prev, [charId]: finalUrl }));
          setGeneratedSprites(prev => ({ ...prev, [charId]: finalUrl }));
          
          // Update history
          const currentHistory = spriteHistory[charId] || await getSpriteHistory(charId);
          const newHistory = [finalUrl, ...currentHistory.filter(img => img !== finalUrl)].slice(0, 10);
          setSpriteHistory(prev => ({ ...prev, [charId]: newHistory }));
          
          await saveToCache('sprites', charId, finalUrl);
          await saveSpriteHistory(charId, newHistory);

          // Save history to S3
          try {
            const historyJson = JSON.stringify(newHistory);
            const historyBase64 = btoa(unescape(encodeURIComponent(historyJson)));
            await fetch('/api/s3/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                key: `novels/${selectedNovelId}/sprites/${charId}_history.json`,
                base64Data: historyBase64,
                contentType: 'application/json'
              })
            });
          } catch (historyS3Error) {
            console.error("Failed to save history to S3:", historyS3Error);
          }
          break;
        }
      }
    } catch (error: any) {
      console.error("Failed to generate sprite:", error);
      if (error?.status === 429 || error?.code === 429 || (error?.message && error.message.includes('429')) || (error?.message && error.message.includes('RESOURCE_EXHAUSTED'))) {
        setErrorMessage("Image generation quota exceeded. Please try again in a few minutes.");
        setTimeout(() => setErrorMessage(null), 5000);
      }
    } finally {
      setIsGenerating(prev => ({ ...prev, [charId]: false }));
    }
  };

  // Automatically generate sprites for characters as they appear
  useEffect(() => {
    if (currentCharacter?.id && selectedNovelId) {
      const loadHistory = async () => {
        const charId = currentCharacter.id;
        let history = await getSpriteHistory(charId);
        
        // If local history is empty, try S3
        if (history.length === 0) {
          try {
            console.log(`Checking S3 history for ${charId} in novel ${selectedNovelId}`);
            const res = await fetch(`/api/s3/exists?key=novels/${selectedNovelId}/sprites/${charId}_history.json`);
            const data = await res.json();
            if (data.exists) {
              const historyRes = await fetch(data.url);
              if (historyRes.ok) {
                const s3History = await historyRes.json();
                if (Array.isArray(s3History)) {
                  console.log(`Successfully loaded history for ${charId} from S3`);
                  history = s3History;
                  await saveSpriteHistory(charId, history);
                }
              }
            }
          } catch (e) {
            console.error("Failed to load history from S3:", e);
          }
        }
        
        setSpriteHistory(prev => ({ ...prev, [charId]: history }));
      };
      loadHistory();
      
      const initSprite = async () => {
        const charId = currentCharacter.id;
        
        // 1. Check if already in state
        if (generatedSprites[charId]) return;

        // 2. Check local cache first (fastest)
        const cached = await getFromCache('sprites', charId);
        if (cached) {
          console.log(`Loading sprite for ${charId} from local cache`);
          setGeneratedSprites(prev => ({ ...prev, [charId]: cached }));
          
          // Ensure it's in history
          setSpriteHistory(prev => {
            const current = prev[charId] || [];
            if (current.includes(cached)) return prev;
            const newHistory = [cached, ...current].slice(0, 10);
            saveSpriteHistory(charId, newHistory);
            return { ...prev, [charId]: newHistory };
          });
          return;
        }

        // 3. Check S3 (shared/persistent)
        try {
          console.log(`Checking S3 for sprite: ${charId} (Novel: ${selectedNovelId})`);
          const response = await fetch(`/api/s3/exists?key=novels/${selectedNovelId}/sprites/${charId}.png`);
          const data = await response.json();
          if (data.exists) {
            console.log(`Found sprite for ${charId} in S3: ${data.url}`);
            setGeneratedSprites(prev => ({ ...prev, [charId]: data.url }));
            // Also save to local cache for next time
            await saveToCache('sprites', charId, data.url);
            
            // Ensure it's in history
            setSpriteHistory(prev => {
              const current = prev[charId] || [];
              if (current.includes(data.url)) return prev;
              const newHistory = [data.url, ...current].slice(0, 10);
              saveSpriteHistory(charId, newHistory);
              return { ...prev, [charId]: newHistory };
            });
            return;
          }
        } catch (e) {
          console.error("Error checking S3 for sprite:", e);
        }

        // 4. Generate if not found anywhere
        if (!isGenerating[charId]) {
          console.log(`Sprite for ${charId} not found in cache or S3, generating new one...`);
          generateSprite(charId);
        }
      };

      initSprite();
    }
  }, [currentCharacter?.id, selectedNovelId]);

  useEffect(() => {
    if (isCharVoiceSelectorOpen && elevenLabsVoices.length === 0) {
      fetchElevenLabsVoices();
    }
  }, [isCharVoiceSelectorOpen]);

  const fetchElevenLabsVoices = async () => {
    setIsFetchingVoices(true);
    try {
      const res = await fetch('/api/tts/elevenlabs/voices');
      if (res.ok) {
        const data = await res.json();
        setElevenLabsVoices(data.voices || []);
      }
    } catch (e) {
      console.error("Failed to fetch voices:", e);
    } finally {
      setIsFetchingVoices(false);
    }
  };

  const groupedElevenLabsVoices = useMemo(() => {
    const groups: Record<string, any[]> = {};
    elevenLabsVoices.forEach(voice => {
      const cat = voice.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(voice);
    });
    // Sort categories: generated, premade, etc.
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [elevenLabsVoices]);

  const handlePlayAudio = async (force = false) => {
    if (!currentDialogue || isAudioLoading) return;

    // Capture the indices when we start
    const startIndices = { 
      chapter: currentChapterIndex, 
      scene: currentSceneIndex, 
      dialogue: currentDialogueIndex 
    };

    setIsAudioLoading(true);
    setIsAudioPlaying(false);
    setIsAudioPaused(false);
    setErrorMessage(null);
    try {
      const voiceOverride = currentCharacter?.id ? voiceOverrides[currentCharacter.id] : voiceOverrides['narrator'];
      const customVoiceId = currentCharacter?.id ? voiceIdOverrides[currentCharacter.id] : voiceIdOverrides['narrator'];
      const base64 = await generateSpeech(currentDialogue.text, currentDialogue.characterId, voiceOverride, force, selectedNovelId || undefined, currentCharacter?.gender, customVoiceId);
      
      // Check if we are still on the same dialogue
      if (
        currentDialogueRef.current.chapter !== startIndices.chapter ||
        currentDialogueRef.current.scene !== startIndices.scene ||
        currentDialogueRef.current.dialogue !== startIndices.dialogue
      ) {
        return;
      }

      if (base64) {
        setIsAudioPlaying(true);
        // Apply a slight boost to narrator speed if it feels slower
        const effectiveSpeed = !currentCharacter ? readingSpeed * 1.15 : readingSpeed;
        await playAudio(base64, effectiveSpeed, () => {
          setIsAudioPlaying(false);
          setIsAudioPaused(false);
          if (isAutoAdvance && !isMenuOpen && !isSettingsOpen && !isManualPaused) {
            setTimeout(() => {
              // Re-check indices before advancing
              if (
                !isManualPaused &&
                currentDialogueRef.current.chapter === startIndices.chapter &&
                currentDialogueRef.current.scene === startIndices.scene &&
                currentDialogueRef.current.dialogue === startIndices.dialogue
              ) {
                nextDialogue();
              }
            }, autoAdvanceDelay * 1000);
          }
        });
      }
    } catch (error: any) {
      if (error?.status === 429 || error?.code === 429 || error.message === 'QUOTA_EXCEEDED' || error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
        setErrorMessage("Gemini API quota exceeded. Please try again in a few minutes.");
        setTimeout(() => setErrorMessage(null), 5000);
      } else if (error.message?.startsWith('ELEVENLABS_ERROR:')) {
        const msg = error.message.replace('ELEVENLABS_ERROR: ', '');
        setErrorMessage(`ElevenLabs Error: ${msg}`);
        setTimeout(() => setErrorMessage(null), 8000);
      } else {
        console.error("Audio playback error:", error);
        setErrorMessage("An error occurred during audio playback.");
        setTimeout(() => setErrorMessage(null), 5000);
      }
    } finally {
      setIsAudioLoading(false);
    }
  };

  const togglePauseAudio = (e: any) => {
    e.stopPropagation();
    if (isAudioPaused) {
      resumeAudio();
      setIsAudioPaused(false);
      setIsManualPaused(false);
    } else if (isAudioPlaying) {
      pauseAudio();
      setIsAudioPaused(true);
      setIsManualPaused(true);
    }
  };

  const preloadAssets = async (chapterIdx: number, sceneIdx: number, dialogueIdx: number) => {
    try {
      const chapter = chapters[chapterIdx];
      if (!chapter) return;
      const scene = chapter.scenes[sceneIdx];
      if (!scene) return;
      const dialogue = scene.dialogue[dialogueIdx];
      if (!dialogue) return;

      // 1. Resolve and Trigger Visual Assets immediately (Non-blocking)
      // 2. Preload Background Image
      const bgUrl = resolveBackground(chapterIdx, sceneIdx, dialogueIdx);
      if (bgUrl) preloadImage(bgUrl);

      // 3. Preload Character Sprite
      if (dialogue.characterId) {
        const spriteUrl = resolveCharacterSprite(dialogue.characterId);
        if (spriteUrl) preloadImage(spriteUrl);
      }

      // 4. Preload Audio (Blocking/Sequential to avoid overwhelming TTS API)
      if (isAudioEnabled) {
        const charGender = dialogue.characterId ? (characters as any)[dialogue.characterId]?.gender : undefined;
        await generateSpeech(dialogue.text, dialogue.characterId, undefined, false, selectedNovelId || undefined, charGender);
      }
    } catch (e) {
      // Silent fail for preloading
    }
  };

  // Preload next dialogues and assets
  useEffect(() => {
    if (isMenuOpen || !currentScene) return;

    const preloadNext = async () => {
      // Preload next 3 lines
      for (let i = 1; i <= 3; i++) {
        let nextD = currentDialogueIndex + i;
        let nextS = currentSceneIndex;
        let nextC = currentChapterIndex;

        // Find next dialogue across scenes/chapters
        if (nextD >= (chapters[nextC]?.scenes[nextS]?.dialogue.length || 0)) {
          nextD = 0;
          nextS++;
          if (nextS >= (chapters[nextC]?.scenes.length || 0)) {
            nextS = 0;
            nextC++;
          }
        }

        if (nextC < chapters.length) {
          await preloadAssets(nextC, nextS, nextD);
        }
      }
    };

    preloadNext();
  }, [currentChapterIndex, currentSceneIndex, currentDialogueIndex, isAudioEnabled, isMenuOpen, chapters, resolveBackground, resolveCharacterSprite]);

  useEffect(() => {
    if (isAudioEnabled && !isMenuOpen && currentDialogue && !isScenePaused) {
      handlePlayAudio();
    }
  }, [currentChapterIndex, currentSceneIndex, currentDialogueIndex, isAudioEnabled, isMenuOpen, currentDialogue, isScenePaused]);

  const nextDialogue = useCallback(() => {
    if (!currentScene || !novel || isScenePaused) return;
    const now = Date.now();
    if (now - lastActionTime.current < DEBOUNCE_DELAY) return;
    lastActionTime.current = now;

    unlockAudio();
    handleStopAudio();

    const isEndOfScene = currentDialogueIndex === currentScene.dialogue.length - 1;

    if (isEndOfScene) {
      const isEndOfChapter = currentSceneIndex === currentChapter.scenes.length - 1;
      const isEndOfNovel = isEndOfChapter && currentChapterIndex === chapters.length - 1;

      if (!isEndOfNovel) {
        setHistory(prev => [...prev, { chapter: currentChapterIndex, scene: currentSceneIndex, dialogue: currentDialogueIndex }]);
        
        if (currentSceneIndex < currentChapter.scenes.length - 1) {
          setCurrentSceneIndex(prev => prev + 1);
          setCurrentDialogueIndex(0);
        } else if (currentChapterIndex < chapters.length - 1) {
          setCurrentChapterIndex(prev => prev + 1);
          setCurrentSceneIndex(0);
          setCurrentDialogueIndex(0);
        }

        setIsScenePaused(true);
        setTimeout(() => {
          setIsScenePaused(false);
        }, 3000);
        return;
      }
    }

    if (currentDialogueIndex < currentScene.dialogue.length - 1) {
      setHistory(prev => [...prev, { chapter: currentChapterIndex, scene: currentSceneIndex, dialogue: currentDialogueIndex }]);
      setCurrentDialogueIndex(prev => prev + 1);
    }
  }, [currentChapterIndex, currentSceneIndex, currentDialogueIndex, currentChapter?.scenes?.length, currentScene?.dialogue?.length, novel, isScenePaused, chapters]);

  const prevDialogue = useCallback(() => {
    if (!currentChapter || !novel) return;
    const now = Date.now();
    if (now - lastActionTime.current < DEBOUNCE_DELAY) return;
    lastActionTime.current = now;

    unlockAudio();
    handleStopAudio();
    
    // Linear back logic: go to the previous page regardless of how we got here
    if (currentDialogueIndex > 0) {
      setCurrentDialogueIndex(prev => prev - 1);
    } else if (currentSceneIndex > 0) {
      const prevScene = currentChapter.scenes[currentSceneIndex - 1];
      setCurrentSceneIndex(prev => prev - 1);
      setCurrentDialogueIndex(prevScene.dialogue.length - 1);
    } else if (currentChapterIndex > 0) {
      const prevChapter = chapters[currentChapterIndex - 1];
      const lastSceneIdx = prevChapter.scenes.length - 1;
      const lastScene = prevChapter.scenes[lastSceneIdx];
      setCurrentChapterIndex(prev => prev - 1);
      setCurrentSceneIndex(lastSceneIdx);
      setCurrentDialogueIndex(lastScene.dialogue.length - 1);
    }
    
    // Maintain history for consistency if nextDialogue uses it
    if (history.length > 0) {
      setHistory(prev => prev.slice(0, -1));
    }
  }, [currentChapterIndex, currentSceneIndex, currentDialogueIndex, currentChapter?.scenes, chapters, history, novel]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (
        isMenuOpen || 
        isChapterMenuOpen || 
        isBookmarksOpen || 
        isSettingsOpen || 
        isVoiceSettingsOpen || 
        isProgressOpen || 
        isBackgroundSelectorOpen || 
        isImageGeneratorOpen ||
        !novel
      ) return;

      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        if (isDialogueHidden) {
          setIsDialogueHidden(false);
        } else {
          nextDialogue();
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
        prevDialogue();
      } else if (e.key.toLowerCase() === 'h') {
        setIsDialogueHidden(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    nextDialogue, 
    prevDialogue, 
    isMenuOpen, 
    isChapterMenuOpen, 
    isBookmarksOpen, 
    isSettingsOpen, 
    isVoiceSettingsOpen, 
    isProgressOpen, 
    isBackgroundSelectorOpen, 
    isImageGeneratorOpen, 
    novel
  ]);

  // Auto-scroll to selected items when menus open
  useEffect(() => {
    if (isTopChapterMenuOpen) {
      setTimeout(() => {
        const selected = document.querySelector('.top-chapter-selected');
        // Prevent scrolling the main window by using scroll offset logic
        if (selected && selected.parentElement) {
          const container = selected.parentElement.parentElement; // The overflow-y-auto div
          if (container) {
            container.scrollTop = (selected as HTMLElement).offsetTop - container.clientHeight / 2 + (selected as HTMLElement).clientHeight / 2;
          }
        }
      }, 150);
    }
  }, [isTopChapterMenuOpen]);

  useEffect(() => {
    if (isTopSceneMenuOpen) {
      setTimeout(() => {
        const selected = document.querySelector('.top-scene-selected');
        if (selected && selected.parentElement) {
          const container = selected.parentElement.parentElement;
          if (container) {
            container.scrollTop = (selected as HTMLElement).offsetTop - container.clientHeight / 2 + (selected as HTMLElement).clientHeight / 2;
          }
        }
      }, 150);
    }
  }, [isTopSceneMenuOpen]);

  useEffect(() => {
    if (isChapterMenuOpen) {
      setTimeout(() => {
        const selected = document.querySelector('.main-chapter-selected');
        if (selected && selected.parentElement) {
          const container = selected.parentElement.parentElement;
          if (container) {
            container.scrollTop = (selected as HTMLElement).offsetTop - container.clientHeight / 2 + (selected as HTMLElement).clientHeight / 2;
          }
        }
      }, 150);
    }
  }, [isChapterMenuOpen]);

  const startGame = () => {
    handleStopAudio();
    unlockAudio();
    setIsMenuOpen(false);
  };

  const togglePin = (id: string) => {
    setPinnedNovelIds(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  if (!selectedNovelId || !novel) {
    return (
      <>
        <NovelLanding 
          novels={allMetadata}
          onSelect={(id) => {
            setNovel(null);
            setSelectedNovelId(id);
            setIsMenuOpen(true);
          }} 
          onJumpTo={(id, version, chIdx, scIdx) => {
            // Update version
            setBookVersions(prev => ({ ...prev, [id]: version }));
            
            // Set the progress position so loadNovel picks it up
            updateProgress(id, chIdx, scIdx, 0, user?.uid, version);
            
            // Trigger novel selection
            setNovel(null);
            setSelectedNovelId(id);
            setIsMenuOpen(false); // Close menu if it was open (though normally it's closed in landing)
          }}
          pinnedNovelIds={pinnedNovelIds}
          onTogglePin={togglePin}
          user={user} 
          onLogin={handleLogin} 
          onLogout={handleLogout} 
          onOpenAdmin={() => setIsAdminOpen(true)}
          onRefresh={handleRefreshLibrary}
        />
        {renderModals()}
      </>
    );
  }

  if (isMenuOpen) {
    return (
      <div className="min-h-screen bg-[#f5f2ed] flex items-center justify-center p-4 font-serif relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#1a1a1a] blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#1a1a1a] blur-[120px]" />
        </div>

        <Card className="max-w-xl w-full p-8 bg-white/80 backdrop-blur-sm border-none shadow-2xl flex flex-col items-center text-center space-y-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl font-bold tracking-tighter text-[#1a1a1a] mb-1">{novel.metadata.title}</h1>
            <p className="text-lg italic text-gray-600 mb-4">A Visual Novel Experience</p>
            
            {(!novel.metadata.allowedVersions || (novel.metadata.allowedVersions.length > 1)) && (
              <div className="flex w-fit mx-auto bg-black/5 p-1 rounded-md" onClick={(e) => e.stopPropagation()}>
                {(!novel.metadata.allowedVersions || novel.metadata.allowedVersions.includes('abridged')) && (
                  <button 
                    onClick={() => setBookVersions(prev => ({ ...prev, [selectedNovelId]: 'abridged' }))}
                    className={cn(
                      "px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] rounded transition-all font-bold",
                      (bookVersions[selectedNovelId] || 'abridged') === 'abridged' ? "bg-white shadow-md text-[#1a1a1a]" : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    Abridged
                  </button>
                )}
                {(!novel.metadata.allowedVersions || novel.metadata.allowedVersions.includes('unabridged')) && (
                  <button 
                    onClick={() => setBookVersions(prev => ({ ...prev, [selectedNovelId]: 'unabridged' }))}
                    className={cn(
                      "px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] rounded transition-all font-bold",
                      bookVersions[selectedNovelId] === 'unabridged' ? "bg-white shadow-md text-[#1a1a1a]" : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    Unabridged
                  </button>
                )}
              </div>
            )}

            <div className="mt-4 flex flex-col items-center gap-1">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                <Clock className="w-3 h-3" />
                Est. Reading Time: 
                <span className="text-[#1a1a1a]">
                  {(bookVersions[selectedNovelId] || 'abridged') === 'abridged' 
                    ? novel.metadata.abridgedEstimate 
                    : novel.metadata.unabridgedEstimate}
                </span>
              </div>
            </div>
          </motion.div>

          <div className="w-16 h-px bg-gray-300" />

          <div className="space-y-3 w-full max-w-xs">
            <Button 
              onClick={startGame}
              className="w-full h-10 text-base bg-[#1a1a1a] hover:bg-gray-800 text-white rounded-none transition-all duration-300"
            >
              Begin Reading
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                className="w-full h-10 text-sm border-[#1a1a1a] text-[#1a1a1a] hover:bg-gray-100 rounded-none transition-all duration-300"
                onClick={() => setIsChapterMenuOpen(true)}
              >
                Chapters
              </Button>
              <Button 
                variant="outline" 
                className="w-full h-10 text-sm border-[#1a1a1a] text-[#1a1a1a] hover:bg-gray-100 rounded-none transition-all duration-300"
                onClick={() => setIsBookmarksOpen(true)}
              >
                Bookmarks
              </Button>
              <Button 
                variant="outline" 
                className="w-full h-10 text-sm border-[#1a1a1a] text-[#1a1a1a] hover:bg-gray-100 rounded-none transition-all duration-300"
                onClick={() => setIsProgressOpen(true)}
              >
                Progress
              </Button>
              <Button 
                variant="outline" 
                className="w-full h-10 text-sm border-[#1a1a1a] text-[#1a1a1a] hover:bg-gray-100 rounded-none transition-all duration-300"
                onClick={() => setIsVoiceSettingsOpen(true)}
              >
                Voice Settings
              </Button>
            </div>
            <Button 
              variant="outline" 
              className="w-full h-10 text-sm border-[#1a1a1a] text-[#1a1a1a] hover:bg-gray-100 rounded-none transition-all duration-300"
              onClick={() => setIsSettingsOpen(true)}
            >
              Settings
            </Button>
            <Button 
              variant="ghost" 
              className="w-full h-10 text-sm text-gray-500 hover:bg-gray-100 rounded-none transition-all duration-300"
              onClick={() => {
                handleStopAudio();
                setSelectedNovelId(null);
              }}
            >
              Back to Library
            </Button>
          </div>

          <div className="pt-8 text-sm text-gray-400 uppercase tracking-widest">
            By {novel.metadata.author}
          </div>
        </Card>

        {/* Modals are now handled at the end of the main return block to ensure they are always on top */}
        {renderModals()}
      </div>
    );
  }

  return (
    <div 
      className="relative h-screen w-screen overflow-hidden bg-black font-serif cursor-pointer"
      onPointerDown={handlePointerDown}
      onClick={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchEnd={handlePointerUp}
    >
      {/* Background Layer */}
        <div
          className={cn(
            "absolute inset-x-0 top-0 overflow-hidden",
            isScenePaused ? "hidden" : (isDialogueHidden ? "bottom-0" : "bottom-[280px] md:bottom-[320px]")
          )}
        >
          <img 
            src={`${getSceneBackground() || ''}${getSceneBackground()?.includes('?') ? '&' : '?'}t=${mainImageRefreshKey}`} 
            alt="Background" 
            className="w-full h-full object-contain opacity-60 grayscale-[0.2]"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              const defaultThemedUrl = selectedNovelId ? NOVEL_THEMES[selectedNovelId]?.['default'] : null;
              
              if (target.src.includes('picsum.photos')) return;
              if (defaultThemedUrl && !target.src.includes(defaultThemedUrl)) {
                target.src = defaultThemedUrl;
                return;
              }
              target.src = `https://picsum.photos/seed/${currentScene?.id || 'default'}/1920/1080?blur=10`;
            }}
          />
          <button
            className="absolute top-4 right-4 bg-white/10 backdrop-blur-md text-white p-2 rounded-full hover:bg-white/20 transition-all z-50"
            onClick={() => setMainImageRefreshKey(Date.now())}
            title="Refresh Background"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <div className="absolute inset-0 bg-gradient-to-t from-black from-0% via-transparent via-25% to-black/30" />
        </div>

      <AnimatePresence>
        {isDialogueHidden && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-6 right-6 z-[100]"
          >
            <Button
              onClick={() => setIsDialogueHidden(false)}
              className="rounded-full w-12 h-12 bg-black/40 backdrop-blur-md border border-white/20 text-white hover:bg-black/60 shadow-2xl"
              title="Show Interface"
            >
              <Eye className="w-6 h-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>



      <AnimatePresence>
        {isScenePaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-[80] flex flex-col items-center justify-center pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 1.05, opacity: 0, y: -10 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="w-16 h-px bg-white/20" />
              <div className="flex flex-col items-center gap-2">
                <div className="text-white/20 text-[8px] uppercase tracking-[0.4em] font-serif font-bold">
                  {currentChapter.title}
                </div>
                <div className="text-white/60 text-lg md:text-2xl font-serif text-center px-4">
                  {currentScene.title}
                </div>
              </div>
              <div className="w-16 h-px bg-white/20" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <AnimatePresence>
        {!isDialogueHidden && !isScenePaused && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 p-4 md:p-6 flex flex-col gap-3 md:gap-4 z-[70]"
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
          >
        <div className="flex justify-between items-center w-full gap-4">
          <div className="flex flex-1 min-w-0 gap-2">
            {/* Chapter Dropdown */}
            <div className="relative flex-1 md:flex-initial">
              <Button 
                variant="outline" 
                className={cn(
                  "bg-[#1a1a1a]/60 text-white border-white/30 backdrop-blur-md px-3 py-1 uppercase tracking-widest text-[10px] h-auto rounded-none hover:bg-[#1a1a1a]/80 hover:text-white flex items-center gap-2 transition-colors w-full md:w-48 justify-between",
                  isTopChapterMenuOpen && "bg-[#1a1a1a] border-white/50"
                )}
                onClick={() => {
                  handleStopAudio();
                  setIsTopChapterMenuOpen(!isTopChapterMenuOpen);
                  setIsTopSceneMenuOpen(false);
                }}
              >
                <span className="truncate">{currentChapter.title}</span>
                <ChevronDown className={cn("w-3 h-3 shrink-0 transition-transform duration-200", isTopChapterMenuOpen && "rotate-180")} />
              </Button>

              <AnimatePresence>
                {isTopChapterMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 mt-2 w-64 bg-[#1a1a1a] shadow-2xl border border-white/20 overflow-hidden z-[100]"
                  >
                    <div className="h-72 overflow-y-auto custom-scrollbar-light">
                      <div className="p-2 space-y-1">
                        {chapters.map((chapter, index) => (
                          <Button
                            key={chapter.id}
                            variant="ghost"
                            className={cn(
                              "w-full justify-start text-left h-auto py-3 px-4 rounded-none bg-white/5 hover:bg-white/15 text-white transition-colors",
                              index === currentChapterIndex && "bg-white/25 font-bold top-chapter-selected"
                            )}
                            onClick={() => {
                              handleStopAudio();
                              setCurrentChapterIndex(index);
                              setCurrentSceneIndex(0);
                              setCurrentDialogueIndex(0);
                              setHistory([]);
                              setIsTopChapterMenuOpen(false);
                            }}
                          >
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase tracking-widest opacity-50 mb-1">Chapter {chapter?.id || index + 1}</span>
                              <span className="text-sm truncate">{chapter.title}</span>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Scene Dropdown */}
            <div className="relative flex-1 md:flex-initial">
              <Button 
                variant="outline" 
                className={cn(
                  "bg-[#1a1a1a]/60 text-white border-white/30 backdrop-blur-md px-3 py-1 uppercase tracking-widest text-[10px] h-auto rounded-none hover:bg-[#1a1a1a]/80 hover:text-white flex items-center gap-2 transition-colors w-full md:w-64 justify-between",
                  isTopSceneMenuOpen && "bg-[#1a1a1a] border-white/50"
                )}
                onClick={() => {
                  handleStopAudio();
                  setIsTopSceneMenuOpen(!isTopSceneMenuOpen);
                  setIsTopChapterMenuOpen(false);
                }}
              >
                <span className="truncate">{currentScene?.title || 'Loading...'}</span>
                <ChevronDown className={cn("w-3 h-3 shrink-0 transition-transform duration-200", isTopSceneMenuOpen && "rotate-180")} />
              </Button>

              <AnimatePresence>
                {isTopSceneMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 mt-2 w-72 bg-[#1a1a1a] shadow-2xl border border-white/20 overflow-hidden z-[100]"
                  >
                    <div className="max-h-72 overflow-y-auto custom-scrollbar-light">
                      <div className="p-2 space-y-1">
                        {currentChapter.scenes.map((scene, index) => (
                          <Button
                            key={scene.id}
                            variant="ghost"
                            className={cn(
                              "w-full justify-start text-left h-auto py-3 px-4 rounded-none bg-white/5 hover:bg-white/15 text-white transition-colors",
                              index === currentSceneIndex && "bg-white/25 font-bold top-scene-selected"
                            )}
                            onClick={() => {
                              handleStopAudio();
                              setCurrentSceneIndex(index);
                              setCurrentDialogueIndex(0);
                              setHistory([]);
                              setIsTopSceneMenuOpen(false);
                            }}
                          >
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase tracking-widest opacity-50 mb-1">Scene {index + 1}</span>
                              <span className="text-sm truncate">{scene.title}</span>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn("transition-colors bg-[#1a1a1a]/40 backdrop-blur-md rounded-none hover:bg-white/20 w-8 h-8 md:w-10 md:h-10 hidden md:flex", isAudioEnabled ? "text-white" : "text-white/40")} 
              onClick={() => {
                if (isAudioEnabled) handleStopAudio();
                setIsAudioEnabled(!isAudioEnabled);
              }} 
              title={isAudioEnabled ? "Disable Auto-Audio" : "Enable Auto-Audio"}
            >
              {isAudioEnabled ? <Volume2 className="w-4 h-4 md:w-5 md:h-5" /> : <VolumeX className="w-4 h-4 md:w-5 md:h-5" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="bg-[#1a1a1a]/40 backdrop-blur-md rounded-none text-white/70 hover:text-white hover:bg-white/20 w-8 h-8 md:w-10 md:h-10 hidden md:flex" 
              onClick={() => setIsDialogueHidden(!isDialogueHidden)} 
              title={isDialogueHidden ? "Show UI" : "Hide UI (H)"}
            >
              {isDialogueHidden ? <Eye className="w-4 h-4 md:w-5 md:h-5" /> : <EyeOff className="w-4 h-4 md:w-5 md:h-5" />}
            </Button>
            <Button variant="ghost" size="icon" className="bg-[#1a1a1a]/40 backdrop-blur-md rounded-none text-white/70 hover:text-white hover:bg-white/20 w-8 h-8 md:w-10 md:h-10 hidden md:flex" onClick={() => { handleStopAudio(); setIsBackgroundSelectorOpen(true); }} title="Select Background">
              <ImageIcon className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="bg-[#1a1a1a]/40 backdrop-blur-md rounded-none text-white/70 hover:text-white hover:bg-white/20 w-8 h-8 md:w-10 md:h-10 hidden md:flex" onClick={() => { handleStopAudio(); setIsProgressOpen(true); }} title="Reading Progress">
              <History className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="bg-[#1a1a1a]/40 backdrop-blur-md rounded-none text-white/70 hover:text-white hover:bg-white/20 w-8 h-8 md:w-10 md:h-10 hidden md:flex" onClick={() => { handleStopAudio(); setIsSettingsOpen(true); }} title="Settings">
              <Settings className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
            {user ? (
              <Button variant="ghost" size="icon" className="bg-[#1a1a1a]/40 backdrop-blur-md rounded-none p-0 overflow-hidden w-8 h-8 md:w-10 md:h-10 hidden md:flex hover:ring-1 hover:ring-white/30" onClick={() => { handleStopAudio(); handleLogout(); }} title={`Logout (${user.displayName})`}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full bg-[#3d3126] flex items-center justify-center text-white/40">
                    {user.displayName?.charAt(0) || 'U'}
                  </div>
                )}
              </Button>
            ) : (
              <Button variant="ghost" size="icon" className="bg-[#1a1a1a]/40 backdrop-blur-md rounded-none text-white/70 hover:text-white hover:bg-white/20 w-8 h-8 md:w-10 md:h-10 hidden md:flex" onClick={() => { handleStopAudio(); handleLogin(); }} title="PLEASE LOG IN">
                <LogIn className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Row 2: Quick Controls */}
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-1">
          <Button 
            variant="outline" 
            size="sm"
            className="bg-[#1a1a1a]/60 text-white border-white/30 backdrop-blur-md px-3 py-1 uppercase tracking-widest text-[10px] h-auto rounded-none hover:bg-white/20 hover:text-white flex items-center gap-1 shrink-0"
            onClick={() => {
              handleStopAudio();
              setIsMenuOpen(true);
            }}
          >
            <Menu className="w-3 h-3" /> Menu
          </Button>

          <Button 
            variant="outline" 
            size="sm"
            className="bg-[#1a1a1a]/60 text-white border-white/30 backdrop-blur-md px-3 py-1 uppercase tracking-widest text-[10px] h-auto rounded-none hover:bg-white/20 hover:text-white flex items-center gap-1 shrink-0"
            onClick={prevDialogue}
            disabled={currentChapterIndex === 0 && currentSceneIndex === 0 && currentDialogueIndex === 0}
          >
            <ChevronLeft className="w-3 h-3" /> Back
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="bg-[#1a1a1a]/60 text-white border-white/30 backdrop-blur-md px-3 py-1 uppercase tracking-widest text-[10px] h-auto rounded-none hover:bg-white/20 hover:text-white flex items-center gap-1 shrink-0"
            onClick={nextDialogue}
          >
            Next <ChevronRight className="w-3 h-3" />
          </Button>

          <Button 
            variant="ghost" 
            size="sm"
            className="bg-[#1a1a1a]/60 text-white border-white/30 backdrop-blur-md px-3 py-1 uppercase tracking-widest text-[10px] h-auto rounded-none hover:bg-white/20 hover:text-white flex items-center gap-1 shrink-0"
            onClick={cycleReadingSpeed}
            title="Cycle Reading Speed"
          >
            <Volume2 className="w-3 h-3" /> {readingSpeed.toFixed(1)}x
          </Button>

          {/* Mobile Only Buttons moved from Row 1 */}
          <Button 
            variant="ghost" 
            size="sm"
            className="bg-[#1a1a1a]/60 text-white border-white/30 backdrop-blur-md px-3 py-1 uppercase tracking-widest text-[10px] h-auto rounded-none hover:bg-white/20 hover:text-white flex md:hidden items-center gap-1 shrink-0"
            onClick={() => {
              if (isAudioEnabled) handleStopAudio();
              setIsAudioEnabled(!isAudioEnabled);
            }}
          >
            {isAudioEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
            Sound
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="bg-[#1a1a1a]/60 text-white border-white/30 backdrop-blur-md px-3 py-1 uppercase tracking-widest text-[10px] h-auto rounded-none hover:bg-white/20 hover:text-white flex md:hidden items-center gap-1 shrink-0"
            onClick={() => {
              handleStopAudio();
              setIsMenuOpen(true);
            }}
          >
            <Home className="w-3 h-3" /> Home
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="bg-[#1a1a1a]/60 text-white border-white/30 backdrop-blur-md px-3 py-1 uppercase tracking-widest text-[10px] h-auto rounded-none hover:bg-white/20 hover:text-white flex md:hidden items-center gap-1 shrink-0"
            onClick={() => setIsDialogueHidden(!isDialogueHidden)}
          >
            {isDialogueHidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            UI
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="bg-[#1a1a1a]/60 text-white border-white/30 backdrop-blur-md px-3 py-1 uppercase tracking-widest text-[10px] h-auto rounded-none hover:bg-white/20 hover:text-white flex md:hidden items-center gap-1 shrink-0"
            onClick={() => { handleStopAudio(); setIsBookmarksOpen(true); }}
          >
            <BookmarkIcon className="w-3 h-3" /> Bookmarks
          </Button>

          <Button 
            variant="ghost" 
            size="sm"
            className="bg-[#1a1a1a]/60 text-white border-white/30 backdrop-blur-md px-3 py-1 uppercase tracking-widest text-[10px] h-auto rounded-none hover:bg-white/20 hover:text-white flex md:hidden items-center gap-1 shrink-0"
            onClick={() => { handleStopAudio(); setIsSettingsOpen(true); }}
          >
            <Settings className="w-3 h-3" /> Settings
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="bg-[#1a1a1a]/60 text-white border-white/30 backdrop-blur-md px-3 py-1 uppercase tracking-widest text-[10px] h-auto rounded-none hover:bg-white/20 hover:text-white flex items-center gap-1 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              handleStopAudio();
              handleSaveBookmark();
            }}
          >
            <BookmarkIcon className="w-3 h-3" /> Save
          </Button>
        </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dialogue Box */}
      <AnimatePresence>
        {!isDialogueHidden && !isScenePaused && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={cn(
              "absolute left-0 right-0 p-8 z-50 transition-all duration-700 ease-in-out flex flex-col bottom-0 justify-end pb-24",
              !currentCharacter && "bg-black/5"
            )}
          >
        <div className="max-w-6xl mx-auto w-full relative flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8">
          
          {/* Character Portrait */}
          <div className="w-[140px] md:w-[240px] shrink-0 z-10 md:mb-4 flex justify-center">
            <AnimatePresence mode="wait">
              {currentCharacter && currentCharacter.id !== 'narrator' && (
                <motion.div
                  key={currentCharacter.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 100,
                    damping: 20,
                    opacity: { duration: 0.4 }
                  }}
                  className="relative pointer-events-auto cursor-pointer flex justify-center"
                >
                  <div className="relative w-full aspect-[3/4] bg-white p-2 md:p-3 shadow-2xl border-4 md:border-8 border-[#d4c5b0] md:-rotate-2 rotate-0 flex items-center justify-center overflow-hidden">
                    {isGenerating[currentCharacter.id] || (!spriteOverrides[currentCharacter.id] && !generatedSprites[currentCharacter.id] && !currentCharacter.image) ? (
                      <div className="flex flex-col items-center justify-center space-y-2 md:space-y-4 text-[#2c241a]">
                        <Loader2 className="w-8 h-8 md:w-12 md:h-12 animate-spin opacity-40" />
                        <p className="text-[10px] md:text-xs uppercase tracking-widest opacity-60 text-center">Sketching...</p>
                      </div>
                    ) : (
                      <>
                        <img 
                          src={spriteOverrides[currentCharacter.id] || generatedSprites[currentCharacter.id] || currentCharacter.image || undefined} 
                          alt={currentCharacter.name}
                          className="w-full h-full object-cover grayscale-[0.1] sepia-[0.2]"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${currentCharacter.id}/600/800?grayscale`;
                          }}
                        />
                        {generatedSprites[currentCharacter.id] && (
                          <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm p-1 rounded-full shadow-sm">
                            <Sparkles className="w-3 h-3 text-[#d4c5b0]" />
                          </div>
                        )}
                      </>
                    )}
                    <div className="absolute inset-0 border border-black/10 pointer-events-none" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-1 w-full">
            <div
              key={`${currentChapterIndex}-${currentSceneIndex}-${currentDialogueIndex}`}
              className="relative"
            >
              <div className="absolute -top-10 left-0 flex items-center gap-2">
                {currentCharacter ? (
                  <>
                    <div 
                      className="px-6 py-1 text-sm font-bold uppercase tracking-[0.2em] text-white border-l-4"
                      style={{ 
                        backgroundColor: '#1a140f',
                        borderLeftColor: currentCharacter.color || '#8b7355'
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      onPointerUp={(e) => e.stopPropagation()}
                    >
                      {currentCharacter.name}
                    </div>
                    {isAudioEnabled && user?.email === 'jwalter1@gmail.com' && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 bg-white/10 backdrop-blur-sm text-white/60 hover:text-white hover:bg-white/20 rounded-none"
                        onPointerDown={(e) => e.stopPropagation()}
                        onPointerUp={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          unlockAudio();
                          handlePlayAudio(true);
                        }}
                        disabled={isAudioLoading}
                        title="Play/Regenerate Dialogue Audio"
                      >
                        {isAudioLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      </Button>
                    )}
                    {isAudioEnabled && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 bg-white/10 backdrop-blur-sm text-white/60 hover:text-white hover:bg-white/20 rounded-none"
                        onPointerDown={(e) => e.stopPropagation()}
                        onPointerUp={(e) => e.stopPropagation()}
                        onClick={togglePauseAudio}
                        title={isAudioPaused ? "Resume Audio" : "Pause Audio"}
                      >
                        {isAudioPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 bg-white/10 backdrop-blur-sm text-white/60 hover:text-white hover:bg-white/20 rounded-none"
                      onPointerDown={(e) => e.stopPropagation()}
                      onPointerUp={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsRegenerateModalOpen(true);
                      }}
                      title="Regenerate AI Portrait"
                    >
                      <Sparkles className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 bg-white/10 backdrop-blur-sm text-white/60 hover:text-white hover:bg-white/20 rounded-none"
                      onPointerDown={(e) => e.stopPropagation()}
                      onPointerUp={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSpriteHistoryOpen(true);
                      }}
                      title="Portrait History"
                    >
                      <History className="w-4 h-4" />
                    </Button>
                    {isAudioEnabled && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 bg-white/10 backdrop-blur-sm text-white/60 hover:text-white hover:bg-white/20 rounded-none"
                        onPointerDown={(e) => e.stopPropagation()}
                        onPointerUp={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCharForVoice({ id: currentCharacter.id, name: currentCharacter.name });
                          setIsCharVoiceSelectorOpen(true);
                        }}
                        title="Update Voice ID"
                      >
                        <Mic className="w-4 h-4" />
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <div 
                      className="px-6 py-1 text-sm font-bold uppercase tracking-[0.2em] text-white border-l-4"
                      style={{ backgroundColor: '#1a140f', borderLeftColor: '#8b7355' }}
                    >
                      Narrator
                    </div>
                    {isAudioEnabled && user?.email === 'jwalter1@gmail.com' && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 bg-white/10 backdrop-blur-sm text-white/60 hover:text-white hover:bg-white/20 rounded-none"
                        onPointerDown={(e) => e.stopPropagation()}
                        onPointerUp={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          unlockAudio();
                          handlePlayAudio(true);
                        }}
                        disabled={isAudioLoading}
                        title="Regenerate Narrator Audio"
                      >
                        {isAudioLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      </Button>
                    )}
                    {isAudioEnabled && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 bg-white/10 backdrop-blur-sm text-white/60 hover:text-white hover:bg-white/20 rounded-none"
                        onPointerDown={(e) => e.stopPropagation()}
                        onPointerUp={(e) => e.stopPropagation()}
                        onClick={togglePauseAudio}
                        title={isAudioPaused ? "Resume Audio" : "Pause Audio"}
                      >
                        {isAudioPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                      </Button>
                    )}
                    {isAudioEnabled && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 bg-white/10 backdrop-blur-sm text-white/60 hover:text-white hover:bg-white/20 rounded-none"
                        onPointerDown={(e) => e.stopPropagation()}
                        onPointerUp={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCharForVoice({ id: 'narrator', name: 'Narrator' });
                          setIsCharVoiceSelectorOpen(true);
                        }}
                        title="Update Narrator Voice ID"
                      >
                        <Mic className="w-4 h-4" />
                      </Button>
                    )}
                  </>
                )}
              </div>
              
              <Card 
                className={cn(
                  "bg-[#fdfbf7]/85 backdrop-blur-xl border-[#d4c5b0] p-6 md:p-12 flex flex-col group shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative transition-all duration-700",
                  "min-h-[180px] max-h-[50vh] md:max-h-[75vh] md:max-h-[650px]",
                  !currentCharacter && "italic text-gray-700 text-center border-2"
                )}
              >
                {/* Paper Texture Overlay */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
                
                <div className="flex-1 overflow-y-auto pr-2 md:pr-4 relative z-10 w-full h-full custom-scrollbar touch-pan-y flex flex-col">
                  <p 
                    ref={dialogueTextRef}
                    className={cn(
                      "leading-relaxed text-[#2c241a] selection:bg-[#d4c5b0]/30 pb-4 transition-all duration-500",
                      !currentCharacter ? "text-xl md:text-2xl font-light text-center my-auto" : "text-xl md:text-2xl font-medium",
                      currentDialogue.style === 'italic' && "italic"
                    )}
                  >
                    {currentDialogue.text}
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>

      {/* Bottom Controls - Always at the bottom */}
      <AnimatePresence>
        {!isDialogueHidden && !isScenePaused && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 right-0 p-8 z-[60] pointer-events-none"
          >
            <div 
              className="max-w-4xl mx-auto flex justify-between items-center px-2 pointer-events-auto"
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
            >
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white/60 hover:text-white hover:bg-white/10"
            onClick={prevDialogue}
            disabled={currentChapterIndex === 0 && currentSceneIndex === 0 && currentDialogueIndex === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {isAutoAdvance && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white/60 hover:text-white hover:bg-white/10 flex items-center gap-2 px-4 border border-white/10 hover:border-white/30 backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                if (isAudioPlaying || isAudioPaused) {
                  togglePauseAudio(e);
                } else {
                  setIsManualPaused(!isManualPaused);
                }
              }}
              title={isManualPaused ? "Resume auto-forwarding" : "Pause auto-forwarding"}
            >
              {isManualPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              <span className="uppercase tracking-[0.2em] text-[10px] font-bold">
                {isManualPaused ? 'Resume' : 'Pause'}
              </span>
            </Button>
          )}
          
          <div className="hidden md:flex gap-1">
            {currentScene.dialogue.map((_, idx) => (
              <button 
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStopAudio();
                  setCurrentDialogueIndex(idx);
                }}
                className={cn(
                  "w-1 h-1 rounded-full transition-all duration-300 hover:bg-white/80 cursor-pointer",
                  idx === currentDialogueIndex ? "bg-white w-4" : "bg-white/40"
                )}
                title={`Jump to Page ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white/60 hover:text-white hover:bg-white/10"
              onClick={(e) => {
                e.stopPropagation();
                handleStopAudio();
                setIsBookmarksOpen(true);
              }}
              title="View Bookmarks"
            >
              <BookmarkIcon className="w-4 h-4 mr-2" />
              Bookmarks
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white/60 hover:text-white hover:bg-white/10"
              onClick={nextDialogue}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Indicator */}
      <AnimatePresence>
        {!isDialogueHidden && !isScenePaused && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-0 left-0 h-1 bg-white/10 w-full"
          >
            <motion.div 
              className="h-full bg-white/40"
              initial={{ width: 0 }}
              animate={{ width: `${((currentDialogueIndex + 1) / (currentScene?.dialogue?.length || 1)) * 100}%` }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {renderModals()}
    </div>
  );

  function renderModals() {
    return (
      <>
        {/* Chapter Menu Overlay */}
        <AnimatePresence>
          {isChapterMenuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
            >
              <Card className="max-w-md w-full p-8 bg-white rounded-none shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Select Chapter</h2>
                  <Button variant="ghost" size="icon" onClick={() => setIsChapterMenuOpen(false)}>
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                </div>
                <div className="max-h-[50vh] overflow-y-auto custom-scrollbar pr-4">
                  <div className="space-y-2">
                    {chapters.map((chapter, index) => (
                      <Button
                        key={chapter.id}
                        variant="ghost"
                        className={cn(
                          "w-full justify-start text-left h-12 rounded-none hover:bg-gray-100",
                          index === currentChapterIndex && "bg-gray-100 font-bold main-chapter-selected"
                        )}
                        onClick={() => {
                          handleStopAudio();
                          setCurrentChapterIndex(index);
                          setCurrentSceneIndex(0);
                          setCurrentDialogueIndex(0);
                          setHistory([]);
                          setIsChapterMenuOpen(false);
                          setIsMenuOpen(false);
                        }}
                      >
                        <span className="font-bold mr-4">Chapter {chapter.id}</span>
                        <span className="text-gray-500 truncate">{chapter.title}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Modal */}
        <AnimatePresence>
          {isProgressOpen && selectedNovelId && (
            <ProgressView 
              novelId={selectedNovelId}
              chapters={chapters}
              version={novel?.version || 'abridged'}
              onClose={() => setIsProgressOpen(false)} 
              onJumpTo={(cIdx, sIdx) => {
                handleStopAudio();
                setCurrentChapterIndex(cIdx);
                setCurrentSceneIndex(sIdx);
                setCurrentDialogueIndex(0);
                setHistory([]);
                setIsProgressOpen(false);
                setIsMenuOpen(false);
              }}
              onReset={() => {
                const currentVersion = novel?.version || 'abridged';
                resetProgress(selectedNovelId, user?.uid, currentVersion);
                setProgressRefreshKey(prev => prev + 1);
                // Also reset current view if it's the current novel
                setCurrentChapterIndex(0);
                setCurrentSceneIndex(0);
                setCurrentDialogueIndex(0);
                setHistory([]);
              }}
              onRefresh={handleRefreshProgress}
            />
          )}
        </AnimatePresence>

        {/* Bookmarks Modal */}
        <AnimatePresence>
          {isBookmarksOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
            >
              <Card className="max-w-2xl w-full p-8 bg-white rounded-none shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Bookmarks</h2>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-gray-400 hover:text-[#1a1a1a]"
                      onClick={handleRefreshProgress}
                      title="Sync from cloud"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setIsBookmarksOpen(false)}>
                      <ChevronLeft className="w-6 h-6" />
                    </Button>
                  </div>
                </div>
                
                <div className="max-h-[60vh] pr-4 overflow-y-auto custom-scrollbar">
                  {bookmarks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
                      <BookmarkIcon className="w-12 h-12 opacity-20" />
                      <p>No bookmarks saved yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bookmarks.map((bookmark) => (
                        <div 
                          key={bookmark.id}
                          className="group relative border border-gray-100 p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => handleLoadBookmark(bookmark)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-bold text-[#2c241a]">{bookmark.chapterTitle}</h3>
                              <p className="text-xs text-gray-500 uppercase tracking-widest">{bookmark.sceneTitle}</p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-gray-300 hover:text-red-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteBookmark(bookmark.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-gray-600 italic">"{bookmark.previewText}"</p>
                          <p className="text-[10px] text-gray-400 mt-2">
                            {new Date(bookmark.timestamp).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button 
                  className="w-full mt-8 bg-[#1a1a1a] text-white rounded-none"
                  onClick={() => setIsBookmarksOpen(false)}
                >
                  Close
                </Button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Image Generator Modal */}
        <AnimatePresence>
          {isImageGeneratorOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              onClick={() => setIsImageGeneratorOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-4xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-4 right-4 text-gray-500 hover:text-black z-10"
                    onClick={() => setIsImageGeneratorOpen(false)}
                  >
                    <ChevronDown className="w-6 h-6 rotate-180" />
                  </Button>
                  <ImageGenerator 
                    novelId={selectedNovelId || 'great-gatsby'} 
                    onComplete={loadS3Backgrounds} 
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Character Voice Selection Modal */}
        <AnimatePresence>
          {isCharVoiceSelectorOpen && selectedCharForVoice && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              onClick={() => setIsCharVoiceSelectorOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white w-full max-w-lg shadow-2xl rounded-none overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mic className="w-6 h-6 text-[#8b7355]" />
                    <h2 className="text-xl font-bold font-serif">Voice ID: {selectedCharForVoice.name}</h2>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsCharVoiceSelectorOpen(false)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="p-6 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Current Voice ID</label>
                    <div className="flex gap-2">
                       <input 
                        type="text"
                        className="flex-1 bg-gray-50 border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#8b7355]"
                        placeholder={ELEVENLABS_VOICES[selectedCharForVoice.id] || ELEVENLABS_VOICES['narrator']}
                        value={voiceIdOverrides[selectedCharForVoice.id] || ''}
                        onChange={(e) => setVoiceIdOverrides(prev => ({ ...prev, [selectedCharForVoice.id]: e.target.value }))}
                      />
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="rounded-none px-4"
                        onClick={() => {
                          setVoiceIdOverrides(prev => {
                            const next = { ...prev };
                            delete next[selectedCharForVoice.id];
                            return next;
                          });
                        }}
                      >
                        Reset
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500">ElevenLabs Library</label>
                    <div className="max-h-64 overflow-y-auto custom-scrollbar border border-gray-100 bg-gray-50/50">
                      {isFetchingVoices ? (
                        <div className="p-12 flex flex-col items-center justify-center gap-3 text-gray-400">
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span className="text-[10px] uppercase tracking-widest">Fetching Voices...</span>
                        </div>
                      ) : elevenLabsVoices.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">
                          <span className="text-[10px] uppercase tracking-widest">No Voices Found or API Key Missing</span>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {groupedElevenLabsVoices.map(([category, voices]) => (
                            <div key={category} className="space-y-1">
                              <div className="bg-gray-100/80 px-3 py-1.5 sticky top-0 z-10">
                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">{category}</span>
                              </div>
                              <div className="divide-y divide-gray-50">
                                {voices.map((voice: any) => (
                                  <div 
                                    key={voice.voice_id} 
                                    className={cn(
                                      "p-3 flex items-center justify-between hover:bg-white cursor-pointer transition-colors",
                                      voiceIdOverrides[selectedCharForVoice.id] === voice.voice_id && "bg-white border-l-4 border-l-[#8b7355]"
                                    )}
                                    onClick={() => setVoiceIdOverrides(prev => ({ ...prev, [selectedCharForVoice.id]: voice.voice_id }))}
                                  >
                                    <div className="flex flex-col">
                                      <span className={cn("text-sm font-medium", voiceIdOverrides[selectedCharForVoice.id] === voice.voice_id && "text-[#8b7355]")}>
                                        {voice.name}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[8px] text-gray-400 font-mono uppercase tracking-tighter">
                                          {voice.labels?.accent || 'Unknown'} / {voice.labels?.gender || 'Voice'}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:text-[#8b7355]"
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          const base64 = await generateSpeech("Hello, this is " + voice.name + ".", selectedCharForVoice.id, 'ElevenLabs', false, undefined, undefined, voice.voice_id);
                                          if (base64) playAudio(base64, readingSpeed);
                                        }}
                                      >
                                        <Volume2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100">
                  <Button 
                    className="w-full rounded-none bg-[#1a1a1a] text-white uppercase tracking-widest text-[10px] h-12"
                    onClick={() => setIsCharVoiceSelectorOpen(false)}
                  >
                    Done
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Voice Settings Modal */}
        <AnimatePresence>
          {isVoiceSettingsOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              onClick={() => setIsVoiceSettingsOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white/95 backdrop-blur-md w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl rounded-none overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-6 h-6 text-primary" />
                    <h2 className="text-2xl font-bold font-serif">Voice Settings</h2>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsVoiceSettingsOpen(false)}>
                    <ChevronDown className="w-6 h-6 rotate-180" />
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  <div className="space-y-8">
                    {/* Global Narrator Voice */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <BookOpen className="w-5 h-5" /> Narrator Voice
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        {AVAILABLE_VOICES.map(voice => (
                          <Button
                            key={voice}
                            variant={voiceOverrides['narrator'] === voice || (!voiceOverrides['narrator'] && CHARACTER_VOICES['narrator'] === voice) ? 'default' : 'outline'}
                            className="h-auto py-3 flex flex-col gap-1 rounded-none"
                            onClick={() => setVoiceOverrides(prev => ({ ...prev, narrator: voice }))}
                          >
                            <span className="text-sm font-bold">{voice}</span>
                            <div 
                              className="mt-1 p-1 hover:bg-white/20 rounded-full flex items-center gap-1"
                              onClick={async (e) => {
                                e.stopPropagation();
                                const base64 = await generateSpeech("This is a preview of the " + voice + " voice.", "narrator", voice, false, undefined, "male");
                                if (base64) playAudio(base64, readingSpeed);
                              }}
                            >
                              <Volume2 className="w-3 h-3" />
                              <span className="text-[10px] uppercase tracking-tighter">Preview</span>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Character Specific Voices */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <UserIcon className="w-5 h-5" /> Character Voices
                      </h3>
                      <div className="space-y-6">
                        {Object.entries(characters).map(([id, char]: [string, any]) => (
                          <div key={id} className="p-4 bg-gray-50/50 border border-gray-100 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-medium" style={{ color: char.color }}>{char.name}</span>
                              <span className="text-[10px] uppercase tracking-widest text-gray-400">Default: {CHARACTER_VOICES[id] || 'ElevenLabs'}</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                              {AVAILABLE_VOICES.map(voice => (
                                <Button
                                  key={voice}
                                  size="sm"
                                  variant={voiceOverrides[id] === voice || (!voiceOverrides[id] && (CHARACTER_VOICES[id] === voice || (!CHARACTER_VOICES[id] && voice === 'ElevenLabs'))) ? 'default' : 'outline'}
                                  className="text-[10px] h-8 rounded-none flex items-center justify-between px-2"
                                  onClick={() => setVoiceOverrides(prev => ({ ...prev, [id]: voice }))}
                                >
                                  {voice}
                                  <div 
                                    className="p-1 hover:bg-white/20 rounded-full"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      const base64 = await generateSpeech("Hello, I am " + char.name + ".", id, voice, false, undefined, char.gender);
                                      if (base64) playAudio(base64, readingSpeed);
                                    }}
                                  >
                                    <Volume2 className="w-3 h-3" />
                                  </div>
                                </Button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-col gap-4 shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold uppercase tracking-widest text-gray-500">Cloud Sync</span>
                      <span className="text-[10px] text-gray-400 italic">Sync local audio & sprites to S3</span>
                    </div>
                    <Button 
                      variant="outline"
                      size="sm"
                      className="rounded-none border-gray-200 flex items-center gap-2 h-10 px-4"
                      onClick={migrateAssetsToS3}
                      disabled={isMigrating}
                    >
                      {isMigrating ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          {migrationProgress}%
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" />
                          Sync to S3
                        </>
                      )}
                    </Button>
                  </div>
                  {isMigrating && (
                    <p className="text-[10px] text-gray-400 text-center italic">
                      {migrationStatus}
                    </p>
                  )}
                  <Button onClick={() => setIsVoiceSettingsOpen(false)} className="w-full rounded-none h-12 bg-[#1a1a1a] text-white uppercase tracking-widest text-xs">
                    Save & Close
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {isSettingsOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
            >
              <Card className="max-w-md w-full max-h-[90vh] flex flex-col bg-white rounded-none shadow-2xl border-none overflow-hidden">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center shrink-0">
                  <h2 className="text-3xl font-bold tracking-tighter uppercase">Settings</h2>
                  <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(false)}>
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  <div className="space-y-8">
                    {/* Reading Speed */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-bold uppercase tracking-widest text-gray-500">Reading Speed</label>
                        <span className="font-mono text-lg bg-gray-100 px-2 py-1">{readingSpeed.toFixed(1)}x</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.5" 
                        max="2.0" 
                        step="0.1"
                        value={readingSpeed}
                        onChange={(e) => setReadingSpeed(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1a1a1a]"
                      />
                      <div className="flex justify-between text-[10px] uppercase tracking-tighter text-gray-400">
                        <span>Slower</span>
                        <span>Normal</span>
                        <span>Faster</span>
                      </div>
                    </div>

                    {/* Auto Advance */}
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-bold uppercase tracking-widest text-gray-500">Auto-Advance</label>
                        <Button 
                          variant={isAutoAdvance ? "default" : "outline"}
                          size="sm"
                          className={cn("rounded-none uppercase tracking-widest text-[10px]", isAutoAdvance ? "bg-[#1a1a1a]" : "")}
                          onClick={() => setIsAutoAdvance(!isAutoAdvance)}
                        >
                          {isAutoAdvance ? "Enabled" : "Disabled"}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-400 italic">Automatically proceed to the next dialogue when audio finishes.</p>
                      
                      {isAutoAdvance && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-4 pt-2"
                        >
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-widest">Delay After Audio</label>
                            <span className="font-mono text-sm">{autoAdvanceDelay.toFixed(1)}s</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="5.0" 
                            step="0.5"
                            value={autoAdvanceDelay}
                            onChange={(e) => setAutoAdvanceDelay(parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#1a1a1a]"
                          />
                        </motion.div>
                      )}
                    </div>

                    {/* Audio Toggle */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                      <label className="text-sm font-bold uppercase tracking-widest text-gray-500">Voice Narration</label>
                      <Button 
                        variant={isAudioEnabled ? "default" : "outline"}
                        size="sm"
                        className={cn("rounded-none uppercase tracking-widest text-[10px]", isAudioEnabled ? "bg-[#1a1a1a]" : "")}
                        onClick={() => {
                          if (isAudioEnabled) handleStopAudio();
                          setIsAudioEnabled(!isAudioEnabled);
                        }}
                      >
                        {isAudioEnabled ? "On" : "Off"}
                      </Button>
                    </div>

                    {/* Voice Selection */}
                    <div className="pt-4 border-t border-gray-100">
                      <label className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4 block">Audio</label>
                      <Button 
                        variant="outline"
                        className="w-full rounded-none border-gray-200 flex items-center justify-center gap-2 h-12 hover:bg-gray-50"
                        onClick={() => {
                          setIsSettingsOpen(false);
                          setIsVoiceSettingsOpen(true);
                        }}
                      >
                        <Volume2 className="w-4 h-4" />
                        Character Voice Settings
                      </Button>
                    </div>

                    {/* Background Selection */}
                    <div className="pt-4 border-t border-gray-100">
                      <label className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4 block">Visuals</label>
                      <Button 
                        variant="outline"
                        className="w-full rounded-none border-gray-200 flex items-center justify-center gap-2 h-12 hover:bg-gray-50"
                        onClick={() => {
                          setIsSettingsOpen(false);
                          setIsBackgroundSelectorOpen(true);
                        }}
                      >
                        <ImageIcon className="w-4 h-4" />
                        Change Scene Background
                      </Button>
                    </div>

                    <div className="pt-6 border-t border-gray-100">
                      <label className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4 block">Cloud Persistence</label>
                      <Button 
                        variant="outline"
                        className="w-full rounded-none border-gray-200 flex items-center justify-center gap-2 h-12"
                        onClick={migrateAssetsToS3}
                        disabled={isMigrating}
                      >
                        {isMigrating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Migrating ({migrationProgress}%)
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Sync Local Cache to S3
                          </>
                        )}
                      </Button>
                      {isMigrating && (
                        <p className="text-[10px] text-gray-400 mt-2 text-center italic">
                          {migrationStatus}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-8 border-t border-gray-100 shrink-0">
                  <Button 
                    className="w-full h-14 bg-[#1a1a1a] text-white rounded-none uppercase tracking-[0.2em] text-sm hover:bg-gray-800 transition-colors"
                    onClick={() => setIsSettingsOpen(false)}
                  >
                    Apply & Close
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message Toast */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[120]"
            >
              <div className="bg-red-900/90 backdrop-blur-md text-white px-6 py-3 rounded-none border border-red-500/50 shadow-2xl flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium tracking-wide">{errorMessage}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Portrait History Modal */}
        <AnimatePresence>
          {isRegenerateModalOpen && currentCharacter && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
            >
              <Card className="max-w-md w-full p-8 bg-white rounded-none shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Regenerate Portrait</h2>
                    <p className="text-sm text-gray-500 uppercase tracking-widest">{currentCharacter.name}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsRegenerateModalOpen(false)}>
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Additional Instructions</label>
                    <textarea 
                      className="w-full h-32 p-4 bg-gray-50 border border-gray-100 rounded-none focus:outline-none focus:border-[#d4c5b0] transition-colors resize-none font-sans text-sm"
                      placeholder="e.g. 'Wearing a hat', 'Looking angry', 'In the rain'..."
                      value={spritePromptAddition}
                      onChange={(e) => setSpritePromptAddition(e.target.value)}
                    />
                    <p className="text-[10px] text-gray-400 italic">These instructions will be appended to the base artistic prompt.</p>
                  </div>
                </div>

                <div className="mt-8 flex gap-4">
                  <Button 
                    variant="outline"
                    className="flex-1 rounded-none border-gray-200"
                    onClick={() => {
                      setIsRegenerateModalOpen(false);
                      setSpritePromptAddition('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1 bg-[#1a1a1a] text-white rounded-none flex items-center justify-center gap-2"
                    onClick={() => {
                      generateSprite(currentCharacter.id, true, spritePromptAddition);
                      setIsRegenerateModalOpen(false);
                      setSpritePromptAddition('');
                    }}
                  >
                    <Sparkles className="w-4 h-4" />
                    Regenerate
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Portrait History Modal */}
        <AnimatePresence>
          {isSpriteHistoryOpen && currentCharacter && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
            >
              <Card className="max-w-4xl w-full p-8 bg-white rounded-none shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Portrait History</h2>
                    <p className="text-sm text-gray-500 uppercase tracking-widest">{currentCharacter.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-[10px] font-bold uppercase tracking-widest border-[#d4c5b0] hover:bg-[#f5f0e5] h-8"
                      onClick={() => loadS3Sprites()}
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Sync Cloud
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setIsSpriteHistoryOpen(false)}>
                      <ChevronLeft className="w-6 h-6" />
                    </Button>
                  </div>
                </div>
                
                <div className="max-h-[70vh] overflow-y-auto custom-scrollbar pr-4">
                  {(() => {
                    const currentHistory = spriteHistory[currentCharacter.id] || [];
                    const activeSprite = spriteOverrides[currentCharacter.id] || generatedSprites[currentCharacter.id];
                    const defaultSprite = currentCharacter.image;
                    
                    // Combine them ensuring uniqueness, putting current active at the start
                    let displayList = [];
                    if (activeSprite) displayList.push(activeSprite);
                    displayList.push(...currentHistory);
                    if (defaultSprite) displayList.push(defaultSprite);
                    
                    // Remove duplicates
                    displayList = Array.from(new Set(displayList));

                    if (displayList.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4 py-20">
                          <History className="w-12 h-12 opacity-20" />
                          <p>No previous portraits found.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-[#2c241a]">
                        {displayList.map((img, idx) => {
                          const isActive = activeSprite === img || (!activeSprite && currentCharacter.image === img);
                          return (
                            <div 
                              key={idx}
                              className={cn(
                                "relative aspect-[3/4] cursor-pointer group border-4 transition-all duration-300",
                                isActive ? "border-[#d4c5b0]" : "border-transparent hover:border-gray-200"
                              )}
                              onClick={async () => {
                                // Fast update
                                setSpriteOverrides(prev => ({ ...prev, [currentCharacter.id]: img }));
                                setGeneratedSprites(prev => ({ ...prev, [currentCharacter.id]: img }));
                                
                                // Process upload if it's base64, then update with real URL
                                let finalUrl = img;
                                try {
                                  if (img.startsWith('data:')) {
                                    const base64Data = img.split(',')[1];
                                    const s3Res = await fetch('/api/s3/upload', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        key: `novels/${selectedNovelId}/sprites/${currentCharacter.id}.png`,
                                        base64Data,
                                        contentType: 'image/png'
                                      })
                                    });
                                    if (s3Res.ok) {
                                      const s3Data = await s3Res.json();
                                      finalUrl = s3Data.url;
                                    }
                                  }
                                } catch (e) {
                                  console.error("Failed to update active sprite in S3:", e);
                                }
                                
                                setSpriteOverrides(prev => ({ ...prev, [currentCharacter.id]: finalUrl }));
                                setGeneratedSprites(prev => ({ ...prev, [currentCharacter.id]: finalUrl }));
                                await saveToCache('sprites', currentCharacter.id, finalUrl);
                                
                                setIsSpriteHistoryOpen(false);
                              }}
                            >
                              <img 
                                src={img || undefined} 
                                alt={`${currentCharacter.name} portrait ${idx + 1}`}
                                className="w-full h-full object-cover grayscale-[0.05] sepia-[0.05]"
                                referrerPolicy="no-referrer"
                              />
                              {img === currentCharacter.image && (
                                <div className="absolute top-2 left-2 px-2 py-1 bg-white/90 backdrop-blur-sm text-[8px] font-bold uppercase tracking-widest text-[#d4c5b0] border border-[#d4c5b0] z-20">
                                  Default
                                </div>
                              )}
                              {isActive && (
                                <div className="absolute top-2 right-2 bg-[#d4c5b0] text-white p-1 rounded-full shadow-lg z-20">
                                  <Check className="w-3 h-3" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                                <span className="text-white text-[10px] font-bold uppercase tracking-widest">Select Portrait</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                <div className="mt-8 flex gap-4">
                  <Button 
                    variant="outline"
                    className="flex-1 rounded-none border-gray-200"
                    onClick={() => setIsSpriteHistoryOpen(false)}
                  >
                    Close
                  </Button>
                  <Button 
                    className="flex-1 bg-[#1a1a1a] text-white rounded-none"
                    onClick={() => {
                      setIsSpriteHistoryOpen(false);
                      setIsRegenerateModalOpen(true);
                    }}
                  >
                    Generate New
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Modal */}
        <AnimatePresence>
          {isNavOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
            >
              <Card className="max-w-md w-full p-8 bg-white rounded-none shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Jump to Page</h2>
                  <Button variant="ghost" size="icon" onClick={() => setIsNavOpen(false)}>
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500 uppercase tracking-widest">Dialogue Step</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="range" 
                        min="0" 
                        max={currentScene.dialogue.length - 1} 
                        value={currentDialogueIndex}
                        onChange={(e) => {
                          handleStopAudio();
                          setCurrentDialogueIndex(parseInt(e.target.value));
                        }}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1a1a1a]"
                      />
                      <span className="font-mono text-lg w-12 text-center">
                        {currentDialogueIndex + 1} / {currentScene.dialogue.length}
                      </span>
                    </div>
                  </div>

                  {currentChapter.scenes.length > 1 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500 uppercase tracking-widest">Scene</label>
                      <div className="grid grid-cols-1 gap-2">
                        {currentChapter.scenes.map((scene, idx) => (
                          <Button
                            key={idx}
                            variant={idx === currentSceneIndex ? "default" : "outline"}
                            className="justify-start rounded-none"
                            onClick={() => {
                              handleStopAudio();
                              setCurrentSceneIndex(idx);
                              setCurrentDialogueIndex(0);
                            }}
                          >
                            {scene.title}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Button 
                  className="w-full mt-8 bg-[#1a1a1a] text-white rounded-none"
                  onClick={() => setIsNavOpen(false)}
                >
                  Close
                </Button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isAdminOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed inset-0 z-[200] overflow-y-auto bg-black/80 backdrop-blur-sm p-4 md:p-10"
              onClick={() => setIsAdminOpen(false)}
            >
              <div className="max-w-4xl mx-auto relative" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-white hover:bg-white/20 rounded-full"
                    onClick={() => setIsAdminOpen(false)}
                  >
                    <X className="w-6 h-6" />
                  </Button>
                </div>
                <AdminPanel 
                  novels={allMetadata} 
                  user={user} 
                  assetVersion={assetVersion}
                  onUpdateAssetVersion={setAssetVersion}
                  pageImageOverrides={pageImageOverrides}
                  sceneImageOverrides={sceneImageOverrides}
                  sceneBackgroundOverrides={sceneBackgroundOverrides}
                  backgroundOverrides={backgroundOverrides}
                  onSetPageImageOverrides={setPageImageOverrides}
                  onSetSceneImageOverrides={setSceneImageOverrides}
                  onSetSceneBackgroundOverrides={setSceneBackgroundOverrides}
                  onSetBackgroundOverrides={setBackgroundOverrides}
                  selectedNovelId={selectedNovelId}
                  onSelectNovel={setSelectedNovelId}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <BackgroundSelector 
          isOpen={isBackgroundSelectorOpen && !!currentScene}
          onClose={() => setIsBackgroundSelectorOpen(false)}
          currentSceneId={currentScene?.id || ''}
          currentPageIndex={currentDialogueIndex}
          chapters={chapters}
          sceneImageOverrides={sceneImageOverrides}
          pageImageOverrides={pageImageOverrides}
          pageBackgroundHistory={pageBackgroundHistory}
          onGenerate={(sceneId, url) => {
            setSceneBackgroundOverrides(prev => {
              const next = { ...prev };
              delete next[sceneId];
              return next;
            });
            setSceneImageOverrides(prev => ({
              ...prev,
              [sceneId]: url
            }));
          }}
          onGeneratePage={(sceneId, pageIndex, url) => {
            setPageImageOverrides(prev => ({
              ...prev,
              [`${sceneId}_${pageIndex}`]: url
            }));
            setPageBackgroundHistory(prev => {
              const next = { ...prev };
              if (!next[sceneId]) next[sceneId] = [];
              // Only add if it doesn't already exist in the history to prevent duplication
              if (!next[sceneId].includes(url)) {
                // Add to start since we want newest first visually
                next[sceneId] = [url, ...next[sceneId]];
              }
              return next;
            });
          }}
          onReset={(sceneId) => {
            setSceneBackgroundOverrides(prev => {
              const next = { ...prev };
              delete next[sceneId];
              return next;
            });
            setSceneImageOverrides(prev => {
              const next = { ...prev };
              delete next[sceneId];
              return next;
            });
          }}
          onResetPage={(sceneId, pageIndex) => {
            setPageImageOverrides(prev => {
              const next = { ...prev };
              delete next[`${sceneId}_${pageIndex}`];
              return next;
            });
          }}
          onDelete={handleDeleteBackground}
          onRefresh={handleRefreshAssets}
          novelId={selectedNovelId || 'great-gatsby'}
        />
      </>
    );
  }
}
