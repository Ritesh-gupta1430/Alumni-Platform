const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const { authenticate, requireActiveAccount } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { techStack, category, page = 1, limit = 12, q } = req.query;
    const filter = { visibility: { $in: ['public', 'tcet_network'] } };
    if (techStack) filter.techStack = { $in: [techStack] };
    if (category) filter.category = category;
    if (q) filter.title = { $regex: q, $options: 'i' };

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate('user', 'firstName lastName profilePhoto role department graduationYear')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Project.countDocuments(filter),
    ]);

    return res.json({ success: true, data: { projects, total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

router.post('/', authenticate, requireActiveAccount, async (req, res, next) => {
  try {
    const project = await Project.create({ ...req.body, user: req.user._id });
    return res.status(201).json({ success: true, data: project });
  } catch (err) { next(err); }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!project) throw new AppError('Project not found.', 404);
    return res.json({ success: true, data: project });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await Project.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    return res.json({ success: true, message: 'Project deleted.' });
  } catch (err) { next(err); }
});

module.exports = router;
