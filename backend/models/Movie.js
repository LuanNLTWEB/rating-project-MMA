import mongoose from 'mongoose';

const trailerSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      default: '',
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: true }
);

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
      },
    ],
    releaseYear: {
      type: Number,
      required: true,
    },
    releaseDate: {
      type: Date,
    },
    episodes: {
      type: Number,
      default: 0,
      min: 0,
    },
    score: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Upcoming', 'Ongoing', 'Completed'],
      default: 'Ongoing',
    },
    // Poster image URL (used by the app UI)
    poster: {
      type: String,
      default: '',
    },
    // Legacy image field kept for backward compatibility with older records
    image: {
      type: String,
      default: '',
    },
    // Banner image URL shown on the movie detail page
    banner: {
      type: String,
      default: '',
    },
    // Trailer links (add / edit / delete)
    trailers: [trailerSchema],
    trending: {
      type: Boolean,
      default: false,
    },
    // Visibility status controlled by staff (hidden anime won't show in public lists)
    visible: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, strict: false }
);

export default mongoose.model('Movie', movieSchema);
