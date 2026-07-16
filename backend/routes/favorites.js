import { Router } from 'express';
import auth from '../middleware/auth.js';
import Favorite from '../models/Favorite.js';
import Movie from '../models/Movie.js';
import UserActivityLog from '../models/UserActivityLog.js';

async function log(userId, action, details = '') {
  try { await UserActivityLog.create({ userId, action, details }); } catch {}
}

const router = Router();

// GET /api/favorites — list user's favorites
router.get('/', auth, async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .populate({ path: 'movieId', populate: { path: 'genres' } });

    const movies = favorites
      .filter((f) => f.movieId)
      .map((f) => ({
        ...f.movieId.toObject(),
        favoritedAt: f.createdAt,
      }));

    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/favorites/ids — return array of movie IDs user has favorited
router.get('/ids', auth, async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.user.id }).select('movieId');
    res.json(favorites.map((f) => f.movieId.toString()));
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/favorites/:movieId — add to favorites
router.post('/:movieId', auth, async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.movieId);
    if (!movie) return res.status(404).json({ message: 'Movie not found' });

    if (!movie.visible && req.user.role === 'customer') {
      return res.status(403).json({ message: 'Movie not available' });
    }

    const exists = await Favorite.findOne({
      userId: req.user.id,
      movieId: req.params.movieId,
    });

    if (exists) return res.status(400).json({ message: 'Already in favorites' });

    const favorite = await Favorite.create({
      userId: req.user.id,
      movieId: req.params.movieId,
    });

    log(req.user.id, 'favorite_add', movie.title);

    res.status(201).json({ message: 'Added to favorites', id: favorite._id });
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ message: 'Movie not found' });
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/favorites/:movieId — remove from favorites
router.delete('/:movieId', auth, async (req, res) => {
  try {
    const entry = await Favorite.findOne({
      userId: req.user.id,
      movieId: req.params.movieId,
    }).populate('movieId', 'title');

    if (!entry) return res.status(404).json({ message: 'Not in favorites' });

    const title = entry.movieId?.title || '';

    await Favorite.findByIdAndDelete(entry._id);

    log(req.user.id, 'favorite_remove', title);

    res.json({ message: 'Removed from favorites' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
