const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { 
  getProfile, 
  updateProfile, 
  deleteProfile, 
  searchUsers, 
  getOtherUserProfile, 
  sendSkillExchangeRequest,
  getAllUsers
} = require('../controllers/userController');

// Protected routes (require authentication)
router.use(authenticateToken);

// User profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.delete('/profile', deleteProfile);

// User search and interaction routes
router.get('/search', searchUsers);
router.get('/all', getAllUsers); // Debug endpoint
router.get('/:userId/profile', getOtherUserProfile);
router.post('/skill-exchange-request', sendSkillExchangeRequest);

module.exports = router; 