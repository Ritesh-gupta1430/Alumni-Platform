const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actorEmail: { type: String }, // denormalized for audit purposes even if user deleted
    actorRole: { type: String },
    action: {
      type: String,
      required: true,
      enum: [
        // Auth
        'user_registered', 'user_logged_in', 'user_logged_out', 'password_reset',
        'email_verified', 'mfa_enabled', 'mfa_disabled', 'session_revoked',
        // Verification
        'verification_submitted', 'verification_approved', 'verification_rejected',
        'verification_correction_requested', 'document_reviewed',
        // User Management
        'user_role_changed', 'user_suspended', 'user_activated', 'user_deactivated',
        'badge_assigned', 'badge_revoked',
        // Content
        'post_removed', 'comment_removed', 'job_removed', 'event_removed',
        'community_post_removed', 'story_removed',
        // Recruiter / Company
        'recruiter_approved', 'recruiter_rejected', 'company_approved', 'job_approved',
        'job_rejected',
        // Campaigns
        'campaign_created', 'campaign_approved', 'campaign_rejected', 'campaign_published',
        'campaign_paused', 'campaign_closed', 'campaign_archived',
        // Reports
        'report_reviewed', 'report_actioned',
        // System
        'system_config_changed', 'admin_created', 'admin_removed',
        'announcement_published', 'recognition_granted',
      ],
    },
    targetType: { type: String }, // e.g., 'User', 'VerificationRequest', 'Job', 'Campaign'
    targetId: { type: mongoose.Schema.Types.ObjectId },
    targetDisplay: { type: String }, // human-readable identifier
    metadata: { type: mongoose.Schema.Types.Mixed }, // additional context
    ipAddress: { type: String },
    userAgent: { type: String },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
  },
  {
    timestamps: true,
    capped: false, // don't cap — we want full history
  }
);

auditLogSchema.index({ actor: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ targetType: 1, targetId: 1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ severity: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;
