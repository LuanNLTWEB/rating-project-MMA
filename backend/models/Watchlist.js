import mongoose from 'mongoose';

const watchlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: true,
    },
    status: {
      type: String,
      enum: ['watching', 'plan_to_watch', 'completed'],
      default: 'plan_to_watch',
    },
  },
  { timestamps: true }
);

watchlistSchema.index({ userId: 1, movieId: 1 }, { unique: true });
watchlistSchema.index({ userId: 1, status: 1, createdAt: -1 });

export default mongoose.model('Watchlist', watchlistSchema);
