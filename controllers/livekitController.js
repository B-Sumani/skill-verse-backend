const { AccessToken } = require('livekit-server-sdk');
const config = require('../config');
const Session = require('../models/Session');

/**
 * Generate LiveKit room token for a user
 */
const generateRoomToken = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    const userIdentity = req.user.username || `user-${userId}`;

    // Find the session
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if user is a participant or creator
    const isParticipant = session.participants.includes(userId) || 
                         session.creator.toString() === userId;
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to join this session'
      });
    }

    // Generate room name if not exists
    let roomName = session.livekit?.roomName;
    if (!roomName) {
      roomName = `session-${sessionId}-${Date.now()}`;
      
      // Update session with room name
      await Session.findByIdAndUpdate(sessionId, {
        'livekit.roomName': roomName,
        'livekit.callStartedAt': new Date()
      });
    }

    // Create access token
    const token = new AccessToken(
      config.livekit.apiKey,
      config.livekit.apiSecret,
      {
        identity: userIdentity,
        name: req.user.profile?.firstName 
          ? `${req.user.profile.firstName} ${req.user.profile.lastName || ''}`
          : userIdentity,
      }
    );

    // Add room permissions
    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      canUpdateOwnMetadata: true,
    });

    const jwt = token.toJwt();

    // Update session with token (optional - for tracking)
    await Session.findByIdAndUpdate(sessionId, {
      'livekit.roomToken': jwt
    });

    res.status(200).json({
      success: true,
      data: {
        token: jwt,
        roomName: roomName,
        wsUrl: config.livekit.wsUrl,
        callDuration: session.livekit?.callDuration || config.livekit.defaultCallDuration,
        sessionId: sessionId
      }
    });

  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate room token',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * End video call and update session
 */
const endVideoCall = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // Find the session
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if user is authorized to end the call
    const isAuthorized = session.participants.includes(userId) || 
                        session.creator.toString() === userId;
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to end this call'
      });
    }

    // Update session with call end time
    await Session.findByIdAndUpdate(sessionId, {
      'livekit.callEndedAt': new Date(),
      status: 'completed'
    });

    // Get updated session
    const updatedSession = await Session.findById(sessionId)
      .populate('creator', 'username profile')
      .populate('participants', 'username profile');

    // Emit socket event to notify all participants
    const io = req.app.get('io');
    if (io) {
      io.to(`session-${sessionId}`).emit('call-ended', {
        sessionId: sessionId,
        endedBy: userId,
        endedAt: new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Video call ended successfully',
      data: {
        session: updatedSession
      }
    });

  } catch (error) {
    console.error('Error ending video call:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end video call',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get room information for a session
 */
const getRoomInfo = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // Find the session
    const session = await Session.findById(sessionId)
      .populate('creator', 'username profile')
      .populate('participants', 'username profile');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if user is authorized
    const isAuthorized = session.participants.some(p => p._id.toString() === userId) || 
                        session.creator._id.toString() === userId;
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this session'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        sessionId: sessionId,
        roomName: session.livekit?.roomName,
        wsUrl: config.livekit.wsUrl,
        callDuration: session.livekit?.callDuration || config.livekit.defaultCallDuration,
        isVideoEnabled: session.livekit?.isVideoEnabled !== false,
        callStartedAt: session.livekit?.callStartedAt,
        callEndedAt: session.livekit?.callEndedAt,
        status: session.status,
        participants: session.participants,
        creator: session.creator
      }
    });

  } catch (error) {
    console.error('Error getting room info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get room information',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  generateRoomToken,
  endVideoCall,
  getRoomInfo
};