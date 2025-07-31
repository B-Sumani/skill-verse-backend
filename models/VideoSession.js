const mongoose = require('mongoose');

const videoSessionSchema = new mongoose.Schema({
  // Session details
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Participants
  initiator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  participant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Session status
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled', 'expired'],
    default: 'pending'
  },
  
  // Time management
  startTime: {
    type: Date,
    default: null
  },
  
  endTime: {
    type: Date,
    default: null
  },
  
  duration: {
    type: Number, // in minutes
    default: 15
  },
  
  maxDuration: {
    type: Number, // in minutes
    default: 15
  },
  
  // Additional participants array for multiple users
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Session data
  topic: {
    type: String,
    default: 'Skill Exchange Session'
  },
  
  description: {
    type: String,
    default: ''
  },
  
  // WebRTC data
  roomToken: {
    type: String,
    default: null
  },
  
  // Session metadata
  skillTaught: {
    type: String,
    default: ''
  },
  
  skillLearned: {
    type: String,
    default: ''
  },
  
  // Ratings and feedback
  initiatorRating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  
  participantRating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  
  initiatorFeedback: {
    type: String,
    default: ''
  },
  
  participantFeedback: {
    type: String,
    default: ''
  },
  
  // Timestamps
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

// Indexes for better query performance
videoSessionSchema.index({ initiator: 1, status: 1 });
videoSessionSchema.index({ participant: 1, status: 1 });
videoSessionSchema.index({ sessionId: 1 });
videoSessionSchema.index({ status: 1, createdAt: -1 });

// Virtual for session duration in minutes
videoSessionSchema.virtual('actualDuration').get(function() {
  if (!this.startTime || !this.endTime) return 0;
  return Math.round((this.endTime - this.startTime) / (1000 * 60));
});

// Virtual for remaining time in seconds
videoSessionSchema.virtual('remainingTime').get(function() {
  if (!this.startTime || this.status !== 'active') return 0;
  const elapsed = (Date.now() - this.startTime.getTime()) / 1000;
  const remaining = (this.maxDuration * 60) - elapsed;
  return Math.max(0, remaining);
});

// Pre-save middleware to update timestamps
videoSessionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to create session ID
videoSessionSchema.statics.generateSessionId = function() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Instance method to start session
videoSessionSchema.methods.startSession = function() {
  this.status = 'active';
  this.startTime = new Date();
  return this.save();
};

// Instance method to end session
videoSessionSchema.methods.endSession = function() {
  this.status = 'completed';
  this.endTime = new Date();
  return this.save();
};

// Instance method to check if session is expired
videoSessionSchema.methods.isExpired = function() {
  if (this.status !== 'active' || !this.startTime) return false;
  const elapsed = (Date.now() - this.startTime.getTime()) / (1000 * 60);
  return elapsed >= this.maxDuration;
};

module.exports = mongoose.model('VideoSession', videoSessionSchema); 