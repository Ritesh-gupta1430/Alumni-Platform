const mongoose = require('mongoose');

const referralApplicantSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pitch: { type: String, required: true, maxlength: 1200 },
  resumeUrl: { type: String, trim: true },
  githubUrl: { type: String, trim: true },
  portfolioUrl: { type: String, trim: true },
  leetcodeProfile: { type: String, trim: true },
  atsScore: { type: Number, min: 0, max: 100 },
  status: {
    type: String,
    enum: ['submitted', 'under_review', 'referral_submitted', 'rejected', 'interview_scheduled', 'hired'],
    default: 'submitted',
  },
  alumnusFeedback: { type: String, trim: true },
  internalReferralId: { type: String, trim: true }, // e.g. Internal company ref code entered by alumnus
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
});

const referralPostSchema = new mongoose.Schema(
  {
    alumnus: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    companyName: { type: String, required: true, trim: true },
    companyLogo: { type: String, trim: true },
    jobTitle: { type: String, required: true, trim: true },
    jobReqId: { type: String, trim: true }, // Requisition / Job ID on company careers portal
    jobUrl: { type: String, trim: true }, // Link to official job posting
    jobLocation: { type: String, required: true, default: 'Mumbai / Hybrid' },
    jobType: {
      type: String,
      enum: ['full_time', 'internship', 'contract'],
      default: 'full_time',
    },
    experienceLevel: {
      type: String,
      enum: ['entry_level', 'intern', '1_to_3_years', '3_plus_years'],
      default: 'entry_level',
    },
    salaryRange: { type: String, trim: true }, // e.g. "₹12 - ₹18 LPA"
    totalSlots: { type: Number, default: 3, min: 1 },
    filledSlots: { type: Number, default: 0, min: 0 },
    deadline: { type: Date },
    status: {
      type: String,
      enum: ['open', 'closed', 'paused'],
      default: 'open',
    },
    prerequisites: [{ type: String, trim: true }], // e.g. 'Min CGPA 8.0', 'LeetCode 200+ problems'
    requiredSkills: [{ type: String, trim: true }],
    description: { type: String, trim: true, maxlength: 3000 },
    alumnusNote: { type: String, trim: true }, // Note from alumnus on what they are looking for
    applicants: [referralApplicantSchema],
    viewsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

referralPostSchema.index({ alumnus: 1, createdAt: -1 });
referralPostSchema.index({ companyName: 1, status: 1 });
referralPostSchema.index({ requiredSkills: 1 });
referralPostSchema.index({ 'applicants.user': 1 });

const ReferralPost = mongoose.model('ReferralPost', referralPostSchema);
module.exports = ReferralPost;
