import { Song } from '../models/Song.js';

// Get all favorite songs
export async function getFavorites(req, res) {
  try {
    const favorites = await Song.find({ isFavorite: true }).sort({ updatedAt: -1 });
    res.json(favorites);
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'Failed to retrieve favorites.' });
  }
}

// Add song to favorites
export async function addFavorite(req, res) {
  try {
    const song = await Song.findByIdAndUpdate(
      req.params.songId,
      { isFavorite: true },
      { new: true }
    );
    if (!song) {
      return res.status(404).json({ error: 'Song not found.' });
    }
    res.json(song);
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ error: 'Failed to mark song as favorite.' });
  }
}

// Remove song from favorites
export async function removeFavorite(req, res) {
  try {
    const song = await Song.findByIdAndUpdate(
      req.params.songId,
      { isFavorite: false },
      { new: true }
    );
    if (!song) {
      return res.status(404).json({ error: 'Song not found.' });
    }
    res.json(song);
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ error: 'Failed to remove song from favorites.' });
  }
}

