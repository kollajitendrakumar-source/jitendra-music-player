import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { connectDB } from './config/db.js';
import { getArtworkBucket, findGridFSFile } from './services/gridfsService.js';
import mongoose from 'mongoose';
import songRoutes from './routes/songRoutes.js';
import playlistRoutes from './routes/playlistRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';

// Resolve paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from workspace root or server directory
const rootEnv = path.resolve(__dirname, '../.env');
if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv });
} else {
  dotenv.config();
}

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS & JSON parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve artwork directly from MongoDB GridFS with HTTP caching
app.get('/uploads/artwork/:filename', async (req, res, next) => {
  try {
    const artworkBucket = getArtworkBucket();
    if (!artworkBucket) return next();

    const file = await findGridFSFile(artworkBucket, { filename: req.params.filename });
    if (!file) return next();

    const ext = path.extname(req.params.filename).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };
    const contentType = file.contentType || mimeTypes[ext] || 'image/jpeg';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', file.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    const stream = artworkBucket.openDownloadStream(file._id);
    stream.on('error', () => {
      if (!res.headersSent) res.status(404).end();
    });
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
});

app.get('/api/songs/artwork/:id', async (req, res, next) => {
  try {
    const artworkBucket = getArtworkBucket();
    if (!artworkBucket) return res.status(404).json({ error: 'Artwork storage unavailable.' });

    let fileId;
    try {
      fileId = new mongoose.Types.ObjectId(req.params.id);
    } catch {
      return res.status(400).json({ error: 'Invalid artwork ID.' });
    }

    const file = await findGridFSFile(artworkBucket, { _id: fileId });
    if (!file) return res.status(404).json({ error: 'Artwork not found.' });

    const ext = path.extname(file.filename || '').toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };
    const contentType = file.contentType || mimeTypes[ext] || 'image/jpeg';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', file.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    const stream = artworkBucket.openDownloadStream(file._id);
    stream.on('error', () => {
      if (!res.headersSent) res.status(404).end();
    });
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
});

// Serve static artwork and uploaded files as fallback
const artworkDir = path.resolve(__dirname, 'uploads/artwork');
const uploadsDir = path.resolve(__dirname, 'uploads');
app.use('/uploads/artwork', express.static(artworkDir));
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/songs', songRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api', historyRoutes);
app.use('/api/settings', settingsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'Localify API', time: new Date() });
});

// Serve frontend build if present
const clientDistPath = path.resolve(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack || err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

const HOST = process.env.HOST || '127.0.0.1';

// Start Server after connecting to MongoDB
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, HOST, () => {
      console.log(`[Localify] Server is running on:`);
      console.log(`  ➜ Local:   http://localhost:${PORT}`);
      console.log(`  ➜ Network: http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error('[Localify] Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

export default app;

