const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // alumni referral

    status: {
      type: String,
      enum: ['applied', 'shortlisted', 'assessment', 'interview', 'selected', 'rejected', 'withdrawn'],
      default: 'applied',
    },

    // Cover letter / motivation
    coverLetter: { type: String, maxlength: 3000 },
    resumeUrl: { type: String }, // snapshot at time of application
    answersToQuestions: [{ question: String, answer: String }],

    // Recruiter notes
    recruiterNotes: { type: String },
    recruiterRating: { type: Number, min: 1, max: 5 },
    interviewDate: { type: Date },
    interviewMode: { type: String, enum: ['virtual', 'in_person', 'phone'] },
    interviewLink: { type: String },
    offerAmount: { type: Number },
    offerAccepted: { type: Boolean },

    // Status history
    statusHistory: [
      {
        status: String,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
        note: String,
      },
    ],

    // Eligibility check at time of application
    eligibilitySnapshot: {
      cgpa: Number,
      department: String,
      graduationYear: Number,
      meetsRequirements: Boolean,
    },
  },
  { timestamps: true }
);

// One application per user per job
applicationSchema.index({ applicant: 1, job: 1 }, { unique: true });
applicationSchema.index({ job: 1, status: 1 });
applicationSchema.index({ applicant: 1, status: 1 });
applicationSchema.index({ referredBy: 1 });

const Application = mongoose.model('Application', applicationSchema);
module.exports = Application;
