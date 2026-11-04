import fs from 'fs';
import path from 'path';
import { Song } from '../models/Song.js';
import { Playlist } from '../models/Playlist.js';
import { ListeningHistory } from '../models/ListeningHistory.js';
import { computeFileHash, extractMetadata } from '../services/metadataService.js';
import { parseLyrics } from '../services/lyricsService.js';
import {
  getAudioBucket,
  getArtworkBucket,
  uploadStreamToGridFS,
  uploadBufferToGridFS,
  findGridFSFile,
  deleteGridFSFile,
} from '../services/gridfsService.js';

// Upload songs (single or multiple)
export async function uploadSongs(req, res) {
  try {
    const files = req.files || (req.file ? [req.file] : []);

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No audio files were provided.' });
    }

    const uploaded = [];
    const duplicates = [];
    const errors = [];

    const audioBucket = getAudioBucket();
    const artworkBucket = getArtworkBucket();

    for (const file of files) {
      const filePath = file.path;
      try {
        const fileHash = await computeFileHash(filePath);

        // Check duplicate
        const existing = await Song.findOne({ fileHash });
        if (existing) {
          // Clean up the uploaded duplicate file
          if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
          }
          duplicates.push({
            filename: file.originalname,
            song: existing,
            message: 'Song already exists in library',
          });
          continue;
        }

        // Extract metadata
        const meta = await extractMetadata(filePath, file.originalname);

        // Store cover art in GridFS artwork bucket if available
        let artworkFileId = null;
        let artworkPath = meta.artworkPath;
        if (meta.coverData && meta.coverFileName && artworkBucket) {
          try {
            const existingArt = await findGridFSFile(artworkBucket, { filename: meta.coverFileName });
            if (existingArt) {
              artworkFileId = existingArt._id;
            } else {
              artworkFileId = await uploadBufferToGridFS(artworkBucket, meta.coverData, meta.coverFileName, {
                contentType: meta.coverFormat || 'image/jpeg',
              });
            }
            artworkPath = `/uploads/artwork/${meta.coverFileName}`;
          } catch (artErr) {
            console.warn('[Upload] Failed to upload artwork to GridFS:', artErr.message);
          }
        }

        // Upload audio file into GridFS audio bucket
        let audioFileId = null;
        if (audioBucket) {
          const readStream = fs.createReadStream(filePath);
          audioFileId = await uploadStreamToGridFS(audioBucket, readStream, file.filename, {
            contentType: file.mimetype || 'audio/mpeg',
            metadata: {
              originalname: file.originalname,
              duration: meta.duration,
            },
          });
        }

        // Delete the temporary file from disk immediately
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
        }

        const uploadedBy = {
          userId: req.user?._id || null,
          name: req.user?.name || 'Local User',
          email: req.user?.email || '',
        };

        const { coverData, coverFileName, coverFormat, ...songFields } = meta;

        const newSong = await Song.create({
          ...songFields,
          filePath: file.filename,
          audioFileId,
          artworkFileId,
          artworkPath,
          fileHash,
          uploadedBy,
        });

        uploaded.push(newSong);
      } catch (err) {
        console.error(`Error processing file ${file.originalname}:`, err);
        // Clean up failed file
        if (fs.existsSync(filePath)) {
          try {
            await fs.promises.unlink(filePath);
          } catch (_) {}
        }
        errors.push({
          filename: file.originalname,
          error: err.message,
        });
      }
    }

    res.status(201).json({
      message: `Processed ${files.length} file(s)`,
      uploaded,
      duplicates,
      errors,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process audio upload.' });
  }
}

// Get all songs with sort and filter
export async function getAllSongs(req, res) {
  try {
    const {
      search,
      artist,
      album,
      genre,
      language,
      favorite,
      sort = 'dateAdded',
      order = 'desc',
    } = req.query;

    const filter = {};

    if (search) {
      const sRegex = new RegExp(search, 'i');
      filter.$or = [
        { title: sRegex },
        { artist: sRegex },
        { album: sRegex },
        { genre: sRegex },
        { language: sRegex },
      ];
    }

    if (artist) {
      filter.artist = new RegExp(`^${artist}$`, 'i');
    }

    if (album) {
      filter.album = new RegExp(`^${album}$`, 'i');
    }

    if (genre) {
      filter.genre = new RegExp(`^${genre}$`, 'i');
    }

    if (language && language !== 'All') {
      filter.language = new RegExp(`^${language}$`, 'i');
    }

    if (favorite === 'true' || favorite === true) {
      filter.isFavorite = true;
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortOptions = {};

    if (sort === 'title') sortOptions.title = sortOrder;
    else if (sort === 'artist') sortOptions.artist = sortOrder;
    else if (sort === 'album') sortOptions.album = sortOrder;
    else if (sort === 'duration') sortOptions.duration = sortOrder;
    else if (sort === 'playCount') sortOptions.playCount = sortOrder;
    else sortOptions.dateAdded = sortOrder;

    const songs = await Song.find(filter).sort(sortOptions);
    res.json(songs);
  } catch (error) {
    console.error('Get songs error:', error);
    res.status(500).json({ error: 'Failed to retrieve songs.' });
  }
}

// Get song by ID
export async function getSongById(req, res) {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ error: 'Song not found.' });
    }
    res.json(song);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch song details.' });
  }
}

// Stream audio with HTTP Range support
export async function streamSong(req, res) {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ error: 'Song not found.' });
    }

    const audioBucket = getAudioBucket();
    let fileDoc = null;

    if (song.audioFileId && audioBucket) {
      fileDoc = await findGridFSFile(audioBucket, { _id: song.audioFileId });
    }

    // Fallback: check GridFS by filename
    if (!fileDoc && audioBucket && song.filePath) {
      fileDoc = await findGridFSFile(audioBucket, { filename: song.filePath });
    }

    const mimeTypes = {
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.flac': 'audio/flac',
      '.m4a': 'audio/mp4',
      '.aac': 'audio/aac',
      '.ogg': 'audio/ogg',
    };

    // If file is stored in GridFS
    if (fileDoc && audioBucket) {
      const fileSize = fileDoc.length;
      const ext = path.extname(fileDoc.filename || song.filePath || '.mp3').toLowerCase();
      const contentType =
        fileDoc.contentType ||
        (fileDoc.metadata && fileDoc.metadata.mimetype) ||
        mimeTypes[ext] ||
        'audio/mpeg';

      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        if (start >= fileSize || end >= fileSize || start > end) {
          res.status(416).setHeader('Content-Range', `bytes */${fileSize}`);
          return res.end();
        }

        const chunkSize = end - start + 1;
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': contentType,
        });

        // GridFSBucket end parameter is exclusive, so pass end + 1
        const stream = audioBucket.openDownloadStream(fileDoc._id, { start, end: end + 1 });
        stream.on('error', (streamErr) => {
          console.error('[GridFS stream error]', streamErr.message);
          if (!res.headersSent) res.status(500).end();
        });
        res.on('close', () => {
          stream.destroy();
        });
        stream.pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
        });

        const stream = audioBucket.openDownloadStream(fileDoc._id);
        stream.on('error', (streamErr) => {
          console.error('[GridFS stream error]', streamErr.message);
          if (!res.headersSent) res.status(500).end();
        });
        res.on('close', () => {
          stream.destroy();
        });
        stream.pipe(res);
      }
      return;
    }

    // Fallback: check local disk file
    const musicDir = path.resolve('server/uploads/music');
    const audioPath = path.isAbsolute(song.filePath)
      ? song.filePath
      : path.join(musicDir, song.filePath);

    if (fs.existsSync(audioPath)) {
      const stat = await fs.promises.stat(audioPath);
      const fileSize = stat.size;
      const range = req.headers.range;
      const ext = path.extname(audioPath).toLowerCase();
      const contentType = mimeTypes[ext] || 'audio/mpeg';

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        if (start >= fileSize || end >= fileSize) {
          res.status(416).setHeader('Content-Range', `bytes */${fileSize}`);
          return res.end();
        }

        const chunkSize = end - start + 1;
        const fileStream = fs.createReadStream(audioPath, { start, end });

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': contentType,
        });

        fileStream.pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
        });
        fs.createReadStream(audioPath).pipe(res);
      }
      return;
    }

    return res.status(404).json({ error: 'Audio file missing from storage.' });
  } catch (error) {
    console.error('Audio streaming error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to stream audio file.' });
    }
  }
}

// Update song metadata
export async function updateSong(req, res) {
  try {
    const {
      title,
      artist,
      album,
      albumArtist,
      movieName,
      songType,
      genre,
      language,
      year,
      trackNumber,
    } = req.body;

    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ error: 'Song not found.' });
    }

    if (title !== undefined) song.title = title.trim();
    if (artist !== undefined) song.artist = artist.trim();
    if (album !== undefined) song.album = album.trim();
    if (albumArtist !== undefined) song.albumArtist = albumArtist.trim();
    if (movieName !== undefined) song.movieName = movieName.trim();
    if (songType !== undefined) song.songType = songType.trim();
    if (genre !== undefined) song.genre = genre.trim();
    if (language !== undefined) song.language = language.trim();
    if (year !== undefined) song.year = year ? Number(year) : null;
    if (trackNumber !== undefined) song.trackNumber = trackNumber ? Number(trackNumber) : null;

    await song.save();
    res.json(song);
  } catch (error) {
    console.error('Update song error:', error);
    res.status(500).json({ error: 'Failed to update song metadata.' });
  }
}

// Delete song and cleanup files
export async function deleteSong(req, res) {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ error: 'Song not found.' });
    }

    const audioBucket = getAudioBucket();
    const artworkBucket = getArtworkBucket();

    // 1. Delete from GridFS audio bucket
    if (audioBucket) {
      if (song.audioFileId) {
        await deleteGridFSFile(audioBucket, song.audioFileId);
      } else if (song.filePath) {
        const gFile = await findGridFSFile(audioBucket, { filename: song.filePath });
        if (gFile) await deleteGridFSFile(audioBucket, gFile._id);
      }
    }

    // 2. Delete from GridFS artwork bucket if not shared
    if (artworkBucket) {
      if (song.artworkFileId) {
        const otherUsing = await Song.findOne({
          _id: { $ne: song._id },
          artworkFileId: song.artworkFileId,
        });
        if (!otherUsing) {
          await deleteGridFSFile(artworkBucket, song.artworkFileId);
        }
      } else if (song.artworkPath) {
        const artName = path.basename(song.artworkPath);
        const otherUsing = await Song.findOne({
          _id: { $ne: song._id },
          artworkPath: song.artworkPath,
        });
        if (!otherUsing) {
          const gArt = await findGridFSFile(artworkBucket, { filename: artName });
          if (gArt) await deleteGridFSFile(artworkBucket, gArt._id);
        }
      }
    }

    // 3. Delete from local disk if file exists
    const musicDir = path.resolve('server/uploads/music');
    const audioPath = path.isAbsolute(song.filePath)
      ? song.filePath
      : path.join(musicDir, song.filePath);

    if (fs.existsSync(audioPath)) {
      try {
        await fs.promises.unlink(audioPath);
      } catch (err) {
        console.warn('Could not delete audio file:', err.message);
      }
    }

    // Check if artwork is shared
    if (song.artworkPath) {
      const otherUsingArtwork = await Song.findOne({
        _id: { $ne: song._id },
        artworkPath: song.artworkPath,
      });

      if (!otherUsingArtwork) {
        const fullArtPath = path.resolve('server', '.' + song.artworkPath);
        if (fs.existsSync(fullArtPath)) {
          try {
            await fs.promises.unlink(fullArtPath);
          } catch (err) {
            console.warn('Could not delete artwork file:', err.message);
          }
        }
      }
    }

    // Remove from all playlists
    await Playlist.updateMany({}, { $pull: { songs: song._id } });

    // Remove from history
    await ListeningHistory.deleteMany({ songId: song._id });

    // Delete song document
    await Song.findByIdAndDelete(song._id);

    res.json({ message: 'Song deleted successfully.' });
  } catch (error) {
    console.error('Delete song error:', error);
    res.status(500).json({ error: 'Failed to delete song.' });
  }
}

// Search across songs, artists, albums, playlists
export async function searchAll(req, res) {
  try {
    const query = req.query.q ? req.query.q.trim() : '';
    if (!query) {
      return res.json({ songs: [], artists: [], albums: [], playlists: [] });
    }

    const regex = new RegExp(query, 'i');

    const [songs, playlists] = await Promise.all([
      Song.find({
        $or: [
          { title: regex },
          { artist: regex },
          { album: regex },
          { genre: regex },
          { language: regex },
        ],
      }).limit(30),
      Playlist.find({
        $or: [{ name: regex }, { description: regex }],
      }).populate('songs').limit(10),
    ]);

    // Distinct artists matching
    const allMatchingArtists = await Song.aggregate([
      { $match: { artist: regex } },
      { $group: { _id: '$artist', songCount: { $sum: 1 }, artworkPath: { $first: '$artworkPath' } } },
      { $limit: 10 },
    ]);

    // Distinct albums matching
    const allMatchingAlbums = await Song.aggregate([
      { $match: { album: regex } },
      {
        $group: {
          _id: '$album',
          artist: { $first: '$artist' },
          artworkPath: { $first: '$artworkPath' },
          songCount: { $sum: 1 },
        },
      },
      { $limit: 10 },
    ]);

    res.json({
      songs,
      artists: allMatchingArtists.map((a) => ({ name: a._id, songCount: a.songCount, artworkPath: a.artworkPath })),
      albums: allMatchingAlbums.map((al) => ({ name: al._id, artist: al.artist, artworkPath: al.artworkPath, songCount: al.songCount })),
      playlists,
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to execute search.' });
  }
}

// Update or import lyrics
export async function updateLyrics(req, res) {
  try {
    const { text, rawText, isSynced, syncedLyrics } = req.body;
    const song = await Song.findById(req.params.id);

    if (!song) {
      return res.status(404).json({ error: 'Song not found.' });
    }

    const inputContent = rawText || text || '';
    if (Array.isArray(syncedLyrics) && syncedLyrics.length > 0) {
      song.lyrics = {
        text: inputContent,
        isSynced: isSynced !== undefined ? isSynced : true,
        syncedLyrics,
      };
    } else {
      song.lyrics = parseLyrics(inputContent);
    }

    await song.save();
    res.json(song);
  } catch (error) {
    console.error('Update lyrics error:', error);
    res.status(500).json({ error: 'Failed to update lyrics.' });
  }
}

// Delete lyrics
export async function deleteLyrics(req, res) {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ error: 'Song not found.' });
    }

    song.lyrics = { text: '', isSynced: false, syncedLyrics: [] };
    await song.save();
    res.json(song);
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete lyrics.' });
  }
}

// Get distinct languages and their song count
export async function getLanguages(req, res) {
  try {
    const counts = await Song.aggregate([
      {
        $group: {
          _id: '$language',
          songCount: { $sum: 1 },
          artworkPath: { $first: '$artworkPath' },
        },
      },
      { $sort: { songCount: -1 } },
    ]);

    const languages = counts
      .filter((c) => c._id)
      .map((c) => ({
        name: c._id,
        songCount: c.songCount,
        artworkPath: c.artworkPath,
      }));

    res.json(languages);
  } catch (error) {
    console.error('Get languages error:', error);
    res.status(500).json({ error: 'Failed to retrieve languages.' });
  }
}

