import express from 'express';
import Contact from '../models/Contact.js';
import Newsletter from '../models/Newsletter.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

router.post('/contacts', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = normalizeEmail(req.body.email);
    const subject = String(req.body.subject || 'General').trim() || 'General';
    const message = String(req.body.message || '').trim();

    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email and message are required' });
    }

    const contact = await Contact.create({ name, email, subject, message });
    res.status(201).json({ contact });
  } catch (error) {
    next(error);
  }
});

router.get('/contacts', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json({ contacts });
  } catch (error) {
    next(error);
  }
});

router.patch('/contacts/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const update = {};
    if (req.body.name) update.name = String(req.body.name).trim();
    if (req.body.email) update.email = normalizeEmail(req.body.email);
    if (req.body.subject) update.subject = String(req.body.subject).trim();
    if (req.body.message) update.message = String(req.body.message).trim();
    if (req.body.status) update.status = req.body.status;

    const contact = await Contact.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!contact) return res.status(404).json({ message: 'Contact not found' });
    res.json({ contact });
  } catch (error) {
    next(error);
  }
});

router.delete('/contacts/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) return res.status(404).json({ message: 'Contact not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    next(error);
  }
});

router.post('/newsletter', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const subscriber = await Newsletter.findOneAndUpdate(
      { email },
      { email },
      { new: true, upsert: true, runValidators: true }
    );
    res.status(201).json({ subscriber });
  } catch (error) {
    next(error);
  }
});

router.get('/newsletter', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const subscribers = await Newsletter.find().sort({ createdAt: -1 });
    res.json({ subscribers });
  } catch (error) {
    next(error);
  }
});

router.delete('/newsletter/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const subscriber = await Newsletter.findByIdAndDelete(req.params.id);
    if (!subscriber) return res.status(404).json({ message: 'Subscriber not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
