const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Socket.IO handler
 * Manages real-time: messaging, notifications, online status, typing indicators
 */
module.exports = function socketHandler(io) {
  // Store online users: userId -> Set of socket IDs
  const onlineUsers = new Map();

  // Authenticate socket connection using JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.userId).select('_id firstName lastName role accountStatus');

      if (!user || user.accountStatus === 'suspended') {
        return next(new Error('User not authorized'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;

    // Join personal room for notifications
    socket.join(`user:${userId}`);

    // Track online status
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Broadcast online status to connections
    socket.broadcast.emit('user:online', { userId });

    // ===== Messaging =====

    socket.on('conversation:join', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('conversation:leave', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('message:typing', ({ conversationId, isTyping }) => {
      socket.to(`conversation:${conversationId}`).emit('message:typing', {
        userId,
        conversationId,
        isTyping,
      });
    });

    socket.on('message:read', ({ conversationId, messageId }) => {
      socket.to(`conversation:${conversationId}`).emit('message:read', {
        userId,
        conversationId,
        messageId,
      });
    });

    // ===== Notifications =====

    socket.on('notification:read', (notificationId) => {
      // Client acknowledges notification read — can trigger backend sync
      socket.emit('notification:acknowledged', { notificationId });
    });

    // ===== Disconnect =====

    socket.on('disconnect', () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          socket.broadcast.emit('user:offline', { userId });
        }
      }
    });
  });

  // Helper: check if user is online
  io.isUserOnline = (userId) => onlineUsers.has(userId.toString());

  // Helper: get online user IDs
  io.getOnlineUsers = () => Array.from(onlineUsers.keys());
};
