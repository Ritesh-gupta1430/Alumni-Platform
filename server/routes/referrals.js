const express = require('express');
const router = express.Router();
const ReferralPost = require('../models/ReferralPost');
const { authenticate, requireActiveAccount } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const notificationService = require('../services/notificationService');

// GET /api/referrals
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { company, experienceLevel, jobType, status, q, view, page = 1, limit = 15 } = req.query;
    const filter = {};

    if (company) filter.companyName = new RegExp(company, 'i');
    if (experienceLevel) filter.experienceLevel = experienceLevel;
    if (jobType) filter.jobType = jobType;
    if (status) filter.status = status;

    if (q) {
      filter.$or = [
        { jobTitle: { $regex: q, $options: 'i' } },
        { companyName: { $regex: q, $options: 'i' } },
        { requiredSkills: { $regex: q, $options: 'i' } },
        { jobLocation: { $regex: q, $options: 'i' } },
      ];
    }

    if (view === 'created') {
      filter.alumnus = req.user._id;
    } else if (view === 'applied') {
      filter['applicants.user'] = req.user._id;
    }

    const [posts, total] = await Promise.all([
      ReferralPost.find(filter)
        .populate('alumnus', 'firstName lastName profilePhoto role department graduationYear currentCompany currentRole')
        .populate('applicants.user', 'firstName lastName profilePhoto role department graduationYear')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      ReferralPost.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        posts,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/referrals/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const post = await ReferralPost.findById(req.params.id)
      .populate('alumnus', 'firstName lastName profilePhoto role department graduationYear currentCompany currentRole email')
      .populate('applicants.user', 'firstName lastName profilePhoto role department graduationYear headline skills resumeUrl');

    if (!post) throw new AppError('Referral post not found.', 404);

    ReferralPost.findByIdAndUpdate(req.params.id, { $inc: { viewsCount: 1 } }).exec();

    return res.json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
});

// POST /api/referrals
router.post('/', authenticate, requireActiveAccount, async (req, res, next) => {
  try {
    const {
      companyName,
      companyLogo,
      jobTitle,
      jobReqId,
      jobUrl,
      jobLocation,
      jobType,
      experienceLevel,
      salaryRange,
      totalSlots,
      deadline,
      prerequisites,
      requiredSkills,
      description,
      alumnusNote,
    } = req.body;

    if (!companyName || !jobTitle || !jobLocation) {
      throw new AppError('Company name, job title, and location are required.', 400);
    }

    const post = await ReferralPost.create({
      alumnus: req.user._id,
      companyName,
      companyLogo,
      jobTitle,
      jobReqId,
      jobUrl,
      jobLocation,
      jobType: jobType || 'full_time',
      experienceLevel: experienceLevel || 'entry_level',
      salaryRange,
      totalSlots: parseInt(totalSlots) || 3,
      deadline: deadline ? new Date(deadline) : undefined,
      prerequisites: Array.isArray(prerequisites) ? prerequisites : [],
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
      description,
      alumnusNote,
    });

    const populated = await ReferralPost.findById(post._id).populate(
      'alumnus',
      'firstName lastName profilePhoto role department graduationYear currentCompany currentRole'
    );

    return res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
});

// PUT /api/referrals/:id
router.put('/:id', authenticate, requireActiveAccount, async (req, res, next) => {
  try {
    const post = await ReferralPost.findById(req.params.id);
    if (!post) throw new AppError('Referral post not found.', 404);

    const isOwner = post.alumnus.toString() === req.user._id.toString();
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      throw new AppError('Unauthorized.', 403);
    }

    const updated = await ReferralPost.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('alumnus', 'firstName lastName profilePhoto role department graduationYear currentCompany currentRole')
      .populate('applicants.user', 'firstName lastName profilePhoto role department graduationYear headline skills resumeUrl');

    return res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/referrals/:id/apply
router.post('/:id/apply', authenticate, requireActiveAccount, async (req, res, next) => {
  try {
    const { pitch, resumeUrl, githubUrl, portfolioUrl, leetcodeProfile, atsScore } = req.body;
    if (!pitch) {
      throw new AppError('Please provide a short referral pitch highlighting your qualification.', 400);
    }

    const post = await ReferralPost.findById(req.params.id);
    if (!post) throw new AppError('Referral post not found.', 404);

    if (post.alumnus.toString() === req.user._id.toString()) {
      throw new AppError('You cannot request a referral for your own posting.', 400);
    }

    if (post.status !== 'open') {
      throw new AppError('This referral posting is currently closed.', 400);
    }

    if (post.filledSlots >= post.totalSlots) {
      throw new AppError('All referral slots for this role have been filled.', 400);
    }

    const alreadyApplied = post.applicants.some(
      (a) => a.user.toString() === req.user._id.toString() && a.status !== 'rejected'
    );

    if (alreadyApplied) {
      throw new AppError('You have already submitted a referral request for this position.', 400);
    }

    post.applicants.push({
      user: req.user._id,
      pitch,
      resumeUrl: resumeUrl || req.user.resumeUrl,
      githubUrl,
      portfolioUrl,
      leetcodeProfile,
      atsScore: atsScore || 85,
      status: 'submitted',
    });

    await post.save();

    // Notify alumnus
    await notificationService.createNotification({
      recipient: post.alumnus,
      sender: req.user._id,
      type: 'referral_application',
      priority: 'high',
      title: '🎯 New Employee Referral Request',
      message: `${req.user.firstName} ${req.user.lastName} submitted a verified referral package for "${post.jobTitle}" at ${post.companyName}.`,
      link: `/referrals?post=${post._id}`,
    });

    return res.json({ success: true, message: 'Referral package submitted to alumnus!', data: post });
  } catch (err) {
    next(err);
  }
});

// PUT /api/referrals/:id/applicants/:applicantId
router.put('/:id/applicants/:applicantId', authenticate, requireActiveAccount, async (req, res, next) => {
  try {
    const { status, alumnusFeedback, internalReferralId } = req.body;
    const allowed = ['submitted', 'under_review', 'referral_submitted', 'rejected', 'interview_scheduled', 'hired'];
    if (!allowed.includes(status)) {
      throw new AppError('Invalid status.', 400);
    }

    const post = await ReferralPost.findById(req.params.id);
    if (!post) throw new AppError('Referral post not found.', 404);

    const isOwner = post.alumnus.toString() === req.user._id.toString();
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);
    if (!isOwner && !isAdmin) {
      throw new AppError('Unauthorized.', 403);
    }

    const applicant = post.applicants.id(req.params.applicantId);
    if (!applicant) throw new AppError('Applicant record not found.', 404);

    const prevStatus = applicant.status;
    applicant.status = status;
    applicant.reviewedAt = new Date();
    if (alumnusFeedback) applicant.alumnusFeedback = alumnusFeedback;
    if (internalReferralId) applicant.internalReferralId = internalReferralId;

    // If marked as referral_submitted or hired, update filledSlots count
    if (status === 'referral_submitted' && prevStatus !== 'referral_submitted') {
      post.filledSlots = (post.filledSlots || 0) + 1;
      if (post.filledSlots >= post.totalSlots) {
        post.status = 'closed';
      }
    }

    await post.save();

    // Send notification to student
    let notifTitle = 'Referral Status Update';
    let notifMsg = `Your referral request for "${post.jobTitle}" at ${post.companyName} was updated to ${status}.`;

    if (status === 'referral_submitted') {
      notifTitle = '🎉 Employee Referral Successfully Submitted!';
      notifMsg = `Great news! ${req.user.firstName} has submitted your employee referral for "${post.jobTitle}" at ${post.companyName}.${internalReferralId ? ` (Ref ID: ${internalReferralId})` : ''}`;
    }

    await notificationService.createNotification({
      recipient: applicant.user,
      sender: req.user._id,
      type: 'referral_status_update',
      priority: status === 'referral_submitted' ? 'high' : 'medium',
      title: notifTitle,
      message: notifMsg,
      link: `/referrals?post=${post._id}`,
    });

    const updated = await ReferralPost.findById(req.params.id)
      .populate('alumnus', 'firstName lastName profilePhoto role department graduationYear currentCompany currentRole')
      .populate('applicants.user', 'firstName lastName profilePhoto role department graduationYear headline skills resumeUrl');

    return res.json({ success: true, message: `Candidate marked as ${status}.`, data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/referrals/:id
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const post = await ReferralPost.findById(req.params.id);
    if (!post) throw new AppError('Referral post not found.', 404);

    const isOwner = post.alumnus.toString() === req.user._id.toString();
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      throw new AppError('Forbidden.', 403);
    }

    await ReferralPost.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Referral posting deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
