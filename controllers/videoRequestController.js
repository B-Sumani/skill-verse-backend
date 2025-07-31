const VideoRequest = require('../models/VideoRequest');
const VideoSession = require('../models/VideoSession');
const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Send video session request
 * @route POST /api/video/requests
 */
const sendVideoRequest = async (req, res) => {
  try {
    const { 
      recipientId, 
      topic, 
      description, 
      skillTaught, 
      skillLearned, 
      preferredTime, 
      priority = 'medium' 
    } = req.body;
    const requesterId = req.user.userId;

    // Validate required fields
    if (!recipientId) {
      return res.status(400).json({
        success: false,
        message: 'Recipient ID is required'
      });
    }

    if (!requesterId) {
      return res.status(400).json({
        success: false,
        message: 'Authentication error: User ID not found in token'
      });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    // Check if requester and recipient are the same
    if (requesterId === recipientId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send request to yourself'
      });
    }

    // Check if there's already a pending request
    const existingRequest = await VideoRequest.findOne({
      requester: requesterId,
      recipient: recipientId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending request with this user'
      });
    }

    // Create video request
    const videoRequest = new VideoRequest({
      requestId: VideoRequest.generateRequestId(),
      requester: requesterId,
      recipient: recipientId,
      topic: topic || 'Skill Exchange Session',
      description: description || '',
      skillTaught: skillTaught || '',
      skillLearned: skillLearned || '',
      preferredTime: preferredTime || null,
      priority: priority
    });

    await videoRequest.save();

    // Populate user details
    await videoRequest.populate('requester', 'username profile.firstName profile.lastName');
    await videoRequest.populate('recipient', 'username profile.firstName profile.lastName');

    // Create notification
    const requester = await User.findById(requesterId);
    const notificationData = {
      requestId: videoRequest.requestId,
      senderName: `${requester.profile?.firstName || requester.username}`,
      topic: videoRequest.topic,
      priority: videoRequest.priority
    };

    await Notification.createVideoRequestNotification(
      recipientId,
      requesterId,
      notificationData
    );

    // If recipient is online, send real-time notification
    if (recipient.isOnline) {
      // TODO: Send WebSocket notification
      console.log(`User ${recipient.username} is online, sending real-time notification`);
    }

    res.status(201).json({
      success: true,
      data: { videoRequest },
      message: 'Video request sent successfully'
    });

  } catch (error) {
    console.error('Send video request error:', error);
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      console.error('Validation Error Details:', error.errors);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      console.error('Duplicate key error:', error.keyPattern);
      return res.status(400).json({
        success: false,
        message: 'Duplicate request detected'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to send video request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get video requests (sent and received)
 * @route GET /api/video/requests
 */
const getVideoRequests = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, type = 'all', page = 1, limit = 10 } = req.query;

    // Build query
    let query = {};
    if (type === 'sent') {
      query.requester = userId;
    } else if (type === 'received') {
      query.recipient = userId;
    } else {
      query.$or = [
        { requester: userId },
        { recipient: userId }
      ];
    }

    if (status) {
      query.status = status;
    }

    // Get requests with pagination
    const requests = await VideoRequest.find(query)
      .populate('requester', 'username profile.firstName profile.lastName')
      .populate('recipient', 'username profile.firstName profile.lastName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Get total count
    const total = await VideoRequest.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        requests,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get video requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get video requests'
    });
  }
};

/**
 * Accept video request
 * @route PUT /api/video/requests/:requestId/accept
 */
const acceptVideoRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { scheduledTime, message } = req.body;
    const userId = req.user.userId;

    const videoRequest = await VideoRequest.findOne({
      requestId,
      recipient: userId,
      status: 'pending'
    });

    if (!videoRequest) {
      return res.status(404).json({
        success: false,
        message: 'Video request not found or cannot be accepted'
      });
    }

    // Mark request as accepted
    await videoRequest.markAsResponded('accepted', message);

    // Create video session
    const videoSession = new VideoSession({
      sessionId: VideoSession.generateSessionId(),
      initiator: videoRequest.requester,
      participant: videoRequest.recipient,
      topic: videoRequest.topic,
      description: videoRequest.description,
      skillTaught: videoRequest.skillTaught,
      skillLearned: videoRequest.skillLearned,
      startTime: scheduledTime || new Date(),
      status: 'active', // Set to active so both users can join immediately
      // Add both users as participants
      participants: [videoRequest.requester, videoRequest.recipient]
    });

    await videoSession.save();

    // Populate session details
    await videoSession.populate('initiator', 'username profile.firstName profile.lastName');
    await videoSession.populate('participant', 'username profile.firstName profile.lastName');

    // Create notification for requester
    const recipient = await User.findById(userId);
    const notificationData = {
      requestId: videoRequest.requestId,
      sessionId: videoSession.sessionId,
      recipientName: `${recipient.profile?.firstName || recipient.username}`,
      topic: videoRequest.topic
    };

    await Notification.create({
      recipient: videoRequest.requester,
      sender: userId,
      type: 'video_request_accepted',
      title: '🎥 Video Call Ready - 15 Minutes',
      message: `${recipient.profile?.firstName || recipient.username} accepted your video session request! Click to join the 15-minute video call.`,
      data: {
        videoRequestId: videoRequest.requestId,
        videoSessionId: videoSession.sessionId,
        url: `/video/session/${videoSession.sessionId}`,
        callDuration: 15,
        callType: 'livekit'
      }
    });

    res.status(200).json({
      success: true,
      data: { 
        videoRequest,
        videoSession 
      },
      message: 'Video request accepted'
    });

  } catch (error) {
    console.error('Accept video request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept video request'
    });
  }
};

/**
 * Decline video request
 * @route PUT /api/video/requests/:requestId/decline
 */
const declineVideoRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { message } = req.body;
    const userId = req.user.userId;

    const videoRequest = await VideoRequest.findOne({
      requestId,
      recipient: userId,
      status: 'pending'
    });

    if (!videoRequest) {
      return res.status(404).json({
        success: false,
        message: 'Video request not found or cannot be declined'
      });
    }

    // Mark request as declined
    await videoRequest.markAsResponded('declined', message);

    // Create notification for requester
    const recipient = await User.findById(userId);
    await Notification.create({
      recipient: videoRequest.requester,
      sender: userId,
      type: 'video_request_declined',
      title: 'Video Request Declined',
      message: `${recipient.profile?.firstName || recipient.username} declined your video session request`,
      data: {
        videoRequestId: videoRequest.requestId,
        url: `/video/requests/${videoRequest.requestId}`
      }
    });

    res.status(200).json({
      success: true,
      data: { videoRequest },
      message: 'Video request declined'
    });

  } catch (error) {
    console.error('Decline video request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to decline video request'
    });
  }
};

/**
 * Schedule video request
 * @route PUT /api/video/requests/:requestId/schedule
 */
const scheduleVideoRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { scheduledTime, message } = req.body;
    const userId = req.user.userId;

    const videoRequest = await VideoRequest.findOne({
      requestId,
      recipient: userId,
      status: 'pending'
    });

    if (!videoRequest) {
      return res.status(404).json({
        success: false,
        message: 'Video request not found or cannot be scheduled'
      });
    }

    if (!scheduledTime) {
      return res.status(400).json({
        success: false,
        message: 'Scheduled time is required'
      });
    }

    // Schedule the request
    await videoRequest.scheduleSession(scheduledTime);

    // Create notification for requester
    const recipient = await User.findById(userId);
    await Notification.create({
      recipient: videoRequest.requester,
      sender: userId,
      type: 'video_request_scheduled',
      title: 'Video Request Scheduled',
      message: `${recipient.profile?.firstName || recipient.username} scheduled your video session for ${new Date(scheduledTime).toLocaleString()}`,
      data: {
        videoRequestId: videoRequest.requestId,
        url: `/video/requests/${videoRequest.requestId}`
      }
    });

    res.status(200).json({
      success: true,
      data: { videoRequest },
      message: 'Video request scheduled'
    });

  } catch (error) {
    console.error('Schedule video request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule video request'
    });
  }
};

/**
 * Get pending requests count
 * @route GET /api/video/requests/pending-count
 */
const getPendingRequestsCount = async (req, res) => {
  try {
    const userId = req.user.userId;

    const count = await VideoRequest.countDocuments({
      recipient: userId,
      status: 'pending'
    });

    res.status(200).json({
      success: true,
      data: { count }
    });

  } catch (error) {
    console.error('Get pending requests count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending requests count'
    });
  }
};

module.exports = {
  sendVideoRequest,
  getVideoRequests,
  acceptVideoRequest,
  declineVideoRequest,
  scheduleVideoRequest,
  getPendingRequestsCount
}; 