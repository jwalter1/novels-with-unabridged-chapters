import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { S3Client, PutObjectCommand, ListObjectsV2Command, HeadObjectCommand, GetObjectCommand, DeleteObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { config } from "dotenv";

import { GoogleGenAI } from "@google/genai";

// Load environment variables
config(); // Load .env
config({ path: '.env.local' }); // Overlay .env.local if available

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lazy Gemini Client
let genAI: GoogleGenAI | null = null;
function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY missing. Image generation will be disabled.");
      return null;
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

// Lazy S3 Client
let s3Client: S3Client | null = null;
function getS3Client() {
  if (!s3Client) {
    const region = process.env.AWS_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const bucket = process.env.AWS_S3_BUCKET_NAME;

    if (!region || !accessKeyId || !secretAccessKey || !bucket) {
      const missing = [];
      if (!region) missing.push("AWS_REGION");
      if (!accessKeyId) missing.push("AWS_ACCESS_KEY_ID");
      if (!secretAccessKey) missing.push("AWS_SECRET_ACCESS_KEY");
      if (!bucket) missing.push("AWS_S3_BUCKET_NAME");
      
      console.warn(`AWS S3 configuration incomplete. Missing: ${missing.join(", ")}. S3 features will be disabled.`);
      return null;
    }

    s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }
  return s3Client;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", s3Configured: !!getS3Client() });
  });

  // Global API Logger to help debugging
  app.use("/api", (req, res, next) => {
    console.log(`[API] ${req.method} ${req.path}`, req.query);
    next();
  });

  // API route to save generated images
  app.post("/api/save-image", (req, res) => {
    const { category, base64Data } = req.body;
    if (!category || !base64Data) {
      return res.status(400).json({ error: "Missing category or base64Data" });
    }

    try {
      const buffer = Buffer.from(base64Data, 'base64');
      const dir = path.join(process.cwd(), 'public/images/backgrounds');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const filePath = path.join(dir, `${category}.png`);
      fs.writeFileSync(filePath, buffer);
      console.log(`Saved image: ${filePath}`);
      res.json({ success: true, path: `/images/backgrounds/${category}.png` });
    } catch (error) {
      console.error("Error saving image:", error);
      res.status(500).json({ error: "Failed to save image" });
    }
  });

  // S3 Upload Route
  app.post("/api/s3/upload", async (req, res) => {
    const { key, base64Data, contentType } = req.body;
    const client = getS3Client();
    const bucket = process.env.AWS_S3_BUCKET_NAME;

    if (!client || !bucket) {
      return res.status(503).json({ error: "S3 service not configured" });
    }

    try {
      const buffer = Buffer.from(base64Data, 'base64');
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType || 'application/octet-stream',
      });

      await client.send(command);
      const proxyUrl = `/api/s3/get?key=${encodeURIComponent(key)}`;
      res.json({ success: true, url: proxyUrl });
    } catch (error) {
      console.error("S3 Upload failed:", error);
      res.status(500).json({ error: "S3 upload failed" });
    }
  });

  // S3 List Route (to sync state)
  app.get("/api/s3/list", async (req, res) => {
    try {
      const { prefix } = req.query;
      const client = getS3Client();
      const bucket = process.env.AWS_S3_BUCKET_NAME;

      if (!client || !bucket) {
        return res.status(503).json({ error: "S3 service not configured", prefix });
      }

      const command = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: (prefix as string) || '',
      });

      const response = await client.send(command);
      const items = response.Contents?.map(item => ({
        key: item.Key,
        url: `/api/s3/get?key=${encodeURIComponent(item.Key || '')}`
      })) || [];

      res.setHeader('Content-Type', 'application/json');
      res.json({ success: true, items });
    } catch (error: any) {
      console.error("S3 List failed:", error);
      res.status(500).json({ 
        error: "S3 list failed", 
        message: error.message,
        code: error.code || error.name
      });
    }
  });

  // S3 Check Route (for specific files)
  app.get("/api/s3/exists", async (req, res) => {
    const { key } = req.query;
    if (!key) return res.status(400).json({ error: "Missing key" });

    const client = getS3Client();
    const bucket = process.env.AWS_S3_BUCKET_NAME;

    if (!client || !bucket) {
      return res.status(503).json({ error: "S3 service not configured" });
    }

    try {
      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: key as string,
      });
      await client.send(command);
      // Return a proxy URL instead of a direct S3 URL to avoid CORS and DNS issues
      const proxyUrl = `/api/s3/get?key=${encodeURIComponent(key as string)}`;
      res.json({ exists: true, url: proxyUrl });
    } catch (error) {
      res.json({ exists: false });
    }
  });

  // S3 Proxy Get Route
  app.get("/api/s3/get", async (req, res) => {
    const { key } = req.query;
    if (!key) return res.status(400).json({ error: "Missing key" });

    const client = getS3Client();
    const bucket = process.env.AWS_S3_BUCKET_NAME;

    if (!client || !bucket) {
      return res.status(503).json({ error: "S3 service not configured" });
    }

    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key as string,
      });

      const response = await client.send(command);
      if (response.ContentType) {
        res.setHeader('Content-Type', response.ContentType);
      }
      
      if (response.Body) {
        // Stream the body to the response
        const stream = response.Body as any;
        stream.pipe(res);
      } else {
        res.status(404).json({ error: "Object body is empty" });
      }
    } catch (error: any) {
      if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
        // Quiet 404s
        return res.status(404).json({ error: "Object not found" });
      }
      console.error("S3 Get failed:", error);
      res.status(error.$metadata?.httpStatusCode || 500).json({ error: "S3 get failed" });
    }
  });

  // S3 Delete Route
  app.delete("/api/s3/delete", async (req, res) => {
    const { key } = req.body;
    if (!key) return res.status(400).json({ error: "Missing key" });

    const client = getS3Client();
    const bucket = process.env.AWS_S3_BUCKET_NAME;

    if (!client || !bucket) {
      return res.status(503).json({ error: "S3 service not configured" });
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key as string,
      });

      await client.send(command);
      res.json({ success: true, message: `Deleted ${key}` });
    } catch (error: any) {
      console.error("S3 Delete failed:", error);
      res.status(error.$metadata?.httpStatusCode || 500).json({ error: "S3 delete failed" });
    }
  });

  // S3 Clear Novel Route
  app.post("/api/s3/clear-novel", async (req, res) => {
    const { novelId } = req.query;
    if (!novelId) return res.status(400).json({ error: "Missing novelId" });

    const client = getS3Client();
    const bucket = process.env.AWS_S3_BUCKET_NAME;

    if (!client || !bucket) {
      return res.status(503).json({ error: "S3 service not configured" });
    }

    try {
      const prefix = `novels/${novelId}/`;
      const listCommand = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
      });

      const listResponse = await client.send(listCommand);
      let totalDeleted = 0;
      
      if (listResponse.Contents && listResponse.Contents.length > 0) {
        const allKeys = listResponse.Contents
          .filter(item => item.Key)
          .map(item => ({ Key: item.Key! }));

        // S3 DeleteObjects supports max 1000 objects per call
        const chunks = [];
        for (let i = 0; i < allKeys.length; i += 1000) {
          chunks.push(allKeys.slice(i, i + 1000));
        }

        for (const chunk of chunks) {
          const deleteCommand = new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: {
              Objects: chunk,
              Quiet: true
            }
          });
          await client.send(deleteCommand);
          totalDeleted += chunk.length;
        }
      }

      res.json({ success: true, message: `Cleared ${totalDeleted} objects for novel ${novelId} from S3.` });
    } catch (error) {
      console.error("S3 Clear Novel failed:", error);
      res.status(500).json({ error: "S3 clear novel failed" });
    }
  });

  // S3 Clear All Route
  app.post("/api/s3/clear-all", async (req, res) => {
    const client = getS3Client();
    const bucket = process.env.AWS_S3_BUCKET_NAME;

    if (!client || !bucket) {
      return res.status(503).json({ error: "S3 service not configured" });
    }

    try {
      // Clear backgrounds/ and scenes/ prefixes
      const prefixes = ['backgrounds/', 'scenes/', 'novels/'];
      let totalDeletedCount = 0;

      for (const prefix of prefixes) {
        const listCommand = new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
        });

        const listResponse = await client.send(listCommand);
        if (listResponse.Contents && listResponse.Contents.length > 0) {
          const allKeys = listResponse.Contents
            .filter(item => item.Key)
            .map(item => ({ Key: item.Key! }));

          // S3 DeleteObjects supports max 1000 objects per call
          const chunks = [];
          for (let i = 0; i < allKeys.length; i += 1000) {
            chunks.push(allKeys.slice(i, i + 1000));
          }

          for (const chunk of chunks) {
            const deleteCommand = new DeleteObjectsCommand({
              Bucket: bucket,
              Delete: {
                Objects: chunk,
                Quiet: true
              }
            });
            await client.send(deleteCommand);
            totalDeletedCount += chunk.length;
          }
        }
      }

      res.json({ success: true, message: `Cleared ${totalDeletedCount} objects from S3.` });
    } catch (error) {
      console.error("S3 Clear All failed:", error);
      res.status(500).json({ error: "S3 clear all failed" });
    }
  });

  // Book Import Proxy
  app.get("/api/import/fetch", async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: "Missing url parameter" });
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch from Gutenberg: ${response.statusText}`);
      }
      const text = await response.text();
      res.json({ success: true, text });
    } catch (error: any) {
      console.error("Book fetch failed:", error);
      res.status(500).json({ error: "Failed to fetch book content", message: error.message });
    }
  });

  // Migrate local backgrounds to S3
  app.post("/api/s3/migrate-local", async (req, res) => {
    const client = getS3Client();
    const bucket = process.env.AWS_S3_BUCKET_NAME;
    const dir = path.join(process.cwd(), 'public/images/backgrounds');

    if (!client || !bucket) {
      return res.status(503).json({ error: "S3 service not configured" });
    }

    if (!fs.existsSync(dir)) {
      return res.json({ success: true, message: "No local backgrounds found to migrate.", count: 0 });
    }

    try {
      const files = fs.readdirSync(dir);
      let migratedCount = 0;

      for (const file of files) {
        if (file.endsWith('.png')) {
          const filePath = path.join(dir, file);
          const fileContent = fs.readFileSync(filePath);
          const key = `backgrounds/${file}`;

          const command = new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: fileContent,
            ContentType: 'image/png',
          });

          await client.send(command);
          migratedCount++;
          console.log(`Migrated local file to S3: ${key}`);
        }
      }

      res.json({ success: true, message: `Migrated ${migratedCount} local backgrounds to S3.`, count: migratedCount });
    } catch (error) {
      console.error("Migration failed:", error);
      res.status(500).json({ error: "Local migration failed" });
    }
  });

  // ElevenLabs TTS Proxy
  app.post("/api/tts/elevenlabs", async (req, res) => {
    const { text, voiceId, stability, similarityBoost } = req.body;
    const rawApiKey = process.env.ELEVENLABS_API_KEY;
    const apiKey = rawApiKey?.trim();

    if (!apiKey) {
      return res.status(503).json({ 
        error: "ElevenLabs API key not configured",
        message: "Please set ELEVENLABS_API_KEY in your environment variables or Secrets panel."
      });
    }

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability: stability || 0.5,
            similarity_boost: similarityBoost || 0.75,
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        console.error("ElevenLabs API error:", JSON.stringify(errorData));
        
        const isInvalidKey = response.status === 401 || (errorData.detail && errorData.detail.status === 'invalid_api_key');
        
        return res.status(response.status).json({ 
          error: isInvalidKey ? "Invalid ElevenLabs API Key" : "ElevenLabs API error", 
          message: isInvalidKey 
            ? "The provided ElevenLabs API key is invalid. Please check your key in the ElevenLabs dashboard and update it in the Secrets panel."
            : (errorData.detail?.message || errorData.message || "Unknown ElevenLabs error"),
          details: errorData 
        });
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Data = buffer.toString('base64');
      
      res.json({ success: true, base64Data });
    } catch (error) {
      console.error("ElevenLabs TTS failed:", error);
      res.status(500).json({ error: "ElevenLabs TTS failed" });
    }
  });

  // ElevenLabs Get Voices Proxy
  app.get("/api/tts/elevenlabs/voices", async (req, res) => {
    const rawApiKey = process.env.ELEVENLABS_API_KEY;
    const apiKey = rawApiKey?.trim();

    if (!apiKey) {
      return res.status(503).json({ 
        error: "ElevenLabs API key not configured",
        message: "Please set ELEVENLABS_API_KEY in your environment variables or Secrets panel."
      });
    }

    try {
      const response = await fetch("https://api.elevenlabs.io/v1/voices", {
        headers: {
          'xi-api-key': apiKey,
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return res.status(response.status).json({ 
          error: "Failed to fetch voices from ElevenLabs",
          message: errorData.detail?.message || "Unknown error"
        });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("ElevenLabs Get Voices failed:", error);
      res.status(500).json({ error: "Failed to connect to ElevenLabs API" });
    }
  });

  // Catch-all for API routes to prevent falling through to Vite/SPA
  app.use("/api", (req, res) => {
    console.warn(`API route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ 
      error: "API route not found", 
      method: req.method, 
      path: req.originalUrl || req.url,
      suggestion: "Check if the route is defined in server.ts and matches the method and path exactly."
    });
  });

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled server error:", err);
    if (req.path.startsWith('/api')) {
      res.status(500).json({ 
        error: "Internal server error", 
        message: err.message,
        path: req.path
      });
    } else {
      next(err);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
