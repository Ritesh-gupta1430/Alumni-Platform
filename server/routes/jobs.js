const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Application = require('../models/Application');
const { authenticate, requireActiveAccount, authorize } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const notificationService = require('../services/notificationService');
const Profile = require('../models/Profile');

// GET /jobs — list jobs
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { type = 'job', skills, department, location, workMode, page = 1, limit = 12, q } = req.query;
    const filter = { type, status: 'active' };

    if (skills) filter.requiredSkills = { $in: skills.split(',').map((s) => s.trim()) };
    if (department) filter.eligibleDepartments = { $in: [department] };
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (workMode) filter.workMode = workMode;
    if (q) filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { companyName: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
    ];

    const [jobs, total] = await Promise.all([
      Job.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit)),
      Job.countDocuments(filter),
    ]);

    return res.json({ success: true, data: { jobs, total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

// GET /jobs/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate('postedBy', 'firstName lastName profilePhoto role');
    if (!job) throw new AppError('Job not found.', 404);

    // Check if user has already applied
    const application = req.user
      ? await Application.findOne({ applicant: req.user._id, job: job._id }).select('status _id')
      : null;

    // Increment view count
    Job.findByIdAndUpdate(job._id, { $inc: { viewCount: 1 } }).exec();

    return res.json({ success: true, data: { job, application } });
  } catch (err) { next(err); }
});

// POST /jobs — create job (recruiter/alumni/placement officer)
router.post('/', authenticate, authorize('RECRUITER', 'ALUMNI', 'PLACEMENT_OFFICER', 'ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const canPublishDirectly = ['ADMIN', 'SUPER_ADMIN', 'PLACEMENT_OFFICER'].includes(req.user.role);
    const status = canPublishDirectly ? 'active' : 'pending_approval';

    const job = await Job.create({
      ...req.body,
      postedBy: req.user._id,
      status,
    });

    return res.status(201).json({
      success: true,
      message: canPublishDirectly ? 'Job posted successfully.' : 'Job submitted for approval.',
      data: job,
    });
  } catch (err) { next(err); }
});

// POST /jobs/:id/apply
router.post('/:id/apply', authenticate, requireActiveAccount, async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job || job.status !== 'active') throw new AppError('Job not available.', 404);

    // Check deadline
    if (job.applicationDeadline && new Date() > job.applicationDeadline) {
      throw new AppError('Application deadline has passed.', 400, 'DEADLINE_PASSED');
    }

    // Check eligibility
    const userProfile = await Profile.findOne({ user: req.user._id });
    const eligibility = checkEligibility(req.user, userProfile, job);

    if (!eligibility.eligible && eligibility.hardBlock) {
      throw new AppError(`You are not eligible: ${eligibility.reason}`, 400, 'NOT_ELIGIBLE');
    }

    const existing = await Application.findOne({ applicant: req.user._id, job: job._id });
    if (existing) throw new AppError('You have already applied for this position.', 409, 'ALREADY_APPLIED');

    const application = await Application.create({
      applicant: req.user._id,
      job: job._id,
      referredBy: req.body.referredBy,
      coverLetter: req.body.coverLetter,
      eligibilitySnapshot: {
        department: req.user.department,
        graduationYear: req.user.graduationYear,
        meetsRequirements: eligibility.eligible,
      },
      statusHistory: [{ status: 'applied', changedAt: new Date(), note: 'Application submitted' }],
    });

    // Increment application count
    Job.findByIdAndUpdate(job._id, { $inc: { applicationCount: 1 } }).exec();

    return res.status(201).json({ success: true, message: 'Application submitted.', data: application });
  } catch (err) { next(err); }
});

function checkEligibility(user, profile, job) {
  if (job.eligibleDepartments?.length > 0 && !job.eligibleDepartments.includes(user.department)) {
    return { eligible: false, hardBlock: false, reason: `Your department (${user.department}) may not be eligible.` };
  }
  if (job.eligibleGraduationYears?.length > 0 && !job.eligibleGraduationYears.includes(user.graduationYear)) {
    return { eligible: false, hardBlock: false, reason: 'Your graduation year may not be eligible.' };
  }
  return { eligible: true };
}

// PATCH /jobs/:id/status — admin approval
router.patch('/:id/status', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'PLACEMENT_OFFICER'), async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status, rejectionReason, approvedBy: req.user._id, approvedAt: new Date() },
      { new: true }
    );
    if (!job) throw new AppError('Job not found.', 404);
    return res.json({ success: true, message: 'Job status updated.', data: job });
  } catch (err) { next(err); }
});

module.exports = router;
