import { Router } from 'express';
import auth from '../middleware/auth.js';
import Report from '../models/Report.js';
import Review from '../models/Review.js';

const router = Router();

// Helper middleware - staff only
function requireStaff(req, res, next) {
  if (!req.user || (req.user.role !== 'staff' && req.user.role !== 'admin')) {
    return res.status(403).json({ message: 'Access denied. Staff or admin role required.' });
  }
  next();
}

// User reports a review
router.post('/review/:reviewId', auth, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason, details } = req.body;
    const userId = req.user.id;

    if (!reason) {
      return res.status(400).json({ message: 'Reason for reporting is required.' });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found.' });
    }

    if (review.user.toString() === userId.toString()) {
      return res.status(400).json({ message: 'You cannot report your own review.' });
    }

    const report = await Report.create({
      reporter: userId,
      review: reviewId,
      reason,
      details: details || '',
    });

    res.status(201).json({ message: 'Report submitted successfully.', report });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already reported this review.' });
    }
    console.error('Create report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin/Staff gets all reports (with pagination/filtering)
router.get('/', auth, requireStaff, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const reports = await Report.find(filter)
      .populate('reporter', 'name email')
      .populate({
        path: 'review',
        populate: { path: 'user', select: 'name email avatar' }
      })
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin/Staff resolves/dismisses a report
router.patch('/:id/status', auth, requireStaff, async (req, res) => {
  try {
    const { status } = req.body;
    const userId = req.user.id;
    
    if (!['pending', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found.' });
    }

    report.status = status;
    report.handledBy = userId;
    await report.save();

    res.json({ message: `Report marked as ${status}.`, report });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
