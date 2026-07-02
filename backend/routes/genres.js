import { Router } from 'express';
import auth from '../middleware/auth.js';
import Genre from '../models/Genre.js';
import Movie from '../models/Movie.js';

const router = Router();

// Helper middleware to check if user is staff/admin
function requireStaff(req, res, next) {
  if (!req.user || (req.user.role !== 'staff' && req.user.role !== 'admin')) {
    return res.status(403).json({ message: 'Access denied. Staff role required.' });
  }
  next();
}

// US21 & US23 / US24: GET public genres (visible: true)
router.get('/', async (req, res) => {
  try {
    const genres = await Genre.find({ visible: true }).sort({ name: 1 });
    res.json(genres);
  } catch (err) {
    console.error('Get genres error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET all genres for staff (including hidden ones)
router.get('/all', auth, requireStaff, async (req, res) => {
  try {
    const genres = await Genre.find({}).sort({ name: 1 });
    res.json(genres);
  } catch (err) {
    console.error('Get all genres error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// US18: Create a new genre
router.post('/', auth, requireStaff, async (req, res) => {
  try {
    const { name, description, visible } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Genre name is required' });
    }

    const trimmedName = name.trim();
    const existing = await Genre.findOne({ name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } });
    if (existing) {
      return res.status(400).json({ message: 'Genre name already exists' });
    }

    const genre = await Genre.create({
      name: trimmedName,
      description: description ? description.trim() : '',
      visible: visible !== undefined ? visible : true,
    });

    res.status(201).json({
      message: 'Genre created successfully',
      genre,
    });
  } catch (err) {
    console.error('Create genre error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// US19: Edit genre name or description
router.put('/:id', auth, requireStaff, async (req, res) => {
  try {
    const { name, description } = req.body;
    const { id } = req.params;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Genre name is required' });
    }

    const trimmedName = name.trim();
    // Check if another genre has the same name
    const existing = await Genre.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
    });
    if (existing) {
      return res.status(400).json({ message: 'Genre name already exists' });
    }

    const genre = await Genre.findByIdAndUpdate(
      id,
      {
        name: trimmedName,
        description: description ? description.trim() : '',
      },
      { new: true }
    );

    if (!genre) {
      return res.status(404).json({ message: 'Genre not found' });
    }

    res.json({
      message: 'Genre updated successfully',
      genre,
    });
  } catch (err) {
    console.error('Update genre error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// US20: Delete genre
router.delete('/:id', auth, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;

    const genre = await Genre.findByIdAndDelete(id);
    if (!genre) {
      return res.status(404).json({ message: 'Genre not found' });
    }

    // Pull this genre ID from all movies that reference it
    await Movie.updateMany({ genres: id }, { $pull: { genres: id } });

    res.json({
      message: 'Genre deleted successfully',
      genre,
    });
  } catch (err) {
    console.error('Delete genre error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// US21: Toggle visibility (hide/show)
router.patch('/:id/visibility', auth, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const genre = await Genre.findById(id);

    if (!genre) {
      return res.status(404).json({ message: 'Genre not found' });
    }

    genre.visible = !genre.visible;
    await genre.save();

    res.json({
      message: `Genre visibility changed to ${genre.visible ? 'visible' : 'hidden'}`,
      genre,
    });
  } catch (err) {
    console.error('Toggle visibility error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
