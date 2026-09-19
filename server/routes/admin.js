const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Profile = require('../models/Profile');
const VerificationRequest = require('../models/VerificationRequest');
const AuditLog = require('../models/AuditLog');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { DonationCampaign, Donation } = require('../models/Donation');
const { Community, Event } = require('../models/Community');
const { Mentorship } = require('../models/Mentorship');
const LoginHistory = require('../models/LoginHistory');
const { AppError } = require('../middleware/errorHandler');
const authService = require('../services/authService');

const adminOnly = [authorize('ADMIN', 'SUPER_ADMIN')];

// GET /admin/dashboard
router.get('/dashboard', authenticate, ...adminOnly, async (req, res, next) => {
  try {
    const [
      totalUsers, activeStudents, activeAlumni, activeFaculty, activeRecruiters,
      pendingVerifications, activeJobs, activeInternships, upcomingEvents,
      activeMentorships, activeCampaigns,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'STUDENT', accountStatus: 'active' }),
      User.countDocuments({ role: 'ALUMNI', accountStatus: 'active' }),
      User.countDocuments({ role: 'FACULTY', accountStatus: 'active' }),
      User.countDocuments({ role: 'RECRUITER', accountStatus: 'active' }),
      VerificationRequest.countDocuments({ status: { $in: ['pending', 'under_review'] } }),
      Job.countDocuments({ type: 'job', status: 'active' }),
      Job.countDocuments({ type: 'internship', status: 'active' }),
      Event.countDocuments({ status: 'active', startDate: { $gte: new Date() } }),
      Mentorship.countDocuments({ status: 'active' }),
      DonationCampaign.countDocuments({ status: 'active' }),
    ]);

    const donationStats = await Donation.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    const recentActivity = await AuditLog.find()
      .populate('actor', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('action actor targetDisplay createdAt severity');

    return res.json({
      success: true,
      data: {
        userStats: { total: totalUsers, students: activeStudents, alumni: activeAlumni, faculty: activeFaculty, recruiters: activeRecruiters },
        pendingVerifications,
        jobs: { active: activeJobs, internships: activeInternships },
        upcomingEvents,
        activeMentorships,
        activeCampaigns,
        donations: {
          totalRaised: donationStats[0]?.total || 0,
          totalCount: donationStats[0]?.count || 0,
        },
        recentActivity,
      },
    });
  } catch (err) { next(err); }
});

// GET /admin/users
router.get('/users', authenticate, ...adminOnly, async (req, res, next) => {
  try {
    const { role, status, department, page = 1, limit = 20, q } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.accountStatus = status;
    if (department) filter.department = department;
    if (q) filter.$or = [
      { firstName: { $regex: q, $options: 'i' } },
      { lastName: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
    ];

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('firstName lastName email role accountStatus verificationStatus verificationBadge department graduationYear createdAt lastLoginAt')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    return res.json({ success: true, data: { users, total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

// PATCH /admin/users/:id/status — suspend/activate
router.patch('/users/:id/status', authenticate, ...adminOnly, async (req, res, next) => {
  try {
    const { accountStatus, reason } = req.body;
    const allowed = ['active', 'suspended', 'deactivated'];
    if (!allowed.includes(accountStatus)) throw new AppError(`Status must be one of: ${allowed.join(', ')}`, 400);

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        accountStatus,
        ...(accountStatus === 'suspended' ? { suspendedAt: new Date(), suspendedReason: reason, suspendedBy: req.user._id } : {}),
        ...(accountStatus === 'active' ? { suspendedAt: undefined, suspendedReason: undefined } : {}),
      },
      { new: true }
    );

    if (!user) throw new AppError('User not found.', 404);

    await authService.createAuditLog({
      actor: req.user._id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: accountStatus === 'suspended' ? 'user_suspended' : 'user_activated',
      targetType: 'User',
      targetId: user._id,
      targetDisplay: `${user.firstName} ${user.lastName} (${user.email})`,
      metadata: { reason },
      ipAddress: req.ip,
      severity: 'high',
    });

    return res.json({ success: true, message: `User account ${accountStatus}.`, data: { _id: user._id, accountStatus } });
  } catch (err) { next(err); }
});

// GET /admin/analytics
router.get('/analytics', authenticate, ...adminOnly, async (req, res, next) => {
  try {
    const [
      usersByRole,
      usersByDepartment,
      registrationTrend,
      jobsByType,
      applicationsByStatus,
      topDepartments,
    ] = await Promise.all([
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      User.aggregate([
        { $match: { department: { $exists: true, $ne: null } } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      User.aggregate([
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 },
      ]),
      Job.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]),
      Application.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Application.aggregate([
        { $match: { status: { $in: ['selected'] } } },
        {
          $lookup: {
            from: 'users',
            localField: 'applicant',
            foreignField: '_id',
            as: 'applicantUser',
          },
        },
        { $unwind: '$applicantUser' },
        { $group: { _id: '$applicantUser.department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    return res.json({
      success: true,
      data: {
        usersByRole: usersByRole.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {}),
        usersByDepartment,
        registrationTrend: registrationTrend.reverse(),
        jobsByType: jobsByType.reduce((acc, j) => ({ ...acc, [j._id]: j.count }), {}),
        applicationsByStatus: applicationsByStatus.reduce((acc, a) => ({ ...acc, [a._id]: a.count }), {}),
        placementByDepartment: topDepartments,
      },
    });
  } catch (err) { next(err); }
});

// GET /admin/audit-logs
router.get('/audit-logs', authenticate, ...adminOnly, async (req, res, next) => {
  try {
    const { action, severity, page = 1, limit = 30 } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (severity) filter.severity = severity;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('actor', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      AuditLog.countDocuments(filter),
    ]);

    return res.json({ success: true, data: { logs, total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

// GET /admin/skill-trends
router.get('/skill-trends', authenticate, ...adminOnly, async (req, res, next) => {
  try {
    const skillDemand = await Job.aggregate([
      { $match: { status: 'active', type: 'job' } },
      { $unwind: '$requiredSkills' },
      { $group: { _id: '$requiredSkills', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    const skillSupply = await Profile.aggregate([
      { $unwind: '$skills' },
      { $group: { _id: '$skills.name', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    return res.json({ success: true, data: { demand: skillDemand, supply: skillSupply } });
  } catch (err) { next(err); }
});

module.exports = router;
