const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    proficiency: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
    category: { type: String, enum: ['technical', 'soft', 'language', 'tool', 'other'] },
  },
  { _id: false }
);

const linkSchema = new mongoose.Schema(
  {
    platform: { type: String },
    url: { type: String },
    visibility: {
      type: String,
      enum: ['public', 'tcet_network', 'connections', 'private'],
      default: 'tcet_network',
    },
  },
  { _id: false }
);

const achievementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    date: { type: Date },
    category: { type: String, enum: ['award', 'hackathon', 'competition', 'publication', 'other'] },
    url: { type: String },
  },
  { _id: false }
);

const academicHistorySchema = new mongoose.Schema(
  {
    level: {
      type: String,
      enum: ['tenth', 'twelfth', 'diploma', 'degree', 'pg', 'phd', 'other'],
      required: true,
    },
    institution: { type: String },
    board: { type: String },
    percentage: { type: Number },
    cgpa: { type: Number },
    passingYear: { type: Number },
    specialization: { type: String },
    visibility: {
      type: String,
      enum: ['public', 'tcet_network', 'connections', 'private'],
      default: 'connections',
    },
  },
  { _id: false }
);

const semesterResultSchema = new mongoose.Schema(
  {
    semester: { type: Number, required: true }, // 1 to 8
    sgpa: { type: Number },
    cgpa: { type: Number },
    passingYear: { type: Number },
    ktCount: { type: Number, default: 0 },
    marksheetUrl: { type: String },
    marksheetFilename: { type: String },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const internshipSchema = new mongoose.Schema(
  {
    company: { type: String, required: true },
    role: { type: String, required: true },
    startDate: { type: Date },
    endDate: { type: Date },
    isCurrent: { type: Boolean, default: false },
    location: { type: String },
    description: { type: String },
    skills: [{ type: String }],
    certificateUrl: { type: String },
    certificateFilename: { type: String },
  },
  { _id: false }
);

const hackathonSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    projectName: { type: String },
    position: { type: String }, // e.g., '1st Place Winner', 'Finalist', 'Runner Up', 'Participant'
    date: { type: Date },
    description: { type: String },
    projectUrl: { type: String },
    certificateUrl: { type: String },
    certificateFilename: { type: String },
  },
  { _id: false }
);

const certificationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    issuer: { type: String }, // e.g., 'AWS', 'Coursera', 'NPTEL', 'Google', 'DeepLearning.AI'
    issueDate: { type: Date },
    expiryDate: { type: Date },
    credentialId: { type: String },
    credentialUrl: { type: String },
    certificateUrl: { type: String },
    certificateFilename: { type: String },
  },
  { _id: false }
);

const profileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

    // === Professional ===
    headline: { type: String, trim: true, maxlength: 200 },
    about: { type: String, maxlength: 2000 },
    currentOrganization: { type: String, trim: true },
    currentDesignation: { type: String, trim: true },
    currentCity: { type: String, trim: true },
    currentState: { type: String, trim: true },
    currentCountry: { type: String, trim: true, default: 'India' },
    industry: { type: String, trim: true },
    yearsOfExperience: { type: Number },

    // === Academic History & Semester Results ===
    academicHistory: [academicHistorySchema],
    semesterResults: [semesterResultSchema],
    internships: [internshipSchema],
    hackathons: [hackathonSchema],
    certifications: [certificationSchema],

    // === Skills ===
    skills: [skillSchema],
    skillsVisibility: {
      type: String,
      enum: ['public', 'tcet_network', 'connections', 'private'],
      default: 'tcet_network',
    },

    // === External Links ===
    links: [linkSchema],

    // === Achievements ===
    achievements: [achievementSchema],

    // === Documents (URLs) ===
    resume: {
      url: { type: String },
      filename: { type: String },
      uploadedAt: { type: Date },
      visibility: {
        type: String,
        enum: ['public', 'tcet_network', 'connections', 'private'],
        default: 'connections',
      },
    },

    // === Mentorship (for alumni/faculty) ===
    isMentor: { type: Boolean, default: false },
    mentorshipTopics: [{ type: String }],
    mentorshipAvailability: {
      type: String,
      enum: ['open', 'limited', 'closed'],
      default: 'closed',
    },
    maxMentees: { type: Number, default: 3 },
    currentMenteeCount: { type: Number, default: 0 },

    // === Career Interests (for students) ===
    careerGoals: [{ type: String }],
    targetRoles: [{ type: String }],
    targetIndustries: [{ type: String }],
    targetCompanies: [{ type: String }],
    openToOpportunities: { type: Boolean, default: true },
    workPreference: {
      type: String,
      enum: ['remote', 'hybrid', 'onsite', 'any'],
      default: 'any',
    },

    // === Alumni Specific ===
    impactScore: { type: Number, default: 0 },
    impactBreakdown: {
      mentorship: { type: Number, default: 0 },
      events: { type: Number, default: 0 },
      referrals: { type: Number, default: 0 },
      volunteering: { type: Number, default: 0 },
      careerTalks: { type: Number, default: 0 },
      projectGuidance: { type: Number, default: 0 },
      donations: { type: Number, default: 0 },
    },

    // === Completion ===
    completionPercentage: { type: Number, default: 0 },
    completionDetails: {
      type: Map,
      of: Boolean,
      default: {},
    },

    // === Privacy Overrides ===
    profileVisibility: {
      type: String,
      enum: ['public', 'tcet_network', 'connections', 'private'],
      default: 'tcet_network',
    },
    aboutVisibility: {
      type: String,
      enum: ['public', 'tcet_network', 'connections', 'private'],
      default: 'tcet_network',
    },
    contactVisibility: {
      type: String,
      enum: ['public', 'tcet_network', 'connections', 'private'],
      default: 'connections',
    },
  },
  { timestamps: true }
);

profileSchema.index({ user: 1 });
profileSchema.index({ isMentor: 1, mentorshipAvailability: 1 });
profileSchema.index({ 'skills.name': 1 });
profileSchema.index({ industry: 1 });
profileSchema.index({ currentCity: 1 });
profileSchema.index({ impactScore: -1 });

const Profile = mongoose.model('Profile', profileSchema);
module.exports = Profile;
