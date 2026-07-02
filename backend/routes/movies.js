import { Router } from 'express';
import Movie from '../models/Movie.js';

const router = Router();

// US22 & US23 & US24 & US25: Get all movies with filters
router.get('/', async (req, res) => {
  try {
    const { search, genre, year, score, status, type, trending } = req.query;
    const filter = {};

    // US22: Quick search by title or description
    if (search && search.trim() !== '') {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    // US23 & US24: Filter by genre
    if (genre) {
      filter.genres = genre;
    }

    // US23: Filter by release year
    if (year) {
      const yearNum = parseInt(year);
      if (!isNaN(yearNum)) {
        filter.releaseYear = yearNum;
      }
    }

    // US23: Filter by minimum score
    if (score) {
      const scoreNum = parseFloat(score);
      if (!isNaN(scoreNum)) {
        filter.score = { $gte: scoreNum };
      }
    }

    // US23: Filter by status
    if (status) {
      filter.status = status;
    }

    // Filter by type (movie or anime)
    if (type) {
      filter.type = type;
    }

    // US25: Filter by trending status
    if (trending === 'true') {
      filter.trending = true;
    }

    const movies = await Movie.find(filter)
      .populate('genres')
      .sort({ createdAt: -1 });

    res.json(movies);
  } catch (err) {
    console.error('Get movies error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
