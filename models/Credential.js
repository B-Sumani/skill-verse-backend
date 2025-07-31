const mongoose = require('mongoose');

const credentialSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  credentialType: {
    type: String,
    enum: ['certificate', 'badge', 'achievement', 'skill'],
    required: true
  },
  issuer: {
    type: String,
    required: true
  },
  issueDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'revoked'],
    default: 'active'
  },
  algorandAssetId: {
    type: Number,
    required: true
  },
  algorandTransactionId: {
    type: String,
    required: true
  },
  metadata: {
    type: Map,
    of: String,
    default: {}
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
credentialSchema.index({ user: 1, credentialType: 1, status: 1 });
credentialSchema.index({ algorandAssetId: 1 });

module.exports = mongoose.model('Credential', credentialSchema); 