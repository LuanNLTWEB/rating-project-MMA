import { Router } from 'express';
import AuditLog from '../models/AuditLog.js';
import { adminOnly } from '../middleware/admin.js';

const router = Router();

router.get('/', adminOnly, async (_req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(200);
    res.json(logs);
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
