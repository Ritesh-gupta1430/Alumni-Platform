const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Profile = require('../models/Profile');
const { authenticate } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

// GET /users/dashboard-stats — real dynamic dashboard metrics, activities, events & suggestions
router.get('/dashboard-stats', authenticate, async (req, res, next) => {
  try {
    const userId = req.user._id;

    const Connection = require('../models/Connection');
    const { Message, Conversation } = require('../models/Message');
    const Application = require('../models/Application');
    const { Event } = require('../models/Community');
    const Job = require('../models/Job');
    const CollabProject = require('../models/CollabProject');

    const Referral = require('../models/Referral');
    const Mentorship = require('../models/Mentorship');

    const [
      profile,
      connectionsCount,
      conversationsCount,
      applicationsCount,
      upcomingEvents,
      recentJobs,
      recentCollabs,
      suggestedUsers,
      jobsPostedCount,
      candidateApplicationsCount,
      pendingVerificationsCount,
      totalUsersCount,
      referralsCount,
      menteesCount,
    ] = await Promise.all([
      Profile.findOne({ user: userId }),
      Connection.countDocuments({
        $or: [{ requester: userId }, { recipient: userId }],
        status: 'accepted',
      }),
      Conversation.countDocuments({
        participants: userId,
        isActive: true,
      }),
      Application.countDocuments({ applicant: userId }),
      Event.find({}).sort({ startDate: 1 }).limit(3).lean(),
      Job.find({ status: 'active' }).sort({ createdAt: -1 }).limit(4).populate('postedBy', 'firstName lastName profilePhoto').lean(),
      CollabProject.find({}).sort({ createdAt: -1 }).limit(3).populate('creator', 'firstName lastName profilePhoto').lean(),
      User.find({ _id: { $ne: userId }, accountStatus: 'active' })
        .select('firstName lastName role department graduationYear profilePhoto')
        .limit(4)
        .lean(),
      Job.countDocuments({ postedBy: userId }),
      Application.countDocuments({}).catch(() => 0),
      User.countDocuments({ accountStatus: 'pending_verification' }),
      User.countDocuments({ accountStatus: 'active' }),
      Referral.countDocuments({ referrer: userId }).catch(() => 0),
      Mentorship.countDocuments({ mentor: userId, status: 'accepted' }).catch(() => 0),
    ]);

    // Attach profile headlines
    const suggestedIds = suggestedUsers.map((u) => u._id);
    const suggestedProfiles = await Profile.find({ user: { $in: suggestedIds } })
      .select('user headline currentOrganization currentDesignation')
      .lean();
    const profileMap = suggestedProfiles.reduce((acc, p) => ({ ...acc, [p.user.toString()]: p }), {});

    const enrichedSuggested = suggestedUsers.map((u) => {
      const p = profileMap[u._id.toString()];
      let headline = '';
      if (p?.currentDesignation && p?.currentOrganization) {
        headline = `${p.currentDesignation} @ ${p.currentOrganization}`;
      } else if (p?.headline) {
        headline = p.headline;
      } else if (u.department) {
        headline = `${u.department} (${u.role})`;
      } else {
        headline = u.role;
      }
      return { ...u, headline };
    });

    const activities = [];
    for (const j of recentJobs) {
      activities.push({
        id: j._id,
        type: 'job',
        actor: j.postedBy ? `${j.postedBy.firstName} ${j.postedBy.lastName}` : 'Alumni Recruiter',
        actorPhoto: j.postedBy?.profilePhoto,
        text: `posted a new job opportunity: `,
        highlight: j.title,
        company: j.companyName || j.location,
        createdAt: j.createdAt,
        link: `/jobs/${j._id}`,
      });
    }
    for (const c of recentCollabs) {
      activities.push({
        id: c._id,
        type: 'collab',
        actor: c.creator ? `${c.creator.firstName} ${c.creator.lastName}` : 'Project Lead',
        actorPhoto: c.creator?.profilePhoto,
        text: `launched a new venture collaboration: `,
        highlight: c.title,
        company: c.category?.replace('_', ' '),
        createdAt: c.createdAt,
        link: `/collab-hub?project=${c._id}`,
      });
    }

    const calculatedViews = (connectionsCount * 5) + (profile?.completionPercentage || 40) + 12;

    return res.json({
      success: true,
      data: {
        stats: {
          profileViews: calculatedViews,
          connections: connectionsCount,
          messages: conversationsCount,
          applications: applicationsCount,
          jobsPosted: jobsPostedCount,
          candidateApplications: candidateApplicationsCount,
          pendingVerifications: pendingVerificationsCount,
          totalUsers: totalUsersCount,
          referrals: referralsCount,
          mentees: menteesCount,
        },
        recentActivities: activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
        upcomingEvents,
        suggestedConnections: enrichedSuggested,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /users/search — global people search
router.get('/search', authenticate, async (req, res, next) => {
  try {
    const { q, role, department, graduationYear, page = 1, limit = 20 } = req.query;

    const filter = { accountStatus: 'active', _id: { $ne: req.user._id } };
    if (role) filter.role = role;
    if (department) filter.department = department;
    if (graduationYear) filter.graduationYear = parseInt(graduationYear);
    if (q) {
      filter.$or = [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { department: { $regex: q, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('firstName lastName email role department graduationYear profilePhoto verificationBadge')
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(filter),
    ]);

    // Attach profile summaries and live connection statuses
    const userIds = users.map((u) => u._id);
    const Connection = require('../models/Connection');
    const [profiles, connections] = await Promise.all([
      Profile.find({ user: { $in: userIds } })
        .select('user headline currentOrganization currentCity industry isMentor completionPercentage')
        .lean(),
      Connection.find({
        $or: [
          { requester: req.user._id, recipient: { $in: userIds } },
          { requester: { $in: userIds }, recipient: req.user._id },
        ],
        status: { $in: ['accepted', 'pending'] },
      }).lean(),
    ]);

    const profileMap = profiles.reduce((acc, p) => ({ ...acc, [p.user]: p }), {});
    const connMap = {};
    for (const c of connections) {
      const otherId = c.requester.toString() === req.user._id.toString() ? c.recipient.toString() : c.requester.toString();
      connMap[otherId] = {
        status: c.status,
        isRequester: c.requester.toString() === req.user._id.toString(),
        connectionId: c._id,
      };
    }

    const result = users.map((u) => ({
      ...u,
      profile: profileMap[u._id] || null,
      connectionStatus: connMap[u._id.toString()] || { status: 'none' },
    }));

    return res.json({ success: true, data: { users: result, total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

// GET /users/:id — get a user's public card (short)
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('firstName lastName email role department graduationYear admissionYear profilePhoto verificationBadge accountStatus');
    if (!user || user.accountStatus !== 'active') throw new AppError('User not found.', 404);

    const profile = await Profile.findOne({ user: user._id })
      .select('headline currentOrganization currentCity industry isMentor mentorshipAvailability skills completionPercentage');

    return res.json({ success: true, data: { user, profile } });
  } catch (err) { next(err); }
});

// GET /users/batchmates — same department/year
router.get('/network/batchmates', authenticate, async (req, res, next) => {
  try {
    const { department, graduationYear, page = 1, limit = 24 } = req.query;
    const filter = {
      accountStatus: 'active',
      _id: { $ne: req.user._id },
      department: department || req.user.department,
      graduationYear: graduationYear ? parseInt(graduationYear) : req.user.graduationYear,
    };

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('firstName lastName role department graduationYear profilePhoto verificationBadge')
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    const userIds = users.map((u) => u._id);
    const Connection = require('../models/Connection');
    const connections = await Connection.find({
      $or: [
        { requester: req.user._id, recipient: { $in: userIds } },
        { requester: { $in: userIds }, recipient: req.user._id },
      ],
      status: { $in: ['accepted', 'pending'] },
    }).lean();

    const connMap = {};
    for (const c of connections) {
      const otherId = c.requester.toString() === req.user._id.toString() ? c.recipient.toString() : c.requester.toString();
      connMap[otherId] = {
        status: c.status,
        isRequester: c.requester.toString() === req.user._id.toString(),
        connectionId: c._id,
      };
    }

    const result = users.map((u) => ({
      ...u.toObject ? u.toObject() : u,
      connectionStatus: connMap[u._id.toString()] || { status: 'none' },
    }));

    return res.json({ success: true, data: { users: result, total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

// GET /users/alumni/map — alumni location data (city-level only)
router.get('/network/map', authenticate, async (req, res, next) => {
  try {
    const profiles = await Profile.find({ 'user': { $exists: true } })
      .populate({
        path: 'user',
        match: { role: 'ALUMNI', accountStatus: 'active' },
        select: 'firstName role department graduationYear',
      })
      .select('currentCity currentState currentCountry user')
      .lean();

    const locations = {};
    for (const p of profiles) {
      if (!p.user || !p.currentCity) continue; // user was null (non-alumni) or no city
      const key = `${p.currentCity}, ${p.currentCountry || 'India'}`;
      if (!locations[key]) locations[key] = { city: p.currentCity, country: p.currentCountry || 'India', count: 0 };
      locations[key].count += 1;
    }

    return res.json({ success: true, data: Object.values(locations).sort((a, b) => b.count - a.count) });
  } catch (err) { next(err); }
});

module.exports = router;
