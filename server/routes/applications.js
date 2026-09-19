const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const { authenticate, authorize } = require('../middleware/auth');
const notificationService = require('../services/notificationService');
const Job = require('../models/Job');
const { AppError } = require('../middleware/errorHandler');

// GET /applications/mine
router.get('/mine', authenticate, async (req, res, next) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;
    const filter = { applicant: req.user._id };
    if (status) filter.status = status;

    const apps = await Application.find(filter)
      .populate({
        path: 'job',
        select: 'title companyName type location workMode applicationDeadline status',
        ...(type ? { match: { type } } : {}),
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Application.countDocuments(filter);
    return res.json({ success: true, data: { applications: apps.filter((a) => a.job), total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

// GET /applications/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const app = await Application.findById(req.params.id)
      .populate('applicant', 'firstName lastName email profilePhoto department graduationYear')
      .populate('job', 'title companyName type location')
      .populate('referredBy', 'firstName lastName');

    if (!app) throw new AppError('Application not found.', 404);

    // Ensure requester is the applicant or recruiter
    const isApplicant = app.applicant._id.toString() === req.user._id.toString();
    if (!isApplicant && !['ADMIN', 'SUPER_ADMIN', 'PLACEMENT_OFFICER', 'RECRUITER'].includes(req.user.role)) {
      throw new AppError('Forbidden.', 403);
    }

    return res.json({ success: true, data: app });
  } catch (err) { next(err); }
});

// GET /applications/job/:jobId — recruiter sees all applications for a job
router.get('/job/:jobId', authenticate, authorize('RECRUITER', 'ADMIN', 'SUPER_ADMIN', 'PLACEMENT_OFFICER'), async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { job: req.params.jobId };
    if (status) filter.status = status;

    const [apps, total] = await Promise.all([
      Application.find(filter)
        .populate('applicant', 'firstName lastName email profilePhoto department graduationYear rollNumber')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Application.countDocuments(filter),
    ]);

    return res.json({ success: true, data: { applications: apps, total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

// PATCH /applications/:id/status
router.patch('/:id/status', authenticate, authorize('RECRUITER', 'ADMIN', 'SUPER_ADMIN', 'PLACEMENT_OFFICER'), async (req, res, next) => {
  try {
    const { status, note, interviewDate, interviewMode, interviewLink, offerAmount } = req.body;

    const app = await Application.findById(req.params.id).populate('job', 'title companyName');
    if (!app) throw new AppError('Application not found.', 404);

    const prevStatus = app.status;
    app.status = status;
    if (note) app.recruiterNotes = note;
    if (interviewDate) app.interviewDate = interviewDate;
    if (interviewMode) app.interviewMode = interviewMode;
    if (interviewLink) app.interviewLink = interviewLink;
    if (offerAmount) app.offerAmount = offerAmount;

    app.statusHistory.push({ status, changedBy: req.user._id, changedAt: new Date(), note });
    await app.save();

    await notificationService.notifyApplicationStatusChange(app.applicant, app.job, status);

    return res.json({ success: true, message: 'Application status updated.', data: app });
  } catch (err) { next(err); }
});

// DELETE /applications/:id — withdraw
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const app = await Application.findOne({ _id: req.params.id, applicant: req.user._id, status: 'applied' });
    if (!app) throw new AppError('Application not found or cannot be withdrawn.', 404);
    app.status = 'withdrawn';
    app.statusHistory.push({ status: 'withdrawn', changedAt: new Date(), note: 'Withdrawn by applicant' });
    await app.save();
    return res.json({ success: true, message: 'Application withdrawn.' });
  } catch (err) { next(err); }
});

module.exports = router;
