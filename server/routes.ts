import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { insertVideoSchema, loginSchema, passwordChangeSchema, User } from "@shared/schema";
import { z } from "zod";
import session from "express-session";
import { log } from "./vite";

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for handling file uploads
const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueFilename);
  }
});

// File filter to allow only video files
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept video files: mp4, webm, mov
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed'));
  }
};

const upload = multer({ 
  storage: storage_config,
  fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit
});

// Utility function to validate request with zod schema
const validateRequest = <T>(schema: z.ZodType<T>) => {
  return (req: Request, res: Response, next: Function) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      return res.status(400).json({ message: "Invalid request" });
    }
  };
};

// Authentication middleware
const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

// Admin middleware
const requireAdmin = (req: Request, res: Response, next: Function) => {
  if (!req.session.user || !req.session.user.isAdmin) {
    return res.status(403).json({ message: "Forbidden - Admin access required" });
  }
  next();
};

// Declare session with TypeScript
declare module 'express-session' {
  interface SessionData {
    user: User;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'videoshare-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    })
  );

  // API routes
  const apiRouter = express.Router();

  // Authentication routes
  apiRouter.post('/auth/login', validateRequest(loginSchema), async (req, res) => {
    const { username, password } = req.body;
    
    try {
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Set user in session
      req.session.user = user;
      
      return res.json({ 
        id: user.id, 
        username: user.username, 
        isAdmin: user.isAdmin 
      });
    } catch (error) {
      log(`Login error: ${error}`);
      return res.status(500).json({ message: "Error during login" });
    }
  });

  apiRouter.post('/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  apiRouter.get('/auth/me', (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ authenticated: false });
    }
    
    return res.json({
      authenticated: true,
      user: {
        id: req.session.user.id,
        username: req.session.user.username,
        isAdmin: req.session.user.isAdmin
      }
    });
  });

  apiRouter.post('/auth/change-password', requireAuth, validateRequest(passwordChangeSchema), async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.session.user.id;
      
      // Get current user
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Verify current password
      if (user.password !== currentPassword) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Update password
      const updatedUser = await storage.updateUserPassword(userId, newPassword);
      
      // Update session with new user info
      if (updatedUser) {
        req.session.user = updatedUser;
      }
      
      return res.json({ message: "Password updated successfully" });
    } catch (error) {
      log(`Change password error: ${error}`);
      return res.status(500).json({ message: "Error changing password" });
    }
  });

  // Video routes
  apiRouter.get('/videos', async (req, res) => {
    try {
      const category = req.query.category as string;
      const search = req.query.search as string;
      
      let videos;
      if (search) {
        videos = await storage.searchVideos(search);
      } else if (category) {
        videos = await storage.getVideosByCategory(category);
      } else {
        videos = await storage.getAllVideos();
      }
      
      res.json(videos);
    } catch (error) {
      log(`Get videos error: ${error}`);
      res.status(500).json({ message: "Error retrieving videos" });
    }
  });

  apiRouter.get('/videos/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const video = await storage.getVideo(id);
      
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      res.json(video);
    } catch (error) {
      log(`Get video error: ${error}`);
      res.status(500).json({ message: "Error retrieving video" });
    }
  });

  apiRouter.post('/videos', requireAuth, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No video file uploaded" });
      }

      const videoData = JSON.parse(req.body.videoData);
      const validated = insertVideoSchema.parse({
        ...videoData,
        fileName: req.file.originalname,
        filePath: req.file.path,
        uploaderId: req.session.user.id,
      });

      const video = await storage.createVideo(validated);
      res.status(201).json(video);
    } catch (error) {
      log(`Upload video error: ${error}`);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error uploading video" });
    }
  });

  apiRouter.put('/videos/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const video = await storage.getVideo(id);
      
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      // Check if user is admin or the uploader
      if (!req.session.user.isAdmin && video.uploaderId !== req.session.user.id) {
        return res.status(403).json({ message: "Not authorized to update this video" });
      }
      
      const updatedVideo = await storage.updateVideo(id, req.body);
      res.json(updatedVideo);
    } catch (error) {
      log(`Update video error: ${error}`);
      res.status(500).json({ message: "Error updating video" });
    }
  });

  apiRouter.delete('/videos/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const video = await storage.getVideo(id);
      
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      // Check if user is admin or the uploader
      if (!req.session.user.isAdmin && video.uploaderId !== req.session.user.id) {
        return res.status(403).json({ message: "Not authorized to delete this video" });
      }
      
      await storage.deleteVideo(id);
      
      // Delete the file from the filesystem
      if (fs.existsSync(video.filePath)) {
        fs.unlinkSync(video.filePath);
      }
      
      res.json({ message: "Video deleted successfully" });
    } catch (error) {
      log(`Delete video error: ${error}`);
      res.status(500).json({ message: "Error deleting video" });
    }
  });

  apiRouter.post('/videos/:id/views', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedVideo = await storage.incrementViews(id);
      
      if (!updatedVideo) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      res.json({ views: updatedVideo.views });
    } catch (error) {
      log(`Increment views error: ${error}`);
      res.status(500).json({ message: "Error incrementing views" });
    }
  });

  // Serve video file
  apiRouter.get('/stream/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const video = await storage.getVideo(id);
      
      if (!video || !fs.existsSync(video.filePath)) {
        return res.status(404).json({ message: "Video not found" });
      }

      const stat = fs.statSync(video.filePath);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(video.filePath, { start, end });
        const headers = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'video/mp4',
        };

        res.writeHead(206, headers);
        file.pipe(res);
      } else {
        const headers = {
          'Content-Length': fileSize,
          'Content-Type': 'video/mp4',
        };
        res.writeHead(200, headers);
        fs.createReadStream(video.filePath).pipe(res);
      }
    } catch (error) {
      log(`Stream video error: ${error}`);
      res.status(500).json({ message: "Error streaming video" });
    }
  });

  // Category routes
  apiRouter.get('/categories', async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      log(`Get categories error: ${error}`);
      res.status(500).json({ message: "Error retrieving categories" });
    }
  });

  // Admin routes
  apiRouter.get('/admin/videos', requireAdmin, async (req, res) => {
    try {
      const videos = await storage.getAllVideos();
      res.json(videos);
    } catch (error) {
      log(`Admin get videos error: ${error}`);
      res.status(500).json({ message: "Error retrieving videos" });
    }
  });

  apiRouter.get('/admin/users', requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      log(`Admin get users error: ${error}`);
      res.status(500).json({ message: "Error retrieving users" });
    }
  });

  // Register API router with prefix
  app.use('/api', apiRouter);

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
