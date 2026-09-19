const express = require('express');
const router = express.Router();
const { authenticate, requireActiveAccount, authorize } = require('../middleware/auth');
const { Community, Event, EventRegistration } = require('../models/Community');
const { AppError } = require('../middleware/errorHandler');
const { uploadFile, imageUpload } = require('../services/storageService');

// ===== COMMUNITIES =====

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { category, q, page = 1, limit = 12 } = req.query;
    const filter = { isArchived: false };
    if (category) filter.category = category;
    if (q) filter.name = { $regex: q, $options: 'i' };

    const [communities, total] = await Promise.all([
      Community.find(filter)
        .populate('createdBy', 'firstName lastName profilePhoto')
        .sort({ memberCount: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Community.countDocuments(filter),
    ]);

    return res.json({ success: true, data: { communities, total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

router.post('/', authenticate, requireActiveAccount, async (req, res, next) => {
  try {
    const slug = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36);
    const community = await Community.create({
      ...req.body,
      slug,
      createdBy: req.user._id,
      managers: [req.user._id],
    });
    return res.status(201).json({ success: true, data: community });
  } catch (err) { next(err); }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id).populate('createdBy', 'firstName lastName profilePhoto');
    if (!community) throw new AppError('Community not found.', 404);
    return res.json({ success: true, data: community });
  } catch (err) { next(err); }
});

// ===== EVENTS =====

router.get('/events/list', authenticate, async (req, res, next) => {
  try {
    const { category, mode, q, status = 'active', page = 1, limit = 24 } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (category) filter.category = category;
    if (mode) filter.mode = mode;
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { venue: { $regex: q, $options: 'i' } },
      ];
    }

    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate('organizer', 'firstName lastName profilePhoto role department')
        .sort({ startDate: 1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean(),
      Event.countDocuments(filter),
    ]);

    // Attach user registration status
    const eventIds = events.map((e) => e._id);
    const myRegistrations = await EventRegistration.find({
      event: { $in: eventIds },
      user: req.user._id,
      status: { $ne: 'cancelled' },
    }).lean();

    const regMap = myRegistrations.reduce((acc, r) => ({ ...acc, [r.event.toString()]: r }), {});

    const enriched = events.map((e) => ({
      ...e,
      isRegistered: !!regMap[e._id.toString()],
      myRegistration: regMap[e._id.toString()] || null,
    }));

    return res.json({ success: true, data: { events: enriched, total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

router.post('/events', authenticate, requireActiveAccount, async (req, res, next) => {
  try {
    const canPublish = ['ALUMNI', 'FACULTY', 'ADMIN', 'SUPER_ADMIN', 'STUDENT'].includes(req.user.role);
    const mode = req.body.mode || (req.body.locationType === 'in_person' ? 'offline' : 'online');
    const venue = req.body.venue || req.body.location || (mode === 'offline' ? 'TCET Campus' : '');
    
    const event = await Event.create({
      ...req.body,
      mode,
      venue,
      organizer: req.user._id,
      status: canPublish ? 'active' : 'pending_approval',
    });
    return res.status(201).json({ success: true, data: event });
  } catch (err) { next(err); }
});

router.post('/events/:id/register', authenticate, requireActiveAccount, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event || event.status !== 'active') throw new AppError('Event not found.', 404);
    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      throw new AppError('Registration deadline has passed.', 400);
    }
    if (event.capacity && event.registrationCount >= event.capacity) {
      throw new AppError('This event is at full capacity.', 400, 'FULL_CAPACITY');
    }

    const existing = await EventRegistration.findOne({ event: event._id, user: req.user._id });
    if (existing) throw new AppError('Already registered.', 409);

    const reg = await EventRegistration.create({ event: event._id, user: req.user._id });
    await Event.findByIdAndUpdate(event._id, { $inc: { registrationCount: 1 } });

    return res.status(201).json({ success: true, message: 'Registered for event.', data: reg });
  } catch (err) { next(err); }
});

router.post('/events/:id/feedback', authenticate, async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const reg = await EventRegistration.findOneAndUpdate(
      { event: req.params.id, user: req.user._id },
      { feedback: { rating, comment }, feedbackAt: new Date() },
      { new: true }
    );
    if (!reg) throw new AppError('Registration not found.', 404);
    return res.json({ success: true, message: 'Feedback submitted.', data: reg });
  } catch (err) { next(err); }
});

module.exports = router;
