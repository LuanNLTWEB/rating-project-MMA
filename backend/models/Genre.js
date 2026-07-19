import mongoose from 'mongoose';

const genreSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    visible: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, strict: false }
);

export default mongoose.model('Genre', genreSchema);
