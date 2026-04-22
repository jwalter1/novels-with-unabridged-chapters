import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function generateImage(prompt: string, options: { aspectRatio?: "1:1" | "4:3" | "3:4" | "16:9" | "9:16" } = {}): Promise<string> {
  console.log("Generating image with prompt:", prompt);
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: options.aspectRatio || "16:9",
        },
      },
    });

    console.log("Gemini response received");
    const candidate = response.candidates?.[0];
    
    if (candidate?.finishReason === 'IMAGE_SAFETY' || candidate?.finishReason === 'SAFETY') {
      console.error("Safety filters triggered for prompt:", prompt);
      throw new Error("Safety filters triggered. The prompt resulted in an image that violated safety guidelines. Please modify your prompt and try again.");
    }

    const part = candidate?.content?.parts?.find(p => p.inlineData);
    if (!part || !part.inlineData) {
      console.error("Full Gemini response:", JSON.stringify(response));
      throw new Error("No image data in response. The model might have refused to generate the image or returned text instead.");
    }

    return part.inlineData.data;
  } catch (error) {
    console.error("Error in generateImage:", error);
    throw error;
  }
}

export async function uploadToS3(key: string, base64Data: string, contentType: string = 'image/png'): Promise<string> {
  const res = await fetch('/api/s3/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key,
      base64Data,
      contentType
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || 'Failed to upload to S3');
  }

  const data = await res.json();
  return data.url;
}

export async function checkS3Exists(key: string): Promise<{ exists: boolean, url?: string }> {
  const res = await fetch(`/api/s3/exists?key=${encodeURIComponent(key)}`);
  if (!res.ok) return { exists: false };
  return res.json();
}

export async function listS3Objects(prefix: string): Promise<any[]> {
  const res = await fetch(`/api/s3/list?prefix=${encodeURIComponent(prefix)}`);
  if (!res.ok) throw new Error('Failed to list S3 objects');
  const data = await res.json();
  return data.items || [];
}

export async function deleteS3Object(key: string): Promise<boolean> {
  const res = await fetch('/api/s3/delete', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete from S3');
  }
  return true;
}

export async function uploadMetadata(key: string, data: any): Promise<string> {
  const jsonStr = JSON.stringify(data);
  // Using btoa(unescape(encodeURIComponent(str))) for UTF-8 support
  const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
  return uploadToS3(key, base64, 'application/json');
}

export async function getS3Metadata(key: string): Promise<any | null> {
  try {
    const res = await fetch(`/api/s3/get?key=${encodeURIComponent(key)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch metadata:", error);
    return null;
  }
}
