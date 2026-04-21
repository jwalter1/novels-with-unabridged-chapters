import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BookOpen, Loader2, RefreshCw, BookMarked, ExternalLink, ListChecks, RotateCcw, Trash2, Sparkles, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ProgressData, getProgress, resetProgress, resetAllProgress } from '../services/progressService';
import { getNovelData, NOVELS_METADATA } from '../data/bookData';
import { NovelMetadata, BookVersion } from '../types';
import { User } from '../firebase';

interface ReadSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJumpTo?: (novelId: string, version: BookVersion, chapterIndex: number, sceneIndex: number) => void;
  user: User | null;
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
  percentComplete: number;
  updatedAt?: string;
  readScenes: SceneProgressInfo[];
}

export function ReadSummaryModal({ isOpen, onClose, onJumpTo, user }: ReadSummaryModalProps) {
  const [summaries, setSummaries] = useState<NovelSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const totalOverallPages = summaries.reduce((sum, item) => sum + item.totalPagesRead, 0);

  const filteredSummaries = summaries.filter(item => 
    item.metadata.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.metadata.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      loadSummaries();
    }
  }, [isOpen]);

  const handleReset = async (novelId: string, version: string) => {
    if (confirm(`Are you sure you want to reset your progress for this edition of ${novelId}?`)) {
      resetProgress(novelId, user?.uid, version);
      await loadSummaries();
    }
  };

  const handleResetAll = async () => {
    if (confirm('Are you sure you want to reset ALL your reading progress? This cannot be undone.')) {
      resetAllProgress(user?.uid);
      await loadSummaries();
    }
  };

  const loadSummaries = async () => {
    setIsLoading(true);
    const results: NovelSummary[] = [];

    // Check progress for each novel (both abridged and unabridged)
    for (const metadata of NOVELS_METADATA) {
      const versions = (metadata.allowedVersions || ['abridged', 'unabridged']) as BookVersion[];
      for (const version of versions) {
        const progress = getProgress(metadata.id, version);
        if (Object.keys(progress.sceneProgress).length > 0) {
          const novelData = await getNovelData(metadata.id, version as any);
          if (novelData) {
            let totalPages = 0;
            let totalPossiblePages = 0;
            let readChaptersCount = new Set<number>();
            let readScenes: SceneProgressInfo[] = [];

            novelData.chapters.forEach((chapter, chIdx) => {
              chapter.scenes.forEach((scene, scIdx) => {
                totalPossiblePages += scene.dialogue.length;
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
                percentComplete: Math.min(100, Math.round((totalPages / totalPossiblePages) * 100)),
                updatedAt: progress.updatedAt,
                readScenes
              });
            }
          }
        }
      }
    }

    results.sort((a, b) => {
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bTime - aTime;
    });

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
                <div className="space-y-8">
                  {/* Summary Header */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-black/[0.02] border border-black/5 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-amber-500" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold tracking-tight">{totalOverallPages}</div>
                        <div className="text-[10px] uppercase tracking-widest opacity-50 font-sans">Total Pages Explored Across All Volumes</div>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleResetAll}
                      className="text-[10px] uppercase tracking-widest font-bold border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-sans"
                    >
                      <Trash2 className="w-3 h-3 mr-2" />
                      Reset All Progress
                    </Button>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                    <Input 
                      placeholder="Search archived volumes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-black/[0.02] border-black/5 rounded-full font-sans text-sm"
                    />
                  </div>

                  <div className="overflow-hidden border border-black/5 rounded-lg">
                    <table className="w-full text-left border-collapse font-sans">
                      <thead className="bg-black/5 uppercase text-[10px] tracking-widest font-bold">
                        <tr>
                          <th className="px-6 py-4">Volumes & Manuscripts</th>
                          <th className="px-6 py-4">Edition</th>
                          <th className="px-6 py-4">Pages read</th>
                          <th className="px-6 py-4">Completion</th>
                          <th className="px-6 py-4 text-right">Last Read</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5">
                        {filteredSummaries.map((item, idx) => {
                          const novelKey = `${item.metadata.id}-${item.version}`;
                          const lastReadDate = item.updatedAt ? new Date(item.updatedAt).toLocaleDateString(undefined, { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          }) : 'Long ago';

                          return (
                            <motion.tr 
                              key={novelKey}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="group hover:bg-amber-50/20 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                  <div 
                                    className="w-10 h-14 shrink-0 shadow-sm transition-transform group-hover:scale-105" 
                                    style={{ backgroundColor: item.metadata.accentColor }} 
                                  />
                                  <div>
                                    {item.metadata.homepage ? (
                                      <a 
                                        href={item.metadata.homepage} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-sm font-bold font-serif hover:text-amber-600 transition-colors flex items-center gap-1"
                                      >
                                        {item.metadata.title}
                                        <ExternalLink className="w-3 h-3 opacity-30" />
                                      </a>
                                    ) : (
                                      <div className="text-sm font-bold font-serif">{item.metadata.title}</div>
                                    )}
                                    <div className="text-[10px] opacity-50 uppercase tracking-wider">{item.metadata.author}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <Badge variant="outline" className="text-[10px] rounded-none py-0 px-2 uppercase tracking-tight border-black/20">
                                  {item.version}
                                </Badge>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm font-medium">{item.totalPagesRead}</div>
                                <div className="text-[9px] opacity-40">Data Segments</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-12 h-1 bg-black/5 rounded-full overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${item.percentComplete}%` }}
                                      className="h-full bg-amber-500"
                                    />
                                  </div>
                                  <span className="text-xs font-bold">{item.percentComplete}%</span>
                                </div>
                                <div className="text-[9px] opacity-40">Manuscript Sync</div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="text-sm font-medium">{lastReadDate}</div>
                                <div className="text-[9px] opacity-40">Journal Entry</div>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
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
