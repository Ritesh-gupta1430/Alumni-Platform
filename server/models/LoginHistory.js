const mongoose = require('mongoose');

const loginHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    deviceType: { type: String, enum: ['desktop', 'mobile', 'tablet', 'unknown'], default: 'unknown' },
    browser: { type: String },
    os: { type: String },
    country: { type: String },
    city: { type: String },
    status: { type: String, enum: ['success', 'failed', 'blocked'], default: 'success' },
    failureReason: { type: String },
    sessionId: { type: String }, // links to the refresh token
  },
  { timestamps: true }
);

loginHistorySchema.index({ user: 1, createdAt: -1 });

const LoginHistory = mongoose.model('LoginHistory', loginHistorySchema);
module.exports = LoginHistory;
