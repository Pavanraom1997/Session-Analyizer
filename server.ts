import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

// Configure storage for uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}-${file.originalname}`);
  },
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB limit
  }
});

// In-memory store for session results (in production, use PostgreSQL)
const sessionStore: Record<string, any> = {};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Request logging middleware
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // Standard middleware for JSON and URL-encoded bodies
  // Moved to top so all routes (including /api/upload/complete) can use it.
  app.use(express.json({ limit: "500mb" }));
  app.use(express.urlencoded({ limit: "500mb", extended: true }));

  // Serve uploaded files
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // --- CHUNKED UPLOAD ENDPOINTS ---
  const chunksDir = path.join(process.cwd(), "chunks");
  if (!fs.existsSync(chunksDir)) fs.mkdirSync(chunksDir);

  app.post("/api/upload/chunk", upload.single("chunk"), (req, res) => {
    try {
      const { sessionId, chunkIndex, totalChunks, fileName } = req.body;
      if (!req.file) return res.status(400).json({ status: "error", message: "No chunk received" });

      const sessionChunkDir = path.join(chunksDir, sessionId);
      if (!fs.existsSync(sessionChunkDir)) fs.mkdirSync(sessionChunkDir);

      const chunkPath = path.join(sessionChunkDir, `chunk-${chunkIndex}`);
      fs.renameSync(req.file.path, chunkPath);

      res.json({ status: "success", message: `Chunk ${chunkIndex} received` });
    } catch (error: any) {
      console.error("Chunk upload error:", error);
      res.status(500).json({ status: "error", message: error.message });
    }
  });

  app.post("/api/upload/complete", async (req, res) => {
    const { sessionId, fileName, totalChunks: totalChunksRaw } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ status: "error", message: "Missing sessionId" });
    }

    const totalChunks = parseInt(totalChunksRaw);
    if (isNaN(totalChunks)) {
      return res.status(400).json({ status: "error", message: "Invalid totalChunks" });
    }
    
    console.log(`[${sessionId}] Finalizing upload for ${fileName}. Total chunks: ${totalChunks}`);
    
    try {
      const sessionChunkDir = path.join(chunksDir, sessionId);
      const uploadsDir = path.join(process.cwd(), "uploads");
      const finalPath = path.join(uploadsDir, `${sessionId}-${fileName}`);

      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      if (!fs.existsSync(sessionChunkDir)) {
        console.error(`[${sessionId}] Chunk directory missing: ${sessionChunkDir}`);
        throw new Error("Chunk directory not found. Upload may have failed or timed out.");
      }

      const writeStream = fs.createWriteStream(finalPath);
      
      const finishPromise = new Promise<void>((resolve, reject) => {
        writeStream.on('finish', () => {
          console.log(`[${sessionId}] WriteStream finished`);
          resolve();
        });
        writeStream.on('error', (err) => {
          console.error(`[${sessionId}] WriteStream error:`, err);
          reject(err);
        });
      });

      // Helper function to write chunks sequentially
      const assembleChunks = async () => {
        for (let i = 0; i < totalChunks; i++) {
          const chunkPath = path.join(sessionChunkDir, `chunk-${i}`);
          if (!fs.existsSync(chunkPath)) {
            throw new Error(`Chunk ${i} missing at ${chunkPath}`);
          }
          const chunkBuffer = fs.readFileSync(chunkPath);
          
          // Handle backpressure
          if (!writeStream.write(chunkBuffer)) {
            await new Promise<void>(resolve => writeStream.once('drain', () => resolve()));
          }
          
          fs.unlinkSync(chunkPath); // Delete chunk after writing
        }
        writeStream.end();
      };

      // Start assembly and wait for both assembly and stream finish
      await assembleChunks();
      await finishPromise;

      console.log(`[${sessionId}] File reassembled at ${finalPath}`);
      
      // Cleanup chunk directory safely
      try {
        if (fs.existsSync(sessionChunkDir)) {
          fs.rmSync(sessionChunkDir, { recursive: true, force: true });
        }
      } catch (cleanupErr) {
        console.warn(`[${sessionId}] Cleanup warning:`, cleanupErr);
      }

      // Trigger Analysis
      const stats = fs.statSync(finalPath);
      const duration = Math.floor(stats.size / 100000);
      const engagement = Math.floor(60 + (Math.random() * 30));
      
      sessionStore[sessionId] = {
        id: sessionId,
        name: fileName,
        timestamp: new Date().toISOString(),
        duration,
        studentEngagement: engagement,
        understandingLevel: Math.floor(engagement * 0.9),
        teacherQuality: Math.floor(70 + (Math.random() * 25)),
        participationLevel: Math.floor(30 + (Math.random() * 40)),
        politenessScore: 92,
        topicCompletion: 85,
        success: engagement > 65,
        videoUrl: `/uploads/${sessionId}-${fileName}`,
        maxEngagementSegment: {
          startTime: Math.floor(duration * 0.2),
          endTime: Math.floor(duration * 0.2) + 30,
          score: Math.min(100, engagement + 15)
        },
        leastEngagementSegment: {
          startTime: Math.floor(duration * 0.5),
          endTime: Math.floor(duration * 0.5) + 30,
          score: Math.max(0, engagement - 25)
        },
        metrics: {
          speakingTimeRatio: 0.45,
          eyeGazeAttention: engagement + 5,
          interactionCount: Math.floor(duration / 60),
          keywordMatches: ["Introduction", "Analysis", "Conclusion"]
        },
        timeline: [
          { time: 0, type: 'topic_switch', description: 'Session Started', value: 100 },
          { time: Math.floor(duration * 0.5), type: 'engagement_drop', description: 'Topic Transition', value: 45 },
        ]
      };

      console.log(`[${sessionId}] Analysis complete for ${fileName}`);
      res.json({ status: "success", sessionId });
    } catch (error: any) {
      console.error(`[${sessionId}] Finalize error:`, error);
      res.status(500).json({ status: "error", message: error.message || "Failed to finalize upload" });
    }
  });

  // 1. PRIORITY: Handle large file uploads BEFORE any global body-parsing middleware
  // This prevents express.json() from choking on large multipart streams.
  app.post("/api/upload", upload.single("video"), async (req, res) => {
    try {
      if (!req.file) {
        console.error("Upload failed: No file received");
        return res.status(400).json({ status: "error", message: "No file uploaded" });
      }

      const sessionId = uuidv4();
      console.log(`[${sessionId}] Received file: ${req.file.originalname} (${req.file.size} bytes)`);
      
      // Simulate processing
      const fileSize = req.file.size;
      const duration = Math.floor(fileSize / 100000); 
      const engagement = Math.floor(60 + (Math.random() * 30)); 
      
      sessionStore[sessionId] = {
        id: sessionId,
        name: req.file.originalname,
        timestamp: new Date().toISOString(),
        duration,
        studentEngagement: engagement,
        understandingLevel: Math.floor(engagement * 0.9),
        teacherQuality: Math.floor(70 + (Math.random() * 25)),
        participationLevel: Math.floor(30 + (Math.random() * 40)),
        politenessScore: 92,
        topicCompletion: 85,
        success: engagement > 65,
        videoUrl: `/uploads/${sessionId}-${req.file.originalname}`,
        maxEngagementSegment: {
          startTime: Math.floor(duration * 0.2),
          endTime: Math.floor(duration * 0.2) + 30,
          score: Math.min(100, engagement + 15)
        },
        leastEngagementSegment: {
          startTime: Math.floor(duration * 0.5),
          endTime: Math.floor(duration * 0.5) + 30,
          score: Math.max(0, engagement - 25)
        },
        metrics: {
          speakingTimeRatio: 0.45,
          eyeGazeAttention: engagement + 5,
          interactionCount: Math.floor(duration / 60),
          keywordMatches: ["Introduction", "Analysis", "Conclusion"]
        },
        timeline: [
          { time: 0, type: 'topic_switch', description: 'Session Started', value: 100 },
          { time: Math.floor(duration * 0.5), type: 'engagement_drop', description: 'Topic Transition', value: 45 },
        ]
      };

      console.log(`[${sessionId}] Analysis complete.`);
      res.json({ status: "success", sessionId, message: "Analysis complete" });
    } catch (error: any) {
      console.error("Critical error during upload:", error);
      res.status(500).json({ status: "error", message: error.message || "Internal server error" });
    }
  });

  // --- OTHER API ENDPOINTS ---

  // Get session details
  app.get("/api/sessions/:id", (req, res) => {
    const session = sessionStore[req.params.id];
    if (!session) {
      return res.status(404).json({ status: "error", message: "Session not found" });
    }
    res.json({ status: "success", data: session });
  });

  // Get all sessions
  app.get("/api/sessions", (req, res) => {
    res.json({ status: "success", data: Object.values(sessionStore) });
  });

  // Global Error Handler to prevent HTML error pages
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled Server Error:", err);
    res.status(500).json({ 
      status: "error", 
      message: err.message || "An unhandled server error occurred",
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Vedantu Session Analyzer Server running on http://localhost:${PORT}`);
  });

  // Increase server timeouts for large uploads
  server.timeout = 600000; // 10 minutes
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
