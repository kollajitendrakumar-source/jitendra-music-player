import mongoose from 'mongoose';

const SyncedLyricLineSchema = new mongoose.Schema(
  {
    time: { type: Number, required: true }, // time in seconds
    text: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const LyricsSchema = new mongoose.Schema(
  {
    text: { type: String, default: '' },
    isSynced: { type: Boolean, default: false },
    syncedLyrics: [SyncedLyricLineSchema],
  },
  { _id: false }
);

const SongSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    artist: { type: String, default: 'Unknown Artist', trim: true, index: true },
    album: { type: String, default: 'Unknown Album', trim: true, index: true },
    albumArtist: { type: String, default: '', trim: true },
    movieName: { type: String, default: '', trim: true, index: true },
    songType: {
      type: String,
      enum: ['Movie Soundtrack', 'Private Song', 'Album Track'],
      default: 'Movie Soundtrack',
    },
    genre: { type: String, default: 'Unknown', trim: true, index: true },
    language: { type: String, default: 'English', trim: true, index: true },
    year: { type: Number, default: null },
    trackNumber: { type: Number, default: null },
    duration: { type: Number, default: 0 }, // in seconds
    format: { type: String, default: 'mp3', trim: true },
    bitrate: { type: Number, default: null },
    sampleRate: { type: Number, default: null },
    fileSize: { type: Number, default: 0 },
    filePath: { type: String, default: '' },
    audioFileId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
    artworkFileId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
    fileHash: { type: String, required: true, unique: true, index: true },
    artworkPath: { type: String, default: null },
    uploadedBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, default: null },
      name: { type: String, default: 'Local User' },
      email: { type: String, default: '' },
    },
    lyrics: { type: LyricsSchema, default: () => ({ text: '', isSynced: false, syncedLyrics: [] }) },
    dateAdded: { type: Date, default: Date.now, index: true },
    playCount: { type: Number, default: 0 },
    lastPlayedAt: { type: Date, default: null },
    isFavorite: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
  }
);

// Text index for global search (language_override: 'none' prevents MongoDB from using language field as text search override)
SongSchema.index(
  {
    title: 'text',
    artist: 'text',
    album: 'text',
    genre: 'text',
    language: 'text',
  },
  {
    language_override: 'none',
  }
);

export const Song = mongoose.model('Song', SongSchema);

