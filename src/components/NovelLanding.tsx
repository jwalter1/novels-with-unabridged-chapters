import React from 'react';
import { motion } from 'motion/react';
import { LogIn, LogOut, ChevronRight, Pin, Clock, Search as SearchIcon, Sparkles } from 'lucide-react';
import { NovelMetadata, BookVersion } from '../types';
import { User } from '../firebase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NOVELS_METADATA } from '../data/bookData';
import { cn } from '@/lib/utils';
import { getTotalPagesRead } from '../services/progressService';
import { ReadSummaryModal } from './ReadSummaryModal';

interface NovelLandingProps {
  novels?: NovelMetadata[];
  onSelect: (id: string) => void;
  onJumpTo?: (novelId: string, version: BookVersion, chapterIndex: number, sceneIndex: number) => void;
  pinnedNovelIds?: string[];
  onTogglePin?: (id: string) => void;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  onOpenAdmin: () => void;
}

export function NovelLanding({ 
  novels = NOVELS_METADATA, 
  onSelect, 
  onJumpTo,
  pinnedNovelIds = [], 
  onTogglePin, 
  user, 
  onLogin, 
  onLogout,
  onOpenAdmin
}: NovelLandingProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedGenre, setSelectedGenre] = React.useState<string | null>(null);
  const [totalPagesRead, setTotalPagesRead] = React.useState(0);
  const [isSummaryOpen, setIsSummaryOpen] = React.useState(false);

  React.useEffect(() => {
    setTotalPagesRead(getTotalPagesRead());
  }, []);

  const genres = React.useMemo(() => {
    const allGenres = novels.map(n => n.genre).filter(Boolean) as string[];
    return Array.from(new Set(allGenres)).sort();
  }, [novels]);

  const filteredNovels = React.useMemo(() => {
    let result = novels;
    
    if (selectedGenre) {
      result = result.filter(n => n.genre === selectedGenre);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(novel => 
        novel.title.toLowerCase().includes(query) || 
        novel.author.toLowerCase().includes(query) ||
        novel.description.toLowerCase().includes(query) ||
        novel.genre?.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [novels, searchQuery, selectedGenre]);

  const sortedNovels = React.useMemo(() => {
    return [...filteredNovels].sort((a, b) => {
      const aPinned = pinnedNovelIds.includes(a.id);
      const bPinned = pinnedNovelIds.includes(b.id);
      
      // Pinning takes highest priority
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      
      // Secondary sort: Alphabetical by title
      return a.title.localeCompare(b.title);
    });
  }, [filteredNovels, pinnedNovelIds]);

  return (
    <div className="min-h-screen bg-[#f5f5f0] text-[#1a1a1a] font-serif">
      {/* Hero Section */}
      <header className="relative min-h-[44vh] md:min-h-[35vh] flex flex-col items-center overflow-hidden bg-[#1a1a1a] text-white">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff11_1px,transparent_1px)] [background-size:20px_20px]" />
        
        {/* Top Bar Container */}
        <div className="relative w-full p-4 md:p-6 z-20 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 shrink-0">
          {/* Pages Read Stat */}
          {totalPagesRead > 0 ? (
            <button 
              onClick={() => setIsSummaryOpen(true)}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-white/20 shadow-sm transition-all hover:bg-white/20 hover:scale-105 active:scale-95 group"
            >
              <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-amber-400 group-hover:rotate-12 transition-transform shrink-0" />
              <span className="text-xs md:text-sm font-sans text-white">
                <span className="hidden sm:inline">You have read </span>
                <strong className="text-amber-400">{totalPagesRead}</strong> 
                <span className="hidden sm:inline"> pages so far</span>
                <span className="sm:hidden"> pages read</span>
              </span>
            </button>
          ) : (
            <div /> // spacer
          )}

          {/* Login/User Info */}
          <div className="flex items-center gap-3">
            {user?.email === 'jwalter1@gmail.com' && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="bg-white/10 text-white border-white/20 backdrop-blur-md hover:bg-white/20 rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center transition-all hover:scale-110 shrink-0" 
                onClick={onOpenAdmin} 
                title="Asset Generation Admin"
              >
                <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </Button>
            )}

            {user ? (
              <div className="flex items-center gap-2 md:gap-3 bg-white/10 backdrop-blur-md p-1 pr-3 md:p-1.5 md:pr-4 rounded-full border border-white/10 h-8 md:h-10">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || ''} 
                    className="w-6 h-6 md:w-8 md:h-8 rounded-full border border-white/20 shrink-0 object-cover" 
                    referrerPolicy="no-referrer" 
                  />
                ) : (
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-white/10 flex items-center justify-center text-white/40 text-[10px] shrink-0 border border-white/10">
                    {user.displayName?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="flex flex-col justify-center">
                  <span className="text-[9px] md:text-[10px] font-medium text-white/90 leading-none mb-0.5 md:mb-1 truncate max-w-[80px] md:max-w-[120px]">{user.displayName}</span>
                  <button 
                    onClick={onLogout}
                    className="text-[7px] md:text-[8px] uppercase tracking-widest text-white/40 hover:text-white transition-colors text-left leading-none"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onLogin}
                className="bg-white/10 text-white border-white/20 backdrop-blur-md hover:bg-white/20 rounded-full px-4 md:px-6 h-8 md:h-10 text-[10px] md:text-xs uppercase tracking-widest font-bold shrink-0"
              >
                <LogIn className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1 md:mr-2" /> <span className="hidden sm:inline">PLEASE LOG IN</span><span className="sm:hidden">LOGIN</span>
              </Button>
            )}
          </div>
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl flex-1 flex flex-col items-center justify-center pb-8 md:pb-12 mt-4 md:mt-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-[10px] uppercase tracking-[0.3em] mb-2 block opacity-70">The Visual Library</span>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight leading-none">
              Classic Literature <br />
              <span className="italic font-light opacity-80">Reimagined</span>
            </h1>
            <p className="text-base md:text-lg opacity-80 max-w-xl mx-auto leading-relaxed font-sans">
              Experience the world's greatest stories through an immersive visual novel format.
            </p>
          </motion.div>
        </div>
      </header>

      {/* Novel Grid */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
          <div>
            <h2 className="text-3xl font-bold mb-1">Available Novels</h2>
            <p className="text-sm text-muted-foreground font-sans">Select a masterpiece to begin your journey</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search novels..." 
                className="pl-9 bg-white/50 border-none shadow-sm h-10 rounded-full font-sans text-sm focus-visible:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-4 w-full md:w-auto items-center">
              <Select
                value={selectedGenre || "All Genres"}
                onValueChange={(value) => setSelectedGenre(value === "All Genres" ? null : value)}
              >
                <SelectTrigger className="w-full sm:w-[180px] h-10 rounded-full bg-white/50 border-none shadow-sm font-sans text-sm focus:ring-primary">
                  <SelectValue placeholder="All Genres" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-md border-[#d4c5b0] font-sans">
                  <SelectItem value="All Genres">All Genres</SelectItem>
                  {genres.map(genre => (
                    <SelectItem key={genre} value={genre}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {sortedNovels.length === 0 ? (
          <div className="py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SearchIcon className="w-12 h-12 mx-auto mb-4 opacity-10" />
            <h3 className="text-xl font-bold mb-1">No novels found</h3>
            <p className="text-sm text-muted-foreground font-sans">Try adjusting your search query</p>
            <Button 
              variant="link" 
              onClick={() => setSearchQuery('')}
              className="mt-4 text-primary"
            >
              Clear search
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sortedNovels.map((novel, index) => {
            const isAvailable = ['great-gatsby', 'pride-prejudice', 'the-trial', 'aesop-fables', 'animal-farm', 'alice-wonderland', 'romeo-juliet'].includes(novel.id);
            const isPinned = pinnedNovelIds.includes(novel.id);
            
            return (
              <motion.div
                key={novel.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                layout
              >
                <Card 
                  className={cn(
                    "group relative overflow-hidden border-none bg-transparent transition-all duration-300",
                    !isAvailable ? "opacity-60 grayscale cursor-not-allowed" : "cursor-pointer hover:shadow-2xl"
                  )}
                  onClick={() => {
                    console.log('Novel card clicked:', novel.id, 'isAvailable:', isAvailable);
                    if (isAvailable) {
                      onSelect(novel.id);
                    }
                  }}
                >
                  <div className="aspect-[4/3] overflow-hidden rounded-xl mb-3 shadow-lg transition-transform duration-500 group-hover:scale-[1.02] relative">
                    {/* Pin Button */}
                    {isAvailable && (
                      <button
                        className={cn(
                          "absolute top-3 left-3 z-30 p-2 rounded-full backdrop-blur-md transition-all duration-300 opacity-0 group-hover:opacity-100",
                          isPinned ? "bg-white text-black opacity-100" : "bg-black/20 text-white hover:bg-black/40"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePin?.(novel.id);
                        }}
                      >
                        <Pin className={cn("w-3.5 h-3.5", isPinned && "fill-current")} />
                      </button>
                    )}

                    {!isAvailable && (
                      <div className="absolute top-3 right-3 z-10">
                        <Badge className="bg-gray-800/80 text-[10px] text-white border-none py-0 h-5">Coming Soon</Badge>
                      </div>
                    )}
                    
                    <div 
                      className="w-full h-full flex flex-col items-center justify-center p-6 text-center transition-colors duration-500"
                      style={{ backgroundColor: novel.accentColor }}
                    >
                      <div className="w-full h-full border border-white/20 flex flex-col items-center justify-center p-4 relative">
                        <div className="absolute inset-0 border-[0.5px] border-white/10 m-1" />
                        <span className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-white/60 mb-4 font-sans z-10">{novel.author}</span>
                        <h4 className="text-lg md:text-xl font-bold text-white leading-tight mb-2 z-10">{novel.title}</h4>
                        <div className="w-8 h-px bg-white/30 my-4 z-10" />
                        <span className="text-[8px] md:text-[10px] uppercase tracking-widest text-white/40 font-sans z-10">{novel.year}</span>
                      </div>
                    </div>

                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-500" />
                    
                    {/* Hover Overlay */}
                    {isAvailable && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[2px] z-20">
                        <Button 
                          className="rounded-full px-6 py-4 text-sm font-sans pointer-events-none"
                          style={{ backgroundColor: novel.accentColor }}
                        >
                          Read Now
                        </Button>
                      </div>
                    )}
                  </div>

                <div className="p-4 pt-0 space-y-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-[10px] uppercase tracking-widest opacity-60 font-sans">{novel.year}</span>
                    {novel.genre && (
                      <>
                        <span className="text-gray-300">•</span>
                        <Badge variant="outline" className="text-[8px] uppercase tracking-widest h-4 px-1.5 border-none bg-black/5 text-black/60 rounded-sm">
                          {novel.genre}
                        </Badge>
                      </>
                    )}
                    {novel.abridgedEstimate && (
                      <>
                        <span className="text-gray-300">•</span>
                        <span className="text-[10px] uppercase tracking-widest opacity-60 font-sans flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> {novel.abridgedEstimate}
                        </span>
                      </>
                    )}
                  </div>
                  <h3 className="text-lg font-bold group-hover:text-primary transition-colors leading-tight">{novel.title}</h3>
                  <p className="text-xs opacity-70 italic mb-2">by {novel.author}</p>
                  <p className="text-xs leading-relaxed opacity-80 font-sans line-clamp-2 mb-2">
                    {novel.description}
                  </p>
                  {novel.homepage && (
                    <a 
                      href={novel.homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-sans text-primary hover:underline flex items-center gap-0.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Visit Homepage <ChevronRight className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </Card>
            </motion.div>
            );
          })}
        </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] text-white py-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-lg font-bold tracking-tighter uppercase">Visual Library</span>
          </div>
          <p className="text-[10px] opacity-50 font-sans">
            © 2026 Visual Library Project. All public domain works.
          </p>
        </div>
      </footer>

      <ReadSummaryModal 
        isOpen={isSummaryOpen} 
        onClose={() => {
          setIsSummaryOpen(false);
          setTotalPagesRead(getTotalPagesRead());
        }} 
        onJumpTo={(id, version, chIdx, scIdx) => {
          onJumpTo?.(id, version, chIdx, scIdx);
          setIsSummaryOpen(false);
          setTotalPagesRead(getTotalPagesRead());
        }}
        user={user}
      />
    </div>
  );
}
