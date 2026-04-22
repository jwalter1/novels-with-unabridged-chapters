import { Scene } from '../types';
import { NOVEL_THEMES } from '../data/thematicBackgrounds';

export interface BackgroundResolutionResult {
  url: string | null;
  source: 'UNKNOWN' | 'USER_ASSIGNED_IMAGE' | 'USER_ASSIGNED_CATEGORY_OVERRIDE' | 'USER_ASSIGNED_THEME' | 'S3_SCENE_OVERRIDE' | 'DATA_DIRECT_URL' | 'S3_ASSET_MATCH' | 'THEMATIC_FALLBACK' | 'LOCAL_FALLBACK';
}

export function sanitizeS3Url(url: string) {
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
}

export interface ResolutionState {
  novelId: string;
  assetVersion: number;
  assets?: { key: string; url: string }[];
  overrides?: {
    pageImageOverrides?: Record<string, string>;
    sceneImageOverrides?: Record<string, string>;
    globalSceneBackgrounds?: Record<string, string>;
    sceneBackgroundOverrides?: Record<string, string>;
    backgroundOverrides?: Record<string, string>;
  };
}

export function resolveSceneBackground(
  scene: Scene,
  dialogueIdx: number | null,
  state: ResolutionState
): BackgroundResolutionResult {
  const { novelId, assetVersion, assets = [], overrides = {} } = state;
  const { 
    pageImageOverrides = {}, 
    sceneImageOverrides = {}, 
    globalSceneBackgrounds = {}, 
    sceneBackgroundOverrides = {}, 
    backgroundOverrides = {} 
  } = overrides;

  const addVersion = (url: string) => {
    if (!url) return url;
    const sanitized = sanitizeS3Url(url);
    const separator = sanitized.includes('?') ? '&' : '?';
    return `${sanitized}${separator}v=${assetVersion}`;
  };

  // 0. Check for page-specific background (highest precedence)
  if (dialogueIdx !== null) {
    const pageKey = `${scene.id}_${dialogueIdx}`;
    // 0a. From explicitly passed overrides (localStorage/db)
    if (pageImageOverrides[pageKey]) {
      return { url: addVersion(pageImageOverrides[pageKey]), source: 'USER_ASSIGNED_IMAGE' };
    }
    // 0b. Discovered in S3 assets list (Auto-discovery for pages)
    const pageAsset = assets.find(a => {
      const parts = a.key.split('/');
      const filename = parts[parts.length - 1];
      const nameWithoutExt = filename.split('.')[0];
      const isImage = /\.(png|jpg|jpeg|webp)$/i.test(filename);
      // Handle optional timestamp suffix safely to avoid 1 vs 10 overlap
      return isImage && (nameWithoutExt === pageKey || nameWithoutExt.startsWith(`${pageKey}_`));
    });
    if (pageAsset) {
      return { url: addVersion(pageAsset.url), source: 'S3_SCENE_OVERRIDE' };
    }
  }

  // 1. Check for scene-specific generated image (local/user override)
  if (sceneImageOverrides[scene.id]) {
    return { url: addVersion(sceneImageOverrides[scene.id]), source: 'USER_ASSIGNED_IMAGE' };
  }

  // 2. Check for global scene background (from S3 discovered assets in Admin, or passed state in App)
  if (globalSceneBackgrounds[scene.id]) {
    return { url: addVersion(globalSceneBackgrounds[scene.id]), source: 'S3_SCENE_OVERRIDE' };
  }
  
  // Also check Admin's 'assets' list directly as a "global" discovery if not explicitly in overrides
  const s3Override = assets.find(a => {
    const parts = a.key.split('/');
    const filename = parts[parts.length - 1];
    const nameWithoutExt = filename.split('.')[0];
    const isImage = /\.(png|jpg|jpeg|webp)$/i.test(filename);
    // Scene assets are often saved with a timestamp: sceneId_timestamp.png
    return isImage && (nameWithoutExt === scene.id || nameWithoutExt.startsWith(`${scene.id}_`));
  });
  if (s3Override) {
    return { url: addVersion(s3Override.url), source: 'S3_SCENE_OVERRIDE' };
  }

  // 3. User-assigned category overrides
  const categoryOverride = sceneBackgroundOverrides[scene.id];
  if (categoryOverride) {
    if (backgroundOverrides[categoryOverride]) {
      return { url: addVersion(backgroundOverrides[categoryOverride]), source: 'USER_ASSIGNED_CATEGORY_OVERRIDE' };
    }
    const themedUrl = NOVEL_THEMES[novelId]?.[categoryOverride];
    if (themedUrl) return { url: themedUrl, source: 'USER_ASSIGNED_THEME' };
  }

  // 4. Direct URL in data
  if (scene.background.includes('/api/s3/') || scene.background.startsWith('http')) {
    return { url: addVersion(scene.background), source: 'DATA_DIRECT_URL' };
  }

  // 5. Category-based resolution
  const category = scene.background.split('/').pop()?.replace(/\.(png|jpg|jpeg|webp)$/i, '') || scene.background;
  
  // 5a. Match in backgroundOverrides (manually set in UI for this category)
  if (backgroundOverrides[category]) {
    return { url: addVersion(backgroundOverrides[category]), source: 'USER_ASSIGNED_CATEGORY_OVERRIDE' };
  }

  // 5b. Match in S3 assets (automatic discovery)
  const matchedAsset = assets.find(a => {
    const filename = a.key.split('/').pop() || '';
    const isImage = /\.(png|jpg|jpeg|webp)$/i.test(filename);
    const nameWithoutExt = filename.replace(/\.(png|jpg|jpeg|webp)$/i, '');
    return isImage && nameWithoutExt === category;
  });
  if (matchedAsset) return { url: addVersion(matchedAsset.url), source: 'S3_ASSET_MATCH' };

  // 5c. Thematic manual fallbacks
  const theme = NOVEL_THEMES[novelId];
  if (theme) {
     const themedUrl = theme[category] || theme['default'];
     if (themedUrl) return { url: themedUrl, source: 'THEMATIC_FALLBACK' };
  }

  // 6. Last resort: Local static asset
  return { url: addVersion(`/images/backgrounds/${category}.png`), source: 'LOCAL_FALLBACK' };
}
