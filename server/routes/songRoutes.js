import express from 'express';
import { uploadAudio } from '../middleware/upload.js';
import {
  uploadSongs,
  getAllSongs,
  getSongById,
  streamSong,
  updateSong,
  deleteSong,
  searchAll,
  updateLyrics,
  deleteLyrics,
  getLanguages,
} from '../controllers/songController.js';

const router = express.Router();

// Search & Languages routes must come before :id to prevent collision
router.get('/search', searchAll);
router.get('/languages', getLanguages);

// Upload endpoint
router.post('/upload', uploadAudio.array('audio', 30), uploadSongs);

// Song collection
router.get('/', getAllSongs);

// Song item
router.get('/:id', getSongById);
router.get('/:id/stream', streamSong);
router.patch('/:id', updateSong);
router.delete('/:id', deleteSong);

// Lyrics
router.put('/:id/lyrics', updateLyrics);
router.delete('/:id/lyrics', deleteLyrics);

export default router;

