import React, { useState, useEffect } from 'react';
import { getFromCache, saveToCache } from '../services/cacheService';
import { Loader2, Image as ImageIcon } from 'lucide-react';

interface CachedAssetProps {
  src: string;
  alt: string;
  className?: string;
  refreshKey?: number;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  onClick?: (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => void;
  store?: 'backgrounds' | 'sprites' | 'audio';
}

export const CachedAsset: React.FC<CachedAssetProps> = ({ src, alt, className, refreshKey, onError, onClick, store = 'backgrounds' }) => {
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    if (!src) {
      setDisplayUrl(null);
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(false);
      
      try {
        // Use URL object to strip unwanted query params for the cache key
        let cacheKey = src;
        try {
          const url = new URL(src, window.location.origin);
          url.searchParams.delete('t');
          url.searchParams.delete('assetVersion');
          cacheKey = url.toString();
        } catch (e) {
          // If not a valid absolute/relative URL, just split by ?
          cacheKey = src.split('?')[0].split('&')[0];
        }
        
        const cachedBlob = await getFromCache(store, cacheKey);
        
        if (cachedBlob && active) {
          objectUrl = URL.createObjectURL(cachedBlob);
          setDisplayUrl(objectUrl);
          setLoading(false);
          return;
        }

        // Fetch from network
        const response = await fetch(src);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const blob = await response.blob();

        if (active) {
          await saveToCache(store, cacheKey, blob);
          objectUrl = URL.createObjectURL(blob);
          setDisplayUrl(objectUrl);
          setLoading(false);
        }
      } catch (err) {
        console.error(`Failed to load/cache ${store} asset:`, err);
        if (active) {
          setError(true);
          setLoading(false);
          setDisplayUrl(src); // Fallback to direct src if fetch fails
        }
      }
    };

    load();

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src, refreshKey]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error && !displayUrl) {
    return (
      <div className={`flex items-center justify-center bg-gray-200 ${className}`}>
        <ImageIcon className="w-6 h-6 text-gray-400" />
      </div>
    );
  }

  return (
    <img 
      src={displayUrl || src} 
      alt={alt} 
      className={className}
      referrerPolicy="no-referrer"
      onError={onError}
      onClick={onClick}
    />
  );
};
