import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, CheckCircle2, AlertCircle, Image as ImageIcon } from 'lucide-react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const BACKGROUND_CATEGORIES: Record<string, Record<string, string>> = {
  'great-gatsby': {
    gatsby_mansion: "A cinematic scene from The Great Gatsby, showing the grand exterior of Gatsby's mansion at night with glowing windows and a sense of mystery, 1920s style.",
    buchanan_estate: "A cinematic scene from The Great Gatsby, showing the elegant East Egg estate of the Buchanans, white curtains fluttering in the breeze, 1920s style.",
    valley_of_ashes_scene: "A cinematic scene from The Great Gatsby, showing the desolate valley of ashes with the fading billboard of Doctor T.J. Eckleburg, 1920s style.",
    new_york_city_1920s: "A cinematic scene from The Great Gatsby, showing a bustling New York City street in the 1920s, vintage cars, and vibrant energy.",
    long_island_dock: "A cinematic scene from The Great Gatsby, showing a lonely dock at night with a single green light shining in the distance across the water."
  },
  'pride-prejudice': {
    longbourn_estate: "A cinematic scene from Pride and Prejudice, showing the charming Longbourn estate in the English countryside, rolling green hills, early 19th century style.",
    netherfield_park: "A cinematic scene from Pride and Prejudice, showing the grand Netherfield Park mansion, elegant architecture, horse-drawn carriages, Regency era.",
    meryton_village: "A cinematic scene from Pride and Prejudice, showing the bustling village of Meryton with red-coated officers and townspeople, 19th century England.",
    pemberley_exterior: "A cinematic scene from Pride and Prejudice, showing the magnificent Pemberley estate, a large stone building with a beautiful lake in front, Regency style.",
    ballroom_scene: "A cinematic scene from Pride and Prejudice, showing a crowded ballroom with people in Regency attire dancing under chandeliers, elegant atmosphere."
  },
  'animal-farm': {
    barn: "A large, rustic barn interior at night, straw on the floor, dim lanterns overhead, sense of solemn gathering.",
    farm_yard: "Manor Farm yard, a collection of old buildings, tools scattered around, rustic and earthy farm aesthetic.",
    hayfield: "A sunny hayfield with golden hay being harvested by animals, dramatic sky, social realism style.",
    battlefield: "The Battle of the Cowshed, animals defending a gate against humans, chaotic and heroic atmosphere.",
    windmill: "A grand windmill sitting atop a hill against a turbulent sky, majestic and symbolic.",
    farmhouse: "The exterior of the Manor house, looking slightly neglected, brick walls, traditional English farm architecture.",
    pigs_humans: "A climactic scene in a dining room where pigs and humans are sitting together, dim light, shifting shadows, haunting resemblance.",
    default: "A panoramic view of Manor Farm, rolling hills, orchard, and far off buildings under a dramatic sky."
  },
  'alice-wonderland': {
    riverbank: "A serene 19 Victorian era riverbank, lush green grass, a gentle river flowing, idyllic English countryside afternoon, cinematic lighting, whimsical atmosphere.",
    rabbit_hole: "A deep, mysterious rabbit hole well, the sides filled with cupboards and bookshelves, maps and pictures hanging on pegs, looking down into darkness, whimsical and surreal.",
    hall_of_doors: "A long, low hall lit by a row of lamps hanging from the roof, many locked doors of all sizes all around the wood-paneled walls, Victorian aesthetic.",
    pool_of_tears: "A large hall filled with a deep pool of salt water, ripples in the water, dim mysterious lighting, surreal proportions.",
    tea_party: "A long table set out under a tree in front of a house, the March Hare and the Hatter having tea, many tea sets, large tree, whimsical garden setting.",
    garden: "The loveliest garden imaginable, bright flower beds, cool fountains, vibrant colors, seen through a tiny door, dreamlike Victorian garden.",
    courtroom: "A grand, whimsical courtroom filled with playing cards as jurors and officers, King and Queen of Hearts on a throne, surreal and colorful.",
    default: "A whimsical, dreamlike landscape of Wonderland, odd-shaped trees, vibrant colors, floating elements, surreal Victorian fantasy style."
  }
};

export function ImageGenerator({ novelId = 'great-gatsby', onComplete }: { novelId?: string, onComplete?: () => void }) {
  const [status, setStatus] = useState<Record<string, 'idle' | 'generating' | 'saving' | 'done' | 'error'>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const categories = BACKGROUND_CATEGORIES[novelId] || BACKGROUND_CATEGORIES['great-gatsby'];

  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  const generateAndSave = async (category: string, prompt: string) => {
    setStatus(prev => ({ ...prev, [category]: 'generating' }));
    addLog(`Generating image for ${category}...`);
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9",
          },
        },
      });

      const part = response.candidates[0].content.parts.find(p => p.inlineData);
      if (!part || !part.inlineData) {
        throw new Error("No image data in response");
      }

      const base64Data = part.inlineData.data;

      setStatus(prev => ({ ...prev, [category]: 'saving' }));
      addLog(`Saving image for ${category} to local and S3...`);

      // 1. Save to local filesystem (for the current environment)
      const saveRes = await fetch('/api/save-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          base64Data
        })
      });

      if (!saveRes.ok) addLog(`Warning: Failed to save ${category} to local filesystem.`);

      // 2. Save to S3 (for shared persistence)
      try {
        const s3Res = await fetch('/api/s3/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: `novels/${novelId}/backgrounds/${category}.png`,
            base64Data,
            contentType: 'image/png'
          })
        });
        if (s3Res.ok) {
          addLog(`Successfully saved ${category} to S3.`);
          if (onComplete) onComplete();
        } else {
          const errorData = await s3Res.json().catch(() => ({ error: 'Unknown error' }));
          addLog(`Error: Failed to save ${category} to S3. Status: ${s3Res.status} - ${errorData.error || s3Res.statusText}`);
        }
      } catch (s3Error: any) {
        console.error("S3 save error:", s3Error);
        addLog(`Error saving ${category} to S3: ${s3Error.message}`);
      }

      setStatus(prev => ({ ...prev, [category]: 'done' }));
      addLog(`Successfully completed ${category}`);
    } catch (error: any) {
      console.error(error);
      setStatus(prev => ({ ...prev, [category]: 'error' }));
      addLog(`Error for ${category}: ${error.message}`);
    }
  };

  const runAll = async () => {
    setIsProcessing(true);
    addLog(`Clearing existing backgrounds for ${novelId} from S3 and local state...`);
    
    try {
      const clearRes = await fetch(`/api/s3/clear-novel?novelId=${novelId}`, { method: 'POST' });
      if (clearRes.ok) {
        addLog(`S3 storage for ${novelId} cleared successfully.`);
      } else {
        // Fallback to clear-all if clear-novel is not implemented or fails
        const fallbackRes = await fetch('/api/s3/clear-all', { method: 'POST' });
        if (fallbackRes.ok) {
          addLog("S3 storage cleared successfully (fallback).");
        } else {
          addLog("Warning: Failed to clear S3 storage. Continuing anyway...");
        }
      }
    } catch (e) {
      addLog("Error clearing S3 storage. Continuing anyway...");
    }

    // Clear local storage overrides
    localStorage.removeItem('sceneBackgroundOverrides');
    localStorage.removeItem('sceneImageOverrides');
    addLog("Local storage overrides cleared.");

    for (const [category, prompt] of Object.entries(categories)) {
      await generateAndSave(category, prompt);
      // Small delay between generations
      await new Promise(r => setTimeout(r, 2000));
    }
    setIsProcessing(false);
    addLog("All tasks completed. Please refresh the page to see changes.");
  };

  return (
    <Card className="p-6 bg-white/90 backdrop-blur-md border-none shadow-xl max-w-4xl w-full mx-auto my-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ImageIcon className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold font-serif">Background Image Generator</h2>
        </div>
        <div className="flex gap-2">
          <Button onClick={runAll} disabled={isProcessing} className="rounded-none">
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Generate {Object.keys(categories).length} New Backgrounds
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {Object.keys(categories).map(cat => (
          <div key={cat} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
            <span className="text-sm font-medium truncate mr-2">{cat}</span>
            <div className="shrink-0">
              {status[cat] === 'generating' && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
              {status[cat] === 'saving' && <Loader2 className="w-4 h-4 animate-spin text-orange-500" />}
              {status[cat] === 'done' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
              {status[cat] === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
              {(!status[cat] || status[cat] === 'idle') && <div className="w-4 h-4 rounded-full border border-gray-300" />}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-xs h-48 overflow-y-auto">
        {logs.map((log, i) => (
          <div key={i} className="mb-1">{`> ${log}`}</div>
        ))}
        {logs.length === 0 && <div className="opacity-50">Waiting for start...</div>}
      </div>
    </Card>
  );
}
