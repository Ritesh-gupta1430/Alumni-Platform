/**
 * Notification Service
 * Creates in-app notifications and optionally sends emails
 */
const Notification = require('../models/Notification');
const { sendEmail } = require('./emailService');

async function createNotification({
  recipient,
  sender,
  type,
  priority = 'medium',
  title,
  message,
  link,
  data,
  sendEmail: shouldEmail = false,
  emailSubject,
  emailHtml,
}) {
  const notification = await Notification.create({
    recipient,
    sender,
    type,
    priority,
    title,
    message,
    link,
    data,
  });

  // Emit via Socket.IO if the user is online (handled in socket layer)
  try {
    const io = global.__socketIO;
    if (io) {
      io.to(`user:${recipient}`).emit('notification', {
        ...notification.toJSON(),
      });
    }
  } catch {
    // Socket emission failure should not break the notification save
  }

  return notification;
}

async function markAsRead(notificationId, userId) {
  return Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { read: true, readAt: new Date() },
    { new: true }
  );
}

async function markAllAsRead(userId) {
  return Notification.updateMany(
    { recipient: userId, read: false },
    { read: true, readAt: new Date() }
  );
}

async function getUnreadCount(userId) {
  return Notification.countDocuments({ recipient: userId, read: false });
}

async function getUserNotifications(userId, { page = 1, limit = 20, read } = {}) {
  const filter = { recipient: userId };
  if (read !== undefined) filter.read = read;

  const [notifications, total, unread] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('sender', 'firstName lastName profilePhoto role'),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: userId, read: false }),
  ]);

  return { notifications, total, unread, page, pages: Math.ceil(total / limit) };
}

// ===== Predefined notification factories =====

async function notifyConnectionRequest(recipient, sender) {
  return createNotification({
    recipient,
    sender: sender._id,
    type: 'connection_request',
    priority: 'medium',
    title: 'New connection request',
    message: `${sender.firstName} ${sender.lastName} wants to connect with you.`,
    link: `/network/requests`,
  });
}

async function notifyConnectionAccepted(recipient, sender) {
  return createNotification({
    recipient,
    sender: sender._id,
    type: 'connection_accepted',
    priority: 'low',
    title: 'Connection accepted',
    message: `${sender.firstName} ${sender.lastName} accepted your connection request.`,
    link: `/profile/${sender._id}`,
  });
}

async function notifyMentorshipRequest(mentor, student) {
  return createNotification({
    recipient: mentor._id,
    sender: student._id,
    type: 'mentorship_request',
    priority: 'high',
    title: 'New mentorship request',
    message: `${student.firstName} ${student.lastName} has requested you as a mentor.`,
    link: `/mentorship/requests`,
  });
}

async function notifyMentorshipAccepted(student, mentor) {
  return createNotification({
    recipient: student._id,
    sender: mentor._id,
    type: 'mentorship_accepted',
    priority: 'high',
    title: 'Mentorship request accepted',
    message: `${mentor.firstName} ${mentor.lastName} accepted your mentorship request.`,
    link: `/mentorship`,
  });
}

async function notifyVerificationUpdate(userId, status, reason) {
  const messages = {
    approved: { title: 'Account verified!', msg: 'Your identity has been verified. Welcome to AlumNetra!', priority: 'high' },
    rejected: { title: 'Verification update', msg: `Your verification was not approved. ${reason || ''}`, priority: 'high' },
    resubmission_required: { title: 'Action required', msg: 'Your verification needs additional documents.', priority: 'high' },
  };
  const info = messages[status] || { title: 'Account update', msg: 'Your account status has changed.', priority: 'medium' };

  return createNotification({
    recipient: userId,
    type: `verification_${status}`.replace('verification_approved', 'verification_approved').replace('verification_rejected', 'verification_rejected'),
    priority: info.priority,
    title: info.title,
    message: info.msg,
    link: '/dashboard',
  });
}

async function notifyDonationSuccess(userId, donation, campaign) {
  return createNotification({
    recipient: userId,
    type: 'donation_success',
    priority: 'high',
    title: 'Contribution successful!',
    message: `Your contribution of ₹${donation.amount.toLocaleString('en-IN')} to "${campaign.title}" has been received.`,
    link: `/contributions/receipt/${donation.donationId}`,
    data: { donationId: donation.donationId, campaignId: campaign._id },
  });
}

async function notifyApplicationStatusChange(applicant, job, newStatus) {
  const statusLabels = {
    shortlisted: 'You have been shortlisted',
    assessment: 'Assessment stage reached',
    interview: 'Interview scheduled',
    selected: '🎉 Congratulations! You have been selected',
    rejected: 'Application update',
  };
  return createNotification({
    recipient: applicant,
    type: 'job_application_status',
    priority: newStatus === 'selected' ? 'high' : 'medium',
    title: statusLabels[newStatus] || 'Application update',
    message: `Your application for "${job.title}" at ${job.companyName} has been updated to: ${newStatus}.`,
    link: `/applications`,
  });
}

module.exports = {
  createNotification,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  getUserNotifications,
  notifyConnectionRequest,
  notifyConnectionAccepted,
  notifyMentorshipRequest,
  notifyMentorshipAccepted,
  notifyVerificationUpdate,
  notifyDonationSuccess,
  notifyApplicationStatusChange,
};
