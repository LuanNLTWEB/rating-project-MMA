import { Router } from 'express';
import auth from '../middleware/auth.js';
import Review from '../models/Review.js';
import Movie from '../models/Movie.js';
import Watchlist from '../models/Watchlist.js';

const router = Router();

// Helper middleware - staff only
function requireStaff(req, res, next) {
  if (!req.user || (req.user.role !== 'staff' && req.user.role !== 'admin')) {
    return res.status(403).json({ message: 'Access denied. Staff or admin role required.' });
  }
  next();
}

// Helper to update movie rating and review count
const updateMovieRating = async (movieId) => {
  const stats = await Review.aggregate([
    { $match: { movie: movieId } },
    { $group: { _id: null, avgRating: { $avg: "$overallRating" }, count: { $sum: 1 } } },
  ]);
  const avg = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0;
  await Movie.findByIdAndUpdate(movieId, { score: avg, reviewCount: stats.length > 0 ? stats[0].count : 0 });
};

// Create a review
router.post('/movie/:movieId', auth, async (req, res) => {
  try {
    const { movieId } = req.params;
    const { overallRating, bodyText, containsSpoiler, recommendation } = req.body;
    const userId = req.user.id; // from JWT payload

    // Basic validation
    if (!bodyText || bodyText.trim().length === 0) {
      return res.status(400).json({ message: 'Review body cannot be empty.' });
    }
    if (bodyText.trim().length > 10000) {
      return res.status(400).json({ message: 'Review must not exceed 10000 characters.' });
    }
    if (!overallRating || overallRating < 1 || overallRating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found.' });
    }

    const wlEntry = await Watchlist.findOne({ userId, movieId });
    if (!wlEntry || (wlEntry.status !== 'watching' && wlEntry.status !== 'completed')) {
      return res.status(403).json({ message: 'You must have this movie in your Watchlist (Watching or Completed) to write a review.' });
    }

    const review = await Review.create({
      user: userId,
      movie: movieId,
      overallRating,
      bodyText: bodyText.trim(),
      containsSpoiler: containsSpoiler || false,
      recommendation,
    });

    await updateMovieRating(movieId);
    res.status(201).json({ message: 'Review created successfully.', review });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already reviewed this movie.' });
    }
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a review
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { overallRating, bodyText, containsSpoiler, recommendation } = req.body;
    const userId = req.user.id;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found.' });
    }

    if (review.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You do not have permission to edit this review.' });
    }

    if (review.editHistory && review.editHistory.length >= 3) {
      return res.status(403).json({ message: 'Maximum edit limit (3 times) reached.' });
    }

    if (bodyText && bodyText.trim() !== review.bodyText) {
      const trimmedText = bodyText.trim();
      if (trimmedText.length > 10000) {
        return res.status(400).json({ message: 'Review must not exceed 10000 characters.' });
      }
      
      review.editHistory.push({
        bodyText: review.bodyText,
        editedAt: new Date()
      });
      review.isEdited = true;
      review.bodyText = trimmedText;
    }

    if (overallRating) review.overallRating = overallRating;
    if (recommendation) review.recommendation = recommendation;
    if (typeof containsSpoiler !== 'undefined') review.containsSpoiler = containsSpoiler;

    await review.save();
    await updateMovieRating(review.movie);

    res.json({ message: 'Review updated successfully', review });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a review (owner or staff/admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found.' });
    }

    if (review.user.toString() !== userId.toString() && userRole !== 'admin' && userRole !== 'staff') {
      return res.status(403).json({ message: 'You do not have permission to delete this review.' });
    }

    const movieId = review.movie;
    await review.deleteOne();
    await updateMovieRating(movieId);

    res.json({ message: 'Review deleted successfully.' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin/Staff: Get all reviews
router.get('/all', auth, requireStaff, async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('user', 'name username email role avatar')
      .populate('movie', 'title titleEnglish')
      .sort({ createdAt: -1 })
      .limit(200); // Limit to recent 200 for performance
    res.json(reviews);
  } catch (error) {
    console.error('Get all reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get reviews for a movie
router.get('/movie/:movieId', async (req, res) => {
  try {
    const { movieId } = req.params;
    
    const reviews = await Review.find({ movie: movieId, isHidden: { $ne: true } })
      .populate('user', 'name email role avatar') // adjust fields based on User model
      .sort({ isPinned: -1, helpfulnessScore: -1, createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// React to a review
router.post('/:id/react', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body; 
    const userId = req.user.id;

    const validTypes = ['helpful', 'nice', 'love', 'funny', 'confusing'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid reaction type.' });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found.' });
    }

    if (review.user.toString() === userId.toString()) {
      return res.status(403).json({ message: 'You cannot react to your own review.' });
    }

    const hasReacted = review.reactions[type].includes(userId);
    
    if (hasReacted) {
      review.reactions[type] = review.reactions[type].filter(
        (uid) => uid.toString() !== userId.toString()
      );
      if (type === 'helpful') review.helpfulnessScore -= 1;
    } else {
      review.reactions[type].push(userId);
      if (type === 'helpful') review.helpfulnessScore += 1;
    }

    await review.save();
    res.json({ message: 'Reaction updated', review });
  } catch (error) {
    console.error('React review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin/Staff: Toggle pin
router.patch('/:id/pin', auth, requireStaff, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    review.isPinned = !review.isPinned;
    await review.save();
    res.json({ message: `Review ${review.isPinned ? 'pinned' : 'unpinned'}`, isPinned: review.isPinned });
  } catch (error) {
    console.error('Toggle pin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin/Staff: Force spoiler status
router.patch('/:id/spoiler', auth, requireStaff, async (req, res) => {
  try {
    const { containsSpoiler } = req.body;
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    review.containsSpoiler = Boolean(containsSpoiler);
    await review.save();
    res.json({ message: 'Spoiler status updated', containsSpoiler: review.containsSpoiler });
  } catch (error) {
    console.error('Force spoiler error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin/Staff: Toggle hide status
router.patch('/:id/hide', auth, requireStaff, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    review.isHidden = !review.isHidden;
    await review.save();
    res.json({ message: `Review ${review.isHidden ? 'hidden' : 'unhidden'}`, isHidden: review.isHidden });
  } catch (error) {
    console.error('Toggle hide error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
