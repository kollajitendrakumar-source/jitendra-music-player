import { Playlist } from '../models/Playlist.js';

// Create new playlist
export async function createPlaylist(req, res) {
  try {
    const { name, description = '', songs = [] } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Playlist name is required.' });
    }

    const playlist = await Playlist.create({
      name: name.trim(),
      description: description.trim(),
      songs,
    });

    const populated = await Playlist.findById(playlist._id).populate('songs');
    res.status(201).json(populated);
  } catch (error) {
    console.error('Create playlist error:', error);
    res.status(500).json({ error: 'Failed to create playlist.' });
  }
}

// Get all playlists
export async function getAllPlaylists(req, res) {
  try {
    const playlists = await Playlist.find().populate('songs').sort({ updatedAt: -1 });
    res.json(playlists);
  } catch (error) {
    console.error('Get playlists error:', error);
    res.status(500).json({ error: 'Failed to retrieve playlists.' });
  }
}

// Get single playlist
export async function getPlaylistById(req, res) {
  try {
    const playlist = await Playlist.findById(req.params.id).populate('songs');
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found.' });
    }
    res.json(playlist);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve playlist.' });
  }
}

// Update playlist (name, description, or song order)
export async function updatePlaylist(req, res) {
  try {
    const { name, description, songs } = req.body;
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found.' });
    }

    if (name !== undefined) playlist.name = name.trim();
    if (description !== undefined) playlist.description = description.trim();
    if (Array.isArray(songs)) playlist.songs = songs;

    await playlist.save();
    const updated = await Playlist.findById(playlist._id).populate('songs');
    res.json(updated);
  } catch (error) {
    console.error('Update playlist error:', error);
    res.status(500).json({ error: 'Failed to update playlist.' });
  }
}

// Delete playlist
export async function deletePlaylist(req, res) {
  try {
    const playlist = await Playlist.findByIdAndDelete(req.params.id);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found.' });
    }
    res.json({ message: 'Playlist deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete playlist.' });
  }
}

// Add song to playlist
export async function addSongToPlaylist(req, res) {
  try {
    const { songId } = req.body;
    if (!songId) {
      return res.status(400).json({ error: 'songId is required.' });
    }

    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found.' });
    }

    // Append song if not already in playlist or allow multiples?
    // Avoid exact duplicate in same playlist
    const idStr = String(songId);
    if (!playlist.songs.some((s) => String(s) === idStr)) {
      playlist.songs.push(songId);
      await playlist.save();
    }

    const updated = await Playlist.findById(playlist._id).populate('songs');
    res.json(updated);
  } catch (error) {
    console.error('Add song to playlist error:', error);
    res.status(500).json({ error: 'Failed to add song to playlist.' });
  }
}

// Remove song from playlist
export async function removeSongFromPlaylist(req, res) {
  try {
    const { id, songId } = req.params;
    const playlist = await Playlist.findById(id);

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found.' });
    }

    playlist.songs = playlist.songs.filter((s) => String(s) !== String(songId));
    await playlist.save();

    const updated = await Playlist.findById(playlist._id).populate('songs');
    res.json(updated);
  } catch (error) {
    console.error('Remove song from playlist error:', error);
    res.status(500).json({ error: 'Failed to remove song from playlist.' });
  }
}

