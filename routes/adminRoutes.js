const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/adminMiddleware');
const {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
  getAnalytics
} = require('../controllers/adminController');

// Apply authentication and admin role check to all admin routes
router.use(authenticateToken);
router.use(requireRole('admin'));

// Dashboard
router.get('/dashboard', getDashboardStats);

// User management
router.get('/users', getAllUsers);
router.put('/users/:userId/role', updateUserRole);
router.put('/users/:userId/status', toggleUserStatus);
router.delete('/users/:userId', deleteUser);

// Analytics
router.get('/analytics', getAnalytics);

module.exports = router; 