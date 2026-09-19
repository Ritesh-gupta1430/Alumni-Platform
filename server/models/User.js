const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    // === Core Identity ===
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    collegeEmail: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true,
    },
    passwordHash: { type: String, required: true },
    phone: { type: String, trim: true },
    dateOfBirth: { type: Date },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    },
    profilePhoto: { type: String }, // URL from storage service
    coverPhoto: { type: String },

    // === Role & Status ===
    role: {
      type: String,
      enum: [
        'STUDENT',
        'ALUMNI',
        'FACULTY',
        'PLACEMENT_OFFICER',
        'RECRUITER',
        'COMMUNITY_MANAGER',
        'ADMIN',
        'SUPER_ADMIN',
      ],
      required: true,
    },
    accountStatus: {
      type: String,
      enum: ['pending_email', 'pending_verification', 'active', 'suspended', 'deactivated'],
      default: 'pending_email',
    },

    // === Email Verification ===
    emailVerified: { type: Boolean, default: false },
    emailOTP: { type: String }, // hashed OTP
    emailOTPExpiry: { type: Date },
    emailOTPAttempts: { type: Number, default: 0 },

    // === Password Reset ===
    resetPasswordToken: { type: String },
    resetPasswordExpiry: { type: Date },
    resetPasswordAttempts: { type: Number, default: 0 },

    // === MFA ===
    mfaEnabled: { type: Boolean, default: false },
    mfaType: { type: String, enum: ['email_otp', 'totp'], default: 'email_otp' },
    totpSecret: { type: String }, // encrypted TOTP secret

    // === College Information ===
    department: { type: String, trim: true },
    course: { type: String, trim: true },
    admissionYear: { type: Number },
    graduationYear: { type: Number },
    currentYear: { type: Number }, // for students
    currentSemester: { type: Number },
    rollNumber: { type: String, trim: true },
    division: { type: String, trim: true },
    prnNumber: { type: String, trim: true },

    // === Verification ===
    verificationStatus: {
      type: String,
      enum: ['not_submitted', 'pending', 'under_review', 'approved', 'rejected', 'resubmission_required'],
      default: 'not_submitted',
    },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
    rejectionReason: { type: String },
    adminComment: { type: String },
    verificationBadge: {
      type: String,
      enum: ['none', 'verified_student', 'verified_alumni', 'verified_faculty', 'verified_recruiter'],
      default: 'none',
    },

    // === Refresh Tokens ===
    refreshTokens: [
      {
        token: { type: String },
        deviceInfo: { type: String },
        ipAddress: { type: String },
        createdAt: { type: Date, default: Date.now },
        expiresAt: { type: Date },
      },
    ],

    // === Notification Preferences ===
    notificationPrefs: {
      mentorship: { inApp: { type: Boolean, default: true }, email: { type: Boolean, default: true } },
      connections: { inApp: { type: Boolean, default: true }, email: { type: Boolean, default: false } },
      jobs: { inApp: { type: Boolean, default: true }, email: { type: Boolean, default: true } },
      events: { inApp: { type: Boolean, default: true }, email: { type: Boolean, default: true } },
      messages: { inApp: { type: Boolean, default: true }, email: { type: Boolean, default: false } },
      community: { inApp: { type: Boolean, default: true }, email: { type: Boolean, default: false } },
      donations: { inApp: { type: Boolean, default: true }, email: { type: Boolean, default: true } },
      announcements: { inApp: { type: Boolean, default: true }, email: { type: Boolean, default: true } },
    },

    // === Privacy Defaults ===
    messagingPrivacy: {
      type: String,
      enum: ['anyone_tcet', 'connections_only', 'mentors_only', 'nobody'],
      default: 'connections_only',
    },
    showOnAlumniMap: { type: Boolean, default: false },

    // === System ===
    lastLoginAt: { type: Date },
    lastActiveAt: { type: Date },
    suspendedAt: { type: Date },
    suspendedReason: { type: String },
    suspendedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deactivatedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.passwordHash;
        delete ret.emailOTP;
        delete ret.resetPasswordToken;
        delete ret.totpSecret;
        delete ret.refreshTokens;
        return ret;
      },
    },
  }
);

// Indexes
userSchema.index({ rollNumber: 1, department: 1 }, { sparse: true });
userSchema.index({ role: 1 });
userSchema.index({ department: 1 });
userSchema.index({ graduationYear: 1 });
userSchema.index({ verificationStatus: 1 });
userSchema.index({ accountStatus: 1 });
userSchema.index({ createdAt: -1 });

// Virtual: full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Methods
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.hasRole = function (...roles) {
  return roles.includes(this.role);
};

userSchema.methods.isActive = function () {
  return this.accountStatus === 'active';
};

userSchema.methods.isEmailVerified = function () {
  return this.emailVerified;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
