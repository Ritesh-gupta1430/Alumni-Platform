const { verifyAccessToken } = require('../services/authService');
const User = require('../models/User');

/**
 * Attaches req.user from the JWT access token in the Authorization header.
 * Returns 401 if token is missing or invalid.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required.', code: 'UNAUTHENTICATED' });
    }

    const token = authHeader.slice(7);
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.userId).select('-passwordHash -emailOTP -resetPasswordToken -totpSecret -refreshTokens');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.', code: 'USER_NOT_FOUND' });
    }

    if (user.accountStatus === 'suspended') {
      return res.status(403).json({ success: false, message: 'Your account has been suspended.', code: 'ACCOUNT_SUSPENDED' });
    }

    if (user.accountStatus === 'deactivated') {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated.', code: 'ACCOUNT_DEACTIVATED' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Invalid authentication token.', code: 'INVALID_TOKEN' });
  }
}

/**
 * Requires email verification.
 */
function requireEmailVerified(req, res, next) {
  if (!req.user?.emailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email address first.',
      code: 'EMAIL_NOT_VERIFIED',
    });
  }
  next();
}

/**
 * Requires account to be active (verified by admin).
 */
function requireActiveAccount(req, res, next) {
  if (req.user?.accountStatus !== 'active') {
    return res.status(403).json({
      success: false,
      message: 'Your account is pending verification. Please wait for admin approval.',
      code: 'ACCOUNT_NOT_ACTIVE',
      accountStatus: req.user?.accountStatus,
    });
  }
  next();
}

/**
 * Role-based access control.
 * Usage: authorize('ADMIN', 'SUPER_ADMIN')
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.', code: 'UNAUTHENTICATED' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action.',
        code: 'FORBIDDEN',
        required: roles,
        current: req.user.role,
      });
    }
    next();
  };
}

/**
 * Optional authentication — attaches req.user if token valid, doesn't fail if not.
 */
async function optionalAuthenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId).select('-passwordHash -emailOTP -resetPasswordToken -totpSecret -refreshTokens');
      if (user && user.accountStatus !== 'suspended') {
        req.user = user;
      }
    }
  } catch {
    // silently ignore
  }
  next();
}

module.exports = {
  authenticate,
  requireEmailVerified,
  requireActiveAccount,
  authorize,
  optionalAuthenticate,
};
