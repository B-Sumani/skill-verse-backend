const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationCount
} = require('../controllers/notificationController');

// Apply authentication to all notification routes
router.use(authenticateToken);

// Notification routes
router.get('/', getNotifications);
router.get('/count', getNotificationCount);
router.put('/:notificationId/read', markAsRead);
router.put('/mark-all-read', markAllAsRead);
router.delete('/:notificationId', deleteNotification);

module.exports = router; 