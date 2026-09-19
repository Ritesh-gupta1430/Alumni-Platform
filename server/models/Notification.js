const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      required: true,
      enum: [
        'connection_request', 'connection_accepted', 'connection_declined',
        'message_received',
        'mentorship_request', 'mentorship_accepted', 'mentorship_declined',
        'mentorship_session_scheduled', 'mentorship_completed',
        'job_recommended', 'internship_recommended',
        'job_application_status', 'internship_application_status',
        'event_registered', 'event_reminder', 'event_approved',
        'community_post', 'community_joined',
        'verification_approved', 'verification_rejected', 'verification_correction',
        'donation_success', 'donation_failed', 'receipt_generated',
        'campaign_update', 'campaign_published',
        'admin_announcement', 'system_message',
        'story_liked', 'story_commented',
        'project_liked', 'project_feedback',
        'referral_received', 'referral_outcome',
        'recognition_granted',
        'volunteer_request', 'volunteer_accepted',
        'collaboration_request', 'collaboration_accepted',
      ],
    },
    priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String }, // frontend route to navigate
    data: { type: mongoose.Schema.Types.Mixed }, // additional context
    read: { type: Boolean, default: false },
    readAt: { type: Date },
    emailSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1 });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
