const mongoose = require('mongoose');

const donationCampaignSchema = new mongoose.Schema(
  {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    description: { type: String, required: true },
    shortDescription: { type: String, maxlength: 300 },
    category: {
      type: String,
      enum: [
        'scholarship', 'student_support', 'lab_development', 'infrastructure',
        'research', 'emergency_assistance', 'education', 'technology', 'alumni_initiative', 'other'
      ],
      required: true,
    },
    coverImage: { type: String },
    images: [{ type: String }],
    goalAmount: { type: Number, required: true },
    raisedAmount: { type: Number, default: 0 },
    contributorCount: { type: Number, default: 0 },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    beneficiary: { type: String }, // who benefits
    purpose: { type: String },
    status: {
      type: String,
      enum: ['draft', 'pending_approval', 'approved', 'rejected', 'active', 'paused', 'completed', 'closed', 'archived'],
      default: 'draft',
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectionReason: { type: String },
    publishedAt: { type: Date },

    // Transparency
    updates: [
      {
        title: String,
        content: String,
        images: [String],
        publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        publishedAt: { type: Date, default: Date.now },
        impactData: mongoose.Schema.Types.Mixed,
      },
    ],
    transparencyReport: { type: String },
    fundUtilizationBreakdown: [{ label: String, amount: Number, description: String }],

    // Settings
    allowAnonymous: { type: Boolean, default: true },
    showContributorList: { type: Boolean, default: true },
    featuredOrder: { type: Number }, // admin-set
  },
  { timestamps: true }
);

donationCampaignSchema.index({ status: 1, endDate: 1 });
donationCampaignSchema.index({ category: 1 });
donationCampaignSchema.index({ slug: 1 });
donationCampaignSchema.index({ featuredOrder: 1 });

const DonationCampaign = mongoose.model('DonationCampaign', donationCampaignSchema);

// ===== Donation (individual contribution) =====
const donationSchema = new mongoose.Schema(
  {
    campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'DonationCampaign', required: true },
    donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isAnonymous: { type: Boolean, default: false },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    donationId: { type: String, unique: true }, // ALM-DON-XXXXXX
    status: {
      type: String,
      enum: ['initiated', 'pending', 'success', 'failed', 'refunded', 'cancelled'],
      default: 'initiated',
    },
    paymentProvider: { type: String, enum: ['mock', 'razorpay', 'stripe'], default: 'mock' },
    paymentReference: { type: String }, // provider's transaction ID
    paymentOrderId: { type: String }, // Razorpay order ID
    paymentSignature: { type: String }, // Razorpay signature (for verification)
    failureReason: { type: String },
    receiptGenerated: { type: Boolean, default: false },
    receiptUrl: { type: String },
    receiptNumber: { type: String }, // ALM-RCP-XXXXXX
    emailReceiptSent: { type: Boolean, default: false },
    notes: { type: String }, // donor's optional note
    completedAt: { type: Date },
    refundedAt: { type: Date },
    refundReason: { type: String },
  },
  { timestamps: true }
);

donationSchema.index({ campaign: 1, status: 1 });
donationSchema.index({ donor: 1, createdAt: -1 });
donationSchema.index({ donationId: 1 });
donationSchema.index({ status: 1 });
donationSchema.index({ createdAt: -1 });

const Donation = mongoose.model('Donation', donationSchema);

module.exports = { DonationCampaign, Donation };
