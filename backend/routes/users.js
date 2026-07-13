import { Router } from 'express';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { adminOnly } from '../middleware/admin.js';

const router = Router();

async function log(adminId, adminName, action, targetUserId, targetUserEmail, details) {
  try {
    await AuditLog.create({ adminId, adminName, action, targetUserId, targetUserEmail, details });
  } catch (err) {
    console.error('Audit log error:', err);
  }
}

router.get('/', adminOnly, async (_req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id/role', adminOnly, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['customer', 'staff', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const oldUser = await User.findById(req.params.id);
    if (!oldUser) return res.status(404).json({ message: 'User not found' });
    const oldRole = oldUser.role;
    oldUser.role = role;
    await oldUser.save();
    const user = oldUser;

    const admin = await User.findById(req.user.id);
    await log(
      req.user.id, admin?.name || 'Unknown',
      'change_role', user._id, user.email,
      `Changed role from ${oldRole} to ${role}`
    );

    res.json({ message: 'Role updated', user });
  } catch (err) {
    console.error('Error updating role:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id/status', adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended', 'banned'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const actions = { suspended: 'suspend', banned: 'ban', active: 'reactivate' };
    const admin = await User.findById(req.user.id);
    await log(
      req.user.id, admin?.name || 'Unknown',
      actions[status] || 'reactivate', user._id, user.email,
      `Set status to ${status}`
    );

    res.json({ message: `Account ${status === 'active' ? 'activated' : 'suspended'}`, user });
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const admin = await User.findById(req.user.id);
    await log(
      req.user.id, admin?.name || 'Unknown',
      'delete_user', user._id, user.email,
      `Deleted user "${user.name}"`
    );

    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(0|\+84)[3-9][0-9]{8}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const GENDERS = ['Male', 'Female', 'Other'];

router.post('/staff', adminOnly, async (req, res) => {
  try {
    const { name, email, password, gender, dateOfBirth, phone } = req.body;

    if (!name || !email || !password || !gender || !dateOfBirth || !phone) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (!GENDERS.includes(gender)) {
      return res.status(400).json({ message: 'Invalid gender' });
    }
    if (!DATE_REGEX.test(dateOfBirth)) {
      return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
    }
    if (!PHONE_REGEX.test(phone)) {
      return res.status(400).json({ message: 'Invalid phone number format' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const user = await User.create({
      name, email, password, gender, dateOfBirth, phone,
      role: 'staff',
    });

    const admin = await User.findById(req.user.id);
    await log(
      req.user.id, admin?.name || 'Unknown',
      'create_staff', user._id, user.email,
      `Created staff account "${name}"`
    );

    res.status(201).json({ message: 'Staff account created', user });
  } catch (err) {
    console.error('Error creating staff:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
