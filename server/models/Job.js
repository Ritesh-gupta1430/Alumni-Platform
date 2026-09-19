const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    companyName: { type: String, required: true, trim: true }, // denormalized
    companyLogo: { type: String },
    type: { type: String, enum: ['job', 'internship'], required: true },

    // Core Info
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    responsibilities: [{ type: String }],
    location: { type: String, trim: true },
    workMode: { type: String, enum: ['remote', 'hybrid', 'onsite'], default: 'onsite' },

    // Compensation
    ctcMin: { type: Number }, // for jobs (LPA)
    ctcMax: { type: Number },
    ctcDisplayText: { type: String }, // e.g., "8-12 LPA" or "Not Disclosed"
    stipendMin: { type: Number }, // for internships (monthly)
    stipendMax: { type: Number },
    stipendDisplayText: { type: String },
    duration: { type: String }, // for internships: "3 months", "6 months"

    // Eligibility
    requiredSkills: [{ type: String }],
    preferredSkills: [{ type: String }],
    minCGPA: { type: Number },
    eligibleDepartments: [{ type: String }],
    eligibleGraduationYears: [{ type: Number }],
    eligibleYears: [{ type: Number }], // for internships: [2, 3, 4]
    experienceRequired: { type: String },
    openings: { type: Number, default: 1 },

    // Dates
    applicationDeadline: { type: Date },
    startDate: { type: Date },

    // Status
    status: {
      type: String,
      enum: ['draft', 'pending_approval', 'approved', 'rejected', 'active', 'closed', 'filled'],
      default: 'draft',
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectionReason: { type: String },

    // Analytics
    viewCount: { type: Number, default: 0 },
    applicationCount: { type: Number, default: 0 },

    // Category
    jobCategory: { type: String },
    jobFunction: { type: String },
    industry: { type: String },

    // Application method
    applicationMethod: { type: String, enum: ['platform', 'external', 'email'], default: 'platform' },
    externalUrl: { type: String },
    applicationEmail: { type: String },

    tags: [{ type: String }],
    isReferralOnly: { type: Boolean, default: false },
    postedViaReferral: { type: Boolean, default: false },
  },
  { timestamps: true }
);

jobSchema.index({ type: 1, status: 1 });
jobSchema.index({ requiredSkills: 1 });
jobSchema.index({ eligibleDepartments: 1 });
jobSchema.index({ eligibleGraduationYears: 1 });
jobSchema.index({ applicationDeadline: 1 });
jobSchema.index({ postedBy: 1 });
jobSchema.index({ company: 1 });
jobSchema.index({ createdAt: -1 });

const Job = mongoose.model('Job', jobSchema);
module.exports = Job;
