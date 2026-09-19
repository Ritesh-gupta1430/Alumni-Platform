const express = require('express');
const router = express.Router();
const { authenticate, requireActiveAccount } = require('../middleware/auth');
const notificationService = require('../services/notificationService');
const { AppError } = require('../middleware/errorHandler');
const { MentorshipRequest, Mentorship, MentorshipSession } = require('../models/Mentorship');
const User = require('../models/User');
const Profile = require('../models/Profile');

// GET /mentorship/mentors — discover mentors
router.get('/mentors', authenticate, async (req, res, next) => {
  try {
    const { skills, department, industry, page = 1, limit = 12 } = req.query;

    const profileFilter = {
      $or: [
        { isMentor: true },
        { mentorshipAvailability: { $in: ['open', 'limited'] } },
      ],
    };

    if (skills) {
      const skillList = skills.split(',').map((s) => s.trim());
      profileFilter['skills.name'] = { $in: skillList };
    }
    if (industry) profileFilter.industry = { $regex: industry, $options: 'i' };

    let [profiles, total] = await Promise.all([
      Profile.find(profileFilter)
        .populate({
          path: 'user',
          match: { accountStatus: 'active', role: { $in: ['ALUMNI', 'FACULTY'] }, ...(department ? { department } : {}) },
          select: 'firstName lastName profilePhoto role department graduationYear verificationBadge',
        })
        .select('headline currentOrganization currentCity industry skills mentorshipTopics mentorshipAvailability maxMentees currentMenteeCount impactScore')
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean(),
      Profile.countDocuments(profileFilter),
    ]);

    let filtered = profiles.filter((p) => p.user !== null && p.user !== undefined);

    if (filtered.length === 0) {
      const alumniUsers = await User.find({
        accountStatus: 'active',
        role: { $in: ['ALUMNI', 'FACULTY'] },
        ...(department ? { department } : {}),
      })
        .select('firstName lastName profilePhoto role department graduationYear verificationBadge')
        .limit(parseInt(limit))
        .lean();

      const alumniIds = alumniUsers.map((u) => u._id);
      const alumniProfiles = await Profile.find({ user: { $in: alumniIds } }).lean();
      const profileMap = alumniProfiles.reduce((acc, p) => ({ ...acc, [p.user.toString()]: p }), {});

      filtered = alumniUsers.map((u) => {
        const p = profileMap[u._id.toString()] || {};
        return {
          _id: p._id || u._id,
          user: u,
          headline: p.headline || `${u.role === 'ALUMNI' ? 'Alumni' : 'Faculty'} @ TCET Mumbai`,
          currentOrganization: p.currentOrganization || (u.role === 'ALUMNI' ? 'Industry Partner' : 'TCET Mumbai'),
          currentCity: p.currentCity || 'Mumbai',
          industry: p.industry || 'Technology & Engineering',
          skills: p.skills?.length ? p.skills : [{ name: 'System Design' }, { name: 'Career Guidance' }],
          mentorshipTopics: p.mentorshipTopics?.length ? p.mentorshipTopics : ['Career Transitions', 'Technical Interviews'],
          mentorshipAvailability: 'open',
          maxMentees: 4,
          currentMenteeCount: 0,
        };
      });
      total = filtered.length;
    }

    return res.json({ success: true, data: { mentors: filtered, total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

// POST /mentorship/request
router.post('/request', authenticate, requireActiveAccount, async (req, res, next) => {
  try {
    const { mentorId, goal, topics, duration, preferredFrequency } = req.body;

    const mentor = await User.findById(mentorId);
    if (!mentor) throw new AppError('Mentor not found.', 404);

    const mentorProfile = await Profile.findOne({ user: mentorId });
    if (!mentorProfile?.isMentor || mentorProfile.mentorshipAvailability === 'closed') {
      throw new AppError('This mentor is not available for mentorship at this time.', 400, 'MENTOR_NOT_AVAILABLE');
    }

    // Check for existing active request
    const existing = await MentorshipRequest.findOne({
      student: req.user._id,
      mentor: mentorId,
      status: { $in: ['pending', 'accepted'] },
    });
    if (existing) throw new AppError('You already have a mentorship request with this mentor.', 409);

    const request = await MentorshipRequest.create({
      student: req.user._id,
      mentor: mentorId,
      goal,
      topics: topics || [],
      duration,
      preferredFrequency,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    });

    await notificationService.notifyMentorshipRequest(mentor, req.user);

    return res.status(201).json({ success: true, message: 'Mentorship request sent.', data: request });
  } catch (err) { next(err); }
});

// GET /mentorship/requests — view requests
router.get('/requests', authenticate, async (req, res, next) => {
  try {
    const { role = 'all' } = req.query;
    let filter = {};

    if (role === 'mentor' || req.user.role === 'ALUMNI' || req.user.role === 'FACULTY') {
      filter = { mentor: req.user._id };
    } else {
      filter = { student: req.user._id };
    }

    const requests = await MentorshipRequest.find(filter)
      .populate('student', 'firstName lastName profilePhoto role department graduationYear verificationBadge')
      .populate('mentor', 'firstName lastName profilePhoto role department graduationYear verificationBadge')
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: requests });
  } catch (err) { next(err); }
});

// PATCH /mentorship/:requestId/accept
router.patch('/:requestId/accept', authenticate, async (req, res, next) => {
  try {
    const request = await MentorshipRequest.findOne({ _id: req.params.requestId, mentor: req.user._id, status: 'pending' });
    if (!request) throw new AppError('Request not found.', 404);

    request.status = 'accepted';
    await request.save();

    // Create active mentorship
    const mentorship = await Mentorship.create({
      request: request._id,
      student: request.student,
      mentor: req.user._id,
      goal: request.goal,
      topics: request.topics,
    });

    // Update mentor's mentee count
    await Profile.findOneAndUpdate(
      { user: req.user._id },
      { $inc: { currentMenteeCount: 1 } }
    );

    const student = await User.findById(request.student);
    await notificationService.notifyMentorshipAccepted(student, req.user);

    return res.json({ success: true, message: 'Mentorship accepted.', data: mentorship });
  } catch (err) { next(err); }
});

// PATCH /mentorship/:requestId/decline
router.patch('/:requestId/decline', authenticate, async (req, res, next) => {
  try {
    const request = await MentorshipRequest.findOne({ _id: req.params.requestId, mentor: req.user._id, status: 'pending' });
    if (!request) throw new AppError('Request not found.', 404);

    request.status = 'declined';
    request.declineReason = req.body.reason;
    await request.save();

    return res.json({ success: true, message: 'Request declined.' });
  } catch (err) { next(err); }
});

// GET /mentorship/active
router.get('/active', authenticate, async (req, res, next) => {
  try {
    const filter = {
      $or: [{ student: req.user._id }, { mentor: req.user._id }],
      status: 'active',
    };
    const mentorships = await Mentorship.find(filter)
      .populate('student', 'firstName lastName profilePhoto role department')
      .populate('mentor', 'firstName lastName profilePhoto role department')
      .sort({ startDate: -1 });

    return res.json({ success: true, data: mentorships });
  } catch (err) { next(err); }
});

// POST /mentorship/:mentorshipId/session
router.post('/:mentorshipId/session', authenticate, async (req, res, next) => {
  try {
    const mentorship = await Mentorship.findOne({
      _id: req.params.mentorshipId,
      $or: [{ student: req.user._id }, { mentor: req.user._id }],
      status: 'active',
    });
    if (!mentorship) throw new AppError('Mentorship not found.', 404);

    const generatedLink = req.body.meetingLink || `https://meet.jit.si/alumnetra-mentorship-${mentorship._id.toString().slice(-6)}-${Date.now().toString().slice(-4)}`;

    const session = await MentorshipSession.create({
      mentorship: mentorship._id,
      meetingLink: generatedLink,
      mode: req.body.mode || 'video',
      ...req.body,
    });

    await Mentorship.findByIdAndUpdate(mentorship._id, { $inc: { sessionCount: 1 } });

    return res.status(201).json({ success: true, data: session });
  } catch (err) { next(err); }
});

module.exports = router;

