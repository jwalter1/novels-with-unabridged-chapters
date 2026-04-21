import { motion } from 'motion/react';
import { X, CheckCircle2, Circle, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { getSceneCompletion, getChapterCompletion, getBookCompletion } from '../services/progressService';
import { cn } from '@/lib/utils';
import { Chapter, BookVersion } from '../types';

import { useState } from 'react';

interface ProgressViewProps {
  novelId: string;
  chapters: Chapter[];
  version?: BookVersion;
  onClose: () => void;
  onJumpTo: (chapterIndex: number, sceneIndex: number) => void;
  onReset: () => void;
}

export function ProgressView({ novelId, chapters, version, onClose, onJumpTo, onReset }: ProgressViewProps) {
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const bookCompletion = getBookCompletion(novelId, chapters, version);

  const getCompletionColor = (percent: number) => {
    if (percent === 0) return 'bg-gray-100 text-gray-400';
    if (percent < 25) return 'bg-red-100 text-red-600 border-red-200';
    if (percent < 50) return 'bg-orange-100 text-orange-600 border-orange-200';
    if (percent < 75) return 'bg-yellow-100 text-yellow-600 border-yellow-200';
    if (percent < 100) return 'bg-blue-100 text-blue-600 border-blue-200';
    return 'bg-green-100 text-green-600 border-green-200';
  };

  const getCompletionDotColor = (percent: number) => {
    if (percent === 0) return 'bg-gray-300';
    if (percent < 50) return 'bg-orange-400';
    if (percent < 100) return 'bg-blue-400';
    return 'bg-green-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
    >
      <Card className="w-full max-w-5xl h-[85vh] bg-[#fdfcfb] border-none shadow-2xl flex flex-col overflow-hidden relative min-h-0">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-gray-100 flex items-start justify-between bg-white/50 shrink-0 gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl md:text-3xl font-serif font-bold text-gray-900 truncate">Reading Progress</h2>
            {version && (
              <Badge variant="outline" className="mb-2 border-gray-200 text-gray-400 uppercase tracking-widest text-[10px]">
                {version} Version
              </Badge>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1 md:mt-2">
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs md:text-sm text-gray-500 font-medium whitespace-nowrap">Overall Completion:</span>
                <Badge variant="outline" className="text-sm md:text-lg font-bold px-2 md:px-3 py-0 bg-white shadow-sm">
                  {bookCompletion}%
                </Badge>
              </div>
              <div className="h-1.5 md:h-2 w-full sm:w-48 bg-gray-100 rounded-full overflow-hidden shrink-0">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${bookCompletion}%` }}
                  className="h-full bg-green-500"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {isConfirmingReset ? (
              <div className="flex items-center gap-2 bg-red-50 p-1 px-2 border border-red-200 rounded-md">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-[10px] font-bold text-red-700 uppercase">Confirm reset?</span>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="h-7 text-[10px] px-3 uppercase tracking-wider"
                  onClick={() => {
                    onReset();
                    setIsConfirmingReset(false);
                  }}
                >
                  Yes, Reset
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-[10px] px-3 uppercase tracking-wider"
                  onClick={() => setIsConfirmingReset(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                className="h-8 text-[10px] uppercase tracking-widest text-red-500 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 gap-1.5"
                onClick={() => setIsConfirmingReset(true)}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Reset Progress
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-gray-100 shrink-0 mt-1">
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white/30 min-h-0 touch-auto">
          <div className="p-6">
            <div className="grid gap-8">
            {chapters.map((chapter, cIdx) => {
              const chapterPercent = getChapterCompletion(novelId, cIdx, chapters, version);
              return (
                <div key={chapter.id} className="space-y-4">
                  <div className="flex items-center justify-between sticky top-0 bg-[#fdfcfb]/95 backdrop-blur-sm py-2 z-10">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest text-[#d4c5b0] font-bold">Chapter {chapter.id}</span>
                        <h3 className="text-xl font-serif font-bold text-gray-800">
                          {chapter.title}
                        </h3>
                      </div>
                      <Badge className={cn("font-bold mt-4", getCompletionColor(chapterPercent))}>
                        {chapterPercent}%
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {chapter.scenes.map((scene, sIdx) => {
                      const scenePercent = getSceneCompletion(novelId, cIdx, sIdx, scene.dialogue.length, version);
                      return (
                        <motion.button
                          key={scene.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => onJumpTo(cIdx, sIdx)}
                          className={cn(
                            "p-4 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between h-32 group relative overflow-hidden shadow-sm",
                            scenePercent === 100 ? "bg-green-50 border-green-200" : 
                            scenePercent > 0 ? "bg-blue-50 border-blue-200" : 
                            "bg-white border-gray-100 hover:border-gray-300"
                          )}
                        >
                          {/* Progress Bar Background */}
                          <div className="absolute bottom-0 left-0 h-1.5 bg-gray-200/50 w-full">
                            <div 
                              className={cn("h-full transition-all duration-500", 
                                scenePercent === 100 ? "bg-green-500" : "bg-blue-500"
                              )}
                              style={{ width: `${scenePercent}%` }}
                            />
                          </div>

                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                              Scene {sIdx + 1}
                            </span>
                            {scenePercent === 100 ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : scenePercent > 0 ? (
                              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            ) : (
                              <Circle className="w-4 h-4 text-gray-200" />
                            )}
                          </div>
                          
                          <h4 className="text-sm font-bold text-gray-800 line-clamp-2 leading-tight group-hover:text-gray-900">
                            {scene.title}
                          </h4>

                          <div className="mt-auto flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-500">
                              {scenePercent}% Complete
                            </span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-6 text-xs font-medium text-gray-500 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-300" />
            <span>Not Started</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-400" />
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Completed</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
