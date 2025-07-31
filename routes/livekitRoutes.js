const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  generateRoomToken,
  endVideoCall,
  getRoomInfo
} = require('../controllers/livekitController');

// Apply authentication to all LiveKit routes
router.use(authenticateToken);

// LiveKit routes
router.get('/token/:sessionId', generateRoomToken);
router.post('/end-call/:sessionId', endVideoCall);
router.get('/room-info/:sessionId', getRoomInfo);

module.exports = router;