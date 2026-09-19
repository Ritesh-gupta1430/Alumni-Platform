const User = require('../models/User');
const VerificationRequest = require('../models/VerificationRequest');
const storageService = require('../services/storageService');
const emailService = require('../services/emailService');
const authService = require('../services/authService');
const notificationService = require('../services/notificationService');
const { AppError } = require('../middleware/errorHandler');

// POST /verification/submit
async function submitVerification(req, res, next) {
  try {
    const user = req.user;

    if (!user.emailVerified) {
      throw new AppError('Please verify your email before submitting documents.', 403, 'EMAIL_NOT_VERIFIED');
    }

    // Check for existing pending/under_review request
    const existing = await VerificationRequest.findOne({
      user: user._id,
      status: { $in: ['pending', 'under_review'] },
    });
    if (existing) {
      throw new AppError('You already have a verification request under review.', 409, 'DUPLICATE_REQUEST');
    }

    const { documentTypes } = req.body; // JSON array of document type labels
    const files = req.files || [];

    if (!files.length) {
      throw new AppError('At least one verification document is required.', 400, 'NO_DOCUMENTS');
    }

    const docTypeArray = typeof documentTypes === 'string'
      ? JSON.parse(documentTypes)
      : (documentTypes || []);

    // Get last submission number
    const lastRequest = await VerificationRequest.findOne({ user: user._id }).sort({ submissionNumber: -1 });
    const submissionNumber = lastRequest ? lastRequest.submissionNumber + 1 : 1;

    // Upload documents
    const uploadedDocs = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const docType = docTypeArray[i] || 'other';

      const uploaded = await storageService.uploadFile(file, {
        folder: `verification/${user._id}`,
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      });

      uploadedDocs.push({
        type: docType,
        label: docType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        url: uploaded.url,
        filename: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        uploadedAt: new Date(),
      });
    }

    // Check for potential duplicates
    const duplicateFlags = [];
    if (user.rollNumber) {
      const dupRoll = await User.findOne({
        _id: { $ne: user._id },
        rollNumber: user.rollNumber,
        department: user.department,
      });
      if (dupRoll) {
        duplicateFlags.push({
          type: 'duplicate_roll_number',
          matchedUserId: dupRoll._id,
          details: `Roll number ${user.rollNumber} already exists for ${user.department}`,
        });
      }
    }

    const request = await VerificationRequest.create({
      user: user._id,
      submissionNumber,
      status: 'pending',
      submittedData: {
        firstName: user.firstName,
        lastName: user.lastName,
        department: user.department,
        course: user.course,
        admissionYear: user.admissionYear,
        graduationYear: user.graduationYear,
        rollNumber: user.rollNumber,
        prnNumber: user.prnNumber,
        collegeEmail: user.collegeEmail,
        role: user.role,
      },
      documents: uploadedDocs,
      duplicateFlags,
      history: [{ status: 'pending', changedAt: new Date(), note: 'Initial submission' }],
    });

    // Update user verification status
    await User.findByIdAndUpdate(user._id, { verificationStatus: 'pending' });

    await authService.createAuditLog({
      actor: user._id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'verification_submitted',
      targetType: 'VerificationRequest',
      targetId: request._id,
      targetDisplay: `Submission #${submissionNumber} by ${user.firstName} ${user.lastName}`,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'Verification documents submitted successfully. An admin will review your request shortly.',
      data: { requestId: request._id, submissionNumber, status: 'pending' },
    });
  } catch (err) {
    next(err);
  }
}

// GET /verification/status
async function getVerificationStatus(req, res, next) {
  try {
    const request = await VerificationRequest.findOne({ user: req.user._id })
      .sort({ submissionNumber: -1 })
      .populate('reviewedBy', 'firstName lastName');

    return res.json({
      success: true,
      data: {
        verificationStatus: req.user.verificationStatus,
        verificationBadge: req.user.verificationBadge,
        request: request || null,
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /admin/verifications  (Admin only)
async function listVerifications(req, res, next) {
  try {
    const {
      status = 'pending',
      page = 1,
      limit = 20,
      role,
      department,
      search,
    } = req.query;

    const filter = {};
    if (status !== 'all') filter.status = status;
    if (role) filter['submittedData.role'] = role;
    if (department) filter['submittedData.department'] = department;

    let requests = VerificationRequest.find(filter)
      .populate('user', 'firstName lastName email role department graduationYear rollNumber profilePhoto')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const [results, total] = await Promise.all([
      requests.exec(),
      VerificationRequest.countDocuments(filter),
    ]);

    // Stats
    const stats = await VerificationRequest.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const statsMap = stats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {});

    return res.json({
      success: true,
      data: {
        requests: results,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        stats: statsMap,
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /admin/verifications/:id
async function getVerificationDetail(req, res, next) {
  try {
    const request = await VerificationRequest.findById(req.params.id)
      .populate('user', 'firstName lastName email phone role department course admissionYear graduationYear rollNumber prnNumber collegeEmail dateOfBirth gender profilePhoto')
      .populate('reviewedBy', 'firstName lastName email')
      .populate('history.changedBy', 'firstName lastName');

    if (!request) throw new AppError('Verification request not found.', 404, 'NOT_FOUND');

    return res.json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
}

// PATCH /admin/verifications/:id/approve
async function approveVerification(req, res, next) {
  try {
    const { adminNote } = req.body;
    const request = await VerificationRequest.findById(req.params.id).populate('user');
    if (!request) throw new AppError('Verification request not found.', 404, 'NOT_FOUND');
    if (request.status === 'approved') throw new AppError('Already approved.', 400, 'ALREADY_APPROVED');

    const badgeMap = {
      STUDENT: 'verified_student',
      ALUMNI: 'verified_alumni',
      FACULTY: 'verified_faculty',
      RECRUITER: 'verified_recruiter',
    };

    request.status = 'approved';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.adminNotes = adminNote;
    request.history.push({ status: 'approved', changedBy: req.user._id, changedAt: new Date(), note: adminNote });
    await request.save();

    const badge = badgeMap[request.user.role] || 'none';
    await User.findByIdAndUpdate(request.user._id, {
      verificationStatus: 'approved',
      verifiedBy: req.user._id,
      verifiedAt: new Date(),
      verificationBadge: badge,
      accountStatus: 'active',
    });

    // Notify user
    await notificationService.notifyVerificationUpdate(request.user._id, 'approved');
    await emailService.sendVerificationStatusEmail({
      to: request.user.email,
      name: request.user.firstName,
      status: 'approved',
    });

    await authService.createAuditLog({
      actor: req.user._id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'verification_approved',
      targetType: 'VerificationRequest',
      targetId: request._id,
      targetDisplay: `${request.user.firstName} ${request.user.lastName} (${request.user.email})`,
      metadata: { submissionNumber: request.submissionNumber, badge },
      ipAddress: req.ip,
      severity: 'high',
    });

    return res.json({ success: true, message: 'Verification approved. User account is now active.' });
  } catch (err) {
    next(err);
  }
}

// PATCH /admin/verifications/:id/reject
async function rejectVerification(req, res, next) {
  try {
    const { reason } = req.body;
    if (!reason) throw new AppError('Rejection reason is required.', 400, 'REASON_REQUIRED');

    const request = await VerificationRequest.findById(req.params.id).populate('user');
    if (!request) throw new AppError('Verification request not found.', 404, 'NOT_FOUND');

    request.status = 'rejected';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.rejectionReason = reason;
    request.history.push({ status: 'rejected', changedBy: req.user._id, changedAt: new Date(), note: reason });
    await request.save();

    await User.findByIdAndUpdate(request.user._id, {
      verificationStatus: 'rejected',
      rejectionReason: reason,
    });

    await notificationService.notifyVerificationUpdate(request.user._id, 'rejected', reason);
    await emailService.sendVerificationStatusEmail({
      to: request.user.email,
      name: request.user.firstName,
      status: 'rejected',
      reason,
    });

    await authService.createAuditLog({
      actor: req.user._id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'verification_rejected',
      targetType: 'VerificationRequest',
      targetId: request._id,
      targetDisplay: `${request.user.firstName} ${request.user.lastName}`,
      metadata: { reason },
      ipAddress: req.ip,
      severity: 'high',
    });

    return res.json({ success: true, message: 'Verification rejected.' });
  } catch (err) {
    next(err);
  }
}

// PATCH /admin/verifications/:id/request-correction
async function requestCorrection(req, res, next) {
  try {
    const { correctionRequest } = req.body;
    if (!correctionRequest) throw new AppError('Correction request details are required.', 400, 'DETAILS_REQUIRED');

    const request = await VerificationRequest.findById(req.params.id).populate('user');
    if (!request) throw new AppError('Verification request not found.', 404, 'NOT_FOUND');

    request.status = 'resubmission_required';
    request.correctionRequest = correctionRequest;
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.history.push({ status: 'resubmission_required', changedBy: req.user._id, changedAt: new Date(), note: correctionRequest });
    await request.save();

    await User.findByIdAndUpdate(request.user._id, { verificationStatus: 'resubmission_required' });

    await notificationService.notifyVerificationUpdate(request.user._id, 'resubmission_required', correctionRequest);
    await emailService.sendVerificationStatusEmail({
      to: request.user.email,
      name: request.user.firstName,
      status: 'resubmission_required',
      reason: correctionRequest,
    });

    await authService.createAuditLog({
      actor: req.user._id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'verification_correction_requested',
      targetType: 'VerificationRequest',
      targetId: request._id,
      targetDisplay: `${request.user.firstName} ${request.user.lastName}`,
      metadata: { correctionRequest },
      ipAddress: req.ip,
    });

    return res.json({ success: true, message: 'Correction requested. User has been notified.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  submitVerification,
  getVerificationStatus,
  listVerifications,
  getVerificationDetail,
  approveVerification,
  rejectVerification,
  requestCorrection,
};
