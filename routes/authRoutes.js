const express = require('express');
const router = express.Router();
const { signup, signin, logout, refreshToken, getCurrentUser } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Auth routes
router.post('/signup', signup);
router.post('/signin', signin);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
router.get('/me', authenticateToken, getCurrentUser);

module.exports = router; 