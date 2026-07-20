import { Router } from 'express';
import auth from '../middleware/auth.js';
import Genre from '../models/Genre.js';
import Movie from '../models/Movie.js';

const router = Router();

function requireStaff(req, res, next) {
  if (!req.user || req.user.role !== 'staff') {
    return res.status(403).json({ message: 'Access denied. Staff role required.' });
  }
  next();
}

function resolveReleaseYear(releaseDate, releaseYear) {
  if (releaseDate) {
    const d = new Date(releaseDate);
    if (!isNaN(d.getTime())) return d.getFullYear();
  }
  if (releaseYear !== undefined && releaseYear !== null && releaseYear !== '') {
    const y = parseInt(releaseYear);
    if (!isNaN(y)) return y;
  }
  return new Date().getFullYear();
}

router.get('/', async (req, res) => {
  try {
    const { search, genre, year, score, status, type, trending } = req.query;
    const filter = {};

    const visibilityCondition = { $or: [{ visible: true }, { isActive: true }] };

    if (search && search.trim() !== '') {
      filter.$and = [
        visibilityCondition,
        {
          $or: [
            { title: { $regex: search.trim(), $options: 'i' } },
            { name: { $regex: search.trim(), $options: 'i' } },
            { description: { $regex: search.trim(), $options: 'i' } },
            { summary: { $regex: search.trim(), $options: 'i' } },
          ]
        }
      ];
    } else {
      filter.$or = [{ visible: true }, { isActive: true }];
    }

    if (genre) {
      filter.genres = genre;
    }

    if (year) {
      const yearNum = parseInt(year);
      if (!isNaN(yearNum)) {
        filter.releaseYear = yearNum;
      }
    }

    if (score) {
      const scoreNum = parseFloat(score);
      if (!isNaN(scoreNum)) {
        filter.score = { $gte: scoreNum };
      }
    }

    if (status) {
      filter.status = status;
    }

    if (type) {
      filter.type = type;
    }

    if (trending === 'true') {
      filter.trending = true;
    }

    const movies = await Movie.find(filter)
      .populate('genres')
      .sort({ createdAt: -1 });

    const mappedMovies = movies.map(m => {
      const doc = m.toObject ? m.toObject() : m;
      return {
        ...doc,
        title: doc.title || doc.name,
        description: doc.description || doc.summary,
        image: doc.image || doc.poster,
        poster: doc.poster,
        score: doc.score || doc.averageRating || 0,
        releaseYear: doc.releaseYear || (doc.releaseDate ? new Date(doc.releaseDate).getFullYear() : 2024),
      };
    });

    res.json(mappedMovies);
  } catch (err) {
    console.error('Get movies error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
router.get('/all', auth, requireStaff, async (req, res) => {
  try {
    const movies = await Movie.find({})
      .populate('genres')
      .sort({ createdAt: -1 });

    const mappedMovies = movies.map(m => {
      const doc = m.toObject ? m.toObject() : m;
      return {
        ...doc,
        title: doc.title || doc.name,
        description: doc.description || doc.summary,
        image: doc.image || doc.poster,
        poster: doc.poster,
        score: doc.score || doc.averageRating || 0,
        releaseYear: doc.releaseYear || (doc.releaseDate ? new Date(doc.releaseDate).getFullYear() : 2024),
        visible: doc.visible !== undefined ? doc.visible : doc.isActive,
      };
    });
    res.json(mappedMovies);
  } catch (err) {
    console.error('Get all movies error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const movie = await Movie.findOne({ _id: req.params.id, visible: true }).populate('genres');
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    res.json(movie);
  } catch (err) {
    console.error('Get movie error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', auth, requireStaff, async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      genres,
      releaseDate,
      releaseYear,
      episodes,
      score,
      status,
      poster,
      banner,
      trailers,
      trending,
      visible,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Movie title is required' });
    }

    let genreIds = [];
    if (Array.isArray(genres) && genres.length > 0) {
      const found = await Genre.find({ _id: { $in: genres } });
      genreIds = found.map((g) => g._id);
    }

    const movie = await Movie.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      type: type || 'anime',
      genres: genreIds,
      releaseYear: resolveReleaseYear(releaseDate, releaseYear),
      releaseDate: releaseDate ? new Date(releaseDate) : undefined,
      episodes: episodes !== undefined ? Number(episodes) : 0,
      score: score !== undefined ? Number(score) : 0,
      status: status || 'Ongoing',
      poster: poster || '',
      image: poster || '',
      banner: banner || '',
      trailers: Array.isArray(trailers) ? trailers : [],
      trending: trending === true || trending === 'true',
      visible: visible === undefined ? true : visible === true || visible === 'true',
    });

    const populated = await movie.populate('genres');
    res.status(201).json({ message: 'Movie created successfully', movie: populated });
  } catch (err) {
    console.error('Create movie error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', auth, requireStaff, async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      genres,
      releaseDate,
      releaseYear,
      episodes,
      score,
      status,
      poster,
      banner,
      trailers,
      trending,
      visible,
    } = req.body;

    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    if (title !== undefined) movie.title = title.trim();
    if (description !== undefined) movie.description = description.trim();
    if (type !== undefined) movie.type = type;
    if (status !== undefined) movie.status = status;
    if (episodes !== undefined) movie.episodes = Number(episodes);
    if (score !== undefined) movie.score = Number(score);
    if (poster !== undefined) {
      movie.poster = poster;
      movie.image = poster;
    }
    if (banner !== undefined) movie.banner = banner;
    if (trending !== undefined) movie.trending = trending === true || trending === 'true';
    if (visible !== undefined) movie.visible = visible === true || visible === 'true';

    if (releaseDate !== undefined) {
      movie.releaseDate = releaseDate ? new Date(releaseDate) : undefined;
      movie.releaseYear = resolveReleaseYear(releaseDate, releaseYear);
    } else if (releaseYear !== undefined) {
      movie.releaseYear = resolveReleaseYear(undefined, releaseYear);
    }

    if (Array.isArray(genres)) {
      const found = await Genre.find({ _id: { $in: genres } });
      movie.genres = found.map((g) => g._id);
    }

    if (Array.isArray(trailers)) {
      movie.trailers = trailers;
    }

    await movie.save();
    const populated = await movie.populate('genres');
    res.json({ message: 'Movie updated successfully', movie: populated });
  } catch (err) {
    console.error('Update movie error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', auth, requireStaff, async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    res.json({ message: 'Movie deleted successfully', movie });
  } catch (err) {
    console.error('Delete movie error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id/visibility', auth, requireStaff, async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    movie.visible = !movie.visible;
    await movie.save();
    res.json({
      message: `Visibility changed to ${movie.visible ? 'visible' : 'hidden'}`,
      movie,
    });
  } catch (err) {
    console.error('Toggle visibility error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id/poster', auth, requireStaff, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || !url.trim()) {
      return res.status(400).json({ message: 'Poster image URL is required' });
    }
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    movie.poster = url.trim();
    movie.image = url.trim();
    await movie.save();
    res.json({ message: 'Poster uploaded successfully', movie });
  } catch (err) {
    console.error('Upload poster error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// US: Upload / set banner image for the detail page (staff only)
router.patch('/:id/banner', auth, requireStaff, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || !url.trim()) {
      return res.status(400).json({ message: 'Banner image URL is required' });
    }
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    movie.banner = url.trim();
    await movie.save();
    res.json({ message: 'Banner uploaded successfully', movie });
  } catch (err) {
    console.error('Upload banner error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/trailers', auth, requireStaff, async (req, res) => {
  try {
    const { label, url } = req.body;
    if (!url || !url.trim()) {
      return res.status(400).json({ message: 'Trailer URL is required' });
    }
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    movie.trailers.push({ label: label ? label.trim() : '', url: url.trim() });
    await movie.save();
    res.status(201).json({ message: 'Trailer added successfully', movie });
  } catch (err) {
    console.error('Add trailer error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/trailers/:trailerId', auth, requireStaff, async (req, res) => {
  try {
    const { label, url } = req.body;
    if (!url || !url.trim()) {
      return res.status(400).json({ message: 'Trailer URL is required' });
    }
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    const trailer = movie.trailers.id(req.params.trailerId);
    if (!trailer) {
      return res.status(404).json({ message: 'Trailer not found' });
    }
    trailer.label = label !== undefined ? label.trim() : trailer.label;
    trailer.url = url.trim();
    await movie.save();
    res.json({ message: 'Trailer updated successfully', movie });
  } catch (err) {
    console.error('Edit trailer error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id/trailers/:trailerId', auth, requireStaff, async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    const trailer = movie.trailers.id(req.params.trailerId);
    if (!trailer) {
      return res.status(404).json({ message: 'Trailer not found' });
    }
    movie.trailers.pull(req.params.trailerId);
    await movie.save();
    res.json({ message: 'Trailer deleted successfully', movie });
  } catch (err) {
    console.error('Delete trailer error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
