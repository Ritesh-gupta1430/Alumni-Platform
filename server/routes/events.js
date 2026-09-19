const express = require('express');
const router = express.Router();
const { Community, Event, EventRegistration } = require('../models/Community');
const { authenticate, authorize } = require('../middleware/auth');

// Re-export event routes under /events
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { category, status = 'active', page = 1, limit = 12 } = req.query;
    const filter = { status };
    if (category) filter.category = category;

    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate('organizer', 'firstName lastName profilePhoto role')
        .sort({ startDate: 1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Event.countDocuments(filter),
    ]);

    return res.json({ success: true, data: { events, total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

module.exports = router;
