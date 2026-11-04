import mongoose from 'mongoose';

const PlaylistSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    songs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
  },
  {
    timestamps: true,
  }
);

PlaylistSchema.index({ name: 'text', description: 'text' });

export const Playlist = mongoose.model('Playlist', PlaylistSchema);

