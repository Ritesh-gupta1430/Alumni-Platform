const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['technical', 'academic', 'career', 'social', 'alumni', 'research', 'entrepreneurship', 'other'],
      default: 'other',
    },
    avatar: { type: String },
    banner: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    managers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    memberCount: { type: Number, default: 0 },
    postCount: { type: Number, default: 0 },
    isPrivate: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    tags: [{ type: String }],
    rules: [{ title: String, description: String }],
    featuredOrder: { type: Number },
  },
  { timestamps: true }
);

communitySchema.index({ slug: 1 });
communitySchema.index({ category: 1, memberCount: -1 });
communitySchema.index({ tags: 1 });

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    shortDescription: { type: String, maxlength: 300 },
    category: {
      type: String,
      enum: [
        'alumni_meet', 'seminar', 'workshop', 'guest_lecture', 'webinar',
        'career_talk', 'reunion', 'ama', 'mentorship_session', 'networking',
        'competition', 'cultural', 'other'
      ],
      default: 'other',
    },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    speakers: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String,
        designation: String,
        bio: String,
        photo: String,
      },
    ],
    banner: { type: String },
    images: [{ type: String }],
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    timezone: { type: String, default: 'Asia/Kolkata' },
    mode: { type: String, enum: ['online', 'offline', 'hybrid'], default: 'online' },
    venue: { type: String },
    meetingLink: { type: String },
    capacity: { type: Number },
    registrationDeadline: { type: Date },
    registrationCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'pending_approval', 'approved', 'rejected', 'active', 'cancelled', 'completed'],
      default: 'draft',
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    publishedAt: { type: Date },
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community' },
    tags: [{ type: String }],
    targetAudience: [{ type: String, enum: ['STUDENT', 'ALUMNI', 'FACULTY', 'ALL'] }],
    eligibleDepartments: [{ type: String }],
    eligibleGraduationYears: [{ type: Number }],
    isFeatured: { type: Boolean, default: false },
    feedbackForm: { type: Boolean, default: true },
  },
  { timestamps: true }
);

eventSchema.index({ status: 1, startDate: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ organizer: 1 });
eventSchema.index({ tags: 1 });

const eventRegistrationSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    attended: { type: Boolean, default: false },
    feedback: { rating: Number, comment: String },
    feedbackAt: { type: Date },
    cancelledAt: { type: Date },
    status: { type: String, enum: ['registered', 'attended', 'cancelled'], default: 'registered' },
  },
  { timestamps: true }
);

eventRegistrationSchema.index({ event: 1, user: 1 }, { unique: true });

const Community = mongoose.model('Community', communitySchema);
const Event = mongoose.model('Event', eventSchema);
const EventRegistration = mongoose.model('EventRegistration', eventRegistrationSchema);

module.exports = { Community, Event, EventRegistration };
