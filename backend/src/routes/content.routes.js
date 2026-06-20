import express from 'express';
import mongoose from 'mongoose';
import Content from '../models/Content.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const collections = ['tutorials', 'notes', 'roadmaps', 'resources'];

function ensureCollection(req, res, next) {
  if (!collections.includes(req.params.collection)) {
    return res.status(404).json({ message: 'Unknown collection' });
  }
  next();
}

function toNumber(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : fallback;
}

function parseSort(sort = '-createdAt') {
  const allowed = ['createdAt', '-createdAt', 'title', '-title', 'updatedAt', '-updatedAt'];
  return allowed.includes(sort) ? sort : '-createdAt';
}

router.get('/:collection', ensureCollection, async (req, res, next) => {
  try {
    const { q, category, status, limit = 100, page = 1, sort = '-createdAt', featured } = req.query;
    const filter = { type: req.params.collection };

    if (category && category !== 'all') filter.category = String(category).toLowerCase();
    if (status && status !== 'all') filter.status = status;
    if (featured === 'true') filter.featured = true;
    if (q) filter.$text = { $search: q };

    const pageNumber = toNumber(page, 1);
    const pageSize = Math.min(toNumber(limit, 100), 200);
    const skip = (pageNumber - 1) * pageSize;

    const [items, total] = await Promise.all([
      Content.find(filter).sort(parseSort(sort)).skip(skip).limit(pageSize),
      Content.countDocuments(filter),
    ]);

    res.json({
      items,
      meta: {
        total,
        page: pageNumber,
        limit: pageSize,
        pages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:collection/stats', ensureCollection, async (req, res, next) => {
  try {
    const [total, published, drafts, featured] = await Promise.all([
      Content.countDocuments({ type: req.params.collection }),
      Content.countDocuments({ type: req.params.collection, status: 'published' }),
      Content.countDocuments({ type: req.params.collection, status: 'draft' }),
      Content.countDocuments({ type: req.params.collection, featured: true }),
    ]);

    res.json({ total, published, drafts, featured });
  } catch (error) {
    next(error);
  }
});

router.get('/:collection/:id', ensureCollection, async (req, res, next) => {
  try {
    const query = mongoose.isValidObjectId(req.params.id)
      ? { _id: req.params.id, type: req.params.collection }
      : { slug: req.params.id, type: req.params.collection };

    const item = await Content.findOne(query);
    if (!item) return res.status(404).json({ message: 'Content not found' });
    res.json({ item });
  } catch (error) {
    next(error);
  }
});

router.post('/:collection', requireAuth, requireAdmin, ensureCollection, async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      type: req.params.collection,
      createdBy: req.user?._id,
    };

    if (Array.isArray(payload.steps)) payload.steps = payload.steps.filter(Boolean);
    if (Array.isArray(payload.outcomes)) payload.outcomes = payload.outcomes.filter(Boolean);

    const item = await Content.create(payload);
    res.status(201).json({ item });
  } catch (error) {
    next(error);
  }
});

router.put('/:collection/:id', requireAuth, requireAdmin, ensureCollection, async (req, res, next) => {
  try {
    const payload = { ...req.body };
    delete payload.type;
    delete payload.createdBy;

    if (Array.isArray(payload.steps)) payload.steps = payload.steps.filter(Boolean);
    if (Array.isArray(payload.outcomes)) payload.outcomes = payload.outcomes.filter(Boolean);

    const item = await Content.findOneAndUpdate(
      { _id: req.params.id, type: req.params.collection },
      payload,
      { new: true, runValidators: true }
    );

    if (!item) return res.status(404).json({ message: 'Content not found' });
    res.json({ item });
  } catch (error) {
    next(error);
  }
});

router.delete('/:collection/:id', requireAuth, requireAdmin, ensureCollection, async (req, res, next) => {
  try {
    const item = await Content.findOneAndDelete({ _id: req.params.id, type: req.params.collection });
    if (!item) return res.status(404).json({ message: 'Content not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
