import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Check, Sparkles, Loader2, ChevronDown, Edit3, Trash2, RefreshCw } from 'lucide-react';
import { CachedAsset } from './CachedAsset';
import { cn } from '@/lib/utils';
import { generateImage, uploadToS3, uploadMetadata } from '../services/imageService';
import { loadNovelPromptConfig, loadScenePromptConfig } from '../services/promptsService';
import { Chapter, Scene } from '../types';
import { NOVEL_THEMES } from '../data/thematicBackgrounds';
import { Textarea } from '@/components/ui/textarea';
import { NOVELS_METADATA } from '../data/bookData';

interface BackgroundSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  currentSceneId: string;
  currentPageIndex?: number;
  chapters: Chapter[];
  sceneImageOverrides: Record<string, string>;
  pageImageOverrides?: Record<string, string>;
  pageBackgroundHistory?: Record<string, string[]>;
  onGenerate: (sceneId: string, url: string) => void;
  onGeneratePage?: (sceneId: string, pageIndex: number, url: string) => void;
  onReset: (sceneId: string) => void;
  onResetPage?: (sceneId: string, pageIndex: number) => void;
  onDelete: (type: 'scene' | 'page' | 'all' | 'history', id: string, pageIndex?: number, url?: string) => void;
  onRefresh?: () => Promise<void>;
  novelId?: string;
}

export function BackgroundSelector({
  isOpen,
  onClose,
  currentSceneId,
  currentPageIndex = 0,
  chapters,
  sceneImageOverrides,
  pageImageOverrides = {},
  pageBackgroundHistory = {},
  onGenerate,
  onGeneratePage,
  onReset,
  onResetPage,
  onDelete,
  onRefresh,
  novelId = 'great-gatsby'
}: BackgroundSelectorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSceneId, setSelectedSceneId] = useState(currentSceneId);
  const [selectedPageIndex, setSelectedPageIndex] = useState(currentPageIndex);
  const [scope, setScope] = useState<'scene' | 'page'>('page');
  const [isSceneMenuOpen, setIsSceneMenuOpen] = useState(false);
  const [isPageMenuOpen, setIsPageMenuOpen] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [fullImage, setFullImage] = useState<string | null>(null);
  const [imageRefreshKey, setImageRefreshKey] = useState(Date.now());

  // Sync selectedSceneId with currentSceneId when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedSceneId(currentSceneId);
      setSelectedPageIndex(currentPageIndex);
      setScope('page');
      setIsConfirmingClear(false);
    }
  }, [isOpen, currentSceneId, currentPageIndex]);

  // Auto-scroll logic for Scene Menu
  React.useEffect(() => {
    if (isSceneMenuOpen) {
      setTimeout(() => {
        const selected = document.querySelector('.am-scene-selected');
        const container = selected?.closest('.custom-scrollbar');
        if (selected && container) {
          container.scrollTop = (selected as HTMLElement).offsetTop - container.clientHeight / 2 + (selected as HTMLElement).clientHeight / 2;
        }
      }, 150);
    }
  }, [isSceneMenuOpen]);

  // Auto-scroll logic for Page Menu
  React.useEffect(() => {
    if (isPageMenuOpen) {
      setTimeout(() => {
        const selected = document.querySelector('.am-page-selected');
        const container = selected?.closest('.custom-scrollbar');
        if (selected && container) {
          container.scrollTop = (selected as HTMLElement).offsetTop - container.clientHeight / 2 + (selected as HTMLElement).clientHeight / 2;
        }
      }, 150);
    }
  }, [isPageMenuOpen]);

  // Flatten all scenes for easy lookup
  const allScenes = useMemo(() => {
    return chapters.flatMap(ch => ch.scenes.map(s => ({ ...s, chapterTitle: ch.title })));
  }, [chapters]);

  const selectedScene = allScenes.find(s => s.id === selectedSceneId) || allScenes.find(s => s.id === currentSceneId) || allScenes[0] || null;

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const sanitizeS3Url = (url: string) => {
    if (url && url.includes('amazonaws.com')) {
      try {
        const urlObj = new URL(url);
        const key = urlObj.pathname.substring(1); // Remove leading slash
        return `/api/s3/get?key=${encodeURIComponent(key)}`;
      } catch (e) {
        return url;
      }
    }
    return url;
  };

  const getBustedUrl = (url: string | null | undefined) => {
    if (!url) return undefined;
    const sanitized = sanitizeS3Url(url);
    const sep = sanitized.includes('?') ? '&' : '?';
    return `${sanitized}${sep}v=${imageRefreshKey}`;
  };

  const getOriginalBackgroundUrl = (bg: string) => {
    if (!bg) return '';
    if (bg.includes('http')) return sanitizeS3Url(bg);
    
    // Check if it's a theme key
    const theme = NOVEL_THEMES[novelId];
    if (theme && theme[bg]) return theme[bg];
    
    // Fallback to default for this novel
    if (theme && theme['default']) return theme['default'];
    
    // Last resort local path
    return `/images/backgrounds/${bg}.png`;
  };

  const [imageErrorCount, setImageErrorCount] = React.useState<Record<string, number>>({});

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, sceneId: string, type: 'original' | 'generated') => {
    const target = e.target as HTMLImageElement;
    const errorKey = `${sceneId}-${type}`;
    const count = (imageErrorCount[errorKey] || 0) + 1;
    
    if (count > 2) {
      // Prevent infinite loops
      target.src = `https://picsum.photos/seed/${sceneId}/400/225?blur=5`;
      return;
    }

    setImageErrorCount(prev => ({ ...prev, [errorKey]: count }));

    // For original background, try default theme then picsum
    if (type === 'original') {
      const defaultThemedUrl = novelId ? NOVEL_THEMES[novelId]?.['default'] : null;
      if (defaultThemedUrl && target.src !== defaultThemedUrl) {
        target.src = defaultThemedUrl;
        return;
      }
    }
    
    target.src = `https://picsum.photos/seed/${sceneId}/400/225?blur=2`;
  };

  // Update prompt when scene/scope changes
  React.useEffect(() => {
    const updatePrompt = async () => {
      // Only update if the selector is actually open
      if (isOpen && selectedScene) {
        const chapterMatch = selectedScene.chapterTitle.match(/Chapter\s+(\d+)/i);
        const chapterNum = chapterMatch ? `Chapter ${chapterMatch[1]}` : selectedScene.chapterTitle;
        
        const metadata = NOVELS_METADATA.find(n => n.id === novelId);
        const novelTitle = metadata?.title || 'Novel';
        
        // Get managed prompt
        const sceneConfig = await loadScenePromptConfig(novelId, selectedScene.id);
        const novelConfig = await loadNovelPromptConfig(novelId);
        const stylePrompt = sceneConfig?.promptOverride || novelConfig?.stylePrompt || metadata?.stylePrompt || 'High quality, detailed, atmospheric lighting.';
        
        let contextSnippet = '';
        if (scope === 'scene') {
          // Get a snippet of the first few lines of dialogue for better context
          contextSnippet = selectedScene.dialogue
            .slice(0, 3)
            .map(d => d.text)
            .join(' ')
            .substring(0, 150);
        } else {
          // Get the precise page text
          contextSnippet = selectedScene.dialogue[selectedPageIndex]?.text || '';
          // Ensure it's not overly huge but pages might be big
          contextSnippet = contextSnippet.substring(0, 300);
        }
        
        setCustomPrompt(`From ${novelTitle}, ${chapterNum}: ${selectedScene.title}. ${contextSnippet}... ${stylePrompt}`);
      }
    };
    
    updatePrompt();
  }, [isOpen, selectedScene?.id, selectedScene?.title, selectedScene?.chapterTitle, novelId, scope, selectedPageIndex]);

  const currentImageOverride = selectedScene ? sceneImageOverrides[selectedScene.id] : undefined;
  const currentPageImageOverride = selectedScene ? pageImageOverrides[`${selectedScene.id}_${selectedPageIndex}`] : undefined;
  
  const handleGenerate = async () => {
    if (!customPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const base64 = await generateImage(customPrompt);
      if (scope === 'scene') {
        const url = await uploadToS3(`novels/${novelId}/scenes/${selectedScene.id}_${Date.now()}.png`, base64);
        
        // Save prompt metadata
        try {
          const metaKey = url.includes('key=') 
            ? decodeURIComponent(url.split('key=')[1].split('&')[0]).replace('.png', '.json')
            : `novels/${novelId}/scenes/${selectedScene.id}_${Date.now()}.json`;
          await uploadMetadata(metaKey, { prompt: customPrompt, generatedAt: new Date().toISOString(), novelId, sceneId: selectedScene.id });
        } catch (e) {
          console.warn("Failed to save background metadata:", e);
        }

        onGenerate(selectedScene.id, url);
      } else {
        const url = await uploadToS3(`novels/${novelId}/pages/${selectedScene.id}_${selectedPageIndex}_${Date.now()}.png`, base64);

        // Save prompt metadata
        try {
          const metaKey = url.includes('key=') 
            ? decodeURIComponent(url.split('key=')[1].split('&')[0]).replace('.png', '.json')
            : `novels/${novelId}/pages/${selectedScene.id}_${selectedPageIndex}_${Date.now()}.json`;
          await uploadMetadata(metaKey, { prompt: customPrompt, generatedAt: new Date().toISOString(), novelId, sceneId: selectedScene.id, pageIndex: selectedPageIndex });
        } catch (e) {
          console.warn("Failed to save page background metadata:", e);
        }

        onGeneratePage?.(selectedScene.id, selectedPageIndex, url);
      }
    } catch (error: any) {
      console.error("Generation failed:", error);
      alert(`Failed to generate background. ${error?.message || "Please try again."}`);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm cursor-pointer"
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Card 
        className="w-full max-w-5xl bg-[#fdfbf7] border-[#d4c5b0] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#d4c5b0] bg-[#f5f0e5]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold font-serif text-[#2c241a]">Asset Manager</h2>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-[#8b7355] hover:bg-[#8b7355] hover:text-white rounded-none border border-[#d4c5b0]"
                  onClick={handleRefresh}
                  disabled={isRefreshing || !onRefresh}
                  title="Sync with S3"
                >
                  <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                </Button>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Scope Toggle */}
                <div className="flex bg-[#e8dec9] p-1 rounded-sm gap-1">
                  <button
                    onClick={() => setScope('scene')}
                    className={cn(
                      "px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors",
                      scope === 'scene' ? "bg-white text-[#2c241a] shadow-sm" : "text-[#5c4d3c] hover:bg-white/50"
                    )}
                  >
                    Scene Level
                  </button>
                  <button
                    onClick={() => setScope('page')}
                    className={cn(
                      "px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors",
                      scope === 'page' ? "bg-white text-[#2c241a] shadow-sm" : "text-[#5c4d3c] hover:bg-white/50"
                    )}
                  >
                    Page Level
                  </button>
                </div>

                {/* Scene Selector Dropdown */}
                <div className="relative">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setIsSceneMenuOpen(!isSceneMenuOpen);
                      setIsPageMenuOpen(false);
                    }}
                    className="bg-white border-[#d4c5b0] text-[#2c241a] rounded-none flex items-center gap-2 h-8 px-3 text-xs"
                  >
                    <span className="opacity-60">{selectedScene?.chapterTitle || 'Chapter'}:</span>
                    <span className="font-bold">{selectedScene?.title || 'Loading...'}</span>
                    <ChevronDown className={cn("w-3 h-3 transition-transform", isSceneMenuOpen && "rotate-180")} />
                  </Button>

                  {isSceneMenuOpen && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-[#d4c5b0] shadow-xl z-[120] max-h-60 overflow-y-auto custom-scrollbar">
                      {chapters.map(chapter => (
                        <div key={chapter.id} className="border-b border-gray-100 last:border-0">
                          <div className="px-3 py-1 bg-gray-50 text-[10px] uppercase tracking-widest text-[#8b7355] font-bold">
                            Chapter {chapter.id}: {chapter.title}
                          </div>
                          {chapter.scenes.map(scene => (
                            <button
                              key={scene.id}
                              className={cn(
                                "w-full text-left px-4 py-2 text-sm hover:bg-[#f5f0e5] transition-colors",
                                scene.id === selectedSceneId ? "bg-[#f5f0e5] font-bold text-[#2c241a] am-scene-selected" : "text-[#5c4d3c]"
                              )}
                              onClick={() => {
                                setSelectedSceneId(scene.id);
                                setSelectedPageIndex(0); // Reset page on scene change
                                setIsSceneMenuOpen(false);
                              }}
                            >
                              {scene.title}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Page Selector Dropdown */}
                {scope === 'page' && selectedScene && (
                  <div className="relative">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setIsPageMenuOpen(!isPageMenuOpen);
                        setIsSceneMenuOpen(false);
                      }}
                      className="bg-white border-[#d4c5b0] text-[#2c241a] rounded-none flex items-center gap-2 h-8 px-3 text-xs min-w-[120px]"
                    >
                      <span className="opacity-60">Page:</span>
                      <span className="font-bold">{selectedPageIndex + 1}</span>
                      <ChevronDown className={cn("w-3 h-3 transition-transform", isPageMenuOpen && "rotate-180")} />
                    </Button>

                    {isPageMenuOpen && (
                      <div className="absolute top-full left-0 mt-1 w-32 bg-white border border-[#d4c5b0] shadow-xl z-[120] max-h-60 overflow-y-auto custom-scrollbar">
                        {selectedScene.dialogue.map((_, idx) => (
                          <button
                            key={idx}
                            className={cn(
                              "w-full text-left px-4 py-2 text-sm hover:bg-[#f5f0e5] transition-colors",
                              idx === selectedPageIndex ? "bg-[#f5f0e5] font-bold text-[#2c241a] am-page-selected" : "text-[#5c4d3c]"
                            )}
                            onClick={() => {
                              setSelectedPageIndex(idx);
                              setIsPageMenuOpen(false);
                            }}
                          >
                            Page {idx + 1}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
                className="text-[#5c4d3c] hover:bg-[#e8dec9] rounded-none"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Scene Info */}
            <div className="space-y-3 p-4 bg-white/40 border border-[#d4c5b0] text-sm">
              <div>
                <h4 className="text-[10px] uppercase tracking-widest text-[#8b7355] font-bold mb-1">Scene Description</h4>
                <p className="text-[#2c241a] leading-relaxed italic">
                  {selectedScene?.backgroundDescription || "A transition in the narrative, following K.'s complex journey through the legal labyrinth."}
                </p>
              </div>
              <div>
                <h4 className="text-[10px] uppercase tracking-widest text-[#8b7355] font-bold mb-1">Precedence</h4>
                <p className="text-[#5c4d3c] leading-relaxed">
                  {selectedScene?.precedence || "K. has been navigating the absurdity of his arrest and the suffocating atmosphere of the court offices."}
                </p>
              </div>
            </div>

            {/* Prompt Editor */}
            <div className="bg-white/50 border border-[#d4c5b0] p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase tracking-widest text-[#8b7355] font-bold flex items-center gap-2">
                  <Edit3 className="w-3 h-3" />
                  AI Generation Prompt
                </label>
                <Button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !customPrompt.trim()}
                  size="sm"
                  className="bg-[#8b7355] hover:bg-[#7a654a] text-white rounded-none flex items-center gap-2 h-8"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Generate
                </Button>
              </div>
              <Textarea 
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="min-h-[60px] bg-white border-[#d4c5b0] text-[#2c241a] rounded-none resize-none focus-visible:ring-[#8b7355] text-xs"
                placeholder="Describe the scene you want to generate..."
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#fdfbf7]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Unique Generated Image (if exists) */}
            {selectedScene && scope === 'scene' && currentImageOverride && (
              <div 
                className="group relative cursor-pointer transition-all duration-300 border-2 overflow-hidden border-[#8b7355] shadow-lg flex flex-col bg-white"
                onClick={() => setFullImage(getBustedUrl(currentImageOverride) || '')}
              >
                <div className="aspect-video bg-gray-200 relative">
                  <img 
                    src={getBustedUrl(currentImageOverride)} 
                    alt="Unique" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => handleImageError(e, selectedScene.id, 'generated')}
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                  <div className="absolute top-2 right-2 bg-[#8b7355] text-white p-1 rounded-full border border-white/20">
                    <Check className="w-4 h-4" />
                  </div>
                  <button 
                    className="absolute top-2 left-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete('scene', selectedScene.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button 
                    className="absolute bottom-2 left-2 bg-white text-gray-700 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 z-10 shadow-sm border border-gray-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageRefreshKey(Date.now());
                    }}
                    title="Force refresh image"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-sm text-[#2c241a]">{selectedScene.title}</p>
                    <span className="text-[10px] bg-[#8b7355]/10 text-[#8b7355] px-1 font-bold uppercase">AI</span>
                  </div>
                  <p className="text-[10px] text-[#5c4d3c] italic uppercase tracking-wider">Custom Background</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full mt-2 h-7 rounded-none border border-[#d4c5b0] hover:bg-[#f5f0e5] text-[10px] font-bold"
                    onClick={(e) => {
                      e.stopPropagation();
                      onGenerate(selectedScene.id, currentImageOverride);
                    }}
                  >
                    SELECT THIS ASSET
                  </Button>
                </div>
              </div>
            )}

            {/* Generated Page Backgrounds History */}
            {selectedScene && scope === 'page' && pageBackgroundHistory[selectedScene.id]?.map((url, idx) => {
              const isSelected = url === currentPageImageOverride;
              return (
                <div 
                  key={idx}
                  className={cn(
                    "group relative cursor-pointer transition-all duration-300 border overflow-hidden flex flex-col bg-white",
                    isSelected ? "border-2 border-[#8b7355] shadow-lg" : "border-[#d4c5b0] hover:border-[#8b7355]/50"
                  )}
                  onClick={() => setFullImage(getBustedUrl(url) || '')}
                >
                  <div className="aspect-video bg-gray-200 relative">
                    <CachedAsset 
                      src={getBustedUrl(url) || ""} 
                      alt="Generated Page" 
                      className="w-full h-full object-cover"
                      refreshKey={imageRefreshKey}
                      store="backgrounds"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-[#8b7355] text-white p-1 rounded-full border border-white/20">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                    <button 
                      className="absolute top-2 left-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete('history', selectedScene.id, undefined, url);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button 
                      className="absolute bottom-2 left-2 bg-white text-gray-700 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 z-10 shadow-sm border border-gray-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageRefreshKey(Date.now());
                      }}
                      title="Force refresh image"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-bold text-sm text-[#2c241a]">{selectedScene.title} (Asset {idx + 1})</p>
                      <span className="text-[10px] bg-[#8b7355]/10 text-[#8b7355] px-1 font-bold uppercase">AI</span>
                    </div>
                    <p className="text-[10px] text-[#5c4d3c] italic uppercase tracking-wider">Page Background</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full mt-2 h-7 rounded-none border border-[#d4c5b0] hover:bg-[#f5f0e5] text-[10px] font-bold disabled:opacity-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        onGeneratePage?.(selectedScene.id, selectedPageIndex, url);
                      }}
                      disabled={isSelected}
                    >
                      {isSelected ? "CURRENTLY SELECTED" : "SELECT THIS ASSET"}
                    </Button>
                  </div>
                </div>
              );
            })}

            {/* Default Option */}
            {selectedScene && (
              <div 
                className="group relative cursor-pointer transition-all duration-300 border overflow-hidden border-[#d4c5b0] hover:border-[#8b7355]/50 flex flex-col bg-white"
                onClick={() => setFullImage(getBustedUrl(getOriginalBackgroundUrl(selectedScene.background)) || '')}
              >
                <div className="aspect-video bg-gray-200 relative">
                <CachedAsset 
                  src={getBustedUrl(getOriginalBackgroundUrl(selectedScene.background)) || ""} 
                  alt="Default" 
                  className="w-full h-full object-cover"
                  refreshKey={imageRefreshKey}
                  store="backgrounds"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                {(!currentImageOverride && scope === 'scene') || (!currentPageImageOverride && scope === 'page') ? (
                  <div className="absolute top-2 right-2 bg-[#8b7355] text-white p-1 rounded-full border border-white/20">
                    <Check className="w-4 h-4" />
                  </div>
                ) : null}
                <button 
                  className="absolute bottom-2 left-2 bg-white text-gray-700 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 z-10 shadow-sm border border-gray-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImageRefreshKey(Date.now());
                  }}
                  title="Force refresh image"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold text-sm text-[#2c241a]">{selectedScene.title}</p>
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-1 font-bold uppercase">Default</span>
                </div>
                <p className="text-[10px] text-[#5c4d3c] italic uppercase tracking-wider">Original Master Asset</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-2 h-7 rounded-none border border-[#d4c5b0] hover:bg-[#f5f0e5] text-[10px] font-bold"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (scope === 'scene') onReset(selectedScene.id);
                    else onResetPage?.(selectedScene.id, selectedPageIndex);
                  }}
                >
                  RESTORE ORIGINAL
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

        {/* Footer */}
        <div className="p-4 bg-[#f5f0e5] border-t border-[#d4c5b0] flex justify-between items-center">
          {isConfirmingClear ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Clear all custom data?</span>
              <button 
                onClick={() => {
                  onDelete('all', '');
                  setIsConfirmingClear(false);
                }}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-none"
              >
                Permanently Delete All
              </button>
              <button 
                onClick={() => setIsConfirmingClear(false)}
                className="bg-white border border-[#d4c5b0] text-[#2c241a] text-xs font-bold px-3 py-1.5 rounded-none"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsConfirmingClear(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-none flex items-center gap-2 transition-colors border border-transparent hover:border-red-200"
            >
              <Trash2 className="w-3 h-3" />
              Reset Library Assets
            </button>
          )}
          <Button 
            onClick={onClose}
            className="bg-[#2c241a] hover:bg-[#3d3225] text-white rounded-none px-8 font-serif uppercase tracking-[0.2em] text-xs h-10"
          >
            Finalize
          </Button>
        </div>
      </Card>

      {/* Image Popup */}
      {fullImage && (
        <div 
          className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setFullImage(null)}
        >
          <CachedAsset 
            src={fullImage} 
            alt="Full Preview" 
            className="max-w-full max-h-full object-contain shadow-2xl"
            refreshKey={imageRefreshKey}
            store="backgrounds"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <Button 
              className="bg-white/20 hover:bg-white/40 text-white rounded-none flex items-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                setImageRefreshKey(Date.now());
                const sep = fullImage.includes('?') ? '&' : '?';
                setFullImage(`${fullImage.split('&v=')[0].split('?v=')[0]}${sep}v=${Date.now()}`);
              }}
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
            <Button 
              className="bg-white/20 hover:bg-white/40 text-white rounded-none"
              onClick={() => setFullImage(null)}
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
