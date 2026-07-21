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
        filter.$expr = { $eq: [{ $year: '$releaseDate' }, yearNum] };
      }
    }

    if (score) {
      const scoreNum = parseFloat(score);
      if (!isNaN(scoreNum)) {
        filter.score = { $gte: scoreNum };
      }
    }

    if (status) {
      filter.status = status.toLowerCase();
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
        name: doc.name || doc.title,
        title: doc.title || doc.name,
        poster: doc.poster,
        score: doc.score || doc.averageRating || 0,
        releaseYear: doc.releaseDate ? new Date(doc.releaseDate).getFullYear() : new Date().getFullYear(),
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
        name: doc.name || doc.title,
        title: doc.title || doc.name,
        poster: doc.poster,
        score: doc.score || doc.averageRating || 0,
        releaseYear: doc.releaseDate ? new Date(doc.releaseDate).getFullYear() : new Date().getFullYear(),
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
    const movie = await Movie.findOne({ _id: req.params.id }).populate('genres').populate('relatedMovies', 'title poster type score');
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
      name, title, summary, type, genres, releaseDate,
      totalEpisodes, score, status, poster, banner, trailer,
      trailers, authors, producers, studios, relatedMovies, relatedNews,
      isActive, trending, visible, averageRating, bayesianRating, viewCount, memberCount, reviewCount,
    } = req.body;

    if ((!name || !name.trim()) && (!title || !title.trim())) {
      return res.status(400).json({ message: 'Movie name is required' });
    }

    let genreIds = [];
    if (Array.isArray(genres) && genres.length > 0) {
      const found = await Genre.find({ _id: { $in: genres } });
      genreIds = found.map((g) => g._id);
    }

    const movie = await Movie.create({
      name: (name || title || '').trim(),
      title: (title || name || '').trim(),
      summary: summary ? summary.trim() : '',
      type: type || 'tv series',
      genres: genreIds,
      releaseDate: releaseDate ? new Date(releaseDate) : undefined,
      totalEpisodes: totalEpisodes !== undefined ? Number(totalEpisodes) : 0,
      score: score !== undefined ? Number(score) : 0,
      status: status ? status.toLowerCase() : 'ongoing',
      isActive: isActive === undefined ? true : isActive === true || isActive === 'true',
      poster: poster || '',
      banner: banner || '',
      trailer: trailer || '',
      trailers: Array.isArray(trailers) ? trailers : [],
      authors: Array.isArray(authors) ? authors : [],
      producers: Array.isArray(producers) ? producers : [],
      studios: Array.isArray(studios) ? studios : [],
      relatedMovies: Array.isArray(relatedMovies) ? relatedMovies : [],
      relatedNews: Array.isArray(relatedNews) ? relatedNews : [],
      viewCount: viewCount !== undefined ? Number(viewCount) : 0,
      averageRating: averageRating !== undefined ? Number(averageRating) : 0,
      bayesianRating: bayesianRating !== undefined ? Number(bayesianRating) : 0,
      memberCount: memberCount !== undefined ? Number(memberCount) : 0,
      reviewCount: reviewCount !== undefined ? Number(reviewCount) : 0,
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
      name, title, summary, type, genres, releaseDate,
      totalEpisodes, score, status, poster, banner, trailer,
      trailers, authors, producers, studios, relatedMovies, relatedNews,
      isActive, trending, visible, averageRating, bayesianRating, viewCount, memberCount, reviewCount,
    } = req.body;

    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    if (name !== undefined) movie.name = name.trim();
    if (title !== undefined) movie.title = title.trim();
    if (summary !== undefined) movie.summary = summary.trim();
    if (type !== undefined) movie.type = type;
    if (status !== undefined) movie.status = status.toLowerCase();
    if (totalEpisodes !== undefined) movie.totalEpisodes = Number(totalEpisodes);
    if (score !== undefined) movie.score = Number(score);
    if (poster !== undefined) movie.poster = poster;
    if (banner !== undefined) movie.banner = banner;
    if (trailer !== undefined) movie.trailer = trailer;
    if (trending !== undefined) movie.trending = trending === true || trending === 'true';
    if (visible !== undefined) movie.visible = visible === true || visible === 'true';
    if (isActive !== undefined) movie.isActive = isActive === true || isActive === 'true';
    if (viewCount !== undefined) movie.viewCount = Number(viewCount);
    if (averageRating !== undefined) movie.averageRating = Number(averageRating);
    if (bayesianRating !== undefined) movie.bayesianRating = Number(bayesianRating);
    if (memberCount !== undefined) movie.memberCount = Number(memberCount);
    if (reviewCount !== undefined) movie.reviewCount = Number(reviewCount);

    if (releaseDate !== undefined) {
      movie.releaseDate = releaseDate ? new Date(releaseDate) : undefined;
    }

    if (Array.isArray(genres)) {
      const found = await Genre.find({ _id: { $in: genres } });
      movie.genres = found.map((g) => g._id);
    }

    if (Array.isArray(trailers)) movie.trailers = trailers;
    if (Array.isArray(authors)) movie.authors = authors;
    if (Array.isArray(producers)) movie.producers = producers;
    if (Array.isArray(studios)) movie.studios = studios;
    if (Array.isArray(relatedMovies)) movie.relatedMovies = relatedMovies;
    if (Array.isArray(relatedNews)) movie.relatedNews = relatedNews;

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
    const { url } = req.body;
    if (!url || !url.trim()) {
      return res.status(400).json({ message: 'Trailer URL is required' });
    }
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    movie.trailers.push(url.trim());
    await movie.save();
    res.status(201).json({ message: 'Trailer added successfully', movie });
  } catch (err) {
    console.error('Add trailer error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/trailers/:index', auth, requireStaff, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || !url.trim()) {
      return res.status(400).json({ message: 'Trailer URL is required' });
    }
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    const idx = parseInt(req.params.index);
    if (isNaN(idx) || idx < 0 || idx >= movie.trailers.length) {
      return res.status(404).json({ message: 'Trailer not found' });
    }
    movie.trailers[idx] = url.trim();
    await movie.save();
    res.json({ message: 'Trailer updated successfully', movie });
  } catch (err) {
    console.error('Edit trailer error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id/trailers/:index', auth, requireStaff, async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    const idx = parseInt(req.params.index);
    if (isNaN(idx) || idx < 0 || idx >= movie.trailers.length) {
      return res.status(404).json({ message: 'Trailer not found' });
    }
    movie.trailers.splice(idx, 1);
    await movie.save();
    res.json({ message: 'Trailer deleted successfully', movie });
  } catch (err) {
    console.error('Delete trailer error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
