const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const notificationService = require('../services/notificationService');

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page, limit, read } = req.query;
    const data = await notificationService.getUserNotifications(req.user._id, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      read: read !== undefined ? read === 'true' : undefined,
    });
    return res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.patch('/:id/read', authenticate, async (req, res, next) => {
  try {
    await notificationService.markAsRead(req.params.id, req.user._id);
    return res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) { next(err); }
});

router.patch('/read-all', authenticate, async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user._id);
    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) { next(err); }
});

router.get('/unread-count', authenticate, async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.user._id);
    return res.json({ success: true, data: { count } });
  } catch (err) { next(err); }
});

module.exports = router;
