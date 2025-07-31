const express = require('express');
const router = express.Router();

// TODO: Import feedback controller when created
// const { submitFeedback, getFeedback, updateFeedback } = require('../controllers/feedbackController');

// Feedback routes
router.post('/', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Feedback controller not implemented yet'
  });
});

router.get('/', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Feedback controller not implemented yet'
  });
});

router.put('/:id', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Feedback controller not implemented yet'
  });
});

module.exports = router; 