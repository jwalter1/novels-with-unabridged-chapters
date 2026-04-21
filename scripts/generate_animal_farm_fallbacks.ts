
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { GoogleGenAI } from "@google/genai";
import { NOVEL_THEMES } from "../src/data/thematicBackgrounds";
import { NOVELS_METADATA } from "../src/data/novels/metadata";

// Note: In this environment, GEMINI_API_KEY and AWS credentials are provided as environment variables
// by the platform during process execution. We don't necessarily need dotenv if they are already there.

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const AWS_REGION = process.env.AWS_REGION;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

async function generateAndUpload(novelId: string) {
  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is missing in process.env");
    // Fallback: try to see if it's in any common file just in case, or just error out
    return;
  }

  const s3Client = (AWS_REGION && AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) 
    ? new S3Client({
        region: AWS_REGION,
        credentials: {
          accessKeyId: AWS_ACCESS_KEY_ID,
          secretAccessKey: AWS_SECRET_ACCESS_KEY,
        },
      })
    : null;

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  const theme = NOVEL_THEMES[novelId];
  if (!theme) {
    console.error(`No theme found for novel: ${novelId}`);
    return;
  }

  const metadata = NOVELS_METADATA.find(n => n.id === novelId);
  const stylePrompt = metadata?.stylePrompt || "";
  const novelTitle = metadata?.title || novelId;

  const keys = Object.keys(theme).filter(k => k !== 'default');
  console.log(`Starting generation for ${novelId}. Total keys: ${keys.length}`);

  for (const key of keys) {
    const s3Path = `backgrounds/fallbacks/${novelId}/${key}.png`;
    
    // Check if exists
    if (s3Client && AWS_S3_BUCKET_NAME) {
      try {
        await s3Client.send(new HeadObjectCommand({
          Bucket: AWS_S3_BUCKET_NAME,
          Key: s3Path,
        }));
        console.log(`Skipping ${key}, already exists in S3.`);
        continue;
      } catch (e) {
        // Does not exist, proceed
      }
    }

    let retries = 3;
    let success = false;
    let currentDelay = 5000;

    while (retries > 0 && !success) {
      console.log(`Generating ${key}... (Attempt ${4 - retries})`);
      try {
        const prompt = `A cinematic scene from ${novelTitle}: ${key.replace(/_/g, ' ')}. ${stylePrompt}`;
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [{ text: prompt }] },
          config: {
            // @ts-ignore
            imageConfig: {
              aspectRatio: "16:9",
            },
          },
        });

        const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (!part || !part.inlineData) {
          throw new Error("No image data in response");
        }

        const buffer = Buffer.from(part.inlineData.data, 'base64');

        if (s3Client && AWS_S3_BUCKET_NAME) {
          await s3Client.send(new PutObjectCommand({
            Bucket: AWS_S3_BUCKET_NAME,
            Key: s3Path,
            Body: buffer,
            ContentType: 'image/png',
          }));
          console.log(`Successfully uploaded ${key} to S3.`);
        } else {
          console.log(`S3 not configured, would have uploaded to ${s3Path}`);
        }
        success = true;
      } catch (error: any) {
        console.error(`Failed to process ${key}:`, error.message);
        if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('Rate limit')) {
          console.log(`Rate limit reached, waiting ${currentDelay}ms...`);
          await new Promise(r => setTimeout(r, currentDelay));
          currentDelay *= 2;
          retries--;
        } else {
          break; // Non-retryable
        }
      }
    }

    if (!success) {
      console.error(`Giving up on ${key} after all retries.`);
    }

    // Delay to avoid rate limits between Successful keys
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  console.log(`Finished generation for ${novelId}.`);
}

generateAndUpload('animal-farm').catch(console.error);
