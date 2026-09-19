const express = require('express');
const router = express.Router();
const CollabProject = require('../models/CollabProject');
const { authenticate, requireActiveAccount } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const notificationService = require('../services/notificationService');

// GET /api/collab-projects
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { category, techStack, status, q, view, page = 1, limit = 12 } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (status) filter.status = status;
    if (techStack) filter.techStack = { $in: [new RegExp(techStack, 'i')] };

    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { tagline: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { techStack: { $regex: q, $options: 'i' } },
      ];
    }

    if (view === 'created') {
      filter.creator = req.user._id;
    } else if (view === 'applied') {
      filter['applicants.user'] = req.user._id;
    }

    const [projects, total] = await Promise.all([
      CollabProject.find(filter)
        .populate('creator', 'firstName lastName profilePhoto role department graduationYear currentCompany currentRole')
        .populate('teamMembers.user', 'firstName lastName profilePhoto role department graduationYear')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      CollabProject.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        projects,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/collab-projects/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const project = await CollabProject.findById(req.params.id)
      .populate('creator', 'firstName lastName profilePhoto role department graduationYear currentCompany currentRole email')
      .populate('teamMembers.user', 'firstName lastName profilePhoto role department graduationYear currentCompany')
      .populate('applicants.user', 'firstName lastName profilePhoto role department graduationYear headline skills resumeUrl');

    if (!project) throw new AppError('Collab project not found.', 404);

    // Increment views count in background
    CollabProject.findByIdAndUpdate(req.params.id, { $inc: { viewsCount: 1 } }).exec();

    return res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
});

// POST /api/collab-projects
router.post('/', authenticate, requireActiveAccount, async (req, res, next) => {
  try {
    const {
      title,
      tagline,
      description,
      category,
      techStack,
      openRoles,
      perks,
      stipendAmount,
      estimatedDuration,
      githubUrl,
      liveUrl,
      communicationChannel,
      milestones,
    } = req.body;

    if (!title || !tagline || !description) {
      throw new AppError('Title, tagline, and description are required.', 400);
    }

    const project = await CollabProject.create({
      creator: req.user._id,
      title,
      tagline,
      description,
      category: category || 'startup_mvp',
      techStack: Array.isArray(techStack) ? techStack : [],
      openRoles: Array.isArray(openRoles) ? openRoles : [],
      perks: Array.isArray(perks) ? perks : [],
      stipendAmount,
      estimatedDuration: estimatedDuration || '4-8 Weeks',
      githubUrl,
      liveUrl,
      communicationChannel,
      milestones: Array.isArray(milestones) ? milestones : [],
    });

    const populatedProject = await CollabProject.findById(project._id).populate(
      'creator',
      'firstName lastName profilePhoto role department graduationYear currentCompany'
    );

    return res.status(201).json({ success: true, data: populatedProject });
  } catch (err) {
    next(err);
  }
});

// PUT /api/collab-projects/:id
router.put('/:id', authenticate, requireActiveAccount, async (req, res, next) => {
  try {
    const project = await CollabProject.findById(req.params.id);
    if (!project) throw new AppError('Project not found.', 404);

    const isOwner = project.creator.toString() === req.user._id.toString();
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      throw new AppError('You are not authorized to edit this project.', 403);
    }

    const updated = await CollabProject.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('creator', 'firstName lastName profilePhoto role department graduationYear currentCompany')
      .populate('teamMembers.user', 'firstName lastName profilePhoto role department graduationYear')
      .populate('applicants.user', 'firstName lastName profilePhoto role department graduationYear headline skills resumeUrl');

    return res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/collab-projects/:id/apply
router.post('/:id/apply', authenticate, requireActiveAccount, async (req, res, next) => {
  try {
    const { roleApplied, pitch, portfolioLink, githubLink, weeklyAvailabilityHours } = req.body;
    if (!roleApplied || !pitch) {
      throw new AppError('Role applied and pitch are required.', 400);
    }

    const project = await CollabProject.findById(req.params.id);
    if (!project) throw new AppError('Collab project not found.', 404);

    if (project.creator.toString() === req.user._id.toString()) {
      throw new AppError('You cannot apply to your own project.', 400);
    }

    if (project.status === 'completed' || project.status === 'paused') {
      throw new AppError('This project is currently not accepting applications.', 400);
    }

    const alreadyApplied = project.applicants.some(
      (a) => a.user.toString() === req.user._id.toString() && a.status !== 'rejected'
    );

    if (alreadyApplied) {
      throw new AppError('You have already applied to this project.', 400);
    }

    project.applicants.push({
      user: req.user._id,
      roleApplied,
      pitch,
      portfolioLink,
      githubLink,
      weeklyAvailabilityHours: weeklyAvailabilityHours || 5,
      status: 'applied',
    });

    await project.save();

    // Send notification to the project creator
    await notificationService.createNotification({
      recipient: project.creator,
      sender: req.user._id,
      type: 'collab_application',
      priority: 'medium',
      title: 'New Project Collab Applicant',
      message: `${req.user.firstName} ${req.user.lastName} applied for the "${roleApplied}" role on "${project.title}".`,
      link: `/collab-hub?project=${project._id}`,
    });

    return res.json({ success: true, message: 'Application submitted successfully!', data: project });
  } catch (err) {
    next(err);
  }
});

// PUT /api/collab-projects/:id/applicants/:applicantId
router.put('/:id/applicants/:applicantId', authenticate, requireActiveAccount, async (req, res, next) => {
  try {
    const { status, reviewNotes } = req.body;
    if (!['accepted', 'rejected', 'under_review'].includes(status)) {
      throw new AppError('Invalid status.', 400);
    }

    const project = await CollabProject.findById(req.params.id);
    if (!project) throw new AppError('Project not found.', 404);

    const isOwner = project.creator.toString() === req.user._id.toString();
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);
    if (!isOwner && !isAdmin) {
      throw new AppError('Unauthorized.', 403);
    }

    const applicant = project.applicants.id(req.params.applicantId);
    if (!applicant) throw new AppError('Applicant record not found.', 404);

    applicant.status = status;
    applicant.reviewedAt = new Date();
    if (reviewNotes) applicant.reviewNotes = reviewNotes;

    // If accepted, add to team members and increment filled spots
    if (status === 'accepted') {
      const isAlreadyTeamMember = project.teamMembers.some(
        (tm) => tm.user.toString() === applicant.user.toString()
      );

      if (!isAlreadyTeamMember) {
        project.teamMembers.push({
          user: applicant.user,
          role: applicant.roleApplied,
          joinedAt: new Date(),
        });

        // Increment spot filled for the specific role
        const roleObj = project.openRoles.find(
          (r) => r.roleTitle.toLowerCase() === applicant.roleApplied.toLowerCase()
        );
        if (roleObj) {
          roleObj.spotsFilled = (roleObj.spotsFilled || 0) + 1;
        }
      }
    }

    await project.save();

    // Send notification to the student applicant
    const notificationTitle = status === 'accepted' ? '🎉 Collab Application Accepted!' : 'Collab Application Update';
    const notificationMsg =
      status === 'accepted'
        ? `Congratulations! You have been accepted into the team for "${project.title}" as ${applicant.roleApplied}.`
        : `Your application status for "${project.title}" has been updated to ${status}.`;

    await notificationService.createNotification({
      recipient: applicant.user,
      sender: req.user._id,
      type: 'collab_status_update',
      priority: status === 'accepted' ? 'high' : 'medium',
      title: notificationTitle,
      message: notificationMsg,
      link: `/collab-hub?project=${project._id}`,
    });

    const updated = await CollabProject.findById(req.params.id)
      .populate('creator', 'firstName lastName profilePhoto role department graduationYear currentCompany')
      .populate('teamMembers.user', 'firstName lastName profilePhoto role department graduationYear')
      .populate('applicants.user', 'firstName lastName profilePhoto role department graduationYear headline skills resumeUrl');

    return res.json({ success: true, message: `Applicant marked as ${status}.`, data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/collab-projects/:id
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const project = await CollabProject.findById(req.params.id);
    if (!project) throw new AppError('Project not found.', 404);

    const isOwner = project.creator.toString() === req.user._id.toString();
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      throw new AppError('Forbidden.', 403);
    }

    await CollabProject.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Collab project deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
