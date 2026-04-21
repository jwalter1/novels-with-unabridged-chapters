import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BookOpen, Loader2, RefreshCw, BookMarked, ExternalLink, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressData, getProgress } from '../services/progressService';
import { getNovelData, NOVELS_METADATA } from '../data/bookData';
import { NovelMetadata, BookVersion } from '../types';

interface ReadSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJumpTo?: (novelId: string, version: BookVersion, chapterIndex: number, sceneIndex: number) => void;
}

interface SceneProgressInfo {
  chapterIndex: number;
  sceneIndex: number;
  title: string;
  chapterTitle: string;
}

interface NovelSummary {
  metadata: NovelMetadata;
  version: string;
  totalPagesRead: number;
  totalChaptersRead: number;
  readScenes: SceneProgressInfo[];
}

export function ReadSummaryModal({ isOpen, onClose, onJumpTo }: ReadSummaryModalProps) {
  const [summaries, setSummaries] = useState<NovelSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSummaries();
    }
  }, [isOpen]);

  const loadSummaries = async () => {
    setIsLoading(true);
    const results: NovelSummary[] = [];

    // Check progress for each novel (both abridged and unabridged)
    for (const metadata of NOVELS_METADATA) {
      for (const version of ['abridged', 'unabridged']) {
        const progress = getProgress(metadata.id, version);
        if (Object.keys(progress.sceneProgress).length > 0) {
          const novelData = await getNovelData(metadata.id, version as any);
          if (novelData) {
            let totalPages = 0;
            let readChaptersCount = new Set<number>();
            let readScenes: SceneProgressInfo[] = [];

            novelData.chapters.forEach((chapter, chIdx) => {
              chapter.scenes.forEach((scene, scIdx) => {
                const key = `${chIdx}:${scIdx}`;
                const maxDialogue = progress.sceneProgress[key];
                if (maxDialogue !== undefined) {
                  totalPages += (maxDialogue + 1);
                  readChaptersCount.add(chIdx);
                  
                  readScenes.push({
                    chapterIndex: chIdx,
                    sceneIndex: scIdx,
                    title: scene.title,
                    chapterTitle: chapter.title
                  });
                }
              });
            });

            if (readScenes.length > 0) {
              results.push({
                metadata,
                version,
                totalPagesRead: totalPages,
                totalChaptersRead: readChaptersCount.size,
                readScenes
              });
            }
          }
        }
      }
    }

    setSummaries(results);
    setIsLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm px-4"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl max-h-[85vh] bg-[#fdfdfb] rounded-2xl shadow-2xl overflow-hidden flex flex-col font-serif"
          >
            {/* Header */}
            <div className="p-6 border-b border-[#eee] flex items-center justify-between bg-[#1a1a1a] text-white shrink-0">
              <div className="flex items-center gap-3">
                <BookMarked className="w-6 h-6 text-amber-400" />
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Reading Odyssey</h2>
                  <p className="text-[10px] uppercase tracking-widest opacity-50 font-sans">An indexed history of your literary travels</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
                className="text-white/70 hover:text-white hover:bg-white/10 rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-[#fdfdfb]">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="relative">
                    <Loader2 className="w-12 h-12 text-black/10 animate-spin" />
                    <RefreshCw className="w-6 h-6 text-amber-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin-slow" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-medium italic">Opening the archives...</p>
                    <p className="text-xs text-muted-foreground font-sans mt-1">Our librarian is cataloging your journey.</p>
                  </div>
                </div>
              ) : summaries.length === 0 ? (
                <div className="text-center py-20">
                  <BookOpen className="w-16 h-16 text-black/5 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold mb-2">The pages are still blank</h3>
                  <p className="text-muted-foreground max-w-md mx-auto font-sans leading-relaxed">
                    Begin your journey with one of our masterpieces. As you read, we'll maintain an indexed list of every chapter and scene you visit.
                  </p>
                </div>
              ) : (
                <div className="space-y-16">
                  {summaries.map((item, idx) => {
                    const novelKey = `${item.metadata.id}-${item.version}`;

                    return (
                      <motion.div
                        key={novelKey}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="group"
                      >
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                          {/* Book Metadata */}
                          <div className="w-full md:w-56 shrink-0">
                            <Card 
                              className="aspect-[3/4] p-4 text-center flex flex-col items-center justify-center relative overflow-hidden text-white border-none shadow-md group-hover:shadow-xl transition-all"
                              style={{ backgroundColor: item.metadata.accentColor }}
                            >
                              <div className="absolute inset-0 bg-black/10 transition-opacity group-hover:opacity-0" />
                              <span className="text-[8px] uppercase tracking-[0.2em] opacity-60 mb-2 font-sans relative z-10">{item.metadata.author}</span>
                              <h4 className="text-sm font-bold leading-tight mb-2 relative z-10">{item.metadata.title}</h4>
                              <div className="w-6 h-px bg-white/30 my-2 relative z-10" />
                              <Badge className="bg-white/10 text-[8px] text-white border-none py-0 h-4 relative z-10 uppercase tracking-widest">
                                {item.version}
                              </Badge>
                            </Card>
                            
                            <div className="mt-4 space-y-2 font-sans">
                              <div className="flex items-center justify-between text-[10px] opacity-60">
                                <span>Pages Explored</span>
                                <span className="font-bold">{item.totalPagesRead}</span>
                              </div>
                              <div className="flex items-center justify-between text-[10px] opacity-60 border-b border-black/5 pb-2">
                                <span>Chapters Visited</span>
                                <span className="font-bold">{item.totalChaptersRead}</span>
                              </div>
                            </div>
                          </div>

                          {/* Dynamic Content Area */}
                          <div className="flex-1 min-w-0">
                            <div className="space-y-6">
                              <div className="flex items-center gap-2">
                                 <div className="h-px w-8 bg-black/5" />
                                 <ListChecks className="w-3 h-3 text-amber-500/40" />
                                 <span className="text-[10px] uppercase tracking-widest opacity-30 font-sans">Archived Scenes</span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                 {item.readScenes.map((scene, sIdx) => (
                                   <button
                                     key={`${scene.chapterIndex}-${scene.sceneIndex}`}
                                     onClick={() => onJumpTo?.(item.metadata.id, item.version as BookVersion, scene.chapterIndex, scene.sceneIndex)}
                                     className="flex flex-col items-start p-3 rounded-lg border border-black/5 hover:border-amber-200 hover:bg-amber-50/30 transition-all text-left group/btn"
                                   >
                                     <div className="flex items-center justify-between w-full mb-1">
                                       <span className="text-[8px] uppercase tracking-widest opacity-40 font-sans">Chapter {scene.chapterIndex + 1}</span>
                                       <ExternalLink className="w-3 h-3 opacity-0 group-hover/btn:opacity-100 transition-opacity text-amber-600" />
                                     </div>
                                     <h5 className="text-xs font-bold truncate w-full mb-0.5">{scene.title}</h5>
                                     <span className="text-[9px] italic opacity-50 truncate w-full">{scene.chapterTitle}</span>
                                   </button>
                                 ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#eee] bg-black text-center shrink-0">
               <p className="text-[9px] uppercase tracking-[0.3em] text-white/40 font-sans">
                 Your journey is personal. Your progress is eternal.
               </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
