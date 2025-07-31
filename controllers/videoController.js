const VideoSession = require('../models/VideoSession');
const User = require('../models/User');

/**
 * Create a new video session
 * @route POST /api/video/sessions
 */
const createSession = async (req, res) => {
  try {
    const { participantId, topic, description, skillTaught, skillLearned } = req.body;
    const initiatorId = req.user.userId;

    // Validate required fields
    if (!participantId) {
      return res.status(400).json({
        success: false,
        message: 'Participant ID is required'
      });
    }

    // Check if participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found'
      });
    }

    // Check if initiator and participant are the same
    if (initiatorId === participantId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create session with yourself'
      });
    }

    // Check if there's already an active session between these users
    const existingSession = await VideoSession.findOne({
      $or: [
        { initiator: initiatorId, participant: participantId },
        { initiator: participantId, participant: initiatorId }
      ],
      status: { $in: ['pending', 'active'] }
    });

    if (existingSession) {
      return res.status(400).json({
        success: false,
        message: 'Active session already exists with this user'
      });
    }

    // Create new session
    const session = new VideoSession({
      sessionId: VideoSession.generateSessionId(),
      initiator: initiatorId,
      participant: participantId,
      topic: topic || 'Skill Exchange Session',
      description: description || '',
      skillTaught: skillTaught || '',
      skillLearned: skillLearned || '',
      roomToken: `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

    await session.save();

    // Populate user details
    await session.populate('initiator', 'username profile.firstName profile.lastName');
    await session.populate('participant', 'username profile.firstName profile.lastName');

    res.status(201).json({
      success: true,
      data: { session },
      message: 'Video session created successfully'
    });

  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create video session'
    });
  }
};

/**
 * Get user's video sessions
 * @route GET /api/video/sessions
 */
const getSessions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, page = 1, limit = 10 } = req.query;

    // Build query
    const query = {
      $or: [
        { initiator: userId },
        { participant: userId }
      ]
    };

    if (status) {
      query.status = status;
    }

    // Get sessions with pagination
    const sessions = await VideoSession.find(query)
      .populate('initiator', 'username profile.firstName profile.lastName')
      .populate('participant', 'username profile.firstName profile.lastName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Get total count
    const total = await VideoSession.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        sessions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get video sessions'
    });
  }
};

/**
 * Get specific video session
 * @route GET /api/video/sessions/:sessionId
 */
const getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;

    const session = await VideoSession.findOne({
      sessionId,
      $or: [
        { initiator: userId },
        { participant: userId }
      ]
    })
    .populate('initiator', 'username profile.firstName profile.lastName')
    .populate('participant', 'username profile.firstName profile.lastName');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Video session not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { session }
    });

  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get video session'
    });
  }
};

/**
 * Start video session
 * @route PUT /api/video/sessions/:sessionId/start
 */
const startSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;

    const session = await VideoSession.findOne({
      sessionId,
      $or: [
        { initiator: userId },
        { participant: userId }
      ]
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Video session not found'
      });
    }

    if (session.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Session cannot be started'
      });
    }

    // Start the session
    await session.startSession();

    // Populate user details
    await session.populate('initiator', 'username profile.firstName profile.lastName');
    await session.populate('participant', 'username profile.firstName profile.lastName');

    res.status(200).json({
      success: true,
      data: { session },
      message: 'Video session started'
    });

  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start video session'
    });
  }
};

/**
 * End video session
 * @route PUT /api/video/sessions/:sessionId/end
 */
const endSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;

    const session = await VideoSession.findOne({
      sessionId,
      $or: [
        { initiator: userId },
        { participant: userId }
      ]
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Video session not found'
      });
    }

    if (session.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Session is not active'
      });
    }

    // End the session
    await session.endSession();

    // Populate user details
    await session.populate('initiator', 'username profile.firstName profile.lastName');
    await session.populate('participant', 'username profile.firstName profile.lastName');

    res.status(200).json({
      success: true,
      data: { session },
      message: 'Video session ended'
    });

  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end video session'
    });
  }
};

/**
 * Cancel video session
 * @route PUT /api/video/sessions/:sessionId/cancel
 */
const cancelSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;

    const session = await VideoSession.findOne({
      sessionId,
      initiator: userId,
      status: 'pending'
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Video session not found or cannot be cancelled'
      });
    }

    session.status = 'cancelled';
    await session.save();

    res.status(200).json({
      success: true,
      message: 'Video session cancelled'
    });

  } catch (error) {
    console.error('Cancel session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel video session'
    });
  }
};

/**
 * Accept video session invitation
 * @route PUT /api/video/sessions/:sessionId/accept
 */
const acceptSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;

    const session = await VideoSession.findOne({
      sessionId,
      participant: userId,
      status: 'pending'
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Video session invitation not found'
      });
    }

    // Session is already created, just return success
    await session.populate('initiator', 'username profile.firstName profile.lastName');
    await session.populate('participant', 'username profile.firstName profile.lastName');

    res.status(200).json({
      success: true,
      data: { session },
      message: 'Video session accepted'
    });

  } catch (error) {
    console.error('Accept session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept video session'
    });
  }
};

/**
 * Decline video session invitation
 * @route PUT /api/video/sessions/:sessionId/decline
 */
const declineSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;

    const session = await VideoSession.findOne({
      sessionId,
      participant: userId,
      status: 'pending'
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Video session invitation not found'
      });
    }

    session.status = 'cancelled';
    await session.save();

    res.status(200).json({
      success: true,
      message: 'Video session declined'
    });

  } catch (error) {
    console.error('Decline session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to decline video session'
    });
  }
};

/**
 * Submit session feedback
 * @route POST /api/video/sessions/:sessionId/feedback
 */
const submitFeedback = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { rating, feedback } = req.body;
    const userId = req.user.userId;

    const session = await VideoSession.findOne({
      sessionId,
      $or: [
        { initiator: userId },
        { participant: userId }
      ],
      status: 'completed'
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Completed video session not found'
      });
    }

    // Determine if user is initiator or participant
    const isInitiator = session.initiator.toString() === userId;
    
    if (isInitiator) {
      session.initiatorRating = rating;
      session.initiatorFeedback = feedback;
    } else {
      session.participantRating = rating;
      session.participantFeedback = feedback;
    }

    await session.save();

    res.status(200).json({
      success: true,
      message: 'Feedback submitted successfully'
    });

  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback'
    });
  }
};

module.exports = {
  createSession,
  getSessions,
  getSession,
  startSession,
  endSession,
  cancelSession,
  acceptSession,
  declineSession,
  submitFeedback
}; 