const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { 
  sendMessage, 
  getMessages, 
  getConversations, 
  markAsRead, 
  deleteMessage, 
  checkContent 
} = require('../controllers/messageController');

// Apply authentication to all message routes
router.use(authenticateToken);

// Message routes
router.post('/', sendMessage);
router.get('/', getConversations);
router.get('/check-content', checkContent);
router.get('/:userId', getMessages);
router.put('/:userId/read', markAsRead);
router.delete('/:messageId', deleteMessage);

module.exports = router; 