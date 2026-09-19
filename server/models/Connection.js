const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'cancelled', 'removed'],
      default: 'pending',
    },
    message: { type: String, maxlength: 300 }, // optional note with request
    acceptedAt: { type: Date },
    declinedAt: { type: Date },
  },
  { timestamps: true }
);

// Ensure unique pairs (one connection per pair)
connectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });
connectionSchema.index({ recipient: 1, status: 1 });
connectionSchema.index({ requester: 1, status: 1 });

const Connection = mongoose.model('Connection', connectionSchema);
module.exports = Connection;
