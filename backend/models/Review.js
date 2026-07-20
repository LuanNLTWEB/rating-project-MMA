import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: true,
    },
    overallRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    bodyText: {
      type: String,
      required: true,
    },
    isPreliminary: {
      type: Boolean,
      default: false,
    },
    recommendation: {
      type: String,
      enum: ['recommended', 'mixed', 'not_recommended'],
    },
    containsSpoiler: {
      type: Boolean,
      default: false,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
    reactions: {
      helpful: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      nice: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      love: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      funny: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      confusing: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editHistory: [
      {
        bodyText: String,
        editedAt: Date,
      }
    ],
    helpfulnessScore: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Ensure a user can only write one review per movie
reviewSchema.index({ user: 1, movie: 1 }, { unique: true });

export default mongoose.model('Review', reviewSchema);
