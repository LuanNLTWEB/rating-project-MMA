import { Router } from 'express';
import auth from '../middleware/auth.js';
import User from '../models/User.js';
import UserActivityLog from '../models/UserActivityLog.js';
const router = Router();

const GENDERS = ['Male', 'Female', 'Other'];
const PHONE_REGEX = /^(0|\+84)[3-9][0-9]{8}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

async function logActivity(userId, action, details = '') {
  try {
    await UserActivityLog.create({ userId, action, details });
  } catch (err) {
    console.error('Activity log error:', err);
  }
}

// GET /api/profile — get current user's profile
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/profile — update profile
router.put('/', auth, async (req, res) => {
  try {
    const { name, gender, dateOfBirth, phone, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name !== undefined) user.name = name;
    if (gender !== undefined) {
      if (!GENDERS.includes(gender)) {
        return res.status(400).json({ message: 'Invalid gender' });
      }
      user.gender = gender;
    }
    if (dateOfBirth !== undefined) {
      if (!DATE_REGEX.test(dateOfBirth)) {
        return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
      }
      user.dateOfBirth = dateOfBirth;
    }
    if (phone !== undefined) {
      if (!PHONE_REGEX.test(phone)) {
        return res.status(400).json({ message: 'Invalid phone number format' });
      }
      user.phone = phone;
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to set a new password' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters' });
      }
      if (!/[A-Z]/.test(newPassword)) {
        return res.status(400).json({ message: 'New password must contain at least one uppercase letter' });
      }
      if (!/[a-z]/.test(newPassword)) {
        return res.status(400).json({ message: 'New password must contain at least one lowercase letter' });
      }
      if (!/[0-9]/.test(newPassword)) {
        return res.status(400).json({ message: 'New password must contain at least one number' });
      }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
        return res.status(400).json({ message: 'New password must contain at least one special character' });
      }
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      user.password = newPassword;
    }

    await user.save();

    await logActivity(user._id, newPassword ? 'password_change' : 'profile_update');

    res.json({
      message: 'Profile updated',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/profile/activity — get own activity log
router.get('/activity', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const total = await UserActivityLog.countDocuments({ userId: req.user.id });
    const logs = await UserActivityLog.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({ logs, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('Activity log error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/profile/:userId — get public profile of any user
router.get('/:userId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('name gender dateOfBirth role avatar createdAt');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
