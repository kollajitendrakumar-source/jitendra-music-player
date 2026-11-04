import mongoose from 'mongoose';

const ListeningHistorySchema = new mongoose.Schema(
  {
    songId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Song',
      required: true,
      index: true,
    },
    playedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

export const ListeningHistory = mongoose.model('ListeningHistory', ListeningHistorySchema);

