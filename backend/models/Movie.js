import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      enum: ['movie', 'anime'],
      default: 'anime',
    },
    genres: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Genre',
        required: true,
      },
    ],
    releaseYear: {
      type: Number,
      required: true,
    },
    score: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Upcoming', 'Ongoing', 'Completed'],
      default: 'Ongoing',
    },
    image: {
      type: String,
      default: '',
    },
    trending: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Movie', movieSchema);
