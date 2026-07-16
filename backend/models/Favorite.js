import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema(
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
  },
  { timestamps: true }
);

favoriteSchema.index({ userId: 1, movieId: 1 }, { unique: true });
favoriteSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Favorite', favoriteSchema);
