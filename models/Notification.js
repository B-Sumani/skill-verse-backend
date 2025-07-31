const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Recipient
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Sender (optional, for system notifications)
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Notification type
  type: {
    type: String,
    enum: [
      'video_request',
      'video_request_accepted',
      'video_request_declined',
      'video_request_scheduled',
      'video_session_starting',
      'video_session_reminder',
      'message_received',
      'skill_exchange_request',
      'system_announcement',
      'profile_view',
      'rating_received'
    ],
    required: true
  },
  
  // Title and content
  title: {
    type: String,
    required: true
  },
  
  message: {
    type: String,
    required: true
  },
  
  // Related data (for deep linking)
  data: {
    videoRequestId: String,
    videoSessionId: String,
    messageId: String,
    userId: String,
    url: String
  },
  
  // Read status
  isRead: {
    type: Boolean,
    default: false
  },
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Delivery status
  deliveryStatus: {
    inApp: {
      type: Boolean,
      default: false
    },
    email: {
      type: Boolean,
      default: false
    },
    push: {
      type: Boolean,
      default: false
    }
  },
  
  // Read timestamp
  readAt: {
    type: Date,
    default: null
  },
  
  // Expiry (for auto-cleanup)
  expiresAt: {
    type: Date,
    default: function() {
      // Expire after 30 days
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);
      return expiry;
    }
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 });

// Virtual for checking if notification is expired
notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && new Date() > this.expiresAt;
});

// Instance method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to create video request notification
notificationSchema.statics.createVideoRequestNotification = function(recipientId, senderId, requestData) {
  return this.create({
    recipient: recipientId,
    sender: senderId,
    type: 'video_request',
    title: 'New Video Session Request',
    message: `${requestData.senderName} wants to start a video session about "${requestData.topic}"`,
    data: {
      videoRequestId: requestData.requestId,
      url: `/video/requests/${requestData.requestId}`
    },
    priority: requestData.priority || 'medium'
  });
};

// Static method to create session starting notification
notificationSchema.statics.createSessionStartingNotification = function(recipientId, sessionData) {
  return this.create({
    recipient: recipientId,
    type: 'video_session_starting',
    title: 'Video Session Starting Soon',
    message: `Your video session "${sessionData.topic}" starts in 5 minutes`,
    data: {
      videoSessionId: sessionData.sessionId,
      url: `/video/session/${sessionData.sessionId}`
    },
    priority: 'high'
  });
};

module.exports = mongoose.model('Notification', notificationSchema); 