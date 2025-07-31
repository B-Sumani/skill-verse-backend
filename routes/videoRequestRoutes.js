const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  sendVideoRequest,
  getVideoRequests,
  acceptVideoRequest,
  declineVideoRequest,
  scheduleVideoRequest,
  getPendingRequestsCount
} = require('../controllers/videoRequestController');

// Apply authentication to all video request routes
router.use(authenticateToken);

// Video request routes
router.post('/requests', sendVideoRequest);
router.get('/requests', getVideoRequests);
router.get('/requests/pending-count', getPendingRequestsCount);
router.put('/requests/:requestId/accept', acceptVideoRequest);
router.put('/requests/:requestId/decline', declineVideoRequest);
router.put('/requests/:requestId/schedule', scheduleVideoRequest);

module.exports = router; 