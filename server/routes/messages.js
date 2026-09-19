const express = require('express');
const router = express.Router();
const { authenticate, requireActiveAccount } = require('../middleware/auth');
const { Conversation, Message } = require('../models/Message');
const User = require('../models/User');
const Connection = require('../models/Connection');
const { AppError } = require('../middleware/errorHandler');

// GET /messages/conversations
router.get('/conversations', authenticate, async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id, isActive: true })
      .populate('participants', 'firstName lastName profilePhoto accountStatus verificationBadge')
      .populate('lastMessage', 'content type createdAt sender')
      .sort({ lastMessageAt: -1 });
    return res.json({ success: true, data: conversations });
  } catch (err) { next(err); }
});

// GET /messages/conversations/:id/messages
router.get('/conversations/:id/messages', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const conversation = await Conversation.findOne({ _id: req.params.id, participants: req.user._id });
    if (!conversation) throw new AppError('Conversation not found.', 404);

    const messages = await Message.find({ conversation: conversation._id, deletedFor: { $ne: req.user._id } })
      .populate('sender', 'firstName lastName profilePhoto')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return res.json({ success: true, data: messages.reverse() });
  } catch (err) { next(err); }
});

// POST /messages/conversations — start conversation
router.post('/conversations', authenticate, requireActiveAccount, async (req, res, next) => {
  try {
    const { recipientId } = req.body;
    if (recipientId === req.user._id.toString()) throw new AppError('Cannot message yourself.', 400);

    // Check messaging privacy
    const recipient = await User.findById(recipientId);
    if (!recipient) throw new AppError('User not found.', 404);

    // Check if already connected (if messaging privacy is connections_only)
    if (recipient.messagingPrivacy === 'connections_only') {
      const connection = await Connection.findOne({
        $or: [{ requester: req.user._id, recipient: recipientId }, { requester: recipientId, recipient: req.user._id }],
        status: 'accepted',
      });
      if (!connection) throw new AppError('You can only message your connections.', 403, 'NOT_CONNECTED');
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({ participants: { $all: [req.user._id, recipientId], $size: 2 } });

    if (!conversation) {
      conversation = await Conversation.create({ participants: [req.user._id, recipientId] });
    }

    return res.status(201).json({ success: true, data: conversation });
  } catch (err) { next(err); }
});

// POST /messages/conversations/:id/messages
router.post('/conversations/:id/messages', authenticate, async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({ _id: req.params.id, participants: req.user._id });
    if (!conversation) throw new AppError('Conversation not found.', 404);

    const { content, type = 'text' } = req.body;
    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      content,
      type,
    });

    // Update conversation last message
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    conversation.lastMessagePreview = content?.slice(0, 100);

    // Increment unread for other participants
    const otherId = conversation.participants.find((p) => p.toString() !== req.user._id.toString());
    if (otherId) {
      const count = conversation.unreadCounts.get(otherId.toString()) || 0;
      conversation.unreadCounts.set(otherId.toString(), count + 1);
    }

    await conversation.save();

    // Emit via Socket.IO
    const io = global.__socketIO;
    if (io) {
      io.to(`conversation:${conversation._id}`).emit('message:new', {
        ...message.toJSON(),
        sender: { _id: req.user._id, firstName: req.user.firstName, lastName: req.user.lastName, profilePhoto: req.user.profilePhoto },
      });
    }

    return res.status(201).json({ success: true, data: message });
  } catch (err) { next(err); }
});

module.exports = router;
