import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    summary: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      enum: ["ova", "movie", "tv series", "specials"],
      default: 'tv series',
    },
    genres: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Genre',
      },
    ],
    releaseDate: {
      type: Date,
    },
    totalEpisodes: {
      type: Number,
      default: 0,
      min: 0,
    },
    score: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed'],
      default: 'ongoing',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    poster: {
      type: String,
      default: '',
    },
    banner: {
      type: String,
      default: '',
    },
    trailer: {
      type: String,
      default: '',
    },
    trailers: [
      {
        type: String,
        default: '',
      },
    ],
    authors: [
      {
        type: String,
        trim: true,
      },
    ],
    producers: [
      {
        type: String,
        trim: true,
      },
    ],
    studios: [
      {
        type: String,
        trim: true,
      },
    ],
    relatedMovies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Movie',
      },
    ],
    relatedNews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'News',
      },
    ],
    viewCount: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    bayesianRating: {
      type: Number,
      default: 0,
    },
    memberCount: {
      type: Number,
      default: 0,
    },
    visible: {
      type: Boolean,
      default: true,
    },
    trending: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, strict: false }
);

export default mongoose.model('Movie', movieSchema);
