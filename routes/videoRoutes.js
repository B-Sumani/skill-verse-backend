const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  createSession,
  getSessions,
  getSession,
  startSession,
  endSession,
  cancelSession,
  acceptSession,
  declineSession,
  submitFeedback
} = require('../controllers/videoController');

// Apply authentication to all video session routes
router.use(authenticateToken);

// Video session routes
router.post('/sessions', createSession);
router.get('/sessions', getSessions);
router.get('/sessions/:sessionId', getSession);
router.post('/sessions/:sessionId/start', startSession);
router.post('/sessions/:sessionId/end', endSession);
router.post('/sessions/:sessionId/cancel', cancelSession);
router.post('/sessions/:sessionId/accept', acceptSession);
router.post('/sessions/:sessionId/decline', declineSession);
router.post('/sessions/:sessionId/feedback', submitFeedback);

module.exports = router; 