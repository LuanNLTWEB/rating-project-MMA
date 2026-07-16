import mongoose from 'mongoose';

const userActivityLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: {
      type: String,
      enum: [
        'login', 'favorite_add', 'favorite_remove', 'watchlist_add',
        'watchlist_update', 'watchlist_remove', 'profile_update',
        'password_change', 'avatar_change',
      ],
      required: true,
    },
    details: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('UserActivityLog', userActivityLogSchema);
