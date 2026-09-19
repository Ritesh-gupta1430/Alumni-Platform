const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Profile = require('../models/Profile');
const Experience = require('../models/Experience');
const Project = require('../models/Project');
const { authenticate, requireActiveAccount } = require('../middleware/auth');
const { upload, imageUpload, uploadFile } = require('../services/storageService');
const { AppError } = require('../middleware/errorHandler');

// GET /profiles/:userId
router.get('/:userId', authenticate, async (req, res, next) => {
  try {
    const targetUser = await User.findById(req.params.userId).select('-passwordHash -emailOTP -resetPasswordToken -totpSecret -refreshTokens');
    if (!targetUser) throw new AppError('User not found.', 404, 'NOT_FOUND');

    const profile = await Profile.findOne({ user: req.params.userId });
    const experiences = await Experience.find({ user: req.params.userId }).sort({ startDate: -1 });
    const projects = await Project.find({ user: req.params.userId, visibility: { $in: ['public', 'tcet_network'] } }).sort({ createdAt: -1 });

    return res.json({ success: true, data: { user: targetUser, profile, experiences, projects } });
  } catch (err) {
    next(err);
  }
});

// PATCH /profiles/me  — update my profile
router.patch('/me', authenticate, async (req, res, next) => {
  try {
    const allowedProfileFields = [
      'headline', 'about', 'currentOrganization', 'currentDesignation',
      'currentCity', 'currentState', 'currentCountry', 'industry',
      'yearsOfExperience', 'skills', 'links', 'achievements', 'academicHistory',
      'semesterResults', 'internships', 'hackathons', 'certifications',
      'careerGoals', 'targetRoles', 'targetIndustries', 'openToOpportunities',
      'workPreference', 'isMentor', 'mentorshipTopics', 'mentorshipAvailability',
      'maxMentees', 'profileVisibility', 'aboutVisibility', 'contactVisibility',
    ];

    const profileUpdates = {};
    for (const field of allowedProfileFields) {
      if (req.body[field] !== undefined) profileUpdates[field] = req.body[field];
    }

    // User table core fields
    const userUpdates = {};
    const allowedUserFields = ['firstName', 'lastName', 'phone', 'department', 'graduationYear', 'admissionYear', 'course', 'rollNumber'];
    for (const uField of allowedUserFields) {
      if (req.body[uField] !== undefined && req.body[uField] !== null && req.body[uField] !== '') {
        userUpdates[uField] = (uField === 'graduationYear' || uField === 'admissionYear')
          ? Number(req.body[uField])
          : req.body[uField];
      }
    }

    // If academicHistory degree is modified, deduplicate by level and sync graduationYear and department
    if (profileUpdates.academicHistory && Array.isArray(profileUpdates.academicHistory)) {
      const seen = new Set();
      const deduped = [];
      for (let i = profileUpdates.academicHistory.length - 1; i >= 0; i--) {
        const a = profileUpdates.academicHistory[i];
        if (a && a.level && !seen.has(a.level)) {
          seen.add(a.level);
          deduped.unshift(a);
        }
      }
      profileUpdates.academicHistory = deduped;

      const degreeRecord = deduped.find((a) => a.level === 'degree' && a.passingYear);
      if (degreeRecord) {
        userUpdates.graduationYear = Number(degreeRecord.passingYear);
        if (degreeRecord.specialization && degreeRecord.specialization.trim()) {
          userUpdates.department = degreeRecord.specialization.trim();
        }
      }
    }

    // Validate Alumni Graduation Year
    const currentYearVal = new Date().getFullYear();
    if (req.user.role === 'ALUMNI' && userUpdates.graduationYear && userUpdates.graduationYear > currentYearVal) {
      throw new AppError(`For Alumni, graduation/passing year cannot exceed the current year (${currentYearVal}).`, 400, 'INVALID_GRADUATION_YEAR');
    }

    let updatedUser = req.user;
    if (Object.keys(userUpdates).length > 0) {
      updatedUser = await User.findByIdAndUpdate(req.user._id, { $set: userUpdates }, { new: true }).select('-passwordHash -emailOTP -resetPasswordToken -totpSecret -refreshTokens');
    }

    const profile = await Profile.findOneAndUpdate(
      { user: req.user._id },
      { $set: profileUpdates },
      { new: true, runValidators: true, upsert: true }
    );

    // Recalculate completion percentage
    await calculateCompletion(req.user._id, profile);

    return res.json({ success: true, message: 'Profile updated.', data: { profile, user: updatedUser } });
  } catch (err) {
    next(err);
  }
});

// POST /profiles/me/photo — upload profile photo
router.post('/me/photo', authenticate, imageUpload.single('photo'), async (req, res, next) => {
  try {
    if (!req.file) throw new AppError('No image provided.', 400, 'NO_FILE');
    const uploaded = await uploadFile(req.file, { folder: 'profiles' });
    await User.findByIdAndUpdate(req.user._id, { profilePhoto: uploaded.url });
    return res.json({ success: true, message: 'Profile photo updated.', data: { url: uploaded.url } });
  } catch (err) {
    next(err);
  }
});

// POST /profiles/me/resume — upload resume
router.post('/me/resume', authenticate, upload.single('resume'), async (req, res, next) => {
  try {
    if (!req.file) throw new AppError('No file provided.', 400, 'NO_FILE');
    const uploaded = await uploadFile(req.file, {
      folder: 'resumes',
      allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    });
    await Profile.findOneAndUpdate(
      { user: req.user._id },
      { resume: { url: uploaded.url, filename: req.file.originalname, uploadedAt: new Date() } },
      { upsert: true }
    );
    return res.json({ success: true, message: 'Resume uploaded.', data: { url: uploaded.url } });
  } catch (err) {
    next(err);
  }
});

// POST /profiles/me/certificate — upload marksheet or certificate document
router.post('/me/certificate', authenticate, upload.single('certificate'), async (req, res, next) => {
  try {
    if (!req.file) throw new AppError('No certificate/marksheet file provided.', 400, 'NO_FILE');
    const uploaded = await uploadFile(req.file, {
      folder: `credentials/${req.user._id}`,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    });
    return res.json({
      success: true,
      message: 'Certificate uploaded successfully.',
      data: { url: uploaded.url, filename: req.file.originalname, mimeType: req.file.mimetype, sizeBytes: req.file.size },
    });
  } catch (err) {
    next(err);
  }
});

// Experience CRUD
router.get('/me/experiences', authenticate, async (req, res, next) => {
  try {
    const exps = await Experience.find({ user: req.user._id }).sort({ startDate: -1 });
    res.json({ success: true, data: exps });
  } catch (err) { next(err); }
});

router.post('/me/experiences', authenticate, async (req, res, next) => {
  try {
    const exp = await Experience.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, data: exp });
  } catch (err) { next(err); }
});

router.put('/me/experiences/:id', authenticate, async (req, res, next) => {
  try {
    const exp = await Experience.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!exp) throw new AppError('Experience not found.', 404);
    res.json({ success: true, data: exp });
  } catch (err) { next(err); }
});

router.delete('/me/experiences/:id', authenticate, async (req, res, next) => {
  try {
    await Experience.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true, message: 'Experience deleted.' });
  } catch (err) { next(err); }
});

// ===== Completion helper =====
async function calculateCompletion(userId, profile) {
  const user = await User.findById(userId);
  if (!user || !profile) return;

  const checks = {
    photo: !!user.profilePhoto,
    headline: !!profile.headline,
    about: !!profile.about,
    currentOrganization: !!profile.currentOrganization,
    currentCity: !!profile.currentCity,
    skills: profile.skills?.length >= 3,
    academicHistory: profile.academicHistory?.length > 0,
    links: profile.links?.length > 0,
    resume: !!profile.resume?.url,
    achievements: profile.achievements?.length > 0,
  };

  const completed = Object.values(checks).filter(Boolean).length;
  const percentage = Math.round((completed / Object.keys(checks).length) * 100);

  await Profile.findOneAndUpdate(
    { user: userId },
    { completionPercentage: percentage, completionDetails: checks }
  );
}

module.exports = router;
