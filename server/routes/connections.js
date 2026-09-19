const express = require('express');
const router = express.Router();
const Connection = require('../models/Connection');
const { authenticate } = require('../middleware/auth');
const notificationService = require('../services/notificationService');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');

// POST /connections/request/:targetId
router.post('/request/:targetId', authenticate, async (req, res, next) => {
  try {
    const { targetId } = req.params;
    if (targetId === req.user._id.toString()) throw new AppError('Cannot connect with yourself.', 400);

    const target = await User.findById(targetId);
    if (!target || target.accountStatus !== 'active') throw new AppError('User not found.', 404);

    const existing = await Connection.findOne({
      $or: [
        { requester: req.user._id, recipient: targetId },
        { requester: targetId, recipient: req.user._id },
      ],
    });

    if (existing) {
      if (existing.status === 'accepted') {
        return res.json({ success: true, message: `You are already connected with ${target.firstName}!`, status: 'accepted' });
      }
      if (existing.status === 'pending') {
        // If the other person already sent a request to me, auto-accept and connect immediately!
        if (existing.recipient.toString() === req.user._id.toString()) {
          existing.status = 'accepted';
          existing.acceptedAt = new Date();
          await existing.save();
          await notificationService.notifyConnectionAccepted(targetId, req.user);
          return res.json({ success: true, message: `Mutual connection! You and ${target.firstName} are now connected.`, status: 'accepted' });
        }
        return res.json({ success: true, message: 'Connection request is already pending.', status: 'pending' });
      }
      if (existing.status === 'declined') {
        // Allow re-request
        existing.status = 'pending';
        existing.requester = req.user._id;
        existing.recipient = targetId;
        existing.message = req.body.message || req.body.note;
        await existing.save();
      }
    } else {
      await Connection.create({
        requester: req.user._id,
        recipient: targetId,
        message: req.body.message || req.body.note,
      });
    }

    await notificationService.notifyConnectionRequest(targetId, req.user);

    return res.status(201).json({ success: true, message: `Connection request sent to ${target.firstName}!`, status: 'pending' });
  } catch (err) { next(err); }
});

// PATCH /connections/:connectionId/accept
router.patch('/:connectionId/accept', authenticate, async (req, res, next) => {
  try {
    const conn = await Connection.findOne({ _id: req.params.connectionId, recipient: req.user._id, status: 'pending' });
    if (!conn) throw new AppError('Connection request not found.', 404);

    conn.status = 'accepted';
    conn.acceptedAt = new Date();
    await conn.save();

    const requester = await User.findById(conn.requester).select('firstName lastName profilePhoto');
    await notificationService.notifyConnectionAccepted(conn.requester, req.user);

    return res.json({ success: true, message: 'Connection accepted.' });
  } catch (err) { next(err); }
});

// PATCH /connections/:connectionId/decline
router.patch('/:connectionId/decline', authenticate, async (req, res, next) => {
  try {
    const conn = await Connection.findOne({ _id: req.params.connectionId, recipient: req.user._id, status: 'pending' });
    if (!conn) throw new AppError('Connection request not found.', 404);

    conn.status = 'declined';
    conn.declinedAt = new Date();
    await conn.save();

    return res.json({ success: true, message: 'Connection declined.' });
  } catch (err) { next(err); }
});

// DELETE /connections/:connectionId
router.delete('/:connectionId', authenticate, async (req, res, next) => {
  try {
    await Connection.findOneAndDelete({
      _id: req.params.connectionId,
      $or: [{ requester: req.user._id }, { recipient: req.user._id }],
    });
    return res.json({ success: true, message: 'Connection removed.' });
  } catch (err) { next(err); }
});

// GET /connections/mine
router.get('/mine', authenticate, async (req, res, next) => {
  try {
    const { status = 'accepted', page = 1, limit = 20 } = req.query;
    const filter = {
      $or: [{ requester: req.user._id }, { recipient: req.user._id }],
      status,
    };

    const [connections, total] = await Promise.all([
      Connection.find(filter)
        .populate('requester', 'firstName lastName profilePhoto role department graduationYear verificationBadge')
        .populate('recipient', 'firstName lastName profilePhoto role department graduationYear verificationBadge')
        .sort({ acceptedAt: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Connection.countDocuments(filter),
    ]);

    return res.json({ success: true, data: { connections, total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

// GET /connections/pending
router.get('/pending', authenticate, async (req, res, next) => {
  try {
    const requests = await Connection.find({ recipient: req.user._id, status: 'pending' })
      .populate('requester', 'firstName lastName profilePhoto role department graduationYear verificationBadge')
      .sort({ createdAt: -1 });
    return res.json({ success: true, data: requests });
  } catch (err) { next(err); }
});

// GET /connections/status/:targetId
router.get('/status/:targetId', authenticate, async (req, res, next) => {
  try {
    const conn = await Connection.findOne({
      $or: [
        { requester: req.user._id, recipient: req.params.targetId },
        { requester: req.params.targetId, recipient: req.user._id },
      ],
    });
    return res.json({
      success: true,
      data: {
        status: conn?.status || 'none',
        connectionId: conn?._id,
        isRequester: conn?.requester?.toString() === req.user._id.toString(),
      },
    });
  } catch (err) { next(err); }
});

module.exports = router;
