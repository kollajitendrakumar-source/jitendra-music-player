import { ListeningHistory } from '../models/ListeningHistory.js';
import { Song } from '../models/Song.js';
import { Playlist } from '../models/Playlist.js';

// Get listening history (recently played) - deduplicated by song
export async function getHistory(req, res) {
  try {
    const history = await ListeningHistory.find()
      .populate('songId')
      .sort({ playedAt: -1 })
      .limit(100);

    // Filter out deleted songs and keep each song only once (its most recent play)
    const seenSongIds = new Set();
    const uniqueHistory = [];

    for (const item of history) {
      if (!item.songId || !item.songId._id) continue;
      const idStr = item.songId._id.toString();
      if (!seenSongIds.has(idStr)) {
        seenSongIds.add(idStr);
        uniqueHistory.push({
          _id: item._id,
          playedAt: item.playedAt,
          song: item.songId,
        });
      }
    }

    res.json(uniqueHistory);
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to retrieve listening history.' });
  }
}

// Record playback event
export async function recordHistory(req, res) {
  try {
    const { songId } = req.body;
    if (!songId) {
      return res.status(400).json({ error: 'songId is required.' });
    }

    const song = await Song.findById(songId);
    if (!song) {
      return res.status(404).json({ error: 'Song not found.' });
    }

    // Increment play count & update last played
    song.playCount = (song.playCount || 0) + 1;
    song.lastPlayedAt = new Date();
    await song.save();

    // Create history item
    const item = await ListeningHistory.create({
      songId: song._id,
      playedAt: new Date(),
    });

    res.status(201).json(item);
  } catch (error) {
    console.error('Record history error:', error);
    res.status(500).json({ error: 'Failed to record playback history.' });
  }
}

// Get library statistics
export async function getStats(req, res) {
  try {
    const [totalSongs, totalPlaylists, distinctArtists, distinctAlbums, totalDurationAgg] =
      await Promise.all([
        Song.countDocuments(),
        Playlist.countDocuments(),
        Song.distinct('artist'),
        Song.distinct('album'),
        Song.aggregate([
          {
            $group: {
              _id: null,
              totalDuration: { $sum: '$duration' },
              totalListeningTime: {
                $sum: { $multiply: ['$duration', { $ifNull: ['$playCount', 0] }] },
              },
            },
          },
        ]),
      ]);

    const totalDuration = totalDurationAgg[0]?.totalDuration || 0;
    const totalListeningTime = totalDurationAgg[0]?.totalListeningTime || 0;

    res.json({
      totalSongs,
      totalPlaylists,
      totalArtists: distinctArtists.length,
      totalAlbums: distinctAlbums.length,
      totalDuration,
      totalListeningTime,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve statistics.' });
  }
}

