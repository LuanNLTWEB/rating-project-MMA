import { Router } from 'express';
import auth from '../middleware/auth.js';
import Watchlist from '../models/Watchlist.js';
import Movie from '../models/Movie.js';
import User from '../models/User.js';
import UserActivityLog from '../models/UserActivityLog.js';

async function log(userId, action, details = '') {
  try { await UserActivityLog.create({ userId, action, details }); } catch {}
}

const router = Router();

// GET /api/watchlist — list user's watchlist
router.get('/', auth, async (req, res) => {
  try {
    const filter = { userId: req.user.id };
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const entries = await Watchlist.find(filter)
      .sort({ createdAt: -1 })
      .populate({ path: 'movieId', populate: { path: 'genres' } });

    const movies = entries
      .filter((e) => e.movieId)
      .map((e) => ({
        ...e.movieId.toObject(),
        watchStatus: e.status,
        addedAt: e.createdAt,
      }));

    res.json(movies);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/watchlist/ids — return array of { movieId, status } in watchlist
router.get('/ids', auth, async (req, res) => {
  try {
    const entries = await Watchlist.find({ userId: req.user.id }).select('movieId status');
    res.json(entries.map((e) => ({ movieId: e.movieId.toString(), status: e.status })));
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/watchlist/user/:userId — view another user's watchlist (public if allowed)
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.userId).select('watchlistPublic name');
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    if (!targetUser.watchlistPublic) {
      return res.status(403).json({ message: 'This user\'s watchlist is private' });
    }

    const filter = { userId: req.params.userId };
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const entries = await Watchlist.find(filter)
      .sort({ createdAt: -1 })
      .populate({ path: 'movieId', populate: { path: 'genres' } });

    const movies = entries
      .filter((e) => e.movieId)
      .map((e) => ({
        ...e.movieId.toObject(),
        watchStatus: e.status,
        addedAt: e.createdAt,
      }));

    res.json(movies);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/watchlist/:movieId — add to watchlist
router.post('/:movieId', auth, async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.movieId);
    if (!movie) return res.status(404).json({ message: 'Movie not found' });

    if (!movie.visible && req.user.role === 'customer') {
      return res.status(403).json({ message: 'Movie not available' });
    }

    const exists = await Watchlist.findOne({
      userId: req.user.id,
      movieId: req.params.movieId,
    });

    if (exists) return res.status(400).json({ message: 'Already in watchlist' });

    const status = req.body.status || 'plan_to_watch';
    if (!['watching', 'plan_to_watch', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid watch status' });
    }

    const entry = await Watchlist.create({
      userId: req.user.id,
      movieId: req.params.movieId,
      status,
    });

    log(req.user.id, 'watchlist_add', `${movie.title} - ${status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}`);

    res.status(201).json({ message: 'Added to watchlist', id: entry._id });
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ message: 'Movie not found' });
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/watchlist/:movieId — update watch status
router.patch('/:movieId', auth, async (req, res) => {
  try {
    const newStatus = req.body.status;
    if (!['watching', 'plan_to_watch', 'completed'].includes(newStatus)) {
      return res.status(400).json({ message: 'Invalid watch status' });
    }

    const entry = await Watchlist.findOne({
      userId: req.user.id,
      movieId: req.params.movieId,
    }).populate('movieId', 'title');

    if (!entry) return res.status(404).json({ message: 'Not in watchlist' });

    entry.status = newStatus;
    await entry.save();

    log(req.user.id, 'watchlist_update', `${entry.movieId?.title || ''} - ${newStatus.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}`);

    res.json({ message: 'Watch status updated', status: entry.status });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/watchlist/:movieId — remove from watchlist
router.delete('/:movieId', auth, async (req, res) => {
  try {
    const entry = await Watchlist.findOne({
      userId: req.user.id,
      movieId: req.params.movieId,
    }).populate('movieId', 'title');

    if (!entry) return res.status(404).json({ message: 'Not in watchlist' });

    const title = entry.movieId?.title || '';

    await Watchlist.findByIdAndDelete(entry._id);

    log(req.user.id, 'watchlist_remove', title);

    res.json({ message: 'Removed from watchlist' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
