const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, maxlength: 3000 },
    techStack: [{ type: String }],
    githubUrl: { type: String },
    liveUrl: { type: String },
    images: [{ type: String }],
    teamMembers: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: { type: String },
        role: { type: String },
      },
    ],
    startDate: { type: Date },
    endDate: { type: Date },
    isCurrent: { type: Boolean, default: false },
    category: {
      type: String,
      enum: ['web', 'mobile', 'ml', 'data', 'iot', 'blockchain', 'cloud', 'security', 'other'],
      default: 'other',
    },
    status: { type: String, enum: ['in_progress', 'completed', 'abandoned'], default: 'completed' },
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    visibility: {
      type: String,
      enum: ['public', 'tcet_network', 'connections', 'private'],
      default: 'tcet_network',
    },
    featuredOrder: { type: Number }, // admin-set for featured projects
  },
  { timestamps: true }
);

projectSchema.index({ user: 1, createdAt: -1 });
projectSchema.index({ techStack: 1 });
projectSchema.index({ visibility: 1 });

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;
