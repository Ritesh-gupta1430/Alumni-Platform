const mongoose = require('mongoose');

const mentorshipRequestSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'cancelled', 'expired'],
      default: 'pending',
    },
    goal: { type: String, required: true, maxlength: 1000 },
    topics: [{ type: String }],
    duration: { type: String }, // "1 month", "3 months"
    preferredFrequency: { type: String }, // "weekly", "biweekly"
    declineReason: { type: String },
    expiresAt: { type: Date }, // auto-expire after 14 days
    matchScore: { type: Number }, // recommendation score at time of request
    matchBreakdown: { type: mongoose.Schema.Types.Mixed }, // explainable reasons
  },
  { timestamps: true }
);

mentorshipRequestSchema.index({ student: 1, status: 1 });
mentorshipRequestSchema.index({ mentor: 1, status: 1 });

const mentorshipSchema = new mongoose.Schema(
  {
    request: { type: mongoose.Schema.Types.ObjectId, ref: 'MentorshipRequest' },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed', 'cancelled'],
      default: 'active',
    },
    goal: { type: String },
    topics: [{ type: String }],
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    completedAt: { type: Date },

    // Progress tracking
    goals: [
      {
        title: String,
        description: String,
        targetDate: Date,
        isCompleted: Boolean,
        completedAt: Date,
      },
    ],
    sessionCount: { type: Number, default: 0 },
    totalHours: { type: Number, default: 0 },

    // Feedback
    studentFeedback: {
      rating: Number,
      comment: String,
      submittedAt: Date,
    },
    mentorFeedback: {
      rating: Number,
      comment: String,
      submittedAt: Date,
    },
  },
  { timestamps: true }
);

mentorshipSchema.index({ student: 1, status: 1 });
mentorshipSchema.index({ mentor: 1, status: 1 });

const mentorshipSessionSchema = new mongoose.Schema(
  {
    mentorship: { type: mongoose.Schema.Types.ObjectId, ref: 'Mentorship', required: true },
    scheduledAt: { type: Date },
    duration: { type: Number }, // minutes
    mode: { type: String, enum: ['video', 'phone', 'in_person', 'async'] },
    meetingLink: { type: String },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'no_show'],
      default: 'scheduled',
    },
    agenda: { type: String },
    notes: { type: String },
    studentFeedback: { rating: Number, comment: String },
    mentorNotes: { type: String },
  },
  { timestamps: true }
);

const MentorshipRequest = mongoose.model('MentorshipRequest', mentorshipRequestSchema);
const Mentorship = mongoose.model('Mentorship', mentorshipSchema);
const MentorshipSession = mongoose.model('MentorshipSession', mentorshipSessionSchema);

module.exports = { MentorshipRequest, Mentorship, MentorshipSession };
