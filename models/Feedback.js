const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  feedbackType: {
    type: String,
    enum: ['session', 'user', 'system'],
    default: 'session'
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  algorandAssetId: {
    type: Number,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
feedbackSchema.index({ user: 1, session: 1, createdAt: -1 });

module.exports = mongoose.model('Feedback', feedbackSchema); 