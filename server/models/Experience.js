const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['work', 'internship'], default: 'work' },
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    workMode: { type: String, enum: ['remote', 'hybrid', 'onsite'] },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    isCurrent: { type: Boolean, default: false },
    description: { type: String, maxlength: 2000 },
    skills: [{ type: String }],
    stipend: { type: String }, // for internships
    certificateUrl: { type: String }, // for internships
    visibility: {
      type: String,
      enum: ['public', 'tcet_network', 'connections', 'private'],
      default: 'tcet_network',
    },
  },
  { timestamps: true }
);

experienceSchema.index({ user: 1, startDate: -1 });

const Experience = mongoose.model('Experience', experienceSchema);
module.exports = Experience;
