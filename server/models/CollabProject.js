const mongoose = require('mongoose');

const openRoleSchema = new mongoose.Schema({
  roleTitle: { type: String, required: true, trim: true },
  spotsAvailable: { type: Number, default: 1, min: 1 },
  spotsFilled: { type: Number, default: 0, min: 0 },
  requiredSkills: [{ type: String, trim: true }],
  commitmentHoursPerWeek: { type: Number, default: 5 },
  description: { type: String, trim: true },
});

const applicantSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roleApplied: { type: String, required: true },
  pitch: { type: String, required: true, maxlength: 1000 },
  portfolioLink: { type: String, trim: true },
  githubLink: { type: String, trim: true },
  weeklyAvailabilityHours: { type: Number, default: 5 },
  status: {
    type: String,
    enum: ['applied', 'under_review', 'accepted', 'rejected'],
    default: 'applied',
  },
  appliedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
  reviewNotes: { type: String },
});

const teamMemberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, required: true },
  joinedAt: { type: Date, default: Date.now },
  contributions: { type: String },
});

const milestoneSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  isCompleted: { type: Boolean, default: false },
  dueDate: { type: Date },
});

const collabProjectSchema = new mongoose.Schema(
  {
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    tagline: { type: String, required: true, trim: true, maxlength: 250 },
    description: { type: String, required: true, maxlength: 5000 },
    category: {
      type: String,
      enum: [
        'startup_mvp',
        'open_source',
        'freelance_gig',
        'research_paper',
        'college_innovation',
        'hackathon_team',
        'other',
      ],
      default: 'startup_mvp',
    },
    techStack: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: ['recruiting', 'in_progress', 'completed', 'paused'],
      default: 'recruiting',
    },
    openRoles: [openRoleSchema],
    perks: [{ type: String, trim: true }], // e.g. 'Stipend', 'LOR', 'Mentorship', 'PPO Opportunity', 'Equity'
    stipendAmount: { type: String, trim: true }, // e.g. "₹8,000 / mo" or "Unpaid / Portfolio"
    estimatedDuration: { type: String, default: '4-8 Weeks' },
    githubUrl: { type: String, trim: true },
    liveUrl: { type: String, trim: true },
    communicationChannel: { type: String, trim: true }, // e.g. Discord / Slack link
    applicants: [applicantSchema],
    teamMembers: [teamMemberSchema],
    milestones: [milestoneSchema],
    viewsCount: { type: Number, default: 0 },
    likesCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

collabProjectSchema.index({ creator: 1, createdAt: -1 });
collabProjectSchema.index({ category: 1, status: 1 });
collabProjectSchema.index({ techStack: 1 });
collabProjectSchema.index({ 'applicants.user': 1 });

const CollabProject = mongoose.model('CollabProject', collabProjectSchema);
module.exports = CollabProject;
