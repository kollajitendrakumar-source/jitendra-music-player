import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema(
  {
    volume: { type: Number, default: 0.8, min: 0, max: 1 },
    shuffle: { type: Boolean, default: false },
    repeatMode: { type: String, enum: ['none', 'one', 'all'], default: 'none' },
    lastPlayedSong: { type: mongoose.Schema.Types.ObjectId, ref: 'Song', default: null },
    lastPlaybackPosition: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export const Settings = mongoose.model('Settings', SettingsSchema);

