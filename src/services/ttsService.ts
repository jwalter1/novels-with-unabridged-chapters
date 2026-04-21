import { GoogleGenAI, Modality } from "@google/genai";
import { getFromCache, saveToCache } from "./cacheService";
import { loadNovelVoiceConfig } from "./voiceService";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Simple hash function for long text keys
export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

export type VoiceName = 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr' | 'ElevenLabs';

export const AVAILABLE_VOICES: VoiceName[] = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr', 'ElevenLabs'];

// ElevenLabs Voice IDs (Stable premade IDs)
export const ELEVENLABS_VOICES: Record<string, string> = {
  "narrator": "VzzQxirNxoUBjt9JX9x1",
  // Gatsby
  "nick": "VzzQxirNxoUBjt9JX9x1",
  "gatsby": "6T2lwZxUBjXNMH6EDorg",
  "daisy": "pFZP5JQG7iQjIQuC4Bku",
  "tom": "TpMzwtynHUUD1BnP3qXf",
  "jordan": "PTyTN8TukbdyDcKIUcgu",
  "george": "ZAoB6Mpjo0oSLP7rKuSI",
  // Pride & Prejudice
  "elizabeth": "jsVTtGjzE0XdX8oouuwA",
  "darcy": "pRmuAdMfWKpAUQsFEdcX",
  "mrs-bennet": "pFZP5JQG7iQjIQuC4Bku",
  "mrs_bennet": "pFZP5JQG7iQjIQuC4Bku",
  "mr-bennet": "TpMzwtynHUUD1BnP3qXf",
  "mr_bennet": "TpMzwtynHUUD1BnP3qXf",
  "jane": "PTyTN8TukbdyDcKIUcgu",
  "bingley": "ZxmUjfjoiHmPagR5cG3x",
  "collins": "ZAoB6Mpjo0oSLP7rKuSI",
  "mary": "9KFC9oy7jNpnZuStIkNm",
  "charlotte": "rWCJdxYgmJHLqe5gPqdn",
  "a-young-lucas": "iQLo49PAY96rjbBg9reW",
  "a_young_lucas": "iQLo49PAY96rjbBg9reW",
  "lady-catherine": "iFKTMSbjft5CuZnruZLs",
  "lady_catherine": "iFKTMSbjft5CuZnruZLs",
  "lydia": "3nhy3G62R6gHf6A08QU2",
  "mrs-gardiner": "pFZP5JQG7iQjIQuC4Bku",
  "mr-gardiner": "TpMzwtynHUUD1BnP3qXf",
};

export const CHARACTER_VOICES: Record<string, VoiceName> = {
  "narrator": "ElevenLabs",
  // Gatsby
  "nick": "ElevenLabs",
  "gatsby": "ElevenLabs",
  "daisy": "ElevenLabs",
  "tom": "ElevenLabs",
  "jordan": "ElevenLabs",
  "myrtle": "ElevenLabs",
  "george": "ElevenLabs",
  // Pride & Prejudice
  "elizabeth": "ElevenLabs",
  "darcy": "ElevenLabs",
  "mrs_bennet": "ElevenLabs",
  "mr_bennet": "ElevenLabs",
  "jane": "ElevenLabs",
  "bingley": "ElevenLabs",
  "collins": "ElevenLabs",
  "mary": "ElevenLabs",
  "charlotte": "ElevenLabs",
  "a-young-lucas": "ElevenLabs",
  "a_young_lucas": "ElevenLabs",
  "lady-catherine": "ElevenLabs",
  "lady_catherine": "ElevenLabs",
  "lydia": "ElevenLabs",
  "mrs-gardiner": "ElevenLabs",
  "mr-gardiner": "ElevenLabs",
};

const CHARACTER_TONES: Record<string, string> = {
  "nick": "reserved, observant, and thoughtful",
  "gatsby": "charismatic, hopeful, and slightly mysterious",
  "daisy": "delicate, charming, and superficial with a 'voice full of money'",
  "tom": "sturdy, supercilious, and aggressive",
  "jordan": "wan, charming, and discontented",
  "myrtle": "coarse, energetic, and vital",
  "george": "spiritless, anaemic, and defeated",
  "narrator": "brisk, engaging, and clear storytelling",
  // Pride & Prejudice
  "elizabeth": "intelligent, witty, and lively",
  "darcy": "proud, noble, and initially aloof",
  "mrs_bennet": "excitable, nervous, and obsessed with marriage",
  "mr_bennet": "sarcastic, cynical, and detached",
  "jane": "gentle, kind, and optimistic",
  "bingley": "friendly, cheerful, and agreeable",
  "collins": "pompous, obsequious, and formal",
  "mary": "pedantic, moralizing, and serious",
  "charlotte": "sensible, practical, and pragmatic",
  "lady-catherine": "authoritative, condescending, and arrogant",
  "lady_catherine": "authoritative, condescending, and arrogant",
  "lydia": "wild, noisy, and flirtatious",
  "mrs-gardiner": "perceptive, gentle, and elegant",
  "mr-gardiner": "sensible, intelligent, and kindly",
  "a-young-lucas": "youthful, eager, and polite",
  "a_young_lucas": "youthful, eager, and polite",
};

const VOICE_CONFIG_CACHE: Record<string, any> = {};

export function clearVoiceConfigCache(novelId?: string) {
  if (novelId) {
    delete VOICE_CONFIG_CACHE[novelId];
  } else {
    for (const key in VOICE_CONFIG_CACHE) {
      delete VOICE_CONFIG_CACHE[key];
    }
  }
}

export async function generateSpeech(text: string, characterId?: string, voiceOverride?: VoiceName, force = false, novelId?: string, gender?: 'male' | 'female', customVoiceId?: string): Promise<string | null> {
  try {
    const charId = characterId || "narrator";
    const voiceName = voiceOverride || CHARACTER_VOICES[charId] || "ElevenLabs";
    const tone = CHARACTER_TONES[charId] || "neutral";
    
    // Create a unique cache key based on text, character, and voice
    // If customVoiceId is provided, we should probably bypass cache or use it in the key
    const cacheKey = customVoiceId 
      ? `custom:${customVoiceId}:${hashString(text)}`
      : `${novelId || 'global'}:${charId}:${voiceName}:${text}`;
    
    const docId = customVoiceId 
      ? `custom_${customVoiceId}_${hashString(text)}`
      : `${charId}_${voiceName}_${hashString(text)}`;

    const prefix = novelId ? `novels/${novelId}/audio/` : 'audio/';
    const s3Key = `${prefix}${docId}.pcm`;
    
    if (!force) {
      // 1. Check local cache
      const cachedAudio = await getFromCache('audio', cacheKey);
      if (cachedAudio) return cachedAudio;

      // 2. Check S3 for shared audio
      try {
        const response = await fetch(`/api/s3/exists?key=${encodeURIComponent(s3Key)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.exists) {
            // data.url is now a proxy URL: /api/s3/get?key=...
            const audioResponse = await fetch(data.url);
            if (audioResponse.ok) {
              const arrayBuffer = await audioResponse.arrayBuffer();
              // Safer way to convert ArrayBuffer to Base64
              const uint8Array = new Uint8Array(arrayBuffer);
              let binary = '';
              const len = uint8Array.byteLength;
              for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(uint8Array[i]);
              }
              const base64 = btoa(binary);
              
              await saveToCache('audio', cacheKey, base64);
              return base64;
            } else {
              console.warn(`S3 Proxy Get failed for ${docId}:`, audioResponse.status);
            }
          }
        }
      } catch (e) {
        console.error("Error checking S3 for audio:", e);
      }
    }

    // Prefix the text with a style instruction for the TTS model
    const styledText = `Say this in a ${tone} tone with an American accent: ${text}`;
    
    let base64Audio: string | undefined;

    if (voiceName === 'ElevenLabs') {
      // Logic for voice selection: 
      // 1. Use customVoiceId if provided
      // 2. Check if specific ID is mapped for this charId in Firestore/Custom Config
      // 3. Fallback to hardcoded mappings
      // 4. Fallback to gender-based defaults
      // 5. Fallback to narrator default
      
      let voiceId = customVoiceId || "";
      
      if (!voiceId) {
        // Load from novel voice config if possible
        if (novelId) {
          if (!VOICE_CONFIG_CACHE[novelId]) {
             const config = await loadNovelVoiceConfig(novelId);
             VOICE_CONFIG_CACHE[novelId] = config || { voiceMappings: {} };
          }
          voiceId = VOICE_CONFIG_CACHE[novelId].voiceMappings?.[charId];
        }

        // 2. Hardcoded mappings
        if (!voiceId) {
          voiceId = ELEVENLABS_VOICES[charId];
        }

        if (!voiceId) {
          if (gender === 'male') {
            voiceId = "VzzQxirNxoUBjt9JX9x1"; // Default Male
          } else if (gender === 'female') {
            voiceId = "5l5f8iK3YPeGga21rQIX"; // Default Female
          } else {
            voiceId = ELEVENLABS_VOICES["narrator"];
          }
        }
      }
      
      const response = await fetch('/api/tts/elevenlabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceId
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        base64Audio = data.base64Data;
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || "ElevenLabs request failed";
        console.error("ElevenLabs proxy failed:", errorMessage);
        
        // Throw specific errors so UI can handle them
        if (response.status === 401 || (errorData.error && errorData.error.includes("Invalid"))) {
          throw new Error(`ELEVENLABS_AUTH_ERROR: ${errorMessage}`);
        }
        if (response.status === 429 || errorMessage.toLowerCase().includes('quota') || errorMessage.toLowerCase().includes('credit')) {
          throw new Error(`ELEVENLABS_QUOTA_ERROR: ${errorMessage}`);
        }

        console.warn("Falling back to Gemini due to non-critical ElevenLabs error");
      }
    }

    if (!base64Audio) {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: styledText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { 
                voiceName: voiceName === 'ElevenLabs' ? 'Zephyr' : voiceName 
              },
            },
          },
        },
      });
      base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    }

    if (base64Audio) {
      await saveToCache('audio', cacheKey, base64Audio);

      // 3. Save to S3
      try {
        const s3Res = await fetch('/api/s3/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: s3Key,
            base64Data: base64Audio,
            contentType: 'application/octet-stream'
          })
        });
        if (!s3Res.ok) {
          const errorData = await s3Res.json().catch(() => ({ error: 'Unknown error' }));
          console.error("S3 Audio Upload failed:", s3Res.status, errorData);
        }
      } catch (s3Error) {
        console.error("Failed to save audio to S3:", s3Error);
      }
    }
    return base64Audio || null;
  } catch (error: any) {
    if (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error('QUOTA_EXCEEDED');
    }
    console.error("TTS Generation failed:", error);
    return null;
  }
}

let currentSource: AudioBufferSourceNode | null = null;
let audioContext: AudioContext | null = null;
let sharedAudioElement: HTMLAudioElement | null = null;

if (typeof window !== 'undefined') {
  sharedAudioElement = new Audio();
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function createWavBlob(pcmData: Uint8Array, sampleRate: number): Blob {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // file length
  view.setUint32(4, 36 + pcmData.length, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (1 = PCM)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, 1, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * 2, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, pcmData.length, true);

  return new Blob([header, pcmData], { type: 'audio/wav' });
}

export function stopAudio() {
  if (sharedAudioElement) {
    sharedAudioElement.pause();
    sharedAudioElement.src = "";
    // Clear any pending state
    sharedAudioElement.onended = null;
    sharedAudioElement.onerror = null;
  }
  if (currentSource) {
    try {
      currentSource.stop();
    } catch (e) {
      // Ignore errors if already stopped
    }
    currentSource = null;
  }
}

export function pauseAudio() {
  if (sharedAudioElement) {
    sharedAudioElement.pause();
  }
}

export function resumeAudio() {
  if (sharedAudioElement) {
    sharedAudioElement.play().catch(err => {
      console.error("Failed to resume audio:", err);
    });
  }
}

const SILENT_AUDIO_OR_WAV = "data:audio/wav;base64,UklGRigAAABXQVZFRm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==";

export async function unlockAudio() {
  if (typeof window === 'undefined') return;

  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  
  if (audioContext.state === 'suspended') {
    try {
      await audioContext.resume();
    } catch (e) {
      console.warn("Failed to resume audioContext:", e);
    }
  }
  
  // Play a silent buffer to fully unlock AudioContext on iOS
  try {
    const buffer = audioContext.createBuffer(1, 1, 24000);
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
  } catch (e) {
    console.warn("Failed to play silent buffer:", e);
  }
  
  // Unlock shared HTMLAudioElement
  if (sharedAudioElement) {
    try {
      // Only play the silent wav if the element is empty, already playing silence, 
      // or has finished its previous source. 
      // We do NOT want to call .play() on a non-silent source that already exists 
      // as it would re-trigger dialogue.
      const isSilentOrEmpty = !sharedAudioElement.src || 
                              sharedAudioElement.src === "" || 
                              sharedAudioElement.src.startsWith('data:');
      
      if (isSilentOrEmpty) {
        sharedAudioElement.src = SILENT_AUDIO_OR_WAV;
        await sharedAudioElement.play().catch(() => {});
      }
    } catch (e) {
      // Silent fail
    }
  }
}

export async function playAudio(base64Data: string, playbackRate: number = 1.0, onEnded?: () => void) {
  stopAudio();
  
  if (!sharedAudioElement) {
    sharedAudioElement = new Audio();
  }

  // Still unlock audio context for general compatibility
  await unlockAudio();

  const binaryString = window.atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Gemini TTS returns raw PCM 16-bit, 24kHz, mono
  // ElevenLabs returns MP3 by default
  const isMp3 = base64Data.startsWith('//O') || base64Data.startsWith('SUQz');
  
  let blob: Blob;
  if (isMp3) {
    blob = new Blob([bytes], { type: 'audio/mpeg' });
  } else {
    // Convert raw PCM to WAV so HTMLAudioElement can play it
    blob = createWavBlob(bytes, 24000);
  }

  const url = URL.createObjectURL(blob);
  sharedAudioElement.src = url;
  
  // Set playback rate and enable pitch preservation
  sharedAudioElement.playbackRate = playbackRate;
  if ('preservesPitch' in sharedAudioElement) {
    sharedAudioElement.preservesPitch = true;
  } else if ('webkitPreservesPitch' in sharedAudioElement) {
    (sharedAudioElement as any).webkitPreservesPitch = true;
  } else if ('mozPreservesPitch' in sharedAudioElement) {
    (sharedAudioElement as any).mozPreservesPitch = true;
  }

  sharedAudioElement.onended = () => {
    URL.revokeObjectURL(url);
    if (onEnded) onEnded();
  };

  sharedAudioElement.onerror = (e) => {
    console.error("Audio playback error:", e);
    URL.revokeObjectURL(url);
  };

  try {
    await sharedAudioElement.play();
  } catch (err) {
    // Some browsers block auto-play even if unlocked, handle gracefully
    console.warn("Audio play() failed (likely auto-play restriction):", err);
    URL.revokeObjectURL(url);
  }
}
