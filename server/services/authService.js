/**
 * Auth Service
 * Handles token generation, OTP, password hashing, session management
 */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const LoginHistory = require('../models/LoginHistory');
const AuditLog = require('../models/AuditLog');

const SALT_ROUNDS = 12;

// ===== Password =====

async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// ===== JWT =====

function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY || '7d',
  });
}

function generateRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY || '30d',
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

function decodeToken(token) {
  return jwt.decode(token);
}

// ===== OTP =====

function generateOTP(digits = 6) {
  return Array.from({ length: digits }, () => Math.floor(Math.random() * 10)).join('');
}

async function hashOTP(otp) {
  return bcrypt.hash(otp, 8);
}

async function compareOTP(otp, hash) {
  return bcrypt.compare(otp, hash);
}

function generateSecureToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

// ===== Session Management =====

async function createSession(userId, { ipAddress, userAgent, deviceInfo } = {}) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const payload = {
    userId: user._id,
    role: user.role,
    email: user.email,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken({ userId: user._id });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  // Store refresh token in user document
  user.refreshTokens.push({
    token: refreshToken,
    deviceInfo: deviceInfo || userAgent || 'Unknown',
    ipAddress: ipAddress || 'Unknown',
    createdAt: new Date(),
    expiresAt,
  });

  // Limit to 10 active sessions
  if (user.refreshTokens.length > 10) {
    user.refreshTokens = user.refreshTokens.slice(-10);
  }

  user.lastLoginAt = new Date();
  await user.save();

  return { accessToken, refreshToken, expiresAt };
}

async function rotateRefreshToken(oldToken, { ipAddress, userAgent } = {}) {
  let decoded;
  try {
    decoded = verifyRefreshToken(oldToken);
  } catch {
    throw new Error('Invalid or expired refresh token');
  }

  const user = await User.findById(decoded.userId);
  if (!user) throw new Error('User not found');

  const tokenIndex = user.refreshTokens.findIndex((t) => t.token === oldToken);
  if (tokenIndex === -1) {
    // Token not found — potential replay attack
    user.refreshTokens = [];
    await user.save();
    throw new Error('Refresh token not recognized. All sessions revoked.');
  }

  // Remove old token
  user.refreshTokens.splice(tokenIndex, 1);

  // Generate new tokens
  const payload = { userId: user._id, role: user.role, email: user.email };
  const newAccessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken({ userId: user._id });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  user.refreshTokens.push({
    token: newRefreshToken,
    deviceInfo: userAgent || 'Unknown',
    ipAddress: ipAddress || 'Unknown',
    createdAt: new Date(),
    expiresAt,
  });

  user.lastActiveAt = new Date();
  await user.save();

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

async function revokeToken(userId, token) {
  await User.findByIdAndUpdate(userId, {
    $pull: { refreshTokens: { token } },
  });
}

async function revokeAllTokens(userId, exceptToken = null) {
  const user = await User.findById(userId);
  if (!user) return;

  if (exceptToken) {
    user.refreshTokens = user.refreshTokens.filter((t) => t.token === exceptToken);
  } else {
    user.refreshTokens = [];
  }

  await user.save();
}

// ===== Login History =====

async function recordLoginAttempt(userId, { ipAddress, userAgent, status, failureReason } = {}) {
  const parsed = parseUserAgent(userAgent || '');

  await LoginHistory.create({
    user: userId,
    ipAddress,
    userAgent,
    deviceType: parsed.deviceType,
    browser: parsed.browser,
    os: parsed.os,
    status,
    failureReason,
  });
}

function parseUserAgent(ua) {
  const deviceType = /mobile/i.test(ua) ? 'mobile' : /tablet/i.test(ua) ? 'tablet' : 'desktop';
  const browser =
    /Chrome/i.test(ua) ? 'Chrome'
    : /Firefox/i.test(ua) ? 'Firefox'
    : /Safari/i.test(ua) ? 'Safari'
    : /Edge/i.test(ua) ? 'Edge'
    : 'Unknown';
  const os =
    /Windows/i.test(ua) ? 'Windows'
    : /Mac/i.test(ua) ? 'macOS'
    : /Linux/i.test(ua) ? 'Linux'
    : /Android/i.test(ua) ? 'Android'
    : /iPhone|iPad/i.test(ua) ? 'iOS'
    : 'Unknown';
  return { deviceType, browser, os };
}

// ===== Audit Logging =====

async function createAuditLog({
  actor,
  actorEmail,
  actorRole,
  action,
  targetType,
  targetId,
  targetDisplay,
  metadata,
  ipAddress,
  userAgent,
  severity = 'low',
}) {
  try {
    await AuditLog.create({
      actor,
      actorEmail,
      actorRole,
      action,
      targetType,
      targetId,
      targetDisplay,
      metadata,
      ipAddress,
      userAgent,
      severity,
    });
  } catch (err) {
    // Never let audit log failure break the main flow
    console.error('⚠️  Audit log write failed:', err.message);
  }
}

module.exports = {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  generateOTP,
  hashOTP,
  compareOTP,
  generateSecureToken,
  createSession,
  rotateRefreshToken,
  revokeToken,
  revokeAllTokens,
  recordLoginAttempt,
  createAuditLog,
};
