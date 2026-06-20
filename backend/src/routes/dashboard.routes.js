import express from 'express';
import Content from '../models/Content.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const savedSelect = 'type title category description excerpt duration minutes pages resourceType level status author instructor readTime slug createdAt updatedAt featured steps outcomes';

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

function splitSavedItems(items = []) {
  return items.reduce(
    (acc, item) => {
      if (!item) return acc;
      if (item.type === 'tutorials') acc.tutorials.push(item);
      if (item.type === 'notes') acc.notes.push(item);
      if (item.type === 'roadmaps') acc.roadmaps.push(item);
      if (item.type === 'resources') acc.resources.push(item);
      return acc;
    },
    { tutorials: [], notes: [], roadmaps: [], resources: [] }
  );
}

function countByType(items = []) {
  return items.reduce(
    (acc, item) => {
      if (!item) return acc;
      if (item.type === 'tutorials') acc.tutorials += 1;
      if (item.type === 'notes') acc.notes += 1;
      if (item.type === 'roadmaps') acc.roadmaps += 1;
      if (item.type === 'resources') acc.resources += 1;
      return acc;
    },
    { tutorials: 0, notes: 0, roadmaps: 0, resources: 0 }
  );
}

async function loadDashboardUser(userId) {
  return User.findById(userId).populate({
    path: 'savedItems',
    select: savedSelect,
    options: { sort: { createdAt: -1 } },
  });
}

router.get('/dashboard/summary', requireAuth, async (req, res, next) => {
  try {
    const user = await loadDashboardUser(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const allContentCounts = await Promise.all([
      Content.countDocuments({ type: 'tutorials', status: 'published' }),
      Content.countDocuments({ type: 'notes', status: 'published' }),
      Content.countDocuments({ type: 'roadmaps', status: 'published' }),
      Content.countDocuments({ type: 'resources', status: 'published' }),
    ]);

    const savedItems = Array.isArray(user.savedItems) ? user.savedItems : [];
    const savedByType = splitSavedItems(savedItems);
    const savedCounts = countByType(savedItems);

    res.json({
      profile: publicUser(user),
      available: {
        tutorials: allContentCounts[0],
        notes: allContentCounts[1],
        roadmaps: allContentCounts[2],
        resources: allContentCounts[3],
      },
      saved: {
        tutorials: savedByType.tutorials,
        notes: savedByType.notes,
        roadmaps: savedByType.roadmaps,
        resources: savedByType.resources,
        ids: savedItems.map((item) => item._id),
        counts: savedCounts,
      },
      activity: {
        memberSince: user.createdAt,
        lastLogin: user.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/dashboard/saved-items', requireAuth, async (req, res, next) => {
  try {
    const user = await loadDashboardUser(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const savedItems = Array.isArray(user.savedItems) ? user.savedItems : [];
    res.json({
      items: savedItems,
      ids: savedItems.map((item) => item._id),
      counts: countByType(savedItems),
    });
  } catch (error) {
    next(error);
  }
});

router.put('/dashboard/saved-items/:contentId', requireAuth, async (req, res, next) => {
  try {
    const content = await Content.findById(req.params.contentId).select('_id type title slug category');
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    const user = await User.findById(req.user._id).select('savedItems');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const saved = user.savedItems.some((id) => String(id) === String(content._id));
    if (saved) {
      user.savedItems = user.savedItems.filter((id) => String(id) !== String(content._id));
    } else {
      user.savedItems.push(content._id);
    }

    await user.save();

    const refreshed = await loadDashboardUser(req.user._id);
    const savedItems = Array.isArray(refreshed?.savedItems) ? refreshed.savedItems : [];
    const savedByType = splitSavedItems(savedItems);

    res.json({
      saved: !saved,
      item: content,
      ids: savedItems.map((item) => item._id),
      savedItems,
      savedByType,
      counts: countByType(savedItems),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/dashboard/saved-items', requireAuth, async (req, res, next) => {
  try {
    const { contentId } = req.body;
    if (!contentId) return res.status(400).json({ message: 'contentId is required' });

    const content = await Content.findById(contentId).select('_id type title slug category');
    if (!content) return res.status(404).json({ message: 'Content not found' });

    const user = await User.findById(req.user._id).select('savedItems');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const saved = user.savedItems.some((id) => String(id) === String(content._id));
    if (saved) {
      user.savedItems = user.savedItems.filter((id) => String(id) !== String(content._id));
    } else {
      user.savedItems.push(content._id);
    }

    await user.save();

    const refreshed = await loadDashboardUser(req.user._id);
    const savedItems = Array.isArray(refreshed?.savedItems) ? refreshed.savedItems : [];

    res.json({
      saved: !saved,
      item: content,
      ids: savedItems.map((item) => item._id),
      savedItems,
      counts: countByType(savedItems),
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/dashboard/saved-items/:contentId', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('savedItems');
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.savedItems = user.savedItems.filter((id) => String(id) !== String(req.params.contentId));
    await user.save();

    const refreshed = await loadDashboardUser(req.user._id);
    const savedItems = Array.isArray(refreshed?.savedItems) ? refreshed.savedItems : [];

    res.json({
      saved: false,
      ids: savedItems.map((item) => item._id),
      savedItems,
      counts: countByType(savedItems),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/dashboard/profile', requireAuth, async (req, res, next) => {
  try {
    const user = await loadDashboardUser(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      profile: publicUser(user),
      savedCount: Array.isArray(user.savedItems) ? user.savedItems.length : 0,
      savedByType: countByType(user.savedItems || []),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/dashboard/activity', requireAuth, async (req, res, next) => {
  try {
    const user = await loadDashboardUser(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const savedItems = Array.isArray(user.savedItems) ? user.savedItems : [];
    res.json({
      activity: {
        memberSince: user.createdAt,
        lastLogin: user.updatedAt,
        totalSaved: savedItems.length,
        breakdown: countByType(savedItems),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
