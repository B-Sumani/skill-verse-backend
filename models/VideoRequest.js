const mongoose = require('mongoose');

const videoRequestSchema = new mongoose.Schema({
  // Request details
  requestId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Participants
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Request status
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'scheduled', 'expired'],
    default: 'pending'
  },
  
  // Session details
  topic: {
    type: String,
    required: true,
    default: 'Skill Exchange Session'
  },
  
  description: {
    type: String,
    default: ''
  },
  
  skillTaught: {
    type: String,
    default: ''
  },
  
  skillLearned: {
    type: String,
    default: ''
  },
  
  // Scheduling
  preferredTime: {
    type: Date,
    default: null
  },
  
  scheduledTime: {
    type: Date,
    default: null
  },
  
  // Duration
  requestedDuration: {
    type: Number, // in minutes
    default: 10
  },
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Notification tracking
  notificationsSent: {
    email: {
      type: Boolean,
      default: false
    },
    push: {
      type: Boolean,
      default: false
    },
    inApp: {
      type: Boolean,
      default: false
    }
  },
  
  // Response tracking
  respondedAt: {
    type: Date,
    default: null
  },
  
  responseMessage: {
    type: String,
    default: ''
  },
  
  // Auto-expiry
  expiresAt: {
    type: Date,
    default: function() {
      // Expire after 7 days
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 7);
      return expiry;
    }
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
videoRequestSchema.index({ requester: 1, status: 1 });
videoRequestSchema.index({ recipient: 1, status: 1 });
videoRequestSchema.index({ status: 1, createdAt: -1 });
videoRequestSchema.index({ expiresAt: 1 });
videoRequestSchema.index({ scheduledTime: 1 });

// Virtual for checking if request is expired
videoRequestSchema.virtual('isExpired').get(function() {
  return this.expiresAt && new Date() > this.expiresAt;
});

// Virtual for checking if request is urgent (high priority and recent)
videoRequestSchema.virtual('isUrgent').get(function() {
  const isHighPriority = this.priority === 'high' || this.priority === 'urgent';
  const isRecent = new Date() - this.createdAt < 24 * 60 * 60 * 1000; // Within 24 hours
  return isHighPriority && isRecent;
});

// Pre-save middleware to update timestamps
videoRequestSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to generate request ID
videoRequestSchema.statics.generateRequestId = function() {
  return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Instance method to mark as responded
videoRequestSchema.methods.markAsResponded = function(status, message = '') {
  this.status = status;
  this.respondedAt = new Date();
  this.responseMessage = message;
  return this.save();
};

// Instance method to schedule session
videoRequestSchema.methods.scheduleSession = function(scheduledTime) {
  this.status = 'scheduled';
  this.scheduledTime = scheduledTime;
  return this.save();
};

// Instance method to check if user can respond
videoRequestSchema.methods.canRespond = function(userId) {
  return this.recipient.toString() === userId.toString() && this.status === 'pending';
};

module.exports = mongoose.model('VideoRequest', videoRequestSchema); 