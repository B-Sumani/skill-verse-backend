const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  maxParticipants: {
    type: Number,
    default: 10
  },
  status: {
    type: String,
    enum: ['scheduled', 'active', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  tags: [String],
  location: {
    type: String,
    default: 'online'
  },
  algorandAssetId: {
    type: Number,
    default: null
  },
  // LiveKit video call data
  livekit: {
    roomName: {
      type: String,
      default: null
    },
    roomToken: {
      type: String,
      default: null
    },
    isVideoEnabled: {
      type: Boolean,
      default: true
    },
    callDuration: {
      type: Number,
      default: 15 // minutes
    },
    callStartedAt: {
      type: Date,
      default: null
    },
    callEndedAt: {
      type: Date,
      default: null
    }
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
sessionSchema.index({ creator: 1, status: 1, startTime: 1 });

module.exports = mongoose.model('Session', sessionSchema); 