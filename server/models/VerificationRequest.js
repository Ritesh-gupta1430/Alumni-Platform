const mongoose = require('mongoose');

const verificationRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    submissionNumber: { type: Number, default: 1 }, // increments on resubmission

    status: {
      type: String,
      enum: ['pending', 'under_review', 'approved', 'rejected', 'resubmission_required'],
      default: 'pending',
    },

    // Submitted Information Snapshot
    submittedData: {
      firstName: String,
      lastName: String,
      department: String,
      course: String,
      admissionYear: Number,
      graduationYear: Number,
      rollNumber: String,
      prnNumber: String,
      collegeEmail: String,
      role: String,
    },

    // Documents
    documents: [
      {
        type: {
          type: String,
          enum: [
            'college_id',
            'enrollment_proof',
            'bonafide',
            'marksheet',
            'degree_certificate',
            'passing_certificate',
            'other',
          ],
        },
        label: String,
        url: String,
        filename: String,
        mimeType: String,
        sizeBytes: Number,
        uploadedAt: { type: Date, default: Date.now },
        // OCR/AI analysis results
        ocrExtracted: { type: mongoose.Schema.Types.Mixed },
        aiFlags: [String], // e.g., ['name_mismatch', 'low_quality']
      },
    ],

    // Admin Review
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    rejectionReason: { type: String },
    correctionRequest: { type: String }, // what needs to be corrected
    adminNotes: { type: String },

    // Duplicate/Fraud Flags
    duplicateFlags: [
      {
        type: { type: String }, // e.g., 'duplicate_email', 'duplicate_roll_number'
        matchedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        details: String,
        flaggedAt: { type: Date, default: Date.now },
        resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        resolvedAt: Date,
        resolution: String,
      },
    ],

    // History (never delete previous states)
    history: [
      {
        status: String,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
        note: String,
      },
    ],
  },
  { timestamps: true }
);

verificationRequestSchema.index({ user: 1 });
verificationRequestSchema.index({ status: 1, createdAt: -1 });
verificationRequestSchema.index({ 'submittedData.rollNumber': 1, 'submittedData.department': 1 });

const VerificationRequest = mongoose.model('VerificationRequest', verificationRequestSchema);
module.exports = VerificationRequest;
