import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

function sign(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'change-this-secret',
    { expiresIn: '7d' }
  );
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

router.post('/register', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');
    const role = req.body.role === 'admin' ? 'admin' : 'user';

    if (!name || !email || password.length < 6) {
      return res.status(400).json({ message: 'Name, email and a 6+ character password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password, role });
    res.status(201).json({ token: sign(user), user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({ token: sign(user), user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

router.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const updates = {};
    if (req.body.name) updates.name = String(req.body.name).trim();
    if (req.body.email) updates.email = normalizeEmail(req.body.email);
    if (req.body.password) updates.password = String(req.body.password);

    if (updates.email) {
      const conflict = await User.findOne({ email: updates.email, _id: { $ne: req.user._id } });
      if (conflict) return res.status(409).json({ message: 'Email already in use' });
    }

    if (updates.password && updates.password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    Object.assign(user, updates);
    await user.save();

    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.get('/me/saved-items', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'savedItems',
      options: { sort: { createdAt: -1 } },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      items: user.savedItems || [],
      count: (user.savedItems || []).length,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
