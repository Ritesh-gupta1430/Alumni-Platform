const User = require('../models/User');
const Profile = require('../models/Profile');
const authService = require('../services/authService');
const emailService = require('../services/emailService');
const { AppError } = require('../middleware/errorHandler');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

// POST /auth/register
async function register(req, res, next) {
  try {
    const {
      firstName, lastName, email, password, phone, role,
      department, course, admissionYear, graduationYear,
      currentYear, currentSemester, rollNumber, division, prnNumber,
      collegeEmail, dateOfBirth, gender,
    } = req.body;

    if (!firstName || !lastName || !email || !password) {
      throw new AppError('First name, last name, email, and password are required.', 400, 'MISSING_FIELDS');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedCollegeEmail = collegeEmail ? collegeEmail.toLowerCase().trim() : undefined;

    // Check email uniqueness
    const existing = await User.findOne({
      $or: [
        { email: normalizedEmail },
        ...(normalizedCollegeEmail ? [{ collegeEmail: normalizedCollegeEmail }] : []),
      ],
    });

    const isDev = process.env.NODE_ENV === 'development';
    const otp = authService.generateOTP(6);
    const otpExpiry = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 10) * 60 * 1000);
    const [passwordHash, otpHash] = await Promise.all([
      authService.hashPassword(password),
      authService.hashOTP(otp),
    ]);

    // If an existing user was never verified and stuck in pending_email, update their record & resend OTP
    if (existing) {
      if (existing.email === normalizedEmail && !existing.emailVerified && existing.accountStatus === 'pending_email') {
        existing.firstName = firstName.trim();
        existing.lastName = lastName.trim();
        existing.passwordHash = passwordHash;
        existing.phone = phone || existing.phone;
        existing.role = role || existing.role || 'STUDENT';
        existing.department = department || existing.department;
        existing.course = course || existing.course;
        existing.admissionYear = admissionYear || existing.admissionYear;
        existing.graduationYear = graduationYear || existing.graduationYear;
        existing.currentYear = currentYear || existing.currentYear;
        existing.currentSemester = currentSemester || existing.currentSemester;
        existing.rollNumber = rollNumber || existing.rollNumber;
        existing.division = division || existing.division;
        existing.prnNumber = prnNumber || existing.prnNumber;
        existing.collegeEmail = normalizedCollegeEmail || existing.collegeEmail;
        existing.dateOfBirth = dateOfBirth || existing.dateOfBirth;
        existing.gender = gender || existing.gender;
        existing.emailOTP = otpHash;
        existing.emailOTPExpiry = otpExpiry;
        existing.emailOTPAttempts = 0;
        await existing.save();

        // Send OTP email in background
        emailService.sendOTPEmail({
          to: existing.email,
          name: existing.firstName,
          otp,
          purpose: 'email_verification',
        }).catch((mailErr) => {
          console.error('⚠️ [Register] Async email delivery error:', mailErr.message);
        });

        return res.status(200).json({
          success: true,
          message: 'Account details updated. Please check your email for the new OTP.',
          data: {
            userId: existing._id,
            email: existing.email,
            firstName: existing.firstName,
            lastName: existing.lastName,
            role: existing.role,
            accountStatus: existing.accountStatus,
            devOtp: isDev ? otp : undefined,
          },
        });
      }

      if (existing.email === normalizedEmail) {
        throw new AppError('An account with this email already exists. Please sign in.', 409, 'DUPLICATE_EMAIL');
      }
      if (normalizedCollegeEmail && existing.collegeEmail === normalizedCollegeEmail) {
        throw new AppError('An account with this college email already exists.', 409, 'DUPLICATE_COLLEGE_EMAIL');
      }
    }

    // Validate alumni graduation year
    const currentYearVal = new Date().getFullYear();
    if (role === 'ALUMNI' && graduationYear && Number(graduationYear) > currentYearVal) {
      throw new AppError(`Alumni graduation year cannot exceed current year (${currentYearVal}).`, 400, 'INVALID_GRADUATION_YEAR');
    }

    // Check roll number uniqueness for students
    if (rollNumber && (role === 'STUDENT' || role === 'ALUMNI')) {
      const dupRoll = await User.findOne({ rollNumber, department });
      if (dupRoll) throw new AppError('This roll number is already registered for the given department.', 409, 'DUPLICATE_ROLL');
    }

    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      collegeEmail: normalizedCollegeEmail,
      passwordHash,
      phone,
      role: role || 'STUDENT',
      department,
      course,
      admissionYear,
      graduationYear,
      currentYear,
      currentSemester,
      rollNumber,
      division,
      prnNumber,
      dateOfBirth,
      gender,
      accountStatus: 'pending_email',
      emailVerified: false,
      emailOTP: otpHash,
      emailOTPExpiry: otpExpiry,
      emailOTPAttempts: 0,
    });

    // Create empty profile & audit log asynchronously without blocking response
    Promise.all([
      Profile.create({ user: user._id }),
      authService.createAuditLog({
        actor: user._id,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'user_registered',
        targetType: 'User',
        targetId: user._id,
        targetDisplay: `${user.firstName} ${user.lastName} (${user.email})`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        severity: 'low',
      }),
    ]).catch((bgErr) => {
      console.error('⚠️ [Register] Background task error:', bgErr.message);
    });

    // Send OTP email in background
    emailService.sendOTPEmail({
      to: user.email,
      name: user.firstName,
      otp,
      purpose: 'email_verification',
    }).catch((mailErr) => {
      console.error('⚠️ [Register] Async email delivery error:', mailErr.message);
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for the OTP.',
      data: {
        userId: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        accountStatus: user.accountStatus,
        devOtp: isDev ? otp : undefined,
      },
    });
  } catch (err) {
    next(err);
  }
}

// POST /auth/verify-email
async function verifyEmail(req, res, next) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      throw new AppError('Email and OTP verification code are required.', 400, 'INVALID_INPUT');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanOtp = String(otp).trim();

    const user = await User.findOne({ email: normalizedEmail }).select('+emailOTP +emailOTPExpiry +emailOTPAttempts +refreshTokens');
    if (!user) throw new AppError('No account found with this email.', 404, 'USER_NOT_FOUND');
    if (user.emailVerified) {
      // User is already verified, allow creating session or notify
      const { accessToken, refreshToken } = await authService.createSession(user._id, {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
      return res.json({
        success: true,
        message: 'Email is already verified.',
        data: {
          accessToken,
          user: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            accountStatus: user.accountStatus,
            verificationStatus: user.verificationStatus,
            verificationBadge: user.verificationBadge,
            profilePhoto: user.profilePhoto,
          },
        },
      });
    }

    const maxAttempts = parseInt(process.env.OTP_MAX_ATTEMPTS, 10) || 5;
    if (user.emailOTPAttempts >= maxAttempts) {
      throw new AppError('Too many failed attempts. Please request a new OTP.', 429, 'OTP_MAX_ATTEMPTS');
    }

    if (!user.emailOTP || !user.emailOTPExpiry || new Date() > user.emailOTPExpiry) {
      throw new AppError('OTP has expired. Please request a new one.', 410, 'OTP_EXPIRED');
    }

    const valid = await authService.compareOTP(cleanOtp, user.emailOTP);
    if (!valid) {
      user.emailOTPAttempts = (user.emailOTPAttempts || 0) + 1;
      await user.save();
      const remaining = maxAttempts - user.emailOTPAttempts;
      throw new AppError(
        `Invalid OTP. ${remaining > 0 ? `${remaining} attempt(s) remaining.` : 'No attempts remaining. Please request a new OTP.'}`,
        400, 'INVALID_OTP'
      );
    }

    user.emailVerified = true;
    user.emailOTP = undefined;
    user.emailOTPExpiry = undefined;
    user.emailOTPAttempts = 0;
    user.accountStatus = 'pending_verification';
    await user.save();

    await authService.createAuditLog({
      actor: user._id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'email_verified',
      targetType: 'User',
      targetId: user._id,
      targetDisplay: user.email,
      ipAddress: req.ip,
      severity: 'low',
    });

    // Create active session so user is immediately logged in
    const { accessToken, refreshToken } = await authService.createSession(user._id, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    return res.json({
      success: true,
      message: 'Email verified successfully! Welcome to AlumNetra.',
      data: {
        accessToken,
        accountStatus: user.accountStatus,
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          accountStatus: user.accountStatus,
          verificationStatus: user.verificationStatus,
          verificationBadge: user.verificationBadge,
          profilePhoto: user.profilePhoto,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

// POST /auth/resend-otp
async function resendOTP(req, res, next) {
  try {
    const { email, purpose = 'email_verification' } = req.body;
    if (!email) throw new AppError('Email is required.', 400, 'INVALID_INPUT');

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) throw new AppError('No account found with this email.', 404, 'USER_NOT_FOUND');
    if (purpose === 'email_verification' && user.emailVerified) {
      throw new AppError('Email is already verified. You can log in directly.', 400, 'ALREADY_VERIFIED');
    }

    const isDev = process.env.NODE_ENV === 'development';
    const otp = authService.generateOTP(6);
    const otpHash = await authService.hashOTP(otp);
    const otpExpiry = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 10) * 60 * 1000);

    user.emailOTP = otpHash;
    user.emailOTPExpiry = otpExpiry;
    user.emailOTPAttempts = 0;
    await user.save();

    // Send OTP email in background
    emailService.sendOTPEmail({
      to: user.email,
      name: user.firstName,
      otp,
      purpose,
    }).catch((mailErr) => {
      console.error('⚠️ [ResendOTP] Async email delivery error:', mailErr.message);
    });

    return res.json({
      success: true,
      message: 'A new OTP has been sent to your email.',
      data: {
        devOtp: isDev ? otp : undefined,
      },
    });
  } catch (err) {
    next(err);
  }
}

// POST /auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash +refreshTokens');
    if (!user) {
      await authService.recordLoginAttempt(null, { ipAddress: req.ip, userAgent: req.headers['user-agent'], status: 'failed', failureReason: 'user_not_found' });
      throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      await authService.recordLoginAttempt(user._id, { ipAddress: req.ip, userAgent: req.headers['user-agent'], status: 'failed', failureReason: 'wrong_password' });
      throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.emailVerified) {
      throw new AppError('Please verify your email address first.', 403, 'EMAIL_NOT_VERIFIED');
    }

    if (user.accountStatus === 'suspended') {
      throw new AppError('Your account has been suspended. Please contact support.', 403, 'ACCOUNT_SUSPENDED');
    }

    // Record successful login
    await authService.recordLoginAttempt(user._id, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success',
    });

    const { accessToken, refreshToken } = await authService.createSession(user._id, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    await authService.createAuditLog({
      actor: user._id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'user_logged_in',
      targetType: 'User',
      targetId: user._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      success: true,
      message: 'Login successful.',
      data: {
        accessToken,
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          accountStatus: user.accountStatus,
          verificationStatus: user.verificationStatus,
          verificationBadge: user.verificationBadge,
          profilePhoto: user.profilePhoto,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

// POST /auth/refresh
async function refreshToken(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) throw new AppError('No refresh token provided.', 401, 'NO_REFRESH_TOKEN');

    const { accessToken, refreshToken: newRefreshToken } = await authService.rotateRefreshToken(token, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);

    return res.json({ success: true, data: { accessToken } });
  } catch (err) {
    // Clear cookie on failure
    res.clearCookie('refreshToken');
    next(err);
  }
}

// POST /auth/logout
async function logout(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (token && req.user) {
      await authService.revokeToken(req.user._id, token);
    }

    res.clearCookie('refreshToken');

    if (req.user) {
      await authService.createAuditLog({
        actor: req.user._id,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        action: 'user_logged_out',
        targetType: 'User',
        targetId: req.user._id,
        ipAddress: req.ip,
      });
    }

    return res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
}

// POST /auth/logout-all
async function logoutAll(req, res, next) {
  try {
    const currentToken = req.cookies?.refreshToken;
    await authService.revokeAllTokens(req.user._id, null); // revoke all including current
    res.clearCookie('refreshToken');

    await authService.createAuditLog({
      actor: req.user._id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'session_revoked',
      targetType: 'User',
      targetId: req.user._id,
      metadata: { action: 'logout_all' },
      ipAddress: req.ip,
    });

    return res.json({ success: true, message: 'All sessions have been terminated.' });
  } catch (err) {
    next(err);
  }
}

// POST /auth/forgot-password
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    // Always respond with success to prevent email enumeration
    if (!user) {
      return res.json({ success: true, message: 'If an account exists, a reset OTP has been sent.' });
    }

    const otp = authService.generateOTP(6);
    const otpHash = await authService.hashOTP(otp);
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    user.emailOTP = otpHash;
    user.emailOTPExpiry = expiry;
    user.emailOTPAttempts = 0;
    await user.save();

    // Send OTP email in background
    emailService.sendOTPEmail({
      to: user.email,
      name: user.firstName,
      otp,
      purpose: 'password_reset',
    }).catch((emailErr) => {
      console.error('⚠️ [ForgotPassword] Async email delivery error:', emailErr.message);
    });

    return res.json({
      success: true,
      message: 'If an account exists, a reset OTP has been sent.',
    });
  } catch (err) {
    next(err);
  }
}

// POST /auth/reset-password
async function resetPassword(req, res, next) {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+emailOTP +emailOTPExpiry +emailOTPAttempts');
    if (!user) throw new AppError('Invalid request.', 400, 'INVALID_REQUEST');

    const maxAttempts = parseInt(process.env.OTP_MAX_ATTEMPTS, 10) || 5;
    if (user.emailOTPAttempts >= maxAttempts) {
      throw new AppError('Too many failed attempts. Please request a new OTP.', 429, 'OTP_MAX_ATTEMPTS');
    }

    if (!user.emailOTP || !user.emailOTPExpiry || new Date() > user.emailOTPExpiry) {
      throw new AppError('OTP has expired. Please request a new one.', 410, 'OTP_EXPIRED');
    }

    const valid = await authService.compareOTP(otp, user.emailOTP);
    if (!valid) {
      user.emailOTPAttempts += 1;
      await user.save();
      throw new AppError('Invalid OTP.', 400, 'INVALID_OTP');
    }

    const newHash = await authService.hashPassword(newPassword);
    user.passwordHash = newHash;
    user.emailOTP = undefined;
    user.emailOTPExpiry = undefined;
    user.emailOTPAttempts = 0;
    // Revoke all sessions on password reset
    user.refreshTokens = [];
    await user.save();

    res.clearCookie('refreshToken');

    await authService.createAuditLog({
      actor: user._id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'password_reset',
      targetType: 'User',
      targetId: user._id,
      ipAddress: req.ip,
      severity: 'medium',
    });

    return res.json({ success: true, message: 'Password reset successfully. Please log in again.' });
  } catch (err) {
    next(err);
  }
}

// GET /auth/me
async function getMe(req, res) {
  const profile = await Profile.findOne({ user: req.user._id });
  return res.json({
    success: true,
    data: {
      user: req.user,
      profile: profile || null,
    },
  });
}

module.exports = {
  register,
  verifyEmail,
  resendOTP,
  login,
  refreshToken,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
  getMe,
};
